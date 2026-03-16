import { COLORS, parseRows, EMPTY } from '../utils';

// ── 타임라인 ──

export function timelineChart(body: string, _title: string): string {
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

export function kanbanChart(body: string, _title: string): string {
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

// ── 캘린더 히트맵 ──

export function calendarChart(body: string, _title: string): string {
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

export function ganttChart(body: string, _title: string): string {
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

// ── 체인지로그 (패치 노트) ──

export function changelogChart(body: string, _title: string): string {
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

