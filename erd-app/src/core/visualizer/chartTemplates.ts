// ── 인라인 비주얼라이저 차트 템플릿 ────────────────────────────────────────
// Claude는 타입 + 데이터(텍스트)만 출력하면, 프론트엔드가 여기서 완성된 HTML을 생성.
// 토큰 절약 + 일관된 품질 + 다크테마 통일.

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
  body: string; // 파싱 전 원본 텍스트
}

// ── 공통 스타일 ──
const COLORS = [
  '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#a3e635',
];

const BASE_STYLE = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;background:#0f1117;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;overflow:hidden}
.viz-title{font-size:14px;font-weight:700;color:#e2e8f0;padding:14px 16px 8px;margin:0}
.viz-subtitle{font-size:11px;color:#94a3b8;padding:0 16px 10px;margin:0}
.tooltip{position:absolute;background:#1e293b;border:1px solid rgba(129,140,248,0.3);border-radius:6px;padding:6px 10px;font-size:11px;color:#e2e8f0;pointer-events:none;white-space:nowrap;z-index:100;opacity:0;transition:opacity 0.15s}
`;

// ── 데이터 파싱 유틸 ──

/** "라벨|값" 또는 "라벨|값1|값2..." 형태의 줄을 파싱 */
function parseRows(body: string): { label: string; values: number[] }[] {
  return body.trim().split('\n')
    .map(line => line.trim())
    .filter(line => line && line.includes('|'))
    .map(line => {
      const parts = line.split('|').map(s => s.trim());
      const label = parts[0];
      const values = parts.slice(1).map(v => {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
      });
      return { label, values };
    });
}

/** "키: 값" 형태의 속성 파싱 */
function parseProps(body: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const line of body.trim().split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      props[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
  }
  return props;
}

/** 헤더행 + 데이터행 파싱: 첫 줄이 --로 시작하지 않으면 헤더로 사용 */
function parseWithHeader(body: string): { headers: string[]; rows: { label: string; values: number[] }[] } {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const firstParts = lines[0].split('|').map(s => s.trim());
  const hasHeader = firstParts.slice(1).some(p => isNaN(parseFloat(p)));
  if (hasHeader) {
    return {
      headers: firstParts.slice(1),
      rows: parseRows(lines.slice(1).join('\n')),
    };
  }
  return { headers: [], rows: parseRows(body) };
}

// ── 차트 생성 함수 ──

function barChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const seriesCount = rows[0].values.length;
  const maxVal = Math.max(...rows.flatMap(r => r.values), 1);
  const BAR_H = 180;

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:4px 16px 8px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  const barsHtml = rows.map((r) => {
    const barsInner = r.values.map((v, vi) => {
      const h = Math.max(Math.round((v / maxVal) * BAR_H), 3);
      const color = COLORS[vi % COLORS.length];
      return `<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:${BAR_H}px">
        <div style="width:100%;height:${h}px;background:${color};border-radius:4px 4px 0 0;position:relative;transition:height 0.4s"
          onmouseenter="this.querySelector('.tt').style.opacity=1" onmouseleave="this.querySelector('.tt').style.opacity=0">
          <div class="tt" style="position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid ${color}40;border-radius:5px;padding:4px 10px;font-size:11px;font-weight:600;color:${color};white-space:nowrap;opacity:0;transition:opacity 0.15s;pointer-events:none">${v.toLocaleString()}</div>
        </div>
      </div>`;
    }).join('');
    return `<div style="flex:1;min-width:36px;display:flex;flex-direction:column;align-items:center">
      <div style="display:flex;gap:3px;width:100%;padding:0 ${seriesCount > 1 ? 2 : 6}px">${barsInner}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:8px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${r.label}</div>
    </div>`;
  }).join('');

  // Y축 눈금
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = Math.round(maxVal * pct);
    const bottom = Math.round(pct * BAR_H);
    return `<div style="position:absolute;left:0;bottom:${bottom}px;width:100%;display:flex;align-items:center">
      <span style="font-size:9px;color:#475569;width:40px;text-align:right;flex-shrink:0;padding-right:6px">${val.toLocaleString()}</span>
      <div style="flex:1;height:1px;background:rgba(255,255,255,0.04)"></div>
    </div>`;
  }).join('');

  return `${legendHtml}<div style="position:relative;padding:8px 16px 4px 56px">
    <div style="position:absolute;left:8px;top:8px;bottom:24px;width:48px">${yTicks}</div>
    <div style="display:flex;gap:6px">${barsHtml}</div>
  </div>`;
}

function hbarChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const maxVal = Math.max(...rows.map(r => r.values[0] ?? 0), 1);

  return `<div style="padding:8px 16px;display:flex;flex-direction:column;gap:6px">${
    rows.map((r, i) => {
      const v = r.values[0] ?? 0;
      const pct = (v / maxVal) * 100;
      const color = COLORS[i % COLORS.length];
      return `<div style="display:flex;align-items:center;gap:10px">
        <div style="width:80px;font-size:12px;color:#cbd5e1;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</div>
        <div style="flex:1;height:22px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden;position:relative"
          onmouseenter="this.querySelector('.tt').style.opacity=1" onmouseleave="this.querySelector('.tt').style.opacity=0">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.5s"></div>
          <div class="tt" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#e2e8f0;opacity:0;transition:opacity 0.15s;pointer-events:none">${v.toLocaleString()}</div>
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

function pieChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const total = rows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;

  let cumulativePct = 0;
  const segments = rows.map((r, i) => {
    const pct = ((r.values[0] ?? 0) / total) * 100;
    const start = cumulativePct;
    cumulativePct += pct;
    return { label: r.label, value: r.values[0] ?? 0, pct, start, color: COLORS[i % COLORS.length] };
  });

  const gradientStops = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ');

  const legendHtml = segments.map(s =>
    `<div style="display:flex;align-items:center;gap:6px;font-size:12px">
      <div style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></div>
      <span style="color:#cbd5e1">${s.label}</span>
      <span style="color:#64748b;margin-left:auto">${s.value.toLocaleString()} (${s.pct.toFixed(1)}%)</span>
    </div>`
  ).join('');

  return `<div style="display:flex;align-items:center;gap:24px;padding:12px 16px">
    <div style="width:160px;height:160px;border-radius:50%;background:conic-gradient(${gradientStops});flex-shrink:0;position:relative">
      <div style="position:absolute;inset:30%;border-radius:50%;background:#0f1117"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#e2e8f0">${total.toLocaleString()}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:0">${legendHtml}</div>
  </div>`;
}

function lineChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const seriesCount = rows[0].values.length;
  const allVals = rows.flatMap(r => r.values);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const W = 400, H = 180, PX = 40, PY = 16;

  const paths = Array.from({ length: seriesCount }, (_, si) => {
    const points = rows.map((r, ri) => {
      const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
      const y = PY + (1 - (r.values[si] - minVal) / range) * (H - PY * 2);
      return `${ri === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    const color = COLORS[si % COLORS.length];
    return `<path d="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');

  const dots = rows.flatMap((r, ri) =>
    r.values.map((v, si) => {
      const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
      const y = PY + (1 - (v - minVal) / range) * (H - PY * 2);
      const color = COLORS[si % COLORS.length];
      return `<circle cx="${x}" cy="${y}" r="4" fill="#0f1117" stroke="${color}" stroke-width="2"
        onmouseenter="this.nextElementSibling.style.opacity=1" onmouseleave="this.nextElementSibling.style.opacity=0"/>
        <text x="${x}" y="${y - 10}" text-anchor="middle" fill="${color}" font-size="10" opacity="0" style="transition:opacity 0.15s;pointer-events:none">${v.toLocaleString()}</text>`;
    })
  ).join('');

  const xLabels = rows.map((r, ri) => {
    const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
    return `<text x="${x}" y="${H - 2}" text-anchor="middle" fill="#64748b" font-size="10">${r.label}</text>`;
  }).join('');

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:0 16px 4px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  return `${legendHtml}<svg viewBox="0 0 ${W} ${H}" style="width:100%;padding:0 8px">${paths}${dots}${xLabels}</svg>`;
}

function radarChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const axes = rows.map(r => r.label);
  const seriesCount = rows[0].values.length;
  const maxVal = Math.max(...rows.flatMap(r => r.values), 1);
  const N = axes.length;
  const CX = 150, CY = 140, R = 110;

  const angleStep = (2 * Math.PI) / N;
  const gridLines = [0.25, 0.5, 0.75, 1].map(pct =>
    `<polygon points="${axes.map((_, i) => {
      const a = angleStep * i - Math.PI / 2;
      return `${CX + R * pct * Math.cos(a)},${CY + R * pct * Math.sin(a)}`;
    }).join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`
  ).join('');

  const axisLines = axes.map((_, i) => {
    const a = angleStep * i - Math.PI / 2;
    return `<line x1="${CX}" y1="${CY}" x2="${CX + R * Math.cos(a)}" y2="${CY + R * Math.sin(a)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }).join('');

  const axisLabels = axes.map((label, i) => {
    const a = angleStep * i - Math.PI / 2;
    const lx = CX + (R + 16) * Math.cos(a);
    const ly = CY + (R + 16) * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.1 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    return `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="#94a3b8" font-size="10">${label}</text>`;
  }).join('');

  const polygons = Array.from({ length: seriesCount }, (_, si) => {
    const color = COLORS[si % COLORS.length];
    const pts = rows.map((r, i) => {
      const a = angleStep * i - Math.PI / 2;
      const pct = (r.values[si] ?? 0) / maxVal;
      return `${CX + R * pct * Math.cos(a)},${CY + R * pct * Math.sin(a)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${color}20" stroke="${color}" stroke-width="2"/>`;
  }).join('');

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:0 16px 4px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  return `${legendHtml}<svg viewBox="0 0 300 280" style="width:100%;max-width:360px;margin:0 auto;display:block">${gridLines}${axisLines}${polygons}${axisLabels}</svg>`;
}

function compareChart(body: string, _title: string): string {
  const sections = body.trim().split(/\n---\n|\n-{3,}\n/);
  if (sections.length < 2) {
    const rows = parseRows(body);
    if (rows.length >= 2) {
      return compareFromRows(rows);
    }
    return '<p style="color:#94a3b8;padding:16px">비교 데이터 없음 (--- 구분선으로 2개 이상 섹션 필요)</p>';
  }

  const cards = sections.map((sec, si) => {
    const props = parseProps(sec);
    const name = props['이름'] || props['name'] || props['제목'] || props['title'] || `항목 ${si + 1}`;
    const color = COLORS[si % COLORS.length];
    const entries = Object.entries(props).filter(([k]) => !['이름', 'name', '제목', 'title'].includes(k));
    return `<div style="flex:1;min-width:140px;border:1px solid ${color}30;border-radius:10px;overflow:hidden">
      <div style="background:${color}15;padding:10px 14px;border-bottom:1px solid ${color}20">
        <div style="font-size:13px;font-weight:700;color:${color}">${name}</div>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">${
        entries.map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:#94a3b8">${k}</span><span style="color:#e2e8f0;font-weight:500">${v}</span>
        </div>`).join('')
      }</div>
    </div>`;
  });

  return `<div style="display:flex;gap:10px;padding:10px 16px;overflow-x:auto">${cards.join('')}</div>`;
}

function compareFromRows(rows: { label: string; values: number[] }[]): string {
  const maxVal = Math.max(...rows.map(r => r.values[0] ?? 0), 1);
  return `<div style="padding:10px 16px;display:flex;flex-direction:column;gap:8px">${
    rows.map((r, i) => {
      const v = r.values[0] ?? 0;
      const pct = (v / maxVal) * 100;
      const color = COLORS[i % COLORS.length];
      return `<div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="color:#cbd5e1;font-weight:500">${r.label}</span>
          <span style="color:${color};font-weight:600">${v.toLocaleString()}</span>
        </div>
        <div style="height:18px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color},${color}88);border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

function flowChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const nodes: { id: string; label: string; type?: string }[] = [];
  const edges: { from: string; to: string; label?: string }[] = [];

  for (const line of lines) {
    const arrowMatch = line.match(/^(.+?)\s*->\s*(.+?)(?:\s*\|\s*(.+))?$/);
    if (arrowMatch) {
      const fromLabel = arrowMatch[1].trim();
      const toLabel = arrowMatch[2].trim();
      const edgeLabel = arrowMatch[3]?.trim();
      const fromId = fromLabel.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const toId = toLabel.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      if (!nodes.find(n => n.id === fromId)) nodes.push({ id: fromId, label: fromLabel });
      if (!nodes.find(n => n.id === toId)) nodes.push({ id: toId, label: toLabel });
      edges.push({ from: fromId, to: toId, label: edgeLabel });
    }
  }

  if (nodes.length === 0) return '<p style="color:#94a3b8;padding:16px">플로우 데이터 없음 (A -> B 형식 필요)</p>';

  const NODEW = 120, NODEH = 36, GAPY = 50, PADX = 16;
  const svgH = nodes.length * (NODEH + GAPY) + 20;

  const nodeMap = new Map(nodes.map((n, i) => [n.id, { x: PADX, y: 16 + i * (NODEH + GAPY), ...n }]));

  const nodesHtml = [...nodeMap.values()].map((n, i) => {
    const color = COLORS[i % COLORS.length];
    return `<rect x="${n.x}" y="${n.y}" width="${NODEW}" height="${NODEH}" rx="8" fill="${color}18" stroke="${color}" stroke-width="1.5"/>
      <text x="${n.x + NODEW / 2}" y="${n.y + NODEH / 2 + 4}" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="500">${n.label}</text>`;
  }).join('');

  const edgesHtml = edges.map(e => {
    const from = nodeMap.get(e.from);
    const to = nodeMap.get(e.to);
    if (!from || !to) return '';
    const x1 = from.x + NODEW / 2, y1 = from.y + NODEH;
    const x2 = to.x + NODEW / 2, y2 = to.y;
    const my = (y1 + y2) / 2;
    return `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" fill="none" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowhead)"/>
      ${e.label ? `<text x="${(x1 + x2) / 2 + 8}" y="${my + 4}" fill="#94a3b8" font-size="10">${e.label}</text>` : ''}`;
  }).join('');

  return `<svg viewBox="0 0 ${NODEW + PADX * 2} ${svgH}" style="width:100%;max-width:280px;margin:0 auto;display:block">
    <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#475569"/></marker></defs>
    ${edgesHtml}${nodesHtml}
  </svg>`;
}

function gaugeChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  return `<div style="display:flex;flex-wrap:wrap;gap:12px;padding:10px 16px;justify-content:center">${
    rows.map((r, i) => {
      const value = r.values[0] ?? 0;
      const max = r.values[1] ?? 100;
      const pct = Math.min((value / max) * 100, 100);
      const color = COLORS[i % COLORS.length];
      const circumference = 2 * Math.PI * 40;
      const dashOffset = circumference - (pct / 100) * circumference * 0.75; // 270도 게이지
      return `<div style="text-align:center;min-width:100px">
        <svg width="100" height="90" viewBox="0 0 100 90">
          <path d="M 10 80 A 40 40 0 1 1 90 80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" stroke-linecap="round"/>
          <path d="M 10 80 A 40 40 0 1 1 90 80" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${circumference * 0.75}" stroke-dashoffset="${dashOffset}" style="transition:stroke-dashoffset 0.8s"/>
          <text x="50" y="60" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${value.toLocaleString()}</text>
          <text x="50" y="78" text-anchor="middle" fill="#64748b" font-size="9">/ ${max.toLocaleString()}</text>
        </svg>
        <div style="font-size:11px;color:#94a3b8;margin-top:-4px">${r.label}</div>
      </div>`;
    }).join('')
  }</div>`;
}

function treemapChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const total = rows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));

  return `<div style="display:flex;flex-wrap:wrap;gap:3px;padding:10px 16px;height:200px">${
    sorted.map((r, i) => {
      const v = r.values[0] ?? 0;
      const pct = (v / total) * 100;
      const color = COLORS[i % COLORS.length];
      return `<div style="flex:${Math.max(pct, 5)};min-width:50px;background:${color}20;border:1px solid ${color}40;border-radius:6px;padding:8px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;position:relative;cursor:default"
        onmouseenter="this.style.background='${color}35'" onmouseleave="this.style.background='${color}20'">
        <div style="font-size:11px;font-weight:600;color:${color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</div>
        <div style="font-size:16px;font-weight:700;color:#e2e8f0">${v.toLocaleString()}</div>
        <div style="font-size:10px;color:#64748b">${pct.toFixed(1)}%</div>
      </div>`;
    }).join('')
  }</div>`;
}

function scatterChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const xVals = rows.map(r => r.values[0] ?? 0);
  const yVals = rows.map(r => r.values[1] ?? 0);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  const W = 380, H = 200, PX = 30, PY = 20;

  const dots = rows.map((r, i) => {
    const x = PX + ((r.values[0] ?? 0) - xMin) / xRange * (W - PX * 2);
    const y = PY + (1 - ((r.values[1] ?? 0) - yMin) / yRange) * (H - PY * 2);
    const color = COLORS[i % COLORS.length];
    return `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.8"
      onmouseenter="this.nextElementSibling.style.opacity=1;this.setAttribute('r','7')" onmouseleave="this.nextElementSibling.style.opacity=0;this.setAttribute('r','5')"/>
      <text x="${x}" y="${y - 10}" text-anchor="middle" fill="#e2e8f0" font-size="10" opacity="0" style="transition:opacity 0.15s;pointer-events:none">${r.label} (${r.values[0]}, ${r.values[1]})</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;padding:0 8px">
    <line x1="${PX}" y1="${H - PY}" x2="${W - PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <line x1="${PX}" y1="${PY}" x2="${PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    ${dots}
  </svg>`;
}

// ── 스택 바 차트 ──

function stackChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const maxTotal = Math.max(...rows.map(r => r.values.reduce((a, b) => a + b, 0)), 1);
  const BAR_H = 24;

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:4px 16px 10px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  const barsHtml = rows.map((r) => {
    const total = r.values.reduce((a, b) => a + b, 0);
    const segs = r.values.map((v, vi) => {
      const pct = (v / maxTotal) * 100;
      const color = COLORS[vi % COLORS.length];
      return `<div style="width:${pct}%;height:100%;background:${color};position:relative;flex-shrink:0"
        onmouseenter="this.querySelector('.tt').style.opacity=1" onmouseleave="this.querySelector('.tt').style.opacity=0">
        <div class="tt" style="position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid ${color}40;border-radius:4px;padding:3px 8px;font-size:10px;color:${color};white-space:nowrap;opacity:0;transition:opacity 0.15s;pointer-events:none">${headers[vi] || ''}: ${v.toLocaleString()}</div>
      </div>`;
    }).join('');
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:72px;font-size:11px;color:#cbd5e1;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</div>
      <div style="flex:1;height:${BAR_H}px;background:rgba(255,255,255,0.03);border-radius:4px;overflow:hidden;display:flex">${segs}</div>
      <div style="width:48px;font-size:10px;color:#64748b;text-align:right">${total.toLocaleString()}</div>
    </div>`;
  }).join('');

  return `${legendHtml}<div style="padding:0 16px 8px">${barsHtml}</div>`;
}

// ── 영역 차트 ──

function areaChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const seriesCount = rows[0].values.length;
  const allVals = rows.flatMap(r => r.values);
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const W = 400, H = 180, PX = 40, PY = 16;

  const areas = Array.from({ length: seriesCount }, (_, si) => {
    const pts = rows.map((r, ri) => {
      const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
      const y = PY + (1 - (r.values[si] - minVal) / range) * (H - PY * 2);
      return `${x},${y}`;
    });
    const baseY = PY + (1 - (0 - minVal) / range) * (H - PY * 2);
    const color = COLORS[si % COLORS.length];
    const pathD = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${PX + ((rows.length - 1) / Math.max(rows.length - 1, 1)) * (W - PX * 2)},${baseY} L${PX},${baseY} Z`;
    const lineD = `M${pts.join(' L')}`;
    return `<path d="${pathD}" fill="${color}" opacity="0.15"/><path d="${lineD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
  }).join('');

  const xLabels = rows.map((r, ri) => {
    const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
    return `<text x="${x}" y="${H - 2}" text-anchor="middle" fill="#64748b" font-size="10">${r.label}</text>`;
  }).join('');

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:0 16px 4px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  return `${legendHtml}<svg viewBox="0 0 ${W} ${H}" style="width:100%;padding:0 8px">${areas}${xLabels}</svg>`;
}

// ── 버블 차트 ──

function bubbleChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const xVals = rows.map(r => r.values[0] ?? 0);
  const yVals = rows.map(r => r.values[1] ?? 0);
  const sizes = rows.map(r => r.values[2] ?? 10);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const sMax = Math.max(...sizes, 1);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  const W = 400, H = 220, PX = 36, PY = 20;

  const bubbles = rows.map((r, i) => {
    const x = PX + ((r.values[0] ?? 0) - xMin) / xRange * (W - PX * 2);
    const y = PY + (1 - ((r.values[1] ?? 0) - yMin) / yRange) * (H - PY * 2);
    const rad = 6 + ((r.values[2] ?? 10) / sMax) * 24;
    const color = COLORS[i % COLORS.length];
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${color}" opacity="0.5" stroke="${color}" stroke-width="1.5"
      onmouseenter="this.nextElementSibling.style.opacity=1;this.style.opacity=0.8" onmouseleave="this.nextElementSibling.style.opacity=0;this.style.opacity=0.5"/>
      <text x="${x}" y="${y - rad - 6}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="500" opacity="0" style="transition:opacity 0.15s;pointer-events:none">${r.label} (${r.values.join(', ')})</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;padding:0 8px">
    <line x1="${PX}" y1="${H - PY}" x2="${W - PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <line x1="${PX}" y1="${PY}" x2="${PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    ${bubbles}</svg>`;
}

// ── 퍼널 차트 ──

function funnelChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const maxVal = rows[0]?.values[0] ?? 1;

  return `<div style="padding:10px 16px;display:flex;flex-direction:column;align-items:center;gap:2px">${
    rows.map((r, i) => {
      const v = r.values[0] ?? 0;
      const pct = Math.max((v / maxVal) * 100, 20);
      const convRate = i > 0 ? ((v / (rows[i - 1].values[0] ?? 1)) * 100).toFixed(1) : '100';
      const color = COLORS[i % COLORS.length];
      return `<div style="width:${pct}%;background:${color}20;border:1px solid ${color}40;border-radius:6px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s"
        onmouseenter="this.style.background='${color}35'" onmouseleave="this.style.background='${color}20'">
        <span style="font-size:12px;font-weight:600;color:${color}">${r.label}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:14px;font-weight:700;color:#e2e8f0">${v.toLocaleString()}</span>
          ${i > 0 ? `<span style="font-size:10px;color:#64748b">${convRate}%</span>` : ''}
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 워터폴 차트 ──

function waterfallChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  let cumulative = 0;
  const entries = rows.map(r => {
    const v = r.values[0] ?? 0;
    const start = cumulative;
    cumulative += v;
    return { label: r.label, value: v, start, end: cumulative };
  });
  const allVals = entries.flatMap(e => [e.start, e.end]);
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const BAR_H = 180;

  const barsHtml = entries.map((e, i) => {
    const isPos = e.value >= 0;
    const top = ((maxVal - Math.max(e.start, e.end)) / range) * BAR_H;
    const height = Math.max(Math.abs(e.value) / range * BAR_H, 3);
    const color = isPos ? '#34d399' : '#f87171';
    return `<div style="flex:1;min-width:32px;display:flex;flex-direction:column;align-items:center">
      <div style="width:100%;height:${BAR_H}px;position:relative;padding:0 4px">
        <div style="position:absolute;top:${top}px;left:4px;right:4px;height:${height}px;background:${color}30;border:1px solid ${color};border-radius:3px"
          onmouseenter="this.querySelector('.tt').style.opacity=1" onmouseleave="this.querySelector('.tt').style.opacity=0">
          <div class="tt" style="position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid ${color}40;border-radius:4px;padding:3px 8px;font-size:10px;color:${color};white-space:nowrap;opacity:0;transition:opacity 0.15s;pointer-events:none">${isPos ? '+' : ''}${e.value.toLocaleString()} → ${e.end.toLocaleString()}</div>
        </div>
      </div>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.label}</div>
    </div>`;
  }).join('');

  return `<div style="padding:8px 16px 4px;display:flex;gap:3px">${barsHtml}</div>`;
}

// ── 타임라인 ──

function timelineChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const events = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { date: parts[0] ?? '', title: parts[1] ?? '', desc: parts[2] ?? '' };
  }).filter(e => e.date || e.title);

  if (events.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  return `<div style="padding:10px 16px">${events.map((e, i) => {
    const color = COLORS[i % COLORS.length];
    const isLast = i === events.length - 1;
    return `<div style="display:flex;gap:12px">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:20px">
        <div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid ${color}60;flex-shrink:0"></div>
        ${!isLast ? `<div style="width:2px;flex:1;min-height:24px;background:linear-gradient(${color}40,${COLORS[(i + 1) % COLORS.length]}40)"></div>` : ''}
      </div>
      <div style="padding-bottom:${isLast ? '4px' : '18px'};flex:1;min-width:0">
        <div style="font-size:10px;color:${color};font-weight:600;letter-spacing:0.5px">${e.date}</div>
        <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-top:2px">${e.title}</div>
        ${e.desc ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${e.desc}</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ── 칸반 보드 ──

function kanbanChart(body: string, _title: string): string {
  const sections = body.trim().split(/\n---\n|\n-{3,}\n/);
  const columns = sections.map(sec => {
    const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const header = lines[0] ?? '미정';
    const items = lines.slice(1);
    return { header, items };
  });

  if (columns.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  return `<div style="display:flex;gap:8px;padding:8px 12px;overflow-x:auto">${
    columns.map((col, ci) => {
      const color = COLORS[ci % COLORS.length];
      return `<div style="flex:1;min-width:120px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06)">
        <div style="padding:8px 10px;border-bottom:2px solid ${color}40;display:flex;align-items:center;gap:6px">
          <div style="width:8px;height:8px;border-radius:2px;background:${color}"></div>
          <span style="font-size:11px;font-weight:700;color:#e2e8f0">${col.header}</span>
          <span style="font-size:10px;color:#64748b;margin-left:auto">${col.items.length}</span>
        </div>
        <div style="padding:6px;display:flex;flex-direction:column;gap:4px">${
          col.items.map(item => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:7px 9px;font-size:11px;color:#cbd5e1;cursor:default;transition:background 0.15s"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background='rgba(255,255,255,0.04)'">${item}</div>`).join('')
        }</div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 히트맵 매트릭스 ──

function matrixChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (헤더 + 데이터 행 필요)</p>';

  const colHeaders = lines[0].split('|').map(s => s.trim()).slice(1);
  const rows = lines.slice(1).map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { label: parts[0], values: parts.slice(1).map(v => parseFloat(v) || 0) };
  });
  const allVals = rows.flatMap(r => r.values);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  function heatColor(v: number): string {
    const t = (v - minVal) / range;
    if (t < 0.25) return `rgba(99,102,241,${0.1 + t * 0.4})`;
    if (t < 0.5) return `rgba(99,102,241,${0.2 + t * 0.6})`;
    if (t < 0.75) return `rgba(129,140,248,${0.3 + t * 0.5})`;
    return `rgba(167,139,250,${0.4 + t * 0.5})`;
  }

  return `<div style="padding:8px 12px;overflow-x:auto"><table style="border-collapse:collapse;width:100%">
    <thead><tr>
      <th style="padding:6px 10px;font-size:10px;color:#64748b;text-align:left"></th>
      ${colHeaders.map(h => `<th style="padding:6px 8px;font-size:10px;color:#94a3b8;text-align:center;font-weight:600">${h}</th>`).join('')}
    </tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td style="padding:6px 10px;font-size:11px;color:#cbd5e1;font-weight:500;white-space:nowrap">${r.label}</td>
      ${r.values.map(v => `<td style="padding:6px 8px;text-align:center;font-size:12px;font-weight:600;color:#e2e8f0;background:${heatColor(v)};border-radius:4px;border:2px solid #0f1117">${v.toLocaleString()}</td>`).join('')}
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ── 사분면 차트 ──

function quadrantChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const axisLine = lines.find(l => l.startsWith('축:') || l.startsWith('axis:'));
  const axisLabels = axisLine ? axisLine.replace(/^(축|axis):\s*/, '').split('|').map(s => s.trim()) : ['X', 'Y'];
  const dataLines = lines.filter(l => !l.startsWith('축:') && !l.startsWith('axis:'));
  const items = dataLines.map(l => {
    const parts = l.split('|').map(s => s.trim());
    return { label: parts[0] ?? '', x: parseFloat(parts[1]) || 0, y: parseFloat(parts[2]) || 0 };
  }).filter(it => it.label);

  const W = 320, H = 280, CX = W / 2, CY = H / 2 - 10;

  const dots = items.map((it, i) => {
    const x = CX + (it.x / 10) * (CX - 30);
    const y = CY - (it.y / 10) * (CY - 30);
    const color = COLORS[i % COLORS.length];
    return `<circle cx="${x}" cy="${y}" r="6" fill="${color}" opacity="0.8"/>
      <text x="${x}" y="${y - 10}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="500">${it.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:400px;margin:0 auto;display:block">
    <rect x="30" y="10" width="${CX - 30}" height="${CY - 10}" fill="rgba(34,197,94,0.06)" rx="4"/>
    <rect x="${CX}" y="10" width="${CX - 30}" height="${CY - 10}" fill="rgba(99,102,241,0.06)" rx="4"/>
    <rect x="30" y="${CY}" width="${CX - 30}" height="${CY - 10}" fill="rgba(245,158,11,0.06)" rx="4"/>
    <rect x="${CX}" y="${CY}" width="${CX - 30}" height="${CY - 10}" fill="rgba(248,113,113,0.06)" rx="4"/>
    <line x1="30" y1="${CY}" x2="${W - 30}" y2="${CY}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <line x1="${CX}" y1="10" x2="${CX}" y2="${H - 30}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="${CX}" y="${H - 8}" text-anchor="middle" fill="#64748b" font-size="10">${axisLabels[0] ?? 'X'} →</text>
    <text x="10" y="${CY}" fill="#64748b" font-size="10" transform="rotate(-90,10,${CY})">${axisLabels[1] ?? 'Y'} →</text>
    ${dots}
  </svg>`;
}

// ── 통계 카드 (KPI) ──

function statChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const cards = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { label: parts[0] ?? '', value: parts[1] ?? '0', change: parts[2] ?? '', desc: parts[3] ?? '' };
  });

  if (cards.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;padding:10px 14px">${
    cards.map((c, i) => {
      const color = COLORS[i % COLORS.length];
      const isPositive = c.change.startsWith('+') || c.change.startsWith('↑');
      const isNegative = c.change.startsWith('-') || c.change.startsWith('↓');
      const changeColor = isPositive ? '#34d399' : isNegative ? '#f87171' : '#94a3b8';
      return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px">
        <div style="font-size:10px;color:#94a3b8;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">${c.label}</div>
        <div style="font-size:22px;font-weight:800;color:${color};margin-top:4px;line-height:1.1">${c.value}</div>
        ${c.change ? `<div style="font-size:11px;color:${changeColor};margin-top:4px;font-weight:600">${c.change}</div>` : ''}
        ${c.desc ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${c.desc}</div>` : ''}
      </div>`;
    }).join('')
  }</div>`;
}

// ── 진행률 카드 ──

function progressChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  return `<div style="padding:10px 16px;display:flex;flex-direction:column;gap:10px">${
    rows.map((r, i) => {
      const current = r.values[0] ?? 0;
      const target = r.values[1] ?? 100;
      const pct = Math.min((current / target) * 100, 100);
      const color = pct >= 100 ? '#34d399' : pct >= 70 ? '#818cf8' : pct >= 40 ? '#fbbf24' : '#f87171';
      return `<div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:#e2e8f0">${r.label}</span>
          <span style="font-size:11px;color:${color};font-weight:700">${pct.toFixed(0)}%</span>
        </div>
        <div style="height:10px;background:rgba(255,255,255,0.04);border-radius:5px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color},${color}aa);border-radius:5px;transition:width 0.6s"></div>
        </div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${current.toLocaleString()} / ${target.toLocaleString()}</div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 스윔레인 다이어그램 ──

function swimlaneChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const lanes = lines.map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) return null;
    const name = line.slice(0, colonIdx).trim();
    const steps = line.slice(colonIdx + 1).split('->').map(s => s.trim()).filter(Boolean);
    return { name, steps };
  }).filter(Boolean) as { name: string; steps: string[] }[];

  if (lanes.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (레인: 단계1 -> 단계2 형식)</p>';

  return `<div style="padding:8px 12px;display:flex;flex-direction:column;gap:2px">${
    lanes.map((lane, li) => {
      const color = COLORS[li % COLORS.length];
      return `<div style="display:flex;align-items:center;border:1px solid rgba(255,255,255,0.05);border-radius:8px;overflow:hidden">
        <div style="width:80px;padding:10px 8px;background:${color}10;border-right:2px solid ${color}30;flex-shrink:0">
          <div style="font-size:11px;font-weight:700;color:${color};text-align:center">${lane.name}</div>
        </div>
        <div style="flex:1;display:flex;align-items:center;gap:0;padding:8px 10px;overflow-x:auto">${
          lane.steps.map((step, si) => {
            const isLast = si === lane.steps.length - 1;
            return `<div style="display:flex;align-items:center;flex-shrink:0">
              <div style="background:${color}15;border:1px solid ${color}30;border-radius:6px;padding:5px 10px;font-size:11px;color:#e2e8f0;white-space:nowrap">${step}</div>
              ${!isLast ? `<svg width="20" height="12" style="flex-shrink:0"><path d="M2,6 L14,6 M10,2 L14,6 L10,10" fill="none" stroke="${color}60" stroke-width="1.5"/></svg>` : ''}
            </div>`;
          }).join('')
        }</div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 계층 구조 (트리) ──

function hierarchyChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  interface TreeNode { label: string; depth: number; children: TreeNode[] }
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const line of lines) {
    const stripped = line.replace(/^[\s│├└─┬]*/, '');
    const depth = Math.floor((line.length - line.trimStart().length) / 2);
    const node: TreeNode = { label: stripped.trim(), depth, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node);
    else root.push(node);
    stack.push({ node, depth });
  }

  function renderNode(node: TreeNode, depth: number): string {
    const color = COLORS[depth % COLORS.length];
    const hasChildren = node.children.length > 0;
    return `<div style="margin-left:${depth > 0 ? 20 : 0}px">
      <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
        ${depth > 0 ? `<div style="width:12px;height:1px;background:${color}40"></div>` : ''}
        <div style="display:flex;align-items:center;gap:6px;background:${color}12;border:1px solid ${color}30;border-radius:6px;padding:5px 10px">
          ${hasChildren ? `<div style="width:6px;height:6px;border-radius:1px;background:${color}"></div>` : `<div style="width:5px;height:5px;border-radius:50%;background:${color}80"></div>`}
          <span style="font-size:11px;color:#e2e8f0;font-weight:${hasChildren ? 600 : 400}">${node.label}</span>
        </div>
      </div>
      ${node.children.map(c => renderNode(c, depth + 1)).join('')}
    </div>`;
  }

  return `<div style="padding:10px 14px">${root.map(n => renderNode(n, 0)).join('')}</div>`;
}

// ── 마인드맵 ──

function mindmapChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  const center = lines[0].trim();
  const branches: { label: string; leaves: string[] }[] = [];
  let currentBranch: { label: string; leaves: string[] } | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.length - line.trimStart().length;
    const text = line.trim();
    if (indent < 4) {
      currentBranch = { label: text, leaves: [] };
      branches.push(currentBranch);
    } else if (currentBranch) {
      currentBranch.leaves.push(text);
    }
  }

  const CX = 200, CY = 120, R = 90;

  const branchHtml = branches.map((b, i) => {
    const angle = (i / branches.length) * 2 * Math.PI - Math.PI / 2;
    const bx = CX + R * Math.cos(angle);
    const by = CY + R * Math.sin(angle);
    const color = COLORS[i % COLORS.length];

    const leavesHtml = b.leaves.map((leaf, li) => {
      const leafAngle = angle + ((li - (b.leaves.length - 1) / 2) * 0.35);
      const lr = R + 52;
      const lx = CX + lr * Math.cos(leafAngle);
      const ly = CY + lr * Math.sin(leafAngle);
      return `<line x1="${bx}" y1="${by}" x2="${lx}" y2="${ly}" stroke="${color}30" stroke-width="1"/>
        <text x="${lx}" y="${ly + 4}" text-anchor="${Math.cos(leafAngle) > 0.1 ? 'start' : Math.cos(leafAngle) < -0.1 ? 'end' : 'middle'}" fill="#94a3b8" font-size="9">${leaf}</text>`;
    }).join('');

    return `<line x1="${CX}" y1="${CY}" x2="${bx}" y2="${by}" stroke="${color}50" stroke-width="2"/>
      ${leavesHtml}
      <circle cx="${bx}" cy="${by}" r="24" fill="${color}20" stroke="${color}" stroke-width="1.5"/>
      <text x="${bx}" y="${by + 4}" text-anchor="middle" fill="${color}" font-size="10" font-weight="600">${b.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 400 240" style="width:100%;margin:0 auto;display:block">
    <circle cx="${CX}" cy="${CY}" r="32" fill="#818cf820" stroke="#818cf8" stroke-width="2"/>
    <text x="${CX}" y="${CY + 4}" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="700">${center}</text>
    ${branchHtml}
  </svg>`;
}

// ── 관계도 ──

function relationChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const nodes = new Map<string, { id: string; label: string }>();
  const edges: { from: string; to: string; label: string; directed: boolean }[] = [];

  for (const line of lines) {
    const dirMatch = line.match(/^(.+?)\s*->\s*(.+?)(?:\s*\|\s*(.+))?$/);
    const biMatch = line.match(/^(.+?)\s*--\s*(.+?)(?:\s*\|\s*(.+))?$/);
    const m = dirMatch || biMatch;
    if (m) {
      const fromL = m[1].trim(), toL = m[2].trim(), edgeL = m[3]?.trim() ?? '';
      const fromId = fromL.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const toId = toL.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      if (!nodes.has(fromId)) nodes.set(fromId, { id: fromId, label: fromL });
      if (!nodes.has(toId)) nodes.set(toId, { id: toId, label: toL });
      edges.push({ from: fromId, to: toId, label: edgeL, directed: !!dirMatch });
    }
  }

  const nodeArr = [...nodes.values()];
  if (nodeArr.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  const W = 380, H = 260, CX = W / 2, CY = H / 2;
  const R = Math.min(CX, CY) - 40;
  const positions = new Map<string, { x: number; y: number }>();
  nodeArr.forEach((n, i) => {
    const angle = (i / nodeArr.length) * 2 * Math.PI - Math.PI / 2;
    positions.set(n.id, { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) });
  });

  const edgesHtml = edges.map(e => {
    const from = positions.get(e.from)!;
    const to = positions.get(e.to)!;
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#475569" stroke-width="1.5" ${e.directed ? 'marker-end="url(#rel-arrow)"' : ''}/>
      ${e.label ? `<text x="${mx}" y="${my - 6}" text-anchor="middle" fill="#64748b" font-size="9">${e.label}</text>` : ''}`;
  }).join('');

  const nodesHtml = nodeArr.map((n, i) => {
    const pos = positions.get(n.id)!;
    const color = COLORS[i % COLORS.length];
    return `<circle cx="${pos.x}" cy="${pos.y}" r="22" fill="${color}18" stroke="${color}" stroke-width="2"/>
      <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="500">${n.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;margin:0 auto;display:block">
    <defs><marker id="rel-arrow" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#475569"/></marker></defs>
    ${edgesHtml}${nodesHtml}
  </svg>`;
}

// ── 티어 리스트 ──

function tierChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    'S': { bg: '#f59e0b18', border: '#f59e0b', text: '#fbbf24' },
    'S+': { bg: '#f59e0b18', border: '#f59e0b', text: '#fbbf24' },
    'A': { bg: '#818cf818', border: '#818cf8', text: '#a5b4fc' },
    'A+': { bg: '#818cf818', border: '#818cf8', text: '#a5b4fc' },
    'B': { bg: '#34d39918', border: '#34d399', text: '#6ee7b7' },
    'B+': { bg: '#34d39918', border: '#34d399', text: '#6ee7b7' },
    'C': { bg: '#60a5fa18', border: '#60a5fa', text: '#93c5fd' },
    'D': { bg: '#94a3b818', border: '#94a3b8', text: '#cbd5e1' },
    'F': { bg: '#f8717118', border: '#f87171', text: '#fca5a5' },
  };
  const defaultTc = { bg: 'rgba(255,255,255,0.04)', border: '#475569', text: '#94a3b8' };

  const tiers: { grade: string; items: string[] }[] = [];
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const grade = line.slice(0, colonIdx).trim().toUpperCase();
    const items = line.slice(colonIdx + 1).split(/[,，]/).map(s => s.trim()).filter(Boolean);
    tiers.push({ grade, items });
  }

  if (tiers.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (형식: S: 항목1, 항목2)</p>';

  return `<div style="padding:8px 12px;display:flex;flex-direction:column;gap:4px">${
    tiers.map(t => {
      const tc = tierColors[t.grade] ?? defaultTc;
      return `<div style="display:flex;border:1px solid ${tc.border}30;border-radius:8px;overflow:hidden">
        <div style="width:48px;display:flex;align-items:center;justify-content:center;background:${tc.bg};border-right:2px solid ${tc.border}40;flex-shrink:0">
          <span style="font-size:18px;font-weight:900;color:${tc.text}">${t.grade}</span>
        </div>
        <div style="flex:1;display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px;align-items:center">${
          t.items.map(item => `<div style="background:${tc.bg};border:1px solid ${tc.border}25;border-radius:5px;padding:4px 10px;font-size:11px;color:#e2e8f0;white-space:nowrap">${item}</div>`).join('')
        }</div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 아이템/캐릭터 카드 ──

function itemcardChart(body: string, _title: string): string {
  const IMG_KEYS = ['이미지', 'image', 'img', '썸네일', 'thumbnail', 'icon', '아이콘'];
  const META_KEYS = ['이름', '등급', '타입', '설명', '클래스', '속성', '종류', 'name', 'type', 'class', 'grade', 'rarity', 'desc', 'description', 'element', '희귀도', ...IMG_KEYS];
  const sections = body.trim().split(/\n---\n|\n-{3,}\n/);
  const cards = sections.map(sec => {
    const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const props: Record<string, string> = {};
    const statBars: { key: string; value: number; max: number }[] = [];
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      props[key] = val;
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && !META_KEYS.includes(key.toLowerCase())) {
        statBars.push({ key, value: numVal, max: 0 });
      }
    }
    if (statBars.length > 0) {
      const maxStat = Math.max(...statBars.map(s => s.value), 1);
      statBars.forEach(s => s.max = maxStat);
    }
    return { props, statBars };
  });

  if (cards.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';

  const rarityColors: Record<string, string> = {
    'SSR': '#f59e0b', 'UR': '#f59e0b', '전설': '#f59e0b', 'legendary': '#f59e0b',
    'SR': '#a78bfa', '영웅': '#a78bfa', 'epic': '#a78bfa',
    'R': '#60a5fa', '희귀': '#60a5fa', 'rare': '#60a5fa',
    'N': '#94a3b8', '일반': '#94a3b8', 'common': '#94a3b8',
  };

  const hasAnyImage = cards.some(c => IMG_KEYS.some(k => c.props[k]));

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${hasAnyImage ? '200' : '180'}px,1fr));gap:8px;padding:8px 12px">${
    cards.map((card, ci) => {
      const name = card.props['이름'] ?? card.props['name'] ?? card.props['Name'] ?? `#${ci + 1}`;
      const grade = card.props['등급'] ?? card.props['grade'] ?? card.props['rarity'] ?? card.props['희귀도'] ?? '';
      const type = card.props['타입'] ?? card.props['type'] ?? card.props['클래스'] ?? card.props['class'] ?? '';
      const desc = card.props['설명'] ?? card.props['desc'] ?? card.props['description'] ?? '';
      const element = card.props['속성'] ?? card.props['element'] ?? '';
      const imgUrl = IMG_KEYS.map(k => card.props[k]).find(v => v) ?? '';
      const color = rarityColors[grade.toUpperCase()] ?? rarityColors[grade] ?? COLORS[ci % COLORS.length];

      const imgHtml = imgUrl ? `<div style="width:100%;aspect-ratio:1/1;max-height:160px;overflow:hidden;background:${color}08;display:flex;align-items:center;justify-content:center">
        <img src="${imgUrl}" alt="${name}" style="width:100%;height:100%;object-fit:contain" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px;text-align:center;color:#475569;font-size:10px\\'>이미지 로드 실패</div>'"/>
      </div>` : '';

      return `<div style="background:linear-gradient(135deg,${color}08,${color}15);border:1px solid ${color}30;border-radius:10px;overflow:hidden">
        ${imgHtml}
        <div style="padding:10px 12px;border-bottom:1px solid ${color}20">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:14px;font-weight:800;color:#e2e8f0">${name}</span>
            ${grade ? `<span style="font-size:9px;font-weight:700;color:${color};background:${color}20;border:1px solid ${color}40;border-radius:3px;padding:1px 6px">${grade}</span>` : ''}
          </div>
          <div style="display:flex;gap:6px;margin-top:3px">
            ${type ? `<span style="font-size:10px;color:#94a3b8">${type}</span>` : ''}
            ${element ? `<span style="font-size:10px;color:#94a3b8">· ${element}</span>` : ''}
          </div>
          ${desc ? `<div style="font-size:10px;color:#64748b;margin-top:4px">${desc}</div>` : ''}
        </div>
        ${card.statBars.length > 0 ? `<div style="padding:8px 12px;display:flex;flex-direction:column;gap:5px">${
          card.statBars.map(s => {
            const pct = Math.min((s.value / s.max) * 100, 100);
            return `<div>
              <div style="display:flex;justify-content:space-between;margin-bottom:2px">
                <span style="font-size:9px;color:#94a3b8">${s.key}</span>
                <span style="font-size:10px;color:${color};font-weight:700">${s.value.toLocaleString()}</span>
              </div>
              <div style="height:4px;background:rgba(255,255,255,0.04);border-radius:2px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:2px"></div>
              </div>
            </div>`;
          }).join('')
        }</div>` : ''}
      </div>`;
    }).join('')
  }</div>`;
}

// ── 조건부 서식 테이블 ──

function tableChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (헤더 + 행)</p>';

  const headers = lines[0].split('|').map(s => s.trim());
  const rows = lines.slice(1).map(line => line.split('|').map(s => s.trim()));

  const colStats: { min: number; max: number; isNum: boolean }[] = headers.map((_, ci) => {
    const vals = rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v));
    return { min: Math.min(...vals), max: Math.max(...vals), isNum: vals.length > rows.length * 0.5 };
  });

  function cellColor(val: string, ci: number): string {
    const stat = colStats[ci];
    if (!stat || !stat.isNum) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    const range = stat.max - stat.min || 1;
    const t = (n - stat.min) / range;
    if (t > 0.75) return 'background:rgba(52,211,153,0.12);color:#34d399';
    if (t > 0.5) return 'background:rgba(96,165,250,0.08);color:#93c5fd';
    if (t < 0.25) return 'background:rgba(248,113,113,0.12);color:#f87171';
    return '';
  }

  return `<div style="padding:6px 10px;overflow-x:auto"><table style="border-collapse:collapse;width:100%">
    <thead><tr>${headers.map(h => `<th style="padding:7px 10px;font-size:10px;color:#94a3b8;text-align:left;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08);white-space:nowrap">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row, ri) => `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)${ri % 2 ? ';background:rgba(255,255,255,0.015)' : ''}">${
      row.map((cell, ci) => {
        const style = cellColor(cell, ci);
        return `<td style="padding:6px 10px;font-size:11px;color:#cbd5e1;white-space:nowrap;${style ? style + ';border-radius:3px' : ''}">${cell}</td>`;
      }).join('')
    }</tr>`).join('')}</tbody>
  </table></div>`;
}

// ── 변경 전후 비교 (Diff) ──

function diffChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (헤더: _|Before|After + 행)</p>';

  const headers = lines[0].split('|').map(s => s.trim());
  const beforeLabel = headers[1] ?? 'Before';
  const afterLabel = headers[2] ?? 'After';
  const rows = lines.slice(1).map(line => {
    const parts = line.split('|').map(s => s.trim());
    const label = parts[0] ?? '';
    const before = parts[1] ?? '';
    const after = parts[2] ?? '';
    const bNum = parseFloat(before), aNum = parseFloat(after);
    let delta = '';
    let deltaColor = '#94a3b8';
    if (!isNaN(bNum) && !isNaN(aNum)) {
      const d = aNum - bNum;
      const pct = bNum !== 0 ? ((d / bNum) * 100).toFixed(1) : '∞';
      delta = d > 0 ? `+${d.toLocaleString()} (${pct}%)` : d < 0 ? `${d.toLocaleString()} (${pct}%)` : '변동 없음';
      deltaColor = d > 0 ? '#34d399' : d < 0 ? '#f87171' : '#94a3b8';
    } else {
      delta = before === after ? '동일' : '변경됨';
      deltaColor = before === after ? '#94a3b8' : '#fbbf24';
    }
    return { label, before, after, delta, deltaColor };
  });

  return `<div style="padding:6px 10px;overflow-x:auto"><table style="border-collapse:collapse;width:100%">
    <thead><tr>
      <th style="padding:7px 10px;font-size:10px;color:#94a3b8;text-align:left;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08)"></th>
      <th style="padding:7px 10px;font-size:10px;color:#f87171;text-align:right;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08)">${beforeLabel}</th>
      <th style="padding:7px 10px;font-size:10px;color:#34d399;text-align:right;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08)">${afterLabel}</th>
      <th style="padding:7px 10px;font-size:10px;color:#94a3b8;text-align:right;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08)">변동</th>
    </tr></thead>
    <tbody>${rows.map((r, ri) => `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)${ri % 2 ? ';background:rgba(255,255,255,0.015)' : ''}">
      <td style="padding:6px 10px;font-size:12px;color:#e2e8f0;font-weight:600">${r.label}</td>
      <td style="padding:6px 10px;font-size:12px;color:#f8717180;text-align:right;text-decoration:line-through">${r.before}</td>
      <td style="padding:6px 10px;font-size:12px;color:#34d399;text-align:right;font-weight:600">${r.after}</td>
      <td style="padding:6px 10px;font-size:11px;color:${r.deltaColor};text-align:right;font-weight:600">${r.delta}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ── 히스토그램 ──

function histogramChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const maxVal = Math.max(...rows.map(r => r.values[0] ?? 0), 1);
  const BAR_H = 160;

  const barsHtml = rows.map((r, i) => {
    const v = r.values[0] ?? 0;
    const h = Math.max((v / maxVal) * BAR_H, 2);
    const color = COLORS[Math.floor(i / Math.max(rows.length / COLORS.length, 1)) % COLORS.length];
    return `<div style="flex:1;min-width:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:${BAR_H + 30}px">
      <div style="font-size:9px;color:#94a3b8;margin-bottom:2px">${v.toLocaleString()}</div>
      <div style="width:100%;max-width:40px;height:${h}px;background:linear-gradient(to top,${color},${color}80);border-radius:2px 2px 0 0"></div>
      <div style="font-size:8px;color:#64748b;margin-top:3px;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</div>
    </div>`;
  }).join('');

  return `<div style="padding:8px 16px 4px;display:flex;gap:1px;align-items:flex-end">${barsHtml}</div>`;
}

// ── 캘린더 히트맵 ──

function calendarChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const entries: { date: string; value: number; label?: string }[] = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { date: parts[0] ?? '', value: parseFloat(parts[1]) || 0, label: parts[2] };
  }).filter(e => e.date);

  if (entries.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (형식: 날짜|값)</p>';

  const maxVal = Math.max(...entries.map(e => e.value), 1);

  function intensity(v: number): string {
    const t = v / maxVal;
    if (t === 0) return 'rgba(255,255,255,0.03)';
    if (t < 0.25) return 'rgba(129,140,248,0.15)';
    if (t < 0.5) return 'rgba(129,140,248,0.3)';
    if (t < 0.75) return 'rgba(129,140,248,0.5)';
    return 'rgba(129,140,248,0.75)';
  }

  const CELL = 16, GAP = 3;
  const cols = Math.min(entries.length, 52);
  const rowCount = Math.ceil(entries.length / 7);
  const realCols = Math.min(Math.ceil(entries.length / Math.min(rowCount, 7)), entries.length);

  const cells = entries.map((e, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = col * (CELL + GAP);
    const y = row * (CELL + GAP);
    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${intensity(e.value)}" stroke="rgba(255,255,255,0.03)" stroke-width="0.5">
      <title>${e.date}: ${e.value.toLocaleString()}${e.label ? ' - ' + e.label : ''}</title>
    </rect>`;
  }).join('');

  const svgW = Math.ceil(entries.length / 7) * (CELL + GAP);
  const svgH = Math.min(entries.length, 7) * (CELL + GAP);

  const legendHtml = `<div style="display:flex;align-items:center;gap:4px;padding:4px 16px 2px;justify-content:flex-end">
    <span style="font-size:9px;color:#64748b">적음</span>
    ${[0.03, 0.15, 0.3, 0.5, 0.75].map(op => `<div style="width:10px;height:10px;border-radius:2px;background:rgba(129,140,248,${op})"></div>`).join('')}
    <span style="font-size:9px;color:#64748b">많음</span>
  </div>`;

  return `${legendHtml}<div style="padding:4px 16px 8px;overflow-x:auto"><svg width="${svgW}" height="${svgH}">${cells}</svg></div>`;
}

// ── 간트 차트 ──

function ganttChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const tasks = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { name: parts[0] ?? '', start: parseFloat(parts[1]) || 0, end: parseFloat(parts[2]) || 0, group: parts[3] ?? '' };
  }).filter(t => t.name);

  if (tasks.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (형식: 작업명|시작|끝|그룹?)</p>';

  const minStart = Math.min(...tasks.map(t => t.start));
  const maxEnd = Math.max(...tasks.map(t => t.end));
  const range = maxEnd - minStart || 1;
  const groups = [...new Set(tasks.map(t => t.group).filter(Boolean))];

  const tickCount = Math.min(Math.ceil(range) + 1, 12);
  const ticks = Array.from({ length: tickCount }, (_, i) => minStart + (range / (tickCount - 1)) * i);

  const headerHtml = `<div style="display:flex;margin-left:120px;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:4px">${
    ticks.map(t => `<div style="flex:1;font-size:9px;color:#64748b;text-align:center">${Number.isInteger(t) ? t : t.toFixed(1)}</div>`).join('')
  }</div>`;

  const barsHtml = tasks.map((t, i) => {
    const left = ((t.start - minStart) / range) * 100;
    const width = Math.max(((t.end - t.start) / range) * 100, 2);
    const groupIdx = groups.indexOf(t.group);
    const color = COLORS[(groupIdx >= 0 ? groupIdx : i) % COLORS.length];
    return `<div style="display:flex;align-items:center;gap:0;margin-bottom:3px">
      <div style="width:120px;font-size:10px;color:#cbd5e1;padding-right:8px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</div>
      <div style="flex:1;height:20px;position:relative;background:rgba(255,255,255,0.02);border-radius:3px">
        <div style="position:absolute;left:${left}%;width:${width}%;height:100%;background:${color}30;border:1px solid ${color};border-radius:3px;display:flex;align-items:center;padding:0 6px"
          onmouseenter="this.querySelector('.tt').style.opacity=1" onmouseleave="this.querySelector('.tt').style.opacity=0">
          <span style="font-size:9px;color:${color};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.start}–${t.end}</span>
          <div class="tt" style="position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid ${color}40;border-radius:4px;padding:3px 8px;font-size:10px;color:${color};white-space:nowrap;opacity:0;transition:opacity 0.15s;pointer-events:none">${t.name}: ${t.start} → ${t.end}${t.group ? ' (' + t.group + ')' : ''}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const legendHtml = groups.length > 0 ? `<div style="display:flex;gap:10px;padding:6px 16px 2px;flex-wrap:wrap">${
    groups.map((g, i) => `<span style="font-size:10px;color:${COLORS[i % COLORS.length]}">● ${g}</span>`).join('')
  }</div>` : '';

  return `${legendHtml}<div style="padding:4px 12px 8px">${headerHtml}${barsHtml}</div>`;
}

// ── 도넛 차트 (중앙 메트릭) ──

function donutChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
  const total = rows.reduce((s, r) => s + (r.values[0] ?? 0), 0);
  const R = 80, CX = 100, CY = 100, STROKE = 28;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const arcs = rows.map((r, i) => {
    const v = r.values[0] ?? 0;
    const pct = total > 0 ? v / total : 0;
    const dashLen = pct * circumference;
    const color = COLORS[i % COLORS.length];
    const arc = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${color}" stroke-width="${STROKE}"
      stroke-dasharray="${dashLen} ${circumference - dashLen}" stroke-dashoffset="${-offset}" stroke-linecap="round" opacity="0.85"
      onmouseenter="this.style.opacity=1;this.style.strokeWidth=${STROKE + 4}" onmouseleave="this.style.opacity=0.85;this.style.strokeWidth=${STROKE}">
      <title>${r.label}: ${v.toLocaleString()} (${(pct * 100).toFixed(1)}%)</title>
    </circle>`;
    offset += dashLen;
    return arc;
  }).join('');

  const centerLabel = rows[0]?.label ?? '';
  const centerValue = total.toLocaleString();

  const legendHtml = rows.map((r, i) => {
    const pct = total > 0 ? ((r.values[0] ?? 0) / total * 100).toFixed(1) : '0';
    return `<span style="font-size:10px;color:${COLORS[i % COLORS.length]}">● ${r.label} ${pct}%</span>`;
  }).join('');

  return `<div style="display:flex;align-items:center;gap:16px;padding:8px 16px;flex-wrap:wrap;justify-content:center">
    <svg viewBox="0 0 200 200" style="width:160px;height:160px;transform:rotate(-90deg);flex-shrink:0">
      ${arcs}
      <text x="${CX}" y="${CY - 4}" text-anchor="middle" fill="#e2e8f0" font-size="20" font-weight="800" style="transform:rotate(90deg);transform-origin:${CX}px ${CY}px">${centerValue}</text>
      <text x="${CX}" y="${CY + 14}" text-anchor="middle" fill="#64748b" font-size="10" style="transform:rotate(90deg);transform-origin:${CX}px ${CY}px">합계</text>
    </svg>
    <div style="display:flex;flex-direction:column;gap:4px">${legendHtml}</div>
  </div>`;
}

// ── 덤벨 차트 (전후 비교) ──

function dumbbellChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (헤더: _|Before|After + 행)</p>';

  const headers = lines[0].split('|').map(s => s.trim());
  const beforeLabel = headers[1] ?? 'Before';
  const afterLabel = headers[2] ?? 'After';
  const rows = lines.slice(1).map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { label: parts[0] ?? '', before: parseFloat(parts[1]) || 0, after: parseFloat(parts[2]) || 0 };
  });
  const allVals = rows.flatMap(r => [r.before, r.after]);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  return `<div style="padding:8px 16px">
    <div style="display:flex;gap:10px;margin-bottom:8px;padding-left:90px">
      <span style="font-size:10px;color:#f87171">● ${beforeLabel}</span>
      <span style="font-size:10px;color:#34d399">● ${afterLabel}</span>
    </div>
    ${rows.map(r => {
      const bPos = ((r.before - minVal) / range) * 100;
      const aPos = ((r.after - minVal) / range) * 100;
      const leftPos = Math.min(bPos, aPos);
      const width = Math.abs(aPos - bPos);
      const increased = r.after >= r.before;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:82px;font-size:11px;color:#cbd5e1;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</div>
        <div style="flex:1;height:20px;position:relative;background:rgba(255,255,255,0.02);border-radius:10px">
          <div style="position:absolute;top:9px;left:${leftPos}%;width:${Math.max(width, 0.5)}%;height:2px;background:${increased ? '#34d399' : '#f87171'}40"></div>
          <div style="position:absolute;top:4px;left:${bPos}%;width:12px;height:12px;border-radius:50%;background:#f87171;border:2px solid #0f1117;transform:translateX(-6px)" title="${beforeLabel}: ${r.before.toLocaleString()}"></div>
          <div style="position:absolute;top:4px;left:${aPos}%;width:12px;height:12px;border-radius:50%;background:#34d399;border:2px solid #0f1117;transform:translateX(-6px)" title="${afterLabel}: ${r.after.toLocaleString()}"></div>
        </div>
        <div style="width:60px;font-size:10px;text-align:right;flex-shrink:0;color:${increased ? '#34d399' : '#f87171'};font-weight:600">${increased ? '+' : ''}${(r.after - r.before).toLocaleString()}</div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── 불릿 차트 (목표 대비 실적) ──

function bulletChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (라벨|실적|목표|최대?)</p>';

  return `<div style="padding:8px 16px;display:flex;flex-direction:column;gap:10px">${
    rows.map((r, i) => {
      const actual = r.values[0] ?? 0;
      const target = r.values[1] ?? 100;
      const maxRange = r.values[2] ?? Math.max(target * 1.2, actual * 1.1);
      const color = COLORS[i % COLORS.length];
      const actualPct = Math.min((actual / maxRange) * 100, 100);
      const targetPct = Math.min((target / maxRange) * 100, 100);
      const achieved = actual >= target;

      return `<div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:11px;font-weight:600;color:#e2e8f0">${r.label}</span>
          <span style="font-size:11px;color:${achieved ? '#34d399' : '#fbbf24'};font-weight:700">${actual.toLocaleString()} / ${target.toLocaleString()}</span>
        </div>
        <div style="height:24px;position:relative;background:rgba(255,255,255,0.03);border-radius:4px;overflow:hidden">
          <div style="position:absolute;top:0;left:0;width:${targetPct * 0.6}%;height:100%;background:rgba(255,255,255,0.04)"></div>
          <div style="position:absolute;top:0;left:0;width:${targetPct * 0.85}%;height:100%;background:rgba(255,255,255,0.03)"></div>
          <div style="position:absolute;top:4px;left:0;width:${actualPct}%;height:16px;background:${color};border-radius:3px;transition:width 0.4s"></div>
          <div style="position:absolute;top:0;left:${targetPct}%;width:2px;height:100%;background:#e2e8f0" title="목표: ${target.toLocaleString()}"></div>
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── 갤러리 (이미지 그리드) ──

function galleryChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const items = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    return { url: parts[0] ?? '', caption: parts[1] ?? '', desc: parts[2] ?? '' };
  }).filter(it => it.url);

  if (items.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (이미지URL|캡션|설명?)</p>';

  const cols = items.length <= 2 ? items.length : items.length <= 4 ? 2 : 3;

  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:8px 12px">${
    items.map((it, i) => {
      const color = COLORS[i % COLORS.length];
      return `<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;transition:border-color 0.15s"
        onmouseenter="this.style.borderColor='${color}40'" onmouseleave="this.style.borderColor='rgba(255,255,255,0.06)'">
        <div style="width:100%;aspect-ratio:1/1;overflow:hidden;background:#0a0c10;display:flex;align-items:center;justify-content:center">
          <img src="${it.url}" alt="${it.caption}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'padding:16px;text-align:center;color:#475569;font-size:10px\\'>이미지 로드 실패</div>'"/>
        </div>
        ${it.caption || it.desc ? `<div style="padding:6px 8px">
          ${it.caption ? `<div style="font-size:11px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.caption}</div>` : ''}
          ${it.desc ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${it.desc}</div>` : ''}
        </div>` : ''}
      </div>`;
    }).join('')
  }</div>`;
}

// ── 프로세스 (단계 표시) ──

function processChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const statusMap: Record<string, { icon: string; color: string }> = {
    '완료': { icon: '✓', color: '#34d399' }, 'done': { icon: '✓', color: '#34d399' }, 'complete': { icon: '✓', color: '#34d399' },
    '진행': { icon: '●', color: '#818cf8' }, 'active': { icon: '●', color: '#818cf8' }, 'current': { icon: '●', color: '#818cf8' }, '진행중': { icon: '●', color: '#818cf8' },
    '대기': { icon: '○', color: '#475569' }, 'pending': { icon: '○', color: '#475569' }, 'wait': { icon: '○', color: '#475569' },
    '실패': { icon: '✗', color: '#f87171' }, 'fail': { icon: '✗', color: '#f87171' }, 'error': { icon: '✗', color: '#f87171' },
    '건너뜀': { icon: '–', color: '#64748b' }, 'skip': { icon: '–', color: '#64748b' },
  };

  const steps = lines.map(line => {
    const parts = line.split('|').map(s => s.trim());
    const name = parts[0] ?? '';
    const status = parts[1]?.toLowerCase() ?? 'pending';
    const desc = parts[2] ?? '';
    const st = statusMap[status] ?? { icon: '○', color: '#475569' };
    return { name, status, desc, ...st };
  });

  if (steps.length === 0) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (단계명|상태|설명?)</p>';

  return `<div style="padding:10px 16px">${steps.map((s, i) => {
    const isLast = i === steps.length - 1;
    return `<div style="display:flex;gap:12px">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:28px">
        <div style="width:28px;height:28px;border-radius:50%;background:${s.color}15;border:2px solid ${s.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${s.color};flex-shrink:0">${s.icon}</div>
        ${!isLast ? `<div style="width:2px;flex:1;min-height:16px;background:${s.color}30"></div>` : ''}
      </div>
      <div style="padding-bottom:${isLast ? '4px' : '14px'};flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:${s.color === '#475569' ? '#94a3b8' : '#e2e8f0'}">${s.name}</div>
        ${s.desc ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${s.desc}</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ── 체인지로그 (패치 노트) ──

function changelogChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const tagStyles: Record<string, { color: string; label: string }> = {
    'new': { color: '#34d399', label: 'NEW' }, '신규': { color: '#34d399', label: '신규' }, 'add': { color: '#34d399', label: 'ADD' }, '추가': { color: '#34d399', label: '추가' },
    'fix': { color: '#60a5fa', label: 'FIX' }, '수정': { color: '#60a5fa', label: '수정' }, 'bug': { color: '#60a5fa', label: 'BUG' }, '버그': { color: '#60a5fa', label: '버그' },
    'change': { color: '#fbbf24', label: 'CHANGE' }, '변경': { color: '#fbbf24', label: '변경' }, 'update': { color: '#fbbf24', label: 'UPDATE' }, '개선': { color: '#fbbf24', label: '개선' },
    'remove': { color: '#f87171', label: 'REMOVE' }, '삭제': { color: '#f87171', label: '삭제' }, 'deprecated': { color: '#f87171', label: 'DEP' },
    'balance': { color: '#a78bfa', label: 'BALANCE' }, '밸런스': { color: '#a78bfa', label: '밸런스' },
    'breaking': { color: '#f87171', label: 'BREAKING' },
  };

  const sections: { version: string; entries: { tag: string; tagStyle: { color: string; label: string }; text: string }[] }[] = [];
  let current: typeof sections[0] | null = null;

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('v') || line.match(/^\d+\.\d+/)) {
      current = { version: line.replace(/^#+\s*/, ''), entries: [] };
      sections.push(current);
    } else if (current) {
      const parts = line.split('|').map(s => s.trim());
      const rawTag = parts[0]?.toLowerCase() ?? '';
      const text = parts.slice(1).join('|').trim() || (parts[0] ?? '');
      const tagStyle = tagStyles[rawTag];
      if (tagStyle) {
        current.entries.push({ tag: rawTag, tagStyle, text });
      } else {
        current.entries.push({ tag: '', tagStyle: { color: '#94a3b8', label: '•' }, text: line });
      }
    } else {
      current = { version: '', entries: [] };
      sections.push(current);
      const parts = line.split('|').map(s => s.trim());
      const rawTag = parts[0]?.toLowerCase() ?? '';
      const text = parts.slice(1).join('|').trim() || (parts[0] ?? '');
      const tagStyle = tagStyles[rawTag];
      current.entries.push({ tag: rawTag, tagStyle: tagStyle ?? { color: '#94a3b8', label: '•' }, text: tagStyle ? text : line });
    }
  }

  return `<div style="padding:8px 14px;display:flex;flex-direction:column;gap:12px">${
    sections.map(sec => `<div>
      ${sec.version ? `<div style="font-size:14px;font-weight:800;color:#e2e8f0;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.08)">${sec.version}</div>` : ''}
      <div style="display:flex;flex-direction:column;gap:4px">${
        sec.entries.map(e => `<div style="display:flex;align-items:flex-start;gap:8px">
          <span style="font-size:9px;font-weight:700;color:${e.tagStyle.color};background:${e.tagStyle.color}15;border:1px solid ${e.tagStyle.color}30;border-radius:3px;padding:1px 6px;flex-shrink:0;margin-top:1px">${e.tagStyle.label}</span>
          <span style="font-size:11px;color:#cbd5e1;line-height:1.4">${e.text}</span>
        </div>`).join('')
      }</div>
    </div>`).join('')
  }</div>`;
}

// ── 메인 빌더 ──

export function buildVisualizerHtml(data: VizData): string {
  const { type, title, body } = data;

  if (type === 'html') {
    return `<style>${BASE_STYLE}</style>${body}`;
  }

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
 * 아티팩트에서 인라인 비주얼라이저와 동일한 템플릿을 재사용하여 토큰 절약.
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
