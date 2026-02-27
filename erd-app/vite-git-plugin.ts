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

// ── 독립 FBX+애니메이션 뷰어 HTML 생성 ──────────────────────────────────────
function buildFbxViewerHtml(modelUrl: string, label: string, animApiUrl: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${label} - Animation Viewer</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f1117;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;height:100vh;display:flex;flex-direction:column}
#header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1e293b;border-bottom:1px solid #334155;font-size:12px;min-height:36px}
#header .title{color:#a5b4fc;font-weight:600}
#header .badge{margin-left:auto;font-size:10px;color:#818cf8;background:rgba(99,102,241,0.15);padding:2px 8px;border-radius:10px}
#main{display:flex;flex:1;min-height:0}
#viewport{flex:1;position:relative}
canvas{display:block;width:100%!important;height:100%!important}
#sidebar{width:220px;background:rgba(15,17,23,0.95);border-left:1px solid #334155;display:flex;flex-direction:column;overflow:hidden}
#sidebar .sh{padding:8px 10px;border-bottom:1px solid #334155;display:flex;align-items:center;gap:6px}
#sidebar .sh span{color:#e2e8f0;font-size:12px;font-weight:600}
#sidebar .sh .cnt{color:#64748b;font-size:10px;margin-left:auto}
#cats{padding:4px 8px;display:flex;flex-wrap:wrap;gap:3px;border-bottom:1px solid #1e293b}
#cats button{padding:1px 6px;border-radius:4px;font-size:10px;border:none;cursor:pointer;background:#1e293b;color:#94a3b8}
#cats button.active{background:#6366f1;color:#fff}
#animlist{flex:1;overflow-y:auto;padding:4px 0}
#animlist button{width:100%;padding:5px 10px;background:transparent;border:none;border-left:3px solid transparent;cursor:pointer;text-align:left;display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;transition:background .15s}
#animlist button:hover{background:rgba(255,255,255,0.05)}
#animlist button.active{background:rgba(99,102,241,0.2);border-left-color:#6366f1;color:#e2e8f0;font-weight:600}
#animlist button.loading{cursor:wait;opacity:.6}
#controls{display:none;align-items:center;gap:8px;padding:6px 12px;background:#1e293b;border-top:1px solid #334155}
#controls.visible{display:flex}
#controls .name{color:#a5b4fc;font-size:11px;font-weight:600;min-width:60;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#pbar{flex:1;height:4px;background:#334155;border-radius:2px;position:relative;cursor:pointer}
#pbar .fill{position:absolute;left:0;top:0;height:100%;background:#6366f1;border-radius:2px;transition:width .1s}
#controls .time{color:#64748b;font-size:10px;min-width:45px;text-align:right}
#controls select{background:#0f1117;border:1px solid #334155;border-radius:4px;color:#94a3b8;font-size:10px;padding:2px 4px;cursor:pointer}
#controls button{background:none;border:none;cursor:pointer;color:#e2e8f0;font-size:16px;line-height:1;padding:2px}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(15,17,23,0.85)}
#overlay.hidden{display:none}
#overlay .spin{width:32px;height:32px;border:3px solid #334155;border-top-color:#6366f1;border-radius:50%;animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
#overlay .msg{font-size:12px;color:#94a3b8}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head>
<body>
<div id="header">
  <span style="font-size:14px">🎬</span>
  <span class="title">${label}</span>
  <span class="badge">드래그 회전 · 휠 줌</span>
</div>
<div id="main">
  <div id="viewport">
    <div id="overlay"><div class="spin"></div><div class="msg">모델 로딩 중...</div></div>
  </div>
  <div id="sidebar">
    <div class="sh"><span>🎬 애니메이션</span><span class="cnt" id="animCount">-</span></div>
    <div id="cats"></div>
    <div id="animlist"></div>
  </div>
</div>
<div id="controls">
  <button id="btnPlay" title="재생/일시정지">⏸</button>
  <span class="name" id="animName">-</span>
  <div id="pbar"><div class="fill" id="pbarFill"></div></div>
  <span class="time" id="animTime">0.0s / 0.0s</span>
  <select id="speed"><option value="0.25">0.25x</option><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select>
</div>

<script type="module">
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const viewport = document.getElementById('viewport');
const overlay = document.getElementById('overlay');
const overlayMsg = overlay.querySelector('.msg');
const animListEl = document.getElementById('animlist');
const catsEl = document.getElementById('cats');
const controlsEl = document.getElementById('controls');
const btnPlay = document.getElementById('btnPlay');
const animNameEl = document.getElementById('animName');
const pbarFill = document.getElementById('pbarFill');
const animTimeEl = document.getElementById('animTime');
const speedEl = document.getElementById('speed');
const animCountEl = document.getElementById('animCount');

// Three.js setup
const w = viewport.clientWidth, h = viewport.clientHeight;
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(w,h);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);
scene.fog = new THREE.Fog(0x111827, 800, 2000);

const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 2000);
camera.position.set(0,100,300);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

scene.add(new THREE.AmbientLight(0xffffff,1.5));
const dir = new THREE.DirectionalLight(0xffffff,2);
dir.position.set(300,600,300);
scene.add(dir);
scene.add(new THREE.DirectionalLight(0xaabbff,0.8).translateX(-200).translateY(200).translateZ(-200));
scene.add(new THREE.HemisphereLight(0x8899ff,0x334155,0.6));
scene.add(new THREE.GridHelper(600,30,0x334155,0x1e293b));

let mixer = null, currentAction = null, currentClip = null;
const clock = new THREE.Clock();
const clipCache = new Map();
let isPlaying = true;

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if(mixer){
    mixer.update(dt);
    if(currentAction && currentClip){
      const prog = currentAction.time / currentClip.duration;
      pbarFill.style.width = (prog*100)+'%';
      animTimeEl.textContent = currentAction.time.toFixed(1)+'s / '+currentClip.duration.toFixed(1)+'s';
    }
  }
  controls.update();
  renderer.render(scene,camera);
}
animate();

new ResizeObserver(()=>{
  const nw=viewport.clientWidth, nh=viewport.clientHeight;
  camera.aspect=nw/nh; camera.updateProjectionMatrix();
  renderer.setSize(nw,nh);
}).observe(viewport);

// Load model
const loader = new FBXLoader();
overlayMsg.textContent = '모델 로딩 중...';

loader.load('${modelUrl}', fbx=>{
  const box = new THREE.Box3().setFromObject(fbx);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov*(Math.PI/180);
  const camDist = Math.abs(maxDim/2/Math.tan(fov/2))*1.6;

  fbx.position.sub(center);
  camera.position.set(0, maxDim*0.4, camDist);
  camera.lookAt(0,0,0);
  controls.target.set(0,0,0);
  controls.maxDistance = camDist*5;
  controls.update();

  mixer = new THREE.AnimationMixer(fbx);

  // embedded animations
  if(fbx.animations.length>0){
    const clip = fbx.animations[0];
    clip.name = clip.name || 'embedded';
    currentClip = clip;
    currentAction = mixer.clipAction(clip);
    currentAction.play();
    controlsEl.classList.add('visible');
    animNameEl.textContent = clip.name;
  }

  scene.add(fbx);
  overlay.classList.add('hidden');

  // Load animations
  loadAnimations();
}, undefined, err=>{
  overlayMsg.textContent = '로드 실패: '+(err.message||err);
});

// animations
let allAnims = [];
let filterCat = null;

async function loadAnimations(){
  try{
    const resp = await fetch('${animApiUrl}');
    if(!resp.ok) return;
    const data = await resp.json();
    allAnims = data.animations || [];
    animCountEl.textContent = allAnims.length+'개';

    // categories
    const cats = [...new Set(allAnims.map(a=>a.category||'other'))].sort();
    if(cats.length>1){
      const catMeta = {idle:'🧍',walk:'🚶',locomotion:'🏃',jump:'⬆️',combat:'⚔️',skill:'✨',hit:'💥',dodge:'🌀',reload:'🔄',interaction:'🤝',other:'🎬'};
      let html = '<button class="active" data-cat="">ALL</button>';
      cats.forEach(c=>{
        html += '<button data-cat="'+c+'">'+(catMeta[c]||'🎬')+' '+c+'</button>';
      });
      catsEl.innerHTML = html;
      catsEl.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click',()=>{
          filterCat = btn.dataset.cat || null;
          catsEl.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          renderAnimList();
        });
      });
    }
    renderAnimList();
  }catch(e){console.warn('Anim load error',e)}
}

function renderAnimList(){
  const list = filterCat ? allAnims.filter(a=>(a.category||'other')===filterCat) : allAnims;
  const catMeta = {idle:'🧍',walk:'🚶',locomotion:'🏃',jump:'⬆️',combat:'⚔️',skill:'✨',hit:'💥',dodge:'🌀',reload:'🔄',interaction:'🤝',other:'🎬'};
  animListEl.innerHTML = list.map(a=>{
    const icon = catMeta[a.category||'other']||'🎬';
    const isActive = currentClip && currentClip.name === a.name;
    return '<button data-url="'+a.url+'" data-name="'+a.name+'" class="'+(isActive?'active':'')+'"><span>'+icon+'</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+a.name+'</span></button>';
  }).join('');

  animListEl.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>playAnim(btn.dataset.url, btn.dataset.name));
  });
}

async function playAnim(url, name){
  if(!mixer) return;
  // check cache
  let clip = clipCache.get(url);
  if(!clip){
    const btn = animListEl.querySelector('[data-url="'+CSS.escape(url)+'"]');
    if(btn) btn.classList.add('loading');
    try{
      const animFbx = await new Promise((res,rej)=>new FBXLoader().load(url,res,undefined,rej));
      if(animFbx.animations.length>0){
        clip = animFbx.animations[0];
        clip.name = name;
        clipCache.set(url, clip);
      }
    }catch(e){console.warn('Anim load fail',name,e)}
    if(btn) btn.classList.remove('loading');
  }
  if(!clip) return;

  const newAction = mixer.clipAction(clip);
  if(currentAction && currentAction !== newAction){
    newAction.reset();
    newAction.setEffectiveTimeScale(parseFloat(speedEl.value));
    newAction.setEffectiveWeight(1);
    newAction.play();
    currentAction.crossFadeTo(newAction, 0.3, true);
  } else {
    newAction.reset();
    newAction.setEffectiveTimeScale(parseFloat(speedEl.value));
    newAction.play();
  }
  currentAction = newAction;
  currentClip = clip;
  isPlaying = true;
  btnPlay.textContent = '⏸';
  controlsEl.classList.add('visible');
  animNameEl.textContent = name;

  // highlight
  animListEl.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  const activeBtn = animListEl.querySelector('[data-name="'+CSS.escape(name)+'"]');
  if(activeBtn) activeBtn.classList.add('active');
}

// Controls
btnPlay.addEventListener('click',()=>{
  if(!currentAction) return;
  isPlaying = !isPlaying;
  currentAction.paused = !isPlaying;
  btnPlay.textContent = isPlaying ? '⏸' : '▶️';
});

speedEl.addEventListener('change',()=>{
  if(currentAction) currentAction.setEffectiveTimeScale(parseFloat(speedEl.value));
});

document.getElementById('pbar').addEventListener('click',e=>{
  if(!currentAction || !currentClip) return;
  const rect = e.currentTarget.getBoundingClientRect();
  currentAction.time = ((e.clientX-rect.left)/rect.width)*currentClip.duration;
});
</script>
</body></html>`
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

        // ── /api/assets/animations : 모델 FBX 경로 → 관련 애니메이션 FBX 목록 ──
        if (req.url.startsWith('/api/assets/animations')) {
          const url2 = new URL(req.url, 'http://localhost')
          const modelPath = url2.searchParams.get('model') || ''
          const q = (url2.searchParams.get('q') || '').toLowerCase()

          // 에셋 인덱스에서 애니메이션 FBX 검색
          const idx = loadIdx()
          const allAnimFiles = idx.filter(a =>
            a.ext.toLowerCase() === 'fbx' &&
            a.path.toLowerCase().includes('animation')
          )

          // ── 모델 경로 기반 관련 애니메이션 스마트 필터링 ──
          // 일반적인 단어를 키워드에서 제외하여 정확한 매칭
          const GENERIC_WORDS = new Set([
            'character', 'player', 'gamecontents', 'animation', 'animations',
            'assets', 'devassets(not packed)', 'devassets', '_3dmodel', '_animation',
            'weapon', 'common', 'runtime', 'models', 'model', 'prefabs', 'prefab',
            'resources', 'scripts', 'fx', 'players', 'shared assets', 'shared',
            'devassets(not packed)', 'not packed', 'packed', 'plugins', 'storeplugins',
            'client', 'project_aegis', 'not', 'starter assets', 'starter',
            'thirdpersoncontroller', 'humanoid', 'demo', 'example', 'walkthrough',
          ])

          let animFiles = allAnimFiles

          if (modelPath) {
            const normModel = modelPath.replace(/\\/g, '/')
            const pathParts = normModel.split('/')
            const modelFileName = pathParts[pathParts.length - 1].replace(/\.fbx$/i, '').toLowerCase()

            // 모델 파일명에서 의미 있는 키워드 추출
            // 예: striker_low → ['striker'], musket_base_rig → ['musket']
            // _low, _high, _mid, _base, _rig 등 서픽스 제거
            const nameParts = modelFileName.split(/[_\-]/).filter(p =>
              p.length > 2 && !['low', 'high', 'mid', 'base', 'rig', 'lod', 'mesh', 'fbx', 'model'].includes(p)
            )

            // 경로에서도 의미 있는 폴더명 추출 (일반 단어 제외)
            const dirKeywords = pathParts.slice(0, -1)
              .map(p => p.toLowerCase())
              .filter(p => p.length > 2 && !GENERIC_WORDS.has(p) && !p.includes('.'))

            // 모든 후보 키워드 합침 (모델 파일명 파트 + 디렉토리 키워드)
            const allKeywords = [...new Set([...nameParts, ...dirKeywords])]

            // 3단계 필터링: 엄격 → 보통 → 느슨
            // 1단계: 모델 파일명의 핵심 키워드(첫 번째 파트)로 애니메이션 파일명 매칭
            //   예: striker_low.fbx → 파일명에 "striker" 포함하는 애니메이션
            const coreKeyword = nameParts[0] || ''
            let matched: typeof allAnimFiles = []

            if (coreKeyword) {
              // 파일명에 핵심 키워드가 포함된 애니메이션 (가장 정확)
              matched = allAnimFiles.filter(a => {
                const an = a.name.toLowerCase()
                return an.includes(coreKeyword)
              })
            }

            // 2단계: 파일명 매칭 안 되면, 같은 폴더명의 애니메이션 폴더 매칭
            //   예: Striker 폴더 → GameContents/Animation/Striker/ 하위
            if (matched.length === 0 && coreKeyword) {
              matched = allAnimFiles.filter(a => {
                const ap = a.path.toLowerCase().replace(/\\/g, '/')
                // 애니메이션 경로에서 폴더 이름이 키워드와 매칭
                const animParts = ap.split('/')
                return animParts.some(part => part === coreKeyword)
              })
            }

            // 3단계: 그래도 없으면, 의미 있는 키워드 any로 폴더 매칭
            if (matched.length === 0 && allKeywords.length > 0) {
              matched = allAnimFiles.filter(a => {
                const ap = a.path.toLowerCase().replace(/\\/g, '/')
                const animParts = ap.split('/')
                return allKeywords.some(kw => animParts.some(part => part === kw))
              })
            }

            // 매칭된 게 있으면 사용, 없으면 빈 배열 (모든 애니메이션을 보여주지 않음)
            animFiles = matched
          }

          // 추가 검색어 필터
          if (q) {
            animFiles = animFiles.filter(a =>
              a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q)
            )
          }

          // 결과 반환 (이름, 경로, API URL)
          const results = animFiles.slice(0, 200).map(a => ({
            name: a.name.replace(/\.fbx$/i, ''),
            path: a.path,
            url: `/api/assets/file?path=${encodeURIComponent(a.path)}`,
            // 애니메이션 카테고리 추출 (idle, walk, run, attack, death 등)
            category: (() => {
              const n = a.name.toLowerCase()
              if (n.includes('idle')) return 'idle'
              if (n.includes('walk')) return 'walk'
              if (n.includes('jog') || n.includes('run')) return 'locomotion'
              if (n.includes('jump')) return 'jump'
              if (n.includes('attack') || n.includes('fire') || n.includes('aim')) return 'combat'
              if (n.includes('skill')) return 'skill'
              if (n.includes('death') || n.includes('knockdown') || n.includes('knockback')) return 'hit'
              if (n.includes('rolling') || n.includes('dodge')) return 'dodge'
              if (n.includes('reload')) return 'reload'
              if (n.includes('interact') || n.includes('pickup') || n.includes('potion')) return 'interaction'
              return 'other'
            })()
          }))

          sendJson(res, 200, {
            model: modelPath,
            animations: results,
            total: animFiles.length,
            categories: [...new Set(results.map(r => r.category))].sort()
          })
          return
        }

        // ── /api/assets/fbx-viewer : 독립 FBX+애니메이션 뷰어 HTML 페이지 ──
        if (req.url.startsWith('/api/assets/fbx-viewer')) {
          const url2 = new URL(req.url, 'http://localhost')
          const modelParam = url2.searchParams.get('model') || ''
          const labelParam = url2.searchParams.get('label') || modelParam.split('/').pop()?.replace(/\.fbx$/i, '') || 'FBX'
          const catParam = url2.searchParams.get('categories') || '' // comma-separated

          // 모델 URL
          const modelUrl = `/api/assets/file?path=${encodeURIComponent(modelParam)}`

          // 애니메이션 API URL
          let animApiUrl = `/api/assets/animations?model=${encodeURIComponent(modelParam)}`
          if (catParam) animApiUrl += `&categories=${encodeURIComponent(catParam)}`

          const viewerHtml = buildFbxViewerHtml(modelUrl, labelParam, animApiUrl)
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          })
          res.end(viewerHtml)
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

/** 첫 5행 중 컬럼 헤더로 가장 적합한 행 인덱스를 반환 (클라이언트 findHeaderRow 와 동일 로직) */
function serverFindHeaderRow(raw: unknown[][]): number {
  const scanLimit = Math.min(5, raw.length)
  let bestIdx = 0
  let bestScore = -1
  for (let r = 0; r < scanLimit; r++) {
    const row = (raw[r] as unknown[]) ?? []
    const cells = row.map(v => String(v ?? '').trim().toLowerCase()).filter(Boolean)
    if (cells.length === 0) continue
    // DataGroup 행 건너뛰기 (Row 0은 보통 ["DataGroup","테이블명",null,...])
    if (cells[0] === 'datagroup') continue
    // 비숫자 문자열이 많은 행이 헤더일 가능성 높음
    const stringCells = cells.filter(c => isNaN(Number(c)))
    if (stringCells.length > bestScore) {
      bestScore = stringCells.length
      bestIdx = r
    }
  }
  return bestIdx
}

const META_SHEET_NAMES = new Set(['define', 'enum', 'tablegroup', 'ref', 'tabledefine', 'sheet1'])

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

        for (const sheetName of wb.SheetNames) {
          // 메타 시트 건너뛰기 (Define, Enum, TableGroup, Ref, TableDefine, #접두사)
          if (META_SHEET_NAMES.has(sheetName.toLowerCase())) continue
          if (sheetName.includes('#')) continue

          const ws = wb.Sheets[sheetName]
          if (!ws) continue

          // ── header: 1 모드로 2D 배열 읽기 (클라이언트와 동일) ──
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
          if (raw.length < 2) continue

          // 헤더 행 자동 탐지 (보통 Row1이 실제 컬럼명)
          const headerIdx = serverFindHeaderRow(raw)
          const headerRow = (raw[headerIdx] as unknown[]).map(h => String(h ?? '').trim())
          const validHeaders = headerRow.filter(Boolean)
          if (validHeaders.length === 0) continue

          // 데이터 행 파싱
          const rows: Record<string, string>[] = []
          for (let i = headerIdx + 1; i < raw.length; i++) {
            const rowArr = raw[i] as unknown[]
            if (!rowArr || rowArr.every(v => v == null || String(v).trim() === '')) continue
            const record: Record<string, string> = {}
            for (let j = 0; j < headerRow.length; j++) {
              if (!headerRow[j]) continue
              record[headerRow[j]] = rowArr[j] != null ? String(rowArr[j]).trim() : ''
            }
            rows.push(record)
          }
          if (rows.length === 0) continue

          // 테이블명: 시트명 그대로 사용 (웹 UI와 동일)
          // 동일 시트명이 여러 파일에 있을 경우 행 수 더 많은 쪽 우선
          const tableName = sheetName
          const lowerKey = tableName.toLowerCase()
          const existing = _serverTableData.get(lowerKey)
          if (!existing || rows.length > existing.rows.length) {
            _serverTableData.set(lowerKey, { headers: validHeaders, rows })
            // 원본 대소문자 시트명 기록 (나중에 tableList 빌드용)
            tableList.push({ name: tableName, columns: validHeaders, rowCount: rows.length })
          }
        }
      } catch (e) {
        console.warn(`[ChatAPI] xlsx 파싱 실패: ${fp}`, e)
      }
    }

    // _serverTableData 기반으로 중복 없는 테이블 목록 빌드
    _serverTableList = []
    for (const [key, { headers, rows }] of _serverTableData) {
      // 원본 대소문자 이름 복원 (마지막에 등록된 시트명)
      const originalName = tableList.find(t => t.name.toLowerCase() === key)?.name ?? key
      _serverTableList.push({ name: originalName, columns: headers, rowCount: rows.length })
    }

    // 스키마 설명 텍스트 빌드 (_serverTableList 사용 — 중복 제거됨)
    const lines: string[] = ['사용 가능한 게임 데이터 테이블:']
    for (const t of _serverTableList) {
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
    console.log(`[ChatAPI] 데이터 로딩 완료: ${_serverTableList.length}개 테이블, ${_serverTableList.reduce((s, t) => s + t.rowCount, 0)}행 (${Date.now() - t0}ms)`)
  } catch (e) {
    console.error('[ChatAPI] 데이터 로딩 실패:', e)
  }
}

// ── 서버사이드 SQL 실행 (alasql) ──
// 예약어 테이블명 remap 캐시
const _serverTableRemap = new Map<string, string>() // 원본명 → 내부명 (__u_xxx)

function serverRemapReservedNames(sql: string): string {
  if (_serverTableRemap.size === 0) return sql
  let result = sql
  for (const [original, internal] of _serverTableRemap) {
    const esc = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // FROM/JOIN 뒤의 bare 식별자만 치환 (backtick/quote 포함)
    const pattern = '(\\bFROM|\\bJOIN|\\bINTO|\\bUPDATE|\\bTABLE)\\s+[`"]?' + esc + '[`"]?(?=\\s|$|\\)|,|;)'
    result = result.replace(
      new RegExp(pattern, 'gi'),
      (_match, prefix) => `${prefix} ${internal}`
    )
  }
  return result
}

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

      if (SERVER_RESERVED_TABLE_NAMES.has(original.toUpperCase())) {
        // 예약어 테이블: 안전한 내부명으로 등록
        const internal = serverSafeInternalName(original)
        _serverTableRemap.set(original, internal)
        if (!alasql.tables[internal]) alasql(`CREATE TABLE IF NOT EXISTS \`${internal}\``)
        alasql.tables[internal].data = normalizedRows
      } else {
        // 일반 테이블: 소문자·원본·대문자 세 변형 모두 등록
        for (const tName of new Set([key, original, original.toUpperCase()])) {
          if (!alasql.tables[tName]) alasql(`CREATE TABLE IF NOT EXISTS \`${tName}\``)
          alasql.tables[tName].data = normalizedRows
        }
      }
    }
    // 주석 제거
    const cleaned = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (!cleaned) return { columns: [], rows: [], rowCount: 0, error: 'SQL이 비어 있습니다.' }
    // 식별자 정규화 (" → `, 따옴표 없는 #컬럼 → `#컬럼`)
    let processed = cleaned.replace(/"([^"]+)"/g, '`$1`')
    processed = processed.replace(/(?<!`)#(\w+)/g, '`#$1`')
    // 예약어 테이블명 치환
    processed = serverRemapReservedNames(processed)
    const result = alasql(processed) as Record<string, unknown>[]
    if (!Array.isArray(result)) return { columns: [], rows: [], rowCount: 0, error: 'SELECT 문만 지원합니다.' }
    const columns = result.length > 0 ? Object.keys(result[0]) : []
    return { columns, rows: result, rowCount: result.length }
  } catch (e: unknown) {
    // 예약어 테이블 관련 오류 힌트 제공
    const errMsg = e instanceof Error ? e.message : String(e)
    if (/Table.*does not exist/i.test(errMsg)) {
      const match = errMsg.match(/Table "?(\w+)"? does not exist/i)
      if (match) {
        const bad = match[1]
        if (SERVER_RESERVED_TABLE_NAMES.has(bad.toUpperCase())) {
          return { columns: [], rows: [], rowCount: 0, error: `"${bad}"은 alasql 예약어입니다. FROM __u_${bad.toLowerCase()} 으로 쿼리하세요.` }
        }
      }
    }
    return { columns: [], rows: [], rowCount: 0, error: errMsg }
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

// ── 서버사이드 Tool 정의 (API용 — 전체 도구 포함) ──
const API_TOOLS = [
  {
    name: 'query_game_data',
    description: '게임 데이터베이스에서 SQL SELECT 쿼리를 실행하여 실제 데이터를 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: '실행할 SQL SELECT 쿼리. 모든 값은 문자열입니다. #으로 시작하는 컬럼명은 백틱으로 감싸세요.' },
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
    description: 'Git 히스토리를 검색합니다 (변경 이력, 커밋 로그). repo="data"(aegisdata, 기본값), "aegis"(코드 저장소).',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색 키워드 (커밋 메시지, 파일명 등)' },
        count: { type: 'number', description: '조회할 커밋 수 (기본 10)' },
        file_path: { type: 'string', description: '특정 파일 경로로 필터링' },
        repo: { type: 'string', enum: ['data', 'aegis'], description: '저장소: "data"(기본), "aegis"(코드)' },
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
  // ── 코드 검색/읽기 ──
  {
    name: 'search_code',
    description: '게임 클라이언트 C# 소스코드를 검색합니다. type="class"로 클래스명 검색, type="method"로 메서드 검색, type="content"로 파일 내용 전문 검색.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드 (클래스명, 메서드명, 변수명 등)' },
        type: { type: 'string', enum: ['class', 'method', 'file', 'content', ''], description: '검색 타입' },
        scope: { type: 'string', description: '검색 범위 (폴더/파일 제한)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_code_file',
    description: '특정 C# 소스 파일의 전체 내용을 읽습니다. search_code로 경로를 찾은 후 호출하세요.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '파일 상대 경로 (예: "Combat/DamageSystem.cs")' },
      },
      required: ['path'],
    },
  },
  // ── Jira ──
  {
    name: 'search_jira',
    description: 'Jira 이슈를 JQL로 검색합니다. 버그, 작업 목록, 스프린트 이슈 조회에 사용.',
    input_schema: {
      type: 'object',
      properties: {
        jql: { type: 'string', description: 'JQL 쿼리 문자열. 예: "project = AEGIS AND status = \\"In Progress\\""' },
        maxResults: { type: 'number', description: '최대 반환 건수 (기본 20, 최대 50)' },
      },
      required: ['jql'],
    },
  },
  {
    name: 'get_jira_issue',
    description: 'Jira 이슈 키(예: AEGIS-1234)로 이슈 상세 정보를 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Jira 이슈 키. 예: "AEGIS-1234"' },
      },
      required: ['issueKey'],
    },
  },
  // ── Confluence ──
  {
    name: 'search_confluence',
    description: 'Confluence 페이지를 CQL로 검색합니다. 기획 문서, 스펙, 회의록 등.',
    input_schema: {
      type: 'object',
      properties: {
        cql: { type: 'string', description: 'CQL 쿼리. 예: "text ~ \\"스킬 시스템\\" AND type = page"' },
        limit: { type: 'number', description: '최대 반환 건수 (기본 10, 최대 20)' },
      },
      required: ['cql'],
    },
  },
  {
    name: 'get_confluence_page',
    description: 'Confluence 페이지 ID로 페이지 전체 내용을 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Confluence 페이지 ID (숫자 문자열)' },
      },
      required: ['pageId'],
    },
  },
  // ── 에셋 검색 ──
  {
    name: 'search_assets',
    description: 'Unity 프로젝트 에셋 파일을 검색합니다 (FBX 3D 모델, PNG 텍스처, WAV/MP3 사운드 등).',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드 (파일명 일부). 예: "striker", "skill_fire"' },
        ext: { type: 'string', description: '확장자 필터. 예: "fbx", "png", "wav". 비워두면 전체 검색.' },
      },
      required: ['query'],
    },
  },
  // ── 애니메이션 프리뷰 ──
  {
    name: 'preview_fbx_animation',
    description: 'FBX 캐릭터 모델에 애니메이션 FBX를 적용하여 3D 뷰어에서 실시간 재생합니다.',
    input_schema: {
      type: 'object',
      properties: {
        model_path: { type: 'string', description: 'FBX 모델 파일 경로. 예: "DevAssets(not packed)/_3DModel/musket/base_rig.fbx"' },
        animation_paths: { type: 'array', items: { type: 'string' }, description: '재생할 애니메이션 FBX 파일 경로 배열 (비워두면 자동 검색)' },
        categories: { type: 'array', items: { type: 'string' }, description: '필요한 카테고리만 필터. 예: ["idle","combat"]. 값: idle, walk, locomotion, jump, combat, skill, hit, dodge, reload, interaction' },
        label: { type: 'string', description: '뷰어에 표시할 이름' },
      },
      required: ['model_path'],
    },
  },
  // ── 이미지 검색 ──
  {
    name: 'find_resource_image',
    description: '게임 리소스 이미지(PNG)를 이름으로 검색합니다. 아이콘, UI 이미지, 스프라이트 등.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색할 이미지 이름 또는 키워드' },
      },
      required: ['query'],
    },
  },
  // ── 캐릭터 프로파일 ──
  {
    name: 'build_character_profile',
    description: '캐릭터 이름으로 해당 캐릭터의 모든 연관 데이터를 FK 관계를 따라 자동 수집합니다.',
    input_schema: {
      type: 'object',
      properties: {
        character_name: { type: 'string', description: '캐릭터 이름 (한글/영문, 부분 일치)' },
        character_id: { type: 'string', description: 'PK ID로 직접 검색' },
      },
      required: [],
    },
  },
  // ── 가이드 ──
  {
    name: 'read_guide',
    description: '코드/DB 가이드를 읽습니다. 빈 name("")이면 전체 목록 반환. DB: "_DB_OVERVIEW", "_DB_Character" 등. 코드: "_OVERVIEW", "_Skill" 등.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '가이드 이름. 빈 문자열이면 전체 목록.' },
      },
      required: [],
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
      const displayRows = qr.rows.slice(0, 50)
      // 사람이 읽기 쉬운 마크다운 테이블 형식
      let resultText = `${qr.rowCount}행 조회됨 (표시: ${displayRows.length}행)\n`
      resultText += `컬럼: ${qr.columns.join(', ')}\n\n`
      // 마크다운 테이블
      resultText += `| ${qr.columns.join(' | ')} |\n`
      resultText += `| ${qr.columns.map(() => '---').join(' | ')} |\n`
      for (const row of displayRows) {
        resultText += `| ${qr.columns.map(c => String(row[c] ?? '').replace(/\|/g, '\\|').slice(0, 50)).join(' | ')} |\n`
      }
      if (qr.rowCount > 50) resultText += `\n... 외 ${qr.rowCount - 50}행 (LIMIT으로 더 조회 가능)`
      const data = { rowCount: qr.rowCount, columns: qr.columns, rows: displayRows }
      return { result: resultText, data }
    }
    case 'show_table_schema': {
      const rawName = String(input.table_name ?? '')
      const lowerName = rawName.toLowerCase()

      // 1) 정확 매치
      let listEntry = _serverTableList.find(t => t.name.toLowerCase() === lowerName)
      // 2) 부분 매치 (앞뒤 포함)
      if (!listEntry) listEntry = _serverTableList.find(t => t.name.toLowerCase().includes(lowerName) || lowerName.includes(t.name.toLowerCase()))
      // 3) 여러 후보 중 가장 짧은 이름 우선 (가장 기본 테이블)
      if (!listEntry) {
        const candidates = _serverTableList.filter(t => t.name.toLowerCase().startsWith(lowerName) || t.name.toLowerCase().endsWith(lowerName))
        if (candidates.length > 0) listEntry = candidates.sort((a, b) => a.name.length - b.name.length)[0]
      }

      if (!listEntry) {
        const available = _serverTableList.map(t => t.name).join(', ')
        return { result: `테이블 "${rawName}" 을(를) 찾을 수 없습니다. 사용 가능: ${available}` }
      }

      const tableEntry = _serverTableData.get(listEntry.name.toLowerCase())
      if (!tableEntry) return { result: `테이블 "${rawName}" 데이터를 찾을 수 없습니다.` }

      // 사람이 읽기 쉬운 형식
      let resultText = `테이블: ${listEntry.name} (${listEntry.rowCount}행)\n`
      resultText += `컬럼 (${listEntry.columns.length}개): ${listEntry.columns.join(', ')}\n\n`
      if (tableEntry.rows.length > 0) {
        resultText += '샘플 데이터:\n'
        for (const row of tableEntry.rows.slice(0, 3)) {
          resultText += Object.entries(row).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n---\n'
        }
      }
      const data = { name: listEntry.name, columns: listEntry.columns, rowCount: listEntry.rowCount, sample: tableEntry.rows.slice(0, 3) }
      return { result: resultText, data }
    }
    case 'query_git_history': {
      const keyword = String(input.keyword ?? '')
      const count = Number(input.count ?? 10)
      const filePath = input.file_path ? String(input.file_path) : undefined
      const repo = String(input.repo ?? 'data')
      try {
        const dir = repo === 'aegis' && options.repo2LocalDir ? options.repo2LocalDir : options.localDir
        if (!existsSync(join(dir, '.git'))) return { result: 'Git 저장소가 없습니다.' }
        let cmd = `git log --oneline -n ${count}`
        if (keyword) cmd += ` --grep="${keyword.replace(/"/g, '\\"')}"`
        if (filePath) cmd += ` -- "${filePath}"`
        const log = runGit(cmd, dir)
        const commits = log.split('\n').filter(Boolean).map(line => {
          const [hash, ...rest] = line.split(' ')
          return { hash, message: rest.join(' ') }
        })
        return { result: JSON.stringify({ repo, count: commits.length, commits }), data: commits }
      } catch (e) {
        return { result: `Git 조회 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }
    case 'create_artifact': {
      const html = String(input.html ?? '')
      const title = String(input.title ?? '')
      return { result: `아티팩트 생성 완료: "${title}" (${html.length}자)`, data: { title, html, charCount: html.length } }
    }

    // ── search_code ──
    case 'search_code': {
      const query = String(input.query ?? '').toLowerCase()
      const searchType = String(input.type ?? '')
      const scope = input.scope ? String(input.scope).toLowerCase() : ''
      if (!query) return { result: '검색어가 필요합니다.' }

      try {
        if (searchType === 'content') {
          // 전문 검색 (grep)
          const all: { name: string; path: string; relPath: string }[] = []
          walkCode(CODE_DIR, '', all)
          const filtered = scope ? all.filter(f => f.relPath.toLowerCase().includes(scope)) : all
          const hits: { path: string; matches: { line: number; lineContent: string }[] }[] = []
          for (const f of filtered) {
            if (hits.length >= 20) break
            try {
              let raw = readFileSync(f.path, 'utf-8')
              if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
              const lines = raw.split('\n')
              const matches: { line: number; lineContent: string }[] = []
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(query)) {
                  matches.push({ line: i + 1, lineContent: lines[i].trim().slice(0, 200) })
                  if (matches.length >= 5) break
                }
              }
              if (matches.length > 0) hits.push({ path: f.relPath, matches })
            } catch { /* skip */ }
          }
          const resultText = hits.length > 0
            ? `"${query}" 전문검색 → ${hits.length}개 파일\n` + hits.slice(0, 10).map(r =>
                `  📄 ${r.path}\n` + r.matches.slice(0, 3).map(m => `    L${m.line}: ${m.lineContent}`).join('\n')
              ).join('\n')
            : `"${query}" 코드에서 찾을 수 없음`
          return { result: resultText, data: { type: 'content', totalFiles: hits.length, results: hits } }
        } else {
          // 인덱스 검색
          const index = loadCodeIndex()
          let results = index
          if (query) {
            results = index.filter(e => {
              if (searchType === 'class')  return e.classes.some(c => c.toLowerCase().includes(query))
              if (searchType === 'method') return e.methods.some(m => m.toLowerCase().includes(query))
              if (searchType === 'file')   return e.name.toLowerCase().includes(query) || e.path.toLowerCase().includes(query)
              return e.name.toLowerCase().includes(query) || e.path.toLowerCase().includes(query) ||
                e.classes.some(c => c.toLowerCase().includes(query)) ||
                e.namespaces.some(n => n.toLowerCase().includes(query)) ||
                e.methods.some(m => m.toLowerCase().includes(query))
            })
          }
          // 인덱스에서 못 찾으면 전문 검색 폴백
          if (results.length === 0 && query) {
            const all: { name: string; path: string; relPath: string }[] = []
            walkCode(CODE_DIR, '', all)
            const contentHits: { path: string; matches: { line: number; lineContent: string }[] }[] = []
            for (const f of all) {
              if (contentHits.length >= 20) break
              try {
                let raw = readFileSync(f.path, 'utf-8')
                if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
                const lines = raw.split('\n')
                const matches: { line: number; lineContent: string }[] = []
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].toLowerCase().includes(query)) {
                    matches.push({ line: i + 1, lineContent: lines[i].trim().slice(0, 200) })
                    if (matches.length >= 5) break
                  }
                }
                if (matches.length > 0) contentHits.push({ path: f.relPath, matches })
              } catch { /* skip */ }
            }
            if (contentHits.length > 0) {
              return {
                result: `"${query}" 인덱스에 없어 전문검색 → ${contentHits.length}개 파일\n` +
                  contentHits.slice(0, 5).map(r => `  📄 ${r.path}\n` + r.matches.slice(0, 3).map(m => `    L${m.line}: ${m.lineContent}`).join('\n')).join('\n'),
                data: { type: 'content_fallback', totalFiles: contentHits.length, results: contentHits }
              }
            }
            return { result: `"${query}" 코드에서 찾을 수 없음 (전체 ${index.length}개 파일)` }
          }
          const resultText = results.length > 0
            ? `"${query}" 검색 결과 ${results.length}개:\n` + results.slice(0, 15).map(r =>
                `  📄 ${r.path}  클래스: ${r.classes.join(', ') || '없음'} | 네임스페이스: ${r.namespaces.join(', ') || '없음'}`
              ).join('\n')
            : `"${query}" 코드에서 찾을 수 없음`
          return {
            result: resultText,
            data: { type: 'index', total: index.length, matched: results.length, results: results.slice(0, 30).map(e => ({ path: e.path, name: e.name, classes: e.classes, namespaces: e.namespaces, methods: e.methods.slice(0, 10) })) }
          }
        }
      } catch (e) {
        return { result: `코드 검색 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── read_code_file ──
    case 'read_code_file': {
      const relPath = String(input.path ?? '').replace(/\.\./g, '').replace(/\\/g, '/')
      if (!relPath) return { result: '오류: path 파라미터 필요' }
      try {
        let resolvedPath = join(CODE_DIR, relPath.replace(/\//g, '\\'))
        let resolvedRel = relPath
        if (!resolvedPath.startsWith(CODE_DIR) || !existsSync(resolvedPath)) {
          const fileName = relPath.split('/').pop()!.toLowerCase()
          const all: { name: string; path: string; relPath: string }[] = []
          walkCode(CODE_DIR, '', all)
          const match = all.find(f => f.relPath.toLowerCase().endsWith(relPath.toLowerCase())) ??
            all.find(f => f.name.toLowerCase() === fileName) ??
            all.find(f => f.name.toLowerCase().includes(fileName.replace('.cs', '')))
          if (!match) return { result: `파일 없음: ${relPath}` }
          resolvedPath = match.path
          resolvedRel = match.relPath
        }
        const stat = statSync(resolvedPath)
        const MAX_SIZE = 100 * 1024
        let raw = readFileSync(resolvedPath, 'utf-8')
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
        let truncated = false
        if (raw.length > MAX_SIZE) { raw = raw.slice(0, MAX_SIZE); truncated = true }
        return {
          result: `파일: ${resolvedRel} (${(stat.size / 1024).toFixed(1)}KB${truncated ? ', 잘림' : ''})\n\n${raw}`,
          data: { path: resolvedRel, size: stat.size, truncated, content: raw }
        }
      } catch (e) {
        return { result: `파일 읽기 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── search_assets ──
    case 'search_assets': {
      const query = String(input.query ?? '').toLowerCase()
      const ext = String(input.ext ?? '').toLowerCase().replace(/^\./, '')
      if (!query) return { result: '검색어가 필요합니다.' }
      try {
        const ASSETS_DIR = join(process.cwd(), '..', '..', 'assets')
        const idxPath = join(ASSETS_DIR, '.asset_index.json')
        if (!existsSync(idxPath)) return { result: '에셋 인덱스 없음. sync_assets.ps1 을 먼저 실행하세요.' }
        let rawIdx = readFileSync(idxPath, 'utf-8')
        if (rawIdx.charCodeAt(0) === 0xFEFF) rawIdx = rawIdx.slice(1)
        const idx = JSON.parse(rawIdx) as { path: string; name: string; ext: string; sizeKB: number }[]
        let filtered = idx
        if (ext) filtered = filtered.filter(a => a.ext.toLowerCase() === ext)
        filtered = filtered.filter(a => a.name.toLowerCase().includes(query) || a.path.toLowerCase().includes(query))
        const results = filtered.slice(0, 200)
        const resultText = `에셋 검색: "${query}"${ext ? ` [.${ext}]` : ''} → ${filtered.length}개\n` +
          (results.length > 0 ? results.slice(0, 30).map(f => `  ${f.path}  (${f.sizeKB} KB)`).join('\n') : '결과 없음') +
          (filtered.length > 30 ? `\n… 상위 30개만 표시 (전체 ${filtered.length}개)` : '')
        return { result: resultText, data: { total: filtered.length, results } }
      } catch (e) {
        return { result: `에셋 검색 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── preview_fbx_animation ──
    case 'preview_fbx_animation': {
      const modelPathVal = String(input.model_path ?? '')
      const label = String(input.label ?? modelPathVal.split('/').pop()?.replace(/\.fbx$/i, '') ?? 'FBX Animation')
      const animPaths = Array.isArray(input.animation_paths) ? (input.animation_paths as string[]) : []
      const catFilter = Array.isArray(input.categories) ? (input.categories as string[]).map((c: string) => c.toLowerCase()) : []

      if (!modelPathVal) return { result: 'model_path 파라미터가 필요합니다.' }
      try {
        const modelUrl = `/api/assets/file?path=${encodeURIComponent(modelPathVal)}`
        let animList: { name: string; url: string; category?: string }[] = []

        if (animPaths.length > 0) {
          animList = animPaths.map(p => ({
            name: p.split('/').pop()?.replace(/\.fbx$/i, '') ?? p,
            url: `/api/assets/file?path=${encodeURIComponent(p)}`,
            category: 'other',
          }))
        } else {
          // 자동 검색 (에셋 인덱스에서)
          const ASSETS_DIR2 = join(process.cwd(), '..', '..', 'assets')
          const idxPath = join(ASSETS_DIR2, '.asset_index.json')
          if (existsSync(idxPath)) {
            let rawIdx = readFileSync(idxPath, 'utf-8')
            if (rawIdx.charCodeAt(0) === 0xFEFF) rawIdx = rawIdx.slice(1)
            const idx = JSON.parse(rawIdx) as { path: string; name: string; ext: string }[]
            // 모델 경로에서 키워드 추출
            const pathParts = modelPathVal.replace(/\\/g, '/').split('/')
            const keywords = pathParts.filter(p =>
              p && !p.includes('.') && !['_3dmodel', '_animation', 'devassets(not packed)', 'weapon'].includes(p.toLowerCase())
            ).map(p => p.toLowerCase())

            let animFiles = idx.filter(a =>
              a.ext.toLowerCase() === 'fbx' &&
              a.path.toLowerCase().includes('animation')
            )
            if (keywords.length > 0) {
              animFiles = animFiles.filter(a => keywords.some(kw => a.path.toLowerCase().includes(kw)))
            }
            animList = animFiles.slice(0, 200).map(a => {
              const n = a.name.toLowerCase()
              let cat = 'other'
              if (n.includes('idle')) cat = 'idle'
              else if (n.includes('walk')) cat = 'walk'
              else if (n.includes('jog') || n.includes('run')) cat = 'locomotion'
              else if (n.includes('jump')) cat = 'jump'
              else if (n.includes('attack') || n.includes('fire') || n.includes('aim')) cat = 'combat'
              else if (n.includes('skill')) cat = 'skill'
              else if (n.includes('death') || n.includes('knockdown')) cat = 'hit'
              else if (n.includes('rolling') || n.includes('dodge')) cat = 'dodge'
              return { name: a.name.replace(/\.fbx$/i, ''), url: `/api/assets/file?path=${encodeURIComponent(a.path)}`, category: cat }
            })
          }
        }

        // 카테고리 필터 적용
        if (catFilter.length > 0) {
          animList = animList.filter(a => catFilter.includes((a.category ?? 'other').toLowerCase()))
        }

        const categories = [...new Set(animList.map(a => a.category ?? 'other'))].sort()
        const resultText = `FBX 애니메이션 뷰어: ${label}\n` +
          `모델: ${modelPathVal}\n` +
          `애니메이션: ${animList.length}개 (${categories.join(', ')})\n` +
          `3D 뷰어 + 애니메이션 플레이어가 ChatUI에 표시됩니다.`
        return { result: resultText, data: { modelUrl, animations: animList, totalAnimations: animList.length, categories } }
      } catch (e) {
        return { result: `애니메이션 미리보기 실패: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── find_resource_image ──
    case 'find_resource_image': {
      const query = String(input.query ?? '').toLowerCase()
      if (!query) return { result: '검색어가 필요합니다.' }
      try {
        const all: { name: string; path: string; relPath: string }[] = []
        walkImages(IMAGES_DIR, '', all)
        const results = all.filter(f => f.name.toLowerCase().includes(query)).slice(0, 30)
        if (results.length === 0) return { result: `"${query}" 이미지 없음 (전체 ${all.length}개 중)` }
        return {
          result: `${results.length}개 이미지 발견: ${results.map(i => i.name).join(', ')}`,
          data: { total: results.length, images: results.map(r => ({ name: r.name, relPath: r.relPath, url: `/api/images/file?path=${encodeURIComponent(r.relPath)}` })) }
        }
      } catch (e) {
        return { result: `이미지 검색 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── build_character_profile ──
    case 'build_character_profile': {
      const charName = String(input.character_name ?? input.character_id ?? '')
      const directCharId = input.character_id ? String(input.character_id) : null
      if (!charName && !directCharId) return { result: 'character_name 또는 character_id를 지정해주세요.' }
      try {
        // 캐릭터 테이블 찾기
        const charTableEntry = _serverTableList.find(t => t.name.toLowerCase().includes('character'))
        if (!charTableEntry) return { result: '캐릭터 테이블을 찾을 수 없습니다.' }
        const tblData = _serverTableData.get(charTableEntry.name.toLowerCase())
        if (!tblData || tblData.rows.length === 0) return { result: `테이블 ${charTableEntry.name}에 데이터가 없습니다.` }
        // 검색
        let character: Record<string, string> | undefined
        if (directCharId) {
          character = tblData.rows.find(r => Object.values(r).some(v => v === directCharId))
        }
        if (!character && charName) {
          const lc = charName.toLowerCase()
          character = tblData.rows.find(r => Object.values(r).some(v => v.toLowerCase().includes(lc)))
        }
        if (!character) {
          const list = tblData.rows.slice(0, 50).map((r, i) =>
            `[${i + 1}] ${Object.entries(r).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}`
          ).join('\n')
          return { result: `"${charName}" 찾지 못함. 전체 목록:\n${list}\n\ncharacter_id로 재호출하세요.` }
        }
        const charSummary = Object.entries(character).map(([k, v]) => `${k}: ${v}`).join(', ')
        return { result: `캐릭터 프로파일: ${charName}\n${charSummary}`, data: { character, tableName: charTableEntry.name } }
      } catch (e) {
        return { result: `캐릭터 프로파일 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── read_guide ──
    case 'read_guide': {
      const guideName = String(input.name ?? '').trim()
      const guidesDir = join(CODE_DIR, '_guides')
      try {
        if (!guideName) {
          // 전체 목록
          if (!existsSync(guidesDir)) return { result: '가이드 없음. generate_code_guides.ps1 을 실행하세요.' }
          const files = readdirSync(guidesDir).filter(f => f.endsWith('.md')).map(f => {
            const s = statSync(join(guidesDir, f))
            const isDb = f.startsWith('_DB_')
            return { name: f.replace('.md', ''), sizeKB: Math.round(s.size / 1024 * 10) / 10, category: isDb ? 'db' : 'code' }
          }).sort((a, b) => a.name.localeCompare(b.name))
          const dbGuides = files.filter(g => g.category === 'db')
          const codeGuides = files.filter(g => g.category === 'code')
          let list = ''
          if (dbGuides.length) list += `### DB 가이드 (${dbGuides.length}개)\n` + dbGuides.map(g => `- ${g.name} (${g.sizeKB}KB)`).join('\n') + '\n\n'
          if (codeGuides.length) list += `### 코드 가이드 (${codeGuides.length}개)\n` + codeGuides.map(g => `- ${g.name} (${g.sizeKB}KB)`).join('\n')
          return { result: `가이드 목록 (${files.length}개):\n\n${list}`, data: { guides: files } }
        }
        const safeName = guideName.replace(/[^a-zA-Z0-9_\-]/g, '')
        const guidePath = join(guidesDir, `${safeName}.md`)
        if (!existsSync(guidePath)) {
          const available = existsSync(guidesDir) ? readdirSync(guidesDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')) : []
          return { result: `가이드 '${safeName}' 없음. 사용 가능: ${available.join(', ')}` }
        }
        const MAX = 200 * 1024
        let content = readFileSync(guidePath, 'utf-8')
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
        const truncated = content.length > MAX
        if (truncated) content = content.slice(0, MAX) + '\n...(truncated)'
        const isDb = safeName.startsWith('_DB_')
        return {
          result: `# ${isDb ? 'DB' : '코드'} 가이드: ${safeName}\n\n${content}`,
          data: { name: safeName, sizeKB: Math.round(content.length / 1024 * 10) / 10, truncated }
        }
      } catch (e) {
        return { result: `가이드 로드 오류: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    default:
      return { result: `알 수 없는 도구: ${toolName}` }
  }
}

// ── 서버사이드 Async Tool 실행 (Jira/Confluence 등 네트워크 호출 필요) ──
async function serverExecuteToolAsync(
  toolName: string,
  input: Record<string, unknown>,
  options: GitPluginOptions,
): Promise<{ result: string; data?: unknown }> {
  // 동기 도구는 기존 함수 위임
  const syncTools = ['query_game_data', 'show_table_schema', 'query_git_history', 'create_artifact',
    'search_code', 'read_code_file', 'search_assets', 'preview_fbx_animation', 'find_resource_image',
    'build_character_profile', 'read_guide']
  if (syncTools.includes(toolName)) return serverExecuteTool(toolName, input, options)

  const jiraToken = options.jiraApiToken || ''
  const jiraEmail = options.jiraUserEmail || ''
  const jiraBase = (options.jiraBaseUrl || '').replace(/\/$/, '')
  const confluenceBase = (options.confluenceBaseUrl || jiraBase).replace(/\/$/, '')
  const confToken = options.confluenceApiToken || jiraToken
  const confEmail = options.confluenceUserEmail || jiraEmail
  const authHeader = jiraEmail ? 'Basic ' + Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64') : 'Bearer ' + jiraToken
  const confAuthHeader = confEmail ? 'Basic ' + Buffer.from(`${confEmail}:${confToken}`).toString('base64') : 'Bearer ' + confToken

  switch (toolName) {
    // ── search_jira ──
    case 'search_jira': {
      let jql = String(input.jql ?? '')
      const maxResults = Math.min(Number(input.maxResults ?? 20), 50)
      if (!jiraToken || !jiraBase) return { result: 'Jira 연결 정보가 설정되지 않았습니다 (.env 파일 확인).' }
      try {
        // project 조건 자동 추가
        if (!/\bproject\b/i.test(jql) && options.jiraDefaultProject) {
          const keys = options.jiraDefaultProject.split(',').map(k => k.trim()).filter(Boolean)
          const proj = keys.length === 1 ? `project = ${keys[0]}` : `project IN (${keys.join(',')})`
          jql = jql.trim() ? `${proj} AND ${jql}` : `${proj} ORDER BY updated DESC`
        }
        const apiUrl = `${jiraBase}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,assignee,priority,issuetype,updated`
        const resp = await fetch(apiUrl, { headers: { Authorization: authHeader, Accept: 'application/json' } })
        const data = await resp.json() as Record<string, unknown>
        if (!resp.ok) return { result: `Jira 검색 실패: ${(data?.errorMessages as string[])?.[0] ?? resp.status}` }
        type JIss = { id: string; key: string; self?: string; fields: Record<string, unknown> }
        const issues = (Array.isArray(data.issues) ? data.issues : []) as JIss[]
        const total = Number(data.total ?? issues.length)
        const base0 = String(issues[0]?.self ?? '').split('/rest/')[0]
        const lines = issues.map(i => {
          const f = i.fields
          const url = base0 ? `${base0}/browse/${i.key}` : ''
          return `[${i.key}](${url}) [${(f.status as Record<string,unknown>)?.name ?? '?'}] ${f.summary ?? ''} (담당: ${(f.assignee as Record<string,unknown>)?.displayName ?? '미배정'})`
        })
        return {
          result: `Jira: "${jql}" → ${total}건\n${lines.join('\n') || '결과 없음'}`,
          data: { total, issues: issues.map(i => ({ key: i.key, summary: String(i.fields.summary ?? ''), status: String((i.fields.status as Record<string,unknown>)?.name ?? ''), url: base0 ? `${base0}/browse/${i.key}` : '' })) }
        }
      } catch (e) { return { result: `Jira 검색 오류: ${e instanceof Error ? e.message : String(e)}` } }
    }

    // ── get_jira_issue ──
    case 'get_jira_issue': {
      const issueKey = String(input.issueKey ?? '')
      if (!issueKey) return { result: 'issueKey가 필요합니다.' }
      if (!jiraToken || !jiraBase) return { result: 'Jira 연결 정보가 설정되지 않았습니다.' }
      try {
        const apiUrl = `${jiraBase}/rest/api/3/issue/${issueKey}?expand=renderedFields&fields=summary,status,assignee,priority,issuetype,created,updated,description,comment,reporter`
        const resp = await fetch(apiUrl, { headers: { Authorization: authHeader, Accept: 'application/json' } })
        const data = await resp.json() as Record<string, unknown>
        if (!resp.ok) return { result: `Jira 이슈 조회 실패: ${(data?.errorMessages as string[])?.[0] ?? resp.status}` }
        const f = (data.fields ?? {}) as Record<string, unknown>
        const selfUrl = String(data.self ?? '')
        const base0 = selfUrl.split('/rest/')[0]
        const url = base0 ? `${base0}/browse/${issueKey}` : ''
        // ADF 파싱 (간단 텍스트 추출)
        const descContent = f.description as Record<string, unknown> | undefined
        let descText = ''
        if (descContent && typeof descContent === 'object') {
          const extractText = (node: unknown): string => {
            if (!node || typeof node !== 'object') return ''
            const n = node as Record<string, unknown>
            if (n.type === 'text') return String(n.text ?? '')
            if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join('')
            return ''
          }
          descText = extractText(descContent).replace(/\n{3,}/g, '\n\n').trim()
        } else if (typeof f.description === 'string') {
          descText = f.description
        }
        const comments = ((f.comment as Record<string,unknown>)?.comments ?? []) as Array<Record<string,unknown>>
        const commentLines = comments.slice(-5).map(c => {
          const author = String((c.author as Record<string,unknown>)?.displayName ?? '')
          let body = ''
          if (c.body && typeof c.body === 'object') {
            const extractText = (node: unknown): string => {
              if (!node || typeof node !== 'object') return ''
              const n = node as Record<string, unknown>
              if (n.type === 'text') return String(n.text ?? '')
              if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join('')
              return ''
            }
            body = extractText(c.body).slice(0, 200)
          }
          return `  [${author}]: ${body}`
        })
        const resultText = [
          `이슈: [${issueKey}](${url}) - ${f.summary ?? ''}`,
          `URL: ${url}`,
          `상태: ${(f.status as Record<string,unknown>)?.name ?? ''}`,
          `유형: ${(f.issuetype as Record<string,unknown>)?.name ?? ''}`,
          `우선순위: ${(f.priority as Record<string,unknown>)?.name ?? ''}`,
          `담당자: ${(f.assignee as Record<string,unknown>)?.displayName ?? '미배정'}`,
          `보고자: ${(f.reporter as Record<string,unknown>)?.displayName ?? ''}`,
          `생성: ${f.created ?? ''}  수정: ${f.updated ?? ''}`,
          descText ? `설명:\n${descText.slice(0, 500)}` : '',
          comments.length > 0 ? `\n최근 댓글 (${comments.length}개):\n${commentLines.join('\n')}` : '',
        ].filter(Boolean).join('\n')
        return {
          result: resultText,
          data: { issueKey, url, summary: String(f.summary ?? ''), status: String((f.status as Record<string,unknown>)?.name ?? ''), description: descText.slice(0, 1000) }
        }
      } catch (e) { return { result: `Jira 이슈 조회 오류: ${e instanceof Error ? e.message : String(e)}` } }
    }

    // ── search_confluence ──
    case 'search_confluence': {
      const cql = String(input.cql ?? '')
      const limit = Math.min(Number(input.limit ?? 10), 20)
      if (!confToken || !confluenceBase) return { result: 'Confluence 연결 정보가 설정되지 않았습니다.' }
      try {
        const apiUrl = `${confluenceBase}/wiki/rest/api/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=body.storage,version,space`
        const resp = await fetch(apiUrl, { headers: { Authorization: confAuthHeader, Accept: 'application/json', 'X-Atlassian-Token': 'no-check' } })
        const data = await resp.json() as Record<string, unknown>
        if (!resp.ok) return { result: `Confluence 검색 실패: ${(data?.message as string) ?? resp.status}` }
        type CHit = { content?: { id?: string; type?: string; _links?: Record<string,unknown>; space?: Record<string,unknown> }; title?: string; url?: string }
        const results = (Array.isArray(data.results) ? data.results : []) as CHit[]
        const total = Number(data.totalSize ?? results.length)
        const lines = results.map(p => {
          const pageId = p.content?.id ?? ''
          const spaceKey = (p.content?.space as Record<string,unknown>)?.key ?? '-'
          const relUrl = String(p.content?._links?.webui ?? p.url ?? '')
          const fullUrl = relUrl.startsWith('http') ? relUrl : (confluenceBase ? `${confluenceBase}/wiki${relUrl}` : '')
          return `[${p.title ?? '(제목 없음)'}](${fullUrl}) (Space: ${spaceKey}, ID: ${pageId})`
        })
        return {
          result: `Confluence: "${cql}" → ${total}건\n${lines.join('\n') || '결과 없음'}\n\n페이지 내용이 필요하면 get_confluence_page(pageId) 호출`,
          data: { total, pages: results.map(p => ({ id: p.content?.id ?? '', title: p.title ?? '', space: String((p.content?.space as Record<string,unknown>)?.key ?? '') })) }
        }
      } catch (e) { return { result: `Confluence 검색 오류: ${e instanceof Error ? e.message : String(e)}` } }
    }

    // ── get_confluence_page ──
    case 'get_confluence_page': {
      const pageId = String(input.pageId ?? '')
      if (!pageId) return { result: 'pageId가 필요합니다.' }
      if (!confToken || !confluenceBase) return { result: 'Confluence 연결 정보가 설정되지 않았습니다.' }
      try {
        const apiUrl = `${confluenceBase}/wiki/rest/api/content/${pageId}?expand=body.storage,version,space`
        const resp = await fetch(apiUrl, { headers: { Authorization: confAuthHeader, Accept: 'application/json' } })
        const data = await resp.json() as Record<string, unknown>
        if (!resp.ok) return { result: `Confluence 페이지 조회 실패: ${(data?.message as string) ?? resp.status}` }
        const body = (data.body as Record<string,unknown>)?.storage as Record<string,unknown>
        const rawHtml = String(body?.value ?? '')
        const htmlContent = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
        const space = String((data.space as Record<string,unknown>)?.key ?? '')
        const confLinks = (data._links ?? {}) as Record<string,unknown>
        const confWebui = String(confLinks.webui ?? '')
        const confPageUrl = confluenceBase && confWebui ? `${confluenceBase}${confWebui}` : ''
        return {
          result: `Confluence 페이지: ${data.title ?? ''}\nURL: ${confPageUrl}\nSpace: ${space}\n내용:\n${htmlContent}`,
          data: { pageId, title: String(data.title ?? ''), space, url: confPageUrl, contentLength: htmlContent.length }
        }
      } catch (e) { return { result: `Confluence 페이지 조회 오류: ${e instanceof Error ? e.message : String(e)}` } }
    }

    default:
      return serverExecuteTool(toolName, input, options)
  }
}

// ── alasql 예약어 목록 (서버사이드) ──
const SERVER_RESERVED_TABLE_NAMES = new Set([
  'ENUM', 'INDEX', 'KEY', 'VALUE', 'USER', 'VIEW',
  'SCHEMA', 'STATUS', 'TYPE', 'LEVEL', 'DATA', 'COMMENT',
  'COLUMN', 'CONSTRAINT', 'INTERVAL', 'TIMESTAMP',
  'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY',
  'HOUR', 'MINUTE', 'SECOND', 'GROUP', 'ORDER',
  'FUNCTION', 'PROCEDURE', 'TRIGGER', 'SEQUENCE',
  'TRANSACTION', 'SESSION', 'SYSTEM', 'GLOBAL', 'LOCAL',
])

function serverSafeInternalName(name: string): string {
  return `__u_${name.toLowerCase()}`
}

// ── 서버사이드 시스템 프롬프트 (웹 UI 수준으로 강화) ──
function buildServerSystemPrompt(): string {
  const lines: string[] = []

  // ── 역할 및 도구 설명 ──
  lines.push('당신은 이 게임의 모든 데이터를 꿰뚫고 있는 전문 게임 데이터 어시스턴트입니다.')
  lines.push('사용자의 질문에 답하기 위해 아래 도구들을 적극 활용하세요:')
  lines.push('- query_game_data: 실제 게임 데이터를 SQL로 조회')
  lines.push('- show_table_schema: 테이블의 스키마 구조(컬럼, 타입, 행 수) 조회')
  lines.push('- query_git_history: Git 변경 이력 조회. repo="data"(aegisdata 데이터 저장소, 기본값) 또는 repo="aegis"(aegis 코드 저장소)')
  lines.push('- create_artifact: HTML 문서/보고서 생성. 분석 결과를 정리된 문서로 제공할 때 사용')
  lines.push('- search_code: C# 게임 클라이언트 소스코드 검색 (클래스/메서드/파일명/내용 전문검색). 코드 구현 방식, 로직, 버그 분석 시 사용')
  lines.push('- read_code_file: 특정 .cs 파일 전체 내용 읽기. search_code로 경로 확인 후 호출')
  lines.push('- search_jira: Jira 이슈 JQL 검색 (버그/작업/스프린트 조회)')
  lines.push('- get_jira_issue: Jira 이슈 상세 조회 (AEGIS-1234 등 이슈 키 직접 지정)')
  lines.push('- search_confluence: Confluence 문서 CQL 검색 (기획서/스펙/회의록 등)')
  lines.push('- get_confluence_page: Confluence 페이지 전체 내용 조회 (pageId 필요)')
  lines.push('- search_assets: Unity 에셋 파일 검색 (FBX 3D 모델, PNG 텍스처, WAV/MP3 사운드 등). ext="fbx"로 3D 모델만 검색 가능')
  lines.push('- find_resource_image: 게임 리소스 이미지(PNG) 검색 (아이콘, UI 이미지, 스프라이트)')
  lines.push('- build_character_profile: 캐릭터명 → FK 연결 모든 데이터 자동 수집. 이름 검색 실패 시 전체 목록 반환 → character_id로 재호출')
  lines.push('- read_guide: ⭐⭐⭐ 최우선 시작점! DB+코드 통합 가이드 MD 읽기. 어떤 질문이든 관련 가이드를 먼저 읽고 답변하세요')
  lines.push('  → DB/게임 질문: read_guide("_DB_OVERVIEW") → 도메인 가이드(_DB_Character, _DB_Skill 등)')
  lines.push('  → 코드 질문:   read_guide("_OVERVIEW") → 도메인 가이드(_Skill, _Weapon, _Character 등)')
  lines.push('  → 가이드 목록: read_guide("") 로 전체 확인')
  lines.push('')

  // ── 가이드 우선 원칙 ──
  lines.push('[가이드 우선 원칙 — 모든 질문에 적용]')
  lines.push('⭐⭐⭐ 어떤 질문이든 답변 전에 반드시 관련 가이드를 먼저 read_guide로 읽으세요!')
  lines.push('질문 유형별 가이드 우선 순서:')
  lines.push('- 캐릭터/스킬/무기/아이템 질문 → read_guide("_DB_OVERVIEW") → read_guide("_DB_Character"/"_DB_Skill"/"_DB_Weapon")')
  lines.push('- Enum/코드값 질문 → read_guide("_DB_Enums")')
  lines.push('- 게임 데이터 일반 → read_guide("_DB_OVERVIEW") 로 테이블 구조 파악 후 쿼리')
  lines.push('- 코드 구현/로직 질문 → read_guide("_OVERVIEW") → read_guide("_Skill"/"_Weapon"/"_Character" 등)')
  lines.push('- 모르는 시스템 → read_guide("") 로 목록 먼저 확인')
  lines.push('가이드를 읽으면: 테이블 구조, FK 관계, 중요 컬럼, 클래스/메서드 위치를 사전에 알 수 있어 불필요한 탐색을 줄입니다.')
  lines.push('')

  // ── SQL 규칙 ──
  lines.push('[SQL 규칙 — 반드시 준수]')
  lines.push('- 테이블명: 대소문자 무시 (skill, Skill, SKILL 모두 동작)')
  lines.push('- #접두사 컬럼: 반드시 백틱 → `#char_memo`')
  lines.push('- 모든 값은 문자열 → WHERE id = \'1001\'')
  lines.push('- 숫자 비교: CAST(level AS NUMBER) > 10')
  lines.push('- 컬럼명은 소문자로 저장됨')
  lines.push('- LIMIT 사용: 큰 테이블은 LIMIT 50 등으로 제한')
  lines.push('')
  lines.push('[SQL 별칭(AS) 절대 금지 규칙]')
  lines.push('- AS 뒤 별칭은 반드시 영문·숫자·언더스코어만 사용 (예: AS char_name, AS skill_id)')
  lines.push('- 한글 별칭 절대 금지 → AS 대상, AS 이름, AS 스킬명 등 모두 파싱 오류 발생')
  lines.push('- 잘못된 예: exec_target AS 대상  →  올바른 예: exec_target AS target')
  lines.push('- 별칭이 필요 없으면 그냥 컬럼명 원본을 그대로 사용할 것')
  lines.push('')

  // ── 예약어 테이블명 ──
  const reservedTables: string[] = []
  for (const t of _serverTableList) {
    if (SERVER_RESERVED_TABLE_NAMES.has(t.name.toUpperCase())) {
      reservedTables.push(t.name)
    }
  }
  if (reservedTables.length > 0) {
    lines.push('[alasql 예약어 테이블명 규칙 — 반드시 준수]')
    lines.push('아래 테이블명은 alasql 예약어이므로 SQL에서 직접 사용 불가. 내부명(__u_xxx)으로 쿼리할 것:')
    for (const name of reservedTables) {
      lines.push(`- "${name}" 게임데이터 테이블 → SELECT * FROM __u_${name.toLowerCase()} WHERE ... (절대 FROM ${name} 사용 금지)`)
    }
    lines.push('')
  }

  // ── Jira / Confluence 규칙 ──
  lines.push('[Jira / Confluence 사용 규칙]')
  lines.push('- 프로젝트 키: AEGIS (cloud.jira.krafton.com)')
  lines.push('- 버그, 이슈, 작업 조회 요청 → search_jira(jql) 호출')
  lines.push('- 특정 이슈 번호 언급 (예: AEGIS-1234) → get_jira_issue("AEGIS-1234") 바로 호출')
  lines.push('- 기획서/스펙 문서 요청 → search_confluence(cql) 호출')
  lines.push('- 검색 결과에서 특정 페이지 내용이 필요하면 get_confluence_page(pageId) 호출')
  lines.push('')
  lines.push('[JQL 작성 규칙]')
  lines.push('- 기본: "project = AEGIS ORDER BY updated DESC"')
  lines.push('- ⚠️ 날짜 필터(updated >= -Nd)는 사용자가 명시적으로 "최근 N일"을 요청할 때만 사용')
  lines.push('- 일반 이슈: "project = AEGIS AND status != Done ORDER BY updated DESC"')
  lines.push('- 버그: "project = AEGIS AND issuetype = Bug AND status != Done ORDER BY updated DESC"')
  lines.push('- 진행 중: "project = AEGIS AND status = \\"In Progress\\" ORDER BY updated DESC"')
  lines.push('- 담당자: "project = AEGIS AND assignee = \\"이름\\" ORDER BY updated DESC"')
  lines.push('- 텍스트 검색: "project = AEGIS AND text ~ \\"검색어\\" ORDER BY updated DESC"')
  lines.push('- CQL: "space = \\"AEGIS\\" AND text ~ \\"캐릭터 스킬\\" AND type = page ORDER BY lastModified DESC"')
  lines.push('')

  // ── 코드 분석 규칙 ──
  lines.push('[C# 코드 분석 규칙]')
  lines.push('- ⭐ 코드 분석 시작 전: read_guide(name="_OVERVIEW") 로 전체 폴더 구조를 먼저 파악')
  lines.push('- 특정 시스템: read_guide(name="_Skill"), read_guide(name="_Weapon") 등 도메인 가이드 먼저 읽기')
  lines.push('- 코드 관련 질문: read_guide → search_code → 필요 시 read_code_file 순서')
  lines.push('- 클래스 검색: search_code(query="ClassName", type="class")')
  lines.push('- 메서드 검색: search_code(query="MethodName", type="method")')
  lines.push('- 내용 전문검색: search_code(query="keyword", type="content")')
  lines.push('')

  // ── 캐릭터 프로파일 규칙 ──
  lines.push('[캐릭터 기획서/프로파일 규칙]')
  lines.push('- "캐릭터 기획서", "프로파일", "캐릭터 카드", "개요" 요청 시: build_character_profile 먼저 → create_artifact 순서')
  lines.push('- "데이터 다 제공해줘", "모든 데이터 보여줘" 요청도 동일하게 build_character_profile 먼저 호출')
  lines.push('')

  // ── 아티팩트 생성 규칙 ──
  lines.push('[아티팩트 생성 규칙]')
  lines.push('- "정리해줘", "문서로", "보고서", "시트 만들어줘" 등 시각적 결과물 요청 시 create_artifact 호출')
  lines.push('- 데이터 수집이 끝나면 즉시 create_artifact를 호출 (선언 없이)')
  lines.push('- html 파라미터: 완전한 HTML 콘텐츠. 다크 테마(배경 #0f1117, 텍스트 #e2e8f0, 포인트 #6366f1) 스타일 권장')
  lines.push('')

  // ── 응답 규칙 ──
  lines.push('[응답 규칙]')
  lines.push('- 답변은 반드시 한국어로 작성')
  lines.push('- 단순 나열이 아닌, 의미있는 해석과 함께 친절하게 설명')
  lines.push('- 데이터를 보여줄 때는 테이블 형식(마크다운)으로 정리')
  lines.push('- 쿼리 결과가 많으면 주요 패턴이나 인사이트를 요약')
  lines.push('')

  // ── 스키마 정보 ──
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
      const MAX_ITERATIONS = 12
      const systemPrompt = buildServerSystemPrompt()

      // Claude messages 빌드 (히스토리 + 새 메시지)
      const messages: Array<{ role: string; content: unknown }> = [
        ...session.messages,
        { role: 'user', content: userMessage },
      ]

      const allToolCalls: Array<{ tool: string; input: unknown; result: unknown; summary?: string }> = []

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
                const { result, data: toolData } = await serverExecuteToolAsync(tb.name!, tb.input ?? {}, options)
                allToolCalls.push({ tool: tb.name!, input: tb.input, result: toolData ?? result, summary: result.slice(0, 300) })
                toolResults.push({ type: 'tool_result', tool_use_id: tb.id!, content: result })
                res.write(`event: tool_done\ndata: ${JSON.stringify({ tool: tb.name, summary: result.slice(0, 300) })}\n\n`)
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
              const { result, data: toolData } = await serverExecuteToolAsync(tb.name!, tb.input ?? {}, options)
              allToolCalls.push({ tool: tb.name!, input: tb.input, result: toolData ?? result, summary: result.slice(0, 300) })
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id!, content: result })
            }
            messages.push({ role: 'user', content: toolResults })
            continue
          }
          break
        }
        // max iterations에 도달해도 마지막 텍스트 추출
        const lastAssistant = messages.filter(m => m.role === 'assistant').pop()
        let lastText = ''
        if (lastAssistant && Array.isArray(lastAssistant.content)) {
          lastText = (lastAssistant.content as Array<{type: string; text?: string}>).filter(b => b.type === 'text').map(b => b.text ?? '').join('\n')
        } else if (typeof lastAssistant?.content === 'string') {
          lastText = lastAssistant.content
        }
        sendJson(res, 200, { session_id: session.id, content: lastText || '(응답 생성 완료 — 도구 호출 결과를 tool_calls에서 확인하세요)', tool_calls: allToolCalls })
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

<h2>🛠️ AI가 사용하는 도구 목록</h2>
<p>챗봇이 자동으로 사용하는 도구들입니다. <code>tool_calls</code>에서 어떤 도구가 사용되었는지 확인 가능합니다.</p>
<table>
  <tr><th>도구</th><th>설명</th></tr>
  <tr><td><code>query_game_data</code></td><td>SQL로 게임 데이터 조회</td></tr>
  <tr><td><code>show_table_schema</code></td><td>테이블 구조/컬럼 정보</td></tr>
  <tr><td><code>query_git_history</code></td><td>Git 변경 이력 (data/aegis 저장소)</td></tr>
  <tr><td><code>create_artifact</code></td><td>HTML 문서/보고서 생성</td></tr>
  <tr><td><code>search_code</code></td><td>C# 소스코드 검색 (클래스, 메서드, 전문검색)</td></tr>
  <tr><td><code>read_code_file</code></td><td>C# 파일 내용 읽기</td></tr>
  <tr><td><code>search_jira</code></td><td>Jira 이슈 JQL 검색</td></tr>
  <tr><td><code>get_jira_issue</code></td><td>Jira 이슈 상세 조회</td></tr>
  <tr><td><code>search_confluence</code></td><td>Confluence 문서 CQL 검색</td></tr>
  <tr><td><code>get_confluence_page</code></td><td>Confluence 페이지 전체 내용</td></tr>
  <tr><td><code>search_assets</code></td><td>Unity 에셋 파일 검색 (FBX, PNG, WAV 등)</td></tr>
  <tr><td><code>find_resource_image</code></td><td>게임 리소스 이미지 검색</td></tr>
  <tr><td><code>build_character_profile</code></td><td>캐릭터 연관 데이터 자동 수집</td></tr>
  <tr><td><code>read_guide</code></td><td>코드/DB 가이드 문서 읽기</td></tr>
</table>

<h2>💡 사용 팁</h2>
<ul style="padding-left:1.5em;color:#94a3b8">
  <li><code>session_id</code>를 재사용하면 대화 맥락이 유지됩니다</li>
  <li>AI는 자동으로 SQL 쿼리, Git 히스토리, Jira/Confluence 검색, 코드 검색 등 도구를 사용합니다</li>
  <li><code>tool_calls</code> 배열에서 AI가 어떤 도구를 사용했는지, 어떤 결과를 받았는지 확인할 수 있습니다</li>
  <li>SSE 스트리밍 모드(<code>"stream": true</code>)로 실시간 응답을 받을 수 있습니다</li>
  <li><code>/api/v1/query</code>로 AI 없이 직접 SQL을 실행할 수도 있습니다</li>
  <li>코드 관련 질문은 <code>search_code</code> → <code>read_code_file</code> 순서로 자동 호출됩니다</li>
  <li>Jira 이슈 번호(예: AEGIS-1234)를 직접 언급하면 바로 상세 조회합니다</li>
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
