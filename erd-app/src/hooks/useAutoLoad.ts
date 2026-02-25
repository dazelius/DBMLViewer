import { useEffect, useRef } from 'react';
import { gitSync, gitLoadFiles } from '../core/import/gitlabService.ts';
import { excelFilesToDbml } from '../core/import/excelToDbml.ts';
import { useEditorStore } from '../store/useEditorStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { useSyncStore } from '../store/useSyncStore.ts';

const SCHEMA_PATH = 'GameData/DataDefine';
const DATA_PATH = 'GameData/Data';
const BRANCH = 'develop';

export function useAutoLoad() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { setSyncing, setDone, setError } = useSyncStore.getState();

    (async () => {
      try {
        setSyncing();

        // 1) git sync - aegisdata (데이터 저장소) + aegis (코드 저장소) 병렬 sync
        const [syncResult] = await Promise.all([
          gitSync(undefined, undefined, BRANCH),
          // aegis 코드 저장소도 sync (데이터는 로드하지 않음, git log/diff용)
          fetch('/api/git/sync?repo=aegis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch: BRANCH }),
          }).catch(() => null), // 실패해도 무시 (repo2 미설정 시 정상)
        ]);
        setDone(syncResult.status, syncResult.commit ?? '');

        // 2) Load schema + data files
        const schemaFiles = await gitLoadFiles(SCHEMA_PATH);
        const dataFiles = await gitLoadFiles(DATA_PATH).catch(() => [] as { name: string; data: ArrayBuffer }[]);

        const allFiles = [...schemaFiles, ...dataFiles];
        if (allFiles.length === 0) return;

        const result = excelFilesToDbml(allFiles);

        useEditorStore.getState().setDbmlText(result.dbml);

        if (result.dataRowCounts.size > 0) {
          useCanvasStore.getState().setHeatmapData(result.dataRowCounts);
        }
        if (result.dataSheets.size > 0) {
          useCanvasStore.getState().setTableData(result.dataSheets);
        }

        console.log(`[AutoSync] ${syncResult.status} — ${allFiles.length} files loaded (${syncResult.commit})`);
      } catch (err: any) {
        setError(err?.message ?? String(err));
        console.warn('[AutoSync] failed:', err);
      }
    })();
  }, []);
}
