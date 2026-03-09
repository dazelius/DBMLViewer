/**
 * PrefabViewerPage.tsx
 * 독립 URL로 프리팹/FBX를 3D 씬으로 렌더링하는 전체 화면 뷰어
 *
 * 사용법:
 *   /TableMaster/viewer/prefab?path=GameContents/Character/Player/Player_g_1/PC_01.prefab
 *   /TableMaster/viewer/prefab?fbx=/api/assets/file?path=vanguard_mid.fbx
 *   /TableMaster/viewer/prefab?fbx=경로/파일.fbx
 *
 * ?path= → /api/assets/prefab?path=... 에서 JSON을 가져와 SceneViewer로 렌더링
 * ?fbx=  → FBX 파일을 Three.js FBXLoader로 직접 렌더링
 */
import { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SceneViewer = lazy(() =>
  import('../components/SceneViewer').then(m => ({ default: m.SceneViewer }))
);

const FbxViewer = lazy(() =>
  import('../components/FbxViewer').then(m => ({ default: m.FbxViewer }))
);

export default function PrefabViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawPath = searchParams.get('path') || '';
  const fbxParam = searchParams.get('fbx') || '';

  // 모드 판별: fbx 파라미터가 있으면 FBX 모드
  const isFbxMode = !!fbxParam;

  // FBX URL 구성: 이미 /api/ URL이면 그대로, 아니면 API URL로 변환
  const fbxUrl = fbxParam.startsWith('/api/')
    ? fbxParam
    : fbxParam
      ? `/api/assets/file?path=${encodeURIComponent(fbxParam)}`
      : '';

  // /api/assets/prefab?path=... 형태의 URL 구성 (prefab 모드)
  const apiUrl = rawPath
    ? `/api/assets/prefab?path=${encodeURIComponent(rawPath)}&max=200`
    : '';

  const hasContent = isFbxMode ? !!fbxUrl : !!rawPath;

  const [viewerName, setViewerName] = useState('3D Viewer');

  useEffect(() => {
    if (isFbxMode && fbxParam) {
      // fbx 파일명 추출
      const decoded = decodeURIComponent(fbxParam);
      const name = decoded.split('/').pop()?.split('?')[0]?.replace('.fbx', '') ?? 'FBX';
      setViewerName(name);
      document.title = `${name} — FBX Viewer`;
    } else if (rawPath) {
      const name = rawPath.split('/').pop()?.replace('.prefab', '') ?? 'Prefab';
      setViewerName(name);
      document.title = `${name} — Prefab Viewer`;
    }
  }, [rawPath, fbxParam, isFbxMode]);

  if (!hasContent) {
    return (
      <div style={{
        width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#94a3b8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>3D Viewer</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
          URL에 <code style={{ background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4, color: '#818cf8' }}>?path=경로.prefab</code> 또는{' '}
          <code style={{ background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4, color: '#818cf8' }}>?fbx=경로.fbx</code> 파라미터를 추가하세요.
        </p>
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '12px 16px', fontSize: 11, fontFamily: 'Consolas, monospace', color: '#818cf8', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>/TableMaster/viewer/prefab?path=GameContents/.../PC_01.prefab</span>
          <span>/TableMaster/viewer/prefab?fbx=vanguard_mid.fbx</span>
        </div>
        <button
          onClick={() => navigate('/chat')}
          style={{ marginTop: 32, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}
        >
          ← 채팅으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0f1a' }}>
      {/* ── 상단 헤더바 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
        background: 'rgba(52,211,153,0.06)', borderBottom: '1px solid rgba(52,211,153,0.15)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          title="뒤로가기"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          뒤로
        </button>

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isFbxMode ? '#818cf8' : '#34d399'} strokeWidth="2">
          {isFbxMode ? (
            <>
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </>
          ) : (
            <>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </>
          )}
        </svg>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{viewerName}</span>
        <span style={{ color: isFbxMode ? '#818cf8' : '#34d399', fontSize: 12 }}>{isFbxMode ? '.fbx' : '.prefab'}</span>

        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 10, fontFamily: 'Consolas, monospace', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isFbxMode ? decodeURIComponent(fbxParam) : rawPath}
        </span>

        <button
          onClick={() => {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
          }}
          style={{
            background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
          }}
          title="URL 복사"
        >
          📋 URL 복사
        </button>
      </div>

      {/* ── 3D 뷰어 ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
            color: '#64748b', fontSize: 13, gap: 8,
          }}>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            3D 뷰어 로딩 중...
          </div>
        }>
          {isFbxMode ? (
            <FbxViewer url={fbxUrl} filename={viewerName + '.fbx'} height="100%" />
          ) : (
            <SceneViewer scenePath={apiUrl} height={window.innerHeight - 44} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
