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

  // Ctrl+F to open search
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

  // Auto-trigger impact analysis when selecting a table while impact tab is active
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
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
      {/* Tab buttons */}
      <div className="flex gap-1">
        <PillButton
          active={activeTab === 'search'}
          onClick={() => handleTabClick('search')}
          title="Column Search (Ctrl+F)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </PillButton>
        <PillButton
          active={activeTab === 'impact'}
          onClick={() => handleTabClick('impact')}
          title="Impact Analysis"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Impact
        </PillButton>
        <PillButton
          active={activeTab === 'path'}
          onClick={() => handleTabClick('path')}
          title="Path Finder"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Path
        </PillButton>
      </div>

      {/* Panel body */}
      {activeTab === 'search' && (
        <div className="rounded-lg shadow-xl w-72 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="p-2">
            <input
              ref={searchRef}
              type="text"
              value={columnSearchQuery}
              onChange={(e) => searchColumns(e.target.value, schema)}
              placeholder="Search tables, columns, types..."
              className="w-full px-3 py-2 rounded-md text-xs outline-none"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
          {columnSearchActive && (
            <div className="px-2 pb-2">
              <div className="text-[10px] px-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                {columnSearchResults.size} table{columnSearchResults.size !== 1 ? 's' : ''} matched
              </div>
              <div className="max-h-48 overflow-y-auto">
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
                        className="w-full text-left px-2 py-1.5 rounded text-[11px] cursor-pointer transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                        {matchCols.length > 0 && (
                          <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
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
        <div className="rounded-lg shadow-xl w-64 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="p-3">
            <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              테이블을 클릭하면 연결된 테이블이 깊이별로 표시됩니다
            </div>
            {impactActive && selectedTableId && (
              <div>
                <ImpactLegend depth={0} label="Selected" count={1} />
                <ImpactLegend depth={1} label="Direct (1차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 1)} />
                <ImpactLegend depth={2} label="Indirect (2차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 2)} />
                <ImpactLegend depth={3} label="Distant (3차)" count={countByDepth(useExploreStore.getState().impactDepthMap, 3)} />
              </div>
            )}
            {!selectedTableId && (
              <div className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                테이블을 선택하세요
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'path' && (
        <div className="rounded-lg shadow-xl w-72 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="p-3 flex flex-col gap-2">
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              두 테이블 간 FK 경로를 찾습니다
            </div>
            <TableSelect
              label="From"
              value={pathFinderSource}
              onChange={(id) => setPathFinderSource(id)}
              tables={tableOptions}
            />
            <TableSelect
              label="To"
              value={pathFinderTarget}
              onChange={(id) => setPathFinderTarget(id)}
              tables={tableOptions}
            />
            <button
              onClick={() => computePath(schema)}
              disabled={!pathFinderSource || !pathFinderTarget}
              className="w-full py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Find Path
            </button>
            {pathFinderActive && pathFinderResult.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {pathFinderResult.map((tid, i) => {
                  const t = tableOptions.find((tb) => tb.id === tid);
                  return (
                    <span key={tid} className="flex items-center gap-1">
                      <button
                        onClick={() => focusTable(tid)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                        style={{
                          background: i === 0 || i === pathFinderResult.length - 1
                            ? 'rgba(137,180,250,0.2)' : 'var(--bg-surface)',
                          color: i === 0 || i === pathFinderResult.length - 1
                            ? 'var(--accent)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {t?.name ?? tid}
                      </button>
                      {i < pathFinderResult.length - 1 && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            {pathFinderActive && pathFinderResult.length === 0 && (
              <div className="text-[10px]" style={{ color: 'var(--error)' }}>
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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  );
}

function ImpactLegend({ depth, label, count }: { depth: number; label: string; count: number }) {
  const opacities = [1, 0.9, 0.5, 0.25];
  const op = opacities[depth] ?? 0.1;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: `var(--accent)`, opacity: op }} />
      <span className="text-[10px] flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{count}</span>
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
      <span className="text-[10px] font-semibold w-8" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="flex-1 px-2 py-1 rounded text-[11px] outline-none cursor-pointer"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <option value="">Select table...</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
