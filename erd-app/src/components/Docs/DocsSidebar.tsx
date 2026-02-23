import { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!schema) return null;

  const { tables, enums, tableGroups } = schema;

  const groupedTables = new Map<string, typeof tables>();
  const ungrouped: typeof tables = [];

  for (const t of tables) {
    if (t.groupName) {
      const list = groupedTables.get(t.groupName) ?? [];
      list.push(t);
      groupedTables.set(t.groupName, list);
    } else {
      ungrouped.push(t);
    }
  }

  const toggleGroup = (name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-hidden select-none"
      style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Search */}
      <div className="p-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search...</span>
          <kbd className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Overview */}
      <div className="px-3 mb-1">
        <button
          onClick={onOverview}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          style={{
            background: (!activeTableId && !activeEnumName) ? 'var(--bg-hover)' : 'transparent',
            color: (!activeTableId && !activeEnumName) ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => {
            if (activeTableId || activeEnumName) e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Overview
        </button>
      </div>

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tableGroups.map((grp) => {
          const isOpen = !collapsed[grp.name];
          const tblsInGroup = groupedTables.get(grp.name) ?? [];
          const color = grp.color ?? 'var(--accent)';
          return (
            <div key={grp.name} className="mt-3">
              <button
                onClick={() => toggleGroup(grp.name)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg
                  width="8" height="8" viewBox="0 0 24 24" fill="currentColor"
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
                >
                  <path d="M8 4l8 8-8 8z" />
                </svg>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="truncate">{grp.name}</span>
                <span className="ml-auto text-[10px] flex-shrink-0 opacity-60">
                  {tblsInGroup.length}
                </span>
              </button>
              {isOpen && (
                <div className="ml-3 mt-0.5 pl-2" style={{ borderLeft: `2px solid ${color.startsWith('#') ? color + '40' : 'var(--border-color)'}` }}>
                  {tblsInGroup.map((t) => (
                    <TableItem
                      key={t.id}
                      name={t.name}
                      active={activeTableId === t.id}
                      color={color}
                      onClick={() => onSelectTable(t.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped */}
        {ungrouped.length > 0 && (
          <div className="mt-4">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tables
            </div>
            {ungrouped.map((t) => (
              <TableItem
                key={t.id}
                name={t.name}
                active={activeTableId === t.id}
                color="var(--text-muted)"
                onClick={() => onSelectTable(t.id)}
              />
            ))}
          </div>
        )}

        {/* Enums */}
        {enums.length > 0 && (
          <div className="mt-4">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Enums
            </div>
            {enums.map((en) => (
              <button
                key={en.name}
                onClick={() => onSelectEnum(en.name)}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer"
                style={{
                  background: activeEnumName === en.name ? 'var(--bg-hover)' : 'transparent',
                  color: activeEnumName === en.name ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => {
                  if (activeEnumName !== en.name) e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="truncate">{en.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 text-[10px] flex-shrink-0"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
      >
        {tables.length} tables &middot; {schema.refs.length} relationships
        {enums.length > 0 && ` \u00b7 ${enums.length} enums`}
      </div>
    </aside>
  );
}

function TableItem({ name, active, color, onClick }: {
  name: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[12px] transition-all cursor-pointer"
      style={{
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: active ? 1 : 0.5 }} />
      <span className="truncate">{name}</span>
    </button>
  );
}
