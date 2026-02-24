import * as XLSX from 'xlsx';
import type { ParsedSchema, SchemaTable, SchemaColumn, SchemaEnum, SchemaRef, SchemaTableGroup } from '../schema/types.ts';

interface ExcelColumn {
  name: string;
  type: string;
  description: string;
  isPk: boolean;
  isNotNull: boolean;
  isLocalize: boolean;
  defaultValue: string | null;
  enumType: string | null;
}

interface ExcelTable {
  name: string;
  note: string;
  headerColor: string;
  columns: ExcelColumn[];
}

interface ExcelForeignKey {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
}

interface ExcelEnum {
  name: string;
  values: { value: string; description: string }[];
}

interface ExcelTableGroup {
  name: string;
  tables: string[];
}

interface ImportResult {
  dbml: string;
  directSchema: ParsedSchema;
  stats: {
    files: number;
    tables: number;
    columns: number;
    refs: number;
    enums: number;
    groups: number;
    notes: number;
  };
  logs: string[];
  dataRowCounts: Map<string, number>;
  dataSheets: Map<string, { headers: string[]; rows: Record<string, string>[] }>;
}

function cleanText(text: unknown): string {
  if (text === null || text === undefined || text === '') return '';
  return String(text)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function processDescription(text: unknown): string {
  if (!text) return '';
  let clean = cleanText(text);
  if (!clean) return '';
  if (!clean.includes('headercolor')) {
    clean = clean.replace(/#/g, '//');
  }
  clean = clean.replace(/-/g, '_');
  clean = clean.replace(/'/g, "\\'");
  return clean;
}

function extractTableName(filename: string): string {
  return filename
    .replace(/\.xlsx$/i, '')
    .replace(/^DataDefine_/i, '')
    .replace(/_SheetDefine$/i, '');
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
      // Fallback: pick the row with most non-numeric string cells
      const stringCells = cells.filter((c) => isNaN(Number(c)));
      if (stringCells.length > bestScore) {
        bestScore = stringCells.length;
        bestIdx = r;
      }
    }
  }

  return bestIdx;
}

function findColumnIndex(headerRow: unknown[], name: string): number {
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  for (let i = 0; i < headerRow.length; i++) {
    const val = headerRow[i];
    if (val && String(val).toLowerCase().trim().replace(/\s+/g, '') === normalized) {
      return i;
    }
  }
  return -1;
}

function findPrimaryKeyColumnIndex(headerRow: unknown[]): number {
  const candidates = ['primarykey', 'primary key', 'pk', 'ispk', 'is_pk', 'isprimarykey'];
  for (const name of candidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return idx;
  }
  return -1;
}

function findDescriptionColumnIndex(headerRow: unknown[]): number {
  const candidates = ['description', 'desc', 'note', '설명', '비고'];
  for (const name of candidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return idx;
  }
  return 2;
}

function findNotNullColumnInfo(headerRow: unknown[]): { idx: number; inverted: boolean } {
  const directCandidates = ['notnull', 'not null', 'required'];
  for (const name of directCandidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return { idx, inverted: false };
  }

  const invertedCandidates = ['allowempty', 'allow empty', 'nullable'];
  for (const name of invertedCandidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return { idx, inverted: true };
  }

  return { idx: 4, inverted: false };
}

function findDefaultColumnIndex(headerRow: unknown[]): number {
  const candidates = ['default', 'defaultvalue', 'default value', '기본값'];
  for (const name of candidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return idx;
  }
  return 10;
}

function findLocalizeColumnIndex(headerRow: unknown[]): number {
  const candidates = ['localize', 'localise', 'l10n', 'loc', '번역', '로컬라이즈'];
  for (const name of candidates) {
    const idx = findColumnIndex(headerRow, name);
    if (idx >= 0) return idx;
  }
  return -1;
}

function processDefineSheet(wb: XLSX.WorkBook, filename: string, logs: string[]): {
  table: ExcelTable | null;
  fks: ExcelForeignKey[];
  noteCount: number;
} {
  const defineSheet = wb.Sheets['Define'];
  if (!defineSheet) return { table: null, fks: [], noteCount: 0 };

  const tableName = extractTableName(filename);

  let note = '';
  let headerColor = '';
  const tdSheet = wb.Sheets['TableDefine'];
  if (tdSheet) {
    const tdData = XLSX.utils.sheet_to_json<unknown[]>(tdSheet, { header: 1 });
    if (tdData[1]) {
      const row = tdData[1] as unknown[];
      if (row[0]) note = cleanText(row[0]);
      if (row[1]) headerColor = String(row[1]).trim();
    }
  }

  const data = XLSX.utils.sheet_to_json<unknown[]>(defineSheet, { header: 1 });
  if (data.length < 2) return { table: null, fks: [], noteCount: 0 };

  const headerRow = data[0] as unknown[];

  const descColIdx = findDescriptionColumnIndex(headerRow);
  const notNullInfo = findNotNullColumnInfo(headerRow);
  const defaultColIdx = findDefaultColumnIndex(headerRow);
  const pkColIdx = findPrimaryKeyColumnIndex(headerRow);
  const fkColIdx = findColumnIndex(headerRow, 'foreignkey');
  const enumColIdx = findColumnIndex(headerRow, 'enum');
  const locColIdx = findLocalizeColumnIndex(headerRow);

  const columns: ExcelColumn[] = [];
  const fks: ExcelForeignKey[] = [];
  let noteCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    const colName = cleanText(row[0]);
    const colType = cleanText(row[1]);
    if (!colName || !colType) continue;

    const colDesc = cleanText(row[descColIdx]);
    let isNotNull = false;
    if (notNullInfo.idx >= 0 && row[notNullInfo.idx] != null) {
      const val = String(row[notNullInfo.idx]).trim().toUpperCase();
      const isTruthy = val === 'TRUE' || val === '1' || val === 'Y' || val === 'YES' || val === 'O';
      isNotNull = notNullInfo.inverted ? !isTruthy : isTruthy;
    }
    const defaultVal = row[defaultColIdx] ? cleanText(row[defaultColIdx]) : null;

    let isPk = false;
    if (pkColIdx >= 0 && row[pkColIdx] != null) {
      const pkVal = String(row[pkColIdx]).trim().toUpperCase();
      isPk = pkVal === 'TRUE' || pkVal === '1' || pkVal === 'Y' || pkVal === 'YES' || pkVal === 'O' || pkVal === 'PK';
    }

    let isLocalize = false;
    if (locColIdx >= 0 && row[locColIdx] != null) {
      const locVal = String(row[locColIdx]).trim().toUpperCase();
      isLocalize = locVal === 'TRUE' || locVal === '1' || locVal === 'Y' || locVal === 'YES' || locVal === 'O';
    }

    if (colDesc) noteCount++;

    let enumType: string | null = null;
    if (enumColIdx >= 0 && row[enumColIdx]) {
      enumType = String(row[enumColIdx]).trim();
    }

    const finalType = (colType.toLowerCase() === 'enum' && enumType) ? enumType : colType;

    columns.push({
      name: colName,
      type: finalType,
      description: colDesc,
      isPk,
      isNotNull,
      isLocalize,
      defaultValue: defaultVal,
      enumType,
    });

    if (fkColIdx >= 0 && row[fkColIdx]) {
      const fkValue = String(row[fkColIdx]).trim();
      const refs = fkValue.includes('&') ? fkValue.split('&') : [fkValue];

      for (const ref of refs) {
        const target = ref.trim().replace(/^Table\s+/i, '');
        if (target) {
          fks.push({ sourceTable: tableName, sourceColumn: colName, targetTable: target });
        }
      }
    }
  }

  const descHeaderName = headerRow[descColIdx] ? String(headerRow[descColIdx]) : `col[${descColIdx}]`;
  const pkHeaderName = pkColIdx >= 0 ? (headerRow[pkColIdx] ? String(headerRow[pkColIdx]) : `col[${pkColIdx}]`) : 'N/A';
  const pkCount = columns.filter((c) => c.isPk).length;
  const locCount = columns.filter((c) => c.isLocalize).length;
  logs.push(`[Table] ${tableName}: ${columns.length} cols, ${pkCount} PKs, ${fks.length} FKs, ${locCount} L10n, ${noteCount} notes (pk: "${pkHeaderName}" @col${pkColIdx}, desc: "${descHeaderName}" @col${descColIdx})`);

  return {
    table: { name: tableName, note, headerColor, columns },
    fks,
    noteCount,
  };
}

function processEnumSheet(wb: XLSX.WorkBook, logs: string[]): ExcelEnum[] {
  const sheet = wb.Sheets['Enum'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const enumMap = new Map<string, { value: string; description: string }[]>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    const enumType = cleanText(row[0]);
    const enumValue = cleanText(row[1]);
    const enumDesc = cleanText(row[4]);

    if (enumType && enumValue) {
      if (!enumMap.has(enumType)) enumMap.set(enumType, []);
      enumMap.get(enumType)!.push({ value: enumValue, description: enumDesc });
    }
  }

  const enums: ExcelEnum[] = [];
  for (const [name, values] of enumMap) {
    enums.push({ name, values });
    logs.push(`[Enum] ${name}: ${values.length} values`);
  }
  return enums;
}

function processTableGroupSheet(wb: XLSX.WorkBook, logs: string[]): ExcelTableGroup[] {
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase() === 'tablegroup');
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const groupMap = new Map<string, string[]>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    const groupName = cleanText(row[0]);
    const tableName = cleanText(row[1]).replace(/^Table\s+/i, '');

    if (groupName && tableName) {
      if (!groupMap.has(groupName)) groupMap.set(groupName, []);
      groupMap.get(groupName)!.push(tableName);
    }
  }

  const groups: ExcelTableGroup[] = [];
  for (const [name, tables] of groupMap) {
    groups.push({ name, tables });
    logs.push(`[Group] ${name}: ${tables.length} tables`);
  }
  return groups;
}

const DBML_INVALID_NAME = /[^a-zA-Z0-9_]/;
const DBML_STARTS_WITH_DIGIT = /^[0-9]/;

function sanitizeDbmlName(name: string): { sanitized: string; wasFixed: boolean } {
  if (!name) return { sanitized: '_empty_', wasFixed: true };
  if (name.startsWith('#')) return { sanitized: '//' + name.slice(1), wasFixed: false };

  let fixed = name;
  let wasFixed = false;

  if (DBML_STARTS_WITH_DIGIT.test(fixed)) {
    fixed = '_' + fixed;
    wasFixed = true;
  }
  if (DBML_INVALID_NAME.test(fixed)) {
    fixed = fixed.replace(/[^a-zA-Z0-9_]/g, '_');
    wasFixed = true;
  }

  return { sanitized: fixed, wasFixed };
}

function formatTable(table: ExcelTable): string {
  const lines: string[] = [];

  const { sanitized: safeName } = sanitizeDbmlName(table.name);
  let header = `Table ${safeName}`;
  const attrs: string[] = [];
  if (table.note) {
    attrs.push(`Note: '${processDescription(table.note)}'`);
  }
  if (table.headerColor) {
    attrs.push(`headercolor: ${table.headerColor}`);
  }
  if (attrs.length > 0) {
    header += ` [${attrs.join(', ')}]`;
  }

  lines.push(header);
  lines.push('{');

  for (const col of table.columns) {
    const { sanitized: safeColName, wasFixed } = sanitizeDbmlName(col.name);

    if (safeColName.startsWith('//')) {
      lines.push(`  ${safeColName} ${col.type}`);
      continue;
    }

    const colAttrs: string[] = [];
    if (col.isPk) colAttrs.push('PK');
    if (col.isNotNull) colAttrs.push('not null');
    if (col.defaultValue) colAttrs.push(`default: "${col.defaultValue}"`);

    const noteParts: string[] = [];
    if (wasFixed) noteParts.push('[warning]');
    if (col.isLocalize) noteParts.push('[localize]');
    if (col.description) noteParts.push(processDescription(col.description));
    const noteStr = noteParts.join(' ');
    if (noteStr) {
      colAttrs.push(`note: '${noteStr}'`);
    }

    let line = `  ${safeColName} ${col.type}`;
    if (colAttrs.length > 0) {
      line += ` [${colAttrs.join(', ')}]`;
    }
    lines.push(line);
  }

  lines.push('}');
  return lines.join('\n');
}

function formatForeignKey(fk: ExcelForeignKey): string {
  return `Ref: ${fk.sourceTable}.${fk.sourceColumn} < ${fk.targetTable}`;
}

function formatEnum(en: ExcelEnum): string {
  const lines = [`enum ${en.name} {`];
  for (const val of en.values) {
    let line = `  ${val.value}`;
    if (val.description) {
      line += ` [note: '${processDescription(val.description)}']`;
    }
    lines.push(line);
  }
  lines.push('}');
  return lines.join('\n');
}

function formatTableGroup(group: ExcelTableGroup): string {
  const lines = [`TableGroup ${group.name} {`];
  for (const table of group.tables) {
    lines.push(`  ${table}`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function excelFilesToDbml(
  files: { name: string; data: ArrayBuffer }[]
): ImportResult {
  const logs: string[] = [];
  const tables: ExcelTable[] = [];
  const allFks: ExcelForeignKey[] = [];
  const allEnums: ExcelEnum[] = [];
  const allGroups: ExcelTableGroup[] = [];
  const dataRowCounts = new Map<string, number>();
  const dataSheets = new Map<string, { headers: string[]; rows: Record<string, string>[] }>();
  let totalNotes = 0;

  const META_SHEETS = new Set(['define', 'tabledefine', 'enum', 'tablegroup']);

  const xlsxFiles = files.filter(
    (f) => f.name.endsWith('.xlsx') && !f.name.startsWith('~$')
  );

  logs.push(`Found ${xlsxFiles.length} Excel files`);

  // Pass 1: Parse schema (Define, Enum, TableGroup)
  const parsedWorkbooks: { name: string; wb: XLSX.WorkBook }[] = [];
  for (const file of xlsxFiles) {
    try {
      const wb = XLSX.read(file.data, { type: 'array' });
      parsedWorkbooks.push({ name: file.name, wb });

      const { table, fks, noteCount } = processDefineSheet(wb, file.name, logs);
      if (table && table.columns.length > 0) {
        tables.push(table);
        allFks.push(...fks);
        totalNotes += noteCount;
      }

      const enums = processEnumSheet(wb, logs);
      allEnums.push(...enums);

      const groups = processTableGroupSheet(wb, logs);
      allGroups.push(...groups);
    } catch (err) {
      logs.push(`[ERROR] ${file.name}: ${err}`);
    }
  }

  // Build known column name sets from all parsed schema tables
  const knownColsMap = new Map<string, Set<string>>();
  for (const t of tables) {
    knownColsMap.set(t.name.toLowerCase(), new Set(t.columns.map((c) => c.name.toLowerCase())));
  }

  // Pass 2: Parse data sheets (for heatmap & data preview)
  for (const { name: fileName, wb } of parsedWorkbooks) {
    try {
      for (const sheetName of wb.SheetNames) {
        if (META_SHEETS.has(sheetName.toLowerCase())) continue;
        if (sheetName.includes('#')) continue;
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
        if (raw.length < 2) continue;

        const knownCols = knownColsMap.get(sheetName.toLowerCase());
        const headerIdx = findHeaderRow(raw, knownCols);

        const headerRow = (raw[headerIdx] as unknown[]).map((h) => String(h ?? '').trim());
        const validHeaders = headerRow.filter(Boolean);
        if (validHeaders.length === 0) continue;
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
        if (rows.length > 0) {
          const key = sheetName.toLowerCase();
          dataRowCounts.set(key, rows.length);
          dataSheets.set(key, { headers: validHeaders, rows });
        }
      }
    } catch (err) {
      logs.push(`[ERROR] ${fileName} data parse: ${err}`);
    }
  }

  if (dataRowCounts.size > 0) {
    logs.push(`[Heatmap] ${dataRowCounts.size} data sheets found, ${[...dataRowCounts.values()].reduce((a, b) => a + b, 0)} total rows`);
  }

  const parts: string[] = [];

  for (const table of tables) {
    parts.push(formatTable(table));
  }

  const validFks = allFks.filter((fk) => {
    const formatted = formatForeignKey(fk);
    return formatted !== null;
  });
  if (validFks.length > 0) {
    parts.push('// ─── Relationships ───');
    for (const fk of validFks) {
      parts.push(formatForeignKey(fk));
    }
  }

  const uniqueEnums = new Map<string, ExcelEnum>();
  for (const en of allEnums) {
    if (!uniqueEnums.has(en.name)) uniqueEnums.set(en.name, en);
  }
  if (uniqueEnums.size > 0) {
    parts.push('// ─── Enums ───');
    for (const en of uniqueEnums.values()) {
      parts.push(formatEnum(en));
    }
  }

  const mergedGroups = new Map<string, Set<string>>();
  for (const grp of allGroups) {
    if (!mergedGroups.has(grp.name)) mergedGroups.set(grp.name, new Set());
    for (const t of grp.tables) mergedGroups.get(grp.name)!.add(t);
  }
  if (mergedGroups.size > 0) {
    parts.push('// ─── Table Groups ───');
    for (const [name, tableSet] of mergedGroups) {
      parts.push(formatTableGroup({ name, tables: [...tableSet] }));
    }
  }

  const dbml = parts.join('\n\n');
  const totalColumns = tables.reduce((s, t) => s + t.columns.length, 0);

  // Build ParsedSchema directly from Excel data (bypasses DBML parser)
  const GROUP_PALETTE = [
    '#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd', '#56b6c2',
    '#d19a66', '#ff6b9d', '#48d1cc', '#ffb347', '#87ceeb', '#dda0dd',
  ];

  const fkTargets = new Set<string>();
  for (const fk of validFks) {
    fkTargets.add(`${fk.sourceTable}.${fk.sourceColumn}`.toLowerCase());
  }

  const schemaTables: SchemaTable[] = tables.map((t) => ({
    id: `public.${t.name}`,
    name: t.name,
    schema: 'public',
    alias: null,
    columns: t.columns.map((c): SchemaColumn => ({
      name: c.name,
      type: c.type,
      isPrimaryKey: c.isPk,
      isForeignKey: fkTargets.has(`${t.name}.${c.name}`.toLowerCase()),
      isUnique: false,
      isNotNull: c.isNotNull,
      isIncrement: false,
      isLocalize: c.isLocalize,
      isWarning: false,
      defaultValue: c.defaultValue,
      note: c.description || null,
    })),
    indexes: [],
    note: t.note || null,
    headerColor: t.headerColor || null,
    groupName: null,
    groupColor: null,
  }));

  const schemaRefs: SchemaRef[] = validFks.map((fk, i): SchemaRef => ({
    id: `ref_${fk.sourceTable}_${fk.targetTable}_${i}`,
    name: null,
    fromTable: `public.${fk.sourceTable}`,
    fromColumns: [fk.sourceColumn],
    toTable: `public.${fk.targetTable}`,
    toColumns: [],
    type: 'many-to-one',
    onDelete: null,
    onUpdate: null,
    color: null,
  }));

  const schemaEnums: SchemaEnum[] = [...uniqueEnums.values()].map((en) => ({
    name: en.name,
    schema: 'public',
    values: en.values.map((v) => ({ name: v.value, note: v.description || null })),
  }));

  const schemaGroups: SchemaTableGroup[] = [];
  let gi = 0;
  for (const [gname, tableSet] of mergedGroups) {
    const color = GROUP_PALETTE[gi % GROUP_PALETTE.length];
    schemaGroups.push({
      name: gname,
      tables: [...tableSet].map((tn) => `public.${tn}`),
      color,
      note: null,
    });
    for (const tn of tableSet) {
      const tbl = schemaTables.find((st) => st.name === tn);
      if (tbl) { tbl.groupName = gname; tbl.groupColor = color; }
    }
    gi++;
  }

  const directSchema: ParsedSchema = {
    tables: schemaTables,
    refs: schemaRefs,
    enums: schemaEnums,
    tableGroups: schemaGroups,
  };

  logs.push(`\nDone: ${tables.length} tables, ${totalColumns} columns, ${totalNotes} notes, ${validFks.length} refs, ${uniqueEnums.size} enums, ${mergedGroups.size} groups`);

  return {
    dbml,
    directSchema,
    stats: {
      files: xlsxFiles.length,
      tables: tables.length,
      columns: totalColumns,
      refs: validFks.length,
      enums: uniqueEnums.size,
      groups: mergedGroups.size,
      notes: totalNotes,
    },
    logs,
    dataRowCounts,
    dataSheets,
  };
}
