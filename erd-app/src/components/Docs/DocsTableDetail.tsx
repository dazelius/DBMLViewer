import { useSchemaStore } from '../../store/useSchemaStore.ts';
import DocsFieldRow from './DocsFieldRow.tsx';
import DocsMiniERD from './DocsMiniERD.tsx';
import type { SchemaRef, SchemaTable } from '../../core/schema/types.ts';

interface DocsTableDetailProps {
  tableId: string;
  onNavigate: (tableId: string) => void;
}

export default function DocsTableDetail({ tableId, onNavigate }: DocsTableDetailProps) {
  const schema = useSchemaStore((s) => s.schema);
  if (!schema) return null;

  const table = schema.tables.find((t) => t.id === tableId);
  if (!table) {
    return (
      <div className="p-10">
        <p style={{ color: 'var(--text-muted)' }}>Table not found: {tableId}</p>
      </div>
    );
  }

  const incomingRefs = schema.refs.filter((r) => r.toTable === tableId);
  const outgoingRefs = schema.refs.filter((r) => r.fromTable === tableId);
  const allRefs = schema.refs.filter((r) => r.fromTable === tableId || r.toTable === tableId);

  const refTargetMap = new Map<string, { tableId: string; tableName: string; columnName: string }>();
  for (const ref of outgoingRefs) {
    const targetTable = schema.tables.find((t) => t.id === ref.toTable);
    if (targetTable) {
      for (const col of ref.fromColumns) {
        refTargetMap.set(col, {
          tableId: ref.toTable,
          tableName: targetTable.name,
          columnName: ref.toColumns[0] ?? '',
        });
      }
    }
  }

  const groupColor = table.groupColor ?? 'var(--accent)';
  const pkCount = table.columns.filter((c) => c.isPrimaryKey).length;
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;

  return (
    <div className="p-8 lg:p-10 docs-fade-in" style={{ maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-8">
        {table.groupName && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: groupColor.startsWith('#') ? `${groupColor}12` : 'var(--accent-muted)',
                color: groupColor,
                border: `1px solid ${groupColor.startsWith('#') ? groupColor + '20' : 'var(--border-color)'}`,
              }}
            >
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: groupColor }} />
              {table.groupName}
            </span>
          </div>
        )}
        <h1 className="text-[24px] font-bold mb-1.5 tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {table.name}
        </h1>
        {table.note && (
          <p className="text-[13px] mt-2 leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>{table.note}</p>
        )}

        {/* Quick summary chips */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <SummaryChip label={`${table.columns.length} columns`} />
          {pkCount > 0 && <SummaryChip label={`${pkCount} primary key${pkCount > 1 ? 's' : ''}`} color="var(--warning)" />}
          {fkCount > 0 && <SummaryChip label={`${fkCount} foreign key${fkCount > 1 ? 's' : ''}`} color="var(--accent)" />}
          {allRefs.length > 0 && <SummaryChip label={`${allRefs.length} reference${allRefs.length > 1 ? 's' : ''}`} />}
          {table.indexes.length > 0 && <SummaryChip label={`${table.indexes.length} index${table.indexes.length > 1 ? 'es' : ''}`} />}
        </div>
      </div>

      {/* Fields */}
      <Section title="Fields" count={table.columns.length}>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Name', 'Type', 'Constraints', 'References', 'Note'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col, i) => (
                <DocsFieldRow
                  key={col.name}
                  column={col}
                  onRefClick={onNavigate}
                  refTarget={refTargetMap.get(col.name) ?? null}
                  isLast={i === table.columns.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Indexes */}
      {table.indexes.length > 0 && (
        <Section title="Indexes" count={table.indexes.length}>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['Columns', 'Type', 'Properties'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.indexes.map((idx, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < table.indexes.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td className="px-5 py-3.5">
                      <code
                        className="text-[11px] px-2 py-0.5 rounded-md inline-block"
                        style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      >
                        ({idx.columns.join(', ')})
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {idx.type ?? 'btree'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {idx.isPrimaryKey && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>PK</span>
                        )}
                        {idx.isUnique && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>UNIQUE</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* References */}
      {allRefs.length > 0 && (
        <Section title="References" count={allRefs.length}>
          <div className="space-y-2">
            {outgoingRefs.map((ref, i) => (
              <RefRow key={`out-${i}`} ref_={ref} direction="outgoing" tables={schema.tables} onNavigate={onNavigate} />
            ))}
            {incomingRefs.map((ref, i) => (
              <RefRow key={`in-${i}`} ref_={ref} direction="incoming" tables={schema.tables} onNavigate={onNavigate} />
            ))}
          </div>
        </Section>
      )}

      {/* Mini ERD */}
      {allRefs.length > 0 && (
        <Section title="Table References">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', height: 550 }}>
            <DocsMiniERD tableId={tableId} />
          </div>
        </Section>
      )}
    </div>
  );
}

function SummaryChip({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
      style={{
        background: color ? `${color}12` : 'var(--bg-surface)',
        color: color ?? 'var(--text-muted)',
        border: `1px solid ${color ? color + '20' : 'var(--border-color)'}`,
      }}
    >
      {label}
    </span>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {count !== undefined && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-bold tabular-nums"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function RefRow({ ref_, direction, tables, onNavigate }: {
  ref_: SchemaRef;
  direction: 'incoming' | 'outgoing';
  tables: SchemaTable[];
  onNavigate: (tableId: string) => void;
}) {
  const targetId = direction === 'outgoing' ? ref_.toTable : ref_.fromTable;
  const targetTable = tables.find((t) => t.id === targetId);
  if (!targetTable) return null;

  const fromCols = ref_.fromColumns.join(', ');
  const toCols = ref_.toColumns.join(', ');
  const arrow = direction === 'outgoing' ? '\u2192' : '\u2190';
  const label = direction === 'outgoing'
    ? `${fromCols} ${arrow} ${targetTable.name}.${toCols}`
    : `${targetTable.name}.${fromCols} ${arrow} ${toCols}`;

  const typeLabel = ref_.type.replace(/-/g, ':');
  const isOut = direction === 'outgoing';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        const c = isOut ? 'var(--accent)' : 'var(--success)';
        e.currentTarget.style.borderColor = c;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${isOut ? 'var(--accent)' : 'var(--success)'}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        className="px-2 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0 tracking-wide"
        style={{
          background: isOut ? 'var(--accent-muted)' : 'var(--success-muted)',
          color: isOut ? 'var(--accent)' : 'var(--success)',
        }}
      >
        {isOut ? 'OUT' : 'IN'}
      </span>
      <span
        className="text-[12px] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span className="text-[10px] font-medium flex-shrink-0 tabular-nums px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
        {typeLabel}
      </span>
      <button
        onClick={() => onNavigate(targetId)}
        className="text-[11px] font-semibold cursor-pointer flex-shrink-0 px-2.5 py-1 rounded-lg"
        style={{
          color: 'var(--accent)',
          background: 'var(--accent-muted)',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
      >
        {targetTable.name} &rarr;
      </button>
    </div>
  );
}
