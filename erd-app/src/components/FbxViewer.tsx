import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface FbxViewerProps {
  /** /api/assets/file?path=… 또는 /api/assets/smart?name=… URL */
  url: string;
  filename?: string;
  height?: number;
  className?: string;
}

interface MatEntry {
  name: string;
  albedo: string;   // api URL
  normal: string;
  emission: string;
}

/** FBX URL에서 fbxPath 파라미터 또는 경로 부분만 추출 */
function extractFbxPath(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.searchParams.get('path') ?? url;
  } catch {
    return url;
  }
}

export function FbxViewer({ url, filename, height = 420, className = '' }: FbxViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [texInfo, setTexInfo] = useState<string>('');
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let cancelled = false;

    // ── Three.js 씬 셋업 ─────────────────────────────────────────────────────
    const w = el.clientWidth || 700;
    const h = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.Fog(0x111827, 800, 2000);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(0, 100, 300);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 20;
    controls.maxDistance = 1500;

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(300, 600, 300);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xaabbff, 0.8);
    dir2.position.set(-200, 200, -200);
    scene.add(dir2);
    scene.add(new THREE.HemisphereLight(0x8899ff, 0x334155, 0.6));

    // 그리드
    const grid = new THREE.GridHelper(600, 30, 0x334155, 0x1e293b);
    scene.add(grid);

    // 애니메이션 루프
    let animId = 0;
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 리사이즈 대응
    const onResize = () => {
      const nw = el.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // ── 머터리얼 인덱스에서 텍스처 맵 로드 ─────────────────────────────────
    const fetchMaterials = async (): Promise<MatEntry[]> => {
      try {
        const fbxPath = extractFbxPath(url);
        const resp = await fetch(`/api/assets/materials?fbxPath=${encodeURIComponent(fbxPath)}`);
        if (!resp.ok) return [];
        const data = await resp.json() as { materials: MatEntry[] };
        return data.materials ?? [];
      } catch {
        return [];
      }
    };

    // TGA 로더 등록 (Three.js FBXLoader가 내부적으로 사용)
    const tgaLoader = new TGALoader();
    THREE.DefaultLoadingManager.addHandler(/\.tga$/i, tgaLoader);

    // ── FBX 로드 ─────────────────────────────────────────────────────────────
    const loader = new FBXLoader();
    loader.load(
      url,
      async (fbx) => {
        if (cancelled) return;

        // 모델 중앙 정렬 + 카메라 자동 거리
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const camDist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6;

        fbx.position.sub(center);
        grid.position.y = -size.y / 2;
        camera.position.set(0, maxDim * 0.4, camDist);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.maxDistance = camDist * 5;
        controls.update();

        // ── FBXLoader가 내부적으로 UV V좌표를 (1-v)로 반전하므로 되돌림 ──────
        // flipY=true(표준) + UV 보정 = 올바른 텍스처 매핑
        fbx.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
          if (uv) {
            for (let i = 0; i < uv.count; i++) {
              uv.setY(i, 1 - uv.getY(i));
            }
            uv.needsUpdate = true;
          }
        });

        // ── 텍스처 로딩 ──────────────────────────────────────────────────────
        const matEntries = await fetchMaterials();
        const texLoader  = new THREE.TextureLoader();

        // 머터리얼 이름 → 텍스처 캐시
        const texCache: Record<string, THREE.Texture | null> = {};
        const loadTex = (apiUrl: string): Promise<THREE.Texture | null> => {
          if (!apiUrl) return Promise.resolve(null);
          if (texCache[apiUrl] !== undefined) return Promise.resolve(texCache[apiUrl]);
          return new Promise((resolve) => {
            // TGA는 TGALoader, 그 외 TextureLoader
            const isTga = apiUrl.toLowerCase().includes('.tga');
            const loader2 = isTga ? tgaLoader : texLoader;
            (loader2 as THREE.TGALoader).load(
              apiUrl,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                // flipY=true (Three.js 표준)
                // UV V 반전은 아래 지오메트리 UV 직접 보정으로 처리
                tex.flipY = true;
                texCache[apiUrl] = tex;
                resolve(tex);
              },
              undefined,
              () => { texCache[apiUrl] = null; resolve(null); }
            );
          });
        };

        // 메쉬 이름 → MatEntry 매핑 (이름 포함 여부로 매칭)
        const findEntry = (meshName: string): MatEntry | undefined => {
          const mn = meshName.toLowerCase();
          return matEntries.find(e => {
            const en = e.name.toLowerCase();
            return en && (mn.includes(en) || en.includes(mn));
          }) ?? matEntries[0]; // fallback: 첫번째 머터리얼
        };

        let appliedCount = 0;

        await Promise.all(
          (() => {
            const promises: Promise<void>[] = [];
            fbx.traverse((child) => {
              const mesh = child as THREE.Mesh;
              if (!mesh.isMesh) return;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              const entry = findEntry(mesh.name);

              promises.push((async () => {
                const [albedoTex, normalTex, emissionTex] = await Promise.all([
                  loadTex(entry?.albedo ?? ''),
                  loadTex(entry?.normal ?? ''),
                  loadTex(entry?.emission ?? ''),
                ]);

                const newMat = new THREE.MeshStandardMaterial({
                  side: THREE.DoubleSide,
                  roughness: 0.75,
                  metalness: 0.1,
                });

                if (albedoTex) {
                  newMat.map = albedoTex;
                  appliedCount++;
                } else {
                  // 텍스처 없음: 기존 컬러 유지하되 검정이면 회색으로
                  const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                  const oldColor = (oldMat as THREE.MeshPhongMaterial)?.color;
                  if (oldColor && (oldColor.r + oldColor.g + oldColor.b) > 0.05) {
                    newMat.color.copy(oldColor);
                  } else {
                    newMat.color.set(0x8899bb);
                  }
                }

                if (normalTex) {
                  newMat.normalMap = normalTex;
                  // Unity 노말맵 DirectX→OpenGL: normalScale.y = -1
                  newMat.normalScale.set(1, -1);
                  normalTex.flipY = true;
                  normalTex.colorSpace = THREE.NoColorSpace;
                  normalTex.needsUpdate = true;
                }
                if (emissionTex) {
                  newMat.emissiveMap = emissionTex;
                  newMat.emissive.set(0xffffff);
                }

                newMat.needsUpdate = true;
                mesh.material = newMat;
              })());
            });
            return promises;
          })()
        );

        // 애니메이션
        if (fbx.animations.length > 0) {
          mixer = new THREE.AnimationMixer(fbx);
          mixer.clipAction(fbx.animations[0]).play();
        }

        scene.add(fbx);
        if (!cancelled) {
          setTexInfo(appliedCount > 0 ? `텍스처 ${appliedCount}개 적용됨` : '텍스처 없음 (기본 재질)');
          setStatus('ok');
        }
      },
      undefined,
      (err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrMsg(msg);
          setStatus('error');
        }
      },
    );

    cleanupRef.current = () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      THREE.DefaultLoadingManager.removeHandler(/\.tga$/i);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
    return cleanupRef.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, height]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: '#0f1117', border: '1px solid #334155' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-2 px-4 py-2 text-[12px]"
        style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span style={{ color: '#94a3b8' }}>{filename ?? url.split('/').pop()?.split('?')[0] ?? 'FBX'}</span>
        {status === 'ok' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {texInfo} · 드래그 회전 · 휠 줌
          </span>
        )}
      </div>

      {/* 뷰포트 */}
      <div ref={mountRef} style={{ width: '100%', height }} />

      {/* 오버레이: 로딩 */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(15,17,23,0.85)', top: 36 }}>
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-[12px]" style={{ color: '#94a3b8' }}>FBX + 텍스처 로딩 중...</span>
        </div>
      )}

      {/* 오버레이: 에러 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6" style={{ background: 'rgba(15,17,23,0.92)', top: 36 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[12px] text-center" style={{ color: '#f87171' }}>FBX 로드 실패</span>
          <span className="text-[11px] text-center" style={{ color: '#64748b' }}>{errMsg}</span>
        </div>
      )}
    </div>
  );
}

export default FbxViewer;
