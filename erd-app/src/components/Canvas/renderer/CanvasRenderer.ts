import type { ParsedSchema } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';
import { drawGrid } from './GridRenderer.ts';
import { drawTableGroups } from './GroupRenderer.ts';
import { drawTable } from './TableRenderer.ts';
import { drawRelationship } from './RelationshipRenderer.ts';

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  schema: ParsedSchema | null,
  nodes: Map<string, TableNode>,
  transform: ViewTransform,
  selectedTableId: string | null,
  selectedRefId: string | null,
  hoveredTableId: string | null = null
) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const bgColor = isDark ? '#16161e' : '#f0f1f5';

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, width, height, transform, isDark);

  if (!schema) {
    const fontSize = 14;
    ctx.font = `400 ${fontSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = isDark ? '#6c7086' : '#9ca3af';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Write DBML code on the left to see the diagram', width / 2, height / 2);
    ctx.textAlign = 'start';
    return;
  }

  // Layer 1: Group bounding boxes (behind everything)
  if (schema.tableGroups.length > 0) {
    drawTableGroups(ctx, schema.tableGroups, nodes, transform, isDark);
  }

  // Layer 2: Relationships — dim non-hovered, highlight hovered
  for (const ref of schema.refs) {
    const isHoverHighlight = hoveredTableId != null &&
      (ref.fromTable === hoveredTableId || ref.toTable === hoveredTableId);
    const isSelected = ref.id === selectedRefId;
    const dimmed = hoveredTableId != null && !isHoverHighlight && !isSelected;
    drawRelationship(ctx, ref, schema.tables, nodes, transform, isSelected, isDark, isHoverHighlight, dimmed);
  }

  // Layer 3: Tables (on top)
  for (const table of schema.tables) {
    const node = nodes.get(table.id);
    if (!node) continue;
    drawTable(ctx, table, node, transform, table.id === selectedTableId, isDark);
  }
}
