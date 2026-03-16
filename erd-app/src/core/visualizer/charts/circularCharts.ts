import { COLORS, parseRows, EMPTY } from '../utils';

export function pieChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
  const total = rows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const uid = `pie_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  let cumulativePct = 0;
  const segments = rows.map((r, i) => {
    const pct = ((r.values[0] ?? 0) / total) * 100;
    const start = cumulativePct;
    cumulativePct += pct;
    return { label: r.label, value: r.values[0] ?? 0, pct, start, color: COLORS[i % COLORS.length] };
  });

  const segsJson = JSON.stringify(segments);

  const legendHtml = segments.map((s, i) =>
    `<div id="${uid}_leg${i}" data-i="${i}" style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:3px 6px;border-radius:6px;transition:background 0.15s" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">
      <div style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></div>
      <span style="color:#cbd5e1">${s.label}</span>
      <span style="color:#64748b;margin-left:auto">${s.value.toLocaleString()} (${s.pct.toFixed(1)}%)</span>
    </div>`
  ).join('');

  return `<div style="display:flex;align-items:center;gap:24px;padding:12px 16px">
    <div style="position:relative;width:160px;height:160px;flex-shrink:0">
      <div id="${uid}_ring" style="width:100%;height:100%;border-radius:50%;position:relative;transition:transform 0.3s"></div>
      <div style="position:absolute;inset:30%;border-radius:50%;background:#0f1117;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:none">
        <div id="${uid}_center_val" style="font-size:18px;font-weight:700;color:#e2e8f0;transition:all 0.2s">${total.toLocaleString()}</div>
        <div id="${uid}_center_lbl" style="font-size:10px;color:#64748b;transition:all 0.2s">합계</div>
      </div>
    </div>
    <div id="${uid}_legend" style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">${legendHtml}</div>
  </div>
  <script>
  (function(){
    var segs=${segsJson};
    var total=${total};
    var ring=document.getElementById('${uid}_ring');
    var centerVal=document.getElementById('${uid}_center_val');
    var centerLbl=document.getElementById('${uid}_center_lbl');
    var active=-1;

    function render(){
      var stops=segs.map(function(s,i){
        var op=active>=0&&active!==i?'60':'';
        return s.color+op+' '+s.start+'% '+(s.start+s.pct)+'%';
      }).join(', ');
      ring.style.background='conic-gradient('+stops+')';
      ring.style.borderRadius='50%';
      if(active>=0){
        var s=segs[active];
        centerVal.textContent=s.value.toLocaleString();
        centerLbl.textContent=s.label+' ('+s.pct.toFixed(1)+'%)';
        centerVal.style.color=s.color;
      }else{
        centerVal.textContent=total.toLocaleString();
        centerLbl.textContent='합계';
        centerVal.style.color='#e2e8f0';
      }
    }

    segs.forEach(function(_,i){
      var leg=document.getElementById('${uid}_leg'+i);
      if(!leg)return;
      leg.addEventListener('click',function(){
        active=active===i?-1:i;
        render();
      });
    });

    ring.addEventListener('click',function(e){
      var rect=ring.getBoundingClientRect();
      var cx=rect.width/2,cy=rect.height/2;
      var dx=e.clientX-rect.left-cx,dy=e.clientY-rect.top-cy;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<cx*0.3){active=-1;render();return;}
      var angle=(Math.atan2(dy,dx)*180/Math.PI+360+90)%360;
      var pct=angle/360*100;
      var hit=segs.findIndex(function(s){return pct>=s.start&&pct<s.start+s.pct});
      if(hit>=0){active=active===hit?-1:hit}else{active=-1}
      render();
    });

    render();
  })();
  </script>`;
}

export function donutChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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

export function gaugeChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;

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

export function treemapChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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

export function funnelChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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
