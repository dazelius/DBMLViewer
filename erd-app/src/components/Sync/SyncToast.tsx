import { useEffect, useState } from 'react';
import { useSyncStore } from '../../store/useSyncStore';

// ── 아이콘 ──────────────────────────────────────────────────────────────────
const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconDB = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function SyncToast() {
  const { status, resultType, commit, errorMsg, reset } = useSyncStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === 'syncing') {
      setDismissed(false);
      setVisible(true);
    } else if (status === 'done' || status === 'error') {
      setVisible(true);
      const delay = resultType === 'up-to-date' ? 3000 : 10000;
      const timer = setTimeout(() => {
        setVisible(false);
        reset();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [status, resultType, reset]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    reset();
  };

  if (!visible || dismissed) return null;

  /* ─── Syncing ─── */
  if (status === 'syncing') {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl shadow-2xl min-w-64">
        <span className="text-blue-400 shrink-0" style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>
          <IconRefresh />
        </span>
        <div>
          <p className="text-sm font-medium text-white">최신 데이터 확인 중...</p>
          <p className="text-xs text-gray-400 mt-0.5">GitLab에서 최신 리비전을 가져오고 있습니다</p>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (status === 'error') {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-gray-800 border border-red-700/60 text-white px-4 py-3 rounded-xl shadow-2xl min-w-64 max-w-sm">
        <span className="text-red-400 shrink-0 mt-0.5"><IconAlert /></span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-300">동기화 실패</p>
          <p className="text-xs text-gray-400 mt-0.5 break-all">{errorMsg}</p>
        </div>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 cursor-pointer">
          <IconX />
        </button>
      </div>
    );
  }

  /* ─── Done ─── */
  if (status === 'done') {
    if (resultType === 'up-to-date') {
      return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl shadow-2xl min-w-64">
          <span className="text-green-400 shrink-0"><IconCheck /></span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">데이터가 최신 상태입니다</p>
            {commit && <p className="text-xs text-gray-400 mt-0.5 font-mono">{commit.slice(0, 8)}</p>}
          </div>
          <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 cursor-pointer">
            <IconX />
          </button>
        </div>
      );
    }

    const isNew = resultType === 'cloned';
    return (
      <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 text-white px-4 py-3 rounded-xl shadow-2xl min-w-64 max-w-sm border ${isNew ? 'bg-blue-900/90 border-blue-500/60' : 'bg-emerald-900/90 border-emerald-500/60'}`}>
        <span className={`shrink-0 mt-0.5 ${isNew ? 'text-blue-400' : 'text-emerald-400'}`}><IconDB /></span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isNew ? '데이터를 처음으로 불러왔습니다' : '새 버전으로 업데이트되었습니다'}
          </p>
          {commit && (
            <p className="text-xs text-gray-300 mt-0.5">
              <span className="font-mono bg-black/30 px-1 rounded">{commit.slice(0, 8)}</span>
              {' '}리비전 반영됨
            </p>
          )}
        </div>
        <button onClick={handleDismiss} className="text-gray-300 hover:text-white transition-colors shrink-0 cursor-pointer">
          <IconX />
        </button>
      </div>
    );
  }

  return null;
}
