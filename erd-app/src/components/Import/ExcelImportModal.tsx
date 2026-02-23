import { useState, useRef, useCallback, useEffect } from 'react';
import { excelFilesToDbml } from '../../core/import/excelToDbml.ts';
import { useEditorStore } from '../../store/useEditorStore.ts';

interface ExcelImportModalProps {
  onClose: () => void;
}

type ImportState = 'idle' | 'processing' | 'done' | 'error';

interface FolderEntry {
  handle: FileSystemDirectoryHandle;
  name: string;
}

const IDB_NAME = 'erd-studio-import';
const IDB_STORE = 'dir-handles';
const IDB_KEY = 'last-datadefine-multi';

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirHandles(handles: FileSystemDirectoryHandle[]) {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).put(handles, IDB_KEY);
  db.close();
}

async function loadDirHandles(): Promise<FileSystemDirectoryHandle[]> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        if (Array.isArray(result)) resolve(result);
        else if (result) resolve([result]);
        else resolve([]);
      };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch {
    return [];
  }
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

export default function ExcelImportModal({ onClose }: ExcelImportModalProps) {
  const setDbmlText = useEditorStore((s) => s.setDbmlText);
  const [state, setState] = useState<ImportState>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<{ files: number; tables: number; columns: number; refs: number; enums: number; groups: number; notes: number } | null>(null);
  const [dbmlResult, setDbmlResult] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [savedFolders, setSavedFolders] = useState<FolderEntry[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);

  const hasFSApi = 'showDirectoryPicker' in window;

  useEffect(() => {
    if (!hasFSApi) return;
    loadDirHandles().then((handles) => {
      if (handles.length > 0) {
        const entries = handles.map((h) => ({ handle: h, name: h.name }));
        setSavedFolders(entries);
      }
    });
  }, [hasFSApi]);

  const processFiles = async (allFiles: { name: string; data: ArrayBuffer }[]) => {
    if (allFiles.length === 0) {
      setState('error');
      setError('No .xlsx files found in the selected folders.');
      return;
    }
    const result = excelFilesToDbml(allFiles);
    setLogs(result.logs);
    setStats(result.stats);
    setDbmlResult(result.dbml);
    setState('done');
  };

  const processMultipleFolders = async (entries: FolderEntry[]) => {
    setState('processing');
    setLogs(['Reading files from folders...']);

    try {
      const allFiles: { name: string; data: ArrayBuffer }[] = [];
      for (const entry of entries) {
        const files = await readFilesFromHandle(entry.handle);
        setLogs((prev) => [...prev, `📁 ${entry.name}: ${files.length} files`]);
        allFiles.push(...files);
      }
      await processFiles(allFiles);
    } catch (err: any) {
      setState('error');
      setError(String(err));
    }
  };

  const handleAddFolder = useCallback(async () => {
    if (hasFSApi) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const exists = folders.some((f) => f.name === dirHandle.name);
        if (!exists) {
          setFolders((prev) => [...prev, { handle: dirHandle, name: dirHandle.name }]);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    } else {
      inputRef.current?.click();
    }
  }, [hasFSApi, folders]);

  const handleRemoveFolder = useCallback((index: number) => {
    setFolders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStartImport = useCallback(async () => {
    if (folders.length === 0) return;
    await saveDirHandles(folders.map((f) => f.handle));
    setSavedFolders([...folders]);
    await processMultipleFolders(folders);
  }, [folders]);

  const handleQuickLoad = useCallback(async () => {
    if (savedFolders.length === 0) return;
    setQuickLoading(true);
    try {
      const verified: FolderEntry[] = [];
      for (const entry of savedFolders) {
        const granted = await verifyPermission(entry.handle);
        if (granted) verified.push(entry);
      }
      if (verified.length === 0) {
        setSavedFolders([]);
        setQuickLoading(false);
        return;
      }
      setFolders(verified);
      await processMultipleFolders(verified);
    } catch {
      setSavedFolders([]);
    }
    setQuickLoading(false);
  }, [savedFolders]);

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
      await processFiles(files);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-xl overflow-hidden modal-enter"
        style={{ maxWidth: 580, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--success-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Import from Excel</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                복수의 폴더를 추가하여 Excel 파일을 가져올 수 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer interactive"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {state === 'idle' && (
            <div>
              {/* Quick Load from saved */}
              {hasFSApi && savedFolders.length > 0 && folders.length === 0 && (
                <div
                  className="rounded-xl p-4 mb-5"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>최근 사용한 폴더</span>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {savedFolders.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {f.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleQuickLoad}
                    disabled={quickLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer interactive"
                    style={{ background: 'var(--accent)', color: '#fff', opacity: quickLoading ? 0.6 : 1, boxShadow: 'var(--shadow-glow)' }}
                    onMouseEnter={(e) => { if (!quickLoading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                    onMouseLeave={(e) => { if (!quickLoading) e.currentTarget.style.background = 'var(--accent)'; }}
                  >
                    {quickLoading ? (
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    )}
                    Quick Load ({savedFolders.length} folders)
                  </button>
                </div>
              )}

              {/* Folder list */}
              {folders.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Selected Folders
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                    >
                      {folders.length}
                    </span>
                  </div>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--border-color)' }}
                  >
                    {folders.map((folder, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 px-3 py-2.5 interactive"
                        style={{
                          background: 'var(--bg-primary)',
                          borderBottom: index < folders.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="text-[12px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                          {folder.name}
                        </span>
                        <button
                          onClick={() => handleRemoveFolder(index)}
                          className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer interactive flex-shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-muted)'; e.currentTarget.style.color = 'var(--error)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Remove folder"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add folder + Import buttons */}
              <div className="flex flex-col items-center gap-3">
                {folders.length === 0 && !savedFolders.length && (
                  <>
                    <div className="w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5 }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Excel 파일이 있는 폴더를 추가하세요
                    </p>
                    <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                      Define, Enum, TableGroup 시트를 읽어 DBML로 변환합니다
                    </p>
                  </>
                )}

                <div className="flex items-center gap-2.5 w-full justify-center">
                  <button
                    onClick={handleAddFolder}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer interactive"
                    style={{
                      background: folders.length > 0 ? 'var(--bg-surface)' : 'var(--accent)',
                      color: folders.length > 0 ? 'var(--text-secondary)' : '#fff',
                      border: folders.length > 0 ? '1px solid var(--border-color)' : 'none',
                      boxShadow: folders.length > 0 ? 'none' : 'var(--shadow-glow)',
                    }}
                    onMouseEnter={(e) => {
                      if (folders.length > 0) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      } else {
                        e.currentTarget.style.background = 'var(--accent-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (folders.length > 0) {
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      } else {
                        e.currentTarget.style.background = 'var(--accent)';
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                    {folders.length > 0 ? '폴더 추가' : '폴더 선택'}
                  </button>

                  {folders.length > 0 && (
                    <button
                      onClick={handleStartImport}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold cursor-pointer interactive"
                      style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      Import ({folders.length} folders)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {state === 'processing' && (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full spinner mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Processing Excel files...</p>
              {logs.length > 1 && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{logs[logs.length - 1]}</p>
              )}
            </div>
          )}

          {state === 'error' && (
            <div className="py-4">
              <div className="flex items-start gap-3 mb-4 px-4 py-3 rounded-xl" style={{ background: 'var(--error-muted)', border: '1px solid var(--error)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-[12px] leading-relaxed" style={{ color: 'var(--error)' }}>{error}</span>
              </div>
              <button
                onClick={() => { setState('idle'); setError(''); }}
                className="text-[12px] font-semibold cursor-pointer interactive px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
              >
                Try again
              </button>
            </div>
          )}

          {state === 'done' && stats && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <MiniStat label="Tables" value={stats.tables} />
                <MiniStat label="Columns" value={stats.columns} />
                <MiniStat label="Notes" value={stats.notes} />
                <MiniStat label="Refs" value={stats.refs} />
                <MiniStat label="Enums" value={stats.enums} />
                <MiniStat label="Groups" value={stats.groups} />
                <MiniStat label="Files" value={stats.files} />
              </div>

              {/* Logs */}
              <div
                className="rounded-xl p-3.5 mb-4 max-h-40 overflow-y-auto text-[10px] leading-relaxed"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
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
          <div className="flex items-center justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[11px] font-semibold cursor-pointer interactive"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg text-[11px] font-bold cursor-pointer interactive"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
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
    <div
      className="text-center px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
    >
      <div className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
