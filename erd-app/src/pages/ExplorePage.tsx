import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Toolbar from '../components/Layout/Toolbar.tsx';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import {
  sendChatMessage,
  type ChatTurn,
  type ToolCallResult,
  type ArtifactResult,
  type ArtifactPatchResult,
} from '../core/ai/chatEngine.ts';

interface PublishedMeta {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── 간단 인라인 마크다운 ──────────────────────────────────────────────────────
function miniInline(text: string): React.ReactNode {
  const RE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]*)\]\(([^)]+)\)|(https?:\/\/[^\s<>"'\)\]]+)/g;
  const segs: React.ReactNode[] = [];
  let last = 0, key = 0, m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) segs.push(text.slice(last, m.index));
    const [full, bold, code, lt, lu, bare] = m;
    if (bold) segs.push(<strong key={key++} style={{ color: '#fff', fontWeight: 700 }}>{bold}</strong>);
    else if (code) segs.push(<code key={key++} className="px-1 py-0.5 rounded text-[11px]" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>{code}</code>);
    else if (lu) segs.push(<a key={key++} href={lu} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', textUnderlineOffset: 2 }}>{lt || lu}</a>);
    else if (bare) segs.push(<a key={key++} href={bare} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', textUnderlineOffset: 2 }}>{bare.length > 50 ? bare.slice(0, 48) + '…' : bare}</a>);
    last = m.index + full.length;
  }
  if (last < text.length) segs.push(text.slice(last));
  return <>{segs}</>;
}

function miniMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (/^###\s/.test(line)) return <h4 key={i} style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: '6px 0 2px' }}>{miniInline(line.replace(/^###\s/, ''))}</h4>;
    if (/^##\s/.test(line)) return <h3 key={i} style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '8px 0 2px' }}>{miniInline(line.replace(/^##\s/, ''))}</h3>;
    if (/^#\s/.test(line)) return <h2 key={i} style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: '10px 0 3px' }}>{miniInline(line.replace(/^#\s/, ''))}</h2>;
    if (/^[-*]\s/.test(line)) return <div key={i} style={{ paddingLeft: 12, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{miniInline(line.replace(/^[-*]\s/, ''))}</div>;
    if (/^\d+\.\s/.test(line)) return <div key={i} style={{ paddingLeft: 12 }}>{miniInline(line)}</div>;
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    return <div key={i}>{miniInline(line)}</div>;
  });
}

// ── HTML 압축 ─────────────────────────────────────────────────────────────────
function compressHtml(html: string): string {
  // ⚠️ 줄바꿈과 들여쓰기를 최대한 보존해야 Claude의 find 문자열이 원본과 일치함
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<!-- styles removed -->')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<!-- scripts removed -->')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
    .slice(0, 16000); // 토큰 절약하되 넉넉히
}

// ── patch 적용 ────────────────────────────────────────────────────────────────
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyPatches(orig: string, patches: { find: string; replace: string }[]): { html: string; applied: number; failed: string[] } {
  let html = orig;
  let applied = 0;
  const failed: string[] = [];
  for (const p of patches) {
    if (!p.find) continue;
    console.log(`[applyPatch] find(${p.find.length}자): "${p.find.slice(0, 80)}…"`);

    // 1차: 정확히 포함
    if (html.includes(p.find)) {
      html = html.split(p.find).join(p.replace);
      applied++;
      console.log(`[applyPatch] ✅ 정확 매칭 성공`);
      continue;
    }

    // 2차: 공백 정규화 후 매칭 (앞뒤 trim + 연속공백→단일공백)
    const normHtml = html.replace(/\s+/g, ' ');
    const normFind = p.find.replace(/\s+/g, ' ');
    if (normHtml.includes(normFind)) {
      // 정규화된 find → 원본에서 regex로 매칭
      const escaped = escapeRegExp(p.find);
      const relaxed = escaped.replace(/\\s\+|(?:\\ )+|\s+/g, '\\s+');
      try {
        const re = new RegExp(relaxed, 'g');
        const before = html;
        html = html.replace(re, p.replace);
        if (html !== before) {
          applied++;
          console.log(`[applyPatch] ✅ 공백 정규화 매칭 성공`);
          continue;
        }
      } catch { /* fall through */ }
    }

    // 3차: 줄단위 포함 검색 — find의 핵심 텍스트가 포함되어 있으면 교체
    const findCore = p.find.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (findCore.length >= 10) {
      const idx = html.replace(/<[^>]+>/g, (m) => ' '.repeat(m.length)).indexOf(findCore);
      if (idx >= 0) {
        // 핵심 텍스트 주변으로 원본 태그 포함하여 교체 시도
        const escaped = escapeRegExp(p.find);
        const relaxed = escaped.replace(/\\s\+|(?:\\ )+|\s+/g, '[\\s\\S]*?');
        try {
          const re = new RegExp(relaxed);
          const before = html;
          html = html.replace(re, p.replace);
          if (html !== before) {
            applied++;
            console.log(`[applyPatch] ✅ 핵심 텍스트 매칭 성공`);
            continue;
          }
        } catch { /* fall through */ }
      }
    }

    console.warn(`[applyPatch] ❌ 매칭 실패: "${p.find.slice(0, 60)}…"`);
    failed.push(p.find.slice(0, 40));
  }
  console.log(`[applyPatch] 결과: ${applied}개 성공, ${failed.length}개 실패`);
  return { html, applied, failed };
}

// ── 개별 카드 ────────────────────────────────────────────────────────────────
function DocCard({ meta, isSelected, onSelect, onDelete, viewMode }: {
  meta: PublishedMeta;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const confirmRef = useRef(false);
  const docUrl = `/api/p/${meta.id}`;
  const fullUrl = `${window.location.origin}${docUrl}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // ── 액션 버튼 ──
  const actionButtons = (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      <button onClick={handleCopy} title="URL 복사" className="p-1.5 rounded hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.7)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
      <a href={docUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="새 탭" className="p-1.5 rounded hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.7)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
      <button onClick={handleDelete} title={showDelete ? '한 번 더 클릭' : '삭제'} className="p-1.5 rounded hover:opacity-80 transition-all" style={{ color: showDelete ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  );

  // ══════════════ 리스트 뷰 ══════════════
  if (viewMode === 'list') {
    return (
      <div
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
        style={{
          background: isSelected ? 'rgba(99,102,241,0.12)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
        }}
      >
        {/* 아이콘 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isSelected ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#818cf8' : 'var(--text-muted)'} strokeWidth="1.5" strokeLinecap="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        {/* 제목 + 설명 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[12px] truncate" style={{ color: isSelected ? '#a5b4fc' : 'var(--text-primary)' }}>{meta.title}</div>
          {meta.description && <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{meta.description}</div>}
        </div>
        {/* 날짜 */}
        <span className="flex-shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
        {/* 액션 (hover 시) */}
        <div className="flex-shrink-0" style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          {actionButtons}
        </div>
      </div>
    );
  }

  // ══════════════ 그리드 뷰 (썸네일 전용) ══════════════
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all group"
      style={{
        background: '#0a0f1a',
        border: isSelected ? '2px solid #818cf8' : '1px solid var(--border-color)',
        boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.25)' : hovered ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
        aspectRatio: '16/10',
      }}
    >
      {/* iframe 썸네일 — 스크롤바 없음 */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a0f1a' }}>
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      )}
      <iframe
        src={docUrl}
        className="absolute top-0 left-0 border-0 pointer-events-none"
        scrolling="no"
        style={{ width: '200%', height: '200%', transformOrigin: 'top left', transform: 'scale(0.5)', opacity: iframeLoaded ? 1 : 0 }}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIframeLoaded(true)}
        title={meta.title}
      />

      {/* 하단 그라데이션 + 제목 (항상 표시) */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-3 pb-2.5 pt-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)' }}
      >
        <div className="font-semibold text-[12px] leading-tight truncate" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          {meta.title}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{dateStr}</div>
      </div>

      {/* hover 시 액션 버튼 오버레이 */}
      <div
        className="absolute top-0 right-0 p-1.5 flex items-center gap-0.5 rounded-bl-lg transition-opacity"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: hovered ? 1 : 0,
        }}
      >
        {actionButtons}
      </div>

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(99,102,241,0.9)', color: '#fff' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          편집 중
        </div>
      )}
    </div>
  );
}

// ── 챗봇 메시지 타입 ──────────────────────────────────────────────────────────
interface MiniMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  error?: string;
  toolStatus?: string; // 도구 실행 상태 표시 (예: "패치 작성 중...")
  patchResult?: { applied: number; failed: string[] };
}

// ── 미니 챗봇 패널 ───────────────────────────────────────────────────────────
function MiniChatPanel({ doc, docHtml, onDocUpdated, onClose }: {
  doc: PublishedMeta;
  docHtml: string;
  onDocUpdated: (newHtml: string) => void;
  onClose: () => void;
}) {
  useDebouncedParse();
  const schema = useSchemaStore(s => s.schema);
  const tableData = useCanvasStore(s => s.tableData);

  const [messages, setMessages] = useState<MiniMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<ChatTurn[]>([]);
  const currentHtmlRef = useRef(docHtml);

  // docHtml 변경 시 ref 업데이트
  useEffect(() => { currentHtmlRef.current = docHtml; }, [docHtml]);

  // 자동 스크롤
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 문서 선택 변경 시 히스토리 리셋
  useEffect(() => {
    setMessages([]);
    historyRef.current = [];
  }, [doc.id]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: MiniMsg = { id: genId(), role: 'user', content: text, };
    const loadingMsg: MiniMsg = { id: genId(), role: 'assistant', content: '', isLoading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    // 현재 문서 HTML을 컨텍스트로 포함
    const compressed = compressHtml(currentHtmlRef.current);
    const fullMessage =
      `[Explore 페이지 — 문서 수정 모드]\n` +
      `현재 편집 중인 문서: "${doc.title}" (ID: ${doc.id})\n\n` +
      `현재 문서 HTML (style/script 내용 제거됨):\n\`\`\`html\n${compressed}\n\`\`\`\n\n` +
      `사용자 요청: ${text}\n\n` +
      `⭐ 중요 규칙:\n` +
      `1. 반드시 patch_artifact 툴을 사용하여 변경. create_artifact 사용 금지.\n` +
      `2. find 문자열은 위 HTML에서 **그대로 복사**하세요. 줄바꿈/들여쓰기/공백을 정확히 유지!\n` +
      `3. find는 최소 20자 이상, 고유한 텍스트여야 합니다.\n` +
      `4. 새 내용 추가 시: 삽입 위치 직전/직후의 기존 태그를 find에 포함하고, replace에 새 내용을 추가하세요.\n` +
      `현재 문서의 제목은 "${doc.title}"입니다.`;

    const displayHistory: ChatTurn[] = [
      ...historyRef.current,
      { id: crypto.randomUUID(), role: 'user', content: fullMessage, timestamp: new Date() },
    ];

    try {
      const { content, toolCalls } = await sendChatMessage(
        fullMessage,
        historyRef.current,
        schema,
        tableData,
        (tc) => {
          // 도구 실행 완료 → 상태 업데이트 (⚠️ ToolCallResult는 .kind 사용)
          const toolLabel = tc.kind === 'artifact_patch' ? '✏️ 패치 적용 완료'
            : tc.kind === 'artifact' ? '📄 문서 생성 완료'
            : tc.kind === 'data_query' ? '🔍 데이터 조회 완료'
            : `🔧 ${tc.kind} 완료`;
          setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, toolStatus: toolLabel } : m));
        },
        (_, fullText) => {
          setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, content: fullText } : m));
        },
        (_html, title, charCount) => {
          // 아티팩트/패치 생성 진행 → 도구 상태 표시
          const status = charCount > 0
            ? `✏️ ${title || '작성 중'}... (${charCount.toLocaleString()}자)`
            : '✏️ 준비 중...';
          setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, toolStatus: status } : m));
        },
      );

      // patch_artifact 결과 처리 (⚠️ ToolCallResult는 .kind 속성 사용)
      let patchResult: { applied: number; failed: string[] } | undefined;
      for (const tc of toolCalls) {
        if (tc.kind === 'artifact_patch') {
          const ptc = tc as ArtifactPatchResult;
          if (ptc.patches?.length) {
            const result = applyPatches(currentHtmlRef.current, ptc.patches);
            patchResult = { applied: result.applied, failed: result.failed };
            console.log(`[MiniChat] 패치 적용: ${result.applied}개 성공, ${result.failed.length}개 실패`);
            if (result.applied > 0) {
              currentHtmlRef.current = result.html;
              onDocUpdated(result.html);
              // 서버에도 저장
              try {
                await fetch(`/api/publish/${doc.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ html: result.html }),
                });
              } catch (e) { console.warn('[MiniChat] 서버 저장 실패:', e); }
            }
          }
        }
        // create_artifact인 경우 — 전체 교체
        if (tc.kind === 'artifact') {
          const atc = tc as ArtifactResult;
          if (atc.html) {
            currentHtmlRef.current = atc.html;
            onDocUpdated(atc.html);
            patchResult = { applied: 1, failed: [] };
            console.log(`[MiniChat] 아티팩트 전체 교체: ${atc.html.length}자`);
            try {
              await fetch(`/api/publish/${doc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: atc.html }),
              });
            } catch (e) { console.warn('[MiniChat] 서버 저장 실패:', e); }
          }
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() },
        { id: crypto.randomUUID(), role: 'assistant', content, timestamp: new Date() },
      ];

      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id ? { ...m, content, isLoading: false, patchResult } : m
      ));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id ? { ...m, content: `오류: ${errMsg}`, isLoading: false, error: errMsg } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, doc, schema, tableData, onDocUpdated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // 프로그레스 바 애니메이션 CSS 주입
  useEffect(() => {
    const styleId = 'mini-chat-progress-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `@keyframes progressPulse { 0%{transform:translateX(-100%)} 50%{transform:translateX(60%)} 100%{transform:translateX(-100%)} }`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            문서 편집 AI
          </div>
          <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
            {doc.title}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="닫기">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>문서 수정 도우미</p>
              <p className="text-[11px]">이 문서에 대한 수정 요청을 입력하세요.<br/>AI가 자동으로 패치를 적용합니다.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 max-w-[280px]">
              {['표 스타일 개선', '목차 추가', '다크모드 최적화', '차트 추가'].map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-2.5 py-1 rounded-full text-[10px] hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="rounded-xl px-3 py-2 max-w-[85%] text-[12px] leading-relaxed"
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff' }
                : { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }
              }
            >
              {msg.isLoading && !msg.content ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span className="text-[11px]">{msg.toolStatus || '생각 중...'}</span>
                  </div>
                  {/* 도구 실행 중일 때 프로그레스 바 표시 */}
                  {msg.toolStatus && (
                    <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                          animation: 'progressPulse 2s ease-in-out infinite',
                          width: '60%',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>{miniMarkdown(msg.content)}</div>
                  {msg.isLoading && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block w-[2px] h-[12px] rounded-sm animate-pulse" style={{ background: 'var(--accent)' }} />
                      {msg.toolStatus && (
                        <span className="text-[10px]" style={{ color: 'var(--accent)', opacity: 0.7 }}>{msg.toolStatus}</span>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 패치 적용 결과 */}
              {msg.patchResult && (
                <div className="mt-2 pt-2 flex items-center gap-2 text-[10px]" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {msg.patchResult.applied > 0 ? (
                    <span className="flex items-center gap-1" style={{ color: '#4ade80' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {msg.patchResult.applied}개 패치 적용됨
                    </span>
                  ) : null}
                  {msg.patchResult.failed.length > 0 && (
                    <span style={{ color: '#f87171' }}>{msg.patchResult.failed.length}개 실패</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="수정 요청을 입력하세요..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[12px] leading-relaxed"
            style={{ color: 'var(--text-primary)', maxHeight: 80 }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px'; }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg transition-all flex-shrink-0"
            style={{
              background: input.trim() ? 'var(--accent)' : 'transparent',
              color: input.trim() ? '#fff' : 'var(--text-muted)',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
          </button>
        </div>
        <div className="text-[10px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>
          Enter 전송 · Shift+Enter 줄바꿈
        </div>
      </div>
    </div>
  );
}

// ── 문서 미리보기 + 편집 패널 ──────────────────────────────────────────────────
function DocPreviewPanel({ doc, docHtml }: {
  doc: PublishedMeta;
  docHtml: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const versionRef = useRef(0);

  // 문서 변경 시 버전 증가 → 깜빡임 표시
  const [flashUpdate, setFlashUpdate] = useState(false);

  // docHtml이 변경되면 iframe contentDocument에 직접 주입
  useEffect(() => {
    if (!docHtml) return;
    versionRef.current++;

    const iframe = iframeRef.current;
    if (iframe && iframeReady) {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(docHtml);
          doc.close();
          // 업데이트 플래시 효과
          setFlashUpdate(true);
          setTimeout(() => setFlashUpdate(false), 800);
        }
      } catch (e) {
        console.warn('[DocPreview] contentDocument 접근 실패, src 교체:', e);
        // fallback: blob URL로 교체
        const blob = new Blob([docHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    }
  }, [docHtml, iframeReady]);

  // 최초 iframe 로드
  const handleIframeLoad = useCallback(() => {
    setIframeReady(true);
    // 첫 로드 시 docHtml 주입
    const iframe = iframeRef.current;
    if (iframe && docHtml) {
      try {
        const d = iframe.contentDocument;
        if (d) { d.open(); d.write(docHtml); d.close(); }
      } catch { /* ignore */ }
    }
  }, [docHtml]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0f1a' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</span>
        {/* 업데이트 플래시 */}
        {flashUpdate && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium animate-pulse" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
            ✓ 업데이트됨
          </span>
        )}
        <a
          href={`/api/p/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] flex items-center gap-1 hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          새 탭
        </a>
      </div>
      {/* iframe 미리보기 */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={doc.title}
        />
        {!docHtml && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)', background: '#0a0f1a' }}>
            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Explore 메인 페이지 ────────────────────────────────────────────────────────
export default function ExplorePage() {
  useDebouncedParse();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<PublishedMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('explore_viewMode') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });

  // 선택된 문서 (편집 모드)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const selectedDoc = useMemo(() => docs.find(d => d.id === selectedDocId) ?? null, [docs, selectedDocId]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/published');
      const data = await res.json() as PublishedMeta[];
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/publish/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedDocId === id) { setSelectedDocId(null); setChatOpen(false); }
  }, [selectedDocId]);

  // 문서 선택 → HTML 로드
  const handleSelectDoc = useCallback(async (id: string) => {
    if (selectedDocId === id) {
      // 이미 선택된 문서 → 챗봇 토글
      setChatOpen(prev => !prev);
      return;
    }
    setSelectedDocId(id);
    setChatOpen(true);
    try {
      const res = await fetch(`/api/p/${id}`);
      const html = await res.text();
      setDocHtml(html);
    } catch { setDocHtml('<p>문서 로드 실패</p>'); }
  }, [selectedDocId]);

  const handleDocUpdated = useCallback(async (newHtml: string) => {
    setDocHtml(newHtml);
  }, []);

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()),
  );

  // 레이아웃: 편집 모드일 때는 좌측 문서 목록 축소 + 가운데 미리보기 + 우측 챗봇
  const isEditMode = !!selectedDoc && chatOpen;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측: 문서 목록 ── */}
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: isEditMode ? 300 : '100%', borderRight: isEditMode ? '1px solid var(--border-color)' : undefined }}
        >
          {/* 헤더 */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Explore</h1>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{docs.length}개 문서</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={fetchDocs} className="p-1.5 rounded-lg hover:opacity-80" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title="새로고침">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
                <button onClick={() => navigate('/chat')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  AI 채팅
                </button>
              </div>
            </div>
            {/* 검색 + 뷰 모드 토글 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="문서 검색..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              {/* 그리드/리스트 토글 */}
              {!isEditMode && (
                <div className="flex-shrink-0 flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => { setViewMode('grid'); try { localStorage.setItem('explore_viewMode', 'grid'); } catch {} }}
                    className="p-1.5 transition-colors"
                    style={{ background: viewMode === 'grid' ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)', color: viewMode === 'grid' ? '#818cf8' : 'var(--text-muted)' }}
                    title="그리드 뷰"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => { setViewMode('list'); try { localStorage.setItem('explore_viewMode', 'list'); } catch {} }}
                    className="p-1.5 transition-colors"
                    style={{ background: viewMode === 'list' ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)', color: viewMode === 'list' ? '#818cf8' : 'var(--text-muted)', borderLeft: '1px solid var(--border-color)' }}
                    title="리스트 뷰"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 문서 목록 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: 'var(--text-muted)' }}>
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-[12px]">문서 불러오는 중...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: 'var(--text-muted)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p className="text-[12px]">{search ? '검색 결과 없음' : '문서 없음'}</p>
              </div>
            ) : viewMode === 'list' && !isEditMode ? (
              /* ── 리스트 뷰 ── */
              <div className="flex flex-col gap-0.5">
                {filtered.map(doc => (
                  <DocCard
                    key={doc.id}
                    meta={doc}
                    isSelected={doc.id === selectedDocId}
                    onSelect={() => handleSelectDoc(doc.id)}
                    onDelete={handleDelete}
                    viewMode="list"
                  />
                ))}
              </div>
            ) : (
              /* ── 그리드 뷰 (썸네일) ── */
              <div
                className="gap-3"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isEditMode ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {filtered.map(doc => (
                  <DocCard
                    key={doc.id}
                    meta={doc}
                    isSelected={doc.id === selectedDocId}
                    onSelect={() => handleSelectDoc(doc.id)}
                    onDelete={handleDelete}
                    viewMode={isEditMode ? 'list' : 'grid'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 가운데: 문서 미리보기 ── */}
        {isEditMode && selectedDoc && (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ borderRight: '1px solid var(--border-color)' }}>
            <DocPreviewPanel doc={selectedDoc} docHtml={docHtml} />
          </div>
        )}

        {/* ── 우측: 챗봇 패널 ── */}
        {isEditMode && selectedDoc && (
          <div
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ width: 380, background: 'var(--bg-primary)' }}
          >
            <MiniChatPanel
              doc={selectedDoc}
              docHtml={docHtml}
              onDocUpdated={handleDocUpdated}
              onClose={() => { setChatOpen(false); setSelectedDocId(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
