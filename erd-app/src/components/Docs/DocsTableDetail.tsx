import { useState, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
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

  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const tableDataStore = useCanvasStore((s) => s.tableData);
  const groupColor = table.groupColor ?? 'var(--accent)';
  const pkCount = table.columns.filter((c) => c.isPrimaryKey).length;
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;
  const rowCount = heatmapData.get(table.name.toLowerCase());

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
          {rowCount !== undefined && <SummaryChip label={`${rowCount.toLocaleString()} data rows`} color="#3b82f6" />}
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

      {/* Data Preview */}
      {tableDataStore.has(table.name.toLowerCase()) && (
        <DataPreview
          tableName={table.name}
          data={tableDataStore.get(table.name.toLowerCase())!}
        />
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

const PAGE_SIZE = 50;

function DataPreview({ tableName, data }: { tableName: string; data: { headers: string[]; rows: Record<string, string>[] } }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let rows = data.rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => data.headers.some((h) => (r[h] ?? '').toLowerCase().includes(q)));
    }
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const va = a[sortCol] ?? '';
        const vb = b[sortCol] ?? '';
        const na = Number(va);
        const nb = Number(vb);
        if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return rows;
  }, [data, search, sortCol, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setPage(0);
  };

  return (
    <Section title="Data Preview" count={data.rows.length}>
      {/* Search + info bar */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search data..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent outline-none text-[11px]"
            style={{ color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(0); }} className="cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {filtered.length === data.rows.length
            ? `${data.rows.length.toLocaleString()} rows`
            : `${filtered.length.toLocaleString()} / ${data.rows.length.toLocaleString()} rows`
          }
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: data.headers.length * 120 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th
                  className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-center"
                  style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)', width: 48, position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}
                >
                  #
                </th>
                {data.headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: sortCol === h ? 'var(--accent)' : 'var(--text-muted)', borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort(h)}
                  >
                    <span className="flex items-center gap-1">
                      {h}
                      {sortCol === h && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
                          {sortAsc ? <polyline points="6 15 12 9 18 15" /> : <polyline points="6 9 12 15 18 9" />}
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const globalIdx = page * PAGE_SIZE + i;
                return (
                  <tr
                    key={globalIdx}
                    style={{ borderBottom: i < pageRows.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td
                      className="px-3 py-2 text-[10px] tabular-nums text-center"
                      style={{ color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)' }}
                    >
                      {globalIdx + 3}
                    </td>
                    {data.headers.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-2 text-[11px]"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={row[h] ?? ''}
                      >
                        {row[h] || <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>-</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            Page {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <PaginationBtn label="<" disabled={page === 0} onClick={() => setPage(page - 1)} />
            {totalPages <= 7 ? (
              Array.from({ length: totalPages }, (_, i) => (
                <PaginationBtn key={i} label={String(i + 1)} active={i === page} onClick={() => setPage(i)} />
              ))
            ) : (
              <>
                <PaginationBtn label="1" active={page === 0} onClick={() => setPage(0)} />
                {page > 2 && <span className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>...</span>}
                {Array.from({ length: 3 }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 2, page)) - 1 + i;
                  if (p <= 0 || p >= totalPages - 1) return null;
                  return <PaginationBtn key={p} label={String(p + 1)} active={p === page} onClick={() => setPage(p)} />;
                })}
                {page < totalPages - 3 && <span className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>...</span>}
                <PaginationBtn label={String(totalPages)} active={page === totalPages - 1} onClick={() => setPage(totalPages - 1)} />
              </>
            )}
            <PaginationBtn label=">" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} />
          </div>
        </div>
      )}
    </Section>
  );
}

function PaginationBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-w-[28px] h-7 px-1.5 rounded-md text-[10px] font-semibold tabular-nums cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = active ? 'var(--accent)' : 'var(--border-color)'; e.currentTarget.style.color = active ? '#fff' : 'var(--text-secondary)'; } }}
    >
      {label}
    </button>
  );
}
