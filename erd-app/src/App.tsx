import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SyncToast } from './components/Sync/SyncToast.tsx';
import { useAutoLoad } from './hooks/useAutoLoad.ts';
import { useDebouncedParse } from './hooks/useDebouncedParse.ts';

const EditorPage = lazy(() => import('./pages/EditorPage.tsx'));
const DocsPage = lazy(() => import('./pages/DocsPage.tsx'));
const DiffPage = lazy(() => import('./pages/DiffPage.tsx'));
const ValidationPage = lazy(() => import('./pages/ValidationPage.tsx'));
const GuidePage = lazy(() => import('./pages/GuidePage.tsx'));
const QueryPage = lazy(() => import('./pages/QueryPage.tsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.tsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.tsx'));
const PrefabViewerPage = lazy(() => import('./pages/PrefabViewerPage.tsx'));
const UnityPage = lazy(() => import('./pages/UnityPage.tsx'));
const LevelViewerPage = lazy(() => import('./pages/LevelViewerPage.tsx'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage.tsx'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14 }}>Loading...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function App() {
  useAutoLoad();
  useDebouncedParse();

  return (
    <HashRouter>
      <SyncToast />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:tableId" element={<DocsPage />} />
          <Route path="/docs/enum/:enumName" element={<DocsPage />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/query" element={<QueryPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/viewer/prefab" element={<PrefabViewerPage />} />
          <Route path="/unity" element={<UnityPage />} />
          <Route path="/level-viewer" element={<LevelViewerPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
