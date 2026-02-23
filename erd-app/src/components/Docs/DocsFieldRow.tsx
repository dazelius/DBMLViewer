import type { SchemaColumn } from '../../core/schema/types.ts';

interface DocsFieldRowProps {
  column: SchemaColumn;
  onRefClick?: (tableId: string) => void;
  refTarget?: { tableId: string; tableName: string; columnName: string } | null;
}

export default function DocsFieldRow({ column, onRefClick, refTarget }: DocsFieldRowProps) {
  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border-color)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Name + Badges */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {column.name}
          </span>
          {column.isPrimaryKey && <Badge label="PK" bg="rgba(250,179,135,0.15)" fg="var(--warning)" />}
          {column.isForeignKey && <Badge label="FK" bg="rgba(137,180,250,0.15)" fg="var(--accent)" />}
          {column.isUnique && <Badge label="UQ" bg="rgba(166,227,161,0.15)" fg="var(--success)" />}
        </div>
      </td>

      {/* Type */}
      <td className="px-5 py-3.5">
        <code
          className="text-[11px] px-2 py-1 rounded font-mono inline-block"
          style={{ background: 'var(--bg-surface)', color: 'var(--accent)' }}
        >
          {column.type}
        </code>
      </td>

      {/* Constraints */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {column.isNotNull && <Tag label="NOT NULL" />}
          {column.isIncrement && <Tag label="AUTO INC" />}
          {column.defaultValue && <Tag label={`= ${column.defaultValue}`} />}
        </div>
      </td>

      {/* References */}
      <td className="px-5 py-3.5">
        {refTarget && (
          <button
            onClick={() => onRefClick?.(refTarget.tableId)}
            className="font-mono text-[11px] cursor-pointer transition-all px-2 py-1 rounded"
            style={{ color: 'var(--accent)', background: 'rgba(137,180,250,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(137,180,250,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(137,180,250,0.1)'; }}
          >
            {refTarget.tableName}.{refTarget.columnName}
          </button>
        )}
      </td>

      {/* Note */}
      <td className="px-5 py-3.5 max-w-[200px]">
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

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide flex-shrink-0"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
    >
      {label}
    </span>
  );
}
