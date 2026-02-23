import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { measureTableSize } from '../../core/layout/autoLayout.ts';
import { renderCanvas } from '../Canvas/renderer/CanvasRenderer.ts';
import { findTableAtPoint, findColumnAtPoint, createInitialDragState, type DragState, type HoverInfo } from '../Canvas/interaction/DragHandler.ts';
import type { TableNode, ViewTransform } from '../../core/layout/layoutTypes.ts';
import type { ParsedSchema } from '../../core/schema/types.ts';
import dagre from '@dagrejs/dagre';

interface DocsMiniERDProps {
  tableId: string;
}

interface TooltipData {
  text: string;
  x: number;
  y: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<DragState>(createInitialDragState());
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tableId);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hoveredTableRef = useRef<string | null>(null);
  const hoveredColumnRef = useRef<{ tableId: string; columnIndex: number } | null>(null);

  const [miniNodes, setMiniNodes] = useState<Map<string, TableNode>>(() => new Map());

  useEffect(() => {
    if (!schema) return;
    setMiniNodes(buildMiniLayout(schema, tableId));
    setSelectedTableId(tableId);
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

  // Render loop
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

      renderCanvas(
        ctx, rect.width, rect.height, miniSchema, miniNodes, transform,
        selectedTableId, null, hoveredTableRef.current, undefined, hoveredColumnRef.current
      );
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [miniSchema, miniNodes, transform, selectedTableId]);

  // Wheel zoom (native event to allow preventDefault on non-passive listener)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [transform]);

  // Mouse down - selection + drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();

    const hitTableId = findTableAtPoint(e.clientX, e.clientY, rect, miniNodes, transform);

    if (hitTableId) {
      const node = miniNodes.get(hitTableId);
      if (!node) return;
      setSelectedTableId(hitTableId);
      dragRef.current = {
        ...createInitialDragState(),
        isDragging: true,
        tableId: hitTableId,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y,
      };
    } else {
      setSelectedTableId(null);
      dragRef.current = {
        ...createInitialDragState(),
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startTransformX: transform.x,
        startTransformY: transform.y,
      };
    }
  }, [miniNodes, transform]);

  // Mouse move - drag / pan / hover
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;

    if (drag.isDragging && drag.tableId) {
      const dx = (e.clientX - drag.startX) / transform.scale;
      const dy = (e.clientY - drag.startY) / transform.scale;
      setMiniNodes((prev) => {
        const next = new Map(prev);
        const node = prev.get(drag.tableId!);
        if (node) {
          next.set(drag.tableId!, {
            ...node,
            position: { x: drag.startNodeX + dx, y: drag.startNodeY + dy },
          });
        }
        return next;
      });
      setTooltip(null);
      return;
    }

    if (drag.isPanning) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setTransform({
        ...transform,
        x: drag.startTransformX + dx,
        y: drag.startTransformY + dy,
      });
      setTooltip(null);
      return;
    }

    // Hover detection
    if (!miniSchema) { setTooltip(null); hoveredTableRef.current = null; hoveredColumnRef.current = null; return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const hitTable = findTableAtPoint(e.clientX, e.clientY, rect, miniNodes, transform);
    hoveredTableRef.current = hitTable;

    const hover: HoverInfo | null = findColumnAtPoint(e.clientX, e.clientY, rect, miniNodes, transform);

    if (!hover) {
      hoveredColumnRef.current = null;
      setTooltip(null);
      canvas.style.cursor = hitTable ? 'pointer' : 'grab';
      return;
    }

    hoveredColumnRef.current = { tableId: hover.tableId, columnIndex: hover.columnIndex };
    canvas.style.cursor = 'pointer';

    const table = miniSchema.tables.find((t) => t.id === hover.tableId);
    if (!table) { setTooltip(null); return; }

    const col = table.columns[hover.columnIndex];
    if (!col || !col.note) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({ text: col.note, x: ox + 14, y: oy - 10 });
  }, [transform, miniNodes, miniSchema]);

  const onMouseUp = useCallback(() => {
    const drag = dragRef.current;
    const wasDragging = drag.isDragging && (
      Math.abs(drag.startX - 0) > 0 || Math.abs(drag.startY - 0) > 0
    );
    const movedDistance = drag.isDragging
      ? Math.hypot(drag.startX - (drag.startX), drag.startY - (drag.startY))
      : 0;
    dragRef.current = createInitialDragState();

    // We handle navigation in onClick for clean click detection
  }, []);

  const onMouseLeave = useCallback(() => {
    dragRef.current = createInitialDragState();
    setTooltip(null);
    hoveredTableRef.current = null;
    hoveredColumnRef.current = null;
  }, []);

  // Double click to fit
  const onDoubleClick = useCallback(() => {
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
  }, [miniNodes]);

  const zoomPct = Math.round(transform.scale * 100);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Column note tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div
            className="px-3 py-2 rounded-lg text-xs leading-relaxed shadow-xl"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(12px)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="font-semibold" style={{ color: 'var(--accent)', fontSize: '10px' }}>NOTE</span>
            </div>
            {tooltip.text}
          </div>
        </div>
      )}

      {/* Zoom info */}
      <div
        className="absolute bottom-2 right-2 text-[9px] px-2 py-1 rounded-md select-none"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', opacity: 0.8 }}
      >
        {zoomPct}%
      </div>
    </div>
  );
}
