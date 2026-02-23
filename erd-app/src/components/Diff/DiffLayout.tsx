import { useState, useEffect, useCallback, useRef } from 'react';
import {
  gitLog, gitFilesAtCommit,
  type GitCommit,
} from '../../core/import/gitlabService.ts';
import { excelFilesToDbml } from '../../core/import/excelToDbml.ts';
import { parseDBML } from '../../core/parser/parseDBML.ts';
import { diffSchemas, type SchemaDiffResult, type TableDiff, type ColumnDiff, type EnumDiff, type ChangeKind } from '../../core/diff/schemaDiff.ts';
import { diffData, type DataDiffResult, type DataTableDiff } from '../../core/diff/dataDiff.ts';
import type { SchemaColumn } from '../../core/schema/types.ts';

const SCHEMA_PATH = 'GameData/DataDefine';
const DATA_PATH = 'GameData/Data';

type DiffTab = 'schema' | 'data';

export default function DiffLayout() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DiffTab>('schema');

  const [fromCommit, setFromCommit] = useState('');
  const [toCommit, setToCommit] = useState('');

  const [schemaDiff, setSchemaDiff] = useState<SchemaDiffResult | null>(null);
  const [dataDiff, setDataDiff] = useState<DataDiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  type SheetData = { headers: string[]; rows: Record<string, string>[] };
  const [fromSheets, setFromSheets] = useState<Map<string, SheetData>>(new Map());
  const [toSheets, setToSheets] = useState<Map<string, SheetData>>(new Map());

  const computedRef = useRef('');

  useEffect(() => {
    (async () => {
      try {
        const c = await gitLog(50);
        setCommits(c);
        if (c.length >= 2) { setFromCommit(c[1].hash); setToCommit(c[0].hash); }
      } catch (err: any) {
        setError(err.message || 'Failed to load git log');
      } finally { setLoading(false); }
    })();
  }, []);

  const runDiff = useCallback(async () => {
    if (!fromCommit || !toCommit) return;
    const key = `${fromCommit}:${toCommit}`;
    if (computedRef.current === key) return;
    computedRef.current = key;

    setDiffLoading(true);
    setSchemaDiff(null);
    setDataDiff(null);
    setExpandedTables(new Set());
    setFromSheets(new Map());
    setToSheets(new Map());

    try {
      const [fromSchemaFiles, toSchemaFiles, fromDataFiles, toDataFiles] = await Promise.all([
        gitFilesAtCommit(fromCommit, SCHEMA_PATH),
        gitFilesAtCommit(toCommit, SCHEMA_PATH),
        gitFilesAtCommit(fromCommit, DATA_PATH).catch(() => []),
        gitFilesAtCommit(toCommit, DATA_PATH).catch(() => []),
      ]);

      const fromImport = excelFilesToDbml([...fromSchemaFiles, ...fromDataFiles]);
      const toImport = excelFilesToDbml([...toSchemaFiles, ...toDataFiles]);

      const fromSchema = parseDBML(fromImport.dbml).schema;
      const toSchema = parseDBML(toImport.dbml).schema;

      const sr = diffSchemas(fromSchema, toSchema);
      setSchemaDiff(sr);

      const dr = diffData(fromImport.dataRowCounts, toImport.dataRowCounts);
      setDataDiff(dr);

      const normSheets = (m: Map<string, SheetData>) => {
        const out = new Map<string, SheetData>();
        for (const [k, v] of m) out.set(k.toLowerCase(), v);
        return out;
      };
      setFromSheets(normSheets(fromImport.dataSheets));
      setToSheets(normSheets(toImport.dataSheets));

      const expanded = new Set<string>();
      sr.tableDiffs.filter((d) => d.kind === 'modified').forEach((d) => expanded.add(d.tableName));
      setExpandedTables(expanded);
    } catch (err: any) {
      setError(err.message);
    } finally { setDiffLoading(false); }
  }, [fromCommit, toCommit]);

  useEffect(() => {
    if (fromCommit && toCommit && commits.length >= 2) runDiff();
  }, [fromCommit, toCommit, commits.length, runDiff]);

  const toggleExpand = (name: string) => {
    setExpandedTables((prev) => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  if (loading) {
    return <CenterMessage><Spinner /><span className="text-sm">Git 로그 로딩 중...</span></CenterMessage>;
  }
  if (error && commits.length === 0) {
    return (
      <CenterMessage>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.1)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Git 저장소를 찾을 수 없습니다</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Import 탭에서 Git Clone을 먼저 실행하세요.</p>
      </CenterMessage>
    );
  }

  const fromLabel = commits.find((c) => c.hash === fromCommit);
  const toLabel = commits.find((c) => c.hash === toCommit);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="7" y2="12" /><line x1="17.01" y1="12" x2="22.96" y2="12" />
          </svg>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>Diff</span>
        </div>
        <CommitSelect label="FROM" value={fromCommit} commits={commits} onChange={(v) => { computedRef.current = ''; setFromCommit(v); }} />
        <Arrow />
        <CommitSelect label="TO" value={toCommit} commits={commits} onChange={(v) => { computedRef.current = ''; setToCommit(v); }} />
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-6 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <SubTab active={activeTab === 'schema'} onClick={() => setActiveTab('schema')} count={schemaDiff ? schemaDiff.tableDiffs.length + schemaDiff.enumDiffs.length : 0}>
          Schema Diff
        </SubTab>
        <SubTab active={activeTab === 'data'} onClick={() => setActiveTab('data')} count={dataDiff ? dataDiff.tables.filter((t) => t.kind !== 'unchanged').length : 0}>
          Data Diff
        </SubTab>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {diffLoading && (
          <CenterMessage>
            <Spinner />
            <span className="text-[12px]">두 버전의 Excel을 파싱하여 비교 중...</span>
          </CenterMessage>
        )}

        {!diffLoading && activeTab === 'schema' && schemaDiff && (
          <SchemaTabContent
            result={schemaDiff}
            expanded={expandedTables}
            onToggle={toggleExpand}
            fromLabel={fromLabel?.short ?? ''}
            toLabel={toLabel?.short ?? ''}
          />
        )}

        {!diffLoading && activeTab === 'data' && dataDiff && (
          <DataTabContent result={dataDiff} fromLabel={fromLabel?.short ?? ''} toLabel={toLabel?.short ?? ''}
            fromSheets={fromSheets} toSheets={toSheets}
            expandedData={expandedTables} onToggleData={toggleExpand} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════ SCHEMA TAB ═══════════════ */

function SchemaTabContent({ result, expanded, onToggle, fromLabel, toLabel }: {
  result: SchemaDiffResult; expanded: Set<string>; onToggle: (n: string) => void;
  fromLabel: string; toLabel: string;
}) {
  const s = result.summary;
  const isEmpty = result.tableDiffs.length === 0 && result.enumDiffs.length === 0;

  if (isEmpty) return <EmptyMessage text="스키마 변경 사항 없음" />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-5 space-y-2">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 text-[11px] font-medium">
        {s.tablesAdded > 0 && <span style={{ color: CL.added }}>+{s.tablesAdded} tables</span>}
        {s.tablesRemoved > 0 && <span style={{ color: CL.removed }}>-{s.tablesRemoved} tables</span>}
        {s.tablesModified > 0 && <span style={{ color: CL.modified }}>~{s.tablesModified} tables</span>}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          columns: +{s.columnsAdded} / -{s.columnsRemoved} / ~{s.columnsModified}
        </span>
      </div>

      {result.tableDiffs.map((td) => (
        <SchemaTableCard key={td.tableName} diff={td} expanded={expanded.has(td.tableName)}
          onToggle={() => onToggle(td.tableName)} fromLabel={fromLabel} toLabel={toLabel} />
      ))}

      {result.enumDiffs.length > 0 && (
        <div className="pt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>Enum Changes</div>
          {result.enumDiffs.map((ed) => <EnumDiffCard key={ed.enumName} diff={ed} />)}
        </div>
      )}
    </div>
  );
}

function SchemaTableCard({ diff, expanded, onToggle, fromLabel, toLabel }: {
  diff: TableDiff; expanded: boolean; onToggle: () => void; fromLabel: string; toLabel: string;
}) {
  const accent = CL[diff.kind] || CL.modified;
  const borderColor = accent + '30';

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer"
        style={{ background: accent + '08' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = accent + '12'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = accent + '08'; }}>
        <Chevron open={expanded} color={accent} />
        <KindBadge kind={diff.kind} />
        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{diff.tableName}</span>
        {diff.group && <Tag>{diff.group}</Tag>}
        <span className="flex-1" />
        <ColSummary diffs={diff.columnDiffs} />
      </button>

      {/* Before / After table */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${borderColor}` }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                <ThCell w="50px" />
                <ThCell w="170px">컬럼명</ThCell>
                <ThCell w="130px" align="center" accent>{fromLabel} (Before)</ThCell>
                <ThCell w="130px" align="center" accent>{toLabel} (After)</ThCell>
                <ThCell>속성 변경</ThCell>
              </tr>
            </thead>
            <tbody>
              {diff.allColumns.map((cd) => <BeforeAfterRow key={cd.name} col={cd} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BeforeAfterRow({ col }: { col: ColumnDiff }) {
  const old = col.oldCol;
  const nw = col.newCol;
  const rowBg = col.kind === 'added' ? CL.added + '06'
    : col.kind === 'removed' ? CL.removed + '06'
    : col.kind === 'modified' ? CL.modified + '06'
    : 'transparent';

  return (
    <tr style={{ background: rowBg, borderBottom: '1px solid var(--border-color)' }}
      onMouseEnter={(e) => { if (col.kind !== 'unchanged') e.currentTarget.style.filter = 'brightness(1.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}>
      {/* Status */}
      <td className="px-3 py-1.5 text-center">
        {col.kind !== 'unchanged' && <KindBadge kind={col.kind} small />}
      </td>
      {/* Name */}
      <td className="px-3 py-1.5">
        <span className="text-[11px] font-semibold" style={{
          color: col.kind === 'removed' ? CL.removed : 'var(--text-primary)',
          textDecoration: col.kind === 'removed' ? 'line-through' : 'none',
        }}>{col.name}</span>
      </td>
      {/* Before */}
      <td className="px-3 py-1.5 text-center">
        {old ? <ColTypeCell col={old} highlight={col.kind === 'removed'} color={col.kind === 'removed' ? CL.removed : undefined} /> : (
          <span className="text-[10px] italic" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>
        )}
      </td>
      {/* After */}
      <td className="px-3 py-1.5 text-center">
        {nw ? <ColTypeCell col={nw} highlight={col.kind === 'added'} color={col.kind === 'added' ? CL.added : undefined} /> : (
          <span className="text-[10px] italic" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>
        )}
      </td>
      {/* Changes */}
      <td className="px-3 py-1.5">
        {col.details && col.details.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {col.details.map((d, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: CL.modified + '18', color: CL.modified }}>{d}</span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function ColTypeCell({ col, highlight, color }: { col: SchemaColumn; highlight?: boolean; color?: string }) {
  const c = color || 'var(--text-secondary)';
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{col.type}</span>
      <div className="flex gap-0.5">
        {col.isPrimaryKey && <MicroBadge label="PK" color="#60a5fa" />}
        {col.isForeignKey && <MicroBadge label="FK" color="#a78bfa" />}
        {col.isNotNull && <MicroBadge label="NN" color="#f59e0b" />}
        {col.isLocalize && <MicroBadge label="L" color="#2dd4bf" />}
      </div>
    </div>
  );
}

function EnumDiffCard({ diff }: { diff: EnumDiff }) {
  const accent = CL[diff.kind] || CL.modified;
  return (
    <div className="rounded-lg px-4 py-3 mb-2 flex items-start gap-3" style={{ border: `1px solid ${accent}30`, background: accent + '06' }}>
      <KindBadge kind={diff.kind} />
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{diff.enumName}</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {diff.addedValues.map((v) => (
            <span key={v} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: CL.added + '18', color: CL.added }}>+ {v}</span>
          ))}
          {diff.removedValues.map((v) => (
            <span key={v} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: CL.removed + '18', color: CL.removed }}>- {v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ DATA TAB ═══════════════ */

type SheetData = { headers: string[]; rows: Record<string, string>[] };

interface RowDiff {
  kind: 'added' | 'removed' | 'modified';
  rowIdx: number;
  oldRow?: Record<string, string>;
  newRow?: Record<string, string>;
  changedCols: Set<string>;
}

function computeRowDiff(
  oldSheet: SheetData | undefined,
  newSheet: SheetData | undefined,
): { headers: string[]; diffs: RowDiff[] } {
  const oh = oldSheet?.headers ?? [];
  const nh = newSheet?.headers ?? [];
  const headers = [...new Set([...oh, ...nh])];
  const keyCol = headers[0] || '';

  if (!keyCol) return { headers, diffs: [] };

  const oldByKey = new Map<string, { row: Record<string, string>; idx: number }>();
  (oldSheet?.rows ?? []).forEach((row, idx) => {
    const k = String(row[keyCol] ?? '').trim();
    if (k) oldByKey.set(k, { row, idx });
  });

  const newByKey = new Map<string, { row: Record<string, string>; idx: number }>();
  (newSheet?.rows ?? []).forEach((row, idx) => {
    const k = String(row[keyCol] ?? '').trim();
    if (k) newByKey.set(k, { row, idx });
  });

  const diffs: RowDiff[] = [];

  for (const [k, { row: newRow, idx }] of newByKey) {
    const oldEntry = oldByKey.get(k);
    if (!oldEntry) {
      diffs.push({ kind: 'added', rowIdx: idx, newRow, changedCols: new Set() });
    } else {
      const changed = new Set<string>();
      for (const h of headers) {
        if (String(oldEntry.row[h] ?? '').trim() !== String(newRow[h] ?? '').trim()) changed.add(h);
      }
      if (changed.size > 0) {
        diffs.push({ kind: 'modified', rowIdx: idx, oldRow: oldEntry.row, newRow, changedCols: changed });
      }
    }
  }

  for (const [k, { row: oldRow, idx }] of oldByKey) {
    if (!newByKey.has(k)) {
      diffs.push({ kind: 'removed', rowIdx: idx, oldRow, changedCols: new Set() });
    }
  }

  diffs.sort((a, b) => {
    const order = { removed: 0, modified: 1, added: 2 };
    return order[a.kind] - order[b.kind];
  });

  return { headers, diffs };
}

function DataTabContent({ result, fromLabel, toLabel, fromSheets, toSheets, expandedData, onToggleData }: {
  result: DataDiffResult; fromLabel: string; toLabel: string;
  fromSheets: Map<string, SheetData>; toSheets: Map<string, SheetData>;
  expandedData: Set<string>; onToggleData: (name: string) => void;
}) {
  const { summary: s, tables } = result;
  const changed = tables.filter((t) => t.kind !== 'unchanged');
  const unchanged = tables.filter((t) => t.kind === 'unchanged');
  const [showUnchanged, setShowUnchanged] = useState(false);

  if (tables.length === 0) return <EmptyMessage text="데이터 시트를 찾을 수 없습니다" />;
  if (changed.length === 0) return <EmptyMessage text="데이터 행 수 변경 없음" />;

  return (
    <div className="max-w-[95vw] mx-auto px-6 py-5">
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Before 총 행" value={s.totalOld.toLocaleString()} />
        <StatCard label="After 총 행" value={s.totalNew.toLocaleString()} />
        <StatCard label="변화량" value={(s.totalDelta >= 0 ? '+' : '') + s.totalDelta.toLocaleString()} color={s.totalDelta > 0 ? CL.added : s.totalDelta < 0 ? CL.removed : undefined} />
        <StatCard label="변경 테이블" value={`${changed.length} / ${tables.length}`} />
      </div>

      <div className="space-y-2">
        {changed.map((t) => {
          const key = t.tableName.toLowerCase();
          return (
            <DataTableCard key={t.tableName} diff={t} fromLabel={fromLabel} toLabel={toLabel}
              expanded={expandedData.has(t.tableName)}
              onToggle={() => onToggleData(t.tableName)}
              fromSheet={fromSheets.get(key)} toSheet={toSheets.get(key)} />
          );
        })}
      </div>

      {unchanged.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowUnchanged(!showUnchanged)}
            className="text-[10px] px-3 py-1.5 rounded-lg cursor-pointer interactive"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            {showUnchanged ? '숨기기' : `변경 없는 테이블 ${unchanged.length}개 보기`}
          </button>
          {showUnchanged && (
            <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {unchanged.map((t) => (
                    <tr key={t.tableName} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="px-4 py-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.tableName}</td>
                      <td className="px-4 py-1.5 text-[10px] text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{t.oldRowCount.toLocaleString()} rows</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataTableCard({ diff, expanded, onToggle, fromLabel, toLabel, fromSheet, toSheet }: {
  diff: DataTableDiff; expanded: boolean; onToggle: () => void;
  fromLabel: string; toLabel: string;
  fromSheet?: SheetData; toSheet?: SheetData;
}) {
  const accent = CL[diff.kind] || 'var(--text-muted)';
  const pct = diff.oldRowCount > 0 ? ((diff.rowDelta / diff.oldRowCount) * 100) : (diff.newRowCount > 0 ? 100 : 0);

  const [rowDiff, setRowDiff] = useState<{ headers: string[]; diffs: RowDiff[] } | null>(null);

  useEffect(() => {
    if (expanded) {
      setRowDiff(computeRowDiff(fromSheet, toSheet));
    }
  }, [expanded, fromSheet, toSheet]);

  const addedRows = rowDiff?.diffs.filter((r) => r.kind === 'added').length ?? 0;
  const removedRows = rowDiff?.diffs.filter((r) => r.kind === 'removed').length ?? 0;
  const modifiedRows = rowDiff?.diffs.filter((r) => r.kind === 'modified').length ?? 0;
  const hasData = fromSheet || toSheet;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
      {/* Header - only this is clickable */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
        style={{ background: accent + '08' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = accent + '12'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = accent + '08'; }}
        onKeyDown={(e) => { if (e.key === 'Enter') onToggle(); }}>
        <Chevron open={expanded} color={accent} />
        <KindBadge kind={diff.kind} />
        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{diff.tableName}</span>
        <span className="flex-1" />
        <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {diff.oldRowCount.toLocaleString()} → {diff.newRowCount.toLocaleString()}
        </span>
        <span className="text-[10px] font-bold tabular-nums ml-2" style={{ color: accent }}>
          {diff.rowDelta > 0 ? '+' : ''}{diff.rowDelta.toLocaleString()}
        </span>
        <span className="text-[9px] tabular-nums ml-1" style={{ color: accent }}>
          ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
        </span>
      </div>

      {/* Expanded detail - NOT clickable for toggle */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ borderTop: `1px solid ${accent}30` }}>
          {!hasData && (
            <div className="px-4 py-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              데이터 시트를 찾을 수 없습니다 (Data 폴더에 해당 시트가 없음)
            </div>
          )}

          {hasData && rowDiff && (
            <>
              <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-medium" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                {addedRows > 0 && <span style={{ color: CL.added }}>+{addedRows} 행 추가</span>}
                {removedRows > 0 && <span style={{ color: CL.removed }}>-{removedRows} 행 삭제</span>}
                {modifiedRows > 0 && <span style={{ color: CL.modified }}>~{modifiedRows} 행 변경</span>}
                {rowDiff.diffs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>PK 기준 행 내용 변경 없음</span>}
              </div>

              {rowDiff.diffs.length > 0 && (
                <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: rowDiff.headers.length * 100 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th className="px-2 py-1.5 text-[8px] font-bold text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '40px', borderBottom: '1px solid var(--border-color)' }}>상태</th>
                        {rowDiff.headers.map((h) => (
                          <th key={h} className="px-2 py-1.5 text-[8px] font-bold text-left uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowDiff.diffs.slice(0, 200).map((rd, i) => (
                        <DataRowDiffTr key={`${rd.kind}-${rd.rowIdx}-${i}`} rd={rd} headers={rowDiff.headers} />
                      ))}
                      {rowDiff.diffs.length > 200 && (
                        <tr><td colSpan={rowDiff.headers.length + 1} className="px-4 py-3 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          ... 외 {rowDiff.diffs.length - 200}개 행
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DataRowDiffTr({ rd, headers }: { rd: RowDiff; headers: string[] }) {
  const bg = rd.kind === 'added' ? CL.added + '06' : rd.kind === 'removed' ? CL.removed + '06' : CL.modified + '04';

  return (
    <tr style={{ background: bg, borderBottom: '1px solid var(--border-color)' }}>
      <td className="px-2 py-1 text-center"><KindBadge kind={rd.kind} small /></td>
      {headers.map((h) => {
        const isChanged = rd.changedCols.has(h);
        const oldVal = rd.oldRow?.[h] ?? '';
        const newVal = rd.newRow?.[h] ?? '';

        if (rd.kind === 'added') {
          return <td key={h} className="px-2 py-1"><span className="text-[10px]" style={{ color: CL.added }}>{newVal}</span></td>;
        }
        if (rd.kind === 'removed') {
          return <td key={h} className="px-2 py-1"><span className="text-[10px] line-through" style={{ color: CL.removed, opacity: 0.6 }}>{oldVal}</span></td>;
        }
        // modified
        return (
          <td key={h} className="px-2 py-1" style={{ background: isChanged ? CL.modified + '15' : undefined }}>
            {isChanged ? (
              <div className="flex flex-col">
                <span className="text-[9px] line-through" style={{ color: CL.removed, opacity: 0.7 }}>{oldVal || '(empty)'}</span>
                <span className="text-[10px] font-medium" style={{ color: CL.added }}>{newVal || '(empty)'}</span>
              </div>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{newVal}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-[18px] font-bold tabular-nums" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

/* ═══════════════ SHARED PRIMITIVES ═══════════════ */

const CL: Record<string, string> = {
  added: '#34d399',
  removed: '#f87171',
  modified: '#fbbf24',
  unchanged: '#64748b',
};

function CommitSelect({ label, value, commits, onChange }: {
  label: string; value: string; commits: GitCommit[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-[10px] outline-none cursor-pointer interactive"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
        {commits.map((c) => (
          <option key={c.hash} value={c.hash}>{c.short} — {c.message.substring(0, 40)} ({fmtDate(c.date)})</option>
        ))}
      </select>
    </div>
  );
}

function SubTab({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer interactive"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? 'var(--shadow-glow)' : 'none',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}>
      {children}
      {count > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
          background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)',
          color: active ? '#fff' : 'var(--text-muted)',
        }}>{count}</span>
      )}
    </button>
  );
}

function KindBadge({ kind, small }: { kind: ChangeKind; small?: boolean }) {
  const m: Record<string, { label: string; color: string }> = {
    added: { label: 'ADD', color: CL.added },
    removed: { label: 'DEL', color: CL.removed },
    modified: { label: 'MOD', color: CL.modified },
    unchanged: { label: '—', color: CL.unchanged },
  };
  const info = m[kind] || m.unchanged;
  const sz = small ? 'text-[7px] px-1 py-px' : 'text-[8px] px-1.5 py-0.5';
  return <span className={`${sz} rounded font-bold flex-shrink-0`} style={{ color: info.color, background: info.color + '18' }}>{info.label}</span>;
}

function MicroBadge({ label, color }: { label: string; color: string }) {
  return <span className="text-[7px] font-bold px-1 py-px rounded" style={{ background: color + '18', color }}>{label}</span>;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{children}</span>;
}

function ColSummary({ diffs }: { diffs: ColumnDiff[] }) {
  const a = diffs.filter((c) => c.kind === 'added').length;
  const r = diffs.filter((c) => c.kind === 'removed').length;
  const m = diffs.filter((c) => c.kind === 'modified').length;
  return (
    <span className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
      {a > 0 && <span style={{ color: CL.added }}>+{a}</span>}
      {r > 0 && <span style={{ color: CL.removed }}>-{r}</span>}
      {m > 0 && <span style={{ color: CL.modified }}>~{m}</span>}
    </span>
  );
}

function Chevron({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ThCell({ children, w, align, accent }: { children?: React.ReactNode; w?: string; align?: string; accent?: boolean }) {
  return (
    <th className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)', width: w }}>
      {children}
    </th>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--text-muted)' }} />;
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">{children}</div>;
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <CenterMessage>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.08)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{text}</span>
    </CenterMessage>
  );
}

function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return dateStr; }
}
