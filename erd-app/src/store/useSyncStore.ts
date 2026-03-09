import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';
export type SyncResultType = 'cloned' | 'updated' | 'up-to-date';

interface RepoSync {
  status: SyncStatus;
  resultType: SyncResultType | null;
  commit: string | null;
  branch: string | null;
  errorMsg: string | null;
  lastSyncAt: Date | null;
}

interface SyncState {
  // repo1 (aegisdata)
  status: SyncStatus;
  resultType: SyncResultType | null;
  commit: string | null;
  errorMsg: string | null;
  lastSyncAt: Date | null;

  // repo2 (aegis)
  repo2: RepoSync;

  setSyncing: () => void;
  setDone: (resultType: SyncResultType, commit: string) => void;
  setError: (msg: string) => void;
  reset: () => void;

  setRepo2Syncing: () => void;
  setRepo2Done: (resultType: SyncResultType, commit: string, branch?: string) => void;
  setRepo2Error: (msg: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  resultType: null,
  commit: null,
  errorMsg: null,
  lastSyncAt: null,

  repo2: {
    status: 'idle',
    resultType: null,
    commit: null,
    branch: null,
    errorMsg: null,
    lastSyncAt: null,
  },

  setSyncing: () => set({ status: 'syncing', resultType: null, commit: null, errorMsg: null }),
  setDone: (resultType, commit) => set({ status: 'done', resultType, commit, lastSyncAt: new Date() }),
  setError: (msg) => set({ status: 'error', errorMsg: msg }),
  reset: () => set({ status: 'idle' }),

  setRepo2Syncing: () => set((s) => ({ repo2: { ...s.repo2, status: 'syncing', resultType: null, commit: null, errorMsg: null } })),
  setRepo2Done: (resultType, commit, branch) => set((s) => ({ repo2: { ...s.repo2, status: 'done', resultType, commit, branch: branch ?? s.repo2.branch, lastSyncAt: new Date() } })),
  setRepo2Error: (msg) => set((s) => ({ repo2: { ...s.repo2, status: 'error', errorMsg: msg } })),
}));
