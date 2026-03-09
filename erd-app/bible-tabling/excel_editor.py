"""
바이블테이블링 — Excel 편집 엔진 (openpyxl 기반)

핵심 기능:
- 게임 데이터 xlsx 파일 읽기/편집
- AI가 편집한 셀은 노란색(#FFFF00) 하이라이트
- 필터 조건으로 대상 행 선택
- set/multiply/add/subtract/append 변경 액션
"""

import shutil
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import PatternFill

# ── AI 편집 표시용 노란색 하이라이트 ──
AI_HIGHLIGHT = PatternFill(start_color='FFFFFF00', end_color='FFFFFF00', fill_type='solid')

# ── 메타 시트 (편집 대상에서 제외) ──
META_SHEET_NAMES = {'define', 'enum', 'tablegroup', 'ref', 'tabledefine', 'sheet1'}


class BibleTablingEditor:
    """게임 데이터 Excel 편집기"""

    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            raise ValueError(f"데이터 디렉토리가 없습니다: {data_dir}")

    # ── 테이블 목록 ──────────────────────────────────────────────────────────

    def list_tables(self) -> list[dict]:
        """사용 가능한 테이블 목록 반환"""
        tables = []
        for xlsx_path in sorted(self.data_dir.glob("*.xlsx")):
            if xlsx_path.name.startswith("~$"):
                continue
            try:
                wb = load_workbook(xlsx_path, read_only=True, data_only=True)
                for sheet_name in wb.sheetnames:
                    if sheet_name.lower() in META_SHEET_NAMES:
                        continue
                    if '#' in sheet_name:
                        continue
                    ws = wb[sheet_name]
                    # 헤더 행 찾기
                    headers = []
                    for row in ws.iter_rows(max_row=3, values_only=True):
                        non_empty = [str(c) for c in row if c is not None]
                        if len(non_empty) > len(headers):
                            headers = non_empty
                    row_count = ws.max_row - 1 if ws.max_row else 0
                    tables.append({
                        "table": sheet_name,
                        "file": xlsx_path.name,
                        "columns": headers[:20],
                        "row_count": max(0, row_count),
                    })
                wb.close()
            except Exception:
                continue
        return tables

    # ── 파일 탐색 ────────────────────────────────────────────────────────────

    def _find_xlsx_file(self, table: str, file_hint: str = None) -> Path:
        """테이블 이름으로 xlsx 파일 찾기"""
        # 1) 힌트 파일명으로 직접 탐색
        if file_hint:
            path = self.data_dir / file_hint
            if path.exists():
                return path

        # 2) 테이블명 == 파일명
        for xlsx_path in self.data_dir.glob("*.xlsx"):
            if xlsx_path.name.startswith("~$"):
                continue
            if xlsx_path.stem.lower() == table.lower():
                return xlsx_path

        # 3) 파일 안의 시트 이름으로 탐색
        for xlsx_path in self.data_dir.glob("*.xlsx"):
            if xlsx_path.name.startswith("~$"):
                continue
            try:
                wb = load_workbook(xlsx_path, read_only=True)
                sheet_names = [sn.lower() for sn in wb.sheetnames]
                wb.close()
                if table.lower() in sheet_names:
                    return xlsx_path
            except Exception:
                continue

        raise FileNotFoundError(f"테이블 '{table}'에 해당하는 xlsx 파일을 찾을 수 없습니다.")

    # ── 헤더 파싱 ────────────────────────────────────────────────────────────

    def _find_header_row(self, ws) -> int:
        """헤더 행 인덱스 찾기 (1-based)"""
        best_idx = 1
        best_count = 0
        for row_idx in range(1, min(5, ws.max_row + 1)):
            count = sum(
                1 for cell in ws[row_idx]
                if cell.value is not None and str(cell.value).strip()
            )
            if count > best_count:
                best_count = count
                best_idx = row_idx
        return best_idx

    def _get_header_map(self, ws, header_row: int) -> dict[str, int]:
        """헤더명 → 컬럼 인덱스 매핑 (1-based)"""
        header_map = {}
        for cell in ws[header_row]:
            if cell.value is not None:
                name = str(cell.value).strip()
                if name:
                    header_map[name.lower()] = cell.column
                    header_map[name] = cell.column  # 원본 케이스도 등록
        return header_map

    # ── 필터 매칭 ────────────────────────────────────────────────────────────

    @staticmethod
    def _matches_filter(cell_value, filter_cond) -> bool:
        """셀 값이 필터 조건에 매치하는지 확인"""
        val = str(cell_value).strip() if cell_value is not None else ''
        op = filter_cond.op.lower()

        if op == 'eq':
            return val.lower() == str(filter_cond.value).lower()
        elif op == 'neq':
            return val.lower() != str(filter_cond.value).lower()
        elif op == 'in':
            target_values = filter_cond.values or (
                [str(filter_cond.value)] if filter_cond.value else []
            )
            return val.lower() in [str(v).lower() for v in target_values]
        elif op == 'contains':
            return str(filter_cond.value).lower() in val.lower()
        elif op == 'starts_with':
            return val.lower().startswith(str(filter_cond.value).lower())
        elif op == 'ends_with':
            return val.lower().endswith(str(filter_cond.value).lower())
        elif op in ('gt', 'gte', 'lt', 'lte'):
            try:
                num_val = float(val)
                num_target = float(filter_cond.value)
                if op == 'gt': return num_val > num_target
                if op == 'gte': return num_val >= num_target
                if op == 'lt': return num_val < num_target
                if op == 'lte': return num_val <= num_target
            except (ValueError, TypeError):
                return False

        return False

    # ── 셀 변경 적용 ────────────────────────────────────────────────────────

    @staticmethod
    def _apply_change(cell, change) -> bool:
        """셀에 변경 적용 + 노란색 하이라이트. 성공 시 True."""
        action = change.action.lower()
        old_value = cell.value

        if action == 'set':
            # 숫자처럼 보이면 숫자로 저장
            try:
                v = float(change.value)
                cell.value = int(v) if v == int(v) else round(v, 4)
            except (ValueError, TypeError):
                cell.value = change.value
        elif action in ('multiply', 'add', 'subtract'):
            try:
                current = float(old_value) if old_value is not None else 0
                factor = float(change.value)
                if action == 'multiply':
                    new_val = current * factor
                elif action == 'add':
                    new_val = current + factor
                else:  # subtract
                    new_val = current - factor

                # 정수면 정수, 아니면 소수점 4자리
                cell.value = int(new_val) if new_val == int(new_val) else round(new_val, 4)
            except (ValueError, TypeError):
                return False
        elif action == 'append':
            current = str(old_value) if old_value is not None else ''
            cell.value = current + str(change.value)
        else:
            return False

        # ── 노란색 하이라이트 적용 ──
        cell.fill = AI_HIGHLIGHT
        return True

    # ── 단일 테이블 편집 ─────────────────────────────────────────────────────

    def apply_edit(self, edit, output_dir: Path, prev_job_dir: Path = None) -> dict:
        """
        단일 테이블 편집 실행.
        같은 job 내에서 같은 파일이 여러 번 편집되면 이어서 수정.
        prev_job_dir가 있으면 이전 job의 출력 파일을 기반으로 편집 (변경사항 누적).
        """
        xlsx_path = self._find_xlsx_file(edit.table, edit.file)
        sheet_name = edit.sheet or edit.table

        # 출력 파일 결정 순서:
        # 1) 이미 현재 job에서 편집된 파일 (같은 job 내 연속 편집)
        # 2) 이전 job의 출력 파일 (prev_job_dir)
        # 3) 원본 git repo 파일
        output_path = output_dir / xlsx_path.name
        if not output_path.exists():
            prev_path = prev_job_dir / xlsx_path.name if prev_job_dir else None
            if prev_path and prev_path.exists():
                shutil.copy2(prev_path, output_path)
            else:
                shutil.copy2(xlsx_path, output_path)

        wb = load_workbook(output_path)

        # 시트 찾기 (대소문자 무시)
        ws = None
        for sn in wb.sheetnames:
            if sn.lower() == sheet_name.lower():
                ws = wb[sn]
                break

        if ws is None:
            wb.close()
            raise ValueError(
                f"시트 '{sheet_name}'을 찾을 수 없습니다. "
                f"(파일: {xlsx_path.name}, 시트 목록: {wb.sheetnames})"
            )

        header_row = self._find_header_row(ws)
        header_map = self._get_header_map(ws, header_row)

        # ── 필터링된 행 찾기 ──
        matched_rows = []
        for row_idx in range(header_row + 1, ws.max_row + 1):
            # 빈 행 스킵 (첫 번째 셀이 비어있으면)
            first_cell = ws.cell(row=row_idx, column=1).value
            if first_cell is None:
                continue

            all_match = True
            for f in edit.filters:
                col_idx = header_map.get(f.column) or header_map.get(f.column.lower())
                if col_idx is None:
                    all_match = False
                    break
                cell_value = ws.cell(row=row_idx, column=col_idx).value
                if not self._matches_filter(cell_value, f):
                    all_match = False
                    break

            if all_match:
                matched_rows.append(row_idx)

        # ── 변경 적용 ──
        cells_modified = 0
        change_details = []

        for row_idx in matched_rows:
            for change in edit.changes:
                col_idx = header_map.get(change.column) or header_map.get(change.column.lower())
                if col_idx is None:
                    continue

                cell = ws.cell(row=row_idx, column=col_idx)
                old_val = cell.value

                if self._apply_change(cell, change):
                    cells_modified += 1
                    # PK 컬럼 값도 함께 기록 (어떤 행인지 식별용)
                    pk_val = ws.cell(row=row_idx, column=1).value
                    change_details.append({
                        "row": row_idx,
                        "pk": str(pk_val) if pk_val is not None else "",
                        "column": change.column,
                        "old": str(old_val) if old_val is not None else "",
                        "new": str(cell.value),
                    })

        wb.save(output_path)
        wb.close()

        return {
            "table": edit.table,
            "file": xlsx_path.name,
            "sheet": sheet_name,
            "rows_matched": len(matched_rows),
            "cells_modified": cells_modified,
            "changes": change_details[:100],  # 상세 내역 (최대 100건)
        }

    # ── 행 추가 ──────────────────────────────────────────────────────────────

    def add_rows(self, table: str, file_hint: str, sheet_hint: str,
                 rows: list[dict], output_dir: Path, prev_job_dir: Path = None) -> dict:
        """테이블에 새 행 추가 (노란색 하이라이트)"""
        xlsx_path = self._find_xlsx_file(table, file_hint)
        sheet_name = sheet_hint or table

        output_path = output_dir / xlsx_path.name
        if not output_path.exists():
            prev_path = prev_job_dir / xlsx_path.name if prev_job_dir else None
            if prev_path and prev_path.exists():
                shutil.copy2(prev_path, output_path)
            else:
                shutil.copy2(xlsx_path, output_path)

        wb = load_workbook(output_path)
        ws = None
        for sn in wb.sheetnames:
            if sn.lower() == sheet_name.lower():
                ws = wb[sn]
                break

        if ws is None:
            wb.close()
            raise ValueError(f"시트 '{sheet_name}'을 찾을 수 없습니다.")

        header_row = self._find_header_row(ws)
        header_map = self._get_header_map(ws, header_row)

        rows_added = 0
        next_row = ws.max_row + 1

        for row_data in rows:
            for col_name, value in row_data.items():
                col_idx = header_map.get(col_name) or header_map.get(col_name.lower())
                if col_idx is None:
                    continue
                cell = ws.cell(row=next_row, column=col_idx, value=value)
                cell.fill = AI_HIGHLIGHT
            next_row += 1
            rows_added += 1

        wb.save(output_path)
        wb.close()

        return {
            "table": table,
            "file": xlsx_path.name,
            "rows_added": rows_added,
        }
