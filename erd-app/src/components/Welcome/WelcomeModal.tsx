import { useState, useEffect } from 'react';

const STORAGE_KEY = 'datamaster-welcome-seen';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    title: 'ERD 뷰어',
    desc: '테이블 간 관계를 시각적으로 탐색. 포커스 모드로 특정 테이블의 연관 관계만 집중 확인 가능',
    color: 'var(--accent)',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Data (스키마 문서)',
    desc: '각 테이블의 컬럼, 타입, 관계를 문서 형태로 열람. 미니 ERD와 함께 빠르게 파악',
    color: '#8b5cf6',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Diff 비교',
    desc: '두 커밋 간 스키마 변경 사항을 시각적으로 비교. 추가/삭제/수정 항목을 색상으로 구분',
    color: '#06b6d4',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Validation',
    desc: '실제 데이터가 스키마 정의에 맞는지 자동 검증. PK 중복, FK 참조, Enum 값 등 검사',
    color: 'var(--success)',
  },
];

const SHORTCUTS = [
  { keys: 'Ctrl+F', desc: '컬럼/테이블 검색' },
  { keys: 'Ctrl+0', desc: 'Fit to Screen' },
  { keys: 'Ctrl+Shift+A', desc: '자동 정렬' },
  { keys: 'Esc', desc: '포커스 모드 종료' },
];

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0: 인트로, 1: 기능 소개, 2: 시작하기

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full mx-4 rounded-2xl overflow-hidden"
        style={{
          maxWidth: 640,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Step 0: 인트로 */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center px-10 py-12">
            {/* 로고 */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'var(--accent)', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
              DataMaster에 오신 걸 환영합니다
            </h1>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: 'var(--text-muted)', maxWidth: 420 }}>
              Excel 기반 게임 데이터 스키마를 ERD로 시각화하고,<br />
              문서화·검증·변경 비교까지 한 곳에서 관리하는 도구입니다.
            </p>

            {/* 핵심 특징 3가지 */}
            <div className="flex gap-4 mb-10 w-full">
              {[
                { icon: '⚡', text: 'GitLab 자동 연동' },
                { icon: '🎯', text: '포커스 모드' },
                { icon: '✅', text: '데이터 자동 검증' },
              ].map((f) => (
                <div
                  key={f.text}
                  className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                >
                  <span className="text-[20px]">{f.icon}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full py-3.5 rounded-xl text-[14px] font-bold cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              기능 둘러보기 →
            </button>
            <button
              onClick={handleClose}
              className="mt-3 text-[12px] cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* Step 1: 기능 소개 */}
        {step === 1 && (
          <div className="px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setStep(0)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer interactive"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>주요 기능</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.color}20`, color: f.color }}
                    >
                      {f.icon}
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{f.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* 단축키 미리보기 */}
            <div
              className="rounded-xl px-4 py-3 mb-6 flex items-center gap-6 flex-wrap"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--text-muted)' }}>단축키</span>
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center gap-1.5">
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--accent)' }}
                  >
                    {s.keys}
                  </kbd>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl text-[14px] font-bold cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              핵심 팁 보기 →
            </button>
          </div>
        )}

        {/* Step 2: 핵심 팁 */}
        {step === 2 && (
          <div className="px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setStep(1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer interactive"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>핵심 팁</h2>
            </div>

            {/* 자동 동기화 안내 (강조) */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-4"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid var(--accent)' }}
            >
              <span className="text-[20px] flex-shrink-0">⚡</span>
              <div>
                <p className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--accent)' }}>데이터는 자동으로 동기화됩니다</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  접속할 때마다 GitLab에서 최신 리비전을 자동으로 가져옵니다.<br />
                  새 버전이 올라오면 화면 우측 하단에 업데이트 알림이 표시됩니다.
                </p>
              </div>
            </div>

            {/* 팁 목록 */}
            <div className="space-y-2.5 mb-6">
              {[
                {
                  icon: '🎯',
                  title: '포커스 모드',
                  desc: '테이블 선택 후 Focus 버튼 → 해당 테이블과 연관된 것만 집중 표시',
                  color: '#06b6d4',
                },
                {
                  icon: '🔍',
                  title: '컬럼 검색',
                  desc: 'Ctrl+F 로 컬럼명·테이블명을 빠르게 검색할 수 있습니다',
                  color: '#8b5cf6',
                },
                {
                  icon: '📊',
                  title: 'Diff 비교',
                  desc: '두 커밋을 선택하면 스키마 변경 사항을 색상으로 바로 확인',
                  color: '#f59e0b',
                },
                {
                  icon: '❓',
                  title: '상세 가이드',
                  desc: '우측 상단 ? 버튼을 누르면 언제든 가이드 페이지를 볼 수 있습니다',
                  color: 'var(--success)',
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                >
                  <span className="text-[16px] flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{tip.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl text-[14px] font-bold cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              🚀 DataMaster 시작하기
            </button>
          </div>
        )}

        {/* Step 인디케이터 */}
        <div className="flex justify-center gap-2 pb-5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full cursor-pointer transition-all"
              style={{
                width: step === i ? 20 : 6,
                height: 6,
                background: step === i ? 'var(--accent)' : 'var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
