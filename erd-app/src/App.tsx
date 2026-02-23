import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage.tsx';
import DocsPage from './pages/DocsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:tableId" element={<DocsPage />} />
        <Route path="/docs/enum/:enumName" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
