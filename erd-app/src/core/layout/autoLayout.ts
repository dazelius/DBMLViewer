import dagre from '@dagrejs/dagre';
import type { ParsedSchema } from '../schema/types.ts';
import type { TableNode } from './layoutTypes.ts';

const TABLE_HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;
const TABLE_PADDING = 20;
const TABLE_MIN_WIDTH = 220;
const CHAR_WIDTH = 7.5;
const COLLAPSED_HEIGHT = TABLE_HEADER_HEIGHT + 8;

export function measureTableSize(table: { name: string; columns: { name: string; type: string }[] }, collapsed = false): { width: number; height: number } {
  const headerWidth = table.name.length * 9 + 48;
  let maxColWidth = 0;
  for (const col of table.columns) {
    const colTextWidth = (col.name.length + col.type.length + 4) * CHAR_WIDTH + 60;
    if (colTextWidth > maxColWidth) maxColWidth = colTextWidth;
  }
  const width = Math.max(TABLE_MIN_WIDTH, headerWidth, maxColWidth) + TABLE_PADDING;
  const height = collapsed
    ? COLLAPSED_HEIGHT
    : TABLE_HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + 10;
  return { width, height };
}

export function computeLayout(
  schema: ParsedSchema,
  existingNodes: Map<string, TableNode>,
  collapsed = false
): Map<string, TableNode> {
  return runLayout(schema, existingNodes, false, collapsed);
}

export function forceArrangeLayout(schema: ParsedSchema, collapsed = false): Map<string, TableNode> {
  return runLayout(schema, new Map(), true, collapsed);
}

function runLayout(
  schema: ParsedSchema,
  existingNodes: Map<string, TableNode>,
  forceAll: boolean,
  collapsed = false
): Map<string, TableNode> {
  const sizes = new Map<string, { width: number; height: number }>();
  for (const table of schema.tables) {
    sizes.set(table.id, measureTableSize(table, collapsed));
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

export function computeFocusLayout(
  schema: ParsedSchema,
  focusTableId: string,
  collapsed = false
): { focusTableIds: Set<string>; nodes: Map<string, TableNode> } {
  const focusIds = new Set<string>([focusTableId]);
  for (const ref of schema.refs) {
    if (ref.fromTable === focusTableId) focusIds.add(ref.toTable);
    if (ref.toTable === focusTableId) focusIds.add(ref.fromTable);
  }

  const focusTables = schema.tables.filter((t) => focusIds.has(t.id));
  const focusRefs = schema.refs.filter((r) => focusIds.has(r.fromTable) && focusIds.has(r.toTable));

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: focusTables.length > 8 ? 'TB' : 'LR',
    nodesep: 50,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const sizes = new Map<string, { width: number; height: number }>();
  for (const table of focusTables) {
    const size = measureTableSize(table, collapsed);
    sizes.set(table.id, size);
    g.setNode(table.id, { width: size.width, height: size.height });
  }
  for (const ref of focusRefs) {
    if (g.hasNode(ref.fromTable) && g.hasNode(ref.toTable)) {
      g.setEdge(ref.fromTable, ref.toTable);
    }
  }
  dagre.layout(g);

  const nodes = new Map<string, TableNode>();
  for (const table of focusTables) {
    const nd = g.node(table.id);
    const size = sizes.get(table.id)!;
    nodes.set(table.id, {
      tableId: table.id,
      position: { x: nd.x - size.width / 2, y: nd.y - size.height / 2 },
      size,
      pinned: false,
    });
  }

  // dagre 배치 후 교차 최소화 후처리
  const optimized = minimizeFocusCrossings(nodes, focusRefs);
  return { focusTableIds: focusIds, nodes: optimized };
}

// ── 포커스 모드 선 교차 최소화 ──────────────────────────────────────────────
/**
 * dagre가 배치한 노드들을 rank(X 좌표 기준 열) 단위로 묶고,
 * 각 rank 내 노드 순서를 바꿔가며 전체 교차 수가 최소인 배열을 선택한다.
 * - rank 내 노드 ≤ 7개 → 완전 탐색 (최대 5040 순열)
 * - rank 내 노드 ≥ 8개 → 중심값(barycentric) 정렬
 * 3 패스 반복으로 수렴.
 */
function minimizeFocusCrossings(
  nodes: Map<string, TableNode>,
  refs: { fromTable: string; toTable: string }[]
): Map<string, TableNode> {
  if (refs.length === 0) return nodes;

  const RANK_TOL = 60; // 같은 rank 로 볼 X 허용 범위 (px)

  // 1. X 위치 기준 rank 그룹 생성 ─────────────────────────────────────────
  const rankCX: number[] = [];
  const rankGroups: string[][] = [];

  const sorted = [...nodes.entries()].sort(
    ([, a], [, b]) => (a.position.x + a.size.width / 2) - (b.position.x + b.size.width / 2)
  );

  for (const [id, node] of sorted) {
    const cx = node.position.x + node.size.width / 2;
    let placed = false;
    for (let r = 0; r < rankCX.length; r++) {
      if (Math.abs(rankCX[r] - cx) < RANK_TOL) {
        rankGroups[r].push(id);
        placed = true;
        break;
      }
    }
    if (!placed) { rankCX.push(cx); rankGroups.push([id]); }
  }

  // 2. 각 rank를 현재 Y 오름차순으로 정렬 ────────────────────────────────
  const nodesCopy = new Map(nodes); // 최적화 도중 갱신에 쓸 복사본
  for (const rank of rankGroups) {
    rank.sort((a, b) => {
      const na = nodesCopy.get(a)!, nb = nodesCopy.get(b)!;
      return (na.position.y + na.size.height / 2) - (nb.position.y + nb.size.height / 2);
    });
  }

  // 3. 두 rank 사이 교차 수 ────────────────────────────────────────────────
  const crossingsBetween = (rankA: string[], rankB: string[]): number => {
    const edges: [number, number][] = [];
    for (const ref of refs) {
      for (let ai = 0; ai < rankA.length; ai++) {
        let bi = -1;
        if (ref.fromTable === rankA[ai]) bi = rankB.indexOf(ref.toTable);
        else if (ref.toTable === rankA[ai]) bi = rankB.indexOf(ref.fromTable);
        if (bi >= 0) edges.push([ai, bi]);
      }
    }
    let count = 0;
    for (let i = 0; i < edges.length; i++)
      for (let j = i + 1; j < edges.length; j++)
        if ((edges[i][0] - edges[j][0]) * (edges[i][1] - edges[j][1]) < 0) count++;
    return count;
  };

  // 4. testOrder를 rank r에 적용했을 때의 총 교차 수 ─────────────────────
  const totalCrossings = (r: number, testOrder: string[]): number => {
    let total = 0;
    const saved = rankGroups[r];
    rankGroups[r] = testOrder;
    for (let other = 0; other < rankGroups.length; other++) {
      if (other === r) continue;
      total += crossingsBetween(rankGroups[r], rankGroups[other]);
    }
    rankGroups[r] = saved;
    return total;
  };

  // 5. 순열 생성 ─────────────────────────────────────────────────────────
  function perms<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [[...arr]];
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of perms(rest)) res.push([arr[i], ...p]);
    }
    return res;
  }

  // 6. 중심값 정렬 (대형 rank) ───────────────────────────────────────────
  const barycentricSort = (rank: string[]): string[] => {
    const scores = new Map<string, number>();
    for (const id of rank) {
      const ys: number[] = [];
      for (const ref of refs) {
        let oid: string | null = null;
        if (ref.fromTable === id && !rank.includes(ref.toTable)) oid = ref.toTable;
        else if (ref.toTable === id && !rank.includes(ref.fromTable)) oid = ref.fromTable;
        if (oid) {
          const on = nodesCopy.get(oid);
          if (on) ys.push(on.position.y + on.size.height / 2);
        }
      }
      scores.set(id, ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length
        : (nodesCopy.get(id)!.position.y + nodesCopy.get(id)!.size.height / 2));
    }
    return [...rank].sort((a, b) => (scores.get(a) || 0) - (scores.get(b) || 0));
  };

  // 7. 3 패스 반복 최적화 ───────────────────────────────────────────────
  for (let pass = 0; pass < 3; pass++) {
    for (let r = 0; r < rankGroups.length; r++) {
      const rank = rankGroups[r];
      if (rank.length <= 1) continue;

      // 현재 Y 슬롯 (rank는 이미 Y 정렬된 상태)
      const ySlots = rank.map(id => nodesCopy.get(id)!.position.y);

      let bestOrder: string[];
      if (rank.length <= 7) {
        let bestScore = Infinity;
        bestOrder = [...rank];
        for (const perm of perms(rank)) {
          const score = totalCrossings(r, perm);
          if (score < bestScore) { bestScore = score; bestOrder = perm; }
          if (bestScore === 0) break; // 이미 완벽
        }
      } else {
        bestOrder = barycentricSort(rank);
      }

      // 변화가 있을 때만 적용
      if (bestOrder.join('\0') !== rank.join('\0')) {
        for (let i = 0; i < bestOrder.length; i++) {
          const id = bestOrder[i];
          const node = nodesCopy.get(id)!;
          const updated = { ...node, position: { x: node.position.x, y: ySlots[i] } };
          nodesCopy.set(id, updated);
        }
        rankGroups[r] = bestOrder;
      }
    }
  }

  return nodesCopy;
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
