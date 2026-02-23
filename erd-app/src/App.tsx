import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage.tsx';
import DocsPage from './pages/DocsPage.tsx';
import DiffPage from './pages/DiffPage.tsx';
import ValidationPage from './pages/ValidationPage.tsx';
import { useAutoLoad } from './hooks/useAutoLoad.ts';

export default function App() {
  useAutoLoad();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:tableId" element={<DocsPage />} />
        <Route path="/docs/enum/:enumName" element={<DocsPage />} />
        <Route path="/diff" element={<DiffPage />} />
        <Route path="/validation" element={<ValidationPage />} />
      </Routes>
    </BrowserRouter>
  );
}
