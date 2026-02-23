import { useParams } from 'react-router-dom';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import DocsLayout from '../components/Docs/DocsLayout.tsx';

export default function DocsPage() {
  useDebouncedParse();
  const { tableId, enumName } = useParams();

  return <DocsLayout activeTableId={tableId ?? null} activeEnumName={enumName ?? null} />;
}
