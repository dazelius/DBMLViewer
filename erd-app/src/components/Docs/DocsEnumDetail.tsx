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
      <div className="p-8">
        <p style={{ color: 'var(--text-muted)' }}>Enum not found: {enumName}</p>
      </div>
    );
  }

  return (
    <div className="p-10 docs-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(137,180,250,0.15)', color: 'var(--accent)', border: '1px solid rgba(137,180,250,0.3)' }}
          >
            Enum
          </span>
          {enumDef.schema && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{enumDef.schema}</span>
          )}
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{enumDef.name}</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Values
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            {enumDef.values.length}
          </span>
        </h2>
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-4 py-2 text-xs font-semibold w-8" style={{ color: 'var(--text-muted)' }}>#</th>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Value</th>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {enumDef.values.map((val, i) => (
                <tr
                  key={val.name}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  className="transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {val.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {val.note && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{val.note}</span>
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
