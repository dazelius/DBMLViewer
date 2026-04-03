import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Toolbar from '../components/Layout/Toolbar';

interface StringRow { [key: string]: string }
interface StringData { headers: string[]; rows: StringRow[]; total: number; sheetName: string; updatedAt: string }

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CopyIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const LangIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function StringTablePage() {
  const [data, setData] = useState<StringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/strings?sheet=Sheet1${refresh ? '&refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) {
        let errMsg = json.error || `HTTP ${res.status}`;
        if (json.hint) errMsg += '\n\n' + json.hint;
        if (json.options) {
          for (const [key, val] of Object.entries(json.options) as [string, { desc: string; vars: string[] }][]) {
            errMsg += `\n\n[${key}] ${val.desc}\n  ${val.vars.join('\n  ')}`;
          }
        }
        if (json.setup) errMsg += '\n\n' + json.setup.join('\n');
        setError(errMsg);
      } else {
        setData(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 탭 포커스 시 자동 새로고침 (항상 최신 데이터 보장)
  useEffect(() => {
    const onFocus = () => { if (data && !refreshing) fetchData(true); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [data, refreshing, fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCopy = (key: string, value: string) => {
    copyToClipboard(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  const langColumns = useMemo(() => {
    if (!data) return [];
    return data.headers.filter(h => h !== 'Keys' && h !== 'keys');
  }, [data]);

  const keyColumn = useMemo(() => {
    if (!data) return 'Keys';
    return data.headers.find(h => h.toLowerCase() === 'keys' || h.toLowerCase() === 'key') || data.headers[0];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.rows.filter(row => {
      if (!q) return true;
      return Object.values(row).some(v => v.toLowerCase().includes(q));
    });
  }, [data, search]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, langs: {} as Record<string, { filled: number; empty: number }> };
    const langs: Record<string, { filled: number; empty: number }> = {};
    for (const col of langColumns) {
      let filled = 0, empty = 0;
      for (const row of data.rows) {
        if (row[col]?.trim()) filled++; else empty++;
      }
      langs[col] = { filled, empty };
    }
    return { total: data.rows.length, langs };
  }, [data, langColumns]);

  const emptyFilter = useMemo(() => {
    if (filterLang === 'all' || filterLang === 'empty-any') return filtered;
    if (filterLang.startsWith('empty:')) {
      const lang = filterLang.slice(6);
      return filtered.filter(row => !row[lang]?.trim());
    }
    return filtered;
  }, [filtered, filterLang]);

  const finalRows = filterLang === 'empty-any'
    ? emptyFilter.filter(row => langColumns.some(c => !row[c]?.trim()))
    : emptyFilter;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LangIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                String Table
                {data && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 8 }}>{data.total.toLocaleString()}개 키</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Google Sheets 스트링 테이블
                {data?.updatedAt && <span> · 갱신: {new Date(data.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                fontSize: 12, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.5 : 1,
              }}
            >
              <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}><RefreshIcon /></span>
              새로고침
            </button>
          </div>

          {/* Stats bar */}
          {data && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {langColumns.map(lang => {
                const s = stats.langs[lang];
                if (!s) return null;
                const pct = data.total > 0 ? Math.round((s.filled / data.total) * 100) : 0;
                return (
                  <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{lang}</span>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: pct === 100 ? '#22c55e' : pct > 80 ? '#60a5fa' : '#f59e0b' }} />
                    </div>
                    <span style={{ fontSize: 10, color: pct === 100 ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({s.filled}/{data.total})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><SearchIcon /></div>
              <input
                ref={searchRef}
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="키 또는 번역 검색... (Ctrl+F)"
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
            </div>
            <select
              value={filterLang}
              onChange={e => setFilterLang(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">전체 보기</option>
              <option value="empty-any">미번역 항목</option>
              {langColumns.map(lang => (
                <option key={lang} value={`empty:${lang}`}>{lang} 미번역</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>스트링 테이블 로딩 중...</div>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ maxWidth: 520, padding: 32, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Google Sheets 연결 필요</div>
              <pre style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', textAlign: 'left', background: 'var(--bg-surface)', padding: 16, borderRadius: 8, lineHeight: 1.7 }}>{error}</pre>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)', width: 50 }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--accent)', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)', minWidth: 220 }}>{keyColumn}</th>
                  {langColumns.map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finalRows.map((row, ri) => {
                  const key = row[keyColumn] || '';
                  return (
                    <tr key={ri}
                      style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: 11, borderBottom: '1px solid var(--border-subtle)' }}>{ri + 1}</td>
                      <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500 }}>{key}</code>
                          <button
                            onClick={() => handleCopy(key, key)}
                            title="키 복사"
                            style={{ display: 'inline-flex', padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === key ? '#22c55e' : 'var(--text-muted)', opacity: copiedKey === key ? 1 : 0.4, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => { if (copiedKey !== key) e.currentTarget.style.opacity = '0.4' }}
                          >
                            {copiedKey === key ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> : <CopyIcon />}
                          </button>
                        </div>
                      </td>
                      {langColumns.map(col => {
                        const val = row[col] || '';
                        const isEmpty = !val.trim();
                        return (
                          <td key={col} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', color: isEmpty ? 'var(--text-muted)' : 'var(--text-primary)', cursor: isEmpty ? 'default' : 'pointer' }}
                            onClick={() => { if (!isEmpty) handleCopy(`${key}:${col}`, val); }}
                            title={isEmpty ? '미번역' : `클릭하여 복사: ${val}`}
                          >
                            {isEmpty
                              ? <span style={{ fontSize: 11, color: '#f59e0b', opacity: 0.6, fontStyle: 'italic' }}>—</span>
                              : <span>{copiedKey === `${key}:${col}` ? <span style={{ color: '#22c55e', fontSize: 11 }}>복사됨!</span> : highlightMatch(val, search)}</span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {finalRows.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
                {search ? `"${search}" 검색 결과 없음` : '데이터 없음'}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', position: 'sticky', bottom: 0 }}>
              <span>표시: {finalRows.length.toLocaleString()} / 전체: {data?.total.toLocaleString() ?? 0}개</span>
              <span>{search && `검색: "${search}"`}{filterLang !== 'all' && ` · 필터: ${filterLang === 'empty-any' ? '미번역' : filterLang.replace('empty:', '') + ' 미번역'}`}</span>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(96,165,250,0.25)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
