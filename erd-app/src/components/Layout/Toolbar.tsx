import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const schema = useSchemaStore((s) => s.schema);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const nodes = useCanvasStore((s) => s.nodes);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const collapseMode = useExploreStore((s) => s.collapseMode);
  const toggleCollapseMode = useExploreStore((s) => s.toggleCollapseMode);

  const isEditor = location.pathname.startsWith('/editor') || location.pathname === '/';

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
        className="flex items-center justify-between px-3 h-12 flex-shrink-0 select-none header-gradient"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {/* Left: Logo + Mode Switch + Import */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-glow)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <span className="font-bold text-[13px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SchemaLens
            </span>
          </div>

          {/* Mode Switch */}
          <div
            className="flex p-[3px] rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
          >
            <ModeTab active={isEditor} onClick={() => navigate('/editor')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              Editor
            </ModeTab>
            <ModeTab active={!isEditor} onClick={() => navigate('/docs')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Docs
            </ModeTab>
          </div>

          <Divider />

          <ToolButton onClick={() => setShowImport(true)} title="Import from Excel folder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import
          </ToolButton>
        </div>

        {/* Right: Canvas Tools */}
        <div className="flex items-center gap-0.5">
          <ToolButton onClick={handleAutoArrange} title="Auto-arrange (Ctrl+Shift+A)" disabled={!schema}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Arrange
          </ToolButton>

          <ToolButton onClick={handleFitScreen} title="Fit to screen (Ctrl+0)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Fit
          </ToolButton>

          <ToolButton onClick={toggleCollapseMode} title="Toggle collapse mode">
            {collapseMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            )}
            {collapseMode ? 'Expand' : 'Collapse'}
          </ToolButton>

          <Divider />

          <ToolButton onClick={() => setShowExport(true)} title="Export SQL" disabled={!schema}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            SQL
          </ToolButton>

          <ToolButton onClick={handleExportImage} title="Export as PNG">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            PNG
          </ToolButton>

          <Divider />

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer interactive"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {showExport && <SQLExportModal onClose={() => setShowExport(false)} />}
      {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: 'var(--border-color)' }} />;
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-[5px] text-[11px] font-semibold rounded-md cursor-pointer interactive"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.25), var(--shadow-glow)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </button>
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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer interactive disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}
