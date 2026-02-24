import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSyncStore } from '../../store/useSyncStore.ts';
import { usePresence } from '../../hooks/usePresence.ts';
import ExcelImportModal from '../Import/ExcelImportModal.tsx';

export default function Toolbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showImport, setShowImport] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
  );

  const syncStatus   = useSyncStore((s) => s.status);
  const syncCommit   = useSyncStore((s) => s.commit);
  const syncResultType = useSyncStore((s) => s.resultType);
  const syncLastAt   = useSyncStore((s) => s.lastSyncAt);

  const presenceCount = usePresence();

  const isEditor     = location.pathname.startsWith('/editor') || location.pathname === '/';
  const isDocs       = location.pathname.startsWith('/docs');
  const isDiff       = location.pathname.startsWith('/diff');
  const isValidation = location.pathname.startsWith('/validation');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-5 h-14 flex-shrink-0 select-none header-gradient"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {/* ── Left: Logo + Nav ── */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-glow)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              DataMaster
            </span>
          </div>

          {/* Nav tabs */}
          <div className="flex items-center gap-1">
            <ModeTab active={isEditor}     onClick={() => navigate('/editor')}>ERD</ModeTab>
            <ModeTab active={isDocs}       onClick={() => navigate('/docs')}>Data</ModeTab>
            <ModeTab active={isDiff}       onClick={() => navigate('/diff')}>Diff</ModeTab>
            <ModeTab active={isValidation} onClick={() => navigate('/validation')}>Validation</ModeTab>
          </div>

          <Divider />

          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            title="Import from Excel / GitLab"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer interactive"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import
          </button>
        </div>

        {/* ── Right: Presence + GitChip + Theme ── */}
        <div className="flex items-center gap-2">
          {presenceCount !== null && (
            <PresenceChip count={presenceCount} />
          )}

          <GitVersionChip
            status={syncStatus}
            commit={syncCommit}
            resultType={syncResultType}
            lastSyncAt={syncLastAt}
          />

          <Divider />

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer interactive"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-6 mx-1 flex-shrink-0" style={{ background: 'var(--border-color)' }} />;
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-[13px] font-semibold rounded-lg cursor-pointer text-center"
      style={{
        minWidth: 72,
        padding: '0 16px',
        height: 32,
        lineHeight: '32px',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.3), var(--shadow-glow)' : 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Git 버전 칩 ──────────────────────────────────────────────────────────────
function GitVersionChip({
  status, commit, resultType, lastSyncAt,
}: {
  status: 'idle' | 'syncing' | 'done' | 'error';
  commit: string | null;
  resultType: 'cloned' | 'updated' | 'up-to-date' | null;
  lastSyncAt: Date | null;
}) {
  const shortHash = commit ? commit.slice(0, 7) : null;
  const timeStr = lastSyncAt
    ? lastSyncAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null;

  // idle 이어도 commit 정보가 남아 있으면 done 처럼 표시 (SyncToast가 reset() 후에도 유지)
  const effectiveStatus = (status === 'idle' && commit) ? 'done' : status;
  if (effectiveStatus === 'idle') return null;

  if (effectiveStatus === 'syncing') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
      >
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="spinner" style={{ flexShrink: 0 }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span>동기화 중…</span>
      </div>
    );
  }

  if (effectiveStatus === 'error') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>동기화 오류</span>
      </div>
    );
  }

  const isLatest  = resultType === 'up-to-date';
  const isUpdated = resultType === 'updated' || resultType === 'cloned';
  const dotColor    = isLatest ? '#22c55e' : isUpdated ? '#60a5fa' : 'var(--text-muted)';
  const labelColor  = isLatest ? '#22c55e' : isUpdated ? '#60a5fa' : 'var(--text-muted)';
  const bgColor     = isLatest ? 'rgba(34,197,94,0.07)' : isUpdated ? 'rgba(96,165,250,0.07)' : 'var(--bg-surface)';
  const borderColor = isLatest ? 'rgba(34,197,94,0.25)' : isUpdated ? 'rgba(96,165,250,0.25)' : 'var(--border-color)';
  const label       = isLatest ? '최신' : isUpdated ? '업데이트됨' : '';

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium select-none"
      style={{ background: bgColor, border: `1px solid ${borderColor}`, color: 'var(--text-secondary)' }}
      title={`마지막 동기화: ${timeStr ?? '-'}  |  commit: ${commit ?? '-'}`}
    >
      <span
        className="w-[6px] h-[6px] rounded-full flex-shrink-0"
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
      />
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.55, flexShrink: 0 }}>
        <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
        <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
        <line x1="12" y1="12" x2="12" y2="15" />
      </svg>
      {shortHash && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
          {shortHash}
        </span>
      )}
      {label && (
        <span className="px-1.5 py-px rounded-md text-[10px] font-bold" style={{ color: labelColor }}>
          {label}
        </span>
      )}
      {timeStr && (
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{timeStr}</span>
      )}
    </div>
  );
}

// ── 접속자 수 칩 ──────────────────────────────────────────────────────────────
function PresenceChip({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium select-none"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
      }}
      title={`현재 ${count}명 접속 중`}
    >
      {/* 사람 아이콘 */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.7, flexShrink: 0 }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      {/* 온라인 dot */}
      <span
        className="w-[5px] h-[5px] rounded-full flex-shrink-0"
        style={{ background: '#22c55e', boxShadow: '0 0 5px #22c55e' }}
      />
      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', fontWeight: 600 }}>
        {count}
      </span>
    </div>
  );
}
