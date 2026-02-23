import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import Toolbar from '../components/Layout/Toolbar.tsx';
import ValidationLayout from '../components/Validation/ValidationLayout.tsx';

export default function ValidationPage() {
  useDebouncedParse();

  return (
    <div className="flex flex-col h-screen w-screen" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <ValidationLayout />
    </div>
  );
}
