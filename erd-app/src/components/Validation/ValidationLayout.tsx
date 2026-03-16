import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import {
  validateData,
  type ValidationResult as SchemaValidationResult,
  type ValidationIssue,
  type VSeverity,
  type VCategory,
  type TableValidationStat,
  type TableData,
} from '../../core/validation/dataValidator.ts';
import {
  type ValidationRule,
  type RuleViolation,
  type ValidationResult as RulesValidationResult,
  type RuleCondition,
} from '../../core/ai/validationEngine.ts';

const SEVERITY_CONFIG: Record<VSeverity, { label: string; color: string; bg: string }> = {
  error: { label: 'ERR', color: '#ef4444', bg: '#ef444418' },
  warning: { label: 'WARN', color: '#f59e0b', bg: '#f59e0b18' },
  info: { label: 'INFO', color: 'var(--accent)', bg: 'var(--accent-muted)' },
};

const CATEGORY_CONFIG: Record<VCategory, { label: string; icon: string }> = {
  referential: { label: 'FK', icon: 'R' },
  uniqueness: { label: 'PK', icon: 'U' },
  required: { label: 'NULL', icon: 'N' },
  enum: { label: 'Enum', icon: 'E' },
  type: { label: 'Type', icon: 'T' },
};

type TabId = 'schema' | 'rules' | 'history';
const HISTORY_KEY = 'tablemaster_validation_history';
const MAX_HISTORY = 30;

interface HistoryEntry {
  id: string;
  timestamp: number;
  schemaErrors: number;
  schemaWarnings: number;
  ruleErrors: number;
  ruleWarnings: number;
  totalTables: number;
  durationMs: number;
  ruleViolations?: RuleViolation[];
}

function conditionSummary(c: RuleCondition): string {
  switch (c.type) {
    case 'range': { const p: string[] = []; if (c.min !== undefined) p.push(`${c.min}<=`); p.push(c.column); if (c.max !== undefined) p.push(`<=${c.max}`); return p.join(''); }
    case 'not_null': return `${c.column} NOT NULL`;
    case 'in': return `${c.column} IN(${c.values.length})`;
    case 'not_in': return `${c.column} NOT IN(${c.values.length})`;
    case 'regex': return `${c.column} ~/${c.pattern}/`;
    case 'compare_columns': return `${c.left}${c.op}${c.right}`;
    case 'conditional': return `IF ${c.when.column}${c.when.op}${c.when.value}`;
    case 'unique': return `UNIQUE ${c.column}${c.group_by ? ` by ${c.group_by}` : ''}`;
    case 'expression': return c.expr.slice(0, 30);
    case 'fk_ref': return `${c.column}->${c.ref_table}`;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ValidationLayout() {
  const schema = useSchemaStore(s => s.schema);
  const storeTableData = useCanvasStore(s => s.tableData);
  const setStoreTableData = useCanvasStore(s => s.setTableData);

  const [activeTab, setActiveTab] = useState<TabId>('schema');
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [serverDataLoaded, setServerDataLoaded] = useState(false);

  const [schemaResult, setSchemaResult] = useState<SchemaValidationResult | null>(null);
  const [schemaSeverityFilter, setSchemaSeverityFilter] = useState<VSeverity | 'all'>('all');
  const [schemaCategoryFilter, setSchemaCategoryFilter] = useState<VCategory | 'all'>('all');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [rulesResult, setRulesResult] = useState<RulesValidationResult | null>(null);
  const [rulesFilter, setRulesFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const saveHistory = useCallback((entries: HistoryEntry[]) => {
    const trimmed = entries.slice(0, MAX_HISTORY);
    setHistory(trimmed);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }, []);

  const runAllValidations = useCallback(async () => {
    if (!schema) return;
    setLoading(true);
    const t0 = performance.now();
    try {
      let effectiveTableData = storeTableData;
      if (effectiveTableData.size === 0 && !serverDataLoaded) {
        try {
          const resp = await fetch('/api/v1/tables/data');
          if (resp.ok) {
            const data = await resp.json() as { tables: Record<string, { headers: string[]; rows: Record<string, string>[]; rowCount: number }> };
            const newMap = new Map<string, { headers: string[]; rows: Record<string, string>[] }>();
            for (const [name, val] of Object.entries(data.tables)) newMap.set(name, { headers: val.headers, rows: val.rows });
            setStoreTableData(newMap);
            effectiveTableData = newMap;
            setServerDataLoaded(true);
          }
        } catch { /* unavailable */ }
      }
      if (effectiveTableData.size === 0) { setLoading(false); return; }

      const tables: TableData[] = [];
      for (const [key, val] of effectiveTableData) tables.push({ name: key, headers: val.headers, rows: val.rows, rowCount: val.rows.length });
      const sResult = validateData(schema, tables);
      setSchemaResult(sResult);

      let rResult: RulesValidationResult | null = null;
      try { const r = await fetch('/api/validation-rules/run'); if (r.ok) rResult = await r.json() as RulesValidationResult; } catch (e) { console.warn('[ValidationLayout]', e) }
      setRulesResult(rResult);
      try { const r = await fetch('/api/validation-rules/list'); if (r.ok) { const d = await r.json() as { rules: ValidationRule[] }; setRules(d.rules ?? []); } } catch (e) { console.warn('[ValidationLayout]', e) }

      const elapsed = Math.round(performance.now() - t0);
      saveHistory([{ id: Date.now().toString(36), timestamp: Date.now(), schemaErrors: sResult.errorCount, schemaWarnings: sResult.warningCount, ruleErrors: rResult?.violations.filter(v => v.severity === 'error').length ?? 0, ruleWarnings: rResult?.violations.filter(v => v.severity === 'warning').length ?? 0, totalTables: tables.length, durationMs: elapsed, ruleViolations: rResult?.violations }, ...history]);
      setLastRun(Date.now());
    } finally { setLoading(false); }
  }, [schema, storeTableData, serverDataLoaded, setStoreTableData, history, saveHistory]);

  useEffect(() => {
    if (schema && !schemaResult && !loading) runAllValidations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <h2 className="text-[14px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>스키마 없음</h2>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Editor에서 DBML을 작성하거나 Excel을 Import하세요.</p>
        </div>
      </div>
    );
  }

  const totalErrors = (schemaResult?.errorCount ?? 0) + (rulesResult?.violations.filter(v => v.severity === 'error').length ?? 0);
  const totalWarnings = (schemaResult?.warningCount ?? 0) + (rulesResult?.violations.filter(v => v.severity === 'warning').length ?? 0);
  const scoreColor = totalErrors === 0 && totalWarnings === 0 ? '#22c55e' : totalErrors === 0 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[12px]"
              style={{ background: `${scoreColor}15`, color: scoreColor, border: `2px solid ${scoreColor}40` }}>
              {schemaResult ? (totalErrors === 0 && totalWarnings === 0 ? 'A' : totalErrors === 0 ? 'B' : totalErrors < 10 ? 'C' : 'F') : '—'}
            </div>
            <div>
              <div className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Validation</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{lastRun ? new Date(lastRun).toLocaleTimeString('ko-KR') : '—'}</div>
            </div>
          </div>
          <div className="w-px h-7" style={{ background: 'var(--border-color)' }} />
          <div className="flex items-center gap-3 text-[10px]">
            <span className="font-bold tabular-nums" style={{ color: '#ef4444' }}>{totalErrors}<span className="font-normal text-[8px] ml-0.5" style={{ color: 'var(--text-muted)' }}>err</span></span>
            <span className="font-bold tabular-nums" style={{ color: '#f59e0b' }}>{totalWarnings}<span className="font-normal text-[8px] ml-0.5" style={{ color: 'var(--text-muted)' }}>warn</span></span>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>{schemaResult?.tableStats.length ?? 0}<span className="font-normal text-[8px] ml-0.5">tbl</span></span>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>{rules.filter(r => r.enabled).length}<span className="font-normal text-[8px] ml-0.5">rules</span></span>
          </div>
          <div className="flex-1" />
          {/* Tabs inline */}
          <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {([
              { id: 'schema' as TabId, label: 'Schema', count: schemaResult?.issues.length ?? 0 },
              { id: 'rules' as TabId, label: 'Rules', count: rulesResult?.violations.length ?? 0 },
              { id: 'history' as TabId, label: 'History', count: history.length },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 text-[10px] font-semibold cursor-pointer"
                style={{ background: activeTab === tab.id ? 'var(--accent)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                {tab.label}{tab.count > 0 ? ` (${tab.count})` : ''}
              </button>
            ))}
          </div>
          <button onClick={runAllValidations} disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
            style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.6 : 1 }}>
            {loading ? <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>}
            {loading ? '...' : '실행'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — table list (Schema tab only) */}
        {activeTab === 'schema' && schemaResult && (
          <div className="flex-shrink-0 overflow-y-auto" style={{ width: 220, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
              Tables ({schemaResult.tableStats.length})
            </div>
            {[...schemaResult.tableStats].sort((a, b) => {
              if ((b.errors + b.warnings) !== (a.errors + a.warnings)) return (b.errors + b.warnings) - (a.errors + a.warnings);
              return a.name.localeCompare(b.name);
            }).map(stat => {
              const hasIssue = stat.errors > 0 || stat.warnings > 0;
              const isSelected = selectedTable === stat.name;
              return (
                <button key={stat.name}
                  onClick={() => setSelectedTable(isSelected ? null : stat.name)}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left cursor-pointer"
                  style={{ background: isSelected ? 'var(--bg-surface)' : 'transparent', borderBottom: '1px solid var(--border-color)', borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  {!stat.matched ? (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
                  ) : hasIssue ? (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                  )}
                  <span className="text-[10px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stat.name}</span>
                  {hasIssue && (
                    <span className="text-[8px] font-bold tabular-nums flex-shrink-0" style={{ color: '#ef4444' }}>
                      {stat.errors > 0 ? stat.errors : ''}{stat.errors > 0 && stat.warnings > 0 ? '/' : ''}{stat.warnings > 0 ? <span style={{ color: '#f59e0b' }}>{stat.warnings}</span> : ''}
                    </span>
                  )}
                  {!hasIssue && stat.matched && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {activeTab === 'schema' && (
              <SchemaTab
                result={schemaResult}
                severityFilter={schemaSeverityFilter}
                setSeverityFilter={setSchemaSeverityFilter}
                categoryFilter={schemaCategoryFilter}
                setCategoryFilter={setSchemaCategoryFilter}
                search={schemaSearch}
                setSearch={setSchemaSearch}
                selectedTable={selectedTable}
              />
            )}
            {activeTab === 'rules' && (
              <RulesTab rules={rules} setRules={setRules} result={rulesResult} filter={rulesFilter} setFilter={setRulesFilter}
                showForm={showRuleForm} setShowForm={setShowRuleForm} editingRule={editingRule} setEditingRule={setEditingRule} />
            )}
            {activeTab === 'history' && (
              <HistoryTab history={history} selectedId={selectedHistoryId} setSelectedId={setSelectedHistoryId} onClear={() => saveHistory([])} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Schema Tab ───────────────────────────────────────────────────────────────

function SchemaTab({ result, severityFilter, setSeverityFilter, categoryFilter, setCategoryFilter, search, setSearch, selectedTable }: {
  result: SchemaValidationResult | null;
  severityFilter: VSeverity | 'all';
  setSeverityFilter: (v: VSeverity | 'all') => void;
  categoryFilter: VCategory | 'all';
  setCategoryFilter: (v: VCategory | 'all') => void;
  search: string;
  setSearch: (v: string) => void;
  selectedTable: string | null;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  if (!result) return <EmptyState text="검증 실행 버튼을 눌러주세요." />;

  const filtered = result.issues.filter(issue => {
    if (selectedTable && issue.table !== selectedTable) return false;
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (search) { const q = search.toLowerCase(); if (!issue.table.toLowerCase().includes(q) && !issue.title.toLowerCase().includes(q) && !issue.column.toLowerCase().includes(q)) return false; }
    return true;
  }).sort((a, b) => ({ error: 0, warning: 1, info: 2 }[a.severity] - { error: 0, warning: 1, info: 2 }[b.severity]));

  const groupedByTable = new Map<string, ValidationIssue[]>();
  for (const issue of filtered) { if (!groupedByTable.has(issue.table)) groupedByTable.set(issue.table, []); groupedByTable.get(issue.table)!.push(issue); }
  const sortedTables = [...groupedByTable.entries()].sort((a, b) => b[1].length - a[1].length);

  const toggleExpand = (id: string) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {(['error', 'warning', 'info'] as VSeverity[]).map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          const count = sev === 'error' ? result.errorCount : sev === 'warning' ? result.warningCount : result.infoCount;
          return (
            <button key={sev} onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
              style={{ background: severityFilter === sev ? cfg.bg : 'transparent', border: `1px solid ${severityFilter === sev ? cfg.color + '40' : 'var(--border-color)'}` }}>
              <span style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="tabular-nums" style={{ color: count > 0 ? cfg.color : 'var(--text-muted)' }}>{count}</span>
            </button>
          );
        })}
        <div className="w-px h-5" style={{ background: 'var(--border-color)' }} />
        {(Object.entries(CATEGORY_CONFIG) as [VCategory, { label: string; icon: string }][]).map(([cat, cfg]) => (
          <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            className="px-1.5 py-1 rounded text-[9px] font-semibold cursor-pointer"
            style={{ background: categoryFilter === cat ? 'var(--bg-surface)' : 'transparent', border: `1px solid ${categoryFilter === cat ? 'var(--accent)40' : 'transparent'}`, color: categoryFilter === cat ? 'var(--accent)' : 'var(--text-muted)' }}>
            {cfg.label} {result.byCategory[cat]}
          </button>
        ))}
        <div className="flex-1" />
        <input type="text" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="text-[10px] px-2.5 py-1 rounded outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: 140 }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState text={result.issues.length === 0 ? `${result.totalRows.toLocaleString()}행 모두 통과` : '필터에 맞는 이슈 없음'} icon="check" />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {sortedTables.length}개 테이블 · {filtered.length}개 이슈
          </div>
          {sortedTables.map(([tableName, tableIssues]) => (
            <TableGroup key={tableName} tableName={tableName} issues={tableIssues} expandedIds={expandedIds} onToggle={toggleExpand} dataTables={result.tables} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab({ rules, setRules, result, filter, setFilter, showForm, setShowForm, editingRule, setEditingRule }: {
  rules: ValidationRule[];
  setRules: (r: ValidationRule[]) => void;
  result: RulesValidationResult | null;
  filter: 'all' | 'error' | 'warning';
  setFilter: (f: 'all' | 'error' | 'warning') => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingRule: ValidationRule | null;
  setEditingRule: (r: ValidationRule | null) => void;
}) {
  const handleToggle = async (rule: ValidationRule) => {
    try { await fetch('/api/validation-rules/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id }) }); setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)); } catch (e) { console.warn('[ValidationLayout]', e) }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try { await fetch(`/api/validation-rules/delete?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); setRules(rules.filter(r => r.id !== id)); } catch (e) { console.warn('[ValidationLayout]', e) }
  };
  const handleSave = async (rule: Partial<ValidationRule>) => {
    try { const r = await fetch('/api/validation-rules/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) }); if (r.ok) { const lr = await fetch('/api/validation-rules/list'); if (lr.ok) { const d = await lr.json() as { rules: ValidationRule[] }; setRules(d.rules ?? []); } } } catch (e) { console.warn('[ValidationLayout]', e) }
    setShowForm(false); setEditingRule(null);
  };

  const filteredViolations = useMemo(() => {
    if (!result) return [];
    return filter === 'all' ? result.violations : result.violations.filter(v => v.severity === filter);
  }, [result, filter]);

  const violationsByRule = useMemo(() => {
    const m = new Map<string, RuleViolation[]>();
    for (const v of filteredViolations) { if (!m.has(v.ruleId)) m.set(v.ruleId, []); m.get(v.ruleId)!.push(v); }
    return m;
  }, [filteredViolations]);

  return (
    <>
      <div className="flex items-center gap-1.5 mb-3">
        {(['all', 'error', 'warning'] as const).map(f => {
          const count = f === 'all' ? (result?.violations.length ?? 0) : (result?.violations.filter(v => v.severity === f).length ?? 0);
          const color = f === 'error' ? '#ef4444' : f === 'warning' ? '#f59e0b' : 'var(--accent)';
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2 py-1 rounded text-[9px] font-bold cursor-pointer tabular-nums"
              style={{ background: filter === f ? (f === 'all' ? 'var(--bg-surface)' : `${color}18`) : 'transparent', border: `1px solid ${filter === f ? `${color}40` : 'var(--border-color)'}`, color: filter === f ? color : 'var(--text-muted)' }}>
              {f === 'all' ? '전체' : f === 'error' ? '오류' : '경고'} {count}
            </button>
          );
        })}
        <div className="flex-1" />
        <button onClick={() => { setEditingRule(null); setShowForm(true); }}
          className="px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          + 추가
        </button>
      </div>

      {showForm && <RuleForm initial={editingRule} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingRule(null); }} />}

      {rules.length === 0 ? <EmptyState text="등록된 검증룰이 없습니다." /> : (
        <div className="flex flex-col gap-1">
          {rules.map(rule => {
            const violations = violationsByRule.get(rule.id) ?? [];
            const sevColor = rule.severity === 'error' ? '#ef4444' : '#f59e0b';
            return (
              <div key={rule.id} className="rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', opacity: rule.enabled ? 1 : 0.45 }}>
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* toggle */}
                  <button onClick={() => handleToggle(rule)} className="w-6 h-3 rounded-full relative cursor-pointer flex-shrink-0"
                    style={{ background: rule.enabled ? 'var(--accent)' : 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="w-2 h-2 rounded-full absolute" style={{ background: '#fff', top: '1.5px', left: rule.enabled ? '12px' : '2px', transition: 'left 0.15s' }} />
                  </button>
                  {/* severity dot */}
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sevColor }} />
                  {/* name + condition */}
                  <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{rule.name}</span>
                  <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {rule.table} · {conditionSummary(rule.condition)}
                  </span>
                  <div className="flex-1" />
                  {violations.length > 0 && (
                    <span className="text-[8px] font-bold px-1 py-[1px] rounded tabular-nums" style={{ background: `${sevColor}18`, color: sevColor }}>{violations.length}</span>
                  )}
                  <button onClick={() => { setEditingRule(rule); setShowForm(true); }} className="text-[9px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>편집</button>
                  <button onClick={() => handleDelete(rule.id)} className="text-[9px] cursor-pointer" style={{ color: '#ef4444' }}>삭제</button>
                </div>
                {violations.length > 0 && (
                  <div className="px-3 pb-2 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {violations.slice(0, 5).map((v, i) => (
                      <div key={i} className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: sevColor }}>·</span> {v.table} id={v.rowId} — {v.details}
                      </div>
                    ))}
                    {violations.length > 5 && <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>... 외 {violations.length - 5}건</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Rule Form (compact) ──────────────────────────────────────────────────────

function RuleForm({ initial, onSave, onCancel }: {
  initial: ValidationRule | null;
  onSave: (rule: Partial<ValidationRule>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [table, setTable] = useState(initial?.table ?? '');
  const [severity, setSeverity] = useState<'error' | 'warning'>(initial?.severity ?? 'error');
  const [condType, setCondType] = useState(initial?.condition.type ?? 'not_null');
  const [column, setColumn] = useState('column' in (initial?.condition ?? {}) ? (initial?.condition as { column?: string }).column ?? '' : '');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [values, setValues] = useState('');
  const [refTable, setRefTable] = useState('');
  const [pattern, setPattern] = useState('');

  useEffect(() => {
    if (!initial) return;
    const c = initial.condition;
    if ('column' in c) setColumn((c as { column: string }).column);
    if (c.type === 'range') { setMin(c.min?.toString() ?? ''); setMax(c.max?.toString() ?? ''); }
    if (c.type === 'in' || c.type === 'not_in') setValues(c.values.join(', '));
    if (c.type === 'fk_ref') setRefTable(c.ref_table);
    if (c.type === 'regex') setPattern(c.pattern);
  }, [initial]);

  const handleSubmit = () => {
    if (!name.trim() || !table.trim()) return;
    let condition: RuleCondition;
    switch (condType) {
      case 'not_null': condition = { type: 'not_null', column }; break;
      case 'range': condition = { type: 'range', column, ...(min ? { min: Number(min) } : {}), ...(max ? { max: Number(max) } : {}) }; break;
      case 'in': condition = { type: 'in', column, values: values.split(',').map(v => v.trim()).filter(Boolean) }; break;
      case 'not_in': condition = { type: 'not_in', column, values: values.split(',').map(v => v.trim()).filter(Boolean) }; break;
      case 'regex': condition = { type: 'regex', column, pattern }; break;
      case 'fk_ref': condition = { type: 'fk_ref', column, ref_table: refTable, allow_sentinel: true }; break;
      case 'unique': condition = { type: 'unique', column }; break;
      default: condition = { type: 'not_null', column }; break;
    }
    onSave({ ...(initial ? { id: initial.id } : {}), name, table, severity, condition, enabled: initial?.enabled ?? true, scope: 'team' });
  };

  const S: React.CSSProperties = { background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' };

  return (
    <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)30' }}>
      <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{initial ? '편집' : '새 룰'}</div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="룰 이름" className="px-2 py-1 rounded text-[10px] col-span-2" style={S} />
        <input value={table} onChange={e => setTable(e.target.value)} placeholder="테이블" className="px-2 py-1 rounded text-[10px]" style={S} />
        <select value={severity} onChange={e => setSeverity(e.target.value as 'error' | 'warning')} className="px-2 py-1 rounded text-[10px] cursor-pointer" style={S}>
          <option value="error">Error</option><option value="warning">Warning</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <select value={condType} onChange={e => setCondType(e.target.value as RuleCondition['type'])} className="px-2 py-1 rounded text-[10px] cursor-pointer" style={S}>
          <option value="not_null">NOT NULL</option><option value="range">Range</option><option value="in">IN</option>
          <option value="not_in">NOT IN</option><option value="regex">Regex</option><option value="fk_ref">FK Ref</option><option value="unique">Unique</option>
        </select>
        <input value={column} onChange={e => setColumn(e.target.value)} placeholder="컬럼" className="px-2 py-1 rounded text-[10px]" style={S} />
        {condType === 'range' && <input value={min} onChange={e => setMin(e.target.value)} placeholder="min" type="number" className="px-2 py-1 rounded text-[10px]" style={S} />}
        {condType === 'range' && <input value={max} onChange={e => setMax(e.target.value)} placeholder="max" type="number" className="px-2 py-1 rounded text-[10px]" style={S} />}
        {(condType === 'in' || condType === 'not_in') && <input value={values} onChange={e => setValues(e.target.value)} placeholder="값 (쉼표 구분)" className="px-2 py-1 rounded text-[10px]" style={S} />}
        {condType === 'regex' && <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="패턴" className="px-2 py-1 rounded text-[10px]" style={S} />}
        {condType === 'fk_ref' && <input value={refTable} onChange={e => setRefTable(e.target.value)} placeholder="참조 테이블" className="px-2 py-1 rounded text-[10px]" style={S} />}
      </div>
      <div className="flex gap-1.5 justify-end">
        <button onClick={onCancel} className="px-2.5 py-1 rounded text-[10px] cursor-pointer" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>취소</button>
        <button onClick={handleSubmit} className="px-3 py-1 rounded text-[10px] font-bold cursor-pointer" style={{ background: 'var(--accent)', color: '#fff' }}>저장</button>
      </div>
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ history, selectedId, setSelectedId, onClear }: {
  history: HistoryEntry[]; selectedId: string | null; setSelectedId: (id: string | null) => void; onClear: () => void;
}) {
  const selected = history.find(h => h.id === selectedId);
  if (history.length === 0) return <EmptyState text="검증 히스토리가 없습니다." />;

  const sparkData = [...history].reverse().slice(-20);
  const maxVal = Math.max(...sparkData.map(h => h.schemaErrors + h.ruleErrors), 1);

  return (
    <>
      <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>오류 추이 ({sparkData.length}회)</span>
          <button onClick={onClear} className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer" style={{ color: '#ef4444', background: '#ef444410' }}>삭제</button>
        </div>
        <div className="flex items-end gap-[2px]" style={{ height: 40 }}>
          {sparkData.map((h, i) => {
            const errH = Math.max(2, ((h.schemaErrors + h.ruleErrors) / maxVal) * 36);
            return (
              <div key={i} className="flex-1 cursor-pointer" onClick={() => setSelectedId(h.id)}
                style={{ opacity: selectedId === h.id ? 1 : 0.5 }}>
                <div className="w-full rounded-sm" style={{ height: errH, background: (h.schemaErrors + h.ruleErrors) > 0 ? '#ef4444' : '#22c55e' }} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {history.map(e => {
          const tE = e.schemaErrors + e.ruleErrors, tW = e.schemaWarnings + e.ruleWarnings;
          const sel = selectedId === e.id;
          return (
            <button key={e.id} onClick={() => setSelectedId(sel ? null : e.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer w-full"
              style={{ background: sel ? 'var(--bg-surface)' : 'var(--bg-secondary)', border: `1px solid ${sel ? 'var(--accent)40' : 'var(--border-color)'}` }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tE > 0 ? '#ef4444' : tW > 0 ? '#f59e0b' : '#22c55e' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(e.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{e.totalTables}tbl · {e.durationMs}ms</span>
              <div className="flex-1" />
              {tE > 0 && <span className="text-[8px] font-bold tabular-nums" style={{ color: '#ef4444' }}>{tE}E</span>}
              {tW > 0 && <span className="text-[8px] font-bold tabular-nums" style={{ color: '#f59e0b' }}>{tW}W</span>}
              {tE === 0 && tW === 0 && <span className="text-[8px] font-bold" style={{ color: '#22c55e' }}>OK</span>}
            </button>
          );
        })}
      </div>

      {selected?.ruleViolations && selected.ruleViolations.length > 0 && (
        <div className="mt-3 rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {new Date(selected.timestamp).toLocaleString('ko-KR')} — {selected.ruleViolations.length}건
          </div>
          <div className="flex flex-col gap-0.5">
            {selected.ruleViolations.slice(0, 20).map((v, i) => (
              <div key={i} className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: v.severity === 'error' ? '#ef4444' : '#f59e0b' }}>·</span> {v.ruleName} — {v.table} id={v.rowId}: {v.details}
              </div>
            ))}
            {selected.ruleViolations.length > 20 && <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>... 외 {selected.ruleViolations.length - 20}건</div>}
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function EmptyState({ text, icon }: { text: string; icon?: 'check' }) {
  return (
    <div className="text-center py-10">
      <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ background: icon === 'check' ? '#22c55e18' : 'var(--bg-surface)' }}>
        {icon === 'check'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  );
}

function TableGroup({ tableName, issues, expandedIds, onToggle, dataTables }: {
  tableName: string; issues: ValidationIssue[]; expandedIds: Set<string>; onToggle: (id: string) => void; dataTables?: TableData[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const worstSev = issues.some(i => i.severity === 'error') ? 'error' : issues.some(i => i.severity === 'warning') ? 'warning' : 'info';
  const sevCfg = SEVERITY_CONFIG[worstSev];
  const eC = issues.filter(i => i.severity === 'error').length;
  const wC = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <button onClick={() => setCollapsed(v => !v)} className="flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer"
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sevCfg.color }} />
        <span className="text-[11px] font-bold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tableName}</span>
        {eC > 0 && <span className="text-[8px] font-bold tabular-nums" style={{ color: '#ef4444' }}>{eC}E</span>}
        {wC > 0 && <span className="text-[8px] font-bold tabular-nums" style={{ color: '#f59e0b' }}>{wC}W</span>}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s', flexShrink: 0, opacity: 0.4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-1 px-2 pb-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div style={{ height: 2 }} />
          {issues.slice(0, 100).map(issue => (
            <IssueCard key={issue.id} issue={issue} expanded={expandedIds.has(issue.id)} onToggle={() => onToggle(issue.id)} dataTables={dataTables} />
          ))}
          {issues.length > 100 && <div className="text-center py-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>+ {issues.length - 100}개 더...</div>}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, expanded, onToggle, dataTables }: { issue: ValidationIssue; expanded: boolean; onToggle: () => void; dataTables?: TableData[] }) {
  const sevCfg = SEVERITY_CONFIG[issue.severity];
  const catCfg = CATEGORY_CONFIG[issue.category];

  const rowData = expanded && dataTables ? (() => {
    const dt = dataTables.find(t => t.name === issue.table);
    if (!dt) return null;
    const idx = issue.row - 2;
    if (idx < 0 || idx >= dt.rows.length) return null;
    return { headers: dt.headers, row: dt.rows[idx] };
  })() : null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${sevCfg.color}` }}>
      <button onClick={onToggle} className="flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer"
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <span className="text-[7px] font-bold px-1 py-[1px] rounded tracking-wider flex-shrink-0" style={{ background: sevCfg.bg, color: sevCfg.color }}>{sevCfg.label}</span>
        <span className="text-[7px] font-black flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{catCfg.icon}</span>
        <span className="text-[10px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>{issue.title}</span>
        <span className="text-[8px] flex-shrink-0" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{issue.column} R{issue.row}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-[10px] leading-[1.6] pt-2" style={{ color: 'var(--text-secondary)' }}>{issue.description}</p>
          {rowData && (
            <div className="mt-2 rounded overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <thead><tr>{rowData.headers.map(h => (
                    <th key={h} className="px-2 py-1 text-left whitespace-nowrap" style={{
                      background: h === issue.column ? `${sevCfg.color}18` : 'var(--bg-primary)',
                      color: h === issue.column ? sevCfg.color : 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)',
                      fontWeight: h === issue.column ? 800 : 600,
                    }}>{h}</th>
                  ))}</tr></thead>
                  <tbody><tr>{rowData.headers.map(h => {
                    const val = rowData.row[h] ?? '';
                    const t = h === issue.column;
                    return (
                      <td key={h} className="px-2 py-1 whitespace-nowrap" style={{
                        background: t ? `${sevCfg.color}10` : 'var(--bg-secondary)',
                        color: t ? sevCfg.color : 'var(--text-primary)',
                        borderRight: '1px solid var(--border-color)', fontWeight: t ? 700 : 400,
                      }}>{val || <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>(empty)</span>}</td>
                    );
                  })}</tr></tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
