import alasql from 'alasql';
import type { ParsedSchema } from '../schema/types.ts';

export type Row = Record<string, string | number | boolean | null>;
export type TableDataMap = Map<string, { headers: string[]; rows: Record<string, string>[] }>;

// ── 내부 테이블명 (alasql 예약어 충돌 방지) ───────────────────────────────
const T = {
  TABLES:  '_dm_tables',
  COLUMNS: '_dm_columns',
  REFS:    '_dm_refs',
  ENUMS:   '_dm_enums',
};

// 사용자 SQL의 가상 테이블명 → 내부명 변환 (단어 경계 기준)
function translateSQL(sql: string): string {
  return sql
    .replace(/\bTABLES\b/gi,  T.TABLES)
    .replace(/\bCOLUMNS\b/gi, T.COLUMNS)
    .replace(/\bREFS\b/gi,    T.REFS)
    .replace(/\bENUMS\b/gi,   T.ENUMS);
}

/**
 * SQL 식별자를 alasql 호환 형태로 변환합니다.
 * 1) "큰따옴표 식별자" → `백틱 식별자`   예) c."#char_memo" → c.`#char_memo`
 * 2) 따옴표 없는 #컬럼명 → `#컬럼명`     예) s.#name_memo  → s.`#name_memo`
 */
function normalizeIdentifiers(sql: string): string {
  let result = sql.replace(/"([^"]+)"/g, '`$1`');
  result = result.replace(/(?<!`)#(\w+)/g, '`#$1`');
  return result;
}

/**
 * `;`으로 구분된 여러 SQL 문을 분리합니다.
 * 문자열 리터럴('...) 안의 `;`는 구분자로 취급하지 않습니다.
 */
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inSingle = false;
  let inBack = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && !inBack)  { inSingle = !inSingle; current += ch; continue; }
    if (ch === '`' && !inSingle) { inBack   = !inBack;   current += ch; continue; }
    if (ch === ';' && !inSingle && !inBack) {
      const trimmed = current.trim();
      if (trimmed) stmts.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const last = current.trim();
  if (last) stmts.push(last);
  return stmts;
}

// ── Virtual Table Schema Description (Claude 프롬프트용) ────────────────────
export const VIRTUAL_TABLE_SCHEMA = `사용 가능한 가상 SQL 테이블:

TABLES(name, group_name, column_count, pk_count, fk_count, note, alias)
  - 스키마의 모든 테이블 목록

COLUMNS(table_name, group_name, col_name, type, pk, fk, unique_col, not_null, default_val, note)
  - 모든 테이블의 컬럼 목록
  - pk, fk, unique_col, not_null 은 숫자: 1(true) / 0(false)

REFS(from_table, from_col, to_table, to_col, rel_type)
  - 테이블 간 관계 목록
  - rel_type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'

ENUMS(enum_name, value, note)
  - 모든 Enum 값 목록`;

// ── 가상 테이블 데이터 빌드 ─────────────────────────────────────────────────
function buildVirtualData(schema: ParsedSchema) {
  const nameById = new Map(schema.tables.map(t => [t.id, t.name]));

  return {
    [T.TABLES]: schema.tables.map(t => ({
      name: t.name,
      group_name: t.groupName ?? '',
      column_count: t.columns.length,
      pk_count: t.columns.filter(c => c.isPrimaryKey).length,
      fk_count: t.columns.filter(c => c.isForeignKey).length,
      note: t.note ?? '',
      alias: t.alias ?? '',
    })),

    [T.COLUMNS]: schema.tables.flatMap(t =>
      t.columns.map(c => ({
        table_name: t.name,
        group_name: t.groupName ?? '',
        col_name: c.name,
        type: c.type,
        pk: c.isPrimaryKey ? 1 : 0,
        fk: c.isForeignKey ? 1 : 0,
        unique_col: c.isUnique ? 1 : 0,
        not_null: c.isNotNull ? 1 : 0,
        default_val: c.defaultValue ?? '',
        note: c.note ?? '',
      }))
    ),

    [T.REFS]: schema.refs.map(r => ({
      from_table: nameById.get(r.fromTable) ?? r.fromTable,
      from_col: r.fromColumns.join(', '),
      to_table: nameById.get(r.toTable) ?? r.toTable,
      to_col: r.toColumns.join(', '),
      rel_type: r.type,
    })),

    [T.ENUMS]: schema.enums.flatMap(e =>
      e.values.map(v => ({
        enum_name: e.name,
        value: v.name,
        note: v.note ?? '',
      }))
    ),
  };
}

// ── 결과 타입 ────────────────────────────────────────────────────────────────
export interface SingleResult {
  sql: string;          // 원본 SQL 구문 (탭 레이블용)
  tableName: string;    // FROM 절에서 추출한 테이블명
  columns: string[];
  rows: Row[];
  rowCount: number;
  error?: string;
}

export interface QueryResult {
  /** 단일 쿼리 결과 (하위 호환) */
  columns: string[];
  rows: Row[];
  rowCount: number;
  error?: string;
  duration?: number;
  /** 다중 쿼리 결과 (`;`로 구분된 여러 SELECT 문) */
  multiResults?: SingleResult[];
}

/** FROM 절 뒤의 첫 번째 테이블명 추출 (탭 레이블용) */
function extractTableName(sql: string): string {
  const m = sql.match(/\bFROM\s+([`"]?)(\w+)\1/i);
  return m ? m[2] : sql.slice(0, 30).replace(/\s+/g, ' ');
}

/** 한 개의 SQL 구문을 실행해 SingleResult 반환 */
function execOne(sql: string): SingleResult {
  const tableName = extractTableName(sql);
  try {
    const r = alasql(sql) as Row[];
    if (!Array.isArray(r)) {
      return { sql, tableName, columns: [], rows: [], rowCount: 0, error: 'SELECT 문만 지원합니다.' };
    }
    const columns = r.length > 0 ? Object.keys(r[0]) : [];
    return { sql, tableName, columns, rows: r, rowCount: r.length };
  } catch (err: unknown) {
    return { sql, tableName, columns: [], rows: [], rowCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── 실제 데이터 SQL 엔진 ────────────────────────────────────────────────────
export function executeDataSQL(
  sql: string,
  tableData: TableDataMap,
  schema?: ParsedSchema,
): QueryResult {
  const t0 = performance.now();
  try {
    // lowercase key → proper-case name 매핑
    const properNameMap = new Map<string, string>();
    if (schema) {
      for (const t of schema.tables) properNameMap.set(t.name.toLowerCase(), t.name);
    }

    // alasql 테이블 등록
    for (const [key, { rows }] of tableData) {
      const name = properNameMap.get(key) ?? key;

      // 컬럼명 소문자 정규화 (alasql 식별자 처리 방식 대응)
      const normalizedRows = rows.map(row => {
        const r: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) r[k.toLowerCase()] = v;
        return r;
      });

      // 소문자 · 원본명 · 대문자 세 가지 변형 모두 등록 (대소문자 구분 방지)
      for (const tName of new Set([name.toLowerCase(), name, name.toUpperCase()])) {
        if (!alasql.tables[tName]) alasql(`CREATE TABLE IF NOT EXISTS \`${tName}\``);
        alasql.tables[tName].data = normalizedRows;
      }
    }

    // 주석 제거
    const stripped = sql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    if (!stripped) {
      return { columns: [], rows: [], rowCount: 0, error: 'SQL이 비어 있습니다.', duration: 0 };
    }

    // `;`로 구분된 여러 구문 처리
    const stmts = splitStatements(stripped);

    if (stmts.length > 1) {
      // 각 구문을 전처리 후 실행
      const multiResults: SingleResult[] = stmts.map(stmt => {
        const processed = normalizeIdentifiers(stmt);
        return execOne(processed);
      });
      const totalRows = multiResults.reduce((s, r) => s + r.rowCount, 0);
      return {
        columns: [], rows: [], rowCount: totalRows,
        multiResults,
        duration: performance.now() - t0,
      };
    }

    // 단일 구문
    const processed = normalizeIdentifiers(stmts[0]);
    const result = alasql(processed) as Row[];

    if (!Array.isArray(result)) {
      return { columns: [], rows: [], rowCount: 0, error: 'SELECT 문만 지원합니다.', duration: performance.now() - t0 };
    }

    const columns = result.length > 0 ? Object.keys(result[0]) : [];
    return { columns, rows: result, rowCount: result.length, duration: performance.now() - t0 };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { columns: [], rows: [], rowCount: 0, error: msg, duration: performance.now() - t0 };
  }
}

// ── 데이터 쿼리용 Claude 프롬프트 빌더 ──────────────────────────────────────
export function buildDataQueryContext(tableData: TableDataMap, schema?: ParsedSchema): string {
  const nameById = schema ? new Map(schema.tables.map(t => [t.id, t.name])) : new Map<string, string>();
  const properNameMap = new Map<string, string>();
  if (schema) for (const t of schema.tables) properNameMap.set(t.name.toLowerCase(), t.name);

  const lines: string[] = ['사용 가능한 테이블 (실제 데이터):'];
  for (const [key, { headers, rows }] of tableData) {
    const name = properNameMap.get(key) ?? key;
    lines.push(`\n${name} (${rows.length}행)`);
    lines.push(`  컬럼: ${headers.join(', ')}`);
    if (rows.length > 0) {
      const sample = rows[0];
      const sampleStr = headers.slice(0, 6).map(h => `${h}=${JSON.stringify(sample[h] ?? '')}`).join(', ');
      lines.push(`  샘플: ${sampleStr}${headers.length > 6 ? ' ...' : ''}`);
    }
  }

  if (schema && schema.refs.length > 0) {
    lines.push('\n관계 (JOIN 힌트):');
    for (const r of schema.refs.slice(0, 40)) {
      const from = nameById.get(r.fromTable) ?? r.fromTable;
      const to   = nameById.get(r.toTable) ?? r.toTable;
      lines.push(`  ${from}.${r.fromColumns.join(',')} → ${to}.${r.toColumns.join(',')} (${r.type})`);
    }
    if (schema.refs.length > 40) lines.push(`  ... 외 ${schema.refs.length - 40}개`);
  }

  return lines.join('\n');
}

// ── 스키마 메타 SQL 엔진 ────────────────────────────────────────────────────
export function executeSQL(sql: string, schema: ParsedSchema): QueryResult {
  const t0 = performance.now();
  try {
    const data = buildVirtualData(schema);
    for (const [name, rows] of Object.entries(data)) {
      if (!alasql.tables[name]) alasql(`CREATE TABLE IF NOT EXISTS \`${name}\``);
      alasql.tables[name].data = rows;
    }

    const stripped = sql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    const stmts = splitStatements(stripped);

    if (stmts.length > 1) {
      const multiResults: SingleResult[] = stmts.map(stmt => {
        const processed = translateSQL(normalizeIdentifiers(stmt));
        return execOne(processed);
      });
      return {
        columns: [], rows: [], rowCount: multiResults.reduce((s, r) => s + r.rowCount, 0),
        multiResults,
        duration: performance.now() - t0,
      };
    }

    const processed = translateSQL(normalizeIdentifiers(stmts[0] ?? ''));
    const result = alasql(processed) as Row[];

    if (!Array.isArray(result)) {
      return { columns: [], rows: [], rowCount: 0, error: 'SELECT 문만 지원합니다.', duration: performance.now() - t0 };
    }

    const columns = result.length > 0 ? Object.keys(result[0]) : [];
    return { columns, rows: result, rowCount: result.length, duration: performance.now() - t0 };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { columns: [], rows: [], rowCount: 0, error: msg, duration: performance.now() - t0 };
  }
}
