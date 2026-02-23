export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export interface TableNode {
  tableId: string;
  position: Position;
  size: Size;
  pinned: boolean;
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
