import { useSchemaStore } from '../../store/useSchemaStore.ts';

interface DocsEnumDetailProps {
  enumName: string;
}

export default function DocsEnumDetail({ enumName }: DocsEnumDetailProps) {
  const schema = useSchemaStore((s) => s.schema);
  if (!schema) return null;

  const enumDef = schema.enums.find((e) => e.name === enumName);
  if (!enumDef) {
    return (
      <div className="p-10">
        <p style={{ color: 'var(--text-muted)' }}>Enum not found: {enumName}</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 docs-fade-in" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent)20' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Enum
          </span>
          {enumDef.schema && (
            <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              {enumDef.schema}
            </span>
          )}
        </div>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {enumDef.name}
        </h1>

        <div className="flex items-center gap-2 mt-4">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            {enumDef.values.length} value{enumDef.values.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Values
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-bold tabular-nums"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          >
            {enumDef.values.length}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider w-16" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}>#</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}>Value</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {enumDef.values.map((val, i) => (
                <tr
                  key={val.name}
                  style={{
                    borderBottom: i < enumDef.values.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {val.name}
                    </code>
                  </td>
                  <td className="px-5 py-3.5">
                    {val.note && (
                      <span className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{val.note}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
