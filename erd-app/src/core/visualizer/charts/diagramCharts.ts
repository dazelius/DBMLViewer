import { COLORS, EMPTY } from '../utils';

export function flowChart(body: string, _title: string): string {
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

export function swimlaneChart(body: string, _title: string): string {
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

export function hierarchyChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return EMPTY;

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

export function mindmapChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return EMPTY;

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

export function relationChart(body: string, _title: string): string {
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
  if (nodeArr.length === 0) return EMPTY;

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

export function processChart(body: string, _title: string): string {
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
