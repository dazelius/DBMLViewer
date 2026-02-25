import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Toolbar from '../components/Layout/Toolbar.tsx';

interface PublishedMeta {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

// ── 개별 카드 (mini iframe + 메타) ────────────────────────────────────────────
function DocCard({ meta, onDelete }: { meta: PublishedMeta; onDelete: (id: string) => void }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const confirmRef = useRef(false);
  const docUrl = `/api/p/${meta.id}`;
  const fullUrl = `${window.location.origin}${docUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
  };

  const handleDelete = () => {
    if (!confirmRef.current) {
      confirmRef.current = true;
      setShowDelete(true);
      setTimeout(() => { confirmRef.current = false; setShowDelete(false); }, 3000);
      return;
    }
    onDelete(meta.id);
  };

  const dateStr = new Date(meta.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
    >
      {/* ─ 미리보기 iframe ─ */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 200 }}>
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a0f1a' }}>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        )}
        <iframe
          src={docUrl}
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '166.67%', height: '166.67%', transformOrigin: 'top left', transform: 'scale(0.6)', opacity: iframeLoaded ? 1 : 0 }}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIframeLoaded(true)}
          title={meta.title}
        />
        {/* 클릭 오버레이 */}
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-white px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.8)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            새 탭에서 열기
          </span>
        </a>
      </div>

      {/* ─ 메타 정보 ─ */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 flex-1">
        <div className="font-semibold text-[13px] leading-tight" style={{ color: 'var(--text-primary)' }}>
          {meta.title}
        </div>
        {meta.description && (
          <div className="text-[11px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {meta.description}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-1.5" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
          <div className="flex items-center gap-1">
            {/* URL 복사 */}
            <button onClick={handleCopy} title="URL 복사"
              className="p-1.5 rounded hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            {/* 삭제 */}
            <button onClick={handleDelete} title={showDelete ? '한 번 더 클릭하면 삭제됩니다' : '삭제'}
              className="p-1.5 rounded hover:opacity-80 transition-all"
              style={{ color: showDelete ? '#ef4444' : 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Explore 메인 페이지 ────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<PublishedMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/published');
      const data = await res.json() as PublishedMeta[];
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/publish/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />

      {/* 헤더 */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: '#818cf8' }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>Explore</h1>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              출판된 기획서 · {docs.length}개 문서
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="문서 검색..."
                className="pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none w-52"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            {/* 새로고침 */}
            <button onClick={fetchDocs} className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title="새로고침">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            {/* 채팅으로 */}
            <button onClick={() => navigate('/chat')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              AI 채팅
            </button>
          </div>
        </div>
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--text-muted)' }}>
            <svg className="animate-spin w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span className="text-[13px]">문서 불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4" style={{ color: 'var(--text-muted)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {search ? `"${search}"에 해당하는 문서가 없습니다` : '출판된 문서가 없습니다'}
              </p>
              <p className="text-[12px]">AI 채팅에서 기획서를 생성하고 출판하면 여기에 표시됩니다</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map(doc => (
              <DocCard key={doc.id} meta={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* URL 복사 알림 토스트 */}
      {copiedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-[12px] font-medium shadow-lg"
          style={{ background: '#1e293b', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', zIndex: 9999 }}>
          {copiedNotice}
        </div>
      )}
    </div>
  );
}
