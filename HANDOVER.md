# TableMaster 프로젝트 인수인계 문서

> 작성일: 2026-02-27  
> 프로젝트 경로: `C:\TableMaster\DBMLViewer\erd-app`

---

## 1. 프로젝트 개요

**TableMaster**는 게임 프로젝트(Project AEGIS)의 **게임 데이터 관리·분석·시각화 웹 도구**입니다.

주요 기능:
- **DBML ERD 뷰어**: 엑셀 기반 게임 데이터 스키마를 DBML로 변환하여 ERD(Entity-Relationship Diagram) 시각화
- **SQL 쿼리 엔진**: alasql 기반으로 게임 데이터를 SQL로 조회
- **Git 연동**: GitLab 저장소(aegisdata/aegis) 자동 동기화, 히스토리 조회, 커밋 Diff 비교
- **AI 챗봇**: Claude API 기반 게임 데이터 어시스턴트 (자연어로 데이터 조회, 보고서 생성)
- **Jira/Confluence 연동**: 이슈 검색, 기획 문서 조회
- **3D 뷰어**: Unity FBX 모델 및 Scene 파일 렌더링
- **코드 가이드**: C# 게임 클라이언트 소스코드 검색 및 가이드 문서 열람
- **데이터 유효성 검증**: 스키마 기반 데이터 Validation
- **문서 출판**: AI가 생성한 HTML 보고서를 저장·공유

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Zustand (상태관리) |
| Build | Vite 7, vite-git-plugin (커스텀 백엔드 플러그인) |
| 3D Rendering | Three.js (FBXLoader, TGALoader, OrbitControls) |
| DB/SQL | alasql (브라우저 내 SQL 엔진) |
| DBML | @dbml/core (DBML 파싱) |
| AI | Claude API (Anthropic) |
| 외부 연동 | Jira Cloud API, Confluence API, GitLab |
| 기타 | xlsx (엑셀 파싱), Monaco Editor |

---

## 3. 디렉토리 구조

```
C:\TableMaster\
├── DBMLViewer/erd-app/          # 메인 웹 앱
│   ├── src/
│   │   ├── App.tsx              # 라우팅 설정
│   │   ├── main.tsx             # 엔트리포인트
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── ChatPage.tsx     # AI 챗봇 페이지 (가장 큰 파일 ~4600줄)
│   │   │   ├── EditorPage.tsx   # DBML 에디터
│   │   │   ├── DocsPage.tsx     # 테이블 문서
│   │   │   ├── DiffPage.tsx     # Git Diff 비교
│   │   │   ├── QueryPage.tsx    # SQL 쿼리
│   │   │   ├── ExplorePage.tsx  # 탐색
│   │   │   ├── GuidePage.tsx    # 코드 가이드
│   │   │   └── ValidationPage.tsx # 데이터 검증
│   │   ├── core/
│   │   │   ├── ai/
│   │   │   │   ├── chatEngine.ts    # Claude 챗봇 엔진 (~2400줄)
│   │   │   │   └── claudeAnalyzer.ts
│   │   │   ├── import/
│   │   │   │   ├── excelToDbml.ts   # 엑셀→DBML 변환
│   │   │   │   └── gitlabService.ts # Git API 클라이언트
│   │   │   ├── query/
│   │   │   │   └── schemaQueryEngine.ts # alasql 기반 SQL 엔진
│   │   │   ├── schema/
│   │   │   │   ├── types.ts
│   │   │   │   └── schemaTransform.ts
│   │   │   ├── diff/              # 스키마/데이터 비교
│   │   │   ├── export/            # 이미지/SQL 내보내기
│   │   │   ├── layout/            # ERD 자동 레이아웃
│   │   │   ├── parser/            # DBML 파싱
│   │   │   └── validation/        # 데이터 검증
│   │   ├── components/
│   │   │   ├── SceneViewer.tsx     # Unity Scene 3D 뷰어
│   │   │   ├── FbxViewer.tsx      # 단일 FBX 3D 뷰어
│   │   │   ├── Canvas/            # ERD 캔버스 컴포넌트들
│   │   │   ├── Diff/              # Diff 뷰어
│   │   │   ├── Docs/              # 문서 뷰어
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAutoLoad.ts     # 앱 시작 시 Git sync + 데이터 로드
│   │   │   └── ...
│   │   └── store/                 # Zustand 스토어들
│   ├── vite-git-plugin.ts         # 커스텀 백엔드 API (~2000줄)
│   ├── vite.config.ts             # Vite 설정
│   ├── .env                       # 환경변수 (API 키, URL 등)
│   ├── dist/                      # 빌드 결과물
│   └── published/                 # AI 생성 HTML 문서 저장소
├── code/                          # C# 소스코드 (sync_cs_files.ps1로 동기화)
│   └── _guides/                   # 코드/DB 가이드 마크다운 문서
├── images/                        # UI 이미지 (sync_ui_images.ps1로 동기화)
├── unity_project/                 # Unity 프로젝트 파일 (에셋, 프리팹 등)
├── assets/                        # 에셋 인덱스
├── sync_assets.ps1                # Unity 에셋 동기화 스크립트
├── sync_cs_files.ps1              # C# 소스 동기화 스크립트
├── sync_ui_images.ps1             # UI 이미지 동기화 스크립트
├── build_guid_index.ps1           # Unity GUID 인덱스 빌드
├── build_asset_index.ps1          # 에셋 인덱스 빌드
├── build_material_index.ps1       # 머티리얼 인덱스 빌드
└── generate_code_guides.ps1       # 코드 가이드 자동 생성
```

---

## 4. 핵심 파일 상세

### 4.1. `vite-git-plugin.ts` — 백엔드 API 서버

Vite 플러그인 형태로 구현된 **모든 서버사이드 API 엔드포인트**가 이 파일에 있습니다.

#### API 엔드포인트 목록

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/claude` | POST | Claude API 프록시 (스트리밍 지원) |
| `/api/images/list` | GET | UI 이미지 목록 |
| `/api/images/file` | GET | UI 이미지 파일 서빙 |
| `/api/images/smart` | GET | 이름으로 이미지 자동 검색 |
| `/api/code/list` | GET | C# 소스코드 목록 |
| `/api/code/file` | GET | C# 소스파일 내용 |
| `/api/code/search` | GET | 코드 검색 (클래스/메서드/내용) |
| `/api/code/stats` | GET | 코드 통계 |
| `/api/code/guides`, `/api/code/guide` | GET | 코드 가이드 목록/내용 |
| `/api/guides/list`, `/api/guides/read` | GET | 통합 가이드 (코드+DB) |
| `/api/assets/index` | GET | Unity 에셋 인덱스 |
| `/api/assets/file` | GET | 에셋 파일 서빙 |
| `/api/assets/smart` | GET | 에셋 이름 퍼지 검색 (T_ 프리픽스 자동 처리) |
| `/api/assets/materials` | GET | 머티리얼 인덱스 |
| `/api/assets/scene` | GET | Unity .scene 파일 파싱 → JSON (FBX 경로+Transform) |
| `/api/jira/search` | GET | Jira JQL 검색 |
| `/api/jira/issue/:key` | GET | Jira 이슈 상세 |
| `/api/jira/projects` | GET | Jira 프로젝트 목록 |
| `/api/confluence/search` | GET | Confluence CQL 검색 |
| `/api/confluence/page/:id` | GET | Confluence 페이지 내용 |
| `/api/publish` | POST/GET/PUT/DELETE | HTML 문서 CRUD |
| `/api/p/:id` | GET | 출판된 HTML 문서 서빙 |
| `/api/git/sync` | POST | Git 저장소 clone/pull |
| `/api/git/status` | GET | Git 상태 확인 |
| `/api/git/files` | GET | Git 저장소 파일 목록 (base64) |
| `/api/git/log` | GET | Git 커밋 로그 |
| `/api/git/diff` | GET | 두 커밋 간 Diff |
| `/api/git/commit-diff` | GET | 특정 커밋의 Diff |
| `/api/git/files-at-commit` | GET | 특정 커밋 시점의 파일 |

**듀얼 Git 저장소**: Git 관련 API는 `?repo=aegis` 쿼리 파라미터로 두 번째 저장소 전환 가능.

#### 설정 (GitPluginOptions)

```typescript
interface GitPluginOptions {
  repoUrl: string         // aegisdata 저장소 URL
  localDir: string        // aegisdata 로컬 클론 경로
  token?: string          // GitLab 토큰
  claudeApiKey?: string   // Claude API 키
  repo2Url?: string       // aegis 코드 저장소 URL
  repo2LocalDir?: string  // aegis 로컬 클론 경로
  repo2Token?: string     // aegis 저장소 토큰
  jiraBaseUrl?: string           // https://cloud.jira.krafton.com
  confluenceBaseUrl?: string     // https://krafton.atlassian.net
  jiraUserEmail?: string         // suile@risingwings.com
  jiraApiToken?: string          // Atlassian API 토큰 (Jira+Confluence 공통)
  jiraDefaultProject?: string    // AEGIS
  confluenceUserEmail?: string
  confluenceApiToken?: string
}
```

### 4.2. `chatEngine.ts` — AI 챗봇 엔진

Claude API와 상호작용하는 핵심 엔진입니다.

#### 주요 기능
- **Tool Use**: Claude가 게임 데이터 조회, Git 히스토리, Jira/Confluence 검색 등을 자동 호출
- **자동 연속 생성**: `max_tokens` 초과 시 자동으로 이어서 생성 (사용자 개입 불필요)
- **시스템 프롬프트**: 게임 DB 스키마, 가상 테이블 정보, Enum 구조 등 포함

#### 등록된 Claude Tools (총 17개)

| Tool 이름 | 설명 |
|-----------|------|
| `query_game_data` | SQL로 게임 데이터 조회 |
| `show_table_schema` | 테이블 스키마 정보 |
| `query_git_history` | Git 커밋 로그 (data/aegis 선택) |
| `show_revision_diff` | 특정 커밋 Diff |
| `find_resource_image` | 게임 이미지 검색 |
| `build_character_profile` | 캐릭터 전체 데이터 수집 |
| `read_guide` | 코드/DB 가이드 읽기 |
| `read_code_guide` | (deprecated) 코드 가이드 |
| `search_assets` | Unity 에셋 파일 검색 |
| `search_code` | C# 소스코드 검색 |
| `read_code_file` | C# 파일 전체 내용 읽기 |
| `patch_artifact` | HTML 문서 부분 수정 |
| `create_artifact` | HTML 문서 생성 |
| `search_jira` | Jira JQL 검색 |
| `get_jira_issue` | Jira 이슈 상세 |
| `search_confluence` | Confluence CQL 검색 |
| `get_confluence_page` | Confluence 페이지 내용 |

#### alasql 예약어 이슈
게임 테이블명 중 `Enum`, `Index`, `Key` 등 alasql 예약어와 충돌하는 이름이 있어, 내부적으로 `__u_enum`, `__u_index` 등으로 변환합니다. 시스템 프롬프트에서 Claude에게 `FROM __u_enum` 형태를 사용하도록 안내합니다.

#### 자동 연속 생성 (Auto-Continue)
`sendChatMessage()` 함수는 Claude 응답이 `max_tokens`로 잘렸을 때 자동으로 루프하며 이어서 생성합니다:
- 최대 5회 반복
- 텍스트와 tool_use 블록을 누적
- 사용자가 별도 "계속" 버튼을 누를 필요 없음

### 4.3. `ChatPage.tsx` — 챗봇 UI

약 4,600줄의 대형 컴포넌트로, 다음 기능을 포함합니다:
- 채팅 메시지 렌더링 (마크다운, 코드 블록, 테이블)
- SQL 쿼리 결과 카드
- 스키마 카드 (미니 ERD 포함)
- Git 히스토리/Diff 카드
- Jira/Confluence 검색 결과 카드
- 이미지/3D 뷰어 임베드
- HTML 아티팩트 미리보기/출판
- 웰컴 화면 (중앙 배치, `pointer-events-none/auto`로 클릭 투과)

### 4.4. `useAutoLoad.ts` — 앱 초기화

앱 시작 시 자동 실행:
1. **aegisdata** (게임 데이터) + **aegis** (코드) 저장소 병렬 Git sync
2. `GameData/DataDefine` (스키마) + `GameData/Data` (데이터) 엑셀 파일 로드
3. 엑셀 → DBML 변환 → 스키마 파싱 → alasql 테이블 등록

---

## 5. 환경 설정 (.env)

`DBMLViewer/erd-app/.env` 파일에 모든 API 키와 URL이 저장됩니다. `.gitignore`에 포함되어 있어 git에 커밋되지 않습니다.

```env
# Jira / Confluence API 설정
JIRA_BASE_URL=https://cloud.jira.krafton.com
CONFLUENCE_BASE_URL=https://krafton.atlassian.net
JIRA_USER_EMAIL=suile@risingwings.com
JIRA_API_TOKEN=<Atlassian API 토큰>

CLAUDE_API_KEY=<Claude API 키>
JIRA_DEFAULT_PROJECT=AEGIS

# Git 저장소 (두 번째: aegis 코드 저장소)
GITLAB_REPO2_URL=http://13.209.114.157/projectaegis/projectaegisdata.git
GITLAB_REPO2_TOKEN=<GitLab 토큰>
```

### 주요 포인트
- **Atlassian 토큰은 하나**: Jira (cloud.jira.krafton.com)와 Confluence (krafton.atlassian.net)가 같은 Atlassian 계정 토큰을 공유
- **Jira와 Confluence의 Base URL이 다름**: Jira는 `cloud.jira.krafton.com`, Confluence는 `krafton.atlassian.net`
- GitLab 토큰도 aegisdata/aegis 양쪽 저장소에 동일하게 사용

---

## 6. 빌드 & 배포

```bash
# 개발 서버 (HMR)
cd C:\TableMaster\DBMLViewer\erd-app
npx vite

# 프로덕션 빌드
npx tsc -b && npx vite build

# 프리뷰 서버 (빌드 결과물 서빙, 현재 운영에 사용 중)
npx vite preview --host 0.0.0.0 --port 5173
```

- **접속 URL**: `http://<서버IP>:5173/TableMaster`
- **Base Path**: `/TableMaster` (vite.config.ts의 `base` 설정)
- `vite preview`가 `vite-git-plugin`의 미들웨어도 포함하므로 **별도 백엔드 서버 불필요**

### 서버 시작 명령 (PowerShell)

```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
cd C:\TableMaster\DBMLViewer\erd-app
npx vite preview --host 0.0.0.0 --port 5173
```

> ⚠️ PowerShell에서 PATH가 누락되어 `npx`를 못 찾는 경우가 있으므로, PATH 재설정 라인을 포함합니다.

---

## 7. 데이터 동기화 스크립트

| 스크립트 | 설명 |
|---------|------|
| `sync_assets.ps1` | Unity 프로젝트에서 FBX/텍스처/사운드 등 에셋 파일 동기화 |
| `sync_cs_files.ps1` | Unity C# 소스코드를 `code/` 폴더로 동기화 |
| `sync_ui_images.ps1` | UI 이미지(PNG)를 `images/` 폴더로 동기화 |
| `build_guid_index.ps1` | Unity `.meta` 파일 스캔 → GUID→경로 인덱스 생성 |
| `build_asset_index.ps1` | 에셋 인덱스(파일명/경로/크기) JSON 생성 |
| `build_material_index.ps1` | 머티리얼 인덱스 생성 |
| `generate_code_guides.ps1` | C# 코드에서 자동 가이드 문서(MD) 생성 |

---

## 8. 주요 해결된 이슈 & 알려진 사항

### 8.1. Unity Scene 뷰어
- Unity `.unity` 파일(YAML)을 파싱하여 각 GameObject의 Transform + 참조 FBX를 추출
- **fileID가 음수**일 수 있어 정규식에 `-?` 필수 (`-?\d+`)
- 좌표계 변환: Unity(Left-Handed) → Three.js(Right-Handed): X 반전
- 텍스처 로딩: `LoadingManager.setURLModifier`로 `/api/assets/smart?name=`으로 리다이렉트
- `T_` 프리픽스 자동 매칭: `SafetyZone_Ems.png` → `T_SafetyZone_Ems.png`

### 8.2. Jira/Confluence 연동
- **Jira Search API**: `/rest/api/3/search`는 deprecated → **`/rest/api/3/search/jql`** 사용
- JQL에 `project` 필터 없으면 서버가 거부 → 자동으로 `JIRA_DEFAULT_PROJECT` 추가
- Confluence 검색 결과의 `id`는 `result.content.id`에 위치
- URL 구성: Jira = `https://cloud.jira.krafton.com`, Confluence = `https://krafton.atlassian.net`

### 8.3. alasql 예약어
- `Enum`, `Index`, `Key`, `Value`, `Status`, `Type`, `Level`, `Group`, `Order` 등이 예약어
- 테이블명 `Enum` → 내부적으로 `__u_enum`으로 변환하여 SQL 파싱 오류 방지
- Claude 시스템 프롬프트에 `FROM __u_enum` 형태 안내

### 8.4. Three.js Deprecation
- `THREE.Clock` → 제거 (애니메이션 불필요한 정적 뷰이므로)
- `PCFSoftShadowMap` → `PCFShadowMap`으로 변경

### 8.5. 웰컴 화면 클릭 차단 문제
- `fixed inset-0`으로 중앙 배치 시 전체 화면이 클릭 이벤트를 가로챔
- 해결: 외부 div에 `pointer-events-none`, 내부 콘텐츠에 `pointer-events-auto`

---

## 9. Git 저장소 구조

### 듀얼 저장소 지원
| 저장소 | 파라미터 | 내용 | 로컬 경로 |
|--------|---------|------|----------|
| aegisdata | `?repo=data` (기본값) | 게임 데이터 (엑셀, 에셋) | `.git-repo/` |
| aegis | `?repo=aegis` | 게임 코드 (C#) | `.git-repo-aegis/` |

앱 시작 시 두 저장소를 **병렬로 sync**합니다 (`useAutoLoad.ts`).

---

## 10. 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/editor` | EditorPage | DBML 에디터 + ERD 캔버스 |
| `/docs` | DocsPage | 테이블 문서 뷰어 |
| `/docs/:tableId` | DocsPage | 특정 테이블 문서 |
| `/diff` | DiffPage | 스키마/데이터 Diff |
| `/validation` | ValidationPage | 데이터 검증 |
| `/guide` | GuidePage | 코드/DB 가이드 |
| `/query` | QueryPage | SQL 쿼리 실행기 |
| `/chat` | ChatPage | AI 챗봇 |
| `/explore` | ExplorePage | 탐색 |

기본 경로(`/`)는 `/editor`로 리다이렉트됩니다.

---

## 11. 의존성 요약

```json
{
  "react": "^19.2.0",
  "three": "^0.183.1",
  "alasql": "^4.17.0",
  "@dbml/core": "^6.3.0",
  "@monaco-editor/react": "^4.7.0",
  "zustand": "^5.0.11",
  "xlsx": "^0.18.5",
  "tailwindcss": "^4.2.0",
  "vite": "^7.3.1",
  "typescript": "~5.9.3"
}
```

---

## 12. 주의사항 & 팁

1. **서버 죽으면**: PowerShell에서 PATH 설정 후 `npx vite preview` 재실행 (위 7번 참조)
2. **.env 파일은 git에 없음**: 새 환경에서는 `.env` 파일을 수동 생성해야 함
3. **vite-git-plugin.ts가 백엔드**: Express 같은 별도 서버 없이 Vite 미들웨어로 모든 API 처리
4. **ChatPage.tsx가 최대 파일**: ~4,600줄, 수정 시 주의
5. **chatEngine.ts의 시스템 프롬프트**: Claude의 동작 지침이 여기에 있음, 수정 시 응답 품질에 직접 영향
6. **에셋 동기화**: `sync_*.ps1` 스크립트는 Unity 프로젝트 경로가 하드코딩되어 있으므로 환경에 맞게 조정 필요
7. **Node 프로세스 좀비**: 서버 재시작 시 `Get-Process -Name "node" | Stop-Process -Force`로 기존 프로세스 정리 권장
