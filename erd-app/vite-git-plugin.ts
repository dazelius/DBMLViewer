import type { Plugin } from 'vite'
import { execSync, execFileSync, execFile } from 'child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'fs'
import { join, resolve, extname, sep } from 'path'
import { promisify } from 'util'
import { createRequire } from 'module'
import type { IncomingMessage, ServerResponse } from 'http'
import { request as httpsRequest } from 'https'

// ESM 환경에서 CJS 모듈 로딩용
const _require = createRequire(import.meta.url)

// ── 로컬 이미지 디렉토리 (sync_ui_images.ps1 로 동기화) ──────────────────────
const IMAGES_DIR = 'C:\\TableMaster\\images'

// ── C# 소스코드 디렉토리 (sync_cs_files.ps1 로 동기화) ───────────────────────
const CODE_DIR = 'C:\\TableMaster\\code'
const CODE_INDEX_PATH = join(CODE_DIR, '.code_index.json')

interface CodeIndexEntry {
  path: string        // 상대 경로
  name: string        // 파일명
  size: number
  namespaces: string[]
  classes: string[]
  methods: string[]
}

let _codeIndex: CodeIndexEntry[] | null = null
function loadCodeIndex(): CodeIndexEntry[] {
  if (_codeIndex) return _codeIndex
  if (!existsSync(CODE_INDEX_PATH)) return []
  try {
    _codeIndex = JSON.parse(readFileSync(CODE_INDEX_PATH, 'utf-8')) as CodeIndexEntry[]
    return _codeIndex
  } catch { return [] }
}

function walkCode(dir: string, base: string, results: { name: string; path: string; relPath: string }[]) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      walkCode(full, rel, results)
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.cs') {
      results.push({ name: entry.name, path: full, relPath: rel })
    }
  }
}

// ── 출판 문서 저장 디렉토리 ──────────────────────────────────────────────────
const PUBLISHED_DIR = resolve(process.cwd(), 'published')
const PUBLISHED_INDEX = join(PUBLISHED_DIR, 'index.json')

function ensurePublishedDir() {
  if (!existsSync(PUBLISHED_DIR)) mkdirSync(PUBLISHED_DIR, { recursive: true })
}

interface PublishedMeta {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt?: string
  author?: string
}

function readPublishedIndex(): PublishedMeta[] {
  ensurePublishedDir()
  if (!existsSync(PUBLISHED_INDEX)) return []
  try { return JSON.parse(readFileSync(PUBLISHED_INDEX, 'utf-8')) } catch { return [] }
}

function writePublishedIndex(list: PublishedMeta[]) {
  ensurePublishedDir()
  writeFileSync(PUBLISHED_INDEX, JSON.stringify(list, null, 2), 'utf-8')
}

function walkImages(dir: string, base: string, results: { name: string; path: string; relPath: string }[]) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      walkImages(full, rel, results)
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.png') {
      results.push({ name: entry.name.replace(/\.png$/i, ''), path: full, relPath: rel })
    }
  }
}

const execFileAsync = promisify(execFile)

interface GitPluginOptions {
  repoUrl: string
  localDir: string
  token?: string
  claudeApiKey?: string
  // 두 번째 git 저장소 (aegis)
  repo2Url?: string
  repo2LocalDir?: string
  repo2Token?: string
  // Jira / Confluence
  jiraBaseUrl?: string
  confluenceBaseUrl?: string
  jiraUserEmail?: string
  jiraApiToken?: string
  jiraDefaultProject?: string
  confluenceUserEmail?: string
  confluenceApiToken?: string
}

function buildAuthUrl(repoUrl: string, token?: string): string {
  if (!token) return repoUrl
  // http://host/group/project.git -> http://oauth2:TOKEN@host/group/project.git
  try {
    const url = new URL(repoUrl)
    url.username = 'oauth2'
    url.password = token
    return url.toString()
  } catch {
    return repoUrl
  }
}

function runGit(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 120_000, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch (err: any) {
    throw new Error(err.stderr || err.message || String(err))
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (c: Buffer) => { body += c.toString() })
    req.on('end', () => resolve(body))
  })
}

const fileCache = new Map<string, { commit: string; count: number; files: { name: string; path: string; base64: string }[] }>()

// ── Presence (접속자 수 실시간 추적) ─────────────────────────────────────────
const presenceClients = new Set<ServerResponse>()

function broadcastPresence() {
  const payload = `data: ${presenceClients.size}\n\n`
  for (const client of [...presenceClients]) {
    try { client.write(payload) }
    catch { presenceClients.delete(client) }
  }
}

function createGitMiddleware(options: GitPluginOptions) {
  const { localDir } = options
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {

    // ── /api/claude : Anthropic API 프록시 (dev & preview 공용, 스트리밍 지원) ──
    if (req.url === '/api/claude' && req.method === 'POST') {
      const apiKey = options.claudeApiKey || process.env.CLAUDE_API_KEY || ''
      if (!apiKey) {
        sendJson(res, 400, { error: 'CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.' })
        return
      }
      const rawBody = await readBody(req)
      let isStream = false
      try { isStream = JSON.parse(rawBody || '{}').stream === true } catch {}

      if (isStream) {
        // ── SSE 스트리밍: Node.js native https.request + pipe() (버퍼링 완전 제거) ──
        const proxyReq = httpsRequest({
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(rawBody),
          },
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'X-Accel-Buffering': 'no',
          })
          // Nagle 알고리즘 비활성화 → 각 청크 즉시 전송
          res.socket?.setNoDelay(true)
          res.flushHeaders()

          // 디버그: 청크 도착 타이밍 로그 (서버 콘솔에서 실시간 확인)
          let chunkCount = 0
          let totalBytes = 0
          const startTime = Date.now()
          proxyRes.on('data', (chunk: Buffer) => {
            chunkCount++
            totalBytes += chunk.length
            if (chunkCount <= 5 || chunkCount % 50 === 0) {
              console.log(`[SSE] chunk #${chunkCount}: +${chunk.length}B = ${totalBytes}B (+${Date.now() - startTime}ms)`)
            }
          })
          proxyRes.on('end', () => {
            console.log(`[SSE] 완료: ${chunkCount}개 청크, ${totalBytes}B, ${Date.now() - startTime}ms`)
          })

          // Node.js 네이티브 pipe: 버퍼링 없이 실시간 전달
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          console.error('[Claude SSE proxy] 요청 오류:', err.message)
          if (!res.headersSent) {
            sendJson(res, 502, { error: `Claude API 연결 실패: ${err.message}` })
          } else {
            res.end()
          }
        })

        proxyReq.write(rawBody)
        proxyReq.end()
      } else {
        // ── 비스트리밍: fetch 사용 ──
        try {
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: rawBody,
          })
          const data = await claudeRes.text()
          res.writeHead(claudeRes.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(data)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          sendJson(res, 500, { error: msg })
        }
      }
      return
    }

    // ── /api/presence : SSE 접속자 추적 ────────────────────────────────────
    if (req.url === '/api/presence') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      })
      presenceClients.add(res)
      broadcastPresence()               // 새 접속자 알림
      req.on('close', () => {
        presenceClients.delete(res)
        broadcastPresence()             // 퇴장 알림
      })
      return
    }

    // ── /api/images/list : 이미지 목록 검색 ────────────────────────────────
    if (req.url?.startsWith('/api/images/list')) {
      const url = new URL(req.url, 'http://localhost')
      const q = (url.searchParams.get('q') || '').toLowerCase().trim()
      const all: { name: string; path: string; relPath: string }[] = []
      walkImages(IMAGES_DIR, '', all)

      // Atlas 폴더는 Unity 스프라이트시트라 브라우저에서 아이콘처럼 안 보임 → 후순위로
      const isAtlas = (f: { relPath: string }) => f.relPath.toLowerCase().startsWith('atlas/')
      const matched = q
        ? all.filter(f => f.name.toLowerCase().includes(q) || f.relPath.toLowerCase().includes(q))
        : all

      // Atlas 제외 우선, 그 다음 Atlas 포함
      const nonAtlas = matched.filter(f => !isAtlas(f))
      const atlasOnly = matched.filter(f => isAtlas(f))
      const sorted = [...nonAtlas, ...atlasOnly]

      sendJson(res, 200, {
        total: all.length,
        results: sorted.slice(0, 50).map(f => ({ name: f.name, relPath: f.relPath, isAtlas: isAtlas(f) })),
      })
      return
    }

    // ── /api/images/file : 이미지 파일 서빙 ────────────────────────────────
    if (req.url?.startsWith('/api/images/file')) {
      const url = new URL(req.url, 'http://localhost')
      const relPath = url.searchParams.get('path') || ''
      if (!relPath) { res.writeHead(400); res.end('path required'); return }
      // 경로 traversal 방지
      const safePath = join(IMAGES_DIR, relPath.replace(/\.\./g, ''))
      if (!safePath.startsWith(IMAGES_DIR) || !existsSync(safePath)) {
        // 경로를 찾지 못했을 때 파일명만으로 smart fallback
        const basename = relPath.split('/').pop() ?? ''
        if (basename) {
          const all: { name: string; path: string; relPath: string }[] = []
          walkImages(IMAGES_DIR, '', all)
          const match = all.find(f => f.name.toLowerCase() === basename.toLowerCase().replace(/\.png$/i, ''))
            ?? all.find(f => f.relPath.toLowerCase().endsWith('/' + basename.toLowerCase()))
          if (match) {
            const buf = readFileSync(match.path)
            res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600', 'X-Resolved-Path': match.relPath })
            res.end(buf)
            return
          }
        }
        res.writeHead(404); res.end('not found'); return
      }
      const buf = readFileSync(safePath)
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' })
      res.end(buf)
      return
    }

    // ── /api/images/smart : 파일명으로 스마트 검색 (폴더 몰라도 됨) ──────────────
    if (req.url?.startsWith('/api/images/smart')) {
      const url = new URL(req.url, 'http://localhost')
      const name = (url.searchParams.get('name') || '').toLowerCase().replace(/\.png$/i, '')
      if (!name) { res.writeHead(400); res.end('name required'); return }
      const all: { name: string; path: string; relPath: string }[] = []
      walkImages(IMAGES_DIR, '', all)
      // 정확한 파일명 우선, 부분 일치 후순위
      const match = all.find(f => f.name.toLowerCase() === name)
        ?? all.find(f => f.name.toLowerCase().includes(name))
        ?? all.find(f => name.includes(f.name.toLowerCase()))
      if (!match) { res.writeHead(404); res.end('not found'); return }
      const buf = readFileSync(match.path)
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600', 'X-Resolved-Path': match.relPath })
      res.end(buf)
      return
    }

    // ── /api/code/list : C# 파일 목록·검색 (인덱스 0건 시 content 폴백) ─────────
    if (req.url?.startsWith('/api/code/list')) {
      const url = new URL(req.url, 'http://localhost')
      const q = (url.searchParams.get('q') || '').toLowerCase().trim()
      const type = (url.searchParams.get('type') || '').toLowerCase()
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 100)
      const noFallback = url.searchParams.get('nofallback') === '1'
      const index = loadCodeIndex()

      let results = index
      if (q) {
        results = index.filter(e => {
          if (type === 'class')  return e.classes.some(c => c.toLowerCase().includes(q))
          if (type === 'method') return e.methods.some(m => m.toLowerCase().includes(q))
          if (type === 'file')   return e.name.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
          return e.name.toLowerCase().includes(q)
            || e.path.toLowerCase().includes(q)
            || e.classes.some(c => c.toLowerCase().includes(q))
            || e.namespaces.some(n => n.toLowerCase().includes(q))
            || e.methods.some(m => m.toLowerCase().includes(q))
        })
      }

      // 인덱스 검색 결과가 없고 키워드가 있으면 → 전문 검색(grep) 자동 폴백
      if (q && results.length === 0 && !noFallback) {
        const all: { name: string; path: string; relPath: string }[] = []
        walkCode(CODE_DIR, '', all)
        const contentHits: { path: string; matches: { line: number; lineContent: string }[] }[] = []
        const maxHitFiles = Math.min(limit, 20)
        for (const f of all) {
          if (contentHits.length >= maxHitFiles) break
          try {
            let raw = readFileSync(f.path, 'utf-8')
            if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
            const lines = raw.split('\n')
            const matches: { line: number; lineContent: string }[] = []
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(q)) {
                matches.push({ line: i + 1, lineContent: lines[i].trim().slice(0, 200) })
                if (matches.length >= 5) break
              }
            }
            if (matches.length > 0) contentHits.push({ path: f.relPath, matches })
          } catch { /* skip */ }
        }
        sendJson(res, 200, {
          total: index.length,
          matched: 0,
          results: [],
          fallbackToContent: true,
          contentHits,
        })
        return
      }

      sendJson(res, 200, {
        total: index.length,
        matched: results.length,
        results: results.slice(0, limit).map(e => ({
          path: e.path,
          name: e.name,
          size: e.size,
          namespaces: e.namespaces,
          classes: e.classes,
          methods: e.methods.slice(0, 10),
        })),
      })
      return
    }

    // ── /api/code/file : C# 파일 내용 읽기 (스마트 경로 폴백 포함) ─────────────
    if (req.url?.startsWith('/api/code/file')) {
      const url = new URL(req.url, 'http://localhost')
      const relPath = (url.searchParams.get('path') || '').replace(/\.\./g, '').replace(/\\/g, '/')
      if (!relPath) { res.writeHead(400); res.end('path required'); return }

      // 1) 정확한 경로 시도
      let resolvedPath = join(CODE_DIR, relPath.replace(/\//g, '\\'))
      let resolvedRel = relPath

      if (!resolvedPath.startsWith(CODE_DIR) || !existsSync(resolvedPath)) {
        // 2) 파일명으로 전체 탐색 (경로 앞부분이 다를 때)
        const fileName = relPath.split('/').pop()!.toLowerCase()
        const all: { name: string; path: string; relPath: string }[] = []
        walkCode(CODE_DIR, '', all)

        const match =
          // 정확한 상대경로 끝부분 일치 우선
          all.find(f => f.relPath.toLowerCase().endsWith(relPath.toLowerCase())) ??
          // 파일명만 일치
          all.find(f => f.name.toLowerCase() === fileName) ??
          // 파일명 부분 일치
          all.find(f => f.name.toLowerCase().includes(fileName.replace('.cs', '')))

        if (!match) { res.writeHead(404); res.end(`not found: ${relPath}`); return }
        resolvedPath = match.path
        resolvedRel  = match.relPath
      }

      const stat = statSync(resolvedPath)
      const MAX_SIZE = 100 * 1024
      let raw = readFileSync(resolvedPath, 'utf-8')
      // UTF-8 BOM 제거
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
      let truncated = false
      if (raw.length > MAX_SIZE) { raw = raw.slice(0, MAX_SIZE); truncated = true }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(JSON.stringify({ path: resolvedRel, size: stat.size, truncated, content: raw }))
      return
    }

    // ── /api/code/search : 파일 내용 전문 검색 (grep) ───────────────────────────
    if (req.url?.startsWith('/api/code/search')) {
      const url = new URL(req.url, 'http://localhost')
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const scope = (url.searchParams.get('scope') || '').toLowerCase() // 특정 파일/폴더로 제한
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
      if (!q) { sendJson(res, 400, { error: 'q required' }); return }

      const all: { name: string; path: string; relPath: string }[] = []
      walkCode(CODE_DIR, '', all)

      const filtered = scope
        ? all.filter(f => f.relPath.toLowerCase().includes(scope))
        : all

      const hits: { path: string; line: number; lineContent: string }[] = []
      for (const f of filtered) {
        if (hits.length >= limit * 5) break
        try {
          const lines = readFileSync(f.path, 'utf-8').split('\n')
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(q)) {
              hits.push({ path: f.relPath, line: i + 1, lineContent: lines[i].trim().slice(0, 200) })
              if (hits.length >= limit * 5) break
            }
          }
        } catch { /* skip */ }
      }

      // 파일별로 그룹핑
      const grouped: Record<string, { line: number; lineContent: string }[]> = {}
      for (const h of hits.slice(0, limit * 5)) {
        if (!grouped[h.path]) grouped[h.path] = []
        grouped[h.path].push({ line: h.line, lineContent: h.lineContent })
      }

      sendJson(res, 200, {
        query: q,
        totalFiles: Object.keys(grouped).length,
        results: Object.entries(grouped).slice(0, limit).map(([path, matches]) => ({ path, matches })),
      })
      return
    }

    // ── /api/code/stats : 코드 통계 ─────────────────────────────────────────────
    if (req.url?.startsWith('/api/code/stats')) {
      const index = loadCodeIndex()
      const totalFiles = index.length
      const totalSize = index.reduce((a, e) => a + e.size, 0)
      const namespaceMap: Record<string, number> = {}
      const classCount = index.reduce((a, e) => a + e.classes.length, 0)
      index.forEach(e => e.namespaces.forEach(n => { namespaceMap[n] = (namespaceMap[n] || 0) + 1 }))
      const topNamespaces = Object.entries(namespaceMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([ns, count]) => ({ ns, count }))

      // 폴더별 파일 수
      const folderMap: Record<string, number> = {}
      index.forEach(e => {
        const folder = e.path.split('/').slice(0, -1).join('/')
        folderMap[folder] = (folderMap[folder] || 0) + 1
      })
      const topFolders = Object.entries(folderMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([folder, count]) => ({ folder, count }))

      sendJson(res, 200, { totalFiles, totalSize, classCount, topNamespaces, topFolders })
      return
    }

    // ── /api/guides/generate : 스키마 기반 DB 가이드 생성 (POST) ────────────────
    if (req.method === 'POST' && req.url?.startsWith('/api/guides/generate')) {
      try {
        const body = await readBody(req)
        const payload = JSON.parse(body) as { schema?: any; tableData?: Record<string, any[]> }
        const schema = payload.schema
        if (!schema || !Array.isArray(schema.tables)) {
          sendJson(res, 400, { error: 'schema.tables required' }); return
        }
        const guidesDir = join(CODE_DIR, '_guides')
        if (!existsSync(guidesDir)) mkdirSync(guidesDir, { recursive: true })

        // ── 도메인 키워드 그루핑 ──────────────────────────────────────────────
        const DOMAIN_KEYWORDS: Record<string, string[]> = {
          '_DB_Character': ['character', 'hero', 'player', 'striker', 'hunter', 'char'],
          '_DB_Skill':     ['skill', 'ability', 'passive', 'active', 'buff', 'debuff'],
          '_DB_Weapon':    ['weapon', 'gun', 'rifle', 'pistol', 'shotgun', 'sniper', 'launcher'],
          '_DB_Item':      ['item', 'equip', 'gear', 'armor', 'helmet', 'boot', 'accessory'],
          '_DB_Stage':     ['stage', 'map', 'zone', 'dungeon', 'chapter', 'mission'],
          '_DB_Enemy':     ['enemy', 'monster', 'mob', 'boss', 'npc'],
          '_DB_Quest':     ['quest', 'mission', 'challenge', 'achievement'],
          '_DB_Shop':      ['shop', 'store', 'purchase', 'sell', 'price', 'cost', 'reward'],
          '_DB_User':      ['user', 'account', 'profile', 'social', 'friend', 'guild'],
        }

        // 테이블을 도메인별로 그룹화
        const domainMap: Record<string, any[]> = { '_DB_Misc': [] }
        for (const key of Object.keys(DOMAIN_KEYWORDS)) domainMap[key] = []
        const assigned = new Set<string>()
        for (const tbl of schema.tables as any[]) {
          const tn = tbl.name.toLowerCase()
          let found = false
          for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
            if (keywords.some((k: string) => tn.includes(k))) {
              domainMap[domain].push(tbl)
              assigned.add(tbl.name)
              found = true
              break
            }
          }
          if (!found) domainMap['_DB_Misc'].push(tbl)
        }

        // FK 맵 생성
        const fkLines: string[] = []
        for (const ref of (schema.refs ?? []) as any[]) {
          const from = ref.endpoints?.[0]
          const to   = ref.endpoints?.[1]
          if (from && to) fkLines.push(`${from.tableName}.${from.fieldNames?.[0]} → ${to.tableName}.${to.fieldNames?.[0]}`)
        }

        // ── DB 개요 가이드 생성 ──────────────────────────────────────────────
        const totalCols = (schema.tables as any[]).reduce((s: number, t: any) => s + (t.columns?.length ?? 0), 0)
        let overview = `# DB 스키마 개요\n\n`
        overview += `- 테이블: ${schema.tables.length}개 | 컬럼: ${totalCols}개 | 관계(FK): ${schema.refs?.length ?? 0}개 | Enum: ${schema.enums?.length ?? 0}개\n\n`
        overview += `## 도메인별 테이블\n`
        for (const [domain, tables] of Object.entries(domainMap) as [string, any[]][]) {
          if (!tables.length) continue
          const label = domain.replace('_DB_', '')
          overview += `\n### ${label}\n`
          overview += tables.map((t: any) => {
            const pk = t.columns?.find((c: any) => c.pk)?.name ?? ''
            const noteStr = t.note ? ` — ${t.note}` : ''
            return `- **${t.name}**${noteStr} (컬럼 ${t.columns?.length ?? 0}개${pk ? ', PK: ' + pk : ''})`
          }).join('\n')
          overview += '\n'
        }
        if (schema.enums?.length) {
          overview += `\n## Enum 목록\n`
          overview += (schema.enums as any[]).map((e: any) => {
            const vals = (e.values ?? []).map((v: any) => v.name).slice(0, 10).join(', ')
            return `- **${e.name}**: ${vals}${(e.values?.length ?? 0) > 10 ? '...' : ''}`
          }).join('\n')
          overview += '\n'
        }
        if (fkLines.length) {
          overview += `\n## 주요 FK 관계\n`
          overview += fkLines.slice(0, 60).map((l: string) => `- ${l}`).join('\n')
          if (fkLines.length > 60) overview += `\n- ... 외 ${fkLines.length - 60}개`
          overview += '\n'
        }
        writeFileSync(join(guidesDir, '_DB_OVERVIEW.md'), overview, 'utf-8')

        // ── 도메인별 가이드 생성 ──────────────────────────────────────────────
        const generated: string[] = ['_DB_OVERVIEW']
        for (const [domain, tables] of Object.entries(domainMap) as [string, any[]][]) {
          if (!tables.length) continue
          let md = `# ${domain.replace('_DB_', '')} 관련 테이블\n\n`
          for (const t of tables) {
            md += `## ${t.name}${t.note ? ` — ${t.note}` : ''}\n`
            if (t.columns?.length) {
              md += `| 컬럼 | 타입 | 속성 | 설명 |\n|---|---|---|---|\n`
              md += t.columns.map((c: any) => {
                const attrs = [c.pk && 'PK', c.unique && 'UQ', c.not_null && 'NN'].filter(Boolean).join(' ')
                return `| ${c.name} | ${c.type?.type_name ?? ''} | ${attrs} | ${c.note ?? ''} |`
              }).join('\n')
              md += '\n\n'
            }
            // 이 테이블과 관련된 FK
            const myFks = fkLines.filter(l => l.startsWith(t.name + '.') || l.includes('→ ' + t.name + '.'))
            if (myFks.length) {
              md += `**FK 관계:**\n` + myFks.map((l: string) => `- ${l}`).join('\n') + '\n\n'
            }
          }
          writeFileSync(join(guidesDir, `${domain}.md`), md, 'utf-8')
          generated.push(domain)
        }

        // Enum 전용 가이드
        if (schema.enums?.length) {
          let enumMd = `# Enum 전체 목록\n\n`
          for (const e of schema.enums as any[]) {
            enumMd += `## ${e.name}\n`
            enumMd += (e.values ?? []).map((v: any) => `- \`${v.name}\`${v.note ? ': ' + v.note : ''}`).join('\n')
            enumMd += '\n\n'
          }
          writeFileSync(join(guidesDir, '_DB_Enums.md'), enumMd, 'utf-8')
          generated.push('_DB_Enums')
        }

        sendJson(res, 200, { ok: true, generated })
      } catch (e: any) {
        sendJson(res, 500, { error: e.message })
      }
      return
    }

    // ── /api/guides/list : 전체 가이드 목록 (코드 + DB) ──────────────────────
    if (req.url?.startsWith('/api/guides/list')) {
      const guidesDir = join(CODE_DIR, '_guides')
      if (!existsSync(guidesDir)) { sendJson(res, 200, { guides: [] }); return }
      const files = readdirSync(guidesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const stat = statSync(join(guidesDir, f))
          const isDb   = f.startsWith('_DB_')
          return { name: f.replace('.md', ''), sizeKB: Math.round(stat.size / 1024 * 10) / 10, category: isDb ? 'db' : 'code' }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
      sendJson(res, 200, { guides: files })
      return
    }

    // ── /api/guides/read : 가이드 내용 (코드 + DB 통합) ──────────────────────
    if (req.url?.startsWith('/api/guides/read')) {
      const url = new URL(req.url, 'http://localhost')
      const name = (url.searchParams.get('name') || '_DB_OVERVIEW').replace(/[^a-zA-Z0-9_\-]/g, '')
      const guidesDir = join(CODE_DIR, '_guides')
      const guidePath = join(guidesDir, `${name}.md`)
      if (!existsSync(guidePath)) {
        const available = existsSync(guidesDir)
          ? readdirSync(guidesDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
          : []
        sendJson(res, 404, { error: `Guide '${name}' not found`, available }); return
      }
      const MAX = 200 * 1024
      let content = readFileSync(guidePath, 'utf-8')
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
      const truncated = content.length > MAX
      if (truncated) content = content.slice(0, MAX) + '\n...(truncated)'
      sendJson(res, 200, { name, content, sizeKB: Math.round(content.length / 1024 * 10) / 10, truncated })
      return
    }

    // ── /api/code/guides : 가이드 파일 목록 ────────────────────────────────────
    if (req.url?.startsWith('/api/code/guides')) {
      const guidesDir = join(CODE_DIR, '_guides')
      if (!existsSync(guidesDir)) {
        sendJson(res, 200, { guides: [], message: 'No guides found. Run generate_code_guides.ps1 first.' })
        return
      }
      const files = readdirSync(guidesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const stat = statSync(join(guidesDir, f))
          return { name: f.replace('.md', ''), sizeKB: Math.round(stat.size / 1024 * 10) / 10 }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
      sendJson(res, 200, { guides: files })
      return
    }

    // ── /api/code/guide : 가이드 파일 내용 ──────────────────────────────────────
    if (req.url?.startsWith('/api/code/guide')) {
      const url = new URL(req.url, 'http://localhost')
      const name = (url.searchParams.get('name') || '_OVERVIEW').replace(/[^a-zA-Z0-9_\-]/g, '')
      const guidesDir = join(CODE_DIR, '_guides')
      const guidePath = join(guidesDir, `${name}.md`)

      if (!existsSync(guidePath)) {
        // 유사한 이름 찾기
        const available = existsSync(guidesDir)
          ? readdirSync(guidesDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
          : []
        sendJson(res, 404, {
          error: `Guide '${name}' not found`,
          available,
          hint: 'Run generate_code_guides.ps1 to generate guides',
        })
        return
      }

      const MAX_GUIDE_SIZE = 200 * 1024 // 200KB
      let content = readFileSync(guidePath, 'utf-8')
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1) // BOM 제거
      let truncated = false
      if (content.length > MAX_GUIDE_SIZE) {
        content = content.slice(0, MAX_GUIDE_SIZE)
        truncated = true
      }

      sendJson(res, 200, { name, content, sizeKB: Math.round(content.length / 1024 * 10) / 10, truncated })
      return
    }

    // ── /api/assets/* : 에셋 엔드포인트 (try-catch로 서버 크래시 방지) ────────────
    if (req.url?.startsWith('/api/assets/')) {
      // 공통 헬퍼 - assets/ 폴더 없으면 unity_project 직접 사용
      const ASSETS_DIR       = join(process.cwd(), '..', '..', 'assets')
      const UNITY_ASSETS_DIR = join(process.cwd(), '..', '..', 'unity_project', 'Client', 'Project_Aegis', 'Assets')
      const idxPath          = join(ASSETS_DIR, '.asset_index.json')

      type AssetEntry = { path: string; name: string; ext: string; sizeKB: number }

      /** 인덱스 로드 (없으면 빈 배열) - BOM 자동 제거 */
      const loadIdx = (): AssetEntry[] => {
        try {
          if (!existsSync(idxPath)) return []
          let raw = readFileSync(idxPath, 'utf-8')
          if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1) // strip UTF-8 BOM
          return JSON.parse(raw) as AssetEntry[]
        } catch (e) {
          console.error('[loadIdx] parse error:', e)
          return []
        }
      }

      /** relPath 기준으로 실제 파일 경로 해석 (assets/ 없으면 unity_project/ fallback) */
      const resolveAssetFile = (relPath: string): string | null => {
        const norm = relPath.replace(/\//g, sep)
        const p1 = join(ASSETS_DIR, norm)
        if (existsSync(p1)) return p1
        const p2 = join(UNITY_ASSETS_DIR, norm)
        if (existsSync(p2)) return p2
        return null
      }

      /** 파일명(확장자 포함/미포함)으로 인덱스에서 검색
       *  Unity 텍스처 네이밍 컨벤션 지원:
       *  FBX 내부에서 "SafetyZone_Ems.png" 로 참조되지만
       *  실제 파일은 "T_SafetyZone_Ems.png" 처럼 프리픽스가 붙어 있는 경우 fuzzy 처리
       */
      const findInIdx = (filename: string): AssetEntry | undefined => {
        const idx = loadIdx()
        const lc  = filename.toLowerCase()
        // 1) 정확한 파일명 매칭
        const exact = idx.find(a =>
          `${a.name}.${a.ext}`.toLowerCase() === lc ||
          a.name.toLowerCase() === lc ||
          a.path.toLowerCase().endsWith('/' + lc) ||
          a.path.toLowerCase().endsWith('\\' + lc)
        )
        if (exact) return exact

        // 2) Unity 텍스처 프리픽스 추가 매칭 (T_, TX_, Tex_, t_ 등)
        //    FBX는 "BaseName.png" 로 저장, Unity 는 "T_BaseName.png" 로 임포트
        const texPrefixes = ['t_', 'tx_', 'tex_', 't ', 'texture_']
        const prefixed = idx.find(a => {
          const fullLc = `${a.name}.${a.ext}`.toLowerCase()
          return texPrefixes.some(pfx => fullLc === pfx + lc || fullLc === pfx.replace('_','') + lc)
        })
        if (prefixed) return prefixed

        // 3) 확장자를 제외한 base name 이 포함되는 경우 (예: "SafetyZone_Ems" → "T_SafetyZone_Ems.png")
        const dotIdx = lc.lastIndexOf('.')
        const baseLc = dotIdx >= 0 ? lc.slice(0, dotIdx) : lc
        const extLc  = dotIdx >= 0 ? lc.slice(dotIdx + 1) : ''
        if (baseLc.length > 3) {
          return idx.find(a =>
            a.ext.toLowerCase() === extLc &&
            (a.name.toLowerCase() === baseLc ||
             a.name.toLowerCase().endsWith('_' + baseLc) ||
             a.name.toLowerCase() === `t_${baseLc}` ||
             a.name.toLowerCase() === `tx_${baseLc}`)
          )
        }
        return undefined
      }

      const mimeMap: Record<string, string> = {
        fbx: 'application/octet-stream', obj: 'application/octet-stream',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', tga: 'image/x-tga',
        gif: 'image/gif', bmp: 'image/bmp', tiff: 'image/tiff', dds: 'image/vnd.ms-dds',
        wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg', mp4: 'video/mp4',
        anim: 'application/octet-stream', mat: 'application/octet-stream',
        prefab: 'application/octet-stream', asset: 'application/octet-stream',
        txt: 'text/plain', json: 'application/json', xml: 'application/xml',
        cs: 'text/plain',
      }

      try {
        // ── /api/assets/index : 에셋 인덱스 검색 ─────────────────────────────
        if (req.url.startsWith('/api/assets/index')) {
          const idx = loadIdx()
          if (idx.length === 0) {
            sendJson(res, 200, { results: [], total: 0, message: 'No asset index. Run sync_assets.ps1 first.' })
            return
          }
          const url2     = new URL(req.url, 'http://localhost')
          const extFilt  = (url2.searchParams.get('ext') || '').toLowerCase().replace(/^\./, '')
          const q        = (url2.searchParams.get('q')   || '').toLowerCase()
          let filtered   = idx
          if (extFilt) filtered = filtered.filter(a => a.ext.toLowerCase() === extFilt)
          if (q)       filtered = filtered.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.path.toLowerCase().includes(q)
          )
          sendJson(res, 200, { results: filtered.slice(0, 200), total: filtered.length })
          return
        }

        // ── /api/assets/file : 에셋 파일 직접 서빙 ───────────────────────────
        if (req.url.startsWith('/api/assets/file')) {
          const url2      = new URL(req.url, 'http://localhost')
          const pathParam = url2.searchParams.get('path') || ''
          if (!pathParam) { res.writeHead(400); res.end('path required'); return }

          // 1) assets/ 또는 unity_project/ 에서 경로 직접 해석
          let filePath = resolveAssetFile(pathParam)

          // 2) 없으면 인덱스에서 파일명으로 검색 후 재시도
          if (!filePath) {
            const baseName = pathParam.split('/').pop() ?? ''
            const found    = findInIdx(baseName)
            if (found) filePath = resolveAssetFile(found.path)
          }

          if (!filePath) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end(`Asset not found: ${pathParam}\nbuild_asset_index.ps1 을 실행하여 인덱스를 생성하세요.`)
            return
          }

          const fileExt  = filePath.split('.').pop()?.toLowerCase() ?? ''
          const mime     = mimeMap[fileExt] ?? 'application/octet-stream'
          const fileStat = statSync(filePath)
          res.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': fileStat.size,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          })
          const rs = (await import('fs')).createReadStream(filePath)
          rs.on('error', (e) => { try { res.destroy(e) } catch { /* ignore */ } })
          rs.pipe(res)
          return
        }

        // ── /api/assets/smart : 파일명으로 에셋 검색 후 서빙 ─────────────────
        if (req.url.startsWith('/api/assets/smart')) {
          const url2 = new URL(req.url, 'http://localhost')
          const name = url2.searchParams.get('name') || ''
          if (!name) { res.writeHead(400); res.end('name required'); return }

          const found = findInIdx(name)
          if (!found) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end(`Asset '${name}' not found in index. Run build_asset_index.ps1 first.`)
            return
          }

          const filePath = resolveAssetFile(found.path)
          if (!filePath) {
            res.writeHead(404); res.end('File missing on disk: ' + found.path); return
          }

          const mime2 = mimeMap[found.ext.toLowerCase()] ?? 'application/octet-stream'
          const fileStat  = statSync(filePath)
          res.writeHead(200, {
            'Content-Type': mime2,
            'Content-Length': fileStat.size,
            'Access-Control-Allow-Origin': '*',
            'X-Resolved-Path': found.path,
            'Cache-Control': 'public, max-age=86400',
          })
          const rs = (await import('fs')).createReadStream(filePath)
          rs.on('error', (e) => { try { res.destroy(e) } catch { /* ignore */ } })
          rs.pipe(res)
          return
        }

        // ── /api/assets/materials : FBX 경로 → 머터리얼/텍스처 맵 ─────────────
        if (req.url.startsWith('/api/assets/materials')) {
          const url2        = new URL(req.url, 'http://localhost')
          const fbxPathParam = url2.searchParams.get('fbxPath') || ''
          const matIdxPath  = join(ASSETS_DIR, '.material_index.json')

          if (!existsSync(matIdxPath)) {
            sendJson(res, 404, { error: 'Material index not found. Run build_material_index.ps1 first.' })
            return
          }

          type MatEntry = { name: string; albedoPath: string; normalPath: string; emissionPath: string }
          type MatIndex = { generatedAt: string; fbxMaterials: Record<string, MatEntry[]> }
          const rawMat = readFileSync(matIdxPath, 'utf-8')
          const matIdx = JSON.parse(rawMat.startsWith('\uFEFF') ? rawMat.substring(1) : rawMat) as MatIndex

          // fbxPath 정규화 (앞쪽 Assets/ 제거, 슬래시 통일)
          const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^assets\//i, '')
          const fbxNorm = norm(fbxPathParam)

          // 직접 매칭 또는 파일명으로 부분 매칭
          let entries: MatEntry[] = []
          const directKey = Object.keys(matIdx.fbxMaterials).find(k => {
            const kn = norm(k)
            return kn === fbxNorm || kn.endsWith('/' + fbxNorm) || kn.endsWith(fbxNorm)
          })
          if (directKey) {
            entries = matIdx.fbxMaterials[directKey] as MatEntry[]
          }

          // 텍스처 경로를 API URL로 변환
          const toApiUrl = (relPath: string) =>
            relPath ? `/api/assets/file?path=${encodeURIComponent(relPath)}` : ''

          const result = entries
            .filter(e => e.albedoPath || e.normalPath)
            .map(e => ({
              name:    e.name,
              albedo:  toApiUrl(e.albedoPath),
              normal:  toApiUrl(e.normalPath),
              emission: toApiUrl(e.emissionPath),
            }))

          sendJson(res, 200, { fbxPath: fbxPathParam, materials: result, matchedKey: directKey ?? null })
          return
        }

      } catch (assetErr) {
        console.error('[assets endpoint error]', assetErr)
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: String(assetErr) }))
        }
        return
      }
    }

    // ── /api/assets/scene & /api/assets/prefab : Unity .unity/.prefab 파일 파싱 ──
    // .prefab 파일도 .unity 씬과 동일한 YAML 포맷을 사용하므로 파서 재사용
    // 주의: /api/assets/scene-yaml 보다 먼저 매칭되지 않도록 정확하게 체크
    if ((req.url?.startsWith('/api/assets/scene') && !req.url?.startsWith('/api/assets/scene-yaml')) || req.url?.startsWith('/api/assets/prefab')) {
      try {
        const SCENE_ASSETS_DIR  = join(process.cwd(), '..', '..', 'assets')
        const url2     = new URL(req.url, 'http://localhost')
        const scenePath = url2.searchParams.get('path') || ''
        const isPrefab = req.url?.startsWith('/api/assets/prefab') ?? false
        const maxObjects = parseInt(url2.searchParams.get('max') || (isPrefab ? '200' : '60'), 10)

        if (!scenePath) { sendJson(res, 400, { error: 'path parameter required' }); return }

        // ── GUID 인덱스 로드 ──────────────────────────────────────────────────
        const guidIdxPath = join(SCENE_ASSETS_DIR, '.guid_index.json')
        if (!existsSync(guidIdxPath)) {
          sendJson(res, 404, { error: 'GUID index not found. Run build_guid_index.ps1 first.' })
          return
        }
        let guidRaw = readFileSync(guidIdxPath, 'utf-8')
        if (guidRaw.charCodeAt(0) === 0xFEFF) guidRaw = guidRaw.slice(1)
        const guidToRelPath: Record<string, string> = JSON.parse(guidRaw)

        // GUID → 절대경로 변환 헬퍼
        const UNITY_BASE2 = join(SCENE_ASSETS_DIR, '..', 'unity_project', 'Client', 'Project_Aegis', 'Assets')
        const guidToAbs = (guid: string): string | null => {
          const rel = guidToRelPath[guid]
          if (!rel) return null
          return join(UNITY_BASE2, rel)
        }

        // ── 씬 파일 읽기 ───────────────────────────────────────────────────────
        // 먼저 assets 폴더에서 찾고 없으면 unity_project 에서 찾기
        let sceneAbsPath = join(SCENE_ASSETS_DIR, scenePath)
        if (!existsSync(sceneAbsPath)) {
          sceneAbsPath = join(UNITY_BASE2, scenePath)
        }
        if (!existsSync(sceneAbsPath)) {
          sendJson(res, 404, { error: `Scene not found: ${scenePath}` })
          return
        }

        const sceneContent = readFileSync(sceneAbsPath, 'utf-8')

        // ── YAML 파싱 헬퍼 ─────────────────────────────────────────────────────

        // ── 공통 헬퍼 ─────────────────────────────────────────────────────────
        type V3 = { x: number; y: number; z: number }
        type Q4 = { x: number; y: number; z: number; w: number }

        // float 값 파싱 (Unity YAML은 음수 포함)
        const parseVal = (s: string): number => {
          const n = parseFloat(s)
          return isNaN(n) ? 0 : n
        }

        // ── Quaternion / Vector3 연산 (월드 좌표 계산용) ────────────────────
        const quatMul = (a: Q4, b: Q4): Q4 => ({
          x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
          y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
          z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
          w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        })
        const quatRotateVec = (q: Q4, v: V3): V3 => {
          // v' = q * (0,v) * q^-1
          const ix =  q.w * v.x + q.y * v.z - q.z * v.y
          const iy =  q.w * v.y + q.z * v.x - q.x * v.z
          const iz =  q.w * v.z + q.x * v.y - q.y * v.x
          const iw = -q.x * v.x - q.y * v.y - q.z * v.z
          return {
            x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
            y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
            z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
          }
        }
        const vecAdd = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
        const vecMulComp = (a: V3, b: V3): V3 => ({ x: a.x * b.x, y: a.y * b.y, z: a.z * b.z })

        // ── 전체 Transform 트리 빌드 ──────────────────────────────────────────
        interface TfNode {
          fileId: string
          pos: V3; rot: Q4; scale: V3
          fatherId: string   // m_Father fileID (0 = 루트)
          goId: string       // m_GameObject fileID
          stripped: boolean
          prefabInstanceId?: string  // stripped인 경우 소속 PrefabInstance ID
          correspondingSourceId?: string  // stripped Transform의 원본 prefab 내 fileID
          // 캐시: 월드 좌표
          _worldPos?: V3; _worldRot?: Q4; _worldScale?: V3
        }

        const tfMap: Record<string, TfNode> = {}
        const gameObjects: Record<string, string> = {}  // fileID → m_Name
        const meshFilters: Record<string, { meshGuid: string; goId: string }> = {}
        // ── 컴포넌트 타입 추적 (GO별 컴포넌트 목록) ──
        const goComponents: Record<string, string[]> = {}  // goId → component type list
        const addComponent = (goId: string, type: string) => {
          if (!goComponents[goId]) goComponents[goId] = []
          if (!goComponents[goId].includes(type)) goComponents[goId].push(type)
        }

        // Unity 클래스 ID → 읽기 쉬운 이름
        const UNITY_CLASS_NAMES: Record<string, string> = {
          '23': 'MeshRenderer', '33': 'MeshFilter', '65': 'BoxCollider',
          '95': 'Animator', '108': 'Light', '114': 'MonoBehaviour',
          '135': 'SphereCollider', '136': 'CapsuleCollider', '137': 'SkinnedMeshRenderer',
          '198': 'ParticleSystem', '199': 'ParticleSystemRenderer',
          '54': 'Rigidbody', '64': 'MeshCollider', '82': 'AudioSource',
          '120': 'LineRenderer', '212': 'SpriteRenderer', '225': 'CanvasGroup',
          '224': 'RectTransform', '222': 'Canvas', '223': 'CanvasRenderer',
        }

        const sections = sceneContent.split(/\n---/)
        for (const section of sections) {
          // ─── GameObject (!u!1) ─────────────────────────────────────
          if (section.includes('!u!1 &') && !section.includes('!u!1001')) {
            const idM = section.match(/!u!1 &(\d+)/)
            const nameM = section.match(/m_Name:\s*(.+)/)
            if (idM && nameM) gameObjects[idM[1]] = nameM[1].trim()
          }
          // ─── Transform (!u!4) — 일반 + stripped ────────────────────
          else if (section.includes('!u!4 &')) {
            const isStripped = section.includes('stripped')
            const idM = section.match(/!u!4 &(\d+)/)
            if (!idM) continue

            if (isStripped) {
              // stripped Transform: PrefabInstance 소속 매핑 + 원본 소스 오브젝트 fileID 저장
              const piM = section.match(/m_PrefabInstance:\s*\{fileID:\s*(\d+)/)
              const corSrcM = section.match(/m_CorrespondingSourceObject:\s*\{fileID:\s*(-?\d+)/)
              tfMap[idM[1]] = {
                fileId: idM[1],
                pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 },
                fatherId: '0', goId: '0', stripped: true,
                prefabInstanceId: piM ? piM[1] : undefined,
                correspondingSourceId: corSrcM ? corSrcM[1] : undefined,
              }
            } else {
              const goM = section.match(/m_GameObject:\s*\{fileID:\s*(\d+)/)
              const fatherM = section.match(/m_Father:\s*\{fileID:\s*(\d+)/)
              const p3 = (key: string) => section.match(new RegExp(`${key}:\\s*\\{x:\\s*([\\d.eE+\\-]+),\\s*y:\\s*([\\d.eE+\\-]+),\\s*z:\\s*([\\d.eE+\\-]+)`))
              const pos = p3('m_LocalPosition')
              const rot4 = section.match(/m_LocalRotation:\s*\{x:\s*([\d.eE+\-]+),\s*y:\s*([\d.eE+\-]+),\s*z:\s*([\d.eE+\-]+),\s*w:\s*([\d.eE+\-]+)/)
              const scl = p3('m_LocalScale')

              tfMap[idM[1]] = {
                fileId: idM[1],
                pos:   pos  ? { x: parseVal(pos[1]),  y: parseVal(pos[2]),  z: parseVal(pos[3])  } : { x: 0, y: 0, z: 0 },
                rot:   rot4 ? { x: parseVal(rot4[1]), y: parseVal(rot4[2]), z: parseVal(rot4[3]), w: parseVal(rot4[4]) } : { x: 0, y: 0, z: 0, w: 1 },
                scale: scl  ? { x: parseVal(scl[1]),  y: parseVal(scl[2]),  z: parseVal(scl[3])  } : { x: 1, y: 1, z: 1 },
                fatherId: fatherM ? fatherM[1] : '0',
                goId: goM ? goM[1] : '0',
                stripped: false,
              }
            }
          }
          // ─── MeshFilter (!u!33) ────────────────────────────────────
          else if (section.includes('!u!33 &')) {
            const idM  = section.match(/!u!33 &(\d+)/)
            const goM  = section.match(/m_GameObject:\s*\{fileID:\s*(\d+)/)
            const meshM = section.match(/m_Mesh:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+),\s*type:\s*3/)
            if (idM && goM && meshM && meshM[1] !== '0000000000000000e000000000000000') {
              meshFilters[idM[1]] = { meshGuid: meshM[1], goId: goM[1] }
            }
            if (goM) addComponent(goM[1], 'MeshFilter')
          }
          // ─── 기타 컴포넌트 파싱 (GO별 컴포넌트 목록 구축) ────────────
          else {
            // 알려진 Unity 클래스 ID 매칭
            const classIdM = section.match(/--- !u!(\d+) &(\d+)/)
            if (classIdM) {
              const classId = classIdM[1]
              const className = UNITY_CLASS_NAMES[classId]
              if (className && classId !== '1' && classId !== '4') { // GO와 Transform은 이미 처리
                const goM = section.match(/m_GameObject:\s*\{fileID:\s*(\d+)/)
                if (goM) addComponent(goM[1], className)
              }
            }
          }
        }

        // ── 월드 좌표 계산 (재귀 + 캐시) ─────────────────────────────────────
        const getWorldTf = (tfId: string): { pos: V3; rot: Q4; scale: V3 } => {
          const node = tfMap[tfId]
          if (!node) return { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } }
          if (node._worldPos) return { pos: node._worldPos, rot: node._worldRot!, scale: node._worldScale! }

          if (node.fatherId === '0' || !tfMap[node.fatherId]) {
            // 루트 노드: local = world
            node._worldPos = node.pos; node._worldRot = node.rot; node._worldScale = node.scale
            return { pos: node.pos, rot: node.rot, scale: node.scale }
          }

          // 부모 월드 좌표 얻기
          const parent = getWorldTf(node.fatherId)
          // world = parent * local
          const scaledLocal = vecMulComp(node.pos, parent.scale)
          const rotatedLocal = quatRotateVec(parent.rot, scaledLocal)
          const worldPos = vecAdd(parent.pos, rotatedLocal)
          const worldRot = quatMul(parent.rot, node.rot)
          const worldScale = vecMulComp(parent.scale, node.scale)

          node._worldPos = worldPos; node._worldRot = worldRot; node._worldScale = worldScale
          return { pos: worldPos, rot: worldRot, scale: worldScale }
        }

        // ── PrefabInstance → stripped Transform 매핑 빌드 ────────────────────
        // prefabInstanceId → stripped Transform fileId
        const prefabToStrippedTf: Record<string, string> = {}
        for (const [tfId, node] of Object.entries(tfMap)) {
          if (node.stripped && node.prefabInstanceId) {
            prefabToStrippedTf[node.prefabInstanceId] = tfId
          }
        }

        // ── m_Modifications 에서 특정 target의 propertyPath 값 추출 ──────────
        // PrefabInstance 블록에서 root Transform target을 식별한 후 해당 target의 값만 사용
        interface ParsedMod { targetFileID: string; prop: string; value: string }

        const parseModifications = (block: string): ParsedMod[] => {
          const mods: ParsedMod[] = []
          const re = /- target: \{fileID: (-?\d+)[^}]*\}\s*\n\s*propertyPath: ([^\n]+)\n\s*value:\s*([^\n]*)/g
          let m: RegExpExecArray | null
          while ((m = re.exec(block)) !== null) {
            mods.push({ targetFileID: m[1], prop: m[2].trim(), value: m[3].trim() })
          }
          return mods
        }

        const getModVal = (mods: ParsedMod[], targetId: string | null, prop: string, def: number): number => {
          // targetId가 지정된 경우: 해당 target의 값만 사용
          if (targetId) {
            const mod = mods.find(m => m.targetFileID === targetId && m.prop === prop)
            return mod ? parseVal(mod.value) : def
          }
          // targetId 미지정: 첫 번째 매칭
          const mod = mods.find(m => m.prop === prop)
          return mod ? parseVal(mod.value) : def
        }

        // ── PrefabInstance 파싱 (2-Phase: stripped Transform 업데이트 → 월드 좌표 계산) ──
        interface PrefabPlacement {
          id: string
          prefabName: string
          sourcePrefabGuid: string
          transformParentId: string
          strippedTfId: string       // 해당 stripped Transform의 fileId (없으면 '')
          localPos: V3; localRot: Q4; localScale: V3
          pos: V3; rot: Q4; scale: V3  // 월드 좌표 (Phase 2에서 계산)
          components?: string[]  // 해당 GO의 컴포넌트 목록
        }

        // ── Phase 1: 모든 PrefabInstance의 local transform 추출 + stripped Transform 업데이트 ──
        // ★ 핵심: stripped Transform의 fatherId와 pos/rot/scale을 업데이트해야
        //   중첩된 PrefabInstance 체인에서 getWorldTf가 올바른 월드 좌표를 계산함
        const placements: PrefabPlacement[] = []
        for (const section of sections) {
          if (!section.includes('!u!1001')) continue
          const idMatch = section.match(/!u!1001 &(\d+)/)
          if (!idMatch) continue
          const prefabGuidMatch = section.match(/m_SourcePrefab:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+)/)
          if (!prefabGuidMatch) continue
          const parentMatch = section.match(/m_TransformParent:\s*\{fileID:\s*(\d+)/)
          const transformParentId = parentMatch ? parentMatch[1] : '0'

          // 모든 modifications 파싱
          const mods = parseModifications(section)

          // root Transform의 target fileID 식별
          let rootTargetId: string | null = null
          const strippedTfId = prefabToStrippedTf[idMatch[1]] ?? ''

          // 방법 1 (우선): stripped Transform의 correspondingSourceId 사용
          if (strippedTfId && tfMap[strippedTfId]?.correspondingSourceId) {
            rootTargetId = tfMap[strippedTfId].correspondingSourceId!
          }

          // 방법 2 (폴백): m_LocalPosition 수정이 있는 target 중 선택
          if (!rootTargetId) {
            const posTargets = new Set<string>()
            for (const mod of mods) {
              if (mod.prop === 'm_LocalPosition.x' || mod.prop === 'm_LocalPosition.y' || mod.prop === 'm_LocalPosition.z') {
                posTargets.add(mod.targetFileID)
              }
            }
            if (posTargets.size === 1) {
              rootTargetId = posTargets.values().next().value ?? null
            } else if (posTargets.size > 1) {
              for (const tid of posTargets) {
                if (mods.some(m => m.targetFileID === tid && m.prop === 'm_LocalRotation.w')) {
                  rootTargetId = tid; break
                }
              }
              if (!rootTargetId) rootTargetId = posTargets.values().next().value ?? null
            }
          }

          const gv = (prop: string, def: number) => getModVal(mods, rootTargetId, prop, def)

          const localPos: V3 = { x: gv('m_LocalPosition.x', 0), y: gv('m_LocalPosition.y', 0), z: gv('m_LocalPosition.z', 0) }
          const localRot: Q4 = { x: gv('m_LocalRotation.x', 0), y: gv('m_LocalRotation.y', 0), z: gv('m_LocalRotation.z', 0), w: gv('m_LocalRotation.w', 1) }
          const localScale: V3 = { x: gv('m_LocalScale.x', 1), y: gv('m_LocalScale.y', 1), z: gv('m_LocalScale.z', 1) }

          // ★ stripped Transform 업데이트: local transform + fatherId 설정
          // 이전에는 stripped Transform이 pos=(0,0,0), fatherId='0'으로 남아있어
          // 자식 PrefabInstance가 부모 체인을 따라갈 때 잘못된 월드 좌표를 계산했음
          if (strippedTfId && tfMap[strippedTfId]) {
            tfMap[strippedTfId].pos = localPos
            tfMap[strippedTfId].rot = localRot
            tfMap[strippedTfId].scale = localScale
            tfMap[strippedTfId].fatherId = transformParentId
          }

          placements.push({
            id: idMatch[1],
            prefabName: (() => {
              const rel = guidToRelPath[prefabGuidMatch[1]]
              return rel ? rel.split('/').pop()?.replace(/\.prefab$/i, '') ?? 'Object' : 'Object'
            })(),
            sourcePrefabGuid: prefabGuidMatch[1],
            transformParentId,
            strippedTfId,
            localPos, localRot, localScale,
            pos: localPos, rot: localRot, scale: localScale, // Phase 2에서 덮어씀
          })
        }

        // ── Phase 1b: _worldPos 캐시 초기화 ──
        // Phase 1에서 stripped Transform 데이터가 변경되었으므로
        // 이전에 캐시된 월드 좌표를 모두 무효화해야 정확한 재계산 가능
        for (const tf of Object.values(tfMap)) {
          delete tf._worldPos
          delete tf._worldRot
          delete tf._worldScale
        }

        // ── Phase 2: PrefabInstance 월드 좌표 계산 (업데이트된 tfMap 기반 getWorldTf) ──
        for (const p of placements) {
          if (p.strippedTfId && tfMap[p.strippedTfId]) {
            // stripped Transform의 fatherId를 통해 전체 hierarchy 체인 순회
            const wt = getWorldTf(p.strippedTfId)
            p.pos = wt.pos
            p.rot = wt.rot
            p.scale = wt.scale
          } else if (p.transformParentId !== '0' && tfMap[p.transformParentId]) {
            // strippedTfId가 없는 경우 직접 부모 체인 계산 (폴백)
            const parentWorld = getWorldTf(p.transformParentId)
            const scaledLocal = vecMulComp(p.localPos, parentWorld.scale)
            const rotatedLocal = quatRotateVec(parentWorld.rot, scaledLocal)
            p.pos = vecAdd(parentWorld.pos, rotatedLocal)
            p.rot = quatMul(parentWorld.rot, p.localRot)
            p.scale = vecMulComp(parentWorld.scale, p.localScale)
          }
          // else: 루트 PrefabInstance (transformParentId='0') → localPos가 곧 worldPos
        }

        // ── 직접 GameObject+Transform+MeshFilter 파싱 (월드 좌표 포함) ──────
        interface DirectObject {
          name: string
          meshGuid: string
          pos: V3; rot: Q4; scale: V3  // 월드 좌표
        }
        const directObjects: DirectObject[] = []

        for (const [, mf] of Object.entries(meshFilters)) {
          const fbxPath = guidToRelPath[mf.meshGuid]
          if (!fbxPath || !/\.(fbx)$/i.test(fbxPath)) continue
          const goName = gameObjects[mf.goId] ?? 'Object'
          // goId → Transform 찾기 (goId가 같은 Transform)
          const tfEntry = Object.entries(tfMap).find(([, t]) => !t.stripped && t.goId === mf.goId)
          if (tfEntry) {
            const world = getWorldTf(tfEntry[0])  // 월드 좌표로 변환
            directObjects.push({
              name: goName,
              meshGuid: mf.meshGuid,
              pos: world.pos, rot: world.rot, scale: world.scale,
            })
          } else {
            directObjects.push({
              name: goName,
              meshGuid: mf.meshGuid,
              pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 },
            })
          }
        }

        // ── prefab → FBX / ProBuilder 해석 ──────────────────────────────────
        const MODEL_EXT_RE = /\.(fbx|obj|dae)$/i
        const BUILTIN_GUID = '0000000000000000e000000000000000'

        const prefabFbxCache: Record<string, string | null> = {}
        const prefabPbCache: Record<string, { verts: number[]; indices: number[] } | null> = {}

        /** GUID가 가리키는 파일에서 FBX 경로를 재귀적으로 해석 */
        const resolvePrefabFbx = (prefabGuid: string, depth = 0): string | null => {
          if (depth > 4) return null
          if (prefabGuid in prefabFbxCache) return prefabFbxCache[prefabGuid]

          // ① GUID가 직접 모델 파일을 가리키는 경우 (FBX import = prefab)
          const directRel = guidToRelPath[prefabGuid]
          if (directRel && MODEL_EXT_RE.test(directRel)) {
            return (prefabFbxCache[prefabGuid] = directRel)
          }

          const prefabAbsPath = guidToAbs(prefabGuid)
          if (!prefabAbsPath || !existsSync(prefabAbsPath)) {
            return (prefabFbxCache[prefabGuid] = null)
          }
          // 바이너리 모델 파일은 텍스트 파싱 불가
          if (!/\.(prefab|asset|unity)$/i.test(prefabAbsPath)) {
            return (prefabFbxCache[prefabGuid] = null)
          }

          try {
            const pc = readFileSync(prefabAbsPath, 'utf-8')

            // ② m_Mesh 참조 (type 2 또는 3)
            for (const m of pc.matchAll(/m_Mesh:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+),\s*type:\s*[23]/g)) {
              const g = m[1]
              if (g === BUILTIN_GUID) continue
              const rel = guidToRelPath[g]
              if (rel && MODEL_EXT_RE.test(rel)) {
                return (prefabFbxCache[prefabGuid] = rel)
              }
            }

            // ③ m_CorrespondingSourceObject → FBX (중첩 프리팹 변형)
            for (const m of pc.matchAll(/m_CorrespondingSourceObject:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+)/g)) {
              const g = m[1]
              if (g === '0' || g === prefabGuid) continue
              const rel = guidToRelPath[g]
              if (rel && MODEL_EXT_RE.test(rel)) {
                return (prefabFbxCache[prefabGuid] = rel)
              }
            }

            // ④ 중첩 m_SourcePrefab 따라가기
            for (const m of pc.matchAll(/m_SourcePrefab:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+)/g)) {
              if (m[1] === prefabGuid) continue
              const r = resolvePrefabFbx(m[1], depth + 1)
              if (r) return (prefabFbxCache[prefabGuid] = r)
            }

            // ⑤ m_ParentPrefab (레거시 Unity 2018 이하)
            for (const m of pc.matchAll(/m_ParentPrefab:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+)/g)) {
              if (m[1] === prefabGuid) continue
              const r = resolvePrefabFbx(m[1], depth + 1)
              if (r) return (prefabFbxCache[prefabGuid] = r)
            }

            return (prefabFbxCache[prefabGuid] = null)
          } catch {
            return (prefabFbxCache[prefabGuid] = null)
          }
        }

        /** ProBuilder 프리팹에서 정점 + 삼각형 인덱스 추출 */
        const resolveProBuilderMesh = (prefabGuid: string): { verts: number[]; indices: number[] } | null => {
          if (prefabGuid in prefabPbCache) return prefabPbCache[prefabGuid]

          const absPath = guidToAbs(prefabGuid)
          if (!absPath || !existsSync(absPath) || !/\.(prefab|asset)$/i.test(absPath)) {
            return (prefabPbCache[prefabGuid] = null)
          }

          try {
            const pc = readFileSync(absPath, 'utf-8')

            // m_Positions 파싱
            const posBlock = pc.match(/m_Positions:\s*\n((?:\s*-\s*\{[^}]+\}\s*\n?)+)/)
            if (!posBlock) return (prefabPbCache[prefabGuid] = null)

            const verts: number[] = []
            for (const v of posBlock[1].matchAll(/\{x:\s*([\d.eE+\-]+),\s*y:\s*([\d.eE+\-]+),\s*z:\s*([\d.eE+\-]+)\}/g)) {
              verts.push(parseFloat(v[1]), parseFloat(v[2]), parseFloat(v[3]))
            }
            if (verts.length === 0) return (prefabPbCache[prefabGuid] = null)

            // m_Indexes 파싱 (hex-encoded little-endian int32 배열)
            const indices: number[] = []
            for (const im of pc.matchAll(/m_Indexes:\s*([0-9a-fA-F]+)/g)) {
              const hex = im[1]
              for (let i = 0; i + 8 <= hex.length; i += 8) {
                // little-endian 32-bit unsigned int
                const b0 = parseInt(hex.substring(i, i + 2), 16)
                const b1 = parseInt(hex.substring(i + 2, i + 4), 16)
                const b2 = parseInt(hex.substring(i + 4, i + 6), 16)
                const b3 = parseInt(hex.substring(i + 6, i + 8), 16)
                indices.push(b0 | (b1 << 8) | (b2 << 16) | (b3 << 24))
              }
            }

            return (prefabPbCache[prefabGuid] = { verts, indices })
          } catch {
            return (prefabPbCache[prefabGuid] = null)
          }
        }

        // ── 씬 오브젝트 목록 조합 ───────────────────────────────────────────────
        interface SceneObj {
          id: string
          name: string
          type: 'fbx' | 'probuilder' | 'box' | 'empty'
          fbxPath: string
          fbxUrl: string
          vertices?: number[]
          indices?: number[]
          pos: { x: number; y: number; z: number }
          rot: { x: number; y: number; z: number; w: number }
          scale: { x: number; y: number; z: number }
          components?: string[]  // 해당 GO의 컴포넌트 목록
        }

        const sceneObjects: SceneObj[] = []
        const resolvedIds = new Set<string>()

        // 1) 직접 MeshFilter 오브젝트
        for (const d of directObjects) {
          if (sceneObjects.length >= maxObjects) break
          const rel = guidToRelPath[d.meshGuid] ?? ''
          sceneObjects.push({
            id: `dir_${d.meshGuid}`,
            name: d.name,
            type: 'fbx',
            fbxPath: rel,
            fbxUrl: `/api/assets/file?path=${encodeURIComponent(rel)}`,
            pos: d.pos, rot: d.rot, scale: d.scale,
          })
        }

        // 2) PrefabInstance → FBX 해석
        for (const p of placements) {
          if (sceneObjects.length >= maxObjects) break
          const fbxRel = resolvePrefabFbx(p.sourcePrefabGuid)
          if (fbxRel) {
            resolvedIds.add(p.id)
            sceneObjects.push({
              id: p.id,
              name: p.prefabName,
              type: 'fbx',
              fbxPath: fbxRel,
              fbxUrl: `/api/assets/file?path=${encodeURIComponent(fbxRel)}`,
              pos: p.pos, rot: p.rot, scale: p.scale,
            })
          }
        }
        const fbxResolved = sceneObjects.length

        // 3) 미해석 PrefabInstance → ProBuilder 메시 추출
        for (const p of placements) {
          if (sceneObjects.length >= maxObjects) break
          if (resolvedIds.has(p.id)) continue
          const pb = resolveProBuilderMesh(p.sourcePrefabGuid)
          if (pb) {
            resolvedIds.add(p.id)
            sceneObjects.push({
              id: p.id,
              name: p.prefabName,
              type: 'probuilder',
              fbxPath: '',
              fbxUrl: '',
              vertices: pb.verts,
              indices: pb.indices,
              pos: p.pos, rot: p.rot, scale: p.scale,
            })
          }
        }
        const pbResolved = sceneObjects.length - fbxResolved

        // 4) 나머지 미해석 프리팹 → 박스 플레이스홀더
        let boxCount = 0
        const MAX_BOXES = 500
        for (const p of placements) {
          if (sceneObjects.length >= maxObjects || boxCount >= MAX_BOXES) break
          if (resolvedIds.has(p.id)) continue
          sceneObjects.push({
            id: `box_${p.id}`,
            name: p.prefabName,
            type: 'box',
            fbxPath: '',
            fbxUrl: '',
            pos: p.pos, rot: p.rot, scale: p.scale,
            components: p.components,
          })
          boxCount++
        }

        // ── 프리팹 모드: 메시 없는 직접 GameObject도 empty 오브젝트로 추가 ──
        // 프리팹에서는 빈 오브젝트(Collider, Script, Animator 등)도 확인 가능해야 함
        const renderedGoIds = new Set<string>() // 이미 렌더링 오브젝트가 있는 GO
        for (const [, mf] of Object.entries(meshFilters)) {
          renderedGoIds.add(mf.goId)
        }
        let emptyCount = 0
        if (isPrefab) {
          for (const [tfId, tf] of Object.entries(tfMap)) {
            if (tf.stripped || tf.goId === '0') continue
            if (renderedGoIds.has(tf.goId)) continue  // 이미 FBX/PB로 렌더링됨
            const goName = gameObjects[tf.goId] || ''
            if (!goName) continue  // 이름 없는 GO는 스킵

            const world = getWorldTf(tfId)
            const comps = goComponents[tf.goId] || []
            sceneObjects.push({
              id: `empty_${tf.goId}`,
              name: goName,
              type: 'empty',
              fbxPath: '',
              fbxUrl: '',
              pos: world.pos, rot: world.rot, scale: world.scale,
              components: comps.length > 0 ? comps : undefined,
            })
            emptyCount++
          }
        }

        // ── 하이어라키 트리 구축 (Unity Hierarchy 재현) ─────────────────────
        interface HNode {
          id: string
          name: string
          type: 'fbx' | 'probuilder' | 'box' | 'empty'
          objIdx: number      // index in sceneObjects, -1 if no rendered object
          children: HNode[]
          components?: string[]  // 해당 GO의 컴포넌트 목록
        }

        // Transform children 매핑 (fatherId → childTfIds)
        const tfChildren: Record<string, string[]> = {}
        for (const [tfId, tf] of Object.entries(tfMap)) {
          if (tf.stripped) continue
          const fid = tf.fatherId
          if (fid && fid !== '0' && tfMap[fid]) {
            if (!tfChildren[fid]) tfChildren[fid] = []
            tfChildren[fid].push(tfId)
          }
        }

        // goId → sceneObj index (직접 MeshFilter 오브젝트 + empty 오브젝트)
        const goIdToSceneIdx: Record<string, number> = {}
        for (const [, mf] of Object.entries(meshFilters)) {
          const idx = sceneObjects.findIndex(o => o.id === `dir_${mf.meshGuid}`)
          if (idx >= 0 && !(mf.goId in goIdToSceneIdx)) goIdToSceneIdx[mf.goId] = idx
        }
        // empty 오브젝트도 goId → sceneObj index에 추가
        for (let i = 0; i < sceneObjects.length; i++) {
          if (sceneObjects[i].id.startsWith('empty_')) {
            const goId = sceneObjects[i].id.slice(6)
            if (!(goId in goIdToSceneIdx)) goIdToSceneIdx[goId] = i
          }
        }

        // PrefabInstance ID → sceneObj index
        const piIdToSceneIdx: Record<string, number> = {}
        for (let i = 0; i < sceneObjects.length; i++) {
          const id = sceneObjects[i].id
          if (id.startsWith('box_')) piIdToSceneIdx[id.slice(4)] = i
          else if (!id.startsWith('dir_') && !id.startsWith('empty_')) piIdToSceneIdx[id] = i
        }

        // PrefabInstance들의 parentTf별 그룹핑
        const piByParent: Record<string, PrefabPlacement[]> = {}
        for (const p of placements) {
          const key = p.transformParentId || '0'
          if (!piByParent[key]) piByParent[key] = []
          piByParent[key].push(p)
        }

        // 하위 트리에 렌더링 오브젝트가 있는지 확인 (pruning용, 씬 모드에서만 사용)
        const hasRenderedDescendant = (tfId: string, depth: number): boolean => {
          if (depth > 15) return false
          const tf = tfMap[tfId]
          if (!tf || tf.stripped) return false
          if (goIdToSceneIdx[tf.goId] !== undefined) return true
          for (const cid of (tfChildren[tfId] || [])) {
            if (hasRenderedDescendant(cid, depth + 1)) return true
          }
          if (piByParent[tfId]?.length) return true
          return false
        }

        // 재귀 트리 빌더
        const buildHNode = (tfId: string, depth: number): HNode | null => {
          if (depth > 15) return null
          const tf = tfMap[tfId]
          if (!tf || tf.stripped) return null

          const goName = gameObjects[tf.goId] || ''
          const objIdx = goIdToSceneIdx[tf.goId] ?? -1
          const comps = tf.goId !== '0' ? goComponents[tf.goId] : undefined

          const children: HNode[] = []

          // 자식 Transform 노드
          for (const childTfId of (tfChildren[tfId] || [])) {
            const ch = buildHNode(childTfId, depth + 1)
            if (ch) children.push(ch)
          }

          // 이 Transform에 붙은 PrefabInstance 노드
          for (const p of (piByParent[tfId] || [])) {
            const idx = piIdToSceneIdx[p.id] ?? -1
            children.push({
              id: `pi_${p.id}`,
              name: p.prefabName,
              type: idx >= 0 ? (sceneObjects[idx].type || 'fbx') as HNode['type'] : 'empty',
              objIdx: idx,
              children: [],
            })
          }

          // pruning: 씬 모드에서는 렌더링 오브젝트 없고 자식도 없으면 제거
          // 프리팹 모드에서는 이름 있는 모든 GO 포함 (빈 오브젝트도 표시)
          if (!isPrefab) {
            if (objIdx < 0 && children.length === 0) return null
          } else {
            // 프리팹: 이름 없는 빈 노드만 제거
            if (!goName && children.length === 0) return null
          }

          return {
            id: `tf_${tfId}`,
            name: goName || `[Transform]`,
            type: objIdx >= 0 ? (sceneObjects[objIdx].type || 'fbx') as HNode['type'] : 'empty',
            objIdx,
            children,
            components: comps && comps.length > 0 ? comps : undefined,
          }
        }

        // 루트 노드 생성
        const hierarchy: HNode[] = []

        // 1) 루트 Transform (fatherId='0', not stripped)
        for (const [tfId, tf] of Object.entries(tfMap)) {
          if (tf.fatherId === '0' && !tf.stripped) {
            const node = buildHNode(tfId, 0)
            if (node) hierarchy.push(node)
          }
        }

        // 2) 루트 레벨 PrefabInstance (transformParentId='0')
        for (const p of (piByParent['0'] || [])) {
          const idx = piIdToSceneIdx[p.id] ?? -1
          hierarchy.push({
            id: `pi_${p.id}`,
            name: p.prefabName,
            type: idx >= 0 ? (sceneObjects[idx].type || 'fbx') as HNode['type'] : 'empty',
            objIdx: idx,
            children: [],
          })
        }

        // 이름순 정렬
        hierarchy.sort((a, b) => a.name.localeCompare(b.name))

        sendJson(res, 200, {
          scenePath,
          totalPrefabs: placements.length,
          totalDirect: directObjects.length,
          resolvedFbx: fbxResolved,
          resolvedProBuilder: pbResolved,
          resolvedBox: boxCount,
          resolvedEmpty: emptyCount,
          resolvedCount: sceneObjects.length,
          objects: sceneObjects,
          hierarchy,
        })
        return
      } catch (sceneErr) {
        console.error('[scene endpoint error]', sceneErr)
        if (!res.headersSent) sendJson(res, 500, { error: String(sceneErr) })
        return
      }
    }

    // ── /api/assets/scene-yaml : Unity .unity 씬 YAML 원문 조회 ────────────────
    if (req.url?.startsWith('/api/assets/scene-yaml')) {
      try {
        const SCENE_ASSETS_DIR2 = join(process.cwd(), '..', '..', 'assets')
        const url2 = new URL(req.url, 'http://localhost')
        const scenePath = url2.searchParams.get('path') || ''
        const filter    = url2.searchParams.get('filter') || ''      // 예: 'PrefabInstance', 'MonoBehaviour', 'MeshFilter'
        const search    = url2.searchParams.get('search') || ''      // 자유 텍스트 검색
        const offset    = parseInt(url2.searchParams.get('offset') || '0', 10)
        const limit     = parseInt(url2.searchParams.get('limit') || '200', 10)  // 줄 수 제한 (기본 200줄)
        const maxLines  = Math.min(limit, 2000)

        if (!scenePath) { sendJson(res, 400, { error: 'path parameter required' }); return }

        const UNITY_BASE_Y = join(SCENE_ASSETS_DIR2, '..', 'unity_project', 'Client', 'Project_Aegis', 'Assets')
        const absPath = join(UNITY_BASE_Y, scenePath)
        if (!existsSync(absPath)) {
          sendJson(res, 404, { error: `Scene file not found: ${scenePath}` })
          return
        }

        const stat = statSync(absPath)
        const fileSizeKB = Math.round(stat.size / 1024)

        // YAML 섹션 분할 (--- !u!XXX &YYY)
        const raw = readFileSync(absPath, 'utf-8')
        const sectionRe = /^--- !u!(\d+) &(\d+)/gm
        interface YamlSection {
          classId: number
          objectId: string
          startIdx: number
          endIdx: number
          typeName: string
        }
        const UNITY_CLASS_NAMES: Record<number, string> = {
          1: 'GameObject', 4: 'Transform', 20: 'Camera', 23: 'MeshRenderer',
          25: 'Renderer', 29: 'OcclusionCullingSettings', 33: 'MeshFilter',
          43: 'Mesh', 54: 'Rigidbody', 64: 'MeshCollider', 65: 'BoxCollider',
          66: 'SphereCollider', 68: 'CapsuleCollider', 104: 'RenderSettings',
          108: 'Light', 111: 'Animation', 114: 'MonoBehaviour', 120: 'LineRenderer',
          124: 'Behaviour', 127: 'LevelGameManager', 135: 'SphereCollider',
          136: 'Terrain', 137: 'TerrainCollider', 157: 'LightmapSettings',
          196: 'NavMeshSettings', 198: 'ParticleSystem', 199: 'ParticleSystemRenderer',
          205: 'LODGroup', 212: 'SpriteRenderer', 222: 'UnityConnectSettings',
          224: 'VFXRenderer', 225: 'CanvasRenderer', 258: 'LightingDataAsset',
          850595691: 'LightingSettings',
          1001: 'PrefabInstance', 1660057539: 'SceneRoots',
        }

        const sections: YamlSection[] = []
        let m: RegExpExecArray | null
        while ((m = sectionRe.exec(raw)) !== null) {
          if (sections.length > 0) sections[sections.length - 1].endIdx = m.index
          const classId = parseInt(m[1], 10)
          sections.push({
            classId,
            objectId: m[2],
            startIdx: m.index,
            endIdx: raw.length,
            typeName: UNITY_CLASS_NAMES[classId] || `Unknown_${classId}`,
          })
        }

        // 섹션 카운트 (타입별)
        const typeCounts: Record<string, number> = {}
        for (const s of sections) {
          typeCounts[s.typeName] = (typeCounts[s.typeName] || 0) + 1
        }

        // 필터링
        let filtered = sections
        if (filter) {
          const filterLower = filter.toLowerCase()
          filtered = sections.filter(s =>
            s.typeName.toLowerCase().includes(filterLower) ||
            String(s.classId) === filter
          )
        }

        // 텍스트 검색
        if (search) {
          const searchLower = search.toLowerCase()
          filtered = filtered.filter(s => {
            const text = raw.substring(s.startIdx, s.endIdx)
            return text.toLowerCase().includes(searchLower)
          })
        }

        // 페이지네이션
        const totalFiltered = filtered.length
        const paged = filtered.slice(offset, offset + maxLines)

        // 각 섹션의 텍스트 추출 (각 섹션 최대 150줄로 잘라서 전체 응답 크기 제한)
        const MAX_SECTION_LINES = 150
        const sectionTexts = paged.map(s => {
          const text = raw.substring(s.startIdx, s.endIdx)
          const lines = text.split('\n')
          const truncated = lines.length > MAX_SECTION_LINES
          return {
            classId: s.classId,
            objectId: s.objectId,
            typeName: s.typeName,
            lineCount: lines.length,
            truncated,
            text: truncated ? lines.slice(0, MAX_SECTION_LINES).join('\n') + `\n... (${lines.length - MAX_SECTION_LINES}줄 생략)` : text,
          }
        })

        sendJson(res, 200, {
          scenePath,
          fileSizeKB,
          totalSections: sections.length,
          typeCounts,
          filter: filter || null,
          search: search || null,
          totalFiltered,
          offset,
          returnedCount: sectionTexts.length,
          sections: sectionTexts,
        })
        return
      } catch (e) {
        console.error('[scene-yaml endpoint error]', e)
        if (!res.headersSent) sendJson(res, 500, { error: String(e) })
        return
      }
    }

    // ── /api/jira/* : Jira / Confluence 프록시 ──────────────────────────────────
    if (req.url?.startsWith('/api/jira/') || req.url?.startsWith('/api/confluence/')) {
      try {
        // .env 파일의 환경 변수에서 읽기
        const jiraToken      = options.jiraApiToken       || ''
        const jiraEmail      = options.jiraUserEmail      || ''
        const jiraBase       = options.jiraBaseUrl        || ''
        const confluenceBase = options.confluenceBaseUrl  || jiraBase

        // Confluence 전용 토큰 (없으면 Jira 토큰 사용)
        const confToken = options.confluenceApiToken || jiraToken
        const confEmail = options.confluenceUserEmail || jiraEmail

        if (!jiraToken) {
          sendJson(res, 503, { error: 'JIRA_API_TOKEN not set. Add it to .env file: JIRA_API_TOKEN=your_token' })
          return
        }
        if (!jiraBase) {
          sendJson(res, 503, { error: 'JIRA_BASE_URL not set. Add it to .env file: JIRA_BASE_URL=https://cloud.jira.krafton.com' })
          return
        }

        // Jira 인증 헤더
        const authHeader: string = jiraEmail
          ? 'Basic ' + Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')
          : 'Bearer ' + jiraToken

        // Confluence 인증 헤더 (별도 토큰이 있으면 사용)
        const confAuthHeader: string = confEmail
          ? 'Basic ' + Buffer.from(`${confEmail}:${confToken}`).toString('base64')
          : 'Bearer ' + confToken

        const baseUrl      = jiraBase.replace(/\/$/, '')        // Jira 전용
        const confluenceUrl = confluenceBase.replace(/\/$/, '') // Confluence 전용
        const url2 = new URL(req.url, 'http://localhost')

        // ── /api/jira/search?jql=...&maxResults=20 ─────────────────────────
        if (req.url.startsWith('/api/jira/search')) {
          let jql = url2.searchParams.get('jql') || ''
          const maxResults = parseInt(url2.searchParams.get('maxResults') || '20', 10)
          const fields = url2.searchParams.get('fields') || 'summary,status,assignee,priority,issuetype,created,updated,description,comment,labels,components,fixVersions,reporter'

          // Jira Cloud는 project 조건 없는 JQL을 400으로 차단함.
          // JQL에 project 조건이 없으면 env의 기본 프로젝트 키를 사용해 추가.
          const hasProjectClause = /\bproject\b/i.test(jql)
          if (!hasProjectClause) {
            let projectKeys: string[] = []

            // 1) .env에 설정된 기본 프로젝트 키 우선 사용
            if (options.jiraDefaultProject) {
              projectKeys = options.jiraDefaultProject.split(',').map(k => k.trim()).filter(Boolean)
            }

            // 2) env 설정 없으면 API로 프로젝트 목록 조회
            if (projectKeys.length === 0) {
              try {
                // project/search (Jira Cloud v3) 먼저 시도
                const projResp = await fetch(`${baseUrl}/rest/api/3/project/search?maxResults=50&orderBy=name`, {
                  headers: { Authorization: authHeader, Accept: 'application/json' }
                })
                if (projResp.ok) {
                  const projData = await projResp.json() as { values?: { key: string }[] }
                  projectKeys = (projData.values ?? []).map((p: { key: string }) => p.key).filter(Boolean)
                }
                // project/search 실패 시 /project 목록 폴백
                if (projectKeys.length === 0) {
                  const projResp2 = await fetch(`${baseUrl}/rest/api/3/project?maxResults=50`, {
                    headers: { Authorization: authHeader, Accept: 'application/json' }
                  })
                  if (projResp2.ok) {
                    const projData2 = await projResp2.json() as { key: string }[]
                    if (Array.isArray(projData2)) {
                      projectKeys = projData2.map((p: { key: string }) => p.key).filter(Boolean)
                    }
                  }
                }
              } catch { /* ignore */ }
            }

            if (projectKeys.length > 0) {
              const trimmedJql = jql.trim()
              // JQL에서 프로젝트 키는 따옴표 없이 사용 (쌍따옴표는 Jira Cloud에서 오류 발생)
              const projectPart = projectKeys.length === 1
                ? `project = ${projectKeys[0]}`
                : `project IN (${projectKeys.join(',')})`

              // ORDER BY만 있거나 완전히 비어있는 경우
              const upperJql = trimmedJql.toUpperCase()
              const orderByIdx = upperJql.indexOf('ORDER BY')
              if (!trimmedJql) {
                jql = `${projectPart} ORDER BY updated DESC`
              } else if (upperJql.startsWith('ORDER BY')) {
                jql = `${projectPart} ${trimmedJql}`
              } else if (orderByIdx > 0) {
                // 조건 + ORDER BY 혼합: 조건 앞에만 project 추가
                const condPart = trimmedJql.substring(0, orderByIdx).trim()
                const orderPart = trimmedJql.substring(orderByIdx)
                jql = `${projectPart} AND ${condPart} ${orderPart}`.trim()
              } else {
                jql = `${projectPart} AND ${trimmedJql}`
              }
              console.log(`[Jira] project 자동 추가 → ${jql}`)
            }
          }

          const apiUrl = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields)}`

          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json() as Record<string, unknown>
          if (!apiResp.ok) {
            const errMsg = (data?.errorMessages as string[])?.[0] ?? (data?.message as string) ?? `Jira API ${apiResp.status}`
            sendJson(res, apiResp.status, { error: errMsg, raw: data })
          } else {
            sendJson(res, 200, data)
          }
          return
        }

        // ── /api/jira/issue/:key ────────────────────────────────────────────
        if (req.url.startsWith('/api/jira/issue/')) {
          const issueKey = url2.pathname.replace('/api/jira/issue/', '').split('?')[0]
          const expand = url2.searchParams.get('expand') || 'renderedFields,names,schema'
          const apiUrl = `${baseUrl}/rest/api/3/issue/${issueKey}?expand=${expand}&fields=summary,status,assignee,priority,issuetype,created,updated,description,comment,labels,components,fixVersions,reporter,subtasks,parent,attachment`

          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json() as Record<string, unknown>
          if (!apiResp.ok) {
            const errMsg = (data?.errorMessages as string[])?.[0] ?? `Jira issue ${issueKey} not found`
            sendJson(res, apiResp.status, { error: errMsg, raw: data })
          } else {
            sendJson(res, 200, data)
          }
          return
        }

        // ── /api/jira/projects ─────────────────────────────────────────────
        if (req.url.startsWith('/api/jira/projects')) {
          const apiUrl = `${baseUrl}/rest/api/3/project/search?maxResults=50&orderBy=name`
          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json()
          sendJson(res, apiResp.ok ? 200 : apiResp.status, data)
          return
        }

        // ── /api/confluence/search?cql=...&limit=20 ────────────────────────
        if (req.url.startsWith('/api/confluence/search')) {
          const cql = url2.searchParams.get('cql') || ''
          const limit = parseInt(url2.searchParams.get('limit') || '10', 10)
          const expand = 'body.storage,version,space,ancestors'

          // Confluence REST API v1
          const confHeaders = { Authorization: confAuthHeader, Accept: 'application/json', 'X-Atlassian-Token': 'no-check' }
          const apiUrlV1 = `${confluenceUrl}/wiki/rest/api/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=${encodeURIComponent(expand)}`
          const apiRespV1 = await fetch(apiUrlV1, { headers: confHeaders })

          if (!apiRespV1.ok) {
            const errBody = await apiRespV1.json().catch(() => ({})) as Record<string,unknown>
            const msg = (errBody?.message as string) ?? `Confluence 검색 실패 (${apiRespV1.status})`
            const hint = apiRespV1.status === 403
              ? `${msg} — CONFLUENCE_API_TOKEN 또는 CONFLUENCE_USER_EMAIL을 .env에 별도로 설정하세요.`
              : msg
            sendJson(res, apiRespV1.status, { error: hint, raw: errBody })
          } else {
            const body = await apiRespV1.json() as Record<string,unknown>
            // 클라이언트에서 절대 URL 생성에 필요한 base URL 포함
            sendJson(res, 200, { ...body, _baseUrl: confluenceUrl })
          }
          return
        }

        // ── /api/confluence/page/:id ────────────────────────────────────────
        if (req.url.startsWith('/api/confluence/page/')) {
          const pageId = url2.pathname.replace('/api/confluence/page/', '').split('?')[0]
          const apiUrl = `${confluenceUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version,space,ancestors,children.page,children.attachment`

          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: confAuthHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json() as Record<string, unknown>
          if (!apiResp.ok) {
            sendJson(res, apiResp.status, { error: (data?.message as string) ?? `Confluence page ${pageId} not found`, raw: data })
          } else {
            // 첨부파일 다운로드 URL에 base URL 포함
            (data as Record<string,unknown>)._confluenceBaseUrl = confluenceUrl
            sendJson(res, 200, data)
          }
          return
        }

        // ── /api/confluence/attachment?url=... ─── Confluence 첨부파일 프록시 (인증 포함)
        if (req.url.startsWith('/api/confluence/attachment')) {
          const rawUrl = url2.searchParams.get('url') || ''
          if (!rawUrl) {
            sendJson(res, 400, { error: 'url parameter required' })
            return
          }
          // 보안: Confluence 도메인만 허용
          let targetUrl = rawUrl
          if (!targetUrl.startsWith('http')) {
            targetUrl = `${confluenceUrl}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`
          }
          try {
            const attResp = await fetch(targetUrl, {
              headers: { Authorization: confAuthHeader },
              redirect: 'follow',
            })
            if (!attResp.ok) {
              res.writeHead(attResp.status, { 'Content-Type': 'text/plain' })
              res.end(`Confluence attachment fetch failed: ${attResp.status}`)
              return
            }
            // Content-Type 전달
            const ct = attResp.headers.get('content-type') || 'application/octet-stream'
            const cl = attResp.headers.get('content-length')
            const headers: Record<string, string> = {
              'Content-Type': ct,
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            }
            if (cl) headers['Content-Length'] = cl
            res.writeHead(200, headers)
            // 바이너리 스트리밍
            const reader = attResp.body?.getReader()
            if (reader) {
              const pump = async () => {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  res.write(Buffer.from(value))
                }
                res.end()
              }
              await pump()
            } else {
              const buf = Buffer.from(await attResp.arrayBuffer())
              res.end(buf)
            }
          } catch (attErr) {
            console.error('[confluence attachment proxy]', attErr)
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'text/plain' })
              res.end(String(attErr))
            }
          }
          return
        }

        sendJson(res, 404, { error: 'Unknown Jira/Confluence endpoint' })
        return
      } catch (jiraErr) {
        console.error('[jira proxy error]', jiraErr)
        if (!res.headersSent) sendJson(res, 500, { error: String(jiraErr) })
        return
      }
    }

    // ── /api/published : 출판된 문서 목록 (GET) ────────────────────────────────
    if (req.url === '/api/published' && req.method === 'GET') {
      sendJson(res, 200, readPublishedIndex())
      return
    }

    // ── /api/publish : 기획서 출판 (POST) / 삭제 (DELETE) ──────────────────────
    if (req.url?.startsWith('/api/publish')) {
      const urlObj = new URL(req.url, 'http://localhost')
      const idParam = urlObj.pathname.replace('/api/publish', '').replace(/^\//, '')

      // DELETE /api/publish/:id
      if (req.method === 'DELETE' && idParam) {
        const list = readPublishedIndex()
        const newList = list.filter(m => m.id !== idParam)
        writePublishedIndex(newList)
        const htmlPath = join(PUBLISHED_DIR, `${idParam}.html`)
        if (existsSync(htmlPath)) {
          const { unlinkSync } = await import('fs')
          unlinkSync(htmlPath)
        }
        sendJson(res, 200, { ok: true })
        return
      }

      // POST /api/publish  { title, html, description, author? }
      if (req.method === 'POST') {
        const body = await readBody(req)
        let payload: { title?: string; html?: string; description?: string; author?: string } = {}
        try { payload = JSON.parse(body) } catch { sendJson(res, 400, { error: 'Invalid JSON' }); return }
        const { title = '제목 없음', html = '', description = '', author = '' } = payload
        if (!html) { sendJson(res, 400, { error: 'html is required' }); return }

        // 고유 ID 생성 (timestamp + 랜덤 4자리)
        const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
        const now = new Date().toISOString()

        // HTML 파일 저장
        ensurePublishedDir()
        writeFileSync(join(PUBLISHED_DIR, `${id}.html`), html, 'utf-8')

        // 인덱스 업데이트
        const list = readPublishedIndex()
        const meta: PublishedMeta = { id, title, description, createdAt: now, author }
        list.unshift(meta)
        writePublishedIndex(list)

        sendJson(res, 200, { id, url: `/api/p/${id}` })
        return
      }

      // PUT /api/publish/:id (메타 + HTML 재출판 업데이트)
      if (req.method === 'PUT' && idParam) {
        const body = await readBody(req)
        let payload: Partial<PublishedMeta> & { html?: string } = {}
        try { payload = JSON.parse(body) } catch { sendJson(res, 400, { error: 'Invalid JSON' }); return }
        const list = readPublishedIndex()
        const idx = list.findIndex(m => m.id === idParam)
        if (idx === -1) { sendJson(res, 404, { error: 'Not found' }); return }
        // HTML 본문이 포함된 경우 파일도 갱신 (재출판)
        if (payload.html) {
          const htmlPath = join(PUBLISHED_DIR, `${idParam}.html`)
          writeFileSync(htmlPath, payload.html, 'utf-8')
          delete payload.html
        }
        list[idx] = { ...list[idx], ...payload, updatedAt: new Date().toISOString() }
        writePublishedIndex(list)
        sendJson(res, 200, { ...list[idx], url: `/api/p/${idParam}` })
        return
      }

      next(); return
    }

    // ── /api/p/:id : 출판된 문서 서빙 (GET) ────────────────────────────────────
    if (req.url?.startsWith('/api/p/') && req.method === 'GET') {
      const id = req.url.replace('/api/p/', '').split('?')[0].replace(/[^a-z0-9_]/gi, '')
      if (!id) { res.writeHead(400); res.end('id required'); return }
      const htmlPath = join(PUBLISHED_DIR, `${id}.html`)
      if (!existsSync(htmlPath)) { res.writeHead(404); res.end('Not found'); return }
      let html = readFileSync(htmlPath, 'utf-8')

      // ── 출판 페이지용 독립 FBX 뷰어 주입 ─────────────────────────────────
      // 채팅 앱(postMessage) 없이 직접 CDN Three.js로 렌더링
      const FBX_STANDALONE_SCRIPT = `
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// TGA 로더 전역 등록 (FBXLoader 내부 텍스처 로드에도 대응)
const tgaLoader = new TGALoader();
THREE.DefaultLoadingManager.addHandler(/\.tga$/i, tgaLoader);

function buildViewer(container, fbxUrl, label) {
  container.style.cssText = 'position:relative;background:#111827;border-radius:10px;overflow:hidden;border:1px solid #334155;margin:8px 0;';
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px;background:#1e293b;border-bottom:1px solid #334155;font-size:12px;font-family:monospace;color:#94a3b8;';
  hdr.textContent = '🧊 ' + (label || fbxUrl.split('/').pop());
  container.appendChild(hdr);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;height:420px;position:relative;';
  container.appendChild(wrap);

  const hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:11px;color:#64748b;pointer-events:none;z-index:10;white-space:nowrap;';
  hint.textContent = '드래그 회전 · 휠 줌 · 우클릭 이동';
  wrap.appendChild(hint);

  const W = () => wrap.clientWidth || 600;
  const H = 420;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W(), H);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  const camera = new THREE.PerspectiveCamera(45, W() / H, 0.1, 2000);
  camera.position.set(0, 100, 300);

  const ctrl = new OrbitControls(camera, renderer.domElement);
  ctrl.enableDamping = true; ctrl.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 2.0); d1.position.set(300,600,300); d1.castShadow = true; scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xaabbff, 0.8); d2.position.set(-200,200,-200); scene.add(d2);
  scene.add(new THREE.HemisphereLight(0x8899ff, 0x334155, 0.6));
  const grid = new THREE.GridHelper(600, 30, 0x334155, 0x1e293b); scene.add(grid);

  let animId = 0;
  const clock = new THREE.Clock();
  let mixer = null;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
    ctrl.update(); renderer.render(scene, camera);
  };
  animate();
  new ResizeObserver(() => { const nw = W(); camera.aspect = nw/H; camera.updateProjectionMatrix(); renderer.setSize(nw,H); }).observe(wrap);

  // 텍스처 로드 (머터리얼 인덱스 API)
  const loadTextures = async () => {
    try {
      const r = await fetch('/api/assets/materials?fbxPath=' + encodeURIComponent(fbxUrl.replace(/.*[?&]path=/, '')));
      if (!r.ok) return {};
      const d = await r.json();
      const map = {};
      for (const m of (d.materials || [])) map[m.name] = m;
      return map;
    } catch { return {}; }
  };

  const loader = new FBXLoader();
  const loading = document.createElement('div');
  loading.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(15,17,23,.85);font-size:13px;color:#94a3b8;';
  loading.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>FBX 로딩 중…</span><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  wrap.appendChild(loading);

  loadTextures().then(matMap => {
    loader.load(fbxUrl, (fbx) => {
      const box = new THREE.Box3().setFromObject(fbx);
      const sz = box.getSize(new THREE.Vector3());
      const ctr = box.getCenter(new THREE.Vector3());
      const md = Math.max(sz.x, sz.y, sz.z);
      const fov = camera.fov * Math.PI / 180;
      const dist = Math.abs(md / 2 / Math.tan(fov / 2)) * 1.6;
      fbx.position.sub(ctr);
      grid.position.y = -sz.y / 2;
      camera.position.set(0, md * 0.4, dist);
      camera.lookAt(0, 0, 0);
      ctrl.target.set(0,0,0); ctrl.maxDistance = dist * 5; ctrl.update();

      const texLoader = new THREE.TextureLoader();
      // TGA: TGALoader가 내부적으로 방향 처리 → flipY=false
      // PNG/JPG 등: TextureLoader 표준 → flipY=true
      const loadTex = (url, onLoad) => {
        const isTga = /\.tga$/i.test(url);
        const loader = isTga ? tgaLoader : texLoader;
        loader.load(url, (t) => {
          t.flipY = !isTga; // TGA=false, 나머지=true
          onLoad(t);
        }, undefined, (e) => console.warn('tex load fail:', url, e));
      };

      fbx.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true; child.receiveShadow = true;
        const keys = Object.keys(matMap);
        const mn = child.name.toLowerCase();
        const entry = keys.find(k => mn.includes(k.toLowerCase()) || k.toLowerCase().includes(mn));
        const m = entry ? matMap[entry] : Object.values(matMap)[0];
        const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.75, metalness: 0.1 });
        if (m && m.albedo) {
          loadTex(m.albedo, t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; });
        } else { mat.color.set(0x8899bb); }
        if (m && m.normal) {
          loadTex(m.normal, t => { t.colorSpace = THREE.NoColorSpace; mat.normalMap = t; mat.normalScale.set(1,-1); mat.needsUpdate = true; });
        }
        child.material = mat;
      });
      if (fbx.animations.length) { mixer = new THREE.AnimationMixer(fbx); mixer.clipAction(fbx.animations[0]).play(); }
      scene.add(fbx);
      loading.remove();
      hdr.textContent = '🧊 ' + (label || fbxUrl.split('/').pop()) + '  ✓';
    }, undefined, (e) => {
      loading.innerHTML = '<span style="color:#f87171">FBX 로드 실패: ' + e.message + '</span>';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fbx-viewer[data-src],[data-fbx]').forEach(el => {
    const src = el.getAttribute('data-src') || el.getAttribute('data-fbx');
    const label = el.getAttribute('data-label') || '';
    if (src) buildViewer(el, src, label);
  });
});
</script>`

      // </head> 앞에 스크립트 주입
      if (html.includes('</head>')) {
        html = html.replace('</head>', FBX_STANDALONE_SCRIPT + '\n</head>')
      } else {
        html = FBX_STANDALONE_SCRIPT + html
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' })
      res.end(html)
      return
    }

    if (!req.url?.startsWith('/api/git/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const route = url.pathname.replace('/api/git/', '')

        // ?repo=aegis 이면 두 번째 저장소 디렉토리 사용
        const repoParam = url.searchParams.get('repo') || 'data'
        const isRepo2 = repoParam === 'aegis' && !!options.repo2LocalDir
        const activeDir = isRepo2 ? options.repo2LocalDir! : localDir
        const activeRepoUrl = isRepo2 ? (options.repo2Url || options.repoUrl) : options.repoUrl
        const activeToken = isRepo2 ? (options.repo2Token || options.token) : options.token

        try {
          if (route === 'sync' && req.method === 'POST') {
            const raw = await readBody(req)
            const body = raw ? JSON.parse(raw) : {}
            const repoUrl = body.repoUrl || activeRepoUrl
            const token = body.token || activeToken
            const branch = body.branch || 'main'
            const authUrl = buildAuthUrl(repoUrl, token)

            const isCloned = existsSync(join(activeDir, '.git'))

            if (!isCloned) {
              mkdirSync(activeDir, { recursive: true })
              runGit(`git clone --branch ${branch} "${authUrl}" .`, activeDir)
              sendJson(res, 200, { status: 'cloned', message: 'Repository cloned successfully' })
            } else {
              runGit(`git remote set-url origin "${authUrl}"`, activeDir)
              runGit(`git fetch origin ${branch}:refs/remotes/origin/${branch}`, activeDir)
              const localHead = runGit('git rev-parse HEAD', activeDir)
              const remoteHead = runGit(`git rev-parse origin/${branch}`, activeDir)

              if (localHead === remoteHead) {
                sendJson(res, 200, { status: 'up-to-date', message: 'Already up to date', commit: localHead.substring(0, 8) })
              } else {
                runGit(`git reset --hard origin/${branch}`, activeDir)
                const newHead = runGit('git rev-parse HEAD', activeDir)
                sendJson(res, 200, { status: 'updated', message: 'Pulled latest changes', commit: newHead.substring(0, 8) })
              }
            }
            return
          }

          if (route === 'status' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) {
              sendJson(res, 200, { cloned: false })
              return
            }
            const head = runGit('git rev-parse --short HEAD', activeDir)
            const date = runGit('git log -1 --format=%ci', activeDir)
            const msg = runGit('git log -1 --format=%s', activeDir)
            sendJson(res, 200, { cloned: true, commit: head, date, message: msg })
            return
          }

          if (route === 'files' && req.method === 'GET') {
            const dirPath = url.searchParams.get('path') || ''
            const fullDir = resolve(activeDir, dirPath)

            if (!existsSync(fullDir)) {
              sendJson(res, 404, { error: `Directory not found: ${dirPath}` })
              return
            }

            const xlsxFiles = collectXlsxFiles(fullDir)
            const files = xlsxFiles.map((fp) => {
              const data = readFileSync(fp)
              const name = fp.split(/[\\/]/).pop()!
              return { name, base64: data.toString('base64') }
            })

            sendJson(res, 200, { count: files.length, files })
            return
          }

          if (route === 'log' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { commits: [] }); return }

            const count = url.searchParams.get('count') || '30'
            const filterPath = url.searchParams.get('path') || ''
            const includeFiles = url.searchParams.get('include_files') === 'true'
            const SEP = '|||'
            const COMMIT_MARK = '__COMMIT__'

            try {
              let commits: object[]

              if (includeFiles) {
                // --name-only 포함: COMMIT_MARK 구분자로 분리 파싱
                const args = [
                  'log', `-${count}`,
                  `--pretty=format:${COMMIT_MARK}%H${SEP}%h${SEP}%ci${SEP}%an${SEP}%s`,
                  '--name-only',
                ]
                if (filterPath) { args.push('--'); args.push(filterPath) }
                const raw = execFileSync('git', args, {
                  cwd: activeDir, encoding: 'utf-8', timeout: 120_000,
                  stdio: ['pipe', 'pipe', 'pipe'],
                }).trim()

                // 블록 단위로 분리
                const blocks = raw.split(new RegExp(`(?=${COMMIT_MARK})`)).filter(Boolean)
                commits = blocks.map((block) => {
                  const lines = block.split('\n').filter(Boolean)
                  const header = lines[0].replace(COMMIT_MARK, '')
                  const parts = header.split(SEP)
                  const files = lines.slice(1).filter((l) => l && !l.startsWith(COMMIT_MARK))
                  return {
                    hash: parts[0] || '',
                    short: parts[1] || '',
                    date: parts[2] || '',
                    author: parts[3] || '',
                    message: parts.slice(4).join(SEP),
                    files,
                    repo: repoParam,
                  }
                })
              } else {
                const args = ['log', `-${count}`, `--format=%H${SEP}%h${SEP}%ci${SEP}%an${SEP}%s`]
                if (filterPath) { args.push('--'); args.push(filterPath) }
                const raw = execFileSync('git', args, {
                  cwd: activeDir, encoding: 'utf-8', timeout: 120_000,
                  stdio: ['pipe', 'pipe', 'pipe'],
                }).trim()
                commits = raw.split('\n').filter(Boolean).map((line) => {
                  const parts = line.split(SEP)
                  return {
                    hash: parts[0] || '',
                    short: parts[1] || '',
                    date: parts[2] || '',
                    author: parts[3] || '',
                    message: parts.slice(4).join(SEP),
                    repo: repoParam,
                  }
                })
              }

              sendJson(res, 200, { commits, repo: repoParam })
            } catch (err: any) {
              sendJson(res, 500, { error: err.stderr || err.message || String(err) })
            }
            return
          }

          if (route === 'diff' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { changes: [] }); return }

            const from = url.searchParams.get('from') || 'HEAD~1'
            const to = url.searchParams.get('to') || 'HEAD'
            const path = url.searchParams.get('path') || ''
            const pathArg = path ? ` -- "${path}"` : ''
            const raw = runGit(
              `git diff --name-status ${from} ${to}${pathArg}`,
              activeDir
            )
            const changes = raw.split('\n').filter(Boolean).map((line) => {
              const [status, ...rest] = line.split('\t')
              return { status: status.trim(), file: rest.join('\t').trim() }
            })

            // Get stat summary
            let statSummary = ''
            try {
              statSummary = runGit(`git diff --stat ${from} ${to}${pathArg}`, activeDir)
            } catch { /* ignore */ }

            sendJson(res, 200, { from, to, changes, statSummary })
            return
          }

          if (route === 'diff-detail' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { diff: '' }); return }

            const from = url.searchParams.get('from') || 'HEAD~1'
            const to = url.searchParams.get('to') || 'HEAD'
            const filePath = url.searchParams.get('file') || ''
            if (!filePath) { sendJson(res, 400, { error: 'file param required' }); return }

            let diff = ''
            try {
              diff = runGit(`git diff ${from} ${to} -- "${filePath}"`, activeDir)
            } catch { /* binary or missing */ }

            sendJson(res, 200, { diff })
            return
          }

          // ── commit-diff: 특정 커밋의 변경 내용 파싱 반환 ────────────────────
          if (route === 'commit-diff' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { commit: null, files: [] }); return }

            const hash = url.searchParams.get('hash')
            if (!hash) { sendJson(res, 400, { error: 'hash param required' }); return }
            const filterFile = url.searchParams.get('file') || ''

            try {
              // 커밋 메타 정보
              const SEP = '|||'
              const metaRaw = execFileSync('git', [
                'log', '-1', `--format=%H${SEP}%h${SEP}%ci${SEP}%an${SEP}%ae${SEP}%s`, hash
              ], { cwd: activeDir, encoding: 'utf-8', timeout: 30_000, stdio: ['pipe','pipe','pipe'] }).trim()
              const metaParts = metaRaw.split(SEP)
              const commitMeta = {
                hash: metaParts[0] || hash,
                short: metaParts[1] || hash.slice(0, 8),
                date: metaParts[2] || '',
                author: metaParts[3] || '',
                email: metaParts[4] || '',
                message: metaParts.slice(5).join(SEP),
              }

              // 부모 해시 (초기 커밋은 부모 없음)
              let parentHash = ''
              try {
                parentHash = execFileSync('git', ['rev-parse', `${hash}^`], {
                  cwd: activeDir, encoding: 'utf-8', timeout: 10_000, stdio: ['pipe','pipe','pipe']
                }).trim()
              } catch { /* initial commit */ }

              // unified diff 생성
              const diffArgs = parentHash
                ? ['diff', '--unified=3', parentHash, hash]
                : ['show', '--unified=3', '--format=', hash]
              if (filterFile) { diffArgs.push('--'); diffArgs.push(filterFile) }

              const diffRaw = execFileSync('git', diffArgs, {
                cwd: activeDir, encoding: 'utf-8', timeout: 60_000, stdio: ['pipe','pipe','pipe'],
                maxBuffer: 4 * 1024 * 1024,
              }).trim()

              // 통합 diff 파싱 → 파일 배열
              interface DiffLine { type: 'context' | 'add' | 'del'; content: string }
              interface DiffHunk { header: string; lines: DiffLine[] }
              interface DiffFile { path: string; oldPath: string; status: string; additions: number; deletions: number; hunks: DiffHunk[]; binary: boolean }
              const files: DiffFile[] = []
              let cur: DiffFile | null = null
              let curHunk: DiffHunk | null = null

              for (const rawLine of diffRaw.split('\n')) {
                if (rawLine.startsWith('diff --git ')) {
                  if (cur) files.push(cur)
                  cur = { path: '', oldPath: '', status: 'M', additions: 0, deletions: 0, hunks: [], binary: false }
                  curHunk = null
                  const m = rawLine.match(/diff --git a\/(.*) b\/(.*)/)
                  if (m && cur) { cur.oldPath = m[1]; cur.path = m[2] }
                } else if (rawLine.startsWith('new file mode') && cur) {
                  cur.status = 'A'
                } else if (rawLine.startsWith('deleted file mode') && cur) {
                  cur.status = 'D'
                } else if (rawLine.startsWith('rename to ') && cur) {
                  cur.path = rawLine.slice(10)
                  cur.status = 'R'
                } else if (rawLine.startsWith('Binary files') && cur) {
                  cur.binary = true
                } else if (rawLine.startsWith('+++ b/') && cur && !cur.path) {
                  cur.path = rawLine.slice(6)
                } else if (rawLine.startsWith('@@ ') && cur) {
                  curHunk = { header: rawLine.split(' @@')[0] + ' @@', lines: [] }
                  cur.hunks.push(curHunk)
                } else if (curHunk && cur) {
                  if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
                    curHunk.lines.push({ type: 'add', content: rawLine.slice(1) })
                    cur.additions++
                  } else if (rawLine.startsWith('-') && !rawLine.startsWith('---')) {
                    curHunk.lines.push({ type: 'del', content: rawLine.slice(1) })
                    cur.deletions++
                  } else if (!rawLine.startsWith('\\')) {
                    curHunk.lines.push({ type: 'context', content: rawLine.slice(1) })
                  }
                }
              }
              if (cur) files.push(cur)

              // 파일 수가 많으면 최대 20개로 제한 (채팅 임베드용)
              const MAX_FILES = filterFile ? files.length : Math.min(files.length, 20)
              sendJson(res, 200, { commit: commitMeta, files: files.slice(0, MAX_FILES), totalFiles: files.length })
            } catch (err: any) {
              sendJson(res, 500, { error: err.stderr || err.message || String(err) })
            }
            return
          }

          if (route === 'files-at-commit' && req.method === 'GET') {
            const isCloned = existsSync(join(activeDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { files: [] }); return }

            const commit = url.searchParams.get('commit') || 'HEAD'
            const dirPath = url.searchParams.get('path') || ''
            const cacheKey = `${repoParam}:${commit}:${dirPath}`

            const cached = fileCache.get(cacheKey)
            if (cached) { sendJson(res, 200, cached); return }

            try {
              // List ALL files at commit, then filter case-insensitively
              const lsArgs = ['ls-tree', '-r', '--name-only', commit]
              const listing = execFileSync('git', lsArgs, {
                cwd: activeDir, encoding: 'utf-8', timeout: 60_000,
                stdio: ['pipe', 'pipe', 'pipe'],
              }).trim()

              const dirLower = dirPath.toLowerCase()
              const allFiles = listing.split('\n').filter((f) => {
                if (!f.endsWith('.xlsx') || f.includes('~$')) return false
                if (dirLower && !f.toLowerCase().startsWith(dirLower + '/') && !f.toLowerCase().startsWith(dirLower + '\\')) return false
                return true
              })

              const CONCURRENCY = 8
              const files: { name: string; path: string; base64: string }[] = []

              for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
                const batch = allFiles.slice(i, i + CONCURRENCY)
                const results = await Promise.all(batch.map(async (filePath) => {
                  const { stdout } = await execFileAsync('git', ['show', `${commit}:${filePath}`], {
                    cwd: activeDir, timeout: 60_000,
                    encoding: 'buffer' as any,
                  })
                  const name = filePath.split('/').pop()!
                  return { name, path: filePath, base64: (stdout as unknown as Buffer).toString('base64') }
                }))
                files.push(...results)
              }

              const result = { commit, count: files.length, files }
              if (files.length > 0) fileCache.set(cacheKey, result)
              sendJson(res, 200, result)
            } catch (err: any) {
              sendJson(res, 500, { error: err.stderr?.toString() || err.message || String(err) })
            }
            return
          }

          sendJson(res, 404, { error: 'Unknown route' })
        } catch (err: any) {
          sendJson(res, 500, { error: err.message || String(err) })
        }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── SERVER-SIDE CHAT API (/api/v1/*)  ────────────────────────────────────────
// 외부 사용자가 HTTP API로 챗봇 기능을 사용할 수 있는 엔드포인트
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatSession {
  id: string
  messages: Array<{ role: 'user' | 'assistant'; content: unknown }>
  created: string
  updated: string
  messageCount: number
}

interface ServerTableData {
  headers: string[]
  rows: Record<string, string>[]
}

// ── 서버사이드 데이터 캐시 ──
let _serverDataLoaded = false
let _serverTableData: Map<string, ServerTableData> = new Map()
let _serverSchemaDesc = '' // 테이블/컬럼 설명 텍스트 (Claude 프롬프트용)
let _serverTableList: Array<{ name: string; columns: string[]; rowCount: number }> = []

// ── 세션 저장소 ──
const SESSIONS_DIR = resolve(process.cwd(), 'published', 'sessions')
const _sessions = new Map<string, ChatSession>()

function ensureSessionsDir() {
  if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true })
}

function saveSession(s: ChatSession) {
  ensureSessionsDir()
  writeFileSync(join(SESSIONS_DIR, `${s.id}.json`), JSON.stringify(s, null, 2), 'utf-8')
}

function loadSessionFromDisk(id: string): ChatSession | null {
  const p = join(SESSIONS_DIR, `${id}.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { return null }
}

function getOrCreateSession(id?: string): ChatSession {
  if (id) {
    let s = _sessions.get(id)
    if (s) return s
    s = loadSessionFromDisk(id) ?? undefined
    if (s) { _sessions.set(id, s); return s }
  }
  const newId = id || `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const s: ChatSession = { id: newId, messages: [], created: new Date().toISOString(), updated: new Date().toISOString(), messageCount: 0 }
  _sessions.set(newId, s)
  return s
}

// ── 서버사이드 xlsx 데이터 로딩 ──
function loadServerData(gitRepoDir: string) {
  if (_serverDataLoaded) return
  console.log('[ChatAPI] 서버사이드 데이터 로딩 시작...')
  const t0 = Date.now()
  try {
    // xlsx 라이브러리 동적 로딩 (vite plugin은 Node.js ESM 컨텍스트)
    const XLSX = _require('xlsx')
    const xlsxFiles = collectXlsxFiles(gitRepoDir)
    const tableList: typeof _serverTableList = []

    for (const fp of xlsxFiles) {
      try {
        const buf = readFileSync(fp)
        const wb = XLSX.read(buf, { type: 'buffer' })
        const fileName = fp.split(/[\\/]/).pop()!.replace(/\.xlsx$/i, '').replace(/^DataDefine_/i, '')

        for (const sheetName of wb.SheetNames) {
          if (/^(Define|Enum|TableGroup|Ref)$/i.test(sheetName)) continue
          const ws = wb.Sheets[sheetName]
          if (!ws) continue
          const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]
          if (jsonRows.length === 0) continue

          const headers = Object.keys(jsonRows[0]).map(h => String(h))
          const rows = jsonRows.map((r: Record<string, unknown>) => {
            const row: Record<string, string> = {}
            for (const h of headers) row[h] = r[h] != null ? String(r[h]) : ''
            return row
          })

          // 테이블명: 시트 1개짜리 파일은 파일명, 여러 시트는 '파일명_시트명'
          const tableName = wb.SheetNames.length === 1 || sheetName === 'Sheet1'
            ? fileName
            : `${fileName}_${sheetName}`

          _serverTableData.set(tableName.toLowerCase(), { headers, rows })
          tableList.push({ name: tableName, columns: headers, rowCount: rows.length })
        }
      } catch (e) {
        console.warn(`[ChatAPI] xlsx 파싱 실패: ${fp}`, e)
      }
    }

    _serverTableList = tableList

    // 스키마 설명 텍스트 빌드
    const lines: string[] = ['사용 가능한 게임 데이터 테이블:']
    for (const t of tableList) {
      lines.push(`\n${t.name} (${t.rowCount}행)`)
      lines.push(`  컬럼: ${t.columns.join(', ')}`)
      const tableEntry = _serverTableData.get(t.name.toLowerCase())
      if (tableEntry && tableEntry.rows.length > 0) {
        const sample = tableEntry.rows[0]
        const sampleStr = t.columns.slice(0, 6).map(h => `${h}=${JSON.stringify(sample[h] ?? '')}`).join(', ')
        lines.push(`  샘플: ${sampleStr}${t.columns.length > 6 ? ' ...' : ''}`)
      }
    }
    _serverSchemaDesc = lines.join('\n')
    _serverDataLoaded = true
    console.log(`[ChatAPI] 데이터 로딩 완료: ${tableList.length}개 테이블, ${tableList.reduce((s, t) => s + t.rowCount, 0)}행 (${Date.now() - t0}ms)`)
  } catch (e) {
    console.error('[ChatAPI] 데이터 로딩 실패:', e)
  }
}

// ── 서버사이드 SQL 실행 (alasql) ──
function serverExecuteSQL(sql: string): { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; error?: string } {
  try {
    const alasql = _require('alasql')
    // 테이블 등록 (대소문자 무관하게 검색 가능하도록 원본명 + 소문자 + 대문자 모두 등록)
    for (const [key, { rows }] of _serverTableData) {
      const normalizedRows = rows.map(row => {
        const r: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) r[k.toLowerCase()] = v
        return r
      })
      // key는 이미 소문자. _serverTableList에서 원본명을 찾음
      const original = _serverTableList.find(t => t.name.toLowerCase() === key)?.name ?? key
      for (const tName of new Set([key, original, original.toUpperCase()])) {
        if (!alasql.tables[tName]) alasql(`CREATE TABLE IF NOT EXISTS \`${tName}\``)
        alasql.tables[tName].data = normalizedRows
      }
    }
    // 주석 제거
    const cleaned = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (!cleaned) return { columns: [], rows: [], rowCount: 0, error: 'SQL이 비어 있습니다.' }
    // 식별자 정규화 (" → `, 따옴표 없는 #컬럼 → `#컬럼`)
    let processed = cleaned.replace(/"([^"]+)"/g, '`$1`')
    processed = processed.replace(/(?<!`)#(\w+)/g, '`#$1`')
    const result = alasql(processed) as Record<string, unknown>[]
    if (!Array.isArray(result)) return { columns: [], rows: [], rowCount: 0, error: 'SELECT 문만 지원합니다.' }
    const columns = result.length > 0 ? Object.keys(result[0]) : []
    return { columns, rows: result, rowCount: result.length }
  } catch (e: unknown) {
    return { columns: [], rows: [], rowCount: 0, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── 서버사이드 Claude 직접 호출 ──
function serverCallClaude(
  apiKey: string,
  body: object,
): Promise<{ content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>; stop_reason: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = httpsRequest({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (proxyRes) => {
      let data = ''
      proxyRes.on('data', (chunk: Buffer) => { data += chunk.toString() })
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)))
          else resolve(parsed)
        } catch { reject(new Error(`Claude API 응답 파싱 실패: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

// ── 서버사이드 Claude SSE 스트리밍 호출 ──
function serverStreamClaude(
  apiKey: string,
  body: object,
  res: ServerResponse,
  onToolUse: (blocks: Array<{ type: string; id: string; name: string; input: Record<string, unknown> }>) => void,
): Promise<{ content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>; stop_reason: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ ...body, stream: true })
    const blocks: Record<number, { type: string; text?: string; id?: string; name?: string; _inputStr?: string; input?: Record<string, unknown> }> = {}
    let stopReason = 'end_turn'
    let buf = ''

    const proxyReq = httpsRequest({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (proxyRes) => {
      proxyRes.on('data', (chunk: Buffer) => {
        buf += chunk.toString()
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw || raw === '[DONE]') continue
          let ev: Record<string, unknown>
          try { ev = JSON.parse(raw) } catch { continue }

          switch (ev.type) {
            case 'content_block_start': {
              const idx = ev.index as number
              const cb = ev.content_block as Record<string, unknown>
              blocks[idx] = { type: cb.type as string, id: cb.id as string, name: cb.name as string, text: (cb.text as string) || '', _inputStr: '' }
              break
            }
            case 'content_block_delta': {
              const idx = ev.index as number
              const delta = ev.delta as { type: string; text?: string; partial_json?: string }
              const b = blocks[idx]
              if (!b) break
              if (delta.type === 'text_delta') {
                b.text = (b.text || '') + (delta.text ?? '')
                // SSE: 텍스트 스트리밍
                res.write(`event: text_delta\ndata: ${JSON.stringify({ delta: delta.text, full_text: b.text })}\n\n`)
              } else if (delta.type === 'input_json_delta') {
                b._inputStr = (b._inputStr || '') + (delta.partial_json ?? '')
              }
              break
            }
            case 'content_block_stop': {
              const idx = ev.index as number
              const b = blocks[idx]
              if (b?.type === 'tool_use' && b._inputStr) {
                try { b.input = JSON.parse(b._inputStr) } catch { b.input = {} }
              }
              break
            }
            case 'message_delta': {
              const delta = ev.delta as { stop_reason?: string }
              if (delta.stop_reason) stopReason = delta.stop_reason
              break
            }
          }
        }
      })
      proxyRes.on('end', () => {
        const contentArray = Object.entries(blocks)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, b]) => {
            const { _inputStr, ...clean } = b
            void _inputStr
            return clean
          })
        resolve({ content: contentArray, stop_reason: stopReason })
      })
      proxyRes.on('error', reject)
    })
    proxyReq.on('error', reject)
    proxyReq.write(payload)
    proxyReq.end()
  })
}

// ── 서버사이드 Tool 정의 (API용 — UI 전용 툴 제외) ──
const API_TOOLS = [
  {
    name: 'query_game_data',
    description: '게임 데이터베이스에서 SQL SELECT 쿼리를 실행하여 실제 데이터를 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: '실행할 SQL SELECT 쿼리. 모든 값은 문자열입니다.' },
        reason: { type: 'string', description: '이 쿼리를 실행하는 이유.' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'show_table_schema',
    description: '테이블의 스키마 구조(컬럼, 타입, 행 수)를 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: { type: 'string', description: '스키마를 볼 테이블 이름' },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'query_git_history',
    description: 'Git 히스토리를 검색합니다 (변경 이력, 커밋 로그).',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색 키워드 (커밋 메시지, 파일명 등)' },
        count: { type: 'number', description: '조회할 커밋 수 (기본 10)' },
        file_path: { type: 'string', description: '특정 파일 경로로 필터링' },
      },
      required: [],
    },
  },
  {
    name: 'create_artifact',
    description: 'HTML 문서/보고서를 생성합니다. 분석 결과를 정리된 문서로 제공할 때 사용.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '문서 제목' },
        description: { type: 'string', description: '문서 설명' },
        html: { type: 'string', description: '완전한 HTML 콘텐츠' },
      },
      required: ['title', 'html'],
    },
  },
]

// ── 서버사이드 Tool 실행 ──
function serverExecuteTool(
  toolName: string,
  input: Record<string, unknown>,
  options: GitPluginOptions,
): { result: string; data?: unknown } {
  switch (toolName) {
    case 'query_game_data': {
      const sql = String(input.sql ?? '')
      const qr = serverExecuteSQL(sql)
      if (qr.error) return { result: `SQL 오류: ${qr.error}` }
      if (qr.rowCount === 0) return { result: '결과 없음 (0행)' }
      const data = { rowCount: qr.rowCount, columns: qr.columns, rows: qr.rows.slice(0, 100) }
      return { result: JSON.stringify(data), data }
    }
    case 'show_table_schema': {
      const tableName = String(input.table_name ?? '').toLowerCase()
      const tableEntry = _serverTableData.get(tableName)
      const listEntry = _serverTableList.find(t => t.name.toLowerCase() === tableName)
      if (!tableEntry || !listEntry) return { result: `테이블 "${input.table_name}" 을(를) 찾을 수 없습니다. 사용 가능: ${_serverTableList.map(t => t.name).join(', ')}` }
      const info = { name: listEntry.name, columns: listEntry.columns, rowCount: listEntry.rowCount, sample: tableEntry.rows.slice(0, 2) }
      return { result: JSON.stringify(info), data: info }
    }
    case 'query_git_history': {
      const keyword = String(input.keyword ?? '')
      const count = Number(input.count ?? 10)
      const filePath = input.file_path ? String(input.file_path) : undefined
      try {
        const dir = options.localDir
        if (!existsSync(join(dir, '.git'))) return { result: 'Git 저장소가 없습니다.' }
        let cmd = `git log --oneline -n ${count}`
        if (keyword) cmd += ` --grep="${keyword.replace(/"/g, '\\"')}"`
        if (filePath) cmd += ` -- "${filePath}"`
        const log = runGit(cmd, dir)
        const commits = log.split('\n').filter(Boolean).map(line => {
          const [hash, ...rest] = line.split(' ')
          return { hash, message: rest.join(' ') }
        })
        return { result: JSON.stringify({ count: commits.length, commits }), data: commits }
      } catch (e) {
        return { result: `Git 조회 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }
    case 'create_artifact': {
      const html = String(input.html ?? '')
      const title = String(input.title ?? '')
      return { result: `아티팩트 생성 완료: "${title}" (${html.length}자)`, data: { title, html, charCount: html.length } }
    }
    default:
      return { result: `알 수 없는 도구: ${toolName}` }
  }
}

// ── 서버사이드 시스템 프롬프트 ──
function buildServerSystemPrompt(): string {
  const lines: string[] = []
  lines.push('당신은 게임 데이터 전문 어시스턴트입니다.')
  lines.push('사용자의 질문에 답하기 위해 아래 도구들을 적극 활용하세요:')
  lines.push('- query_game_data: 실제 게임 데이터를 SQL로 조회')
  lines.push('- show_table_schema: 테이블 구조 조회')
  lines.push('- query_git_history: Git 변경 이력 조회')
  lines.push('- create_artifact: HTML 문서/보고서 생성')
  lines.push('')
  lines.push(_serverSchemaDesc)
  return lines.join('\n')
}

// ── Chat API 미들웨어 ──
function createChatApiMiddleware(options: GitPluginOptions) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/v1/')) return next()

    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    const apiKey = options.claudeApiKey || process.env.CLAUDE_API_KEY || ''

    // ── GET /api/v1/docs : API 문서 ──
    if (path === '/api/v1/docs' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(generateApiDocs())
      return
    }

    // ── GET /api/v1/tables : 테이블 목록 ──
    if (path === '/api/v1/tables' && req.method === 'GET') {
      loadServerData(options.localDir)
      sendJson(res, 200, { tables: _serverTableList, total: _serverTableList.length })
      return
    }

    // ── GET /api/v1/sessions : 세션 목록 ──
    if (path === '/api/v1/sessions' && req.method === 'GET') {
      ensureSessionsDir()
      const files = existsSync(SESSIONS_DIR) ? readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json')) : []
      const sessions = files.map(f => {
        try {
          const s = JSON.parse(readFileSync(join(SESSIONS_DIR, f), 'utf-8')) as ChatSession
          return { id: s.id, created: s.created, updated: s.updated, messageCount: s.messageCount }
        } catch { return null }
      }).filter(Boolean)
      sendJson(res, 200, { sessions, total: sessions.length })
      return
    }

    // ── GET /api/v1/sessions/:id : 세션 상세 ──
    const sessionMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)$/)
    if (sessionMatch && req.method === 'GET') {
      const s = _sessions.get(sessionMatch[1]) || loadSessionFromDisk(sessionMatch[1])
      if (!s) { sendJson(res, 404, { error: 'Session not found' }); return }
      sendJson(res, 200, { session: s })
      return
    }

    // ── DELETE /api/v1/sessions/:id : 세션 삭제 ──
    if (sessionMatch && req.method === 'DELETE') {
      _sessions.delete(sessionMatch[1])
      const fp = join(SESSIONS_DIR, `${sessionMatch[1]}.json`)
      if (existsSync(fp)) unlinkSync(fp)
      sendJson(res, 200, { deleted: true })
      return
    }

    // ── POST /api/v1/chat : 채팅 메시지 전송 ──
    if (path === '/api/v1/chat' && req.method === 'POST') {
      if (!apiKey) { sendJson(res, 400, { error: 'CLAUDE_API_KEY가 설정되지 않았습니다.' }); return }

      loadServerData(options.localDir)

      let body: { message?: string; session_id?: string; stream?: boolean }
      try {
        const raw = await readBody(req)
        body = JSON.parse(raw || '{}')
      } catch { sendJson(res, 400, { error: 'Invalid JSON body' }); return }

      const userMessage = body.message?.trim()
      if (!userMessage) { sendJson(res, 400, { error: '"message" field is required' }); return }

      const session = getOrCreateSession(body.session_id)
      const isStream = body.stream === true
      const MAX_ITERATIONS = 8
      const systemPrompt = buildServerSystemPrompt()

      // Claude messages 빌드 (히스토리 + 새 메시지)
      const messages: Array<{ role: string; content: unknown }> = [
        ...session.messages,
        { role: 'user', content: userMessage },
      ]

      const allToolCalls: Array<{ tool: string; input: unknown; result: unknown }> = []

      if (isStream) {
        // ── SSE 스트리밍 모드 ──
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Accel-Buffering': 'no',
        })
        res.socket?.setNoDelay(true)
        res.flushHeaders()
        res.write(`event: session\ndata: ${JSON.stringify({ session_id: session.id })}\n\n`)

        try {
          for (let i = 0; i < MAX_ITERATIONS; i++) {
            res.write(`event: thinking\ndata: ${JSON.stringify({ iteration: i + 1, max: MAX_ITERATIONS })}\n\n`)

            const data = await serverStreamClaude(
              apiKey,
              { model: 'claude-sonnet-4-20250514', max_tokens: 8192, system: systemPrompt, tools: API_TOOLS, messages },
              res,
              () => {}, // tool_use 처리는 아래에서
            )

            if (data.stop_reason === 'end_turn' || data.stop_reason === 'stop_sequence') {
              const text = data.content.filter(b => b.type === 'text').map(b => b.text ?? '').join('\n')
              session.messages.push({ role: 'user', content: userMessage })
              session.messages.push({ role: 'assistant', content: text })
              session.messageCount += 2
              session.updated = new Date().toISOString()
              saveSession(session)

              res.write(`event: done\ndata: ${JSON.stringify({ session_id: session.id, content: text, tool_calls: allToolCalls })}\n\n`)
              res.end()
              return
            }

            if (data.stop_reason === 'tool_use') {
              const toolBlocks = data.content.filter(b => b.type === 'tool_use')
              messages.push({ role: 'assistant', content: data.content })
              const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = []

              for (const tb of toolBlocks) {
                res.write(`event: tool_start\ndata: ${JSON.stringify({ tool: tb.name, input: tb.input })}\n\n`)
                const { result, data: toolData } = serverExecuteTool(tb.name!, tb.input ?? {}, options)
                allToolCalls.push({ tool: tb.name!, input: tb.input, result: toolData ?? result })
                toolResults.push({ type: 'tool_result', tool_use_id: tb.id!, content: result })
                res.write(`event: tool_done\ndata: ${JSON.stringify({ tool: tb.name, summary: result.slice(0, 200) })}\n\n`)
              }
              messages.push({ role: 'user', content: toolResults })
              continue
            }

            // max_tokens 등
            break
          }

          const text = messages.filter(m => m.role === 'assistant').map(m => typeof m.content === 'string' ? m.content : '').join('\n')
          res.write(`event: done\ndata: ${JSON.stringify({ session_id: session.id, content: text, tool_calls: allToolCalls })}\n\n`)
          res.end()
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          res.write(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`)
          res.end()
        }
        return
      }

      // ── 비스트리밍 모드 ──
      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const data = await serverCallClaude(apiKey, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            system: systemPrompt,
            tools: API_TOOLS,
            messages,
          })

          if (data.stop_reason === 'end_turn' || data.stop_reason === 'stop_sequence') {
            const text = data.content.filter(b => b.type === 'text').map(b => b.text ?? '').join('\n')
            session.messages.push({ role: 'user', content: userMessage })
            session.messages.push({ role: 'assistant', content: text })
            session.messageCount += 2
            session.updated = new Date().toISOString()
            saveSession(session)

            sendJson(res, 200, {
              session_id: session.id,
              content: text,
              tool_calls: allToolCalls,
              model: 'claude-sonnet-4-20250514',
            })
            return
          }

          if (data.stop_reason === 'tool_use') {
            const toolBlocks = data.content.filter(b => b.type === 'tool_use')
            messages.push({ role: 'assistant', content: data.content })
            const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = []

            for (const tb of toolBlocks) {
              const { result, data: toolData } = serverExecuteTool(tb.name!, tb.input ?? {}, options)
              allToolCalls.push({ tool: tb.name!, input: tb.input, result: toolData ?? result })
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id!, content: result })
            }
            messages.push({ role: 'user', content: toolResults })
            continue
          }
          break
        }
        sendJson(res, 200, { session_id: session.id, content: '(max iterations reached)', tool_calls: allToolCalls })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        sendJson(res, 500, { error: msg })
      }
      return
    }

    // ── POST /api/v1/query : SQL 직접 실행 ──
    if (path === '/api/v1/query' && req.method === 'POST') {
      loadServerData(options.localDir)
      let body: { sql?: string }
      try {
        const raw = await readBody(req)
        body = JSON.parse(raw || '{}')
      } catch { sendJson(res, 400, { error: 'Invalid JSON body' }); return }
      if (!body.sql) { sendJson(res, 400, { error: '"sql" field is required' }); return }
      const result = serverExecuteSQL(body.sql)
      sendJson(res, 200, result)
      return
    }

    next()
  }
}

// ── API 문서 HTML 생성 ──
function generateApiDocs(): string {
  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TableMaster Chat API v1</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f1117;color:#e2e8f0;line-height:1.6;padding:2rem}
h1{font-size:2em;color:#fff;margin-bottom:.5em;border-bottom:2px solid #6366f1;padding-bottom:.5em}
h2{font-size:1.4em;color:#c7d2fe;margin:2em 0 .5em}
h3{font-size:1.1em;color:#a5b4fc;margin:1.5em 0 .3em}
.endpoint{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin:16px 0}
.method{display:inline-block;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;margin-right:8px}
.get{background:#059669;color:#fff}.post{background:#6366f1;color:#fff}.delete{background:#dc2626;color:#fff}
.url{font-family:monospace;font-size:14px;color:#818cf8}
p{margin:.5em 0;color:#94a3b8}
code{background:#0d1117;padding:2px 6px;border-radius:4px;font-size:13px;color:#a5b4fc;font-family:monospace}
pre{background:#0d1117;border:1px solid #334155;border-radius:8px;padding:16px;overflow-x:auto;font-size:13px;line-height:1.5;margin:.8em 0}
pre code{background:none;padding:0}
table{width:100%;border-collapse:collapse;margin:.8em 0}
th{background:#1e293b;color:#94a3b8;padding:8px 12px;text-align:left;font-size:13px;border:1px solid #334155}
td{padding:8px 12px;border:1px solid #334155;font-size:13px}
.badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600}
.required{background:rgba(239,68,68,.15);color:#f87171}
.optional{background:rgba(99,102,241,.15);color:#818cf8}
.example{border-left:3px solid #6366f1;padding-left:12px;margin:1em 0}
</style></head><body>
<h1>🤖 TableMaster Chat API v1</h1>
<p>게임 데이터 AI 어시스턴트의 기능을 HTTP API로 사용할 수 있습니다.</p>
<p>모든 엔드포인트의 기본 URL: <code>http://&lt;HOST&gt;:5173/api/v1</code></p>

<h2>📨 채팅</h2>

<div class="endpoint">
  <span class="method post">POST</span>
  <span class="url">/api/v1/chat</span>
  <p>AI에게 메시지를 보내고 응답을 받습니다. AI는 필요 시 자동으로 SQL 쿼리, Git 검색 등 도구를 사용합니다.</p>
  <h3>Request Body</h3>
  <table>
    <tr><th>필드</th><th>타입</th><th>필수</th><th>설명</th></tr>
    <tr><td><code>message</code></td><td>string</td><td><span class="badge required">필수</span></td><td>사용자 메시지</td></tr>
    <tr><td><code>session_id</code></td><td>string</td><td><span class="badge optional">선택</span></td><td>세션 ID (없으면 새 세션 생성)</td></tr>
    <tr><td><code>stream</code></td><td>boolean</td><td><span class="badge optional">선택</span></td><td>true면 SSE 스트리밍</td></tr>
  </table>
  <h3>Response (비스트리밍)</h3>
<pre><code>{
  "session_id": "s_1709012345_abc123",
  "content": "Character 테이블에 총 45명의 캐릭터가 있습니다...",
  "tool_calls": [
    { "tool": "query_game_data", "input": {"sql": "SELECT COUNT(*) FROM character"}, "result": {...} }
  ],
  "model": "claude-sonnet-4-20250514"
}</code></pre>
  <h3>Response (SSE 스트리밍, stream=true)</h3>
<pre><code>event: session
data: {"session_id": "s_1709012345_abc123"}

event: thinking
data: {"iteration": 1, "max": 8}

event: tool_start
data: {"tool": "query_game_data", "input": {"sql": "SELECT * FROM character LIMIT 5"}}

event: tool_done
data: {"tool": "query_game_data", "summary": "5행 조회 완료"}

event: text_delta
data: {"delta": "캐릭터 ", "full_text": "캐릭터 "}

event: done
data: {"session_id": "...", "content": "...", "tool_calls": [...]}
</code></pre>
  <div class="example">
    <strong>cURL 예시:</strong>
<pre><code>curl -X POST http://localhost:5173/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Character 테이블 구조 보여줘"}'</code></pre>
  </div>
  <div class="example">
    <strong>Python 예시:</strong>
<pre><code>import requests

resp = requests.post("http://localhost:5173/api/v1/chat", json={
    "message": "레벨 10 이상 캐릭터 목록 보여줘",
    "session_id": "my-session"
})
data = resp.json()
print(data["content"])
for tc in data["tool_calls"]:
    print(f"  Tool: {tc['tool']}, Result: {tc['result']}")
</code></pre>
  </div>
  <div class="example">
    <strong>Python SSE 스트리밍 예시:</strong>
<pre><code>import requests

resp = requests.post("http://localhost:5173/api/v1/chat",
    json={"message": "전체 무기 목록 정리해줘", "stream": True},
    stream=True)

for line in resp.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: '):
            print(decoded[6:])
</code></pre>
  </div>
</div>

<h2>🔍 SQL 직접 실행</h2>

<div class="endpoint">
  <span class="method post">POST</span>
  <span class="url">/api/v1/query</span>
  <p>AI를 거치지 않고 게임 데이터에 SQL을 직접 실행합니다.</p>
  <table>
    <tr><th>필드</th><th>타입</th><th>필수</th><th>설명</th></tr>
    <tr><td><code>sql</code></td><td>string</td><td><span class="badge required">필수</span></td><td>SELECT SQL 쿼리</td></tr>
  </table>
<pre><code>curl -X POST http://localhost:5173/api/v1/query \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "SELECT * FROM character WHERE level >= 10"}'</code></pre>
</div>

<h2>📋 테이블 목록</h2>

<div class="endpoint">
  <span class="method get">GET</span>
  <span class="url">/api/v1/tables</span>
  <p>사용 가능한 모든 게임 데이터 테이블의 이름, 컬럼, 행 수를 반환합니다.</p>
<pre><code>curl http://localhost:5173/api/v1/tables</code></pre>
</div>

<h2>💬 세션 관리</h2>

<div class="endpoint">
  <span class="method get">GET</span>
  <span class="url">/api/v1/sessions</span>
  <p>모든 대화 세션 목록을 반환합니다.</p>
</div>

<div class="endpoint">
  <span class="method get">GET</span>
  <span class="url">/api/v1/sessions/:id</span>
  <p>특정 세션의 대화 히스토리를 반환합니다.</p>
</div>

<div class="endpoint">
  <span class="method delete">DELETE</span>
  <span class="url">/api/v1/sessions/:id</span>
  <p>세션을 삭제합니다.</p>
</div>

<h2>💡 사용 팁</h2>
<ul style="padding-left:1.5em;color:#94a3b8">
  <li><code>session_id</code>를 재사용하면 대화 맥락이 유지됩니다</li>
  <li>AI는 자동으로 SQL 쿼리, Git 히스토리 조회 등 도구를 사용합니다</li>
  <li><code>tool_calls</code> 배열에서 AI가 어떤 도구를 사용했는지 확인할 수 있습니다</li>
  <li>SSE 스트리밍 모드(<code>"stream": true</code>)로 실시간 응답을 받을 수 있습니다</li>
  <li><code>/api/v1/query</code>로 AI 없이 직접 SQL을 실행할 수도 있습니다</li>
</ul>
</body></html>`
}

export default function gitPlugin(options: GitPluginOptions): Plugin {
  return {
    name: 'vite-git-plugin',
    configureServer(server) {
      server.middlewares.use(createChatApiMiddleware(options))
      server.middlewares.use(createGitMiddleware(options))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createChatApiMiddleware(options))
      server.middlewares.use(createGitMiddleware(options))
    },
  }
}

function collectXlsxFiles(dir: string): string[] {
  const results: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectXlsxFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.xlsx') && !entry.name.startsWith('~$')) {
      results.push(fullPath)
    }
  }
  return results
}
