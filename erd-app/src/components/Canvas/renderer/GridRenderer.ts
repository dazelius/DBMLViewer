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

  const minorColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
  const majorColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.07)';

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
