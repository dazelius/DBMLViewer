import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSyncStore } from '../../store/useSyncStore.ts';
import { usePresence } from '../../hooks/usePresence.ts';

const ExcelImportModal = lazy(() => import('../Import/ExcelImportModal.tsx'));

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
  const syncErrorMsg = useSyncStore((s) => s.errorMsg);

  const repo2 = useSyncStore((s) => s.repo2);

  const handleManualSync = async (repo: 'data' | 'aegis') => {
    const { setSyncing, setDone, setError, setRepo2Syncing, setRepo2Done, setRepo2Error } = useSyncStore.getState();
    if (repo === 'data') setSyncing(); else setRepo2Syncing();
    try {
      const url = repo === 'aegis' ? '/api/git/sync?repo=aegis' : '/api/git/sync';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: 'develop' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      const resultStatus = (data.status === 'syncing' ? 'up-to-date' : data.status) as 'cloned' | 'updated' | 'up-to-date';
      if (repo === 'data') setDone(resultStatus, data.commit ?? '');
      else setRepo2Done(resultStatus, data.commit ?? '', data.branch ?? 'develop');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (repo === 'data') setError(msg); else setRepo2Error(msg);
    }
  };

  const presenceCount = usePresence();

  const isEditor     = location.pathname.startsWith('/editor') || location.pathname === '/';
  const isDocs       = location.pathname.startsWith('/docs');
  const isDiff       = location.pathname.startsWith('/diff');
  const isValidation = location.pathname.startsWith('/validation');
  const isQuery      = location.pathname.startsWith('/query');
  const isChat       = location.pathname.startsWith('/chat');
  const isExplore    = location.pathname.startsWith('/explore');
  const isUnity      = location.pathname.startsWith('/unity');
  const isKnowledge  = location.pathname.startsWith('/knowledge');
  const isStrings    = location.pathname.startsWith('/strings');

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
              {(isEditor || isDocs || isDiff || isValidation || isQuery || isUnity || isStrings) && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>
                  {isEditor ? 'ERD' : isDocs ? 'Data' : isDiff ? 'Diff' : isValidation ? 'Validation' : isUnity ? 'Unity' : isStrings ? 'Strings' : 'Query'}
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
                  background: '#1a1d23',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                }}
              >
                {[
                  { label: 'ERD', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><line x1="8" y1="12" x2="9" y2="12"/><line x1="8" y1="6" x2="12" y2="6"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="15" y1="6" x2="22" y2="12"/><line x1="15" y1="18" x2="22" y2="12"/></svg>, path: '/editor', active: isEditor },
                  { label: 'Data', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>, path: '/docs', active: isDocs },
                  { label: 'Diff', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>, path: '/diff', active: isDiff },
                  { label: 'Validation', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, path: '/validation', active: isValidation },
                  { label: 'Query', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, path: '/query', active: isQuery },
                  { label: 'Unity', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>, path: '/unity', active: isUnity },
                  { label: 'Knowledge', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>, path: '/knowledge', active: isKnowledge },
                  { label: 'Strings', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, path: '/strings', active: isStrings },
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
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
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
            errorMsg={syncErrorMsg}
            onRefresh={() => handleManualSync('data')}
          />
          <GitVersionChip
            label="Aegis"
            status={repo2.status}
            commit={repo2.commit}
            resultType={repo2.resultType}
            lastSyncAt={repo2.lastSyncAt}
            branch={repo2.branch ?? undefined}
            errorMsg={repo2.errorMsg}
            onRefresh={() => handleManualSync('aegis')}
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

      {showImport && <Suspense fallback={null}><ExcelImportModal onClose={() => setShowImport(false)} /></Suspense>}
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
  label, status, commit, resultType, lastSyncAt, branch, errorMsg, onRefresh,
}: {
  label?: string;
  status: 'idle' | 'syncing' | 'done' | 'error';
  commit: string | null;
  resultType: 'cloned' | 'updated' | 'up-to-date' | null;
  lastSyncAt: Date | null;
  branch?: string;
  errorMsg?: string | null;
  onRefresh?: () => void;
}) {
  const shortHash = commit ? commit.slice(0, 7) : null;
  const timeStr = lastSyncAt
    ? lastSyncAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const effectiveStatus = (status === 'idle' && commit) ? 'done' : status;

  // ── 상태별 색상/라벨 ──
  let dotColor = '#94a3b8';
  let bgColor = 'var(--bg-surface)';
  let borderColor = 'var(--border-color)';
  let statusLabel = '대기';
  let statusLabelColor = 'var(--text-muted)';
  let icon: React.ReactNode = null;

  if (effectiveStatus === 'syncing') {
    dotColor = '#60a5fa';
    bgColor = 'rgba(96,165,250,0.10)';
    borderColor = 'rgba(96,165,250,0.35)';
    statusLabel = '동기화 중';
    statusLabelColor = '#60a5fa';
    icon = (
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        className="spinner" style={{ flexShrink: 0, color: '#60a5fa' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  } else if (effectiveStatus === 'error') {
    dotColor = '#f87171';
    bgColor = 'rgba(239,68,68,0.10)';
    borderColor = 'rgba(239,68,68,0.35)';
    statusLabel = '오류';
    statusLabelColor = '#f87171';
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  } else if (effectiveStatus === 'done') {
    const isLatest  = resultType === 'up-to-date';
    const isUpdated = resultType === 'updated' || resultType === 'cloned';
    if (isLatest) {
      dotColor = '#22c55e';
      bgColor = 'rgba(34,197,94,0.10)';
      borderColor = 'rgba(34,197,94,0.30)';
      statusLabel = '최신';
      statusLabelColor = '#22c55e';
    } else if (isUpdated) {
      dotColor = '#60a5fa';
      bgColor = 'rgba(96,165,250,0.10)';
      borderColor = 'rgba(96,165,250,0.30)';
      statusLabel = '업데이트됨';
      statusLabelColor = '#60a5fa';
    }
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.65, flexShrink: 0 }}>
        <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
        <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
        <line x1="12" y1="12" x2="12" y2="15" />
      </svg>
    );
  } else {
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5, flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  const tooltipLines = [
    `${label ?? 'repo'} 저장소`,
    branch ? `브랜치: ${branch}` : null,
    `상태: ${statusLabel}`,
    commit ? `커밋: ${commit.slice(0, 12)}` : null,
    timeStr ? `마지막 확인: ${timeStr}` : null,
    errorMsg ? `오류: ${errorMsg}` : null,
    onRefresh ? '— 클릭하여 수동 동기화 —' : null,
  ].filter(Boolean).join('\n');

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={!onRefresh || effectiveStatus === 'syncing'}
      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[11px] font-medium select-none cursor-pointer transition-all"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        color: 'var(--text-secondary)',
        opacity: effectiveStatus === 'syncing' ? 0.85 : 1,
      }}
      title={tooltipLines}
      onMouseEnter={(e) => { if (onRefresh && effectiveStatus !== 'syncing') e.currentTarget.style.filter = 'brightness(1.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
    >
      <span
        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
        style={{
          background: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
          animation: effectiveStatus === 'syncing' ? 'pulse 1.2s ease-in-out infinite' : 'none',
        }}
      />
      {label && (
        <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em' }}>{label}</span>
      )}
      {icon}
      {shortHash ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
          {shortHash}
        </span>
      ) : (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
      )}
      <span className="px-1.5 py-px rounded-md text-[10px] font-bold" style={{ color: statusLabelColor }}>
        {statusLabel}
      </span>
      {timeStr && (
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{timeStr}</span>
      )}
    </button>
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
