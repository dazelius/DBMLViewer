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

  const groupColor = table.groupColor ?? '#89b4fa';
  const isHexColor = groupColor.startsWith('#');

  return (
    <div className="p-10 docs-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-8">
        {table.groupName && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isHexColor ? `${groupColor}18` : 'rgba(137,180,250,0.12)',
                color: groupColor,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: groupColor }} />
              {table.groupName}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {table.name}
        </h1>
        {table.note && (
          <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{table.note}</p>
        )}
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
                    className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col) => (
                <DocsFieldRow
                  key={col.name}
                  column={col}
                  onRefClick={onNavigate}
                  refTarget={refTargetMap.get(col.name) ?? null}
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
                      className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.indexes.map((idx, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                      ({idx.columns.join(', ')})
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {idx.type ?? 'btree'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {idx.isPrimaryKey && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(250,179,135,0.15)', color: 'var(--warning)' }}>PK</span>
                        )}
                        {idx.isUnique && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(166,227,161,0.15)', color: 'var(--success)' }}>UNIQUE</span>
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
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', height: 380 }}>
            <DocsMiniERD tableId={tableId} />
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {count !== undefined && (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-semibold"
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
      className="flex items-center gap-3 px-5 py-3 rounded-lg transition-colors"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <span
        className="px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
        style={{
          background: isOut ? 'rgba(137,180,250,0.12)' : 'rgba(166,227,161,0.12)',
          color: isOut ? 'var(--accent)' : 'var(--success)',
        }}
      >
        {isOut ? 'OUT' : 'IN'}
      </span>
      <span
        className="font-mono text-[12px] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span className="text-[10px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {typeLabel}
      </span>
      <button
        onClick={() => onNavigate(targetId)}
        className="text-[11px] font-semibold cursor-pointer transition-colors flex-shrink-0 px-2.5 py-1 rounded"
        style={{ color: 'var(--accent)', background: 'rgba(137,180,250,0.1)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(137,180,250,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(137,180,250,0.1)'; }}
      >
        {targetTable.name} &rarr;
      </button>
    </div>
  );
}
