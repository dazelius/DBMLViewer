import { useEffect, useRef, useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { computeLayout, forceArrangeLayout } from '../../core/layout/autoLayout.ts';
import { fitToScreen } from '../Canvas/interaction/ZoomPanHandler.ts';
import { renderCanvas } from '../Canvas/renderer/CanvasRenderer.ts';
import { findTableAtPoint, findGroupAtPoint, findColumnAtPoint, createInitialDragState, type DragState, type HoverInfo } from '../Canvas/interaction/DragHandler.ts';

interface TooltipData {
  text: string;
  x: number;
  y: number;
}

export default function DocsRelationships() {
  const schema = useSchemaStore((s) => s.schema);
  const nodes = useCanvasStore((s) => s.nodes);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const transform = useCanvasStore((s) => s.transform);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const updateNodePosition = useCanvasStore((s) => s.updateNodePosition);
  const updateMultipleNodePositions = useCanvasStore((s) => s.updateMultipleNodePositions);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(createInitialDragState());
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hoveredTableRef = useRef<string | null>(null);
  const hoveredColumnRef = useRef<{ tableId: string; columnIndex: number } | null>(null);
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!schema) return;
    if (nodes.size === 0) {
      const newNodes = forceArrangeLayout(schema);
      setNodes(newNodes);
    } else {
      const updated = computeLayout(schema, nodes);
      setNodes(updated);
    }
  }, [schema]);

  useEffect(() => {
    if (!canvasRef.current || nodes.size === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const timer = setTimeout(() => fitToScreen(rect.width, rect.height, nodes, setTransform), 100);
    return () => clearTimeout(timer);
  }, [nodes.size > 0]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !schema) return;
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
        ctx, rect.width, rect.height, schema, nodes, transform,
        selectedTableId, null, hoveredTableRef.current, undefined, hoveredColumnRef.current
      );
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [schema, nodes, transform, selectedTableId]);

  // Wheel zoom
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
  }, [transform, setTransform]);

  // Mouse down
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !schema) return;

    if (e.button === 1) {
      e.preventDefault();
      dragRef.current = {
        ...createInitialDragState(),
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startTransformX: transform.x,
        startTransformY: transform.y,
      };
      return;
    }

    if (e.button !== 0) return;

    clickStartRef.current = { x: e.clientX, y: e.clientY };
    const rect = canvas.getBoundingClientRect();
    const hitTableId = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (hitTableId) {
      const node = nodes.get(hitTableId);
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
      const groupName = findGroupAtPoint(e.clientX, e.clientY, rect, schema.tableGroups, nodes, transform);
      if (groupName) {
        const grp = schema.tableGroups.find((g) => g.name === groupName);
        if (grp) {
          const starts = new Map<string, { x: number; y: number }>();
          for (const tid of grp.tables) {
            const n = nodes.get(tid);
            if (n) starts.set(tid, { x: n.position.x, y: n.position.y });
          }
          dragRef.current = {
            ...createInitialDragState(),
            isDragging: true,
            groupName,
            groupTableStarts: starts,
            startX: e.clientX,
            startY: e.clientY,
          };
          setSelectedTableId(null);
          return;
        }
      }

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
  }, [nodes, transform, schema]);

  // Mouse move
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;

    if (drag.isDragging && drag.groupName && drag.groupTableStarts.size > 0) {
      const dx = (e.clientX - drag.startX) / transform.scale;
      const dy = (e.clientY - drag.startY) / transform.scale;
      const updates = new Map<string, { x: number; y: number }>();
      for (const [tid, start] of drag.groupTableStarts) {
        updates.set(tid, { x: start.x + dx, y: start.y + dy });
      }
      updateMultipleNodePositions(updates);
      setTooltip(null);
      return;
    }

    if (drag.isDragging && drag.tableId) {
      const dx = (e.clientX - drag.startX) / transform.scale;
      const dy = (e.clientY - drag.startY) / transform.scale;
      updateNodePosition(drag.tableId, drag.startNodeX + dx, drag.startNodeY + dy);
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

    // Hover
    if (!schema) { setTooltip(null); hoveredTableRef.current = null; hoveredColumnRef.current = null; return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const hitTable = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);
    hoveredTableRef.current = hitTable;

    const hover: HoverInfo | null = findColumnAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (!hover) {
      hoveredColumnRef.current = null;
      setTooltip(null);
      canvas.style.cursor = hitTable ? 'pointer' : 'grab';
      return;
    }

    hoveredColumnRef.current = { tableId: hover.tableId, columnIndex: hover.columnIndex };
    canvas.style.cursor = 'pointer';

    const table = schema.tables.find((t) => t.id === hover.tableId);
    if (!table) { setTooltip(null); return; }

    const col = table.columns[hover.columnIndex];
    if (!col || !col.note) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({ text: col.note, x: ox + 14, y: oy - 10 });
  }, [transform, updateNodePosition, updateMultipleNodePositions, setTransform, schema, nodes]);

  const onMouseUp = useCallback(() => {
    dragRef.current = createInitialDragState();
    clickStartRef.current = null;
  }, []);

  const onMouseLeave = useCallback(() => {
    dragRef.current = createInitialDragState();
    clickStartRef.current = null;
    setTooltip(null);
    hoveredTableRef.current = null;
    hoveredColumnRef.current = null;
  }, []);

  const onDoubleClick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    fitToScreen(rect.width, rect.height, nodes, setTransform);
  }, [nodes, setTransform]);

  const handleFit = useCallback(() => {
    if (!canvasRef.current || nodes.size === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    fitToScreen(rect.width, rect.height, nodes, setTransform);
  }, [nodes, setTransform]);

  const zoomPct = Math.round(transform.scale * 100);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: 'var(--bg-primary)' }}>
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

      {/* Floating controls */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
        }}
      >
        <span className="text-[10px] font-bold tabular-nums px-2" style={{ color: 'var(--text-muted)', minWidth: 40, textAlign: 'center' }}>
          {zoomPct}%
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
        <button
          onClick={handleFit}
          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
          style={{
            color: 'var(--accent)',
            background: 'var(--accent-muted)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          Fit
        </button>
      </div>

      {/* Info + hint */}
      <div
        className="absolute top-4 right-4 flex items-center gap-3 px-3 py-1.5 rounded-lg text-[10px] font-medium"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
        }}
      >
        {schema && (
          <>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{schema.tables.length}</span> tables
            <span style={{ opacity: 0.3 }}>&middot;</span>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{schema.refs.length}</span> refs
          </>
        )}
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ opacity: 0.6 }}>Drag to move, scroll to zoom</span>
      </div>
    </div>
  );
}
