import AppLayout from '../components/Layout/AppLayout.tsx';
import Toolbar from '../components/Layout/Toolbar.tsx';
import DBMLEditor from '../components/Editor/DBMLEditor.tsx';
import ERDCanvas from '../components/Canvas/ERDCanvas.tsx';
import TableList from '../components/Sidebar/TableList.tsx';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';

export default function EditorPage() {
  useDebouncedParse();

  return (
    <AppLayout
      toolbar={<Toolbar />}
      editor={<DBMLEditor />}
      canvas={<ERDCanvas />}
      sidebar={<TableList />}
    />
  );
}
