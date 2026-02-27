import { useEffect, useRef, useState, useCallback } from 'react';
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
  /** 애니메이션 FBX URL 목록 (직접 전달) */
  animationUrls?: AnimationEntry[];
  /** 모델 경로 (자동 애니메이션 검색용) */
  modelPath?: string;
  /** 처음 자동 재생할 애니메이션 인덱스 */
  autoPlayIndex?: number;
}

export interface AnimationEntry {
  name: string;
  url: string;
  category?: string;
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

// ── 카테고리별 아이콘 & 색상 ─────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  idle:        { icon: '🧍', color: '#6366f1' },
  walk:        { icon: '🚶', color: '#22c55e' },
  locomotion:  { icon: '🏃', color: '#f59e0b' },
  jump:        { icon: '⬆️', color: '#3b82f6' },
  combat:      { icon: '⚔️', color: '#ef4444' },
  skill:       { icon: '✨', color: '#a855f7' },
  hit:         { icon: '💥', color: '#dc2626' },
  dodge:       { icon: '🌀', color: '#06b6d4' },
  reload:      { icon: '🔄', color: '#64748b' },
  interaction: { icon: '🤝', color: '#f97316' },
  other:       { icon: '🎬', color: '#94a3b8' },
};

export function FbxViewer({
  url,
  filename,
  height = 420,
  className = '',
  animationUrls: externalAnims,
  modelPath,
  autoPlayIndex,
}: FbxViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [texInfo, setTexInfo] = useState<string>('');
  const cleanupRef = useRef<() => void>(() => {});

  // ── 애니메이션 상태 ──
  const [animations, setAnimations] = useState<AnimationEntry[]>(externalAnims ?? []);
  const [loadedClips, setLoadedClips] = useState<Map<string, THREE.AnimationClip>>(new Map());
  const [activeAnim, setActiveAnim] = useState<string | null>(null);
  const [animLoading, setAnimLoading] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [animProgress, setAnimProgress] = useState(0);
  const [animDuration, setAnimDuration] = useState(0);
  const [showAnimPanel, setShowAnimPanel] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Three.js 런타임 참조
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const fbxRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);

  // 자동 애니메이션 검색
  useEffect(() => {
    if (externalAnims && externalAnims.length > 0) return;
    const path = modelPath || extractFbxPath(url);
    if (!path) return;
    fetch(`/api/assets/animations?model=${encodeURIComponent(path)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.animations?.length > 0) {
          setAnimations(data.animations.map((a: { name: string; url: string; category?: string }) => ({
            name: a.name,
            url: a.url,
            category: a.category,
          })));
          if (data.animations.length > 0) setShowAnimPanel(true);
        }
      })
      .catch(() => {});
  }, [url, modelPath, externalAnims]);

  // 애니메이션 클립 로드 & 재생
  const playAnimation = useCallback(async (anim: AnimationEntry) => {
    const mixer = mixerRef.current;
    const fbx = fbxRef.current;
    if (!mixer || !fbx) return;

    // 이미 로드된 클립이 있으면 바로 재생
    const cached = loadedClips.get(anim.url);
    if (cached) {
      applyClip(mixer, cached, anim.name);
      return;
    }

    // FBX 애니메이션 로드
    setAnimLoading(anim.name);
    try {
      const loader = new FBXLoader();
      const animFbx = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(anim.url, resolve, undefined, reject);
      });

      if (animFbx.animations.length > 0) {
        const clip = animFbx.animations[0];
        clip.name = anim.name;
        setLoadedClips(prev => new Map(prev).set(anim.url, clip));
        applyClip(mixer, clip, anim.name);
      } else {
        console.warn(`[FbxViewer] No animations found in ${anim.name}`);
      }
    } catch (err) {
      console.error(`[FbxViewer] Animation load failed: ${anim.name}`, err);
    } finally {
      setAnimLoading(null);
    }
  }, [loadedClips]);

  // 클립 적용 (크로스페이드)
  const applyClip = useCallback((mixer: THREE.AnimationMixer, clip: THREE.AnimationClip, name: string) => {
    const prevAction = actionRef.current;
    const newAction = mixer.clipAction(clip);

    if (prevAction && prevAction !== newAction) {
      // 크로스 페이드 (0.3초)
      newAction.reset();
      newAction.setEffectiveTimeScale(playbackSpeed);
      newAction.setEffectiveWeight(1);
      newAction.play();
      prevAction.crossFadeTo(newAction, 0.3, true);
    } else {
      newAction.reset();
      newAction.setEffectiveTimeScale(playbackSpeed);
      newAction.play();
    }

    actionRef.current = newAction;
    setActiveAnim(name);
    setIsPlaying(true);
    setAnimDuration(clip.duration);
  }, [playbackSpeed]);

  // 재생/일시정지
  const togglePlayPause = useCallback(() => {
    const action = actionRef.current;
    if (!action) return;
    if (isPlaying) {
      action.paused = true;
      setIsPlaying(false);
    } else {
      action.paused = false;
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // 속도 변경
  useEffect(() => {
    const action = actionRef.current;
    if (action) action.setEffectiveTimeScale(playbackSpeed);
  }, [playbackSpeed]);

  // ── Three.js 메인 setup ──
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
    const clock = new THREE.Clock();
    clockRef.current = clock;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const mixer = mixerRef.current;
      if (mixer) {
        mixer.update(delta);
        // 진행률 업데이트
        const action = actionRef.current;
        if (action && action.getClip().duration > 0) {
          setAnimProgress(action.time / action.getClip().duration);
        }
      }
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

        // ── 텍스처 로딩 ──────────────────────────────────────────────────────
        const matEntries = await fetchMaterials();
        const texLoader  = new THREE.TextureLoader();

        // 머터리얼 이름 → 텍스처 캐시
        const texCache: Record<string, THREE.Texture | null> = {};
        const loadTex = (apiUrl: string): Promise<THREE.Texture | null> => {
          if (!apiUrl) return Promise.resolve(null);
          if (texCache[apiUrl] !== undefined) return Promise.resolve(texCache[apiUrl]);
          return new Promise((resolve) => {
            const isTga = /\.tga$/i.test(apiUrl);
            const loader2 = isTga ? tgaLoader : texLoader;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (loader2 as any).load(
              apiUrl,
              (tex: THREE.Texture) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.flipY = !isTga;
                texCache[apiUrl] = tex;
                resolve(tex);
              },
              undefined,
              () => { texCache[apiUrl] = null; resolve(null); }
            );
          });
        };

        const findEntry = (meshName: string): MatEntry | undefined => {
          const mn = meshName.toLowerCase();
          return matEntries.find(e => {
            const en = e.name.toLowerCase();
            return en && (mn.includes(en) || en.includes(mn));
          }) ?? matEntries[0];
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
                  newMat.normalScale.set(1, -1);
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

        // AnimationMixer 생성 (모든 애니메이션을 이 mixer에서 재생)
        const mixer = new THREE.AnimationMixer(fbx);
        mixerRef.current = mixer;
        fbxRef.current = fbx;

        // 모델 자체에 내장된 애니메이션이 있으면 재생
        if (fbx.animations.length > 0) {
          const clip = fbx.animations[0];
          clip.name = clip.name || 'embedded';
          const action = mixer.clipAction(clip);
          action.play();
          actionRef.current = action;
          setActiveAnim(clip.name);
          setAnimDuration(clip.duration);
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
      mixerRef.current = null;
      fbxRef.current = null;
      actionRef.current = null;
    };
    return cleanupRef.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, height]);

  // autoPlayIndex 처리
  useEffect(() => {
    if (autoPlayIndex != null && animations.length > autoPlayIndex && status === 'ok') {
      playAnimation(animations[autoPlayIndex]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayIndex, animations, status]);

  // 카테고리별 그룹화
  const groupedAnims = animations.reduce<Record<string, AnimationEntry[]>>((acc, a) => {
    const cat = a.category || 'other';
    (acc[cat] ??= []).push(a);
    return acc;
  }, {});

  const categories = Object.keys(groupedAnims).sort();
  const filteredAnims = filterCategory ? (groupedAnims[filterCategory] ?? []) : animations;

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

        {/* 애니메이션 토글 버튼 */}
        {animations.length > 0 && status === 'ok' && (
          <button
            onClick={() => setShowAnimPanel(p => !p)}
            className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors"
            style={{
              background: showAnimPanel ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
              color: showAnimPanel ? '#a5b4fc' : '#6366f1',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            🎬 {animations.length} 애니메이션
          </button>
        )}

        {status === 'ok' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {texInfo} · 드래그 회전 · 휠 줌
          </span>
        )}
      </div>

      {/* 뷰포트 + 애니메이션 패널 */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* 3D 뷰포트 */}
        <div ref={mountRef} style={{ flex: 1, width: '100%', height }} />

        {/* 애니메이션 목록 사이드 패널 */}
        {showAnimPanel && animations.length > 0 && status === 'ok' && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 240,
              height,
              background: 'rgba(15,17,23,0.95)',
              borderLeft: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* 패널 헤더 */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>🎬 애니메이션</span>
              <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto' }}>{animations.length}개</span>
            </div>

            {/* 카테고리 필터 */}
            {categories.length > 1 && (
              <div style={{ padding: '4px 8px', display: 'flex', flexWrap: 'wrap', gap: 3, borderBottom: '1px solid #1e293b' }}>
                <button
                  onClick={() => setFilterCategory(null)}
                  style={{
                    padding: '1px 6px', borderRadius: 4, fontSize: 10, border: 'none', cursor: 'pointer',
                    background: !filterCategory ? '#6366f1' : '#1e293b',
                    color: !filterCategory ? '#fff' : '#94a3b8',
                  }}
                >ALL</button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                    style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 10, border: 'none', cursor: 'pointer',
                      background: cat === filterCategory ? (CATEGORY_META[cat]?.color ?? '#6366f1') : '#1e293b',
                      color: cat === filterCategory ? '#fff' : '#94a3b8',
                    }}
                  >
                    {CATEGORY_META[cat]?.icon ?? '🎬'} {cat}
                  </button>
                ))}
              </div>
            )}

            {/* 애니메이션 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {filteredAnims.map((anim) => {
                const isActive = activeAnim === anim.name;
                const isLoading = animLoading === anim.name;
                const meta = CATEGORY_META[anim.category ?? 'other'] ?? CATEGORY_META.other;
                return (
                  <button
                    key={anim.url}
                    onClick={() => playAnimation(anim)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '5px 10px',
                      background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${meta.color}` : '3px solid transparent',
                      cursor: isLoading ? 'wait' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 12 }}>{isLoading ? '⏳' : (isActive ? '▶' : meta.icon)}</span>
                    <span style={{
                      fontSize: 11,
                      color: isActive ? '#e2e8f0' : '#94a3b8',
                      fontWeight: isActive ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {anim.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 애니메이션 컨트롤 바 (활성 애니메이션이 있을 때만) */}
      {activeAnim && status === 'ok' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: '#1e293b',
            borderTop: '1px solid #334155',
          }}
        >
          {/* 재생/일시정지 */}
          <button
            onClick={togglePlayPause}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: '#e2e8f0', fontSize: 16, lineHeight: 1,
            }}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* 애니메이션 이름 */}
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 600, minWidth: 60 }}>
            {activeAnim}
          </span>

          {/* 프로그레스 바 */}
          <div
            style={{
              flex: 1, height: 4, background: '#334155', borderRadius: 2, position: 'relative', cursor: 'pointer',
            }}
            onClick={(e) => {
              const action = actionRef.current;
              if (!action) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              action.time = ratio * action.getClip().duration;
            }}
          >
            <div
              style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${animProgress * 100}%`,
                background: '#6366f1', borderRadius: 2, transition: 'width 0.1s',
              }}
            />
          </div>

          {/* 시간 표시 */}
          <span style={{ color: '#64748b', fontSize: 10, minWidth: 45, textAlign: 'right' }}>
            {(animProgress * animDuration).toFixed(1)}s / {animDuration.toFixed(1)}s
          </span>

          {/* 속도 조절 */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{
              background: '#0f1117', border: '1px solid #334155', borderRadius: 4,
              color: '#94a3b8', fontSize: 10, padding: '2px 4px', cursor: 'pointer',
            }}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      )}

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
