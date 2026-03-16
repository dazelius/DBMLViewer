import { COLORS, parseRows, EMPTY } from '../utils';

// ── 티어 리스트 ──

export function tierChart(body: string, _title: string): string {
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

export function itemcardChart(body: string, _title: string): string {
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

// ── 갤러리 (이미지 그리드) ──

export function galleryChart(body: string, _title: string): string {
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

