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
  nnBg: string;
  nnText: string;
  locBg: string;
  locText: string;
  rowAltBg: string;
  ungroupedAccent: string;
}

const DARK: ThemeColors = {
  tableBg: '#161821',
  tableHeaderBg: '#1c1e2a',
  tableHeaderText: '#e2e4ed',
  tableBorder: 'rgba(255,255,255,0.08)',
  tableBorderSelected: '#6c8eef',
  colText: '#a0a4b8',
  colTypeText: '#5c6078',
  pkBg: 'rgba(224, 166, 99, 0.15)',
  pkText: '#e0a663',
  fkBg: 'rgba(108, 142, 239, 0.12)',
  fkText: '#6c8eef',
  nnBg: 'rgba(239, 68, 68, 0.12)',
  nnText: '#f87171',
  locBg: 'rgba(45, 212, 191, 0.12)',
  locText: '#2dd4bf',
  rowAltBg: 'rgba(255,255,255,0.015)',
  ungroupedAccent: '#5c6078',
};

const LIGHT: ThemeColors = {
  tableBg: '#ffffff',
  tableHeaderBg: '#f8f9fc',
  tableHeaderText: '#1a1c24',
  tableBorder: 'rgba(0,0,0,0.08)',
  tableBorderSelected: '#4a6fe5',
  colText: '#5a5e72',
  colTypeText: '#8c90a4',
  pkBg: 'rgba(196, 133, 14, 0.08)',
  pkText: '#c4850e',
  fkBg: 'rgba(74, 111, 229, 0.08)',
  fkText: '#4a6fe5',
  nnBg: 'rgba(220, 38, 38, 0.08)',
  nnText: '#dc2626',
  locBg: 'rgba(13, 148, 136, 0.08)',
  locText: '#0d9488',
  rowAltBg: 'rgba(0,0,0,0.015)',
  ungroupedAccent: '#8c90a4',
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

const HEATMAP_STOPS: [number, [number, number, number]][] = [
  [0.00, [59, 130, 246]],   // #3b82f6 blue
  [0.25, [34, 197, 94]],    // #22c55e green
  [0.50, [234, 179, 8]],    // #eab308 yellow
  [0.75, [249, 115, 22]],   // #f97316 orange
  [1.00, [239, 68, 68]],    // #ef4444 red
];

export function heatmapColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
    const [t0, c0] = HEATMAP_STOPS[i];
    const [t1, c1] = HEATMAP_STOPS[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const f = (clamped - t0) / (t1 - t0);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
      return `rgb(${r},${g},${b})`;
    }
  }
  return `rgb(${HEATMAP_STOPS[HEATMAP_STOPS.length - 1][1].join(',')})`;
}

function formatRowCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export interface HeatmapInfo { normalized: number; rowCount: number; }

export function drawTable(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean,
  hoverColumnIndex: number = -1,
  heatmap: HeatmapInfo | null = null
) {
  const s = transform.scale;

  if (s < LOD_MINIMAP_THRESHOLD) {
    drawTableMinimap(ctx, table, node, transform, isSelected, isDark, heatmap);
  } else {
    drawTableFull(ctx, table, node, transform, isSelected, isDark, hoverColumnIndex, heatmap);
  }
}

function drawTableMinimap(
  ctx: CanvasRenderingContext2D,
  table: SchemaTable,
  node: TableNode,
  transform: ViewTransform,
  isSelected: boolean,
  isDark: boolean,
  heatmap: HeatmapInfo | null = null
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
  const hmActive = heatmap !== null;
  const hmColor = hmActive ? heatmapColor(heatmap.normalized) : '';

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
  ctx.strokeStyle = isSelected ? accent : (hmActive ? hmColor : theme.tableBorder);
  ctx.lineWidth = isSelected ? 2 : (hmActive ? 1.5 : 0.5);
  ctx.stroke();

  // Clip
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.clip();

  // Left accent stripe
  ctx.fillStyle = hmActive ? hmColor : accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // Header background
  ctx.fillStyle = hmActive ? hmColor : accent;
  ctx.globalAlpha = isDark ? 0.25 : 0.18;
  ctx.fillRect(sx, sy, sw, headerH);
  ctx.globalAlpha = 1;

  // Header text (table name + heatmap row count)
  const fontSize = Math.max(7, 11 * s);
  ctx.textBaseline = 'middle';
  const nameX = sx + stripeW + 6 * s;
  const nameY = sy + headerH / 2;
  let nameMaxW = sw - stripeW - 12 * s;

  if (hmActive) {
    const rcText = formatRowCount(heatmap.rowCount);
    const rcFontSize = Math.max(6, 9 * s);
    ctx.font = `700 ${rcFontSize}px ${MONO_FONT}`;
    const rcW = ctx.measureText(rcText).width;
    const rcPillW = rcW + 6 * s;
    const rcPillH = rcFontSize + 3 * s;
    const rcX = sx + sw - rcPillW - 6 * s;
    const rcY = nameY - rcPillH / 2;
    roundRect(ctx, rcX, rcY, rcPillW, rcPillH, 2 * s);
    ctx.fillStyle = hmColor;
    ctx.globalAlpha = isDark ? 0.3 : 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = hmColor;
    ctx.fillText(rcText, rcX + 3 * s, nameY);
    nameMaxW = rcX - nameX - 4 * s;
  }

  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = theme.tableHeaderText;
  fillTextTruncated(ctx, table.name, nameX, nameY, nameMaxW);

  // Column bars
  const barPadX = 8 * s;
  const barH = Math.max(2, (rowH - 6 * s));
  const barLeft = sx + stripeW + barPadX;
  const barMaxW = sw - stripeW - barPadX * 2;

  const pkBarColor = isDark ? '#e0a663' : '#c4850e';
  const fkBarColor = isDark ? '#6c8eef' : '#4a6fe5';
  const locBarColor = isDark ? '#2dd4bf' : '#0d9488';
  const normalBarColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const nameBarRatio = 0.55;

  table.columns.forEach((col: SchemaColumn, i: number) => {
    const rowY = sy + headerH + i * rowH + 3 * s;

    let barColor: string;
    if (col.isPrimaryKey) {
      barColor = pkBarColor;
    } else if (col.isForeignKey) {
      barColor = fkBarColor;
    } else if (col.isLocalize) {
      barColor = locBarColor;
    } else {
      barColor = normalBarColor;
    }

    // Name bar (left portion)
    const nameW = barMaxW * nameBarRatio;
    ctx.fillStyle = barColor;
    ctx.globalAlpha = (col.isPrimaryKey || col.isForeignKey || col.isLocalize) ? (isDark ? 0.7 : 0.5) : 1;
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
  isDark: boolean,
  hoverColumnIndex: number = -1,
  heatmap: HeatmapInfo | null = null
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
  const hmActive = heatmap !== null;
  const hmColor = hmActive ? heatmapColor(heatmap.normalized) : '';

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
  } else if (hmActive) {
    ctx.strokeStyle = hmColor;
    ctx.lineWidth = 2;
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
  ctx.fillStyle = hmActive ? hmColor : accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // -- Header background
  ctx.fillStyle = theme.tableHeaderBg;
  ctx.fillRect(sx, sy, sw, headerH);
  if (hmActive) {
    ctx.fillStyle = hmColor;
    ctx.globalAlpha = isDark ? 0.18 : 0.12;
    ctx.fillRect(sx, sy, sw, headerH);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = hexToRgba(accent, isDark ? 0.12 : 0.08);
    ctx.fillRect(sx, sy, sw, headerH);
  }

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
  ctx.fillStyle = hmActive ? hmColor : accent;
  ctx.fill();

  const nameLeft = dotX + dotR + 7 * s;

  let headerRightEdge = contentRight - pad;

  if (hmActive) {
    const rcText = formatRowCount(heatmap.rowCount);
    const rcFontSize = Math.max(6, 9 * s);
    ctx.font = `700 ${rcFontSize}px ${MONO_FONT}`;
    const rcW = ctx.measureText(rcText).width;
    const rcPillW = rcW + 10 * s;
    const rcPillH = rcFontSize + 5 * s;
    const rcX = headerRightEdge - rcPillW;
    const rcY = dotY - rcPillH / 2;
    roundRect(ctx, rcX, rcY, rcPillW, rcPillH, 3 * s);
    ctx.fillStyle = hmColor;
    ctx.globalAlpha = isDark ? 0.25 : 0.18;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = hmColor;
    ctx.fillText(rcText, rcX + 5 * s, dotY);
    headerRightEdge = rcX - 6 * s;
  }

  if (table.groupName && !hmActive) {
    const grpFontSize = Math.max(6, 9 * s);
    ctx.font = `500 ${grpFontSize}px ${FONT_FAMILY}`;
    const grpW = ctx.measureText(table.groupName).width;
    const grpX = headerRightEdge - grpW;

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
    fillTextTruncated(ctx, table.name, nameLeft, dotY, headerRightEdge - nameLeft);
  }

  // -- Columns
  const colFontSize = Math.max(7, 11.5 * s);
  const typeFontSize = Math.max(6, 10 * s);
  const badgeFontSize = Math.max(5, 8.5 * s);
  const typeAreaMaxW = sw * 0.38;

  table.columns.forEach((col: SchemaColumn, i: number) => {
    const rowY = sy + headerH + i * rowH;
    const isHovered = i === hoverColumnIndex;

    if (isHovered) {
      ctx.fillStyle = isDark ? 'rgba(108, 142, 239, 0.12)' : 'rgba(74, 111, 229, 0.10)';
      ctx.fillRect(contentLeft, rowY, sw - stripeW, rowH);
    } else if (i % 2 === 1) {
      ctx.fillStyle = theme.rowAltBg;
      ctx.fillRect(contentLeft, rowY, sw - stripeW, rowH);
    }

    const textY = rowY + rowH / 2;
    let xOff = contentLeft + pad;

    // Warning badge (!)
    if (col.isWarning) {
      const label = '!';
      ctx.font = `800 ${badgeFontSize}px ${FONT_FAMILY}`;
      const lw = ctx.measureText(label).width;
      const pillW = lw + 8 * s;
      const pillH = badgeFontSize + 4 * s;
      const pillY = textY - pillH / 2;
      roundRect(ctx, xOff, pillY, pillW, pillH, 3 * s);
      ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.20)' : 'rgba(220, 38, 38, 0.12)';
      ctx.fill();
      ctx.fillStyle = isDark ? '#f87171' : '#dc2626';
      ctx.fillText(label, xOff + 4 * s, textY);
      xOff += pillW + 4 * s;
    }

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
    // NN (Not Null) badge
    if (col.isNotNull && !col.isPrimaryKey) {
      const label = 'NN';
      ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}`;
      const lw = ctx.measureText(label).width;
      const pillW = lw + 8 * s;
      const pillH = badgeFontSize + 4 * s;
      const pillY = textY - pillH / 2;
      roundRect(ctx, xOff, pillY, pillW, pillH, 3 * s);
      ctx.fillStyle = theme.nnBg;
      ctx.fill();
      ctx.fillStyle = theme.nnText;
      ctx.fillText(label, xOff + 4 * s, textY);
      xOff += pillW + 4 * s;
    }
    // Localize badge
    if (col.isLocalize) {
      const label = 'L10n';
      ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}`;
      const lw = ctx.measureText(label).width;
      const pillW = lw + 8 * s;
      const pillH = badgeFontSize + 4 * s;
      const pillY = textY - pillH / 2;
      roundRect(ctx, xOff, pillY, pillW, pillH, 3 * s);
      ctx.fillStyle = theme.locBg;
      ctx.fill();
      ctx.fillStyle = theme.locText;
      ctx.fillText(label, xOff + 4 * s, textY);
      xOff += pillW + 4 * s;
    }
    {
      const hasBadge = col.isWarning || col.isPrimaryKey || col.isForeignKey || col.isNotNull || col.isLocalize;
      if (!hasBadge) xOff += 2 * s;
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
  isDark: boolean,
  heatmap: HeatmapInfo | null = null
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
  const hmActive = heatmap !== null;
  const hmColor = hmActive ? heatmapColor(heatmap.normalized) : '';

  ctx.save();

  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 10 * s;
  ctx.shadowOffsetY = 2 * s;
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.fillStyle = theme.tableBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.strokeStyle = isSelected ? accent : (hmActive ? hmColor : theme.tableBorder);
  ctx.lineWidth = isSelected ? 2.5 : (hmActive ? 2 : 1);
  ctx.stroke();

  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sr);
  ctx.clip();

  // Left stripe
  ctx.fillStyle = hmActive ? hmColor : accent;
  ctx.fillRect(sx, sy, stripeW, sh);

  // Header bg
  ctx.fillStyle = theme.tableHeaderBg;
  ctx.fillRect(sx, sy, sw, sh);
  if (hmActive) {
    ctx.fillStyle = hmColor;
    ctx.globalAlpha = isDark ? 0.18 : 0.12;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = hexToRgba(accent, isDark ? 0.12 : 0.08);
    ctx.fillRect(sx, sy, sw, sh);
  }

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
