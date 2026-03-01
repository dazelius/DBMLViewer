import { create } from 'zustand';

export interface RagTraceStep {
  toolName: string;
  tables?: string[];
  guides?: string[];
  duration?: number;
  error?: boolean;
}

export interface RagTrace {
  id: string;
  query: string;
  timestamp: number;
  steps: RagTraceStep[];
  totalInputTokens: number;
  totalOutputTokens: number;
}

interface RagTraceState {
  traces: RagTrace[];
  activeTraceId: string | null;
  pushTrace: (trace: RagTrace) => void;
  setActiveTrace: (id: string | null) => void;
}

const MAX_TRACES = 30;

export const useRagTraceStore = create<RagTraceState>((set) => ({
  traces: [],
  activeTraceId: null,
  pushTrace: (trace) => set((s) => ({
    traces: [trace, ...s.traces].slice(0, MAX_TRACES),
    activeTraceId: trace.id,
  })),
  setActiveTrace: (id) => set({ activeTraceId: id }),
}));
