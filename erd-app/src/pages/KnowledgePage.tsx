import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Toolbar from '../components/Layout/Toolbar';

interface KnowledgeItem {
  name: string;
  sizeKB: number;
  updatedAt: string;
}

interface KnowledgeDetail {
  name: string;
  content: string;
  sizeKB: number;
  truncated: boolean;
}

type CategoryKey = 'workflow' | 'game' | 'data' | 'ai' | 'etc';

const CATEGORIES: Record<CategoryKey, { label: string; color: string; icon: string }> = {
  workflow: { label: '워크플로', color: '#a78bfa', icon: '⚡' },
  game:     { label: '게임 규칙', color: '#f59e0b', icon: '🎮' },
  data:     { label: '데이터 규칙', color: '#34d399', icon: '📊' },
  ai:       { label: 'AI 가이드', color: '#60a5fa', icon: '🤖' },
  etc:      { label: '기타', color: '#94a3b8', icon: '📄' },
};

function categorize(name: string): CategoryKey {
  if (name.startsWith('workflow_')) return 'workflow';
  if (/aegis|koth|character|passive|statuseffect|module|level/.test(name)) return 'game';
  if (/bible|table|data|sheet|resource|enum|sql|hash|validation|id_rules|type_rules/.test(name)) return 'data';
  if (/artifact|mermaid|jira|guide|improvement|feedback|test_case|numbered_list|lee_doohyung/.test(name)) return 'ai';
  return 'etc';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatName(name: string) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setItems(data.items || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (name: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/knowledge/read?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setSelected(data);
    } catch { /* ignore */ }
    setDetailLoading(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const filtered = items.filter(it => {
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase()) || formatName(it.name).toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || categorize(it.name) === activeCategory;
    return matchSearch && matchCat;
  });

  const categoryCounts = items.reduce((acc, it) => {
    const cat = categorize(it.name);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">

        {/* ── 좌측: 목록 ── */}
        <div className="flex flex-col overflow-hidden" style={{ width: 360, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>

          {/* 헤더 */}
          <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(108,142,239,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Knowledge Base</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{items.length}개의 지식 문서</div>
              </div>
            </div>

            {/* 검색 */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="지식 검색..."
                style={{
                  width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              <button
                onClick={() => setActiveCategory('all')}
                style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: 'none',
                  background: activeCategory === 'all' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: activeCategory === 'all' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >전체 {items.length}</button>
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    border: 'none',
                    background: activeCategory === key ? cat.color : 'var(--bg-surface)',
                    color: activeCategory === key ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >{cat.icon} {cat.label} {categoryCounts[key] || 0}</button>
              ))}
            </div>
          </div>

          {/* 목록 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
                로딩 중...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
                {search ? '검색 결과 없음' : '지식 문서 없음'}
              </div>
            ) : filtered.map(it => {
              const cat = CATEGORIES[categorize(it.name)];
              const isActive = selected?.name === it.name;
              return (
                <button
                  key={it.name}
                  onClick={() => openDetail(it.name)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                    padding: '12px 12px', marginBottom: 2, borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? 'rgba(108,142,239,0.12)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 1 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{formatName(it.name)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span style={{ color: cat.color, fontWeight: 500 }}>{cat.label}</span>
                      <span>{it.sizeKB}KB</span>
                      <span>{formatDate(it.updatedAt)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 우측: 상세 ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          {detailLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: 13 }}>
              로딩 중...
            </div>
          ) : selected ? (
            <>
              {/* 상세 헤더 */}
              <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ fontSize: 20 }}>{CATEGORIES[categorize(selected.name)].icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{formatName(selected.name)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span style={{ color: CATEGORIES[categorize(selected.name)].color, fontWeight: 500 }}>
                      {CATEGORIES[categorize(selected.name)].label}
                    </span>
                    {' · '}{selected.sizeKB}KB
                    {selected.truncated && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠ 일부만 표시</span>}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                >닫기</button>
              </div>

              {/* 상세 본문 */}
              <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                <MarkdownContent content={selected.content} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>📚</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>좌측 목록에서 문서를 선택하세요</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
                AI가 학습한 {items.length}개의 지식 문서를 열람할 수 있습니다
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} style={{
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
            padding: '14px 16px', margin: '12px 0', overflowX: 'auto', fontSize: 12.5,
            fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: '#e6edf3',
          }}>
            {codeLang && <div style={{ fontSize: 10, color: '#7d8590', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{codeLang}</div>}
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '24px 0 12px', paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '20px 0 8px' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', margin: '16px 0 6px' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 4, fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
          <span><InlineMarkdown text={line.slice(2)} /></span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 4, fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0, minWidth: 18 }}>{match[1]}.</span>
            <span><InlineMarkdown text={match[2]} /></span>
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(<p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)', margin: '4px 0' }}><InlineMarkdown text={line} /></p>);
    }
    i++;
  }

  return <div>{elements}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let earliest: { type: 'bold' | 'code'; index: number; match: RegExpMatchArray } | null = null;
    if (boldMatch && boldMatch.index !== undefined) earliest = { type: 'bold', index: boldMatch.index, match: boldMatch };
    if (codeMatch && codeMatch.index !== undefined && (!earliest || codeMatch.index < earliest.index)) earliest = { type: 'code', index: codeMatch.index, match: codeMatch };

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index));

    if (earliest.type === 'bold') {
      parts.push(<strong key={key++} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{earliest.match[1]}</strong>);
    } else {
      parts.push(
        <code key={key++} style={{
          background: 'rgba(108,142,239,0.12)', color: 'var(--accent)', padding: '1px 5px',
          borderRadius: 4, fontSize: '0.9em', fontFamily: 'var(--font-mono)',
        }}>{earliest.match[1]}</code>
      );
    }

    remaining = remaining.slice(earliest.index + earliest.match[0].length);
  }

  return <>{parts}</>;
}
