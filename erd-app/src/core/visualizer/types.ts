export type ChartType =
  | 'bar' | 'hbar' | 'stack' | 'pie' | 'donut' | 'line' | 'area' | 'radar' | 'scatter' | 'bubble'
  | 'gauge' | 'treemap' | 'funnel' | 'waterfall' | 'histogram' | 'bullet'
  | 'compare' | 'stat' | 'matrix' | 'quadrant' | 'progress' | 'diff' | 'table' | 'dumbbell'
  | 'flow' | 'swimlane' | 'hierarchy' | 'mindmap' | 'timeline' | 'kanban' | 'relation' | 'process'
  | 'tier' | 'itemcard' | 'gallery' | 'calendar' | 'gantt' | 'changelog'
  | 'html';

export interface VizData {
  type: ChartType;
  title: string;
  body: string;
}

export type ChartFn = (body: string, title: string) => string;
