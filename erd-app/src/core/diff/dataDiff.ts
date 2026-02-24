/**
 * Compare data sheets from two commits.
 * Uses the dataRowCounts and dataSheets from excelFilesToDbml ImportResult.
 */

export interface DataTableDiff {
  tableName: string;
  kind: 'added' | 'removed' | 'modified' | 'unchanged';
  oldRowCount: number;
  newRowCount: number;
  rowDelta: number;
}

export interface DataDiffResult {
  tables: DataTableDiff[];
  summary: {
    totalOld: number;
    totalNew: number;
    totalDelta: number;
    tablesAdded: number;
    tablesRemoved: number;
    tablesModified: number;
    tablesUnchanged: number;
  };
}

export function diffData(
  oldCounts: Map<string, number>,
  newCounts: Map<string, number>,
): DataDiffResult {
  const tables: DataTableDiff[] = [];
  const allKeys = new Set([...oldCounts.keys(), ...newCounts.keys()]);

  for (const key of allKeys) {
    const oldC = oldCounts.get(key) ?? 0;
    const newC = newCounts.get(key) ?? 0;
    const hasOld = oldCounts.has(key);
    const hasNew = newCounts.has(key);

    let kind: DataTableDiff['kind'];
    if (!hasOld) kind = 'added';
    else if (!hasNew) kind = 'removed';
    else if (oldC !== newC) kind = 'modified';
    else kind = 'unchanged';

    tables.push({ tableName: key, kind, oldRowCount: oldC, newRowCount: newC, rowDelta: newC - oldC });
  }

  tables.sort((a, b) => {
    const order = { removed: 0, modified: 1, added: 2, unchanged: 3 };
    return (order[a.kind] - order[b.kind]) || a.tableName.localeCompare(b.tableName);
  });

  const totalOld = [...oldCounts.values()].reduce((s, v) => s + v, 0);
  const totalNew = [...newCounts.values()].reduce((s, v) => s + v, 0);

  return {
    tables,
    summary: {
      totalOld,
      totalNew,
      totalDelta: totalNew - totalOld,
      tablesAdded: tables.filter((t) => t.kind === 'added').length,
      tablesRemoved: tables.filter((t) => t.kind === 'removed').length,
      tablesModified: tables.filter((t) => t.kind === 'modified').length,
      tablesUnchanged: tables.filter((t) => t.kind === 'unchanged').length,
    },
  };
}
