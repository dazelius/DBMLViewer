import type { SchemaRef, SchemaTable, RelationType } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;

interface Point { x: number; y: number }

/**
 * Determine which side of each table to connect, considering overlap.
 * Returns screen-space coordinates for connection anchor points.
 */
function getConnectionPoints(
  fromNode: TableNode,
  toNode: TableNode,
  fromColIdx: number,
  toColIdx: number,
  transform: ViewTransform
): { from: Point; to: Point; fromSide: 'left' | 'right'; toSide: 'left' | 'right' } {
  const s = transform.scale;
  const tx = transform.x;
  const ty = transform.y;

  const fLeft = fromNode.position.x;
  const fRight = fromNode.position.x + fromNode.size.width;
  const tLeft = toNode.position.x;
  const tRight = toNode.position.x + toNode.size.width;

  const fromColY = fromNode.position.y + HEADER_HEIGHT + fromColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const toColY = toNode.position.y + HEADER_HEIGHT + toColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

  // Pick sides based on relative horizontal positions
  let fromSide: 'left' | 'right';
  let toSide: 'left' | 'right';
  let fromX: number;
  let toX: number;

  const gap = tLeft - fRight;
  const gapReverse = fLeft - tRight;

  if (gap >= 0) {
    // Target is to the right (no overlap)
    fromSide = 'right'; toSide = 'left';
    fromX = fRight; toX = tLeft;
  } else if (gapReverse >= 0) {
    // Target is to the left (no overlap)
    fromSide = 'left'; toSide = 'right';
    fromX = fLeft; toX = tRight;
  } else {
    // Tables overlap horizontally - pick the side with more clearance
    const rightDist = Math.abs(fRight - tLeft);
    const leftDist = Math.abs(fLeft - tRight);
    const rightRight = Math.abs(fRight - tRight);
    const leftLeft = Math.abs(fLeft - tLeft);

    if (rightRight <= leftLeft) {
      // Both to the right
      fromSide = 'right'; toSide = 'right';
      fromX = fRight; toX = tRight;
    } else {
      // Both to the left
      fromSide = 'left'; toSide = 'left';
      fromX = fLeft; toX = tLeft;
    }

    // Or try opposite sides if that's shorter
    if (rightDist < leftDist && rightDist < rightRight && rightDist < leftLeft) {
      fromSide = 'right'; toSide = 'left';
      fromX = fRight; toX = tLeft;
    } else if (leftDist < rightDist && leftDist < rightRight && leftDist < leftLeft) {
      fromSide = 'left'; toSide = 'right';
      fromX = fLeft; toX = tRight;
    }
  }

  return {
    from: { x: fromX * s + tx, y: fromColY * s + ty },
    to: { x: toX * s + tx, y: toColY * s + ty },
    fromSide,
    toSide,
  };
}

/**
 * Draw a clean orthogonal (right-angle) path between two points.
 * Handles all four side combinations: R→L, L→R, R→R, L→L
 */
function drawOrthogonalPath(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  fromSide: 'left' | 'right',
  toSide: 'left' | 'right',
  scale: number
) {
  const arm = Math.max(20 * scale, 15);

  // Extend horizontally from each endpoint
  const fDir = fromSide === 'right' ? 1 : -1;
  const tDir = toSide === 'left' ? -1 : 1;

  const fx = from.x + fDir * arm;
  const tx = to.x + tDir * arm;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  if (fromSide !== toSide) {
    // Opposite sides (R→L or L→R): standard S-shape or Z-shape
    const midX = (fx + tx) / 2;

    // If arms already meet or cross, use direct routing
    if ((fromSide === 'right' && fx >= tx) || (fromSide === 'left' && fx <= tx)) {
      ctx.lineTo(fx, from.y);
      ctx.lineTo(fx, (from.y + to.y) / 2);
      ctx.lineTo(tx, (from.y + to.y) / 2);
      ctx.lineTo(tx, to.y);
    } else {
      ctx.lineTo(midX, from.y);
      ctx.lineTo(midX, to.y);
    }
  } else {
    // Same side (R→R or L→L): route around
    const outerX = fDir === 1
      ? Math.max(fx, tx) + arm
      : Math.min(fx, tx) - arm;

    ctx.lineTo(outerX, from.y);
    ctx.lineTo(outerX, to.y);
  }

  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawOneSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, side: 'left' | 'right', scale: number) {
  const len = 7 * scale;
  const dir = side === 'left' ? 1 : -1;
  const bx = x + dir * 8 * scale;

  ctx.beginPath();
  ctx.moveTo(bx, y - len);
  ctx.lineTo(bx, y + len);
  ctx.stroke();
}

function drawManySymbol(ctx: CanvasRenderingContext2D, x: number, y: number, side: 'left' | 'right', scale: number) {
  const len = 7 * scale;
  const dir = side === 'left' ? 1 : -1;
  const tipX = x + dir * 12 * scale;
  const baseX = x + dir * 3 * scale;

  ctx.beginPath();
  ctx.moveTo(tipX, y);
  ctx.lineTo(baseX, y - len);
  ctx.moveTo(tipX, y);
  ctx.lineTo(baseX, y + len);
  ctx.moveTo(tipX, y);
  ctx.lineTo(baseX, y);
  ctx.stroke();
}

function drawEndpoint(
  ctx: CanvasRenderingContext2D,
  point: Point,
  side: 'left' | 'right',
  type: 'one' | 'many',
  scale: number
) {
  if (type === 'one') {
    drawOneSymbol(ctx, point.x, point.y, side, scale);
  } else {
    drawManySymbol(ctx, point.x, point.y, side, scale);
  }
}

function getEndpoints(relType: RelationType): { fromEnd: 'one' | 'many'; toEnd: 'one' | 'many' } {
  switch (relType) {
    case 'one-to-one': return { fromEnd: 'one', toEnd: 'one' };
    case 'one-to-many': return { fromEnd: 'one', toEnd: 'many' };
    case 'many-to-one': return { fromEnd: 'many', toEnd: 'one' };
    case 'many-to-many': return { fromEnd: 'many', toEnd: 'many' };
  }
}

export function drawRelationship(
  ctx: CanvasRenderingContext2D,
  ref: SchemaRef,
  tables: SchemaTable[],
  nodes: Map<string, TableNode>,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean,
  isHoverHighlight: boolean = false,
  dimmed: boolean = false
) {
  const fromNode = nodes.get(ref.fromTable);
  const toNode = nodes.get(ref.toTable);
  if (!fromNode || !toNode) return;

  const fromTable = tables.find((t) => t.id === ref.fromTable);
  const toTable = tables.find((t) => t.id === ref.toTable);
  if (!fromTable || !toTable) return;

  const fromColIdx = fromTable.columns.findIndex((c) => ref.fromColumns.includes(c.name));
  const toColIdx = toTable.columns.findIndex((c) => ref.toColumns.includes(c.name));
  if (fromColIdx < 0 || toColIdx < 0) return;

  const { from, to, fromSide, toSide } = getConnectionPoints(
    fromNode, toNode, fromColIdx, toColIdx, transform
  );

  const defaultColor = isDark ? '#585b70' : '#b0b4c8';
  const selectedColor = isDark ? '#89b4fa' : '#1a73e8';
  const highlightColor = isDark ? '#f9e2af' : '#f59e0b';

  let color: string;
  let lineWidth: number;

  if (isHoverHighlight) {
    color = ref.color ?? highlightColor;
    lineWidth = 3;
  } else if (isSelected) {
    color = ref.color ?? selectedColor;
    lineWidth = 2.5;
  } else {
    color = ref.color ?? defaultColor;
    lineWidth = 1.5;
  }

  ctx.save();

  if (dimmed) {
    ctx.globalAlpha = 0.15;
  }

  // Glow effect for highlighted lines
  if (isHoverHighlight) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawOrthogonalPath(ctx, from, to, fromSide, toSide, transform.scale);

  if (isHoverHighlight) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  const { fromEnd, toEnd } = getEndpoints(ref.type);
  ctx.lineWidth = isHoverHighlight ? 3 : (isSelected ? 2.5 : 2);
  drawEndpoint(ctx, from, fromSide, fromEnd, transform.scale);
  drawEndpoint(ctx, to, toSide, toEnd, transform.scale);

  ctx.restore();
}
