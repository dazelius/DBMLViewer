import type { SchemaRef, SchemaTable, RelationType } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;
const COLLAPSED_HEIGHT = HEADER_HEIGHT + 8;

interface Point { x: number; y: number }

function getConnectionPoints(
  fromNode: TableNode,
  toNode: TableNode,
  fromColIdx: number,
  toColIdx: number,
  transform: ViewTransform,
  collapseMode: boolean = false
): { from: Point; to: Point; fromSide: 'left' | 'right'; toSide: 'left' | 'right' } {
  const s = transform.scale;
  const tx = transform.x;
  const ty = transform.y;

  const fLeft = fromNode.position.x;
  const fRight = fromNode.position.x + fromNode.size.width;
  const tLeft = toNode.position.x;
  const tRight = toNode.position.x + toNode.size.width;

  const fromColY = collapseMode
    ? fromNode.position.y + COLLAPSED_HEIGHT / 2
    : fromNode.position.y + HEADER_HEIGHT + fromColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const toColY = collapseMode
    ? toNode.position.y + COLLAPSED_HEIGHT / 2
    : toNode.position.y + HEADER_HEIGHT + toColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

  let fromSide: 'left' | 'right';
  let toSide: 'left' | 'right';
  let fromX: number;
  let toX: number;

  const gap = tLeft - fRight;
  const gapReverse = fLeft - tRight;

  if (gap >= 0) {
    fromSide = 'right'; toSide = 'left';
    fromX = fRight; toX = tLeft;
  } else if (gapReverse >= 0) {
    fromSide = 'left'; toSide = 'right';
    fromX = fLeft; toX = tRight;
  } else {
    const rightDist = Math.abs(fRight - tLeft);
    const leftDist = Math.abs(fLeft - tRight);
    const rightRight = Math.abs(fRight - tRight);
    const leftLeft = Math.abs(fLeft - tLeft);

    if (rightRight <= leftLeft) {
      fromSide = 'right'; toSide = 'right';
      fromX = fRight; toX = tRight;
    } else {
      fromSide = 'left'; toSide = 'left';
      fromX = fLeft; toX = tLeft;
    }

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

/** Draw a rounded-corner line segment: moveTo → arcTo waypoints → lineTo end */
function roundedLineTo(ctx: CanvasRenderingContext2D, points: Point[], radius: number) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const seg1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const seg2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const r = Math.min(radius, seg1 / 2, seg2 / 2);

    if (r > 0.5) {
      ctx.arcTo(curr.x, curr.y, next.x, next.y, r);
    } else {
      ctx.lineTo(curr.x, curr.y);
    }
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawOrthogonalPath(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  fromSide: 'left' | 'right',
  toSide: 'left' | 'right',
  scale: number,
  fromArmOffset: number = 0,
  toArmOffset: number = 0
) {
  const baseArm = Math.max(20 * scale, 15);
  const fromArm = baseArm + fromArmOffset * scale;
  const toArm = baseArm + toArmOffset * scale;
  const cornerR = Math.min(6 * scale, 12);

  const fDir = fromSide === 'right' ? 1 : -1;
  const tDir = toSide === 'left' ? -1 : 1;

  const fx = from.x + fDir * fromArm;
  const tx = to.x + tDir * toArm;

  const pts: Point[] = [{ x: from.x, y: from.y }];

  if (fromSide !== toSide) {
    if ((fromSide === 'right' && fx >= tx) || (fromSide === 'left' && fx <= tx)) {
      const midY = (from.y + to.y) / 2;
      pts.push({ x: fx, y: from.y });
      pts.push({ x: fx, y: midY });
      pts.push({ x: tx, y: midY });
      pts.push({ x: tx, y: to.y });
    } else {
      const midX = (fx + tx) / 2;
      pts.push({ x: midX, y: from.y });
      pts.push({ x: midX, y: to.y });
    }
  } else {
    const outerX = fDir === 1
      ? Math.max(fx, tx) + baseArm
      : Math.min(fx, tx) - baseArm;

    pts.push({ x: outerX, y: from.y });
    pts.push({ x: outerX, y: to.y });
  }

  pts.push({ x: to.x, y: to.y });

  roundedLineTo(ctx, pts, cornerR);
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
  dimmed: boolean = false,
  collapseMode: boolean = false,
  fromArmOffset: number = 0,
  toArmOffset: number = 0
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
    fromNode, toNode, fromColIdx, toColIdx, transform, collapseMode
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

  if (isHoverHighlight) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawOrthogonalPath(ctx, from, to, fromSide, toSide, transform.scale, fromArmOffset, toArmOffset);

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

/** Determine which side a connection exits from, matching getConnectionPoints logic */
export function determineConnectionSide(
  fromNode: TableNode,
  toNode: TableNode
): { fromSide: 'left' | 'right'; toSide: 'left' | 'right' } {
  const fLeft = fromNode.position.x;
  const fRight = fromNode.position.x + fromNode.size.width;
  const tLeft = toNode.position.x;
  const tRight = toNode.position.x + toNode.size.width;

  const gap = tLeft - fRight;
  const gapReverse = fLeft - tRight;

  if (gap >= 0) return { fromSide: 'right', toSide: 'left' };
  if (gapReverse >= 0) return { fromSide: 'left', toSide: 'right' };

  const rightDist = Math.abs(fRight - tLeft);
  const leftDist = Math.abs(fLeft - tRight);
  const rightRight = Math.abs(fRight - tRight);
  const leftLeft = Math.abs(fLeft - tLeft);

  let fromSide: 'left' | 'right';
  let toSide: 'left' | 'right';

  if (rightRight <= leftLeft) {
    fromSide = 'right'; toSide = 'right';
  } else {
    fromSide = 'left'; toSide = 'left';
  }

  if (rightDist < leftDist && rightDist < rightRight && rightDist < leftLeft) {
    fromSide = 'right'; toSide = 'left';
  } else if (leftDist < rightDist && leftDist < rightRight && leftDist < leftLeft) {
    fromSide = 'left'; toSide = 'right';
  }

  return { fromSide, toSide };
}
