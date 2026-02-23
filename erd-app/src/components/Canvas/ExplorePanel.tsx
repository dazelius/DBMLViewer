import { useState, useRef, useEffect, useCallback } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';

type Tab = 'search' | 'impact' | 'path';

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
    impactActive, computeImpact, clearImpact,
    pathFinderSource, pathFinderTarget, pathFinderActive, pathFinderResult,
    setPathFinderSource, setPathFinderTarget, computePath, clearPathFinder,
  } = useExploreStore();

  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setActiveTab('search');
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setActiveTab(null);
        clearColumnSearch();
        clearImpact();
        clearPathFinder();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearColumnSearch, clearImpact, clearPathFinder]);

  useEffect(() => {
    if (activeTab === 'impact' && selectedTableId) {
      computeImpact(selectedTableId, schema);
    }
  }, [selectedTableId, activeTab, schema, computeImpact]);

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

  const handleTabClick = (tab: Tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
      clearColumnSearch();
      clearImpact();
      clearPathFinder();
    } else {
      setActiveTab(tab);
      if (tab !== 'search') clearColumnSearch();
      if (tab !== 'impact') clearImpact();
      if (tab !== 'path') clearPathFinder();
      if (tab === 'search') setTimeout(() => searchRef.current?.focus(), 50);
      if (tab === 'impact' && selectedTableId) computeImpact(selectedTableId, schema);
    }
  };

  const tableOptions = schema?.tables ?? [];

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      {/* Tab buttons */}
      <div
        className="flex gap-0.5 p-[3px] rounded-lg glass-panel"
        style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
      >
        <PillButton active={activeTab === 'search'} onClick={() => handleTabClick('search')} title="Column Search (Ctrl+F)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </PillButton>
        <PillButton active={activeTab === 'impact'} onClick={() => handleTabClick('impact')} title="Impact Analysis">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Impact
        </PillButton>
        <PillButton active={activeTab === 'path'} onClick={() => handleTabClick('path')} title="Path Finder">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Path
        </PillButton>
      </div>

      {/* Panel body */}
      {activeTab === 'search' && (
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

      {activeTab === 'impact' && (
        <div
          className="rounded-xl w-64 overflow-hidden glass-panel"
          style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="p-3.5">
            <div className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              테이블을 클릭하면 연결된 테이블이 깊이별로 표시됩니다
            </div>
            {impactActive && selectedTableId && (
              <div className="space-y-1">
                <ImpactLegend depth={0} label="Selected" count={1} />
                <ImpactLegend depth={1} label="Direct (1차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 1)} />
                <ImpactLegend depth={2} label="Indirect (2차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 2)} />
                <ImpactLegend depth={3} label="Distant (3차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 3)} />
              </div>
            )}
            {!selectedTableId && (
              <div
                className="text-[11px] font-medium px-3 py-2 rounded-lg text-center"
                style={{ color: 'var(--accent)', background: 'var(--accent-subtle)' }}
              >
                테이블을 선택하세요
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'path' && (
        <div
          className="rounded-xl w-72 overflow-hidden glass-panel"
          style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="p-3.5 flex flex-col gap-2.5">
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              두 테이블 간 FK 경로를 찾습니다
            </div>
            <TableSelect label="From" value={pathFinderSource} onChange={(id) => setPathFinderSource(id)} tables={tableOptions} />
            <TableSelect label="To" value={pathFinderTarget} onChange={(id) => setPathFinderTarget(id)} tables={tableOptions} />
            <button
              onClick={() => computePath(schema)}
              disabled={!pathFinderSource || !pathFinderTarget}
              className="w-full py-2 rounded-lg text-[11px] font-bold cursor-pointer interactive disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
              onMouseEnter={(e) => {
                if (pathFinderSource && pathFinderTarget) e.currentTarget.style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              Find Path
            </button>
            {pathFinderActive && pathFinderResult.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {pathFinderResult.map((tid, i) => {
                  const t = tableOptions.find((tb) => tb.id === tid);
                  const isEndpoint = i === 0 || i === pathFinderResult.length - 1;
                  return (
                    <span key={tid} className="flex items-center gap-1">
                      <button
                        onClick={() => focusTable(tid)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer interactive"
                        style={{
                          background: isEndpoint ? 'var(--accent-muted)' : 'var(--bg-surface)',
                          color: isEndpoint ? 'var(--accent)' : 'var(--text-secondary)',
                          border: `1px solid ${isEndpoint ? 'var(--accent)' : 'var(--border-color)'}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isEndpoint ? 'var(--accent-muted)' : 'var(--bg-surface)';
                          e.currentTarget.style.color = isEndpoint ? 'var(--accent)' : 'var(--text-secondary)';
                        }}
                      >
                        {t?.name ?? tid}
                      </button>
                      {i < pathFinderResult.length - 1 && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            {pathFinderActive && pathFinderResult.length === 0 && (
              <div
                className="text-[10px] font-medium px-3 py-2 rounded-lg text-center"
                style={{ color: 'var(--error)', background: 'var(--error-muted)' }}
              >
                경로를 찾을 수 없습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PillButton({ children, active, onClick, title }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-md text-[11px] font-semibold cursor-pointer interactive"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        boxShadow: active ? 'var(--shadow-glow)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}

function ImpactLegend({ depth, label, count }: { depth: number; label: string; count: number }) {
  const opacities = [1, 0.85, 0.5, 0.25];
  const op = opacities[depth] ?? 0.1;
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <div className="w-3 h-3 rounded" style={{ background: `var(--accent)`, opacity: op }} />
      <span className="text-[11px] flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>{count}</span>
    </div>
  );
}

function countByDepth(map: Map<string, number>, depth: number): number {
  let c = 0;
  for (const d of map.values()) if (d === depth) c++;
  return c;
}

function TableSelect({ label, value, onChange, tables }: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  tables: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold w-8 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] outline-none cursor-pointer interactive"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
      >
        <option value="">Select table...</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
