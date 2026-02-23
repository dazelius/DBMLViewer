import { useEffect, useRef, useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { computeLayout, forceArrangeLayout } from '../../core/layout/autoLayout.ts';
import { fitToScreen } from '../Canvas/interaction/ZoomPanHandler.ts';
import { renderCanvas } from '../Canvas/renderer/CanvasRenderer.ts';
import { findTableAtPoint, findGroupAtPoint, findColumnAtPoint, createInitialDragState, type DragState, type HoverInfo } from '../Canvas/interaction/DragHandler.ts';

interface TooltipData {
  text: string | null;
  enumName: string | null;
  enumValues: { name: string; note: string | null }[] | null;
  isLocalize: boolean;
  isWarning: boolean;
  x: number;
  y: number;
}

export default function DocsRelationships() {
  const schema = useSchemaStore((s) => s.schema);
  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const heatmapEnabled = useCanvasStore((s) => s.heatmapEnabled);
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

      const hmData = heatmapEnabled && heatmapData.size > 0 ? heatmapData : null;
      renderCanvas(
        ctx, rect.width, rect.height, schema, nodes, transform,
        selectedTableId, null, hoveredTableRef.current, undefined, hoveredColumnRef.current, hmData
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
    if (!col) { setTooltip(null); return; }

    const enumDef = schema.enums.find((e) => e.name === col.type);
    if (!col.note && !enumDef && !col.isLocalize && !col.isWarning) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({ text: col.note ?? null, enumName: enumDef?.name ?? null, enumValues: enumDef?.values ?? null, isLocalize: col.isLocalize, isWarning: col.isWarning, x: ox + 14, y: oy - 10 });
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
