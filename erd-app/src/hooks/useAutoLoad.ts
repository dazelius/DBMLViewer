import { useEffect, useRef } from 'react';
import { gitStatus, gitLoadFiles } from '../core/import/gitlabService.ts';
import { excelFilesToDbml } from '../core/import/excelToDbml.ts';
import { useEditorStore } from '../store/useEditorStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';

const SCHEMA_PATH = 'GameData/DataDefine';
const DATA_PATH = 'GameData/Data';

export function useAutoLoad() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // If heatmap/table data already exists in memory, skip
    const { heatmapData, tableData } = useCanvasStore.getState();
    if (heatmapData.size > 0 && tableData.size > 0) return;

    (async () => {
      try {
        const status = await gitStatus();
        if (!status.cloned) return;

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

        console.log(`[AutoLoad] Loaded ${allFiles.length} files from git (${status.commit})`);
      } catch {
        // Git repo not available, skip auto-load
      }
    })();
  }, []);
}
