import type { ViewTransform } from '../../../core/layout/layoutTypes.ts';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  transform: ViewTransform,
  isDark: boolean
) {
  const gridSize = 24;
  const majorGridSize = gridSize * 5;

  const minorColor = isDark ? 'rgba(60, 62, 80, 0.20)' : 'rgba(180, 185, 210, 0.25)';
  const majorColor = isDark ? 'rgba(60, 62, 80, 0.40)' : 'rgba(160, 165, 190, 0.40)';

  const scaledGrid = gridSize * transform.scale;
  const scaledMajorGrid = majorGridSize * transform.scale;

  // Only draw grid when it's legible
  if (scaledGrid < 4) return;

  const offsetX = transform.x % scaledGrid;
  const offsetY = transform.y % scaledGrid;

  ctx.lineWidth = 1;

  ctx.strokeStyle = minorColor;
  ctx.beginPath();
  for (let x = offsetX; x < width; x += scaledGrid) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, height);
  }
  for (let y = offsetY; y < height; y += scaledGrid) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(width, Math.round(y) + 0.5);
  }
  ctx.stroke();

  const majorOffsetX = transform.x % scaledMajorGrid;
  const majorOffsetY = transform.y % scaledMajorGrid;

  ctx.strokeStyle = majorColor;
  ctx.beginPath();
  for (let x = majorOffsetX; x < width; x += scaledMajorGrid) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, height);
  }
  for (let y = majorOffsetY; y < height; y += scaledMajorGrid) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(width, Math.round(y) + 0.5);
  }
  ctx.stroke();
}
