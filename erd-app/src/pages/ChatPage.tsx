import { useState, useRef, useEffect, useCallback } from 'react';
import Toolbar from '../components/Layout/Toolbar.tsx';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import DocsMiniERD from '../components/Docs/DocsMiniERD.tsx';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import {
  sendChatMessage,
  type ChatTurn,
  type ToolCallResult,
  type DataQueryResult,
  type SchemaCardResult,
  type GitHistoryResult,
  type RevisionDiffResult,
  type ImageResult,
  type DiffFile,
  type DiffHunk,
} from '../core/ai/chatEngine.ts';

// ── UUID 폴백 (HTTP 환경에서 crypto.randomUUID 미지원 대응) ──────────────────
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
  liveToolCalls?: ToolCallResult[]; // 스트리밍 중 실시간 tool_calls
}

// ── localStorage 캐시 키 ──────────────────────────────────────────────────────
const CHAT_CACHE_KEY = 'datamaster_chat_history';

// ── 간단 마크다운 렌더러 ──────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 코드 블록
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={i}
          className="rounded-lg px-4 py-3 my-2 overflow-x-auto text-[12px]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
          }}
        >
          {codeLines.join('\n')}
        </pre>,
      );
      i++;
      continue;
    }

    // 헤더
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-[13px] font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>
          {inlineMarkdown(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} className="text-[14px] font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>
          {inlineMarkdown(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} className="text-[15px] font-bold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
          {inlineMarkdown(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }

    // 목록 (-, *, •)
    if (/^[-*•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={i} className="my-1 pl-4 space-y-0.5" style={{ listStyleType: 'disc' }}>
          {items.map((item, j) => (
            <li key={j} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {inlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // 번호 목록
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol key={i} className="my-1 pl-4 space-y-0.5" style={{ listStyleType: 'decimal' }}>
          {items.map((item, j) => (
            <li key={j} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {inlineMarkdown(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // 마크다운 테이블 (| 로 시작하는 행)
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      // 헤더 / 구분선 / 데이터 분리
      const parseRow = (row: string) =>
        row.split('|').slice(1, -1).map((cell) => cell.trim());

      const headerRow = tableLines[0] ? parseRow(tableLines[0]) : [];
      // 두 번째 줄이 구분선(---) 이면 건너뜀
      const dataSep = tableLines[1] ? /^[\|\s\-:]+$/.test(tableLines[1]) : false;
      const dataRows = tableLines.slice(dataSep ? 2 : 1).map(parseRow);

      nodes.push(
        <div key={i} className="my-3 overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
          <table className="text-[12px] w-full" style={{ borderCollapse: 'collapse' }}>
            {headerRow.length > 0 && (
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  {headerRow.map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                      style={{ color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}
                    >
                      {inlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataRows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: ri < dataRows.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: ri % 2 === 0 ? 'transparent' : 'var(--bg-hover)',
                  }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2"
                      style={{ color: ci === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {looksLikeFilename(cell)
                        ? <InlineImageCell text={cell} />
                        : inlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // 수평선
    if (/^---+$/.test(line.trim())) {
      nodes.push(
        <hr key={i} className="my-3" style={{ borderColor: 'var(--border-color)' }} />,
      );
      i++;
      continue;
    }

    // 빈 줄
    if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // 일반 텍스트
    nodes.push(
      <p key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {inlineMarkdown(line)}
      </p>,
    );
    i++;
  }

  return nodes;
}

// ── 인라인 이미지 썸네일 (테이블 셀 파일명 자동 감지) ────────────────────────

// 모듈 레벨 캐시: filename → { relPath, url } | null
const _imgCache = new Map<string, { relPath: string; url: string } | null>();

function looksLikeFilename(text: string): boolean {
  if (text.length < 4 || text.includes(' ') || text.includes('.')) return false;
  return /^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(text);
}

function InlineImageCell({ text }: { text: string }) {
  const [img, setImg] = useState<{ relPath: string; url: string } | null | undefined>(undefined);

  useEffect(() => {
    if (!looksLikeFilename(text)) { setImg(null); return; }
    if (_imgCache.has(text)) { setImg(_imgCache.get(text)!); return; }
    fetch(`/api/images/list?q=${encodeURIComponent(text)}`)
      .then(r => r.json())
      .then((data: { results: { name: string; relPath: string }[] }) => {
        // 정확히 이름이 일치하는 것 우선, 없으면 첫 번째
        const exact = data.results.find(r => r.name.toLowerCase() === text.toLowerCase());
        const hit = exact ?? data.results[0] ?? null;
        const result = hit ? { relPath: hit.relPath, url: `/api/images/file?path=${encodeURIComponent(hit.relPath)}` } : null;
        _imgCache.set(text, result);
        setImg(result);
      })
      .catch(() => { _imgCache.set(text, null); setImg(null); });
  }, [text]);

  if (!img) return <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>{text}</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded overflow-hidden flex-shrink-0"
        style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
        title={img.relPath}
      >
        <img src={img.url} alt={text} style={{ width: 26, height: 26, objectFit: 'contain' }} onError={(e) => { (e.currentTarget.parentElement!.style.display = 'none'); }} />
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>{text}</span>
    </span>
  );
}

function inlineMarkdown(text: string): React.ReactNode {
  // **bold**, `code`, *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded text-[12px]"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// ── 테이블 스키마 카드 (ERD 노드 스타일 + 미니 ERD 임베드) ──────────────────

function TableSchemaCard({ tc }: { tc: SchemaCardResult }) {
  const [expanded, setExpanded] = useState(true);       // 카드 전체 (열림)
  const [showCols, setShowCols] = useState(false);      // 컬럼 목록 (접힘)
  const [showERD, setShowERD] = useState(true);         // ERD (자동 펼침)
  const info = tc.tableInfo;

  if (tc.error || !info) {
    return (
      <div className="rounded-lg px-3 py-2 mb-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        {tc.error || '테이블 없음'}
      </div>
    );
  }

  const Badge = ({ label, color }: { label: string; color: string }) => (
    <span className="px-1.5 py-px rounded text-[9px] font-bold" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid var(--accent)', boxShadow: '0 0 12px rgba(99,102,241,0.15)' }}>
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        style={{ background: 'rgba(99,102,241,0.12)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
        <span className="font-bold text-[12px] flex-1" style={{ color: 'var(--text-primary)' }}>
          {info.name}
        </span>
        {info.group && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            {info.group}
          </span>
        )}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{info.columns.length}컬럼</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ background: 'var(--bg-surface)' }}>
          {/* note */}
          {info.note && (
            <div className="px-3 py-1.5 text-[11px] italic" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
              {info.note}
            </div>
          )}

          {/* 컬럼 목록 (토글) */}
          <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setShowCols(!showCols)}
              className="w-full flex items-center gap-2 px-3 py-1.5"
              style={{ background: 'var(--bg-hover)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
                컬럼 ({info.columns.length})
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                {info.columns.filter(c => c.isPK).length > 0 && `PK ${info.columns.filter(c => c.isPK).length} `}
                {info.columns.filter(c => c.isFK).length > 0 && `FK ${info.columns.filter(c => c.isFK).length}`}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--text-muted)', transform: showCols ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showCols && (
              <div>
                {info.columns.map((col, i) => (
                  <div
                    key={col.name}
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      background: col.isPK ? 'rgba(251,191,36,0.04)' : 'transparent',
                    }}
                  >
                    <span className="w-4 flex-shrink-0 text-center">
                      {col.isPK ? (
                        <span style={{ color: '#fbbf24', fontSize: 10 }}>🔑</span>
                      ) : col.isFK ? (
                        <span style={{ color: '#60a5fa', fontSize: 10 }}>🔗</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--border-color)' }} />
                      )}
                    </span>
                    <span
                      className="text-[12px] font-mono flex-1 min-w-0 truncate"
                      style={{ color: col.isPK ? '#fbbf24' : col.isFK ? '#60a5fa' : 'var(--text-primary)' }}
                    >
                      {col.name}
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {col.type}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      {col.isPK && <Badge label="PK" color="#fbbf24" />}
                      {col.isFK && <Badge label="FK" color="#60a5fa" />}
                      {col.isNotNull && <Badge label="NN" color="#a78bfa" />}
                      {col.isUnique && <Badge label="UQ" color="#34d399" />}
                    </div>
                    {col.note && (
                      <span className="text-[10px] flex-shrink-0 truncate max-w-[100px]" style={{ color: 'var(--text-muted)' }} title={col.note}>
                        {col.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관계 */}
          {info.relations.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}>
                관계 ({info.relations.length})
              </div>
              {info.relations.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span style={{ color: r.direction === 'out' ? '#34d399' : '#f472b6', fontSize: 14 }}>
                    {r.direction === 'out' ? '→' : '←'}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.table}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({r.fromCol} ↔ {r.toCol})</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    {r.relType}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ERD 다이어그램 (기본 펼침, 닫기 가능) */}
          {tc.tableId && (
            <div style={{ borderTop: '1px solid var(--border-color)' }}>
              {/* 미니 헤더 */}
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'var(--bg-hover)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ color: 'var(--accent)', flexShrink: 0 }}>
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="15" y="3" width="6" height="6" rx="1" />
                  <rect x="9" y="15" width="6" height="6" rx="1" />
                  <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
                  <line x1="12" y1="12" x2="12" y2="15" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--text-muted)' }}>
                  ERD {info.relations.length > 0 && `· 연결 ${info.relations.length}개`}
                </span>
                <button
                  onClick={() => setShowERD(!showERD)}
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                >
                  {showERD ? '접기' : '펼치기'}
                </button>
              </div>
              {showERD && (
                <div style={{ height: 340, borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', position: 'relative' }}>
                  <DocsMiniERD tableId={tc.tableId} />
                  <div
                    className="absolute bottom-2 right-2 text-[9px] px-2 py-1 rounded select-none pointer-events-none"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', opacity: 0.8 }}
                  >
                    드래그·휠줌·더블클릭(맞춤)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Git 히스토리 카드 ────────────────────────────────────────────────────────

function GitHistoryCard({ tc }: { tc: GitHistoryResult }) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (tc.error) {
    return (
      <div className="rounded-lg px-3 py-2 mb-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        {tc.error}
      </div>
    );
  }

  const commits = showAll ? tc.commits : tc.commits.slice(0, 8);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(34,197,94,0.4)', boxShadow: '0 0 12px rgba(34,197,94,0.08)' }}>
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        style={{ background: 'rgba(34,197,94,0.08)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#22c55e', flexShrink: 0 }}>
          <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
          <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
          <line x1="12" y1="12" x2="12" y2="15" />
        </svg>
        <span className="font-bold text-[12px] flex-1" style={{ color: 'var(--text-primary)' }}>
          Git 커밋 히스토리
          {tc.filterPath && <span className="ml-1 font-normal text-[10px]" style={{ color: 'var(--text-muted)' }}>— {tc.filterPath}</span>}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{tc.commits.length}개</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ background: 'var(--bg-surface)' }}>
          {commits.map((commit, i) => (
            <div
              key={commit.hash}
              className="flex gap-3 px-3 py-2.5"
              style={{ borderTop: i === 0 ? '1px solid var(--border-color)' : '1px solid var(--border-color)' }}
            >
              {/* 타임라인 */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 16 }}>
                <div className="w-2.5 h-2.5 rounded-full mt-0.5" style={{ background: i === 0 ? '#22c55e' : 'var(--border-color)', boxShadow: i === 0 ? '0 0 6px #22c55e' : 'none', flexShrink: 0 }} />
                {i < commits.length - 1 && (
                  <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-color)', minHeight: 8 }} />
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                    {commit.short}
                  </code>
                  <span className="text-[11px] flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {commit.message}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{commit.author}</span>
                  <span>·</span>
                  <span>{formatDate(commit.date)}</span>
                </div>
                {commit.files && commit.files.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {commit.files.slice(0, 5).map((f, fi) => (
                      <span
                        key={fi}
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                      >
                        {f.split('/').pop()}
                      </span>
                    ))}
                    {commit.files.length > 5 && (
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{commit.files.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!showAll && tc.commits.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-[11px]"
              style={{ color: 'var(--accent)', borderTop: '1px solid var(--border-color)', background: 'transparent' }}
            >
              전체 {tc.commits.length}개 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 리비전 DIFF 카드 ─────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'A') return '#22c55e';
  if (status === 'D') return '#f87171';
  if (status === 'R') return '#a78bfa';
  return '#60a5fa'; // M (modified)
}
function statusLabel(status: string) {
  if (status === 'A') return 'ADD';
  if (status === 'D') return 'DEL';
  if (status === 'R') return 'REN';
  return 'MOD';
}

function DiffHunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div className="overflow-x-auto text-[10px] font-mono" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-3 py-0.5 text-[9px] select-none" style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}>
        {hunk.header}
      </div>
      {hunk.lines.map((line, i) => (
        <div
          key={i}
          className="flex leading-5 px-3 min-w-0"
          style={{
            background:
              line.type === 'add' ? 'rgba(34,197,94,0.12)' :
              line.type === 'del' ? 'rgba(248,113,113,0.12)' :
              'transparent',
          }}
        >
          <span
            className="flex-shrink-0 w-4 mr-2 select-none"
            style={{
              color:
                line.type === 'add' ? '#22c55e' :
                line.type === 'del' ? '#f87171' :
                'var(--text-muted)',
            }}
          >
            {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
          </span>
          <span
            className="whitespace-pre flex-1 min-w-0 overflow-x-auto"
            style={{
              color:
                line.type === 'add' ? '#86efac' :
                line.type === 'del' ? '#fca5a5' :
                'var(--text-secondary)',
            }}
          >
            {line.content || ' '}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiffFileRow({ file }: { file: DiffFile }) {
  const [open, setOpen] = useState(false);
  const fileName = file.path.split('/').pop() ?? file.path;

  return (
    <div style={{ borderTop: '1px solid var(--border-color)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: open ? 'rgba(96,165,250,0.06)' : 'transparent', transition: 'background 0.12s' }}
      >
        {/* 상태 뱃지 */}
        <span
          className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded"
          style={{ background: `${statusColor(file.status)}22`, color: statusColor(file.status), minWidth: 28, textAlign: 'center' }}
        >
          {statusLabel(file.status)}
        </span>

        {/* 경로 */}
        <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{file.path.slice(0, file.path.length - fileName.length)}</span>
          <span style={{ fontWeight: 600 }}>{fileName}</span>
        </span>

        {/* +/- 수 */}
        {!file.binary && (
          <span className="flex-shrink-0 flex items-center gap-1 text-[10px]">
            {file.additions > 0 && <span style={{ color: '#22c55e' }}>+{file.additions}</span>}
            {file.deletions > 0 && <span style={{ color: '#f87171' }}>-{file.deletions}</span>}
          </span>
        )}
        {file.binary && <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>binary</span>}

        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !file.binary && file.hunks.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          {file.hunks.map((hunk, hi) => <DiffHunkView key={hi} hunk={hunk} />)}
        </div>
      )}
      {open && file.binary && (
        <div className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
          바이너리 파일 — diff 표시 불가
        </div>
      )}
      {open && !file.binary && file.hunks.length === 0 && (
        <div className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
          변경 내용 없음 (mode change 등)
        </div>
      )}
    </div>
  );
}

function DiffCard({ tc }: { tc: RevisionDiffResult }) {
  const [expanded, setExpanded] = useState(true);

  if (tc.error) {
    return (
      <div className="rounded-lg px-3 py-2 mb-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        DIFF 오류: {tc.error}
      </div>
    );
  }

  const totalAdd = tc.files.reduce((s, f) => s + f.additions, 0);
  const totalDel = tc.files.reduce((s, f) => s + f.deletions, 0);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(96,165,250,0.4)', boxShadow: '0 0 12px rgba(96,165,250,0.08)' }}>
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        style={{ background: 'rgba(96,165,250,0.08)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#60a5fa', flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
          <line x1="9" y1="9" x2="11" y2="9" />
        </svg>
        <span className="font-bold text-[12px] flex-1" style={{ color: 'var(--text-primary)' }}>
          리비전 DIFF
          {tc.commit && (
            <code className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: '#60a5fa' }}>
              {tc.commit.short}
            </code>
          )}
        </span>
        {/* stat badge */}
        <span className="flex items-center gap-1.5 text-[10px] flex-shrink-0">
          {totalAdd > 0 && <span style={{ color: '#22c55e' }}>+{totalAdd}</span>}
          {totalDel > 0 && <span style={{ color: '#f87171' }}>-{totalDel}</span>}
          <span style={{ color: 'var(--text-muted)' }}>{tc.totalFiles}파일</span>
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ background: 'var(--bg-surface)' }}>
          {/* 커밋 메타 */}
          {tc.commit && (
            <div className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>작성자</span>
              <span style={{ color: 'var(--text-primary)' }}>{tc.commit.author}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(tc.commit.date)}</span>
              {tc.filterFile && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>{tc.filterFile.split('/').pop()}</span>
                </>
              )}
            </div>
          )}

          {/* 커밋 메시지 */}
          {tc.commit?.message && (
            <div className="px-3 py-2 text-[11px]" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-surface)', fontStyle: 'italic' }}>
              "{tc.commit.message}"
            </div>
          )}

          {/* 파일 목록 */}
          {tc.files.length === 0 ? (
            <div className="px-3 py-3 text-[11px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
              변경된 파일 없음
            </div>
          ) : (
            tc.files.map((file, i) => <DiffFileRow key={i} file={file} />)
          )}

          {/* 총 파일 수 초과 안내 */}
          {tc.totalFiles > tc.files.length && (
            <div className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
              총 {tc.totalFiles}개 파일 중 {tc.files.length}개 표시 — 특정 파일을 지정하면 전체 diff를 볼 수 있습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 이미지 썸네일 (개별 로딩 상태 관리) ─────────────────────────────────────

function ImageThumb({
  img,
  selected,
  onClick,
}: {
  img: { name: string; url: string; relPath: string; isAtlas?: boolean };
  selected: boolean;
  onClick: () => void;
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-1 rounded-lg"
      style={{
        background: selected ? 'rgba(52,211,153,0.15)' : 'var(--bg-hover)',
        border: selected ? '1px solid #34d399' : '1px solid var(--border-color)',
        transition: 'all 0.12s',
      }}
      title={img.relPath}
    >
      <div className="w-full rounded flex items-center justify-center overflow-hidden" style={{ height: 64, background: 'rgba(255,255,255,0.04)' }}>
        {status !== 'error' ? (
          <img
            src={img.url}
            alt={img.name}
            className="w-full h-full"
            style={{ objectFit: 'contain', display: status === 'ok' ? 'block' : 'none' }}
            onLoad={() => setStatus('ok')}
            onError={() => setStatus('error')}
          />
        ) : null}
        {status === 'loading' && (
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'transparent' }} />
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-0.5 px-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {img.isAtlas && (
              <span className="text-[7px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Atlas</span>
            )}
          </div>
        )}
      </div>
      <span className="text-[9px] truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>
        {img.name}
      </span>
    </button>
  );
}

// ── 이미지 검색 카드 ─────────────────────────────────────────────────────────

function ImageCard({ tc }: { tc: ImageResult }) {
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState<{ name: string; url: string } | null>(null);

  if (tc.error) {
    return (
      <div className="rounded-lg px-3 py-2 mb-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        이미지 검색 오류: {tc.error}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        style={{ background: 'rgba(52,211,153,0.1)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#34d399', flexShrink: 0 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="font-semibold text-[12px] flex-1" style={{ color: 'var(--text-primary)' }}>
          이미지 &quot;{tc.query}&quot;
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
          {tc.images.length}개 발견
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && tc.images.length > 0 && (
        <div>
          {/* 썸네일 그리드 */}
          <div className="p-2 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
            {tc.images.map((img) => (
              <ImageThumb
                key={img.relPath}
                img={img}
                selected={selected?.url === img.url}
                onClick={() => setSelected(selected?.url === img.url ? null : img)}
              />
            ))}
          </div>

          {/* 선택된 이미지 확대 뷰 */}
          {selected && (
            <div className="mx-2 mb-2 p-3 rounded-lg" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{selected.name}</span>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                >
                  원본 열기
                </a>
                <button onClick={() => setSelected(null)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  닫기
                </button>
              </div>
              <div className="flex justify-center rounded overflow-hidden" style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}>
                <img
                  src={selected.url}
                  alt={selected.name}
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && tc.images.length === 0 && (
        <div className="px-3 py-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          &quot;{tc.query}&quot; 에 해당하는 이미지를 찾지 못했습니다.
        </div>
      )}
    </div>
  );
}

// ── ToolCall 카드 디스패처 ───────────────────────────────────────────────────

function ToolCallCard({ tc, index }: { tc: ToolCallResult; index: number }) {
  if (tc.kind === 'schema_card') return <TableSchemaCard tc={tc} />;
  if (tc.kind === 'git_history') return <GitHistoryCard tc={tc} />;
  if (tc.kind === 'revision_diff') return <DiffCard tc={tc} />;
  if (tc.kind === 'image_search') return <ImageCard tc={tc} />;
  return <DataQueryCard tc={tc} index={index} />;
}

// ── 데이터 조회 카드 (기존 ToolCallCard 내용) ────────────────────────────────

function DataQueryCard({ tc, index }: { tc: DataQueryResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden mb-2"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: 'transparent' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span className="text-[11px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--text-secondary)' }}>
          {tc.reason || `Query ${index + 1}`}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: tc.error ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
            color: tc.error ? '#f87171' : 'var(--accent)',
          }}
        >
          {tc.error ? '오류' : `${tc.rowCount}행`}
        </span>
        {tc.duration != null && (
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {tc.duration.toFixed(0)}ms
          </span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="px-3 py-2">
            <div className="text-[10px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SQL</div>
            <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {tc.sql}
            </pre>
          </div>
          {tc.error && (
            <div className="mx-3 mb-2 px-3 py-2 rounded text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              {tc.error}
            </div>
          )}
          {!tc.error && tc.rows.length > 0 && (
            <div className="overflow-x-auto mx-3 mb-2 rounded" style={{ border: '1px solid var(--border-color)' }}>
              <table className="text-[11px] w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)' }}>
                    {tc.columns.map((col) => (
                      <th key={col} className="px-2 py-1 text-left font-semibold whitespace-nowrap"
                        style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tc.rows.slice(0, 10).map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border-color)', background: ri % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                      {tc.columns.map((col) => (
                        <td key={col} className="px-2 py-1 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                          style={{ color: 'var(--text-secondary)' }} title={String(row[col] ?? '')}>
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tc.rows.length > 10 && (
                <div className="px-3 py-1.5 text-[10px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                  ... 외 {tc.rows.length - 10}행 더 있음
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 로딩 인디케이터 ──────────────────────────────────────────────────────────

function ThinkingIndicator({ liveToolCalls }: { liveToolCalls?: ToolCallResult[] }) {
  return (
    <div className="flex flex-col gap-2">
      {/* 실시간 tool calls */}
      {liveToolCalls && liveToolCalls.length > 0 && (
        <div className="space-y-1">
          {liveToolCalls.map((tc, i) => (
            <ToolCallCard key={i} tc={tc} index={i} />
          ))}
        </div>
      )}
      {/* 타이핑 인디케이터 */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', animation: 'chatDot 1.2s ease-in-out infinite 0s' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', animation: 'chatDot 1.2s ease-in-out infinite 0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', animation: 'chatDot 1.2s ease-in-out infinite 0.4s' }} />
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {liveToolCalls && liveToolCalls.length > 0
            ? `데이터 분석 중... (${liveToolCalls.length}번 조회)`
            : '생각하는 중...'}
        </span>
      </div>
    </div>
  );
}

// ── 메시지 버블 ──────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 아바타 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--bg-surface)',
          border: isUser ? 'none' : '1px solid var(--border-color)',
        }}
      >
        {isUser ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        )}
      </div>

      {/* 내용 */}
      <div className={`flex flex-col gap-1 max-w-[80%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: isUser ? 'var(--accent)' : 'var(--bg-surface)',
            border: isUser ? 'none' : '1px solid var(--border-color)',
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4,
          }}
        >
          {msg.isLoading ? (
            <ThinkingIndicator liveToolCalls={msg.liveToolCalls} />
          ) : isUser ? (
            <p className="text-[13px] whitespace-pre-wrap" style={{ color: '#fff' }}>
              {msg.content}
            </p>
          ) : (
            <div className="space-y-0.5">
              {/* Tool calls */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1">
                  {msg.toolCalls.map((tc, i) => (
                    <ToolCallCard key={i} tc={tc} index={i} />
                  ))}
                </div>
              )}
              {/* 오류 */}
              {msg.error && (
                <div
                  className="px-3 py-2 rounded-lg text-[12px] mb-2"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                >
                  {msg.error}
                </div>
              )}
              {/* 본문 */}
              {renderMarkdown(msg.content)}
            </div>
          )}
        </div>
        <span className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>
          {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function ChatPage() {
  // DBML → 스키마 파싱 (다른 페이지 거치지 않고 바로 들어올 때 필요)
  useDebouncedParse();

  const schema = useSchemaStore((s) => s.schema);
  const tableData = useCanvasStore((s) => s.tableData);

  // localStorage에서 이전 대화 복원
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Message[];
      // isLoading 중인 메시지 제거, Date 복원
      return parsed
        .filter((m) => !m.isLoading)
        .map((m) => ({ ...m, timestamp: new Date(m.timestamp), liveToolCalls: undefined }));
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // historyRef: Claude API에 넘길 대화 이력 — localStorage에서 복원
  const historyRef = useRef<ChatTurn[]>((() => {
    try {
      const raw = localStorage.getItem(CHAT_CACHE_KEY);
      if (!raw) return [];
      const msgs = JSON.parse(raw) as Message[];
      return msgs
        .filter((m) => !m.isLoading && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, timestamp: new Date(m.timestamp) }));
    } catch { return []; }
  })());

  // 스크롤 자동 내리기
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 대화 내역 localStorage 캐시 저장 (isLoading 메시지 제외)
  useEffect(() => {
    const toSave = messages.filter((m) => !m.isLoading);
    if (toSave.length === 0) {
      localStorage.removeItem(CHAT_CACHE_KEY);
    } else {
      try {
        localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(toSave));
      } catch {
        // 용량 초과 시 오래된 절반 제거
        try {
          localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(toSave.slice(-20)));
        } catch { /* ignore */ }
      }
    }
  }, [messages]);

  // 자동 높이 조정
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const hasData = tableData.size > 0;

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const loadingMsg: Message = {
      id: genId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      liveToolCalls: [],
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    const loadingId = loadingMsg.id;

    try {
      const { content, toolCalls } = await sendChatMessage(
        text.trim(),
        historyRef.current,
        schema,
        tableData,
        (tc, _idx) => {
          // 실시간 tool call 업데이트
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { ...m, liveToolCalls: [...(m.liveToolCalls ?? []), tc] }
                : m,
            ),
          );
        },
      );

      // history 갱신
      historyRef.current = [
        ...historyRef.current,
        { id: userMsg.id, role: 'user' as const, content: text.trim(), timestamp: userMsg.timestamp },
        { id: loadingId, role: 'assistant' as const, content, toolCalls, timestamp: new Date() },
      ].slice(-20); // 최근 20턴만 유지

      // 로딩 메시지를 실제 응답으로 교체
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content, toolCalls, isLoading: false, liveToolCalls: undefined }
            : m,
        ),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: '오류가 발생했습니다.', error: errMsg, isLoading: false, liveToolCalls: undefined }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, schema, tableData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    historyRef.current = [];
    localStorage.removeItem(CHAT_CACHE_KEY);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 사이드바 ── */}
        <div
          className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          {/* 데이터 현황 */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              데이터 현황
            </div>
            {hasData ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: 'var(--text-secondary)' }}>테이블</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tableData.size}개</span>
                </div>
                {schema && (
                  <>
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: 'var(--text-secondary)' }}>컬럼</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {schema.tables.reduce((s, t) => s + t.columns.length, 0)}개
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: 'var(--text-secondary)' }}>관계</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{schema.refs.length}개</span>
                    </div>
                  </>
                )}
                <div
                  className="mt-2 flex items-center gap-1.5 text-[11px]"
                  style={{ color: '#22c55e' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
                  AI 준비 완료
                </div>
              </div>
            ) : (
              <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                데이터를 먼저 Import 해주세요
              </div>
            )}
          </div>

          {/* 최근 대화 요약 */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.filter((m) => !m.isLoading).length > 0 ? (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                  최근 대화
                </div>
                <div className="space-y-1">
                  {messages
                    .filter((m) => m.role === 'user' && !m.isLoading)
                    .slice(-8)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 rounded-lg text-[11px] truncate"
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-hover)' }}
                        title={m.content}
                      >
                        <span style={{ color: 'var(--accent)', marginRight: 6 }}>›</span>
                        {m.content}
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-2" style={{ color: 'var(--text-muted)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-30">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-[11px]">대화 내역 없음</span>
              </div>
            )}
          </div>

          {/* 대화 초기화 */}
          {messages.length > 0 && (
            <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] interactive"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.82" />
                </svg>
                대화 초기화
              </button>
            </div>
          )}
        </div>

        {/* ── 채팅 영역 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  게임 데이터 AI 어시스턴트
                </h2>
                <p className="text-[13px] max-w-md leading-relaxed">
                  {hasData
                    ? '게임 데이터에 대해 자유롭게 질문하세요. AI가 SQL로 데이터를 직접 조회해서 답변합니다.'
                    : 'Import 탭에서 데이터를 먼저 불러온 후 질문하세요.'}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            <div ref={bottomRef} />
          </div>

          {/* 입력 영역 */}
          <div
            className="flex-shrink-0 px-6 pb-6 pt-3"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div
              className="flex items-end gap-3 rounded-2xl px-4 py-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasData
                    ? '게임 데이터에 대해 무엇이든 물어보세요... (Shift+Enter: 줄바꿈)'
                    : '데이터를 먼저 Import 해주세요'
                }
                disabled={isLoading || !hasData}
                rows={1}
                className="flex-1 resize-none bg-transparent border-none outline-none text-[13px] leading-relaxed"
                style={{
                  color: 'var(--text-primary)',
                  minHeight: 24,
                  maxHeight: 160,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim() || !hasData}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: isLoading || !input.trim() || !hasData ? 'var(--bg-hover)' : 'var(--accent)',
                  cursor: isLoading || !input.trim() || !hasData ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="spinner" style={{ color: 'var(--text-muted)' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: isLoading || !input.trim() || !hasData ? 'var(--text-muted)' : '#fff' }}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Claude AI가 실제 데이터를 조회하여 답변합니다 · Enter로 전송 · Shift+Enter로 줄바꿈
            </div>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
