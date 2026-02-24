import { Parser, ModelExporter } from '@dbml/core';

export type SqlDialect = 'postgres' | 'mysql' | 'mssql';

export function exportToSQL(dbml: string, dialect: SqlDialect): string {
  try {
    const db = Parser.parse(dbml, 'dbml');
    return ModelExporter.export(db, dialect, false);
  } catch (err: unknown) {
    const error = err as { message?: string };
    throw new Error(`SQL export failed: ${error.message ?? 'Unknown error'}`);
  }
}
