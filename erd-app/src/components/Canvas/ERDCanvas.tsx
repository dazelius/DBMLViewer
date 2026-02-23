import { useRef, useEffect, useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { renderCanvas } from './renderer/CanvasRenderer.ts';
import { handleWheel, fitToScreen } from './interaction/ZoomPanHandler.ts';
import { findTableAtPoint, findGroupAtPoint, findColumnAtPoint, createInitialDragState, type DragState, type HoverInfo } from './interaction/DragHandler.ts';
import { findRefAtPoint } from './interaction/SelectionHandler.ts';

interface TooltipData {
  text: string;
  x: number;
  y: number;
}

export default function ERDCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<DragState>(createInitialDragState());
  const hasFittedRef = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hoveredTableRef = useRef<string | null>(null);

  const schema = useSchemaStore((s) => s.schema);
  const nodes = useCanvasStore((s) => s.nodes);
  const transform = useCanvasStore((s) => s.transform);
  const selectedTableId = useCanvasStore((s) => s.selectedTableId);
  const selectedRefId = useCanvasStore((s) => s.selectedRefId);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const updateNodePosition = useCanvasStore((s) => s.updateNodePosition);
  const updateMultipleNodePositions = useCanvasStore((s) => s.updateMultipleNodePositions);
  const setSelectedTable = useCanvasStore((s) => s.setSelectedTable);
  const setSelectedRef = useCanvasStore((s) => s.setSelectedRef);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    renderCanvas(ctx, rect.width, rect.height, schema, nodes, transform, selectedTableId, selectedRefId, hoveredTableRef.current);
  }, [schema, nodes, transform, selectedTableId, selectedRefId]);

  useEffect(() => {
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // Auto fit-to-screen on first schema load
  useEffect(() => {
    if (schema && nodes.size > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true;
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setTimeout(() => fitToScreen(rect.width, rect.height, nodes, setTransform), 50);
      }
    }
  }, [schema, nodes, setTransform]);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => handleWheel(e, transform, setTransform);
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [transform, setTransform]);

  // Mouse down
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

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

    const tableId = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (tableId) {
      const node = nodes.get(tableId);
      if (!node) return;
      setSelectedTable(tableId);
      dragRef.current = {
        ...createInitialDragState(),
        isDragging: true,
        tableId,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y,
      };
    } else if (schema) {
      // Check if clicking on a group bounding box
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
          setSelectedTable(null);
          setSelectedRef(null);
          return;
        }
      }

      const refId = findRefAtPoint(e.clientX, e.clientY, rect, schema.refs, schema.tables, nodes, transform);
      if (refId) {
        setSelectedRef(refId);
      } else {
        setSelectedTable(null);
        setSelectedRef(null);
        dragRef.current = {
          ...createInitialDragState(),
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          startTransformX: transform.x,
          startTransformY: transform.y,
        };
      }
    }
  }, [nodes, transform, schema, setSelectedTable, setSelectedRef]);

  // Mouse move - drag/pan + hover tooltip
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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

    // Hover detection for table highlight + note tooltip
    if (!schema) { setTooltip(null); hoveredTableRef.current = null; return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const hitTable = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);
    hoveredTableRef.current = hitTable;

    const hover: HoverInfo | null = findColumnAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (!hover) { setTooltip(null); return; }

    const table = schema.tables.find((t) => t.id === hover.tableId);
    if (!table) { setTooltip(null); return; }

    const col = table.columns[hover.columnIndex];
    if (!col || !col.note) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({
      text: col.note,
      x: ox + 14,
      y: oy - 10,
    });
  }, [transform, updateNodePosition, updateMultipleNodePositions, setTransform, schema, nodes]);

  const onMouseUp = useCallback(() => {
    dragRef.current = createInitialDragState();
  }, []);

  const onMouseLeave = useCallback(() => {
    dragRef.current = createInitialDragState();
    setTooltip(null);
    hoveredTableRef.current = null;
  }, []);

  const onDoubleClick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    fitToScreen(rect.width, rect.height, nodes, setTransform);
  }, [nodes, setTransform]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        id="erd-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing"
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

      <div
        className="absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded select-none"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
      >
        {Math.round(transform.scale * 100)}% | Scroll to zoom, drag to pan
      </div>
    </div>
  );
}
