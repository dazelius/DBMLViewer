import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore.ts';
import { exportToSQL, type SqlDialect } from '../../core/export/sqlExporter.ts';

interface Props {
  onClose: () => void;
}

const DIALECTS: { id: SqlDialect; label: string }[] = [
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mssql', label: 'SQL Server' },
];

export default function SQLExportModal({ onClose }: Props) {
  const dbmlText = useEditorStore((s) => s.dbmlText);
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const result = exportToSQL(dbmlText, dialect);
      setSql(result);
      setError('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Export failed');
      setSql('');
    }
  }, [dbmlText, dialect]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${dialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[700px] max-h-[80vh] rounded-xl flex flex-col modal-enter"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Export to SQL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer interactive"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Dialect tabs */}
        <div className="flex gap-1.5 px-6 pt-4">
          {DIALECTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDialect(d.id)}
              className="px-3.5 py-1.5 text-[11px] font-semibold rounded-lg cursor-pointer interactive"
              style={{
                background: dialect === d.id ? 'var(--accent)' : 'var(--bg-surface)',
                color: dialect === d.id ? '#fff' : 'var(--text-secondary)',
                boxShadow: dialect === d.id ? 'var(--shadow-glow)' : 'none',
                border: dialect === d.id ? 'none' : '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => {
                if (dialect !== d.id) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (dialect !== d.id) {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* SQL output */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {error ? (
            <div className="p-4 rounded-lg" style={{ background: 'var(--error-muted)', color: 'var(--error)', border: '1px solid var(--error)' }}>
              <p className="text-xs font-medium">{error}</p>
            </div>
          ) : (
            <pre
              className="text-[12px] leading-[1.65] p-5 rounded-xl overflow-auto max-h-[50vh]"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {sql}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2.5 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button
            onClick={handleCopy}
            disabled={!sql}
            className="px-4 py-2 text-[11px] font-semibold rounded-lg cursor-pointer interactive disabled:opacity-30"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => { if (sql) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!sql}
            className="px-5 py-2 text-[11px] font-bold rounded-lg cursor-pointer interactive disabled:opacity-30"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
            onMouseEnter={(e) => { if (sql) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Download .sql
          </button>
        </div>
      </div>
    </div>
  );
}
