import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  type ArtifactResult,
  type ArtifactPatchResult,
  type CharacterProfileResult,
  type CodeSearchResult,
  type CodeFileResult,
  type CodeGuideResult,
  type DiffFile,
  type DiffHunk,
} from '../core/ai/chatEngine.ts';
import { executeDataSQL, type TableDataMap } from '../core/query/schemaQueryEngine.ts';
import type { ParsedSchema } from '../core/schema/types.ts';

// ── HTML 압축 (수정 요청 시 스타일/스크립트 제거 → 입력 토큰 절약) ─────────────
function compressHtmlForEdit(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<!-- styles removed -->')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<!-- scripts removed -->')
    .replace(/<!--(?!styles removed|scripts removed)[\s\S]*?-->/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── patch 적용: find/replace 순서대로 적용 ──────────────────────────────────
function applyPatches(originalHtml: string, patches: { find: string; replace: string }[]): { html: string; applied: number; failed: string[] } {
  let html = originalHtml;
  let applied = 0;
  const failed: string[] = [];
  for (const patch of patches) {
    if (!patch.find) continue;
    if (html.includes(patch.find)) {
      html = html.split(patch.find).join(patch.replace); // 모든 occurrences 교체
      applied++;
    } else {
      // 공백 정규화 후 재시도 (Claude가 개행/공백을 약간 다르게 반환할 수 있음)
      const normalizedHtml = html.replace(/\s+/g, ' ');
      const normalizedFind = patch.find.replace(/\s+/g, ' ');
      if (normalizedHtml.includes(normalizedFind)) {
        html = normalizedHtml.split(normalizedFind).join(patch.replace.replace(/\s+/g, ' '));
        applied++;
      } else {
        failed.push(patch.find.slice(0, 60) + (patch.find.length > 60 ? '…' : ''));
      }
    }
  }
  return { html, applied, failed };
}

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

// ── 아티팩트 임베드 시스템 ────────────────────────────────────────────────────
// 아티팩트 HTML에서 특수 태그를 실제 데이터로 교체
// 사용법: <div data-embed="schema" data-table="Character"></div>
//        <div data-embed="query" data-sql="SELECT * FROM Skill LIMIT 10"></div>
//        <div data-embed="relations" data-table="Character"></div>

const EMBED_CSS = `
.embed-card { background:#1a2035; border:1px solid #2d3f5e; border-radius:8px; padding:12px 14px; margin:10px 0; overflow:hidden; }
.embed-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.embed-icon { font-size:14px; }
.embed-title { font-weight:700; color:#e2e8f0; font-size:13px; }
.embed-meta { color:#64748b; font-size:11px; }
.embed-subtitle { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin:8px 0 4px; }
.embed-sql { font-size:10px; color:#818cf8; background:rgba(99,102,241,.12); border-radius:4px; padding:2px 6px; font-family:monospace; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.embed-table { width:100%; border-collapse:collapse; font-size:11px; }
.embed-table th { background:#0f1a2e; color:#94a3b8; font-weight:600; padding:5px 8px; text-align:left; border-bottom:1px solid #2d3f5e; }
.embed-table td { padding:4px 8px; border-bottom:1px solid rgba(45,63,94,.5); color:#cbd5e1; }
.embed-table tr:last-child td { border-bottom:none; }
.badge-pk { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:700; background:rgba(99,102,241,.25); color:#818cf8; margin-right:2px; }
.badge-fk { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:700; background:rgba(234,179,8,.15); color:#fbbf24; margin-right:2px; }
.badge-nn { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:700; background:rgba(100,116,139,.2); color:#94a3b8; margin-right:2px; }
.embed-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:6px; padding:8px 12px; color:#ef4444; font-size:12px; margin:6px 0; }
.embed-empty { background:rgba(100,116,139,.1); border-radius:6px; padding:8px 12px; color:#64748b; font-size:12px; margin:6px 0; }
.mermaid { margin:6px 0; text-align:center; overflow:hidden; }
.mermaid svg { max-width:100% !important; height:auto !important; }
`;

/** Mermaid.js CDN 초기화 스크립트 (아티팩트 HTML 템플릿에 주입) */
const MERMAID_INIT_SCRIPT = '<script type="module">'
  + 'import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";'
  + 'mermaid.initialize({startOnLoad:true,theme:"dark",themeVariables:{'
  + 'primaryColor:"#1e293b",primaryTextColor:"#e2e8f0",primaryBorderColor:"#4f46e5",'
  + 'lineColor:"#6366f1",secondaryColor:"#0f172a",background:"#0f1117",'
  + 'mainBkg:"#1e293b",nodeBorder:"#4f46e5",clusterBkg:"#0f172a",'
  + 'titleColor:"#e2e8f0",edgeLabelBackground:"#0f172a",fontFamily:"Segoe UI,sans-serif"'
  + '}});'
  + '</' + 'script>';

/** 스키마 테이블 embed → HTML */
function renderSchemaEmbedHtml(tableName: string, schema: ParsedSchema | null): string {
  if (!schema) return `<div class="embed-error">스키마 없음</div>`;
  const table = schema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
  if (!table) return `<div class="embed-error">테이블 '${tableName}'을 찾을 수 없습니다</div>`;
  const nameById = new Map(schema.tables.map(t => [t.id, t.name]));

  const colRows = table.columns.map(c => {
    const badges = [
      c.isPrimaryKey ? '<span class="badge-pk">PK</span>' : '',
      c.isForeignKey ? '<span class="badge-fk">FK</span>' : '',
      c.isNotNull && !c.isPrimaryKey ? '<span class="badge-nn">NN</span>' : '',
    ].filter(Boolean).join('');
    return `<tr><td>${c.name}</td><td style="color:#94a3b8">${c.type}</td><td>${badges}</td><td style="color:#64748b;font-size:10px">${c.note ?? ''}</td></tr>`;
  }).join('');

  const refs = schema.refs.filter(r => r.fromTable === table.id || r.toTable === table.id);
  const relRows = refs.map(r => {
    const isFrom = r.fromTable === table.id;
    const other = nameById.get(isFrom ? r.toTable : r.fromTable) ?? '?';
    const dir = isFrom ? '→' : '←';
    const cols = isFrom ? `${r.fromColumns[0]} → ${r.toColumns[0]}` : `${r.toColumns[0]} ← ${r.fromColumns[0]}`;
    return `<tr><td style="color:#818cf8">${dir}</td><td style="color:#e2e8f0">${other}</td><td style="color:#94a3b8">${cols}</td><td style="color:#64748b">${r.type}</td></tr>`;
  }).join('');

  return `<div class="embed-card embed-schema">
<div class="embed-header"><span class="embed-icon">🗄️</span><span class="embed-title">${table.name}</span><span class="embed-meta">${table.groupName ?? ''} · ${table.columns.length}컬럼${refs.length > 0 ? ` · 관계 ${refs.length}개` : ''}</span></div>
<table class="embed-table"><thead><tr><th>컬럼</th><th>타입</th><th>속성</th><th>설명</th></tr></thead><tbody>${colRows}</tbody></table>
${refs.length > 0 ? `<div class="embed-subtitle">관계 (FK)</div><table class="embed-table"><thead><tr><th>방향</th><th>테이블</th><th>컬럼</th><th>타입</th></tr></thead><tbody>${relRows}</tbody></table>` : ''}
</div>`;
}

/** SQL 쿼리 embed → HTML */
/** SQL 잘림 감지 및 복구 시도 */
function tryRepairSQL(sql: string): { sql: string; repaired: boolean } {
  const trimmed = sql.trim();

  // ── Case 1: "... `#col` AS" 또는 "... colName AS" — alias 자동 추론 ──────────
  const asTrailing = trimmed.match(/\s+AS\s*$/i);
  if (asTrailing) {
    const beforeAs = trimmed.slice(0, asTrailing.index).trim();
    // 직전 컬럼 표현식 추출: 백틱, 일반 식별자
    const lastCol = beforeAs.match(/`([^`]+)`\s*$|(?:^|[\s,(])(\w+)\s*$/);
    if (lastCol) {
      const raw = (lastCol[1] || lastCol[2]) ?? '';
      // #foo → foo, 특수문자 → _로 치환
      const alias = raw.replace(/^#/, '').replace(/[^a-zA-Z0-9_]/g, '_') || 'col';
      return { sql: trimmed + ' ' + alias, repaired: true };
    }
    // alias 추론 불가 → AS 제거
    const withoutAs = beforeAs.replace(/,\s*$/, '').trim();
    if (withoutAs.length > 0) return { sql: withoutAs, repaired: true };
  }

  // ── Case 2: SELECT 컬럼 목록 끝이 쉼표로 끝남 ("SELECT id, name,") ───────────
  const trailingComma = trimmed.match(/,\s*$/);
  if (trailingComma) {
    const repaired = trimmed.slice(0, trailingComma.index).trim();
    if (repaired.length > 0) return { sql: repaired, repaired: true };
  }

  // ── Case 3: 기타 끝단 SQL 키워드 ─────────────────────────────────────────────
  const TRAILING_KW = /\b(WHERE|FROM|AND|OR|ON|SET|HAVING|ORDER\s+BY|GROUP\s+BY|JOIN|LEFT|RIGHT|INNER|OUTER|LIMIT|OFFSET|UNION|SELECT|INSERT|UPDATE|DELETE|INTO|VALUES|BY)\s*$/i;
  const kwMatch = trimmed.match(TRAILING_KW);
  if (kwMatch) {
    const repaired = trimmed.slice(0, kwMatch.index).trim().replace(/,\s*$/, '');
    if (repaired.length > 0) return { sql: repaired, repaired: true };
  }

  return { sql: trimmed, repaired: false };
}

function renderQueryEmbedHtml(sql: string, tableData: TableDataMap, schema: ParsedSchema | null): string {
  try {
    // HTML 엔티티 복원
    const decoded = sql
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&#34;/g, '"')
      .trim();

    let finalSql = decoded;
    let repairNote = '';

    // SQL 실행 시도
    let result = executeDataSQL(finalSql, tableData, schema ?? undefined);

    // 첫 번째 실패 시 복구 시도 (1단계)
    if (result.error) {
      const { sql: repairedSql, repaired } = tryRepairSQL(finalSql);
      if (repaired && repairedSql !== finalSql) {
        const retryResult = executeDataSQL(repairedSql, tableData, schema ?? undefined);
        if (!retryResult.error) {
          result = retryResult;
          finalSql = repairedSql;
          repairNote = ` <span style="color:#f59e0b;font-size:9px">(자동 복구됨)</span>`;
        } else {
          // 복구 후에도 실패 → 2단계: 반복 복구 (중첩 잘림 대응)
          const { sql: sql2, repaired: r2 } = tryRepairSQL(repairedSql);
          if (r2 && sql2 !== repairedSql) {
            const retry2 = executeDataSQL(sql2, tableData, schema ?? undefined);
            if (!retry2.error) {
              result = retry2;
              finalSql = sql2;
              repairNote = ` <span style="color:#f59e0b;font-size:9px">(자동 복구됨)</span>`;
            }
          }
        }
      }
    }

    if (result.error) {
      const isTruncated = /got 'EOF'|Unexpected end|unexpected end|Expecting 'LITERAL'.*got 'EOF'/i.test(result.error);
      const msg = isTruncated
        ? `SQL이 불완전합니다 (응답 생성 중 잘린 것 같습니다)`
        : `쿼리 오류: ${result.error}`;
      return `<div class="embed-error">${msg}<br><code style="font-size:10px;opacity:0.7">${finalSql}</code></div>`;
    }
    if (result.rowCount === 0) return `<div class="embed-empty">결과 없음 — <code style="font-size:10px">${finalSql}</code></div>`;

    const headers = result.columns.map(c => `<th>${c}</th>`).join('');
    const rows = result.rows.map(row =>
      `<tr>${result.columns.map(c => `<td>${String((row as Record<string, unknown>)[c] ?? '')}</td>`).join('')}</tr>`
    ).join('');
    return `<div class="embed-card embed-query">
<div class="embed-header"><span class="embed-icon">📊</span><span class="embed-meta">${result.rowCount}행${repairNote}</span><span class="embed-sql">${finalSql}</span></div>
<div style="overflow-x:auto"><table class="embed-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>
</div>`;
  } catch (e) {
    return `<div class="embed-error">오류: ${String(e)}</div>`;
  }
}

/** 관계도 embed → HTML (특정 테이블의 FK 관계망) */
function renderRelationsEmbedHtml(tableName: string, schema: ParsedSchema | null): string {
  if (!schema) return `<div class="embed-error">스키마 없음</div>`;
  const table = schema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
  if (!table) return `<div class="embed-error">테이블 '${tableName}'을 찾을 수 없습니다</div>`;
  const nameById = new Map(schema.tables.map(t => [t.id, t.name]));

  const outRefs = schema.refs.filter(r => r.fromTable === table.id);
  const inRefs  = schema.refs.filter(r => r.toTable === table.id);

  const outRows = outRefs.map(r => {
    const to = nameById.get(r.toTable) ?? r.toTable;
    return `<tr><td style="color:#818cf8">→ ${to}</td><td style="color:#94a3b8">${r.fromColumns[0]}</td><td style="color:#64748b">${r.type}</td></tr>`;
  }).join('');
  const inRows = inRefs.map(r => {
    const from = nameById.get(r.fromTable) ?? r.fromTable;
    return `<tr><td style="color:#34d399">← ${from}</td><td style="color:#94a3b8">${r.fromColumns[0]}</td><td style="color:#64748b">${r.type}</td></tr>`;
  }).join('');

  return `<div class="embed-card embed-relations">
<div class="embed-header"><span class="embed-icon">🔗</span><span class="embed-title">${table.name} 관계도</span><span class="embed-meta">출력 ${outRefs.length}개 · 입력 ${inRefs.length}개</span></div>
${outRows || inRows ? `<table class="embed-table"><thead><tr><th>연결 테이블</th><th>FK 컬럼</th><th>타입</th></tr></thead><tbody>${outRows}${inRows}</tbody></table>` : '<div class="embed-empty">관계 없음</div>'}
</div>`;
}

/** 관계 그래프 embed → Mermaid LR 다이어그램 HTML */
function renderGraphEmbedHtml(tableNamesRaw: string, schema: ParsedSchema | null): string {
  if (!schema) return `<div class="embed-error">스키마 없음</div>`;

  const requested = tableNamesRaw.split(',').map(n => n.trim()).filter(Boolean);
  const nameById = new Map(schema.tables.map(t => [t.id, t.name]));
  const idByName = new Map(schema.tables.map(t => [t.name.toLowerCase(), t.id]));

  // 요청 테이블 + 직접 FK 연결 테이블 수집
  const includedIds = new Set<string>();
  const centerIds = new Set<string>();
  for (const name of requested) {
    const id = idByName.get(name.toLowerCase());
    if (!id) continue;
    centerIds.add(id);
    includedIds.add(id);
    schema.refs.forEach(r => {
      if (r.fromTable === id) includedIds.add(r.toTable);
      if (r.toTable === id) includedIds.add(r.fromTable);
    });
  }

  if (includedIds.size === 0)
    return `<div class="embed-error">테이블을 찾을 수 없습니다: ${tableNamesRaw}</div>`;

  // 최대 25개 테이블로 제한 (그래프 과부하 방지)
  const limitedIds = [...includedIds].slice(0, 25);
  const limitedSet = new Set(limitedIds);

  // 노드 이름 안전 처리 (Mermaid 식별자 특수문자 회피)
  const safeId = (name: string) => name.replace(/[^a-zA-Z0-9_가-힣]/g, '_');

  const lines: string[] = ['graph LR'];

  // 노드 정의
  for (const id of limitedIds) {
    const name = nameById.get(id) ?? id;
    const sid = safeId(name);
    if (centerIds.has(id)) {
      lines.push(`  ${sid}["<b>${name}</b>"]:::center`);
    } else {
      lines.push(`  ${sid}["${name}"]`);
    }
  }

  // 스타일 클래스
  lines.push('  classDef center fill:#312e81,stroke:#6366f1,color:#e2e8f0,font-weight:bold');

  // 엣지 정의 (중복 방지)
  const addedEdges = new Set<string>();
  for (const ref of schema.refs) {
    if (!limitedSet.has(ref.fromTable) || !limitedSet.has(ref.toTable)) continue;
    const fromName = nameById.get(ref.fromTable) ?? ref.fromTable;
    const toName   = nameById.get(ref.toTable)   ?? ref.toTable;
    const key = `${fromName}->${toName}`;
    if (addedEdges.has(key)) continue;
    addedEdges.add(key);
    const fkCol = ref.fromColumns[0] ?? '';
    const label = fkCol ? `|"${fkCol}"|` : '';
    lines.push(`  ${safeId(fromName)} -->${label} ${safeId(toName)}`);
  }

  const mermaidCode = lines.join('\n');
  const tableCount = limitedIds.length;
  const edgeCount = addedEdges.size;
  const truncated = includedIds.size > 25 ? ` (${includedIds.size - 25}개 생략)` : '';

  return `<div class="embed-card embed-graph">
<div class="embed-header"><span class="embed-icon">🔀</span><span class="embed-title">관계 그래프</span><span class="embed-meta">${requested.join(', ')} 중심 · ${tableCount}개 테이블 · ${edgeCount}개 연결${truncated}</span></div>
<div class="mermaid">${mermaidCode}</div>
</div>`;
}

/** 아티팩트 HTML 내 embed 태그를 실제 콘텐츠로 교체 */
function resolveArtifactEmbeds(html: string, schema: ParsedSchema | null, tableData: TableDataMap): string {
  // <div data-embed="schema" data-table="TableName"></div>  (속성 순서 무관)
  html = html.replace(
    /<div([^>]*?)data-embed=["']schema["']([^>]*?)data-table=["']([^"']+)["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, tbl) => renderSchemaEmbedHtml(tbl, schema),
  );
  html = html.replace(
    /<div([^>]*?)data-table=["']([^"']+)["']([^>]*?)data-embed=["']schema["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, tbl) => renderSchemaEmbedHtml(tbl, schema),
  );
  // <div data-embed="query" data-sql="..."></div>
  // data-sql="..." 형식 (SQL 내 ' 허용)
  html = html.replace(
    /<div([^>]*?)data-embed=["']query["']([^>]*?)data-sql="([^"]*)"([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, sql) => renderQueryEmbedHtml(sql, tableData, schema),
  );
  // data-sql='...' 형식 (SQL 내 " 허용)
  html = html.replace(
    /<div([^>]*?)data-embed=["']query["']([^>]*?)data-sql='([^']*)'([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, sql) => renderQueryEmbedHtml(sql, tableData, schema),
  );
  // 속성 순서 반대: data-sql 먼저
  html = html.replace(
    /<div([^>]*?)data-sql="([^"]*)"([^>]*?)data-embed=["']query["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, sql) => renderQueryEmbedHtml(sql, tableData, schema),
  );
  html = html.replace(
    /<div([^>]*?)data-sql='([^']*)'([^>]*?)data-embed=["']query["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, sql) => renderQueryEmbedHtml(sql, tableData, schema),
  );
  // <div data-embed="relations" data-table="..."></div>
  html = html.replace(
    /<div([^>]*?)data-embed=["']relations["']([^>]*?)data-table=["']([^"']+)["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, tbl) => renderRelationsEmbedHtml(tbl, schema),
  );
  html = html.replace(
    /<div([^>]*?)data-table=["']([^"']+)["']([^>]*?)data-embed=["']relations["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, tbl) => renderRelationsEmbedHtml(tbl, schema),
  );
  // <div data-embed="graph" data-tables="T1,T2,T3"></div>  (복수 테이블)
  html = html.replace(
    /<div([^>]*?)data-embed=["']graph["']([^>]*?)data-tables=["']([^"']+)["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, tbls) => renderGraphEmbedHtml(tbls, schema),
  );
  html = html.replace(
    /<div([^>]*?)data-tables=["']([^"']+)["']([^>]*?)data-embed=["']graph["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, tbls) => renderGraphEmbedHtml(tbls, schema),
  );
  // <div data-embed="graph" data-table="T1"></div>  (단일 테이블 + 직접 연결)
  html = html.replace(
    /<div([^>]*?)data-embed=["']graph["']([^>]*?)data-table=["']([^"']+)["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, _b, tbl) => renderGraphEmbedHtml(tbl, schema),
  );
  html = html.replace(
    /<div([^>]*?)data-table=["']([^"']+)["']([^>]*?)data-embed=["']graph["']([^>]*?)(?:\/>|>[\s\S]*?<\/div>)/gi,
    (_, _a, tbl) => renderGraphEmbedHtml(tbl, schema),
  );
  return html;
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
  artifactProgress?: { html: string; title: string; charCount: number }; // 아티팩트 생성 진행
  isTruncated?: boolean; // max_tokens로 잘린 응답 (계속 생성 버튼 표시용)
}

// ── localStorage 캐시 키 ──────────────────────────────────────────────────────
const CHAT_CACHE_KEY = 'datamaster_chat_history';
const ARTIFACTS_CACHE_KEY = 'datamaster_saved_artifacts';

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

    // 헤더 (긴 것부터 체크 — #### 이 ### 보다 먼저)
    if (line.startsWith('###### ')) {
      nodes.push(
        <h6 key={i} className="text-[11px] font-semibold mt-2 mb-0.5" style={{ color: 'var(--text-muted)' }}>
          {inlineMarkdown(line.slice(7))}
        </h6>,
      );
      i++; continue;
    }
    if (line.startsWith('##### ')) {
      nodes.push(
        <h5 key={i} className="text-[11px] font-bold mt-2 mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          {inlineMarkdown(line.slice(6))}
        </h5>,
      );
      i++; continue;
    }
    if (line.startsWith('#### ')) {
      nodes.push(
        <h4 key={i} className="text-[12px] font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>
          {inlineMarkdown(line.slice(5))}
        </h4>,
      );
      i++; continue;
    }
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
                  {row.map((cell, ci) => {
                    // 백틱/볼드 등 인라인 마크다운 제거 후 실제 값으로 감지
                    const rawCell = cell
                      .replace(/^`(.+)`$/, '$1')
                      .replace(/^\*\*(.+)\*\*$/, '$1')
                      .replace(/^\*(.+)\*$/, '$1')
                      .trim();
                    return (
                      <td
                        key={ci}
                        className="px-3 py-2"
                        style={{ color: ci === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {looksLikeTableName(rawCell)
                          ? <TableNameLink name={rawCell} />
                          : looksLikeFilename(rawCell)
                            ? <InlineImageCell text={rawCell} />
                            : inlineMarkdown(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // 블록 이미지: ![alt](url) 단독 줄
    {
      const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const [, alt, url] = imgMatch;
        nodes.push(
          <div key={i} className="my-2">
            <img
              src={url}
              alt={alt}
              style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '6px', display: 'block' }}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.smartRetried) return;
                img.dataset.smartRetried = '1';
                const pathParam = url.match(/[?&]path=([^&]+)/);
                const filename = pathParam
                  ? decodeURIComponent(pathParam[1]).split('/').pop() ?? ''
                  : url.split('/').pop() ?? '';
                if (filename) img.src = `/api/images/smart?name=${encodeURIComponent(filename)}`;
              }}
            />
          </div>,
        );
        i++;
        continue;
      }
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

// ── 테이블명 링크 (Docs 페이지로 이동) ──────────────────────────────────────

function TableNameLink({ name }: { name: string }) {
  const navigate = useNavigate();
  const schema = useSchemaStore((s) => s.schema);

  const findTableId = (n: string) => {
    if (!schema) return null;
    const norm = n.trim().toLowerCase();
    return schema.tables.find((t) => t.name.toLowerCase() === norm)?.id ?? null;
  };

  // "Weapon / WeaponStat" 처럼 슬래시로 여러 개인 경우 분리
  const parts = name.split(/\s*\/\s*/);
  const nodes = parts.map((part, i) => {
    const tid = findTableId(part);
    return (
      <span key={i}>
        {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>}
        {tid ? (
          <button
            onClick={() => navigate(`/docs/${tid}`)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            title={`Docs: ${part}`}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
            {part}
          </button>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{part}</span>
        )}
      </span>
    );
  });

  return <span className="inline-flex items-center flex-wrap gap-0.5">{nodes}</span>;
}

function looksLikeTableName(text: string): boolean {
  // PascalCase, 공백 없음, 슬래시로 구분된 경우도 포함
  const parts = text.split(/\s*\/\s*/);
  return parts.every(p => /^[A-Z][a-zA-Z0-9]{2,}$/.test(p.trim()));
}

// ── 인라인 이미지 썸네일 (테이블 셀 파일명 자동 감지) ────────────────────────

// 모듈 레벨 캐시: filename → { relPath, url } | null
const _imgCache = new Map<string, { relPath: string; url: string } | null>();

function looksLikeFilename(text: string): boolean {
  if (text.length < 5 || text.includes(' ') || text.includes('.')) return false;
  // snake_case 이면서 언더스코어가 2개 이상이거나, 알려진 이미지 접두사로 시작하는 경우
  const lower = text.toLowerCase();
  const knownPrefix = ['icon_', 'fullbody_', 'portrait_', 'bg_', 'texture_', 'ui_', 'sprite_', 'fx_', 'vfx_', 'img_'];
  if (knownPrefix.some(p => lower.startsWith(p))) return true;
  // 언더스코어 2개 이상이고 전체 소문자 + 숫자 + 언더스코어로만 이루어진 경우
  const underscoreCount = (text.match(/_/g) || []).length;
  return underscoreCount >= 2 && /^[a-z][a-z0-9_]+$/.test(text);
}

function InlineImageCell({ text }: { text: string }) {
  // undefined = 검색중, null = 없음, {..} = 찾음
  const [img, setImg] = useState<{ relPath: string; url: string } | null | undefined>(
    _imgCache.has(text) ? (_imgCache.get(text) ?? null) : undefined
  );

  useEffect(() => {
    if (!looksLikeFilename(text)) { setImg(null); return; }
    if (_imgCache.has(text)) { setImg(_imgCache.get(text) ?? null); return; }
    fetch(`/api/images/list?q=${encodeURIComponent(text)}`)
      .then(r => r.json())
      .then((data: { results: { name: string; relPath: string }[] }) => {
        // 정확히 이름이 일치하는 것 우선 (확장자 제거 후 비교), 없으면 첫 번째
        const normText = text.toLowerCase();
        const exact = data.results.find(r =>
          r.name.toLowerCase() === normText ||
          r.name.toLowerCase().replace(/\.png$/i, '') === normText
        );
        const hit = exact ?? data.results[0] ?? null;
        const result = hit ? { relPath: hit.relPath, url: `/api/images/file?path=${encodeURIComponent(hit.relPath)}` } : null;
        _imgCache.set(text, result);
        setImg(result);
      })
      .catch(() => { _imgCache.set(text, null); setImg(null); });
  }, [text]);

  const monoStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 };

  // 검색 중 → 로딩 스피너 + 텍스트
  if (img === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg className="animate-spin flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span style={monoStyle}>{text}</span>
      </span>
    );
  }

  // 이미지 없음 → 평문
  if (!img) return <span style={monoStyle}>{text}</span>;

  // 이미지 있음 → 썸네일 + 텍스트
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded overflow-hidden flex-shrink-0"
        style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
        title={img.relPath}
      >
        <img
          src={img.url}
          alt={text}
          style={{ width: 26, height: 26, objectFit: 'contain' }}
          onError={(e) => { (e.currentTarget.parentElement!.style.display = 'none'); }}
        />
      </span>
      <span style={monoStyle}>{text}</span>
    </span>
  );
}

function inlineMarkdown(text: string): React.ReactNode {
  // 이미지, 링크, 볼드, 코드, 이탤릭을 순서대로 파싱
  const INLINE_RE = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_RE.exec(text)) !== null) {
    // 매치 앞 평문 텍스트
    if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index));

    const [full, imgAlt, imgUrl, linkText, linkUrl, boldText, codeText, italicText] = match;

    if (imgUrl !== undefined) {
      // 이미지: ![alt](url)
      segments.push(
        <img
          key={key++}
          src={imgUrl}
          alt={imgAlt ?? ''}
          style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', verticalAlign: 'middle', display: 'inline-block' }}
          onError={(e) => {
            // 경로 틀렸을 때 smart 엔드포인트로 폴백
            const img = e.currentTarget;
            if (img.dataset.smartRetried) return;
            img.dataset.smartRetried = '1';
            const pathParam = imgUrl.match(/[?&]path=([^&]+)/);
            const filename = pathParam
              ? decodeURIComponent(pathParam[1]).split('/').pop() ?? ''
              : imgUrl.split('/').pop() ?? '';
            if (filename) img.src = `/api/images/smart?name=${encodeURIComponent(filename)}`;
          }}
        />,
      );
    } else if (linkUrl !== undefined) {
      // 링크: [text](url) — 이미지 URL이면 img로 렌더
      if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(linkUrl) || linkUrl.includes('/api/images/')) {
        segments.push(
          <img
            key={key++}
            src={linkUrl}
            alt={linkText ?? ''}
            style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', verticalAlign: 'middle', display: 'inline-block' }}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.smartRetried) return;
              img.dataset.smartRetried = '1';
              const pathParam = linkUrl.match(/[?&]path=([^&]+)/);
              const filename = pathParam
                ? decodeURIComponent(pathParam[1]).split('/').pop() ?? ''
                : linkUrl.split('/').pop() ?? '';
              if (filename) img.src = `/api/images/smart?name=${encodeURIComponent(filename)}`;
            }}
          />,
        );
      } else {
        segments.push(
          <a key={key++} href={linkUrl} target="_blank" rel="noreferrer"
             style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            {linkText}
          </a>,
        );
      }
    } else if (boldText !== undefined) {
      segments.push(<strong key={key++} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{boldText}</strong>);
    } else if (codeText !== undefined) {
      segments.push(
        <code key={key++} className="px-1 py-0.5 rounded text-[12px]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
          {codeText}
        </code>,
      );
    } else if (italicText !== undefined) {
      segments.push(<em key={key++}>{italicText}</em>);
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  if (segments.length === 0) return text;
  if (segments.length === 1) return segments[0];
  return <>{segments}</>;
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

// ── 아티팩트 생성 진행 카드 ───────────────────────────────────────────────────

function ArtifactProgressCard({ html, title, charCount }: { html: string; title: string; charCount: number }) {
  const blobUrl = useMemo(() => {
    if (!html || html.length < 20) return null;
    const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;line-height:1.6;color:#e2e8f0;background:#0f1117;margin:16px;font-size:13px;}
h1,h2,h3{color:#fff;margin-top:.8em}table{width:100%;border-collapse:collapse}
th,td{border:1px solid #334155;padding:6px;font-size:12px}th{background:#1e293b}</style>
</head><body>${html}</body></html>`;
    return URL.createObjectURL(new Blob([fullHtml], { type: 'text/html' }));
  }, [html]);

  // blob URL 정리
  useEffect(() => { return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [blobUrl]);

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}>
      {/* 헤더 */}
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.15)' }}>
        {/* 펄스 점 */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--accent)' }} />
        </span>
        <span className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
          아티팩트 작성 중{title ? `: ${title}` : ''}
        </span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          {charCount.toLocaleString()}자
        </span>
      </div>

      {/* 라이브 미리보기 */}
      <div className="relative" style={{ background: 'var(--bg-surface)' }}>
        {blobUrl ? (
          <div className="relative overflow-hidden" style={{ height: 200 }}>
            <iframe
              key={blobUrl}
              src={blobUrl}
              title="preview"
              className="w-full border-none pointer-events-none"
              style={{ height: 400, transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
              sandbox="allow-scripts allow-same-origin"
            />
            {/* 하단 페이드 아웃 */}
            <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-surface))' }} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            HTML 구조 생성 중...
          </div>
        )}

        {/* 타이핑 효과 텍스트 */}
        <div className="px-3 py-1.5 flex items-center gap-1.5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
            <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
          <span className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)', maxWidth: 320 }}>
            {html.slice(-80).replace(/\s+/g, ' ')}
            <span className="inline-block w-[2px] h-[10px] ml-0.5 rounded-sm animate-pulse align-middle" style={{ background: 'var(--accent)' }} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 아티팩트 사이드 패널 (우측 절반 스트리밍 뷰) ────────────────────────────

/**
 * 스트리밍 iframe 기반 HTML srcdoc.
 * 한 번 로드된 후 parent 에서 contentDocument.body.innerHTML 을 직접 갱신한다.
 * - allow-same-origin: parent 에서 contentDocument 접근 허용
 * - allow-scripts: innerHTML 내 <script> 실행 허용
 * base href 는 iframe load 후 script 에서 동적으로 세팅.
 */
const STREAMING_BASE_SRCDOC = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<base id="dynbase" href="/">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;margin:0;padding:0}
body{padding:16px;font-family:'Segoe UI',Tahoma,Geneva,sans-serif;font-size:13px;background:#0f1117;color:#e2e8f0;line-height:1.6;overflow-x:hidden}
h1{font-size:1.6em;color:#fff;margin:.8em 0 .4em;border-bottom:1px solid #334155;padding-bottom:.3em}
h2{font-size:1.3em;color:#c7d2fe;margin:.8em 0 .3em}
h3{font-size:1.1em;color:#a5b4fc;margin:.6em 0 .2em}
h4,h5,h6{color:#94a3b8;margin:.4em 0 .2em}
table{width:100%;border-collapse:collapse;margin-bottom:1em;font-size:12px}
th{background:#1e293b;color:#94a3b8;font-weight:600;padding:6px 10px;border:1px solid #334155;text-align:left}
td{padding:6px 10px;border:1px solid #334155;color:#e2e8f0}
tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px}
img{max-width:100%;height:auto;border-radius:4px}
ul,ol{padding-left:1.4em;margin:.4em 0}a{color:#818cf8;text-decoration:none}
.tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px}
.tab{padding:6px 14px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:12px;transition:all .15s}
.tab:hover{border-color:#6366f1;color:#a5b4fc}
.tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
.tab-panel{display:none}.tab-panel.active{display:block}
.grid{display:grid;gap:12px}.grid-2{grid-template-columns:repeat(2,1fr)}.grid-3{grid-template-columns:repeat(3,1fr)}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
.tag{background:rgba(99,102,241,0.15);color:#818cf8;padding:2px 6px;border-radius:4px;font-size:11px}
code{background:#1e293b;padding:1px 5px;border-radius:3px;font-size:12px;font-family:monospace;color:#a5b4fc}
pre{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:12px;overflow-x:auto;font-size:12px;line-height:1.6}
blockquote{border-left:3px solid #6366f1;margin:0;padding:4px 12px;background:rgba(99,102,241,.05);color:#94a3b8}
hr{border:none;border-top:1px solid #334155;margin:16px 0}
</style>
<script>
// base href 를 parent origin 으로 설정
try{document.getElementById('dynbase').href=parent.location.origin+'/';}catch(e){}
</script>
</head><body></body></html>`;

// 이미지 onerror smart fallback 스크립트 (경로 틀려도 파일명으로 재시도)
const IMG_ONERROR_SCRIPT = `
document.addEventListener('error', function(e) {
  var img = e.target;
  if (!img || img.tagName !== 'IMG') return;
  var src = img.getAttribute('src') || '';
  if (!src.includes('/api/images/') || img.dataset.smartRetried) return;
  img.dataset.smartRetried = '1';
  var filename = src.split('/').pop().split('?')[0];
  if (!filename) return;
  // path 파라미터에서 파일명만 추출
  var pathParam = src.match(/[?&]path=([^&]+)/);
  if (pathParam) {
    var parts = decodeURIComponent(pathParam[1]).split('/');
    filename = parts[parts.length - 1];
  }
  img.src = '/api/images/smart?name=' + encodeURIComponent(filename);
}, true);
`;


function ArtifactSidePanel({
  html,
  title,
  charCount,
  isComplete,
  finalTc,
  onClose,
  initialPublishedUrl,
  onPublished,
  onEditRequest,
}: {
  html: string;
  title: string;
  charCount: number;
  isComplete: boolean;
  finalTc?: ArtifactResult;
  onClose: () => void;
  initialPublishedUrl?: string;
  onPublished?: (url: string) => void;
  onEditRequest?: (prompt: string) => void;
}) {
  // 완료 상태 전체화면 iframe용 blobUrl
  const schema = useSchemaStore((s) => s.schema);
  const tableData = useCanvasStore((s) => s.tableData) as TableDataMap;
  const [completeBlobUrl, setCompleteBlobUrl] = useState<string | null>(null);

  // ── 스트리밍 iframe: srcdoc 한 번 로드 후 body.innerHTML 직접 갱신 ──────────
  const streamIframeRef = useRef<HTMLIFrameElement>(null);
  const [streamIframeReady, setStreamIframeReady] = useState(false);
  // html 이 빨리 와도 iframe 이 아직 로드 전일 수 있으므로 ref 에 최신 값 캐시
  const pendingHtmlRef = useRef('');

  const handleStreamIframeLoad = useCallback(() => {
    setStreamIframeReady(true);
    // 로드 완료 시 이미 쌓인 html 이 있으면 즉시 반영
    const doc = streamIframeRef.current?.contentDocument;
    if (doc?.body && pendingHtmlRef.current) {
      doc.body.innerHTML = pendingHtmlRef.current;
    }
  }, []);

  // html prop 이 바뀔 때마다 iframe body 직접 갱신 (React 가상DOM 우회)
  useLayoutEffect(() => {
    if (isComplete) return;
    pendingHtmlRef.current = html;
    if (!streamIframeReady) return;
    const doc = streamIframeRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.body.innerHTML = html || '';
  });

  // finalTc 완료 시 blob URL 생성
  useEffect(() => {
    if (!isComplete || !finalTc) return;
    const origin = window.location.origin;
    const base = `<base href="${origin}/">`;
    const resolved = resolveArtifactEmbeds(finalTc.html ?? '', schema, tableData);
    const fullHtml = resolved.includes('<!DOCTYPE') || resolved.includes('<html')
      ? resolved
      : `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${base}<title>${finalTc.title ?? '문서'}</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:16px;font-family:'Segoe UI',sans-serif;font-size:13px;background:#0f1117;color:#e2e8f0;line-height:1.6}h1,h2,h3,h4,h5,h6{color:#fff;margin:.8em 0 .4em}table{width:100%;border-collapse:collapse;margin-bottom:1em}th,td{border:1px solid #334155;padding:6px 10px;text-align:left;font-size:12px}th{background:#1e293b;color:#94a3b8;font-weight:600}tr:nth-child(even) td{background:rgba(255,255,255,.02)}.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px}img{max-width:100%;height:auto}ul,ol{padding-left:1.4em;margin:.4em 0}${EMBED_CSS}</style><script>${IMG_ONERROR_SCRIPT}</script>${MERMAID_INIT_SCRIPT}</head><body>${resolved}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setCompleteBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isComplete, finalTc, schema, tableData]);

  // 완료 상태에서 HTML 저장
  const handleSaveHtml = useCallback(() => {
    if (!finalTc) return;
    const origin = window.location.origin;
    const resolved = resolveArtifactEmbeds(finalTc.html ?? '', schema, tableData);
    const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><base href="${origin}/"><title>${finalTc.title ?? '문서'}</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:16px;font-family:'Segoe UI',sans-serif;font-size:13px;background:#0f1117;color:#e2e8f0;line-height:1.6}h1,h2,h3,h4,h5,h6{color:#fff;margin:.8em 0 .4em}table{width:100%;border-collapse:collapse;margin-bottom:1em}th,td{border:1px solid #334155;padding:6px 10px;text-align:left;font-size:12px}th{background:#1e293b;color:#94a3b8;font-weight:600}tr:nth-child(even) td{background:rgba(255,255,255,.02)}.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px}img{max-width:100%;height:auto}${EMBED_CSS}</style><script>${IMG_ONERROR_SCRIPT}</script>${MERMAID_INIT_SCRIPT}</head><body>${resolved}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(finalTc.title ?? '문서').replace(/[\\/:*?"<>|]/g, '_')}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [finalTc, schema, tableData]);

  // 완료 상태에서 PDF 저장
  const handlePrint = useCallback(() => {
    if (completeBlobUrl) window.open(completeBlobUrl)?.print();
  }, [completeBlobUrl]);

  // 출판 상태 — initialPublishedUrl이 있으면 이미 출판된 상태로 초기화
  const [publishState, setPublishState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    () => (initialPublishedUrl ? 'done' : 'idle')
  );
  const [publishedUrl, setPublishedUrl] = useState<string | null>(initialPublishedUrl ?? null);
  const [publishCopied, setPublishCopied] = useState(false);

  // initialPublishedUrl prop이 바뀔 때 (다른 아티팩트로 전환) 상태 동기화
  useEffect(() => {
    if (initialPublishedUrl) {
      setPublishState('done');
      setPublishedUrl(initialPublishedUrl);
    } else {
      setPublishState('idle');
      setPublishedUrl(null);
    }
    setPublishCopied(false);
  }, [initialPublishedUrl]);

  const handlePublish = useCallback(async () => {
    if (!finalTc || publishState === 'loading') return;
    setPublishState('loading');
    try {
      const origin = window.location.origin;
      const resolved = resolveArtifactEmbeds(finalTc.html ?? '', schema, tableData);
      const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><base href="${origin}/"><title>${finalTc.title ?? '문서'}</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:16px;font-family:'Segoe UI',sans-serif;font-size:13px;background:#0f1117;color:#e2e8f0;line-height:1.6}h1,h2,h3,h4,h5,h6{color:#fff;margin:.8em 0 .4em}table{width:100%;border-collapse:collapse;margin-bottom:1em}th,td{border:1px solid #334155;padding:6px 10px;text-align:left;font-size:12px}th{background:#1e293b;color:#94a3b8;font-weight:600}tr:nth-child(even) td{background:rgba(255,255,255,.02)}.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px}img{max-width:100%;height:auto}${EMBED_CSS}</style><script>${IMG_ONERROR_SCRIPT}</script>${MERMAID_INIT_SCRIPT}</head><body>${resolved}</body></html>`;
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTc.title ?? '제목 없음', html: fullHtml, description: finalTc.description ?? '' }),
      });
      const data = await res.json() as { id?: string; url?: string; error?: string };
      if (data.error) throw new Error(data.error);
      const url = `${origin}${data.url}`;
      setPublishedUrl(url);
      setPublishState('done');
      onPublished?.(url); // 부모에 URL 전달 → savedArtifacts에 저장
    } catch (e) {
      console.error('Publish failed:', e);
      setPublishState('error');
      setTimeout(() => setPublishState('idle'), 3000);
    }
  }, [finalTc, schema, tableData, publishState, onPublished]);

  const handleCopyUrl = useCallback(() => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl).then(() => {
      setPublishCopied(true);
      setTimeout(() => setPublishCopied(false), 2000);
    });
  }, [publishedUrl]);

  // ── 수정 요청 상태 ──────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editInput, setEditInput] = useState('');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEditSubmit = useCallback(() => {
    const prompt = editInput.trim();
    if (!prompt || !finalTc) return;
    onEditRequest?.(prompt);
    setEditInput('');
    setEditMode(false);
  }, [editInput, finalTc, onEditRequest]);

  // 수정 모드 열릴 때 textarea 포커스
  useEffect(() => {
    if (editMode) setTimeout(() => editTextareaRef.current?.focus(), 50);
  }, [editMode]);


  return (
    <div
      className="flex-1 flex flex-col overflow-hidden border-l min-h-0"
      style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', minWidth: 0 }}
    >
      {/* ── 헤더 ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: isComplete
            ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)'
            : 'rgba(99,102,241,0.08)',
        }}
      >
        {/* 상태 아이콘 */}
        {isComplete ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: '#4ade80', flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--accent)' }} />
          </span>
        )}

        {/* 타이틀 */}
        <span className="font-semibold text-[12px] flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {title || '아티팩트'}
        </span>

        {/* 완료 상태 액션 버튼 */}
        {isComplete && finalTc && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleSaveHtml} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }} title="HTML 저장">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              HTML
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)' }} title="PDF 저장">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF
            </button>
            {/* 출판 버튼 */}
            {publishState === 'done' ? (
              <button onClick={handleCopyUrl} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium hover:opacity-80 transition-all"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }} title={publishedUrl ?? ''}>
                {publishCopied
                  ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>복사됨</>
                  : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>URL 복사</>
                }
              </button>
            ) : (
              <button onClick={handlePublish} disabled={publishState === 'loading'}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium hover:opacity-80 transition-all disabled:opacity-50"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }} title="서버에 출판하여 URL 공유">
                {publishState === 'loading'
                  ? <><svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>출판 중</>
                  : publishState === 'error'
                    ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>오류</>
                    : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>출판</>
                }
              </button>
            )}
          </div>
        )}

        {/* 글자 수 (생성 중) */}
        {!isComplete && charCount > 0 && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
            {charCount.toLocaleString()}자
          </span>
        )}

        {/* 닫기 버튼 */}
        <button onClick={onClose} className="p-1.5 rounded-lg interactive flex-shrink-0" style={{ color: 'var(--text-muted)' }} title="패널 닫기">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
        {isComplete && finalTc ? (
          /* 완료 → 전체 높이 iframe + 수정 요청 바 */
          <>
            {completeBlobUrl
              ? <iframe src={completeBlobUrl} className="flex-1 border-none min-h-0 w-full" title={finalTc.title ?? '문서'} sandbox="allow-same-origin allow-scripts" />
              : <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  <svg className="animate-spin mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  렌더링 중...
                </div>
            }

            {/* ── 수정 요청 바 ── */}
            {onEditRequest && (
              <div
                className="flex-shrink-0"
                style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
              >
                {editMode ? (
                  /* 입력 모드 */
                  <div className="flex gap-2 px-3 py-2">
                    <textarea
                      ref={editTextareaRef}
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                        if (e.key === 'Escape') { setEditMode(false); setEditInput(''); }
                      }}
                      placeholder="수정할 내용을 입력하세요… (Enter 전송, Shift+Enter 줄바꿈)"
                      rows={2}
                      className="flex-1 text-[12px] rounded-lg px-2.5 py-1.5 resize-none outline-none"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--accent)',
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                      }}
                    />
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={handleEditSubmit}
                        disabled={!editInput.trim()}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        전송
                      </button>
                      <button
                        onClick={() => { setEditMode(false); setEditInput(''); }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-opacity hover:opacity-80"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 접힌 상태 — 버튼 한 줄 */
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    이 문서 수정 요청…
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── 스트리밍 중: iframe 으로 직접 body.innerHTML 갱신 ──────────────── */
          <>
            {/* HTML 아직 없으면 스피너 오버레이 */}
            {!html && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
                style={{ background: '#0f1117', color: 'var(--text-muted)' }}
              >
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {charCount > 0
                  ? <span className="text-[12px]">HTML 작성 중 <span className="font-mono" style={{ color: 'var(--accent)' }}>{charCount.toLocaleString()}자</span></span>
                  : <span className="text-[12px]">아티팩트 준비 중...</span>
                }
              </div>
            )}

            {/* 스트리밍 iframe: srcdoc 한 번 로드 후 body 직접 갱신 */}
            <iframe
              ref={streamIframeRef}
              srcDoc={STREAMING_BASE_SRCDOC}
              onLoad={handleStreamIframeLoad}
              sandbox="allow-scripts allow-same-origin"
              title="스트리밍 미리보기"
              className="flex-1 border-none min-h-0 w-full"
              style={{ background: '#0f1117', display: 'block' }}
            />

            {/* 하단 타이핑 바 */}
            {html && (
              <div
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5"
                style={{ background: 'rgba(15,17,23,0.95)', borderTop: '1px solid var(--border-color)' }}
              >
                <svg className="w-3 h-3 flex-shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
                  <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                <span className="text-[10px] font-mono truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                  {html.slice(-100).replace(/\s+/g, ' ')}
                  <span className="inline-block w-[2px] h-[10px] ml-0.5 rounded-sm animate-pulse align-middle" style={{ background: 'var(--accent)' }} />
                </span>
                <span className="flex-shrink-0 text-[10px] font-mono" style={{ color: '#6366f1' }}>
                  {charCount.toLocaleString()}자
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 아티팩트 카드 ─────────────────────────────────────────────────────────────

function ArtifactCard({ tc }: { tc: ArtifactResult }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // embed 해석을 위해 store에서 schema / tableData 가져오기
  const schema = useSchemaStore((s) => s.schema);
  const tableData = useCanvasStore((s) => s.tableData) as TableDataMap;

  // HTML에 <base> + embed 해석 + 다크 테마 CSS 주입
  const getInjectedHtml = useCallback(() => {
    const origin = window.location.origin;
    const base = `<base href="${origin}/">`;
    // 1. embed 태그 먼저 해석
    const resolved = resolveArtifactEmbeds(tc.html ?? '', schema, tableData);

    // 2. body-only HTML → 완전한 문서로 래핑
    if (!resolved.includes('<!DOCTYPE') && !resolved.includes('<html')) {
      return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${base}
  <title>${tc.title ?? '문서'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 16px; font-family: 'Segoe UI', sans-serif; font-size: 13px;
           background: #0f1117; color: #e2e8f0; line-height: 1.6; }
    h1,h2,h3,h4,h5,h6 { color: #fff; margin: 0.8em 0 0.4em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
    th, td { border: 1px solid #334155; padding: 6px 10px; text-align: left; font-size: 12px; }
    th { background: #1e293b; color: #94a3b8; font-weight: 600; }
    tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    ${EMBED_CSS}
    @media print {
      body { background: #fff; color: #000; }
      th { background: #f1f5f9; }
      .card { border: 1px solid #cbd5e1; }
      .embed-card { border: 1px solid #cbd5e1; background: #f8fafc; }
      .embed-table th { background: #f1f5f9; color: #475569; }
      .embed-table td { color: #1e293b; }
    }
  </style>
  <script>${IMG_ONERROR_SCRIPT}</script>
  ${MERMAID_INIT_SCRIPT}
</head>
<body>
${resolved}
</body>
</html>`;
    }

    // 3. 완전한 HTML 문서 → <head>에 base + embed CSS + Mermaid 주입
    const withBase = resolved.includes('<head>')
      ? resolved.replace('<head>', `<head>${base}<style>${EMBED_CSS}</style>${MERMAID_INIT_SCRIPT}`)
      : resolved.includes('<head ')
        ? resolved.replace(/<head(\s[^>]*)>/, `<head$1>${base}<style>${EMBED_CSS}</style>${MERMAID_INIT_SCRIPT}`)
        : resolved;
    return withBase;
  }, [tc.html, tc.title, schema, tableData]);

  useEffect(() => {
    if (!tc.html) return;
    const injected = getInjectedHtml();
    const blob = new Blob([injected], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tc.html, getInjectedHtml]);

  // ESC 키로 전체화면 닫기
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const handlePrint = () => {
    const iframe = isFullscreen ? iframeRef.current : previewRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  // HTML 파일로 저장 (embed 포함 완전한 standalone 문서)
  const handleSaveHtml = () => {
    const fullHtml = getInjectedHtml();
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (tc.title ?? '문서').replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (tc.error) {
    return (
      <div className="rounded-lg p-3 my-2 text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
        아티팩트 생성 실패: {tc.error}
      </div>
    );
  }

  return (
    <>
      {/* 아티팩트 카드 */}
      <div
        className="rounded-xl my-3 overflow-hidden"
        style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)', borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{tc.title}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tc.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* HTML 저장 */}
            <button
              onClick={handleSaveHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
              title="HTML 파일로 저장 (사이트 형식, embed 포함)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              HTML 저장
            </button>
            {/* PDF 저장 */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              title="PDF로 저장"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PDF 저장
            </button>
            {/* 전체화면 */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent)' }}
              title="전체화면으로 열기"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              전체화면
            </button>
          </div>
        </div>

        {/* 미리보기 iframe (축소 스케일) */}
        <div className="relative overflow-hidden" style={{ height: 280 }}>
          {blobUrl ? (
            <iframe
              ref={previewRef}
              src={blobUrl}
              className="absolute top-0 left-0 border-0 pointer-events-none"
              style={{ width: '166.67%', height: '166.67%', transformOrigin: 'top left', transform: 'scale(0.6)' }}
              title={tc.title}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              <svg className="animate-spin mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              문서 렌더링 중...
            </div>
          )}
          {/* 클릭 오버레이 → 전체화면 */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setIsFullscreen(true)}
          >
            <span className="flex items-center gap-2 text-[13px] font-medium text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              전체화면으로 보기
            </span>
          </div>
        </div>
      </div>

      {/* 전체화면 모달 */}
      {isFullscreen && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 9999, background: '#0a0a0f' }}
        >
          {/* 전체화면 툴바 */}
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ background: 'rgba(15,17,23,0.95)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>{tc.title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                HTML 문서
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF 저장
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                닫기 (ESC)
              </button>
            </div>
          </div>

          {/* 전체화면 iframe */}
          {blobUrl && (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              className="flex-1 border-0 w-full"
              title={tc.title}
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          )}
        </div>
      )}
    </>
  );
}

// ── 코드 검색 카드 ────────────────────────────────────────────────────────────
function CodeSearchCard({ tc }: { tc: CodeSearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasResults = (tc.results?.length ?? 0) > 0 || (tc.contentHits?.length ?? 0) > 0;

  return (
    <div className="rounded-lg overflow-hidden mb-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: 'transparent' }}
      >
        {/* 코드 아이콘 */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#22d3ee', flexShrink: 0 }}>
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
        <span className="text-[11px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--text-secondary)' }}>
          코드 검색: &quot;{tc.query}&quot;
          {tc.searchType === 'content' ? ' (전문검색)' : ' (인덱스)'}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{
          background: tc.error ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.15)',
          color: tc.error ? '#f87171' : '#22d3ee',
        }}>
          {tc.error ? '오류' : tc.searchType === 'content'
            ? `${tc.contentHits?.length ?? 0}개 파일`
            : `${tc.results?.length ?? 0}/${tc.total ?? 0}`}
        </span>
        {tc.duration != null && (
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{tc.duration.toFixed(0)}ms</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {tc.error ? (
            <div className="text-[11px] px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{tc.error}</div>
          ) : tc.searchType === 'content' ? (
            /* 전문 검색 결과 */
            <div className="space-y-2">
              {(tc.contentHits ?? []).map((hit, i) => (
                <div key={i} className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                  <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: 'var(--bg-tertiary)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#22d3ee', flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-primary)' }}>{hit.path}</span>
                  </div>
                  <div className="px-3 py-2">
                    {hit.matches.slice(0, 5).map((m, j) => (
                      <div key={j} className="flex gap-2 mb-1">
                        <span className="text-[10px] font-mono flex-shrink-0 w-8 text-right" style={{ color: 'var(--text-muted)' }}>L{m.line}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{m.lineContent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!hasResults && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>검색 결과 없음</p>}
            </div>
          ) : (
            /* 인덱스 검색 결과 */
            <div className="space-y-1.5">
              {(tc.results ?? []).map((entry, i) => (
                <div key={i} className="rounded-md px-3 py-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#22d3ee', flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                    {entry.size != null && (
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{(entry.size / 1024).toFixed(1)}KB</span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono mb-0.5" style={{ color: 'var(--text-muted)' }}>{entry.path}</div>
                  {entry.namespaces?.length > 0 && (
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: '#a78bfa' }}>ns </span>{entry.namespaces.join(', ')}
                    </div>
                  )}
                  {entry.classes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.classes.map((c, ci) => (
                        <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {entry.methods?.slice(0, 8).length > 0 && (
                    <div className="mt-1 text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {entry.methods.slice(0, 8).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
              {!hasResults && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>검색 결과 없음</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── C# 신택스 하이라이터 ─────────────────────────────────────────────────────
function highlightCSharp(code: string): string {
  const KEYWORDS = /\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|async|await|var|dynamic|partial|yield|get|set|add|remove|value|where|from|select|group|into|orderby|join|let|on|equals|by|ascending|descending)\b/g;
  const BUILTIN_TYPES = /\b(List|Dictionary|IEnumerable|IList|IDictionary|ICollection|HashSet|Queue|Stack|Task|Action|Func|Predicate|EventHandler|Exception|StringBuilder|Guid|DateTime|TimeSpan|Nullable|Array|Tuple|ValueTuple|ObservableCollection|CancellationToken|CancellationTokenSource|JsonSerializer|JsonDocument|HttpClient|StreamReader|StreamWriter|Encoding|Regex|Thread|Timer|Stopwatch|Debug|Console|Math|Convert|Environment|Path|File|Directory|Enum|Type|Attribute|Assembly|MethodInfo|PropertyInfo|FieldInfo|ParameterInfo|Activator)\b/g;

  // HTML 특수문자 이스케이프
  let out = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 토큰화: 각 요소를 플레이스홀더로 치환 후 색상 적용
  const tokens: string[] = [];
  const ph = (html: string) => { const id = `\x00${tokens.length}\x00`; tokens.push(html); return id; };

  // 1. 블록 주석 /* ... */
  out = out.replace(/\/\*[\s\S]*?\*\//g, m => ph(`<span style="color:#6a9955;font-style:italic">${m}</span>`));
  // 2. 한 줄 주석 //
  out = out.replace(/\/\/[^\n]*/g, m => ph(`<span style="color:#6a9955;font-style:italic">${m}</span>`));
  // 3. 보간 문자열 $"..." (단순 처리)
  out = out.replace(/\$&quot;(?:[^&]|&(?!quot;))*&quot;/g, m => ph(`<span style="color:#ce9178">${m}</span>`));
  // 4. 일반 문자열 "..."
  out = out.replace(/&quot;(?:[^&]|&(?!quot;))*&quot;/g, m => ph(`<span style="color:#ce9178">${m}</span>`));
  // 5. 문자 리터럴 '.'
  out = out.replace(/&#x27;.&#x27;/g, m => ph(`<span style="color:#ce9178">${m}</span>`));
  // 6. 어트리뷰트 [Attribute]
  out = out.replace(/\[([A-Z][A-Za-z0-9_.,\s&lt;&gt;"=()]*?)\]/g, (m) =>
    ph(`<span style="color:#dcdcaa">${m}</span>`));
  // 7. 전처리기 #region #endregion #if 등
  out = out.replace(/^([ \t]*)(#\w+.*)/gm, (_, indent, directive) =>
    indent + ph(`<span style="color:#9b9b9b">${directive}</span>`));
  // 8. 숫자
  out = out.replace(/\b(\d+\.?\d*[fFdDmMuUlL]*)\b/g, m => ph(`<span style="color:#b5cea8">${m}</span>`));
  // 9. 키워드
  out = out.replace(KEYWORDS, m => ph(`<span style="color:#569cd6;font-weight:600">${m}</span>`));
  // 10. 내장 타입/클래스
  out = out.replace(BUILTIN_TYPES, m => ph(`<span style="color:#4ec9b0">${m}</span>`));
  // 11. 메서드 호출 word(
  out = out.replace(/\b([A-Z][A-Za-z0-9_]*)(?=\s*(?:&lt;[^&]*&gt;\s*)?\()/g, m => ph(`<span style="color:#dcdcaa">${m}</span>`));
  // 12. 대문자 시작 식별자 (타입명 추정)
  out = out.replace(/\b([A-Z][A-Za-z0-9_]{1,})\b/g, m => ph(`<span style="color:#4ec9b0">${m}</span>`));

  // 플레이스홀더 복원
  out = out.replace(/\x00(\d+)\x00/g, (_, i) => tokens[Number(i)]);
  return out;
}

// ── 코드 파일 뷰어 카드 ───────────────────────────────────────────────────────
function CodeFileCard({ tc }: { tc: CodeFileResult }) {
  const [expanded, setExpanded] = useState(false);

  const highlighted = useMemo(() => {
    if (!tc.content) return '';
    // 줄 번호 추가
    const lines = tc.content.split('\n');
    const pad = String(lines.length).length;
    return lines.map((line, i) => {
      const lineNum = String(i + 1).padStart(pad, ' ');
      return `<span style="color:#4a5568;user-select:none;margin-right:12px;display:inline-block;min-width:${pad}ch;text-align:right">${lineNum}</span>${highlightCSharp(line)}`;
    }).join('\n');
  }, [tc.content]);

  return (
    <div className="rounded-lg overflow-hidden mb-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: 'transparent' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#22d3ee', flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="text-[11px] font-medium flex-1 min-w-0 truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
          {tc.path || '코드 파일'}
        </span>
        {tc.truncated && (
          <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>잘림</span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{
          background: tc.error ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.15)',
          color: tc.error ? '#f87171' : '#22d3ee',
        }}>
          {tc.error ? '오류' : `${(tc.size / 1024).toFixed(1)}KB`}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {tc.error ? (
            <div className="text-[11px] px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{tc.error}</div>
          ) : (
            <>
              {/* 메타 배지 */}
              {(tc.classes?.length || tc.namespaces?.length) ? (
                <div className="mb-2 flex flex-wrap gap-1">
                  {tc.namespaces?.map((n, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>ns:{n}</span>
                  ))}
                  {tc.classes?.map((c, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{c}</span>
                  ))}
                </div>
              ) : null}
              {/* 코드 블록 — C# 하이라이팅 */}
              <div
                className="text-[10.5px] font-mono overflow-auto rounded-md p-3 max-h-[520px] leading-[1.6]"
                style={{
                  background: '#1e1e1e',
                  border: '1px solid #333',
                  color: '#d4d4d4',
                  whiteSpace: 'pre',
                  tabSize: 4,
                  fontFamily: '"Cascadia Code","Fira Code","JetBrains Mono","Consolas",monospace',
                }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
              {tc.truncated && (
                <p className="text-[10px] mt-1" style={{ color: '#fbbf24' }}>⚠️ 파일이 크거나 잘렸습니다 (100KB 제한)</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CodeGuideCard({ tc }: { tc: CodeGuideResult }) {
  const [expanded, setExpanded] = useState(false);
  const isError = !!tc.error;
  const lineCount = tc.text.split('\n').length;

  return (
    <div className="rounded-lg overflow-hidden mb-2" style={{ background: 'var(--bg-secondary)', border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: 'transparent' }}
      >
        {/* 책 아이콘 */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#818cf8', flexShrink: 0 }}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span className="text-[11px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--text-secondary)' }}>
          {tc.label}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{
          background: isError ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
          color: isError ? '#f87171' : '#818cf8',
        }}>
          {isError ? '오류' : `${lineCount}줄`}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div
            className="text-[11px] font-mono overflow-auto rounded-md p-3 max-h-[480px] leading-[1.6] whitespace-pre-wrap"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: '"JetBrains Mono","Cascadia Code","Consolas",monospace',
            }}
          >
            {tc.text}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ tc, index }: { tc: ToolCallResult; index: number }) {
  if (tc.kind === 'schema_card') return <TableSchemaCard tc={tc} />;
  if (tc.kind === 'git_history') return <GitHistoryCard tc={tc} />;
  if (tc.kind === 'revision_diff') return <DiffCard tc={tc} />;
  if (tc.kind === 'image_search') return <ImageCard tc={tc} />;
  if (tc.kind === 'artifact') return <ArtifactCard tc={tc} />;
  if (tc.kind === 'character_profile') return <CharacterProfileCard tc={tc} />;
  if (tc.kind === 'code_search') return <CodeSearchCard tc={tc} />;
  if (tc.kind === 'code_file') return <CodeFileCard tc={tc} />;
  if (tc.kind === 'code_guide') return <CodeGuideCard tc={tc} />;
  return <DataQueryCard tc={tc} index={index} />;
}

// ── 캐릭터 프로파일 카드 (사이트맵 뷰) ────────────────────────────────────────

function CharacterProfileCard({ tc }: { tc: CharacterProfileResult }) {
  if (tc.error) {
    // 전체 목록 포함 오류 → 스크롤 가능한 카드로 표시
    const isListError = tc.error.includes('전체 목록') || tc.error.includes('재호출');
    return (
      <div className="rounded-lg my-2 overflow-hidden" style={{ border: `1px solid ${isListError ? 'rgba(251,191,36,.3)' : 'rgba(239,68,68,0.3)'}`, background: isListError ? 'rgba(251,191,36,.05)' : 'rgba(239,68,68,0.05)' }}>
        <div className="px-3 py-2 text-[11px] font-semibold" style={{ color: isListError ? '#fbbf24' : '#ef4444', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          {isListError ? '⚠ 캐릭터 이름 불일치 — 아래 목록에서 확인 후 ID로 재시도' : `✕ 캐릭터 프로파일 오류`}
        </div>
        <pre className="px-3 py-2 text-[10px] overflow-auto max-h-48 whitespace-pre-wrap" style={{ color: isListError ? '#e2e8f0' : '#ef4444', margin: 0 }}>
          {tc.error}
        </pre>
      </div>
    );
  }

  const charFields = Object.entries(tc.character).slice(0, 12);

  return (
    <div className="rounded-xl overflow-hidden my-2" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.18) 0%,rgba(139,92,246,.12) 100%)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13px]" style={{ color: 'var(--text-primary)' }}>{tc.characterName} 프로파일</div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {tc.charTableName} · 연결 테이블 {tc.connections.length}개 · 관련 데이터 {tc.totalRelatedRows.toLocaleString()}행
            {tc.duration != null && <span className="ml-2">{tc.duration.toFixed(0)}ms</span>}
          </div>
        </div>
      </div>

      {/* ── 캐릭터 기본 정보 ── */}
      {charFields.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
          {charFields.map(([k, v]) => (
            <span key={k} className="text-[11px]">
              <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{String(v ?? '-')}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── 사이트맵 노드 ── */}
      <div className="px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          연결 데이터 구조
        </div>
        <div className="space-y-1.5">
          {tc.connections.map((conn, i) => (
            <div key={i} className="flex items-start gap-2">
              {/* 트리 라인 */}
              <span className="text-[11px] flex-shrink-0 mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                {i === tc.connections.length - 1 ? '└─' : '├─'}
              </span>
              <div className="flex-1 min-w-0">
                {/* 노드 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[12px]" style={{ color: 'var(--text-primary)' }}>{conn.tableName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'rgba(99,102,241,.15)', color: 'var(--accent)' }}>
                    {conn.rowCount.toLocaleString()}행
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>via {conn.fkColumn}</span>
                  {/* 샘플값 */}
                  {conn.sampleRows.length > 0 && (() => {
                    const nameKey = conn.columns.find(c => /name|title|이름/i.test(c));
                    const val = nameKey ? (conn.sampleRows[0] as Record<string, unknown>)[nameKey] : null;
                    return val ? <span className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }} title={String(val)}>"{String(val)}"</span> : null;
                  })()}
                </div>
                {/* 2차 연결 */}
                {conn.children && conn.children.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1 ml-2">
                    {conn.children.map((ch, j) => (
                      <span key={j} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-mono">└</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{ch.tableName}</span>
                        <span className="px-1 rounded" style={{ background: 'rgba(99,102,241,.1)', color: 'var(--accent)' }}>{ch.rowCount}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
            ? `데이터 분석 중... (${liveToolCalls.length}번 조회, ${elapsed}초)`
            : `응답 대기 중... (${elapsed}초)`}
        </span>
      </div>
    </div>
  );
}

// ── 메시지 버블 ──────────────────────────────────────────────────────────────

function MessageBubble({ msg, onContinue }: { msg: Message; onContinue?: () => void }) {
  const isUser = msg.role === 'user';

  /* ── 유저 메시지: 우측 정렬 그라데이션 버블 ─────────────────────────────── */
  if (isUser) {
    return (
      <div className="flex justify-end px-2 py-1">
        <div
          className="max-w-[75%] rounded-3xl rounded-tr-md px-6 py-4 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
          }}
        >
          <p className="text-[15px] whitespace-pre-wrap leading-relaxed" style={{ color: '#fff' }}>
            {msg.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── AI 메시지: 풀폭, 헤더 + 내용 ──────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3 px-2 py-1">
      {/* AI 헤더 */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 2px 10px rgba(99,102,241,0.45)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>AI Assistant</span>
      </div>

      {/* 내용 */}
      <div
        className="rounded-3xl rounded-tl-md px-7 py-5 w-full"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
          {msg.isLoading && !msg.content ? (
            <ThinkingIndicator liveToolCalls={msg.liveToolCalls} />
          ) : msg.isLoading && (msg.content || msg.artifactProgress || (msg.liveToolCalls && msg.liveToolCalls.length > 0)) ? (
            // 스트리밍 중 — 텍스트 실시간 표시 + 커서
            <div className="space-y-0.5">
              {msg.liveToolCalls && msg.liveToolCalls.length > 0 && (
                <div className="mb-3 space-y-1">
                  {msg.liveToolCalls.map((tc, i) => <ToolCallCard key={i} tc={tc} index={i} />)}
                </div>
              )}
              {/* 아티팩트 실시간 생성 → 오른쪽 패널에서 표시, 여기선 뱃지만 */}
              {msg.artifactProgress && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--accent)' }}>
                    아티팩트 생성 중{msg.artifactProgress.title ? `: ${msg.artifactProgress.title}` : ''}
                  </span>
                  <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {msg.artifactProgress.charCount.toLocaleString()}자 · 오른쪽 패널 ›
                  </span>
                </div>
              )}
              {msg.content && (
                <div className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {renderMarkdown(msg.content)}
                  <span
                    className="inline-block ml-0.5 w-[2px] h-[14px] rounded-sm align-middle animate-pulse"
                    style={{ background: 'var(--accent)', verticalAlign: 'middle' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
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
                  className="px-4 py-3 rounded-xl text-[13px] mb-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                >
                  {msg.error}
                </div>
              )}
              {/* 본문 */}
              <div className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {renderMarkdown(msg.content)}
              </div>

              {/* 잘린 응답 → 계속 생성 버튼 */}
              {msg.isTruncated && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#f59e0b', flexShrink: 0 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="text-[11px]" style={{ color: '#f59e0b' }}>응답이 잘렸습니다 — 이전에 조회된 데이터를 재활용해 계속 생성할 수 있습니다.</span>
                  </div>
                  {onContinue && (
                    <button
                      onClick={onContinue}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:opacity-80 transition-opacity"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="5 12 12 19 19 12"/>
                        <polyline points="5 5 12 12 19 5"/>
                      </svg>
                      이어서 생성하기
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-[11px] mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
          {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 아티팩트 사이드 패널 상태
  const [artifactPanel, setArtifactPanel] = useState<{
    html: string;
    title: string;
    charCount: number;
    isComplete: boolean;
    finalTc?: ArtifactResult;
    artifactId?: string; // 저장된 아티팩트 id (출판 URL 연결용)
  } | null>(null);

  // 생성된 아티팩트 목록 (사이드바용) — localStorage 복원
  const [savedArtifacts, setSavedArtifacts] = useState<{ id: string; title: string; tc: ArtifactResult; createdAt: Date; publishedUrl?: string }[]>(() => {
    try {
      const raw = localStorage.getItem(ARTIFACTS_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { id: string; title: string; tc: ArtifactResult; createdAt: string; publishedUrl?: string }[];
      return parsed.map((a) => ({ ...a, createdAt: new Date(a.createdAt) }));
    } catch { return []; }
  });

  // savedArtifacts 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(ARTIFACTS_CACHE_KEY, JSON.stringify(savedArtifacts));
    } catch { /* 용량 초과 등 무시 */ }
  }, [savedArtifacts]);

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

  const sendMessage = useCallback(async (text: string, displayText?: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: displayText !== undefined ? displayText : text.trim(),
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
      const { content, toolCalls, rawMessages } = await sendChatMessage(
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
        (_, fullText) => {
          // 실시간 텍스트 스트리밍 업데이트
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { ...m, content: fullText, isLoading: true }
                : m,
            ),
          );
        },
        (html, title, charCount) => {
          // 아티팩트 실시간 생성 진행 → 사이드 패널만 업데이트
          // ⚠️ setMessages 는 제거: 매 delta마다 메시지 목록 전체 재렌더 → 심각한 성능 저하
          setArtifactPanel((prev) => {
            if (!prev) {
              return { html, title: title || '', charCount, isComplete: false };
            }
            if (!prev.isComplete) {
              return { html, title: title || prev.title || '', charCount, isComplete: false };
            }
            return prev; // 이미 완료된 경우 유지
          });
        },
      );

      // history 갱신 (max_tokens로 잘린 경우 rawMessages 포함 → 계속해줘 지원)
      const isTruncated = !!rawMessages; // rawMessages가 있으면 max_tokens로 잘린 응답
      historyRef.current = [
        ...historyRef.current,
        { id: userMsg.id, role: 'user' as const, content: text.trim(), timestamp: userMsg.timestamp },
        { id: loadingId, role: 'assistant' as const, content, toolCalls, rawMessages, timestamp: new Date() },
      ].slice(-20); // 최근 20턴만 유지

      // 로딩 메시지를 실제 응답으로 교체
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content, toolCalls, isTruncated, isLoading: false, liveToolCalls: undefined, artifactProgress: undefined }
            : m,
        ),
      );

      // 아티팩트 패널: 완료 처리
      const artifactTc = toolCalls?.find((tc) => tc.kind === 'artifact') as ArtifactResult | undefined;
      const patchTc = toolCalls?.find((tc) => tc.kind === 'artifact_patch') as ArtifactPatchResult | undefined;

      if (artifactTc) {
        const artifactId = `artifact-${Date.now()}`;
        setArtifactPanel((prev) =>
          prev
            ? { ...prev, isComplete: true, finalTc: artifactTc, artifactId }
            : { html: artifactTc.html ?? '', title: artifactTc.title ?? '', charCount: (artifactTc.html ?? '').length, isComplete: true, finalTc: artifactTc, artifactId },
        );
        // 사이드바 목록에도 저장
        setSavedArtifacts((prev) => [
          { id: artifactId, title: artifactTc.title ?? '문서', tc: artifactTc, createdAt: new Date() },
          ...prev,
        ]);
      } else if (patchTc && patchTc.patches.length > 0) {
        // patch_artifact: 현재 열린 아티팩트에 패치 적용
        setArtifactPanel((prev) => {
          if (!prev?.finalTc) return prev;
          const originalHtml = prev.finalTc.html ?? '';
          const { html: patchedHtml, applied, failed } = applyPatches(originalHtml, patchTc.patches);
          console.log(`[Patch] 적용 ${applied}/${patchTc.patches.length}개${failed.length ? `, 실패: ${failed.join(' | ')}` : ''}`);
          const newTitle = patchTc.title ?? prev.finalTc.title ?? prev.title;
          const patchedTc: ArtifactResult = { ...prev.finalTc, html: patchedHtml, title: newTitle };
          // savedArtifacts도 업데이트
          if (prev.artifactId) {
            setSavedArtifacts((arts) => arts.map((a) =>
              a.id === prev.artifactId ? { ...a, title: newTitle, tc: patchedTc } : a
            ));
          }
          return { ...prev, html: patchedHtml, title: newTitle, charCount: patchedHtml.length, isComplete: true, finalTc: patchedTc };
        });
      } else if (artifactPanel) {
        // 아티팩트가 없으면 패널 그대로 유지 (에러 케이스에서도 보이도록)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Chat] sendMessage 오류:', errMsg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: `오류: ${errMsg}`, error: errMsg, isLoading: false, liveToolCalls: undefined, artifactProgress: undefined }
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
          className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200"
          style={{
            width: sidebarCollapsed ? 48 : 256,
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* 사이드바 헤더 (토글 버튼) */}
          <div
            className="flex items-center px-2 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-color)', minHeight: 44 }}
          >
            {!sidebarCollapsed && (
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider px-2" style={{ color: 'var(--text-muted)' }}>
                패널
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              title={sidebarCollapsed ? '사이드바 펴기' : '사이드바 접기'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {sidebarCollapsed
                  ? <><polyline points="9 18 15 12 9 6"/></>
                  : <><polyline points="15 18 9 12 15 6"/></>
                }
              </svg>
            </button>
          </div>

          {/* 접힌 상태: 아이콘만 표시 */}
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-3">
              {hasData && (
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }} title={`${tableData.size}개 테이블`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
                </div>
              )}
              {savedArtifacts.length > 0 && (
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }} title={`${savedArtifacts.length}개 문서`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  </svg>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* 데이터 현황 */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              데이터 현황
            </div>
            {hasData ? (
              <div className="space-y-1.5">
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
                <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: '#22c55e' }}>
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

          {/* 생성된 문서 목록 */}
          {savedArtifacts.length > 0 && (
            <div className="px-3 pt-3 pb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                생성된 문서
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {savedArtifacts.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setArtifactPanel({ html: art.tc.html ?? '', title: art.title, charCount: (art.tc.html ?? '').length, isComplete: true, finalTc: art.tc, artifactId: art.id })}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left interactive group"
                    style={{ background: artifactPanel?.finalTc === art.tc ? 'rgba(99,102,241,0.15)' : 'transparent' }}
                    title={art.title}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         style={{ color: 'var(--accent)', flexShrink: 0 }}>
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="text-[11px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {art.title}
                    </span>
                    {/* 출판됨 뱃지 */}
                    {art.publishedUrl && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                           style={{ color: '#fbbf24', flexShrink: 0 }}>
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                      </svg>
                    )}
                    <span className="text-[9px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}>
                      {art.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* 하단 버튼 영역 */}
          <div className="px-3 py-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border-color)' }}>
            {messages.length > 0 && (
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
            )}
            {savedArtifacts.length > 0 && (
              <button
                onClick={() => {
                  setSavedArtifacts([]);
                  localStorage.removeItem(ARTIFACTS_CACHE_KEY);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] interactive"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                </svg>
                문서 목록 지우기
              </button>
            )}
          </div>
          </>
          )}
        </div>

        {/* ── 채팅 + 아티팩트 패널 (가변 분할) ── */}
        <div className="flex-1 flex overflow-hidden min-w-0">

        {/* ── 채팅 영역 ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto py-8">
            <div className="w-full px-8 space-y-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="text-[22px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  게임 데이터 AI 어시스턴트
                </h2>
                <p className="text-[15px] max-w-lg leading-relaxed mb-6">
                  {hasData
                    ? '게임 데이터에 대해 자유롭게 질문하세요. AI가 SQL로 데이터를 직접 조회해서 답변합니다.'
                    : 'Import 탭에서 데이터를 먼저 불러온 후 질문하세요.'}
                </p>
                {hasData && (
                  <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                    {[
                      '캐릭터 목록 보여줘',
                      '스킬 테이블 분석해줘',
                      '카야 기획서 써줘',
                      '테이블 관계도 그려줘',
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => sendMessage(hint)}
                        className="px-4 py-3 rounded-xl text-[13px] text-left transition-all hover:opacity-90"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onContinue={
                  // 마지막 assistant 메시지가 잘린 경우에만 버튼 활성화
                  msg.isTruncated && !isLoading && idx === messages.length - 1
                    ? () => sendMessage('계속해서 아티팩트를 완성해주세요. 이미 조회된 데이터를 재활용하세요.')
                    : undefined
                }
              />
            ))}

            <div ref={bottomRef} />
            </div>{/* max-w 컨테이너 닫기 */}
          </div>

          {/* 입력 영역 */}
          <div
            className="flex-shrink-0 py-4"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
          >
            <div className="w-full px-6">
              <div
                className="flex items-end gap-3 rounded-2xl px-5 py-3.5"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                  transition: 'border-color .15s, box-shadow .15s',
                }}
                onFocus={() => {}}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    hasData
                      ? '게임 데이터에 대해 무엇이든 질문하세요... (Shift+Enter: 줄바꿈)'
                      : '데이터를 먼저 Import 해주세요'
                  }
                  disabled={isLoading || !hasData}
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none outline-none leading-relaxed"
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 15,
                    minHeight: 28,
                    maxHeight: 180,
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim() || !hasData}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isLoading || !input.trim() || !hasData
                      ? 'var(--bg-hover)'
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    cursor: isLoading || !input.trim() || !hasData ? 'not-allowed' : 'pointer',
                    boxShadow: (!isLoading && input.trim() && hasData) ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  {isLoading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" style={{ color: 'var(--text-muted)' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: isLoading || !input.trim() || !hasData ? 'var(--text-muted)' : '#fff' }}>
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Claude AI · Enter로 전송 · Shift+Enter로 줄바꿈
              </div>
            </div>
          </div>
        </div>
        {/* ── 아티팩트 사이드 패널 (우측 절반) ── */}
        {artifactPanel && (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
            <ArtifactSidePanel
              html={artifactPanel.html}
              title={artifactPanel.title}
              charCount={artifactPanel.charCount}
              isComplete={artifactPanel.isComplete}
              finalTc={artifactPanel.finalTc}
              onClose={() => setArtifactPanel(null)}
              initialPublishedUrl={
                artifactPanel.artifactId
                  ? savedArtifacts.find(a => a.id === artifactPanel.artifactId)?.publishedUrl
                  : undefined
              }
              onPublished={(url) => {
                if (!artifactPanel.artifactId) return;
                setSavedArtifacts(prev =>
                  prev.map(a => a.id === artifactPanel.artifactId ? { ...a, publishedUrl: url } : a)
                );
              }}
              onEditRequest={(prompt) => {
                if (!artifactPanel.finalTc) return;
                const currentHtml = artifactPanel.finalTc.html ?? '';
                const title = artifactPanel.finalTc.title ?? '문서';
                // 스타일/스크립트 제거 → 입력 토큰 대폭 절약
                const compressedHtml = compressHtmlForEdit(currentHtml);
                // Claude에게 전달할 컨텍스트
                const fullMessage =
                  `[아티팩트 수정 요청]\n` +
                  `제목: ${title}\n\n` +
                  `현재 아티팩트 HTML (스타일/스크립트 제외):\n\`\`\`html\n${compressedHtml}\n\`\`\`\n\n` +
                  `수정 요청: ${prompt}\n\n` +
                  `⭐ 반드시 patch_artifact 툴을 사용하세요. ` +
                  `변경이 필요한 부분의 find/replace 패치만 반환하면 됩니다. HTML 전체 재생성 금지.`;
                // 채팅에는 사용자가 입력한 텍스트만 표시
                const displayText = `✏️ [${title}] ${prompt}`;
                sendMessage(fullMessage, displayText);
              }}
            />
          </div>
        )}
        </div>{/* ── /채팅+패널 래퍼 ── */}
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
