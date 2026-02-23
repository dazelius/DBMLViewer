import type { SchemaTable, SchemaColumn } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;
const BORDER_RADIUS = 8;
const LEFT_STRIPE_WIDTH = 5;
const FONT_FAMILY = "'Inter', 'Segoe UI', system-ui, sans-serif";
const MONO_FONT = "'JetBrains Mono', 'Fira Code', monospace";

interface ThemeColors {
  tableBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableBorder: string;
  tableBorderSelected: string;
  colText: string;
  colTypeText: string;
  pkBg: string;
  pkText: string;
  fkBg: string;
  fkText: string;
  rowAltBg: string;
  ungroupedAccent: string;
}

const DARK: ThemeColors = {
  tableBg: '#1e1f2e',
  tableHeaderBg: '#2a2b3d',
  tableHeaderText: '#e2e4f0',
  tableBorder: '#3a3b50',
  tableBorderSelected: '#89b4fa',
  colText: '#c8cad8',
  colTypeText: '#6e7191',
  pkBg: 'rgba(250, 179, 135, 0.18)',
  pkText: '#fab387',
  fkBg: 'rgba(137, 180, 250, 0.15)',
  fkText: '#89b4fa',
  rowAltBg: 'rgba(255,255,255,0.02)',
  ungroupedAccent: '#555672',
};

const LIGHT: ThemeColors = {
  tableBg: '#ffffff',
  tableHeaderBg: '#f4f5f9',
  tableHeaderText: '#1a1b2e',
  tableBorder: '#d8dae5',
  tableBorderSelected: '#2563eb',
  colText: '#2e3044',
  colTypeText: '#8b8fa8',
  pkBg: 'rgba(234, 88, 12, 0.10)',
  pkText: '#c2410c',
  fkBg: 'rgba(37, 99, 232, 0.08)',
  fkText: '#1d4ed8',
  rowAltBg: 'rgba(0,0,0,0.018)',
  ungroupedAccent: '#c0c2d0',
};

function getTheme(isDark: boolean): ThemeColors {
  return isDark ? DARK : LIGHT;
}

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

/** Draw text truncated with ellipsis if it exceeds maxWidth */
function fillTextTruncated(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  if (maxWidth <= 0) return;
  const measured = ctx.measureText(text).width;
  if (measured <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  const ellipsis = '…';
  const ellipsisW = ctx.measureText(ellipsis).width;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated).width + ellipsisW > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated + ellipsis, x, y);
}

/** Scale threshold below which we switch to minimap (colored bars) mode */
const LOD_MINIMAP_THRESHOLD = 0.45;

export function drawTable(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean
) {
  const s = transform.scale;

  if (s < LOD_MINIMAP_THRESHOLD) {
    drawTableMinimap(ctx, table, node, transform, isSelected, isDark);
  } else {
    drawTableFull(ctx, table, node, transform, isSelected, isDark);
  }
}

function drawTableMinimap(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean
) {
  const theme = getTheme(isDark);
  const s = transform.scale;
  const { x, y } = node.position;
  const { width, height } = node.size;

  const sx = x * s + transform.x;
  const sy = y * s + transform.y;
  const sw = width * s;
  const sh = height * s;
  const sr = BORDER_RADIUS * s;

  const cvs = ctx.canvas;
  if (sx + sw < -20 || sy + sh < -20 || sx > cvs.width / ctx.getTransform().a + 20 || sy > cvs.height / ctx.getTransform().d + 20) return;

  const accent = table.groupColor ?? theme.ungroupedAccent;
  const headerH = HEADER_HEIGHT * s;
  const rowH = ROW_HEIGHT * s;
  const stripeW = LEFT_STRIPE_WIDTH * s;

  ctx.save();

  // Shadow (lighter for minimap)
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 2 * s;
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.fillStyle = theme.tableBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Border
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.strokeStyle = isSelected ? accent : theme.tableBorder;
  ctx.lineWidth = isSelected ? 2 : 0.5;
  ctx.stroke();

  // Clip
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.clip();

  // Left accent stripe
  ctx.fillStyle = accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // Header background
  ctx.fillStyle = accent;
  ctx.globalAlpha = isDark ? 0.25 : 0.18;
  ctx.fillRect(sx, sy, sw, headerH);
  ctx.globalAlpha = 1;

  // Header text (table name only, larger relative size)
  const fontSize = Math.max(7, 11 * s);
  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = theme.tableHeaderText;
  ctx.textBaseline = 'middle';
  fillTextTruncated(ctx, table.name, sx + stripeW + 6 * s, sy + headerH / 2, sw - stripeW - 12 * s);

  // Column bars
  const barPadX = 8 * s;
  const barH = Math.max(2, (rowH - 6 * s));
  const barLeft = sx + stripeW + barPadX;
  const barMaxW = sw - stripeW - barPadX * 2;

  const pkBarColor = isDark ? '#fab387' : '#ea580c';
  const fkBarColor = isDark ? '#89b4fa' : '#2563eb';
  const normalBarColor = isDark ? 'rgba(200,202,216,0.18)' : 'rgba(46,48,68,0.10)';
  const nameBarRatio = 0.55;

  table.columns.forEach((col: SchemaColumn, i: number) => {
    const rowY = sy + headerH + i * rowH + 3 * s;

    // Determine bar color based on column type
    let barColor: string;
    if (col.isPrimaryKey) {
      barColor = pkBarColor;
    } else if (col.isForeignKey) {
      barColor = fkBarColor;
    } else {
      barColor = normalBarColor;
    }

    // Name bar (left portion)
    const nameW = barMaxW * nameBarRatio;
    ctx.fillStyle = barColor;
    ctx.globalAlpha = col.isPrimaryKey || col.isForeignKey ? (isDark ? 0.7 : 0.5) : 1;
    roundRect(ctx, barLeft, rowY, nameW, barH, 2 * s);
    ctx.fill();

    // Type bar (right portion, thinner)
    const typeW = barMaxW * 0.3;
    const typeX = barLeft + nameW + 4 * s;
    ctx.fillStyle = normalBarColor;
    ctx.globalAlpha = 0.6;
    roundRect(ctx, typeX, rowY, typeW, barH, 2 * s);
    ctx.fill();

    ctx.globalAlpha = 1;
  });

  ctx.restore(); // end clip
  ctx.restore(); // end outer save
}

function drawTableFull(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean
) {
  const theme = getTheme(isDark);
  const s = transform.scale;
  const { x, y } = node.position;
  const { width, height } = node.size;

  const sx = x * s + transform.x;
  const sy = y * s + transform.y;
  const sw = width * s;
  const sh = height * s;
  const sr = BORDER_RADIUS * s;

  const cvs = ctx.canvas;
  if (sx + sw < -50 || sy + sh < -50 || sx > cvs.width + 50 || sy > cvs.height + 50) return;

  const accent = table.groupColor ?? theme.ungroupedAccent;
  const stripeW = LEFT_STRIPE_WIDTH * s;
  const headerH = HEADER_HEIGHT * s;
  const rowH = ROW_HEIGHT * s;
  const contentLeft = sx + stripeW;
  const contentRight = sx + sw;
  const pad = 10 * s;

  ctx.save();

  // -- Drop shadow (outside clip)
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.10)';
  ctx.shadowBlur = 16 * s;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4 * s;
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.fillStyle = theme.tableBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // -- Border
  roundRect(ctx, sx, sy, sw, sh, sr);
  if (isSelected) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
  } else {
    ctx.strokeStyle = theme.tableBorder;
    ctx.lineWidth = 1;
  }
  ctx.stroke();

  // -- Clip everything inside the table bounds
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.clip();

  // -- Left accent stripe
  ctx.fillStyle = accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // -- Header background
  ctx.fillStyle = theme.tableHeaderBg;
  ctx.fillRect(sx, sy, sw, headerH);
  ctx.fillStyle = hexToRgba(accent, isDark ? 0.12 : 0.08);
  ctx.fillRect(sx, sy, sw, headerH);

  // -- Header divider
  ctx.beginPath();
  ctx.moveTo(contentLeft, sy + headerH);
  ctx.lineTo(contentRight, sy + headerH);
  ctx.strokeStyle = theme.tableBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // -- Header content
  const fontSize = Math.max(8, 13 * s);
  ctx.textBaseline = 'middle';

  const dotR = 3.5 * s;
  const dotX = contentLeft + 12 * s;
  const dotY = sy + headerH / 2;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  const nameLeft = dotX + dotR + 7 * s;

  if (table.groupName) {
    const grpFontSize = Math.max(6, 9 * s);
    ctx.font = `500 ${grpFontSize}px ${FONT_FAMILY}`;
    const grpW = ctx.measureText(table.groupName).width;
    const grpX = contentRight - grpW - pad;

    ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = theme.tableHeaderText;
    const maxNameW = grpX - nameLeft - 6 * s;
    fillTextTruncated(ctx, table.name, nameLeft, dotY, maxNameW);

    ctx.font = `500 ${grpFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = hexToRgba(accent, isDark ? 0.7 : 0.6);
    ctx.fillText(table.groupName, grpX, dotY);
  } else {
    ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = theme.tableHeaderText;
    fillTextTruncated(ctx, table.name, nameLeft, dotY, contentRight - nameLeft - pad);
  }

  // -- Columns
  const colFontSize = Math.max(7, 11.5 * s);
  const typeFontSize = Math.max(6, 10 * s);
  const badgeFontSize = Math.max(5, 8.5 * s);
  const typeAreaMaxW = sw * 0.38;

  table.columns.forEach((col: SchemaColumn, i: number) => {
    const rowY = sy + headerH + i * rowH;

    if (i % 2 === 1) {
      ctx.fillStyle = theme.rowAltBg;
      ctx.fillRect(contentLeft, rowY, sw - stripeW, rowH);
    }

    const textY = rowY + rowH / 2;
    let xOff = contentLeft + pad;

    // PK badge
    if (col.isPrimaryKey) {
      const label = 'PK';
      ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}`;
      const lw = ctx.measureText(label).width;
      const pillW = lw + 8 * s;
      const pillH = badgeFontSize + 4 * s;
      const pillY = textY - pillH / 2;
      roundRect(ctx, xOff, pillY, pillW, pillH, 3 * s);
      ctx.fillStyle = theme.pkBg;
      ctx.fill();
      ctx.fillStyle = theme.pkText;
      ctx.fillText(label, xOff + 4 * s, textY);
      xOff += pillW + 4 * s;
    }
    // FK badge
    if (col.isForeignKey) {
      const label = 'FK';
      ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}`;
      const lw = ctx.measureText(label).width;
      const pillW = lw + 8 * s;
      const pillH = badgeFontSize + 4 * s;
      const pillY = textY - pillH / 2;
      roundRect(ctx, xOff, pillY, pillW, pillH, 3 * s);
      ctx.fillStyle = theme.fkBg;
      ctx.fill();
      ctx.fillStyle = theme.fkText;
      ctx.fillText(label, xOff + 4 * s, textY);
      xOff += pillW + 4 * s;
    }
    if (!col.isPrimaryKey && !col.isForeignKey) {
      xOff += 2 * s;
    }

    // Column type (right-aligned, draw first to measure reserved space)
    ctx.font = `400 ${typeFontSize}px ${MONO_FONT}`;
    ctx.fillStyle = theme.colTypeText;
    const typeFullW = ctx.measureText(col.type).width;
    const typeClampedW = Math.min(typeFullW, typeAreaMaxW);
    const typeX = contentRight - pad;
    fillTextTruncated(ctx, col.type, typeX - typeClampedW, textY, typeClampedW);

    // Column name (fills remaining space)
    const nameMaxW = (typeX - typeClampedW - 6 * s) - xOff;
    ctx.font = `500 ${colFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = theme.colText;
    fillTextTruncated(ctx, col.name, xOff, textY, nameMaxW);
  });

  ctx.restore(); // end clip
  ctx.restore(); // end outer save
}

/** Collapsed mode: show only header with column count badge */
export function drawTableCollapsed(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean
) {
  const theme = getTheme(isDark);
  const s = transform.scale;
  const { x, y } = node.position;
  const { width } = node.size;

  const collapsedH = HEADER_HEIGHT + 8;
  const sx = x * s + transform.x;
  const sy = y * s + transform.y;
  const sw = width * s;
  const sh = collapsedH * s;
  const sr = BORDER_RADIUS * s;

  const cvs = ctx.canvas;
  if (sx + sw < -50 || sy + sh < -50 || sx > cvs.width + 50 || sy > cvs.height + 50) return;

  const accent = table.groupColor ?? theme.ungroupedAccent;
  const stripeW = LEFT_STRIPE_WIDTH * s;

  ctx.save();

  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 10 * s;
  ctx.shadowOffsetY = 2 * s;
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.fillStyle = theme.tableBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.strokeStyle = isSelected ? accent : theme.tableBorder;
  ctx.lineWidth = isSelected ? 2.5 : 1;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.clip();

  // Left stripe
  ctx.fillStyle = accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // Header bg
  ctx.fillStyle = theme.tableHeaderBg;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = hexToRgba(accent, isDark ? 0.12 : 0.08);
  ctx.fillRect(sx, sy, sw, sh);

  // Dot
  const fontSize = Math.max(8, 13 * s);
  ctx.textBaseline = 'middle';
  const dotR = 3.5 * s;
  const dotX = sx + stripeW + 12 * s;
  const dotY = sy + sh / 2;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  // Table name
  const nameLeft = dotX + dotR + 7 * s;
  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = theme.tableHeaderText;

  // Column count badge
  const countStr = `${table.columns.length}`;
  const badgeFontSize = Math.max(6, 10 * s);
  ctx.font = `600 ${badgeFontSize}px ${FONT_FAMILY}`;
  const countW = ctx.measureText(countStr).width;
  const badgePad = 6 * s;
  const badgeW = countW + badgePad * 2;
  const badgeH = badgeFontSize + 4 * s;
  const badgeX = sx + sw - stripeW - badgeW - 8 * s;
  const badgeY = dotY - badgeH / 2;

  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 3 * s);
  ctx.fillStyle = hexToRgba(accent, isDark ? 0.2 : 0.12);
  ctx.fill();
  ctx.fillStyle = hexToRgba(accent, isDark ? 0.8 : 0.7);
  ctx.fillText(countStr, badgeX + badgePad, dotY);

  // Name (truncated before badge)
  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = theme.tableHeaderText;
  fillTextTruncated(ctx, table.name, nameLeft, dotY, badgeX - nameLeft - 6 * s);

  ctx.restore();
  ctx.restore();
}

export { HEADER_HEIGHT, ROW_HEIGHT };
