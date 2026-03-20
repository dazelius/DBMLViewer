import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ── Types ────────────────────────────────────────────────────────────────────
interface Vec3 { x: number; y: number; z: number }
interface MapEntry { folder: string; sceneName: string; meshCount: number }
interface GameScene { name: string; path: string; folder: string; baked: boolean }
interface SceneInfo {
  sceneName: string; meshCount: number; exportTime?: string
  bounds?: { min: Vec3; max: Vec3 }
  spawnPoints?: SpawnPoint[]
  neutralPointCaptures?: CapturePoint[]
  safetyZones?: SafetyZone[]
}
interface SpawnPoint { name: string; position: Vec3; rotation?: Vec3 }
interface CapturePoint {
  name: string; uniqueID: number; position: Vec3; rotation?: Vec3
  radius: number; areaShape: number; baseTime: number; k: number
  decay: number; tickInterval: number; pointCaptureIndex: number
  nextPointCaptureIndex?: number[]
}
interface SafetyZone {
  name: string; position: Vec3; rotation?: Vec3
  worldCenter: Vec3; worldMin: Vec3; worldMax: Vec3; size: Vec3
}
interface MeshObj {
  name: string; path: string
  geometry: { vertices: Vec3[]; normals?: Vec3[]; uvs?: { x: number; y: number }[]; uv2s?: { x: number; y: number }[]; triangles?: number[]; bounds?: { center: Vec3; size: Vec3 } }
  material?: { color?: { r: number; g: number; b: number }; mainTextureId?: string; lightmapIndex?: number; lightmapScaleOffset?: { x: number; y: number; z: number; w: number } }
}

// ── Layers ───────────────────────────────────────────────────────────────────
const LAYERS = [
  { id: 'meshes', label: 'Meshes', icon: '◆', color: '#60a5fa', default: true },
  { id: 'spawnpoints', label: 'Spawn', icon: '🚩', color: '#00ff88', default: true },
  { id: 'capturepoints', label: 'Capture', icon: '⚔', color: '#ffd700', default: true },
  { id: 'grid', label: 'Grid', icon: '▦', color: '#666', default: false },
  { id: 'wire', label: 'Wire', icon: '⬡', color: '#a78bfa', default: false },
] as const

type LayerId = (typeof LAYERS)[number]['id']

// ── Main Component ───────────────────────────────────────────────────────────
export default function LevelViewerPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mapName = params.get('map') || ''

  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animRef = useRef<number | null>(null)
  const meshGroupRef = useRef<THREE.Group | null>(null)
  const spawnGroupRef = useRef<THREE.Group | null>(null)
  const captureGroupRef = useRef<THREE.Group | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const texCacheRef = useRef<Record<string, THREE.Texture>>({})

  const [maps, setMaps] = useState<MapEntry[]>([])
  const [info, setInfo] = useState<SceneInfo | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(
    Object.fromEntries(LAYERS.map(l => [l.id, l.default])) as Record<LayerId, boolean>,
  )
  const [meshTotal, setMeshTotal] = useState(0)
  const [gameScenes, setGameScenes] = useState<GameScene[]>([])
  const [baking, setBaking] = useState(false)
  const [bakeLog, setBakeLog] = useState<string[]>([])
  const [bakeCurrent, setBakeCurrent] = useState('')
  const [bakeProgress, setBakeProgress] = useState({ done: 0, total: 0 })

  // ── Three.js Setup ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current; if (!el) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 2000)
    camera.position.set(50, 50, 50)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.dampingFactor = 0.1
    controlsRef.current = controls

    const meshGroup = new THREE.Group(); scene.add(meshGroup); meshGroupRef.current = meshGroup
    const spawnGroup = new THREE.Group(); scene.add(spawnGroup); spawnGroupRef.current = spawnGroup
    const captureGroup = new THREE.Group(); scene.add(captureGroup); captureGroupRef.current = captureGroup

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 0.5)
    dir.position.set(100, 150, 100); scene.add(dir)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.3))

    const grid = new THREE.GridHelper(500, 100, 0x444444, 0x333333)
    grid.visible = false; scene.add(grid); gridRef.current = grid

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      controls.update()
      const t = Date.now() * 0.001
      captureGroup.traverse(child => {
        if ((child as THREE.Mesh).userData?.isPulse) {
          const m = child as THREE.Mesh
          const pulse = 1 + Math.sin(t * 2) * 0.08
          m.scale.set(pulse, pulse, 1)
          if ((m.material as THREE.MeshBasicMaterial).opacity !== undefined) {
            ;(m.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 3) * 0.15
          }
        }
      })
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current!)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  // ── Load map list ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/assets/map-list').then(r => r.json())
      .then((d: { maps: MapEntry[] }) => setMaps(d.maps || []))
      .catch(() => setMaps([]))
  }, [])

  // ── Layer visibility sync ────────────────────────────────────────────────
  useEffect(() => {
    if (meshGroupRef.current) meshGroupRef.current.visible = layers.meshes
    if (spawnGroupRef.current) spawnGroupRef.current.visible = layers.spawnpoints
    if (captureGroupRef.current) captureGroupRef.current.visible = layers.capturepoints
    if (gridRef.current) gridRef.current.visible = layers.grid
    if (meshGroupRef.current && layers.wire !== undefined) {
      meshGroupRef.current.traverse(c => {
        if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).material) {
          ;((c as THREE.Mesh).material as THREE.Material & { wireframe?: boolean }).wireframe = layers.wire
        }
      })
    }
  }, [layers])

  // ── Sky/환경 메시 필터 ────────────────────────────────────────────────────
  const SKY_FILTER = /^sky[_\s-]|skybox|skydome|sky\.fbx/i

  // ── createMesh (ported from backup HTML) ─────────────────────────────────
  const createMesh = useCallback((obj: MeshObj, meshGroup: THREE.Group, texCache: Record<string, THREE.Texture>) => {
    if (!obj.geometry?.vertices?.length) return
    if (SKY_FILTER.test(obj.name)) return
    const geo = new THREE.BufferGeometry()
    const verts: number[] = []
    obj.geometry.vertices.forEach(v => verts.push(v.x, v.y, v.z))
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    if (obj.geometry.triangles?.length) geo.setIndex(obj.geometry.triangles)
    if (obj.geometry.normals?.length) {
      const norms: number[] = []
      obj.geometry.normals.forEach(n => norms.push(n.x, n.y, n.z))
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3))
    } else geo.computeVertexNormals()
    if (obj.geometry.uvs?.length) {
      const uvs: number[] = []
      obj.geometry.uvs.forEach(u => uvs.push(u.x, u.y))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }
    if (obj.geometry.uv2s?.length) {
      const uv2s: number[] = []
      const so = obj.material?.lightmapScaleOffset
      obj.geometry.uv2s.forEach(u => {
        if (so) uv2s.push(u.x * so.x + so.z, u.y * so.y + so.w)
        else uv2s.push(u.x, u.y)
      })
      geo.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2s, 2))
    }
    const params: Record<string, unknown> = { side: THREE.DoubleSide }
    if (obj.material?.color) {
      const c = obj.material.color
      params.color = new THREE.Color(c.r, c.g, c.b)
    } else params.color = 0x888888
    const texId = obj.material?.mainTextureId
    if (texId && texCache[texId]) { params.map = texCache[texId]; params.color = 0xffffff }
    const mat = params.map
      ? new THREE.MeshStandardMaterial({ ...params, roughness: 0.9, metalness: 0 } as THREE.MeshStandardMaterialParameters)
      : new THREE.MeshPhongMaterial({ ...params, transparent: true, opacity: 0.8, flatShading: true } as THREE.MeshPhongMaterialParameters)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData = { name: obj.name, path: obj.path, isMesh: true }
    meshGroup.add(mesh)
  }, [])

  // ── createSpawnPointVisuals (ported from backup HTML) ────────────────────
  const createSpawnVisuals = useCallback((spawnPoints: SpawnPoint[], group: THREE.Group) => {
    group.clear()
    spawnPoints.forEach((sp, idx) => {
      if (!sp?.position) return
      const g = new THREE.Group()
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7, emissive: new THREE.Color(0x00ff88), emissiveIntensity: 0.3 })
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8), bodyMat)
      body.position.y = 0.7; g.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bodyMat)
      head.position.y = 1.6; g.add(head)
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0xffff00 }))
      arrow.rotation.x = Math.PI / 2; arrow.position.set(0, 1.0, 0.5); g.add(arrow)
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#00ff88'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(sp.name, 128, 40)
      const tex = new THREE.CanvasTexture(canvas)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.scale.set(3, 0.75, 1); sprite.position.y = 2.5; g.add(sprite)
      g.position.set(sp.position.x, sp.position.y, sp.position.z)
      if (sp.rotation) g.rotation.y = sp.rotation.y * Math.PI / 180
      g.userData = { isSpawnPoint: true, index: idx, data: sp }
      group.add(g)
    })
  }, [])

  // ── createCapturePointVisuals (ported from backup HTML) ──────────────────
  const createCaptureVisuals = useCallback((capturePoints: CapturePoint[], group: THREE.Group) => {
    group.clear()
    capturePoints.forEach((cp, idx) => {
      if (!cp?.position) return
      const g = new THREE.Group()
      const totalSize = cp.radius || 10
      const halfSize = totalSize / 2
      const isRect = cp.areaShape === 0
      let color = 0xffd700, teamName = 'CENTER'
      if (cp.name.toLowerCase().includes('defense')) { color = 0x3b82f6; teamName = 'DEFENSE' }
      else if (cp.name.toLowerCase().includes('offen')) { color = 0xef4444; teamName = 'OFFENSE' }
      const areaMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
      const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false })
      const wallMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
      if (isRect) {
        const borderShape = new THREE.Shape()
        borderShape.moveTo(-halfSize, -halfSize); borderShape.lineTo(halfSize, -halfSize)
        borderShape.lineTo(halfSize, halfSize); borderShape.lineTo(-halfSize, halfSize); borderShape.closePath()
        const hole = new THREE.Path(); const inner = halfSize - 0.3
        hole.moveTo(-inner, -inner); hole.lineTo(-inner, inner); hole.lineTo(inner, inner); hole.lineTo(inner, -inner); hole.closePath()
        borderShape.holes.push(hole)
        const border = new THREE.Mesh(new THREE.ShapeGeometry(borderShape), areaMat)
        border.rotation.x = -Math.PI / 2; border.position.y = 0.1; g.add(border)
        const fill = new THREE.Mesh(new THREE.PlaneGeometry(totalSize - 0.6, totalSize - 0.6), fillMat)
        fill.rotation.x = -Math.PI / 2; fill.position.y = 0.05; g.add(fill)
        const wallGeo = new THREE.PlaneGeometry(totalSize, 6)
        ;([[0, 0, halfSize], [0, Math.PI, -halfSize], [halfSize, Math.PI / 2, 0], [-halfSize, -Math.PI / 2, 0]] as [number, number, number][]).forEach(([x, ry, z]) => {
          const wall = new THREE.Mesh(wallGeo, wallMat); wall.position.set(x, 3, z); wall.rotation.y = ry; g.add(wall)
        })
        const topEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(totalSize, 0.1, totalSize)), new THREE.LineBasicMaterial({ color }))
        topEdge.position.y = 6; g.add(topEdge)
        ;([[-halfSize, -halfSize], [halfSize, -halfSize], [halfSize, halfSize], [-halfSize, halfSize]] as [number, number][]).forEach(([x, z]) => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }))
          pillar.position.set(x, 3, z); g.add(pillar)
        })
        const pulse = new THREE.Mesh(new THREE.PlaneGeometry(totalSize + 0.5, totalSize + 0.5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }))
        pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.15; pulse.userData.isPulse = true; g.add(pulse)
      } else {
        const ring = new THREE.Mesh(new THREE.RingGeometry(halfSize - 0.2, halfSize, 64), areaMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; g.add(ring)
        const circle = new THREE.Mesh(new THREE.CircleGeometry(halfSize - 0.2, 64), fillMat); circle.rotation.x = -Math.PI / 2; circle.position.y = 0.05; g.add(circle)
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(halfSize, halfSize, 6, 32, 1, true), wallMat); cyl.position.y = 3; g.add(cyl)
        const topRing = new THREE.Mesh(new THREE.TorusGeometry(halfSize, 0.15, 8, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }))
        topRing.rotation.x = Math.PI / 2; topRing.position.y = 6; g.add(topRing)
        const pulseRing = new THREE.Mesh(new THREE.RingGeometry(halfSize - 0.3, halfSize + 0.3, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }))
        pulseRing.rotation.x = -Math.PI / 2; pulseRing.position.y = 0.15; pulseRing.userData.isPulse = true; g.add(pulseRing)
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 8), new THREE.MeshPhongMaterial({ color: 0x666666 }))
      pole.position.y = 2.5; g.add(pole)
      const flag = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.05), new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.4, side: THREE.DoubleSide }))
      flag.position.set(1, 4.5, 0); g.add(flag)
      const displayName = teamName === 'CENTER' ? '중앙' : teamName === 'DEFENSE' ? '수비' : '공격'
      const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.roundRect(5, 5, 390, 190, 12); ctx.fill()
      const colorHex = '#' + color.toString(16).padStart(6, '0')
      ctx.strokeStyle = colorHex; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(5, 5, 390, 190, 12); ctx.stroke()
      ctx.fillStyle = colorHex; ctx.globalAlpha = 0.3; ctx.fillRect(5, 5, 390, 50); ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(displayName, 200, 42)
      ctx.font = '22px sans-serif'; ctx.fillText(`${totalSize}m × ${totalSize}m`, 200, 82)
      ctx.font = '20px sans-serif'; ctx.fillStyle = '#cccccc'; ctx.fillText(`점령 시간: 약 ${Math.round(cp.baseTime || 0)}초`, 200, 112)
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, 130); ctx.lineTo(380, 130); ctx.stroke()
      ctx.font = '14px monospace'; ctx.fillStyle = '#777777'; ctx.textAlign = 'left'
      ctx.fillText(`ID:${cp.uniqueID} | Pos:(${cp.position.x?.toFixed(0)},${cp.position.y?.toFixed(0)},${cp.position.z?.toFixed(0)})`, 20, 155)
      ctx.fillText(`T=${cp.baseTime}s | k=${cp.k} | idx:${cp.pointCaptureIndex}`, 20, 178)
      const labelTex = new THREE.CanvasTexture(canvas)
      const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }))
      labelSprite.scale.set(10, 5, 1); labelSprite.position.y = 8; g.add(labelSprite)
      g.position.set(cp.position.x, cp.position.y, cp.position.z)
      if (cp.rotation) g.rotation.y = cp.rotation.y * Math.PI / 180
      g.userData = { isCapturePoint: true, index: idx, data: cp }
      group.add(g)
    })
  }, [])

  // ── fitToScene (outlier-resistant) ────────────────────────────────────────
  const fitToScene = useCallback(() => {
    const camera = cameraRef.current, controls = controlsRef.current, meshGroup = meshGroupRef.current
    if (!camera || !controls || !meshGroup) return
    const box = new THREE.Box3()
    const childBox = new THREE.Box3()
    const MAX_EXTENT = 5000
    let count = 0
    meshGroup.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      childBox.setFromObject(child)
      if (childBox.isEmpty()) return
      const sz = childBox.getSize(new THREE.Vector3())
      if (Math.max(sz.x, sz.y, sz.z) > MAX_EXTENT) return
      box.expandByObject(child)
      count++
    })
    if (box.isEmpty() || count === 0) {
      box.setFromObject(meshGroup)
      if (box.isEmpty()) return
    }
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 100
    camera.position.set(center.x + maxDim * 0.6, center.y + maxDim * 0.4, center.z + maxDim * 0.6)
    controls.target.copy(center); controls.update()
  }, [])

  // ── loadMap ──────────────────────────────────────────────────────────────
  const loadMap = useCallback(async (folder: string) => {
    const meshGroup = meshGroupRef.current, spawnGroup = spawnGroupRef.current, captureGroup = captureGroupRef.current
    if (!meshGroup || !spawnGroup || !captureGroup) return
    setStatus('loading'); setProgress(0); setProgressMsg('씬 정보 로드 중...')
    meshGroup.clear(); spawnGroup.clear(); captureGroup.clear()
    Object.values(texCacheRef.current).forEach(t => t.dispose())
    texCacheRef.current = {}

    try {
      const infoRes = await fetch(`/api/assets/map-scene-info?map=${encodeURIComponent(folder)}`)
      if (!infoRes.ok) throw new Error('scene_info 로드 실패')
      const sceneInfo: SceneInfo = await infoRes.json()
      setInfo(sceneInfo)
      setProgress(5)

      setProgressMsg('메시 데이터 다운로드 중...')
      const meshRes = await fetch(`/api/assets/map-meshes?map=${encodeURIComponent(folder)}`)
      if (!meshRes.ok) throw new Error('meshes.json 로드 실패')
      const meshesData: { meshObjects: MeshObj[] } = await meshRes.json()
      const objs = meshesData.meshObjects || []
      setMeshTotal(objs.length)
      setProgress(15)

      setProgressMsg('텍스처 로딩...')
      const texIds = new Set<string>()
      objs.forEach(o => { if (o.material?.mainTextureId) texIds.add(o.material.mainTextureId) })
      const texArr = Array.from(texIds)
      let texDone = 0
      await Promise.all(texArr.map(async id => {
        try {
          const tex = await new Promise<THREE.Texture | null>(resolve => {
            new THREE.TextureLoader().load(
              `/api/assets/map-texture?map=${encodeURIComponent(folder)}&file=${encodeURIComponent(id)}`,
              t => { t.flipY = false; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; resolve(t) },
              undefined, () => resolve(null),
            )
          })
          if (tex) texCacheRef.current[id] = tex
        } catch { /* skip */ }
        texDone++
        if (texDone % 5 === 0) { setProgress(15 + (texDone / Math.max(texArr.length, 1)) * 30); setProgressMsg(`텍스처 ${texDone}/${texArr.length}`) }
      }))
      setProgress(50)

      setProgressMsg('메시 생성 중...')
      for (let i = 0; i < objs.length; i++) {
        createMesh(objs[i], meshGroup, texCacheRef.current)
        if (i % 50 === 0) {
          setProgress(50 + (i / objs.length) * 40)
          setProgressMsg(`메시 ${i}/${objs.length}`)
          await new Promise(r => setTimeout(r, 0))
        }
      }
      setProgress(90)

      if (sceneInfo.spawnPoints?.length) {
        createSpawnVisuals(sceneInfo.spawnPoints, spawnGroup)
      }
      if (sceneInfo.neutralPointCaptures?.length) {
        createCaptureVisuals(sceneInfo.neutralPointCaptures, captureGroup)
      }

      setProgress(100); setStatus('ready')
      setTimeout(() => fitToScene(), 100)
    } catch (err) {
      console.error('[LevelViewer] load error:', err)
      setProgressMsg(String(err)); setStatus('error')
    }
  }, [createMesh, createSpawnVisuals, createCaptureVisuals, fitToScene])

  // ── Auto-load from URL param ─────────────────────────────────────────────
  useEffect(() => { if (mapName) loadMap(mapName) }, [mapName, loadMap])

  // ── Load game scenes list ────────────────────────────────────────────────
  const loadGameScenes = useCallback(() => {
    fetch('/api/assets/game-scenes').then(r => r.json())
      .then((d: { scenes: GameScene[] }) => setGameScenes(d.scenes || []))
      .catch(() => setGameScenes([]))
  }, [])
  useEffect(() => { loadGameScenes() }, [loadGameScenes])

  // ── Bake All ─────────────────────────────────────────────────────────────
  const bakeAll = useCallback(async (onlyUnbaked: boolean) => {
    const targets = onlyUnbaked ? gameScenes.filter(s => !s.baked) : gameScenes
    if (targets.length === 0) { setBakeLog(['모든 맵이 이미 bake 되어 있습니다.']); return }
    setBaking(true); setBakeLog([]); setBakeProgress({ done: 0, total: targets.length })

    for (let i = 0; i < targets.length; i++) {
      const sc = targets[i]
      setBakeCurrent(sc.name); setBakeProgress({ done: i, total: targets.length })
      setBakeLog(prev => [...prev, `[${i + 1}/${targets.length}] ${sc.name} bake 시작...`])

      try {
        await new Promise<void>((resolve, reject) => {
          const es = new EventSource(`/api/assets/scene?path=${encodeURIComponent(sc.path)}&bake=1`)
          es.onmessage = (ev) => {
            try {
              const d = JSON.parse(ev.data)
              if (d.type === 'progress') {
                setBakeLog(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = `[${i + 1}/${targets.length}] ${sc.name}: ${d.msg}`
                  return updated
                })
              } else if (d.type === 'skip') {
                setBakeLog(prev => [...prev, `  ⏭ ${sc.name} skip: ${d.reason}`])
              } else if (d.type === 'done') {
                const suffix = d.skipped ? ' (기존 유지)' : d.textures ? ` (${d.meshCount} meshes, ${d.textures} tex)` : ` (${d.meshCount} meshes)`
                setBakeLog(prev => [...prev, `  ✓ ${sc.name} 완료${suffix}`])
                es.close(); resolve()
              } else if (d.type === 'error') {
                setBakeLog(prev => [...prev, `  ✗ ${sc.name} 실패: ${d.msg}`])
                es.close(); resolve()
              }
            } catch { /* skip parse errors */ }
          }
          es.onerror = () => { es.close(); setBakeLog(prev => [...prev, `  ✗ ${sc.name} 연결 오류`]); resolve() }
        })
      } catch {
        setBakeLog(prev => [...prev, `  ✗ ${sc.name} 예외 발생`])
      }
    }

    setBakeProgress({ done: targets.length, total: targets.length })
    setBakeCurrent(''); setBaking(false)
    setBakeLog(prev => [...prev, `\n=== 전체 완료 (${targets.length}개 맵) ===`])
    loadGameScenes()
    fetch('/api/assets/map-list').then(r => r.json())
      .then((d: { maps: MapEntry[] }) => setMaps(d.maps || []))
      .catch(() => {})
  }, [gameScenes, loadGameScenes])

  const toggleLayer = (id: LayerId) => setLayers(prev => ({ ...prev, [id]: !prev[id] }))

  // ── Render ───────────────────────────────────────────────────────────────
  const bg = '#0d1117'
  const panelBg = '#161b22'
  const border = '#30363d'
  const textDim = '#8b949e'
  const textMain = '#e6edf3'

  return (
    <div style={{ display: 'flex', height: '100vh', background: bg, color: textMain, fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
      {/* ── Left Panel ── */}
      <div style={{ width: 240, minWidth: 200, background: panelBg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🗺️</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Level Viewer</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/unity')} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textDim, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 10 }}>← Back</button>
        </div>

        {/* Map Selector */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Map</div>
          <select
            value={mapName}
            onChange={e => navigate(`/level-viewer?map=${encodeURIComponent(e.target.value)}`)}
            style={{ width: '100%', padding: '6px 8px', background: '#21262d', border: `1px solid ${border}`, borderRadius: 4, color: textMain, fontSize: 12, cursor: 'pointer' }}
          >
            <option value="">-- 선택 --</option>
            {maps.map(m => <option key={m.folder} value={m.folder}>{m.sceneName} ({m.meshCount.toLocaleString()})</option>)}
          </select>
        </div>

        {/* Layers */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Layers</div>
          {LAYERS.map(l => (
            <div key={l.id} onClick={() => toggleLayer(l.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, cursor: 'pointer', marginBottom: 2, background: layers[l.id] ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${layers[l.id] ? l.color : '#444'}`, background: layers[l.id] ? l.color + '33' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                {layers[l.id] && '✓'}
              </div>
              <span style={{ fontSize: 13 }}>{l.icon}</span>
              <span style={{ color: layers[l.id] ? textMain : textDim, fontSize: 11 }}>{l.label}</span>
              {l.id === 'spawnpoints' && info?.spawnPoints?.length ? <span style={{ marginLeft: 'auto', color: l.color, fontSize: 10, fontWeight: 600 }}>{info.spawnPoints.length}</span> : null}
              {l.id === 'capturepoints' && info?.neutralPointCaptures?.length ? <span style={{ marginLeft: 'auto', color: l.color, fontSize: 10, fontWeight: 600 }}>{info.neutralPointCaptures.length}</span> : null}
            </div>
          ))}
        </div>

        {/* Bake Section */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Bake ({gameScenes.filter(s => s.baked).length}/{gameScenes.length})
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <button
              onClick={() => bakeAll(true)}
              disabled={baking}
              style={{ flex: 1, padding: '5px 0', background: baking ? '#333' : '#238636', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 600, cursor: baking ? 'not-allowed' : 'pointer' }}
            >
              {baking ? '진행 중...' : `미완료 Bake (${gameScenes.filter(s => !s.baked).length})`}
            </button>
            <button
              onClick={() => bakeAll(false)}
              disabled={baking}
              style={{ padding: '5px 8px', background: baking ? '#333' : '#21262d', border: `1px solid ${border}`, borderRadius: 4, color: textDim, fontSize: 10, cursor: baking ? 'not-allowed' : 'pointer' }}
            >
              전체
            </button>
          </div>
          {baking && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ color: '#58a6ff', fontSize: 10, marginBottom: 3 }}>{bakeCurrent} ({bakeProgress.done}/{bakeProgress.total})</div>
              <div style={{ width: '100%', height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bakeProgress.total ? (bakeProgress.done / bakeProgress.total) * 100 : 0}%`, background: '#238636', transition: 'width 0.3s', borderRadius: 2 }} />
              </div>
            </div>
          )}
          {bakeLog.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 9, fontFamily: 'monospace', color: textDim, background: '#0d1117', borderRadius: 4, padding: 6, lineHeight: 1.4 }}>
              {bakeLog.map((line, i) => (
                <div key={i} style={{ color: line.includes('✓') ? '#3fb950' : line.includes('✗') ? '#f85149' : line.includes('⏭') ? '#d29922' : textDim }}>{line}</div>
              ))}
            </div>
          )}
        </div>

        {/* Scene Info */}
        {info && (
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${border}`, flex: 1, overflowY: 'auto' }}>
            <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Info</div>
            <InfoRow label="Scene" value={info.sceneName} />
            <InfoRow label="Meshes" value={meshTotal.toLocaleString()} />
            {info.exportTime && <InfoRow label="Export" value={info.exportTime.split('T')[0]} />}
            {info.spawnPoints && info.spawnPoints.length > 0 && (
              <>
                <div style={{ color: '#00ff88', fontWeight: 600, fontSize: 10, marginTop: 8, marginBottom: 4 }}>🚩 Spawn Points ({info.spawnPoints.length})</div>
                {info.spawnPoints.map((sp, i) => (
                  <div key={i} style={{ fontSize: 10, color: textDim, marginBottom: 2, paddingLeft: 8 }}>{sp.name}</div>
                ))}
              </>
            )}
            {info.neutralPointCaptures && info.neutralPointCaptures.length > 0 && (
              <>
                <div style={{ color: '#ffd700', fontWeight: 600, fontSize: 10, marginTop: 8, marginBottom: 4 }}>⚔ Capture Points ({info.neutralPointCaptures.length})</div>
                {info.neutralPointCaptures.map((cp, i) => (
                  <div key={i} style={{ fontSize: 10, color: textDim, marginBottom: 2, paddingLeft: 8 }}>{cp.name} (R={cp.radius})</div>
                ))}
              </>
            )}
            {info.safetyZones && info.safetyZones.length > 0 && (
              <>
                <div style={{ color: '#a3e635', fontWeight: 600, fontSize: 10, marginTop: 8, marginBottom: 4 }}>🛡 Safety Zones ({info.safetyZones.length})</div>
                {info.safetyZones.map((sz, i) => (
                  <div key={i} style={{ fontSize: 10, color: textDim, marginBottom: 2, paddingLeft: 8 }}>{sz.name}</div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Canvas Area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />

        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.9)', gap: 12 }}>
            <div style={{ fontSize: 28 }}>⚙️</div>
            <div style={{ color: textMain, fontWeight: 600, fontSize: 14 }}>{progressMsg}</div>
            <div style={{ width: 300, height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.2s', borderRadius: 3 }} />
            </div>
            <div style={{ color: textDim, fontSize: 12 }}>{progress.toFixed(0)}%</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.9)', gap: 10 }}>
            <div style={{ fontSize: 32 }}>❌</div>
            <div style={{ color: '#f87171', fontWeight: 600 }}>로드 실패</div>
            <div style={{ color: textDim, fontSize: 11 }}>{progressMsg}</div>
          </div>
        )}

        {status === 'idle' && !mapName && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.95)', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🗺️</div>
            <div style={{ color: textMain, fontWeight: 700, fontSize: 18 }}>Level Viewer</div>
            <div style={{ color: textDim, fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
              좌측 패널에서 맵을 선택하거나,<br />Unity 페이지의 Levels 탭에서 맵을 클릭하세요.
            </div>
          </div>
        )}

        {/* Bottom bar */}
        {status === 'ready' && info && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, background: 'rgba(22,27,34,0.9)', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, fontSize: 11, color: textDim }}>
            <span>◆ {meshTotal.toLocaleString()} meshes</span>
            {info.spawnPoints?.length ? <span style={{ color: '#00ff88' }}>🚩 {info.spawnPoints.length} spawns</span> : null}
            {info.neutralPointCaptures?.length ? <span style={{ color: '#ffd700' }}>⚔ {info.neutralPointCaptures.length} captures</span> : null}
            {info.safetyZones?.length ? <span style={{ color: '#a3e635' }}>🛡 {info.safetyZones.length} zones</span> : null}
            <div style={{ flex: 1 }} />
            <button onClick={fitToScene} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textDim, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 10 }}>⊞ Fit</button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ color: '#8b949e' }}>{label}</span>
      <span style={{ color: '#e6edf3', fontSize: 11 }}>{value}</span>
    </div>
  )
}
