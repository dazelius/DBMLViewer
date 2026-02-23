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
  try {
    const db = Parser.parse(dbml, 'dbml');
    const schema = transformDatabase(db);
    return { schema, errors: [] };
  } catch (err: unknown) {
    const error = err as { diags?: { message: string; location?: { start?: { line: number; column: number } } }[] ; message?: string };
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
      const columns: SchemaColumn[] = (table.fields || []).map((f: any) => ({
        name: f.name,
        type: f.type?.type_name ?? f.type ?? 'unknown',
        isPrimaryKey: !!f.pk,
        isForeignKey: false,
        isUnique: !!f.unique,
        isNotNull: !!f.not_null,
        isIncrement: !!f.increment,
        defaultValue: f.dbdefault?.value ?? null,
        note: f.note ?? null,
      }));

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
