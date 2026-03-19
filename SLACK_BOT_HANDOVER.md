# DataMaster Slack Bot — 인수인계 문서

> **최종 업데이트**: 2026-03-09  
> **프로젝트 경로**: `C:\TableMaster\DBMLViewer\erd-app`  
> **핵심 파일**: `slack-bot.cjs` (슬랙봇), `vite-git-plugin.ts` (서버 API)

---

## 1. 프로젝트 개요

### 1.1 아키텍처

```
┌─────────────────┐     SSE 스트리밍      ┌────────────────────────┐
│  Slack Bot       │ ←──────────────────→ │  DataMaster Server     │
│  (slack-bot.cjs) │   POST /api/v1/chat  │  (vite-git-plugin.ts)  │
│                  │   POST /api/v1/publish│                        │
│  Socket Mode     │                      │  Vite Preview Server   │
│  @slack/bolt     │                      │  port 5173             │
└─────────────────┘                      └────────────────────────┘
        │                                          │
        ├── Slack 채널 (@DataMaster 멘션)           ├── Claude API (Anthropic)
        ├── DM (1:1 메시지)                         ├── MySQL (게임 데이터)
        ├── /datamaster 슬래시 커맨드                ├── Git (데이터/코드 저장소)
        └── 리액션 피드백 (👍👎)                    ├── Jira / Confluence
                                                    ├── 에셋 검색 (FBX/Prefab)
                                                    └── published/ (아티팩트 저장)
```

### 1.2 실행 방법

```powershell
# 1. 서버 실행 (빌드 후)
cd C:\TableMaster\DBMLViewer\erd-app
npx vite build
npx vite preview --host 0.0.0.0 --port 5173

# 2. 슬랙봇 실행 (별도 터미널)
cd C:\TableMaster\DBMLViewer\erd-app
node slack-bot.cjs
```

### 1.3 환경 변수 (.env)

```env
SLACK_BOT_TOKEN=xoxb-...       # Slack Bot User OAuth Token
SLACK_APP_TOKEN=xapp-...       # Slack App-Level Token (Socket Mode)
DATAMASTER_URL=http://localhost:5173
DATAMASTER_PUBLIC_URL=http://100.70.0.223:5173  # 외부 접근 URL (아티팩트 링크용)
```

### 1.4 필요한 Slack App 권한

- **Bot Token Scopes**: `chat:write`, `app_mentions:read`, `im:read`, `im:write`, `im:history`, `channels:history`, `groups:history`, `reactions:read`, `users:read`, `links:read`, `links:write`
- **Socket Mode**: 활성화 필수
- **Event Subscriptions**: `app_mention`, `message.im`, `reaction_added`, `link_shared`, `app_home_opened`
- **Interactivity**: 활성화 필수 (모달/버튼 인터랙션 처리)
- **App Home**: Features → App Home → "Home Tab" 체크

> ⚠️ **`users:read` 스코프가 없으면** `getUserDisplayName()`에서 `missing_scope` 에러 발생 — 봇은 동작하나 사용자 이름 대신 User ID가 표시됨
> 
> ⚠️ **Interactivity가 꺼져 있으면** 차트 모달 버튼 클릭 시 `dispatch_failed` 에러 발생
> 
> ⚠️ **Home Tab이 꺼져 있으면** App Home 탭에 아무것도 표시되지 않음

---

## 2. slack-bot.cjs 구조

### 2.1 주요 모듈/함수

| 영역 | 함수/변수 | 설명 |
|------|-----------|------|
| **세션 관리** | `threadSessions` (Map) | `channel:threadTs` → `sessionId` 매핑 |
| | `threadMeta` (Map) | 쓰레드별 조회된 테이블/스키마/Jira 이슈 축적 |
| | `sessionLastUsed` (Map) | 세션 마지막 사용 시간 (4시간 TTL) |
| **API 호출** | `callDataMasterStreaming()` | SSE 스트리밍으로 서버 API 호출, tool_start/text_delta/done 이벤트 파싱 |
| **메시지 변환** | `mdToSlack()` | Markdown → Slack mrkdwn 변환 |
| | `mdTableToSlack()` | Markdown 테이블 → Slack 코드블록 변환 |
| | `extractSlackSummary()` | 긴 마크다운에서 요약 텍스트 추출 (코드블록/테이블 제외, 600자) |
| | `truncateForSlack()` | 3800자 제한 처리 |
| **컨텍스트** | `fetchThreadContext()` | 쓰레드 이전 대화 수집 (최대 20개 메시지) |
| | `buildMetaContext()` | 축적된 메타정보(테이블, 스키마 등)를 컨텍스트로 변환 |
| | `getUserDisplayName()` | Slack User ID → 표시 이름 변환 (1시간 캐시) |
| **중복 방지** | `_processedMessages` (Set) | 동일 Slack 이벤트 중복 처리 방지 (ts 기반) |
| | `_activeThreads` (Map) | 같은 쓰레드 동시 처리 방지 |
| **커맨드** | `isHelpCommand()` | "help", "도움말" 등 → 가이드 블록 표시 |
| | `isResetCommand()` | "reset", "초기화" 등 → 세션 초기화 |
| **피드백** | `botResponses` (Map) | 봇 응답 추적 → 리액션 피드백 수집 (24시간 TTL) |
| **아티팩트** | 아티팩트 출판 로직 | 3단계 조건 판별로 자동 출판 결정 |
| **차트 모달** | `chartCache` (Map) | 차트 데이터 캐시 → 모달에서 확대 표시 (2시간 TTL) |
| **Home Tab** | `userActivity` (Map) | 사용자별 최근 활동 추적 → Home 대시보드 표시 |

### 2.2 메시지 처리 흐름 (`handleMessage`)

```
메시지 수신
  ↓
봇/중복/동시처리 체크
  ↓
help/reset 커맨드 체크
  ↓
로딩 메시지 전송 ("🔍 분석 중...")
글로벌 타임아웃 설정 (5분)
  ↓
사용자 이름 조회 (getUserDisplayName)
쓰레드 컨텍스트 수집 (fetchThreadContext)
메타정보 주입 (buildMetaContext)
  ↓
callDataMasterStreaming() — SSE 스트리밍
  ├── onToolStart 콜백: 진행상황 실시간 표시 (:loading2: / ✅)
  └── onIteration 콜백: no-op (이터레이션 번호는 표시하지 않음)
  ↓
아티팩트 출판 로직 (3단계)
  ↓
Slack 메시지 조립 (blocks)
  ├── 출판된 경우: 요약 + "📊 전체 결과 보기" 버튼
  └── 미출판: mdToSlack() 직접 표시
  ↓
로딩 메시지 → 실제 응답으로 교체 (chat.update)
봇 응답 추적 등록 (리액션 피드백용)
```

### 2.3 SSE 이벤트 파싱 (`callDataMasterStreaming`)

서버에서 오는 SSE 이벤트:

| 이벤트 | 데이터 | 처리 |
|--------|--------|------|
| `session` | `{ session_id }` | 세션 ID 저장 |
| `text_delta` | `{ delta, full_text }` | 현재 이터레이션 텍스트 누적 |
| `tool_start` | `{ tool, input }` | toolCalls 배열에 추가, onToolStart 콜백 호출 |
| `tool_done` | `{ summary }` | 해당 toolCall status → 'done' |
| `thinking` | - | 새 이터레이션 시작 (이전 텍스트 저장) |
| `done` | `{ content, tool_calls }` | 최종 결과 (doneContent 우선, 없으면 streamedFull) |
| `heartbeat` | - | 연결 유지 (무시) |
| `error` | `{ error, recoverable }` | 에러 처리 |

**타임아웃 설정**:
- `TOTAL_TIMEOUT`: 5분 (전체 SSE 연결)
- `READ_TIMEOUT`: 2분 (개별 read — 도구 실행 대기)

### 2.4 진행상황 표시 (`onToolStart`)

```
:loading2: *DataMaster* 분석 중... _(5단계)_

 1  ✅ 📊 데이터 조회  _SELECT * FROM Character..._
 2  ✅ 📋 테이블 구조  _Character_
 3  ✅ 📚 Confluence 검색  _세계관_
 4  ✅ 🧠 지식 읽기  _aegis_worldview_sources_
 5  :loading2: 📄 문서 생성  _세계관 정리_
```

- 최대 15개 스텝 표시, 초과 시 앞부분 생략 (`... N단계 완료 ...`)
- 마지막 항목만 `:loading2:` (진행 중), 나머지 `✅` (완료)
- 1초 디바운스로 너무 잦은 업데이트 방지
- **이터레이션 번호는 표시하지 않음** (onIteration은 no-op)

### 2.5 도구 라벨 매핑 (`TOOL_LABELS`)

```javascript
query_game_data:   '📊 데이터 조회'
show_table_schema: '📋 테이블 구조'
query_git_history: '📂 Git 이력'
create_artifact:   '📄 문서 생성'
patch_artifact:    '✏️ 문서 수정'
search_code:       '💻 코드 검색'
read_code_file:    '💻 코드 읽기'
read_guide:        '📖 가이드 참조'
search_jira:       '🎫 Jira 검색'
get_jira_issue:    '🎫 Jira 이슈'
create_jira_issue: '➕ Jira 생성'
add_jira_comment:  '✍️ Jira 댓글'
update_jira_issue_status: '🔄 Jira 상태변경'
search_confluence: '📚 Confluence 검색'
get_confluence_page: '📚 Confluence 문서'
save_knowledge:    '🧠 지식 저장'
read_knowledge:    '🧠 지식 읽기'
list_knowledge:    '🧠 지식 목록'
delete_knowledge:  '🧠 지식 삭제'
web_search:        '🌐 웹 검색'
read_url:          '🌐 URL 읽기'
search_assets:     '🎨 에셋 검색'
build_character_profile: '👤 캐릭터 프로필'
preview_prefab:    '🧩 프리팹'
preview_fbx_animation: '🎬 애니메이션'
find_resource_image: '🖼️ 이미지 찾기'
```

---

## 3. 아티팩트 출판 로직 (핵심)

### 3.1 출판 조건 (3단계)

```
조건 1: create_artifact/patch_artifact 도구 결과에 HTML이 있으면 → HTML 직접 출판
         ※ HTML이 50자 미만이면 출판 건너뜀 (경고 로그만)
         
조건 2: 비주얼 도구 사용 + 대화형이 아닌 콘텐츠
        OR 도구 2개 이상 사용 + 구조화된 콘텐츠 (테이블/코드블록/헤더/리스트)
        + publishContent.length > 200
        ※ usedArtifactTool이 true이면 건너뜀 (진행 텍스트 출판 방지)
         
조건 3: 구조화된 콘텐츠가 있고 publishContent.length > 600
        ※ usedArtifactTool이 true이면 건너뜀
```

### 3.2 진행 텍스트 필터링

`stripProgressText()` — 아티팩트에 넣을 콘텐츠에서 대화형 진행 텍스트 제거:

```
제거 패턴: "~하겠습니다", "~할게요", "~올게요", "~겠습니다",
          "~보겠습니다", "~드리겠습니다", "~시작합니다",
          "~살펴보겠", "~확인하겠", "~분석하겠", "~수집하겠",
          "~검색하겠", "~조회하겠", "~정리하겠", "~가져오겠",
          "~만들어보겠", "~작성하겠", "~준비하겠", "~진행하겠"
```

`isConversationalOnly()` — 진행 텍스트 제거 후 실질적 내용이 100자 미만이거나 의미있는 줄이 3줄 미만이면 대화형으로 판단

### 3.3 비주얼 도구 목록

```javascript
VISUAL_TOOLS = ['preview_fbx_animation', 'preview_prefab', 'find_resource_image',
                'build_character_profile', 'search_assets']
```

> ⚠️ `create_artifact`와 `patch_artifact`는 VISUAL_TOOLS에 **포함하지 않음**  
> 이유: 조건 1에서 HTML로 직접 처리하고, 실패 시 조건 2/3으로 빠지면 진행 텍스트가 아티팩트로 출판되는 버그 발생

### 3.4 출판 API 호출

```javascript
// HTML 직접 출판
POST /api/v1/publish
{ title: "...", html: "<html>...</html>", source: "slack" }

// Markdown → 서버에서 HTML 변환 후 출판
POST /api/v1/publish
{ title: "...", markdown: "# ...", source: "slack" }
```

`source: "slack"` 지정 시 서버에서 자동으로 "Slack" 폴더 생성/할당.

---

## 4. 서버 측 (vite-git-plugin.ts) 주요 사항

### 4.1 동적 max_tokens

```typescript
const isSlackSource = userMessage.includes('[Slack 사용자:') || body.source === 'slack'
const ARTIFACT_KEYWORDS = /정리해줘|문서로|보고서|시트.*만들|뽑아줘|만들어줘|아티팩트|3D|모델링|...|전체/
const MAX_TOKENS = (isSlackSource || ARTIFACT_KEYWORDS.test(userMessage)) ? 16384 : 8192
```

- Slack 요청 또는 아티팩트 키워드 감지 시: **16384** 토큰
- 일반 대화: **8192** 토큰
- 웹앱 chatEngine.ts에서는: 아티팩트 키워드 시 16384, 일반 4096

### 4.2 동시 요청 제어 (`_activeRequests`)

```typescript
const _activeRequests = new Map<string, number>() // sessionId → timestamp
```

- 세션당 1개 요청만 허용
- 5분 이상 된 요청은 좀비로 간주 → 자동 해제
- 요청 완료/에러 시 `finally`에서 반드시 해제

### 4.3 API_TOOLS (서버 도구 정의)

서버에 정의된 전체 도구 목록 (총 24+개):

- `query_game_data`, `show_table_schema`, `query_git_history`
- `search_code`, `read_code_file`, `read_guide`
- `search_jira`, `get_jira_issue`, `create_jira_issue`, `add_jira_comment`, `update_jira_issue_status`
- `search_confluence`, `get_confluence_page`
- `web_search`, `read_url`
- `search_assets`, `preview_prefab`, `preview_fbx_animation`, `find_resource_image`
- `build_character_profile`, `create_artifact`, `patch_artifact`
- `show_revision_diff`, `read_scene_yaml`
- `save_knowledge`, `read_knowledge`, `list_knowledge`, `delete_knowledge`

### 4.4 Slack 폴더 자동 할당

`source: "slack"`으로 출판된 아티팩트는 자동으로 "Slack" 폴더에 배치:

```typescript
if (source === 'slack') {
  let slackFolder = folders.find(f => f.name === 'Slack' && f.parentId === null)
  if (!slackFolder) { /* 자동 생성 */ }
  slackFolderId = slackFolder.id
}
```

### 4.5 Published 아티팩트 저장 구조

```
published/
  ├── index.json          # 아티팩트 메타 목록 [{id, title, description, createdAt, author, folderId}]
  ├── folders.json        # 폴더 메타 [{id, name, parentId, createdAt}]
  ├── pub_xxx.html        # 개별 아티팩트 HTML
  └── ...
```

---

## 5. 해결된 이슈 목록

### 5.1 Slack 아티팩트가 Explore 페이지에 안 보임
- **원인**: Slack 출판이 별도 `.published/` 경로를 사용하고 `index.json`에 등록 안 됨
- **수정**: `published/` 통합, `index.json` 등록 로직 추가

### 5.2 임베드(FBX/Prefab 뷰어)가 안 됨
- **원인 1**: `PrefabViewerPage`가 `?fbx=` 파라미터 미지원
- **수정**: FBX 모드 추가, `FbxViewer` 컴포넌트 동적 선택
- **원인 2**: Base URL `/TableMaster` 누락
- **수정**: 모든 viewer URL에 `/TableMaster/viewer/prefab?` 경로 적용
- **원인 3**: AI 응답의 `<code>.fbx</code>` 태그를 viewer 링크로 변환 안 함
- **수정**: `markdownToHtml()` + `processEmbeds()`에서 `.fbx`/`.prefab` 패턴 감지 → 뷰어 버튼 생성

### 5.3 Slack과 웹앱 도구 불일치
- **원인**: 서버의 `API_TOOLS`에 9개 도구 누락
- **수정**: `show_revision_diff`, `preview_prefab`, `read_scene_yaml`, `patch_artifact`, `create_jira_issue`, `save_knowledge`, `read_knowledge`, `list_knowledge`, `delete_knowledge` 추가

### 5.4 max_tokens 고정으로 불완전한 응답
- **원인**: Slack 요청에 고정 8192 토큰 → 긴 아티팩트 생성 시 잘림
- **수정**: Slack 요청 또는 아티팩트 키워드 감지 시 16384로 동적 설정

### 5.5 이터레이션 마커 / 이모지 중복
- **원인**: `onIteration`이 `── 이터레이션 N ──` 출력, `TOOL_EMOJI` + `TOOL_LABELS` 이모지 중복
- **수정**: `onIteration` no-op, `TOOL_EMOJI` 맵 제거, `TOOL_LABELS`만 사용

### 5.6 봇 응답 없이 뻗는 현상
- **원인**: 에러 시 Slack에 아무 알림 없음
- **수정**: 글로벌 5분 타임아웃 추가 → 항상 무언가 응답

### 5.7 429 (이미 처리 중) 빈발
- **원인 1**: `_activeRequests`가 Set → 영구 잠금 (좀비 미해제)
- **수정**: Map<string, number>로 변경, 5분 초과 자동 해제
- **원인 2**: Slack 이벤트 중복 수신으로 동일 요청 반복
- **수정**: `_processedMessages` (ts 기반 dedup) + `_activeThreads` (쓰레드별 동시 처리 방지)

### 5.8 대화형 텍스트가 아티팩트로 출판됨
- **원인**: `create_artifact`가 `VISUAL_TOOLS`에 있어서 HTML 추출 실패 시 진행 텍스트가 출판됨
- **수정**:
  - `create_artifact`/`patch_artifact`를 `VISUAL_TOOLS`에서 제거
  - `stripProgressText()` 필터 추가
  - `usedArtifactTool` 가드로 조건 2/3 차단

---

## 6. FBX/Prefab 뷰어 임베드

### 6.1 PrefabViewerPage.tsx

`/TableMaster/viewer/prefab` 경로에서 동작:

```
?path=Assets/...        → SceneViewer (Prefab)
?fbx=/api/assets/file?path=xxx.fbx  → FbxViewer (FBX)
```

- FBX 모드: `FbxViewer` 컴포넌트, 전체 화면 (`height="100%"`)
- Prefab 모드: `SceneViewer` 컴포넌트

### 6.2 FbxViewer.tsx

- `height` prop: `number | string` (100%` 지원)
- Three.js + FBXLoader로 3D 렌더링
- `ResizeObserver`로 동적 크기 조정
- 애니메이션 목록 패널, 자동 재생 지원

### 6.3 서버 측 임베드 처리

`buildPublishedPage()` 함수에 포함:
- `EMBED_CSS`: 임베드 버튼 스타일
- `FBX_VIEWER_SCRIPT`: `.fbx` 파일 뷰어 버튼 생성
- `ERD_RENDERER_SCRIPT`: ERD 다이어그램 렌더링
- `INTERACTIVE_TABLE_SCRIPT`: 테이블 정렬/필터 기능

`markdownToHtml()`에서 `<code>xxx.fbx</code>` → 뷰어 링크 자동 변환  
`processEmbeds()`에서 `<td>` 안의 파일명도 감지

---

## 7. 운영 주의사항

### 7.1 서버 (vite preview) 관련

- **서버가 먹통 되면** 슬랙봇이 5분 타임아웃 걸림 → 서버 재시작 필요
- 서버 프로세스: `npx vite preview --host 0.0.0.0 --port 5173`
- 서버 상태 확인: `Invoke-WebRequest -Uri "http://localhost:5173/TableMaster/" -TimeoutSec 5`

### 7.2 슬랙봇 프로세스 관리

- **반드시 1개만 실행** — 여러 개 실행 시 이벤트 중복 처리, 세션 충돌
- 이전 프로세스 종료:
  ```powershell
  Get-Process -Name node | Where-Object { $_.CommandLine -like '*slack-bot*' } | Stop-Process -Force
  ```
- 실행 중인 노드 프로세스 확인:
  ```powershell
  Get-WmiObject Win32_Process -Filter "Name='node.exe'" | Select ProcessId, CommandLine | Format-List
  ```

### 7.3 빌드 & 배포

```powershell
cd C:\TableMaster\DBMLViewer\erd-app
npx vite build                                    # 프론트엔드 빌드
npx vite preview --host 0.0.0.0 --port 5173      # 서버 시작 (빌드된 dist/ 서빙)
node slack-bot.cjs                                # 슬랙봇 시작 (별도 터미널)
```

> **작업 완료 시 반드시**: `git add -A && git commit -m "..." && git push`

### 7.4 디버깅

- 서버 로그: `vite preview` 터미널에 `[chatApi]`, `[gitApi]`, `[Publish]` 등 태그
- 슬랙봇 로그: `node slack-bot.cjs` 터미널에 `[Slack]`, `[SSE]` 태그
- 좀비 요청: 서버 로그에 `좀비 요청 해제` 메시지 확인
- SSE 결과: `[SSE] 결과: doneContent=N자, streamedTexts=N개(N자)` 로그

---

## 8. 미구현 / 후속 작업 후보

### 8.1 정기 리포트 (미구현)
- 특정 채널에서 "리포트 설정" 명령으로 매일 아침 자동 요약 전송
- `writeFileSync`, `mkdirSync` 임포트는 추가해둠 (사용 안 함)
- 구현 시: `node-cron` 또는 `setInterval` + 설정 JSON 저장

### 8.2 추가 강화 후보
- 🥇 쓰레드 핀/북마크 기능 (중요 답변 저장)
- 🥈 채널별 자동 컨텍스트 (특정 채널 = 특정 도메인 설정)
- 🥉 Slack 슬래시 커맨드 확장 (`/dm-query`, `/dm-jira` 등)
- 인터랙티브 버튼 (Slack Block Kit) — 후속 질문 버튼, 필터 선택 등
- 멀티모달 입력 (이미지 파일 첨부 분석)

---

## 9. 파일 참조

| 파일 | 역할 | 주요 라인 |
|------|------|-----------|
| `slack-bot.cjs` | 슬랙봇 전체 로직 | ~1498줄 |
| `vite-git-plugin.ts` | 서버 API, 도구 실행, 아티팩트 출판 | ~7728줄 |
| `src/pages/PrefabViewerPage.tsx` | FBX/Prefab 뷰어 페이지 | FBX + SceneViewer 분기 |
| `src/components/FbxViewer.tsx` | Three.js FBX 렌더러 | height: number\|string |
| `src/core/ai/chatEngine.ts` | 웹앱 채팅 엔진 | ~4164줄 |
| `src/pages/ChatPage.tsx` | 웹앱 채팅 UI | ~9010줄 |
| `src/pages/ExplorePage.tsx` | 아티팩트 탐색 페이지 | published/index.json 읽기 |
| `.env` | 환경변수 | SLACK_BOT_TOKEN, SLACK_APP_TOKEN 등 |

---

## 10. 핵심 코드 스니펫 (Quick Reference)

### 아티팩트 출판 판별 핵심 로직

```javascript
// slack-bot.cjs ~line 1081
const VISUAL_TOOLS = new Set([
  'preview_fbx_animation', 'preview_prefab', 'find_resource_image',
  'build_character_profile', 'search_assets',
  // ※ create_artifact, patch_artifact는 여기 넣지 않음!
]);
const usedArtifactTool = usedTools.has('create_artifact') || usedTools.has('patch_artifact');

// publishContent = stripProgressText(rawContent) — 진행 텍스트 필터링된 버전
const shouldForcePublish = (hasVisualTool && !isConversationalOnly(publishContent))
  || (result.toolCalls.length >= 2 && hasStructuredContent);

// 조건1: create_artifact HTML → 직접 출판
// 조건2: !usedArtifactTool && shouldForcePublish → markdown 출판
// 조건3: !usedArtifactTool && hasStructuredContent && len > 600 → markdown 출판
```

### 서버 세션 잠금 해제

```typescript
// vite-git-plugin.ts ~line 4322
const _activeRequests = new Map<string, number>()
function isRequestActive(sessionId: string): boolean {
  const ts = _activeRequests.get(sessionId)
  if (!ts) return false
  if (Date.now() - ts > 5 * 60 * 1000) {  // 5분 좀비 자동 해제
    _activeRequests.delete(sessionId)
    return false
  }
  return true
}
```

### 동적 max_tokens

```typescript
// vite-git-plugin.ts ~line 7073
const isSlackSource = userMessage.includes('[Slack 사용자:') || body.source === 'slack'
const ARTIFACT_KEYWORDS = /정리해줘|문서로|보고서|시트.*만들|...|전체/
const MAX_TOKENS = (isSlackSource || ARTIFACT_KEYWORDS.test(userMessage)) ? 16384 : 8192
```
