import Toolbar from '../components/Layout/Toolbar.tsx';
import DiffLayout from '../components/Diff/DiffLayout.tsx';

export default function DiffPage() {
  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <DiffLayout />
    </div>
  );
}
