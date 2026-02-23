import { useEffect, useRef, useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { computeLayout, forceArrangeLayout } from '../../core/layout/autoLayout.ts';
import { fitToScreen } from '../Canvas/interaction/ZoomPanHandler.ts';
import { renderCanvas } from '../Canvas/renderer/CanvasRenderer.ts';
export default function DocsRelationships() {
  const schema = useSchemaStore((s) => s.schema);
  const nodes = useCanvasStore((s) => s.nodes);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const transform = useCanvasStore((s) => s.transform);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Ensure layout exists
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

  // Fit on mount
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

      renderCanvas(ctx, rect.width, rect.height, schema, nodes, transform, null, null);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [schema, nodes, transform]);

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
  }, [transform, setTransform]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform({ ...transform, x: panStart.current.tx + dx, y: panStart.current.ty + dy });
  }, [isPanning, transform, setTransform]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: 'var(--bg-primary)' }}>
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
    </div>
  );
}
