import { COLORS, parseRows, parseProps, parseWithHeader, EMPTY } from '../utils';

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

export function compareChart(body: string, _title: string): string {
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

export function statChart(body: string, _title: string): string {
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

export function progressChart(body: string, _title: string): string {
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

export function matrixChart(body: string, _title: string): string {
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

export function quadrantChart(body: string, _title: string): string {
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

export function diffChart(body: string, _title: string): string {
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

export function dumbbellChart(body: string, _title: string): string {
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

export function tableChart(body: string, _title: string): string {
  const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '<p style="color:#94a3b8;padding:16px">데이터 없음 (헤더 + 행)</p>';

  const headers = lines[0].split('|').map(s => s.trim());
  const rows = lines.slice(1).map(line => line.split('|').map(s => s.trim()));
  const rowCount = rows.length;
  const colCount = headers.length;

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

  const rowsJson = JSON.stringify(rows);
  const headersJson = JSON.stringify(headers);
  const colStatsJson = JSON.stringify(colStats);
  const uid = `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  return `<div style="padding:6px 10px;overflow-x:auto">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <input id="${uid}_search" type="text" placeholder="검색..." style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:5px 10px;font-size:11px;color:#e2e8f0;outline:none;font-family:inherit" />
      <span id="${uid}_count" style="font-size:10px;color:#64748b;flex-shrink:0">${rowCount}행</span>
    </div>
    <table id="${uid}" style="border-collapse:collapse;width:100%">
      <thead><tr>${headers.map((h, i) => `<th data-ci="${i}" style="padding:7px 10px;font-size:10px;color:#94a3b8;text-align:left;font-weight:600;border-bottom:2px solid rgba(255,255,255,0.08);white-space:nowrap;cursor:pointer;user-select:none;transition:color 0.15s" onmouseenter="this.style.color='#e2e8f0'" onmouseleave="this.style.color=this.dataset.active==='1'?'#818cf8':'#94a3b8'">${h} <span style="font-size:8px;opacity:0.5">⇅</span></th>`).join('')}</tr></thead>
      <tbody>${rows.map((row, ri) => `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)${ri % 2 ? ';background:rgba(255,255,255,0.015)' : ''};transition:background 0.15s" onmouseenter="this.style.background='rgba(129,140,248,0.06)'" onmouseleave="this.style.background='${ri % 2 ? 'rgba(255,255,255,0.015)' : 'transparent'}'">${
        row.map((cell, ci) => {
          const style = cellColor(cell, ci);
          return `<td style="padding:6px 10px;font-size:11px;color:#cbd5e1;white-space:nowrap;${style ? style + ';border-radius:3px' : ''}">${cell}</td>`;
        }).join('')
      }</tr>`).join('')}</tbody>
    </table>
  </div>
  <script>
  (function(){
    var tbl=document.getElementById('${uid}');
    var search=document.getElementById('${uid}_search');
    var countEl=document.getElementById('${uid}_count');
    var allRows=${rowsJson};
    var colStats=${colStatsJson};
    var sortCol=-1,sortAsc=true;

    function cellColor(val,ci){
      var s=colStats[ci];if(!s||!s.isNum)return'';
      var n=parseFloat(val);if(isNaN(n))return'';
      var range=s.max-s.min||1,t=(n-s.min)/range;
      if(t>0.75)return'background:rgba(52,211,153,0.12);color:#34d399';
      if(t>0.5)return'background:rgba(96,165,250,0.08);color:#93c5fd';
      if(t<0.25)return'background:rgba(248,113,113,0.12);color:#f87171';
      return'';
    }

    function render(data){
      var tb=tbl.querySelector('tbody');
      tb.innerHTML=data.map(function(row,ri){
        return '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)'+(ri%2?';background:rgba(255,255,255,0.015)':'')+';transition:background 0.15s" onmouseenter="this.style.background=\\'rgba(129,140,248,0.06)\\'" onmouseleave="this.style.background=\\''+(ri%2?'rgba(255,255,255,0.015)':'transparent')+'\\'">'+row.map(function(cell,ci){
          var st=cellColor(cell,ci);
          return '<td style="padding:6px 10px;font-size:11px;color:#cbd5e1;white-space:nowrap;'+(st?st+';border-radius:3px':'')+'">'+cell+'</td>';
        }).join('')+'</tr>';
      }).join('');
      countEl.textContent=data.length+'행';
    }

    function update(){
      var q=(search.value||'').toLowerCase();
      var filtered=q?allRows.filter(function(r){return r.some(function(c){return c.toLowerCase().indexOf(q)>=0})}):allRows.slice();
      if(sortCol>=0){
        filtered.sort(function(a,b){
          var va=a[sortCol],vb=b[sortCol];
          var na=parseFloat(va),nb=parseFloat(vb);
          if(!isNaN(na)&&!isNaN(nb))return sortAsc?na-nb:nb-na;
          return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
        });
      }
      render(filtered);
    }

    search.addEventListener('input',update);

    var ths=tbl.querySelectorAll('th');
    ths.forEach(function(th){
      th.addEventListener('click',function(){
        var ci=parseInt(th.dataset.ci);
        if(sortCol===ci){sortAsc=!sortAsc}else{sortCol=ci;sortAsc=true}
        ths.forEach(function(t){t.dataset.active='0';t.style.color='#94a3b8';t.querySelector('span').textContent='⇅'});
        th.dataset.active='1';th.style.color='#818cf8';
        th.querySelector('span').textContent=sortAsc?'↑':'↓';
        update();
      });
    });
  })();
  </script>`;
}
