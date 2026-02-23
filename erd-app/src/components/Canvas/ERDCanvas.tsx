import { useRef, useEffect, useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';
import { renderCanvas, type ExploreVisuals } from './renderer/CanvasRenderer.ts';
import { handleWheel, fitToScreen } from './interaction/ZoomPanHandler.ts';
import { findTableAtPoint, findGroupAtPoint, findColumnAtPoint, createInitialDragState, type DragState, type HoverInfo } from './interaction/DragHandler.ts';
import { findRefAtPoint } from './interaction/SelectionHandler.ts';

interface TooltipData {
  text: string | null;
  enumName: string | null;
  enumValues: { name: string; note: string | null }[] | null;
  isLocalize: boolean;
  isWarning: boolean;
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
  const hoveredColumnRef = useRef<{ tableId: string; columnIndex: number } | null>(null);

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

  const focusActive = useCanvasStore((s) => s.focusActive);
  const focusTableId = useCanvasStore((s) => s.focusTableId);
  const focusTableIds = useCanvasStore((s) => s.focusTableIds);
  const enterFocusMode = useCanvasStore((s) => s.enterFocusMode);
  const exitFocusMode = useCanvasStore((s) => s.exitFocusMode);

  const heatmapData = useCanvasStore((s) => s.heatmapData);
  const heatmapEnabled = useCanvasStore((s) => s.heatmapEnabled);

  const columnSearchActive = useExploreStore((s) => s.columnSearchActive);
  const columnSearchResults = useExploreStore((s) => s.columnSearchResults);
  const collapseMode = useExploreStore((s) => s.collapseMode);
  const hiddenGroups = useExploreStore((s) => s.hiddenGroups);

  const exploreVisuals: ExploreVisuals = {
    columnSearchActive,
    columnSearchResults,
    collapseMode,
    hiddenGroups,
    focusActive,
    focusTableId,
    focusTableIds,
  };

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

    const hmData = heatmapEnabled && heatmapData.size > 0 ? heatmapData : null;
    renderCanvas(ctx, rect.width, rect.height, schema, nodes, transform, selectedTableId, selectedRefId, hoveredTableRef.current, exploreVisuals, hoveredColumnRef.current, hmData);
  }, [schema, nodes, transform, selectedTableId, selectedRefId, exploreVisuals, heatmapEnabled, heatmapData]);

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
        setTimeout(() => fitToScreen(rect.width, rect.height, nodes, setTransform, collapseMode), 50);
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

  // Mouse move
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

    if (!schema) { setTooltip(null); hoveredTableRef.current = null; return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const hitTable = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);
    hoveredTableRef.current = hitTable;

    const hover: HoverInfo | null = findColumnAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (!hover) {
      hoveredColumnRef.current = null;
      setTooltip(null);
      return;
    }

    hoveredColumnRef.current = { tableId: hover.tableId, columnIndex: hover.columnIndex };

    const table = schema.tables.find((t) => t.id === hover.tableId);
    if (!table) { setTooltip(null); return; }

    const col = table.columns[hover.columnIndex];
    if (!col) { setTooltip(null); return; }

    const enumDef = schema.enums.find((e) => e.name === col.type);
    if (!col.note && !enumDef && !col.isLocalize && !col.isWarning) { setTooltip(null); return; }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const ox = containerRect ? hover.screenX - containerRect.left : hover.screenX;
    const oy = containerRect ? hover.screenY - containerRect.top : hover.screenY;

    setTooltip({
      text: col.note ?? null,
      enumName: enumDef?.name ?? null,
      enumValues: enumDef?.values ?? null,
      isLocalize: col.isLocalize,
      isWarning: col.isWarning,
      x: ox + 14, y: oy - 10,
    });
  }, [transform, updateNodePosition, updateMultipleNodePositions, setTransform, schema, nodes]);

  const onMouseUp = useCallback(() => {
    dragRef.current = createInitialDragState();
  }, []);

  const onMouseLeave = useCallback(() => {
    dragRef.current = createInitialDragState();
    setTooltip(null);
    hoveredTableRef.current = null;
    hoveredColumnRef.current = null;
  }, []);

  // ESC to exit focus mode
  useEffect(() => {
    if (!focusActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFocusMode();
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setTimeout(() => {
            const restoredNodes = useCanvasStore.getState().nodes;
            fitToScreen(rect.width, rect.height, restoredNodes, setTransform, collapseMode);
          }, 0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusActive, exitFocusMode, setTransform, collapseMode]);

  const handleExitFocus = useCallback(() => {
    exitFocusMode();
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setTimeout(() => {
        const restoredNodes = useCanvasStore.getState().nodes;
        fitToScreen(rect.width, rect.height, restoredNodes, setTransform, collapseMode);
      }, 0);
    }
  }, [exitFocusMode, setTransform, collapseMode]);

  const onDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !schema) return;
    const rect = canvas.getBoundingClientRect();

    const tableId = findTableAtPoint(e.clientX, e.clientY, rect, nodes, transform);

    if (tableId) {
      enterFocusMode(tableId, schema, collapseMode);
      setTimeout(() => {
        const focusNodes = useCanvasStore.getState().nodes;
        fitToScreen(rect.width, rect.height, focusNodes, setTransform, collapseMode);
      }, 0);
    } else if (focusActive) {
      exitFocusMode();
      setTimeout(() => {
        const restoredNodes = useCanvasStore.getState().nodes;
        fitToScreen(rect.width, rect.height, restoredNodes, setTransform, collapseMode);
      }, 0);
    } else {
      fitToScreen(rect.width, rect.height, nodes, setTransform, collapseMode);
    }
  }, [nodes, transform, schema, setTransform, collapseMode, focusActive, enterFocusMode, exitFocusMode]);

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

      {/* Column tooltip (note + enum) */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 320 }}
        >
          <div
            className="rounded-lg text-xs leading-relaxed shadow-xl overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Warning section */}
            {tooltip.isWarning && (
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="font-semibold" style={{ color: '#f87171', fontSize: '10px' }}>DBML 호환을 위해 이름이 수정됨</span>
              </div>
            )}

            {/* Note section */}
            {tooltip.text && (
              <div className="px-3 py-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...(tooltip.isWarning ? { borderTop: '1px solid var(--border-color)' } : {}) }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="font-semibold" style={{ color: 'var(--accent)', fontSize: '10px' }}>NOTE</span>
                </div>
                {tooltip.text}
              </div>
            )}

            {/* Enum section */}
            {tooltip.enumValues && tooltip.enumName && (
              <div
                className="px-3 py-2"
                style={(tooltip.text || tooltip.isWarning) ? { borderTop: '1px solid var(--border-color)' } : undefined}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span className="font-semibold" style={{ color: '#a78bfa', fontSize: '10px' }}>ENUM</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    {tooltip.enumName}
                  </span>
                  <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    ({tooltip.enumValues.length})
                  </span>
                </div>
                <div className="flex flex-col gap-[1px]">
                  {tooltip.enumValues.slice(0, 12).map((v) => (
                    <div key={v.name} className="flex items-baseline gap-2 py-[1px]">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {v.name}
                      </span>
                      {v.note && (
                        <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)', maxWidth: 160 }}>
                          {v.note}
                        </span>
                      )}
                    </div>
                  ))}
                  {tooltip.enumValues.length > 12 && (
                    <div className="text-[9px] pt-0.5" style={{ color: 'var(--text-muted)' }}>
                      ... 외 {tooltip.enumValues.length - 12}개
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Localize section */}
            {tooltip.isLocalize && (
              <div
                className="px-3 py-2 flex items-center gap-1.5"
                style={(tooltip.text || tooltip.enumValues) ? { borderTop: '1px solid var(--border-color)' } : undefined}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="font-semibold" style={{ color: '#2dd4bf', fontSize: '10px' }}>L10n</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>번역 필요 컬럼</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Focus mode banner */}
      {focusActive && focusTableId && (
        <div
          className="absolute top-3 left-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-xl select-none"
          style={{
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Focus Mode</span>
          </div>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {schema?.tables.find((t) => t.id === focusTableId)?.name ?? focusTableId}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded tabular-nums" style={{ background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 600 }}>
            {focusTableIds.size} tables
          </span>
          <button
            onClick={handleExitFocus}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer text-[10px] font-semibold"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            ESC
          </button>
        </div>
      )}

      {/* Heatmap legend */}
      {heatmapEnabled && heatmapData.size > 0 && (
        <HeatmapLegend heatmapData={heatmapData} />
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

function HeatmapLegend({ heatmapData }: { heatmapData: Map<string, number> }) {
  let min = Infinity, max = 0;
  for (const v of heatmapData.values()) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) min = 0;

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  };

  const steps = 5;
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const stops: [number, [number, number, number]][] = [
      [0.00, [59, 130, 246]],
      [0.25, [34, 197, 94]],
      [0.50, [234, 179, 8]],
      [0.75, [249, 115, 22]],
      [1.00, [239, 68, 68]],
    ];
    let c = stops[stops.length - 1][1];
    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j][0] && t <= stops[j + 1][0]) {
        const f = (t - stops[j][0]) / (stops[j + 1][0] - stops[j][0]);
        c = [
          Math.round(stops[j][1][0] + (stops[j + 1][1][0] - stops[j][1][0]) * f),
          Math.round(stops[j][1][1] + (stops[j + 1][1][1] - stops[j][1][1]) * f),
          Math.round(stops[j][1][2] + (stops[j + 1][1][2] - stops[j][1][2]) * f),
        ];
        break;
      }
    }
    colors.push(`rgb(${c[0]},${c[1]},${c[2]})`);
  }

  return (
    <div
      className="absolute bottom-3 left-3 z-20 flex items-center gap-2.5 px-3 py-2 rounded-lg select-none"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="7" width="4" height="14" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Data Rows</span>
      </div>
      <span className="text-[10px] font-mono tabular-nums font-semibold" style={{ color: colors[0] }}>{formatNum(min)}</span>
      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ width: 100 }}>
        {colors.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <span className="text-[10px] font-mono tabular-nums font-semibold" style={{ color: colors[colors.length - 1] }}>{formatNum(max)}</span>
      <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        ({heatmapData.size} tables)
      </span>
    </div>
  );
}
