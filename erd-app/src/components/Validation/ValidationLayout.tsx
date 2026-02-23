import { useState, useCallback, useRef, useEffect } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import {
  parseDataFromFiles,
  validateData,
  type ValidationResult,
  type ValidationIssue,
  type VSeverity,
  type VCategory,
  type TableValidationStat,
  type TableData,
} from '../../core/validation/dataValidator.ts';

const SEVERITY_CONFIG: Record<VSeverity, { label: string; color: string; bg: string }> = {
  error: { label: 'ERROR', color: '#ef4444', bg: '#ef444418' },
  warning: { label: 'WARN', color: '#f59e0b', bg: '#f59e0b18' },
  info: { label: 'INFO', color: 'var(--accent)', bg: 'var(--accent-muted)' },
};

const CATEGORY_CONFIG: Record<VCategory, { label: string; icon: string; desc: string }> = {
  referential: { label: 'FK 참조', icon: 'R', desc: 'FK 참조 무결성' },
  uniqueness: { label: 'PK 중복', icon: 'U', desc: 'PK 유일성' },
  required: { label: 'NOT NULL', icon: 'N', desc: '필수값 누락' },
  enum: { label: 'Enum', icon: 'E', desc: 'Enum 값 위반' },
  type: { label: 'Type', icon: 'T', desc: '타입 불일치' },
};

type ViewMode = 'all' | 'table';
type SeverityFilter = VSeverity | 'all';
type CategoryFilter = VCategory | 'all';

interface FolderEntry {
  handle: FileSystemDirectoryHandle;
  name: string;
}

const IDB_NAME = 'erd-studio-import';
const IDB_STORE = 'dir-handles';
const IDB_DATAVAL_KEY = 'last-dataval-dirs';

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirHandles(handles: FileSystemDirectoryHandle[]) {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).put(handles, IDB_DATAVAL_KEY);
  db.close();
}

async function loadDirHandles(): Promise<FileSystemDirectoryHandle[]> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_DATAVAL_KEY);
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        if (Array.isArray(result)) resolve(result);
        else if (result) resolve([result]);
        else resolve([]);
      };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch { return []; }
}

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'read' as const };
  if (await (handle as any).queryPermission(opts) === 'granted') return true;
  if (await (handle as any).requestPermission(opts) === 'granted') return true;
  return false;
}

async function readFilesFromHandle(dirHandle: FileSystemDirectoryHandle): Promise<{ name: string; data: ArrayBuffer }[]> {
  const files: { name: string; data: ArrayBuffer }[] = [];
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.xlsx') && !entry.name.startsWith('~$')) {
      const file = await entry.getFile();
      const data = await file.arrayBuffer();
      files.push({ name: entry.name, data });
    }
  }
  return files;
}

export default function ValidationLayout() {
  const schema = useSchemaStore((s) => s.schema);
  const tableData = useCanvasStore((s) => s.tableData);

  const [step, setStep] = useState<'pick' | 'loading' | 'result'>('pick');
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [savedFolders, setSavedFolders] = useState<FolderEntry[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [loadLogs, setLoadLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const hasFSApi = 'showDirectoryPicker' in window;
  const autoRan = useRef(false);

  useEffect(() => {
    if (!hasFSApi) return;
    loadDirHandles().then((handles) => {
      if (handles.length > 0) setSavedFolders(handles.map((h) => ({ handle: h, name: h.name })));
    });
  }, [hasFSApi]);

  // Auto-validate if tableData is already loaded (from auto-load)
  useEffect(() => {
    if (autoRan.current || !schema || tableData.size === 0 || result) return;
    autoRan.current = true;

    const tables: TableData[] = [];
    for (const [key, val] of tableData) {
      tables.push({ name: key, headers: val.headers, rows: val.rows, rowCount: val.rows.length });
    }

    const vResult = validateData(schema, tables);
    setResult(vResult);
    setStep('result');
  }, [schema, tableData, result]);

  const runValidation = useCallback(async (entries: FolderEntry[]) => {
    if (!schema) return;
    setStep('loading');
    setLoadLogs(['Reading data files from folders...']);

    try {
      const allFiles: { name: string; data: ArrayBuffer }[] = [];
      for (const entry of entries) {
        const files = await readFilesFromHandle(entry.handle);
        setLoadLogs((prev) => [...prev, `  ${entry.name}: ${files.length} files`]);
        allFiles.push(...files);
      }

      setLoadLogs((prev) => [...prev, `\nParsing data...`]);
      const { tables, logs } = parseDataFromFiles(allFiles, schema);
      setLoadLogs((prev) => [...prev, ...logs]);

      setLoadLogs((prev) => [...prev, `\nValidating ${tables.length} tables against schema...`]);
      const vResult = validateData(schema, tables);
      setResult(vResult);
      setStep('result');

      const heatmap = new Map<string, number>();
      const tblData = new Map<string, { headers: string[]; rows: Record<string, string>[] }>();
      for (const dt of tables) {
        const key = dt.name.toLowerCase();
        heatmap.set(key, dt.rowCount);
        tblData.set(key, { headers: dt.headers, rows: dt.rows });
      }
      useCanvasStore.getState().setHeatmapData(heatmap);
      useCanvasStore.getState().setTableData(tblData);
    } catch (err: any) {
      setLoadLogs((prev) => [...prev, `[ERROR] ${err}`]);
    }
  }, [schema]);

  const handleAddFolder = useCallback(async () => {
    if (hasFSApi) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (!folders.some((f) => f.name === dirHandle.name)) {
          setFolders((prev) => [...prev, { handle: dirHandle, name: dirHandle.name }]);
        }
      } catch (err: any) { if (err.name === 'AbortError') return; }
    } else {
      inputRef.current?.click();
    }
  }, [hasFSApi, folders]);

  const handleRemoveFolder = useCallback((idx: number) => {
    setFolders((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleStartValidation = useCallback(async () => {
    if (folders.length === 0) return;
    await saveDirHandles(folders.map((f) => f.handle));
    setSavedFolders([...folders]);
    await runValidation(folders);
  }, [folders, runValidation]);

  const handleQuickLoad = useCallback(async () => {
    if (savedFolders.length === 0) return;
    setQuickLoading(true);
    try {
      const verified: FolderEntry[] = [];
      for (const e of savedFolders) {
        if (await verifyPermission(e.handle)) verified.push(e);
      }
      if (verified.length === 0) { setSavedFolders([]); setQuickLoading(false); return; }
      setFolders(verified);
      await runValidation(verified);
    } catch { setSavedFolders([]); }
    setQuickLoading(false);
  }, [savedFolders, runValidation]);

  const handleReset = () => {
    setStep('pick');
    setResult(null);
    setLoadLogs([]);
    setSeverityFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setExpandedIds(new Set());
  };

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h2 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>스키마 없음</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Editor에서 DBML을 작성하거나 Excel을 Import하세요.</p>
        </div>
      </div>
    );
  }

  if (step === 'pick') {
    return <PickerStep
      folders={folders}
      savedFolders={savedFolders}
      hasFSApi={hasFSApi}
      quickLoading={quickLoading}
      onAddFolder={handleAddFolder}
      onRemoveFolder={handleRemoveFolder}
      onStart={handleStartValidation}
      onQuickLoad={handleQuickLoad}
      inputRef={inputRef}
      schemaTableCount={schema.tables.length}
    />;
  }

  if (step === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center" style={{ maxWidth: 480 }}>
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full spinner mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>데이터를 읽고 검증하는 중...</p>
          <div className="rounded-xl p-3 text-left max-h-48 overflow-y-auto text-[10px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            {loadLogs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const filtered = result.issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!issue.table.toLowerCase().includes(q) && !issue.title.toLowerCase().includes(q) && !issue.column.toLowerCase().includes(q) && !issue.value.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const sev: Record<VSeverity, number> = { error: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });

  const groupedByTable = new Map<string, ValidationIssue[]>();
  for (const issue of sortedFiltered) {
    if (!groupedByTable.has(issue.table)) groupedByTable.set(issue.table, []);
    groupedByTable.get(issue.table)!.push(issue);
  }
  const sortedTables = [...groupedByTable.entries()].sort((a, b) => b[1].length - a[1].length);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const scoreColor = result.score >= 90 ? '#22c55e' : result.score >= 70 ? '#f59e0b' : '#ef4444';
  const scoreGrade = result.score >= 95 ? 'A+' : result.score >= 90 ? 'A' : result.score >= 80 ? 'B' : result.score >= 70 ? 'C' : result.score >= 50 ? 'D' : 'F';

  const matchedTables = result.tables.filter((dt) => schema.tables.some((st) => st.name.toLowerCase() === dt.name.toLowerCase()));
  const unmatchedTables = result.tables.filter((dt) => !schema.tables.some((st) => st.name.toLowerCase() === dt.name.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Summary bar */}
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-5" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Score */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-[16px]" style={{ background: `${scoreColor}15`, color: scoreColor, border: `2px solid ${scoreColor}40` }}>
              {scoreGrade}
            </div>
            <div>
              <div className="text-[20px] font-bold tabular-nums leading-tight" style={{ color: scoreColor }}>
                {result.score}<span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}> / 100</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Data Integrity</div>
            </div>
          </div>

          <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

          {/* Stats */}
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex flex-col items-center">
              <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{result.totalRows.toLocaleString()}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rows</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{matchedTables.length}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Matched</span>
            </div>
            {unmatchedTables.length > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-[14px] font-bold tabular-nums" style={{ color: '#f59e0b' }}>{unmatchedTables.length}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Unmatched</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{result.totalChecks.toLocaleString()}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Checks</span>
            </div>
          </div>

          <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

          {/* Severity */}
          <div className="flex items-center gap-2">
            {(['error', 'warning', 'info'] as VSeverity[]).map((sev) => {
              const cfg = SEVERITY_CONFIG[sev];
              const count = sev === 'error' ? result.errorCount : sev === 'warning' ? result.warningCount : result.infoCount;
              return (
                <button key={sev} onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer"
                  style={{ background: severityFilter === sev ? cfg.bg : 'transparent', border: `1px solid ${severityFilter === sev ? cfg.color + '40' : 'var(--border-color)'}`, transition: 'all 0.15s' }}>
                  <span className="text-[9px] font-bold tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: count > 0 ? cfg.color : 'var(--text-muted)' }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

          {/* Category */}
          <div className="flex items-center gap-1.5">
            {(Object.entries(CATEGORY_CONFIG) as [VCategory, typeof CATEGORY_CONFIG[VCategory]][]).map(([cat, cfg]) => (
              <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer"
                style={{ background: categoryFilter === cat ? 'var(--bg-surface)' : 'transparent', border: `1px solid ${categoryFilter === cat ? 'var(--accent)40' : 'transparent'}`, transition: 'all 0.15s' }}>
                <span className="w-3.5 h-3.5 rounded text-[7px] font-black flex items-center justify-center" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{cfg.icon}</span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>{result.byCategory[cat]}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search + View + Reset */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex p-[2px] rounded-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <button onClick={() => setViewMode('all')} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                style={{ background: viewMode === 'all' ? 'var(--accent)' : 'transparent', color: viewMode === 'all' ? '#fff' : 'var(--text-muted)' }}>All</button>
              <button onClick={() => setViewMode('table')} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                style={{ background: viewMode === 'table' ? 'var(--accent)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-muted)' }}>By Table</button>
            </div>
            <div className="relative">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
                className="absolute left-2.5 top-1/2" style={{ transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="text-[11px] pl-7 pr-3 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: 150 }} />
            </div>
            <button onClick={handleReset} className="p-1.5 rounded-lg cursor-pointer" title="다시 검증"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Unmatched tables warning */}
          {unmatchedTables.length > 0 && (
            <div className="rounded-xl p-4 mb-5" style={{ background: '#f59e0b12', border: '1px solid #f59e0b30' }}>
              <div className="flex items-start gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <div className="text-[12px] font-bold mb-1" style={{ color: '#f59e0b' }}>스키마에 없는 데이터 테이블 {unmatchedTables.length}개</div>
                  <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {unmatchedTables.map((t) => t.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table checklist */}
          <TableChecklist stats={result.tableStats} />

          {sortedFiltered.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: '#22c55e18' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {result.issues.length === 0 ? '이슈 없음' : '필터 조건에 맞는 이슈 없음'}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {result.issues.length === 0 ? `${result.totalRows.toLocaleString()}개 행, ${result.totalChecks.toLocaleString()}개 검사 모두 통과` : '필터를 조정해보세요.'}
              </p>
            </div>
          ) : viewMode === 'all' ? (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {sortedFiltered.length}개 이슈
              </div>
              {sortedFiltered.slice(0, 500).map((issue) => (
                <IssueCard key={issue.id} issue={issue} expanded={expandedIds.has(issue.id)} onToggle={() => toggleExpand(issue.id)} dataTables={result.tables} />
              ))}
              {sortedFiltered.length > 500 && (
                <div className="text-center py-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  + {sortedFiltered.length - 500}개 이슈 더... (필터를 사용하세요)
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {sortedTables.length}개 테이블, {sortedFiltered.length}개 이슈
              </div>
              {sortedTables.map(([tableName, tableIssues]) => (
                <TableGroup key={tableName} tableName={tableName} issues={tableIssues} expandedIds={expandedIds} onToggle={toggleExpand} dataTables={result.tables} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────── Picker Step ─────── */

function PickerStep({ folders, savedFolders, hasFSApi, quickLoading, onAddFolder, onRemoveFolder, onStart, onQuickLoad, inputRef, schemaTableCount }: {
  folders: FolderEntry[];
  savedFolders: FolderEntry[];
  hasFSApi: boolean;
  quickLoading: boolean;
  onAddFolder: () => void;
  onRemoveFolder: (i: number) => void;
  onStart: () => void;
  onQuickLoad: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  schemaTableCount: number;
}) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Data Validation</h2>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            실제 데이터 시트를 스키마({schemaTableCount}개 테이블)와 비교하여<br />
            PK 중복, FK 참조 무결성, NOT NULL, Enum 값, 타입 일치를 검증합니다.
          </p>
        </div>

        {/* Quick Load */}
        {hasFSApi && savedFolders.length > 0 && folders.length === 0 && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>최근 사용한 데이터 폴더</span>
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {savedFolders.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                </div>
              ))}
            </div>
            <button onClick={onQuickLoad} disabled={quickLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-bold cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', opacity: quickLoading ? 0.6 : 1, boxShadow: 'var(--shadow-glow)' }}
              onMouseEnter={(e) => { if (!quickLoading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { if (!quickLoading) e.currentTarget.style.background = 'var(--accent)'; }}>
              {quickLoading ? (
                <div className="w-3 h-3 border-2 border-t-transparent rounded-full spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
              Quick Validate ({savedFolders.length} folders)
            </button>
          </div>
        )}

        {/* Folder list */}
        {folders.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Selected Folders</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{folders.length}</span>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {folders.map((folder, index) => (
                <div key={index} className="flex items-center gap-2.5 px-3 py-2.5"
                  style={{ background: 'var(--bg-secondary)', borderBottom: index < folders.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-[12px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{folder.name}</span>
                  <button onClick={() => onRemoveFolder(index)} className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444418'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2.5 justify-center">
          <button onClick={onAddFolder}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer"
            style={{ background: folders.length > 0 ? 'var(--bg-surface)' : 'var(--accent)', color: folders.length > 0 ? 'var(--text-secondary)' : '#fff', border: folders.length > 0 ? '1px solid var(--border-color)' : 'none', boxShadow: folders.length > 0 ? 'none' : 'var(--shadow-glow)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            {folders.length > 0 ? '폴더 추가' : '데이터 폴더 선택'}
          </button>
          {folders.length > 0 && (
            <button onClick={onStart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Validate ({folders.length} folders)
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" className="hidden"
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory="" multiple accept=".xlsx" />
      </div>
    </div>
  );
}

/* ─────── Issue Card ─────── */

function IssueCard({ issue, expanded, onToggle, dataTables }: { issue: ValidationIssue; expanded: boolean; onToggle: () => void; dataTables?: TableData[] }) {
  const sevCfg = SEVERITY_CONFIG[issue.severity];
  const catCfg = CATEGORY_CONFIG[issue.category];

  const rowData = expanded && dataTables ? (() => {
    const dt = dataTables.find((t) => t.name === issue.table);
    if (!dt) return null;
    const rowIdx = issue.row - 2;
    if (rowIdx < 0 || rowIdx >= dt.rows.length) return null;
    return { headers: dt.headers, row: dt.rows[rowIdx] };
  })() : null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${sevCfg.color}` }}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer" style={{ transition: 'background 0.12s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
        <span className="text-[8px] font-bold px-1.5 py-[2.5px] rounded tracking-wider flex-shrink-0" style={{ background: sevCfg.bg, color: sevCfg.color, minWidth: 38, textAlign: 'center' }}>{sevCfg.label}</span>
        <span className="w-4 h-4 rounded text-[7px] font-black flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{catCfg.icon}</span>
        <span className="text-[12px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>{issue.title}</span>
        <span className="text-[10px] font-medium flex-shrink-0 px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {issue.table}.{issue.column}
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
          Row {issue.row}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-3.5" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-[11.5px] leading-[1.7] pt-3" style={{ color: 'var(--text-secondary)' }}>{issue.description}</p>

          {/* Row data table */}
          {rowData && (
            <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr>
                      {rowData.headers.map((h) => (
                        <th key={h} className="px-2.5 py-1.5 text-left whitespace-nowrap" style={{
                          background: h === issue.column ? `${sevCfg.color}18` : 'var(--bg-primary)',
                          color: h === issue.column ? sevCfg.color : 'var(--text-muted)',
                          borderBottom: '1px solid var(--border-color)',
                          borderRight: '1px solid var(--border-color)',
                          fontWeight: h === issue.column ? 800 : 600,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {rowData.headers.map((h) => {
                        const val = rowData.row[h] ?? '';
                        const isTarget = h === issue.column;
                        return (
                          <td key={h} className="px-2.5 py-1.5 whitespace-nowrap" style={{
                            background: isTarget ? `${sevCfg.color}10` : 'var(--bg-secondary)',
                            color: isTarget ? sevCfg.color : 'var(--text-primary)',
                            borderRight: '1px solid var(--border-color)',
                            fontWeight: isTarget ? 700 : 400,
                          }}>
                            {val || <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>(empty)</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>Category: {catCfg.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────── Table Group ─────── */

function TableGroup({ tableName, issues, expandedIds, onToggle, dataTables }: {
  tableName: string;
  issues: ValidationIssue[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  dataTables?: TableData[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const worstSeverity = issues.some((i) => i.severity === 'error') ? 'error' : issues.some((i) => i.severity === 'warning') ? 'warning' : 'info';
  const sevCfg = SEVERITY_CONFIG[worstSeverity];

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <button onClick={() => setCollapsed((v) => !v)} className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer" style={{ transition: 'background 0.12s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sevCfg.color} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
        </svg>
        <span className="text-[13px] font-bold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tableName}</span>
        <div className="flex items-center gap-1.5">
          {errorCount > 0 && <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: '#ef444418', color: '#ef4444' }}>{errorCount} err</span>}
          {warnCount > 0 && <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: '#f59e0b18', color: '#f59e0b' }}>{warnCount} warn</span>}
        </div>
        <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: sevCfg.bg, color: sevCfg.color }}>{issues.length}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-1.5 px-3 pb-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div style={{ height: 4 }} />
          {issues.slice(0, 100).map((issue) => (
            <IssueCard key={issue.id} issue={issue} expanded={expandedIds.has(issue.id)} onToggle={() => onToggle(issue.id)} dataTables={dataTables} />
          ))}
          {issues.length > 100 && (
            <div className="text-center py-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>+ {issues.length - 100}개 이슈 더...</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────── Table Checklist ─────── */

const CHECK_LABELS: { key: keyof Pick<TableValidationStat, 'checkedPK' | 'checkedNotNull' | 'checkedFK' | 'checkedEnum' | 'checkedType'>; label: string }[] = [
  { key: 'checkedPK', label: 'PK' },
  { key: 'checkedNotNull', label: 'NULL' },
  { key: 'checkedFK', label: 'FK' },
  { key: 'checkedEnum', label: 'Enum' },
  { key: 'checkedType', label: 'Type' },
];

function TableChecklist({ stats }: { stats: TableValidationStat[] }) {
  const [expanded, setExpanded] = useState(true);
  const passedCount = stats.filter((s) => s.matched && s.errors === 0 && s.warnings === 0).length;
  const issueCount = stats.filter((s) => s.errors > 0 || s.warnings > 0).length;
  const unmatchedCount = stats.filter((s) => !s.matched).length;

  const sorted = [...stats].sort((a, b) => {
    if (!a.matched && b.matched) return 1;
    if (a.matched && !b.matched) return -1;
    if ((b.errors + b.warnings) !== (a.errors + a.warnings)) return (b.errors + b.warnings) - (a.errors + a.warnings);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="rounded-xl overflow-hidden mb-5" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer"
        style={{ transition: 'background 0.12s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>테이블별 검증 결과</span>
        <div className="flex items-center gap-1.5 ml-1">
          {passedCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: '#22c55e18', color: '#22c55e' }}>
              {passedCount} passed
            </span>
          )}
          {issueCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: '#ef444418', color: '#ef4444' }}>
              {issueCount} issues
            </span>
          )}
          {unmatchedCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
              {unmatchedCount} unmatched
            </span>
          )}
        </div>
        <span className="text-[10px] tabular-nums ml-auto" style={{ color: 'var(--text-muted)' }}>{stats.length} tables</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
            <span style={{ width: 24 }} />
            <span className="flex-1 min-w-0">Table</span>
            <span className="w-14 text-center">Rows</span>
            <span className="w-16 text-center">Checks</span>
            {CHECK_LABELS.map((c) => (
              <span key={c.key} className="w-11 text-center">{c.label}</span>
            ))}
            <span className="w-16 text-center">Status</span>
          </div>

          {/* Rows */}
          {sorted.map((stat) => (
            <TableCheckRow key={stat.name} stat={stat} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableCheckRow({ stat }: { stat: TableValidationStat }) {
  const hasIssue = stat.errors > 0 || stat.warnings > 0;
  const statusColor = !stat.matched ? '#f59e0b' : hasIssue ? '#ef4444' : '#22c55e';
  const statusLabel = !stat.matched ? 'SKIP' : hasIssue ? `${stat.errors}E ${stat.warnings}W` : 'PASS';

  return (
    <div
      className="flex items-center px-4 py-2"
      style={{ borderBottom: '1px solid var(--border-color)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon */}
      <div className="flex-shrink-0" style={{ width: 24 }}>
        {!stat.matched ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : hasIssue ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Table name */}
      <span className="flex-1 min-w-0 text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
        {stat.name}
      </span>

      {/* Rows */}
      <span className="w-14 text-center text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {stat.rows.toLocaleString()}
      </span>

      {/* Checks */}
      <span className="w-16 text-center text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {stat.checks.toLocaleString()}
      </span>

      {/* Check badges */}
      {CHECK_LABELS.map((c) => {
        const checked = stat[c.key];
        return (
          <span key={c.key} className="w-11 flex items-center justify-center">
            {checked ? (
              <span className="w-4 h-4 rounded flex items-center justify-center" style={{ background: '#22c55e18' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>—</span>
            )}
          </span>
        );
      })}

      {/* Status */}
      <span className="w-16 text-center">
        <span
          className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums inline-block"
          style={{ background: `${statusColor}15`, color: statusColor }}
        >
          {statusLabel}
        </span>
      </span>
    </div>
  );
}
