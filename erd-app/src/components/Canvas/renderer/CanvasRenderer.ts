import type { ParsedSchema } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';
import { drawGrid } from './GridRenderer.ts';
import { drawTableGroups } from './GroupRenderer.ts';
import { drawTable, drawTableCollapsed, type HeatmapInfo } from './TableRenderer.ts';
import { drawRelationship, determineConnectionSide } from './RelationshipRenderer.ts';

export interface ExploreVisuals {
  columnSearchActive: boolean;
  columnSearchResults: Set<string>;
  collapseMode: boolean;
  hiddenGroups: Set<string>;
  focusActive: boolean;
  focusTableId: string | null;
  focusTableIds: Set<string>;
}

const DEFAULT_EXPLORE: ExploreVisuals = {
  columnSearchActive: false,
  columnSearchResults: new Set(),
  collapseMode: false,
  hiddenGroups: new Set(),
  focusActive: false,
  focusTableId: null,
  focusTableIds: new Set(),
};

function getTableOpacity(
  tableId: string,
  explore: ExploreVisuals
): number {
  if (explore.columnSearchActive) {
    return explore.columnSearchResults.has(tableId) ? 1 : 0.1;
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

  if (explore.columnSearchActive) {
    const both = explore.columnSearchResults.has(ref.fromTable) && explore.columnSearchResults.has(ref.toTable);
    return { highlight: hoverHighlight || both, dimmed: !both && !hoverHighlight };
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
  hoveredColumn: { tableId: string; columnIndex: number } | null = null,
  heatmapData: Map<string, number> | null = null
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

  const hasExploreFilter = explore.columnSearchActive;

  // Determine which tables are visible (group filtering)
  const tableGroupMap = new Map<string, string>();
  for (const grp of schema.tableGroups) {
    for (const tid of grp.tables) tableGroupMap.set(tid, grp.name);
  }
  const isTableVisible = (tableId: string) => {
    if (explore.focusActive) return explore.focusTableIds.has(tableId);
    if (explore.hiddenGroups.size === 0) return true;
    const grp = tableGroupMap.get(tableId);
    if (!grp) return true;
    return !explore.hiddenGroups.has(grp);
  };

  // Layer 1: Group bounding boxes (skip in focus mode)
  if (schema.tableGroups.length > 0 && !explore.focusActive) {
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
    const showFlow = explore.focusActive;
    drawRelationship(
      ctx, ref, schema.tables, nodes, transform, isSelected, isDark,
      highlight, dimmed, explore.collapseMode, offsets.fromOffset, offsets.toOffset, showFlow
    );
  }

  // Layer 3: Tables — precompute heatmap normalization
  let hmMax = 0;
  if (heatmapData && heatmapData.size > 0) {
    for (const v of heatmapData.values()) {
      if (v > hmMax) hmMax = v;
    }
  }

  for (const table of schema.tables) {
    if (!isTableVisible(table.id)) continue;
    const node = nodes.get(table.id);
    if (!node) continue;

    const alpha = hasExploreFilter ? getTableOpacity(table.id, explore) : 1;

    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;

    let hmInfo: HeatmapInfo | null = null;
    if (heatmapData && heatmapData.size > 0) {
      const rc = heatmapData.get(table.name.toLowerCase());
      if (rc !== undefined && hmMax > 0) {
        hmInfo = { normalized: rc / hmMax, rowCount: rc };
      } else if (rc !== undefined) {
        hmInfo = { normalized: 0, rowCount: rc };
      }
    }

    const hoverColIdx = hoveredColumn && hoveredColumn.tableId === table.id ? hoveredColumn.columnIndex : -1;
    if (explore.collapseMode) {
      drawTableCollapsed(ctx, table, node, transform, table.id === selectedTableId, isDark, hmInfo);
    } else {
      drawTable(ctx, table, node, transform, table.id === selectedTableId, isDark, hoverColIdx, hmInfo);
    }

    ctx.restore();
  }
}
