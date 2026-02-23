import { create } from 'zustand';
import type { ParsedSchema } from '../core/schema/types.ts';

export interface ExploreState {
  // Impact analysis
  impactDepthMap: Map<string, number>; // tableId → depth (0=selected, 1=direct, 2=2nd, ...)
  impactActive: boolean;

  // Column search
  columnSearchQuery: string;
  columnSearchResults: Set<string>; // tableIds with matching columns
  columnSearchActive: boolean;

  // Path finder
  pathFinderSource: string | null;
  pathFinderTarget: string | null;
  pathFinderResult: string[]; // ordered tableIds forming the path
  pathFinderActive: boolean;

  // Collapse mode
  collapseMode: boolean;

  // Group filtering
  hiddenGroups: Set<string>;

  // Actions
  computeImpact: (tableId: string | null, schema: ParsedSchema | null) => void;
  clearImpact: () => void;
  searchColumns: (query: string, schema: ParsedSchema | null) => void;
  clearColumnSearch: () => void;
  setPathFinderSource: (id: string | null) => void;
  setPathFinderTarget: (id: string | null) => void;
  computePath: (schema: ParsedSchema | null) => void;
  clearPathFinder: () => void;
  toggleCollapseMode: () => void;
  toggleGroupVisibility: (groupName: string) => void;
  showAllGroups: () => void;
  hideAllGroups: (groupNames: string[]) => void;
}

function buildAdjacency(schema: ParsedSchema): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const t of schema.tables) adj.set(t.id, new Set());
  for (const ref of schema.refs) {
    adj.get(ref.fromTable)?.add(ref.toTable);
    adj.get(ref.toTable)?.add(ref.fromTable);
  }
  return adj;
}

function bfsDepth(startId: string, adj: Map<string, Set<string>>, maxDepth: number): Map<string, number> {
  const visited = new Map<string, number>();
  visited.set(startId, 0);
  const queue: string[] = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = visited.get(current)!;
    if (depth >= maxDepth) continue;
    for (const neighbor of adj.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, depth + 1);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}

function bfsPath(sourceId: string, targetId: string, adj: Map<string, Set<string>>): string[] {
  if (sourceId === targetId) return [sourceId];
  const visited = new Map<string, string | null>();
  visited.set(sourceId, null);
  const queue: string[] = [sourceId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, current);
        if (neighbor === targetId) {
          const path: string[] = [];
          let node: string | null = targetId;
          while (node != null) {
            path.unshift(node);
            node = visited.get(node) ?? null;
          }
          return path;
        }
        queue.push(neighbor);
      }
    }
  }
  return [];
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  impactDepthMap: new Map(),
  impactActive: false,
  columnSearchQuery: '',
  columnSearchResults: new Set(),
  columnSearchActive: false,
  pathFinderSource: null,
  pathFinderTarget: null,
  pathFinderResult: [],
  pathFinderActive: false,
  collapseMode: false,
  hiddenGroups: new Set(),

  computeImpact: (tableId, schema) => {
    if (!tableId || !schema) {
      set({ impactDepthMap: new Map(), impactActive: false });
      return;
    }
    const adj = buildAdjacency(schema);
    const depthMap = bfsDepth(tableId, adj, 3);
    set({ impactDepthMap: depthMap, impactActive: true });
  },

  clearImpact: () => set({ impactDepthMap: new Map(), impactActive: false }),

  searchColumns: (query, schema) => {
    if (!query.trim() || !schema) {
      set({ columnSearchQuery: query, columnSearchResults: new Set(), columnSearchActive: false });
      return;
    }
    const q = query.toLowerCase();
    const results = new Set<string>();
    for (const table of schema.tables) {
      if (table.name.toLowerCase().includes(q)) {
        results.add(table.id);
        continue;
      }
      for (const col of table.columns) {
        if (col.name.toLowerCase().includes(q) || col.type.toLowerCase().includes(q)) {
          results.add(table.id);
          break;
        }
      }
    }
    set({ columnSearchQuery: query, columnSearchResults: results, columnSearchActive: true });
  },

  clearColumnSearch: () => set({ columnSearchQuery: '', columnSearchResults: new Set(), columnSearchActive: false }),

  setPathFinderSource: (id) => set({ pathFinderSource: id, pathFinderResult: [], pathFinderActive: false }),
  setPathFinderTarget: (id) => set({ pathFinderTarget: id, pathFinderResult: [], pathFinderActive: false }),

  computePath: (schema) => {
    const { pathFinderSource, pathFinderTarget } = get();
    if (!pathFinderSource || !pathFinderTarget || !schema) {
      set({ pathFinderResult: [], pathFinderActive: false });
      return;
    }
    const adj = buildAdjacency(schema);
    const path = bfsPath(pathFinderSource, pathFinderTarget, adj);
    set({ pathFinderResult: path, pathFinderActive: path.length > 0 });
  },

  clearPathFinder: () => set({
    pathFinderSource: null, pathFinderTarget: null,
    pathFinderResult: [], pathFinderActive: false,
  }),

  toggleCollapseMode: () => set((s) => ({ collapseMode: !s.collapseMode })),

  toggleGroupVisibility: (groupName) => set((s) => {
    const next = new Set(s.hiddenGroups);
    if (next.has(groupName)) next.delete(groupName);
    else next.add(groupName);
    return { hiddenGroups: next };
  }),

  showAllGroups: () => set({ hiddenGroups: new Set() }),

  hideAllGroups: (groupNames) => set({ hiddenGroups: new Set(groupNames) }),
}));
