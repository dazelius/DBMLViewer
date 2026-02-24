import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';
import type { SchemaTable } from '../../core/schema/types.ts';

export default function TableList() {
  const schema = useSchemaStore((s) => s.schema);
  const selectedTableId = useCanvasStore((s) => s.selectedTableId);
  const setSelectedTable = useCanvasStore((s) => s.setSelectedTable);
  const nodes = useCanvasStore((s) => s.nodes);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const hiddenGroups = useExploreStore((s) => s.hiddenGroups);
  const toggleGroupVisibility = useExploreStore((s) => s.toggleGroupVisibility);
  const showAllGroups = useExploreStore((s) => s.showAllGroups);

  const [allCollapsed, setAllCollapsed] = useState(false);
  const [collapseKey, setCollapseKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) setSearchQuery('');
  }, [searchOpen]);

  const handleTableClick = (tableId: string) => {
    setSelectedTable(tableId);
    const node = nodes.get(tableId);
    if (node) {
      const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = 1;
        setTransform({
          x: rect.width / 2 - (node.position.x + node.size.width / 2) * scale,
          y: rect.height / 2 - (node.position.y + node.size.height / 2) * scale,
          scale,
        });
      }
    }
  };

  const handleToggleAll = useCallback(() => {
    setAllCollapsed((prev) => !prev);
    setCollapseKey((k) => k + 1);
  }, []);

  const groups: { name: string; color: string; tables: SchemaTable[] }[] = [];
  const ungrouped: SchemaTable[] = [];

  if (schema) {
    const grouped = new Set<string>();
    for (const grp of schema.tableGroups) {
      const grpTables: SchemaTable[] = [];
      for (const tid of grp.tables) {
        const t = schema.tables.find((tb) => tb.id === tid);
        if (t) {
          grpTables.push(t);
          grouped.add(t.id);
        }
      }
      if (grpTables.length > 0) {
        groups.push({ name: grp.name, color: grp.color ?? '#5c6078', tables: grpTables });
      }
    }
    for (const t of schema.tables) {
      if (!grouped.has(t.id)) ungrouped.push(t);
    }
  }

  const hasGroups = groups.length > 0;

  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredGroups = useMemo(() => {
    if (!lowerQuery) return groups;
    return groups
      .map((grp) => ({
        ...grp,
        tables: grp.tables.filter((t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.columns.some((c) => c.name.toLowerCase().includes(lowerQuery))
        ),
      }))
      .filter((grp) => grp.tables.length > 0 || grp.name.toLowerCase().includes(lowerQuery));
  }, [groups, lowerQuery]);

  const filteredUngrouped = useMemo(() => {
    if (!lowerQuery) return ungrouped;
    return ungrouped.filter((t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.columns.some((c) => c.name.toLowerCase().includes(lowerQuery))
    );
  }, [ungrouped, lowerQuery]);

  const filteredTotal = filteredGroups.reduce((s, g) => s + g.tables.length, 0) + filteredUngrouped.length;

  return (
    <div
      className="flex flex-col w-[240px] flex-shrink-0 overflow-hidden select-none"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
    >
      {/* Header */}
      <div
        className="flex items-center px-3 h-10 text-[11px] font-semibold uppercase tracking-wider flex-shrink-0"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        <span>Tables</span>
        {schema && (
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: 'var(--text-muted)', marginLeft: 6 }}
          >
            ({schema.tables.length})
          </span>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {schema && (
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer"
              style={{
                color: searchOpen ? 'var(--accent)' : 'var(--text-muted)',
                background: searchOpen ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { if (!searchOpen) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              onMouseLeave={(e) => { if (!searchOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              title="Search tables (Ctrl+F)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}

          {hasGroups && (
            <button
              onClick={handleToggleAll}
              className="flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer"
              style={{ color: 'var(--text-muted)', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title={allCollapsed ? 'Expand all groups' : 'Collapse all groups'}
            >
              {allCollapsed ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="7 13 12 18 17 13" />
                  <polyline points="7 6 12 11 17 6" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="17 11 12 6 7 11" />
                  <polyline points="17 18 12 13 7 18" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0" style={{ opacity: 0.5 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tables..."
            className="flex-1 bg-transparent text-[11px] outline-none"
            style={{ color: 'var(--text-primary)' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
              }
            }}
          />
          {searchQuery && (
            <span className="text-[9px] tabular-nums font-bold flex-shrink-0 px-1.5 py-px rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              {filteredTotal}
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex-shrink-0 cursor-pointer rounded-md p-0.5"
              style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Hidden groups bar */}
      {hasGroups && hiddenGroups.size > 0 && (
        <div
          className="flex items-center gap-1.5 px-3 py-2 text-[10px]"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--accent-subtle)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <span style={{ color: 'var(--text-muted)' }}>
            {hiddenGroups.size} hidden
          </span>
          <button
            onClick={showAllGroups}
            className="ml-auto text-[10px] font-semibold cursor-pointer"
            style={{ color: 'var(--accent)', transition: 'opacity 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Show all
          </button>
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 py-1 px-2 overflow-y-auto">
        {filteredGroups.map((grp) => (
          <GroupSection
            key={grp.name}
            name={grp.name}
            color={grp.color}
            tables={grp.tables}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
            hidden={hiddenGroups.has(grp.name)}
            onToggleVisibility={() => toggleGroupVisibility(grp.name)}
            forceCollapsed={allCollapsed}
            collapseKey={collapseKey}
            searchQuery={lowerQuery}
          />
        ))}

        {filteredUngrouped.length > 0 && hasGroups && (
          <GroupSection
            name="Ungrouped"
            color="#5c6078"
            tables={filteredUngrouped}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
            forceCollapsed={allCollapsed}
            collapseKey={collapseKey}
            searchQuery={lowerQuery}
          />
        )}

        {filteredUngrouped.length > 0 && !hasGroups && (
          filteredUngrouped.map((table) => (
            <TableRow
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onClick={() => handleTableClick(table.id)}
              searchQuery={lowerQuery}
            />
          ))
        )}

        {schema && lowerQuery && filteredTotal === 0 && (
          <div className="px-4 py-8 text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2" style={{ opacity: 0.3 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            No matching tables
          </div>
        )}

        {!schema && (
          <div className="px-4 py-8 text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            No tables yet
          </div>
        )}
      </div>
    </div>
  );
}

function GroupSection({
  name, color, tables, selectedTableId, onTableClick, hidden, onToggleVisibility,
  forceCollapsed, collapseKey, searchQuery,
}: {
  name: string;
  color: string;
  tables: SchemaTable[];
  selectedTableId: string | null;
  onTableClick: (id: string) => void;
  hidden?: boolean;
  onToggleVisibility?: () => void;
  forceCollapsed?: boolean;
  collapseKey?: number;
  searchQuery?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (collapseKey !== undefined && collapseKey > 0) {
      setCollapsed(!!forceCollapsed);
    }
  }, [collapseKey, forceCollapsed]);

  const isSearching = !!searchQuery;
  const isOpen = isSearching ? true : (!collapsed && !hidden);

  return (
    <div
      className="mt-1"
      style={{ opacity: hidden ? 0.35 : 1, transition: 'opacity 0.15s' }}
    >
      {/* Group header */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-[6px] rounded-lg text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {onToggleVisibility && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="flex-shrink-0 cursor-pointer rounded-md p-0.5"
            title={hidden ? 'Show group' : 'Hide group'}
            style={{ color: hidden ? 'var(--text-muted)' : color, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-active)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {hidden ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          <svg
            width="8" height="8" viewBox="0 0 24 24" fill="currentColor"
            style={{
              transform: (collapsed && !isSearching) ? 'rotate(0deg)' : 'rotate(90deg)',
              transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
              flexShrink: 0,
            }}
          >
            <path d="M8 4l8 8-8 8z" />
          </svg>
          <svg
            width="13" height="11" viewBox="0 0 16 13" fill="currentColor"
            className="flex-shrink-0"
            style={{ color }}
          >
            <path d="M1.5 2.5h4.2l1.3-1.3a1 1 0 0 1 .7-.3H14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H1.5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"/>
          </svg>
          <span className="truncate">{name}</span>
          <span
            className="ml-auto text-[9px] flex-shrink-0 font-bold tabular-nums px-1.5 py-px rounded"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          >
            {tables.length}
          </span>
        </button>
      </div>

      {/* Table items with tree connector */}
      {isOpen && (
        <div
          className="ml-[14px] mt-px pl-2.5"
          style={{ borderLeft: `2px solid ${color.startsWith('#') ? color + '25' : 'var(--border-color)'}` }}
        >
          {tables.map((table) => (
            <TableRow
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onClick={() => onTableClick(table.id)}
              accentColor={color}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: 'var(--warning-muted)', color: 'var(--warning)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

function TableRow({
  table, isSelected, onClick, accentColor, searchQuery,
}: {
  table: SchemaTable;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: string;
  searchQuery?: string;
}) {
  const matchedColumn = searchQuery
    ? table.columns.find((c) => c.name.toLowerCase().includes(searchQuery) && !table.name.toLowerCase().includes(searchQuery))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-2 px-3 py-[5px] text-[11px] text-left cursor-pointer rounded-lg relative"
      style={{
        color: isSelected ? (accentColor ?? 'var(--accent)') : 'var(--text-secondary)',
        background: isSelected ? 'var(--accent-subtle)' : 'transparent',
        fontWeight: isSelected ? 600 : 400,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
      }}
    >
      {isSelected && (
        <div
          className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-r"
          style={{ background: accentColor ?? 'var(--accent)' }}
        />
      )}
      <svg
        width="11" height="11" viewBox="0 0 12 12" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        className="flex-shrink-0 mt-[0px]"
        style={{ color: accentColor ?? 'var(--text-muted)', opacity: isSelected ? 1 : 0.45 }}
      >
        <rect x="1" y="1.5" width="10" height="9" rx="1.5"/>
        <line x1="1" y1="5" x2="11" y2="5"/>
        <line x1="4.5" y1="5" x2="4.5" y2="10.5"/>
      </svg>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate">
          <HighlightText text={table.name} query={searchQuery} />
        </span>
        {matchedColumn && (
          <span className="truncate text-[9px] mt-px" style={{ color: 'var(--text-muted)' }}>
            ↳ <HighlightText text={matchedColumn.name} query={searchQuery} />
          </span>
        )}
      </div>
      <span
        className="ml-1 text-[9px] font-bold px-1.5 py-px rounded tabular-nums flex-shrink-0 mt-px"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', minWidth: 16, textAlign: 'center' }}
      >
        {table.columns.length}
      </span>
    </button>
  );
}
