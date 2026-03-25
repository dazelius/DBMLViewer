import { useEffect, useRef } from 'react';
import { gitSync, gitStatus, gitLoadFiles } from '../core/import/gitlabService.ts';
import { useEditorStore } from '../store/useEditorStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { useSyncStore } from '../store/useSyncStore.ts';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { runAnomalyDetection } from '../core/ai/anomalyDetector.ts';
import { runValidation, fetchRulesFromServer } from '../core/ai/validationEngine.ts';

const SCHEMA_PATH = 'GameData/DataDefine';
const DATA_PATH = 'GameData/Data';
const BRANCH = 'develop';

async function loadAndApplyFiles() {
  const schemaFiles = await gitLoadFiles(SCHEMA_PATH);
  const dataFiles = await gitLoadFiles(DATA_PATH).catch(() => [] as { name: string; data: ArrayBuffer }[]);
  const allFiles = [...schemaFiles, ...dataFiles];
  if (allFiles.length === 0) return 0;

  const { excelFilesToDbml } = await import('../core/import/excelToDbml.ts');
  const result = excelFilesToDbml(allFiles);
  useEditorStore.getState().setDbmlText(result.dbml);
  if (result.dataRowCounts.size > 0) useCanvasStore.getState().setHeatmapData(result.dataRowCounts);
  if (result.dataSheets.size > 0) {
    useCanvasStore.getState().setTableData(result.dataSheets);
    // 백그라운드 이상치 탐지 (데이터 로드 완료 후 비동기)
    setTimeout(() => {
      const schema = useSchemaStore.getState().schema;
      const report = runAnomalyDetection(result.dataSheets, schema);
      useCanvasStore.getState().setAnomalyReport(report);

      // 서버에서 룰 로드 + 유효성 검증 실행
      fetchRulesFromServer().then(rules => {
        if (rules.length > 0) {
          const vResult = runValidation(result.dataSheets, rules);
          useCanvasStore.getState().setValidationResult(vResult);
        }
      }).catch(() => {});
    }, 500);
  }
  return allFiles.length;
}

export function useAutoLoad() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { setSyncing, setDone, setError } = useSyncStore.getState();
    const { setRepo2Syncing, setRepo2Done, setRepo2Error } = useSyncStore.getState();

    (async () => {
      try {
        // 이미 클론된 데이터가 있으면 즉시 로드 (sync 안 기다림)
        const status = await gitStatus().catch(() => null);
        if (status?.cloned) {
          await loadAndApplyFiles().catch(() => 0);
        }

        // 백그라운드 sync 시작
        setSyncing();
        setRepo2Syncing();

        const doAegisSync = () => fetch('/api/git/sync?repo=aegis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: BRANCH }),
        }).catch(() => null);

        const [syncResult, aegisResp] = await Promise.all([
          gitSync(undefined, undefined, BRANCH),
          doAegisSync(),
        ]);
        setDone(syncResult.status, syncResult.commit ?? '');

        // index.lock 오류 시 자동 재시도 (서버가 lock 정리 후 재시도)
        let finalAegisResp = aegisResp;
        if (finalAegisResp && !finalAegisResp.ok) {
          try {
            const body = await finalAegisResp.clone().json() as { detail?: string };
            if (body.detail?.includes('index.lock')) {
              console.warn('[AutoSync] aegis index.lock — 3초 후 재시도');
              await new Promise(r => setTimeout(r, 3000));
              finalAegisResp = await doAegisSync();
            }
          } catch { /* ignore parse error */ }
        }

        if (finalAegisResp && finalAegisResp.ok) {
          try {
            const aegisData = await finalAegisResp.json() as { status?: string; commit?: string; branch?: string };
            // 202 syncing 응답도 정상 처리 (백그라운드에서 sync 진행 중)
            const r2status = (aegisData.status === 'syncing' ? 'up-to-date' : aegisData.status as 'cloned' | 'updated' | 'up-to-date') ?? 'up-to-date';
            setRepo2Done(r2status, aegisData.commit ?? '', aegisData.branch ?? BRANCH);
          } catch {
            setRepo2Error('응답 파싱 실패');
          }
        } else {
          let errDetail = finalAegisResp ? `HTTP ${finalAegisResp.status}` : '연결 실패';
          if (finalAegisResp && !finalAegisResp.ok) {
            try {
              const errData = await finalAegisResp.json() as { error?: string; detail?: string; hint?: string };
              errDetail = errData.detail || errData.hint || errData.error || errDetail;
              console.warn('[AutoSync] aegis sync error:', errData);
            } catch { /* ignore parse error */ }
          }
          setRepo2Error(errDetail);
        }

        // sync 후 변경이 있으면 다시 로드
        if (syncResult.status === 'cloned' || syncResult.status === 'updated') {
          await loadAndApplyFiles();
        } else if (!status?.cloned) {
          // 처음에 클론 안 되어 있었던 경우 (초기 클론 완료 후 로드)
          await loadAndApplyFiles();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        console.warn('[AutoSync] failed:', err);
      }
    })();
  }, []);
}
