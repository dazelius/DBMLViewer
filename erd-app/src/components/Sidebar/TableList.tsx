import { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';
import type { SchemaTable } from '../../core/schema/types.ts';

export default function TableList() {
  const schema = useSchemaStore((s) => s.schema);
  const selectedTableId = useCanvasStore((s) => s.selectedTableId);
  const setSelectedTable = useCanvasStore((s) => s.setSelectedTable);
  const nodes = useCanvasStore((s) => s.nodes);
  const transform = useCanvasStore((s) => s.transform);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const hiddenGroups = useExploreStore((s) => s.hiddenGroups);
  const toggleGroupVisibility = useExploreStore((s) => s.toggleGroupVisibility);
  const showAllGroups = useExploreStore((s) => s.showAllGroups);

  const handleTableClick = (tableId: string) => {
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
  };

  // Organize tables by group
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
        groups.push({ name: grp.name, color: grp.color ?? '#555672', tables: grpTables });
      }
    }
    for (const t of schema.tables) {
      if (!grouped.has(t.id)) ungrouped.push(t);
    }
  }

  return (
    <div
      className="flex flex-col w-[210px] flex-shrink-0 overflow-y-auto"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
    >
      <div
        className="flex items-center px-3 h-8 text-xs font-medium flex-shrink-0"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        Tables
        {schema && (
          <span
            className="ml-auto text-[10px] px-1.5 rounded"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          >
            {schema.tables.length}
          </span>
        )}
      </div>

      {/* Group filter bar */}
      {groups.length > 0 && hiddenGroups.size > 0 && (
        <div
          className="flex items-center gap-1 px-3 py-1.5 text-[10px]"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {hiddenGroups.size} group{hiddenGroups.size > 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={showAllGroups}
            className="ml-auto text-[10px] font-medium cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            Show all
          </button>
        </div>
      )}

      <div className="flex-1 py-1 overflow-y-auto">
        {groups.map((grp) => (
          <GroupSection
            key={grp.name}
            name={grp.name}
            color={grp.color}
            tables={grp.tables}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
            hidden={hiddenGroups.has(grp.name)}
            onToggleVisibility={() => toggleGroupVisibility(grp.name)}
          />
        ))}

        {ungrouped.length > 0 && groups.length > 0 && (
          <GroupSection
            name="Ungrouped"
            color="#555672"
            tables={ungrouped}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
          />
        )}

        {ungrouped.length > 0 && groups.length === 0 && (
          ungrouped.map((table) => (
            <TableRow
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onClick={() => handleTableClick(table.id)}
            />
          ))
        )}

        {!schema && (
          <div className="px-3 py-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            No tables yet
          </div>
        )}
      </div>
    </div>
  );
}

function GroupSection({
  name, color, tables, selectedTableId, onTableClick, hidden, onToggleVisibility,
}: {
  name: string;
  color: string;
  tables: SchemaTable[];
  selectedTableId: string | null;
  onTableClick: (id: string) => void;
  hidden?: boolean;
  onToggleVisibility?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-0.5" style={{ opacity: hidden ? 0.4 : 1 }}>
      <div
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold"
        style={{ color: color }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Visibility toggle */}
        {onToggleVisibility && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="flex-shrink-0 cursor-pointer"
            title={hidden ? 'Show group' : 'Hide group'}
            style={{ color: hidden ? 'var(--text-muted)' : color }}
          >
            {hidden ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="truncate">{name}</span>
          <span className="ml-auto text-[9px] font-normal" style={{ color: 'var(--text-muted)' }}>
            {tables.length}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {!collapsed && !hidden && tables.map((table) => (
        <TableRow
          key={table.id}
          table={table}
          isSelected={selectedTableId === table.id}
          onClick={() => onTableClick(table.id)}
          accentColor={color}
        />
      ))}
    </div>
  );
}

function TableRow({
  table, isSelected, onClick, accentColor,
}: {
  table: SchemaTable;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 pl-6 pr-3 py-1 text-[11px] text-left transition-colors cursor-pointer"
      style={{
        color: isSelected ? (accentColor ?? 'var(--accent)') : 'var(--text-secondary)',
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: accentColor ?? 'var(--text-muted)' }}
      />
      <span className="truncate">{table.name}</span>
      <span className="ml-auto text-[9px]" style={{ color: 'var(--text-muted)' }}>
        {table.columns.length}
      </span>
    </button>
  );
}
