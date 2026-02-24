import { useCallback, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore } from '../../store/useCanvasStore.ts';
import { useExploreStore } from '../../store/useExploreStore.ts';
import { forceArrangeLayout } from '../../core/layout/autoLayout.ts';
import { fitToScreen } from './interaction/ZoomPanHandler.ts';
import { exportCanvasAsImage } from '../../core/export/imageExporter.ts';
import SQLExportModal from '../Export/SQLExportModal.tsx';

/**
 * ERD 전용 플로팅 도구 모음 — 캔버스 우하단에 배치
 */
export default function ERDCanvasTools() {
  const [showExport, setShowExport] = useState(false);
  const schema       = useSchemaStore((s) => s.schema);
  const setNodes     = useCanvasStore((s) => s.setNodes);
  const nodes        = useCanvasStore((s) => s.nodes);
  const setTransform = useCanvasStore((s) => s.setTransform);
  const collapseMode    = useExploreStore((s) => s.collapseMode);
  const toggleCollapseMode = useExploreStore((s) => s.toggleCollapseMode);
  const heatmapEnabled  = useCanvasStore((s) => s.heatmapEnabled);
  const heatmapData     = useCanvasStore((s) => s.heatmapData);
  const toggleHeatmap   = useCanvasStore((s) => s.toggleHeatmap);
  const hasHeatmapData  = heatmapData.size > 0;

  const handleAutoArrange = useCallback(() => {
    if (!schema) return;
    const newNodes = forceArrangeLayout(schema, collapseMode);
    setNodes(newNodes);
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setTimeout(() => fitToScreen(rect.width, rect.height, newNodes, setTransform, collapseMode), 60);
    }
  }, [schema, setNodes, setTransform, collapseMode]);

  const handleFitScreen = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      fitToScreen(rect.width, rect.height, nodes, setTransform, collapseMode);
    }
  }, [nodes, setTransform, collapseMode]);

  const handleExportImage = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#erd-canvas');
    if (canvas) exportCanvasAsImage(canvas);
  };

  return (
    <>
      {/* 플로팅 툴바 — 캔버스 우하단 */}
      <div
        className="absolute bottom-4 right-4 z-10 flex items-center gap-1 px-2 py-1.5 rounded-xl select-none glass-panel"
        style={{
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Arrange */}
        <FloatBtn onClick={handleAutoArrange} title="Auto-arrange (Ctrl+Shift+A)" disabled={!schema}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Arrange
        </FloatBtn>

        {/* Fit */}
        <FloatBtn onClick={handleFitScreen} title="Fit to screen (Ctrl+0)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Fit
        </FloatBtn>

        <Sep />

        {/* Collapse / Expand */}
        <FloatBtn onClick={toggleCollapseMode} title="Toggle collapse mode">
          {collapseMode ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
          )}
          {collapseMode ? 'Expand' : 'Collapse'}
        </FloatBtn>

        {/* Heatmap */}
        <button
          onClick={toggleHeatmap}
          disabled={!hasHeatmapData}
          title={hasHeatmapData ? (heatmapEnabled ? 'Heatmap OFF' : 'Heatmap ON') : '데이터를 먼저 로드하세요'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer interactive disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            color: heatmapEnabled ? '#ef4444' : 'var(--text-secondary)',
            background: heatmapEnabled ? 'rgba(239,68,68,0.10)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (hasHeatmapData) {
              e.currentTarget.style.background = heatmapEnabled ? 'rgba(239,68,68,0.18)' : 'var(--bg-hover)';
              e.currentTarget.style.color = heatmapEnabled ? '#ef4444' : 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = heatmapEnabled ? 'rgba(239,68,68,0.10)' : 'transparent';
            e.currentTarget.style.color = heatmapEnabled ? '#ef4444' : 'var(--text-secondary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          Heatmap
        </button>

        <Sep />

        {/* SQL Export */}
        <FloatBtn onClick={() => setShowExport(true)} title="Export SQL" disabled={!schema}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          SQL
        </FloatBtn>

        {/* PNG Export */}
        <FloatBtn onClick={handleExportImage} title="Export as PNG">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          PNG
        </FloatBtn>
      </div>

      {showExport && <SQLExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}

function FloatBtn({
  children, onClick, title, disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer interactive disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: 'var(--border-color)' }} />;
}
