import { useState, useEffect, useRef, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';

interface DocsSearchProps {
  onClose: () => void;
  onSelectTable: (tableId: string) => void;
  onSelectEnum: (enumName: string) => void;
}

interface SearchResult {
  type: 'table' | 'column' | 'enum';
  tableId?: string;
  tableName?: string;
  columnName?: string;
  enumName?: string;
  note?: string | null;
  groupName?: string | null;
  groupColor?: string | null;
}

export default function DocsSearch({ onClose, onSelectTable, onSelectEnum }: DocsSearchProps) {
  const schema = useSchemaStore((s) => s.schema);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = useMemo<SearchResult[]>(() => {
    if (!schema) return [];
    const items: SearchResult[] = [];

    for (const t of schema.tables) {
      items.push({ type: 'table', tableId: t.id, tableName: t.name, note: t.note, groupName: t.groupName, groupColor: t.groupColor });
      for (const c of t.columns) {
        items.push({ type: 'column', tableId: t.id, tableName: t.name, columnName: c.name, note: c.note, groupName: t.groupName, groupColor: t.groupColor });
      }
    }
    for (const e of schema.enums) {
      items.push({ type: 'enum', enumName: e.name });
    }
    return items;
  }, [schema]);

  const results = useMemo(() => {
    if (!query.trim()) return allItems.filter((r) => r.type === 'table' || r.type === 'enum');
    const q = query.toLowerCase();
    return allItems.filter((r) => {
      if (r.tableName?.toLowerCase().includes(q)) return true;
      if (r.columnName?.toLowerCase().includes(q)) return true;
      if (r.enumName?.toLowerCase().includes(q)) return true;
      if (r.note?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, allItems]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'enum' && result.enumName) {
      onSelectEnum(result.enumName);
    } else if (result.tableId) {
      onSelectTable(result.tableId);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIdx]) handleSelect(results[selectedIdx]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl overflow-hidden search-overlay-enter"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.7 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tables, columns, notes..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md cursor-pointer"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Clear
            </button>
          )}
          <kbd
            className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>No results found</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Try a different keyword</p>
            </div>
          ) : (
            results.slice(0, 50).map((result, i) => (
              <button
                key={`${result.type}-${result.tableId ?? ''}-${result.columnName ?? ''}-${result.enumName ?? ''}`}
                onClick={() => handleSelect(result)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left cursor-pointer"
                style={{
                  background: i === selectedIdx ? 'var(--bg-active)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <ResultIcon type={result.type} color={result.groupColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {result.type === 'column' ? `${result.tableName}.${result.columnName}` : (result.tableName ?? result.enumName)}
                    </span>
                    <TypeBadge type={result.type} />
                  </div>
                  {result.note && (
                    <p className="text-[10.5px] truncate mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{result.note}</p>
                  )}
                </div>
                {result.groupName && (
                  <span
                    className="text-[9px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                    style={{
                      color: result.groupColor ?? 'var(--text-muted)',
                      background: result.groupColor?.startsWith('#') ? `${result.groupColor}12` : 'var(--bg-surface)',
                    }}
                  >
                    {result.groupName}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-5 px-4 py-2.5 text-[10px] font-medium"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>ESC</kbd>
            Close
          </span>
          {results.length > 0 && (
            <span className="ml-auto tabular-nums" style={{ opacity: 0.5 }}>{results.length} results</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    table: { bg: 'var(--accent-muted)', fg: 'var(--accent)' },
    column: { bg: 'var(--bg-surface)', fg: 'var(--text-muted)' },
    enum: { bg: 'var(--success-muted)', fg: 'var(--success)' },
  };
  const c = colors[type] ?? colors.column;
  return (
    <span
      className="text-[8px] uppercase font-bold flex-shrink-0 px-1.5 py-[2px] rounded-md tracking-wider"
      style={{ background: c.bg, color: c.fg }}
    >
      {type}
    </span>
  );
}

function ResultIcon({ type, color }: { type: string; color?: string | null }) {
  const isHex = color?.startsWith('#');
  const bgColor = isHex ? `${color}12` : 'var(--bg-surface)';
  const strokeColor = color ?? 'var(--text-muted)';

  if (type === 'table') {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bgColor }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      </div>
    );
  }
  if (type === 'column') {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-surface)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-muted)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}
