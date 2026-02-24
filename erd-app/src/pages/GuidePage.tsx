import { useNavigate } from 'react-router-dom';

/* ─── Section 컴포넌트 ─── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-muted)' }}>
          {icon}
        </div>
        <h2 className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="pl-11">{children}</div>
    </section>
  );
}

/* ─── 카드 ─── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      {children}
    </div>
  );
}

/* ─── 단계 뱃지 ─── */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        {n}
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>
    </div>
  );
}

/* ─── 단축키 행 ─── */
function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i}>
            {i > 0 && <span className="text-[10px] mx-0.5" style={{ color: 'var(--text-muted)' }}>+</span>}
            <kbd className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              {k}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── 기능 행 ─── */
function FeatureRow({ label, desc, badge }: { label: string; desc: string; badge?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            {badge}
          </span>
        )}
      </div>
      <span className="text-[12px] leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>{desc}</span>
    </div>
  );
}

/* ─── 강조 박스 ─── */
function InfoBox({ type = 'info', children }: { type?: 'info' | 'tip' | 'warn'; children: React.ReactNode }) {
  const colors = {
    info: { bg: 'var(--accent-muted)', border: 'var(--accent)', icon: '💡', text: 'var(--accent)' },
    tip: { bg: 'var(--success-muted)', border: 'var(--success)', icon: '✅', text: 'var(--success)' },
    warn: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', icon: '⚠️', text: '#f59e0b' },
  }[type];
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 mb-3"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <span className="text-[13px] flex-shrink-0 mt-0.5">{colors.icon}</span>
      <p className="text-[12px] leading-relaxed" style={{ color: colors.text }}>{children}</p>
    </div>
  );
}

/* ════════════════════════════════════════ */
export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/editor')}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer interactive"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>사용 가이드</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>DataMaster 기능 설명서</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>DataMaster v1</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">

        {/* ── 시작하기 ── */}
        <Section title="시작하기 — 데이터 불러오기" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        }>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            상단 툴바의 <strong style={{ color: 'var(--text-primary)' }}>Import</strong> 버튼을 클릭하면 데이터를 가져올 수 있습니다. GitLab 연동과 로컬 폴더 두 가지 방식을 지원합니다.
          </p>

          <Card>
            <p className="text-[12px] font-bold mb-3" style={{ color: 'var(--accent)' }}>🔗 GitLab 연동 (권장)</p>
            <Step n={1}>상단 <strong>Import</strong> 버튼 클릭 → <strong>GitLab</strong> 탭 선택</Step>
            <Step n={2}><strong>Git Clone &amp; Import</strong> 버튼 클릭 — 처음 실행 시 레포지토리를 서버에 클론합니다</Step>
            <Step n={3}>이후 접속자는 <strong>자동으로 데이터가 로드</strong>됩니다 (재클릭 불필요)</Step>
            <Step n={4}>최신 데이터로 갱신하려면 <strong>Git Pull &amp; Import</strong> 버튼 클릭</Step>
            <InfoBox type="tip">한 번 클론 후에는 다른 팀원이 앱에 접속하면 자동으로 데이터가 불러와집니다.</InfoBox>
          </Card>

          <Card>
            <p className="text-[12px] font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>📁 로컬 폴더</p>
            <Step n={1}><strong>Local Folder</strong> 탭 → <strong>폴더 선택</strong> 클릭</Step>
            <Step n={2}><code style={{ color: 'var(--accent)', fontSize: 11 }}>Define</code>, <code style={{ color: 'var(--accent)', fontSize: 11 }}>Enum</code>, <code style={{ color: 'var(--accent)', fontSize: 11 }}>TableGroup</code> 시트가 포함된 Excel(.xlsx) 파일이 있는 폴더 선택</Step>
            <Step n={3}>여러 폴더를 추가 후 <strong>Import</strong> 실행 가능</Step>
          </Card>
        </Section>

        {/* ── ERD 뷰어 ── */}
        <Section title="ERD 뷰어" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        }>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            테이블 간 관계를 시각적으로 탐색할 수 있는 ERD 캔버스입니다.
          </p>

          <Card>
            <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>캔버스 조작</p>
            <FeatureRow label="이동" desc="빈 영역을 드래그하여 캔버스를 이동합니다" />
            <FeatureRow label="줌 인/아웃" desc="마우스 휠로 확대/축소합니다" />
            <FeatureRow label="테이블 이동" desc="테이블 헤더를 드래그하여 위치를 이동합니다" />
            <FeatureRow label="테이블 선택" desc="테이블 클릭 시 연결된 관계선이 강조됩니다" />
          </Card>

          <Card>
            <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>툴바 기능</p>
            <FeatureRow label="Arrange" desc="테이블을 자동으로 정렬합니다" badge="Ctrl+Shift+A" />
            <FeatureRow label="Fit" desc="모든 테이블이 화면에 맞게 보기를 맞춥니다" badge="Ctrl+0" />
            <FeatureRow label="Collapse" desc="테이블을 헤더만 보이도록 접습니다. 전체 구조 파악에 유용합니다" />
            <FeatureRow label="Heatmap" desc="데이터 행 수를 색상으로 표시합니다. Import 시 데이터 파일 포함 필요" />
            <FeatureRow label="SQL" desc="현재 스키마를 SQL CREATE문으로 내보냅니다" />
            <FeatureRow label="PNG" desc="현재 캔버스를 이미지로 저장합니다" />
          </Card>

          <Card>
            <p className="text-[12px] font-bold mb-3" style={{ color: 'var(--accent)' }}>🎯 포커스 모드 (Focus Mode)</p>
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              특정 테이블과 연관된 테이블만 골라서 집중 탐색하는 기능입니다.
            </p>
            <Step n={1}>테이블을 <strong>클릭</strong>하여 선택합니다</Step>
            <Step n={2}>테이블 우측 상단에 나타나는 <strong>⊙ Focus</strong> 버튼을 클릭합니다</Step>
            <Step n={3}>선택한 테이블과 <strong>직접 연결된 테이블들만</strong> 화면에 표시되며 자동 정렬됩니다</Step>
            <Step n={4}>상단 배너의 <strong>Exit Focus</strong> 버튼 또는 <strong>ESC</strong>를 눌러 전체 보기로 돌아갑니다</Step>
            <InfoBox type="tip">포커스 모드 진입 시 이전 레이아웃이 저장되어, 종료 후 원래 위치로 돌아옵니다.</InfoBox>
            <InfoBox type="info">좌측 사이드바의 테이블 목록에서 테이블명을 클릭해도 포커스 모드로 진입할 수 있습니다.</InfoBox>
          </Card>

          <Card>
            <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>🔍 컬럼 검색</p>
            <Step n={1}><strong>Ctrl+F</strong>를 눌러 검색 패널을 엽니다</Step>
            <Step n={2}>컬럼명 또는 테이블명을 입력하면 실시간으로 결과가 표시됩니다</Step>
            <Step n={3}>결과 클릭 시 해당 테이블로 화면이 이동합니다</Step>
          </Card>
        </Section>

        {/* ── Data (Docs) ── */}
        <Section title="Data — 스키마 문서" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        }>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            테이블 스키마를 문서 형태로 보여주는 페이지입니다. 각 테이블의 컬럼, 타입, 설명, 관계를 한눈에 확인할 수 있습니다.
          </p>
          <Card>
            <FeatureRow label="좌측 사이드바" desc="테이블 목록 및 검색. 테이블명 클릭 시 상세 페이지로 이동" />
            <FeatureRow label="테이블 상세" desc="컬럼별 타입, PK/FK/NotNull 여부, 설명(Note), 기본값 등 표시" />
            <FeatureRow label="Mini ERD" desc="선택한 테이블과 연관 테이블의 관계를 미니 ERD로 표시" />
            <FeatureRow label="Relations" desc="해당 테이블이 참조하거나 참조받는 테이블 목록" />
          </Card>
        </Section>

        {/* ── Diff ── */}
        <Section title="Diff — 변경 내역 비교" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            GitLab 레포지토리의 두 커밋 간 스키마 변경 사항을 비교합니다.
          </p>
          <Card>
            <Step n={1}><strong>From</strong> (이전 커밋)과 <strong>To</strong> (현재 커밋)을 선택합니다</Step>
            <Step n={2}>추가된 테이블/컬럼은 <span style={{ color: 'var(--success)' }}>초록색</span>, 삭제된 항목은 <span style={{ color: '#ef4444' }}>빨간색</span>으로 표시됩니다</Step>
            <Step n={3}>변경된 컬럼은 <span style={{ color: '#f59e0b' }}>노란색</span>으로 강조됩니다</Step>
            <InfoBox type="warn">Diff 기능은 GitLab 레포지토리가 클론된 상태에서만 사용 가능합니다.</InfoBox>
          </Card>
        </Section>

        {/* ── Validation ── */}
        <Section title="Validation — 데이터 검증" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            실제 데이터가 스키마 정의에 맞게 작성되어 있는지 자동으로 검증합니다.
          </p>
          <Card>
            <FeatureRow label="PK 중복" desc="Primary Key 값이 중복되는 행을 감지합니다" />
            <FeatureRow label="NotNull 검사" desc="필수 값이 비어있는 경우를 찾아냅니다" />
            <FeatureRow label="FK 참조 검사" desc="Foreign Key가 참조 테이블에 존재하는지 확인합니다" />
            <FeatureRow label="Enum 검사" desc="Enum 컬럼의 값이 정의된 항목 중 하나인지 확인합니다" />
            <FeatureRow label="타입 검사" desc="int, float 컬럼에 올바른 형식의 값이 입력되었는지 확인합니다" />
          </Card>
          <InfoBox type="info">Import 시 <strong>데이터 파일도 함께 가져오기</strong>를 체크하면 Validation이 자동으로 실행됩니다.</InfoBox>
        </Section>

        {/* ── 단축키 ── */}
        <Section title="단축키 모음" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
          </svg>
        }>
          <Card>
            <ShortcutRow keys={['Ctrl', 'F']} desc="컬럼 / 테이블 검색" />
            <ShortcutRow keys={['Ctrl', '0']} desc="화면에 맞게 보기 (Fit to Screen)" />
            <ShortcutRow keys={['Ctrl', 'Shift', 'A']} desc="테이블 자동 정렬" />
            <ShortcutRow keys={['Esc']} desc="포커스 모드 종료 / 검색 패널 닫기" />
            <ShortcutRow keys={['휠 스크롤']} desc="캔버스 줌 인 / 아웃" />
            <ShortcutRow keys={['드래그']} desc="캔버스 이동 (빈 영역) / 테이블 이동 (헤더)" />
          </Card>
        </Section>

        {/* ── FAQ ── */}
        <Section title="자주 묻는 질문" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }>
          <Card>
            <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Q. 앱에 들어왔는데 아무것도 안 보여요</p>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>GitLab 레포지토리가 아직 클론되지 않은 상태입니다. 상단의 <strong style={{ color: 'var(--text-primary)' }}>Import → GitLab → Git Clone & Import</strong>를 한 번 실행해 주세요. 이후 팀원들은 자동으로 로드됩니다.</p>

            <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Q. 포커스 모드에서 나가려면 어떻게 하나요?</p>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>화면 상단 중앙에 나타나는 배너의 <strong style={{ color: 'var(--text-primary)' }}>Exit Focus</strong> 버튼을 클릭하거나, <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Esc</kbd> 키를 누르면 됩니다.</p>

            <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Q. Heatmap 버튼이 비활성화되어 있어요</p>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Import 시 <strong style={{ color: 'var(--text-primary)' }}>데이터 파일도 함께 가져오기</strong> 옵션을 체크해야 합니다. 데이터가 로드되면 자동으로 활성화됩니다.</p>

            <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Q. 테이블을 옮겼는데 자동 정렬하면 원래대로 돌아가요</p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>현재 버전에서 레이아웃은 새로고침 시 초기화됩니다. 배치를 유지하려면 <strong style={{ color: 'var(--text-primary)' }}>PNG로 내보내기</strong>를 활용해 주세요.</p>
          </Card>
        </Section>

        {/* 하단 여백 */}
        <div className="h-8" />
      </div>
    </div>
  );
}
