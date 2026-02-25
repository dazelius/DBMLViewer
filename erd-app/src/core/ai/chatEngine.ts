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

export type ToolCallResult = DataQueryResult | SchemaCardResult | GitHistoryResult | RevisionDiffResult | ImageResult | ArtifactResult;

// ── ChatTurn ─────────────────────────────────────────────────────────────────

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: Date;
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
    name: 'create_artifact',
    description:
      '수집된 데이터를 기반으로 완전한 HTML 문서(보고서, 캐릭터 시트, 밸런스 표, 릴리즈 노트 등)를 생성합니다. ' +
      '사용자가 "정리해줘", "문서로 만들어줘", "보고서", "뽑아줘", "시트 만들어줘" 등을 요청할 때 호출하세요. ' +
      '먼저 query_game_data, show_table_schema 등으로 필요한 데이터를 모두 수집한 후 이 툴을 마지막에 호출하세요.',
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
            '이미지는 <img src="/api/images/file?path=Texture/폴더/파일명.png"> 형식으로 참조. ' +
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
  lines.push('- query_git_history: 변경 이력 조회 (언제 무엇이 바뀌었는지)');
  lines.push('- show_revision_diff: 특정 커밋의 상세 변경 내용(DIFF) 시각화 (리비전 차이 확인 시 사용)');
  lines.push('- find_resource_image: 게임 리소스 이미지(PNG) 검색 및 채팅 임베드 (아이콘, UI 이미지 찾기 요청 시 사용)');
  lines.push('- create_artifact: 수집된 데이터로 완성된 HTML 문서/보고서 생성 (전체화면 프리뷰, PDF 저장 가능)');
  lines.push('');
  lines.push('[아티팩트 생성 규칙 — 반드시 준수]');
  lines.push('- "정리해줘", "문서로", "보고서", "시트 만들어줘", "뽑아줘" 등 요청 시 create_artifact를 호출하세요.');
  lines.push('- 데이터 수집이 끝나면 "생성하겠습니다" 같은 텍스트를 출력하지 말고 즉시 create_artifact를 호출하세요.');
  lines.push('- ⚠️ 절대로 "아티팩트를 만들겠습니다", "HTML을 생성하겠습니다" 등의 선언 후 멈추지 마세요. 선언 없이 즉시 툴을 호출하세요.');
  lines.push('- 반드시 먼저 다른 툴로 데이터를 충분히 수집한 후 create_artifact를 마지막에 호출하세요.');
  lines.push('- html 파라미터: <!DOCTYPE html> 없이 <body> 내용만 작성 (간결하게 500줄 이내).');
  lines.push('- 이미지: <img src="/api/images/file?path=Texture/.../파일명.png">');
  lines.push('- 스타일: 다크 테마(배경 #0f1117, 텍스트 #e2e8f0, 포인트 #6366f1), 표/카드 레이아웃.');
  lines.push('');
  lines.push('[중요] "관계도 보여줘", "ERD 보여줘" 요청에는 가장 핵심이 되는 테이블 1개만 show_table_schema를 호출하세요.');
  lines.push('       ERD 카드 안에 연결 테이블이 모두 표시되므로 관련 테이블을 여러 번 반복 호출하지 마세요.');
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

type ClaudeMsg =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'user'; content: { type: 'tool_result'; tool_use_id: string; content: string }[] }
  | { role: 'assistant'; content: ContentBlock[] };

function historyToMessages(history: ChatTurn[]): ClaudeMsg[] {
  return history.map((t) => ({ role: t.role, content: t.content }));
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
            // create_artifact 블록 시작 즉시 패널 오픈 (html 도착 전에도)
            if ((cb as ToolUseBlock).name === 'create_artifact' && onArtifactProgress) {
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
): Promise<{ content: string; toolCalls: ToolCallResult[] }> {
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
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000 * attempt));
      try {
        data = await streamClaude(
          { ...requestBase, messages },
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

    // max_tokens 등 기타
    const text = data.content
      .filter((b): b is TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return { content: text || '(응답이 잘렸습니다)', toolCalls: allToolCalls };
  }

  return {
    content: '너무 많은 데이터 조회가 필요합니다. 질문을 좀 더 구체적으로 해주세요.',
    toolCalls: allToolCalls,
  };
}
