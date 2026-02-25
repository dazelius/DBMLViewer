import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface FbxViewerProps {
  /** /api/assets/file?path=… 또는 /api/assets/smart?name=… URL */
  url: string;
  filename?: string;
  height?: number;
  className?: string;
}

export function FbxViewer({ url, filename, height = 420, className = '' }: FbxViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Three.js 씬 셋업 ─────────────────────────────────────────────────────
    const w = el.clientWidth || 600;
    const h = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1117);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(0, 100, 300);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 20;
    controls.maxDistance = 1500;

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(200, 400, 200);
    dir.castShadow = true;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x6366f1, 0x1e293b, 0.4));

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

    // ── FBX 로드 ─────────────────────────────────────────────────────────────
    const loader = new FBXLoader();
    loader.load(
      url,
      (fbx) => {
        // 모델 중앙 정렬 + 카메라 자동 거리
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const camDist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6;

        fbx.position.sub(center);
        grid.position.y = -box.getSize(new THREE.Vector3()).y / 2;
        camera.position.set(0, maxDim * 0.4, camDist);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        controls.target.set(0, 0, 0);
        controls.maxDistance = camDist * 5;
        controls.update();

        // 그림자 활성화
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // 애니메이션
        if (fbx.animations.length > 0) {
          mixer = new THREE.AnimationMixer(fbx);
          mixer.clipAction(fbx.animations[0]).play();
        }

        scene.add(fbx);
        setStatus('ok');
      },
      undefined,
      (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setErrMsg(msg);
        setStatus('error');
      },
    );

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
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
        <span style={{ color: '#94a3b8' }}>{filename ?? url.split('/').pop() ?? 'FBX'}</span>
        {status === 'ok' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            드래그 회전 · 휠 줌
          </span>
        )}
      </div>

      {/* 뷰포트 */}
      <div ref={mountRef} style={{ width: '100%', height }} />

      {/* 오버레이: 로딩 */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(15,17,23,0.85)' }}>
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-[12px]" style={{ color: '#94a3b8' }}>FBX 로딩 중...</span>
        </div>
      )}

      {/* 오버레이: 에러 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6" style={{ background: 'rgba(15,17,23,0.92)' }}>
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
