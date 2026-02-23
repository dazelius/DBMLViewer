import type { SchemaColumn } from '../../core/schema/types.ts';

interface DocsFieldRowProps {
  column: SchemaColumn;
  onRefClick?: (tableId: string) => void;
  refTarget?: { tableId: string; tableName: string; columnName: string } | null;
  isLast?: boolean;
}

export default function DocsFieldRow({ column, onRefClick, refTarget, isLast }: DocsFieldRowProps) {
  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Name + Badges */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          {column.isPrimaryKey && <KeyIcon variant="pk" />}
          {column.isForeignKey && !column.isPrimaryKey && <KeyIcon variant="fk" />}
          <span
            className="text-[12px] font-semibold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
          >
            {column.name}
          </span>
          {column.isPrimaryKey && <Badge label="PK" variant="warning" />}
          {column.isForeignKey && <Badge label="FK" variant="accent" />}
          {column.isUnique && <Badge label="UQ" variant="success" />}
        </div>
      </td>

      {/* Type */}
      <td className="px-5 py-3">
        <code
          className="text-[11px] px-2 py-[3px] rounded-md inline-block"
          style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}
        >
          {column.type}
        </code>
      </td>

      {/* Constraints */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {column.isNotNull && <Tag label="NOT NULL" />}
          {column.isIncrement && <Tag label="AUTO INC" />}
          {column.defaultValue && <Tag label={`= ${column.defaultValue}`} highlight />}
        </div>
      </td>

      {/* References */}
      <td className="px-5 py-3">
        {refTarget && (
          <button
            onClick={() => onRefClick?.(refTarget.tableId)}
            className="text-[11px] cursor-pointer px-2 py-[3px] rounded-md inline-flex items-center gap-1.5"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
              background: 'var(--accent-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {refTarget.tableName}.{refTarget.columnName}
          </button>
        )}
      </td>

      {/* Note */}
      <td className="px-5 py-3 max-w-[240px]">
        {column.note && (
          <span
            className="text-[11px] leading-relaxed block overflow-hidden text-ellipsis"
            style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
            title={column.note}
          >
            {column.note}
          </span>
        )}
      </td>
    </tr>
  );
}

function KeyIcon({ variant }: { variant: 'pk' | 'fk' }) {
  const color = variant === 'pk' ? 'var(--warning)' : 'var(--accent)';
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function Badge({ label, variant }: { label: string; variant: 'warning' | 'accent' | 'success' }) {
  const styles = {
    warning: { bg: 'var(--warning-muted)', fg: 'var(--warning)' },
    accent: { bg: 'var(--accent-muted)', fg: 'var(--accent)' },
    success: { bg: 'var(--success-muted)', fg: 'var(--success)' },
  };
  const s = styles[variant];
  return (
    <span
      className="px-1.5 py-[2px] rounded-md text-[8px] font-bold tracking-wider flex-shrink-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {label}
    </span>
  );
}

function Tag({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className="px-1.5 py-[2px] rounded-md text-[10px] font-medium"
      style={{
        background: highlight ? 'var(--accent-muted)' : 'var(--bg-surface)',
        color: highlight ? 'var(--accent)' : 'var(--text-muted)',
        border: `1px solid ${highlight ? 'transparent' : 'var(--border-color)'}`,
      }}
    >
      {label}
    </span>
  );
}
