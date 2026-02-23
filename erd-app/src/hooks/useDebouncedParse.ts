import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore.ts';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { parseAndTransform } from '../core/schema/schemaTransform.ts';
import { computeLayout } from '../core/layout/autoLayout.ts';

const DEBOUNCE_MS = 300;

export function useDebouncedParse() {
  const dbmlText = useEditorStore((s) => s.dbmlText);
  const setSchema = useSchemaStore((s) => s.setSchema);
  const setErrors = useSchemaStore((s) => s.setErrors);
  const nodes = useCanvasStore((s) => s.nodes);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const { schema, errors } = parseAndTransform(dbmlText);
      if (schema) {
        setSchema(schema);
        const layoutNodes = computeLayout(schema, nodes);
        setNodes(layoutNodes);
      } else {
        setErrors(errors);
      }
    }, DEBOUNCE_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbmlText]);
}
