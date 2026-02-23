import { useSchemaStore } from '../../store/useSchemaStore.ts';
import type { SchemaTable, SchemaRef } from '../../core/schema/types.ts';

interface DocsOverviewProps {
  onSelectTable: (tableId: string) => void;
}

export default function DocsOverview({ onSelectTable }: DocsOverviewProps) {
  const schema = useSchemaStore((s) => s.schema);
  if (!schema) return null;

  const { tables, refs, enums, tableGroups } = schema;
  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

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

  return (
    <div className="p-10 docs-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Database Schema
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Documentation generated from DBML
        </p>
      </div>

      {/* Stats - horizontal strip */}
      <div
        className="flex items-stretch gap-px mb-10 rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-color)' }}
      >
        <StatCell label="Tables" value={tables.length} />
        <StatCell label="Columns" value={totalColumns} />
        <StatCell label="Relationships" value={refs.length} />
        <StatCell label="Enums" value={enums.length} />
      </div>

      {/* Groups */}
      {tableGroups.map((grp) => {
        const tblsInGroup = groupedTables.get(grp.name) ?? [];
        if (tblsInGroup.length === 0) return null;
        const color = grp.color ?? '#89b4fa';
        return (
          <section key={grp.name} className="mb-10">
            <GroupHeader name={grp.name} count={tblsInGroup.length} color={color} />
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
            >
              {tblsInGroup.map((t) => (
                <TableCard key={t.id} table={t} color={color} onClick={() => onSelectTable(t.id)} refs={refs} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <section className="mb-10">
          <GroupHeader name="Ungrouped Tables" count={ungrouped.length} color="#6c7086" />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
          >
            {ungrouped.map((t) => (
              <TableCard key={t.id} table={t} color="#6c7086" onClick={() => onSelectTable(t.id)} refs={refs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupHeader({ name, count, color }: { name: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
        {name}
      </h2>
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {count} tables
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 px-6 py-5 text-center" style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function TableCard({ table, color, onClick, refs }: {
  table: SchemaTable;
  color: string;
  onClick: () => void;
  refs: SchemaRef[];
}) {
  const relCount = refs.filter((r) => r.fromTable === table.id || r.toTable === table.id).length;
  const pkCount = table.columns.filter((c) => c.isPrimaryKey).length;
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl text-left transition-all cursor-pointer"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        minHeight: 100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Top accent line */}
      <div className="w-8 h-0.5 rounded-full mb-3" style={{ background: color }} />

      {/* Table name */}
      <div
        className="font-bold text-[14px] leading-snug mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: 'var(--text-primary)' }}
      >
        {table.name}
      </div>

      {/* Note */}
      {table.note && (
        <div
          className="text-[11px] leading-relaxed mb-3 overflow-hidden"
          style={{
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {table.note}
        </div>
      )}

      {/* Meta - pushed to bottom */}
      <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
        <MetaTag label={`${table.columns.length} cols`} />
        {pkCount > 0 && <MetaTag label={`${pkCount} PK`} accent />}
        {fkCount > 0 && <MetaTag label={`${fkCount} FK`} highlight />}
        {relCount > 0 && <MetaTag label={`${relCount} refs`} />}
      </div>
    </button>
  );
}

function MetaTag({ label, accent, highlight }: { label: string; accent?: boolean; highlight?: boolean }) {
  let bg = 'var(--bg-surface)';
  let fg = 'var(--text-muted)';
  let borderColor = 'var(--border-color)';

  if (accent) {
    bg = 'rgba(250,179,135,0.12)';
    fg = 'var(--warning)';
    borderColor = 'rgba(250,179,135,0.25)';
  } else if (highlight) {
    bg = 'rgba(137,180,250,0.12)';
    fg = 'var(--accent)';
    borderColor = 'rgba(137,180,250,0.25)';
  }

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded"
      style={{ background: bg, color: fg, border: `1px solid ${borderColor}` }}
    >
      {label}
    </span>
  );
}
