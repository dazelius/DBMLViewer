export type { ChartType, VizData, ChartFn } from './types';
export { COLORS, BASE_STYLE, parseRows, parseProps, parseWithHeader, EMPTY } from './utils';

import { BASE_STYLE } from './utils';
import type { ChartType, VizData } from './types';

import { barChart, hbarChart, stackChart, histogramChart, waterfallChart, bulletChart } from './charts/barCharts';
import { lineChart, radarChart, scatterChart, areaChart, bubbleChart } from './charts/lineCharts';
import { pieChart, donutChart, gaugeChart, treemapChart, funnelChart } from './charts/circularCharts';
import { compareChart, statChart, progressChart, matrixChart, quadrantChart, diffChart, dumbbellChart, tableChart } from './charts/dataCharts';
import { flowChart, swimlaneChart, hierarchyChart, mindmapChart, relationChart, processChart } from './charts/diagramCharts';
import { timelineChart, kanbanChart, calendarChart, ganttChart, changelogChart } from './charts/timelineCharts';
import { tierChart, itemcardChart, galleryChart } from './charts/specialCharts';

const chartFns: Record<string, (body: string, title: string) => string> = {
  bar: barChart, hbar: hbarChart, stack: stackChart,
  pie: pieChart, donut: donutChart, line: lineChart, area: areaChart,
  radar: radarChart, scatter: scatterChart, bubble: bubbleChart,
  gauge: gaugeChart, treemap: treemapChart, funnel: funnelChart, waterfall: waterfallChart, bullet: bulletChart,
  compare: compareChart, stat: statChart, matrix: matrixChart, quadrant: quadrantChart, progress: progressChart, dumbbell: dumbbellChart,
  flow: flowChart, swimlane: swimlaneChart, hierarchy: hierarchyChart, mindmap: mindmapChart, process: processChart,
  timeline: timelineChart, kanban: kanbanChart, relation: relationChart, changelog: changelogChart,
  tier: tierChart, itemcard: itemcardChart, gallery: galleryChart, table: tableChart, diff: diffChart,
  histogram: histogramChart, calendar: calendarChart, gantt: ganttChart,
};

export function buildVisualizerHtml(data: VizData): string {
  const { type, title, body } = data;

  if (type === 'html') {
    const htmlBaseStyle = BASE_STYLE.replace('overflow:hidden', 'overflow:auto');
    return `<style>${htmlBaseStyle}
input[type="range"]{-webkit-appearance:none;background:rgba(255,255,255,0.1);height:6px;border-radius:3px;outline:none}
input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#818cf8;cursor:pointer;border:2px solid #0f1117}
input[type="text"],input[type="number"],select{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:5px 10px;font-size:12px;color:#e2e8f0;outline:none;font-family:inherit}
input:focus,select:focus{border-color:#818cf8}
button{background:rgba(129,140,248,0.15);border:1px solid rgba(129,140,248,0.3);border-radius:6px;padding:5px 12px;font-size:11px;color:#a5b4fc;cursor:pointer;font-family:inherit;transition:all 0.15s}
button:hover{background:rgba(129,140,248,0.25);border-color:rgba(129,140,248,0.5)}
.card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600}
</style>${body}`;
  }

  const fn = chartFns[type];
  if (!fn) return `<p style="color:#f87171;padding:16px">알 수 없는 차트 타입: ${type}</p>`;

  const chartHtml = fn(body, title);
  return `<style>${BASE_STYLE}</style><div>${chartHtml}</div>`;
}

/** :::visualizer 블록 헤더에서 type과 title 추출 */
export function parseVizHeader(headerLine: string): { type: ChartType; title: string } {
  const typeMatch = headerLine.match(/type="([^"]*)"/);
  const titleMatch = headerLine.match(/title="([^"]*)"/);
  const type = (typeMatch?.[1] ?? 'bar') as ChartType;
  const title = titleMatch?.[1] ?? '';
  return { type, title };
}

/**
 * 아티팩트 HTML 내 <viz-chart> 태그를 렌더링된 차트 HTML로 치환.
 * 사용법: <viz-chart type="bar" title="제목">데이터</viz-chart>
 */
export function processArtifactCharts(html: string): string {
  return html.replace(
    /<viz-chart\b([^>]*)>([\s\S]*?)<\/viz-chart>/gi,
    (_match, attrs: string, body: string) => {
      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      const titleMatch = attrs.match(/title=["']([^"']+)["']/);
      const type = (typeMatch?.[1] ?? 'bar') as ChartType;
      const title = titleMatch?.[1] ?? '';
      const chartHtml = buildVisualizerHtml({ type, title, body: body.trim() });
      return `<div class="viz-chart-embed" style="margin:12px 0;border-radius:10px;background:#0f1117;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
  ${title ? `<div style="padding:8px 14px 0;font-size:13px;font-weight:700;color:#e2e8f0">${title}</div>` : ''}
  ${chartHtml}
</div>`;
    },
  );
}
