import { create } from 'zustand';
import type { ParsedSchema } from '../core/schema/types.ts';

export interface ExploreState {
  columnSearchQuery: string;
  columnSearchResults: Set<string>;
  columnSearchActive: boolean;

  collapseMode: boolean;
  hiddenGroups: Set<string>;

  searchColumns: (query: string, schema: ParsedSchema | null) => void;
  clearColumnSearch: () => void;
  toggleCollapseMode: () => void;
  toggleGroupVisibility: (groupName: string) => void;
  showAllGroups: () => void;
  hideAllGroups: (groupNames: string[]) => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  columnSearchQuery: '',
  columnSearchResults: new Set(),
  columnSearchActive: false,
  collapseMode: false,
  hiddenGroups: new Set(),

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
