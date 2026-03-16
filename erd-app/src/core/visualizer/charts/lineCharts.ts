import { COLORS, parseRows, parseWithHeader, EMPTY } from '../utils';

export function lineChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return EMPTY;
  const seriesCount = rows[0].values.length;
  const allVals = rows.flatMap(r => r.values);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const W = 400, H = 180, PX = 40, PY = 16;
  const uid = `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const pointsData = rows.map((r, ri) => {
    const x = PX + (ri / Math.max(rows.length - 1, 1)) * (W - PX * 2);
    return { x, label: r.label, values: r.values.map((v, si) => ({
      y: PY + (1 - (v - minVal) / range) * (H - PY * 2), v, color: COLORS[si % COLORS.length]
    }))};
  });

  const paths = Array.from({ length: seriesCount }, (_, si) => {
    const d = pointsData.map((p, ri) => `${ri === 0 ? 'M' : 'L'}${p.x},${p.values[si].y}`).join(' ');
    const color = COLORS[si % COLORS.length];
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');

  const dots = pointsData.flatMap(p =>
    p.values.map(v => `<circle cx="${p.x}" cy="${v.y}" r="4" fill="#0f1117" stroke="${v.color}" stroke-width="2" style="transition:r 0.15s"/>`)
  ).join('');

  const xLabels = pointsData.map(p =>
    `<text x="${p.x}" y="${H - 2}" text-anchor="middle" fill="#64748b" font-size="10">${p.label}</text>`
  ).join('');

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:0 16px 4px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  const pointsJson = JSON.stringify(pointsData.map(p => ({ x: p.x, label: p.label, values: p.values.map(v => ({ y: v.y, v: v.v, color: v.color })) })));

  return `${legendHtml}
  <div style="position:relative;padding:0 8px">
    <svg id="${uid}" viewBox="0 0 ${W} ${H}" style="width:100%">
      ${paths}${dots}${xLabels}
      <line id="${uid}_cross" x1="0" y1="${PY}" x2="0" y2="${H - PY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3,3" style="opacity:0;transition:opacity 0.1s"/>
    </svg>
    <div id="${uid}_tip" style="position:absolute;top:0;left:0;background:#1e293b;border:1px solid rgba(129,140,248,0.3);border-radius:8px;padding:8px 12px;font-size:11px;color:#e2e8f0;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:10;white-space:nowrap"></div>
  </div>
  <script>
  (function(){
    var svg=document.getElementById('${uid}');
    var cross=document.getElementById('${uid}_cross');
    var tip=document.getElementById('${uid}_tip');
    var pts=${pointsJson};
    var W=${W},PX=${PX};

    svg.addEventListener('mousemove',function(e){
      var rect=svg.getBoundingClientRect();
      var scaleX=W/rect.width;
      var mx=(e.clientX-rect.left)*scaleX;
      var closest=pts.reduce(function(best,p){return Math.abs(p.x-mx)<Math.abs(best.x-mx)?p:best},pts[0]);
      cross.setAttribute('x1',closest.x);cross.setAttribute('x2',closest.x);cross.style.opacity='1';
      var lines='<div style="font-weight:700;margin-bottom:4px;color:#e2e8f0">'+closest.label+'</div>';
      closest.values.forEach(function(v){
        lines+='<div style="color:'+v.color+';display:flex;gap:8px;justify-content:space-between"><span>●</span><span style="font-weight:600">'+v.v.toLocaleString()+'</span></div>';
      });
      tip.innerHTML=lines;tip.style.opacity='1';
      var tipX=(closest.x/W)*rect.width+rect.left-svg.parentElement.getBoundingClientRect().left;
      tip.style.left=Math.min(tipX+12,rect.width-tip.offsetWidth-8)+'px';
      tip.style.top='4px';
    });

    svg.addEventListener('mouseleave',function(){
      cross.style.opacity='0';tip.style.opacity='0';
    });
  })();
  </script>`;
}

export function radarChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return EMPTY;
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

export function scatterChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
  const xVals = rows.map(r => r.values[0] ?? 0);
  const yVals = rows.map(r => r.values[1] ?? 0);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  const W = 380, H = 200, PX = 36, PY = 20;
  const uid = `scat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const pointsData = rows.map((r, i) => ({
    x: PX + ((r.values[0] ?? 0) - xMin) / xRange * (W - PX * 2),
    y: PY + (1 - ((r.values[1] ?? 0) - yMin) / yRange) * (H - PY * 2),
    label: r.label,
    vx: r.values[0] ?? 0,
    vy: r.values[1] ?? 0,
    color: COLORS[i % COLORS.length],
  }));
  const pointsJson = JSON.stringify(pointsData);

  const gridX = Array.from({ length: 5 }, (_, i) => {
    const x = PX + (i / 4) * (W - PX * 2);
    const val = xMin + (i / 4) * xRange;
    return `<line x1="${x}" y1="${PY}" x2="${x}" y2="${H - PY}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <text x="${x}" y="${H - 4}" text-anchor="middle" fill="#64748b" font-size="9">${Number.isInteger(val) ? val : val.toFixed(1)}</text>`;
  }).join('');

  const gridY = Array.from({ length: 5 }, (_, i) => {
    const y = PY + (i / 4) * (H - PY * 2);
    const val = yMax - (i / 4) * yRange;
    return `<line x1="${PX}" y1="${y}" x2="${W - PX}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <text x="${PX - 4}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9">${Number.isInteger(val) ? val : val.toFixed(1)}</text>`;
  }).join('');

  const dots = pointsData.map((p, i) =>
    `<circle data-i="${i}" cx="${p.x}" cy="${p.y}" r="6" fill="${p.color}" opacity="0.8" stroke="${p.color}" stroke-width="0" style="cursor:pointer;transition:r 0.2s,stroke-width 0.2s,opacity 0.2s"/>`
  ).join('');

  return `<div style="position:relative;padding:0 8px">
    <svg id="${uid}" viewBox="0 0 ${W} ${H}" style="width:100%">
      ${gridX}${gridY}
      <line x1="${PX}" y1="${H - PY}" x2="${W - PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <line x1="${PX}" y1="${PY}" x2="${PX}" y2="${H - PY}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      ${dots}
    </svg>
    <div id="${uid}_tip" style="position:absolute;background:#1e293b;border:1px solid rgba(129,140,248,0.3);border-radius:8px;padding:8px 12px;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:10;white-space:nowrap"></div>
  </div>
  <script>
  (function(){
    var svg=document.getElementById('${uid}');
    var tip=document.getElementById('${uid}_tip');
    var pts=${pointsJson};
    var W=${W},active=-1;

    var circles=svg.querySelectorAll('circle[data-i]');
    circles.forEach(function(c){
      c.addEventListener('mouseenter',function(){
        var i=parseInt(c.dataset.i),p=pts[i];
        c.setAttribute('r','9');c.setAttribute('stroke-width','2');
        circles.forEach(function(o,oi){if(oi!==i){o.style.opacity='0.25'}});
        tip.innerHTML='<div style="font-weight:700;color:'+p.color+';margin-bottom:2px">'+p.label+'</div><div style="font-size:11px;color:#cbd5e1">X: '+p.vx.toLocaleString()+'</div><div style="font-size:11px;color:#cbd5e1">Y: '+p.vy.toLocaleString()+'</div>';
        tip.style.opacity='1';
        var rect=svg.getBoundingClientRect();
        var tipX=(p.x/W)*rect.width+8;
        tip.style.left=Math.min(tipX+12,rect.width-120)+'px';
        tip.style.top=Math.max((p.y/${H})*rect.height-40,4)+'px';
      });
      c.addEventListener('mouseleave',function(){
        c.setAttribute('r','6');c.setAttribute('stroke-width','0');
        circles.forEach(function(o){o.style.opacity='0.8'});
        tip.style.opacity='0';
      });
      c.addEventListener('click',function(){
        var i=parseInt(c.dataset.i);
        if(active===i){active=-1;circles.forEach(function(o){o.style.opacity='0.8';o.setAttribute('r','6');o.setAttribute('stroke-width','0')});return}
        active=i;
        circles.forEach(function(o,oi){
          if(oi===i){o.setAttribute('r','10');o.setAttribute('stroke-width','3');o.style.opacity='1'}
          else{o.setAttribute('r','4');o.style.opacity='0.2';o.setAttribute('stroke-width','0')}
        });
      });
    });
  })();
  </script>`;
}

export function areaChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return EMPTY;
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

export function bubbleChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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
