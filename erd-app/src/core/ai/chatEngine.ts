import type { ParsedSchema } from '../schema/types.ts';
import type { Row, TableDataMap } from '../query/schemaQueryEngine.ts';
import { executeDataSQL } from '../query/schemaQueryEngine.ts';
import { useSchemaStore } from '../../store/useSchemaStore.ts';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

export interface TableColumnInfo {
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  isUnique: boolean;
  isNotNull: boolean;
  defaultVal?: string;
  note?: string;
}

export interface TableRelation {
  direction: 'out' | 'in';
  table: string;
  fromCol: string;
  toCol: string;
  relType: string;
}

export interface TableSchemaInfo {
  id: string;               // 원본 테이블 ID (ERD 임베드용)
  name: string;
  group?: string;
  note?: string;
  columns: TableColumnInfo[];
  relations: TableRelation[];
}

export interface GitCommit {
  hash: string;
  short: string;
  date: string;
  author: string;
  message: string;
  files?: string[];
}

// ── ToolCallResult: 세 종류 구분 ─────────────────────────────────────────────

export interface DataQueryResult {
  kind: 'data_query';
  sql: string;
  reason?: string;
  columns: string[];
  rows: Row[];
  rowCount: number;
  error?: string;
  duration?: number;
}

export interface SchemaCardResult {
  kind: 'schema_card';
  reason?: string;
  tableName: string;
  tableId?: string;          // ERD 임베드용 실제 테이블 ID
  tableInfo?: TableSchemaInfo;
  error?: string;
  duration?: number;
}

export interface GitHistoryResult {
  kind: 'git_history';
  reason?: string;
  commits: GitCommit[];
  filterPath?: string;
  error?: string;
  duration?: number;
}

// ── 커밋 DIFF 결과 ────────────────────────────────────────────────────────────

export interface DiffLine {
  type: 'context' | 'add' | 'del';
  content: string;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffFile {
  path: string;
  oldPath: string;
  status: string;   // M / A / D / R
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  binary: boolean;
}

export interface CommitDiffMeta {
  hash: string;
  short: string;
  date: string;
  author: string;
  email: string;
  message: string;
}

export interface RevisionDiffResult {
  kind: 'revision_diff';
  reason?: string;
  commit?: CommitDiffMeta;
  files: DiffFile[];
  totalFiles: number;
  filterFile?: string;
  error?: string;
  duration?: number;
}

export interface ImageResult {
  kind: 'image_search';
  query: string;
  images: { name: string; relPath: string; url: string; isAtlas?: boolean }[];
  total: number;
  error?: string;
}

export interface ArtifactResult {
  kind: 'artifact';
  title: string;
  html: string;
  description: string;
  duration?: number;
  error?: string;
}

export interface ArtifactPatch {
  find: string;
  replace: string;
}

export interface ArtifactPatchResult {
  kind: 'artifact_patch';
  title?: string;
  patches: ArtifactPatch[];
  duration?: number;
  error?: string;
}

// ── 캐릭터 프로파일 (FK 자동 탐색) ──────────────────────────────────────────

export interface CharacterProfileNode {
  tableName: string;
  fkColumn: string;      // 이 테이블에서 캐릭터 PK를 참조하는 컬럼
  rowCount: number;
  columns: string[];
  sampleRows: Row[];
  // 2차 연결 (이 테이블을 참조하는 테이블들)
  children?: { tableName: string; fkColumn: string; rowCount: number }[];
}

export interface CharacterProfileResult {
  kind: 'character_profile';
  characterName: string;
  charTableName: string;
  charPK: string;
  character: Record<string, unknown>;   // 캐릭터 기본 필드
  connections: CharacterProfileNode[];
  totalRelatedRows: number;
  error?: string;
  duration?: number;
}

export type ToolCallResult = DataQueryResult | SchemaCardResult | GitHistoryResult | RevisionDiffResult | ImageResult | ArtifactResult | ArtifactPatchResult | CharacterProfileResult;

// ── ChatTurn ─────────────────────────────────────────────────────────────────

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: Date;
  /** max_tokens로 잘린 경우 tool_use/tool_result 전체 컨텍스트 저장 (계속해줘 지원) */
  rawMessages?: ClaudeMsg[];
}

// ── Claude Tool 정의 ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'query_game_data',
    description:
      '게임 데이터베이스에서 SQL SELECT 쿼리를 실행하여 실제 데이터를 조회합니다. 질문에 답하기 위해 필요한 데이터가 있을 때 사용하세요. 여러 번 호출해도 됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description:
            '실행할 SQL SELECT 쿼리. 테이블명은 대소문자 무시. ' +
            '#으로 시작하는 컬럼명은 반드시 백틱으로 감싸세요 (예: `#char_memo`). ' +
            '모든 값은 문자열입니다 (예: WHERE id = \'1001\'). LIKE 연산자 사용 가능.',
        },
        reason: {
          type: 'string',
          description: '이 쿼리를 실행하는 이유를 한 문장으로 설명하세요.',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'show_table_schema',
    description:
      '테이블의 스키마 구조를 시각적으로 보여줍니다. 사용자에게 테이블 구조, 컬럼, 관계를 설명할 때 호출하세요. 채팅 화면에 ERD 카드 형태로 임베드됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: '스키마를 보여줄 테이블 이름 (정확한 이름 또는 대소문자 무시)',
        },
        reason: {
          type: 'string',
          description: '이 테이블 스키마를 보여주는 이유.',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'query_git_history',
    description:
      'Git 커밋 히스토리를 조회합니다. 어떤 파일/테이블이 언제 변경됐는지, 최근 변경 이력을 알고 싶을 때 사용하세요.',
    input_schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '가져올 커밋 수 (기본 30)',
        },
        filter_path: {
          type: 'string',
          description: '특정 파일/폴더 경로로 필터링 (예: "ExcelFiles/Character.xlsx")',
        },
        reason: {
          type: 'string',
          description: '히스토리를 조회하는 이유.',
        },
      },
      required: [],
    },
  },
  {
    name: 'show_revision_diff',
    description:
      '특정 커밋의 변경 내용(DIFF)을 시각적으로 보여줍니다. 특정 리비전에서 무엇이 어떻게 바뀌었는지 상세히 확인할 때 사용하세요. query_git_history로 커밋 hash를 먼저 확인한 후 호출하세요.',
    input_schema: {
      type: 'object',
      properties: {
        commit_hash: {
          type: 'string',
          description: '확인할 커밋의 full hash 또는 short hash (예: "abc1234")',
        },
        file_path: {
          type: 'string',
          description: '특정 파일만 보려면 경로 지정 (예: "ExcelFiles/Character.xlsx"). 생략 시 전체 변경 파일.',
        },
        reason: {
          type: 'string',
          description: 'diff를 보는 이유.',
        },
      },
      required: ['commit_hash'],
    },
  },
  {
    name: 'find_resource_image',
    description:
      '게임 리소스 이미지(PNG)를 이름으로 검색하여 채팅창에 임베드합니다. ' +
      '아이콘, UI 이미지, 스프라이트 등을 찾을 때 사용하세요. ' +
      '예: 캐릭터 아이콘, 스킬 아이콘, 버튼 이미지 등.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색할 이미지 이름 또는 키워드 (예: "character_icon", "skill_btn", "vanguard")',
        },
        reason: {
          type: 'string',
          description: '이 이미지를 찾는 이유.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'build_character_profile',
    description:
      '캐릭터 이름으로 해당 캐릭터의 모든 연관 데이터를 FK 관계를 따라 자동 수집합니다. ' +
      '캐릭터 기획서, 프로파일, 카드, 개요, 사이트맵 생성 시 이 툴을 먼저 호출하세요. ' +
      '이름 검색 실패 시 반환된 전체 목록에서 확인 후 character_id로 재호출하세요.',
    input_schema: {
      type: 'object',
      properties: {
        character_name: {
          type: 'string',
          description: '조회할 캐릭터 이름 (한글 또는 영문, 부분 일치). 이름 검색 실패 시 반환된 목록에서 character_id를 찾아 재호출.',
        },
        character_id: {
          type: 'string',
          description: 'PK ID로 직접 검색 (이름 검색 실패 후 목록에서 확인한 ID). 예: "1001"',
        },
      },
      required: [],
    },
  },
  {
    name: 'patch_artifact',
    description:
      '⭐ [아티팩트 수정 요청] 메시지에 반드시 사용하세요. create_artifact 대신 이 툴을 사용하면 출력 토큰이 90% 절약됩니다. ' +
      '수정할 부분의 원본 텍스트(find)와 새 텍스트(replace) 쌍의 배열을 반환합니다. ' +
      '전체 HTML을 재생성하지 말고, 변경이 필요한 섹션만 패치하세요.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '문서 제목 (변경할 경우에만 입력, 생략 가능)',
        },
        patches: {
          type: 'array',
          description: '순서대로 적용할 find/replace 패치 목록',
          items: {
            type: 'object',
            properties: {
              find: {
                type: 'string',
                description:
                  '원본 HTML에서 찾을 정확한 텍스트. 충분히 고유한 문자열이어야 합니다 (10자 이상 권장). ' +
                  '공백/줄바꿈을 그대로 포함하세요.',
              },
              replace: {
                type: 'string',
                description: '찾은 텍스트를 대체할 새 텍스트.',
              },
            },
            required: ['find', 'replace'],
          },
        },
      },
      required: ['patches'],
    },
  },
  {
    name: 'create_artifact',
    description:
      '수집된 데이터를 기반으로 완전한 HTML 문서(보고서, 캐릭터 시트, 밸런스 표, 릴리즈 노트 등)를 생성합니다. ' +
      '사용자가 "정리해줘", "문서로 만들어줘", "보고서", "뽑아줘", "시트 만들어줘" 등을 요청할 때 호출하세요. ' +
      '먼저 query_game_data, show_table_schema 등으로 필요한 데이터를 모두 수집한 후 이 툴을 마지막에 호출하세요. ' +
      '⚠️ [아티팩트 수정 요청] 메시지에는 이 툴 대신 patch_artifact를 사용하세요.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '문서 제목 (예: "프리드웬 캐릭터 시트", "스킬 밸런스 보고서")',
        },
        description: {
          type: 'string',
          description: '생성된 문서에 대한 한 줄 설명',
        },
        html: {
          type: 'string',
          description:
            '<body> 태그 안에 들어갈 HTML 내용만 작성하세요 (<!DOCTYPE html>, <html>, <head>, <body> 태그 불필요). ' +
            '필요한 CSS는 <style> 태그로 html 값 안에 포함 가능. ' +
            '이미지: 경로 알면 /api/images/file?path=Texture/폴더/파일명.png, 불확실하면 /api/images/smart?name=파일명.png (폴더 몰라도 자동 검색). ' +
            '다크 테마(--bg:#0f1117, --text:#e2e8f0, --accent:#6366f1), 한국어, 표/카드 레이아웃. ' +
            '가능한 간결하게 핵심 정보만 담아 500줄 이내로 작성하세요.',
        },
      },
      required: ['title', 'description', 'html'],
    },
  },
];

// ── 시스템 프롬프트 빌더 ─────────────────────────────────────────────────────

function buildSystemPrompt(schema: ParsedSchema | null, tableData: TableDataMap): string {
  const lines: string[] = [];

  lines.push('당신은 이 게임의 모든 데이터를 꿰뚫고 있는 전문 게임 데이터 어시스턴트입니다.');
  lines.push('사용자의 질문에 답하기 위해 아래 도구들을 적극 활용하세요:');
  lines.push('- query_game_data: 실제 게임 데이터를 SQL로 조회');
  lines.push('- show_table_schema: 테이블 구조/관계도를 ERD 카드로 시각화. 테이블 설명 시 반드시 호출. 관계도 요청 시 관련 테이블 여러 개 연속 호출 가능');
  lines.push('- build_character_profile: 캐릭터명 → FK 연결 모든 데이터 자동 수집. 이름 검색 실패 시 전체 목록 반환 → character_id로 재호출. 캐릭터 기획서/프로파일 요청 시 반드시 먼저 호출.');
  lines.push('- query_git_history: 변경 이력 조회 (언제 무엇이 바뀌었는지)');
  lines.push('- show_revision_diff: 특정 커밋의 상세 변경 내용(DIFF) 시각화 (리비전 차이 확인 시 사용)');
  lines.push('- find_resource_image: 게임 리소스 이미지(PNG) 검색 및 채팅 임베드 (아이콘, UI 이미지 찾기 요청 시 사용)');
  lines.push('- create_artifact: 수집된 데이터로 완성된 HTML 문서/보고서 생성 (전체화면 프리뷰, PDF 저장 가능)');
  lines.push('- patch_artifact: ⭐ 기존 아티팩트 수정 시 사용 (find/replace 패치만 반환 → 토큰 90% 절약)');
  lines.push('');
  lines.push('[캐릭터 기획서/프로파일/데이터 시트뷰 — 반드시 준수]');
  lines.push('- "캐릭터 기획서", "[캐릭터명] 기획서", "프로파일", "캐릭터 카드", "개요" 요청 시: build_character_profile 먼저 → create_artifact 순서.');
  lines.push('- "데이터 다 제공해줘", "모든 데이터 보여줘", "시트뷰", "종합해줘", "전체 데이터" 요청 시도 동일하게 build_character_profile 먼저 호출.');
  lines.push('- build_character_profile 결과에 [EMBED_SQL] 힌트가 포함됨. 이 SQL을 data-embed="query" 태그에 그대로 사용하세요.');
  lines.push('- create_artifact 아티팩트는 아래 두 가지 레이아웃 중 요청에 맞게 선택:');
  lines.push('  (A) 기획서/개요 → 사이트맵/카드 레이아웃: 캐릭터 헤더 → 연결 테이블 카드 (데이터 수, 샘플 표시)');
  lines.push('  (B) 시트뷰/전체데이터 → 탭 레이아웃: 탭마다 연결 테이블 data-embed query 표시');
  lines.push('- ⭐ 탭 레이아웃 필수 JS 패턴:');
  lines.push('  <script>function showTab(id){document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===id));document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("active",p.dataset.panel===id));}</script>');
  lines.push('  탭 버튼: <button class="tab active" data-tab="basic" onclick="showTab(\'basic\')">기본정보</button>');
  lines.push('  패널: <div class="tab-panel active" data-panel="basic"><div data-embed="query" data-sql="[EMBED_SQL]"></div></div>');
  lines.push('');
  lines.push('[아티팩트 생성 규칙 — 반드시 준수]');
  lines.push('- "정리해줘", "문서로", "보고서", "시트 만들어줘", "뽑아줘" 등 요청 시 create_artifact를 호출하세요.');
  lines.push('- 데이터 수집이 끝나면 "생성하겠습니다" 같은 텍스트를 출력하지 말고 즉시 create_artifact를 호출하세요.');
  lines.push('- ⚠️ 절대로 "아티팩트를 만들겠습니다", "HTML을 생성하겠습니다" 등의 선언 후 멈추지 마세요. 선언 없이 즉시 툴을 호출하세요.');
  lines.push('- 반드시 먼저 다른 툴로 데이터를 충분히 수집한 후 create_artifact를 마지막에 호출하세요.');
  lines.push('- html 파라미터: <!DOCTYPE html> 없이 <body> 내용만 작성 (간결하게 500줄 이내).');
  lines.push('[이미지 경로 규칙]');
  lines.push('- 이미지 경로가 정확히 알려진 경우: /api/images/file?path=Texture/Character/icon_hero_striker.png');
  lines.push('- 이미지 경로가 불확실하거나 폴더를 모르는 경우: /api/images/smart?name=icon_hero_striker.png');
  lines.push('  → /api/images/smart 는 파일명만 알면 서버가 전체 디렉토리에서 자동 검색 (경로 추측 불필요)');
  lines.push('- find_resource_image 툴 결과의 relPath가 있으면 file?path= 사용, 없으면 smart?name= 사용 권장');
  lines.push('- Texture 하위 폴더: Character, Skill, Class, Weapon, BG, Profile, Rank, Synergy, TacticalPassive, Tier, Ingame, Coin, Clan, Map');
  lines.push('- 스타일: 다크 테마(배경 #0f1117, 텍스트 #e2e8f0, 포인트 #6366f1), 표/카드 레이아웃.');
  lines.push('');
  lines.push('[데이터 임베드 태그 — 컨텍스트 절약 및 실시간 데이터 표시]');
  lines.push('아티팩트 HTML 안에 아래 태그를 쓰면 실제 데이터가 자동으로 삽입됩니다. 데이터를 직접 HTML에 쓰는 것보다 이 방법이 훨씬 좋습니다:');
  lines.push('');
  lines.push('1. 스키마 구조 임베드: <div data-embed="schema" data-table="테이블명"></div>');
  lines.push('   예) <div data-embed="schema" data-table="Character"></div>');
  lines.push('   → 컬럼 목록, PK/FK 속성, FK 관계 테이블 등이 자동 렌더링됨');
  lines.push('');
  lines.push('2. 쿼리 결과 임베드: <div data-embed="query" data-sql="SELECT 문"></div>');
  lines.push('   예) <div data-embed="query" data-sql="SELECT id, name, type FROM Perk LIMIT 20"></div>');
  lines.push('   예) <div data-embed="query" data-sql="SELECT * FROM PerkEffect WHERE perk_id=\'101\'"></div>');
  lines.push('   → SQL 실행 결과가 데이터 테이블로 자동 렌더링됨. 데이터를 직접 HTML에 쓰지 말고 이 태그 사용 권장');
  lines.push('   ⚠️ data-sql 작성 규칙:');
  lines.push('      - 속성은 항상 큰따옴표(")로 감싸세요: data-sql="SQL"');
  lines.push('      - SQL 내에 큰따옴표가 필요하면 &quot; 사용');
  lines.push('      - #으로 시작하는 컬럼은 백틱으로 감싸되 별칭(AS)을 반드시 완성: `#effect_group` AS effect_group');
  lines.push('      - SQL은 반드시 완전한 문장이어야 합니다 (AS 뒤 alias, FROM 뒤 테이블명 등 생략 금지)');
  lines.push('');
  lines.push('3. 관계도 임베드: <div data-embed="relations" data-table="테이블명"></div>');
  lines.push('   예) <div data-embed="relations" data-table="Character"></div>');
  lines.push('   → 해당 테이블의 FK 관계망이 자동 렌더링됨');
  lines.push('');
  lines.push('4. ⭐ 관계 그래프 임베드 (Mermaid 자동 생성): <div data-embed="graph" data-tables="T1,T2,T3"></div>');
  lines.push('   예) <div data-embed="graph" data-tables="Character,Skill,SkillEffect"></div>');
  lines.push('   또는 단일 테이블 + 직접 연결: <div data-embed="graph" data-table="Character"></div>');
  lines.push('   → 지정 테이블 간 FK 관계를 Mermaid LR 다이어그램으로 자동 렌더링');
  lines.push('   ⚠️ ASCII 아트(박스 그림)로 직접 그리지 말 것! 이 태그 사용으로 컨텍스트 대폭 절약');
  lines.push('');
  lines.push('5. Mermaid 커스텀 다이어그램: <div class="mermaid">graph LR\n  A-->B\n  B-->C</div>');
  lines.push('   → Mermaid.js가 자동 렌더링. 플로우차트, 시퀀스, ER 다이어그램 등 가능');
  lines.push('   예) 시스템 흐름: <div class="mermaid">graph TD\n  Player-->|스킬사용|SkillSystem\n  SkillSystem-->|데미지계산|DamageCalc</div>');
  lines.push('   ⚠️ ASCII 아트 대신 반드시 Mermaid 사용! 훨씬 보기 좋고 토큰도 절약됨');
  lines.push('');
  lines.push('⭐ 활용법: 기획서 작성 시 query_game_data 대신 data-embed="query" 태그를 HTML에 직접 쓰면:');
  lines.push('   - Claude 응답 토큰 크게 절약');
  lines.push('   - 항상 최신 실제 데이터 표시');
  lines.push('   - HTML로 저장해도 서버에서 데이터를 렌더링하므로 완전한 문서 보존');
  lines.push('');
  lines.push('[중요] "관계도 보여줘", "ERD 보여줘" 요청에는 가장 핵심이 되는 테이블 1개만 show_table_schema를 호출하세요.');
  lines.push('       ERD 카드 안에 연결 테이블이 모두 표시되므로 관련 테이블을 여러 번 반복 호출하지 마세요.');
  lines.push('');
  lines.push('## 아티팩트 수정 요청 처리 — [아티팩트 수정 요청] 메시지 전용');
  lines.push('사용자 메시지가 "[아티팩트 수정 요청]"으로 시작하면:');
  lines.push('1. ⭐ 반드시 patch_artifact 툴을 사용하세요. create_artifact 절대 사용 금지!');
  lines.push('   - patch_artifact: 변경된 부분만 find/replace로 전달 → 출력 토큰 90% 절약, 10배 빠름');
  lines.push('   - create_artifact: 전체 HTML 재생성 → 토큰 낭비, 느림, 사용 금지');
  lines.push('2. 추가 데이터 조회 없이 즉시 patch_artifact를 호출하세요.');
  lines.push('3. patches 작성 규칙:');
  lines.push('   - find: 원본 HTML에서 수정할 부분의 정확한 텍스트 (최소 15자 이상, 고유한 문자열)');
  lines.push('   - replace: 새 텍스트로 대체. 변경하지 않는 부분은 find/replace에 포함하지 마세요');
  lines.push('   - embed 태그(data-embed="...")는 절대 삭제/교체하지 말고 그대로 보존');
  lines.push('4. 수정 범위가 넓으면 여러 패치로 분할하되, 각 패치의 find는 반드시 원본과 완전히 일치해야 합니다.');
  lines.push('');
  lines.push('답변은 반드시 한국어로 작성하세요.');
  lines.push('단순 나열이 아닌, 의미있는 해석과 함께 친절하게 설명하세요.');
  lines.push('');

  if (schema) {
    const totalCols = schema.tables.reduce((s, t) => s + t.columns.length, 0);
    lines.push('## 데이터베이스 개요');
    lines.push(
      `테이블 ${schema.tables.length}개 | 컬럼 ${totalCols}개 | 관계 ${schema.refs.length}개 | Enum ${schema.enums.length}개`,
    );
    lines.push('');

    lines.push('## 테이블 목록');
    const nameById = new Map(schema.tables.map((t) => [t.id, t.name]));

    // 경량화: 테이블명 + PK만 표시 (컬럼 상세 제거)
    const groupMap = new Map<string, typeof schema.tables>();
    for (const t of schema.tables) {
      const g = t.groupName ?? '(미분류)';
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(t);
    }

    for (const [grp, tables] of groupMap) {
      const names = tables.map(t => {
        const pk = t.columns.find(c => c.isPrimaryKey)?.name ?? '';
        return pk ? `${t.name}(pk:${pk})` : t.name;
      }).join(', ');
      lines.push(`[${grp}] ${names}`);
    }
    lines.push('');

    if (schema.refs.length > 0) {
      lines.push('## 주요 관계');
      for (const r of schema.refs.slice(0, 40)) {
        const from = nameById.get(r.fromTable) ?? r.fromTable;
        const to = nameById.get(r.toTable) ?? r.toTable;
        lines.push(`${from}.${r.fromColumns[0]} → ${to}.${r.toColumns[0]}`);
      }
      if (schema.refs.length > 40) lines.push(`... 외 ${schema.refs.length - 40}개`);
      lines.push('');
    }

    if (schema.enums.length > 0 && schema.enums.length <= 20) {
      lines.push('## Enum');
      for (const e of schema.enums.slice(0, 15)) {
        lines.push(`${e.name}: ${e.values.slice(0, 8).map((v) => v.name).join(', ')}`);
      }
      lines.push('');
    }
  }

  lines.push('## 로드된 실제 데이터 테이블');
  for (const [key, { rows }] of tableData) {
    lines.push(`- ${key}: ${rows.length}행`);
  }
  lines.push('');

  lines.push('## SQL 규칙');
  lines.push('- 테이블명: 대소문자 무시 (skill, Skill, SKILL 모두 동작)');
  lines.push('- #접두사 컬럼: 반드시 백틱 → `#char_memo`');
  lines.push("- 모든 값은 문자열 → WHERE id = '1001'");
  lines.push('- 숫자 비교: CAST(level AS NUMBER) > 10');
  lines.push('- 컬럼명은 소문자로 저장됨');

  return lines.join('\n');
}

// ── 테이블 스키마 조회 (로컬) ────────────────────────────────────────────────

function resolveTableSchema(tableName: string, schema: ParsedSchema): TableSchemaInfo | null {
  const lower = tableName.toLowerCase();
  const table = schema.tables.find(
    (t) => t.name.toLowerCase() === lower || t.alias?.toLowerCase() === lower,
  );
  if (!table) return null;

  const nameById = new Map(schema.tables.map((t) => [t.id, t.name]));

  const columns: TableColumnInfo[] = table.columns.map((c) => ({
    name: c.name,
    type: c.type,
    isPK: c.isPrimaryKey,
    isFK: c.isForeignKey,
    isUnique: c.isUnique ?? false,
    isNotNull: c.isNotNull ?? false,
    defaultVal: c.defaultValue ?? undefined,
    note: c.note ?? undefined,
  }));

  const relations: TableRelation[] = [];
  for (const r of schema.refs) {
    if (r.fromTable === table.id) {
      relations.push({
        direction: 'out',
        table: nameById.get(r.toTable) ?? r.toTable,
        fromCol: r.fromColumns.join(', '),
        toCol: r.toColumns.join(', '),
        relType: r.type,
      });
    } else if (r.toTable === table.id) {
      relations.push({
        direction: 'in',
        table: nameById.get(r.fromTable) ?? r.fromTable,
        fromCol: r.fromColumns.join(', '),
        toCol: r.toColumns.join(', '),
        relType: r.type,
      });
    }
  }

  return { id: table.id, name: table.name, group: table.groupName ?? undefined, note: table.note ?? undefined, columns, relations };
}

// ── Git 히스토리 조회 ────────────────────────────────────────────────────────

async function fetchGitHistory(count: number, filterPath?: string): Promise<GitCommit[]> {
  const params = new URLSearchParams({
    count: String(count),
    include_files: 'true',
  });
  if (filterPath) params.set('path', filterPath);

  const res = await fetch(`/api/git/log?${params}`);
  if (!res.ok) throw new Error(`Git log 조회 실패: ${res.status}`);
  const data = await res.json();
  return (data.commits ?? []) as GitCommit[];
}

// ── Claude API 메시지 타입 ───────────────────────────────────────────────────

type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type ContentBlock = TextBlock | ToolUseBlock;

interface ClaudeResponse {
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
}

export type ClaudeMsg =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'user'; content: { type: 'tool_result'; tool_use_id: string; content: string }[] }
  | { role: 'assistant'; content: ContentBlock[] };

/**
 * messages 배열에서 tool_use 없이 tool_result가 없는 orphan을 제거해 Claude API 포맷 준수
 */
function sanitizeMessages(messages: ClaudeMsg[]): ClaudeMsg[] {
  const result: ClaudeMsg[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    result.push(msg);
    // assistant 메시지에 tool_use 블록이 있으면 다음 메시지가 tool_result인지 확인
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      const toolUseIds = (msg.content as ContentBlock[])
        .filter((b): b is ToolUseBlock => b.type === 'tool_use')
        .map((b) => b.id);
      if (toolUseIds.length === 0) continue;

      const next = messages[i + 1];
      const nextIsToolResult =
        next &&
        next.role === 'user' &&
        Array.isArray(next.content) &&
        (next.content as Array<{ type: string }>).some((b) => b.type === 'tool_result');

      if (!nextIsToolResult) {
        // orphan tool_use 발견 → 빈 tool_result 삽입
        console.warn('[sanitizeMessages] orphan tool_use 감지, 빈 tool_result 삽입:', toolUseIds);
        result.push({
          role: 'user',
          content: toolUseIds.map((id) => ({
            type: 'tool_result' as const,
            tool_use_id: id,
            content: '(응답이 잘렸습니다 — 해당 도구 결과 없음)',
          })),
        });
      }
    }
  }
  return result;
}

/**
 * ChatTurn → Claude API messages 변환
 * rawMessages가 있는 assistant 턴은 전체 tool_use/tool_result 교환을 복원합니다.
 */
function historyToMessages(history: ChatTurn[]): ClaudeMsg[] {
  const result: ClaudeMsg[] = [];
  let i = 0;
  while (i < history.length) {
    const turn = history[i];
    // user 턴 + 다음 assistant 턴에 rawMessages가 있으면 → 전체 교환 복원
    if (turn.role === 'user' && i + 1 < history.length) {
      const next = history[i + 1];
      if (next.role === 'assistant' && next.rawMessages && next.rawMessages.length > 0) {
        result.push(...sanitizeMessages(next.rawMessages));
        i += 2;
        continue;
      }
    }
    result.push({ role: turn.role as 'user' | 'assistant', content: turn.content });
    i++;
  }
  return result;
}

// ── SSE 스트리밍 파서 ────────────────────────────────────────────────────────

// partial JSON 에서 html 값을 추출 (완성되지 않은 JSON도 처리)
function extractHtmlFromPartialJson(partialJson: string): { title: string; html: string } | null {
  const titleMatch = partialJson.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const htmlStartMatch = partialJson.match(/"html"\s*:\s*"/);
  if (!htmlStartMatch) return null;

  const htmlStart = htmlStartMatch.index! + htmlStartMatch[0].length;
  let raw = partialJson.slice(htmlStart);

  // 닫히지 않은 JSON 문자열이므로 끝 따옴표 전까지만
  let result = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const esc = raw[i + 1];
      if (esc === 'n') result += '\n';
      else if (esc === 't') result += '\t';
      else if (esc === 'r') result += '\r';
      else if (esc === '"') result += '"';
      else if (esc === '\\') result += '\\';
      else result += raw[i + 1];
      i += 2;
    } else if (raw[i] === '"') {
      break; // 문자열 종료
    } else {
      result += raw[i];
      i++;
    }
  }

  return {
    title: titleMatch ? titleMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
    html: result,
  };
}

async function streamClaude(
  requestBody: object,
  onTextDelta: (delta: string) => void,
  onArtifactProgress?: (html: string, title: string, charCount: number) => void,
): Promise<ClaudeResponse> {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...requestBody, stream: true }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 529) throw new Error('Claude 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.');
    throw new Error(`Claude API 오류 (${response.status}): ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  // 블록별 누적
  const blocks: Record<number, ContentBlock & { _inputStr?: string }> = {};
  let stopReason: ClaudeResponse['stop_reason'] = 'end_turn';
  let buf = '';
  let lastEventType = ''; // SSE event: 타입 추적

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      // SSE event: 타입 추적 (error 이벤트 감지용)
      if (line.startsWith('event: ')) {
        lastEventType = line.slice(7).trim();
        continue;
      }

      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;

      let ev: Record<string, unknown>;
      try { ev = JSON.parse(raw); } catch { continue; }

      // Anthropic SSE 에러 이벤트 처리
      if (lastEventType === 'error' || ev.type === 'error') {
        const errObj = ev.error as { type?: string; message?: string } | undefined;
        const msg = errObj?.message ?? JSON.stringify(ev);
        console.error('[streamClaude] SSE error event:', msg);
        throw new Error(`Claude API 오류: ${msg}`);
      }
      lastEventType = '';

      switch (ev.type) {
        case 'content_block_start': {
          const idx = ev.index as number;
          const cb = ev.content_block as ContentBlock;
          if (cb.type === 'tool_use') {
            blocks[idx] = { ...cb, _inputStr: '' } as ContentBlock & { _inputStr: string };
            // create_artifact / patch_artifact 블록 시작 즉시 패널 오픈
            if (((cb as ToolUseBlock).name === 'create_artifact' || (cb as ToolUseBlock).name === 'patch_artifact') && onArtifactProgress) {
              onArtifactProgress('', '', 0);
            }
          } else {
            blocks[idx] = { ...cb } as ContentBlock;
          }
          break;
        }
        case 'content_block_delta': {
          const idx = ev.index as number;
          const delta = ev.delta as { type: string; text?: string; partial_json?: string };
          const b = blocks[idx];
          if (!b) break;
          if (delta.type === 'text_delta' && b.type === 'text') {
            (b as TextBlock).text = ((b as TextBlock).text || '') + (delta.text ?? '');
            onTextDelta(delta.text ?? '');
          } else if (delta.type === 'input_json_delta' && b.type === 'tool_use') {
            const tb = b as ContentBlock & { _inputStr: string };
            tb._inputStr = (tb._inputStr || '') + (delta.partial_json ?? '');

            // create_artifact: html 필드 유무 상관없이 title + html 추출해서 진행 전달
            if ((b as ToolUseBlock).name === 'create_artifact' && onArtifactProgress) {
              const parsed = extractHtmlFromPartialJson(tb._inputStr);
              // html 없어도 title은 실시간으로 추출 (패널 타이틀 업데이트)
              const titleMatch = tb._inputStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)/) ;
              const liveTitle = parsed?.title || (titleMatch ? titleMatch[1].replace(/\\"/g, '"') : '');
              onArtifactProgress(parsed?.html ?? '', liveTitle, parsed?.html.length ?? 0);
            }
          }
          break;
        }
        case 'content_block_stop': {
          const idx = ev.index as number;
          const b = blocks[idx];
          if (b?.type === 'tool_use') {
            const rawStr = (b as ContentBlock & { _inputStr: string })._inputStr || '{}';
            try {
              (b as ToolUseBlock).input = JSON.parse(rawStr);
            } catch {
              // JSON 파싱 실패 (max_tokens로 잘린 경우) → 부분 복구 시도
              const partial = extractHtmlFromPartialJson(rawStr);
              if (partial && (b as ToolUseBlock).name === 'create_artifact') {
                const titleMatch = rawStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                const descMatch = rawStr.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                (b as ToolUseBlock).input = {
                  title: titleMatch?.[1] ?? partial.title ?? '문서',
                  description: descMatch?.[1] ?? '',
                  html: partial.html + '\n<!-- (일부 잘림) -->',
                };
              } else {
                (b as ToolUseBlock).input = {};
              }
            }
          }
          break;
        }
        case 'message_delta': {
          const delta = ev.delta as { stop_reason?: string };
          if (delta.stop_reason) stopReason = delta.stop_reason as ClaudeResponse['stop_reason'];
          break;
        }
      }
    }
  }

  const contentArray = Object.entries(blocks)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, b]) => {
      // _inputStr은 내부 누적용 임시 필드 → API 재전송 시 제거
      const { _inputStr: _unused, ...clean } = b as ContentBlock & { _inputStr?: string };
      void _unused;
      return clean as ContentBlock;
    });

  return { content: contentArray, stop_reason: stopReason };
}

// ── 메인 함수 ────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  userMessage: string,
  history: ChatTurn[],
  schema: ParsedSchema | null,
  tableData: TableDataMap,
  onToolCall?: (tc: ToolCallResult, index: number) => void,
  onTextDelta?: (delta: string, fullText: string) => void,
  onArtifactProgress?: (html: string, title: string, charCount: number) => void,
): Promise<{ content: string; toolCalls: ToolCallResult[]; rawMessages?: ClaudeMsg[] }> {
  // 컴포넌트가 아직 로딩 중일 때 schema가 null일 수 있으므로 스토어에서 fallback
  const effectiveSchema = schema ?? useSchemaStore.getState().schema;
  const systemPrompt = buildSystemPrompt(effectiveSchema, tableData);

  const messages: ClaudeMsg[] = [
    ...historyToMessages(history),
    { role: 'user', content: userMessage },
  ];

  const allToolCalls: ToolCallResult[] = [];
  const MAX_ITERATIONS = 10;
  let accumulatedText = '';

  const requestBase = {
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    system: systemPrompt,
    tools: TOOLS,
  };

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    accumulatedText = '';
    console.log(`[Chat] 이터레이션 ${i + 1}/${MAX_ITERATIONS} 시작, messages: ${messages.length}`);

    // 529 재시도 포함 스트리밍 호출
    let data: ClaudeResponse | null = null;
    const safeMessages = sanitizeMessages(messages); // orphan tool_use 방어
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000 * attempt));
      try {
        data = await streamClaude(
          { ...requestBase, messages: safeMessages },
          (delta) => {
            accumulatedText += delta;
            onTextDelta?.(delta, accumulatedText);
          },
          onArtifactProgress,
        );
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('529') || msg.includes('과부하')) {
          if (attempt === 2) throw err;
        } else {
          throw err;
        }
      }
    }
    if (!data) throw new Error('Claude API 연결 실패');
    console.log(`[Chat] 이터레이션 ${i + 1} 완료: stop_reason=${data.stop_reason}, blocks=${data.content.length}, text="${accumulatedText.slice(0, 60)}"`);

    // ── 최종 답변 ──
    if (data.stop_reason === 'end_turn' || data.stop_reason === 'stop_sequence') {
      const text = data.content
        .filter((b): b is TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      // 아티팩트 선언만 하고 툴을 호출하지 않은 경우 → 강제로 재요청
      const ARTIFACT_INTENT = /생성하겠습니다|만들겠습니다|작성하겠습니다|뽑겠습니다|정리하겠습니다/;
      const hasArtifactIntent = ARTIFACT_INTENT.test(text);
      const alreadyHasArtifact = allToolCalls.some(tc => tc.kind === 'artifact');
      const userWantsArtifact = /정리해줘|문서로|보고서|시트.*만들|뽑아줘|만들어줘/.test(
        messages.find(m => m.role === 'user')?.content as string ?? ''
      );

      if (hasArtifactIntent && !alreadyHasArtifact && userWantsArtifact && allToolCalls.length > 0) {
        // Claude가 선언만 하고 멈춤 → 재촉
        messages.push({ role: 'assistant', content: data.content });
        messages.push({
          role: 'user',
          content: '지금 바로 create_artifact 툴을 호출하여 HTML 문서를 생성해주세요. 텍스트 설명 없이 즉시 툴을 호출하세요.',
        });
        continue;
      }

      return { content: text, toolCalls: allToolCalls };
    }

    // ── 도구 호출 처리 ──
    if (data.stop_reason === 'tool_use') {
      const toolBlocks = data.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
      messages.push({ role: 'assistant', content: data.content });

      const toolResults: { type: 'tool_result'; tool_use_id: string; content: string }[] = [];

      // 툴 병렬 처리
      const toolResultsMap = new Map<string, string>();
      const toolCallsMap = new Map<string, ToolCallResult>();

      await Promise.all(toolBlocks.map(async (tb) => {
        const inp = tb.input as Record<string, unknown>;
        let resultStr = '';
        let tc: ToolCallResult;

        // ── query_game_data ──
        if (tb.name === 'query_game_data') {
          const sql = String(inp.sql ?? '');
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();
          const qr = executeDataSQL(sql, tableData, effectiveSchema ?? undefined);
          const duration = performance.now() - t0;

          tc = {
            kind: 'data_query',
            sql,
            reason,
            columns: qr.columns,
            rows: qr.rows,
            rowCount: qr.rowCount,
            error: qr.error,
            duration,
          };

          if (qr.error) {
            resultStr = `SQL 오류: ${qr.error}`;
          } else if (qr.rowCount === 0) {
            resultStr = '결과 없음 (0행)';
          } else {
            resultStr = JSON.stringify({
              rowCount: qr.rowCount,
              returned: Math.min(qr.rowCount, 100),
              columns: qr.columns,
              rows: qr.rows.slice(0, 100),
            });
          }
        }

        // ── show_table_schema ──
        else if (tb.name === 'show_table_schema') {
          const tableName = String(inp.table_name ?? '');
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();

          // schema 파라미터가 null이면 스토어에서 직접 최신 값 조회
          const resolvedSchema = schema ?? useSchemaStore.getState().schema;

          if (!resolvedSchema) {
            tc = { kind: 'schema_card', tableName, reason, error: '스키마가 로드되지 않았습니다.', duration: 0 } as SchemaCardResult;
            resultStr = '스키마 정보 없음';
          } else {
            const tableInfo = resolveTableSchema(tableName, resolvedSchema);
            const duration = performance.now() - t0;
            if (!tableInfo) {
              tc = { kind: 'schema_card', tableName, reason, error: `테이블 '${tableName}'을 찾을 수 없습니다.`, duration };
              resultStr = `테이블 '${tableName}' 없음`;
            } else {
              tc = { kind: 'schema_card', tableName: tableInfo.name, tableId: tableInfo.id, reason, tableInfo, duration };
              // Claude에게 전달할 텍스트 요약
              const colSummary = tableInfo.columns
                .map((c) => {
                  const flags = [c.isPK && 'PK', c.isFK && 'FK', c.isNotNull && 'NOT NULL', c.isUnique && 'UNIQUE'].filter(Boolean).join(', ');
                  return `  - ${c.name} (${c.type})${flags ? ` [${flags}]` : ''}${c.note ? ` — ${c.note}` : ''}`;
                })
                .join('\n');
              const relSummary = tableInfo.relations
                .map((r) => `  - ${r.direction === 'out' ? '→' : '←'} ${r.table} (${r.fromCol} ↔ ${r.toCol}, ${r.relType})`)
                .join('\n');
              resultStr = `테이블: ${tableInfo.name} (그룹: ${tableInfo.group ?? '-'})\n컬럼:\n${colSummary}\n관계:\n${relSummary || '  없음'}`;
            }
          }
        }

        // ── query_git_history ──
        else if (tb.name === 'query_git_history') {
          const count = typeof inp.count === 'number' ? inp.count : 30;
          const filterPath = inp.filter_path ? String(inp.filter_path) : undefined;
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();

          try {
            const commits = await fetchGitHistory(count, filterPath);
            const duration = performance.now() - t0;
            tc = { kind: 'git_history', reason, commits, filterPath, duration };
            resultStr = JSON.stringify({
              count: commits.length,
              commits: commits.map((c) => ({
                short: c.short,
                date: c.date,
                author: c.author,
                message: c.message,
                files: c.files?.slice(0, 10),
              })),
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            tc = { kind: 'git_history', reason, commits: [], filterPath, error: msg, duration: performance.now() - t0 };
            resultStr = `Git 히스토리 조회 오류: ${msg}`;
          }
        }
        // ── show_revision_diff ──
        else if (tb.name === 'show_revision_diff') {
          const commitHash = String(inp.commit_hash || '');
          const filePath = inp.file_path ? String(inp.file_path) : undefined;
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();

          if (!commitHash) {
            tc = { kind: 'revision_diff', reason, commit: undefined, files: [], totalFiles: 0, error: 'commit_hash가 필요합니다.' };
            resultStr = 'commit_hash 파라미터가 없습니다.';
          } else {
            try {
              const params = new URLSearchParams({ hash: commitHash });
              if (filePath) params.append('file', filePath);
              const resp = await fetch(`/api/git/commit-diff?${params.toString()}`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const data = await resp.json();
              const duration = performance.now() - t0;
              tc = {
                kind: 'revision_diff',
                reason,
                commit: data.commit,
                files: data.files || [],
                totalFiles: data.totalFiles || 0,
                filterFile: filePath,
                duration,
              } as RevisionDiffResult;
              resultStr = JSON.stringify({
                commit: data.commit?.short,
                message: data.commit?.message,
                totalFiles: data.totalFiles,
                files: (data.files || []).slice(0, 5).map((f: DiffFile) => ({
                  path: f.path,
                  status: f.status,
                  additions: f.additions,
                  deletions: f.deletions,
                })),
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              tc = { kind: 'revision_diff', reason, commit: undefined, files: [], totalFiles: 0, filterFile: filePath, error: msg, duration: performance.now() - t0 } as RevisionDiffResult;
              resultStr = `DIFF 조회 오류: ${msg}`;
            }
          }
        }
        // ── find_resource_image ──
        else if (tb.name === 'find_resource_image') {
          const query = String(inp.query ?? '');
          const reason = inp.reason ? String(inp.reason) : undefined;
          try {
            const resp = await fetch(`/api/images/list?q=${encodeURIComponent(query)}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json() as { total: number; results: { name: string; relPath: string }[] };
            const images = data.results.map((r: { name: string; relPath: string; isAtlas?: boolean }) => ({
              name: r.name,
              relPath: r.relPath,
              url: `/api/images/file?path=${encodeURIComponent(r.relPath)}`,
              isAtlas: r.isAtlas ?? false,
            }));
            tc = { kind: 'image_search', query, images, total: data.total } as ImageResult;
            resultStr = images.length > 0
              ? `${images.length}개 이미지 발견: ${images.map((i) => i.name).join(', ')}`
              : `"${query}" 이미지 없음 (전체 ${data.total}개 중)`;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            tc = { kind: 'image_search', query, images: [], total: 0, error: msg } as ImageResult;
            resultStr = `이미지 검색 오류: ${msg}`;
          }
        }

        // ── build_character_profile ──
        else if (tb.name === 'build_character_profile') {
          const charName = String(inp.character_name ?? inp.character_id ?? '');
          const directCharId = inp.character_id ? String(inp.character_id) : null;
          const t0 = performance.now();
          const resolvedSchema = schema ?? useSchemaStore.getState().schema;

          if (!resolvedSchema) {
            tc = { kind: 'character_profile', characterName: charName, charTableName: '', charPK: '', character: {}, connections: [], totalRelatedRows: 0, error: '스키마가 없습니다.', duration: 0 } as CharacterProfileResult;
            resultStr = '오류: 스키마 없음';
          } else {
            // 1. 캐릭터 테이블 탐색 — 'Character'처럼 정확한 이름 우선, 부분 매칭 후순위
            const charKeywords = ['character', '캐릭터'];
            const allMatchedTables = resolvedSchema.tables.filter(t =>
              charKeywords.some(k => t.name.toLowerCase().includes(k))
            );
            // 정확히 'character'인 테이블 우선, 없으면 첫 번째 매칭
            const charTable = allMatchedTables.find(t => t.name.toLowerCase() === 'character')
              ?? allMatchedTables.find(t => t.name.toLowerCase() === 'characters')
              ?? allMatchedTables[0];

            if (!charTable) {
              tc = { kind: 'character_profile', characterName: charName, charTableName: '', charPK: '', character: {}, connections: [], totalRelatedRows: 0, error: '캐릭터 테이블을 찾을 수 없습니다.' } as CharacterProfileResult;
              resultStr = '오류: 캐릭터 테이블 없음';
            } else {
              // 2. PK 컬럼 (소문자 — executeDataSQL이 컬럼명 소문자 정규화)
              const pkCol = (charTable.columns.find(c => c.isPrimaryKey)?.name ?? 'id').toLowerCase();

              let character: Record<string, unknown> | null = null;

              // 전략 0: character_id 직접 지정된 경우 PK로 바로 검색
              if (directCharId) {
                const isNumericId = !isNaN(Number(directCharId)) && directCharId.trim() !== '';
                // 0-a: 숫자형 비교 (PK가 INT인 경우)
                if (isNumericId) {
                  try {
                    const r = await executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE ${pkCol} = ${Number(directCharId)} LIMIT 1`,
                      tableData,
                    );
                    if (r.rows.length > 0) character = r.rows[0] as Record<string, unknown>;
                  } catch { /* skip */ }
                }
                // 0-b: 문자열 비교 (PK가 VARCHAR인 경우)
                if (!character) {
                  try {
                    const r = await executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE ${pkCol} = '${directCharId.replace(/'/g, "''")}' LIMIT 1`,
                      tableData,
                    );
                    if (r.rows.length > 0) character = r.rows[0] as Record<string, unknown>;
                  } catch { /* skip */ }
                }
                // 0-c: JS 전체 탐색 폴백 (타입 불일치 최후 수단)
                if (!character) {
                  try {
                    const allRows = await executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 500`, tableData);
                    const found = allRows.rows.find(row =>
                      Object.values(row as Record<string, unknown>).some(v => String(v) === directCharId),
                    );
                    if (found) character = found as Record<string, unknown>;
                  } catch { /* skip */ }
                }
              }

              if (!character && charName) {
                // 전략 1: name/이름 패턴 컬럼에서 LIKE 검색
                const nameColumns = charTable.columns
                  .filter(c => /name|이름/i.test(c.name))
                  .map(c => c.name.toLowerCase());
                if (nameColumns.length === 0) nameColumns.push('name');

                const safeInput = charName.replace(/'/g, "''");
                for (const nc of nameColumns) {
                  try {
                    const r = await executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE LOWER(${nc}) LIKE LOWER('%${safeInput}%') LIMIT 1`,
                      tableData,
                    );
                    if (r.rows.length > 0) { character = r.rows[0] as Record<string, unknown>; break; }
                  } catch { /* 비문자열 컬럼 스킵 */ }
                }

                // 전략 2: 전체 컬럼에서 LIKE 검색
                if (!character) {
                  const allColumns = charTable.columns.map(c => c.name.toLowerCase());
                  for (const nc of allColumns) {
                    try {
                      const r = await executeDataSQL(
                        `SELECT * FROM "${charTable.name}" WHERE LOWER(${nc}) LIKE LOWER('%${safeInput}%') LIMIT 1`,
                        tableData,
                      );
                      if (r.rows.length > 0) { character = r.rows[0] as Record<string, unknown>; break; }
                    } catch { /* skip */ }
                  }
                }

                // 전략 3: JS 측 완전 탐색 (인코딩/특수문자 차이 대비)
                if (!character) {
                  try {
                    const allRows = await executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 500`, tableData);
                    const lowerInput = charName.toLowerCase();
                    const found = allRows.rows.find(row =>
                      Object.values(row as Record<string, unknown>).some(v =>
                        typeof v === 'string' && v.toLowerCase().includes(lowerInput)
                      )
                    );
                    if (found) character = found as Record<string, unknown>;
                  } catch { /* skip */ }
                }
              }

              if (!character) {
                // 실패 시 — 전체 캐릭터 목록 반환 (Claude가 재호출할 수 있도록)
                try {
                  const allChars = await executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 100`, tableData);
                  const charList = allChars.rows.map((row, i) => {
                    const r = row as Record<string, unknown>;
                    return `[${i + 1}] ${Object.entries(r).slice(0, 6).map(([k, v]) => `${k}=${v}`).join(', ')}`;
                  }).join('\n');
                  const errMsg = charName
                    ? `"${charName}"을(를) 찾지 못했습니다. 아래 전체 목록에서 확인 후 character_id로 재호출하세요.\n\n${charTable.name} 전체 목록 (${allChars.rowCount}개):\n${charList}`
                    : `character_name 또는 character_id를 입력하세요.\n\n${charTable.name} 전체 목록 (${allChars.rowCount}개):\n${charList}`;
                  tc = { kind: 'character_profile', characterName: charName, charTableName: charTable.name, charPK: pkCol, character: {}, connections: [], totalRelatedRows: 0, error: errMsg, duration: performance.now() - t0 } as CharacterProfileResult;
                  resultStr = errMsg;
                } catch (err2) {
                  tc = { kind: 'character_profile', characterName: charName, charTableName: charTable.name, charPK: pkCol, character: {}, connections: [], totalRelatedRows: 0, error: `캐릭터 검색 실패: ${String(err2)}`, duration: performance.now() - t0 } as CharacterProfileResult;
                  resultStr = `캐릭터 검색 실패: ${String(err2)}`;
                }
              } else {
                const charId = character[pkCol];
                // charId가 숫자면 숫자 리터럴, 아니면 문자열 리터럴
                const charIdStr = String(charId);
                const charIdLiteral = !isNaN(Number(charIdStr)) && charIdStr.trim() !== ''
                  ? charIdStr  // 숫자 그대로 (따옴표 없음)
                  : `'${charIdStr.replace(/'/g, "''")}'`;

                // 4. Schema refs에서 캐릭터 테이블을 참조하는 테이블 탐색 (1차 연결)
                const directRefs = resolvedSchema.refs.filter(r => r.toTable === charTable.id);
                const connections: CharacterProfileNode[] = [];
                let totalRelated = 0;

                // 5. 각 연결 테이블 쿼리 (컬럼명 소문자 필수)
                await Promise.all(directRefs.map(async (ref) => {
                  const connTable = resolvedSchema.tables.find(t => t.id === ref.fromTable);
                  if (!connTable) return;
                  const fkCol = ref.fromColumns[0].toLowerCase(); // 소문자

                  try {
                    const res = await executeDataSQL(
                      `SELECT * FROM "${connTable.name}" WHERE ${fkCol} = ${charIdLiteral} LIMIT 5`,
                      tableData,
                    );
                    totalRelated += res.rowCount;

                    // 5-1. 이 테이블을 참조하는 2차 연결 탐색
                    const connPK = connTable.columns.find(c => c.isPrimaryKey)?.name?.toLowerCase();
                    const subChildren: CharacterProfileNode['children'] = [];

                    if (connPK && res.rows.length > 0) {
                      const subRefs = resolvedSchema.refs.filter(r => r.toTable === connTable.id);
                      await Promise.all(subRefs.slice(0, 6).map(async (sref) => {
                        const subTable = resolvedSchema.tables.find(t => t.id === sref.fromTable);
                        if (!subTable) return;
                        const subFk = sref.fromColumns[0].toLowerCase(); // 소문자
                        const ids = res.rows.map(r => {
                          const v = String((r as Record<string, unknown>)[connPK]);
                          return !isNaN(Number(v)) && v.trim() !== '' ? v : `'${v.replace(/'/g, "''")}'`;
                        }).join(',');
                        try {
                          const subRes = await executeDataSQL(
                            `SELECT COUNT(*) as cnt FROM "${subTable.name}" WHERE ${subFk} IN (${ids})`,
                            tableData,
                          );
                          const cnt = Number((subRes.rows[0] as Record<string, unknown>)?.cnt ?? 0);
                          if (cnt > 0) subChildren.push({ tableName: subTable.name, fkColumn: subFk, rowCount: cnt });
                        } catch { /* skip */ }
                      }));
                    }

                    connections.push({
                      tableName: connTable.name,
                      fkColumn: fkCol,
                      rowCount: res.rowCount,
                      columns: res.columns,
                      sampleRows: res.rows.slice(0, 3),
                      children: subChildren.length > 0 ? subChildren : undefined,
                    });
                  } catch { /* skip */ }
                }));

                // rowCount 내림차순 정렬
                connections.sort((a, b) => b.rowCount - a.rowCount);

                const duration = performance.now() - t0;
                tc = {
                  kind: 'character_profile',
                  characterName: charName,
                  charTableName: charTable.name,
                  charPK: pkCol,
                  character,
                  connections,
                  totalRelatedRows: totalRelated,
                  duration,
                } as CharacterProfileResult;

                // Claude에게 전달할 구조화된 요약 + pre-built SQL embed 제안
                const connSummary = connections.map(c => {
                  const sample = c.sampleRows.length > 0
                    ? ' | 샘플: ' + Object.entries(c.sampleRows[0]).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')
                    : '';
                  const sub = c.children?.length
                    ? ' → [' + c.children.map(ch => `${ch.tableName}(${ch.rowCount})`).join(', ') + ']'
                    : '';
                  const embedSql = `SELECT * FROM ${c.tableName} WHERE ${c.fkColumn} = ${charIdLiteral} LIMIT 100`;
                  return `  • ${c.tableName}: ${c.rowCount}행 (FK: ${c.fkColumn})${sample}${sub}\n    [EMBED_SQL]: ${embedSql}`;
                }).join('\n');

                // 2차 연결 테이블 SQL 힌트
                const childSummary = connections.flatMap(c => {
                  const connTableDef = resolvedSchema.tables.find(t => t.name === c.tableName);
                  const connPK2 = connTableDef?.columns.find(col => col.isPrimaryKey)?.name?.toLowerCase();
                  if (!connPK2 || !c.children?.length) return [];
                  return c.children.map(ch =>
                    `  • ${ch.tableName} (${c.tableName} 하위): ${ch.rowCount}행\n    [EMBED_SQL]: SELECT * FROM ${ch.tableName} WHERE ${ch.fkColumn} IN (SELECT ${connPK2} FROM ${c.tableName} WHERE ${c.fkColumn} = ${charIdLiteral}) LIMIT 100`
                  );
                }).join('\n');

                const charSummary = Object.entries(character).slice(0, 15).map(([k, v]) => `${k}: ${v}`).join(', ');
                const charCols = Object.keys(character).join(', ');
                const basicEmbedSql = `SELECT * FROM ${charTable.name} WHERE ${pkCol} = ${charIdLiteral}`;

                resultStr = `캐릭터 "${charName}" 프로파일 수집 완료 (${duration.toFixed(0)}ms)
캐릭터 기본정보 (컬럼: ${charCols}):
${charSummary}
  [EMBED_SQL]: ${basicEmbedSql}

직접 연결 테이블 ${connections.length}개, 총 ${totalRelated}행:
${connSummary}
${childSummary ? '\n2차 연결 테이블:\n' + childSummary : ''}

[아티팩트 시트뷰 생성 방법]
★ [EMBED_SQL] 힌트를 data-embed="query" data-sql="SQL" 태그로 그대로 사용하세요.
★ 탭 인터페이스 예시 (JavaScript 사용 가능):
<style>
  .tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px}
  .tab{padding:6px 14px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:12px}
  .tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
  .tab-panel{display:none}.tab-panel.active{display:block}
</style>
<div class="tabs">
  <button class="tab active" onclick="showTab('basic')">기본정보</button>
  <button class="tab" onclick="showTab('tab1')">연결테이블1</button>
</div>
<div id="tab-basic" class="tab-panel active">
  <div data-embed="query" data-sql="${basicEmbedSql}"></div>
</div>
<script>
function showTab(id){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',t.onclick?.toString().includes(id)));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+id));
}
</script>
위 방식으로 각 연결 테이블마다 탭을 추가하세요.`;
              }
            }
          }
        }

        // ── patch_artifact ──
        else if (tb.name === 'patch_artifact') {
          const title = inp.title ? String(inp.title) : undefined;
          const rawPatches = Array.isArray(inp.patches) ? inp.patches : [];
          const t0 = performance.now();

          if (rawPatches.length === 0) {
            tc = { kind: 'artifact_patch', title, patches: [], error: '패치 내용이 없습니다.', duration: 0 } as ArtifactPatchResult;
            resultStr = '패치 실패: patches 배열이 비어있음';
          } else {
            const patches: ArtifactPatch[] = rawPatches.map((p) => ({
              find: String((p as Record<string, unknown>).find ?? ''),
              replace: String((p as Record<string, unknown>).replace ?? ''),
            })).filter(p => p.find.length > 0);

            const duration = performance.now() - t0;
            tc = { kind: 'artifact_patch', title, patches, duration } as ArtifactPatchResult;
            resultStr = `패치 ${patches.length}개 준비 완료. 클라이언트에서 원본 HTML에 적용됩니다.`;
          }
        }

        // ── create_artifact ──
        else if (tb.name === 'create_artifact') {
          const title = String(inp.title ?? '문서');
          const description = String(inp.description ?? '');
          const html = String(inp.html ?? '');
          const t0 = performance.now();

          if (!html || html.length < 50) {
            tc = { kind: 'artifact', title, description, html: '', error: 'HTML 내용이 없습니다.', duration: 0 } as ArtifactResult;
            resultStr = 'HTML 생성 실패: 내용이 비어있음';
          } else {
            const duration = performance.now() - t0;
            tc = { kind: 'artifact', title, description, html, duration } as ArtifactResult;
            resultStr = `아티팩트 "${title}" 생성 완료 (${html.length}자). 사용자 화면에 전체화면 프리뷰와 PDF 저장 버튼이 표시됩니다.`;
          }
        }

        else {
          return; // 알 수 없는 툴 → 건너뜀
        }

        toolCallsMap.set(tb.id, tc!);
        toolResultsMap.set(tb.id, resultStr);
      }));

      // 원래 순서대로 결과 수집 및 콜백 호출
      for (const tb of toolBlocks) {
        const tc = toolCallsMap.get(tb.id);
        const resultStr = toolResultsMap.get(tb.id) ?? '';
        if (!tc) continue;
        allToolCalls.push(tc);
        onToolCall?.(tc, allToolCalls.length - 1);
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: resultStr });
      }

      console.log(`[Chat] 툴 처리 완료: ${toolBlocks.map(t => t.name).join(', ')}`);
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // ── max_tokens : 응답 잘림 처리 ──────────────────────────────────────────
    const truncatedText = data.content
      .filter((b): b is TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const hasFetchedData = allToolCalls.some(
      (tc) => tc.kind === 'data_query' || tc.kind === 'schema_card' || tc.kind === 'character_profile',
    );
    const hasArtifact = allToolCalls.some((tc) => tc.kind === 'artifact');

    // max_tokens 시 content에 orphan tool_use가 있으면 빈 tool_result 삽입
    const orphanToolUseIds = data.content
      .filter((b): b is ToolUseBlock => b.type === 'tool_use')
      .map((b) => b.id);

    const pushAssistantWithOrphanFix = (msgs: typeof messages) => {
      msgs.push({ role: 'assistant', content: data.content });
      if (orphanToolUseIds.length > 0) {
        console.warn('[Chat] max_tokens orphan tool_use 발견, 빈 tool_result 삽입:', orphanToolUseIds);
        msgs.push({
          role: 'user',
          content: orphanToolUseIds.map((id) => ({
            type: 'tool_result' as const,
            tool_use_id: id,
            content: '(생성 중단 — max_tokens)',
          })),
        });
      }
    };

    // 데이터 수집 완료 & 아티팩트 미생성 → 자동으로 create_artifact 재촉
    if (hasFetchedData && !hasArtifact && i < MAX_ITERATIONS - 1) {
      console.log('[Chat] max_tokens 감지: 데이터 수집 완료, 아티팩트 자동 재시도');
      pushAssistantWithOrphanFix(messages);
      messages.push({
        role: 'user',
        content:
          '수집한 데이터를 바탕으로 즉시 create_artifact 툴을 호출하여 HTML 문서를 생성해주세요. ' +
          '추가 데이터 조회 없이 현재 데이터만으로 바로 아티팩트를 만들어주세요. ' +
          '긴 HTML보다는 핵심 내용을 간결하게 담아 토큰을 아껴주세요.',
      });
      continue;
    }

    // 자동 계속 불가 → rawMessages 저장하여 '계속해줘' 지원
    pushAssistantWithOrphanFix(messages);
    console.log('[Chat] max_tokens: rawMessages 저장 (계속해줘 지원)');
    return {
      content: truncatedText || '(응답이 잘렸습니다)',
      toolCalls: allToolCalls,
      rawMessages: messages, // tool_use/tool_result 전체 컨텍스트 보존
    };
  }

  return {
    content: '너무 많은 데이터 조회가 필요합니다. 질문을 좀 더 구체적으로 해주세요.',
    toolCalls: allToolCalls,
  };
}
