import { useParams } from 'react-router-dom';
import Toolbar from '../components/Layout/Toolbar.tsx';
import DocsLayout from '../components/Docs/DocsLayout.tsx';

export default function DocsPage() {
  const { tableId, enumName } = useParams<{ tableId?: string; enumName?: string }>();

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <DocsLayout activeTableId={tableId ?? null} activeEnumName={enumName ?? null} />
    </div>
  );
}
