/**
 * SceneViewer.tsx
 * Unity .unity 씬 파일을 파싱해서 여러 FBX 모델을 트랜스폼과 함께 Three.js로 렌더링
 *
 * Unity(LH, Y-up) → Three.js(RH, Y-up) 좌표 변환:
 *   position:   (x,  y, -z)
 *   quaternion: (-x, -y, z, w)
 *   scale:      (x,  y,  z)   ← 변경 없음
 *
 * ── 안정성 개선 ──
 * - WebGL context lost/restored 핸들링
 * - 텍스처 사이즈 제한 (GPU 메모리 보호)
 * - 순차 로딩 + 지연 (GPU 부하 분산)
 * - 애니메이션 루프 에러 보호
 * - 쉐도우맵 축소 (메모리 절약)
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface Vec3  { x: number; y: number; z: number }
interface Quat  { x: number; y: number; z: number; w: number }

interface SceneObject {
  id: string
  name: string
  type?: 'fbx' | 'probuilder' | 'box' | 'empty'
  fbxPath: string
  fbxUrl: string
  vertices?: number[]
  indices?: number[]
  pos: Vec3
  rot: Quat
  scale: Vec3
  components?: string[]
}

interface HierarchyNode {
  id: string
  name: string
  type: 'fbx' | 'probuilder' | 'box' | 'empty'
  objIdx: number      // index in objects[], -1 if no rendered object
  children: HierarchyNode[]
  components?: string[]  // 해당 GO의 컴포넌트 목록
}

interface SceneData {
  scenePath: string
  totalPrefabs: number
  totalDirect: number
  resolvedCount: number
  resolvedFbx?: number
  resolvedProBuilder?: number
  resolvedBox?: number
  resolvedEmpty?: number
  objects: SceneObject[]
  hierarchy?: HierarchyNode[]
}

// ── 상수 ──────────────────────────────────────────────────────────────────────
const MAX_TEXTURE_SIZE = 1024       // 텍스처 최대 해상도 제한
const MAX_SCENE_OBJECTS = 400       // 한 씬에 로드할 최대 오브젝트 수 (ProBuilder/Box는 경량)
const FBX_CONCURRENCY = 6           // FBX 동시 로드 수 (병렬 배치)
// Unity FBX Import Scale: Unity는 .meta 파일에서 항상 FileScale=0.01 적용
// FBXLoader는 UnitScaleFactor를 저장만 하고 스케일 변환하지 않으므로 우리가 직접 적용
// 주의: 일부 FBX가 UnitScaleFactor=100(m)으로 설정되어도 Unity는 항상 0.01 적용
const UNITY_FBX_IMPORT_SCALE = 0.01

// ── ProBuilder 머터리얼 색상 팔레트 ─────────────────────────────────────────────
const PB_COLORS: Record<string, number> = {
  wall:    0x6b7280,
  floor:   0x4b5563,
  stair:   0x7c6f64,
  window:  0x64748b,
  box:     0x9ca3af,
  door:    0x78716c,
  default: 0x6b7280,
}
function pbColorForName(name: string): number {
  const n = name.toLowerCase()
  for (const [k, c] of Object.entries(PB_COLORS)) {
    if (k !== 'default' && n.includes(k)) return c
  }
  return PB_COLORS.default
}

/** ProBuilder 정점+인덱스 데이터에서 Three.js BufferGeometry 생성
 *  Unity LHS → Three.js RHS 변환: Z 좌표를 반전
 *  Z 반전 시 삼각형 와인딩 순서가 뒤집히므로 인덱스도 역순으로 보정 */
function createProBuilderGeometry(vertices: number[], indices: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  // Z 좌표 반전 (Unity LHS → Three.js RHS)
  const positions = new Float32Array(vertices.length)
  for (let i = 0; i < vertices.length; i += 3) {
    positions[i]     = vertices[i]      // x
    positions[i + 1] = vertices[i + 1]  // y
    positions[i + 2] = -vertices[i + 2] // z 반전
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  if (indices.length > 0) {
    // Z 반전으로 인해 삼각형 와인딩이 뒤집히므로 인덱스 순서 역전
    const flippedIndices = new Array(indices.length)
    for (let i = 0; i < indices.length; i += 3) {
      flippedIndices[i]     = indices[i]
      flippedIndices[i + 1] = indices[i + 2]  // 2번과 3번 스왑
      flippedIndices[i + 2] = indices[i + 1]
    }
    geo.setIndex(flippedIndices)
  }
  geo.computeVertexNormals()
  return geo
}

// ── 좌표 변환 (Unity LH → Three.js RH) ───────────────────────────────────────
function unityToThreePos(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, -v.z)
}
function unityToThreeQuat(q: Quat): THREE.Quaternion {
  return new THREE.Quaternion(-q.x, -q.y, q.z, q.w)
}
function unityToThreeScale(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z)
}

/** 텍스처 다운스케일 (GPU 메모리 보호) */
function limitTextureSize(tex: THREE.Texture): void {
  if (!tex.image) return
  const img = tex.image

  // drawImage에 사용 가능한 타입인지 체크 (TGA 등은 ImageData/DataTexture로 들어옴)
  const isDrawable =
    img instanceof HTMLImageElement ||
    img instanceof HTMLCanvasElement ||
    img instanceof HTMLVideoElement ||
    img instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas) ||
    (typeof SVGImageElement !== 'undefined' && img instanceof SVGImageElement)

  if (!isDrawable) return // drawImage 불가능한 타입은 스킵

  const w = (img as HTMLImageElement).width ?? 0
  const h = (img as HTMLImageElement).height ?? 0
  if (w <= MAX_TEXTURE_SIZE && h <= MAX_TEXTURE_SIZE) return

  const scale = MAX_TEXTURE_SIZE / Math.max(w, h)
  const nw = Math.floor(w * scale)
  const nh = Math.floor(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = nw
  canvas.height = nh
  const ctx = canvas.getContext('2d')
  if (ctx) {
    try {
      ctx.drawImage(img as CanvasImageSource, 0, 0, nw, nh)
      tex.image = canvas
      tex.needsUpdate = true
    } catch {
      // drawImage 실패 시 원본 텍스처 유지
    }
  }
}

// ── 하이어라키 타입 아이콘 ─────────────────────────────────────────────────────
const HIERARCHY_ICONS: Record<string, string> = {
  fbx: '🔷',
  probuilder: '🟩',
  box: '📦',
  empty: '📁',
}
// 컴포넌트별 아이콘
const COMP_ICONS: Record<string, string> = {
  BoxCollider: '🟢', CapsuleCollider: '🟢', SphereCollider: '🟢', MeshCollider: '🟢',
  Animator: '🎬', SkinnedMeshRenderer: '🦴',
  Light: '💡', ParticleSystem: '✨', ParticleSystemRenderer: '✨',
  AudioSource: '🔊', MonoBehaviour: '📜', Rigidbody: '⚙️',
  MeshRenderer: '🔷', MeshFilter: '🔷',
  Canvas: '🖥️', SpriteRenderer: '🖼️', LineRenderer: '〰️',
}

// ── 하이어라키 트리 노드 컴포넌트 ─────────────────────────────────────────────
interface HierarchyTreeNodeProps {
  node: HierarchyNode
  depth: number
  expandedNodes: Set<string>
  selectedObjIdx: number
  onToggle: (id: string) => void
  onSelect: (objIdx: number) => void
}

function HierarchyTreeNode({ node, depth, expandedNodes, selectedObjIdx, onToggle, onSelect }: HierarchyTreeNodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded  = expandedNodes.has(node.id)
  const isSelected  = node.objIdx >= 0 && node.objIdx === selectedObjIdx
  const isClickable = node.objIdx >= 0

  const icon = HIERARCHY_ICONS[node.type] || HIERARCHY_ICONS.empty

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (hasChildren) onToggle(node.id)
          if (isClickable) onSelect(node.objIdx)
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 2,
          paddingLeft: 8 + depth * 14, paddingRight: 6,
          paddingTop: 2, paddingBottom: 2,
          cursor: isClickable || hasChildren ? 'pointer' : 'default',
          background: isSelected ? 'rgba(99,102,241,0.2)' : 'transparent',
          borderLeft: isSelected ? '2px solid #818cf8' : '2px solid transparent',
          color: isClickable ? '#e2e8f0' : '#64748b',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.08)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
        }}
        title={`${node.name} (${node.type}${node.objIdx >= 0 ? `, idx=${node.objIdx}` : ''}${node.components?.length ? `\n컴포넌트: ${node.components.join(', ')}` : ''})`}
      >
        {/* 펼침/접힘 화살표 */}
        <span style={{
          width: 12, textAlign: 'center', fontSize: 8,
          color: '#475569', flexShrink: 0,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          visibility: hasChildren ? 'visible' : 'hidden',
        }}>
          ▶
        </span>

        {/* 타입 아이콘 */}
        <span style={{ fontSize: 10, flexShrink: 0 }}>{icon}</span>

        {/* 이름 */}
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis',
          fontSize: 11, lineHeight: '16px',
          fontWeight: isSelected ? 600 : 400,
        }}>
          {node.name || '[unnamed]'}
        </span>

        {/* 컴포넌트 뱃지 (empty 노드에만 표시) */}
        {node.components && node.components.length > 0 && (
          <span style={{ display: 'flex', gap: 1, marginLeft: 4, flexShrink: 0 }}>
            {node.components.slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 8 }} title={c}>
                {COMP_ICONS[c] || '•'}
              </span>
            ))}
            {node.components.length > 3 && (
              <span style={{ fontSize: 8, color: '#64748b' }}>+{node.components.length - 3}</span>
            )}
          </span>
        )}

        {/* 자식 수 */}
        {hasChildren && (
          <span style={{ color: '#475569', fontSize: 9, marginLeft: 'auto', flexShrink: 0 }}>
            {node.children.length}
          </span>
        )}
      </div>

      {/* 자식 노드 (재귀) */}
      {hasChildren && isExpanded && node.children.map(child => (
        <HierarchyTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          selectedObjIdx={selectedObjIdx}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

// ── SceneViewer コンポーネント ─────────────────────────────────────────────────

export interface SceneViewerProps {
  /** asset index の相対パス（例: "GameContents/Map/..." 또는 완전한 경로）*/
  scenePath: string
  height?: number
  className?: string
}

export function SceneViewer({ scenePath, height = 560, className = '' }: SceneViewerProps) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const [status, setStatus]     = useState<'idle' | 'loading-scene' | 'loading-fbx' | 'ok' | 'error' | 'context-lost'>('idle')
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })
  const [errMsg, setErrMsg]     = useState('')
  const [sceneInfo, setSceneInfo] = useState<Omit<SceneData, 'objects'> | null>(null)
  const cleanupRef = useRef<() => void>(() => {})

  // ── Hierarchy 패널 상태 ──
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([])
  const [showHierarchy, setShowHierarchy] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedObjIdx, setSelectedObjIdx] = useState<number>(-1)

  // Three.js 객체 참조 (hierarchy → camera focus용)
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const sceneObjMap = useRef<Map<number, THREE.Object3D>>(new Map())

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false
    let contextLost = false

    setStatus('loading-scene')
    setErrMsg('')
    setProgress({ loaded: 0, total: 0 })

    // ── Three.js 씬 셋업 ─────────────────────────────────────────────────────
    const w = el.clientWidth || 800
    const h = height

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      // WebGL context 속성
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // DPR 제한 (메모리 절약)
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFShadowMap
    renderer.outputColorSpace  = THREE.SRGBColorSpace
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    el.appendChild(renderer.domElement)

    // ── WebGL Context Lost / Restored 핸들링 ──────────────────────────────────
    const canvas = renderer.domElement
    const onContextLost = (e: Event) => {
      e.preventDefault() // 브라우저에게 복구 시도 허용
      contextLost = true
      cancelAnimationFrame(animId)
      console.warn('[SceneViewer] WebGL context lost!')
      if (!cancelled) setStatus('context-lost')
    }
    const onContextRestored = () => {
      console.log('[SceneViewer] WebGL context restored')
      contextLost = false
      // 렌더링 루프 재시작
      animate()
      if (!cancelled) setStatus('ok')
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    const scene  = new THREE.Scene()
    scene.background = new THREE.Color(0x0d1117)
    // fog는 씬 크기에 따라 동적으로 설정 (초기값: 비활성)
    scene.fog        = null

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50000)
    camera.position.set(0, 150, 400)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping  = true
    controls.dampingFactor  = 0.07
    controls.minDistance    = 5
    controls.maxDistance    = 40000

    // ref에 저장 (hierarchy 패널 → 카메라 포커스용)
    cameraRef.current = camera
    controlsRef.current = controls
    sceneObjMap.current.clear()

    // 조명 (쉐도우맵 크기 축소: 2048→1024)
    scene.add(new THREE.AmbientLight(0xffffff, 1.8))
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.0)
    sun.position.set(500, 800, 300)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024) // 축소: GPU 메모리 절약
    sun.shadow.camera.near = 1
    sun.shadow.camera.far  = 3000
    sun.shadow.camera.left = -500
    sun.shadow.camera.right = 500
    sun.shadow.camera.top   = 500
    sun.shadow.camera.bottom = -500
    scene.add(sun)
    scene.add(new THREE.DirectionalLight(0x8899ff, 0.6).translateX(-300).translateY(200).translateZ(-200))
    scene.add(new THREE.HemisphereLight(0x99aaff, 0x334155, 0.5))

    // 그리드
    const grid = new THREE.GridHelper(1000, 50, 0x1e293b, 0x1e293b)
    scene.add(grid)

    // 애니메이션 루프 (에러 보호 + context lost 체크)
    let animId = 0
    const animate = () => {
      if (cancelled || contextLost) return
      animId = requestAnimationFrame(animate)
      try {
        controls.update()
        renderer.render(scene, camera)
      } catch (err) {
        console.error('[SceneViewer] Render error:', err)
        // 렌더 에러 시 루프 중단하지 않고 다음 프레임에서 재시도
      }
    }
    animate()

    // 리사이즈 대응
    const onResize = () => {
      if (contextLost) return
      const nw = el.clientWidth
      if (nw <= 0) return
      camera.aspect = nw / h
      camera.updateProjectionMatrix()
      renderer.setSize(nw, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    // 리소스 추적 (cleanup 시 GPU 메모리 해제)
    const loadedGeometries: THREE.BufferGeometry[] = []
    const loadedMaterials: THREE.Material[] = []
    const loadedTextures: THREE.Texture[] = []

    // ── 씬 데이터 로드 ───────────────────────────────────────────────────────
    ;(async () => {
      try {
        // scenePath가 이미 API URL이면 그대로 사용, 아니면 scene API로 래핑
        const fetchUrl = scenePath.startsWith('/api/')
          ? scenePath
          : `/api/assets/scene?path=${encodeURIComponent(scenePath)}&max=${MAX_SCENE_OBJECTS}`
        const resp = await fetch(fetchUrl)
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: resp.statusText }))
          throw new Error(err.error ?? resp.statusText)
        }
        const data: SceneData = await resp.json()
        if (cancelled) return

        setSceneInfo({
          scenePath: data.scenePath,
          totalPrefabs: data.totalPrefabs,
          totalDirect: data.totalDirect,
          resolvedCount: data.resolvedCount,
          resolvedFbx: data.resolvedFbx,
          resolvedProBuilder: data.resolvedProBuilder,
          resolvedBox: data.resolvedBox,
        })
        // 하이어라키 트리 데이터 저장
        if (data.hierarchy) {
          setHierarchyData(data.hierarchy)
          // 최상위 노드는 기본 펼침
          const defaultExpanded = new Set<string>()
          for (const node of data.hierarchy) {
            if (node.children.length > 0) defaultExpanded.add(node.id)
          }
          setExpandedNodes(defaultExpanded)
        }
        setStatus('loading-fbx')
        setProgress({ loaded: 0, total: data.objects.length })

        if (data.objects.length === 0) {
          setStatus('ok')
          return
        }

        // ── 커스텀 LoadingManager ──
        const loadingManager = new THREE.LoadingManager()
        loadingManager.setURLModifier((url: string) => {
          if (
            url.startsWith('/api/assets/file?') ||
            url.startsWith('/api/assets/smart?') ||
            url.startsWith('/api/assets/scene?') ||
            url.startsWith('/api/assets/index') ||
            url.startsWith('/api/git/') ||
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('data:') ||
            url.startsWith('blob:')
          ) return url
          const filename = url.split(/[/?\\]/).filter(Boolean).pop() ?? url
          return `/api/assets/smart?name=${encodeURIComponent(filename)}`
        })
        const tgaLoaderManaged = new TGALoader(loadingManager)
        loadingManager.addHandler(/\.tga$/i, tgaLoaderManaged)

        // ── FBX 공유 캐시 ────
        const fbxCache: Record<string, THREE.Group> = {}
        const fbxLoader = new FBXLoader(loadingManager)
        const texLoader  = new THREE.TextureLoader(loadingManager)

        const loadFbx = (url: string): Promise<THREE.Group> => {
          if (fbxCache[url]) return Promise.resolve(fbxCache[url].clone())
          return new Promise((resolve, reject) => {
            fbxLoader.load(url, (fbx) => {
              // geometry/material 추적
              fbx.traverse(child => {
                const mesh = child as THREE.Mesh
                if (mesh.isMesh) {
                  if (mesh.geometry) loadedGeometries.push(mesh.geometry)
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                  mats.forEach(m => { if (m) loadedMaterials.push(m) })
                }
              })
              fbxCache[url] = fbx
              resolve(fbx.clone())
            }, undefined, reject)
          })
        }

        const TEX_LOAD_TIMEOUT = 10_000 // 텍스처 로드 타임아웃 (10초)
        const loadTex = (apiUrl: string): Promise<THREE.Texture | null> => {
          if (!apiUrl) return Promise.resolve(null)
          return new Promise((resolve) => {
            const timer = setTimeout(() => {
              resolve(null) // 타임아웃 시 null 반환
            }, TEX_LOAD_TIMEOUT)

            const isTga = /\.tga$/i.test(apiUrl)
            const ldr: THREE.Loader = isTga ? tgaLoaderManaged : texLoader
            ;(ldr as TGALoader).load(apiUrl, (tex: THREE.Texture) => {
              clearTimeout(timer)
              tex.colorSpace = THREE.SRGBColorSpace
              tex.flipY = !isTga
              limitTextureSize(tex)  // GPU 메모리 보호
              loadedTextures.push(tex)
              resolve(tex)
            }, undefined, () => { clearTimeout(timer); resolve(null) })
          })
        }

        // 텍스처 캐시
        const texCache: Record<string, THREE.Texture | null> = {}
        const cachedLoadTex = async (url: string) => {
          if (url in texCache) return texCache[url]
          const t = await loadTex(url)
          texCache[url] = t
          return t
        }

        // 머터리얼 인덱스 캐시
        const matCache: Record<string, { albedo: string; normal: string; emission: string }[]> = {}
        const fetchMats = async (fbxPath: string) => {
          if (fbxPath in matCache) return matCache[fbxPath]
          try {
            const r = await fetch(`/api/assets/materials?fbxPath=${encodeURIComponent(fbxPath)}`)
            if (!r.ok) { matCache[fbxPath] = []; return [] }
            const d = await r.json() as { materials: { name: string; albedo: string; normal: string; emission: string }[] }
            matCache[fbxPath] = d.materials ?? []
            return matCache[fbxPath]
          } catch { matCache[fbxPath] = []; return [] }
        }

        // ── 공유 박스 지오메트리 (메모리 절약) ──────────────────────────────
        const sharedBoxGeo = new THREE.BoxGeometry(2, 2, 2)
        loadedGeometries.push(sharedBoxGeo)

        // ── Phase 1: 경량 오브젝트 즉시 배치 (ProBuilder / Box) ──────────
        const sceneBounds = new THREE.Box3()
        let loadedCount = 0
        const fbxObjects: SceneObject[] = []

        const objIdxCounter = { idx: 0 }
        for (const obj of data.objects) {
          const currentIdx = objIdxCounter.idx++
          const objType = obj.type || 'fbx'

          if (objType === 'probuilder' && obj.vertices && obj.vertices.length >= 9) {
            const geo = createProBuilderGeometry(obj.vertices, obj.indices ?? [])
            loadedGeometries.push(geo)
            const mat = new THREE.MeshStandardMaterial({
              color: pbColorForName(obj.name),
              roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide,
            })
            loadedMaterials.push(mat)
            const mesh = new THREE.Mesh(geo, mat)
            mesh.castShadow = false; mesh.receiveShadow = true
            mesh.position.copy(unityToThreePos(obj.pos))
            mesh.quaternion.copy(unityToThreeQuat(obj.rot))
            mesh.scale.copy(unityToThreeScale(obj.scale))
            scene.add(mesh)
            sceneBounds.expandByObject(mesh)
            sceneObjMap.current.set(currentIdx, mesh)
            loadedCount++
          } else if (objType === 'box') {
            const mat = new THREE.MeshStandardMaterial({
              color: 0x475569, roughness: 0.9, metalness: 0.05,
              transparent: true, opacity: 0.35, side: THREE.DoubleSide,
            })
            loadedMaterials.push(mat)
            const mesh = new THREE.Mesh(sharedBoxGeo, mat)
            mesh.position.copy(unityToThreePos(obj.pos))
            mesh.quaternion.copy(unityToThreeQuat(obj.rot))
            mesh.scale.copy(unityToThreeScale(obj.scale))
            scene.add(mesh)
            sceneBounds.expandByObject(mesh)
            sceneObjMap.current.set(currentIdx, mesh)
            loadedCount++
          } else if (objType === 'empty') {
            // 비렌더링 오브젝트: 컴포넌트에 따라 다른 마커로 표시
            const comps = obj.components ?? []
            const hasCollider = comps.some(c => c.includes('Collider'))
            const hasAnimator = comps.includes('Animator') || comps.includes('SkinnedMeshRenderer')
            const hasLight = comps.includes('Light')
            const hasParticle = comps.includes('ParticleSystem')

            // 컴포넌트에 따라 다른 색상
            const color = hasCollider ? 0x22c55e : hasAnimator ? 0xf59e0b : hasLight ? 0xfbbf24 : hasParticle ? 0xec4899 : 0x6366f1

            // AxesHelper + 작은 표시 구체
            const group = new THREE.Group()
            const axes = new THREE.AxesHelper(0.3)
            group.add(axes)
            // 작은 wireframe 아이콘
            if (hasCollider) {
              // Collider: 작은 wireframe 구/캡슐
              const wireGeo = new THREE.SphereGeometry(0.15, 8, 6)
              loadedGeometries.push(wireGeo)
              const wireMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.6 })
              loadedMaterials.push(wireMat)
              group.add(new THREE.Mesh(wireGeo, wireMat))
            } else {
              // 기본: 작은 다이아몬드(팔면체)
              const diaGeo = new THREE.OctahedronGeometry(0.12, 0)
              loadedGeometries.push(diaGeo)
              const diaMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
              loadedMaterials.push(diaMat)
              group.add(new THREE.Mesh(diaGeo, diaMat))
            }

            group.position.copy(unityToThreePos(obj.pos))
            group.quaternion.copy(unityToThreeQuat(obj.rot))
            scene.add(group)
            sceneObjMap.current.set(currentIdx, group)
            loadedCount++
          } else {
            fbxObjects.push({ ...obj, _origIdx: currentIdx } as SceneObject & { _origIdx: number })
          }
        }
        if (!cancelled) setProgress({ loaded: loadedCount, total: data.objects.length })

        // ── Phase 2: FBX 병렬 배치 로딩 (텍스처 없이 먼저 배치) ──────────
        // 텍스처 적용 작업을 모아두었다가 Phase 3에서 백그라운드 처리
        interface TexTask { group: THREE.Group; fbxPath: string }
        const texTasks: TexTask[] = []

        // 고유 FBX URL 기준으로 중복 제거하여 사전 로드 큐 생성
        const uniqueUrls = [...new Set(fbxObjects.map(o => o.fbxUrl))]
        const FBX_LOAD_TIMEOUT = 20_000 // 개별 FBX 로드 타임아웃 (20초)

        // 사전에 FBX 파일 병렬 프리로드 (캐시에 저장, 타임아웃 포함)
        let preloadedCount = 0
        const preloadBatch = async (urls: string[]) => {
          await Promise.allSettled(urls.map(url => {
            if (fbxCache[url]) {
              preloadedCount++
              if (!cancelled) setProgress({ loaded: loadedCount + preloadedCount, total: data.objects.length })
              return Promise.resolve()
            }
            return new Promise<void>((resolve) => {
              // 타임아웃: FBX 로드가 멈추는 경우 대비
              const timer = setTimeout(() => {
                console.warn(`[SceneViewer] FBX load timeout (${FBX_LOAD_TIMEOUT / 1000}s): ${url.split('path=')[1]?.slice(0, 60) ?? url}`)
                preloadedCount++
                if (!cancelled) setProgress({ loaded: loadedCount + preloadedCount, total: data.objects.length })
                resolve()
              }, FBX_LOAD_TIMEOUT)

              fbxLoader.load(url, (fbx) => {
                clearTimeout(timer)
                fbx.traverse(child => {
                  const mesh = child as THREE.Mesh
                  if (mesh.isMesh) {
                    if (mesh.geometry) loadedGeometries.push(mesh.geometry)
                    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                    mats.forEach(m => { if (m) loadedMaterials.push(m) })
                  }
                })
                fbxCache[url] = fbx
                preloadedCount++
                if (!cancelled) setProgress({ loaded: loadedCount + preloadedCount, total: data.objects.length })
                resolve()
              }, undefined, (err) => {
                clearTimeout(timer)
                console.warn(`[SceneViewer] FBX load failed: ${url.split('path=')[1]?.slice(0, 60) ?? url}`, err)
                preloadedCount++
                if (!cancelled) setProgress({ loaded: loadedCount + preloadedCount, total: data.objects.length })
                resolve() // 실패해도 계속 진행
              })
            })
          }))
        }

        // FBX를 배치 단위로 프리로드 (동시 로드 수 제한)
        console.log(`[SceneViewer] Preloading ${uniqueUrls.length} unique FBX files (${fbxObjects.length} objects)...`)
        for (let i = 0; i < uniqueUrls.length; i += FBX_CONCURRENCY) {
          if (cancelled || contextLost) break
          const batch = uniqueUrls.slice(i, i + FBX_CONCURRENCY)
          await preloadBatch(batch)
          console.log(`[SceneViewer] Preload batch ${Math.floor(i / FBX_CONCURRENCY) + 1}/${Math.ceil(uniqueUrls.length / FBX_CONCURRENCY)} done (${Object.keys(fbxCache).length} cached)`)
        }

        // 프리로드 완료된 FBX를 즉시 배치 (clone만 하므로 빠름)
        let placedCount = 0
        let skippedCount = 0
        for (const obj of fbxObjects) {
          if (cancelled || contextLost) break
          const origIdx = (obj as SceneObject & { _origIdx: number })._origIdx
          try {
            const cached = fbxCache[obj.fbxUrl]
            if (!cached) { skippedCount++; continue }
            const fbxGroup = cached.clone()

            // 기본 머터리얼로 빠르게 배치 (텍스처 없이)
            fbxGroup.traverse(child => {
              const mesh = child as THREE.Mesh
              if (!mesh.isMesh) return
              mesh.castShadow = false
              mesh.receiveShadow = true
            })

            // ── Unity 좌표 적용 + FBX Import Scale (동적) ──
            // FBXLoader가 Z-up→Y-up 변환을 루트 그룹에 적용할 수 있으므로
            // 기존 rotation을 덮어쓰지 않고, Unity rotation과 합성한다.
            const origQuat  = fbxGroup.quaternion.clone()
            const origScale = fbxGroup.scale.clone()
            const uPos   = unityToThreePos(obj.pos)
            const uRot   = unityToThreeQuat(obj.rot)
            const uScale = unityToThreeScale(obj.scale)

            // Unity는 항상 FileScale=0.01 적용 (cm→m 변환)
            const importScale = UNITY_FBX_IMPORT_SCALE

            // Position: Unity 월드 좌표 (FBXLoader 루트 pos는 보통 (0,0,0))
            fbxGroup.position.copy(uPos)
            // Rotation: Unity 회전 × FBXLoader 원본 회전 (좌표계 변환 보존)
            fbxGroup.quaternion.copy(uRot.clone().multiply(origQuat))
            // Scale: FBXLoader 스케일 × Unity 스케일 × 단위 변환
            fbxGroup.scale.set(
              origScale.x * uScale.x * importScale,
              origScale.y * uScale.y * importScale,
              origScale.z * uScale.z * importScale,
            )

            scene.add(fbxGroup)
            sceneBounds.expandByObject(fbxGroup)
            sceneObjMap.current.set(origIdx, fbxGroup)
            texTasks.push({ group: fbxGroup, fbxPath: obj.fbxPath })
            placedCount++
          } catch (e) {
            console.warn(`[SceneViewer] Failed to place ${obj.name}:`, e)
            skippedCount++
          }
        }
        loadedCount += placedCount + skippedCount
        if (!cancelled) setProgress({ loaded: loadedCount, total: data.objects.length })
        console.log(`[SceneViewer] Placement done: ${placedCount} placed, ${skippedCount} skipped`)

        // ── 디버그: 처음 5개 오브젝트의 좌표 정보 로깅 ──
        if (fbxObjects.length > 0) {
          const debugObjs = fbxObjects.slice(0, 5)
          for (const obj of debugObjs) {
            const c = fbxCache[obj.fbxUrl]
            const q = c?.quaternion
            const s = c?.scale
            const usf = c?.userData?.unitScaleFactor
            console.log(
              `[SceneViewer] 🔍 ${obj.name}:` +
              ` unityPos=(${obj.pos.x.toFixed(1)},${obj.pos.y.toFixed(1)},${obj.pos.z.toFixed(1)})` +
              ` unityRot=(${obj.rot.x.toFixed(3)},${obj.rot.y.toFixed(3)},${obj.rot.z.toFixed(3)},${obj.rot.w.toFixed(3)})` +
              ` unityScale=(${obj.scale.x.toFixed(3)},${obj.scale.y.toFixed(3)},${obj.scale.z.toFixed(3)})` +
              ` fbxOrigQuat=(${q ? `${q.x.toFixed(4)},${q.y.toFixed(4)},${q.z.toFixed(4)},${q.w.toFixed(4)}` : 'N/A'})` +
              ` fbxOrigScale=(${s ? `${s.x.toFixed(4)},${s.y.toFixed(4)},${s.z.toFixed(4)}` : 'N/A'})` +
              ` unitScaleFactor=${usf ?? 'N/A'} importScale=${UNITY_FBX_IMPORT_SCALE}`,
            )
          }
        }

        if (cancelled || contextLost) return

        // ── 카메라 자동 맞춤 (FOV 기반 + 동적 fog/far) ──────────────────────
        if (!sceneBounds.isEmpty()) {
          const center = sceneBounds.getCenter(new THREE.Vector3())
          const size   = sceneBounds.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)

          // FOV 기반 적절 거리: 전체 씬이 화면에 들어오도록
          const fovRad = camera.fov * Math.PI / 180
          const fitDist = Math.max(10, (maxDim / 2) / Math.tan(fovRad / 2) * 1.1)

          // 45도 각도에서 바라보기
          camera.position.set(
            center.x + fitDist * 0.35,
            center.y + fitDist * 0.25,
            center.z + fitDist * 0.85,
          )
          camera.lookAt(center)
          controls.target.copy(center)

          // 동적 far/near plane (씬 크기에 비례)
          camera.near = Math.max(0.1, maxDim * 0.001)
          camera.far  = Math.max(5000, maxDim * 20)
          camera.updateProjectionMatrix()

          controls.maxDistance = fitDist * 5
          controls.minDistance = Math.max(1, maxDim * 0.01)

          // 동적 fog: 씬 크기에 비례 (먼 거리에서도 보이도록)
          const fogDensity = Math.min(0.003, 1.0 / Math.max(maxDim, 200))
          scene.fog = new THREE.FogExp2(0x0d1117, fogDensity)

          // 그리드 위치 & 크기 조정
          scene.remove(grid)
          const gridSize = Math.max(1000, maxDim * 1.5)
          const newGrid = new THREE.GridHelper(gridSize, 50, 0x1e293b, 0x1e293b)
          newGrid.position.set(center.x, sceneBounds.min.y, center.z)
          scene.add(newGrid)

          controls.update()
          console.log('[SceneViewer] Camera fit:', { center: center.toArray().map(v => +v.toFixed(1)), size: size.toArray().map(v => +v.toFixed(1)), maxDim: +maxDim.toFixed(1), fitDist: +fitDist.toFixed(1) })
        }

        setStatus('ok')

        // ── Phase 3: 텍스처 백그라운드 적용 (UI 차단 없이) ────────────────
        // 이미 모든 오브젝트가 배치된 상태에서 텍스처만 비동기로 적용
        if (texTasks.length > 0 && !cancelled && !contextLost) {
          // 유니크 fbxPath 기준으로 머터리얼 한꺼번에 프리페치
          const uniquePaths = [...new Set(texTasks.map(t => t.fbxPath))]
          await Promise.allSettled(uniquePaths.map(p => fetchMats(p)))

          for (const task of texTasks) {
            if (cancelled || contextLost) break
            try {
              const mats = await fetchMats(task.fbxPath)
              if (!mats.length) continue
              const findMat = (meshName: string) => {
                const mn = meshName.toLowerCase()
                return mats.find(e => e.albedo && (mn.includes(e.albedo.split('/').pop()?.split('_')[0]?.toLowerCase() ?? '') ?? false)) ?? mats[0]
              }
              const ps: Promise<void>[] = []
              task.group.traverse(child => {
                const mesh = child as THREE.Mesh
                if (!mesh.isMesh) return
                ps.push((async () => {
                  const m = findMat(mesh.name)
                  if (!m) return
                  // albedo만 로드 (normal/emission은 생략하여 속도 향상)
                  const alb = m.albedo ? await cachedLoadTex(m.albedo) : null
                  const mat = new THREE.MeshStandardMaterial({
                    side: THREE.DoubleSide, roughness: 0.8, metalness: 0.1
                  })
                  if (alb) { mat.map = alb } else { mat.color.set(0x8899aa) }
                  mat.needsUpdate = true
                  loadedMaterials.push(mat)
                  mesh.material = mat
                })())
              })
              await Promise.allSettled(ps)
            } catch {
              // 텍스처 적용 실패는 무시
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setErrMsg(err instanceof Error ? err.message : String(err))
          setStatus('error')
        }
      }
    })()

    cleanupRef.current = () => {
      cancelled = true
      cancelAnimationFrame(animId)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      ro.disconnect()
      controls.dispose()

      // GPU 메모리 해제
      loadedTextures.forEach(t => t.dispose())
      loadedMaterials.forEach(m => m.dispose())
      loadedGeometries.forEach(g => g.dispose())

      renderer.dispose()
      renderer.forceContextLoss() // 명시적 context 해제
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
    return cleanupRef.current
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenePath, height])

  const sceneName = scenePath.split('/').pop()?.replace('.unity', '') ?? 'Scene'

  // ── 카메라 포커스 함수 ──
  const focusOnObject = (objIdx: number) => {
    setSelectedObjIdx(objIdx)
    const obj = sceneObjMap.current.get(objIdx)
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!obj || !camera || !controls) return

    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 1)
    const fovRad = camera.fov * Math.PI / 180
    const dist   = Math.max(5, (maxDim / 2) / Math.tan(fovRad / 2) * 1.5)

    camera.position.set(
      center.x + dist * 0.5,
      center.y + dist * 0.35,
      center.z + dist * 0.7,
    )
    camera.lookAt(center)
    controls.target.copy(center)
    controls.update()
  }

  // ── 하이어라키 토글 ──
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 전체 펼치기 / 접기
  const expandAll = () => {
    const all = new Set<string>()
    const collect = (nodes: HierarchyNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) { all.add(n.id); collect(n.children) }
      }
    }
    collect(hierarchyData)
    setExpandedNodes(all)
  }
  const collapseAll = () => setExpandedNodes(new Set())

  // ── 총 노드 수 계산 (가시 영역용) ──
  const countNodes = (nodes: HierarchyNode[]): number =>
    nodes.reduce((s, n) => s + 1 + (expandedNodes.has(n.id) ? countNodes(n.children) : 0), 0)

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: '#0d1117', border: '1px solid #334155' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-2 px-4 py-2 text-[12px] flex-wrap"
        style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          <line x1="12" y1="22" x2="12" y2="15.5"/>
          <polyline points="22 8.5 12 15.5 2 8.5"/>
        </svg>
        <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{sceneName}</span>
        <span style={{ color: '#64748b' }}>.unity</span>

        {sceneInfo && (
          <span className="ml-2 text-[10px]" style={{ color: '#64748b' }}>
            프리팹 {sceneInfo.totalPrefabs}개
            {(sceneInfo as SceneData).resolvedFbx != null && ` → FBX ${(sceneInfo as SceneData).resolvedFbx}`}
            {(sceneInfo as SceneData).resolvedProBuilder != null && (sceneInfo as SceneData).resolvedProBuilder! > 0 && ` · ProBuilder ${(sceneInfo as SceneData).resolvedProBuilder}`}
            {(sceneInfo as SceneData).resolvedBox != null && (sceneInfo as SceneData).resolvedBox! > 0 && ` · 박스 ${(sceneInfo as SceneData).resolvedBox}`}
            {` (총 ${sceneInfo.resolvedCount}개 해석)`}
          </span>
        )}

        {/* 하이어라키 토글 버튼 */}
        {hierarchyData.length > 0 && (
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            title={showHierarchy ? '하이어라키 숨기기' : '하이어라키 보기'}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              background: showHierarchy ? 'rgba(99,102,241,0.2)' : 'rgba(100,116,139,0.15)',
              color: showHierarchy ? '#818cf8' : '#94a3b8',
              border: `1px solid ${showHierarchy ? 'rgba(99,102,241,0.3)' : 'rgba(100,116,139,0.2)'}`,
              borderRadius: 5, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            Hierarchy
          </button>
        )}

        {status === 'loading-fbx' && !hierarchyData.length && (
          <span className="ml-auto text-[10px]" style={{ color: '#818cf8' }}>
            로딩 {progress.loaded} / {progress.total}
          </span>
        )}
        {status === 'ok' && !hierarchyData.length && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {progress.loaded}개 오브젝트 · 드래그 회전 · 휠 줌
          </span>
        )}
      </div>

      {/* 메인 콘텐츠: 하이어라키 + 뷰포트 */}
      <div style={{ display: 'flex', height }}>
        {/* ── 하이어라키 패널 ── */}
        {showHierarchy && hierarchyData.length > 0 && (
          <div style={{
            width: 240, minWidth: 200, maxWidth: 320,
            borderRight: '1px solid #1e293b',
            background: '#111827',
            display: 'flex', flexDirection: 'column',
            fontSize: 11, fontFamily: 'monospace',
          }}>
            {/* 하이어라키 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 8px',
              borderBottom: '1px solid #1e293b',
              background: '#0f172a',
            }}>
              <span style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                HIERARCHY
              </span>
              <span style={{ color: '#475569', fontSize: 9, marginLeft: 'auto' }}>
                {countNodes(hierarchyData)} items
              </span>
              <button onClick={expandAll} title="전체 펼치기"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px 3px', fontSize: 10 }}>
                ⊞
              </button>
              <button onClick={collapseAll} title="전체 접기"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px 3px', fontSize: 10 }}>
                ⊟
              </button>
            </div>

            {/* 트리 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2px 0' }}>
              {hierarchyData.map(node => (
                <HierarchyTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedNodes={expandedNodes}
                  selectedObjIdx={selectedObjIdx}
                  onToggle={toggleExpand}
                  onSelect={focusOnObject}
                />
              ))}
            </div>

            {/* 상태 바 */}
            {status === 'loading-fbx' && (
              <div style={{ padding: '4px 8px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#818cf8', fontSize: 10 }}>로딩 {progress.loaded}/{progress.total}</span>
                </div>
                <div style={{ width: '100%', height: 2, background: '#1e293b', borderRadius: 1, marginTop: 3 }}>
                  <div style={{
                    width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                    height: '100%', background: '#818cf8', borderRadius: 1, transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}
            {status === 'ok' && (
              <div style={{ padding: '3px 8px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
                <span style={{ color: '#475569', fontSize: 9 }}>{progress.loaded}개 오브젝트</span>
              </div>
            )}
          </div>
        )}

        {/* ── 3D 뷰포트 ── */}
        <div ref={mountRef} style={{ flex: 1, height: '100%', position: 'relative' }} />
      </div>

      {/* 오버레이: 씬 로딩 */}
      {(status === 'loading-scene' || status === 'loading-fbx') && (
        <div className="absolute flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{
            background: 'rgba(13,17,23,0.75)',
            top: 36,
            left: showHierarchy && hierarchyData.length > 0 ? 240 : 0,
            right: 0, bottom: 0,
          }}>
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-[12px]" style={{ color: '#a78bfa' }}>
            {status === 'loading-scene' ? '씬 파일 파싱 중...' : `오브젝트 로딩 ${progress.loaded} / ${progress.total}`}
          </span>
          {status === 'loading-fbx' && progress.total > 0 && (
            <div style={{ width: 180, height: 4, background: '#1e293b', borderRadius: 2 }}>
              <div style={{ width: `${(progress.loaded / progress.total) * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      )}

      {/* 오버레이: WebGL Context Lost */}
      {status === 'context-lost' && (
        <div className="absolute flex flex-col items-center justify-center gap-3"
          style={{
            background: 'rgba(13,17,23,0.92)',
            top: 36,
            left: showHierarchy && hierarchyData.length > 0 ? 240 : 0,
            right: 0, bottom: 0,
          }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <span style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600 }}>GPU 메모리 초과</span>
          <span style={{ color: '#94a3b8', fontSize: 11, maxWidth: 350, textAlign: 'center', lineHeight: 1.5 }}>
            씬의 FBX/텍스처가 너무 많아 WebGL 컨텍스트가 소실되었습니다.
            <br/>브라우저가 자동 복구를 시도 중입니다...
          </span>
          <button
            onClick={() => {
              cleanupRef.current()
              setStatus('idle')
              setTimeout(() => setStatus('loading-scene'), 100)
            }}
            style={{
              marginTop: 8, padding: '6px 16px', borderRadius: 6,
              background: 'rgba(167,139,250,0.2)', color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.4)', cursor: 'pointer', fontSize: 12
            }}
          >
            🔄 다시 시도
          </button>
        </div>
      )}

      {/* 오버레이: 오류 */}
      {status === 'error' && (
        <div className="absolute flex flex-col items-center justify-center gap-2"
          style={{
            background: 'rgba(13,17,23,0.9)',
            top: 36,
            left: showHierarchy && hierarchyData.length > 0 ? 240 : 0,
            right: 0, bottom: 0,
          }}>
          <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>씬 로드 실패</span>
          <span style={{ color: '#94a3b8', fontSize: 11, maxWidth: 400, textAlign: 'center' }}>{errMsg}</span>
          {errMsg.includes('GUID index not found') && (
            <code style={{ background: '#1e293b', color: '#a78bfa', padding: '4px 10px', borderRadius: 4, fontSize: 11, marginTop: 8 }}>
              .\build_guid_index.ps1 실행 필요
            </code>
          )}
        </div>
      )}
    </div>
  )
}

/** Lazy export for code-splitting */
export default SceneViewer
