import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { measureTableSize } from '../../core/layout/autoLayout.ts';
import { renderCanvas } from '../Canvas/renderer/CanvasRenderer.ts';
import type { TableNode, ViewTransform } from '../../core/layout/layoutTypes.ts';
import type { ParsedSchema } from '../../core/schema/types.ts';
import dagre from '@dagrejs/dagre';

interface DocsMiniERDProps {
  tableId: string;
}

function buildMiniLayout(schema: ParsedSchema, tableId: string): Map<string, TableNode> {
  const relatedRefs = schema.refs.filter((r) => r.fromTable === tableId || r.toTable === tableId);
  const relatedIds = new Set<string>([tableId]);
  for (const ref of relatedRefs) {
    relatedIds.add(ref.fromTable);
    relatedIds.add(ref.toTable);
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  const relatedTables = schema.tables.filter((t) => relatedIds.has(t.id));
  for (const t of relatedTables) {
    const size = measureTableSize(t);
    g.setNode(t.id, { width: size.width, height: size.height });
  }
  for (const ref of relatedRefs) {
    if (relatedIds.has(ref.fromTable) && relatedIds.has(ref.toTable)) {
      g.setEdge(ref.fromTable, ref.toTable);
    }
  }

  dagre.layout(g);

  const nodes = new Map<string, TableNode>();
  for (const t of relatedTables) {
    const n = g.node(t.id);
    if (!n) continue;
    const size = measureTableSize(t);
    nodes.set(t.id, {
      position: { x: n.x - size.width / 2, y: n.y - size.height / 2 },
      size,
      pinned: false,
    });
  }
  return nodes;
}

export default function DocsMiniERD({ tableId }: DocsMiniERDProps) {
  const schema = useSchemaStore((s) => s.schema);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const miniNodes = useMemo(() => {
    if (!schema) return new Map<string, TableNode>();
    return buildMiniLayout(schema, tableId);
  }, [schema, tableId]);

  const miniSchema = useMemo<ParsedSchema | null>(() => {
    if (!schema) return null;
    const relatedRefs = schema.refs.filter((r) => r.fromTable === tableId || r.toTable === tableId);
    const relatedIds = new Set<string>([tableId]);
    for (const ref of relatedRefs) {
      relatedIds.add(ref.fromTable);
      relatedIds.add(ref.toTable);
    }
    return {
      tables: schema.tables.filter((t) => relatedIds.has(t.id)),
      refs: relatedRefs,
      enums: [],
      tableGroups: schema.tableGroups.filter((g) =>
        g.tables.some((tName) => {
          const t = schema.tables.find((tb) => tb.name === tName);
          return t && relatedIds.has(t.id);
        })
      ),
    };
  }, [schema, tableId]);

  // Fit to view
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || miniNodes.size === 0) return;
    const rect = canvas.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of miniNodes.values()) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    }

    const cw = maxX - minX;
    const ch = maxY - minY;
    const pad = 40;
    const scaleX = (rect.width - pad * 2) / cw;
    const scaleY = (rect.height - pad * 2) / ch;
    const scale = Math.min(scaleX, scaleY, 1.5);
    const cx = minX + cw / 2;
    const cy = minY + ch / 2;

    setTransform({
      x: rect.width / 2 - cx * scale,
      y: rect.height / 2 - cy * scale,
      scale,
    });
  }, [miniNodes, tableId]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !miniSchema) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      renderCanvas(ctx, rect.width, rect.height, miniSchema, miniNodes, transform, null, null);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [miniSchema, miniNodes, transform]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(3, Math.max(0.1, transform.scale * (1 + delta)));
    const ratio = newScale / transform.scale;
    setTransform({
      x: mouseX - ratio * (mouseX - transform.x),
      y: mouseY - ratio * (mouseY - transform.y),
      scale: newScale,
    });
  }, [transform]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform({ ...transform, x: panStart.current.tx + dx, y: panStart.current.ty + dy });
  }, [isPanning, transform]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}
