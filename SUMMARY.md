# DBMLViewer (TableMaster) 앱 요약

## 개요

DBML(Database Markup Language) 스키마를 작성하고 ERD(Entity Relationship Diagram)로 시각화하는 웹 기반 도구입니다.
코드명은 **TableMaster**이며, DBML 편집 → ERD 자동 렌더링을 핵심으로 하고 AI 분석, Excel 임포트, 스키마 비교 등 다양한 부가 기능을 갖추고 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 7 |
| 스타일링 | TailwindCSS 4 |
| 상태 관리 | Zustand 5 |
| 코드 에디터 | Monaco Editor (`@monaco-editor/react`) |
| DBML 파싱 | `@dbml/core` |
| ERD 레이아웃 | `@dagrejs/dagre` (자동 그래프 배치) |
| 라우팅 | React Router DOM 7 |
| Excel 처리 | `xlsx` |

---

## 페이지 구성

```
/editor      — 메인 편집 화면 (DBML 에디터 + ERD 캔버스)
/docs        — 테이블·Enum 문서 자동 생성 뷰어
/docs/:tableId
/docs/enum/:enumName
/diff        — 스키마 변경 비교(Diff) 화면
/validation  — 스키마 유효성 검사 화면
/guide       — DBML 문법 가이드
```

---

## 주요 기능

### 1. DBML 에디터
- Monaco Editor 기반의 실시간 DBML 편집 환경
- 디바운스 파싱으로 타이핑 중 과도한 재파싱 방지

### 2. ERD 캔버스
- Dagre 알고리즘을 이용한 자동 레이아웃
- 탐색 패널(`ExplorePanel`), 캔버스 도구(`ERDCanvasTools`) 내장
- 사이드바에 테이블 목록(`TableList`) 표시

### 3. AI 스키마 분석 (Claude API)
- Claude Sonnet 모델(`claude-sonnet-4-20250514`)을 호출
- 스키마 구조를 분석하여 **구조 / 성능 / 설계패턴 / 도메인 / 확장성** 5개 카테고리로 인사이트 제공
- 각 인사이트는 `good` / `advice` / `warning` 3단계 심각도로 분류

### 4. Excel → DBML 임포트
- Excel 파일(`.xlsx`)을 파싱하여 DBML 코드로 자동 변환 (`excelToDbml.ts`, 약 21,700자 규모의 핵심 로직)

### 5. GitLab 연동
- GitLab 저장소에서 DBML 파일을 불러오는 서비스 (`gitlabService.ts`)
- 자동 로드(`useAutoLoad`) 훅으로 앱 시작 시 저장된 스키마 복원

### 6. 스키마 Diff
- 두 버전의 스키마를 비교하여 추가·삭제·변경 사항을 시각화
- `schemaDiff.ts` (스키마 구조 비교), `dataDiff.ts` (데이터 비교) 두 모듈로 구성

### 7. 유효성 검사(Validation)
- DBML 스키마의 문법·논리적 오류를 사전 검출

### 8. 내보내기(Export)
- **이미지** 내보내기 (`imageExporter.ts`)
- **SQL** 내보내기 (`sqlExporter.ts`)

### 9. 동기화(Sync)
- `SyncToast` 컴포넌트로 동기화 상태 알림
- `usePresence` 훅을 통한 실시간 사용자 존재 감지

---

## 상태 관리 (Zustand Store)

| 스토어 | 역할 |
|--------|------|
| `useEditorStore` | DBML 텍스트, 에디터 상태 관리 |
| `useSchemaStore` | 파싱된 스키마 데이터 관리 |
| `useCanvasStore` | ERD 캔버스 위치·줌·노드 상태 관리 |
| `useExploreStore` | 탐색 패널 선택 상태 관리 |
| `useSyncStore` | 동기화 상태 관리 |

---

## 프로젝트 구조

```
erd-app/
├── src/
│   ├── pages/          # 라우팅 페이지 컴포넌트
│   ├── components/     # UI 컴포넌트
│   │   ├── Canvas/     # ERD 캔버스
│   │   ├── Editor/     # DBML 에디터
│   │   ├── Diff/       # 스키마 비교
│   │   ├── Docs/       # 문서 뷰어
│   │   ├── Export/     # 내보내기
│   │   ├── Import/     # 가져오기
│   │   ├── Sidebar/    # 테이블 목록
│   │   ├── Sync/       # 동기화 알림
│   │   ├── Validation/ # 유효성 검사
│   │   ├── Welcome/    # 환영 화면
│   │   └── Layout/     # 앱 레이아웃
│   ├── core/           # 핵심 비즈니스 로직
│   │   ├── ai/         # Claude AI 분석
│   │   ├── diff/       # 스키마 비교 엔진
│   │   ├── export/     # 이미지·SQL 내보내기
│   │   ├── import/     # Excel·GitLab 가져오기
│   │   ├── layout/     # ERD 레이아웃 엔진
│   │   ├── parser/     # DBML 파서
│   │   ├── schema/     # 스키마 타입·처리
│   │   └── validation/ # 유효성 검사 로직
│   ├── store/          # Zustand 전역 상태
│   └── hooks/          # 커스텀 훅
├── package.json
└── vite.config.ts
```

---

## 실행 방법

```bash
cd erd-app
npm install
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```
