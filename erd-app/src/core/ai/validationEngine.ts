import type { TableDataMap } from '../query/schemaQueryEngine.ts';

// ── 룰 타입 정의 ─────────────────────────────────────────────────────────────

export type RuleCondition =
  | { type: 'range'; column: string; min?: number; max?: number }
  | { type: 'not_null'; column: string }
  | { type: 'in'; column: string; values: string[] }
  | { type: 'not_in'; column: string; values: string[] }
  | { type: 'regex'; column: string; pattern: string }
  | { type: 'compare_columns'; left: string; op: '<' | '<=' | '==' | '!=' | '>=' | '>'; right: string }
  | { type: 'conditional'; when: { column: string; op: string; value: string }; then: { column: string; op: string; value: string } }
  | { type: 'unique'; column: string }
  | { type: 'expression'; expr: string };

export interface ValidationRule {
  id: string;
  name: string;
  table: string;
  severity: 'error' | 'warning';
  condition: RuleCondition;
  enabled: boolean;
  scope: 'team' | 'personal';
  createdAt: number;
  updatedAt: number;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  table: string;
  severity: 'error' | 'warning';
  rowId: string;
  details: string;
}

export interface ValidationResult {
  timestamp: number;
  totalRules: number;
  checkedRules: number;
  violations: RuleViolation[];
  durationMs: number;
}

// ── 서버 API 기반 룰 관리 (Git 공유) + 로컬 캐시 ────────────────────────────

let _rulesCache: ValidationRule[] | null = null;

/** 서버에서 룰 로드 (캐시 있으면 캐시 반환) */
export function loadRules(): ValidationRule[] {
  return _rulesCache ?? [];
}

/** 서버에서 룰 fetch + 캐시 갱신 (비동기) */
export async function fetchRulesFromServer(): Promise<ValidationRule[]> {
  try {
    // localStorage → 서버 마이그레이션 (1회성)
    await migrateLocalStorageToServer();

    const resp = await fetch('/api/validation-rules/list');
    if (!resp.ok) throw new Error(`${resp.status}`);
    const data = await resp.json() as { rules: ValidationRule[] };
    _rulesCache = data.rules ?? [];
    return _rulesCache;
  } catch (e) {
    console.warn('[Validation] 서버 룰 로드 실패:', e);
    return _rulesCache ?? [];
  }
}

const LEGACY_STORAGE_KEY = 'tablemaster_validation_rules';
let _migrated = false;

async function migrateLocalStorageToServer() {
  if (_migrated) return;
  _migrated = true;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const localRules = JSON.parse(raw) as ValidationRule[];
    if (localRules.length === 0) return;

    // 서버에 이미 룰이 있으면 스킵
    const resp = await fetch('/api/validation-rules/list');
    if (resp.ok) {
      const data = await resp.json() as { rules: any[] };
      if (data.rules && data.rules.length > 0) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }
    }

    console.log(`[Validation] localStorage → 서버 마이그레이션: ${localRules.length}개 룰`);
    for (const rule of localRules) {
      await fetch('/api/validation-rules/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, scope: 'team' }),
      });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.log(`[Validation] 마이그레이션 완료 — localStorage 데이터 삭제`);
  } catch (e) {
    console.warn('[Validation] 마이그레이션 실패:', e);
  }
}

function notifyRulesUpdated() {
  window.dispatchEvent(new CustomEvent('validation-rules-updated'));
}

/** 룰 추가/수정 → 서버 저장 + Git push */
export async function addRule(rule: ValidationRule): Promise<ValidationRule[]> {
  try {
    const resp = await fetch('/api/validation-rules/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const result = await fetchRulesFromServer();
    notifyRulesUpdated();
    return result;
  } catch (e) {
    console.warn('[Validation] 룰 저장 실패:', e);
    return _rulesCache ?? [];
  }
}

/** 룰 삭제 → 서버 삭제 + Git push */
export async function deleteRule(ruleId: string): Promise<ValidationRule[]> {
  try {
    const resp = await fetch(`/api/validation-rules/delete?id=${encodeURIComponent(ruleId)}`, {
      method: 'DELETE',
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const result = await fetchRulesFromServer();
    notifyRulesUpdated();
    return result;
  } catch (e) {
    console.warn('[Validation] 룰 삭제 실패:', e);
    return _rulesCache ?? [];
  }
}

/** 룰 활성/비활성 토글 → 서버 저장 + Git push */
export async function toggleRule(ruleId: string): Promise<ValidationRule[]> {
  try {
    const resp = await fetch('/api/validation-rules/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ruleId }),
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const result = await fetchRulesFromServer();
    notifyRulesUpdated();
    return result;
  } catch (e) {
    console.warn('[Validation] 룰 토글 실패:', e);
    return _rulesCache ?? [];
  }
}

// ── 룰 검증 엔진 ─────────────────────────────────────────────────────────────

function matchTable(ruleTable: string, tableName: string): boolean {
  if (ruleTable === '*') return true;
  if (ruleTable.includes('*')) {
    const regex = new RegExp('^' + ruleTable.replace(/\*/g, '.*') + '$', 'i');
    return regex.test(tableName);
  }
  return ruleTable.toLowerCase() === tableName.toLowerCase();
}

function parseNum(val: string | number | null | undefined): number | null {
  if (val == null || val === '') return null;
  const n = typeof val === 'number' ? val : Number(val);
  return isFinite(n) ? n : null;
}

function compareValues(left: string, op: string, right: string): boolean {
  const nl = parseNum(left);
  const nr = parseNum(right);
  if (nl !== null && nr !== null) {
    switch (op) {
      case '<': return nl < nr;
      case '<=': return nl <= nr;
      case '==': return nl === nr;
      case '!=': return nl !== nr;
      case '>=': return nl >= nr;
      case '>': return nl > nr;
    }
  }
  switch (op) {
    case '==': return left === right;
    case '!=': return left !== right;
    default: return left < right;
  }
}

function findPK(headers: string[]): string {
  return headers.find(h => /^id$/i.test(h)) ?? headers[0] ?? '?';
}

function checkRule(
  rule: ValidationRule,
  headers: string[],
  rows: Record<string, string>[],
  tableName: string,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const cond = rule.condition;
  const pk = findPK(headers);
  const MAX_VIOLATIONS_PER_RULE = 20;

  switch (cond.type) {
    case 'range': {
      if (!headers.includes(cond.column)) break;
      for (const row of rows) {
        const n = parseNum(row[cond.column]);
        if (n === null) continue;
        if ((cond.min !== undefined && n < cond.min) || (cond.max !== undefined && n > cond.max)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}=${n} (범위: ${cond.min ?? ''}~${cond.max ?? ''})`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'not_null': {
      if (!headers.includes(cond.column)) break;
      for (const row of rows) {
        const val = row[cond.column];
        if (val == null || val === '' || val === 'null' || val === 'NULL') {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}이(가) 비어있음`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'in': {
      if (!headers.includes(cond.column)) break;
      const allowed = new Set(cond.values.map(v => v.toLowerCase()));
      for (const row of rows) {
        const val = String(row[cond.column] ?? '').toLowerCase();
        if (val && !allowed.has(val)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}="${row[cond.column]}" (허용: ${cond.values.join(', ')})`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'not_in': {
      if (!headers.includes(cond.column)) break;
      const forbidden = new Set(cond.values.map(v => v.toLowerCase()));
      for (const row of rows) {
        const val = String(row[cond.column] ?? '').toLowerCase();
        if (forbidden.has(val)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}="${row[cond.column]}" (금지값)`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'regex': {
      if (!headers.includes(cond.column)) break;
      let re: RegExp;
      try { re = new RegExp(cond.pattern); } catch { break; }
      for (const row of rows) {
        const val = String(row[cond.column] ?? '');
        if (val && !re.test(val)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}="${val}" (패턴 불일치: ${cond.pattern})`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'compare_columns': {
      if (!headers.includes(cond.left) || !headers.includes(cond.right)) break;
      for (const row of rows) {
        const lv = String(row[cond.left] ?? '');
        const rv = String(row[cond.right] ?? '');
        if (lv === '' || rv === '') continue;
        if (!compareValues(lv, cond.op, rv)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.left}=${lv} ${cond.op} ${cond.right}=${rv} 위반`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'conditional': {
      const { when, then: thenC } = cond;
      if (!headers.includes(when.column) || !headers.includes(thenC.column)) break;
      for (const row of rows) {
        const whenVal = String(row[when.column] ?? '');
        if (!compareValues(whenVal, when.op, when.value)) continue;
        const thenVal = String(row[thenC.column] ?? '');
        if (!compareValues(thenVal, thenC.op, thenC.value)) {
          const rowId = String(row[pk] ?? '');
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${when.column}=${whenVal}일 때 ${thenC.column}=${thenVal} (기대: ${thenC.op} ${thenC.value})`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        }
      }
      break;
    }
    case 'unique': {
      if (!headers.includes(cond.column)) break;
      const seen = new Map<string, string>();
      for (const row of rows) {
        const val = String(row[cond.column] ?? '');
        if (!val) continue;
        const rowId = String(row[pk] ?? '');
        if (seen.has(val)) {
          violations.push({
            ruleId: rule.id, ruleName: rule.name, table: tableName,
            severity: rule.severity, rowId,
            details: `${cond.column}="${val}" 중복 (기존: id=${seen.get(val)})`,
          });
          if (violations.length >= MAX_VIOLATIONS_PER_RULE) return violations;
        } else {
          seen.set(val, rowId);
        }
      }
      break;
    }
    case 'expression': {
      // expression은 간단한 JS 기반 평가 (향후 확장)
      break;
    }
  }

  return violations;
}

// ── 전체 검증 실행 ───────────────────────────────────────────────────────────

export function runValidation(
  tableData: TableDataMap,
  rules?: ValidationRule[],
): ValidationResult {
  const t0 = performance.now();
  const allRules = rules ?? loadRules();
  const enabledRules = allRules.filter(r => r.enabled);
  const violations: RuleViolation[] = [];
  let checkedRules = 0;

  for (const rule of enabledRules) {
    let ruleChecked = false;
    for (const [tableName, { headers, rows }] of tableData) {
      if (!matchTable(rule.table, tableName)) continue;
      ruleChecked = true;
      const v = checkRule(rule, headers, rows, tableName);
      violations.push(...v);
    }
    if (ruleChecked) checkedRules++;
  }

  violations.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.table.localeCompare(b.table);
  });

  return {
    timestamp: Date.now(),
    totalRules: allRules.length,
    checkedRules,
    violations,
    durationMs: performance.now() - t0,
  };
}

// ── 프롬프트 변환 ────────────────────────────────────────────────────────────

export function validationResultToPrompt(result: ValidationResult): string {
  if (result.violations.length === 0) return '';

  const errors = result.violations.filter(v => v.severity === 'error');
  const warnings = result.violations.filter(v => v.severity === 'warning');

  const lines: string[] = [];
  lines.push(`## 🛡️ 데이터 유효성 검증 위반 (${result.violations.length}건: error ${errors.length}, warning ${warnings.length})`);
  lines.push('사용자 정의 룰에 의한 검증 결과입니다. 관련 테이블 언급 시 알려주세요.');

  for (const v of result.violations.slice(0, 15)) {
    const icon = v.severity === 'error' ? '🔴' : '🟡';
    lines.push(`${icon} **${v.ruleName}** — ${v.table} id=${v.rowId}: ${v.details}`);
  }
  if (result.violations.length > 15) {
    lines.push(`... 외 ${result.violations.length - 15}건`);
  }
  lines.push('');

  return lines.join('\n');
}

export function rulesToSummary(rules: ValidationRule[]): string {
  if (rules.length === 0) return '등록된 검증 룰이 없습니다.';
  const enabled = rules.filter(r => r.enabled);
  const lines = [`📋 검증 룰 ${rules.length}개 (활성 ${enabled.length}개):\n`];
  for (const r of rules) {
    const status = r.enabled ? '✅' : '⏸️';
    const sev = r.severity === 'error' ? '🔴' : '🟡';
    lines.push(`${status} ${sev} **${r.name}** — 테이블: ${r.table}, 조건: ${conditionToText(r.condition)} [${r.scope}] (id: ${r.id})`);
  }
  return lines.join('\n');
}

function conditionToText(cond: RuleCondition): string {
  switch (cond.type) {
    case 'range': {
      const parts: string[] = [];
      if (cond.min !== undefined) parts.push(`${cond.min} ≤`);
      parts.push(cond.column);
      if (cond.max !== undefined) parts.push(`≤ ${cond.max}`);
      return parts.join(' ');
    }
    case 'not_null': return `${cond.column} ≠ NULL`;
    case 'in': return `${cond.column} ∈ {${cond.values.join(', ')}}`;
    case 'not_in': return `${cond.column} ∉ {${cond.values.join(', ')}}`;
    case 'regex': return `${cond.column} ~ /${cond.pattern}/`;
    case 'compare_columns': return `${cond.left} ${cond.op} ${cond.right}`;
    case 'conditional': return `IF ${cond.when.column}${cond.when.op}${cond.when.value} THEN ${cond.then.column}${cond.then.op}${cond.then.value}`;
    case 'unique': return `${cond.column} UNIQUE`;
    case 'expression': return cond.expr;
  }
}
