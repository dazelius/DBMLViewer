"""
바이블테이블링 (Bible Tabling) — Python Backend

게임 데이터 Excel 편집 서비스.
AI 챗봇이 ERD를 참고하여 구조화된 편집 명령을 보내면,
openpyxl로 Excel을 편집하고 노란색 하이라이트를 적용한 뒤
다운로드 링크를 제공합니다.

실행:
  cd C:\\TableMaster\\DBMLViewer\\erd-app\\bible-tabling
  pip install -r requirements.txt
  python main.py
"""

import os
import uuid
import shutil
import time
import json
from pathlib import Path
from typing import Optional, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import uvicorn

from excel_editor import BibleTablingEditor

# ── 설정 ──────────────────────────────────────────────────────────────────────

GIT_REPO_DATA_DIR = os.environ.get(
    'GIT_REPO_DATA_DIR',
    r'C:\TableMaster\DBMLViewer\erd-app\.git-repo\GameData\Data'
)
DOWNLOADS_DIR = Path(__file__).parent / 'downloads'
DOWNLOADS_DIR.mkdir(exist_ok=True)

PORT = int(os.environ.get('BIBLE_TABLING_PORT', '8100'))


# ── 오래된 다운로드 정리 (1시간 이상) ─────────────────────────────────────────

def cleanup_old_downloads():
    cutoff = time.time() - 3600
    for p in DOWNLOADS_DIR.iterdir():
        try:
            if p.stat().st_mtime < cutoff:
                if p.is_file():
                    p.unlink()
                elif p.is_dir():
                    shutil.rmtree(p)
        except Exception:
            pass


# ── Pydantic 모델 ─────────────────────────────────────────────────────────────

class FilterCondition(BaseModel):
    column: str
    op: str  # eq, neq, gt, gte, lt, lte, in, contains, starts_with, ends_with
    value: Optional[str] = None
    values: Optional[list[str]] = None


class CellChange(BaseModel):
    column: str
    action: str  # set, multiply, add, subtract, append
    value: str | float | int


class TableEdit(BaseModel):
    order: int = 0
    table: str
    file: Optional[str] = None   # 없으면 {table}.xlsx
    sheet: Optional[str] = None  # 없으면 table 이름
    filters: list[FilterCondition] = []
    changes: list[CellChange] = []


class EditRequest(BaseModel):
    session_id: Optional[str] = None
    title: str = "바이블테이블링"
    reason: str = ""
    edit_plan: list[TableEdit]


class AddRowRequest(BaseModel):
    session_id: Optional[str] = None
    title: str = "바이블테이블링 — 행 추가"
    reason: str = ""
    table: str
    file: Optional[str] = None
    sheet: Optional[str] = None
    rows: list[dict]  # [{column: value}, ...]

    @field_validator('rows', mode='before')
    @classmethod
    def parse_rows(cls, v: Any) -> list:
        """rows가 JSON 문자열로 넘어오는 경우 파싱 (AI 직렬화 오류 대응)"""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
        return v


# ── FastAPI 앱 ─────────────────────────────────────────────────────────────────

app = FastAPI(title="바이블테이블링 API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
}


@app.exception_handler(HTTPException)
async def http_exception_cors_handler(request: Request, exc: HTTPException):
    """HTTPException 에러 응답에도 CORS 헤더 보장 (브라우저 fetch 오류 방지)"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=CORS_HEADERS,
    )


@app.exception_handler(Exception)
async def generic_exception_cors_handler(request: Request, exc: Exception):
    """예상치 못한 서버 오류에도 CORS 헤더 보장"""
    return JSONResponse(
        status_code=500,
        content={"detail": f"서버 오류: {str(exc)}"},
        headers=CORS_HEADERS,
    )


editor = BibleTablingEditor(GIT_REPO_DATA_DIR)


# ── POST /api/bible-tabling/edit ─ 데이터 편집 ───────────────────────────────

@app.post("/api/bible-tabling/edit")
async def edit_data(req: EditRequest):
    """
    게임 데이터 Excel 편집.
    edit_plan의 order 순서대로 상위 테이블부터 편집.
    편집된 셀은 노란색 하이라이트.
    """
    cleanup_old_downloads()

    job_id = str(uuid.uuid4())[:8]
    job_dir = DOWNLOADS_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    try:
        # order 순서로 정렬 (부모 테이블 먼저)
        sorted_edits = sorted(req.edit_plan, key=lambda e: e.order)

        results = []
        for edit in sorted_edits:
            result = editor.apply_edit(edit, job_dir)
            results.append(result)

        # 다운로드 URL 결정
        edited_files = list(job_dir.glob("*.xlsx"))
        if len(edited_files) > 1:
            zip_name = f"{job_id}.zip"
            shutil.make_archive(str((DOWNLOADS_DIR / job_id)), 'zip', job_dir)
            download_url = f"/api/bible-tabling/download/{zip_name}"
            download_filename = f"bible_tabling_{job_id}.zip"
        elif len(edited_files) == 1:
            download_url = f"/api/bible-tabling/download/{job_id}/{edited_files[0].name}"
            download_filename = edited_files[0].name
        else:
            raise HTTPException(400, "편집된 파일이 없습니다.")

        total_cells = sum(r.get('cells_modified', 0) for r in results)
        total_rows = sum(r.get('rows_matched', 0) for r in results)

        return {
            "success": True,
            "job_id": job_id,
            "download_url": download_url,
            "download_filename": download_filename,
            "summary": {
                "title": req.title,
                "reason": req.reason,
                "files_modified": len(edited_files),
                "total_rows_matched": total_rows,
                "total_cells_modified": total_cells,
                "tables": [r['table'] for r in results],
                "details": results,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(500, f"편집 실패: {str(e)}")


# ── POST /api/bible-tabling/add-rows ─ 행 추가 ──────────────────────────────

@app.post("/api/bible-tabling/add-rows")
async def add_rows(req: AddRowRequest):
    """테이블에 새 행 추가 (노란색 하이라이트)"""
    cleanup_old_downloads()

    job_id = str(uuid.uuid4())[:8]
    job_dir = DOWNLOADS_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    try:
        result = editor.add_rows(
            req.table, req.file, req.sheet, req.rows, job_dir
        )
        edited_files = list(job_dir.glob("*.xlsx"))
        if not edited_files:
            raise HTTPException(400, "추가된 데이터가 없습니다.")

        download_url = f"/api/bible-tabling/download/{job_id}/{edited_files[0].name}"

        return {
            "success": True,
            "job_id": job_id,
            "download_url": download_url,
            "download_filename": edited_files[0].name,
            "summary": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(500, f"행 추가 실패: {str(e)}")


# ── GET /api/bible-tabling/download/{path} ─ 파일 다운로드 ───────────────────

@app.get("/api/bible-tabling/download/{path:path}")
async def download_file(path: str):
    """편집된 파일 다운로드"""
    file_path = DOWNLOADS_DIR / path
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(404, "파일을 찾을 수 없습니다. (만료되었을 수 있음)")

    if path.endswith('.zip'):
        media_type = "application/zip"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return FileResponse(file_path, media_type=media_type, filename=file_path.name)


# ── POST /api/bible-tabling/zip-jobs ─ 여러 job 합쳐서 ZIP ──────────────────

class ZipJobsRequest(BaseModel):
    job_ids: list[str]

@app.post("/api/bible-tabling/zip-jobs")
async def zip_jobs(req: ZipJobsRequest):
    """
    여러 job의 파일을 하나의 ZIP으로 묶어서 반환.
    같은 파일명이 여러 job에 있으면 가장 최신 job(목록 뒤쪽)의 파일을 사용.
    """
    if not req.job_ids:
        raise HTTPException(400, "job_ids가 비어있습니다.")

    # 각 job에서 파일 수집 (뒤쪽 job이 최신이므로 나중에 덮어씀)
    merged: dict[str, Path] = {}
    for job_id in req.job_ids:
        job_dir = DOWNLOADS_DIR / job_id
        if not job_dir.exists() or not job_dir.is_dir():
            continue
        for f in job_dir.glob("*.xlsx"):
            merged[f.name] = f

    if not merged:
        raise HTTPException(404, "유효한 job 파일을 찾을 수 없습니다. (만료되었을 수 있음)")

    # 임시 디렉토리에 합쳐서 ZIP 생성
    session_id = str(uuid.uuid4())[:8]
    session_dir = DOWNLOADS_DIR / f"session_{session_id}"
    session_dir.mkdir(exist_ok=True)

    try:
        for fname, fpath in merged.items():
            shutil.copy2(fpath, session_dir / fname)

        zip_base = str(DOWNLOADS_DIR / f"session_{session_id}")
        shutil.make_archive(zip_base, 'zip', session_dir)
        zip_path = Path(f"{zip_base}.zip")

        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=f"vibe_tabling_session_{session_id}.zip"
        )
    finally:
        if session_dir.exists():
            shutil.rmtree(session_dir, ignore_errors=True)


# ── GET /api/bible-tabling/tables ─ 테이블 목록 ─────────────────────────────

@app.get("/api/bible-tabling/tables")
async def list_tables():
    """사용 가능한 게임 데이터 테이블 목록"""
    tables = editor.list_tables()
    return {"count": len(tables), "tables": tables}


# ── GET /api/bible-tabling/health ─ 상태 확인 ───────────────────────────────

@app.get("/api/bible-tabling/health")
async def health():
    return {
        "status": "ok",
        "data_dir": str(GIT_REPO_DATA_DIR),
        "data_dir_exists": Path(GIT_REPO_DATA_DIR).exists(),
    }


# ── 서버 시작 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    print(f"""
+--------------------------------------------------------------+
|  [바이블테이블링 (Bible Tabling) 서버]                        |
|                                                              |
|  데이터: {str(GIT_REPO_DATA_DIR)[:48].ljust(48)}|
|  포트: {str(PORT).ljust(51)}|
|                                                              |
|  API:                                                        |
|  POST /api/bible-tabling/edit      - 데이터 편집             |
|  POST /api/bible-tabling/add-rows  - 행 추가                 |
|  GET  /api/bible-tabling/tables    - 테이블 목록             |
|  GET  /api/bible-tabling/download/ - 파일 다운로드           |
|                                                              |
|  종료: Ctrl+C                                                |
+--------------------------------------------------------------+
    """)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
