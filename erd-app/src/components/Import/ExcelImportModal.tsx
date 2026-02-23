import { useState, useRef, useCallback, useEffect } from 'react';
import { excelFilesToDbml } from '../../core/import/excelToDbml.ts';
import { useEditorStore } from '../../store/useEditorStore.ts';

interface ExcelImportModalProps {
  onClose: () => void;
}

type ImportState = 'idle' | 'processing' | 'done' | 'error';

const IDB_NAME = 'erd-studio-import';
const IDB_STORE = 'dir-handles';
const IDB_KEY = 'last-datadefine';

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirHandle(handle: FileSystemDirectoryHandle) {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
  db.close();
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        db.close();
        resolve(req.result ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'read' as const };
  if (await (handle as any).queryPermission(opts) === 'granted') return true;
  if (await (handle as any).requestPermission(opts) === 'granted') return true;
  return false;
}

export default function ExcelImportModal({ onClose }: ExcelImportModalProps) {
  const setDbmlText = useEditorStore((s) => s.setDbmlText);
  const [state, setState] = useState<ImportState>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<{ files: number; tables: number; columns: number; refs: number; enums: number; groups: number } | null>(null);
  const [dbmlResult, setDbmlResult] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    if (!('showDirectoryPicker' in window)) return;
    loadDirHandle().then((h) => {
      if (h) {
        setSavedHandle(h);
        setSavedName(h.name);
      }
    });
  }, []);

  const processDirectoryHandle = async (dirHandle: FileSystemDirectoryHandle) => {
    setState('processing');
    setLogs(['Reading files from folder...']);

    try {
      const files: { name: string; data: ArrayBuffer }[] = [];

      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.xlsx') && !entry.name.startsWith('~$')) {
          const file = await entry.getFile();
          const data = await file.arrayBuffer();
          files.push({ name: entry.name, data });
        }
      }

      if (files.length === 0) {
        setState('error');
        setError('No .xlsx files found in the selected folder.');
        return;
      }

      const result = excelFilesToDbml(files);
      setLogs(result.logs);
      setStats(result.stats);
      setDbmlResult(result.dbml);
      setState('done');
    } catch (err: any) {
      setState('error');
      setError(String(err));
    }
  };

  const handleFolderSelect = useCallback(async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        await saveDirHandle(dirHandle);
        setSavedHandle(dirHandle);
        setSavedName(dirHandle.name);
        await processDirectoryHandle(dirHandle);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    inputRef.current?.click();
  }, []);

  const handleQuickLoad = useCallback(async () => {
    if (!savedHandle) return;
    setQuickLoading(true);
    try {
      const granted = await verifyPermission(savedHandle);
      if (!granted) {
        setSavedHandle(null);
        setSavedName(null);
        setQuickLoading(false);
        return;
      }
      await processDirectoryHandle(savedHandle);
    } catch {
      setSavedHandle(null);
      setSavedName(null);
    }
    setQuickLoading(false);
  }, [savedHandle]);

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setState('processing');
    setLogs(['Reading files...']);

    try {
      const files: { name: string; data: ArrayBuffer }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.name.endsWith('.xlsx') && !f.name.startsWith('~$')) {
          const data = await f.arrayBuffer();
          files.push({ name: f.name, data });
        }
      }

      if (files.length === 0) {
        setState('error');
        setError('No .xlsx files found in the selected folder.');
        return;
      }

      const result = excelFilesToDbml(files);
      setLogs(result.logs);
      setStats(result.stats);
      setDbmlResult(result.dbml);
      setState('done');
    } catch (err: any) {
      setState('error');
      setError(String(err));
    }
  }, []);

  const handleApply = () => {
    if (dbmlResult) {
      setDbmlText(dbmlResult);
      onClose();
    }
  };

  const hasFSApi = 'showDirectoryPicker' in window;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-xl shadow-2xl overflow-hidden search-overlay-enter"
        style={{ maxWidth: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(166,227,161,0.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Import from Excel</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                DataDefine .xlsx 폴더를 선택하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {state === 'idle' && (
            <div>
              {/* Quick Load - saved folder */}
              {hasFSApi && savedHandle && savedName && (
                <div
                  className="rounded-lg p-4 mb-5"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>최근 사용한 폴더</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" className="flex-shrink-0">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {savedName}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleQuickLoad}
                      disabled={quickLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex-shrink-0"
                      style={{ background: 'var(--accent)', color: '#fff', opacity: quickLoading ? 0.6 : 1 }}
                      onMouseEnter={(e) => { if (!quickLoading) e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={(e) => { if (!quickLoading) e.currentTarget.style.opacity = '1'; }}
                    >
                      {quickLoading ? (
                        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      )}
                      Quick Load
                    </button>
                  </div>
                </div>
              )}

              {/* Normal folder selection */}
              <div className="text-center py-6">
                <div className="mb-3">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" className="mx-auto" style={{ opacity: 0.4 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {savedHandle ? '다른 폴더에서 가져오려면' : 'DataDefine 엑셀 파일이 있는 폴더를 선택하세요'}
                </p>
                <p className="text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>
                  .xlsx 파일에서 Define, Enum, TableGroup 시트를 읽어 DBML로 변환합니다
                </p>
                <button
                  onClick={handleFolderSelect}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    background: savedHandle ? 'var(--bg-surface)' : 'var(--accent)',
                    color: savedHandle ? 'var(--text-secondary)' : '#fff',
                    border: savedHandle ? '1px solid var(--border-color)' : 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {savedHandle ? '다른 폴더 선택' : '폴더 선택'}
                </button>
              </div>
            </div>
          )}

          {state === 'processing' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing Excel files...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(243,139,168,0.1)', border: '1px solid rgba(243,139,168,0.2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--error)' }}>{error}</span>
              </div>
              <button
                onClick={() => { setState('idle'); setError(''); }}
                className="text-xs cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                Try again
              </button>
            </div>
          )}

          {state === 'done' && stats && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Tables" value={stats.tables} />
                <MiniStat label="Columns" value={stats.columns} />
                <MiniStat label="Refs" value={stats.refs} />
                <MiniStat label="Enums" value={stats.enums} />
                <MiniStat label="Groups" value={stats.groups} />
                <MiniStat label="Files" value={stats.files} />
              </div>

              {/* Logs */}
              <div
                className="rounded-lg p-3 mb-4 max-h-40 overflow-y-auto font-mono text-[10px] leading-relaxed"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {state === 'done' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
              style={{ background: 'var(--accent)', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Apply to Editor
            </button>
          </div>
        )}

        {/* Hidden file input fallback */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory=""
          multiple
          accept=".xlsx"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
      <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
