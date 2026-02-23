import { useState, useRef, useEffect, useCallback } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';

export default function ExplorePanel() {
  const schema = useSchemaStore((s) => s.schema);
  const selectedTableId = useCanvasStore((s) => s.selectedTableId);
  const setSelectedTable = useCanvasStore((s) => s.setSelectedTable);
  const nodes = useCanvasStore((s) => s.nodes);
  const transform = useCanvasStore((s) => s.transform);
  const setTransform = useCanvasStore((s) => s.setTransform);

  const {
    columnSearchQuery, columnSearchActive, columnSearchResults,
    searchColumns, clearColumnSearch,
  } = useExploreStore();

  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        clearColumnSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearColumnSearch]);

  const focusTable = useCallback((tableId: string) => {
    setSelectedTable(tableId);
    const node = nodes.get(tableId);
    if (node) {
      const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setTransform({
          x: rect.width / 2 - (node.position.x + node.size.width / 2) * transform.scale,
          y: rect.height / 2 - (node.position.y + node.size.height / 2) * transform.scale,
          scale: transform.scale,
        });
      }
    }
  }, [nodes, transform, setTransform, setSelectedTable]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      clearColumnSearch();
    } else {
      setOpen(true);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };

  const tableOptions = schema?.tables ?? [];

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      {/* Search button */}
      <button
        onClick={handleToggle}
        title="Column Search (Ctrl+F)"
        className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[11px] font-semibold cursor-pointer interactive glass-panel"
        style={{
          background: open ? 'var(--accent)' : undefined,
          color: open ? '#fff' : 'var(--text-secondary)',
          boxShadow: open ? 'var(--shadow-glow)' : 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search
      </button>

      {/* Search panel */}
      {open && (
        <div
          className="rounded-xl w-72 overflow-hidden glass-panel"
          style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="p-2.5">
            <input
              ref={searchRef}
              type="text"
              value={columnSearchQuery}
              onChange={(e) => searchColumns(e.target.value, schema)}
              placeholder="Search tables, columns, types..."
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none interactive"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          {columnSearchActive && (
            <div className="px-2.5 pb-2.5">
              <div className="text-[10px] px-1 mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                {columnSearchResults.size} table{columnSearchResults.size !== 1 ? 's' : ''} matched
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {tableOptions
                  .filter((t) => columnSearchResults.has(t.id))
                  .map((t) => {
                    const q = columnSearchQuery.toLowerCase();
                    const matchCols = t.columns.filter(
                      (c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
                    );
                    return (
                      <button
                        key={t.id}
                        onClick={() => focusTable(t.id)}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] cursor-pointer interactive"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                        {matchCols.length > 0 && (
                          <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {matchCols.map((c) => c.name).join(', ')}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
