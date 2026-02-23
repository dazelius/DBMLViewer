import type { ViewTransform } from '../../../core/layout/layoutTypes.ts';

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 0.001;

export function handleWheel(
  e: WheelEvent,
  transform: ViewTransform,
  setTransform: (t: ViewTransform) => void
) {
  e.preventDefault();
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const delta = -e.deltaY * ZOOM_FACTOR;
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale * (1 + delta)));
  const ratio = newScale / transform.scale;

  setTransform({
    x: mouseX - ratio * (mouseX - transform.x),
    y: mouseY - ratio * (mouseY - transform.y),
    scale: newScale,
  });
}

const COLLAPSED_HEIGHT = 44; // TABLE_HEADER_HEIGHT(36) + 8

export function fitToScreen(
  canvasWidth: number,
  canvasHeight: number,
  nodes: Map<string, { position: { x: number; y: number }; size: { width: number; height: number } }>,
  setTransform: (t: ViewTransform) => void,
  collapseMode = false
) {
  if (nodes.size === 0) {
    setTransform({ x: 0, y: 0, scale: 1 });
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes.values()) {
    const h = collapseMode ? COLLAPSED_HEIGHT : node.size.height;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.size.width);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const padding = 60;

  const scaleX = (canvasWidth - padding * 2) / contentWidth;
  const scaleY = (canvasHeight - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1.5);

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  setTransform({
    x: (canvasWidth - scaledWidth) / 2 - minX * scale,
    y: (canvasHeight - scaledHeight) / 2 - minY * scale,
    scale,
  });
}
