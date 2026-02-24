import type { ParsedSchema, ParseError, SchemaTable, SchemaColumn, SchemaRef, RelationType, SchemaEnum, SchemaIndex, SchemaTableGroup } from '../schema/types.ts';

import { Parser } from '@dbml/core';

// 16 visually distinct, vibrant group colors (dark-mode friendly)
const GROUP_PALETTE = [
  '#e06c75', // red
  '#61afef', // blue
  '#98c379', // green
  '#e5c07b', // gold
  '#c678dd', // purple
  '#56b6c2', // cyan
  '#d19a66', // orange
  '#ff6b9d', // pink
  '#48d1cc', // teal
  '#ffb347', // amber
  '#87ceeb', // sky
  '#dda0dd', // plum
  '#90ee90', // lime
  '#f0e68c', // khaki
  '#ff7f50', // coral
  '#b0c4de', // steel
];

function resolveRelationType(epToken: string): RelationType {
  switch (epToken) {
    case '<': return 'one-to-many';
    case '>': return 'many-to-one';
    case '-': return 'one-to-one';
    case '<>': return 'many-to-many';
    default: return 'many-to-one';
  }
}

export function parseDBML(dbml: string): { schema: ParsedSchema | null; errors: ParseError[] } {
  // 1) Try full parse
  try {
    const db = Parser.parse(dbml, 'dbml');
    const schema = transformDatabase(db);
    return { schema, errors: [] };
  } catch (firstErr: unknown) {
    // 2) Fallback: strip Ref lines and try again
    const fallback = tryParseWithoutRefs(dbml);
    if (fallback) {
      return fallback;
    }

    // 3) If even that fails, return original errors
    const error = firstErr as { diags?: { message: string; location?: { start?: { line: number; column: number } } }[] ; message?: string };
    if (error.diags && Array.isArray(error.diags)) {
      const errors: ParseError[] = error.diags.map((d: { message: string; location?: { start?: { line: number; column: number } } }) => ({
        message: d.message,
        line: d.location?.start?.line ?? 1,
        column: d.location?.start?.column ?? 1,
      }));
      return { schema: null, errors };
    }
    return {
      schema: null,
      errors: [{ message: error.message ?? 'Unknown parse error', line: 1, column: 1 }],
    };
  }
}

/**
 * Fallback parser: strips all Ref lines, parses tables/enums/groups,
 * then manually resolves valid refs from the original DBML text.
 * Invalid refs are reported as warnings (not blocking errors).
 */
function tryParseWithoutRefs(dbml: string): { schema: ParsedSchema; errors: ParseError[] } | null {
  const lines = dbml.split('\n');
  const refLineIndices: number[] = [];
  const strippedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^Ref\s*[:{]/i.test(trimmed) || /^Ref\s+\w/i.test(trimmed)) {
      refLineIndices.push(i);
      strippedLines.push('// ' + lines[i]);
    } else {
      strippedLines.push(lines[i]);
    }
  }

  if (refLineIndices.length === 0) return null;

  try {
    const db = Parser.parse(strippedLines.join('\n'), 'dbml');
    const schema = transformDatabase(db);

    const tableIds = new Set(schema.tables.map((t) => t.id));
    const tableColMap = new Map<string, Set<string>>();
    for (const t of schema.tables) {
      tableColMap.set(t.id, new Set(t.columns.map((c) => c.name)));
    }

    const warnings: ParseError[] = [];
    const REF_PATTERN = /^Ref\s*:?\s*(\w+)\.(\w+)\s*([<>\-]+)\s*(\w+)(?:\.(\w+))?/i;

    for (const idx of refLineIndices) {
      const line = lines[idx].trim();
      const m = line.match(REF_PATTERN);
      if (!m) {
        warnings.push({ message: `[!] 파싱 불가 Ref: ${line}`, line: idx + 1, column: 1 });
        continue;
      }

      const [, fromTable, fromCol, relOp, toTable, toCol] = m;
      const fromId = `public.${fromTable}`;
      const toId = `public.${toTable}`;

      const issues: string[] = [];
      if (!tableIds.has(fromId)) issues.push(`테이블 '${fromTable}' 없음`);
      else if (!tableColMap.get(fromId)?.has(fromCol)) issues.push(`'${fromTable}.${fromCol}' 컬럼 없음`);
      if (!tableIds.has(toId)) issues.push(`테이블 '${toTable}' 없음`);
      else if (toCol && !tableColMap.get(toId)?.has(toCol)) issues.push(`'${toTable}.${toCol}' 컬럼 없음`);

      if (issues.length > 0) {
        warnings.push({ message: `[!] ${line} — ${issues.join(', ')}`, line: idx + 1, column: 1 });
        continue;
      }

      const ref: SchemaRef = {
        id: `ref_${fromId}_${toId}_${schema.refs.length}`,
        name: null,
        fromTable: fromId,
        fromColumns: [fromCol],
        toTable: toId,
        toColumns: toCol ? [toCol] : [],
        type: resolveRelationType(relOp.includes('<') ? '<' : relOp.includes('>') ? '>' : '-'),
        onDelete: null,
        onUpdate: null,
        color: null,
      };
      schema.refs.push(ref);

      const table = schema.tables.find((t) => t.id === fromId);
      if (table) {
        const col = table.columns.find((c) => c.name === fromCol);
        if (col) col.isForeignKey = true;
      }
    }

    return { schema, errors: warnings };
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function transformDatabase(db: any): ParsedSchema {
  const tables: SchemaTable[] = [];
  const refs: SchemaRef[] = [];
  const enums: SchemaEnum[] = [];
  const tableGroups: SchemaTableGroup[] = [];

  const schemas = db.schemas || [];
  for (const s of schemas) {
    const schemaName = s.name || 'public';

    for (const table of s.tables || []) {
      const columns: SchemaColumn[] = (table.fields || []).map((f: any) => {
        const rawNote: string | null = f.note ?? null;
        const hasLocalize = rawNote ? /\[localize\]/i.test(rawNote) : false;
        const hasWarning = rawNote ? /\[warning\]/i.test(rawNote) : false;
        const cleanNote = rawNote
          ? rawNote.replace(/\[localize\]\s*/i, '').replace(/\[warning\]\s*/i, '').trim() || null
          : null;
        return {
          name: f.name,
          type: f.type?.type_name ?? f.type ?? 'unknown',
          isPrimaryKey: !!f.pk,
          isForeignKey: false,
          isUnique: !!f.unique,
          isNotNull: !!f.not_null,
          isIncrement: !!f.increment,
          isLocalize: hasLocalize,
          isWarning: hasWarning,
          defaultValue: f.dbdefault?.value ?? null,
          note: cleanNote,
        };
      });

      const indexes: SchemaIndex[] = (table.indexes || []).map((idx: any) => ({
        name: idx.name ?? null,
        columns: (idx.columns || []).map((c: any) => c.value),
        isPrimaryKey: !!idx.pk,
        isUnique: !!idx.unique,
        type: idx.type ?? null,
      }));

      const tbl: SchemaTable = {
        id: `${schemaName}.${table.name}`,
        name: table.name,
        schema: schemaName,
        alias: table.alias ?? null,
        columns,
        indexes,
        note: table.note ?? null,
        headerColor: table.headerColor ?? null,
        groupName: null,
        groupColor: null,
      };
      tables.push(tbl);
    }

    for (const ref of s.refs || []) {
      const endpoints = ref.endpoints || [];
      if (endpoints.length >= 2) {
        const ep0 = endpoints[0];
        const ep1 = endpoints[1];
        const fromTableName = ep0.tableName;
        const toTableName = ep1.tableName;
        const fromSchema = ep0.schemaName || schemaName;
        const toSchema = ep1.schemaName || schemaName;

        const r: SchemaRef = {
          id: `ref_${fromSchema}.${fromTableName}_${toSchema}.${toTableName}_${refs.length}`,
          name: ref.name ?? null,
          fromTable: `${fromSchema}.${fromTableName}`,
          fromColumns: ep0.fieldNames || [],
          toTable: `${toSchema}.${toTableName}`,
          toColumns: ep1.fieldNames || [],
          type: resolveRelationType(ep1.relation),
          onDelete: ref.onDelete ?? null,
          onUpdate: ref.onUpdate ?? null,
          color: ref.color ?? null,
        };
        refs.push(r);
      }
    }

    for (const en of s.enums || []) {
      enums.push({
        name: en.name,
        schema: schemaName,
        values: (en.values || []).map((v: any) => ({ name: v.name, note: v.note ?? null })),
      });
    }

    for (const tg of s.tableGroups || []) {
      tableGroups.push({
        name: tg.name,
        tables: (tg.tables || []).map((t: any) => `${schemaName}.${t.name ?? t}`),
        color: tg.color ?? null,
        note: tg.note ?? null,
      });
    }
  }

  // Assign group colors from palette, then stamp onto tables
  for (let gi = 0; gi < tableGroups.length; gi++) {
    const grp = tableGroups[gi];
    const color = grp.color ?? GROUP_PALETTE[gi % GROUP_PALETTE.length];
    grp.color = color;

    for (const tableId of grp.tables) {
      const tbl = tables.find((t) => t.id === tableId);
      if (tbl) {
        tbl.groupName = grp.name;
        tbl.groupColor = color;
      }
    }
  }

  // Mark FK columns
  for (const ref of refs) {
    const table = tables.find((t) => t.id === ref.fromTable);
    if (table) {
      for (const colName of ref.fromColumns) {
        const col = table.columns.find((c) => c.name === colName);
        if (col) col.isForeignKey = true;
      }
    }
  }

  return { tables, refs, enums, tableGroups };
}
