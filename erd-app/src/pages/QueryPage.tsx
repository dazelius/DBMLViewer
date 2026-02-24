import { useState, useRef, useCallback, useMemo } from 'react';
import Toolbar from '../components/Layout/Toolbar.tsx';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import {
  executeSQL,
  executeDataSQL,
  VIRTUAL_TABLE_SCHEMA,
  type QueryResult,
  type SingleResult,
  type Row,
  type TableDataMap,
} from '../core/query/schemaQueryEngine.ts';
import { generateDataSQL } from '../core/ai/claudeAnalyzer.ts';

type QueryMode = 'schema' | 'data';

// ── 스키마 모드 NL→SQL ────────────────────────────────────────────────────────
async function generateSchemaSQL(nl: string, tableNames: string[]): Promise<string> {
  const system = `당신은 데이터베이스 스키마 분석 전문가입니다.
사용자의 자연어 질문을 아래 가상 SQL 테이블 정의에 맞는 SELECT 문으로 변환하세요.

${VIRTUAL_TABLE_SCHEMA}

현재 스키마에 존재하는 테이블 목록 (참고용):
${tableNames.slice(0, 50).join(', ')}${tableNames.length > 50 ? ` 외 ${tableNames.length - 50}개` : ''}

규칙:
1. SELECT 문만 생성하세요.
2. 테이블명은 TABLES, COLUMNS, REFS, ENUMS 만 사용하세요.
3. boolean(pk, fk, unique_col, not_null)은 1/0으로 비교하세요.
4. SQL 코드만 출력하세요. 마크다운, 코드블록 없이 순수 SQL만.`;

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: nl }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API 오류 (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.content?.[0]?.text ?? '').replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
}

// ── 예시 쿼리 ────────────────────────────────────────────────────────────────
const SCHEMA_EXAMPLES = [
  { label: '전체 테이블 목록',      sql: 'SELECT * FROM TABLES ORDER BY group_name, name' },
  { label: 'FK 컬럼 조회',          sql: 'SELECT table_name, col_name, type FROM COLUMNS WHERE fk = 1 ORDER BY table_name' },
  { label: 'PK 없는 테이블',        sql: 'SELECT name, group_name, column_count FROM TABLES WHERE pk_count = 0' },
  { label: '관계 전체 조회',         sql: 'SELECT from_table, from_col, rel_type, to_table, to_col FROM REFS ORDER BY from_table' },
  { label: '컬럼 수 많은 순',        sql: 'SELECT name, group_name, column_count FROM TABLES ORDER BY column_count DESC LIMIT 20' },
  { label: 'Enum 목록',             sql: 'SELECT enum_name, value, note FROM ENUMS ORDER BY enum_name' },
];

// DATA_EXAMPLES는 런타임에 테이블명 기반으로 동적 생성

// ── 셀 값 렌더링 ─────────────────────────────────────────────────────────────
function CellValue({ value, col }: { value: unknown; col: string }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.4 }}>NULL</span>;
  }
  const boolCols = ['pk', 'fk', 'unique_col', 'not_null'];
  if (boolCols.includes(col.toLowerCase()) && (value === 1 || value === 0)) {
    const isTrue = value === 1;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isTrue ? '#22c55e' : 'var(--border-color)', boxShadow: isTrue ? '0 0 5px #22c55e88' : 'none' }} />
        <span style={{ color: isTrue ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>{isTrue ? 'true' : 'false'}</span>
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{value}</span>;
  }
  return <span>{String(value)}</span>;
}

// ── 단일 결과 그리드 ──────────────────────────────────────────────────────────
function DataGrid({ columns, rows }: { columns: string[]; rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8" style={{ color: 'var(--text-muted)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
        </svg>
        <span className="text-[12px]">결과 없음 (0 rows)</span>
      </div>
    );
  }
  return (
    <div className="overflow-auto flex-1" style={{ fontSize: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={{
              position: 'sticky', top: 0, left: 0, zIndex: 3,
              background: '#1a1d27', borderRight: '1px solid var(--border-color)', borderBottom: '2px solid var(--border-color)',
              padding: '6px 10px', minWidth: 42, textAlign: 'right',
              color: 'var(--text-muted)', fontSize: 10, fontWeight: 400, userSelect: 'none',
            }}>#</th>
            {columns.map((col, ci) => (
              <th key={ci} style={{
                position: 'sticky', top: 0, zIndex: 2, background: '#1a1d27',
                borderRight: '1px solid var(--border-color)', borderBottom: '2px solid var(--border-color)',
                padding: '6px 12px', textAlign: 'left', whiteSpace: 'nowrap',
                color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase', userSelect: 'none',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: Row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #1e2030' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}>
              <td style={{
                position: 'sticky', left: 0, zIndex: 1, background: '#141620',
                borderRight: '1px solid var(--border-color)', padding: '5px 10px',
                textAlign: 'right', color: 'var(--text-muted)', fontSize: 10,
                fontFamily: 'var(--font-mono)', userSelect: 'none', minWidth: 42,
              }}>{ri + 1}</td>
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: '5px 12px', borderRight: '1px solid #1e2030', whiteSpace: 'nowrap',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  <CellValue value={row[col]} col={col} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type MultiLayout = 'tabs' | 'report';

// ── 다중 결과 헤더 바 ─────────────────────────────────────────────────────────
function MultiHeader({
  multi, layout, onLayoutChange, duration, totalRows,
}: {
  multi: SingleResult[];
  layout: MultiLayout;
  onLayoutChange: (l: MultiLayout) => void;
  duration?: number;
  totalRows: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0 select-none"
      style={{ background: '#12141e', borderBottom: '1px solid var(--border-color)' }}>
      {/* 레이아웃 토글 */}
      <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        {(['tabs', 'report'] as MultiLayout[]).map(l => (
          <button key={l} onClick={() => onLayoutChange(l)}
            className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
            style={{
              background: layout === l ? 'var(--accent)' : 'transparent',
              color: layout === l ? '#fff' : 'var(--text-muted)',
            }}>
            {l === 'tabs' ? '탭' : '리포트'}
          </button>
        ))}
      </div>
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {multi.length}개 쿼리 · 총 <span style={{ color: '#22c55e', fontWeight: 600 }}>{totalRows}행</span>
        {duration != null && <> · {duration.toFixed(1)}ms</>}
      </span>
      {/* 팁 */}
      <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        💡 리포트 뷰: 모든 테이블을 한 화면에서 스크롤
      </span>
    </div>
  );
}

// ── SQL 결과 테이블 (단일 / 다중 탭+리포트) ──────────────────────────────────
function ResultTable({ result }: { result: QueryResult }) {
  const [activeTab, setActiveTab]   = useState(0);
  const [layout, setLayout]         = useState<MultiLayout>('report');
  const [collapsed, setCollapsed]   = useState<Set<number>>(new Set());

  const toggleCollapse = (i: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // ── 다중 결과 ──────────────────────────────────────────────────────────────
  if (result.multiResults && result.multiResults.length > 0) {
    const multi = result.multiResults;

    // 리포트 뷰: 모든 테이블을 세로로 나열
    if (layout === 'report') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <MultiHeader multi={multi} layout={layout} onLayoutChange={setLayout} duration={result.duration} totalRows={result.rowCount} />
          <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            {multi.map((r: SingleResult, i: number) => {
              const isCollapsed = collapsed.has(i);
              return (
                <div key={i} style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {/* 섹션 헤더 */}
                  <button
                    onClick={() => toggleCollapse(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer text-left"
                    style={{ background: '#161824', borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={r.error ? '#f87171' : 'var(--accent)'} strokeWidth="2.5"
                      style={{ transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={r.error ? '#f87171' : 'var(--accent)'} strokeWidth="2" style={{ flexShrink: 0 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    <span className="font-mono text-[13px] font-semibold" style={{ color: r.error ? '#f87171' : 'var(--text-primary)' }}>
                      {r.tableName}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-mono font-bold"
                      style={{
                        background: r.error ? '#7f2020' : r.rowCount === 0 ? 'var(--bg-surface)' : '#1a3a1a',
                        color: r.error ? '#fca5a5' : r.rowCount === 0 ? 'var(--text-muted)' : '#4ade80',
                      }}>
                      {r.error ? 'ERR' : `${r.rowCount}행`}
                    </span>
                    {!r.error && r.rowCount > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {r.columns.length}컬럼
                      </span>
                    )}
                    {/* SQL 미리보기 */}
                    <span className="ml-auto text-[10px] font-mono truncate max-w-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                      {r.sql.replace(/\s+/g, ' ').slice(0, 80)}
                    </span>
                  </button>
                  {/* 데이터 그리드 */}
                  {!isCollapsed && (
                    r.error ? (
                      <div className="px-4 py-3 font-mono text-[12px]" style={{ color: '#fca5a5', background: '#1a0a0a' }}>
                        {r.error}
                      </div>
                    ) : (
                      <div style={{ maxHeight: 320, overflow: 'auto' }}>
                        <DataGrid columns={r.columns} rows={r.rows} />
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 탭 뷰
    const cur = multi[activeTab] ?? multi[0];
    return (
      <div className="flex flex-col h-full">
        <MultiHeader multi={multi} layout={layout} onLayoutChange={setLayout} duration={result.duration} totalRows={result.rowCount} />
        {/* 탭 바 */}
        <div className="flex items-center overflow-x-auto flex-shrink-0 select-none"
          style={{ background: '#12141e', borderBottom: '1px solid var(--border-color)' }}>
          {multi.map((r: SingleResult, i: number) => {
            const isActive = i === activeTab;
            const hasError = !!r.error;
            return (
              <button key={i} onClick={() => setActiveTab(i)}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono flex-shrink-0 cursor-pointer"
                style={{
                  background: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: hasError ? '#f87171' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderRight: '1px solid var(--border-color)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}>
                {r.tableName}
                <span style={{
                  fontSize: 9, padding: '1px 4px', borderRadius: 3,
                  background: hasError ? '#7f2020' : isActive ? 'var(--accent)' : '#1e2030',
                  color: '#fff', fontWeight: 600,
                }}>
                  {hasError ? 'ERR' : r.rowCount}
                </span>
              </button>
            );
          })}
        </div>
        {cur.error ? (
          <div className="flex-1 p-4 overflow-auto font-mono text-[12px]" style={{ color: '#fca5a5', whiteSpace: 'pre-wrap' }}>{cur.error}</div>
        ) : (
          <DataGrid columns={cur.columns} rows={cur.rows} />
        )}
      </div>
    );
  }

  // ── 단일 결과 오류 ─────────────────────────────────────────────────────────
  if (result.error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono flex-shrink-0"
          style={{ background: '#3f1515', borderBottom: '1px solid #7f2020', color: '#f87171' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          오류
          {result.duration != null && <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{result.duration.toFixed(1)}ms</span>}
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono text-[12px]" style={{ color: '#fca5a5', whiteSpace: 'pre-wrap' }}>
          {result.error}
        </div>
      </div>
    );
  }

  // ── 단일 결과 정상 ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] flex-shrink-0 select-none"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        <span style={{ color: '#22c55e', fontWeight: 600 }}>{result.rowCount}개 행</span>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <span>{result.columns.length}개 컬럼</span>
        {result.duration != null && (
          <><span style={{ color: 'var(--border-color)' }}>|</span><span>{result.duration.toFixed(1)}ms</span></>
        )}
      </div>
      <DataGrid columns={result.columns} rows={result.rows} />
    </div>
  );
}

// ── 모드 탭 버튼 ──────────────────────────────────────────────────────────────
function ModeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-md text-[12px] font-semibold cursor-pointer transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
      }}
    >
      {children}
    </button>
  );
}

// ── 데이터 테이블 목록 사이드 패널 ────────────────────────────────────────────
function DataTableList({
  tableData,
  onSelect,
}: {
  tableData: TableDataMap;
  onSelect: (name: string, cols: string[]) => void;
}) {
  if (tableData.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8" style={{ color: 'var(--text-muted)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
          <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span className="text-[11px] text-center">데이터가 아직 로드되지 않았습니다.<br/>GitLab 동기화 후 자동으로 로드됩니다.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {[...tableData.entries()].map(([key, { headers, rows }]) => (
        <button
          key={key}
          onClick={() => onSelect(key, headers)}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-left cursor-pointer"
          style={{ background: 'transparent', border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <span className="text-[12px] font-mono truncate" style={{ color: 'var(--text-primary)' }}>{key}</span>
          </div>
          <span className="text-[10px] font-mono flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 4 }}>
            {rows.length}행
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function QueryPage() {
  useDebouncedParse();
  const schema    = useSchemaStore(s => s.schema);
  const tableData = useCanvasStore(s => s.tableData) as TableDataMap;

  const [mode, setMode]           = useState<QueryMode>('data');
  const [nl, setNl]               = useState('');
  const [sql, setSql]             = useState('');
  const [result, setResult]       = useState<QueryResult | null>(null);
  const [nlLoading, setNlLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [nlError, setNlError]     = useState<string | null>(null);
  const sqlRef = useRef(sql);
  sqlRef.current = sql;

  const tableNames = schema?.tables.map(t => t.name) ?? [];

  // 모드 전환 시 기본 SQL 세팅
  const handleModeChange = (m: QueryMode) => {
    setMode(m);
    setResult(null);
    setNl('');
    if (m === 'schema') {
      setSql('SELECT * FROM TABLES ORDER BY group_name, name');
    } else {
      setSql('');
    }
  };

  // 데이터 테이블 클릭 → 자동 SELECT
  const handleTableClick = (name: string, cols: string[]) => {
    const colList = cols.slice(0, 10).join(', ');
    const hasMore = cols.length > 10;
    setSql(`SELECT ${colList}${hasMore ? ' -- 외 ' + (cols.length - 10) + '개' : ''}\nFROM ${name}\nLIMIT 100`);
    setResult(null);
  };

  // NL → SQL
  const handleGenerate = useCallback(async () => {
    if (!nl.trim()) return;
    setNlLoading(true);
    setNlError(null);
    try {
      let generated: string;
      if (mode === 'schema') {
        generated = await generateSchemaSQL(nl, tableNames);
      } else {
        generated = await generateDataSQL(nl, tableData, schema ?? undefined);
      }
      setSql(generated);
    } catch (e: unknown) {
      setNlError(e instanceof Error ? e.message : String(e));
    } finally {
      setNlLoading(false);
    }
  }, [nl, mode, tableNames, tableData, schema]);

  // SQL 실행
  const handleRun = useCallback(() => {
    setRunLoading(true);
    setTimeout(() => {
      let res: QueryResult;
      if (mode === 'schema') {
        if (!schema) {
          res = { columns: [], rows: [], rowCount: 0, error: '스키마가 로드되지 않았습니다.' };
        } else {
          res = executeSQL(sqlRef.current, schema);
        }
      } else {
        res = executeDataSQL(sqlRef.current, tableData, schema ?? undefined);
      }
      setResult(res);
      setRunLoading(false);
    }, 0);
  }, [mode, schema, tableData]);

  // 데이터 모드 예시 (동적)
  const dataExamples = useMemo(() => {
    if (tableData.size === 0) return [];
    const names = [...tableData.keys()];
    const exs: { label: string; sql: string }[] = [];
    if (names[0]) exs.push({ label: `${names[0]} 전체 조회`, sql: `SELECT *\nFROM ${names[0]}\nLIMIT 100` });
    // 관계가 있는 첫 쌍 찾기
    if (schema && schema.refs.length > 0) {
      const nameById = new Map(schema.tables.map(t => [t.id, t.name]));
      const ref = schema.refs[0];
      const from = nameById.get(ref.fromTable);
      const to   = nameById.get(ref.toTable);
      if (from && to && tableData.has(from.toLowerCase()) && tableData.has(to.toLowerCase())) {
        exs.push({
          label: `${from} ↔ ${to} JOIN`,
          sql: `SELECT A.*, B.*\nFROM ${from} A\nJOIN ${to} B ON A.${ref.fromColumns[0]} = B.${ref.toColumns[0]}\nLIMIT 100`,
        });
      }
    }
    return exs;
  }, [tableData, schema]);

  const examples = mode === 'schema' ? SCHEMA_EXAMPLES : dataExamples;

  return (
    <div className="flex flex-col h-screen w-screen" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측 패널 ── */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{
          width: 320, flexShrink: 0, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
        }}>

          {/* 모드 전환 */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              쿼리 모드
            </div>
            <div className="flex gap-2">
              <ModeChip active={mode === 'data'}   onClick={() => handleModeChange('data')}>
                📊 실제 데이터
              </ModeChip>
              <ModeChip active={mode === 'schema'} onClick={() => handleModeChange('schema')}>
                🗂 스키마 메타
              </ModeChip>
            </div>
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
              {mode === 'data'
                ? 'Excel에서 가져온 실제 데이터 행을 SQL로 조회합니다. JOIN으로 관계를 따를 수 있습니다.'
                : '테이블·컬럼·관계 구조를 조회합니다. 실제 데이터는 없습니다.'
              }
            </p>
          </div>

          {/* 자연어 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              자연어로 질문 (AI → SQL)
            </label>
            <textarea
              value={nl}
              onChange={e => setNl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
              placeholder={mode === 'data'
                ? '예: Player 테이블에서 레벨 100 이상 플레이어를 Character 정보와 함께 보여줘'
                : '예: FK 컬럼이 가장 많은 테이블 10개를 보여줘'
              }
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-[12px] resize-none outline-none"
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.6,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
            />
            {nlError && (
              <div className="text-[11px] px-2 py-1 rounded" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>{nlError}</div>
            )}
            <button
              onClick={handleGenerate}
              disabled={nlLoading || !nl.trim()}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {nlLoading ? (
                <><svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>SQL 생성 중…</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M22 2 12 12" /><path d="m16 2 6 6V2z" /></svg>SQL 생성 (Ctrl+Enter)</>
              )}
            </button>
          </div>

          {/* 예시 */}
          {examples.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>예시</div>
              {examples.map(ex => (
                <button key={ex.label} onClick={() => { setSql(ex.sql); setResult(null); }}
                  className="text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <span style={{ color: 'var(--accent)' }}>▶ </span>{ex.label}
                </button>
              ))}
            </div>
          )}

          {/* 데이터 모드: 테이블 목록 */}
          {mode === 'data' && (
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>테이블 ({tableData.size})</div>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>클릭하면 SELECT 생성</span>
              </div>
              <DataTableList tableData={tableData} onSelect={handleTableClick} />
            </div>
          )}

          {/* 스키마 모드: 가상 테이블 정보 */}
          {mode === 'schema' && (
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>가상 테이블 스키마</div>
              <pre className="text-[10px] leading-relaxed overflow-auto" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', maxHeight: 200 }}>
{`TABLES
  name, group_name, column_count
  pk_count, fk_count, note, alias

COLUMNS
  table_name, group_name, col_name
  type, pk, fk, unique_col, not_null
  default_val, note

REFS
  from_table, from_col, to_table
  to_col, rel_type

ENUMS
  enum_name, value, note`}
              </pre>
            </div>
          )}
        </div>

        {/* ── 우측 패널: SQL 에디터 + 결과 ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* SQL 에디터 */}
          <div className="flex flex-col" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>SQL Editor</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: mode === 'data' ? '#1e3a5f' : '#1e2d1e', color: mode === 'data' ? '#60a5fa' : '#4ade80' }}>
                  {mode === 'data' ? '실제 데이터' : '스키마 메타'}
                </span>
              </div>
              <button
                onClick={handleRun}
                disabled={runLoading || !sql.trim()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                {runLoading ? (
                  <><svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>실행 중…</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>실행 (F5)</>
                )}
              </button>
            </div>

            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'F5') { e.preventDefault(); handleRun(); }
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const ta = e.currentTarget;
                  const s = ta.selectionStart, en = ta.selectionEnd;
                  const nv = sql.slice(0, s) + '  ' + sql.slice(en);
                  setSql(nv);
                  requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
                }
              }}
              spellCheck={false}
              placeholder={mode === 'data'
                ? 'SELECT * FROM TableName LIMIT 100\n-- 왼쪽 테이블 목록을 클릭하거나 자연어로 질문하세요'
                : 'SELECT * FROM TABLES ORDER BY name\n-- 가상 테이블: TABLES, COLUMNS, REFS, ENUMS'
              }
              className="w-full outline-none resize-none px-5 py-4 text-[13px] font-mono"
              style={{
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
                border: 'none', lineHeight: 1.7, minHeight: 160, maxHeight: 260,
              }}
            />
          </div>

          {/* 결과 영역 */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {!result ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: 'var(--text-muted)' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.25 }}>
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <span className="text-[13px]">
                  {mode === 'data'
                    ? '왼쪽 테이블을 클릭하거나, 자연어로 질문하면 SQL이 생성됩니다.'
                    : 'SQL을 작성하고 F5 또는 실행 버튼을 누르세요.'}
                </span>
                {mode === 'data' && tableData.size === 0 && (
                  <span className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    ⚠ 데이터가 아직 로드되지 않았습니다. GitLab 동기화 후 자동으로 사용 가능합니다.
                  </span>
                )}
              </div>
            ) : (
              <ResultTable result={result} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
