import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSyncStore } from '../../store/useSyncStore.ts';
import { usePresence } from '../../hooks/usePresence.ts';
import ExcelImportModal from '../Import/ExcelImportModal.tsx';

export default function Toolbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showImport, setShowImport] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);
  const homeMenuRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
  );

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (homeMenuRef.current && !homeMenuRef.current.contains(e.target as Node)) {
        setShowHomeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const syncStatus   = useSyncStore((s) => s.status);
  const syncCommit   = useSyncStore((s) => s.commit);
  const syncResultType = useSyncStore((s) => s.resultType);
  const syncLastAt   = useSyncStore((s) => s.lastSyncAt);

  const repo2 = useSyncStore((s) => s.repo2);

  const presenceCount = usePresence();

  const isEditor     = location.pathname.startsWith('/editor') || location.pathname === '/';
  const isDocs       = location.pathname.startsWith('/docs');
  const isDiff       = location.pathname.startsWith('/diff');
  const isValidation = location.pathname.startsWith('/validation');
  const isQuery      = location.pathname.startsWith('/query');
  const isChat       = location.pathname.startsWith('/chat');
  const isExplore    = location.pathname.startsWith('/explore');

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
        {/* ── Left: Logo(드롭다운) + Nav ── */}
        <div className="flex items-center gap-3">

          {/* DataMaster 홈 버튼 + 드롭다운 */}
          <div className="relative" ref={homeMenuRef}>
            <button
              onClick={() => setShowHomeMenu((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer"
              style={{
                background: showHomeMenu ? 'var(--bg-hover)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!showHomeMenu) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!showHomeMenu) e.currentTarget.style.background = 'transparent'; }}
              title="메뉴"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
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
              {/* 현재 활성 페이지 표시 */}
              {(isEditor || isDocs || isDiff || isValidation || isQuery) && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>
                  {isEditor ? 'ERD' : isDocs ? 'Data' : isDiff ? 'Diff' : isValidation ? 'Validation' : 'Query'}
                </span>
              )}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ color: 'var(--text-muted)', transform: showHomeMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {showHomeMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 rounded-xl overflow-hidden z-50"
                style={{
                  minWidth: 180,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                }}
              >
                {[
                  { label: 'ERD', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><line x1="8" y1="12" x2="9" y2="12"/><line x1="8" y1="6" x2="12" y2="6"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="15" y1="6" x2="22" y2="12"/><line x1="15" y1="18" x2="22" y2="12"/></svg>, path: '/editor', active: isEditor },
                  { label: 'Data', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>, path: '/docs', active: isDocs },
                  { label: 'Diff', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>, path: '/diff', active: isDiff },
                  { label: 'Validation', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, path: '/validation', active: isValidation },
                  { label: 'Query', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, path: '/query', active: isQuery },
                ].map(({ label, icon, path, active }) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setShowHomeMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium"
                    style={{
                      background: active ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                  >
                    <span style={{ opacity: 0.7, flexShrink: 0 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Nav tabs — ChatBot + Explore 만 */}
          <div className="flex items-center gap-1">
            <ModeTab active={isChat} onClick={() => navigate('/chat')}>ChatBot</ModeTab>
            <ModeTab active={isExplore} onClick={() => navigate('/explore')}>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Explore
              </span>
            </ModeTab>
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
            label="Data"
            status={syncStatus}
            commit={syncCommit}
            resultType={syncResultType}
            lastSyncAt={syncLastAt}
          />
          <GitVersionChip
            label="Aegis"
            status={repo2.status}
            commit={repo2.commit}
            resultType={repo2.resultType}
            lastSyncAt={repo2.lastSyncAt}
            branch={repo2.branch ?? undefined}
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
  label, status, commit, resultType, lastSyncAt, branch,
}: {
  label?: string;
  status: 'idle' | 'syncing' | 'done' | 'error';
  commit: string | null;
  resultType: 'cloned' | 'updated' | 'up-to-date' | null;
  lastSyncAt: Date | null;
  branch?: string;
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
  const statusLabelColor = isLatest ? '#22c55e' : isUpdated ? '#60a5fa' : 'var(--text-muted)';
  const bgColor     = isLatest ? 'rgba(34,197,94,0.07)' : isUpdated ? 'rgba(96,165,250,0.07)' : 'var(--bg-surface)';
  const borderColor = isLatest ? 'rgba(34,197,94,0.25)' : isUpdated ? 'rgba(96,165,250,0.25)' : 'var(--border-color)';
  const statusLabel = isLatest ? '최신' : isUpdated ? '업데이트됨' : '';

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium select-none"
      style={{ background: bgColor, border: `1px solid ${borderColor}`, color: 'var(--text-secondary)' }}
      title={`[${label ?? 'repo'}] ${branch ? `branch: ${branch}  |  ` : ''}마지막 동기화: ${timeStr ?? '-'}  |  commit: ${commit ?? '-'}`}
    >
      <span
        className="w-[6px] h-[6px] rounded-full flex-shrink-0"
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
      />
      {label && (
        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{label}</span>
      )}
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
      {statusLabel && (
        <span className="px-1.5 py-px rounded-md text-[10px] font-bold" style={{ color: statusLabelColor }}>
          {statusLabel}
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
