import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';
export type SyncResultType = 'cloned' | 'updated' | 'up-to-date';

interface SyncState {
  status: SyncStatus;
  resultType: SyncResultType | null;
  commit: string | null;
  errorMsg: string | null;
  lastSyncAt: Date | null;

  setSyncing: () => void;
  setDone: (resultType: SyncResultType, commit: string) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  resultType: null,
  commit: null,
  errorMsg: null,
  lastSyncAt: null,

  setSyncing: () => set({ status: 'syncing', resultType: null, commit: null, errorMsg: null }),
  setDone: (resultType, commit) => set({ status: 'done', resultType, commit, lastSyncAt: new Date() }),
  setError: (msg) => set({ status: 'error', errorMsg: msg }),
  reset: () => set({ status: 'idle' }),
}));
