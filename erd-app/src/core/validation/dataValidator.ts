import * as XLSX from 'xlsx';
import type { ParsedSchema, SchemaTable, SchemaRef, SchemaEnum } from '../schema/types.ts';

export type VSeverity = 'error' | 'warning' | 'info';
export type VCategory = 'referential' | 'uniqueness' | 'required' | 'enum' | 'type';

export interface ValidationIssue {
  id: string;
  severity: VSeverity;
  category: VCategory;
  table: string;
  column: string;
  row: number;
  value: string;
  title: string;
  description: string;
}

export interface TableData {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface TableValidationStat {
  name: string;
  matched: boolean;
  rows: number;
  checks: number;
  errors: number;
  warnings: number;
  checkedPK: boolean;
  checkedNotNull: boolean;
  checkedFK: boolean;
  checkedEnum: boolean;
  checkedType: boolean;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  tables: TableData[];
  tableStats: TableValidationStat[];
  score: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byCategory: Record<VCategory, number>;
  byTable: Map<string, ValidationIssue[]>;
  totalRows: number;
  totalChecks: number;
}

const SKIP_SHEETS = new Set(['define', 'tabledefine', 'enum', 'tablegroup']);

function isMetaSheet(name: string): boolean {
  if (name.includes('#')) return true;
  return SKIP_SHEETS.has(name.toLowerCase());
}

/** Scan the first few rows to find the one that best matches known column names */
function findHeaderRow(raw: unknown[][], knownCols?: Set<string>): number {
  const scanLimit = Math.min(5, raw.length);
  let bestIdx = 0;
  let bestScore = -1;

  for (let r = 0; r < scanLimit; r++) {
    const row = (raw[r] as unknown[]) ?? [];
    const cells = row.map((v) => String(v ?? '').trim().toLowerCase()).filter(Boolean);
    if (cells.length === 0) continue;

    if (knownCols && knownCols.size > 0) {
      const matchCount = cells.filter((c) => knownCols.has(c)).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestIdx = r;
      }
    } else {
      const stringCells = cells.filter((c) => isNaN(Number(c)));
      if (stringCells.length > bestScore) {
        bestScore = stringCells.length;
        bestIdx = r;
      }
    }
  }

  return bestIdx;
}

function parseSheetAsTable(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  knownCols?: Set<string>
): TableData | null {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  if (raw.length < 2) return null;

  const headerIdx = findHeaderRow(raw, knownCols);

  const headerRow = (raw[headerIdx] as unknown[]).map((h) => String(h ?? '').trim());
  if (headerRow.filter(Boolean).length === 0) return null;

  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i] as unknown[];
    if (!rowArr || rowArr.every((v) => v == null || String(v).trim() === '')) continue;
    const record: Record<string, string> = {};
    for (let j = 0; j < headerRow.length; j++) {
      if (!headerRow[j]) continue;
      record[headerRow[j]] = rowArr[j] != null ? String(rowArr[j]).trim() : '';
    }
    rows.push(record);
  }

  if (rows.length === 0) return null;
  return { name: sheetName, headers: headerRow.filter(Boolean), rows, rowCount: rows.length };
}

export function parseDataFromFiles(
  files: { name: string; data: ArrayBuffer }[],
  schema?: ParsedSchema
): { tables: TableData[]; logs: string[] } {
  const tables: TableData[] = [];
  const logs: string[] = [];

  // Build known column name map from schema for header detection
  const schemaColsMap = new Map<string, Set<string>>();
  if (schema) {
    for (const t of schema.tables) {
      schemaColsMap.set(t.name.toLowerCase(), new Set(t.columns.map((c) => c.name.toLowerCase())));
    }
  }

  const xlsxFiles = files.filter((f) => f.name.endsWith('.xlsx') && !f.name.startsWith('~$'));
  logs.push(`Found ${xlsxFiles.length} Excel files`);

  for (const file of xlsxFiles) {
    try {
      const wb = XLSX.read(file.data, { type: 'array' });
      let sheetsFound = 0;

      for (const sheetName of wb.SheetNames) {
        if (isMetaSheet(sheetName)) continue;

        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;

        const knownCols = schemaColsMap.get(sheetName.toLowerCase());
        const td = parseSheetAsTable(sheet, sheetName, knownCols);
        if (td) {
          tables.push(td);
          sheetsFound++;
          logs.push(`[Data] ${file.name} → ${sheetName}: ${td.rowCount} rows, ${td.headers.length} cols`);
        }
      }

      if (sheetsFound === 0) {
        logs.push(`[SKIP] ${file.name}: no data sheets found`);
      }
    } catch (err) {
      logs.push(`[ERROR] ${file.name}: ${err}`);
    }
  }

  logs.push(`\nLoaded ${tables.length} tables from ${xlsxFiles.length} files, ${tables.reduce((s, t) => s + t.rowCount, 0)} total rows`);
  return { tables, logs };
}

let issueIdx = 0;
function mkId() { return `dv-${++issueIdx}`; }

export function validateData(schema: ParsedSchema, dataTables: TableData[]): ValidationResult {
  issueIdx = 0;
  const issues: ValidationIssue[] = [];
  let totalChecks = 0;

  const schemaByName = new Map(schema.tables.map((t) => [t.name.toLowerCase(), t]));
  const enumByName = new Map(schema.enums.map((e) => [e.name.toLowerCase(), e]));

  const tableStats: TableValidationStat[] = [];
  const tableChecksMap = new Map<string, { checks: number; checkedPK: boolean; checkedNotNull: boolean; checkedFK: boolean; checkedEnum: boolean; checkedType: boolean }>();

  const pkValues = new Map<string, Set<string>>();
  for (const dt of dataTables) {
    const st = schemaByName.get(dt.name.toLowerCase());
    if (!st) continue;
    const pkCols = st.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    if (pkCols.length === 0) continue;

    const vals = new Set<string>();
    for (const row of dt.rows) {
      const pkVal = pkCols.map((c) => row[c] ?? '').join('|');
      vals.add(pkVal);
    }
    pkValues.set(st.name.toLowerCase(), vals);
  }

  for (const dt of dataTables) {
    const st = schemaByName.get(dt.name.toLowerCase());
    const matched = !!st;
    const tc = { checks: 0, checkedPK: false, checkedNotNull: false, checkedFK: false, checkedEnum: false, checkedType: false };
    tableChecksMap.set(dt.name, tc);

    if (!st) {
      tableStats.push({ name: dt.name, matched, rows: dt.rowCount, errors: 0, warnings: 0, ...tc });
      continue;
    }

    // 1. PK Uniqueness
    const pkCols = st.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    if (pkCols.length > 0) {
      tc.checkedPK = true;
      const seen = new Map<string, number>();
      for (let i = 0; i < dt.rows.length; i++) {
        totalChecks++; tc.checks++;
        const pkVal = pkCols.map((c) => dt.rows[i][c] ?? '').join('|');
        if (pkVal === '' || pkVal === pkCols.map(() => '').join('|')) continue;
        if (seen.has(pkVal)) {
          issues.push({
            id: mkId(), severity: 'error', category: 'uniqueness',
            table: dt.name, column: pkCols.join('+'), row: i + 2, value: pkVal,
            title: 'PK 중복',
            description: `Row ${seen.get(pkVal)}과 동일한 PK 값 "${pkVal}"`,
          });
        }
        seen.set(pkVal, i + 2);
      }
    }

    for (const col of st.columns) {
      const colData = dt.rows.map((r) => r[col.name]);

      // 2. NOT NULL
      if (col.isNotNull && !col.isPrimaryKey) {
        tc.checkedNotNull = true;
        for (let i = 0; i < colData.length; i++) {
          totalChecks++; tc.checks++;
          if (colData[i] === '' || colData[i] === undefined) {
            issues.push({
              id: mkId(), severity: 'error', category: 'required',
              table: dt.name, column: col.name, row: i + 2, value: '(empty)',
              title: 'NOT NULL 위반',
              description: `필수 컬럼에 빈 값`,
            });
          }
        }
      }

      // 3. FK Referential Integrity
      if (col.isForeignKey) {
        const ref = schema.refs.find((r) => {
          const fromTbl = schema.tables.find((t) => t.id === r.fromTable);
          return fromTbl?.name.toLowerCase() === dt.name.toLowerCase() && r.fromColumns.includes(col.name);
        });
        if (ref) {
          const toTbl = schema.tables.find((t) => t.id === ref.toTable);
          if (toTbl) {
            const targetPkVals = pkValues.get(toTbl.name.toLowerCase());
            if (targetPkVals) {
              tc.checkedFK = true;
              for (let i = 0; i < colData.length; i++) {
                totalChecks++; tc.checks++;
                const val = colData[i];
                if (!val || val === '') continue;
                if (!targetPkVals.has(val)) {
                  issues.push({
                    id: mkId(), severity: 'error', category: 'referential',
                    table: dt.name, column: col.name, row: i + 2, value: val,
                    title: 'FK 참조 무결성 위반',
                    description: `"${val}" 값이 ${toTbl.name} 테이블에 존재하지 않음`,
                  });
                }
              }
            }
          }
        }
      }

      // 4. Enum Validation
      const enumDef = enumByName.get(col.type.toLowerCase());
      if (enumDef) {
        tc.checkedEnum = true;
        const validValues = new Set(enumDef.values.map((v) => v.name.toLowerCase()));
        for (let i = 0; i < colData.length; i++) {
          totalChecks++; tc.checks++;
          const val = colData[i];
          if (!val || val === '') continue;
          if (!validValues.has(val.toLowerCase())) {
            issues.push({
              id: mkId(), severity: 'error', category: 'enum',
              table: dt.name, column: col.name, row: i + 2, value: val,
              title: 'Enum 값 위반',
              description: `"${val}"은 ${col.type}에 정의되지 않은 값 (허용: ${enumDef.values.slice(0, 5).map((v) => v.name).join(', ')}${enumDef.values.length > 5 ? '...' : ''})`,
            });
          }
        }
      }

      // 5. Type Validation
      const typeLower = col.type.toLowerCase();
      const isNumeric = ['int', 'integer', 'bigint', 'smallint', 'tinyint', 'float', 'double', 'decimal', 'numeric', 'real', 'long'].some((t) => typeLower.includes(t));
      if (isNumeric) {
        tc.checkedType = true;
        for (let i = 0; i < colData.length; i++) {
          totalChecks++; tc.checks++;
          const val = colData[i];
          if (!val || val === '') continue;
          if (isNaN(Number(val))) {
            issues.push({
              id: mkId(), severity: 'warning', category: 'type',
              table: dt.name, column: col.name, row: i + 2, value: val,
              title: '타입 불일치',
              description: `"${val}"은 숫자 타입(${col.type})에 맞지 않음`,
            });
          }
        }
      }
    }

    const tblIssues = issues.filter((i) => i.table === dt.name);
    tableStats.push({
      name: dt.name,
      matched,
      rows: dt.rowCount,
      checks: tc.checks,
      errors: tblIssues.filter((i) => i.severity === 'error').length,
      warnings: tblIssues.filter((i) => i.severity === 'warning').length,
      checkedPK: tc.checkedPK,
      checkedNotNull: tc.checkedNotNull,
      checkedFK: tc.checkedFK,
      checkedEnum: tc.checkedEnum,
      checkedType: tc.checkedType,
    });
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const byCategory: Record<VCategory, number> = { referential: 0, uniqueness: 0, required: 0, enum: 0, type: 0 };
  for (const i of issues) byCategory[i.category]++;

  const byTable = new Map<string, ValidationIssue[]>();
  for (const i of issues) {
    if (!byTable.has(i.table)) byTable.set(i.table, []);
    byTable.get(i.table)!.push(i);
  }

  const totalRows = dataTables.reduce((s, t) => s + t.rowCount, 0);
  let score = totalChecks > 0 ? Math.round(((totalChecks - issues.length) / totalChecks) * 100) : 100;
  score = Math.max(0, Math.min(100, score));

  return { issues, tables: dataTables, tableStats, score, errorCount, warningCount, infoCount, byCategory, byTable, totalRows, totalChecks };
}
