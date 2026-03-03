import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage.tsx';
import DocsPage from './pages/DocsPage.tsx';
import DiffPage from './pages/DiffPage.tsx';
import ValidationPage from './pages/ValidationPage.tsx';
import GuidePage from './pages/GuidePage.tsx';
import QueryPage from './pages/QueryPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import ExplorePage from './pages/ExplorePage.tsx';
import { SyncToast } from './components/Sync/SyncToast.tsx';
import { useAutoLoad } from './hooks/useAutoLoad.ts';
import { useDebouncedParse } from './hooks/useDebouncedParse.ts';

export default function App() {
  useAutoLoad();
  // 어느 페이지에서든 DBML → 스키마 파싱이 동작하도록 전역에서 호출
  useDebouncedParse();

  return (
    <BrowserRouter basename="/TableMaster">
      <SyncToast />
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
      </Routes>
    </BrowserRouter>
  );
}
