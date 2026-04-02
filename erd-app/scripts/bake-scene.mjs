/**
 * bake-scene.mjs
 *
 * 독립 실행 가능한 Unity 씬 베이크 스크립트.
 * SceneMeshExporter.cs 와 동일한 방식으로 FBX 를 월드스페이스로 변환해
 * scene-cache/<sceneName>/meshes.json + scene_info.json 을 생성합니다.
 *
 * 사용법:
 *   node scripts/bake-scene.mjs --path GameContents/Map/OldTown.unity [--force]
 *
 * stdout 에 JSON-line 진행 상황을 출력합니다:
 *   {"type":"progress","current":N,"total":100,"msg":"..."}
 *   {"type":"done","sceneName":"...","meshCount":N}
 *   {"type":"error","msg":"..."}
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// scripts/ 의 부모 = erd-app/, 그 부모 = DBMLViewer/
const ERD_APP_DIR    = join(__dirname, '..')
const ASSETS_DIR     = join(ERD_APP_DIR, '..', '..', 'unity_project', 'Client', 'Project_Aegis', 'Assets')
const CACHE_DIR      = join(ERD_APP_DIR, '..', 'scene-cache')

// ── 인자 파싱 ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const pathIdx = args.indexOf('--path')
const scenePath = pathIdx >= 0 ? args[pathIdx + 1] : null
const force = args.includes('--force')

if (!scenePath) {
  process.stderr.write('사용법: node scripts/bake-scene.mjs --path GameContents/Map/OldTown.unity [--force]\n')
  process.exit(1)
}

// ── 진행 출력 헬퍼 ─────────────────────────────────────────────────────────────
const prog = (current, total, msg) =>
  process.stdout.write(JSON.stringify({ type: 'progress', current, total, msg }) + '\n')
const done = (sceneName, meshCount) =>
  process.stdout.write(JSON.stringify({ type: 'done', sceneName, meshCount }) + '\n')
const err = (msg) => {
  process.stdout.write(JSON.stringify({ type: 'error', msg }) + '\n')
  process.exit(1)
}

// ── 캐시 확인 ─────────────────────────────────────────────────────────────────
const sceneName = scenePath.split('/').pop().replace(/\.unity$/i, '')
const cacheDir  = join(CACHE_DIR, sceneName)
const meshPath  = join(cacheDir, 'meshes.json')
const infoPath  = join(cacheDir, 'scene_info.json')

if (!force && existsSync(meshPath) && existsSync(infoPath)) {
  const info = JSON.parse(readFileSync(infoPath, 'utf-8'))
  prog(100, 100, '캐시 존재 – 스킵')
  done(sceneName, info.meshCount ?? 0)
  process.exit(0)
}

// ── 씬 파일 확인 ─────────────────────────────────────────────────────────────
const sceneAbs = join(ASSETS_DIR, ...scenePath.split('/'))
if (!existsSync(sceneAbs)) {
  err(`씬 파일 없음: ${sceneAbs}`)
}

prog(0, 100, 'Unity 씬 파싱 중...')

// ── GUID 인덱스 구축 ──────────────────────────────────────────────────────────
prog(2, 100, 'GUID 인덱스 구축 중...')
const guidIndex = new Map()
const walkMeta = (dir) => {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const f of entries) {
    const fp = join(dir, f)
    try {
      if (statSync(fp).isDirectory()) { walkMeta(fp); continue }
      if (!f.endsWith('.meta')) continue
      const content = readFileSync(fp, 'utf-8')
      const m = content.match(/^guid:\s*([a-f0-9]+)/m)
      if (m) guidIndex.set(m[1], fp.replace(/\.meta$/, ''))
    } catch { /* skip */ }
  }
}
walkMeta(ASSETS_DIR)
prog(10, 100, `GUID 인덱스 완료: ${guidIndex.size}개`)

const guidToAbs = (guid) => guidIndex.get(guid) ?? null

// ── 씬 YAML 파싱 ─────────────────────────────────────────────────────────────
prog(12, 100, '씬 YAML 파싱 중...')
const sceneYaml = readFileSync(sceneAbs, 'utf-8')

const tfMap = {}
for (const m of sceneYaml.matchAll(/--- !u!4 &(\d+)\n([\s\S]*?)(?=\n--- |\n$)/g)) {
  const id = m[1]; const blk = m[2]
  const goM  = blk.match(/m_GameObject:\s*\{.*?fileID:\s*(\d+)/)
  const parM = blk.match(/m_Father:\s*\{.*?fileID:\s*(\d+)/)
  const pxM  = blk.match(/m_LocalPosition:\s*\{x:\s*([\d.\-eE+]+),\s*y:\s*([\d.\-eE+]+),\s*z:\s*([\d.\-eE+]+)/)
  const rxM  = blk.match(/m_LocalRotation:\s*\{x:\s*([\d.\-eE+]+),\s*y:\s*([\d.\-eE+]+),\s*z:\s*([\d.\-eE+]+),\s*w:\s*([\d.\-eE+]+)/)
  const sxM  = blk.match(/m_LocalScale:\s*\{x:\s*([\d.\-eE+]+),\s*y:\s*([\d.\-eE+]+),\s*z:\s*([\d.\-eE+]+)/)
  if (!goM) continue
  tfMap[id] = {
    id, goId: goM[1], parentId: parM ? parM[1] : '0',
    lpos: pxM ? { x: +pxM[1], y: +pxM[2], z: +pxM[3] } : { x:0,y:0,z:0 },
    lrot: rxM ? { x: +rxM[1], y: +rxM[2], z: +rxM[3], w: +rxM[4] } : { x:0,y:0,z:0,w:1 },
    lscl: sxM ? { x: +sxM[1], y: +sxM[2], z: +sxM[3] } : { x:1,y:1,z:1 },
  }
}

// ── 월드 트랜스폼 계산 ────────────────────────────────────────────────────────
const wtCache = {}
const getWorldTf = (tfId) => {
  if (wtCache[tfId]) return wtCache[tfId]
  const tf = tfMap[tfId]
  if (!tf) return { pos:{x:0,y:0,z:0}, rot:{x:0,y:0,z:0,w:1}, scale:{x:1,y:1,z:1} }
  if (tf.parentId === '0') return (wtCache[tfId] = { pos: tf.lpos, rot: tf.lrot, scale: tf.lscl })
  const parent = getWorldTf(tf.parentId)
  const ps = parent.scale, pr = parent.rot, lp = tf.lpos
  const q = pr
  const ix = q.w*lp.x + q.y*lp.z - q.z*lp.y
  const iy = q.w*lp.y + q.z*lp.x - q.x*lp.z
  const iz = q.w*lp.z + q.x*lp.y - q.y*lp.x
  const iw = -q.x*lp.x - q.y*lp.y - q.z*lp.z
  const rx = ix*q.w + iw*(-q.x) + iy*(-q.z) - iz*(-q.y)
  const ry = iy*q.w + iw*(-q.y) + iz*(-q.x) - ix*(-q.z)
  const rz = iz*q.w + iw*(-q.z) + ix*(-q.y) - iy*(-q.x)
  const worldPos = { x: parent.pos.x + ps.x*rx, y: parent.pos.y + ps.y*ry, z: parent.pos.z + ps.z*rz }
  const qa = parent.rot, qb = tf.lrot
  const worldRot = {
    x: qa.w*qb.x + qa.x*qb.w + qa.y*qb.z - qa.z*qb.y,
    y: qa.w*qb.y - qa.x*qb.z + qa.y*qb.w + qa.z*qb.x,
    z: qa.w*qb.z + qa.x*qb.y - qa.y*qb.x + qa.z*qb.w,
    w: qa.w*qb.w - qa.x*qb.x - qa.y*qb.y - qa.z*qb.z,
  }
  return (wtCache[tfId] = { pos: worldPos, rot: worldRot, scale: { x: ps.x*tf.lscl.x, y: ps.y*tf.lscl.y, z: ps.z*tf.lscl.z } })
}

// ── 오브젝트 목록 수집 (MeshFilter + PrefabInstance) ─────────────────────────
const goNames = {}
for (const m of sceneYaml.matchAll(/--- !u!1 &(\d+)\n[\s\S]*?m_Name:\s*(.+)/g))
  goNames[m[1]] = m[2].trim()

const bakeMeshObjs = []

// MeshFilter 직접
for (const m of sceneYaml.matchAll(/--- !u!33 &(\d+)\n([\s\S]*?)(?=\n--- |\n$)/g)) {
  const blk = m[2]
  const goM = blk.match(/m_GameObject:\s*\{.*?fileID:\s*(\d+)/)
  const mgM = blk.match(/m_Mesh:\s*\{.*?guid:\s*([a-f0-9]+)/)
  if (!goM || !mgM) continue
  const goId = goM[1]
  const tfId = Object.keys(tfMap).find(k => tfMap[k].goId === goId) ?? ''
  if (!tfId) continue
  const wt = getWorldTf(tfId)
  bakeMeshObjs.push({ name: goNames[goId] ?? `GO_${goId}`, meshGuid: mgM[1], fbxAbs: null, ...wt })
}

// PrefabInstance
const prefabCache = {}
const resolvePrefabFbx = (guid, depth = 0) => {
  if (depth > 6) return null
  if (guid in prefabCache) return prefabCache[guid]
  const abs = guidToAbs(guid)
  if (!abs || !existsSync(abs)) return (prefabCache[guid] = null)
  try {
    const pc = readFileSync(abs, 'utf-8')
    for (const mm of pc.matchAll(/m_Mesh:\s*\{.*?guid:\s*([a-f0-9]+)/g)) {
      const fa = guidToAbs(mm[1])
      if (fa && /\.fbx$/i.test(fa)) return (prefabCache[guid] = fa)
    }
    for (const mm of pc.matchAll(/m_SourcePrefab:\s*\{.*?guid:\s*([a-f0-9]+)/g)) {
      if (mm[1] === guid) continue
      const r = resolvePrefabFbx(mm[1], depth + 1)
      if (r) return (prefabCache[guid] = r)
    }
  } catch { /* skip */ }
  return (prefabCache[guid] = null)
}

for (const m of sceneYaml.matchAll(/--- !u!1001 &(\d+)\n([\s\S]*?)(?=\n--- |\n$)/g)) {
  const blk = m[2]
  const spM = blk.match(/m_SourcePrefab:\s*\{.*?guid:\s*([a-f0-9]+)/)
  if (!spM) continue
  const fbxAbs = resolvePrefabFbx(spM[1])
  if (!fbxAbs) continue
  let tfId = ''
  const piGoM = blk.match(/m_RootGameObject:\s*\{.*?fileID:\s*(\d+)/)
  if (piGoM) tfId = Object.keys(tfMap).find(k => tfMap[k].goId === piGoM[1]) ?? ''
  const wt = tfId ? getWorldTf(tfId) : { pos:{x:0,y:0,z:0}, rot:{x:0,y:0,z:0,w:1}, scale:{x:1,y:1,z:1} }
  const nameM = blk.match(/m_Name:\s*(.+)/)
  bakeMeshObjs.push({ name: nameM ? nameM[1].trim() : 'Prefab', meshGuid: '', fbxAbs, ...wt })
}

prog(15, 100, `${bakeMeshObjs.length}개 오브젝트 발견, FBX 로딩 중...`)

// ── Node.js 폴리필 (Three.js FBXLoader 용) ───────────────────────────────────
// Image 폴리필 – FBXLoader 가 텍스처를 로드할 때 Image 를 사용함
// Node.js 에는 없으므로 no-op 폴리필 제공 (텍스처 없이 메시만 추출)
class ImagePolyfill {
  constructor() {
    this.onload  = null
    this.onerror = null
    this.src = ''
    this.width  = 0
    this.height = 0
    this.naturalWidth  = 0
    this.naturalHeight = 0
    this.complete = true
  }
  addEventListener(type, fn) {
    if (type === 'load' && this.onload)  { try { this.onload() } catch {} }
    if (type === 'error' && this.onerror) { /* skip */ }
  }
  removeEventListener() {}
  set src(v) { this._src = v; if (this.onload) { try { this.onload() } catch {} } }
  get src() { return this._src ?? '' }
}
if (typeof global.Image === 'undefined') global.Image = ImagePolyfill
if (typeof global.HTMLImageElement === 'undefined') global.HTMLImageElement = ImagePolyfill

if (typeof global.document === 'undefined') {
  global.document = {
    createElementNS: (_, tag) => {
      if (tag === 'canvas') return { getContext: () => null, width: 0, height: 0, style: {} }
      if (tag === 'img')    return new ImagePolyfill()
      return { style: {} }
    },
    createElement: (tag) => {
      if (tag === 'canvas') return { getContext: () => null, width: 0, height: 0 }
      if (tag === 'img')    return new ImagePolyfill()
      return { style: {} }
    },
  }
}
if (typeof global.window === 'undefined') global.window = global
if (typeof global.self   === 'undefined') global.self   = global
// Node.js v24+ 에서는 navigator 가 getter-only 이므로 defineProperty 사용
try {
  if (typeof global.navigator === 'undefined' || !global.navigator?.userAgent?.includes('node')) {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'node.js', platform: 'node' },
      configurable: true, writable: true,
    })
  }
} catch { /* 이미 설정되어 있으면 무시 */ }

// ── Three.js + FBXLoader 로드 ─────────────────────────────────────────────────
// three.js 는 named exports 만 있고 default export 가 없으므로 * 로 임포트해야 함
const THREE = await import('three')
// FBXLoader 내부에서 global.THREE 를 참조할 수 있으므로 전역에도 등록
global.THREE = THREE
const { FBXLoader }      = await import('three/examples/jsm/loaders/FBXLoader.js')

// ── 월드 버텍스 변환 (SceneMeshExporter.cs localToWorldMatrix) ────────────────
const applyWorldTf = (localVerts, wt) => {
  const { pos, rot: q, scale } = wt
  const sx = scale.x, sy = scale.y, sz = scale.z
  const x2=q.x+q.x, y2=q.y+q.y, z2=q.z+q.z
  const xx=q.x*x2, xy=q.x*y2, xz=q.x*z2
  const yy=q.y*y2, yz=q.y*z2, zz=q.z*z2
  const wx=q.w*x2, wy=q.w*y2, wz=q.w*z2
  const m00=(1-(yy+zz))*sx, m01=(xy-wz)*sy,    m02=(xz+wy)*sz
  const m10=(xy+wz)*sx,    m11=(1-(xx+zz))*sy, m12=(yz-wx)*sz
  const m20=(xz-wy)*sx,    m21=(yz+wx)*sy,    m22=(1-(xx+yy))*sz
  return localVerts.map(v => ({
    x: m00*v.x + m01*v.y + m02*v.z + pos.x,
    y: m10*v.x + m11*v.y + m12*v.z + pos.y,
    z: m20*v.x + m21*v.y + m22*v.z + pos.z,
  }))
}

// ── FBX 로더 동작 검증 ────────────────────────────────────────────────────────
{
  const testFbx = bakeMeshObjs.find(o => (o.fbxAbs ?? guidToAbs(o.meshGuid) ?? '').toLowerCase().endsWith('.fbx'))
  if (testFbx) {
    const fp = testFbx.fbxAbs ?? guidToAbs(testFbx.meshGuid)
    try {
      const buf = readFileSync(fp)
      const testLoader = new FBXLoader()
      const testGrp = testLoader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
      let testCnt = 0
      testGrp.traverse(c => { if (c.isMesh) testCnt++ })
      process.stderr.write(`[DEBUG] 첫 FBX 테스트: ${fp} → ${testCnt} meshes\n`)
    } catch (te) {
      process.stderr.write(`[DEBUG] 첫 FBX 테스트 실패: ${fp} → ${te.message}\n${te.stack?.split('\n').slice(0,5).join('\n')}\n`)
    }
  }
}

// ── FBX 로드 + 메시 추출 ──────────────────────────────────────────────────────
const fbxCache = new Map()
const meshObjects = []
let doneCount = 0

for (const bObj of bakeMeshObjs) {
  const fbxAbs = bObj.fbxAbs ?? guidToAbs(bObj.meshGuid) ?? ''
  if (!fbxAbs || !/\.fbx$/i.test(fbxAbs) || !existsSync(fbxAbs)) { doneCount++; continue }

  try {
    let fbxGroup
    if (fbxCache.has(fbxAbs)) {
      fbxGroup = fbxCache.get(fbxAbs)
    } else {
      const buf = readFileSync(fbxAbs)
      const loader = new FBXLoader()
      fbxGroup = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
      fbxGroup.updateMatrixWorld(true)
      fbxCache.set(fbxAbs, fbxGroup)
    }

    const wt = { pos: bObj.pos, rot: bObj.rot, scale: bObj.scale }
    fbxGroup.traverse((child) => {
      if (!child.isMesh) return
      const geo = child.geometry
      if (!geo?.attributes?.position) return
      const posAttr = geo.attributes.position
      child.updateMatrixWorld(true)
      const localVerts = []
      const v3 = new THREE.Vector3()
      for (let i = 0; i < posAttr.count; i++) {
        v3.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
        v3.applyMatrix4(child.matrixWorld)
        // NO Z-flip: C# SceneMeshExporter keeps Unity coords as-is
        localVerts.push({ x: v3.x, y: v3.y, z: v3.z })
      }
      const worldVerts = applyWorldTf(localVerts, wt)
      const indices = geo.index ? Array.from(geo.index.array) : null

      // UV (matching C# exporter: mesh.uv)
      let uvs = null
      const uvAttr = geo.attributes.uv
      if (uvAttr) {
        uvs = []
        for (let i = 0; i < uvAttr.count; i++) {
          uvs.push({ x: Math.round(uvAttr.getX(i) * 100) / 100, y: Math.round(uvAttr.getY(i) * 100) / 100 })
        }
      }

      // Material (matching C# exporter output format)
      let material = undefined
      if (child.material) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material
        material = {
          name: mat?.name ?? 'Default',
          color: mat?.color ? { r: mat.color.r, g: mat.color.g, b: mat.color.b, a: 1.0 } : { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          shaderName: mat?.type ?? 'Unknown',
          mainTextureId: '',
          mainTextureTiling: { x: 1, y: 1 },
          mainTextureOffset: { x: 0, y: 0 },
          lightmapIndex: -1,
        }
      }

      meshObjects.push({
        name: bObj.name, path: bObj.name,
        geometry: { vertices: worldVerts, triangles: indices, uvs },
        material,
      })
    })
  } catch (e) {
    if (doneCount < 3) {
      // 처음 몇 개 실패에 대해서만 풀 스택 출력
      process.stderr.write(`[WARN] FBX 로드 실패: ${fbxAbs} – ${e}\n${e.stack?.split('\n').slice(0,8).join('\n')}\n`)
    } else {
      process.stderr.write(`[WARN] FBX 로드 실패: ${fbxAbs} – ${e.message ?? e}\n`)
    }
  }

  doneCount++
  if (doneCount % 10 === 0 || doneCount === bakeMeshObjs.length) {
    prog(15 + Math.floor(doneCount / Math.max(bakeMeshObjs.length, 1) * 80), 100,
      `FBX 처리 중... ${doneCount}/${bakeMeshObjs.length}`)
  }
}

// ── Bounds 계산 ───────────────────────────────────────────────────────────────
let mnX=Infinity,mnY=Infinity,mnZ=Infinity, mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity
for (const obj of meshObjects)
  for (const v of (obj.geometry?.vertices ?? [])) {
    if(v.x<mnX)mnX=v.x; if(v.x>mxX)mxX=v.x
    if(v.y<mnY)mnY=v.y; if(v.y>mxY)mxY=v.y
    if(v.z<mnZ)mnZ=v.z; if(v.z>mxZ)mxZ=v.z
  }
const bounds = isFinite(mnX) ? {
  min:{x:mnX,y:mnY,z:mnZ}, max:{x:mxX,y:mxY,z:mxZ},
  center:{x:(mnX+mxX)/2,y:(mnY+mxY)/2,z:(mnZ+mxZ)/2},
  size:{x:mxX-mnX,y:mxY-mnY,z:mxZ-mnZ},
} : undefined

// ── 캐시 저장 ─────────────────────────────────────────────────────────────────
mkdirSync(cacheDir, { recursive: true })
writeFileSync(meshPath, JSON.stringify({ meshObjects }))
writeFileSync(infoPath, JSON.stringify({
  sceneName, meshCount: meshObjects.length,
  exportTime: new Date().toISOString(),
  source: 'bake-scene-script',
  bounds,
}))

prog(100, 100, `완료! ${meshObjects.length}개 메시 저장됨`)
done(sceneName, meshObjects.length)
