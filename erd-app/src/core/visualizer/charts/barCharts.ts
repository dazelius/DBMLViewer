import { COLORS, parseRows, parseWithHeader, EMPTY } from '../utils';

export function barChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return EMPTY;
  const seriesCount = rows[0].values.length;
  const maxVal = Math.max(...rows.flatMap(r => r.values), 1);
  const BAR_H = 180;
  const uid = `bar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const colorsJson = JSON.stringify(COLORS);
  const rowsJson = JSON.stringify(rows.map(r => ({ label: r.label, values: r.values })));

  const legendHtml = headers.length > 0 ? `<div style="display:flex;gap:12px;padding:4px 16px 8px;flex-wrap:wrap">${
    headers.map((h, i) => `<span style="font-size:11px;color:${COLORS[i % COLORS.length]}">● ${h}</span>`).join('')
  }</div>` : '';

  const sortBtn = `<div style="display:flex;justify-content:flex-end;padding:0 16px 4px">
    <button id="${uid}_sort" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:3px 10px;font-size:10px;color:#94a3b8;cursor:pointer;font-family:inherit;transition:all 0.15s" onmouseenter="this.style.borderColor='#818cf8';this.style.color='#e2e8f0'" onmouseleave="this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='#94a3b8'">정렬: 원본 ⇅</button>
  </div>`;

  return `${legendHtml}${sortBtn}
  <div style="position:relative;padding:8px 16px 4px 56px">
    <div id="${uid}_yaxis" style="position:absolute;left:8px;top:8px;bottom:24px;width:48px"></div>
    <div id="${uid}" style="display:flex;gap:6px"></div>
  </div>
  <script>
  (function(){
    var COLORS=${colorsJson};
    var originalRows=${rowsJson};
    var BAR_H=${BAR_H},seriesCount=${seriesCount};
    var container=document.getElementById('${uid}');
    var yaxis=document.getElementById('${uid}_yaxis');
    var sortBtn=document.getElementById('${uid}_sort');
    var sortState=0; // 0=원본, 1=내림차, 2=오름차
    var highlighted=-1;

    function renderYAxis(maxV){
      yaxis.innerHTML=[0,0.25,0.5,0.75,1].map(function(pct){
        var val=Math.round(maxV*pct),bottom=Math.round(pct*BAR_H);
        return '<div style="position:absolute;left:0;bottom:'+bottom+'px;width:100%;display:flex;align-items:center"><span style="font-size:9px;color:#475569;width:40px;text-align:right;flex-shrink:0;padding-right:6px">'+val.toLocaleString()+'</span><div style="flex:1;height:1px;background:rgba(255,255,255,0.04)"></div></div>';
      }).join('');
    }

    function render(data){
      var maxV=Math.max.apply(null,data.flatMap(function(r){return r.values}).concat([1]));
      renderYAxis(maxV);
      container.innerHTML=data.map(function(r,ri){
        var inner=r.values.map(function(v,vi){
          var h=Math.max(Math.round((v/maxV)*BAR_H),3);
          var color=COLORS[vi%COLORS.length];
          var op=highlighted>=0&&highlighted!==ri?'0.3':'1';
          return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:'+BAR_H+'px;opacity:'+op+';transition:opacity 0.3s,height 0.4s"><div data-ri="'+ri+'" style="width:100%;height:'+h+'px;background:'+color+';border-radius:4px 4px 0 0;position:relative;transition:height 0.4s,filter 0.2s;cursor:pointer" onmouseenter="this.querySelector(\\'.tt\\').style.opacity=1;this.style.filter=\\'brightness(1.3)\\'" onmouseleave="this.querySelector(\\'.tt\\').style.opacity=0;this.style.filter=\\'\\'"><div class="tt" style="position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid '+color+'40;border-radius:5px;padding:4px 10px;font-size:11px;font-weight:600;color:'+color+';white-space:nowrap;opacity:0;transition:opacity 0.15s;pointer-events:none">'+v.toLocaleString()+'</div></div></div>';
        }).join('');
        return '<div style="flex:1;min-width:36px;display:flex;flex-direction:column;align-items:center"><div style="display:flex;gap:3px;width:100%;padding:0 '+(seriesCount>1?2:6)+'px">'+inner+'</div><div style="font-size:10px;color:#94a3b8;margin-top:8px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">'+r.label+'</div></div>';
      }).join('');

      container.querySelectorAll('[data-ri]').forEach(function(el){
        el.addEventListener('click',function(){
          var ri=parseInt(el.dataset.ri);
          highlighted=highlighted===ri?-1:ri;
          render(data);
        });
      });
    }

    function getSorted(){
      var d=originalRows.slice();
      if(sortState===1)d.sort(function(a,b){return Math.max.apply(null,b.values)-Math.max.apply(null,a.values)});
      if(sortState===2)d.sort(function(a,b){return Math.max.apply(null,a.values)-Math.max.apply(null,b.values)});
      return d;
    }

    sortBtn.addEventListener('click',function(){
      sortState=(sortState+1)%3;
      var labels=['정렬: 원본 ⇅','정렬: 내림차 ↓','정렬: 오름차 ↑'];
      sortBtn.textContent=labels[sortState];
      highlighted=-1;
      render(getSorted());
    });

    render(originalRows);
  })();
  </script>`;
}

export function hbarChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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

export function stackChart(body: string, _title: string): string {
  const { headers, rows } = parseWithHeader(body);
  if (rows.length === 0) return EMPTY;
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

export function histogramChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;
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

export function waterfallChart(body: string, _title: string): string {
  const rows = parseRows(body);
  if (rows.length === 0) return EMPTY;

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

  const barsHtml = entries.map((e) => {
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

export function bulletChart(body: string, _title: string): string {
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
