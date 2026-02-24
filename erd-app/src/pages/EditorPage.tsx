import AppLayout from '../components/Layout/AppLayout.tsx';
import Toolbar from '../components/Layout/Toolbar.tsx';
import DBMLEditor from '../components/Editor/DBMLEditor.tsx';
import ERDCanvas from '../components/Canvas/ERDCanvas.tsx';
import ERDCanvasTools from '../components/Canvas/ERDCanvasTools.tsx';
import ExplorePanel from '../components/Canvas/ExplorePanel.tsx';
import TableList from '../components/Sidebar/TableList.tsx';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';

function CanvasWithExplore() {
  return (
    <div className="relative w-full h-full">
      <ERDCanvas />
      <ExplorePanel />
      <ERDCanvasTools />
    </div>
  );
}

export default function EditorPage() {
  useDebouncedParse();

  return (
    <AppLayout
      toolbar={<Toolbar />}
      editor={<DBMLEditor />}
      canvas={<CanvasWithExplore />}
      sidebar={<TableList />}
    />
  );
}
