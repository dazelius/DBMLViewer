/**
 * SceneViewer.tsx
 * Unity .unity 씬 파일을 파싱해서 여러 FBX 모델을 트랜스폼과 함께 Three.js로 렌더링
 *
 * Unity(LH, Y-up) → Three.js(RH, Y-up) 좌표 변환:
 *   position:   (x,  y, -z)
 *   quaternion: (-x, -y, z, w)
 *   scale:      (x,  y,  z)   ← 변경 없음
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
  fbxPath: string
  fbxUrl: string
  pos: Vec3
  rot: Quat
  scale: Vec3
}

interface SceneData {
  scenePath: string
  totalPrefabs: number
  totalDirect: number
  resolvedCount: number
  objects: SceneObject[]
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

// ── SceneViewer コンポーネント ─────────────────────────────────────────────────

export interface SceneViewerProps {
  /** asset index の相対パス（例: "GameContents/Map/..." 또는 완전한 경로）*/
  scenePath: string
  height?: number
  className?: string
}

export function SceneViewer({ scenePath, height = 560, className = '' }: SceneViewerProps) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const [status, setStatus]     = useState<'idle' | 'loading-scene' | 'loading-fbx' | 'ok' | 'error'>('idle')
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })
  const [errMsg, setErrMsg]     = useState('')
  const [sceneInfo, setSceneInfo] = useState<Omit<SceneData, 'objects'> | null>(null)
  const cleanupRef = useRef<() => void>(() => {})

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false

    setStatus('loading-scene')
    setErrMsg('')
    setProgress({ loaded: 0, total: 0 })

    // ── Three.js 씬 셋업 ─────────────────────────────────────────────────────
    const w = el.clientWidth || 800
    const h = height

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFShadowMap   // PCFSoftShadowMap deprecated in r170+
    renderer.outputColorSpace  = THREE.SRGBColorSpace
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    scene.background = new THREE.Color(0x0d1117)
    scene.fog        = new THREE.FogExp2(0x0d1117, 0.0012)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000)
    camera.position.set(0, 150, 400)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping  = true
    controls.dampingFactor  = 0.07
    controls.minDistance    = 5
    controls.maxDistance    = 4000

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 1.8))
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.0)
    sun.position.set(500, 800, 300)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
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

    // 애니메이션 루프 (THREE.Clock deprecated in r170+ → 단순 rAF)
    let animId = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 리사이즈 대응
    const onResize = () => {
      const nw = el.clientWidth
      camera.aspect = nw / h
      camera.updateProjectionMatrix()
      renderer.setSize(nw, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    // TGALoader는 loadingManager 생성 시점에 등록 (아래 async 블록에서)

    // ── 씬 데이터 로드 ───────────────────────────────────────────────────────
    ;(async () => {
      try {
        const resp = await fetch(`/api/assets/scene?path=${encodeURIComponent(scenePath)}&max=200`)
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: resp.statusText }))
          throw new Error(err.error ?? resp.statusText)
        }
        const data: SceneData = await resp.json()
        if (cancelled) return

        setSceneInfo({ scenePath: data.scenePath, totalPrefabs: data.totalPrefabs, totalDirect: data.totalDirect, resolvedCount: data.resolvedCount })
        setStatus('loading-fbx')
        setProgress({ loaded: 0, total: data.objects.length })

        if (data.objects.length === 0) {
          setStatus('ok')
          return
        }

        // ── 커스텀 LoadingManager: FBX 내부 텍스처 경로를 /api/assets/smart 로 리다이렉트 ──
        // FBXLoader는 FBX 파일 안에 내장된 텍스처 파일명(예: SafetyZone_Ems.png)을
        // 로더의 basePath 기준으로 해석하는데, /api/assets/file?path=... 형태의 URL에서
        // basePath 추출이 잘못되어 /api/assets/SafetyZone_Ems.png → 404가 발생.
        // setURLModifier로 모든 상대 경로를 smart 검색 API로 우회함.
        const loadingManager = new THREE.LoadingManager()
        loadingManager.setURLModifier((url: string) => {
          // 유효한 API 엔드포인트 (쿼리 파라미터 포함) → 그대로 통과
          // 주의: /api/assets/파일명.png 형태는 잘못된 URL → smart로 리다이렉트해야 함
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
          // /api/assets/SomeTexture.png 처럼 잘못 조합된 URL도 포함해
          // 모든 기타 경로 → 파일명만 추출해서 smart 검색
          const filename = url.split(/[/?\\]/).filter(Boolean).pop() ?? url
          return `/api/assets/smart?name=${encodeURIComponent(filename)}`
        })
        // TGA 핸들러를 커스텀 매니저에 등록
        const tgaLoaderManaged = new TGALoader(loadingManager)
        loadingManager.addHandler(/\.tga$/i, tgaLoaderManaged)

        // ── FBX 공유 캐시 (같은 경로의 FBX는 한 번만 로드, geometry 공유) ────
        const fbxCache: Record<string, THREE.Group> = {}
        const fbxLoader = new FBXLoader(loadingManager)
        const texLoader  = new THREE.TextureLoader(loadingManager)

        const loadFbx = (url: string): Promise<THREE.Group> => {
          if (fbxCache[url]) return Promise.resolve(fbxCache[url].clone())
          return new Promise((resolve, reject) => {
            fbxLoader.load(url, (fbx) => { fbxCache[url] = fbx; resolve(fbx.clone()) }, undefined, reject)
          })
        }

        const loadTex = (apiUrl: string): Promise<THREE.Texture | null> => {
          if (!apiUrl) return Promise.resolve(null)
          return new Promise((resolve) => {
            const isTga = /\.tga$/i.test(apiUrl)
            const ldr: THREE.Loader = isTga ? tgaLoaderManaged : texLoader
            ;(ldr as TGALoader).load(apiUrl, (tex: THREE.Texture) => {
              tex.colorSpace = THREE.SRGBColorSpace
              tex.flipY = !isTga
              resolve(tex)
            }, undefined, () => resolve(null))
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

        // ── 오브젝트 로드 & 배치 ────────────────────────────────────────────
        const sceneBounds = new THREE.Box3()
        let loadedCount = 0

        // 중복 fbxPath 그룹핑 → 같은 mesh는 clone()으로 공유
        for (const obj of data.objects) {
          if (cancelled) break
          try {
            const fbxGroup = await loadFbx(obj.fbxUrl)

            // 텍스처 적용
            const mats = await fetchMats(obj.fbxPath)
            const findMat = (meshName: string) => {
              const mn = meshName.toLowerCase()
              return mats.find(e => e.albedo && (mn.includes(e.albedo.split('/').pop()?.split('_')[0]?.toLowerCase() ?? '') ?? false)) ?? mats[0]
            }
            await Promise.all((() => {
              const ps: Promise<void>[] = []
              fbxGroup.traverse(child => {
                const mesh = child as THREE.Mesh
                if (!mesh.isMesh) return
                mesh.castShadow = true
                mesh.receiveShadow = true
                ps.push((async () => {
                  const m = findMat(mesh.name)
                  if (!m) return
                  const [alb, nrm, emi] = await Promise.all([
                    cachedLoadTex(m.albedo || ''),
                    cachedLoadTex(m.normal || ''),
                    cachedLoadTex(m.emission || ''),
                  ])
                  const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8, metalness: 0.1 })
                  if (alb) { mat.map = alb } else { mat.color.set(0x8899aa) }
                  if (nrm) { mat.normalMap = nrm; mat.normalScale.set(1, -1); nrm.colorSpace = THREE.NoColorSpace }
                  if (emi) { mat.emissiveMap = emi; mat.emissive.set(0xffffff) }
                  mat.needsUpdate = true
                  mesh.material = mat
                })())
              })
              return ps
            })())

            // Unity → Three.js 좌표 변환 및 배치
            const threePos   = unityToThreePos(obj.pos)
            const threeQuat  = unityToThreeQuat(obj.rot)
            const threeScale = unityToThreeScale(obj.scale)

            fbxGroup.position.copy(threePos)
            fbxGroup.quaternion.copy(threeQuat)
            fbxGroup.scale.copy(threeScale)

            scene.add(fbxGroup)
            sceneBounds.expandByObject(fbxGroup)

            loadedCount++
            if (!cancelled) setProgress({ loaded: loadedCount, total: data.objects.length })
          } catch (e) {
            // 개별 오브젝트 로드 실패는 무시하고 계속 진행
            console.warn(`[SceneViewer] Failed to load ${obj.fbxUrl}:`, e)
            loadedCount++
            if (!cancelled) setProgress({ loaded: loadedCount, total: data.objects.length })
          }
        }

        if (cancelled) return

        // ── 카메라 자동 맞춤 ───────────────────────────────────────────────────
        if (!sceneBounds.isEmpty()) {
          const center = sceneBounds.getCenter(new THREE.Vector3())
          const size   = sceneBounds.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const dist   = maxDim * 1.5
          camera.position.set(center.x, center.y + maxDim * 0.5, center.z + dist)
          camera.lookAt(center)
          controls.target.copy(center)
          controls.maxDistance = dist * 6
          grid.position.set(center.x, sceneBounds.min.y, center.z)
          controls.update()
        }

        setStatus('ok')
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
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
    return cleanupRef.current
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenePath, height])

  const sceneName = scenePath.split('/').pop()?.replace('.unity', '') ?? 'Scene'

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
        {/* Unity 씬 아이콘 */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          <line x1="12" y1="22" x2="12" y2="15.5"/>
          <polyline points="22 8.5 12 15.5 2 8.5"/>
        </svg>
        <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{sceneName}</span>
        <span style={{ color: '#64748b' }}>.unity</span>

        {sceneInfo && (
          <span className="ml-2 text-[10px]" style={{ color: '#64748b' }}>
            프리팹 {sceneInfo.totalPrefabs}개 · 직접오브젝트 {sceneInfo.totalDirect}개 → FBX {sceneInfo.resolvedCount}개 해석
          </span>
        )}

        {status === 'loading-fbx' && (
          <span className="ml-auto text-[10px]" style={{ color: '#818cf8' }}>
            FBX 로딩 {progress.loaded} / {progress.total}
          </span>
        )}
        {status === 'ok' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {progress.loaded}개 오브젝트 · 드래그 회전 · 휠 줌
          </span>
        )}
      </div>

      {/* 뷰포트 */}
      <div ref={mountRef} style={{ width: '100%', height }} />

      {/* 오버레이: 씬 로딩 */}
      {(status === 'loading-scene' || status === 'loading-fbx') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ background: 'rgba(13,17,23,0.75)', top: 36 }}>
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-[12px]" style={{ color: '#a78bfa' }}>
            {status === 'loading-scene' ? '씬 파일 파싱 중...' : `FBX 로딩 ${progress.loaded} / ${progress.total}`}
          </span>
          {status === 'loading-fbx' && progress.total > 0 && (
            <div style={{ width: 180, height: 4, background: '#1e293b', borderRadius: 2 }}>
              <div style={{ width: `${(progress.loaded / progress.total) * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      )}

      {/* 오버레이: 오류 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(13,17,23,0.9)', top: 36 }}>
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
