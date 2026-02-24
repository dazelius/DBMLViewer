import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
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
  text: string | null;
  enumName: string | null;
  enumValues: { name: string; note: string | null }[] | null;
  isLocalize: boolean;
  isWarning: boolean;
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
      tableId: t.id,
      position: { x: n.x - size.width / 2, y: n.y - size.height / 2 },
      size,
      pinned: false,
    });
  }
  return nodes;
}

export default function DocsMiniERD({ tableId }: DocsMiniERDProps) {
  const schema = useSchemaStore((s) => s.schema);
  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const heatmapEnabled = useCanvasStore((s) => s.heatmapEnabled);
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
      enums: schema.enums,
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

      const hmData = heatmapEnabled && heatmapData.size > 0 ? heatmapData : null;
      renderCanvas(
        ctx, rect.width, rect.height, miniSchema, miniNodes, transform,
        selectedTableId, null, hoveredTableRef.current, undefined, hoveredColumnRef.current, hmData
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
    if (!col) { setTooltip(null); return; }

    const enumDef = schema?.enums.find((e) => e.name === col.type);
    if (!col.note && !enumDef && !col.isLocalize && !col.isWarning) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({ text: col.note ?? null, enumName: enumDef?.name ?? null, enumValues: enumDef?.values ?? null, isLocalize: col.isLocalize, isWarning: col.isWarning, x: ox + 14, y: oy - 10 });
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

      {/* Column tooltip (note + enum) */}
      {tooltip && (
        <div className="absolute z-20 pointer-events-none" style={{ left: tooltip.x, top: tooltip.y, maxWidth: 320 }}>
          <div className="rounded-lg text-xs leading-relaxed shadow-xl overflow-hidden" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
            {tooltip.isWarning && (
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <span className="font-semibold" style={{ color: '#f87171', fontSize: '10px' }}>DBML 호환을 위해 이름이 수정됨</span>
              </div>
            )}
            {tooltip.text && (
              <div className="px-3 py-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...(tooltip.isWarning ? { borderTop: '1px solid var(--border-color)' } : {}) }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  <span className="font-semibold" style={{ color: 'var(--accent)', fontSize: '10px' }}>NOTE</span>
                </div>
                {tooltip.text}
              </div>
            )}
            {tooltip.enumValues && tooltip.enumName && (
              <div className="px-3 py-2" style={(tooltip.text || tooltip.isWarning) ? { borderTop: '1px solid var(--border-color)' } : undefined}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  <span className="font-semibold" style={{ color: '#a78bfa', fontSize: '10px' }}>ENUM</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{tooltip.enumName}</span>
                  <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>({tooltip.enumValues.length})</span>
                </div>
                <div className="flex flex-col gap-[1px]">
                  {tooltip.enumValues.slice(0, 12).map((v) => (
                    <div key={v.name} className="flex items-baseline gap-2 py-[1px]">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{v.name}</span>
                      {v.note && <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)', maxWidth: 160 }}>{v.note}</span>}
                    </div>
                  ))}
                  {tooltip.enumValues.length > 12 && <div className="text-[9px] pt-0.5" style={{ color: 'var(--text-muted)' }}>... 외 {tooltip.enumValues.length - 12}개</div>}
                </div>
              </div>
            )}
            {tooltip.isLocalize && (
              <div className="px-3 py-2 flex items-center gap-1.5" style={(tooltip.text || tooltip.enumValues) ? { borderTop: '1px solid var(--border-color)' } : undefined}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                <span className="font-semibold" style={{ color: '#2dd4bf', fontSize: '10px' }}>L10n</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>번역 필요 컬럼</span>
              </div>
            )}
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
