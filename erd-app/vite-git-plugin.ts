import type { Plugin } from 'vite'
import { execSync, execFileSync, execFile } from 'child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { join, resolve, extname, sep } from 'path'
import { promisify } from 'util'
import type { IncomingMessage, ServerResponse } from 'http'

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
  jiraBaseUrl?: string
  confluenceBaseUrl?: string
  jiraUserEmail?: string
  jiraApiToken?: string
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

        if (isStream && claudeRes.body) {
          // SSE 스트리밍: 응답을 그대로 파이프
          res.writeHead(claudeRes.status, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Transfer-Encoding': 'chunked',
          })
          const reader = claudeRes.body.getReader()
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) { res.end(); break }
                res.write(value)
              }
            } catch { res.end() }
          }
          pump()
        } else {
          const data = await claudeRes.text()
          res.writeHead(claudeRes.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(data)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        sendJson(res, 500, { error: msg })
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
          const isCode = !isDb
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

          const fileExt  = found.ext.toLowerCase()
          const mime     = mimeMap[fileExt] ?? 'application/octet-stream'
          const fileExt2  = found.ext.toLowerCase()
          const mime2     = mimeMap[fileExt2] ?? 'application/octet-stream'
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

    // ── /api/assets/scene : Unity .unity 씬 파일 파싱 ──────────────────────────
    if (req.url?.startsWith('/api/assets/scene')) {
      try {
        const SCENE_ASSETS_DIR  = join(process.cwd(), '..', '..', 'assets')
        const url2     = new URL(req.url, 'http://localhost')
        const scenePath = url2.searchParams.get('path') || ''
        const maxObjects = parseInt(url2.searchParams.get('max') || '60', 10)

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
        const getFloat = (block: string, key: string): number => {
          const m = block.match(new RegExp(`${key}:\\s*([\\d.eE+\\-]+)`))
          return m ? parseFloat(m[1]) : 0
        }
        const getStr = (block: string, key: string): string => {
          const m = block.match(new RegExp(`${key}:\\s*(.+)`))
          return m ? m[1].trim() : ''
        }

        // ── 공통 헬퍼 ─────────────────────────────────────────────────────────
        // float 값 파싱 (Unity YAML은 음수 포함)
        const parseVal = (s: string): number => {
          const n = parseFloat(s)
          return isNaN(n) ? 0 : n
        }
        // m_Modifications 에서 특정 propertyPath 값 추출
        const getPropVal = (block: string, prop: string): number | null => {
          // Unity modification 형식: propertyPath: m_LocalPosition.x\n      value: 19.554
          const escaped = prop.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
          const re = new RegExp(
            `propertyPath:\\s*${escaped}\\s*\\n\\s*value:\\s*([^\\n]+)`
          )
          const m = block.match(re)
          return m ? parseVal(m[1].trim()) : null
        }

        // ── PrefabInstance 파싱 ────────────────────────────────────────────────
        interface PrefabPlacement {
          id: string
          prefabName: string
          sourcePrefabGuid: string
          pos: { x: number; y: number; z: number }
          rot: { x: number; y: number; z: number; w: number }
          scale: { x: number; y: number; z: number }
        }

        const placements: PrefabPlacement[] = []
        const sections = sceneContent.split(/\n---/)
        for (const section of sections) {
          if (!section.includes('!u!1001')) continue
          const idMatch = section.match(/!u!1001 &(\d+)/)
          if (!idMatch) continue
          // ✅ fileID는 Unity signed int64로 음수일 수 있음 → -?\d+
          const prefabGuidMatch = section.match(/m_SourcePrefab:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+)/)
          if (!prefabGuidMatch) continue

          const pv = (prop: string, def: number): number => getPropVal(section, prop) ?? def

          placements.push({
            id: idMatch[1],
            prefabName: (() => {
              const rel = guidToRelPath[prefabGuidMatch[1]]
              return rel ? rel.split('/').pop()?.replace(/\.prefab$/i, '') ?? 'Object' : 'Object'
            })(),
            sourcePrefabGuid: prefabGuidMatch[1],
            pos: { x: pv('m_LocalPosition.x', 0), y: pv('m_LocalPosition.y', 0), z: pv('m_LocalPosition.z', 0) },
            rot: { x: pv('m_LocalRotation.x', 0), y: pv('m_LocalRotation.y', 0), z: pv('m_LocalRotation.z', 0), w: pv('m_LocalRotation.w', 1) },
            scale: { x: pv('m_LocalScale.x', 1), y: pv('m_LocalScale.y', 1), z: pv('m_LocalScale.z', 1) },
          })
        }

        // ── 직접 GameObject+Transform+MeshFilter 파싱 ─────────────────────────
        interface DirectObject {
          name: string
          meshGuid: string
          pos: { x: number; y: number; z: number }
          rot: { x: number; y: number; z: number; w: number }
          scale: { x: number; y: number; z: number }
        }
        const directObjects: DirectObject[] = []

        // fileID → MeshFilter mesh guid (✅ -?\d+ 로 음수 fileID 대응)
        const meshFilters: Record<string, { meshGuid: string; goId: string }> = {}
        const transforms: Record<string, {
          pos: { x: number; y: number; z: number }
          rot: { x: number; y: number; z: number; w: number }
          scale: { x: number; y: number; z: number }
          goId: string
        }> = {}
        const gameObjects: Record<string, string> = {}

        for (const section of sections) {
          if (section.includes('!u!1 &') && !section.includes('!u!1001')) {
            // GameObject (!u!1)
            const idM = section.match(/!u!1 &(\d+)/)
            const nameM = section.match(/m_Name:\s*(.+)/)
            if (idM && nameM) gameObjects[idM[1]] = nameM[1].trim()
          } else if (section.includes('!u!4 &')) {
            // Transform (!u!4) - inline format: m_LocalPosition: {x:1, y:2, z:3}
            const idM = section.match(/!u!4 &(\d+)/)
            const goM  = section.match(/m_GameObject:\s*\{fileID:\s*(\d+)/)
            if (idM && goM) {
              const p3 = (key: string) => section.match(new RegExp(`${key}:\\s*\\{x:\\s*([\\d.eE+\\-]+),\\s*y:\\s*([\\d.eE+\\-]+),\\s*z:\\s*([\\d.eE+\\-]+)`))
              const pos = p3('m_LocalPosition')
              const rot4 = section.match(/m_LocalRotation:\s*\{x:\s*([\d.eE+\-]+),\s*y:\s*([\d.eE+\-]+),\s*z:\s*([\d.eE+\-]+),\s*w:\s*([\d.eE+\-]+)/)
              const scl = p3('m_LocalScale')
              transforms[idM[1]] = {
                pos:   pos  ? { x: parseVal(pos[1]),  y: parseVal(pos[2]),  z: parseVal(pos[3])  } : { x: 0, y: 0, z: 0 },
                rot:   rot4 ? { x: parseVal(rot4[1]), y: parseVal(rot4[2]), z: parseVal(rot4[3]), w: parseVal(rot4[4]) } : { x: 0, y: 0, z: 0, w: 1 },
                scale: scl  ? { x: parseVal(scl[1]),  y: parseVal(scl[2]),  z: parseVal(scl[3])  } : { x: 1, y: 1, z: 1 },
                goId: goM[1],
              }
            }
          } else if (section.includes('!u!33 &')) {
            // MeshFilter (!u!33) — ✅ fileID는 음수 가능 → -?\d+
            const idM  = section.match(/!u!33 &(\d+)/)
            const goM  = section.match(/m_GameObject:\s*\{fileID:\s*(\d+)/)
            const meshM = section.match(/m_Mesh:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+),\s*type:\s*3/)
            if (idM && goM && meshM && meshM[1] !== '0000000000000000e000000000000000') {
              meshFilters[idM[1]] = { meshGuid: meshM[1], goId: goM[1] }
            }
          }
        }

        // Merge direct objects
        for (const [, mf] of Object.entries(meshFilters)) {
          const fbxPath = guidToRelPath[mf.meshGuid]
          if (!fbxPath || !/\.(fbx)$/i.test(fbxPath)) continue
          const goName = gameObjects[mf.goId] ?? 'Object'
          const tf = Object.values(transforms).find(t => t.goId === mf.goId)
          directObjects.push({
            name: goName,
            meshGuid: mf.meshGuid,
            pos:   tf?.pos   ?? { x: 0, y: 0, z: 0 },
            rot:   tf?.rot   ?? { x: 0, y: 0, z: 0, w: 1 },
            scale: tf?.scale ?? { x: 1, y: 1, z: 1 },
          })
        }

        // ── prefab → FBX 해석 ─────────────────────────────────────────────────
        // ✅ 핵심 수정: m_Mesh fileID는 Unity signed int64 (음수 가능) → -?\d+
        const prefabCache: Record<string, string | null> = {}

        const resolvePrefabFbx = (prefabGuid: string): string | null => {
          if (prefabGuid in prefabCache) return prefabCache[prefabGuid]
          const prefabAbsPath = guidToAbs(prefabGuid)
          if (!prefabAbsPath || !existsSync(prefabAbsPath)) {
            return (prefabCache[prefabGuid] = null)
          }
          try {
            const pc = readFileSync(prefabAbsPath, 'utf-8')
            // ✅ fileID에 -?\d+ (음수 허용) 적용 — 이게 이전 버그의 핵심 원인
            const meshRefs = [...pc.matchAll(/m_Mesh:\s*\{fileID:\s*-?\d+,\s*guid:\s*([a-f0-9]+),\s*type:\s*3/g)]
            for (const m of meshRefs) {
              const meshGuid = m[1]
              if (meshGuid === '0000000000000000e000000000000000') continue // built-in
              const fbxRel = guidToRelPath[meshGuid]
              if (fbxRel && /\.(fbx)$/i.test(fbxRel)) {
                return (prefabCache[prefabGuid] = fbxRel)
              }
            }
            return (prefabCache[prefabGuid] = null)
          } catch {
            return (prefabCache[prefabGuid] = null)
          }
        }

        // ── 씬 오브젝트 목록 조합 ───────────────────────────────────────────────
        interface SceneObj {
          id: string
          name: string
          fbxPath: string
          fbxUrl: string
          pos: { x: number; y: number; z: number }
          rot: { x: number; y: number; z: number; w: number }
          scale: { x: number; y: number; z: number }
        }

        const sceneObjects: SceneObj[] = []

        // 1) 직접 MeshFilter 오브젝트
        for (const d of directObjects) {
          if (sceneObjects.length >= maxObjects) break
          const rel = guidToRelPath[d.meshGuid] ?? ''
          sceneObjects.push({
            id: `dir_${d.meshGuid}`,
            name: d.name,
            fbxPath: rel,
            fbxUrl: `/api/assets/file?path=${encodeURIComponent(rel)}`,
            pos: d.pos, rot: d.rot, scale: d.scale,
          })
        }

        // 2) PrefabInstance → FBX 해석
        for (const p of placements) {
          if (sceneObjects.length >= maxObjects) break
          const fbxRel = resolvePrefabFbx(p.sourcePrefabGuid)
          if (!fbxRel) continue
          sceneObjects.push({
            id: p.id,
            name: p.prefabName,
            fbxPath: fbxRel,
            fbxUrl: `/api/assets/file?path=${encodeURIComponent(fbxRel)}`,
            pos: p.pos, rot: p.rot, scale: p.scale,
          })
        }

        sendJson(res, 200, {
          scenePath,
          totalPrefabs: placements.length,
          totalDirect: directObjects.length,
          resolvedCount: sceneObjects.length,
          objects: sceneObjects,
        })
        return
      } catch (sceneErr) {
        console.error('[scene endpoint error]', sceneErr)
        if (!res.headersSent) sendJson(res, 500, { error: String(sceneErr) })
        return
      }
    }

    // ── /api/jira/* : Jira / Confluence 프록시 ──────────────────────────────────
    if (req.url?.startsWith('/api/jira/') || req.url?.startsWith('/api/confluence/')) {
      try {
        // .env 파일의 환경 변수에서 읽기 (JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN)
        const jiraToken = options.jiraApiToken || ''
        const jiraEmail = options.jiraUserEmail || ''
        const jiraBase  = options.jiraBaseUrl   || ''
        const confluenceBase = options.confluenceBaseUrl || jiraBase  // 별도 설정 없으면 jiraBase 사용

        if (!jiraToken) {
          sendJson(res, 503, { error: 'JIRA_API_TOKEN not set. Add it to .env file: JIRA_API_TOKEN=your_token' })
          return
        }
        if (!jiraBase) {
          sendJson(res, 503, { error: 'JIRA_BASE_URL not set. Add it to .env file: JIRA_BASE_URL=https://cloud.jira.krafton.com' })
          return
        }

        // Authorization 헤더 구성 (Jira & Confluence 동일 토큰 사용)
        let authHeader: string
        if (jiraEmail) {
          authHeader = 'Basic ' + Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')
        } else {
          authHeader = 'Bearer ' + jiraToken
        }

        const baseUrl     = jiraBase.replace(/\/$/, '')        // Jira 전용
        const confluenceUrl = confluenceBase.replace(/\/$/, '') // Confluence 전용
        const url2 = new URL(req.url, 'http://localhost')

        // ── /api/jira/search?jql=...&maxResults=20 ─────────────────────────
        if (req.url.startsWith('/api/jira/search')) {
          let jql = url2.searchParams.get('jql') || ''
          const maxResults = parseInt(url2.searchParams.get('maxResults') || '20', 10)
          const fields = url2.searchParams.get('fields') || 'summary,status,assignee,priority,issuetype,created,updated,description,comment,labels,components,fixVersions,reporter'

          // Jira Cloud는 project 조건 없는 JQL을 400으로 차단함.
          // JQL에 project 조건이 없으면 자동으로 전체 프로젝트 목록을 조회해 추가.
          const hasProjectClause = /\bproject\b/i.test(jql)
          if (!hasProjectClause) {
            try {
              const projResp = await fetch(`${baseUrl}/rest/api/3/project/search?maxResults=100&orderBy=name`, {
                headers: { Authorization: authHeader, Accept: 'application/json' }
              })
              if (projResp.ok) {
                const projData = await projResp.json() as { values?: { key: string }[] }
                const keys = (projData.values ?? []).map((p: { key: string }) => p.key).filter(Boolean)
                if (keys.length > 0) {
                  const projectFilter = `project IN (${keys.map(k => `"${k}"`).join(',')}) AND `
                  jql = projectFilter + (jql || 'ORDER BY created DESC')
                }
              }
            } catch { /* 프로젝트 조회 실패 시 원래 JQL 사용 */ }
          }

          const apiUrl = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields)}`

          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json()
          if (!apiResp.ok) {
            sendJson(res, apiResp.status, { error: data?.errorMessages?.[0] ?? data?.message ?? `Jira API ${apiResp.status}`, raw: data })
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
          const data = await apiResp.json()
          if (!apiResp.ok) {
            sendJson(res, apiResp.status, { error: data?.errorMessages?.[0] ?? `Jira issue ${issueKey} not found`, raw: data })
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

          // v1 API 먼저 시도 (Confluence 전용 URL 사용)
          const apiUrlV1 = `${confluenceUrl}/wiki/rest/api/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=${encodeURIComponent(expand)}`
          const apiRespV1 = await fetch(apiUrlV1, {
            headers: { Authorization: authHeader, Accept: 'application/json', 'X-Atlassian-Token': 'no-check' }
          })

          // v1 403/404 → v2 API 시도
          if (!apiRespV1.ok && (apiRespV1.status === 403 || apiRespV1.status === 404)) {
            const apiUrlV2 = `${confluenceUrl}/wiki/api/v2/pages?limit=${limit}`
            const apiRespV2 = await fetch(apiUrlV2, {
              headers: { Authorization: authHeader, Accept: 'application/json' }
            })
            if (!apiRespV2.ok) {
              const errV1 = await apiRespV1.json().catch(() => ({})) as Record<string,unknown>
              const msg = (errV1?.message as string) ?? `Confluence API ${apiRespV1.status}: 계정에 Confluence 접근 권한이 없습니다. Atlassian 관리자에게 권한 요청이 필요합니다.`
              sendJson(res, apiRespV1.status, { error: msg })
            } else {
              const data = await apiRespV2.json()
              sendJson(res, 200, data)
            }
          } else {
            const data = await apiRespV1.json()
            if (!apiRespV1.ok) {
              sendJson(res, apiRespV1.status, { error: (data as Record<string,unknown>)?.message ?? `Confluence API ${apiRespV1.status}` })
            } else {
              sendJson(res, 200, data)
            }
          }
          return
        }

        // ── /api/confluence/page/:id ────────────────────────────────────────
        if (req.url.startsWith('/api/confluence/page/')) {
          const pageId = url2.pathname.replace('/api/confluence/page/', '').split('?')[0]
          const apiUrl = `${confluenceUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version,space,ancestors,children.page`

          const apiResp = await fetch(apiUrl, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          const data = await apiResp.json()
          if (!apiResp.ok) {
            sendJson(res, apiResp.status, { error: data?.message ?? `Confluence page ${pageId} not found`, raw: data })
          } else {
            sendJson(res, 200, data)
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

        try {
          if (route === 'sync' && req.method === 'POST') {
            const raw = await readBody(req)
            const body = raw ? JSON.parse(raw) : {}
            const repoUrl = body.repoUrl || options.repoUrl
            const token = body.token || options.token
            const branch = body.branch || 'main'
            const authUrl = buildAuthUrl(repoUrl, token)

            const isCloned = existsSync(join(localDir, '.git'))

            if (!isCloned) {
              mkdirSync(localDir, { recursive: true })
              runGit(`git clone --branch ${branch} "${authUrl}" .`, localDir)
              sendJson(res, 200, { status: 'cloned', message: 'Repository cloned successfully' })
            } else {
              // Set remote URL (in case token changed)
              runGit(`git remote set-url origin "${authUrl}"`, localDir)
              // Fetch branch with explicit refspec
              runGit(`git fetch origin ${branch}:refs/remotes/origin/${branch}`, localDir)
              const localHead = runGit('git rev-parse HEAD', localDir)
              const remoteHead = runGit(`git rev-parse origin/${branch}`, localDir)

              if (localHead === remoteHead) {
                sendJson(res, 200, { status: 'up-to-date', message: 'Already up to date', commit: localHead.substring(0, 8) })
              } else {
                runGit(`git reset --hard origin/${branch}`, localDir)
                const newHead = runGit('git rev-parse HEAD', localDir)
                sendJson(res, 200, { status: 'updated', message: 'Pulled latest changes', commit: newHead.substring(0, 8) })
              }
            }
            return
          }

          if (route === 'status' && req.method === 'GET') {
            const isCloned = existsSync(join(localDir, '.git'))
            if (!isCloned) {
              sendJson(res, 200, { cloned: false })
              return
            }
            const head = runGit('git rev-parse --short HEAD', localDir)
            const date = runGit('git log -1 --format=%ci', localDir)
            const msg = runGit('git log -1 --format=%s', localDir)
            sendJson(res, 200, { cloned: true, commit: head, date, message: msg })
            return
          }

          if (route === 'files' && req.method === 'GET') {
            const dirPath = url.searchParams.get('path') || ''
            const fullDir = resolve(localDir, dirPath)

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
            const isCloned = existsSync(join(localDir, '.git'))
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
                  cwd: localDir, encoding: 'utf-8', timeout: 120_000,
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
                  }
                })
              } else {
                const args = ['log', `-${count}`, `--format=%H${SEP}%h${SEP}%ci${SEP}%an${SEP}%s`]
                if (filterPath) { args.push('--'); args.push(filterPath) }
                const raw = execFileSync('git', args, {
                  cwd: localDir, encoding: 'utf-8', timeout: 120_000,
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
                  }
                })
              }

              sendJson(res, 200, { commits })
            } catch (err: any) {
              sendJson(res, 500, { error: err.stderr || err.message || String(err) })
            }
            return
          }

          if (route === 'diff' && req.method === 'GET') {
            const isCloned = existsSync(join(localDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { changes: [] }); return }

            const from = url.searchParams.get('from') || 'HEAD~1'
            const to = url.searchParams.get('to') || 'HEAD'
            const path = url.searchParams.get('path') || ''
            const pathArg = path ? ` -- "${path}"` : ''
            const raw = runGit(
              `git diff --name-status ${from} ${to}${pathArg}`,
              localDir
            )
            const changes = raw.split('\n').filter(Boolean).map((line) => {
              const [status, ...rest] = line.split('\t')
              return { status: status.trim(), file: rest.join('\t').trim() }
            })

            // Get stat summary
            let statSummary = ''
            try {
              statSummary = runGit(`git diff --stat ${from} ${to}${pathArg}`, localDir)
            } catch { /* ignore */ }

            sendJson(res, 200, { from, to, changes, statSummary })
            return
          }

          if (route === 'diff-detail' && req.method === 'GET') {
            const isCloned = existsSync(join(localDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { diff: '' }); return }

            const from = url.searchParams.get('from') || 'HEAD~1'
            const to = url.searchParams.get('to') || 'HEAD'
            const filePath = url.searchParams.get('file') || ''
            if (!filePath) { sendJson(res, 400, { error: 'file param required' }); return }

            let diff = ''
            try {
              diff = runGit(`git diff ${from} ${to} -- "${filePath}"`, localDir)
            } catch { /* binary or missing */ }

            sendJson(res, 200, { diff })
            return
          }

          // ── commit-diff: 특정 커밋의 변경 내용 파싱 반환 ────────────────────
          if (route === 'commit-diff' && req.method === 'GET') {
            const isCloned = existsSync(join(localDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { commit: null, files: [] }); return }

            const hash = url.searchParams.get('hash')
            if (!hash) { sendJson(res, 400, { error: 'hash param required' }); return }
            const filterFile = url.searchParams.get('file') || ''

            try {
              // 커밋 메타 정보
              const SEP = '|||'
              const metaRaw = execFileSync('git', [
                'log', '-1', `--format=%H${SEP}%h${SEP}%ci${SEP}%an${SEP}%ae${SEP}%s`, hash
              ], { cwd: localDir, encoding: 'utf-8', timeout: 30_000, stdio: ['pipe','pipe','pipe'] }).trim()
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
                  cwd: localDir, encoding: 'utf-8', timeout: 10_000, stdio: ['pipe','pipe','pipe']
                }).trim()
              } catch { /* initial commit */ }

              // unified diff 생성
              const diffArgs = parentHash
                ? ['diff', '--unified=3', parentHash, hash]
                : ['show', '--unified=3', '--format=', hash]
              if (filterFile) { diffArgs.push('--'); diffArgs.push(filterFile) }

              const diffRaw = execFileSync('git', diffArgs, {
                cwd: localDir, encoding: 'utf-8', timeout: 60_000, stdio: ['pipe','pipe','pipe'],
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
            const isCloned = existsSync(join(localDir, '.git'))
            if (!isCloned) { sendJson(res, 200, { files: [] }); return }

            const commit = url.searchParams.get('commit') || 'HEAD'
            const dirPath = url.searchParams.get('path') || ''
            const cacheKey = `${commit}:${dirPath}`

            const cached = fileCache.get(cacheKey)
            if (cached) { sendJson(res, 200, cached); return }

            try {
              // List ALL files at commit, then filter case-insensitively
              const lsArgs = ['ls-tree', '-r', '--name-only', commit]
              const listing = execFileSync('git', lsArgs, {
                cwd: localDir, encoding: 'utf-8', timeout: 60_000,
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
                    cwd: localDir, timeout: 60_000,
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

export default function gitPlugin(options: GitPluginOptions): Plugin {
  return {
    name: 'vite-git-plugin',
    configureServer(server) {
      server.middlewares.use(createGitMiddleware(options))
    },
    configurePreviewServer(server) {
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
