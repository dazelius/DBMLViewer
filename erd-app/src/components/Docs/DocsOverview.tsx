import { useState, useMemo, useCallback } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import type { SchemaTable, SchemaRef, ParsedSchema } from '../../core/schema/types.ts';
import { analyzeSchemaWithAI, type AIInsight } from '../../core/ai/claudeAnalyzer.ts';

interface DocsOverviewProps {
  onSelectTable: (tableId: string) => void;
}

export default function DocsOverview({ onSelectTable }: DocsOverviewProps) {
  const schema = useSchemaStore((s) => s.schema);
  if (!schema) return null;

  const { tables, refs, enums, tableGroups } = schema;
  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

  const groupedTables = new Map<string, typeof tables>();
  const ungrouped: typeof tables = [];

  for (const t of tables) {
    if (t.groupName) {
      const list = groupedTables.get(t.groupName) ?? [];
      list.push(t);
      groupedTables.set(t.groupName, list);
    } else {
      ungrouped.push(t);
    }
  }

  return (
    <div className="p-8 lg:p-10 docs-fade-in" style={{ maxWidth: 1600, margin: '0 auto' }}>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-[24px] font-bold mb-1.5 tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Database Schema
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Documentation generated from DBML definitions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginBottom: 48 }}>
        <StatCell label="Tables" value={tables.length} icon="table" color="var(--accent)" />
        <StatCell label="Columns" value={totalColumns} icon="column" color="#22c55e" />
        <StatCell label="Relationships" value={refs.length} icon="ref" color="#f59e0b" />
        <StatCell label="Enums" value={enums.length} icon="enum" color="#a78bfa" />
      </div>

      {/* Schema Insights */}
      <div style={{ paddingTop: 0, paddingBottom: 48 }}>
        <SchemaInsights schema={schema} onSelectTable={onSelectTable} />
      </div>

      {/* Data Volume Insights */}
      <DataVolumeInsights schema={schema} onSelectTable={onSelectTable} />

      {/* Groups */}
      {tableGroups.map((grp) => {
        const tblsInGroup = groupedTables.get(grp.name) ?? [];
        if (tblsInGroup.length === 0) return null;
        const color = grp.color ?? '#6c8eef';
        return (
          <section key={grp.name} style={{ paddingTop: 48, paddingBottom: 16 }}>
            <GroupHeader name={grp.name} count={tblsInGroup.length} color={color} />
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
            >
              {tblsInGroup.map((t) => (
                <TableCard key={t.id} table={t} color={color} onClick={() => onSelectTable(t.id)} refs={refs} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <section style={{ paddingTop: 48, paddingBottom: 16 }}>
          <GroupHeader name="Ungrouped Tables" count={ungrouped.length} color="#5c6078" />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {ungrouped.map((t) => (
              <TableCard key={t.id} table={t} color="#5c6078" onClick={() => onSelectTable(t.id)} refs={refs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupHeader({ name, count, color }: { name: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 0 3px ${color}20` }} />
      <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
        {name}
      </h2>
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
      >
        {count}
      </span>
    </div>
  );
}

function StatCell({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div
      className="flex items-center gap-3.5 px-5 py-4 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        {icon === 'table' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        )}
        {icon === 'column' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )}
        {icon === 'ref' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        )}
        {icon === 'enum' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        )}
      </div>
      <div>
        <div className="text-[20px] font-bold tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

function TableCard({ table, color, onClick, refs }: {
  table: SchemaTable;
  color: string;
  onClick: () => void;
  refs: SchemaRef[];
}) {
  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const relCount = refs.filter((r) => r.fromTable === table.id || r.toTable === table.id).length;
  const pkCount = table.columns.filter((c) => c.isPrimaryKey).length;
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;
  const rowCount = heatmapData.get(table.name.toLowerCase());

  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-xl text-left cursor-pointer"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '16px 18px',
        minHeight: 100,
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px -2px ${color}18, 0 0 0 1px ${color}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: icon + name */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        </div>
        <div
          className="font-bold text-[13px] leading-snug overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {table.name}
        </div>
      </div>

      {table.note && (
        <div
          className="text-[11px] leading-relaxed mb-2 overflow-hidden pl-[38px]"
          style={{
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {table.note}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-auto pt-2 flex-wrap pl-[38px]">
        <MetaTag label={`${table.columns.length} cols`} />
        {pkCount > 0 && <MetaTag label={`${pkCount} PK`} variant="warning" />}
        {fkCount > 0 && <MetaTag label={`${fkCount} FK`} variant="accent" />}
        {relCount > 0 && <MetaTag label={`${relCount} refs`} variant="ref" />}
        {rowCount !== undefined && <MetaTag label={`${rowCount.toLocaleString()} rows`} variant="rows" />}
      </div>
    </button>
  );
}

// ── Schema Insights ──────────────────────────────────────────────────────────

type InsightLevel = 'info' | 'warn' | 'success';

interface Insight {
  level: InsightLevel;
  title: string;
  problem: string;
  action: string;
  tables?: string[];
}

interface HealthScore {
  score: number;
  grade: string;
  color: string;
}

const LEVEL_SORT_ORDER: Record<InsightLevel, number> = { success: 0, info: 1, warn: 2 };


function detectNamingStyle(name: string): 'snake' | 'camel' | 'pascal' | 'other' {
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(name)) return 'snake';
  if (/^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)) return 'camel';
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'pascal';
  return 'other';
}

function detectCircularRefs(tables: SchemaTable[], refs: SchemaRef[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const r of refs) {
    if (r.fromTable === r.toTable) continue;
    if (!adj.has(r.fromTable)) adj.set(r.fromTable, []);
    adj.get(r.fromTable)!.push(r.toTable);
  }
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    if (cycles.length >= 5) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of adj.get(node) ?? []) {
      if (stack.has(next)) {
        const cycleStart = path.indexOf(next);
        if (cycleStart >= 0) cycles.push(path.slice(cycleStart));
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }
    path.pop();
    stack.delete(node);
  }

  for (const t of tables) {
    if (!visited.has(t.id)) dfs(t.id);
  }
  return cycles;
}

function longestFkChain(tables: SchemaTable[], refs: SchemaRef[]): { depth: number; chain: string[] } {
  const adj = new Map<string, string[]>();
  for (const r of refs) {
    if (r.fromTable === r.toTable) continue;
    if (!adj.has(r.fromTable)) adj.set(r.fromTable, []);
    adj.get(r.fromTable)!.push(r.toTable);
  }
  let best = { depth: 0, chain: [] as string[] };
  const memo = new Map<string, number>();

  function getDepth(node: string, visiting: Set<string>): number {
    if (visiting.has(node)) return 0;
    if (memo.has(node)) return memo.get(node)!;
    visiting.add(node);
    let max = 0;
    for (const next of adj.get(node) ?? []) {
      max = Math.max(max, 1 + getDepth(next, visiting));
    }
    visiting.delete(node);
    memo.set(node, max);
    return max;
  }

  for (const t of tables) {
    const d = getDepth(t.id, new Set());
    if (d > best.depth) {
      best.depth = d;
      const chain: string[] = [t.id];
      let cur = t.id;
      for (let i = 0; i < d; i++) {
        const nexts = adj.get(cur) ?? [];
        const nextBest = nexts.reduce((b, n) => (memo.get(n) ?? 0) > (memo.get(b) ?? 0) ? n : b, nexts[0]);
        if (nextBest) { chain.push(nextBest); cur = nextBest; }
      }
      best.chain = chain;
    }
  }
  return best;
}

function computeHealthScore(tables: SchemaTable[], insights: Insight[]): HealthScore {
  let score = 100;
  const warnCount = insights.filter((i) => i.level === 'warn').length;
  const infoCount = insights.filter((i) => i.level === 'info').length;
  score -= warnCount * 6;
  score -= infoCount * 2;

  const noPkRatio = tables.length > 0 ? tables.filter((t) => !t.columns.some((c) => c.isPrimaryKey)).length / tables.length : 0;
  if (noPkRatio > 0.3) score -= 10;
  const noteRatio = tables.length > 0 ? tables.filter((t) => t.note).length / tables.length : 1;
  score += Math.round(noteRatio * 5);
  const groupRatio = tables.length > 0 ? tables.filter((t) => t.groupName).length / tables.length : 0;
  score += Math.round(groupRatio * 3);

  score = Math.max(0, Math.min(100, score));
  let grade: string; let color: string;
  if (score >= 90) { grade = 'A'; color = 'var(--success)'; }
  else if (score >= 75) { grade = 'B'; color = '#22c55e'; }
  else if (score >= 60) { grade = 'C'; color = '#f59e0b'; }
  else if (score >= 40) { grade = 'D'; color = '#f97316'; }
  else { grade = 'F'; color = '#ef4444'; }
  return { score, grade, color };
}

function analyzeSchema(schema: ParsedSchema): { insights: Insight[]; health: HealthScore } {
  const { tables, refs, enums } = schema;
  const insights: Insight[] = [];
  const tblById = new Map(tables.map((t) => [t.id, t]));

  // ── WARN: PK 없는 테이블 ──
  const noPk = tables.filter((t) => !t.columns.some((c) => c.isPrimaryKey));
  if (noPk.length > 0) {
    insights.push({
      level: 'warn',
      title: `PK 없는 테이블 ${noPk.length}개`,
      problem: '행을 고유하게 식별할 수 없어 조인 및 인덱싱이 어렵고, ORM/프레임워크에서 오류가 발생할 수 있습니다.',
      action: '각 테이블에 AUTO_INCREMENT ID 또는 복합키(Composite Key)를 추가하세요.',
      tables: noPk.map((t) => t.name),
    });
  }

  // ── WARN: Wide Table (30+ cols) ──
  const wide = tables.filter((t) => t.columns.length > 30);
  if (wide.length > 0) {
    insights.push({
      level: 'warn',
      title: `컬럼 30개 초과 ${wide.length}개 (Wide Table)`,
      problem: '한 테이블에 너무 많은 컬럼이 몰려 있으면 쿼리 성능 저하, 캐시 효율 하락, 유지보수 난이도가 증가합니다.',
      action: '성격이 다른 컬럼 그룹을 별도 테이블로 분리(정규화)하거나, 1:1 확장 테이블 패턴을 적용하세요.',
      tables: wide.map((t) => `${t.name} (${t.columns.length}cols)`),
    });
  }

  // ── WARN: 순환 참조 ──
  const cycles = detectCircularRefs(tables, refs);
  if (cycles.length > 0) {
    insights.push({
      level: 'warn',
      title: `순환 참조(Circular Reference) ${cycles.length}건 감지`,
      problem: 'A→B→C→A 같은 FK 사이클이 존재하면 마이그레이션 순서 충돌, 삭제 불가, 데드락 위험이 발생합니다.',
      action: '사이클 중 하나의 FK를 제거하거나, 논리적 참조(Application-level)로 전환하세요.',
      tables: cycles.map((c) => c.map((id) => tblById.get(id)?.name ?? id).join(' → ')),
    });
  }

  // ── WARN: NOT NULL + DEFAULT 미설정 ──
  const noDefaultTables: string[] = [];
  for (const t of tables) {
    const badCols = t.columns.filter((c) => c.isNotNull && !c.defaultValue && !c.isPrimaryKey && !c.isIncrement);
    if (badCols.length >= 5) noDefaultTables.push(`${t.name} (${badCols.length}cols)`);
  }
  if (noDefaultTables.length > 0) {
    insights.push({
      level: 'warn',
      title: `NOT NULL인데 DEFAULT 없는 컬럼이 많은 테이블 ${noDefaultTables.length}개`,
      problem: 'NOT NULL 제약이 있지만 DEFAULT가 없으면 INSERT 시 반드시 값을 제공해야 하며, 누락 시 에러가 발생합니다.',
      action: '합리적인 기본값을 설정하거나, 실제로 필수 입력인지 검토하세요.',
      tables: noDefaultTables,
    });
  }

  // ── INFO: 높은 결합도 ──
  const fkCounts = new Map<string, number>();
  for (const r of refs) {
    fkCounts.set(r.fromTable, (fkCounts.get(r.fromTable) ?? 0) + 1);
  }
  const highCoupling = tables.filter((t) => (fkCounts.get(t.id) ?? 0) >= 8);
  if (highCoupling.length > 0) {
    insights.push({
      level: 'info',
      title: `높은 결합도 테이블 ${highCoupling.length}개 (FK 8개+)`,
      problem: '하나의 테이블이 8개 이상의 테이블을 참조하면, 변경 시 연쇄 영향이 크고 마이그레이션이 복잡해집니다.',
      action: '중간 매핑 테이블 도입 또는 도메인 경계를 기준으로 테이블을 분리하세요.',
      tables: highCoupling.map((t) => `${t.name} (${fkCounts.get(t.id)} FK)`),
    });
  }

  // ── INFO: 허브 테이블 ──
  const inCounts = new Map<string, number>();
  for (const r of refs) {
    inCounts.set(r.toTable, (inCounts.get(r.toTable) ?? 0) + 1);
  }
  const hubs = tables.filter((t) => (inCounts.get(t.id) ?? 0) >= 10);
  if (hubs.length > 0) {
    insights.push({
      level: 'info',
      title: `허브 테이블 ${hubs.length}개 (10개+ 테이블에서 참조)`,
      problem: '매우 많은 테이블이 의존하고 있어, 이 테이블의 스키마 변경 시 광범위한 영향이 발생합니다.',
      action: '변경 전 영향 범위를 분석하고, 관련 팀에 사전 공유하세요.',
      tables: hubs.map((t) => `${t.name} (${inCounts.get(t.id)} refs)`),
    });
  }

  // ── INFO: Self-referencing 테이블 ──
  const selfRefs = refs.filter((r) => r.fromTable === r.toTable);
  if (selfRefs.length > 0) {
    const selfRefTableNames = [...new Set(selfRefs.map((r) => tblById.get(r.fromTable)?.name ?? r.fromTable))];
    insights.push({
      level: 'info',
      title: `자기 참조 테이블 ${selfRefTableNames.length}개`,
      problem: '자기 자신을 FK로 참조하는 재귀 구조는 트리/계층 데이터를 표현하지만, 무한 루프 쿼리 위험이 있습니다.',
      action: 'CTE(WITH RECURSIVE) 또는 Closure Table 패턴을 적용하고, 최대 깊이 제한을 설정하세요.',
      tables: selfRefTableNames,
    });
  }



  // ── INFO: FK 체인 깊이 ──
  if (refs.length > 0) {
    const chain = longestFkChain(tables, refs);
    if (chain.depth >= 5) {
      insights.push({
        level: 'info',
        title: `최대 FK 체인 깊이 ${chain.depth}단계`,
        problem: `의존 체인이 ${chain.depth}단계 깊어 하위 테이블 변경 시 상위까지 연쇄 영향이 전파됩니다.`,
        action: '깊은 의존 체인의 중간 테이블을 비정규화하거나, 이벤트 기반 느슨한 결합으로 전환을 검토하세요.',
        tables: [chain.chain.map((id) => tblById.get(id)?.name ?? id).join(' → ')],
      });
    }
  }

  // ── INFO: 컬럼 수가 너무 적은 테이블 ──
  const tiny = tables.filter((t) => t.columns.length <= 2 && t.columns.length > 0);
  if (tiny.length > 0) {
    insights.push({
      level: 'info',
      title: `컬럼 2개 이하 테이블 ${tiny.length}개`,
      problem: '컬럼이 1~2개인 테이블은 단독 존재 이유가 약하거나, 다른 테이블에 병합 가능한 경우가 있습니다.',
      action: 'Enum으로 대체 가능한지, 또는 부모 테이블에 컬럼으로 통합 가능한지 검토하세요.',
      tables: tiny.map((t) => `${t.name} (${t.columns.length}cols)`),
    });
  }

  // ── INFO: 중복 인덱스 감지 ──
  const dupIdxTables: string[] = [];
  for (const t of tables) {
    if (t.indexes.length < 2) continue;
    const idxSigs = t.indexes.map((idx) => idx.columns.map((c) => c.toLowerCase()).join(','));
    const seen = new Set<string>();
    for (const sig of idxSigs) {
      if (seen.has(sig)) { dupIdxTables.push(t.name); break; }
      seen.add(sig);
    }
  }
  if (dupIdxTables.length > 0) {
    insights.push({
      level: 'info',
      title: `중복 인덱스가 있는 테이블 ${dupIdxTables.length}개`,
      problem: '동일한 컬럼 조합에 인덱스가 중복 정의되면 쓰기 성능이 저하되고 저장 공간이 낭비됩니다.',
      action: '중복된 인덱스를 제거하고 하나로 통합하세요.',
      tables: dupIdxTables,
    });
  }

  // ── INFO: Note/Description 누락 ──
  const noNote = tables.filter((t) => !t.note);
  const noteRatio = tables.length > 0 ? ((tables.length - noNote.length) / tables.length * 100) : 100;
  if (noNote.length > 0 && noteRatio < 50) {
    insights.push({
      level: 'info',
      title: `테이블 설명 작성률 ${noteRatio.toFixed(0)}%`,
      problem: `${noNote.length}개 테이블에 설명(Note)이 없어 신규 팀원이나 타 팀이 테이블 용도를 파악하기 어렵습니다.`,
      action: '주요 테이블부터 DBML의 note 필드에 한 줄 설명을 추가하세요.',
    });
  }

  // ── INFO: 컬럼 레벨 Note 커버리지 ──
  const totalCols = tables.reduce((s, t) => s + t.columns.length, 0);
  const notedCols = tables.reduce((s, t) => s + t.columns.filter((c) => c.note).length, 0);
  const colNoteRatio = totalCols > 0 ? Math.round((notedCols / totalCols) * 100) : 100;
  if (colNoteRatio < 30 && totalCols > 20) {
    insights.push({
      level: 'info',
      title: `컬럼 설명 작성률 ${colNoteRatio}% (${notedCols}/${totalCols})`,
      problem: '대부분의 컬럼에 설명이 없어 컬럼의 의미나 허용 값을 파악하기 어렵습니다.',
      action: '최소한 FK 컬럼과 비즈니스 로직이 담긴 컬럼부터 note를 작성하세요.',
    });
  }

  // ── INFO: PK도 없고 인덱스도 없는 테이블 ──
  const noIdx = tables.filter((t) =>
    t.indexes.length === 0 &&
    !t.columns.some((c) => c.isPrimaryKey) &&
    t.columns.length >= 5
  );
  if (noIdx.length > 0) {
    insights.push({
      level: 'info',
      title: `PK·인덱스 모두 없는 테이블 ${noIdx.length}개 (5컬럼 이상)`,
      problem: 'PK도 별도 인덱스도 없어 모든 조회가 Full Table Scan으로 동작하며, 행 식별 수단이 전혀 없습니다.',
      action: 'PK를 추가하거나, 자주 조회하는 컬럼에 INDEX를 정의하세요.',
      tables: noIdx.length <= 20 ? noIdx.map((t) => t.name) : undefined,
    });
  }

  // ── INFO: 그룹 미지정 ──
  const ungrouped = tables.filter((t) => !t.groupName);
  if (ungrouped.length > 0 && tables.length > 10) {
    insights.push({
      level: 'info',
      title: `그룹 미지정 테이블 ${ungrouped.length}개`,
      problem: '그룹 없이 나열된 테이블은 도메인 파악이 어렵고 ERD 가독성이 떨어집니다.',
      action: 'DBML의 TableGroup 문법으로 도메인별(예: User, Game, Payment) 그룹을 지정하세요.',
    });
  }

  // ── INFO: 네이밍 컨벤션 일관성 ──
  const styleCount: Record<string, number> = { snake: 0, camel: 0, pascal: 0, other: 0 };
  for (const t of tables) {
    styleCount[detectNamingStyle(t.name)]++;
  }
  const dominant = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0];
  const mixedStyles = Object.entries(styleCount).filter(([k, v]) => v > 0 && k !== dominant[0] && k !== 'other');
  if (mixedStyles.length > 0 && tables.length >= 5) {
    const styleNames: Record<string, string> = { snake: 'snake_case', camel: 'camelCase', pascal: 'PascalCase', other: '기타' };
    const breakdown = Object.entries(styleCount).filter(([, v]) => v > 0).map(([k, v]) => `${styleNames[k]} ${v}개`).join(', ');
    insights.push({
      level: 'info',
      title: `테이블 네이밍 컨벤션 혼용 감지`,
      problem: `여러 네이밍 스타일이 혼재되어 있습니다: ${breakdown}. 일관성 없는 네이밍은 혼란을 유발합니다.`,
      action: `주요 컨벤션(${styleNames[dominant[0]]})으로 통일하세요. DB에서는 일반적으로 snake_case가 권장됩니다.`,
    });
  }

  // ── INFO: 컬럼 타입 불일치 ──
  const colTypeMap = new Map<string, Map<string, string[]>>();
  for (const t of tables) {
    for (const c of t.columns) {
      const key = c.name.toLowerCase();
      if (!colTypeMap.has(key)) colTypeMap.set(key, new Map());
      const typeMap = colTypeMap.get(key)!;
      const typeLower = c.type.toLowerCase();
      if (!typeMap.has(typeLower)) typeMap.set(typeLower, []);
      typeMap.get(typeLower)!.push(t.name);
    }
  }
  const inconsistent: string[] = [];
  for (const [colName, typeMap] of colTypeMap) {
    if (typeMap.size > 1) {
      const totalTables = [...typeMap.values()].reduce((s, arr) => s + arr.length, 0);
      if (totalTables >= 3) {
        const types = [...typeMap.keys()].join(' / ');
        inconsistent.push(`${colName} → ${types}`);
      }
    }
  }
  if (inconsistent.length > 0) {
    insights.push({
      level: 'info',
      title: `동일 컬럼명에 타입 불일치 ${inconsistent.length}건`,
      problem: '같은 이름의 컬럼이 테이블마다 다른 타입으로 정의되면 JOIN 시 암시적 형변환이 발생하고, 버그 원인이 됩니다.',
      action: '동일 개념의 컬럼은 타입을 통일하세요. (예: user_id는 모든 테이블에서 int)',
      tables: inconsistent.slice(0, 15),
    });
  }

  // ── INFO: 미사용 Enum ──
  if (enums.length > 0) {
    const allColTypes = new Set<string>();
    for (const t of tables) {
      for (const c of t.columns) allColTypes.add(c.type.toLowerCase());
    }
    const unusedEnums = enums.filter((e) => !allColTypes.has(e.name.toLowerCase()));
    if (unusedEnums.length > 0) {
      insights.push({
        level: 'info',
        title: `사용되지 않는 Enum ${unusedEnums.length}개`,
        problem: '정의되어 있지만 어떤 컬럼에서도 참조하지 않는 Enum은 불필요한 스키마 복잡도를 유발합니다.',
        action: '실제 사용하지 않는 Enum은 제거하거나, 해당 컬럼 타입을 Enum으로 변경하세요.',
        tables: unusedEnums.map((e) => e.name),
      });
    }
  }

  // ── INFO: Enum 값 이상 (1개 또는 50+) ──
  if (enums.length > 0) {
    const singleVal = enums.filter((e) => e.values.length <= 1);
    const hugeVal = enums.filter((e) => e.values.length >= 50);
    if (singleVal.length > 0) {
      insights.push({
        level: 'info',
        title: `값이 1개 이하인 Enum ${singleVal.length}개`,
        problem: '값이 하나뿐인 Enum은 타입 제약으로서의 의미가 없고, 불필요한 복잡도를 추가합니다.',
        action: '값을 추가하거나, 해당 Enum을 제거하고 일반 타입으로 변경하세요.',
        tables: singleVal.map((e) => `${e.name} (${e.values.length}값)`),
      });
    }
    if (hugeVal.length > 0) {
      insights.push({
        level: 'info',
        title: `값이 50개 이상인 Enum ${hugeVal.length}개`,
        problem: '지나치게 많은 Enum 값은 코드 관리가 어렵고, 별도 참조 테이블이 더 적합할 수 있습니다.',
        action: '별도 Lookup/참조 테이블로 전환을 고려하세요.',
        tables: hugeVal.map((e) => `${e.name} (${e.values.length}값)`),
      });
    }
  }

  // ── SUCCESS: 테이블 설명 작성률 우수 ──
  if (noteRatio >= 80) {
    insights.push({
      level: 'success',
      title: `테이블 설명 작성률 ${noteRatio.toFixed(0)}%`,
      problem: '',
      action: '대부분의 테이블에 설명이 작성되어 있어 문서화 수준이 우수합니다.',
    });
  }

  // ── SUCCESS: 컬럼 설명 우수 ──
  if (colNoteRatio >= 60 && totalCols > 20) {
    insights.push({
      level: 'success',
      title: `컬럼 설명 작성률 ${colNoteRatio}%`,
      problem: '',
      action: '컬럼 수준의 문서화가 잘 되어 있어 스키마 이해도가 높습니다.',
    });
  }

  // ── SUCCESS: 그룹 사용 우수 ──
  const groupedRatio = tables.length > 0 ? ((tables.length - ungrouped.length) / tables.length * 100) : 0;
  if (groupedRatio >= 80 && tables.length > 5) {
    insights.push({
      level: 'success',
      title: `테이블 그룹 지정률 ${groupedRatio.toFixed(0)}%`,
      problem: '',
      action: '대부분의 테이블이 그룹에 포함되어 있어 도메인별 탐색이 용이합니다.',
    });
  }

  // ── SUCCESS: 전체 PK 완비 ──
  if (noPk.length === 0 && tables.length > 0) {
    insights.push({
      level: 'success',
      title: `모든 테이블에 PK 정의됨`,
      problem: '',
      action: '모든 테이블이 PK를 가지고 있어 행 식별 및 인덱싱이 정상적으로 동작합니다.',
    });
  }

  // ── SUCCESS: 구조적 이슈 없음 ──
  if (insights.filter((i) => i.level === 'warn').length === 0) {
    insights.push({
      level: 'success',
      title: '심각한 구조적 경고 없음',
      problem: '',
      action: '전반적으로 양호한 스키마입니다. 지속적으로 문서화와 정규화 수준을 유지하세요.',
    });
  }

  insights.sort((a, b) => LEVEL_SORT_ORDER[a.level] - LEVEL_SORT_ORDER[b.level]);
  const health = computeHealthScore(tables, insights);
  return { insights, health };
}

function HealthScoreBadge({ health }: { health: HealthScore }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div
        className="flex items-center justify-center rounded-lg font-black text-[14px] leading-none"
        style={{
          width: 36, height: 36,
          background: `${health.color}15`,
          color: health.color,
          border: `2px solid ${health.color}40`,
        }}
      >
        {health.grade}
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-bold tabular-nums leading-tight" style={{ color: health.color }}>
          {health.score}
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function SchemaInsights({ schema, onSelectTable }: { schema: ParsedSchema; onSelectTable: (tableId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { insights, health } = useMemo(() => analyzeSchema(schema), [schema]);
  const [aiInsights, setAiInsights] = useState<AIInsight[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const warnCount = insights.filter((i) => i.level === 'warn').length;
  const infoCount = insights.filter((i) => i.level === 'info').length;
  const successCount = insights.filter((i) => i.level === 'success').length;

  const handleAIAnalyze = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeSchemaWithAI(schema);
      setAiInsights(result);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  }, [schema]);

  return (
    <div
      className="rounded-xl"
      style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-4 w-full px-5 py-4 cursor-pointer text-left"
        style={{ transition: 'background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <HealthScoreBadge health={health} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Schema Insights
            </h3>
            <div className="flex items-center gap-1.5">
              {successCount > 0 && (
                <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                  {successCount} GOOD
                </span>
              )}
              {infoCount > 0 && (
                <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  {infoCount} INFO
                </span>
              )}
              {warnCount > 0 && (
                <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
                  {warnCount} WARN
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {insights.length}개 항목 분석 완료 — 클릭하여 상세 보기
          </p>
        </div>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: expanded ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body */}
      {expanded && (
        <div
          className="flex flex-col gap-2.5 px-5 pb-5 pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} tables={schema.tables} onSelectTable={onSelectTable} />
          ))}

          {/* AI Analysis Section */}
          <div style={{ marginTop: 8 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                AI Analysis
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            </div>

            {!aiInsights && !aiLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAIAnalyze(); }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #6c8eef15, #a78bfa15)',
                  border: '1px dashed var(--border-color)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a78bfa';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6c8eef25, #a78bfa25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6c8eef15, #a78bfa15)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                  <circle cx="12" cy="14" r="1" fill="#a78bfa" />
                  <circle cx="8" cy="11" r="1" fill="#a78bfa" />
                  <circle cx="16" cy="11" r="1" fill="#a78bfa" />
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: '#a78bfa' }}>
                  AI로 스키마 심층 분석하기
                </span>
              </button>
            )}

            {aiLoading && (
              <div className="flex items-center justify-center gap-2 py-6">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    border: '2px solid var(--border-color)',
                    borderTopColor: '#a78bfa',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Claude가 스키마를 분석하고 있습니다...
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {aiError && (
              <div className="rounded-lg px-4 py-3" style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>분석 실패</span>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{aiError}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAIAnalyze(); }}
                  className="text-[10px] font-semibold mt-2 cursor-pointer"
                  style={{ color: '#a78bfa' }}
                >
                  다시 시도
                </button>
              </div>
            )}

            {aiInsights && (
              <div className="flex flex-col gap-2">
                {aiInsights.map((ai, idx) => (
                  <AIInsightCard key={idx} insight={ai} />
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); handleAIAnalyze(); }}
                  className="text-[10px] font-semibold cursor-pointer mt-1 self-center"
                  style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  다시 분석하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const AI_SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  good: { color: 'var(--success)', bg: 'var(--success-muted)', label: 'GOOD' },
  advice: { color: '#a78bfa', bg: '#a78bfa18', label: 'ADVICE' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-muted)', label: 'WARN' },
};

function AIInsightCard({ insight }: { insight: AIInsight }) {
  const [open, setOpen] = useState(false);
  const cfg = AI_SEVERITY_CONFIG[insight.severity] ?? AI_SEVERITY_CONFIG.advice;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer"
        style={{ transition: 'background 0.12s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
          <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
          <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
        </svg>
        <span
          className="text-[8px] font-bold px-1.5 py-[2.5px] rounded tracking-wider flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color, minWidth: 38, textAlign: 'center' }}
        >
          {cfg.label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          {insight.category}
        </span>
        <span className="text-[12px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>
          {insight.title}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: open ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
            opacity: 0.5,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-[11.5px] leading-[1.7] pt-3" style={{ color: 'var(--text-secondary)' }}>
            {insight.description}
          </p>
        </div>
      )}
    </div>
  );
}

const LEVEL_CONFIG: Record<InsightLevel, { color: string; bg: string; label: string; borderColor: string }> = {
  warn: { color: 'var(--warning)', bg: 'var(--warning-muted)', label: 'WARN', borderColor: '#f59e0b30' },
  info: { color: 'var(--accent)', bg: 'var(--accent-muted)', label: 'INFO', borderColor: 'var(--border-color)' },
  success: { color: 'var(--success)', bg: 'var(--success-muted)', label: 'GOOD', borderColor: '#22c55e30' },
};

function InsightCard({ insight, tables, onSelectTable }: {
  insight: Insight;
  tables: SchemaTable[];
  onSelectTable: (tableId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[insight.level];
  const hasTables = insight.tables && insight.tables.length > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${cfg.borderColor}`,
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer"
        style={{ transition: 'background 0.12s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span
          className="text-[8px] font-bold px-1.5 py-[2.5px] rounded tracking-wider flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color, minWidth: 38, textAlign: 'center' }}
        >
          {cfg.label}
        </span>
        <span className="text-[12px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>
          {insight.title}
        </span>
        {hasTables && (
          <span
            className="text-[9px] font-bold px-1.5 py-[2px] rounded tabular-nums flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {insight.tables!.length}
          </span>
        )}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: open ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
            opacity: 0.5,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex flex-col gap-3 pt-3">
            {/* Problem */}
            {insight.problem && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-[2px]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                    Why — 문제점
                  </div>
                  <p className="text-[11.5px] leading-[1.6]" style={{ color: 'var(--text-secondary)' }}>
                    {insight.problem}
                  </p>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 mt-[2px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cfg.color, opacity: 0.8 }}>
                  How — 권장 조치
                </div>
                <p className="text-[11.5px] leading-[1.6] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {insight.action}
                </p>
              </div>
            </div>

            {/* Affected tables */}
            {hasTables && (
              <div style={{ marginTop: 4 }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  해당 테이블
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {insight.tables!.map((name, i) => {
                    const pureName = name.replace(/\s*\(.*\)$/, '');
                    const tbl = tables.find((t) => t.name === pureName);
                    return (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-[3px] rounded-md"
                        style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          fontFamily: 'var(--font-mono)',
                          cursor: tbl ? 'pointer' : 'default',
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onClick={() => { if (tbl) onSelectTable(tbl.id); }}
                        onMouseEnter={(e) => { if (tbl) { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Data Volume Insights ─────────────────── */

interface VolumeStats {
  totalRows: number;
  totalCells: number;
  matchedCount: number;
  schemaCount: number;
  coverage: number;
  avgRows: number;
  medianRows: number;
  maxRows: number;
  skewRatio: number;
  topTables: { name: string; group: string | null; rows: number; cols: number; refs: number }[];
  groupDist: { name: string; color: string; rows: number; tableCount: number }[];
  hotspots: { name: string; rows: number; refs: number; score: number }[];
  emptyTables: string[];
  paretoTop20Pct: number;
}

function analyzeDataVolume(schema: ParsedSchema, heatmap: Map<string, number>): VolumeStats | null {
  if (heatmap.size === 0) return null;

  const { tables, refs, tableGroups } = schema;

  const tableGroupMap = new Map<string, string>();
  const tableGroupColor = new Map<string, string>();
  for (const g of tableGroups) {
    for (const tid of g.tables) {
      tableGroupMap.set(tid, g.name);
      tableGroupColor.set(g.name, g.color ?? '#6c8eef');
    }
  }

  const refCountMap = new Map<string, number>();
  for (const r of refs) {
    refCountMap.set(r.fromTable, (refCountMap.get(r.fromTable) ?? 0) + 1);
    refCountMap.set(r.toTable, (refCountMap.get(r.toTable) ?? 0) + 1);
  }

  const matched: { name: string; group: string | null; rows: number; cols: number; refs: number }[] = [];
  const emptyTables: string[] = [];

  for (const t of tables) {
    const rc = heatmap.get(t.name.toLowerCase());
    if (rc !== undefined && rc > 0) {
      matched.push({
        name: t.name,
        group: t.groupName ?? null,
        rows: rc,
        cols: t.columns.length,
        refs: refCountMap.get(t.id) ?? 0,
      });
    } else {
      emptyTables.push(t.name);
    }
  }

  if (matched.length === 0) return null;

  const sortedRows = matched.map((m) => m.rows).sort((a, b) => a - b);
  const totalRows = sortedRows.reduce((a, b) => a + b, 0);
  const medianRows = sortedRows[Math.floor(sortedRows.length / 2)];
  const maxRows = sortedRows[sortedRows.length - 1];
  const totalCells = matched.reduce((s, m) => s + m.rows * m.cols, 0);

  const topTables = [...matched].sort((a, b) => b.rows - a.rows).slice(0, 10);

  // Pareto: top 20% tables hold X% of data
  const sortedDesc = [...matched].sort((a, b) => b.rows - a.rows);
  const top20Count = Math.max(1, Math.ceil(matched.length * 0.2));
  const top20Rows = sortedDesc.slice(0, top20Count).reduce((s, m) => s + m.rows, 0);
  const paretoTop20Pct = totalRows > 0 ? Math.round((top20Rows / totalRows) * 100) : 0;

  // Group distribution
  const groupRowMap = new Map<string, { rows: number; count: number }>();
  let ungroupedRows = 0;
  let ungroupedCount = 0;
  for (const m of matched) {
    if (m.group) {
      const cur = groupRowMap.get(m.group) ?? { rows: 0, count: 0 };
      cur.rows += m.rows;
      cur.count += 1;
      groupRowMap.set(m.group, cur);
    } else {
      ungroupedRows += m.rows;
      ungroupedCount++;
    }
  }
  const groupDist: VolumeStats['groupDist'] = [];
  for (const [name, data] of groupRowMap) {
    groupDist.push({ name, color: tableGroupColor.get(name) ?? '#6c8eef', rows: data.rows, tableCount: data.count });
  }
  if (ungroupedCount > 0) {
    groupDist.push({ name: 'Ungrouped', color: '#5c6078', rows: ungroupedRows, tableCount: ungroupedCount });
  }
  groupDist.sort((a, b) => b.rows - a.rows);

  // Hotspots: high rows AND high refs
  const hotspots = matched
    .filter((m) => m.refs >= 3 && m.rows >= 20)
    .map((m) => ({ name: m.name, rows: m.rows, refs: m.refs, score: m.rows * m.refs }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    totalRows,
    totalCells,
    matchedCount: matched.length,
    schemaCount: tables.length,
    coverage: Math.round((matched.length / tables.length) * 100),
    avgRows: Math.round(totalRows / matched.length),
    medianRows,
    maxRows,
    skewRatio: medianRows > 0 ? Math.round(maxRows / medianRows) : maxRows,
    topTables,
    groupDist,
    hotspots,
    emptyTables,
    paretoTop20Pct,
  };
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function DataVolumeInsights({ schema, onSelectTable }: { schema: ParsedSchema; onSelectTable: (tableId: string) => void }) {
  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => analyzeDataVolume(schema, heatmapData), [schema, heatmapData]);

  if (!stats) return null;

  const coverageColor = stats.coverage >= 80 ? '#22c55e' : stats.coverage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="rounded-xl"
      style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        marginBottom: 48,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-4 w-full px-5 py-4 cursor-pointer text-left"
        style={{ transition: 'background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #ef4444 100%)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Data Volume Insights
            </h3>
            <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              {formatNum(stats.totalRows)} ROWS
            </span>
            <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider" style={{ background: 'rgba(34,197,94,0.1)', color: coverageColor }}>
              {stats.coverage}% COVERAGE
            </span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {stats.matchedCount}개 테이블의 데이터 규모 분석 — 클릭하여 상세 보기
          </p>
        </div>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: expanded ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-5">
            <VolumeStat label="Total Rows" value={formatNum(stats.totalRows)} sub="전체 데이터 행 수" color="#3b82f6" />
            <VolumeStat label="Total Cells" value={formatNum(stats.totalCells)} sub="rows × columns" color="#8b5cf6" />
            <VolumeStat label="Avg / Table" value={formatNum(stats.avgRows)} sub={`중앙값 ${formatNum(stats.medianRows)}`} color="#22c55e" />
            <VolumeStat label="Skew Ratio" value={`${stats.skewRatio}x`} sub="최대 / 중앙값 편중도" color={stats.skewRatio > 20 ? '#f59e0b' : '#22c55e'} />
          </div>

          {/* Pareto insight */}
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-center gap-3"
            style={{
              background: stats.paretoTop20Pct >= 80 ? 'rgba(249,115,22,0.06)' : 'rgba(59,130,246,0.06)',
              border: `1px solid ${stats.paretoTop20Pct >= 80 ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.12)'}`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stats.paretoTop20Pct >= 80 ? '#f97316' : '#3b82f6'} strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <span className="text-[11px] font-bold" style={{ color: stats.paretoTop20Pct >= 80 ? '#f97316' : '#3b82f6' }}>
                상위 20% 테이블이 전체 데이터의 {stats.paretoTop20Pct}%를 보유
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {stats.paretoTop20Pct >= 80
                  ? '데이터가 소수 테이블에 집중되어 있습니다. 해당 테이블의 성능 최적화를 우선 검토하세요.'
                  : '데이터가 비교적 고르게 분포되어 있습니다.'}
              </p>
            </div>
          </div>

          {/* Top Heavy Tables */}
          <div className="mb-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Top Heavy Tables
            </h4>
            <div className="flex flex-col gap-1.5">
              {stats.topTables.map((t) => {
                const pct = stats.maxRows > 0 ? (t.rows / stats.maxRows) * 100 : 0;
                const tbl = schema.tables.find((st) => st.name === t.name);
                return (
                  <div
                    key={t.name}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 interactive"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: tbl ? 'pointer' : 'default' }}
                    onClick={() => { if (tbl) onSelectTable(tbl.id); }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', width: 160, flexShrink: 0 }}>
                      {t.name}
                    </span>
                    {t.group && (
                      <span className="text-[9px] font-medium px-1.5 py-[1px] rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {t.group}
                      </span>
                    )}
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)', minWidth: 60 }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(3, pct)}%`,
                          background: `linear-gradient(90deg, #3b82f6, ${pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e'})`,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 48, textAlign: 'right' }}>
                      {formatNum(t.rows)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Distribution */}
          {stats.groupDist.length > 1 && (
            <div className="mb-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Group Data Distribution
              </h4>
              {/* Stacked bar */}
              <div className="flex h-4 rounded-full overflow-hidden mb-3" style={{ background: 'var(--bg-surface)' }}>
                {stats.groupDist.map((g) => {
                  const pct = stats.totalRows > 0 ? (g.rows / stats.totalRows) * 100 : 0;
                  if (pct < 1) return null;
                  return (
                    <div
                      key={g.name}
                      title={`${g.name}: ${formatNum(g.rows)} rows (${Math.round(pct)}%)`}
                      style={{ width: `${pct}%`, background: g.color, opacity: 0.7, transition: 'width 0.4s' }}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stats.groupDist.map((g) => {
                  const pct = stats.totalRows > 0 ? Math.round((g.rows / stats.totalRows) * 100) : 0;
                  return (
                    <div key={g.name} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.name}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{g.tableCount} tables</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatNum(g.rows)}</div>
                        <div className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Hotspots */}
          {stats.hotspots.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Data Hotspots
                <span className="ml-2 text-[8px] font-bold px-1.5 py-[2px] rounded" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
                  JOIN 복잡도 주의
                </span>
              </h4>
              <div className="flex flex-col gap-1.5">
                {stats.hotspots.map((h) => {
                  const tbl = schema.tables.find((st) => st.name === h.name);
                  return (
                    <div
                      key={h.name}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 interactive"
                      style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)', cursor: tbl ? 'pointer' : 'default' }}
                      onClick={() => { if (tbl) onSelectTable(tbl.id); }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f97316'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.12)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 140 }}>
                        {h.name}
                      </span>
                      <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatNum(h.rows)} rows
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>×</span>
                      <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {h.refs} FK refs
                      </span>
                      <span className="text-[10px] font-bold tabular-nums ml-auto" style={{ color: '#f97316' }}>
                        score {formatNum(h.score)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Tables */}
          {stats.emptyTables.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Empty Tables
                <span className="ml-2 text-[8px] font-bold px-1.5 py-[2px] rounded" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  {stats.emptyTables.length} tables
                </span>
              </h4>
              <p className="text-[10px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
                스키마에 정의되었지만 데이터가 없는 테이블입니다. 데이터 시트가 누락되었거나, 아직 데이터가 입력되지 않았을 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stats.emptyTables.map((name) => {
                  const tbl = schema.tables.find((t) => t.name === name);
                  return (
                    <span
                      key={name}
                      className="text-[10px] font-medium px-2 py-[3px] rounded-md interactive"
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        fontFamily: 'var(--font-mono)',
                        cursor: tbl ? 'pointer' : 'default',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onClick={() => { if (tbl) onSelectTable(tbl.id); }}
                      onMouseEnter={(e) => { if (tbl) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VolumeStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      className="rounded-lg px-3 py-3 text-center"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
    >
      <div className="text-[18px] font-bold tabular-nums" style={{ color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-primary)' }}>{label}</div>
      <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function MetaTag({ label, variant }: { label: string; variant?: 'accent' | 'warning' | 'ref' | 'rows' }) {
  let bg = 'var(--bg-surface)';
  let fg = 'var(--text-muted)';

  if (variant === 'accent') {
    bg = 'var(--accent-muted)';
    fg = 'var(--accent)';
  } else if (variant === 'warning') {
    bg = 'var(--warning-muted)';
    fg = 'var(--warning)';
  } else if (variant === 'rows') {
    bg = 'rgba(59,130,246,0.08)';
    fg = '#3b82f6';
  } else if (variant === 'ref') {
    bg = 'var(--bg-surface)';
    fg = 'var(--text-muted)';
  }

  return (
    <span
      className="text-[9px] font-bold px-1.5 py-[3px] rounded-md tracking-wide"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}
