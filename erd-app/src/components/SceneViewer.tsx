/**
 * SceneViewer.tsx  (v4 – On-demand Bake)
 *
 * Unity .unity 씬 파일을 열면 서버가 즉석으로 FBX를 파싱해
 * scene-cache/<SceneName>/meshes.json 을 생성/캐싱.
 *
 * 이미 캐시가 있으면 즉시 로드, 없으면 SSE 진행률 표시 후 자동 로드.
 * 버텍스는 월드 스페이스로 베이크되므로 클라이언트 Transform 계산 불필요.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
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

interface MeshJsonObject {
  name:      string
  path:      string
  layer?:    string
  tag?:      string
  transform: { position: Vec3; rotation: Vec3; scale: Vec3 }
  geometry:  MeshGeometry
  material?: MeshMaterial
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

// ── 상수 ────────────────────────────────────────────────────────────────────
const CHUNK_SIZE  = 80   // 한 번에 처리할 메시 수
const TEX_CONCURRENCY = 6 // 병렬 텍스처 로드 수

// ── SceneViewer 컴포넌트 props ───────────────────────────────────────────────
interface SceneViewerProps {
  scenePath: string   // /api/assets/scene?path=... 또는 /api/assets/prefab?path=...
  height?:   number
}

// ── 텍스처 로딩 ──────────────────────────────────────────────────────────────
function loadTextureFromUrl(url: string): Promise<THREE.Texture | null> {
  return new Promise(resolve => {
    new THREE.TextureLoader().load(
      url,
      tex => {
        tex.flipY    = false
        tex.wrapS    = THREE.RepeatWrapping
        tex.wrapT    = THREE.RepeatWrapping
        tex.needsUpdate = true
        resolve(tex)
      },
      undefined,
      () => resolve(null),
    )
  })
}

// ── BufferGeometry 생성 (app.js createMesh 포팅) ──────────────────────────────
function createGeometry(geo: MeshGeometry): THREE.BufferGeometry {
  const bg = new THREE.BufferGeometry()

  // 버텍스 (이미 월드스페이스)
  const verts = new Float32Array(geo.vertices.length * 3)
  geo.vertices.forEach((v, i) => {
    verts[i * 3]     = v.x
    verts[i * 3 + 1] = v.y
    verts[i * 3 + 2] = v.z
  })
  bg.setAttribute('position', new THREE.BufferAttribute(verts, 3))

  // 인덱스
  if (geo.triangles?.length) bg.setIndex(geo.triangles)

  // 노멀
  if (geo.normals?.length) {
    const norms = new Float32Array(geo.normals.length * 3)
    geo.normals.forEach((n, i) => {
      norms[i * 3]     = n.x
      norms[i * 3 + 1] = n.y
      norms[i * 3 + 2] = n.z
    })
    bg.setAttribute('normal', new THREE.BufferAttribute(norms, 3))
  } else {
    bg.computeVertexNormals()
  }

  // UV
  if (geo.uvs?.length) {
    const uvs = new Float32Array(geo.uvs.length * 2)
    geo.uvs.forEach((u, i) => { uvs[i * 2] = u.x; uvs[i * 2 + 1] = u.y })
    bg.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  }

  // UV2 (라이트맵)
  if (geo.uv2s?.length) {
    const uv2s = new Float32Array(geo.uv2s.length * 2)
    const so   = undefined as undefined // lightmapScaleOffset handled per-material
    geo.uv2s.forEach((u, i) => {
      void so
      uv2s[i * 2]     = u.x
      uv2s[i * 2 + 1] = u.y
    })
    bg.setAttribute('uv2', new THREE.BufferAttribute(uv2s, 2))
  }

  return bg
}

// ── 메시 생성 ─────────────────────────────────────────────────────────────────
function createThreeMesh(
  obj:     MeshJsonObject,
  texCache: Map<string, THREE.Texture>,
): THREE.Mesh | null {
  if (!obj.geometry?.vertices?.length) return null

  const geo = createGeometry(obj.geometry)
  const mat = obj.material

  // 색상
  const baseColor = mat?.color
    ? new THREE.Color(mat.color.r, mat.color.g, mat.color.b)
    : new THREE.Color(0x888888)

  const params: THREE.MeshStandardMaterialParameters & THREE.MeshPhongMaterialParameters = {
    side:  THREE.DoubleSide,
    color: baseColor,
  }

  // 메인 텍스처
  const texId = mat?.mainTextureId
  if (texId && texCache.has(texId)) {
    const tex = texCache.get(texId)!.clone()
      tex.needsUpdate = true
    const tiling = mat?.mainTextureTiling
    if (tiling) { tex.repeat.set(tiling.x || 1, tiling.y || 1) }
    const offset = mat?.mainTextureOffset
    if (offset) { tex.offset.set(offset.x || 0, offset.y || 0) }
    params.map   = tex
    params.color = new THREE.Color(0xffffff)
  }

  const threeMesh = new THREE.Mesh(
    geo,
    params.map
      ? new THREE.MeshStandardMaterial({ ...params, roughness: 0.85, metalness: 0 } as THREE.MeshStandardMaterialParameters)
      : new THREE.MeshPhongMaterial({ ...params, transparent: false, flatShading: true } as THREE.MeshPhongMaterialParameters),
  )
  threeMesh.userData = { name: obj.name, path: obj.path, transform: obj.transform }
  return threeMesh
}

// ── 경로 → 트리 노드 ──────────────────────────────────────────────────────────
interface HierarchyNode {
  name:     string
  path:     string
  children: HierarchyNode[]
  meshIdx?: number   // -1 = folder only
}

function buildTree(objects: MeshJsonObject[]): HierarchyNode {
  const root: HierarchyNode = { name: 'Scene', path: '', children: [] }

  objects.forEach((obj, idx) => {
    const parts = (obj.path || obj.name).split('/')
    let node = root
    parts.forEach((part, depth) => {
      const isLeaf = depth === parts.length - 1
      let child = node.children.find(c => c.name === part)
      if (!child) {
        child = { name: part, path: parts.slice(0, depth + 1).join('/'), children: [] }
        node.children.push(child)
      }
      if (isLeaf) child.meshIdx = idx
      node = child
    })
  })

  return root
}

// ── 씬 이름으로 맵 폴더 추론 ──────────────────────────────────────────────────
function detectMapFolder(scenePath: string, maps: MapEntry[]): MapEntry | null {
  try {
    const params = new URL(scenePath, 'http://localhost').searchParams
    const pathParam = params.get('path') || ''
    const sceneName = (pathParam.split('/').pop() || '').toLowerCase().replace(/[._-]/g, '')

    // 긴 이름 우선 (village_01 > village)
    const sorted = [...maps].sort((a, b) => b.folder.length - a.folder.length)
    for (const m of sorted) {
      const folder = m.folder.toLowerCase().replace(/[_-]/g, '')
      if (sceneName.includes(folder) || folder.includes(sceneName)) return m
    }
  } catch {}
  return null
}

// ── HierarchyItem 재귀 렌더 ───────────────────────────────────────────────────
function HierarchyItem({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node:     HierarchyNode
  selected: number | null
  onSelect: (idx: number) => void
  depth?:   number
}) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isLeaf = node.meshIdx !== undefined
  const isSelected = isLeaf && node.meshIdx === selected

  return (
    <div>
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         4,
          padding:     '2px 4px 2px ' + (8 + depth * 12) + 'px',
          cursor:      'pointer',
          background:  isSelected ? '#2563eb33' : 'transparent',
          borderLeft:  isSelected ? '2px solid #3b82f6' : '2px solid transparent',
          borderRadius: 3,
          fontSize:    11,
          color:       isLeaf ? '#e2e8f0' : '#94a3b8',
          userSelect:  'none',
        }}
        onClick={() => {
          if (hasChildren) setOpen(o => !o)
          if (isLeaf && node.meshIdx !== undefined) onSelect(node.meshIdx)
        }}
      >
        {hasChildren && (
          <span style={{ width: 12, textAlign: 'center', fontSize: 9, color: '#64748b' }}>
            {open ? '▼' : '▶'}
        </span>
        )}
        {!hasChildren && <span style={{ width: 12 }} />}
        <span style={{ fontSize: 10, marginRight: 3 }}>
          {isLeaf ? '◆' : '📁'}
          </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.name}
          </span>
      </div>
      {hasChildren && open && node.children.map((child, i) => (
        <HierarchyItem key={i} node={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── MapSelector : 사전 익스포트 맵 없을 때 안내 ──────────────────────────────
function MapSelector({ maps, onSelect }: { maps: MapEntry[]; onSelect: (m: MapEntry) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, color: '#94a3b8', fontSize: 13 }}>
      <div style={{ fontSize: 36 }}>🗺️</div>
      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>사전 익스포트된 맵 선택</div>
      <div style={{ color: '#64748b', fontSize: 11 }}>이 씬에 매칭되는 맵 데이터가 없습니다.</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {maps.map(m => (
          <button
            key={m.folder}
            onClick={() => onSelect(m)}
            style={{ padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: 12 }}
          >
            {m.sceneName} ({m.meshCount.toLocaleString()} 메시)
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function SceneViewer({ scenePath, height = 600 }: SceneViewerProps) {
  const mountRef    = useRef<HTMLDivElement>(null)
  const sceneRef    = useRef<THREE.Scene | undefined>(undefined)
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined)
  const cameraRef   = useRef<THREE.PerspectiveCamera | undefined>(undefined)
  const controlsRef = useRef<OrbitControls | undefined>(undefined)
  const meshGroupRef = useRef<THREE.Group | undefined>(undefined)
  const animFrameRef = useRef<number | undefined>(undefined)
  const texCacheRef  = useRef<Map<string, THREE.Texture>>(new Map())

  const [status,        setStatus]   = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [progress,      setProgress] = useState(0)
  const [progressMsg,   setProgressMsg] = useState('')
  const [loadedMap,     setLoadedMap]   = useState<MapEntry | null>(null)
  const [availMaps,     setAvailMaps]   = useState<MapEntry[]>([])
  const [mapsLoaded,    setMapsLoaded]  = useState(false)
  const [meshObjects,   setMeshObjects] = useState<MeshJsonObject[]>([])
  const [hierarchy,     setHierarchy]   = useState<HierarchyNode | null>(null)
  const [selected,      setSelected]    = useState<number | null>(null)
  const [showHier,      setShowHier]    = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [meshCount,     setMeshCount]    = useState({ total: 0, loaded: 0 })
  const [sceneInfo,     setSceneInfo]    = useState<SceneInfo | null>(null)
  const [manualMap,     setManualMap]    = useState<MapEntry | null>(null)

  // ── Three.js 초기화 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1d23)
    scene.fog = new THREE.FogExp2(0x1a1d23, 0.0008)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / (height || el.clientHeight), 0.1, 5000)
    camera.position.set(50, 50, 50)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
    renderer.setSize(el.clientWidth, height || el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = false
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping  = true
    controls.dampingFactor  = 0.08
    controlsRef.current     = controls

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(100, 200, 100)
    scene.add(dir)

    // Grid
    const grid = new THREE.GridHelper(1000, 50, 0x2d3748, 0x2d3748)
    scene.add(grid)

    // Mesh group
    const meshGroup = new THREE.Group()
    scene.add(meshGroup)
    meshGroupRef.current = meshGroup

    // WebGL context lost
    renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault()
      cancelAnimationFrame(animFrameRef.current!)
    })

    // Resize
    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / (height || el.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, height || el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      try {
        controls.update()
        renderer.render(scene, camera)
      } catch {}
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current!)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  // ── 맵 목록 로드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/assets/map-list')
      .then(r => r.json())
      .then((data: { maps: MapEntry[] }) => {
        setAvailMaps(data.maps || [])
        setMapsLoaded(true)
      })
      .catch(() => {
        setAvailMaps([])
        setMapsLoaded(true)  // 오류여도 로드 완료로 처리
      })
  }, [])

  // ── 씬 경로 → 맵 감지 후 로드 ─────────────────────────────────────────────
  useEffect(() => {
    if (!scenePath || !mapsLoaded) return   // 맵 목록 로드 완료 후에만 진행
    const detected = detectMapFolder(scenePath, availMaps)
    if (detected) loadMap(detected)
    else {
      // 캐시에 없음 → on-demand bake 시작
      startBake(scenePath)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenePath, mapsLoaded])

  // ── 수동 맵 선택 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (manualMap) loadMap(manualMap)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualMap])

  // ── 와이어프레임 토글 ────────────────────────────────────────────────────
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

  // ── 맵 로드 메인 함수 ───────────────────────────────────────────────────
  const loadMap = useCallback(async (map: MapEntry) => {
    const scene     = sceneRef.current
    const meshGroup = meshGroupRef.current
    const texCache  = texCacheRef.current
    if (!scene || !meshGroup) return

    setStatus('loading')
    setProgress(0)
    setLoadedMap(map)
    setSelected(null)

    // 이전 메시 정리
    meshGroup.clear()
    texCache.forEach(t => t.dispose())
    texCache.clear()

    try {
      // ① scene_info 로드
      setProgressMsg('씬 정보 로드 중...')
      const infoRes = await fetch(`/api/assets/map-scene-info?map=${encodeURIComponent(map.folder)}`)
      if (!infoRes.ok) throw new Error('scene_info 로드 실패')
      const info: SceneInfo = await infoRes.json()
      setSceneInfo(info)

      // 카메라 초기 위치 (bounds 기반)
      if (info.bounds) {
        const { min, max } = info.bounds
        const cx = (min.x + max.x) / 2
        const cy = (min.y + max.y) / 2
        const cz = (min.z + max.z) / 2
        const sz = Math.max(Math.abs(max.x - min.x), Math.abs(max.y - min.y), Math.abs(max.z - min.z)) || 200
        cameraRef.current?.position.set(cx + sz * 0.5, cy + sz * 0.3, cz + sz * 0.5)
        controlsRef.current?.target.set(cx, cy, cz)
        controlsRef.current?.update()
      }

      // ② meshes.json 로드
      setProgressMsg(`meshes.json 다운로드 중... (${info.meshCount?.toLocaleString() ?? '?'} 메시)`)
      setProgress(5)
      const meshRes = await fetch(`/api/assets/map-meshes?map=${encodeURIComponent(map.folder)}`)
      if (!meshRes.ok) throw new Error('meshes.json 로드 실패')

      const meshesJson: { meshObjects: MeshJsonObject[] } = await meshRes.json()
      const objs = meshesJson.meshObjects || []
      setMeshObjects(objs)
      setProgress(20)
      setMeshCount({ total: objs.length, loaded: 0 })

      // ③ 텍스처 ID 수집
      setProgressMsg('텍스처 로드 중...')
      const texIds = new Set<string>()
      objs.forEach(o => { if (o.material?.mainTextureId) texIds.add(o.material.mainTextureId) })

      // ④ 텍스처 병렬 로드
      const texArr  = Array.from(texIds)
      let   texDone = 0
      const chunks: string[][] = []
      for (let i = 0; i < texArr.length; i += TEX_CONCURRENCY)
        chunks.push(texArr.slice(i, i + TEX_CONCURRENCY))

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async id => {
          const url = `/api/assets/map-texture?map=${encodeURIComponent(map.folder)}&file=${encodeURIComponent(id)}`
          const tex = await loadTextureFromUrl(url)
          if (tex) texCache.set(id, tex)
          texDone++
        }))
        setProgress(20 + (texDone / Math.max(texArr.length, 1)) * 20)
        setProgressMsg(`텍스처 ${texDone} / ${texArr.length}`)
        await new Promise(r => setTimeout(r, 0))
      }

      setProgress(40)

      // ⑤ 메시 생성 (청크 단위)
      setProgressMsg('메시 생성 중...')
      let builtCount = 0
      for (let i = 0; i < objs.length; i += CHUNK_SIZE) {
        const chunk = objs.slice(i, i + CHUNK_SIZE)
        for (const obj of chunk) {
          const m = createThreeMesh(obj, texCache)
          if (m) meshGroup.add(m)
        }
        builtCount += chunk.length
        setProgress(40 + (builtCount / objs.length) * 55)
        setMeshCount({ total: objs.length, loaded: builtCount })
        setProgressMsg(`메시 생성 ${builtCount.toLocaleString()} / ${objs.length.toLocaleString()}`)
        await new Promise(r => setTimeout(r, 0))
      }

      // ⑥ 하이어라키 빌드
      const tree = buildTree(objs)
      setHierarchy(tree)

      // ⑦ 완료
      setProgress(100)
      setStatus('ready')
      fitToScene()
      } catch (err) {
      console.error('[SceneViewer] 로드 실패:', err)
      setProgressMsg(String(err))
          setStatus('error')
        }
  }, [])

  // ── On-demand Bake: 사전 익스포트 없을 때 서버에서 즉석 생성 (SSE) ────────
  const startBake = useCallback((path: string) => {
    setStatus('loading')
    setProgress(0)
    setProgressMsg('씬 분석 중...')

    // 씬 경로 파라미터 추출
    let rawPath = path
    try {
      rawPath = new URL(path, 'http://x').searchParams.get('path') || path
    } catch {}

    const url = `/api/assets/scene?path=${encodeURIComponent(rawPath)}&bake=1&max=500`
    const evtSrc = new EventSource(url)

    evtSrc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'progress') {
          setProgress(data.pct ?? 0)
          setProgressMsg(data.msg ?? '')
        } else if (data.type === 'start') {
          setProgressMsg(`FBX ${data.total}개 변환 시작...`)
        } else if (data.type === 'done') {
          evtSrc.close()
          setProgressMsg('맵 데이터 로드 중...')
          // 생성된 맵 리스트 새로고침 후 로드
          fetch('/api/assets/map-list')
            .then(r => r.json())
            .then((listData: { maps: MapEntry[] }) => {
              setAvailMaps(listData.maps || [])
              const newMap = (listData.maps || []).find(
                (m: MapEntry) => m.folder === data.mapFolder || m.sceneName === data.sceneName,
              )
              if (newMap) loadMap(newMap)
              else setStatus('error')
            })
            .catch(() => setStatus('error'))
        } else if (data.type === 'error') {
          evtSrc.close()
          setProgressMsg('오류: ' + data.msg)
          setStatus('error')
        }
      } catch {}
    }

    evtSrc.onerror = () => {
      evtSrc.close()
      setProgressMsg('서버 연결 오류')
      setStatus('error')
    }
  }, [loadMap])

  // ── 씬 전체 보기 ────────────────────────────────────────────────────────
  const fitToScene = useCallback(() => {
    const cam      = cameraRef.current
    const ctrl     = controlsRef.current
    const group    = meshGroupRef.current
    if (!cam || !ctrl || !group || group.children.length === 0) return

    const box = new THREE.Box3().setFromObject(group)
    const ctr = box.getCenter(new THREE.Vector3())
    const sz  = box.getSize(new THREE.Vector3()).length()
    cam.position.set(ctr.x + sz * 0.5, ctr.y + sz * 0.3, ctr.z + sz * 0.5)
    ctrl.target.copy(ctr)
    cam.near = sz * 0.0001
    cam.far  = sz * 4
    cam.updateProjectionMatrix()
    ctrl.update()
  }, [])

  // ── 메시 선택 ──────────────────────────────────────────────────────────
  const handleSelect = useCallback((idx: number) => {
    setSelected(idx)
    // 선택된 메시로 카메라 이동
    const group = meshGroupRef.current
    if (!group || !cameraRef.current || !controlsRef.current) return
    const mesh = group.children[idx] as THREE.Mesh | undefined
    if (!mesh) return
    const box = new THREE.Box3().setFromObject(mesh)
    const ctr = box.getCenter(new THREE.Vector3())
    const sz  = box.getSize(new THREE.Vector3()).length()
    controlsRef.current.target.copy(ctr)
    if (sz > 0.1) {
      const dir = cameraRef.current.position.clone().sub(ctr).normalize()
      cameraRef.current.position.copy(ctr.clone().add(dir.multiplyScalar(sz * 2 + 5)))
    }
    controlsRef.current.update()
  }, [])

  // ── 캔버스 클릭 → Raycasting ──────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el  = mountRef.current
    const cam = cameraRef.current
    const grp = meshGroupRef.current
    if (!el || !cam || !grp) return

    const rect   = el.getBoundingClientRect()
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  *  2 - 1,
      ((e.clientY - rect.top)  / rect.height) * -2 + 1,
    )
    const ray    = new THREE.Raycaster()
    ray.setFromCamera(mouse, cam)
    const hits   = ray.intersectObjects(grp.children, true)
    if (!hits.length) return

    const hit = hits[0].object
    const idx = grp.children.indexOf(hit)
    if (idx >= 0) setSelected(idx)
  }, [])

  // ── Inspector 패널 ──────────────────────────────────────────────────────
  const selectedObj = selected !== null ? meshObjects[selected] : null

  // ── 렌더 ────────────────────────────────────────────────────────────────
  const panelBg   = '#1a1d23'
  const borderCol = '#2d3748'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>

      {/* ── 툴바 ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#151820', borderBottom: `1px solid ${borderCol}`, fontSize: 11, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>🎮 Scene Viewer</span>
        {loadedMap && <span style={{ color: '#94a3b8' }}>{loadedMap.sceneName}</span>}
        {status === 'ready' && (
          <span style={{ color: '#64748b' }}>· {meshCount.total.toLocaleString()} 메시 / 텍스처 {texCacheRef.current.size}개</span>
        )}
        <div style={{ flex: 1 }} />
        {/* 토글 버튼 */}
        <button onClick={() => setShowHier(v => !v)}
          style={{ padding: '3px 8px', background: showHier ? '#2563eb' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>
          ☰ Hierarchy
            </button>
        <button onClick={() => setShowInspector(v => !v)}
          style={{ padding: '3px 8px', background: showInspector ? '#2563eb' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>
          🔍 Inspector
            </button>
        <button onClick={() => setShowWireframe(v => !v)}
          style={{ padding: '3px 8px', background: showWireframe ? '#7c3aed' : '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>
          ⬡ Wire
              </button>
        <button onClick={fitToScene}
          style={{ padding: '3px 8px', background: '#1e293b', border: `1px solid ${borderCol}`, borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 10 }}>
          ⊞ Fit
              </button>
            </div>

      {/* ── 본문 ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Hierarchy */}
        {showHier && (
          <div style={{ width: 220, minWidth: 160, background: '#151820', borderRight: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#475569', borderBottom: `1px solid ${borderCol}`, letterSpacing: 1, textTransform: 'uppercase' }}>
              Hierarchy
                </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {hierarchy
                ? hierarchy.children.map((n, i) => (
                    <HierarchyItem key={i} node={n} selected={selected} onSelect={handleSelect} />
                  ))
                : <div style={{ padding: 16, color: '#475569', fontSize: 11 }}>씬을 로드하면<br/>하이어라키가 표시됩니다</div>
              }
                </div>
            {status === 'ready' && (
              <div style={{ padding: '6px 10px', fontSize: 10, color: '#475569', borderTop: `1px solid ${borderCol}` }}>
                {meshCount.total.toLocaleString()} 오브젝트
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} onClick={handleCanvasClick} />

          {/* 로딩 오버레이 */}
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

          {/* 오류 */}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,20,30,0.85)', gap: 10 }}>
              <div style={{ fontSize: 32 }}>❌</div>
              <div style={{ color: '#f87171', fontWeight: 600 }}>로드 실패</div>
              <div style={{ color: '#94a3b8', fontSize: 11, maxWidth: 300, textAlign: 'center' }}>{progressMsg}</div>
                        </div>
          )}

          {/* 맵 선택 (수동) */}
          {status === 'idle' && availMaps.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: '#0f1420' }}>
              <MapSelector maps={availMaps} onSelect={setManualMap} />
            </div>
          )}
        </div>

        {/* Inspector */}
        {showInspector && (
          <div style={{ width: 230, minWidth: 180, background: '#151820', borderLeft: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#475569', borderBottom: `1px solid ${borderCol}`, letterSpacing: 1, textTransform: 'uppercase' }}>
              Inspector
                    </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, fontSize: 11 }}>
              {selectedObj ? (
                <InspectorPanel obj={selectedObj} />
              ) : (
                <div style={{ color: '#475569', fontSize: 11 }}>오브젝트를 선택하면<br/>속성이 표시됩니다</div>
                  )}
                </div>
                </div>
              )}
            </div>
          </div>
  )
}

// ── Inspector 패널 내용 ──────────────────────────────────────────────────────
function InspectorPanel({ obj }: { obj: MeshJsonObject }) {
  const row = (label: string, value: string | number, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 6 }}>
      <span style={{ color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span style={{ color: color || '#e2e8f0', textAlign: 'right', wordBreak: 'break-all', fontSize: 10 }}>{value}</span>
      </div>
  )
  const section = (title: string) => (
    <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 4, borderBottom: '1px solid #1e293b', paddingBottom: 3 }}>
      {title}
    </div>
  )
  const v3 = (v: { x: number; y: number; z: number }) =>
    `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`

  const mat = obj.material

  return (
    <div>
      {/* 이름 */}
      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13, marginBottom: 6, wordBreak: 'break-word' }}>
        {obj.name}
            </div>

      {/* 경로 */}
      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.4 }}>
        {obj.path}
        </div>

      {/* 태그 / 레이어 */}
      {section('Game Object')}
      {obj.tag   && row('Tag',   obj.tag)}
      {obj.layer && row('Layer', obj.layer)}

      {/* 트랜스폼 */}
      {section('Transform')}
      {row('Position', v3(obj.transform.position))}
      {row('Rotation', v3(obj.transform.rotation))}
      {row('Scale',    v3(obj.transform.scale))}

      {/* 지오메트리 */}
      {section('Geometry')}
      {row('Vertices',  obj.geometry.vertices.length.toLocaleString())}
      {obj.geometry.triangles && row('Triangles', (obj.geometry.triangles.length / 3).toLocaleString())}
      {obj.geometry.uvs && row('UVs', '✓', '#4ade80')}

      {/* 머티리얼 */}
      {mat && (
        <>
          {section('Material')}
          {mat.color && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: '#64748b' }}>Color</span>
              <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: `rgb(${Math.round(mat.color.r * 255)},${Math.round(mat.color.g * 255)},${Math.round(mat.color.b * 255)})`, border: '1px solid #475569' }} />
        </div>
      )}
          {mat.mainTextureId && row('Texture', mat.mainTextureId, '#a78bfa')}
          {mat.mainTextureTiling && row('Tiling', `${mat.mainTextureTiling.x.toFixed(2)}, ${mat.mainTextureTiling.y.toFixed(2)}`)}
          {mat.lightmapIndex !== undefined && mat.lightmapIndex >= 0 && row('Lightmap', `#${mat.lightmapIndex}`)}
        </>
      )}
    </div>
  )
}

export default SceneViewer
