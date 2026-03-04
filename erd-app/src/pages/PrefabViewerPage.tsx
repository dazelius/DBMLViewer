/**
 * PrefabViewerPage.tsx
 * 독립 URL로 프리팹을 3D 씬으로 렌더링하는 전체 화면 뷰어
 *
 * 사용법:
 *   /TableMaster/viewer/prefab?path=GameContents/Character/Player/Player_g_1/PC_01.prefab
 *
 * /api/assets/prefab?path=... 에서 JSON을 가져와 SceneViewer로 렌더링
 */
import { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SceneViewer = lazy(() =>
  import('../components/SceneViewer').then(m => ({ default: m.SceneViewer }))
);

export default function PrefabViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawPath = searchParams.get('path') || '';

  // /api/assets/prefab?path=... 형태의 URL 구성
  const apiUrl = rawPath
    ? `/api/assets/prefab?path=${encodeURIComponent(rawPath)}&max=200`
    : '';

  const [prefabName, setPrefabName] = useState('Prefab Viewer');

  useEffect(() => {
    if (rawPath) {
      const name = rawPath.split('/').pop()?.replace('.prefab', '') ?? 'Prefab';
      setPrefabName(name);
      document.title = `${name} — Prefab Viewer`;
    }
  }, [rawPath]);

  if (!rawPath) {
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Prefab Viewer</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
          URL에 <code style={{ background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4, color: '#818cf8' }}>?path=경로.prefab</code> 파라미터를 추가하세요.
        </p>
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '12px 16px', fontSize: 11, fontFamily: 'Consolas, monospace', color: '#818cf8' }}>
          /TableMaster/viewer/prefab?path=GameContents/Character/.../PC_01.prefab
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

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{prefabName}</span>
        <span style={{ color: '#34d399', fontSize: 12 }}>.prefab</span>

        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 10, fontFamily: 'Consolas, monospace', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rawPath}
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
          <SceneViewer scenePath={apiUrl} height={window.innerHeight - 44} />
        </Suspense>
      </div>
    </div>
  );
}
