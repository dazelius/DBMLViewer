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
      const sidebarWidth = sidebar ? 220 : 0;
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
                transition: isDragging ? 'none' : 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {editor}
            </div>
            {/* Resize Handle */}
            <div
              className="flex-shrink-0 cursor-col-resize relative group"
              style={{ width: 5 }}
              onMouseDown={handleMouseDown}
            >
              <div
                className="absolute inset-0 interactive"
                style={{
                  background: isDragging ? 'var(--accent)' : 'var(--border-color)',
                  width: isDragging ? 2 : 1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
              <div
                className="absolute inset-y-0 interactive opacity-0 group-hover:opacity-100"
                style={{
                  background: 'var(--accent)',
                  width: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              />
            </div>
          </>
        )}

        <div className="flex-1 overflow-hidden relative" style={{ minWidth: MIN_PANEL_WIDTH }}>
          {canvas}

          {/* Toggle Editor Button */}
          <button
            onClick={toggleEditor}
            title={editorVisible ? 'Hide editor (Ctrl+B)' : 'Show editor (Ctrl+B)'}
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer interactive glass-panel"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md), var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            {editorVisible ? 'Hide' : 'Editor'}
            <kbd
              className="px-1 py-0.5 rounded text-[9px]"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              ⌘B
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
