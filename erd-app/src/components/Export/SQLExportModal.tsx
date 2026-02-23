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
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-[700px] max-h-[80vh] rounded-lg shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Export to SQL
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Dialect tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {DIALECTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDialect(d.id)}
              className="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer"
              style={{
                background: dialect === d.id ? 'var(--accent)' : 'var(--bg-surface)',
                color: dialect === d.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* SQL output */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {error ? (
            <div className="p-3 rounded text-xs" style={{ background: 'rgba(243, 139, 168, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          ) : (
            <pre
              className="text-xs leading-5 p-4 rounded overflow-auto max-h-[50vh]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {sql}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button
            onClick={handleCopy}
            disabled={!sql}
            className="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!sql}
            className="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Download .sql
          </button>
        </div>
      </div>
    </div>
  );
}
