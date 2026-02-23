import { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import type { SchemaTable } from '../../core/schema/types.ts';

export default function TableList() {
  const schema = useSchemaStore((s) => s.schema);
  const selectedTableId = useCanvasStore((s) => s.selectedTableId);
  const setSelectedTable = useCanvasStore((s) => s.setSelectedTable);
  const nodes = useCanvasStore((s) => s.nodes);
  const transform = useCanvasStore((s) => s.transform);
  const setTransform = useCanvasStore((s) => s.setTransform);

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

      <div className="flex-1 py-1 overflow-y-auto">
        {groups.map((grp) => (
          <GroupSection
            key={grp.name}
            name={grp.name}
            color={grp.color}
            tables={grp.tables}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
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
  name, color, tables, selectedTableId, onTableClick,
}: {
  name: string;
  color: string;
  tables: SchemaTable[];
  selectedTableId: string | null;
  onTableClick: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer"
        style={{ color: color }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
      {!collapsed && tables.map((table) => (
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
