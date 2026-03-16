export const COLORS = [
  '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#a3e635',
];

export const BASE_STYLE = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;background:#0f1117;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;overflow:hidden}
.viz-title{font-size:14px;font-weight:700;color:#e2e8f0;padding:14px 16px 8px;margin:0}
.viz-subtitle{font-size:11px;color:#94a3b8;padding:0 16px 10px;margin:0}
.tooltip{position:absolute;background:#1e293b;border:1px solid rgba(129,140,248,0.3);border-radius:6px;padding:6px 10px;font-size:11px;color:#e2e8f0;pointer-events:none;white-space:nowrap;z-index:100;opacity:0;transition:opacity 0.15s}
`;

/** "라벨|값" 또는 "라벨|값1|값2..." 형태의 줄을 파싱 */
export function parseRows(body: string): { label: string; values: number[] }[] {
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
export function parseProps(body: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const line of body.trim().split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      props[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
  }
  return props;
}

/** 헤더행 + 데이터행 파싱: 첫 줄이 숫자가 아니면 헤더로 사용 */
export function parseWithHeader(body: string): { headers: string[]; rows: { label: string; values: number[] }[] } {
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

export const EMPTY = '<p style="color:#94a3b8;padding:16px">데이터 없음</p>';
