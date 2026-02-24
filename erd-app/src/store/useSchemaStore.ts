import { create } from 'zustand';
import type { ParsedSchema, ParseError } from '../core/schema/types.ts';

interface SchemaState {
  schema: ParsedSchema | null;
  errors: ParseError[];
  setSchema: (schema: ParsedSchema) => void;
  setErrors: (errors: ParseError[]) => void;
  clear: () => void;
}

export const useSchemaStore = create<SchemaState>((set) => ({
  schema: null,
  errors: [],
  setSchema: (schema) => set({ schema, errors: [] }),
  setErrors: (errors) => set({ errors }),
  clear: () => set({ schema: null, errors: [] }),
}));
