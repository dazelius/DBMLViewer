import type { ParsedSchema } from '../schema/types.ts';
import type { TableDataMap } from '../query/schemaQueryEngine.ts';

// ── 이상치 탐지 결과 타입 ─────────────────────────────────────────────────────

export interface Anomaly {
  table: string;
  column: string;
  rowId: string;
  value: number;
  groupLabel?: string;
  groupMedian: number;
  groupIQR: number;
  severity: 'warning' | 'critical';
  ratio: number;
  description: string;
}

export interface AnomalyReport {
  timestamp: number;
  totalTables: number;
  analyzedTables: number;
  anomalies: Anomaly[];
  durationMs: number;
}

// ── 컬럼 필터링 ──────────────────────────────────────────────────────────────

const SKIP_COLUMN_EXACT = new Set([
  'id', '_id', 'idx', 'index', 'key', 'order', 'sort', 'seq', 'no',
  'enabled', 'is_active', 'active', 'flag', 'bool', 'visible', 'locked',
  'version', 'revision', 'priority', 'weight',
  // 값 컨테이너 — 타입 discriminator 없이는 의미 없음
  'value', 'val', 'param', 'arg', 'argument', 'amount', 'count',
  'compare_value', 'condition_value', 'param_value', 'effect_value',
  'min_value', 'max_value', 'base_value', 'add_value', 'mul_value',
  'target_value', 'result_value', 'reward_value',
]);

const SKIP_SUFFIX_RE = /(_id|_idx|_key|_ref|_fk|_pk|_order|_sort|_seq|_no|_flag|_bool|_icon|_sound|_sprite|_prefab|_path|_name|_desc|_text|_string|_color|_rgb|_hex|_tag|_type|_category|_group|_class|_enum|_code|_resource|_asset|_anim|_effect|_vfx|_sfx|_model|_mesh|_material|_shader|_value|_val|_param|_arg|_amount|_count|_rate|_ratio|_pct|_percent)$/i;

const SKIP_PREFIX_RE = /^(is_|has_|can_|use_|enable_|disable_|show_|hide_|max_count|min_count|icon|sprite|sound|resource|asset|prefab|name|desc|title|label|text|string|tag|memo|note|comment|tooltip|compare_|condition_|cond_|param_|arg_|effect_|reward_)/i;

// 이 패턴이 테이블명에 포함되면 조건/설정 테이블 → 더 엄격하게 필터
const CONFIG_TABLE_RE = /^(condition|config|setting|param|const|define|enum|flag|option|rule|trigger|buff|debuff|effect|ai_|behavior|bt_|fsm_|state_)/i;

function isBalanceColumn(colName: string, schema: ParsedSchema | null, tableName: string): boolean {
  const lower = colName.toLowerCase();
  if (SKIP_COLUMN_EXACT.has(lower)) return false;
  if (SKIP_SUFFIX_RE.test(colName)) return false;
  if (SKIP_PREFIX_RE.test(colName)) return false;
  if (lower.startsWith('#')) return false;

  if (schema) {
    const table = schema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (table) {
      const col = table.columns.find(c => c.name === colName);
      if (col?.isPrimaryKey || col?.isForeignKey) return false;
      const typeLower = col?.type?.toLowerCase() ?? '';
      if (typeLower.includes('bool') || typeLower.includes('string') || typeLower.includes('text')) return false;
    }
  }
  return true;
}

function parseNumeric(val: string | number | null | undefined): number | null {
  if (val == null || val === '') return null;
  const n = typeof val === 'number' ? val : Number(val);
  return isFinite(n) ? n : null;
}

function findPKColumn(headers: string[], schema: ParsedSchema | null, tableName: string): string | null {
  if (schema) {
    const table = schema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (table) {
      const pk = table.columns.find(c => c.isPrimaryKey);
      if (pk && headers.includes(pk.name)) return pk.name;
    }
  }
  return headers.find(h => /^id$/i.test(h)) ?? headers[0] ?? null;
}

// ── 그룹핑/타입 discriminator 컬럼 ──────────────────────────────────────────

const GROUP_COLUMN_RE = /^(level|lv|grade|tier|rank|class|type|category|rarity|group|kind|star)/i;
const DISCRIMINATOR_RE = /^(type|kind|category|cond_type|condition_type|effect_type|skill_type|action_type|buff_type|stat_type|reward_type|item_type|compare_op|operator|op)/i;

function findGroupColumn(headers: string[]): string | null {
  return headers.find(h => GROUP_COLUMN_RE.test(h)) ?? null;
}

/**
 * discriminator 컬럼이 있는지 확인
 * 있으면 해당 테이블은 "값 컨테이너" 패턴 → 전체 분석 건너뛰기
 */
function hasDiscriminatorColumn(headers: string[]): boolean {
  return headers.some(h => DISCRIMINATOR_RE.test(h));
}

/**
 * 컬럼 사전 검증 (오탐 방지)
 * - 고유값 5개 미만 → enum/boolean 스킵
 * - 80% 이상 같은 값 → 상수/플래그 스킵
 * - 70% 이상 0 → 선택적 필드 스킵
 * - CV(변동계수)가 극단적으로 높으면(>2.0) → 이질적 데이터 스킵
 */
function isAnalyzableColumn(values: number[]): boolean {
  if (values.length < 15) return false;

  const distinct = new Set(values);
  if (distinct.size < 6) return false;

  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  const maxFreq = Math.max(...freq.values());
  if (maxFreq / values.length > 0.7) return false;

  const zeroCount = values.filter(v => v === 0).length;
  if (zeroCount / values.length > 0.5) return false;

  // CV 체크 — 변동계수가 너무 높으면 이질적 데이터 (discriminator 누락 가능성)
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean !== 0) {
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const cv = Math.sqrt(variance) / Math.abs(mean);
    if (cv > 2.0) return false;
  }

  return true;
}

/**
 * Modified Z-Score (MAD 기반) 이상치 탐지
 * |Modified Z| > 5.0 → critical, > 4.0 → warning (기존보다 엄격)
 * 추가: 중앙값 대비 3배 이상 또는 1/3 이하여야만 보고
 */
function detectOutliers(
  values: { idx: number; value: number }[],
): { idx: number; value: number; median: number; iqr: number; severity: 'warning' | 'critical'; ratio: number }[] {
  if (values.length < 15) return [];

  const sorted = [...values].sort((a, b) => a.value - b.value);
  const median = sorted[Math.floor(sorted.length / 2)].value;

  const deviations = values.map(v => Math.abs(v.value - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)];

  if (mad === 0) return [];

  const q1 = sorted[Math.floor(sorted.length * 0.25)].value;
  const q3 = sorted[Math.floor(sorted.length * 0.75)].value;
  const iqr = q3 - q1;

  const results: { idx: number; value: number; median: number; iqr: number; severity: 'warning' | 'critical'; ratio: number }[] = [];

  for (const v of values) {
    const modifiedZ = 0.6745 * (v.value - median) / mad;
    const absZ = Math.abs(modifiedZ);
    if (absZ <= 4.0) continue;

    const ratio = median !== 0 ? v.value / median : (v.value > 0 ? Infinity : 0);

    // 실질적 차이 필터: 3배 이상 또는 1/3 이하만 보고
    if (ratio > 0.33 && ratio < 3.0) continue;

    // 절대값 차이도 체크 — 중앙값이 작을 때 사소한 차이 무시
    const absDiff = Math.abs(v.value - median);
    if (absDiff < 10) continue;

    const severity = absZ > 5.5 ? 'critical' : 'warning';
    results.push({ ...v, median, iqr, severity, ratio });
  }

  return results;
}

export function runAnomalyDetection(
  tableData: TableDataMap,
  schema: ParsedSchema | null,
  maxAnomalies = 20,
): AnomalyReport {
  const t0 = performance.now();
  const anomalies: Anomaly[] = [];
  let analyzedTables = 0;

  for (const [tableName, { headers, rows }] of tableData) {
    if (rows.length < 15) continue;

    // 조건/설정 테이블이면서 discriminator가 있으면 → 스킵
    const isConfigTable = CONFIG_TABLE_RE.test(tableName);
    const hasDiscriminator = hasDiscriminatorColumn(headers);

    if (isConfigTable && hasDiscriminator) continue;

    // discriminator가 있으면 "값 컨테이너" 패턴 가능성 높음 → 스킵
    // (예: cond_type + compare_value 조합)
    if (hasDiscriminator) continue;

    const pkCol = findPKColumn(headers, schema, tableName);
    const groupCol = findGroupColumn(headers);

    const numericCols = headers.filter(h => {
      if (!isBalanceColumn(h, schema, tableName)) return false;
      let numCount = 0;
      const sample = rows.slice(0, Math.min(30, rows.length));
      for (const row of sample) {
        if (parseNumeric(row[h]) !== null) numCount++;
      }
      return numCount >= sample.length * 0.85;
    });

    if (numericCols.length === 0) continue;
    analyzedTables++;

    for (const col of numericCols) {
      if (groupCol) {
        const groups = new Map<string, { idx: number; value: number }[]>();
        for (let i = 0; i < rows.length; i++) {
          const gVal = String(rows[i][groupCol] ?? 'unknown');
          const nVal = parseNumeric(rows[i][col]);
          if (nVal === null) continue;
          if (!groups.has(gVal)) groups.set(gVal, []);
          groups.get(gVal)!.push({ idx: i, value: nVal });
        }

        for (const [gLabel, gValues] of groups) {
          const numVals = gValues.map(v => v.value);
          if (!isAnalyzableColumn(numVals)) continue;

          const outliers = detectOutliers(gValues);
          for (const o of outliers) {
            const row = rows[o.idx];
            const rowId = pkCol ? String(row[pkCol] ?? o.idx) : String(o.idx);
            anomalies.push({
              table: tableName, column: col, rowId,
              value: o.value, groupLabel: `${groupCol}=${gLabel}`,
              groupMedian: o.median, groupIQR: o.iqr,
              severity: o.severity, ratio: o.ratio,
              description: `${tableName}.${col} [${groupCol}=${gLabel}] id=${rowId}: ${o.value} (중앙값 ${o.median}, ${o.ratio.toFixed(1)}배)`,
            });
            if (anomalies.length >= maxAnomalies) break;
          }
          if (anomalies.length >= maxAnomalies) break;
        }
      } else {
        const values: { idx: number; value: number }[] = [];
        for (let i = 0; i < rows.length; i++) {
          const nVal = parseNumeric(rows[i][col]);
          if (nVal !== null) values.push({ idx: i, value: nVal });
        }

        const numVals = values.map(v => v.value);
        if (!isAnalyzableColumn(numVals)) continue;

        const outliers = detectOutliers(values);
        for (const o of outliers) {
          const row = rows[o.idx];
          const rowId = pkCol ? String(row[pkCol] ?? o.idx) : String(o.idx);
          anomalies.push({
            table: tableName, column: col, rowId,
            value: o.value,
            groupMedian: o.median, groupIQR: o.iqr,
            severity: o.severity, ratio: o.ratio,
            description: `${tableName}.${col} id=${rowId}: ${o.value} (중앙값 ${o.median}, ${o.ratio.toFixed(1)}배)`,
          });
          if (anomalies.length >= maxAnomalies) break;
        }
      }

      if (anomalies.length >= maxAnomalies) break;
    }
    if (anomalies.length >= maxAnomalies) break;
  }

  anomalies.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return Math.abs(b.ratio) - Math.abs(a.ratio);
  });

  return {
    timestamp: Date.now(),
    totalTables: tableData.size,
    analyzedTables,
    anomalies,
    durationMs: performance.now() - t0,
  };
}

export function anomalyReportToPrompt(report: AnomalyReport): string {
  if (report.anomalies.length === 0) return '';

  const critical = report.anomalies.filter(a => a.severity === 'critical');
  const warning = report.anomalies.filter(a => a.severity === 'warning');

  const lines: string[] = [];
  lines.push(`## ⚠️ 자동 감지된 데이터 이상치 (${report.anomalies.length}건: critical ${critical.length}, warning ${warning.length})`);
  lines.push('아래 이상치를 답변 시 관련 테이블이 언급되면 사용자에게 알려주세요.');

  for (const a of report.anomalies.slice(0, 15)) {
    const icon = a.severity === 'critical' ? '🔴' : '🟡';
    lines.push(`${icon} ${a.description}`);
  }
  if (report.anomalies.length > 15) {
    lines.push(`... 외 ${report.anomalies.length - 15}건`);
  }
  lines.push('');

  return lines.join('\n');
}
