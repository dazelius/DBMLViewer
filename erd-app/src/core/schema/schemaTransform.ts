import { parseDBML } from '../parser/parseDBML.ts';
import type { ParsedSchema, ParseError } from './types.ts';

export function parseAndTransform(dbml: string): {
  schema: ParsedSchema | null;
  errors: ParseError[];
} {
  return parseDBML(dbml);
}
