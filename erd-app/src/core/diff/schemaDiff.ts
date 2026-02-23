import type { ParsedSchema, SchemaTable, SchemaColumn, SchemaEnum } from '../schema/types.ts';

export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ColumnDiff {
  name: string;
  kind: ChangeKind;
  details?: string[];
  oldCol?: SchemaColumn;
  newCol?: SchemaColumn;
}

export interface TableDiff {
  tableName: string;
  kind: ChangeKind;
  group?: string | null;
  columnDiffs: ColumnDiff[];
  allColumns: ColumnDiff[];
  oldTable?: SchemaTable;
  newTable?: SchemaTable;
}

export interface EnumDiff {
  enumName: string;
  kind: ChangeKind;
  addedValues: string[];
  removedValues: string[];
  unchangedValues: string[];
}

export interface SchemaDiffResult {
  tableDiffs: TableDiff[];
  enumDiffs: EnumDiff[];
  summary: {
    tablesAdded: number;
    tablesRemoved: number;
    tablesModified: number;
    columnsAdded: number;
    columnsRemoved: number;
    columnsModified: number;
    enumsAdded: number;
    enumsRemoved: number;
    enumsModified: number;
  };
}

function diffColumns(oldCols: SchemaColumn[], newCols: SchemaColumn[]): { changed: ColumnDiff[]; all: ColumnDiff[] } {
  const changed: ColumnDiff[] = [];
  const all: ColumnDiff[] = [];
  const oldMap = new Map(oldCols.map((c) => [c.name.toLowerCase(), c]));
  const newMap = new Map(newCols.map((c) => [c.name.toLowerCase(), c]));

  const seen = new Set<string>();

  for (const newCol of newCols) {
    const key = newCol.name.toLowerCase();
    seen.add(key);
    const oldCol = oldMap.get(key);
    if (!oldCol) {
      const d: ColumnDiff = { name: newCol.name, kind: 'added', newCol };
      changed.push(d);
      all.push(d);
    } else {
      const details: string[] = [];
      if (oldCol.type !== newCol.type) details.push(`type: ${oldCol.type} → ${newCol.type}`);
      if (oldCol.isPrimaryKey !== newCol.isPrimaryKey) details.push(`PK: ${oldCol.isPrimaryKey} → ${newCol.isPrimaryKey}`);
      if (oldCol.isNotNull !== newCol.isNotNull) details.push(`NotNull: ${oldCol.isNotNull} → ${newCol.isNotNull}`);
      if (oldCol.isUnique !== newCol.isUnique) details.push(`Unique: ${oldCol.isUnique} → ${newCol.isUnique}`);
      if (oldCol.isLocalize !== newCol.isLocalize) details.push(`Localize: ${oldCol.isLocalize} → ${newCol.isLocalize}`);
      if (oldCol.defaultValue !== newCol.defaultValue) details.push(`default: ${oldCol.defaultValue ?? 'null'} → ${newCol.defaultValue ?? 'null'}`);
      if (oldCol.note !== newCol.note) details.push(`note changed`);
      if (oldCol.isForeignKey !== newCol.isForeignKey) details.push(`FK: ${oldCol.isForeignKey} → ${newCol.isForeignKey}`);

      if (details.length > 0) {
        const d: ColumnDiff = { name: newCol.name, kind: 'modified', details, oldCol, newCol };
        changed.push(d);
        all.push(d);
      } else {
        all.push({ name: newCol.name, kind: 'unchanged', oldCol, newCol });
      }
    }
  }

  for (const oldCol of oldCols) {
    const key = oldCol.name.toLowerCase();
    if (!seen.has(key)) {
      const d: ColumnDiff = { name: oldCol.name, kind: 'removed', oldCol };
      changed.push(d);
      all.push(d);
    }
  }

  return { changed, all };
}

export function diffSchemas(oldSchema: ParsedSchema | null, newSchema: ParsedSchema | null): SchemaDiffResult {
  const oldTables = oldSchema?.tables ?? [];
  const newTables = newSchema?.tables ?? [];
  const oldEnums = oldSchema?.enums ?? [];
  const newEnums = newSchema?.enums ?? [];

  const oldTableMap = new Map(oldTables.map((t) => [t.name.toLowerCase(), t]));
  const newTableMap = new Map(newTables.map((t) => [t.name.toLowerCase(), t]));

  const tableDiffs: TableDiff[] = [];

  for (const [key, newT] of newTableMap) {
    const oldT = oldTableMap.get(key);
    if (!oldT) {
      const cols = newT.columns.map((c): ColumnDiff => ({ name: c.name, kind: 'added', newCol: c }));
      tableDiffs.push({
        tableName: newT.name, kind: 'added', group: newT.groupName,
        columnDiffs: cols, allColumns: cols, newTable: newT,
      });
    } else {
      const { changed, all } = diffColumns(oldT.columns, newT.columns);
      if (changed.length > 0) {
        tableDiffs.push({
          tableName: newT.name, kind: 'modified', group: newT.groupName,
          columnDiffs: changed, allColumns: all, oldTable: oldT, newTable: newT,
        });
      }
    }
  }

  for (const [key, oldT] of oldTableMap) {
    if (!newTableMap.has(key)) {
      const cols = oldT.columns.map((c): ColumnDiff => ({ name: c.name, kind: 'removed', oldCol: c }));
      tableDiffs.push({
        tableName: oldT.name, kind: 'removed', group: oldT.groupName,
        columnDiffs: cols, allColumns: cols, oldTable: oldT,
      });
    }
  }

  const kindOrder: Record<ChangeKind, number> = { removed: 0, modified: 1, added: 2, unchanged: 3 };
  tableDiffs.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.tableName.localeCompare(b.tableName));

  const oldEnumMap = new Map(oldEnums.map((e) => [e.name.toLowerCase(), e]));
  const newEnumMap = new Map(newEnums.map((e) => [e.name.toLowerCase(), e]));
  const enumDiffs: EnumDiff[] = [];

  for (const [key, newE] of newEnumMap) {
    const oldE = oldEnumMap.get(key);
    if (!oldE) {
      enumDiffs.push({ enumName: newE.name, kind: 'added', addedValues: newE.values.map((v) => v.name), removedValues: [], unchangedValues: [] });
    } else {
      const oldVals = new Set(oldE.values.map((v) => v.name));
      const newVals = new Set(newE.values.map((v) => v.name));
      const added = newE.values.filter((v) => !oldVals.has(v.name)).map((v) => v.name);
      const removed = oldE.values.filter((v) => !newVals.has(v.name)).map((v) => v.name);
      const unchanged = newE.values.filter((v) => oldVals.has(v.name)).map((v) => v.name);
      if (added.length > 0 || removed.length > 0) {
        enumDiffs.push({ enumName: newE.name, kind: 'modified', addedValues: added, removedValues: removed, unchangedValues: unchanged });
      }
    }
  }
  for (const [key, oldE] of oldEnumMap) {
    if (!newEnumMap.has(key)) {
      enumDiffs.push({ enumName: oldE.name, kind: 'removed', addedValues: [], removedValues: oldE.values.map((v) => v.name), unchangedValues: [] });
    }
  }

  const summary = {
    tablesAdded: tableDiffs.filter((d) => d.kind === 'added').length,
    tablesRemoved: tableDiffs.filter((d) => d.kind === 'removed').length,
    tablesModified: tableDiffs.filter((d) => d.kind === 'modified').length,
    columnsAdded: tableDiffs.reduce((s, t) => s + t.columnDiffs.filter((c) => c.kind === 'added').length, 0),
    columnsRemoved: tableDiffs.reduce((s, t) => s + t.columnDiffs.filter((c) => c.kind === 'removed').length, 0),
    columnsModified: tableDiffs.reduce((s, t) => s + t.columnDiffs.filter((c) => c.kind === 'modified').length, 0),
    enumsAdded: enumDiffs.filter((d) => d.kind === 'added').length,
    enumsRemoved: enumDiffs.filter((d) => d.kind === 'removed').length,
    enumsModified: enumDiffs.filter((d) => d.kind === 'modified').length,
  };

  return { tableDiffs, enumDiffs, summary };
}
