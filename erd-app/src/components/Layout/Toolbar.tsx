import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';
import SQLExportModal from '../Export/SQLExportModal.tsx';
import ExcelImportModal from '../Import/ExcelImportModal.tsx';
import { exportCanvasAsImage } from '../../core/export/imageExporter.ts';
import { forceArrangeLayout } from '../../core/layout/autoLayout.ts';
import { fitToScreen } from '../Canvas/interaction/ZoomPanHandler.ts';

export default function Toolbar() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const schema = useSchemaStore((s) => s.schema);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const nodes = useCanvasStore((s) => s.nodes);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const collapseMode = useExploreStore((s) => s.collapseMode);
  const toggleCollapseMode = useExploreStore((s) => s.toggleCollapseMode);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleExportImage = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) exportCanvasAsImage(canvas);
  };

  const handleAutoArrange = useCallback(() => {
    if (!schema) return;
    const newNodes = forceArrangeLayout(schema, collapseMode);
    setNodes(newNodes);
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setTimeout(() => fitToScreen(rect.width, rect.height, newNodes, setTransform, collapseMode), 60);
    }
  }, [schema, setNodes, setTransform, collapseMode]);

  const handleFitScreen = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      fitToScreen(rect.width, rect.height, nodes, setTransform, collapseMode);
    }
  }, [nodes, setTransform, collapseMode]);

  return (
    <>
      <div
        className="flex items-center justify-between px-4 h-11 flex-shrink-0 select-none"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--accent)' }}>
            ERD Studio
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Text to ERD Diagram
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Import Excel */}
          <ToolButton onClick={() => setShowImport(true)} title="Import from Excel folder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Import</span>
          </ToolButton>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

          {/* Auto Arrange */}
          <ToolButton onClick={handleAutoArrange} title="Auto-arrange all tables (Ctrl+Shift+A)" disabled={!schema}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Arrange</span>
          </ToolButton>

          {/* Fit to screen */}
          <ToolButton onClick={handleFitScreen} title="Fit to screen (Ctrl+0)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span>Fit</span>
          </ToolButton>

          {/* Collapse toggle */}
          <ToolButton onClick={toggleCollapseMode} title="Toggle collapse mode">
            {collapseMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            )}
            <span>{collapseMode ? 'Expand' : 'Collapse'}</span>
          </ToolButton>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

          <ToolButton
            onClick={() => setShowExport(true)}
            title="Export SQL"
            disabled={!schema}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>SQL</span>
          </ToolButton>

          <ToolButton onClick={handleExportImage} title="Export as PNG">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>PNG</span>
          </ToolButton>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

          <ToolButton onClick={() => navigate('/docs')} title="Open documentation view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>Docs</span>
          </ToolButton>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

          <ToolButton onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </ToolButton>
        </div>
      </div>
      {showExport && <SQLExportModal onClose={() => setShowExport(false)} />}
      {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

function ToolButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
