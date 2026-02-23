import type { SchemaTableGroup } from '../../../core/schema/types.ts';
import type { TableNode, ViewTransform } from '../../../core/layout/layoutTypes.ts';

const HEADER_HEIGHT = 36;
const GROUP_PADDING = 24;
const GROUP_LABEL_HEIGHT = 28;

export function findTableAtPoint(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  nodes: Map<string, TableNode>,
  transform: ViewTransform
): string | null {
  const x = clientX - canvasRect.left;
  const y = clientY - canvasRect.top;

  const entries = Array.from(nodes.entries()).reverse();
  for (const [tableId, node] of entries) {
    const sx = node.position.x * transform.scale + transform.x;
    const sy = node.position.y * transform.scale + transform.y;
    const sw = node.size.width * transform.scale;
    const sh = node.size.height * transform.scale;

    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
      return tableId;
    }
  }
  return null;
}

export function isOnTableHeader(
  _clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  node: TableNode,
  transform: ViewTransform
): boolean {
  const y = clientY - canvasRect.top;
  const sy = node.position.y * transform.scale + transform.y;
  const headerH = HEADER_HEIGHT * transform.scale;
  return y >= sy && y <= sy + headerH;
}

const ROW_HEIGHT = 26;

export interface HoverInfo {
  tableId: string;
  columnIndex: number;
  screenX: number;
  screenY: number;
}

export function findColumnAtPoint(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  nodes: Map<string, TableNode>,
  transform: ViewTransform
): HoverInfo | null {
  const mx = clientX - canvasRect.left;
  const my = clientY - canvasRect.top;

  const entries = Array.from(nodes.entries()).reverse();
  for (const [tableId, node] of entries) {
    const sx = node.position.x * transform.scale + transform.x;
    const sy = node.position.y * transform.scale + transform.y;
    const sw = node.size.width * transform.scale;
    const sh = node.size.height * transform.scale;

    if (mx < sx || mx > sx + sw || my < sy || my > sy + sh) continue;

    const headerH = HEADER_HEIGHT * transform.scale;
    const rowH = ROW_HEIGHT * transform.scale;
    const relY = my - sy - headerH;

    if (relY < 0) return null;

    const colIdx = Math.floor(relY / rowH);
    return { tableId, columnIndex: colIdx, screenX: clientX, screenY: clientY };
  }
  return null;
}

/** Returns the group name if the click lands on a group bounding box (but not on a table) */
export function findGroupAtPoint(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  groups: SchemaTableGroup[],
  nodes: Map<string, TableNode>,
  transform: ViewTransform
): string | null {
  const mx = clientX - canvasRect.left;
  const my = clientY - canvasRect.top;
  const s = transform.scale;

  for (const grp of groups) {
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

    const gx = (minX - GROUP_PADDING) * s + transform.x;
    const gy = (minY - GROUP_PADDING - GROUP_LABEL_HEIGHT) * s + transform.y;
    const gw = (maxX - minX + GROUP_PADDING * 2) * s;
    const gh = (maxY - minY + GROUP_PADDING * 2 + GROUP_LABEL_HEIGHT) * s;

    if (mx >= gx && mx <= gx + gw && my >= gy && my <= gy + gh) {
      return grp.name;
    }
  }
  return null;
}

export interface DragState {
  isDragging: boolean;
  isPanning: boolean;
  tableId: string | null;
  groupName: string | null;
  groupTableStarts: Map<string, { x: number; y: number }>;
  startX: number;
  startY: number;
  startNodeX: number;
  startNodeY: number;
  startTransformX: number;
  startTransformY: number;
}

export function createInitialDragState(): DragState {
  return {
    isDragging: false,
    isPanning: false,
    tableId: null,
    groupName: null,
    groupTableStarts: new Map(),
    startX: 0,
    startY: 0,
    startNodeX: 0,
    startNodeY: 0,
    startTransformX: 0,
    startTransformY: 0,
  };
}
