import dagre from '@dagrejs/dagre';
import type { ParsedSchema } from '../schema/types.ts';
import type { TableNode } from './layoutTypes.ts';

const TABLE_HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;
const TABLE_PADDING = 20;
const TABLE_MIN_WIDTH = 220;
const CHAR_WIDTH = 7.5;

export function measureTableSize(table: { name: string; columns: { name: string; type: string }[] }): { width: number; height: number } {
  const headerWidth = table.name.length * 9 + 48;
  let maxColWidth = 0;
  for (const col of table.columns) {
    const colTextWidth = (col.name.length + col.type.length + 4) * CHAR_WIDTH + 60;
    if (colTextWidth > maxColWidth) maxColWidth = colTextWidth;
  }
  const width = Math.max(TABLE_MIN_WIDTH, headerWidth, maxColWidth) + TABLE_PADDING;
  const height = TABLE_HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + 10;
  return { width, height };
}

export function computeLayout(
  schema: ParsedSchema,
  existingNodes: Map<string, TableNode>
): Map<string, TableNode> {
  return runLayout(schema, existingNodes, false);
}

export function forceArrangeLayout(schema: ParsedSchema): Map<string, TableNode> {
  return runLayout(schema, new Map(), true);
}

function runLayout(
  schema: ParsedSchema,
  existingNodes: Map<string, TableNode>,
  forceAll: boolean
): Map<string, TableNode> {
  const sizes = new Map<string, { width: number; height: number }>();
  for (const table of schema.tables) {
    sizes.set(table.id, measureTableSize(table));
  }

  if (schema.tableGroups.length > 0) {
    if (forceAll) {
      return groupAwareLayout(schema, sizes);
    }
    // For initial load / incremental: still use group-aware layout but preserve pinned nodes
    const hasPinned = Array.from(existingNodes.values()).some((n) => n.pinned);
    if (!hasPinned) {
      return groupAwareLayout(schema, sizes);
    }
  }

  return flatDagreLayout(schema, sizes, existingNodes, forceAll);
}

function flatDagreLayout(
  schema: ParsedSchema,
  sizes: Map<string, { width: number; height: number }>,
  existingNodes: Map<string, TableNode>,
  forceAll: boolean,
): Map<string, TableNode> {
  const n = schema.tables.length;
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: n > 25 ? 'TB' : 'LR',
    nodesep: n > 40 ? 60 : n > 20 ? 50 : 40,
    ranksep: n > 40 ? 120 : n > 20 ? 100 : 80,
    marginx: 60,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const table of schema.tables) {
    const size = sizes.get(table.id)!;
    g.setNode(table.id, { width: size.width, height: size.height });
  }
  for (const ref of schema.refs) {
    if (g.hasNode(ref.fromTable) && g.hasNode(ref.toTable)) {
      g.setEdge(ref.fromTable, ref.toTable);
    }
  }
  dagre.layout(g);

  const result = new Map<string, TableNode>();
  for (const table of schema.tables) {
    const size = sizes.get(table.id)!;
    const existing = existingNodes.get(table.id);
    if (!forceAll && existing?.pinned) {
      result.set(table.id, { ...existing, size });
    } else {
      const nd = g.node(table.id);
      result.set(table.id, {
        tableId: table.id,
        position: { x: nd.x - size.width / 2, y: nd.y - size.height / 2 },
        size,
        pinned: false,
      });
    }
  }
  return result;
}

/**
 * Group-aware layout:
 * 1) Each group is laid out internally with dagre (TB direction for readability)
 * 2) Groups are then placed on a 2D grid, sorted by size (largest first for better packing)
 * 3) Cross-group relationships are handled gracefully
 */
function groupAwareLayout(
  schema: ParsedSchema,
  sizes: Map<string, { width: number; height: number }>
): Map<string, TableNode> {
  const tableToGroup = new Map<string, string>();
  for (const grp of schema.tableGroups) {
    for (const tid of grp.tables) tableToGroup.set(tid, grp.name);
  }

  const groupOrder: string[] = schema.tableGroups.map((g) => g.name);
  const ungroupedTables = schema.tables.filter((t) => !tableToGroup.has(t.id));
  if (ungroupedTables.length > 0) groupOrder.push('__ungrouped');

  const groupTableIds = new Map<string, string[]>();
  for (const grp of schema.tableGroups) {
    const ids = grp.tables.filter((tid) => schema.tables.some((t) => t.id === tid));
    if (ids.length > 0) groupTableIds.set(grp.name, ids);
  }
  if (ungroupedTables.length > 0) {
    groupTableIds.set('__ungrouped', ungroupedTables.map((t) => t.id));
  }

  // Internal refs per group
  const groupInternalRefs = new Map<string, { from: string; to: string }[]>();
  for (const gName of groupOrder) {
    const members = new Set(groupTableIds.get(gName) ?? []);
    const refs: { from: string; to: string }[] = [];
    for (const ref of schema.refs) {
      if (members.has(ref.fromTable) && members.has(ref.toTable)) {
        refs.push({ from: ref.fromTable, to: ref.toTable });
      }
    }
    groupInternalRefs.set(gName, refs);
  }

  interface GroupBlock {
    name: string;
    nodes: Map<string, { lx: number; ly: number }>;
    w: number;
    h: number;
  }

  const blocks: GroupBlock[] = [];

  for (const gName of groupOrder) {
    const tableIds = groupTableIds.get(gName) ?? [];
    if (tableIds.length === 0) continue;

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: tableIds.length > 6 ? 'TB' : 'LR',
      nodesep: 40,
      ranksep: 70,
      marginx: 20,
      marginy: 20,
    });
    g.setDefaultEdgeLabel(() => ({}));

    for (const tid of tableIds) {
      const size = sizes.get(tid)!;
      g.setNode(tid, { width: size.width, height: size.height });
    }
    for (const ref of groupInternalRefs.get(gName) ?? []) {
      if (g.hasNode(ref.from) && g.hasNode(ref.to)) {
        g.setEdge(ref.from, ref.to);
      }
    }
    dagre.layout(g);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const localNodes = new Map<string, { lx: number; ly: number }>();

    for (const tid of tableIds) {
      const nd = g.node(tid);
      if (!nd) continue;
      const size = sizes.get(tid)!;
      const lx = nd.x - size.width / 2;
      const ly = nd.y - size.height / 2;
      localNodes.set(tid, { lx, ly });
      minX = Math.min(minX, lx);
      minY = Math.min(minY, ly);
      maxX = Math.max(maxX, lx + size.width);
      maxY = Math.max(maxY, ly + size.height);
    }

    for (const [tid, pos] of localNodes) {
      localNodes.set(tid, { lx: pos.lx - minX, ly: pos.ly - minY });
    }

    blocks.push({ name: gName, nodes: localNodes, w: maxX - minX, h: maxY - minY });
  }

  // Use a meta-graph to determine group ordering based on cross-group refs
  const crossGroupEdges = new Map<string, Set<string>>();
  for (const ref of schema.refs) {
    const gFrom = tableToGroup.get(ref.fromTable);
    const gTo = tableToGroup.get(ref.toTable);
    if (gFrom && gTo && gFrom !== gTo) {
      if (!crossGroupEdges.has(gFrom)) crossGroupEdges.set(gFrom, new Set());
      crossGroupEdges.get(gFrom)!.add(gTo);
    }
  }

  // Sort groups: use dagre on the meta-graph for ordering, fallback to size
  const sortedBlocks = sortBlocksByMetaGraph(blocks, crossGroupEdges);

  // Place blocks in a grid with adaptive columns
  const PADDING = 100;
  const totalArea = sortedBlocks.reduce((a, b) => a + (b.w + PADDING) * (b.h + PADDING), 0);
  const targetWidth = Math.max(3000, Math.sqrt(totalArea) * 1.4);

  // Shelf-packing: place blocks left to right, wrap to next row when exceeding targetWidth
  const result = new Map<string, TableNode>();
  let curX = 0;
  let curY = 0;
  let rowH = 0;

  for (const block of sortedBlocks) {
    if (curX > 0 && curX + block.w > targetWidth) {
      curX = 0;
      curY += rowH + PADDING;
      rowH = 0;
    }

    for (const [tid, pos] of block.nodes) {
      const size = sizes.get(tid)!;
      result.set(tid, {
        tableId: tid,
        position: { x: curX + pos.lx, y: curY + pos.ly },
        size,
        pinned: false,
      });
    }

    rowH = Math.max(rowH, block.h);
    curX += block.w + PADDING;
  }

  return result;
}

function sortBlocksByMetaGraph(
  blocks: { name: string; nodes: Map<string, { lx: number; ly: number }>; w: number; h: number }[],
  crossEdges: Map<string, Set<string>>
): typeof blocks {
  if (blocks.length <= 1) return blocks;

  // Try dagre on meta-graph for topological ordering
  try {
    const mg = new dagre.graphlib.Graph();
    mg.setGraph({ rankdir: 'LR' });
    mg.setDefaultEdgeLabel(() => ({}));
    for (const b of blocks) {
      mg.setNode(b.name, { width: b.w, height: b.h });
    }
    for (const [from, tos] of crossEdges) {
      for (const to of tos) {
        if (mg.hasNode(from) && mg.hasNode(to)) {
          mg.setEdge(from, to);
        }
      }
    }
    dagre.layout(mg);

    // Sort by x position from meta-graph
    return [...blocks].sort((a, b) => {
      const na = mg.node(a.name);
      const nb = mg.node(b.name);
      if (na && nb) return na.x - nb.x;
      return 0;
    });
  } catch {
    // Fallback: sort by area descending (largest first for better packing)
    return [...blocks].sort((a, b) => (b.w * b.h) - (a.w * a.h));
  }
}
