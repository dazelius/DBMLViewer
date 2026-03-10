/**
 * SceneViewer.tsx  (v5 – Full Component Visualization)
 *
 * Unity .unity 씬 파일의 모든 컴포넌트(Mesh, Light, Collider, Camera, Audio, Particle)를
 * Three.js로 시각화. WASD FPS 이동, 레이어 토글, 컴포넌트 Inspector 지원.
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface Vec3  { x: number; y: number; z: number }
interface Col3  { r: number; g: number; b: number }

interface MeshMaterial {
  color?:               Col3
  mainTextureId?:       string
  mainTextureTiling?:   { x: number; y: number }
  mainTextureOffset?:   { x: number; y: number }
  lightmapIndex?:       number
  lightmapScaleOffset?: { x: number; y: number; z: number; w: number }
}

interface MeshGeometry {
  vertices:  Vec3[]
  normals?:  Vec3[]
  uvs?:      { x: number; y: number }[]
  uv2s?:     { x: number; y: number }[]
  triangles?: number[]
  bounds?:   { center: Vec3; size: Vec3 }
}

interface LightInfo    { lightType: number; color: Col3; intensity: number; range: number; spotAngle: number; innerSpotAngle: number; shadowType: number }
interface ColliderInfo { type: 'box'|'sphere'|'capsule'|'mesh'; isTrigger: boolean; center: Vec3; size?: Vec3; radius?: number; height?: number; direction?: number }
interface CameraInfo   { fov: number; near: number; far: number; ortho: boolean; orthoSize: number; clearFlags: number }
interface RigidbodyInfo { mass: number; isKinematic: boolean; useGravity: boolean }
interface AudioInfo    { volume: number; loop: boolean; spatialBlend: number }

interface ComponentData {
  Light?:       LightInfo
  colliders?:   ColliderInfo[]
  Camera?:      CameraInfo
  Rigidbody?:   RigidbodyInfo
  AudioSource?: AudioInfo
  scripts?:     string[]
}

interface MeshJsonObject {
  name:      string
  path:      string
  layer?:    string
  tag?:      string
  transform: { position: Vec3; rotation: Vec3; scale: Vec3 }
  geometry:  MeshGeometry
  material?: MeshMaterial
  components?:    string[]
  componentData?: ComponentData
}

interface SceneInfo {
  sceneName:  string
  meshCount:  number
  bounds?:    { min: Vec3; max: Vec3 }
  spawnPoints?: unknown[]
  neutralPointCaptures?: unknown[]
}

interface MapEntry {
  folder:    string
  sceneName: string
  meshCount: number
  thumbUrl:  string
}

// ── 레이어 시스템 ────────────────────────────────────────────────────────────
type LayerName = 'Mesh' | 'Light' | 'Collider' | 'Camera' | 'Audio' | 'Particle' | 'Trigger'
const LAYER_COLORS: Record<LayerName, string> = {
  Mesh:     '#60a5fa',
  Light:    '#fbbf24',
  Collider: '#4ade80',
  Camera:   '#a78bfa',
  Audio:    '#38bdf8',
  Particle: '#f472b6',
  Trigger:  '#fb923c',
}
const LAYER_ICONS: Record<LayerName, string> = {
  Mesh: '◆', Light: '💡', Collider: '🛡', Camera: '📷', Audio: '🔊', Particle: '✨', Trigger: '⚡',
}

// ── 상수 ────────────────────────────────────────────────────────────────────
const CHUNK_SIZE  = 80
const TEX_CONCURRENCY = 6

interface SceneViewerProps {
  scenePath: string
  height?:   number
}

// ── 텍스처 로딩 ──────────────────────────────────────────────────────────────
function loadTextureFromUrl(url: string): Promise<THREE.Texture | null> {
  return new Promise(resolve => {
    new THREE.TextureLoader().load(
      url,
      tex => { tex.flipY = false; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true; resolve(tex) },
      undefined, () => resolve(null),
    )
  })
}

// ── BufferGeometry 생성 ─────────────────────────────────────────────────────
function createGeometry(geo: MeshGeometry): THREE.BufferGeometry {
  const bg = new THREE.BufferGeometry()
  const verts = new Float32Array(geo.vertices.length * 3)
  geo.vertices.forEach((v, i) => { verts[i*3] = v.x; verts[i*3+1] = v.y; verts[i*3+2] = v.z })
  bg.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  if (geo.triangles?.length) bg.setIndex(geo.triangles)
  if (geo.normals?.length) {
    const n = new Float32Array(geo.normals.length * 3)
    geo.normals.forEach((v, i) => { n[i*3] = v.x; n[i*3+1] = v.y; n[i*3+2] = v.z })
    bg.setAttribute('normal', new THREE.BufferAttribute(n, 3))
  } else bg.computeVertexNormals()
  if (geo.uvs?.length) {
    const u = new Float32Array(geo.uvs.length * 2)
    geo.uvs.forEach((v, i) => { u[i*2] = v.x; u[i*2+1] = v.y })
    bg.setAttribute('uv', new THREE.BufferAttribute(u, 2))
  }
  if (geo.uv2s?.length) {
    const u2 = new Float32Array(geo.uv2s.length * 2)
    geo.uv2s.forEach((v, i) => { u2[i*2] = v.x; u2[i*2+1] = v.y })
    bg.setAttribute('uv2', new THREE.BufferAttribute(u2, 2))
  }
  return bg
}

// ── 메시 생성 ────────────────────────────────────────────────────────────────
function createThreeMesh(obj: MeshJsonObject, texCache: Map<string, THREE.Texture>): THREE.Mesh | null {
  if (!obj.geometry?.vertices?.length) return null
  const geo = createGeometry(obj.geometry)
  const mat = obj.material
  const baseColor = mat?.color ? new THREE.Color(mat.color.r, mat.color.g, mat.color.b) : new THREE.Color(0x888888)
  const params: Record<string, unknown> = { side: THREE.DoubleSide, color: baseColor }
  const texId = mat?.mainTextureId
  if (texId && texCache.has(texId)) {
    const tex = texCache.get(texId)!.clone(); tex.needsUpdate = true
    if (mat?.mainTextureTiling) tex.repeat.set(mat.mainTextureTiling.x || 1, mat.mainTextureTiling.y || 1)
    if (mat?.mainTextureOffset) tex.offset.set(mat.mainTextureOffset.x || 0, mat.mainTextureOffset.y || 0)
    params.map = tex; params.color = new THREE.Color(0xffffff)
  }
  const threeMesh = new THREE.Mesh(geo,
    params.map
      ? new THREE.MeshStandardMaterial({ ...params, roughness: 0.85, metalness: 0 } as THREE.MeshStandardMaterialParameters)
      : new THREE.MeshPhongMaterial({ ...params, transparent: false, flatShading: true } as THREE.MeshPhongMaterialParameters),
  )
  threeMesh.userData = { name: obj.name, path: obj.path, transform: obj.transform, layer: 'Mesh' as LayerName }
  return threeMesh
}

// ── 컴포넌트 시각화 함수들 ──────────────────────────────────────────────────
function createLightVisual(pos: Vec3, info: LightInfo): THREE.Group {
  const g = new THREE.Group()
  g.position.set(pos.x, pos.y, pos.z)
  const c = new THREE.Color(info.color.r, info.color.g, info.color.b)

  if (info.lightType === 2) {
    // Point Light
    const light = new THREE.PointLight(c, info.intensity, info.range || 10)
    g.add(light)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: c }),
    )
    g.add(sphere)
    const range = new THREE.Mesh(
      new THREE.SphereGeometry(info.range || 10, 16, 12),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.06, wireframe: true }),
    )
    g.add(range)
  } else if (info.lightType === 0) {
    // Spot Light
    const light = new THREE.SpotLight(c, info.intensity, info.range || 10, THREE.MathUtils.degToRad((info.spotAngle || 30) / 2))
    light.target.position.set(0, -1, 0)
    g.add(light); g.add(light.target)
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(Math.tan(THREE.MathUtils.degToRad((info.spotAngle || 30) / 2)) * (info.range || 10), info.range || 10, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.08, wireframe: true }),
    )
    cone.position.set(0, -(info.range || 10) / 2, 0)
    g.add(cone)
  } else {
    // Directional Light
    const light = new THREE.DirectionalLight(c, info.intensity)
    g.add(light)
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 0), 5, c.getHex())
    g.add(arrow)
  }
  g.userData = { layer: 'Light' as LayerName }
  return g
}

function createColliderVisual(pos: Vec3, col: ColliderInfo): THREE.Group {
  const g = new THREE.Group()
  const color = col.isTrigger ? 0xfb923c : 0x4ade80
  const matOpts = { color, transparent: true, opacity: 0.15, side: THREE.DoubleSide }
  const wireMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
  const cx = pos.x + (col.center?.x || 0)
  const cy = pos.y + (col.center?.y || 0)
  const cz = pos.z + (col.center?.z || 0)

  if (col.type === 'box' && col.size) {
    const geo = new THREE.BoxGeometry(col.size.x || 1, col.size.y || 1, col.size.z || 1)
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial(matOpts)))
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat))
  } else if (col.type === 'sphere') {
    const r = col.radius || 0.5
    const geo = new THREE.SphereGeometry(r, 16, 12)
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial(matOpts)))
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat))
  } else if (col.type === 'capsule') {
    const r = col.radius || 0.5, h = Math.max((col.height || 2) - r * 2, 0)
    const geo = new THREE.CapsuleGeometry(r, h, 8, 16)
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial(matOpts)))
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat))
  }

  g.position.set(cx, cy, cz)
  g.userData = { layer: (col.isTrigger ? 'Trigger' : 'Collider') as LayerName }
  return g
}

function createCameraVisual(pos: Vec3, info: CameraInfo): THREE.Group {
  const g = new THREE.Group()
  g.position.set(pos.x, pos.y, pos.z)

  // Frustum wireframe
  const near = info.near || 0.3, far = Math.min(info.far || 100, 20)
  const fov = THREE.MathUtils.degToRad(info.fov || 60)
  const aspect = 16 / 9
  const hNear = Math.tan(fov / 2) * near, wNear = hNear * aspect
  const hFar  = Math.tan(fov / 2) * far,  wFar  = hFar * aspect

  const pts = [
    new THREE.Vector3(-wNear, -hNear, -near), new THREE.Vector3( wNear, -hNear, -near),
    new THREE.Vector3( wNear,  hNear, -near), new THREE.Vector3(-wNear,  hNear, -near),
    new THREE.Vector3(-wFar,  -hFar,  -far),  new THREE.Vector3( wFar,  -hFar,  -far),
    new THREE.Vector3( wFar,   hFar,  -far),  new THREE.Vector3(-wFar,   hFar,  -far),
  ]
  const indices = [0,1, 1,2, 2,3, 3,0, 4,5, 5,6, 6,7, 7,4, 0,4, 1,5, 2,6, 3,7]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  geo.setIndex(indices)
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.8 })))

  // Camera body icon
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xa78bfa }))
  g.add(body)

  g.userData = { layer: 'Camera' as LayerName }
  return g
}

function createAudioVisual(pos: Vec3, info: AudioInfo): THREE.Group {
  const g = new THREE.Group()
  g.position.set(pos.x, pos.y, pos.z)

  // Icon sphere
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }))
  g.add(core)

  // Range (only for 3D audio)
  if (info.spatialBlend > 0) {
    const range = info.spatialBlend * 15
    const rangeGeo = new THREE.SphereGeometry(range, 16, 12)
    g.add(new THREE.Mesh(rangeGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.04, wireframe: true })))
  }

  g.userData = { layer: 'Audio' as LayerName }
  return g
}

function createParticleVisual(pos: Vec3): THREE.Group {
  const g = new THREE.Group()
  g.position.set(pos.x, pos.y, pos.z)
  // Diamond shape to indicate particle system
  const geo = new THREE.OctahedronGeometry(0.4)
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf472b6 })))
  const wireGeo = new THREE.OctahedronGeometry(1.2)
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(wireGeo), new THREE.LineBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.3 })))
  g.userData = { layer: 'Particle' as LayerName }
  return g
}

// ── 하이어라키 트리 ─────────────────────────────────────────────────────────
interface HierarchyNode {
  name:     string
  path:     string
  children: HierarchyNode[]
  meshIdx?: number
  components?: string[]
}

function buildTree(objects: MeshJsonObject[]): HierarchyNode {
  const root: HierarchyNode = { name: 'Scene', path: '', children: [] }
  objects.forEach((obj, idx) => {
    const parts = (obj.path || obj.name).split('/')
    let node = root
    parts.forEach((part, depth) => {
      const isLeaf = depth === parts.length - 1
      let child = node.children.find(c => c.name === part)
      if (!child) { child = { name: part, path: parts.slice(0, depth + 1).join('/'), children: [] }; node.children.push(child) }
      if (isLeaf) { child.meshIdx = idx; child.components = obj.components }
      node = child
    })
  })
  return root
}

function detectMapFolder(scenePath: string, maps: MapEntry[]): MapEntry | null {
  try {
    const params = new URL(scenePath, 'http://localhost').searchParams
    const pathParam = params.get('path') || ''
    const sceneName = (pathParam.split('/').pop() || '').toLowerCase().replace(/[._-]/g, '')
    const sorted = [...maps].sort((a, b) => b.folder.length - a.folder.length)
    for (const m of sorted) {
      const folder = m.folder.toLowerCase().replace(/[_-]/g, '')
      if (sceneName.includes(folder) || folder.includes(sceneName)) return m
    }
  } catch {}
  return null
}

function getComponentIcon(comp: string): string {
  if (comp.includes('Light')) return '💡'
  if (comp.includes('Collider')) return '🛡'
  if (comp.includes('Camera')) return '📷'
  if (comp.includes('Audio')) return '🔊'
  if (comp.includes('Particle')) return '✨'
  if (comp.includes('Rigidbody')) return '⚙️'
  if (comp.includes('Renderer') || comp.includes('MeshFilter')) return '◆'
  if (comp.includes('Animator')) return '🎬'
  return '📎'
}

// ── HierarchyItem ───────────────────────────────────────────────────────────
function HierarchyItem({ node, selected, onSelect, depth = 0, filter }: {
  node: HierarchyNode; selected: number | null; onSelect: (idx: number) => void; depth?: number; filter: string
}) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isLeaf = node.meshIdx !== undefined
  const isSelected = isLeaf && node.meshIdx === selected
  const matchesFilter = !filter || node.name.toLowerCase().includes(filter.toLowerCase())
  const childrenMatchFilter = !filter || node.children.some(c => matchesFilterRecursive(c, filter))

  if (filter && !matchesFilter && !childrenMatchFilter) return null

  const compIcons = (node.components || [])
    .filter(c => !c.includes('Transform') && !c.includes('GameObject'))
    .slice(0, 4)
    .map(c => getComponentIcon(c))
    .join('')

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 4px 2px ' + (8 + depth * 12) + 'px',
          cursor: 'pointer',
          background: isSelected ? '#2563eb33' : 'transparent',
          borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
          borderRadius: 3, fontSize: 11, color: isLeaf ? '#e2e8f0' : '#94a3b8', userSelect: 'none',
        }}
        onClick={() => { if (hasChildren) setOpen(o => !o); if (isLeaf && node.meshIdx !== undefined) onSelect(node.meshIdx) }}
      >
        {hasChildren ? <span style={{ width: 12, textAlign: 'center', fontSize: 9, color: '#64748b' }}>{open ? '▼' : '▶'}</span>
                      : <span style={{ width: 12 }} />}
        <span style={{ fontSize: 10, marginRight: 2 }}>{isLeaf ? '◆' : '📁'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{node.name}</span>
        {compIcons && <span style={{ fontSize: 8, opacity: 0.7 }}>{compIcons}</span>}
      </div>
      {hasChildren && (open || (filter && childrenMatchFilter)) && node.children.map((child, i) => (
        <HierarchyItem key={i} node={child} selected={selected} onSelect={onSelect} depth={depth + 1} filter={filter} />
      ))}
    </div>
  )
}

function matchesFilterRecursive(node: HierarchyNode, filter: string): boolean {
  if (node.name.toLowerCase().includes(filter.toLowerCase())) return true
  return node.children.some(c => matchesFilterRecursive(c, filter))
}

// ── MapSelector ─────────────────────────────────────────────────────────────
function MapSelector({ maps, onSelect }: { maps: MapEntry[]; onSelect: (m: MapEntry) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, color: '#94a3b8', fontSize: 13 }}>
      <div style={{ fontSize: 36 }}>🗺️</div>
      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>사전 익스포트된 맵 선택</div>
      <div style={{ color: '#64748b', fontSize: 11 }}>이 씬에 매칭되는 맵 데이터가 없습니다.</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {maps.map(m => (
          <button key={m.folder} onClick={() => onSelect(m)}
            style={{ padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: 12 }}>
            {m.sceneName} ({m.meshCount.toLocaleString()} 메시)
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function SceneViewer({ scenePath, height = 600 }: SceneViewerProps) {
  const mountRef     = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<THREE.Scene | undefined>(undefined)
  const rendererRef  = useRef<THREE.WebGLRenderer | undefined>(undefined)
  const cameraRef    = useRef<THREE.PerspectiveCamera | undefined>(undefined)
  const controlsRef  = useRef<OrbitControls | undefined>(undefined)
  const meshGroupRef = useRef<THREE.Group | undefined>(undefined)
  const compGroupRef = useRef<THREE.Group | undefined>(undefined)
  const animFrameRef = useRef<number | undefined>(undefined)
  const texCacheRef  = useRef<Map<string, THREE.Texture>>(new Map())
  const fpsKeysRef   = useRef<Set<string>>(new Set())

  const [status,        setStatus]        = useState<'idle'|'loading'|'ready'|'error'>('idle')
  const [progress,      setProgress]      = useState(0)
  const [progressMsg,   setProgressMsg]   = useState('')
  const [loadedMap,     setLoadedMap]     = useState<MapEntry | null>(null)
  const [availMaps,     setAvailMaps]     = useState<MapEntry[]>([])
  const [mapsLoaded,    setMapsLoaded]    = useState(false)
  const [meshObjects,   setMeshObjects]   = useState<MeshJsonObject[]>([])
  const [hierarchy,     setHierarchy]     = useState<HierarchyNode | null>(null)
  const [selected,      setSelected]      = useState<number | null>(null)
  const [showHier,      setShowHier]      = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [meshCount,     setMeshCount]     = useState({ total: 0, loaded: 0 })
  const [sceneInfo,     setSceneInfo]     = useState<SceneInfo | null>(null)
  const [manualMap,     setManualMap]     = useState<MapEntry | null>(null)
  const [fpsMode,       setFpsMode]       = useState(false)
  const [hierFilter,    setHierFilter]    = useState('')
  const [layers, setLayers] = useState<Record<LayerName, boolean>>({
    Mesh: true, Light: true, Collider: true, Camera: true, Audio: true, Particle: true, Trigger: true,
  })

  // Component stats
  const compStats = useMemo(() => {
    const stats: Record<string, number> = {}
    meshObjects.forEach(obj => {
      (obj.components || []).forEach(c => { stats[c] = (stats[c] || 0) + 1 })
    })
    return stats
  }, [meshObjects])

  // ── Three.js 초기화 ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current; if (!el) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1d23)
    scene.fog = new THREE.FogExp2(0x1a1d23, 0.0008)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / (height || el.clientHeight), 0.1, 5000)
    camera.position.set(50, 50, 50)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
    renderer.setSize(el.clientWidth, height || el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.dampingFactor = 0.08
    controlsRef.current = controls

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(100, 200, 100); scene.add(dir)
    scene.add(new THREE.GridHelper(1000, 50, 0x2d3748, 0x2d3748))

    const meshGroup = new THREE.Group(); scene.add(meshGroup); meshGroupRef.current = meshGroup
    const compGroup = new THREE.Group(); scene.add(compGroup); compGroupRef.current = compGroup

    renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(animFrameRef.current!) })

    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / (height || el.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, height || el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      try {
        // FPS movement
        const keys = fpsKeysRef.current
        if (keys.size > 0 && camera) {
          const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2.0 : 0.5
          const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd)
          const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize()
          if (keys.has('KeyW')) camera.position.addScaledVector(fwd, speed)
          if (keys.has('KeyS')) camera.position.addScaledVector(fwd, -speed)
          if (keys.has('KeyA')) camera.position.addScaledVector(right, -speed)
          if (keys.has('KeyD')) camera.position.addScaledVector(right, speed)
          if (keys.has('Space')) camera.position.y += speed
          if (keys.has('KeyQ')) camera.position.y -= speed
          controls.target.copy(camera.position.clone().add(fwd))
        }
        controls.update()
        renderer.render(scene, camera)
      } catch {}
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current!)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  // ── FPS 모드 키보드 이벤트 ──────────────────────────────────────────────
  useEffect(() => {
    if (!fpsMode) { fpsKeysRef.current.clear(); return }
    const onDown = (e: KeyboardEvent) => { fpsKeysRef.current.add(e.code); if (['Space','KeyW','KeyA','KeyS','KeyD','KeyQ'].includes(e.code)) e.preventDefault() }
    const onUp   = (e: KeyboardEvent) => { fpsKeysRef.current.delete(e.code) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    // Right-click drag for look
    const el = mountRef.current
    let dragging = false, lastX = 0, lastY = 0
    const onMouseDown = (e: MouseEvent) => { if (e.button === 2) { dragging = true; lastX = e.clientX; lastY = e.clientY; e.preventDefault() } }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      const cam = cameraRef.current; if (!cam) return
      const dx = (e.clientX - lastX) * 0.003, dy = (e.clientY - lastY) * 0.003
      cam.rotation.y -= dx; cam.rotation.x -= dy
      cam.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cam.rotation.x))
      lastX = e.clientX; lastY = e.clientY
    }
    const onMouseUp = (e: MouseEvent) => { if (e.button === 2) dragging = false }
    const onCtx = (e: MouseEvent) => { e.preventDefault() }
    el?.addEventListener('mousedown', onMouseDown); el?.addEventListener('mousemove', onMouseMove)
    el?.addEventListener('mouseup', onMouseUp); el?.addEventListener('contextmenu', onCtx)
    if (controlsRef.current) { controlsRef.current.enableRotate = false; controlsRef.current.enablePan = false }
    return () => {
      fpsKeysRef.current.clear()
      window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp)
      el?.removeEventListener('mousedown', onMouseDown); el?.removeEventListener('mousemove', onMouseMove)
      el?.removeEventListener('mouseup', onMouseUp); el?.removeEventListener('contextmenu', onCtx)
      if (controlsRef.current) { controlsRef.current.enableRotate = true; controlsRef.current.enablePan = true }
    }
  }, [fpsMode])

  // ── 맵 목록 로드 ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/assets/map-list').then(r => r.json()).then((d: { maps: MapEntry[] }) => { setAvailMaps(d.maps || []); setMapsLoaded(true) })
      .catch(() => { setAvailMaps([]); setMapsLoaded(true) })
  }, [])

  // ── 씬 경로 → 맵 감지 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!scenePath || !mapsLoaded) return
    const detected = detectMapFolder(scenePath, availMaps)
    if (detected) loadMap(detected); else startBake(scenePath)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenePath, mapsLoaded])

  useEffect(() => { if (manualMap) loadMap(manualMap) }, [manualMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 와이어프레임 토글 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!meshGroupRef.current) return
    meshGroupRef.current.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) mat.forEach(m => { (m as THREE.MeshStandardMaterial).wireframe = showWireframe })
        else (mat as THREE.MeshStandardMaterial).wireframe = showWireframe
      }
    })
  }, [showWireframe])

  // ── 레이어 가시성 ──────────────────────────────────────────────────────
  useEffect(() => {
    const setVis = (group: THREE.Group | undefined) => {
      group?.traverse(obj => {
        const layer = obj.userData?.layer as LayerName | undefined
        if (layer && layer in layers) obj.visible = layers[layer]
      })
    }
    setVis(meshGroupRef.current)
    setVis(compGroupRef.current)
  }, [layers])

  // ── 맵 로드 ────────────────────────────────────────────────────────────
  const loadMap = useCallback(async (map: MapEntry) => {
    const scene = sceneRef.current, meshGroup = meshGroupRef.current, compGroup = compGroupRef.current, texCache = texCacheRef.current
    if (!scene || !meshGroup || !compGroup) return
    setStatus('loading'); setProgress(0); setLoadedMap(map); setSelected(null)

    meshGroup.clear(); compGroup.clear()
    texCache.forEach(t => t.dispose()); texCache.clear()

    try {
      setProgressMsg('씬 정보 로드 중...')
      const infoRes = await fetch(`/api/assets/map-scene-info?map=${encodeURIComponent(map.folder)}`)
      if (!infoRes.ok) throw new Error('scene_info 로드 실패')
      const info: SceneInfo = await infoRes.json()
      setSceneInfo(info)

      if (info.bounds) {
        const { min, max } = info.bounds
        const cx = (min.x + max.x) / 2, cy = (min.y + max.y) / 2, cz = (min.z + max.z) / 2
        const sz = Math.max(Math.abs(max.x - min.x), Math.abs(max.y - min.y), Math.abs(max.z - min.z)) || 200
        cameraRef.current?.position.set(cx + sz * 0.5, cy + sz * 0.3, cz + sz * 0.5)
        controlsRef.current?.target.set(cx, cy, cz); controlsRef.current?.update()
      }

      setProgressMsg(`meshes.json 다운로드 중...`)
      setProgress(5)
      const meshRes = await fetch(`/api/assets/map-meshes?map=${encodeURIComponent(map.folder)}`)
      if (!meshRes.ok) throw new Error('meshes.json 로드 실패')
      const meshesJson: { meshObjects: MeshJsonObject[] } = await meshRes.json()
      const objs = meshesJson.meshObjects || []
      setMeshObjects(objs); setProgress(20); setMeshCount({ total: objs.length, loaded: 0 })

      // Textures
      setProgressMsg('텍스처 로드 중...')
      const texIds = new Set<string>()
      objs.forEach(o => { if (o.material?.mainTextureId) texIds.add(o.material.mainTextureId) })
      const texArr = Array.from(texIds); let texDone = 0
      const chunks: string[][] = []
      for (let i = 0; i < texArr.length; i += TEX_CONCURRENCY) chunks.push(texArr.slice(i, i + TEX_CONCURRENCY))
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async id => {
          const tex = await loadTextureFromUrl(`/api/assets/map-texture?map=${encodeURIComponent(map.folder)}&file=${encodeURIComponent(id)}`)
          if (tex) texCache.set(id, tex); texDone++
        }))
        setProgress(20 + (texDone / Math.max(texArr.length, 1)) * 20)
        setProgressMsg(`텍스처 ${texDone} / ${texArr.length}`)
        await new Promise(r => setTimeout(r, 0))
      }
      setProgress(40)

      // Meshes + component visuals
      setProgressMsg('메시 생성 중...')
      let builtCount = 0
      for (let i = 0; i < objs.length; i += CHUNK_SIZE) {
        const chunk = objs.slice(i, i + CHUNK_SIZE)
        for (const obj of chunk) {
          const m = createThreeMesh(obj, texCache)
          if (m) meshGroup.add(m)

          // Component visuals
          const cd = obj.componentData
          const pos = obj.transform?.position || { x: 0, y: 0, z: 0 }
          if (cd?.Light) compGroup.add(createLightVisual(pos, cd.Light))
          if (cd?.colliders) cd.colliders.forEach(c => compGroup.add(createColliderVisual(pos, c)))
          if (cd?.Camera) compGroup.add(createCameraVisual(pos, cd.Camera))
          if (cd?.AudioSource) compGroup.add(createAudioVisual(pos, cd.AudioSource))
          if (obj.components?.includes('ParticleSystem')) compGroup.add(createParticleVisual(pos))
        }
        builtCount += chunk.length
        setProgress(40 + (builtCount / objs.length) * 55)
        setMeshCount({ total: objs.length, loaded: builtCount })
        setProgressMsg(`메시 생성 ${builtCount.toLocaleString()} / ${objs.length.toLocaleString()}`)
        await new Promise(r => setTimeout(r, 0))
      }

      setHierarchy(buildTree(objs))
      setProgress(100); setStatus('ready'); fitToScene()
    } catch (err) {
      console.error('[SceneViewer] 로드 실패:', err)
      setProgressMsg(String(err)); setStatus('error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── On-demand Bake (SSE) ──────────────────────────────────────────────
  const startBake = useCallback((path: string) => {
    setStatus('loading'); setProgress(0); setProgressMsg('씬 분석 중...')
    let rawPath = path
    try { rawPath = new URL(path, 'http://x').searchParams.get('path') || path } catch {}
    const url = `/api/assets/scene?path=${encodeURIComponent(rawPath)}&bake=1&max=500`
    const evtSrc = new EventSource(url)
    evtSrc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'progress') { setProgress(data.pct ?? 0); setProgressMsg(data.msg ?? '') }
        else if (data.type === 'start') setProgressMsg(`FBX ${data.total}개 변환 시작...`)
        else if (data.type === 'done') {
          evtSrc.close(); setProgressMsg('맵 데이터 로드 중...')
          fetch('/api/assets/map-list').then(r => r.json()).then((d: { maps: MapEntry[] }) => {
            setAvailMaps(d.maps || [])
            const newMap = (d.maps || []).find((m: MapEntry) => m.folder === data.mapFolder || m.sceneName === data.sceneName)
            if (newMap) loadMap(newMap); else setStatus('error')
          }).catch(() => setStatus('error'))
        } else if (data.type === 'error') { evtSrc.close(); setProgressMsg('오류: ' + data.msg); setStatus('error') }
      } catch {}
    }
    evtSrc.onerror = () => { evtSrc.close(); setProgressMsg('서버 연결 오류'); setStatus('error') }
  }, [loadMap])

  const fitToScene = useCallback(() => {
    const cam = cameraRef.current, ctrl = controlsRef.current, group = meshGroupRef.current
    if (!cam || !ctrl || !group || group.children.length === 0) return
    const box = new THREE.Box3().setFromObject(group)
    const ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length()
    cam.position.set(ctr.x + sz * 0.5, ctr.y + sz * 0.3, ctr.z + sz * 0.5)
    ctrl.target.copy(ctr); cam.near = sz * 0.0001; cam.far = sz * 4; cam.updateProjectionMatrix(); ctrl.update()
  }, [])

  const handleSelect = useCallback((idx: number) => {
    setSelected(idx)
    const group = meshGroupRef.current
    if (!group || !cameraRef.current || !controlsRef.current) return
    const mesh = group.children[idx] as THREE.Mesh | undefined
    if (!mesh) return
    const box = new THREE.Box3().setFromObject(mesh)
    const ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length()
    controlsRef.current.target.copy(ctr)
    if (sz > 0.1) {
      const d = cameraRef.current.position.clone().sub(ctr).normalize()
      cameraRef.current.position.copy(ctr.clone().add(d.multiplyScalar(sz * 2 + 5)))
    }
    controlsRef.current.update()
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (fpsMode) return
    const el = mountRef.current, cam = cameraRef.current, grp = meshGroupRef.current
    if (!el || !cam || !grp) return
    const rect = el.getBoundingClientRect()
    const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * -2 + 1)
    const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, cam)
    const hits = ray.intersectObjects(grp.children, true)
    if (!hits.length) return
    const idx = grp.children.indexOf(hits[0].object)
    if (idx >= 0) setSelected(idx)
  }, [fpsMode])

  const toggleLayer = useCallback((name: LayerName) => {
    setLayers(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const selectedObj = selected !== null ? meshObjects[selected] : null
  const panelBg = '#1a1d23', borderCol = '#2d3748'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      {/* ── 툴바 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#151820', borderBottom: `1px solid ${borderCol}`, fontSize: 11, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>🎮 Scene Viewer</span>
        {loadedMap && <span style={{ color: '#94a3b8' }}>{loadedMap.sceneName}</span>}
        {status === 'ready' && <span style={{ color: '#64748b' }}>· {meshCount.total.toLocaleString()} obj</span>}
        <div style={{ flex: 1 }} />

        {/* 레이어 토글 */}
        {status === 'ready' && (Object.keys(LAYER_COLORS) as LayerName[]).map(name => (
          <button key={name} onClick={() => toggleLayer(name)}
            style={{ padding: '2px 6px', background: layers[name] ? LAYER_COLORS[name] + '33' : '#1e293b', border: `1px solid ${layers[name] ? LAYER_COLORS[name] : borderCol}`,
                     borderRadius: 3, color: layers[name] ? LAYER_COLORS[name] : '#475569', cursor: 'pointer', fontSize: 9, lineHeight: '14px' }}>
            {LAYER_ICONS[name]} {name}
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: borderCol, margin: '0 2px' }} />

        <button onClick={() => setShowHier(v => !v)} style={{ padding: '3px 8px', background: showHier ? '#2563eb' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>☰</button>
        <button onClick={() => setShowInspector(v => !v)} style={{ padding: '3px 8px', background: showInspector ? '#2563eb' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>🔍</button>
        <button onClick={() => setShowWireframe(v => !v)} style={{ padding: '3px 8px', background: showWireframe ? '#7c3aed' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>⬡</button>
        <button onClick={() => setFpsMode(v => !v)} style={{ padding: '3px 8px', background: fpsMode ? '#dc2626' : '#1e293b', border: `1px solid ${fpsMode ? '#dc2626' : borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>
          {fpsMode ? '🎯 FPS' : '🖱 Orbit'}
        </button>
        <button onClick={fitToScene} style={{ padding: '3px 8px', background: '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>⊞</button>
      </div>

      {/* ── 본문 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Hierarchy */}
        {showHier && (
          <div style={{ width: 220, minWidth: 160, background: '#151820', borderRight: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#475569', borderBottom: `1px solid ${borderCol}`, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              Hierarchy
              <input
                type="text" placeholder="검색..." value={hierFilter} onChange={e => setHierFilter(e.target.value)}
                style={{ flex: 1, background: '#0f1420', border: `1px solid ${borderCol}`, borderRadius: 3, padding: '2px 6px', color: '#e2e8f0', fontSize: 10, outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {hierarchy
                ? hierarchy.children.map((n, i) => <HierarchyItem key={i} node={n} selected={selected} onSelect={handleSelect} filter={hierFilter} />)
                : <div style={{ padding: 16, color: '#475569', fontSize: 11 }}>씬을 로드하면<br/>하이어라키가 표시됩니다</div>
              }
            </div>
            {status === 'ready' && (
              <div style={{ padding: '4px 10px', fontSize: 9, color: '#475569', borderTop: `1px solid ${borderCol}` }}>
                {meshCount.total.toLocaleString()} obj
                {Object.keys(compStats).length > 0 && ` · ${Object.entries(compStats).filter(([k]) => !['MeshRenderer','MeshFilter','Transform'].includes(k)).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(' ')}`}
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} onClick={handleCanvasClick} />

          {fpsMode && status === 'ready' && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: 4, color: '#94a3b8', fontSize: 10 }}>
              WASD 이동 · Q/Space 상하 · Shift 가속 · 우클릭+드래그 시점
            </div>
          )}

          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,20,30,0.85)', gap: 14 }}>
              <div style={{ fontSize: 24 }}>⚙️</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{progressMsg}</div>
              <div style={{ width: 280, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.2s', borderRadius: 3 }} />
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{progress.toFixed(0)}%</div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,20,30,0.85)', gap: 10 }}>
              <div style={{ fontSize: 32 }}>❌</div>
              <div style={{ color: '#f87171', fontWeight: 600 }}>로드 실패</div>
              <div style={{ color: '#94a3b8', fontSize: 11, maxWidth: 300, textAlign: 'center' }}>{progressMsg}</div>
            </div>
          )}

          {status === 'idle' && availMaps.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: '#0f1420' }}>
              <MapSelector maps={availMaps} onSelect={setManualMap} />
            </div>
          )}
        </div>

        {/* Inspector */}
        {showInspector && (
          <div style={{ width: 250, minWidth: 200, background: '#151820', borderLeft: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#475569', borderBottom: `1px solid ${borderCol}`, letterSpacing: 1, textTransform: 'uppercase' }}>
              Inspector
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, fontSize: 11 }}>
              {selectedObj ? <InspectorPanel obj={selectedObj} /> : <div style={{ color: '#475569', fontSize: 11 }}>오브젝트를 선택하면<br/>속성이 표시됩니다</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inspector 패널 ──────────────────────────────────────────────────────────
function InspectorPanel({ obj }: { obj: MeshJsonObject }) {
  const row = (label: string, value: string | number, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 6 }}>
      <span style={{ color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span style={{ color: color || '#e2e8f0', textAlign: 'right', wordBreak: 'break-all', fontSize: 10 }}>{value}</span>
    </div>
  )
  const section = (title: string, icon?: string) => (
    <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 4, borderBottom: '1px solid #1e293b', paddingBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}{title}
    </div>
  )
  const v3 = (v: Vec3) => `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`
  const colorSwatch = (c: Col3) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ color: '#64748b' }}>Color</span>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`, border: '1px solid #475569' }} />
      <span style={{ fontSize: 9, color: '#94a3b8' }}>({c.r.toFixed(2)}, {c.g.toFixed(2)}, {c.b.toFixed(2)})</span>
    </div>
  )

  const mat = obj.material
  const cd = obj.componentData

  return (
    <div>
      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13, marginBottom: 4, wordBreak: 'break-word' }}>{obj.name}</div>
      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 6, wordBreak: 'break-all', lineHeight: 1.4 }}>{obj.path}</div>

      {/* Components list */}
      {obj.components && obj.components.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
          {obj.components.filter(c => c !== 'Transform' && c !== 'GameObject').map((c, i) => (
            <span key={i} style={{ padding: '1px 5px', background: '#1e293b', borderRadius: 3, fontSize: 9, color: '#94a3b8' }}>
              {getComponentIcon(c)} {c}
            </span>
          ))}
        </div>
      )}

      {section('Transform', '🔄')}
      {row('Position', v3(obj.transform.position))}
      {row('Rotation', v3(obj.transform.rotation))}
      {row('Scale',    v3(obj.transform.scale))}

      {obj.tag   && row('Tag',   obj.tag)}
      {obj.layer && row('Layer', obj.layer)}

      {/* Geometry */}
      {obj.geometry?.vertices?.length > 0 && (
        <>
          {section('Geometry', '◆')}
          {row('Vertices', obj.geometry.vertices.length.toLocaleString())}
          {obj.geometry.triangles && row('Triangles', (obj.geometry.triangles.length / 3).toLocaleString())}
          {obj.geometry.uvs && row('UVs', '✓', '#4ade80')}
        </>
      )}

      {/* Material */}
      {mat && (
        <>
          {section('Material', '🎨')}
          {mat.color && colorSwatch(mat.color)}
          {mat.mainTextureId && row('Texture', mat.mainTextureId, '#a78bfa')}
          {mat.mainTextureTiling && row('Tiling', `${mat.mainTextureTiling.x.toFixed(2)}, ${mat.mainTextureTiling.y.toFixed(2)}`)}
          {mat.lightmapIndex !== undefined && mat.lightmapIndex >= 0 && row('Lightmap', `#${mat.lightmapIndex}`)}
        </>
      )}

      {/* Light */}
      {cd?.Light && (
        <>
          {section('Light', '💡')}
          {row('Type', ['Spot', 'Directional', 'Point'][cd.Light.lightType] || `Unknown(${cd.Light.lightType})`)}
          {colorSwatch(cd.Light.color)}
          {row('Intensity', cd.Light.intensity.toFixed(2))}
          {cd.Light.lightType !== 1 && row('Range', cd.Light.range.toFixed(1))}
          {cd.Light.lightType === 0 && row('Spot Angle', `${cd.Light.spotAngle.toFixed(1)}°`)}
          {row('Shadow', cd.Light.shadowType === 0 ? 'None' : cd.Light.shadowType === 1 ? 'Hard' : 'Soft')}
        </>
      )}

      {/* Colliders */}
      {cd?.colliders?.map((col, i) => (
        <div key={i}>
          {section(`${col.type} Collider${col.isTrigger ? ' (Trigger)' : ''}`, '🛡')}
          {row('Type', col.type)}
          {row('Trigger', col.isTrigger ? 'Yes' : 'No', col.isTrigger ? '#fb923c' : '#4ade80')}
          {row('Center', v3(col.center))}
          {col.size && row('Size', v3(col.size))}
          {col.radius !== undefined && row('Radius', col.radius.toFixed(3))}
          {col.height !== undefined && row('Height', col.height.toFixed(3))}
        </div>
      ))}

      {/* Camera */}
      {cd?.Camera && (
        <>
          {section('Camera', '📷')}
          {row('FOV', `${cd.Camera.fov.toFixed(1)}°`)}
          {row('Near', cd.Camera.near.toFixed(3))}
          {row('Far', cd.Camera.far.toFixed(1))}
          {row('Ortho', cd.Camera.ortho ? `Yes (size: ${cd.Camera.orthoSize})` : 'No')}
        </>
      )}

      {/* Rigidbody */}
      {cd?.Rigidbody && (
        <>
          {section('Rigidbody', '⚙️')}
          {row('Mass', cd.Rigidbody.mass.toFixed(2))}
          {row('Kinematic', cd.Rigidbody.isKinematic ? 'Yes' : 'No')}
          {row('Gravity', cd.Rigidbody.useGravity ? 'Yes' : 'No')}
        </>
      )}

      {/* AudioSource */}
      {cd?.AudioSource && (
        <>
          {section('Audio Source', '🔊')}
          {row('Volume', cd.AudioSource.volume.toFixed(2))}
          {row('Loop', cd.AudioSource.loop ? 'Yes' : 'No')}
          {row('Spatial Blend', cd.AudioSource.spatialBlend.toFixed(2))}
        </>
      )}

      {/* Scripts */}
      {cd?.scripts && cd.scripts.length > 0 && (
        <>
          {section('Scripts', '📎')}
          {cd.scripts.map((s, i) => (
            <div key={i} style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>• {s}</div>
          ))}
        </>
      )}
    </div>
  )
}

export default SceneViewer
