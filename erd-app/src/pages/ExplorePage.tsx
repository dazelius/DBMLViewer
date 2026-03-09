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
  folderId?: string | null;
}

interface FolderMeta {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

type FolderNode = FolderMeta & { children: FolderNode[]; docCount: number; totalCount: number };

function buildFolderTree(folders: FolderMeta[], docs: PublishedMeta[]): FolderNode[] {
  const countMap = new Map<string, number>();
  for (const d of docs) { if (d.folderId) countMap.set(d.folderId, (countMap.get(d.folderId) ?? 0) + 1); }

  const nodeMap = new Map<string, FolderNode>();
  for (const f of folders) {
    nodeMap.set(f.id, { ...f, children: [], docCount: countMap.get(f.id) ?? 0, totalCount: 0 });
  }
  const roots: FolderNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // totalCount = self + descendants
  function calcTotal(node: FolderNode): number {
    node.totalCount = node.docCount + node.children.reduce((s, c) => s + calcTotal(c), 0);
    return node.totalCount;
  }
  roots.forEach(calcTotal);
  return roots;
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
function DocCard({ meta, isSelected, onSelect, onDelete, onMove, folders, viewMode }: {
  meta: PublishedMeta;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
  folders: FolderMeta[];
  viewMode: 'grid' | 'list';
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [dragging, setDragging] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef(false);

  // ── 우클릭 컨텍스트 메뉴 ──
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [ctxMoveOpen, setCtxMoveOpen] = useState(false);
  const [ctxDeleteConfirm, setCtxDeleteConfirm] = useState(false);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 화면 경계 고려하여 위치 조정
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setCtxMenu({ x, y });
    setCtxMoveOpen(false);
    setCtxDeleteConfirm(false);
  };

  // 외부 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
        setCtxMoveOpen(false);
        setCtxDeleteConfirm(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCtxMenu(null); setCtxMoveOpen(false); setCtxDeleteConfirm(false); }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', escHandler); };
  }, [ctxMenu]);

  // 외부 클릭 시 move 메뉴 닫기
  useEffect(() => {
    if (!showMoveMenu) return;
    const handler = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) setShowMoveMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoveMenu]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', meta.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
  };
  const handleDragEnd = () => setDragging(false);

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

  // ── 폴더 이동 드롭다운 ──
  const moveMenu = folders.length > 0 && (
    <div ref={moveMenuRef} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setShowMoveMenu(v => !v); }}
        title="폴더로 이동"
        className="p-1.5 rounded hover:opacity-80 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      {showMoveMenu && (
        <div
          className="absolute z-50 right-0 top-full mt-1 py-1 rounded-lg text-[11px] min-w-[160px] max-h-[200px] overflow-y-auto"
          style={{ background: '#1e293b', border: '1px solid #334155', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          <button
            className="w-full px-3 py-1.5 text-left hover:bg-white/5 flex items-center gap-2"
            style={{ color: meta.folderId == null ? '#818cf8' : 'var(--text-secondary)' }}
            onClick={() => { onMove(meta.id, null); setShowMoveMenu(false); }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            루트 (미분류)
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              className="w-full px-3 py-1.5 text-left hover:bg-white/5 flex items-center gap-2"
              style={{ color: meta.folderId === f.id ? '#818cf8' : 'var(--text-secondary)' }}
              onClick={() => { onMove(meta.id, f.id); setShowMoveMenu(false); }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── 액션 버튼 ──
  const actionButtons = (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      {moveMenu}
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

  // ── 우클릭 컨텍스트 메뉴 포탈 ──
  const contextMenuPortal = ctxMenu && (
    <div
      ref={ctxMenuRef}
      className="fixed z-[9999]"
      style={{
        left: ctxMenu.x,
        top: ctxMenu.y,
      }}
    >
      <div
        className="py-1.5 rounded-xl min-w-[180px] overflow-hidden"
        style={{
          background: '#1a2035',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* 문서 제목 (비활성 헤더) */}
        <div className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="text-[10px] truncate font-medium" style={{ color: 'var(--text-muted)', maxWidth: 140 }}>{meta.title}</span>
        </div>

        {/* 열기 */}
        <button
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] hover:bg-white/[0.06] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={(e) => { e.stopPropagation(); setCtxMenu(null); onSelect(); }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          열기 / 편집
        </button>

        {/* URL 복사 */}
        <button
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] hover:bg-white/[0.06] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(`${window.location.origin}/api/p/${meta.id}`);
            setCtxMenu(null);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          URL 복사
        </button>

        {/* 새 탭에서 열기 */}
        <button
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] hover:bg-white/[0.06] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/api/p/${meta.id}`, '_blank');
            setCtxMenu(null);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          새 탭에서 열기
        </button>

        {/* 폴더 이동 (서브메뉴) */}
        {folders.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />
            <button
              className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] hover:bg-white/[0.06] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onClick={(e) => { e.stopPropagation(); setCtxMoveOpen(v => !v); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="flex-1">폴더로 이동</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: ctxMoveOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            {ctxMoveOpen && (
              <div className="mx-2 mb-1 rounded-lg overflow-hidden max-h-[160px] overflow-y-auto"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[10px] hover:bg-white/[0.06] transition-colors"
                  style={{ color: meta.folderId == null ? '#818cf8' : 'var(--text-muted)' }}
                  onClick={(e) => { e.stopPropagation(); onMove(meta.id, null); setCtxMenu(null); }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  루트 (미분류)
                </button>
                {folders.map(f => (
                  <button
                    key={f.id}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[10px] hover:bg-white/[0.06] transition-colors"
                    style={{ color: meta.folderId === f.id ? '#818cf8' : 'var(--text-muted)' }}
                    onClick={(e) => { e.stopPropagation(); onMove(meta.id, f.id); setCtxMenu(null); }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* 구분선 + 삭제 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />
        {!ctxDeleteConfirm ? (
          <button
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] hover:bg-red-500/10 transition-colors"
            style={{ color: '#f87171' }}
            onClick={(e) => { e.stopPropagation(); setCtxDeleteConfirm(true); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
            </svg>
            삭제
          </button>
        ) : (
          <button
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[11px] transition-colors"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600 }}
            onClick={(e) => { e.stopPropagation(); onDelete(meta.id); setCtxMenu(null); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
            </svg>
            ⚠️ 정말 삭제하시겠습니까?
          </button>
        )}
      </div>
    </div>
  );

  // ══════════════ 리스트 뷰 ══════════════
  if (viewMode === 'list') {
    return (
      <>
      {contextMenuPortal}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
        style={{
          background: isSelected ? 'rgba(99,102,241,0.12)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
          opacity: dragging ? 0.4 : 1,
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
      </>
    );
  }

  // ══════════════ 그리드 뷰 (썸네일 전용) ══════════════
  return (
    <>
    {contextMenuPortal}
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all group"
      style={{
        background: '#0a0f1a',
        border: isSelected ? '2px solid #818cf8' : '1px solid var(--border-color)',
        boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.25)' : hovered ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
        opacity: dragging ? 0.4 : 1,
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
    </>
  );
}

// ── 폴더 트리 아이템 ──────────────────────────────────────────────────────────
function FolderTreeItem({
  node,
  depth,
  selectedId,
  dragOverId,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  onDrop,
  onDragEnter,
  onDragLeave,
}: {
  node: FolderNode;
  depth: number;
  selectedId: string | null;
  dragOverId: string | null;
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDrop: (docId: string, folderId: string) => void;
  onDragEnter: (folderId: string) => void;
  onDragLeave: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const ctxRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedId === node.id;
  const isDragOver = dragOverId === node.id;

  useEffect(() => {
    if (!showCtx) return;
    const h = (e: MouseEvent) => { if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setShowCtx(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showCtx]);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);

  const commitRename = () => {
    const v = renameVal.trim();
    if (v && v !== node.name) onRename(node.id, v);
    else setRenameVal(node.name);
    setRenaming(false);
  };

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(node.id)}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragEnter(node.id); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) onDragLeave(); }}
        onDrop={e => { e.preventDefault(); const docId = e.dataTransfer.getData('text/plain'); if (docId) onDrop(docId, node.id); onDragLeave(); }}
        className="flex items-center gap-1 pr-1 py-1 rounded-lg cursor-pointer select-none group"
        style={{
          paddingLeft: 8 + depth * 14,
          background: isDragOver ? 'rgba(99,102,241,0.25)' : isSelected ? 'rgba(99,102,241,0.15)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: isDragOver ? '1px dashed rgba(129,140,248,0.7)' : '1px solid transparent',
          transition: 'background 0.1s, border 0.1s',
        }}
      >
        {/* 확장/축소 chevron */}
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded"
          style={{ color: 'var(--text-muted)', visibility: node.children.length > 0 ? 'visible' : 'hidden' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        {/* 폴더 아이콘 */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#818cf8' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" className="flex-shrink-0">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        {/* 이름 */}
        {renaming ? (
          <input
            ref={renameRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent outline-none text-[12px] border-b"
            style={{ color: 'var(--text-primary)', borderColor: '#818cf8' }}
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-[12px]" style={{ color: isSelected ? '#a5b4fc' : 'var(--text-secondary)' }}>
            {node.name}
          </span>
        )}
        {/* 문서 수 */}
        {node.totalCount > 0 && !hovered && (
          <span className="flex-shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{node.totalCount}</span>
        )}
        {/* 컨텍스트 메뉴 버튼 */}
        {hovered && !renaming && (
          <div ref={ctxRef} className="flex-shrink-0 relative">
            <button
              onClick={e => { e.stopPropagation(); setShowCtx(v => !v); }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            {showCtx && (
              <div className="absolute z-50 right-0 top-full mt-1 py-1 rounded-lg text-[11px] w-36"
                style={{ background: '#1e293b', border: '1px solid #334155', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <button className="w-full px-3 py-1.5 text-left hover:bg-white/5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}
                  onClick={e => { e.stopPropagation(); setShowCtx(false); onCreateChild(node.id); }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  하위 폴더 만들기
                </button>
                <button className="w-full px-3 py-1.5 text-left hover:bg-white/5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}
                  onClick={e => { e.stopPropagation(); setShowCtx(false); setRenaming(true); }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  이름 변경
                </button>
                <div style={{ borderTop: '1px solid #334155', margin: '2px 0' }} />
                <button className="w-full px-3 py-1.5 text-left hover:bg-white/5 flex items-center gap-2" style={{ color: '#f87171' }}
                  onClick={e => { e.stopPropagation(); setShowCtx(false); onDelete(node.id); }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  폴더 삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* 하위 폴더 재귀 */}
      {expanded && node.children.map(child => (
        <FolderTreeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          dragOverId={dragOverId}
          onSelect={onSelect}
          onCreateChild={onCreateChild}
          onRename={onRename}
          onDelete={onDelete}
          onDrop={onDrop}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        />
      ))}
    </div>
  );
}

// ── 폴더 사이드바 ─────────────────────────────────────────────────────────────
function FolderSidebar({
  folders,
  docs,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMove,
}: {
  folders: FolderMeta[];
  docs: PublishedMeta[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
}) {
  const tree = useMemo(() => buildFolderTree(folders, docs), [folders, docs]);
  const allCount = docs.length;
  const unfiledCount = docs.filter(d => !d.folderId).length;

  // 드래그 중 강조 표시할 대상 ID
  // '__root__' = 루트(미분류)로 이동, 폴더 id = 해당 폴더로 이동
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDrop = (docId: string, folderId: string | null) => {
    onMove(docId, folderId);
    setDragOverId(null);
  };

  const rootDragOver = dragOverId === '__root__';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>폴더</span>
        <button
          onClick={() => onCreateFolder(null)}
          title="루트 폴더 만들기"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* 트리 */}
      <div className="flex-1 overflow-y-auto py-1 px-1">
        {/* All — 드롭하면 루트(미분류)로 이동 */}
        <div
          onClick={() => onSelectFolder(null)}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverId('__root__'); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null); }}
          onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) handleDrop(id, null); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none"
          style={{
            background: rootDragOver ? 'rgba(99,102,241,0.25)' : selectedFolderId === null ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: rootDragOver ? '1px dashed rgba(129,140,248,0.7)' : '1px solid transparent',
            color: selectedFolderId === null ? '#a5b4fc' : 'var(--text-secondary)',
            transition: 'background 0.1s, border 0.1s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span className="flex-1 text-[12px] font-medium">전체 문서</span>
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{allCount}</span>
        </div>

        {/* Unfiled */}
        {unfiledCount > 0 && (
          <div
            onClick={() => onSelectFolder('__unfiled__')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none"
            style={{
              background: selectedFolderId === '__unfiled__' ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: selectedFolderId === '__unfiled__' ? '#a5b4fc' : 'var(--text-secondary)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="flex-1 text-[12px]">미분류</span>
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{unfiledCount}</span>
          </div>
        )}

        {/* 구분선 (폴더 있을 때) */}
        {tree.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 8px' }} />
        )}

        {/* 폴더 트리 */}
        {tree.map(node => (
          <FolderTreeItem
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedFolderId}
            dragOverId={dragOverId}
            onSelect={onSelectFolder}
            onCreateChild={onCreateFolder}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
            onDrop={(docId, folderId) => handleDrop(docId, folderId)}
            onDragEnter={setDragOverId}
            onDragLeave={() => setDragOverId(null)}
          />
        ))}

        {tree.length === 0 && folders.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>폴더 없음</p>
            <button
              onClick={() => onCreateFolder(null)}
              className="mt-2 text-[11px] hover:underline"
              style={{ color: '#818cf8' }}
            >
              + 폴더 만들기
            </button>
          </div>
        )}
      </div>
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
      { id: genId(), role: 'user', content: fullMessage, timestamp: new Date() },
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
        { id: genId(), role: 'user', content: text, timestamp: new Date() },
        { id: genId(), role: 'assistant', content, timestamp: new Date() },
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
  const [folders, setFolders] = useState<FolderMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // null = 전체, '__unfiled__' = 미분류, 'f_...' = 특정 폴더
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('explore_viewMode') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 선택된 문서 (편집 모드)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const selectedDoc = useMemo(() => docs.find(d => d.id === selectedDocId) ?? null, [docs, selectedDocId]);

  // ── 데이터 로드 ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([fetch('/api/published'), fetch('/api/folders')]);
      const docsData = await docsRes.json() as PublishedMeta[];
      const foldersData = await foldersRes.json() as FolderMeta[];
      setDocs(Array.isArray(docsData) ? docsData : []);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch { setDocs([]); setFolders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── 문서 삭제 ──
  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/publish/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedDocId === id) { setSelectedDocId(null); setChatOpen(false); }
  }, [selectedDocId]);

  // ── 문서 폴더 이동 ──
  const handleMove = useCallback(async (docId: string, folderId: string | null) => {
    await fetch(`/api/publish/${docId}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, folderId } : d));
  }, []);

  // ── 문서 선택 → HTML 로드 ──
  const handleSelectDoc = useCallback(async (id: string) => {
    if (selectedDocId === id) { setChatOpen(prev => !prev); return; }
    setSelectedDocId(id);
    setChatOpen(true);
    try {
      const res = await fetch(`/api/p/${id}`);
      const html = await res.text();
      setDocHtml(html);
    } catch { setDocHtml('<p>문서 로드 실패</p>'); }
  }, [selectedDocId]);

  const handleDocUpdated = useCallback(async (newHtml: string) => { setDocHtml(newHtml); }, []);

  // ── 폴더 CRUD ──
  const handleCreateFolder = useCallback(async (parentId: string | null) => {
    const name = prompt('폴더 이름을 입력하세요', '새 폴더');
    if (!name?.trim()) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), parentId }),
    });
    const folder = await res.json() as FolderMeta;
    setFolders(prev => [...prev, folder]);
  }, []);

  const handleRenameFolder = useCallback(async (id: string, name: string) => {
    await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }, []);

  const handleDeleteFolder = useCallback(async (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    if (!confirm(`"${folder.name}" 폴더를 삭제할까요?\n안에 있는 문서는 상위 폴더로 이동됩니다.`)) return;
    await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    // 로컬 상태 동기화
    setFolders(prev => prev
      .map(f => f.parentId === id ? { ...f, parentId: folder.parentId } : f)
      .filter(f => f.id !== id));
    setDocs(prev => prev.map(d => d.folderId === id ? { ...d, folderId: folder.parentId } : d));
    if (selectedFolderId === id) setSelectedFolderId(null);
  }, [folders, selectedFolderId]);

  // ── 필터링 ──
  // 폴더 선택 시 하위 폴더 포함 여부 (특정 폴더 선택 시 해당 폴더만 표시)
  const filtered = useMemo(() => {
    let result = docs;
    if (selectedFolderId === '__unfiled__') {
      result = result.filter(d => !d.folderId);
    } else if (selectedFolderId !== null) {
      result = result.filter(d => d.folderId === selectedFolderId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return result;
  }, [docs, selectedFolderId, search]);

  // 현재 폴더 이름
  const currentFolderName = useMemo(() => {
    if (selectedFolderId === null) return null;
    if (selectedFolderId === '__unfiled__') return '미분류';
    return folders.find(f => f.id === selectedFolderId)?.name ?? '폴더';
  }, [selectedFolderId, folders]);

  // 레이아웃: 편집 모드일 때는 좌측 문서 목록 축소 + 가운데 미리보기 + 우측 챗봇
  const isEditMode = !!selectedDoc && chatOpen;
  // 편집 모드일 때 사이드바 숨기기
  const showSidebar = sidebarOpen && !isEditMode;

  // 모든 폴더 평탄화 (DocCard move 드롭다운용)
  const allFolders = useMemo(() => folders, [folders]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 폴더 사이드바 ── */}
        {showSidebar && (
          <div className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200"
            style={{ width: 200, borderRight: '1px solid var(--border-color)' }}>
            <FolderSidebar
              folders={folders}
              docs={docs}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onMove={handleMove}
            />
          </div>
        )}

        {/* ── 가운데: 문서 목록 ── */}
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: isEditMode ? 300 : '100%', borderRight: isEditMode ? '1px solid var(--border-color)' : undefined }}
        >
          {/* 헤더 */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {/* 사이드바 토글 (편집 모드 아닐 때만) */}
                {!isEditMode && (
                  <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="p-1.5 rounded-lg hover:opacity-80"
                    style={{ background: sidebarOpen ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: sidebarOpen ? '#818cf8' : 'var(--text-muted)' }}
                    title={sidebarOpen ? '폴더 숨기기' : '폴더 보기'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                )}
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {currentFolderName ?? 'Explore'}
                  </h1>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{filtered.length}개 문서</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={fetchAll} className="p-1.5 rounded-lg hover:opacity-80" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title="새로고침">
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
                    onMove={handleMove}
                    folders={allFolders}
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
                    onMove={handleMove}
                    folders={allFolders}
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
