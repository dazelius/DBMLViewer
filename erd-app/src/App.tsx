import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage.tsx';
import DocsPage from './pages/DocsPage.tsx';
import DiffPage from './pages/DiffPage.tsx';
import ValidationPage from './pages/ValidationPage.tsx';
import GuidePage from './pages/GuidePage.tsx';
import { SyncToast } from './components/Sync/SyncToast.tsx';
import { useAutoLoad } from './hooks/useAutoLoad.ts';

export default function App() {
  useAutoLoad();

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
      </Routes>
    </BrowserRouter>
  );
}
