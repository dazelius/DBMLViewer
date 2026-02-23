import { useState, useCallback, useRef, useEffect } from 'react';

interface AppLayoutProps {
  editor: React.ReactNode;
  canvas: React.ReactNode;
  toolbar: React.ReactNode;
  sidebar?: React.ReactNode;
}

const MIN_PANEL_WIDTH = 280;
const DEFAULT_RATIO = 0.35;

export default function AppLayout({ editor, canvas, toolbar, sidebar }: AppLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [prevRatio, setPrevRatio] = useState(DEFAULT_RATIO);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const toggleEditor = useCallback(() => {
    if (editorVisible) {
      setPrevRatio(ratio);
      setEditorVisible(false);
    } else {
      setEditorVisible(true);
      setRatio(prevRatio);
    }
  }, [editorVisible, ratio, prevRatio]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const sidebarWidth = sidebar ? 210 : 0;
      const availableWidth = rect.width - sidebarWidth;
      const x = e.clientX - rect.left - sidebarWidth;
      const newRatio = Math.max(
        MIN_PANEL_WIDTH / availableWidth,
        Math.min(1 - MIN_PANEL_WIDTH / availableWidth, x / availableWidth)
      );
      setRatio(newRatio);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sidebar]);

  // Keyboard shortcut: Ctrl+B to toggle editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleEditor();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleEditor]);

  return (
    <div className="flex flex-col h-full w-full">
      {toolbar}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {sidebar}

        {editorVisible && (
          <>
            <div
              className="overflow-hidden flex flex-col"
              style={{
                width: `${ratio * 100}%`,
                minWidth: MIN_PANEL_WIDTH,
                transition: isDragging ? 'none' : 'width 0.2s ease',
              }}
            >
              {editor}
            </div>
            <div
              className="w-1 cursor-col-resize hover:bg-[var(--accent)] transition-colors flex-shrink-0"
              style={{
                backgroundColor: isDragging ? 'var(--accent)' : 'var(--border-color)',
              }}
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        <div className="flex-1 overflow-hidden relative" style={{ minWidth: MIN_PANEL_WIDTH }}>
          {canvas}

          {/* Toggle button pinned to left edge of canvas */}
          <button
            onClick={toggleEditor}
            title={editorVisible ? 'Hide editor (Ctrl+B)' : 'Show editor (Ctrl+B)'}
            className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {editorVisible ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Hide Editor
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Show Editor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
