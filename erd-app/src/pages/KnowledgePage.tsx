import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Toolbar from '../components/Layout/Toolbar';

interface KnowledgeItem { name: string; sizeKB: number; updatedAt: string }
interface KnowledgeDetail { name: string; content: string; sizeKB: number; truncated: boolean }
type CategoryKey = 'workflow' | 'game' | 'data' | 'ai' | 'etc';

/* ── SVG Icons ── */
const Icon = {
  workflow: (c: string) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>,
  game: (c: string) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
  data: (c: string) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  ai: (c: string) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
  etc: (c: string) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  book: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warn: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  empty: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
};

const CATEGORIES: Record<CategoryKey, { label: string; color: string; iconKey: keyof typeof Icon }> = {
  workflow: { label: '워크플로', color: '#a78bfa', iconKey: 'workflow' },
  game:     { label: '게임 규칙', color: '#f59e0b', iconKey: 'game' },
  data:     { label: '데이터 규칙', color: '#34d399', iconKey: 'data' },
  ai:       { label: 'AI 가이드', color: '#60a5fa', iconKey: 'ai' },
  etc:      { label: '기타', color: '#94a3b8', iconKey: 'etc' },
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
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
          <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(108,142,239,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Icon.book('var(--accent)')}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Knowledge Base</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{items.length}개의 지식 문서</div>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>{Icon.search()}</div>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="지식 검색..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              <CatPill active={activeCategory === 'all'} color="var(--accent)" onClick={() => setActiveCategory('all')}>
                전체 {items.length}
              </CatPill>
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, cat]) => (
                <CatPill key={key} active={activeCategory === key} color={cat.color} onClick={() => setActiveCategory(key)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {(Icon[cat.iconKey] as (c: string) => ReactNode)(activeCategory === key ? '#fff' : cat.color)}
                    {cat.label} {categoryCounts[key] || 0}
                  </span>
                </CatPill>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
            {loading ? (
              <EmptyState>로딩 중...</EmptyState>
            ) : filtered.length === 0 ? (
              <EmptyState>{search ? '검색 결과 없음' : '지식 문서 없음'}</EmptyState>
            ) : filtered.map(it => {
              const cat = CATEGORIES[categorize(it.name)];
              const isActive = selected?.name === it.name;
              return (
                <button key={it.name} onClick={() => openDetail(it.name)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '12px', marginBottom: 2, borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? 'rgba(108,142,239,0.12)' : 'transparent', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(108,142,239,0.12)' : 'transparent'; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {(Icon[cat.iconKey] as (c: string) => ReactNode)(cat.color)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatName(it.name)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: cat.color, fontWeight: 500 }}>{cat.label}</span>
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span>{it.sizeKB}KB</span>
                      <span style={{ opacity: 0.5 }}>·</span>
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
            <EmptyState>로딩 중...</EmptyState>
          ) : selected ? (() => {
            const cat = CATEGORIES[categorize(selected.name)];
            return <>
              <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg-secondary)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(Icon[cat.iconKey] as (c: string) => ReactNode)(cat.color)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{formatName(selected.name)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: cat.color, fontWeight: 500 }}>{cat.label}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{selected.sizeKB}KB</span>
                    {selected.truncated && <><span style={{ opacity: 0.4 }}>·</span><span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{Icon.warn()} 일부만 표시</span></>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >{Icon.close()} 닫기</button>
              </div>
              <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 40px 40px' }}>
                <MarkdownContent content={selected.content} />
              </div>
            </>;
          })() : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12 }}>
              {Icon.empty()}
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>좌측 목록에서 문서를 선택하세요</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>
                AI가 학습한 {items.length}개의 지식 문서를 열람할 수 있습니다
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── UI Helpers ── */
function CatPill({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, cursor: 'pointer',
      border: 'none', background: active ? color : 'var(--bg-surface)',
      color: active ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>{children}</button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flex: 1, color: 'var(--text-muted)', fontSize: 13 }}>{children}</div>;
}

/* ── Markdown Renderer ── */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++; // skip closing ```
      elements.push(<CodeBlock key={`cb-${i}`} lang={lang} code={codeLines.join('\n')} />);
      continue;
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MdTable key={`tbl-${i}`} lines={tableLines} />);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} style={{
          margin: '12px 0', padding: '10px 16px', borderLeft: '3px solid var(--accent)',
          background: 'rgba(108,142,239,0.06)', borderRadius: '0 8px 8px 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7,
        }}>
          {quoteLines.map((ql, qi) => <div key={qi}><Inline text={ql} /></div>)}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '14px 0 4px', letterSpacing: 0.2 }}><Inline text={line.slice(5)} /></h4>);
      i++; continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--accent)', margin: '18px 0 6px' }}><Inline text={line.slice(4)} /></h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '24px 0 8px', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
          <Inline text={line.slice(3)} />
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '28px 0 12px', paddingBottom: 8, borderBottom: '2px solid var(--border-color)' }}>
          <Inline text={line.slice(2)} />
        </h1>
      );
      i++; continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />);
      i++; continue;
    }

    // Unordered list (with indent levels)
    if (/^\s*([-*])\s/.test(line)) {
      const listItems: { indent: number; text: string }[] = [];
      while (i < lines.length && /^\s*([-*])\s/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*])\s(.*)$/);
        if (m) listItems.push({ indent: m[1].length, text: m[3] });
        i++;
      }
      elements.push(
        <div key={`ul-${i}`} style={{ margin: '6px 0' }}>
          {listItems.map((li, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, paddingLeft: Math.min(li.indent, 8) * 6 + 4, margin: '3px 0', fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
              <span style={{ color: li.indent > 0 ? 'var(--text-muted)' : 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
                {li.indent > 0 ? '◦' : '•'}
              </span>
              <span><Inline text={li.text} /></span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const m = lines[i].match(/^\d+\.\s(.*)$/);
        if (m) listItems.push(m[1]);
        i++;
      }
      elements.push(
        <div key={`ol-${i}`} style={{ margin: '6px 0' }}>
          {listItems.map((text, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '3px 0', fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0, minWidth: 20, textAlign: 'right' }}>{idx + 1}.</span>
              <span><Inline text={text} /></span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 10 }} />);
      i++; continue;
    }

    // Paragraph
    elements.push(<p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)', margin: '4px 0' }}><Inline text={line} /></p>);
    i++;
  }

  return <div>{elements}</div>;
}

/* ── Code Block ── */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ margin: '14px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0d1117' }}>
      {lang && (
        <div style={{ padding: '6px 14px', fontSize: 11, color: '#7d8590', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 }}>{lang}</span>
          <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? '#34d399' : '#7d8590', cursor: 'pointer', fontSize: 11 }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre style={{ padding: '14px 16px', margin: 0, overflowX: 'auto', fontSize: 12.5, fontFamily: 'var(--font-mono)', lineHeight: 1.65, color: '#e6edf3' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ── Table ── */
function MdTable({ lines }: { lines: string[] }) {
  const parseRow = (line: string) =>
    line.split('|').slice(1, -1).map(c => c.trim());

  if (lines.length < 2) return null;
  const headers = parseRow(lines[0]);

  const isSepLine = (l: string) => parseRow(l).every(c => /^[-:]+$/.test(c));
  const dataStart = isSepLine(lines[1]) ? 2 : 1;
  const rows = lines.slice(dataStart).filter(l => !isSepLine(l)).map(parseRow);

  const cellBase: React.CSSProperties = { padding: '8px 12px', fontSize: 12.5, lineHeight: 1.5 };
  return (
    <div style={{ margin: '14px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-surface)' }}>
            {headers.map((h, hi) => (
              <th key={hi} style={{ ...cellBase, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ ...cellBase, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Inline Markdown ── */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    const candidates: { type: string; idx: number; match: RegExpMatchArray }[] = [];
    const tryMatch = (type: string, m: RegExpMatchArray | null) => {
      if (m && m.index !== undefined) candidates.push({ type, idx: m.index, match: m });
    };
    tryMatch('bold', remaining.match(/\*\*(.+?)\*\*/));
    tryMatch('code', remaining.match(/`([^`]+)`/));
    tryMatch('italic', remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/));
    tryMatch('link', remaining.match(/\[([^\]]+)\]\(([^)]+)\)/));

    if (candidates.length === 0) { parts.push(remaining); break; }
    candidates.sort((a, b) => a.idx - b.idx);
    const best = candidates[0];

    if (best.idx > 0) parts.push(remaining.slice(0, best.idx));

    if (best.type === 'bold') {
      parts.push(<strong key={k++} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{best.match[1]}</strong>);
    } else if (best.type === 'code') {
      parts.push(
        <code key={k++} style={{ background: 'rgba(108,142,239,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, fontSize: '0.88em', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {best.match[1]}
        </code>
      );
    } else if (best.type === 'italic') {
      parts.push(<em key={k++} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{best.match[1]}</em>);
    } else if (best.type === 'link') {
      parts.push(
        <a key={k++} href={best.match[2]} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid transparent' }}
          onMouseEnter={e => (e.currentTarget.style.borderBottomColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
        >{best.match[1]}</a>
      );
    }

    remaining = remaining.slice(best.idx + best.match[0].length);
  }

  return <>{parts}</>;
}
