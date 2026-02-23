import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import type { SchemaTable } from '../../core/schema/types.ts';

interface DocsSidebarProps {
  activeTableId: string | null;
  activeEnumName: string | null;
  onSelectTable: (tableId: string) => void;
  onSelectEnum: (enumName: string) => void;
  onOverview: () => void;
  onOpenSearch: () => void;
}

export default function DocsSidebar({
  activeTableId,
  activeEnumName,
  onSelectTable,
  onSelectEnum,
  onOverview,
  onOpenSearch,
}: DocsSidebarProps) {
  const schema = useSchemaStore((s) => s.schema);
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

  const handleToggleAll = useCallback(() => {
    setAllCollapsed((prev) => !prev);
    setCollapseKey((k) => k + 1);
  }, []);

  if (!schema) return null;

  const { tables, enums, tableGroups } = schema;

  const groupedTables = new Map<string, SchemaTable[]>();
  const ungrouped: SchemaTable[] = [];

  for (const t of tables) {
    if (t.groupName) {
      const list = groupedTables.get(t.groupName) ?? [];
      list.push(t);
      groupedTables.set(t.groupName, list);
    } else {
      ungrouped.push(t);
    }
  }

  const hasGroups = tableGroups.length > 0;
  const isOverview = !activeTableId && !activeEnumName;

  const lowerQuery = searchQuery.toLowerCase().trim();

  const filteredGroups = tableGroups
    .map((grp) => {
      const tblsInGroup = groupedTables.get(grp.name) ?? [];
      const filtered = lowerQuery
        ? tblsInGroup.filter((t) =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.columns.some((c) => c.name.toLowerCase().includes(lowerQuery))
          )
        : tblsInGroup;
      return { ...grp, tables: filtered };
    })
    .filter((grp) => grp.tables.length > 0 || (lowerQuery && grp.name.toLowerCase().includes(lowerQuery)));

  const filteredUngrouped = lowerQuery
    ? ungrouped.filter((t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.columns.some((c) => c.name.toLowerCase().includes(lowerQuery))
      )
    : ungrouped;

  const filteredTotal = filteredGroups.reduce((s, g) => s + g.tables.length, 0) + filteredUngrouped.length;

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-hidden select-none"
      style={{
        width: 240,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-3 h-10 text-[11px] font-semibold uppercase tracking-wider flex-shrink-0"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        <span>Tables</span>
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color: 'var(--text-muted)', marginLeft: 6 }}
        >
          ({tables.length})
        </span>

        <div className="ml-auto flex items-center gap-0.5">
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

          <button
            onClick={onOpenSearch}
            className="flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer"
            style={{ color: 'var(--text-muted)', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            title="Global search (⌘K)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </button>
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

      {/* Overview */}
      <div className="px-2 mt-1 mb-0.5">
        <button
          onClick={onOverview}
          className="flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[11px] font-semibold cursor-pointer relative"
          style={{
            background: isOverview ? 'var(--accent-subtle)' : 'transparent',
            color: isOverview ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isOverview) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }
          }}
          onMouseLeave={(e) => {
            if (!isOverview) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
          }}
        >
          {isOverview && <div className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-r" style={{ background: 'var(--accent)' }} />}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Overview
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 mt-1">
        {filteredGroups.map((grp) => {
          const color = grp.color ?? 'var(--accent)';
          return (
            <GroupSection
              key={grp.name}
              name={grp.name}
              color={color}
              tables={grp.tables}
              activeTableId={activeTableId}
              onSelectTable={onSelectTable}
              forceCollapsed={allCollapsed}
              collapseKey={collapseKey}
              searchQuery={lowerQuery}
            />
          );
        })}

        {filteredUngrouped.length > 0 && (
          <div className="mt-2">
            <div className="px-2.5 py-[6px] text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tables
            </div>
            {filteredUngrouped.map((t) => (
              <TableItem
                key={t.id}
                table={t}
                active={activeTableId === t.id}
                color="var(--text-muted)"
                onClick={() => onSelectTable(t.id)}
                searchQuery={lowerQuery}
              />
            ))}
          </div>
        )}

        {enums.length > 0 && (
          <div className="mt-3">
            <div className="px-2.5 py-[6px] text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Enums
            </div>
            {enums.map((en) => (
              <button
                key={en.name}
                onClick={() => onSelectEnum(en.name)}
                className="flex items-center gap-2 w-full px-3 py-[5px] rounded-lg text-[11px] cursor-pointer relative"
                style={{
                  background: activeEnumName === en.name ? 'var(--accent-subtle)' : 'transparent',
                  color: activeEnumName === en.name ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: activeEnumName === en.name ? 600 : 400,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => { if (activeEnumName !== en.name) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={(e) => { if (activeEnumName !== en.name) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                {activeEnumName === en.name && (
                  <div className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-r" style={{ background: 'var(--accent)' }} />
                )}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="truncate">{en.name}</span>
                <span
                  className="ml-auto text-[9px] font-bold px-1.5 py-px rounded tabular-nums flex-shrink-0"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                >
                  {en.values.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {lowerQuery && filteredTotal === 0 && (
          <div className="px-4 py-8 text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2" style={{ opacity: 0.3 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            No matching tables
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2.5 text-[10px] flex-shrink-0 tabular-nums flex items-center gap-1"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{tables.length}</span> tables
        <span style={{ opacity: 0.3 }}>&middot;</span>
        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{schema.refs.length}</span> refs
        {enums.length > 0 && (
          <>
            <span style={{ opacity: 0.3 }}>&middot;</span>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{enums.length}</span> enums
          </>
        )}
      </div>
    </aside>
  );
}

function GroupSection({
  name, color, tables, activeTableId, onSelectTable,
  forceCollapsed, collapseKey, searchQuery,
}: {
  name: string;
  color: string;
  tables: SchemaTable[];
  activeTableId: string | null;
  onSelectTable: (tableId: string) => void;
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
  const isOpen = isSearching ? true : !collapsed;

  return (
    <div className="mt-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-2.5 py-[6px] rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        style={{ color: 'var(--text-muted)', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="truncate">{name}</span>
        <span
          className="ml-auto text-[9px] flex-shrink-0 font-bold tabular-nums px-1.5 py-px rounded"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
        >
          {tables.length}
        </span>
      </button>

      {isOpen && (
        <div
          className="ml-[14px] mt-px pl-2.5"
          style={{ borderLeft: `2px solid ${color.startsWith('#') ? color + '25' : 'var(--border-color)'}` }}
        >
          {tables.map((t) => (
            <TableItem
              key={t.id}
              table={t}
              active={activeTableId === t.id}
              color={color}
              onClick={() => onSelectTable(t.id)}
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

function TableItem({ table, active, color, onClick, searchQuery }: {
  table: SchemaTable;
  active: boolean;
  color: string;
  onClick: () => void;
  searchQuery?: string;
}) {
  const lowerQuery = searchQuery?.toLowerCase().trim();
  const matchedColumn = lowerQuery
    ? table.columns.find((c) => c.name.toLowerCase().includes(lowerQuery) && !table.name.toLowerCase().includes(lowerQuery))
    : null;

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2 w-full px-3 py-[5px] rounded-lg text-[11px] cursor-pointer relative"
      style={{
        background: active ? 'var(--accent-subtle)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      {active && (
        <div className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-r" style={{ background: 'var(--accent)' }} />
      )}
      <span
        className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[5px]"
        style={{ background: color, opacity: active ? 1 : 0.35 }}
      />
      <div className="flex flex-col flex-1 min-w-0 text-left">
        <span className="truncate">
          <HighlightText text={table.name} query={lowerQuery} />
        </span>
        {matchedColumn && (
          <span className="truncate text-[9px] mt-px" style={{ color: 'var(--text-muted)' }}>
            ↳ <HighlightText text={matchedColumn.name} query={lowerQuery} />
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
