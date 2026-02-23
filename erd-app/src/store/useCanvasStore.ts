import { create } from 'zustand';
import type { TableNode, ViewTransform } from '../core/layout/layoutTypes.ts';

interface CanvasState {
  nodes: Map<string, TableNode>;
  transform: ViewTransform;
  selectedTableId: string | null;
  selectedRefId: string | null;

  setNodes: (nodes: Map<string, TableNode>) => void;
  updateNodePosition: (tableId: string, x: number, y: number) => void;
  updateMultipleNodePositions: (updates: Map<string, { x: number; y: number }>) => void;
  pinNode: (tableId: string) => void;
  unpinAll: () => void;
  setTransform: (transform: ViewTransform) => void;
  setSelectedTable: (id: string | null) => void;
  setSelectedRef: (id: string | null) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: new Map(),
  transform: { x: 0, y: 0, scale: 1 },
  selectedTableId: null,
  selectedRefId: null,

  setNodes: (nodes) => set({ nodes: new Map(nodes) }),

  updateNodePosition: (tableId, x, y) =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      const node = newNodes.get(tableId);
      if (node) {
        newNodes.set(tableId, { ...node, position: { x, y }, pinned: true });
      }
      return { nodes: newNodes };
    }),

  updateMultipleNodePositions: (updates) =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      for (const [tableId, pos] of updates) {
        const node = newNodes.get(tableId);
        if (node) {
          newNodes.set(tableId, { ...node, position: { x: pos.x, y: pos.y }, pinned: true });
        }
      }
      return { nodes: newNodes };
    }),

  pinNode: (tableId) =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      const node = newNodes.get(tableId);
      if (node) {
        newNodes.set(tableId, { ...node, pinned: true });
      }
      return { nodes: newNodes };
    }),

  unpinAll: () =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      for (const [id, node] of newNodes) {
        if (node.pinned) {
          newNodes.set(id, { ...node, pinned: false });
        }
      }
      return { nodes: newNodes };
    }),

  setTransform: (transform) => set({ transform }),

  setSelectedTable: (id) => set({ selectedTableId: id, selectedRefId: null }),
  setSelectedRef: (id) => set({ selectedRefId: id, selectedTableId: null }),
  resetView: () => set({ transform: { x: 0, y: 0, scale: 1 } }),
}));
