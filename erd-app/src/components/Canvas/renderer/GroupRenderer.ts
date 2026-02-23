import type { SchemaTableGroup } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const GROUP_PADDING = 24;
const LABEL_HEIGHT = 28;
const BORDER_RADIUS = 12;
const FONT_FAMILY = "'Inter', 'Segoe UI', system-ui, sans-serif";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawTableGroups(
  ctx: CanvasRenderingContext2D,
  groups: SchemaTableGroup[],
  nodes: Map<string, TableNode>,
  transform: ViewTransform,
  isDark: boolean
) {
  const s = transform.scale;
  const pad = GROUP_PADDING;
  const labelH = LABEL_HEIGHT;

  for (const grp of groups) {
    const color = grp.color ?? '#555672';

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasVisible = false;

    for (const tableId of grp.tables) {
      const node = nodes.get(tableId);
      if (!node) continue;
      hasVisible = true;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    }
    if (!hasVisible) continue;

    const gx = (minX - pad) * s + transform.x;
    const gy = (minY - pad - labelH) * s + transform.y;
    const gw = (maxX - minX + pad * 2) * s;
    const gh = (maxY - minY + pad * 2 + labelH) * s;
    const gr = BORDER_RADIUS * s;

    // Background fill
    roundRect(ctx, gx, gy, gw, gh, gr);
    ctx.fillStyle = hexToRgba(color, isDark ? 0.06 : 0.05);
    ctx.fill();

    // Border (dashed)
    roundRect(ctx, gx, gy, gw, gh, gr);
    ctx.setLineDash([6 * s, 4 * s]);
    ctx.strokeStyle = hexToRgba(color, isDark ? 0.35 : 0.30);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Group label
    const fontSize = Math.max(8, 12 * s);
    ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = hexToRgba(color, isDark ? 0.8 : 0.7);

    const labelX = gx + 14 * s;
    const labelY = gy + (labelH * s) / 2 + 2;

    // Label background pill
    const textW = ctx.measureText(grp.name).width;
    const pillPadX = 8 * s;
    const pillH = fontSize + 6 * s;
    roundRect(ctx, labelX - pillPadX, labelY - pillH / 2, textW + pillPadX * 2, pillH, 4 * s);
    ctx.fillStyle = hexToRgba(color, isDark ? 0.12 : 0.10);
    ctx.fill();

    ctx.fillStyle = hexToRgba(color, isDark ? 0.85 : 0.75);
    ctx.textBaseline = 'middle';
    ctx.fillText(grp.name, labelX, labelY);

    // Table count
    const countStr = `${grp.tables.length}`;
    const countFontSize = Math.max(6, 10 * s);
    ctx.font = `500 ${countFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = hexToRgba(color, isDark ? 0.5 : 0.4);
    ctx.fillText(countStr, labelX + textW + 8 * s, labelY);
  }
}
