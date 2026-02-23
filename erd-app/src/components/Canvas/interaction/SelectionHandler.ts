import type { SchemaRef, SchemaTable } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;

export function findRefAtPoint(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  refs: SchemaRef[],
  tables: SchemaTable[],
  nodes: Map<string, TableNode>,
  transform: ViewTransform
): string | null {
  const x = clientX - canvasRect.left;
  const y = clientY - canvasRect.top;
  const threshold = 8 * transform.scale;

  for (const ref of refs) {
    const fromNode = nodes.get(ref.fromTable);
    const toNode = nodes.get(ref.toTable);
    if (!fromNode || !toNode) continue;

    const fromTable = tables.find((t) => t.id === ref.fromTable);
    const toTable = tables.find((t) => t.id === ref.toTable);
    if (!fromTable || !toTable) continue;

    const fromColIdx = fromTable.columns.findIndex((c) => ref.fromColumns.includes(c.name));
    const toColIdx = toTable.columns.findIndex((c) => ref.toColumns.includes(c.name));
    if (fromColIdx < 0 || toColIdx < 0) continue;

    const s = transform.scale;
    const fromCenterX = fromNode.position.x + fromNode.size.width / 2;
    const toCenterX = toNode.position.x + toNode.size.width / 2;

    let fromX: number, toX: number;
    if (fromCenterX < toCenterX) {
      fromX = (fromNode.position.x + fromNode.size.width) * s + transform.x;
      toX = toNode.position.x * s + transform.x;
    } else {
      fromX = fromNode.position.x * s + transform.x;
      toX = (toNode.position.x + toNode.size.width) * s + transform.x;
    }

    const fromY = (fromNode.position.y + HEADER_HEIGHT + fromColIdx * ROW_HEIGHT + ROW_HEIGHT / 2) * s + transform.y;
    const toY = (toNode.position.y + HEADER_HEIGHT + toColIdx * ROW_HEIGHT + ROW_HEIGHT / 2) * s + transform.y;

    const dist = distToSegment(x, y, fromX, fromY, toX, toY);
    if (dist < threshold) return ref.id;
  }

  return null;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}
