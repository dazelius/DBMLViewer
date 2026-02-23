import type { ParsedSchema } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';
import { drawGrid } from './GridRenderer.ts';
import { drawTableGroups } from './GroupRenderer.ts';
import { drawTable, drawTableCollapsed } from './TableRenderer.ts';
import { drawRelationship, determineConnectionSide } from './RelationshipRenderer.ts';

export interface ExploreVisuals {
  impactActive: boolean;
  impactDepthMap: Map<string, number>;
  columnSearchActive: boolean;
  columnSearchResults: Set<string>;
  pathFinderActive: boolean;
  pathFinderPath: string[];
  collapseMode: boolean;
  hiddenGroups: Set<string>;
}

const DEFAULT_EXPLORE: ExploreVisuals = {
  impactActive: false,
  impactDepthMap: new Map(),
  columnSearchActive: false,
  columnSearchResults: new Set(),
  pathFinderActive: false,
  pathFinderPath: [],
  collapseMode: false,
  hiddenGroups: new Set(),
};

function getTableOpacity(
  tableId: string,
  explore: ExploreVisuals
): number {
  if (explore.impactActive) {
    const depth = explore.impactDepthMap.get(tableId);
    if (depth === undefined) return 0.08;
    if (depth === 0) return 1;
    if (depth === 1) return 0.9;
    if (depth === 2) return 0.5;
    return 0.25;
  }
  if (explore.columnSearchActive) {
    return explore.columnSearchResults.has(tableId) ? 1 : 0.1;
  }
  if (explore.pathFinderActive) {
    return explore.pathFinderPath.includes(tableId) ? 1 : 0.08;
  }
  return 1;
}

function getRefVisuals(
  ref: { fromTable: string; toTable: string },
  explore: ExploreVisuals,
  hoveredTableId: string | null
): { highlight: boolean; dimmed: boolean } {
  const hoverHighlight = hoveredTableId != null &&
    (ref.fromTable === hoveredTableId || ref.toTable === hoveredTableId);

  if (explore.impactActive) {
    const fromD = explore.impactDepthMap.get(ref.fromTable);
    const toD = explore.impactDepthMap.get(ref.toTable);
    if (fromD !== undefined && toD !== undefined) {
      return { highlight: hoverHighlight || (fromD === 0 || toD === 0), dimmed: false };
    }
    return { highlight: false, dimmed: true };
  }
  if (explore.columnSearchActive) {
    const both = explore.columnSearchResults.has(ref.fromTable) && explore.columnSearchResults.has(ref.toTable);
    return { highlight: hoverHighlight || both, dimmed: !both && !hoverHighlight };
  }
  if (explore.pathFinderActive) {
    const path = explore.pathFinderPath;
    const fi = path.indexOf(ref.fromTable);
    const ti = path.indexOf(ref.toTable);
    const onPath = fi >= 0 && ti >= 0 && Math.abs(fi - ti) === 1;
    return { highlight: hoverHighlight || onPath, dimmed: !onPath && !hoverHighlight };
  }
  if (hoveredTableId) {
    return { highlight: hoverHighlight, dimmed: !hoverHighlight };
  }
  return { highlight: false, dimmed: false };
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  schema: ParsedSchema | null,
  nodes: Map<string, TableNode>,
  transform: ViewTransform,
  selectedTableId: string | null,
  selectedRefId: string | null,
  hoveredTableId: string | null = null,
  explore: ExploreVisuals = DEFAULT_EXPLORE,
  hoveredColumn: { tableId: string; columnIndex: number } | null = null
) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const bgColor = isDark ? '#0f1117' : '#f8f9fc';

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, width, height, transform, isDark);

  if (!schema) {
    const fontSize = 14;
    ctx.font = `400 ${fontSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = isDark ? '#5c6078' : '#8c90a4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Write DBML code on the left to see the diagram', width / 2, height / 2);
    ctx.textAlign = 'start';
    return;
  }

  const hasExploreFilter = explore.impactActive || explore.columnSearchActive || explore.pathFinderActive;

  // Determine which tables are visible (group filtering)
  const tableGroupMap = new Map<string, string>();
  for (const grp of schema.tableGroups) {
    for (const tid of grp.tables) tableGroupMap.set(tid, grp.name);
  }
  const isTableVisible = (tableId: string) => {
    if (explore.hiddenGroups.size === 0) return true;
    const grp = tableGroupMap.get(tableId);
    if (!grp) return true;
    return !explore.hiddenGroups.has(grp);
  };

  // Layer 1: Group bounding boxes
  if (schema.tableGroups.length > 0) {
    const visibleGroups = schema.tableGroups.filter((g) => !explore.hiddenGroups.has(g.name));
    if (visibleGroups.length > 0) {
      drawTableGroups(ctx, visibleGroups, nodes, transform, isDark);
    }
  }

  // Layer 2: Relationships — precompute arm offsets to stagger overlapping lines
  const ARM_SPACING = 10;
  const visibleRefs = schema.refs.filter(
    (r) => isTableVisible(r.fromTable) && isTableVisible(r.toTable)
  );

  // Group connections by (tableId:side) and assign staggered offsets
  const portSlots = new Map<string, { refId: string; targetY: number; role: 'from' | 'to' }[]>();
  for (const ref of visibleRefs) {
    const fromNode = nodes.get(ref.fromTable);
    const toNode = nodes.get(ref.toTable);
    if (!fromNode || !toNode) continue;

    const { fromSide, toSide } = determineConnectionSide(fromNode, toNode);

    const fKey = `${ref.fromTable}:${fromSide}`;
    const tKey = `${ref.toTable}:${toSide}`;

    if (!portSlots.has(fKey)) portSlots.set(fKey, []);
    portSlots.get(fKey)!.push({ refId: ref.id, targetY: toNode.position.y, role: 'from' });

    if (!portSlots.has(tKey)) portSlots.set(tKey, []);
    portSlots.get(tKey)!.push({ refId: ref.id, targetY: fromNode.position.y, role: 'to' });
  }

  const armOffsets = new Map<string, { fromOffset: number; toOffset: number }>();
  for (const ref of visibleRefs) {
    armOffsets.set(ref.id, { fromOffset: 0, toOffset: 0 });
  }

  for (const slots of portSlots.values()) {
    if (slots.length <= 1) continue;
    slots.sort((a, b) => a.targetY - b.targetY);
    for (let i = 0; i < slots.length; i++) {
      const offset = i * ARM_SPACING;
      const entry = armOffsets.get(slots[i].refId)!;
      if (slots[i].role === 'from') {
        entry.fromOffset = offset;
      } else {
        entry.toOffset = offset;
      }
    }
  }

  for (const ref of visibleRefs) {
    const isSelected = ref.id === selectedRefId;
    const { highlight, dimmed } = getRefVisuals(ref, explore, hoveredTableId);
    const offsets = armOffsets.get(ref.id) ?? { fromOffset: 0, toOffset: 0 };
    drawRelationship(
      ctx, ref, schema.tables, nodes, transform, isSelected, isDark,
      highlight, dimmed, explore.collapseMode, offsets.fromOffset, offsets.toOffset
    );
  }

  // Layer 3: Tables
  for (const table of schema.tables) {
    if (!isTableVisible(table.id)) continue;
    const node = nodes.get(table.id);
    if (!node) continue;

    const alpha = hasExploreFilter ? getTableOpacity(table.id, explore) : 1;

    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;

    const hoverColIdx = hoveredColumn && hoveredColumn.tableId === table.id ? hoveredColumn.columnIndex : -1;
    if (explore.collapseMode) {
      drawTableCollapsed(ctx, table, node, transform, table.id === selectedTableId, isDark);
    } else {
      drawTable(ctx, table, node, transform, table.id === selectedTableId, isDark, hoverColIdx);
    }

    ctx.restore();
  }
}
