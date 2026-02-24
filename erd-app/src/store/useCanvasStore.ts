import { create } from 'zustand';
import type { TableNode, ViewTransform } from '../core/layout/layoutTypes.ts';
import type { ParsedSchema } from '../core/schema/types.ts';
import { computeFocusLayout } from '../core/layout/autoLayout.ts';

interface CanvasState {
  nodes: Map<string, TableNode>;
  transform: ViewTransform;
  selectedTableId: string | null;
  selectedRefId: string | null;

  focusActive: boolean;
  focusTableId: string | null;
  focusTableIds: Set<string>;
  savedNodes: Map<string, TableNode> | null;
  savedTransform: ViewTransform | null;

  heatmapData: Map<string, number>;
  heatmapEnabled: boolean;
  tableData: Map<string, { headers: string[]; rows: Record<string, string>[] }>;

  setNodes: (nodes: Map<string, TableNode>) => void;
  updateNodePosition: (tableId: string, x: number, y: number) => void;
  updateMultipleNodePositions: (updates: Map<string, { x: number; y: number }>) => void;
  pinNode: (tableId: string) => void;
  unpinAll: () => void;
  setTransform: (transform: ViewTransform) => void;
  setSelectedTable: (id: string | null) => void;
  setSelectedRef: (id: string | null) => void;
  resetView: () => void;
  enterFocusMode: (tableId: string, schema: ParsedSchema, collapsed?: boolean) => void;
  exitFocusMode: () => void;
  setHeatmapData: (data: Map<string, number>) => void;
  toggleHeatmap: () => void;
  setTableData: (data: Map<string, { headers: string[]; rows: Record<string, string>[] }>) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: new Map(),
  transform: { x: 0, y: 0, scale: 1 },
  selectedTableId: null,
  selectedRefId: null,

  focusActive: false,
  focusTableId: null,
  focusTableIds: new Set(),
  savedNodes: null,
  savedTransform: null,

  heatmapData: new Map(),
  heatmapEnabled: false,
  tableData: new Map(),

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

  enterFocusMode: (tableId, schema, collapsed = false) => {
    const state = get();
    const { focusTableIds, nodes: focusNodes } = computeFocusLayout(schema, tableId, collapsed);
    set({
      focusActive: true,
      focusTableId: tableId,
      focusTableIds,
      // 이미 포커스 모드 중이라면 savedNodes를 덮어쓰지 않음 → ESC 시 원래 화면으로 복귀
      savedNodes: state.focusActive ? state.savedNodes : new Map(state.nodes),
      savedTransform: state.focusActive ? state.savedTransform : { ...state.transform },
      nodes: focusNodes,
      selectedTableId: tableId,
      selectedRefId: null,
    });
  },

  exitFocusMode: () => {
    const state = get();
    set({
      focusActive: false,
      focusTableId: null,
      focusTableIds: new Set(),
      nodes: state.savedNodes ?? state.nodes,
      transform: state.savedTransform ?? state.transform,
      savedNodes: null,
      savedTransform: null,
    });
  },

  setHeatmapData: (data) => set({ heatmapData: data, heatmapEnabled: data.size > 0 }),
  toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
  setTableData: (data) => set({ tableData: data }),
}));
