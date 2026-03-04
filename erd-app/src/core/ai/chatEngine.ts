import type { ParsedSchema } from '../schema/types.ts';
import type { Row, TableDataMap } from '../query/schemaQueryEngine.ts';
import { executeDataSQL, RESERVED_TABLE_NAMES, VIRTUAL_TABLE_SCHEMA } from '../query/schemaQueryEngine.ts';
import { useSchemaStore } from '../../store/useSchemaStore.ts';

// ── ADF (Atlassian Document Format) → 플레인텍스트 변환 ──────────────────────

/** Jira ADF(Atlassian Document Format) JSON을 읽기 좋은 플레인텍스트로 변환 */
function adfToText(node: unknown, depth = 0): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;

  // 텍스트 노드
  if (n.type === 'text') return String(n.text ?? '');

  // 하드 브레이크
  if (n.type === 'hardBreak') return '\n';

  // 인라인 카드 (Jira/Confluence 링크)
  if (n.type === 'inlineCard') {
    const url = String((n.attrs as Record<string, unknown>)?.url ?? '');
    // AEGIS-1234 형태 추출
    const issueMatch = url.match(/browse\/([A-Z]+-\d+)/);
    return issueMatch ? issueMatch[1] : url;
  }

  // 미디어/이모지
  if (n.type === 'emoji') return String((n.attrs as Record<string, unknown>)?.text ?? (n.attrs as Record<string, unknown>)?.shortName ?? '');
  if (n.type === 'mention') return `@${String((n.attrs as Record<string, unknown>)?.text ?? '')}`;

  // 자식 노드가 있는 컨테이너
  const children = Array.isArray(n.content) ? n.content : [];
  const childText = children.map((c: unknown) => adfToText(c, depth + 1)).join('');

  switch (n.type) {
    case 'doc':
      return childText.trim();
    case 'paragraph':
      return childText + '\n';
    case 'heading': {
      const level = Number((n.attrs as Record<string, unknown>)?.level ?? 1);
      return '#'.repeat(level) + ' ' + childText + '\n';
    }
    case 'bulletList':
      return children.map((c: unknown) => '• ' + adfToText(c, depth + 1).trim()).join('\n') + '\n';
    case 'orderedList':
      return children.map((c: unknown, i: number) => `${i + 1}. ` + adfToText(c, depth + 1).trim()).join('\n') + '\n';
    case 'listItem':
      return childText;
    case 'blockquote':
      return childText.split('\n').map(l => '> ' + l).join('\n') + '\n';
    case 'codeBlock':
      return '```\n' + childText + '\n```\n';
    case 'rule':
      return '---\n';
    case 'table':
      return childText;
    case 'tableRow':
      return children.map((c: unknown) => adfToText(c, depth + 1).trim()).join(' | ') + '\n';
    case 'tableHeader':
    case 'tableCell':
      return childText;
    case 'panel':
    case 'expand':
      return childText;
    case 'mediaGroup':
    case 'mediaSingle':
      return '[첨부파일]\n';
    default:
      return childText;
  }
}

/** ADF JSON 또는 문자열을 안전하게 플레인텍스트로 변환 */
function parseAdfField(field: unknown): string {
  if (!field) return '';

  // 이미 문자열인 경우 → JSON 문자열일 수 있으므로 파싱 시도
  if (typeof field === 'string') {
    const s = field.trim();
    if ((s.startsWith('{') && s.includes('"type"')) || (s.startsWith('[') && s.includes('"type"'))) {
      try {
        const parsed = JSON.parse(s);
        return parseAdfField(parsed); // 재귀 호출
      } catch { /* JSON 파싱 실패 → 원본 문자열 반환 */ }
    }
    return field;
  }

  // 배열인 경우 (content 배열)
  if (Array.isArray(field)) {
    return (field as unknown[]).map(c => adfToText(c)).join('').replace(/\n{3,}/g, '\n\n').trim();
  }

  // 객체인 경우 (ADF 문서)
  if (typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (obj.type === 'doc' || obj.type === 'paragraph' || obj.type === 'text' || Array.isArray(obj.content)) {
      return adfToText(field).replace(/\n{3,}/g, '\n\n').trim();
    }
  }

  return String(field);
}

/**
 * 채팅 텍스트에서 HTML 태그/스타일/스크립트를 제거하여 깨끗한 텍스트만 반환.
 * 코드 블록(`...`) 안의 HTML은 보존.
 * 연속된 빈 줄은 하나로 압축.
 */
function stripHtmlFromChatText(text: string): string {
  if (!text) return text;
  // HTML 태그가 거의 없으면 빠른 경로
  if (!/< *[a-zA-Z/!]/.test(text)) return text;

  // 코드 블록을 보존하면서 처리
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  const cleaned = parts.map((part, idx) => {
    // 홀수 인덱스는 코드 블록/인라인 코드 → 보존
    if (idx % 2 === 1) return part;
    // <style>...</style>, <script>...</script> 통째로 제거
    let t = part.replace(/<style[\s\S]*?<\/style>/gi, '');
    t = t.replace(/<script[\s\S]*?<\/script>/gi, '');
    // 자기종결 태그 (<br/>, <hr/>, <img .../>) 제거
    t = t.replace(/<[a-zA-Z][^>]*\/>/g, '');
    // 블록 태그를 줄바꿈으로 교체 (내용은 보존)
    t = t.replace(/<\/?(?:div|p|li|ul|ol|tr|td|th|table|thead|tbody|section|nav|header|footer|article|aside|h[1-6]|blockquote|pre|hr|br|dd|dt|dl|figcaption|figure|main|details|summary)[^>]*>/gi, '\n');
    // 나머지 인라인 태그 제거 (span, a, strong, em, code, b, i 등)
    t = t.replace(/<\/?[a-zA-Z][^>]*>/g, '');
    // HTML 엔티티 복원
    t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rarr;/g, '→').replace(/&larr;/g, '←');
    return t;
  }).join('');

  // 연속 빈 줄 정리
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

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
  repo?: string;
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
  repo?: string;
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

// ── 코드 분석 결과 ────────────────────────────────────────────────────────────

export interface CodeFileEntry {
  path: string;
  name: string;
  size?: number;
  namespaces: string[];
  classes: string[];
  methods: string[];
}

export interface CodeSearchResult {
  kind: 'code_search';
  query: string;
  searchType: 'index' | 'content';
  total?: number;
  results: CodeFileEntry[];
  contentHits?: { path: string; matches: { line: number; lineContent: string }[] }[];
  error?: string;
  duration?: number;
}

export interface CodeFileResult {
  kind: 'code_file';
  path: string;
  content: string;
  size: number;
  truncated: boolean;
  namespaces?: string[];
  classes?: string[];
  methods?: string[];
  error?: string;
  duration?: number;
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

export interface CodeGuideResult {
  kind: 'code_guide';
  label: string;
  text: string;
  error?: string;
}

export interface AssetSearchResult {
  kind: 'asset_search';
  label: string;
  query: string;
  ext: string;
  files: { path: string; name: string; ext: string; size?: number; sizeKB?: number }[];
  total: number;
  error?: string;
}

export interface JiraSearchResult {
  kind: 'jira_search';
  jql: string;
  issues: {
    key: string; id: string; summary: string; status: string;
    assignee: string; priority: string; issuetype: string; updated: string;
    url: string;
  }[];
  total: number;
  error?: string;
  duration?: number;
}

export interface JiraIssueResult {
  kind: 'jira_issue';
  issueKey: string;
  url?: string;
  summary?: string;
  status?: string;
  issuetype?: string;
  priority?: string;
  assignee?: string;
  reporter?: string;
  created?: string;
  updated?: string;
  description?: string;
  comments?: { author: string; body: string; created: string }[];
  error?: string;
  duration?: number;
}

export interface JiraCreateResult {
  kind: 'jira_create';
  issueKey?: string;
  issueUrl?: string;
  summary?: string;
  issueType?: string;
  priority?: string;
  error?: string;
  duration?: number;
}

export interface JiraCommentResult {
  kind: 'jira_comment';
  issueKey: string;
  issueUrl?: string;
  commentId?: string;
  comment?: string;
  error?: string;
  duration?: number;
}

export interface JiraStatusResult {
  kind: 'jira_status';
  issueKey: string;
  newStatus?: string;
  transitions?: { id: string; name: string }[];
  error?: string;
  duration?: number;
}

export interface ConfluenceSearchResult {
  kind: 'confluence_search';
  cql: string;
  pages: { id: string; title: string; type: string; space: string; url: string }[];
  total: number;
  error?: string;
  duration?: number;
}

export interface ConfluenceMedia {
  type: 'image' | 'video' | 'attachment' | 'link';
  title: string;
  url: string;
  mimeType?: string;
}

export interface ConfluencePageResult {
  kind: 'confluence_page';
  pageId: string;
  url?: string;
  title?: string;
  space?: string;
  htmlContent?: string;
  version?: number;
  media?: ConfluenceMedia[];
  error?: string;
  duration?: number;
}

export interface SceneYamlResult {
  kind: 'scene_yaml';
  label: string;
  scenePath: string;
  fileSizeKB?: number;
  totalSections?: number;
  typeCounts?: Record<string, number>;
  totalFiltered?: number;
  returnedCount?: number;
  content: string;
  error?: string;
}

/** Unity Hierarchy 노드 (서버 HNode와 동일 구조) */
export interface PrefabHNode {
  id: string;
  name: string;
  type: 'fbx' | 'probuilder' | 'box' | 'empty';
  objIdx: number;       // index in sceneObjects, -1 if not rendered
  children: PrefabHNode[];
  components?: string[];
}

/** 씬 오브젝트 (SceneViewer 렌더 단위) */
export interface PrefabSceneObject {
  id: string;
  name: string;
  type: string;
  fbxPath?: string;
  fbxUrl?: string;
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
  components?: string[];
}

export interface PrefabPreviewResult {
  kind: 'prefab_preview';
  label: string;
  prefabPath: string;
  totalObjects?: number;
  resolvedFbx?: number;
  resolvedProBuilder?: number;
  resolvedBox?: number;
  hierarchy?: PrefabHNode[];
  objects?: PrefabSceneObject[];
  error?: string;
}

export interface FbxAnimationResult {
  kind: 'fbx_animation';
  label: string;
  modelPath: string;
  modelUrl: string;
  animations: { name: string; url: string; category?: string }[];
  totalAnimations: number;
  categories: string[];
  error?: string;
}

export interface KnowledgeResult {
  kind: 'knowledge';
  action: 'save' | 'read' | 'list' | 'delete';
  name: string;
  content?: string;
  items?: { name: string; sizeKB: number; updatedAt: string }[];
  sizeKB?: number;
  created?: boolean;
  error?: string;
}

export type ToolCallResult = DataQueryResult | SchemaCardResult | GitHistoryResult | RevisionDiffResult | ImageResult | ArtifactResult | ArtifactPatchResult | CharacterProfileResult | CodeSearchResult | CodeFileResult | CodeGuideResult | AssetSearchResult | JiraSearchResult | JiraIssueResult | JiraCreateResult | JiraCommentResult | JiraStatusResult | ConfluenceSearchResult | ConfluencePageResult | SceneYamlResult | PrefabPreviewResult | FbxAnimationResult | KnowledgeResult;

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

// ── Graph 연동: 도구 메타데이터 & 도메인 키워드 (GraphPage와 완전 동기화) ────

export interface ToolMeta {
  name: string;
  label: string;
  emoji: string;
  dataSources: string[];
}

export const TOOL_META: ToolMeta[] = [
  { name: 'query_game_data',        label: 'SQL 쿼리',           emoji: '📊', dataSources: ['excel'] },
  { name: 'show_table_schema',      label: '스키마 조회',         emoji: '📋', dataSources: ['excel'] },
  { name: 'query_git_history',      label: 'Git 이력',           emoji: '🔍', dataSources: ['git_data', 'git_code'] },
  { name: 'show_revision_diff',     label: '리비전 Diff',        emoji: '📝', dataSources: ['git_data', 'git_code'] },
  { name: 'find_resource_image',    label: '이미지 검색',         emoji: '🖼️', dataSources: ['images'] },
  { name: 'build_character_profile',label: '캐릭터 프로필',       emoji: '👤', dataSources: ['excel'] },
  { name: 'read_guide',             label: '가이드 읽기',         emoji: '📖', dataSources: ['guides'] },
  { name: 'search_assets',          label: '에셋 검색',           emoji: '🎨', dataSources: ['unity'] },
  { name: 'read_scene_yaml',        label: '씬 데이터',           emoji: '🎮', dataSources: ['unity'] },
  { name: 'preview_prefab',         label: '프리팹 뷰',           emoji: '🧩', dataSources: ['unity'] },
  { name: 'preview_fbx_animation',  label: '애니메이션 뷰',       emoji: '🎬', dataSources: ['unity'] },
  { name: 'search_code',            label: '코드 검색',           emoji: '💻', dataSources: ['csharp'] },
  { name: 'read_code_file',         label: '코드 읽기',           emoji: '💻', dataSources: ['csharp'] },
  { name: 'create_artifact',        label: '아티팩트 생성',       emoji: '📄', dataSources: [] },
  { name: 'patch_artifact',         label: '아티팩트 수정',       emoji: '✏️', dataSources: [] },
  { name: 'search_jira',            label: 'Jira 검색',          emoji: '🎫', dataSources: ['jira'] },
  { name: 'get_jira_issue',         label: 'Jira 이슈',          emoji: '🎫', dataSources: ['jira'] },
  { name: 'create_jira_issue',      label: 'Jira 일감 생성',     emoji: '➕', dataSources: ['jira'] },
  { name: 'add_jira_comment',       label: 'Jira 댓글 작성',     emoji: '✍️', dataSources: ['jira'] },
  { name: 'update_jira_issue_status', label: 'Jira 상태 변경',   emoji: '🔄', dataSources: ['jira'] },
  { name: 'search_confluence',      label: 'Confluence 검색',    emoji: '📚', dataSources: ['confluence'] },
  { name: 'get_confluence_page',    label: 'Confluence 페이지',   emoji: '📚', dataSources: ['confluence'] },
  { name: 'save_knowledge',         label: '널리지 저장',         emoji: '🧠', dataSources: ['knowledge'] },
  { name: 'read_knowledge',         label: '널리지 읽기',         emoji: '🧠', dataSources: ['knowledge'] },
];

export const DATA_SOURCE_META: Array<{ name: string; label: string; emoji: string }> = [
  { name: 'excel',      label: 'Excel 데이터',    emoji: '📊' },
  { name: 'git_data',   label: 'Git (데이터)',     emoji: '📂' },
  { name: 'git_code',   label: 'Git (코드)',       emoji: '📂' },
  { name: 'csharp',     label: 'C# 소스코드',     emoji: '💻' },
  { name: 'guides',     label: 'MD 가이드',       emoji: '📖' },
  { name: 'images',     label: '리소스 이미지',    emoji: '🖼️' },
  { name: 'unity',      label: 'Unity Assets',   emoji: '🎮' },
  { name: 'jira',       label: 'Jira',           emoji: '🎫' },
  { name: 'confluence',  label: 'Confluence',      emoji: '📚' },
  { name: 'knowledge',  label: '널리지',           emoji: '🧠' },
];

export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Character': ['character', 'hero', 'player', 'striker', 'hunter', 'char'],
  'Skill':     ['skill', 'ability', 'passive', 'active', 'buff', 'debuff'],
  'Weapon':    ['weapon', 'gun', 'rifle', 'pistol', 'shotgun', 'sniper', 'launcher'],
  'Item':      ['item', 'equip', 'gear', 'armor', 'helmet', 'boot', 'accessory'],
  'Stage':     ['stage', 'map', 'zone', 'dungeon', 'chapter', 'mission'],
  'Enemy':     ['enemy', 'monster', 'mob', 'boss', 'npc'],
  'Quest':     ['quest', 'mission', 'challenge', 'achievement'],
  'Shop':      ['shop', 'store', 'purchase', 'sell', 'price', 'cost', 'reward'],
  'User':      ['user', 'account', 'profile', 'social', 'friend', 'guild'],
};

// ── Claude Tool 정의 ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'query_game_data',
    description: 'SQL SELECT로 게임 데이터 조회. 테이블명 대소문자 무시. #컬럼은 백틱 필수(`#col`). 값은 문자열(WHERE id=\'1001\').',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL SELECT 쿼리' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'show_table_schema',
    description: '테이블 스키마를 ERD 카드로 시각화. 테이블 구조/관계 설명 시 호출.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: { type: 'string', description: '테이블 이름' },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'query_git_history',
    description: 'Git 커밋 히스토리 조회. repo="data"(게임데이터,기본) 또는 "aegis"(코드).',
    input_schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: '커밋 수 (기본 30)' },
        filter_path: { type: 'string', description: '파일/폴더 경로 필터' },
        repo: { type: 'string', enum: ['data', 'aegis'], description: '"data" 또는 "aegis"' },
      },
      required: [],
    },
  },
  {
    name: 'show_revision_diff',
    description: '커밋의 DIFF를 시각적으로 표시. query_git_history로 hash 확인 후 호출.',
    input_schema: {
      type: 'object',
      properties: {
        commit_hash: { type: 'string', description: '커밋 hash' },
        file_path: { type: 'string', description: '특정 파일 경로 (생략 시 전체)' },
        repo: { type: 'string', enum: ['data', 'aegis'], description: '"data" 또는 "aegis"' },
      },
      required: ['commit_hash'],
    },
  },
  {
    name: 'find_resource_image',
    description: '게임 리소스 이미지(PNG) 검색 → 채팅에 임베드.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '이미지 이름/키워드' },
      },
      required: ['query'],
    },
  },
  {
    name: 'build_character_profile',
    description: '캐릭터의 모든 FK 연관 데이터 자동 수집. 기획서/프로파일 생성 전 먼저 호출. 이름 실패 시 ID로 재호출.',
    input_schema: {
      type: 'object',
      properties: {
        character_name: { type: 'string', description: '캐릭터 이름 (부분 일치)' },
        character_id: { type: 'string', description: 'PK ID로 직접 검색' },
      },
      required: [],
    },
  },
  {
    name: 'read_guide',
    description: '⭐ DB/코드 가이드 읽기. 답변 전 관련 가이드 먼저 참고. ""=목록, _DB_OVERVIEW/_OVERVIEW=시작점.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '가이드 이름 (""=목록, _DB_*=DB, _*=코드)' },
      },
      required: [],
    },
  },
  // read_code_guide removed (deprecated → read_guide로 통합됨)
  {
    name: 'search_assets',
    description: 'Unity 에셋 검색 (FBX/PNG/WAV 등). ext로 확장자 필터 가능.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드' },
        ext: { type: 'string', description: '확장자 필터 (fbx/png/wav 등)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_scene_yaml',
    description: 'Unity .unity 씬 YAML을 섹션별 읽기. search_assets(ext="unity")로 경로 확인 후 호출.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '씬 파일 경로' },
        filter: { type: 'string', description: '섹션 타입 필터 (PrefabInstance/GameObject 등)' },
        search: { type: 'string', description: '텍스트 검색' },
        offset: { type: 'number', description: '시작 인덱스 (기본 0)' },
        limit: { type: 'number', description: '최대 섹션 수 (기본 20)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'preview_prefab',
    description: 'Unity .prefab 3D 미리보기. search_assets(ext="prefab")로 경로 확인 후 호출.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '프리팹 경로' },
        label: { type: 'string', description: '표시 이름' },
      },
      required: ['path'],
    },
  },
  {
    name: 'preview_fbx_animation',
    description: 'FBX 모델+애니메이션 3D 재생. search_assets(ext="fbx")로 경로 확인 후 호출.',
    input_schema: {
      type: 'object',
      properties: {
        model_path: { type: 'string', description: 'FBX 모델 경로' },
        animation_paths: { type: 'array', items: { type: 'string' }, description: '애니메이션 FBX 경로 배열 (생략=자동검색)' },
        categories: { type: 'array', items: { type: 'string' }, description: '카테고리 필터 (idle/combat/skill 등)' },
        label: { type: 'string', description: '표시 이름' },
      },
      required: ['model_path'],
    },
  },
  {
    name: 'search_code',
    description: 'C# 소스코드 검색. type: class/method/file/content.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드' },
        type: { type: 'string', enum: ['class', 'method', 'file', 'content', ''], description: '검색 타입' },
        scope: { type: 'string', description: '폴더 범위 제한' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_code_file',
    description: 'C# 파일 전체 내용 읽기. search_code로 경로 확인 후 호출.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '파일 경로' },
      },
      required: ['path'],
    },
  },
  {
    name: 'patch_artifact',
    description: '⭐ 아티팩트 수정 전용 (find/replace 패치). create_artifact 대신 사용 → 토큰 90% 절약.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '새 제목 (변경 시만)' },
        patches: {
          type: 'array',
          description: 'find/replace 패치 목록',
          items: {
            type: 'object',
            properties: {
              find: { type: 'string', description: '원본 텍스트 (고유, 10자+)' },
              replace: { type: 'string', description: '대체 텍스트' },
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
      '아티팩트(HTML 문서)를 등록합니다. ' +
      '⚠️ 필수: 이 도구 호출 직전에 텍스트로 HTML을 먼저 출력하세요! ' +
      '형식: <<<ARTIFACT_START>>> 다음에 HTML 코드, <<<ARTIFACT_END>>> 으로 종료. ' +
      '그 후 이 도구를 title로만 호출하면 됩니다. html 파라미터 불필요. ' +
      '⚠️ [아티팩트 수정 요청]에는 patch_artifact를 사용하세요.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '문서 제목 (예: "프리드웬 캐릭터 시트", "스킬 밸런스 보고서")',
        },
        description: {
          type: 'string',
          description: '생성된 문서에 대한 한 줄 설명 (선택사항)',
        },
      },
      required: ['title'],
    },
  },
  // ── Jira / Confluence 툴 ─────────────────────────────────────────────────
  {
    name: 'search_jira',
    description: 'JQL로 Jira 이슈 검색. 프로젝트키: AEGIS.',
    input_schema: {
      type: 'object',
      properties: {
        jql: { type: 'string', description: 'JQL 쿼리' },
        maxResults: { type: 'number', description: '최대 건수 (기본 20, 최대 50)' },
      },
      required: ['jql'],
    },
  },
  {
    name: 'get_jira_issue',
    description: 'Jira 이슈 상세 조회 (설명/댓글/서브태스크 등).',
    input_schema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: '이슈 키 (예: AEGIS-1234)' },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'search_confluence',
    description: 'CQL로 Confluence 문서 검색 (기획서/스펙/회의록).',
    input_schema: {
      type: 'object',
      properties: {
        cql: { type: 'string', description: 'CQL 쿼리' },
        limit: { type: 'number', description: '최대 건수 (기본 10)' },
      },
      required: ['cql'],
    },
  },
  {
    name: 'get_confluence_page',
    description: 'Confluence 페이지 전체 내용 조회 (pageId).',
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: '페이지 ID' },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'save_knowledge',
    description: '사용자 지식을 .md 파일로 영구 저장. "기억해/저장해" 요청 시 사용.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '파일 이름 (영문 snake_case)' },
        content: { type: 'string', description: '마크다운 내용' },
      },
      required: ['name', 'content'],
    },
  },
  {
    name: 'read_knowledge',
    description: '저장된 널리지 읽기. ""=목록 반환.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '파일 이름 (""=전체 목록)' },
      },
      required: [],
    },
  },
  // ── Jira 쓰기 툴 ──────────────────────────────────────────────────────────
  {
    name: 'create_jira_issue',
    description: '⭐ 새 Jira 이슈(일감)를 생성합니다. 버그/작업/스토리 등 issuetype을 지정하세요.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: '이슈 제목 (필수)' },
        description: { type: 'string', description: '이슈 설명 (마크다운 지원)' },
        issueType: { type: 'string', description: '이슈 유형 (Bug, Task, Story, Epic 등, 기본=Task)' },
        priority: { type: 'string', description: '우선순위 (Highest, High, Medium, Low, Lowest)' },
        assignee: { type: 'string', description: '담당자 이름 또는 계정 ID' },
        labels: { type: 'array', items: { type: 'string' }, description: '레이블 목록' },
        epicKey: { type: 'string', description: '상위 Epic 키 (예: AEGIS-100)' },
        projectKey: { type: 'string', description: '프로젝트 키 (미입력 시 기본 프로젝트 사용)' },
      },
      required: ['summary'],
    },
  },
  {
    name: 'add_jira_comment',
    description: '⭐ Jira 이슈에 댓글을 직접 작성합니다. 이슈 키(AEGIS-1234) 또는 전체 URL을 issueKey로 전달하세요. comment는 마크다운 형식으로 작성하면 됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Jira 이슈 키(AEGIS-1234) 또는 전체 URL' },
        comment: { type: 'string', description: '작성할 댓글 내용 (마크다운 지원)' },
      },
      required: ['issueKey', 'comment'],
    },
  },
  {
    name: 'update_jira_issue_status',
    description: '⭐ Jira 이슈의 상태를 변경합니다. 가능한 상태 목록을 모르면 listTransitions: true로 먼저 조회하세요.',
    input_schema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Jira 이슈 키 또는 URL' },
        targetStatus: { type: 'string', description: '변경할 상태명 (예: "In Progress", "Done")' },
        listTransitions: { type: 'boolean', description: 'true이면 가능한 상태 목록만 반환' },
      },
      required: ['issueKey'],
    },
  },
];

// ── 시스템 프롬프트 빌더 ─────────────────────────────────────────────────────

// 클라이언트 사이드 키워드 매칭 — 쿼리 관련 널리지만 필터링
function _scoreKnowledgeForQuery(
  entry: { name: string; content: string },
  queryTokens: string[]
): number {
  if (queryTokens.length === 0) return 1; // 쿼리 없으면 모두 포함
  const nameLower = entry.name.toLowerCase();
  const contentLower = entry.content.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (nameLower.includes(token)) score += 5;
    let pos = 0, cnt = 0;
    while ((pos = contentLower.indexOf(token, pos)) !== -1 && cnt < 10) { cnt++; pos++; }
    score += cnt;
  }
  return score;
}

function buildSystemPrompt(
  schema: ParsedSchema | null,
  tableData: TableDataMap,
  knowledgeEntries?: { name: string; sizeKB: number; content: string }[],
  userQuery?: string,
): string {
  const lines: string[] = [];

  // ── 스마트 널리지 주입 (쿼리 키워드 매칭) ──
  if (knowledgeEntries && knowledgeEntries.length > 0) {
    // 쿼리 토큰 추출
    const queryTokens = userQuery
      ? (userQuery.toLowerCase().match(/[가-힣]{2,}|[a-z0-9_]{2,}/g) ?? [])
          .filter(t => !['의','이','가','을','를','은','는','이다','하다','있다','없다','the','is','in','of','to'].includes(t))
      : [];

    // 각 파일 점수 계산
    const scored = knowledgeEntries.map(e => ({
      ...e,
      score: _scoreKnowledgeForQuery(e, queryTokens),
    })).sort((a, b) => b.score - a.score);

    const matched = queryTokens.length > 0 ? scored.filter(e => e.score > 0) : scored;

    // 목차는 항상 표시
    lines.push(`## 📚 저장된 널리지 목록 (${knowledgeEntries.length}개)`);
    for (const e of knowledgeEntries) {
      lines.push(`- ${e.name} (${e.sizeKB}KB)`);
    }
    lines.push('관련 내용은 아래에 자동 포함됩니다. 추가로 필요하면 read_knowledge 도구 사용.');
    lines.push('');

    if (matched.length > 0) {
      lines.push(`## ⭐ 쿼리 관련 널리지 (${matched.length}개) — 반드시 참고`);
      let totalLen = 0;
      for (const entry of matched) {
        if (totalLen > 150 * 1024) break;
        lines.push(`### ${entry.name} (${entry.sizeKB}KB${queryTokens.length > 0 ? `, 관련도: ${entry.score}` : ''})`);
        lines.push(entry.content);
        totalLen += entry.content.length;
      }
      lines.push('');
    } else if (queryTokens.length > 0) {
      lines.push('*(현재 질문과 직접 관련된 널리지 없음 — 필요시 read_knowledge 도구 사용)*');
      lines.push('');
    }
  }

  lines.push('당신은 게임 데이터 전문 어시스턴트입니다. 한국어로 답변하세요.');
  lines.push('');
  lines.push('## 핵심 규칙');
  lines.push('- 모호한 질문 → **객관식(A/B/C/D) 되질문** (명확한 질문은 바로 답변)');
  lines.push('- ⭐ 답변 전 반드시 read_guide로 관련 가이드 먼저 읽기 (DB: _DB_OVERVIEW, 코드: _OVERVIEW)');
  lines.push('- 캐릭터 기획서/프로파일 → build_character_profile 먼저 호출');
  lines.push('- "기억해/저장해/널리지" 요청 → save_knowledge (name=영문_snake_case)');
  lines.push('- 널리지 목록에 있는 파일은 read_knowledge 도구로 언제든 읽을 수 있음');
  lines.push('');
  lines.push('## ⛔ HTML 출력 규칙');
  lines.push('채팅 텍스트에 HTML 태그(div/table/style/img 등) 절대 금지!');
  lines.push('모든 HTML/임베드 태그는 오직 아티팩트 안에만 (<<<ARTIFACT_START>>>...<<<ARTIFACT_END>>> 또는 patch_artifact)');
  lines.push('');
  lines.push('## 아티팩트 임베드 태그 (아티팩트 HTML 내에서만 사용)');
  lines.push('- FBX: <div class="fbx-viewer" data-src="/api/assets/file?path=경로.fbx" data-label="이름"></div>');
  lines.push('- 오디오: <div class="audio-player" data-src="/api/assets/file?path=경로.wav" data-label="이름"></div>');
  lines.push('- 씬: <div data-embed="scene" data-src="경로.unity" data-label="이름"></div>');
  lines.push('- 프리팹: <div data-embed="prefab" data-src="경로.prefab" data-label="이름"></div>');
  lines.push('- 애니메이션: <div data-embed="fbx-anim" data-model="모델경로" data-label="이름"></div>');
  lines.push('- 스키마: <div data-embed="schema" data-table="테이블명"></div>');
  lines.push('- 쿼리 결과: <div data-embed="query" data-sql="SELECT ..."></div> (⭐ 데이터는 직접 쓰지 말고 이 태그 사용!)');
  lines.push('- 관계도: <div data-embed="relations" data-table="테이블명"></div>');
  lines.push('- 관계 그래프: <div data-embed="graph" data-tables="T1,T2,T3"></div>');
  lines.push('- Git Diff: <div data-embed="diff" data-commit="해시"></div>');
  lines.push('- 이미지: /api/images/smart?name=파일명.png 또는 /api/images/file?path=Texture/경로.png');
  lines.push('- 인라인 테이블 참조: [[TableName]] → 클릭 시 스키마 팝업');
  lines.push('- data-sql 규칙: 큰따옴표(") 속성, SQL 내 "→&quot;, #컬럼→백틱+AS alias 필수');
  lines.push('');
  lines.push('## Jira/Confluence');
  lines.push('- 프로젝트 키: AEGIS. JQL에 날짜 필터 자동 추가 금지. ORDER BY updated DESC 기본 사용.');
  lines.push('- 이슈번호 언급(AEGIS-1234) → get_jira_issue 바로 호출.');
  lines.push('');
  lines.push('## ⭐⭐⭐ Jira 쓰기(Write) — 반드시 준수');
  lines.push('당신은 Jira에 직접 댓글을 달고 상태를 변경할 수 있습니다! 절대 "쓰기 불가", "직접 할 수 없다", "기능이 없다"고 말하지 마세요.');
  lines.push('- "일감 만들어줘" / "이슈 생성" / "버그 등록" → create_jira_issue(summary, ...) 즉시 호출');
  lines.push('- "댓글 달아줘" / "코멘트 남겨줘" / "이슈에 써줘" → add_jira_comment(issueKey, comment) 즉시 호출');
  lines.push('- issueKey: "AEGIS-1234" 또는 전체 URL "https://.../browse/AEGIS-1234" 모두 허용');
  lines.push('- 댓글 내용은 마크다운으로 작성 → 자동으로 Jira ADF 형식으로 변환됨');
  lines.push('- "상태 바꿔줘" / "In Progress로 변경" → update_jira_issue_status(issueKey, targetStatus) 호출');
  lines.push('- 가능한 상태 목록 모를 때 → update_jira_issue_status(issueKey, listTransitions: true) 로 먼저 확인');
  lines.push('');
  lines.push('## 아티팩트 생성 프로토콜');
  lines.push('문서/보고서/시트/3D 요청 시:');
  lines.push('1. <<<ARTIFACT_START>>> + HTML(body 내용만, 다크테마 bg:#0f1117 text:#e2e8f0 accent:#6366f1) + <<<ARTIFACT_END>>>');
  lines.push('2. 바로 create_artifact(title="제목") 호출. 성공 시 절대 재시도 금지.');
  lines.push('- CSS 간결하게, data-embed 태그 적극 활용, 6섹션 이상이면 핵심만, 잘리면 시스템이 이어쓰기 요청.');
  lines.push('- "[아티팩트 수정 요청]" → patch_artifact만 사용 (create_artifact 절대 금지). find 15자+, embed 태그 보존.');
  lines.push('');
  lines.push('## Mermaid 규칙');
  lines.push('- \\n+4칸 들여쓰기 필수. 노드ID=영문만. 한글라벨=["..."] 표기. 특수문자(+%&<>"\'#{}) 절대 금지.');
  lines.push('- ASCII 아트 대신 반드시 Mermaid 또는 data-embed="graph" 사용.');
  lines.push('');
  lines.push('## 캐릭터 기획서');
  lines.push('build_character_profile 결과의 [EMBED_SQL] 힌트를 data-embed="query" 태그에 사용.');
  lines.push('기획서=카드 레이아웃, 시트뷰=탭 레이아웃(showTab JS 패턴 사용).');
  lines.push('');
  lines.push('## Git 데이터 변경 이력 분석');
  lines.push('- "언제 수정됐어?" / "뭐가 바뀌었어?" → query_git_history → 커밋 hash 확인 → show_revision_diff(hash) 호출');
  lines.push('- show_revision_diff 결과에는 실제 +/- 변경 라인이 포함됨 → 구체적인 값 변경 내용 분석 가능');
  lines.push('- 바이너리 파일(.xlsx 등)은 내용 미표시 → 텍스트 파일(csv/json/dbml 등) 위주로 분석');
  lines.push('- 특정 파일만 보려면 show_revision_diff(hash, file_path="경로") 사용');
  lines.push('');
  lines.push('## 코드 분석');
  lines.push('read_guide("_OVERVIEW") → 도메인 가이드 → search_code → read_code_file 순서.');
  lines.push('');
  lines.push('## SQL 주의');
  lines.push('AS 별칭은 영문만 (한글 AS 절대 금지). ERD 요청=핵심 테이블 1개만 show_table_schema.');
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
      // 관계를 테이블별로 그룹화하여 압축 표시
      const refsByFrom = new Map<string, string[]>();
      for (const r of schema.refs) {
        const from = nameById.get(r.fromTable) ?? r.fromTable;
        const to = nameById.get(r.toTable) ?? r.toTable;
        if (!refsByFrom.has(from)) refsByFrom.set(from, []);
        refsByFrom.get(from)!.push(`${r.fromColumns[0]}→${to}`);
      }
      lines.push(`## FK 관계 (${schema.refs.length}개)`);
      let refCount = 0;
      for (const [from, refs] of refsByFrom) {
        if (refCount >= 30) { lines.push(`... 외 ${refsByFrom.size - 30}개 테이블`); break; }
        lines.push(`${from}: ${refs.join(', ')}`);
        refCount++;
      }
      lines.push('');
    }

    if (schema.enums.length > 0) {
      // Enum 이름만 나열 (상세 값은 ENUMS 가상테이블로 조회)
      const enumNames = schema.enums.slice(0, 50).map(e => e.name).join(', ');
      const more = schema.enums.length > 50 ? ` ... +${schema.enums.length - 50}개` : '';
      lines.push(`## Enum (${schema.enums.length}개, 상세: SELECT * FROM ENUMS WHERE enum_name='이름')`);
      lines.push(enumNames + more);
      lines.push('');
    }
  }

  // 테이블 목록을 한 줄로 압축 (테이블명:행수)
  const tableList = Array.from(tableData).map(([key, { rows }]) => `${key}:${rows.length}`).join(', ');
  if (tableList) lines.push(`## 데이터 테이블: ${tableList}`);
  lines.push('');

  lines.push('## SQL 규칙');
  lines.push('테이블명 대소문자 무시. #컬럼→백틱(`#col`). 값=문자열(WHERE id=\'1001\'). 숫자비교=CAST(col AS NUMBER). AS별칭=영문만(한글 AS 절대금지).');
  lines.push('');
  lines.push('## Enum 조회 (가상테이블 ENUMS)');
  lines.push(VIRTUAL_TABLE_SCHEMA);
  lines.push('SELECT * FROM ENUMS WHERE enum_name=\'이름\'. ⛔ FROM Enum (예약어), FROM __u_enum 절대 금지.');
  lines.push('');
  lines.push('## ⛔ alasql 예약어 테이블명 규칙 — 반드시 준수');
  lines.push('아래 테이블명은 alasql 예약어이므로 SQL에서 직접 사용 불가. 내부명(__u_xxx)으로 쿼리할 것:');

  // 로드된 tableData 중 예약어인 것 목록
  for (const [key] of tableData) {
    const upperKey = key.toUpperCase();
    if (RESERVED_TABLE_NAMES.has(upperKey)) {
      lines.push(`- "${key}" 게임데이터 테이블 → SELECT * FROM __u_${key} WHERE ... (절대 FROM ${key} 사용 금지)`);
    }
  }

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

async function fetchGitHistory(count: number, filterPath?: string, repo?: string): Promise<GitCommit[]> {
  const params = new URLSearchParams({
    count: String(count),
    include_files: 'true',
  });
  if (filterPath) params.set('path', filterPath);
  if (repo && repo !== 'data') params.set('repo', repo);

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
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
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

// partial JSON 에서 html 값을 추출 (완성되지 않은 JSON도 처리) — content_block_stop 폴백용
function extractHtmlFromPartialJson(partialJson: string): { title: string; html: string } | null {
  const titleMatch = partialJson.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const htmlStartMatch = partialJson.match(/"html"\s*:\s*"/);
  if (!htmlStartMatch) return null;

  const htmlStart = htmlStartMatch.index! + htmlStartMatch[0].length;
  let raw = partialJson.slice(htmlStart);

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
      break;
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

// ── 증분(Incremental) 아티팩트 HTML 파서 ────────────────────────────────────
// O(n) 총 처리량: 각 문자를 정확히 1번만 처리. 기존 O(n²) 대비 30KB 아티팩트에서 ~1000배 빠름.
// 스트리밍 핫패스(content_block_delta)에서 사용.

interface _ArtParseCtx {
  phase: 'scan' | 'html' | 'done';
  scanPos: number;    // 'scan' phase: "html" 키 탐색 시작 위치
  decPos: number;     // 'html' phase: 디코드 커서 위치
  htmlParts: string[]; // 디코딩된 HTML 조각들 (join은 콜백 직전 1회)
  htmlJoined: string;  // 마지막 join 결과 캐시
  htmlPartsLen: number; // parts 총 문자 수 (join 없이 추적)
  esc: boolean;       // 이전 문자가 백슬래시 (cross-delta 경계 처리)
  title: string;      // 추출된 제목
  titleScanned: number; // title 탐색 완료 위치
}

function initArtParseCtx(): _ArtParseCtx {
  return {
    phase: 'scan', scanPos: 0, decPos: 0,
    htmlParts: [], htmlJoined: '', htmlPartsLen: 0,
    esc: false, title: '', titleScanned: 0,
  };
}

/** 증분 파서: _inputStr에 새 delta가 추가된 후 호출. 새 문자만 처리한다. */
function advanceArtParse(ctx: _ArtParseCtx, input: string): void {
  // ── Phase 1: "html" 키 탐색 ──
  if (ctx.phase === 'scan') {
    const marker = '"html"';
    const idx = input.indexOf(marker, ctx.scanPos);
    if (idx >= 0) {
      // "html" 발견 → : " 찾기 (콜론 + 열기 따옴표)
      let pos = idx + marker.length;
      while (pos < input.length && input[pos] !== '"') pos++;
      if (pos < input.length && input[pos] === '"') {
        ctx.phase = 'html';
        ctx.decPos = pos + 1; // 열기 따옴표 다음부터 디코딩 시작
      } else {
        ctx.scanPos = idx; // 열기 따옴표 아직 안 옴 → 다음 delta에서 재시도
      }
    } else {
      // 부분 매치 방지: 마지막 7글자부터 재탐색
      ctx.scanPos = Math.max(0, input.length - marker.length - 1);
    }
  }

  // ── Phase 2: HTML 값 디코딩 (증분) ──
  if (ctx.phase === 'html') {
    const len = input.length;
    let pos = ctx.decPos;
    const parts: string[] = [];
    let partsBuf = ''; // 짧은 문자열 버퍼 (push 호출 최소화)

    while (pos < len) {
      const ch = input[pos];
      if (ctx.esc) {
        ctx.esc = false;
        switch (ch) {
          case 'n': partsBuf += '\n'; break;
          case 't': partsBuf += '\t'; break;
          case 'r': partsBuf += '\r'; break;
          case '"': partsBuf += '"'; break;
          case '\\': partsBuf += '\\'; break;
          case '/': partsBuf += '/'; break;
          default: partsBuf += '\\'; partsBuf += ch; break;
        }
        pos++;
      } else if (ch === '\\') {
        ctx.esc = true;
        pos++;
      } else if (ch === '"') {
        ctx.phase = 'done';
        pos++;
        break;
      } else {
        partsBuf += ch;
        pos++;
      }
      // 256B마다 배열로 이동 (문자열 연결 최적화)
      if (partsBuf.length >= 256) {
        parts.push(partsBuf);
        partsBuf = '';
      }
    }
    if (partsBuf) parts.push(partsBuf);
    if (parts.length > 0) {
      const chunk = parts.join('');
      ctx.htmlParts.push(chunk);
      ctx.htmlPartsLen += chunk.length;
    }
    ctx.decPos = pos;

    // join 캐시 갱신 (콜백에서 사용)
    if (ctx.htmlParts.length > 20) {
      // 파트가 많아지면 압축 (GC 부담 줄이기)
      ctx.htmlJoined = ctx.htmlParts.join('');
      ctx.htmlParts = [ctx.htmlJoined];
    } else {
      ctx.htmlJoined = ctx.htmlParts.join('');
    }
  }

  // ── Title 추출 (작은 문자열이므로 regex OK, 한 번만 실행) ──
  if (!ctx.title && input.length > ctx.titleScanned + 5) {
    const m = input.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      ctx.title = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else {
      const pm = input.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (pm) ctx.title = pm[1].replace(/\\"/g, '"');
    }
    ctx.titleScanned = input.length;
  }
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

async function streamClaude(
  requestBody: object,
  onTextDelta: (delta: string) => void,
  onArtifactProgress?: (html: string, title: string, charCount: number, rawJson?: string) => void,
  /** true이면 이어쓰기 모드: <<<ARTIFACT_START>>> 없이도 텍스트를 바로 아티팩트 HTML로 캡처 */
  artifactContinuationMode = false,
): Promise<ClaudeResponse & { usage?: TokenUsage; _streamedArtifactHtml?: string }> {
  // ── 자동 재시도 (529 Overloaded / 네트워크 오류) ──
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [3000, 8000, 15000]; // 3초, 8초, 15초
  let response!: Response;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-TM-Knowledge': 'injected' },
        body: JSON.stringify({ ...requestBody, stream: true }),
      });

      if (response.ok) break; // 성공

      if (response.status === 529 || response.status === 503 || response.status === 502) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          console.warn(`[streamClaude] ⚠️ ${response.status} Overloaded — ${delay / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
          onTextDelta(`\n⏳ 서버 과부하 (${response.status}) — ${delay / 1000}초 후 자동 재시도합니다... (${attempt + 1}/${MAX_RETRIES})\n`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }

      // 재시도 불가능한 오류
      const err = await response.text();
      throw new Error(`Claude API 오류 (${response.status}): ${err}`);
    } catch (e) {
      // 네트워크 오류 (fetch 자체 실패)
      if (e instanceof TypeError && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt];
        console.warn(`[streamClaude] ⚠️ 네트워크 오류 — ${delay / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
        onTextDelta(`\n⏳ 네트워크 오류 — ${delay / 1000}초 후 자동 재시도합니다... (${attempt + 1}/${MAX_RETRIES})\n`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 529) throw new Error('Claude 서버가 일시적으로 과부하 상태입니다. 3회 재시도 후에도 실패했습니다. 잠시 후 다시 시도해 주세요.');
    throw new Error(`Claude API 오류 (${response.status}): ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  // 블록별 누적
  const blocks: Record<number, ContentBlock & { _inputStr?: string }> = {};
  let stopReason: ClaudeResponse['stop_reason'] = 'end_turn';
  let buf = '';
  let lastEventType = ''; // SSE event: 타입 추적
  const usage: TokenUsage = { input_tokens: 0, output_tokens: 0 };

  // ── 텍스트 마커 기반 아티팩트 스트리밍 상태 ──
  // 이어쓰기 모드: <<<ARTIFACT_START>>> 없이 바로 HTML 캡처 시작
  let _artMarkerState: 'idle' | 'streaming' | 'done' = artifactContinuationMode ? 'streaming' : 'idle';
  let _artStreamedHtml = '';           // 마커 사이에 캡처된 HTML
  let _artPendingText = '';            // 마커 매칭을 위한 대기 버퍼
  const MARKER_START = '<<<ARTIFACT_START>>>';
  const MARKER_END = '<<<ARTIFACT_END>>>';

  if (artifactContinuationMode) {
    console.log('[streamClaude] 🔄 아티팩트 이어쓰기 모드: <<<ARTIFACT_START>>> 없이 바로 HTML 캡처');
    // 이어쓰기 모드에서는 패널이 이미 열려있으므로 진행 상태만 알림
    if (onArtifactProgress) onArtifactProgress('', '이어쓰기 중...', 0, '');
  }

  /** 텍스트 delta를 처리: 마커를 감지하여 아티팩트 HTML 캡처 */
  const processTextForArtifact = (deltaText: string) => {
    if (_artMarkerState === 'done') {
      // 이미 종료 — 일반 텍스트로 전달
      onTextDelta(deltaText);
      return;
    }

    _artPendingText += deltaText;

    if (_artMarkerState === 'idle') {
      // START 마커 검색
      const startIdx = _artPendingText.indexOf(MARKER_START);
      if (startIdx !== -1) {
        // 마커 이전 텍스트는 일반 텍스트로 전달
        const before = _artPendingText.substring(0, startIdx);
        if (before) onTextDelta(before);
        
        _artMarkerState = 'streaming';
        _artStreamedHtml = '';
        _artPendingText = _artPendingText.substring(startIdx + MARKER_START.length);
        
        // 패널 열기
        if (onArtifactProgress) {
          console.log('[ArtTextStream] ⚡ <<<ARTIFACT_START>>> 감지 → 패널 오픈');
          onArtifactProgress('', '', 0, '');
        }
        
        // 마커 이후 잔여 텍스트 재귀 처리
        if (_artPendingText) {
          const remaining = _artPendingText;
          _artPendingText = '';
          processTextForArtifact(remaining);
        }
        return;
      }
      
      // 마커가 부분적으로 매칭 가능한지 확인 (마커의 일부만 도착한 경우)
      // <<<ARTIFACT_START>>> 의 최대 부분 접두사 길이
      let possiblePartial = false;
      for (let i = 1; i < MARKER_START.length; i++) {
        if (_artPendingText.endsWith(MARKER_START.substring(0, i))) {
          possiblePartial = true;
          // 부분 매칭 가능 → 해당 부분 빼고 나머지만 전달
          const safe = _artPendingText.substring(0, _artPendingText.length - i);
          if (safe) onTextDelta(safe);
          _artPendingText = _artPendingText.substring(_artPendingText.length - i);
          return;
        }
      }
      
      if (!possiblePartial) {
        // 마커 없음 — 전부 일반 텍스트
        onTextDelta(_artPendingText);
        _artPendingText = '';
      }
    } else if (_artMarkerState === 'streaming') {
      // END 마커 검색
      const endIdx = _artPendingText.indexOf(MARKER_END);
      if (endIdx !== -1) {
        // END 마커 이전까지가 HTML
        const htmlChunk = _artPendingText.substring(0, endIdx);
        _artStreamedHtml += htmlChunk;
        
        _artMarkerState = 'done';
        console.log(`[ArtTextStream] <<<ARTIFACT_END>>> 감지 → HTML ${_artStreamedHtml.length}자 캡처 완료`);
        
        // 최종 HTML 전달
        if (onArtifactProgress) {
          onArtifactProgress(_artStreamedHtml, '', _artStreamedHtml.length, '');
        }
        
        // END 마커 이후 텍스트는 일반 텍스트
        const after = _artPendingText.substring(endIdx + MARKER_END.length);
        _artPendingText = '';
        if (after) onTextDelta(after);
        return;
      }
      
      // END 마커가 부분적으로 매칭 가능한지 확인
      let partialEndLen = 0;
      for (let i = Math.min(MARKER_END.length - 1, _artPendingText.length); i >= 1; i--) {
        if (_artPendingText.endsWith(MARKER_END.substring(0, i))) {
          partialEndLen = i;
          break;
        }
      }
      
      // 안전하게 전달할 수 있는 부분까지 HTML에 추가
      const safeLen = _artPendingText.length - partialEndLen;
      if (safeLen > 0) {
        const chunk = _artPendingText.substring(0, safeLen);
        _artStreamedHtml += chunk;
        
        // 실시간 프로그레스 전달
        if (onArtifactProgress) {
          onArtifactProgress(_artStreamedHtml, '', _artStreamedHtml.length, '');
        }
      }
      _artPendingText = _artPendingText.substring(safeLen);
    }
  };

  let _readCount = 0;
  const _streamStart = performance.now();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    _readCount++;
    const chunk = decoder.decode(value, { stream: true });
    buf += chunk;
    if (_readCount <= 3 || _readCount % 50 === 0) {
      console.log(`[streamClaude] 📦 chunk #${_readCount}: +${chunk.length}B (+${(performance.now() - _streamStart).toFixed(0)}ms)`);
    }

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

      // ★ 디버그: 모든 SSE 이벤트 타입 로깅 (스트리밍 진단용)
      if (ev.type !== 'content_block_delta' && ev.type !== 'ping') {
        console.log(`[SSE] ${ev.type}`, ev.type === 'content_block_start' ? (ev.content_block as Record<string, unknown>)?.type + ':' + (ev.content_block as Record<string, unknown>)?.name : '');
      }

      switch (ev.type) {
        case 'content_block_start': {
          const idx = ev.index as number;
          const cb = ev.content_block as ContentBlock;
          if (cb.type === 'tool_use') {
            blocks[idx] = { ...cb, _inputStr: '' } as ContentBlock & { _inputStr: string };
            // patch_artifact 블록 시작 → 아티팩트 패널 오픈
            // create_artifact는 텍스트 마커에서 이미 패널 오픈되므로, 마커가 없을 때만 여기서 오픈
            if ((cb as ToolUseBlock).name === 'patch_artifact' && onArtifactProgress) {
              console.log(`[streamClaude] ⚡ patch_artifact content_block_start → 패널 오픈`);
              onArtifactProgress('', '', 0, '');
            }
            if ((cb as ToolUseBlock).name === 'create_artifact' && onArtifactProgress && !_artStreamedHtml && _artMarkerState === 'idle') {
              console.log(`[streamClaude] ⚡ create_artifact content_block_start → 패널 오픈 (텍스트 마커 미사용)`);
              onArtifactProgress('', '', 0, '');
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
          if (!b) { console.warn(`[SSE] delta idx=${idx} — block not found!`); break; }

          if (delta.type === 'text_delta' && b.type === 'text') {
            (b as TextBlock).text = ((b as TextBlock).text || '') + (delta.text ?? '');
            // 마커 파서를 통해 아티팩트 스트리밍 감지
            processTextForArtifact(delta.text ?? '');
          } else if (delta.type === 'input_json_delta' && b.type === 'tool_use') {
            const tb = b as ContentBlock & { _inputStr: string };
            tb._inputStr = (tb._inputStr || '') + (delta.partial_json ?? '');

            // create_artifact: html 파라미터 없음 (텍스트 마커 방식) — title만 추출하여 패널 헤더 업데이트
            if ((b as ToolUseBlock).name === 'create_artifact' && onArtifactProgress) {
              const tm = tb._inputStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)/);
              const title = tm ? tm[1].replace(/\\"/g, '"') : '';
              // 텍스트 마커에서 캡처한 HTML이 있으면 그것과 함께 전달
              if (_artStreamedHtml) {
                onArtifactProgress(_artStreamedHtml, title, _artStreamedHtml.length, '');
              } else {
                // 아직 HTML 없음 → title만 업데이트 (charCount는 JSON 크기)
                onArtifactProgress('', title, tb._inputStr.length, tb._inputStr);
              }
            }

            // patch_artifact: JSON 스트리밍 진행 상태 + rawJson 전달 → 클라이언트에서 점진적 패치 적용
            if ((b as ToolUseBlock).name === 'patch_artifact' && onArtifactProgress) {
              const patchCount = (tb._inputStr.match(/"find"/g) || []).length;
              const charCount = tb._inputStr.length;
              onArtifactProgress('', `패치 수정 중 (${patchCount}개)`, charCount, tb._inputStr);
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
              // JSON 파싱 실패 → 부분 복구
              if ((b as ToolUseBlock).name === 'create_artifact') {
                const titleMatch = rawStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                const descMatch = rawStr.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                (b as ToolUseBlock).input = {
                  title: titleMatch?.[1] ?? '문서',
                  description: descMatch?.[1] ?? '',
                };
              } else {
                (b as ToolUseBlock).input = {};
              }
            }
          }
          break;
        }
        case 'message_start': {
          const msg = ev.message as { usage?: { input_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } } | undefined;
          if (msg?.usage) {
            usage.input_tokens = msg.usage.input_tokens ?? 0;
            usage.cache_creation_input_tokens = msg.usage.cache_creation_input_tokens;
            usage.cache_read_input_tokens = msg.usage.cache_read_input_tokens;
          }
          break;
        }
        case 'message_delta': {
          const delta = ev.delta as { stop_reason?: string };
          if (delta.stop_reason) stopReason = delta.stop_reason as ClaudeResponse['stop_reason'];
          const deltaUsage = ev.usage as { output_tokens?: number } | undefined;
          if (deltaUsage?.output_tokens) usage.output_tokens = deltaUsage.output_tokens;
          break;
        }
      }
    }

    // ★ 이벤트 처리 후 브라우저에 양보 — setInterval 틱이 _artBuf 읽어서 iframe 갱신
    await new Promise<void>(r => setTimeout(r, 0));
  }

  // ★ 스트림 종료 시 END 마커 미수신 처리 (max_tokens 초과 또는 네트워크 문제)
  // _artMarkerState가 'streaming'이면 END 마커가 안 왔지만 축적된 HTML은 유효함
  // (processTextForArtifact 클로저에서 _artMarkerState를 변경하므로 타입 단언 필요)
  if ((_artMarkerState as string) === 'streaming' && _artStreamedHtml.length > 0) {
    // 보류 중인 텍스트도 HTML에 추가
    if (_artPendingText) {
      _artStreamedHtml += _artPendingText;
      _artPendingText = '';
    }
    _artMarkerState = 'done';
    console.log(`[ArtTextStream] ⚠️ 스트림 종료 but <<<ARTIFACT_END>>> 미수신 → HTML ${_artStreamedHtml.length}자 강제 확정`);
    if (onArtifactProgress) {
      onArtifactProgress(_artStreamedHtml, '', _artStreamedHtml.length, '');
    }
  }

  const contentArray = Object.entries(blocks)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, b]) => {
      // 내부 전용 필드 모두 제거 → Claude API 재전송 시 "Extra inputs" 오류 방지
      const {
        _inputStr: _u1, _artCtx: _u2,
        _deltaN: _u3, _cachedHtml: _u4, _cachedTitle: _u5, _htmlKeyFound: _u6,
        ...clean
      } = b as ContentBlock & Record<string, unknown>;
      void _u1; void _u2; void _u3; void _u4; void _u5; void _u6;
      return clean as ContentBlock;
    });

  return { content: contentArray, stop_reason: stopReason, usage, _streamedArtifactHtml: _artStreamedHtml || undefined };
}

// ── RAG 트레이스 유틸 ─────────────────────────────────────────────────────────

import type { RagTrace, RagTraceStep } from '../../store/useRagTraceStore.ts';
import { useRagTraceStore } from '../../store/useRagTraceStore.ts';

const KIND_TO_TOOL: Record<string, string> = {
  data_query: 'query_game_data', schema_card: 'show_table_schema',
  git_history: 'query_git_history', revision_diff: 'show_revision_diff',
  image_search: 'find_resource_image', character_profile: 'build_character_profile',
  knowledge: 'read_knowledge',
  code_guide: 'read_guide', code_search: 'search_code', code_file: 'read_code_file',
  artifact: 'create_artifact', artifact_patch: 'patch_artifact',
  asset_search: 'search_assets', scene_yaml: 'read_scene_yaml',
  prefab_preview: 'preview_prefab', fbx_animation: 'preview_fbx_animation',
  jira_search: 'search_jira', jira_issue: 'get_jira_issue',
  jira_create: 'create_jira_issue', jira_comment: 'add_jira_comment', jira_status: 'update_jira_issue_status',
  confluence_search: 'search_confluence', confluence_page: 'get_confluence_page',
};

function buildRagTrace(query: string, toolCalls: ToolCallResult[], tokenUsage?: TokenUsageSummary): RagTrace {
  const steps: RagTraceStep[] = toolCalls.map(tc => {
    const toolName = KIND_TO_TOOL[tc.kind] ?? tc.kind;
    const tables: string[] = [];
    const guides: string[] = [];

    if (tc.kind === 'data_query') {
      const sqlUpper = (tc as DataQueryResult).sql.toUpperCase();
      const fromMatch = sqlUpper.match(/FROM\s+[`"]?(\w+)/gi);
      fromMatch?.forEach(m => { const t = m.replace(/FROM\s+[`"]?/i, ''); if (t) tables.push(t); });
    } else if (tc.kind === 'schema_card') {
      tables.push((tc as SchemaCardResult).tableName);
    } else if (tc.kind === 'character_profile') {
      const cp = tc as CharacterProfileResult;
      if (cp.charTableName) tables.push(cp.charTableName);
      cp.connections?.forEach(c => tables.push(c.tableName));
    } else if (tc.kind === 'code_guide') {
      const label = (tc as CodeGuideResult).label;
      if (label && label !== '가이드 목록') guides.push(label.replace(/^(DB |코드 )가이드: /, ''));
    }

    return {
      toolName, tables, guides,
      duration: ('duration' in tc ? (tc as any).duration : undefined),
      error: !!('error' in tc && (tc as any).error),
    };
  });

  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    query,
    timestamp: Date.now(),
    steps,
    totalInputTokens: tokenUsage?.total_input ?? 0,
    totalOutputTokens: tokenUsage?.total_output ?? 0,
  };
}

// ── 메인 함수 ────────────────────────────────────────────────────────────────

/** 실시간 thinking step 정보 */
export interface ThinkingStep {
  type: 'iteration_start' | 'streaming' | 'tool_start' | 'tool_done' | 'iteration_done' | 'continuation';
  iteration: number;
  maxIterations: number;
  toolName?: string;
  toolLabel?: string;
  detail?: string;
  timestamp: number;
}

export interface TokenUsageSummary {
  iterations: Array<{ iteration: number; input_tokens: number; output_tokens: number; cache_creation?: number; cache_read?: number }>;
  total_input: number;
  total_output: number;
  total_tokens: number;
  system_prompt_estimate: number;
}

// ── 널리지 인메모리 캐시 (30초 TTL) ────────────────────────────────────────
// 매 메시지마다 API 2~N회 호출하던 것을 캐시에서 즉시 반환
let _knowledgeCache: { entries: { name: string; sizeKB: number; content: string }[]; ts: number } | null = null;
const KNOWLEDGE_CACHE_TTL = 30_000; // 30초

async function _getKnowledgeEntries(): Promise<{ name: string; sizeKB: number; content: string }[]> {
  if (_knowledgeCache && Date.now() - _knowledgeCache.ts < KNOWLEDGE_CACHE_TTL) {
    return _knowledgeCache.entries;
  }
  const entries: { name: string; sizeKB: number; content: string }[] = [];
  try {
    const knResp = await fetch('/api/knowledge/list');
    if (knResp.ok) {
      const knData = await knResp.json() as { items?: { name: string; sizeKB: number }[] };
      const items = knData.items ?? [];
      const MAX_PER_FILE = 50 * 1024;
      const MAX_TOTAL = 150 * 1024;
      let totalLen = 0;
      const reads = await Promise.allSettled(
        items.map(async (item) => {
          const r = await fetch(`/api/knowledge/read?name=${encodeURIComponent(item.name)}`);
          if (!r.ok) return { ...item, content: '(읽기 실패)' };
          const d = await r.json() as { content?: string };
          let content = d.content ?? '';
          if (content.length > MAX_PER_FILE) content = content.slice(0, MAX_PER_FILE) + '\n...(잘림)';
          return { ...item, content };
        })
      );
      for (const r of reads) {
        if (r.status === 'fulfilled' && r.value.content) {
          if (totalLen + r.value.content.length > MAX_TOTAL) {
            entries.push({ ...r.value, content: r.value.content.slice(0, MAX_TOTAL - totalLen) + '\n...(총 용량 제한으로 잘림)' });
            break;
          }
          totalLen += r.value.content.length;
          entries.push(r.value);
        }
      }
    }
  } catch { /* 실패해도 무시 */ }
  _knowledgeCache = { entries, ts: Date.now() };
  return entries;
}

// 널리지 변경 이벤트 시 캐시 무효화
if (typeof window !== 'undefined') {
  window.addEventListener('knowledge-updated', () => { _knowledgeCache = null; });
}

export async function sendChatMessage(
  userMessage: string,
  history: ChatTurn[],
  schema: ParsedSchema | null,
  tableData: TableDataMap,
  onToolCall?: (tc: ToolCallResult, index: number) => void,
  onTextDelta?: (delta: string, fullText: string) => void,
  onArtifactProgress?: (html: string, title: string, charCount: number, rawJson?: string) => void,
  onThinkingUpdate?: (step: ThinkingStep) => void,
  onTokenUsage?: (usage: TokenUsageSummary) => void,
  /** 도구 필터: 지정 시 해당 이름의 도구만 사용 가능 (예: ['patch_artifact']) */
  toolFilter?: string[],
): Promise<{ content: string; toolCalls: ToolCallResult[]; rawMessages?: ClaudeMsg[]; tokenUsage?: TokenUsageSummary }> {
  // 컴포넌트가 아직 로딩 중일 때 schema가 null일 수 있으므로 스토어에서 fallback
  const effectiveSchema = schema ?? useSchemaStore.getState().schema;

  // 저장된 널리지 목록 + 내용 가져오기 (인메모리 캐싱으로 매번 API 호출 방지)
  const knowledgeEntries = await _getKnowledgeEntries();

  const systemPrompt = buildSystemPrompt(effectiveSchema, tableData, knowledgeEntries, userMessage);

  // ── 메시지 크기 기반 히스토리 트리밍 (200K 토큰 ≈ 600K chars 제한) ──
  // 1자 ≈ 0.33 토큰 기준, 시스템 프롬프트 + 여유분 확보
  const MAX_MSG_CHARS = 500_000; // ~166K 토큰 (시스템 프롬프트 + 출력 여유 위해)

  function estimateMsgChars(msgs: ClaudeMsg[]): number {
    let total = 0;
    for (const m of msgs) {
      if (typeof m.content === 'string') { total += m.content.length; continue; }
      if (Array.isArray(m.content)) {
        for (const b of m.content as Array<Record<string, unknown>>) {
          if (b.type === 'text' && typeof b.text === 'string') total += (b.text as string).length;
          else if (b.type === 'tool_use' && b.input) total += JSON.stringify(b.input).length;
          else if (b.type === 'tool_result') {
            if (typeof b.content === 'string') total += (b.content as string).length;
            else if (Array.isArray(b.content)) total += JSON.stringify(b.content).length;
          }
          else total += 200; // 기타 블록
        }
      }
    }
    return total;
  }

  /**
   * HTML에서 반복되는 <tr>/<td>/<th> 행을 지능적으로 압축:
   * 첫 3행만 보존하고 나머지는 "(N행 추가...)" 요약으로 대체
   */
  function compressHtmlRows(html: string): string {
    // <style> 블록 → 짧은 요약으로 대체
    const styleCompressed = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<style>/* (스타일 생략) */</style>');
    // <tr> 행 압축: 3행만 보존
    const trPattern = /(<(?:thead|tbody)[^>]*>)((?:\s*<tr[\s\S]*?<\/tr>)+)(\s*<\/(?:thead|tbody)>)/gi;
    return styleCompressed.replace(trPattern, (_match, open: string, rows: string, close: string) => {
      const trMatches = rows.match(/<tr[\s\S]*?<\/tr>/gi);
      if (!trMatches || trMatches.length <= 3) return open + rows + close;
      const kept = trMatches.slice(0, 3).join('\n');
      return `${open}\n${kept}\n<!-- ...${trMatches.length - 3}행 추가 (토큰 절약으로 생략) -->\n${close}`;
    });
  }

  /**
   * JSON 데이터 결과 압축: rows를 최대 5행으로 제한
   */
  function compressJsonData(json: string): string {
    try {
      const parsed = JSON.parse(json);
      if (parsed.rows && Array.isArray(parsed.rows) && parsed.rows.length > 5) {
        const originalLen = parsed.rows.length;
        parsed.rows = parsed.rows.slice(0, 5);
        parsed._compressed = `원본 ${originalLen}행 중 5행만 포함`;
        return JSON.stringify(parsed);
      }
    } catch { /* not JSON, return as-is */ }
    return json;
  }

  /**
   * 대화 히스토리 토큰 다이어트:
   * 1. tool_result: HTML이면 <tr> 행 압축, JSON이면 rows 제한
   * 2. tool_use input: create_artifact의 html을 요약으로 대체
   * 3. assistant text: 이전 아티팩트 HTML 마커 잔해 정리
   */
  function compressHistory(msgs: ClaudeMsg[]): ClaudeMsg[] {
    return msgs.map(m => {
      // ── user 메시지: tool_result 압축 ──
      if (m.role === 'user' && Array.isArray(m.content)) {
        const content = (m.content as Array<Record<string, unknown>>).map(b => {
          if (b.type !== 'tool_result' || typeof b.content !== 'string') return b;
          const c = b.content as string;
          if (c.length <= 3000) return b; // 3KB 이하는 그대로

          // HTML 감지: <로 시작하거나 태그 포함
          if (/<[a-zA-Z]/.test(c)) {
            const compressed = compressHtmlRows(c);
            if (compressed.length < c.length * 0.7) {
              return { ...b, content: compressed.slice(0, 3000) + (compressed.length > 3000 ? `\n...(HTML 압축됨, 원본 ${c.length}자 → ${compressed.length}자)` : '') };
            }
          }

          // JSON 감지: { 또는 [ 로 시작
          if (c.startsWith('{') || c.startsWith('[')) {
            const compressed = compressJsonData(c);
            if (compressed.length <= 3000) return { ...b, content: compressed };
            return { ...b, content: compressed.slice(0, 3000) + `\n...(JSON 압축됨, 원본 ${c.length}자)` };
          }

          // 기타 큰 텍스트: 단순 잘라내기
          return { ...b, content: c.slice(0, 2000) + `\n...(결과 압축됨, 원본 ${c.length}자)` };
        });
        return { ...m, content } as ClaudeMsg;
      }

      // ── assistant 메시지: tool_use input의 큰 html 압축 ──
      if (m.role === 'assistant' && Array.isArray(m.content)) {
        const content = (m.content as ContentBlock[]).map(b => {
          if (b.type !== 'tool_use') return b;
          const tb = b as ToolUseBlock;
          const inp = tb.input as Record<string, unknown>;
          // create_artifact의 html 필드가 크면 요약으로 대체
          if (tb.name === 'create_artifact' && typeof inp.html === 'string' && (inp.html as string).length > 500) {
            return { ...tb, input: { ...inp, html: `(HTML ${(inp.html as string).length}자, 토큰 절약으로 생략됨)` } };
          }
          // query_game_data의 큰 input도 정리
          if (typeof inp.sql === 'string' && (inp.sql as string).length > 1000) {
            return { ...tb, input: { ...inp, sql: (inp.sql as string).slice(0, 500) + '...' } };
          }
          return b;
        });
        return { ...m, content } as ClaudeMsg;
      }

      return m;
    });
  }

  let rawHistoryMsgs = historyToMessages(history);
  // 히스토리 지능적 압축 (HTML 행, JSON rows, tool_use input)
  rawHistoryMsgs = compressHistory(rawHistoryMsgs);
  // 그래도 초과하면 오래된 메시지부터 제거
  while (rawHistoryMsgs.length > 2 && estimateMsgChars(rawHistoryMsgs) > MAX_MSG_CHARS) {
    rawHistoryMsgs = rawHistoryMsgs.slice(2); // 앞에서 2개씩 제거 (user + assistant 쌍)
  }

  const sysChars = systemPrompt.length;
  const msgChars = estimateMsgChars(rawHistoryMsgs);
  console.log(`[Chat] 토큰 추정: system=${Math.round(sysChars/3)}t, history=${Math.round(msgChars/3)}t, 합계≈${Math.round((sysChars+msgChars)/3)}t (${rawHistoryMsgs.length}개 메시지)`);

  const messages: ClaudeMsg[] = [
    ...rawHistoryMsgs,
    { role: 'user', content: userMessage },
  ];

  const allToolCalls: ToolCallResult[] = [];
  const MAX_ITERATIONS = 12;
  let accumulatedText = '';
  let totalText = ''; // max_tokens 자동 계속 시 누적 텍스트
  let continuationCount = 0; // 자동 계속 횟수
  let artifactAccumulatedHtml = ''; // 이터레이션 간 아티팩트 HTML 누적 (이어쓰기 지원)
  let artifactContinuationCount = 0; // 아티팩트 이어쓰기 횟수

  // ── 널리지 로드를 ThinkingStep + ToolCallResult로 표시 ──
  // 시스템 프롬프트에 포함된 널리지를 사용자에게 알림 (씽킹 패널 + RAG Graph 동기화)
  if (knowledgeEntries.length > 0) {
    const knNames = knowledgeEntries.map(e => e.name);
    onThinkingUpdate?.({
      type: 'tool_start', iteration: 0, maxIterations: MAX_ITERATIONS,
      toolName: 'read_knowledge', toolLabel: '🧠 널리지 읽기',
      detail: knNames.join(', '),
      timestamp: Date.now(),
    });
    // 각 널리지를 ToolCallResult로 등록 → RAG Graph에 표시
    for (const entry of knowledgeEntries) {
      const knTc: KnowledgeResult = {
        kind: 'knowledge', action: 'read', name: entry.name,
        content: `(시스템 프롬프트에 포함됨, ${entry.sizeKB}KB)`, sizeKB: entry.sizeKB,
      };
      allToolCalls.push(knTc);
      onToolCall?.(knTc, allToolCalls.length - 1);
    }
    onThinkingUpdate?.({
      type: 'tool_done', iteration: 0, maxIterations: MAX_ITERATIONS,
      toolName: 'read_knowledge', toolLabel: '🧠 널리지 읽기',
      detail: `${knowledgeEntries.length}개 파일 로드: ${knNames.join(', ')}`,
      timestamp: Date.now(),
    });
  }

  // 토큰 사용량 추적
  const tokenIterations: TokenUsageSummary['iterations'] = [];
  const systemPromptEstimate = Math.ceil(systemPrompt.length / 3.5); // 대략적 토큰 수 추정

  // ── 동적 max_tokens: 아티팩트 요청이면 16384, 일반 대화면 4096 ──
  const ARTIFACT_KEYWORDS = /정리해줘|문서로|보고서|시트.*만들|뽑아줘|만들어줘|아티팩트|3D|모델링|캐릭터.*시트|릴리즈.*노트|분석|작성해줘/;
  const dynamicMaxTokens = ARTIFACT_KEYWORDS.test(userMessage) ? 16384 : 4096;

  // ── Anthropic Prompt Caching: 시스템 프롬프트 + 도구 정의를 캐싱하여 TTFT 대폭 감소 ──
  // cache_control 마커를 추가하면 동일한 시스템 프롬프트가 서버에 캐싱됨 (5분 TTL)
  // 첫 요청: cache_creation_input_tokens 발생 (25% 비용 증가)
  // 후속 요청: cache_read_input_tokens 발생 (90% 비용 절감 + TTFT 80% 감소)
  // 도구 필터 적용: toolFilter가 있으면 해당 도구만 사용
  const filteredTools = toolFilter ? TOOLS.filter(t => toolFilter.includes(t.name)) : TOOLS;
  if (toolFilter) console.log(`[Chat] 🔒 도구 제한: ${toolFilter.join(', ')} (${filteredTools.length}/${TOOLS.length}개)`);
  const cachedTools = filteredTools.map((tool, idx) =>
    idx === filteredTools.length - 1
      ? { ...tool, cache_control: { type: 'ephemeral' as const } }  // 마지막 도구에 캐시 브레이크포인트
      : tool
  );

  const requestBase = {
    model: 'claude-opus-4-6',
    max_tokens: dynamicMaxTokens,
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },  // 시스템 프롬프트 캐싱
      },
    ],
    tools: cachedTools,
  };

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    accumulatedText = '';
    console.log(`[Chat] 이터레이션 ${i + 1}/${MAX_ITERATIONS} 시작, messages: ${messages.length}`);
    onThinkingUpdate?.({ type: 'iteration_start', iteration: i + 1, maxIterations: MAX_ITERATIONS, timestamp: Date.now() });

    // 529 재시도 포함 스트리밍 호출
    let data: (ClaudeResponse & { _streamedArtifactHtml?: string }) | null = null;
    const safeMessages = sanitizeMessages(messages); // orphan tool_use 방어

    // 아티팩트 이어쓰기 모드: onArtifactProgress를 감싸서 누적 HTML과 합침
    const wrappedArtifactProgress: typeof onArtifactProgress = artifactAccumulatedHtml
      ? (html, title, charCount, rawJson) => {
          // 이전 이터레이션의 누적 HTML + 현재 스트리밍 HTML
          const combined = artifactAccumulatedHtml + html;
          onArtifactProgress?.(combined, title || `이어쓰기 중... (${artifactContinuationCount + 1}회)`, combined.length, rawJson);
        }
      : onArtifactProgress;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000 * attempt));
      try {
        let firstDelta = true;
        // 이어쓰기 모드: 누적 HTML이 있으면 <<<ARTIFACT_START>>> 없이도 바로 캡처
        const isArtContinuation = artifactAccumulatedHtml.length > 0;
        data = await streamClaude(
          { ...requestBase, messages: safeMessages },
          (delta) => {
            accumulatedText += delta;
            if (firstDelta) {
              firstDelta = false;
              onThinkingUpdate?.({ type: 'streaming', iteration: i + 1, maxIterations: MAX_ITERATIONS, detail: isArtContinuation ? '아티팩트 이어쓰기 중' : '응답 생성 중', timestamp: Date.now() });
            }
            // 채팅에 표시할 텍스트에서 HTML 태그 제거 (아티팩트 HTML이 채팅에 노출되지 않도록)
            const cleanDelta = stripHtmlFromChatText(delta);
            const fullClean = continuationCount > 0 ? totalText + stripHtmlFromChatText(accumulatedText) : stripHtmlFromChatText(accumulatedText);
            if (cleanDelta) onTextDelta?.(cleanDelta, fullClean);
          },
          wrappedArtifactProgress,
          isArtContinuation, // 이어쓰기 모드 전달
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
    
    // 텍스트 마커에서 캡처된 아티팩트 HTML
    const streamedArtifactHtml = data._streamedArtifactHtml;

    // 토큰 사용량 기록
    if (data.usage) {
      tokenIterations.push({
        iteration: i + 1,
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
        cache_creation: data.usage.cache_creation_input_tokens,
        cache_read: data.usage.cache_read_input_tokens,
      });
      const summary: TokenUsageSummary = {
        iterations: [...tokenIterations],
        total_input: tokenIterations.reduce((s, t) => s + t.input_tokens, 0),
        total_output: tokenIterations.reduce((s, t) => s + t.output_tokens, 0),
        total_tokens: tokenIterations.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0),
        system_prompt_estimate: systemPromptEstimate,
      };
      onTokenUsage?.(summary);
    }

    console.log(`[Chat] 이터레이션 ${i + 1} 완료: stop_reason=${data.stop_reason}, blocks=${data.content.length}, text="${accumulatedText.slice(0, 60)}"${data.usage ? `, tokens: in=${data.usage.input_tokens} out=${data.usage.output_tokens}` : ''}`);
    onThinkingUpdate?.({ type: 'iteration_done', iteration: i + 1, maxIterations: MAX_ITERATIONS, detail: `stop_reason=${data.stop_reason}`, timestamp: Date.now() });

    // ── 최종 답변 ──
    if (data.stop_reason === 'end_turn' || data.stop_reason === 'stop_sequence') {
      let text = data.content
        .filter((b): b is TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      // 텍스트에서 아티팩트 마커 + HTML 제거 (사용자에게 보이지 않도록)
      text = text.replace(/<<<ARTIFACT_START>>>[\s\S]*?<<<ARTIFACT_END>>>/g, '').trim();
      // 채팅에 남은 HTML 태그도 제거
      text = stripHtmlFromChatText(text);

      // 자동 계속 중이었으면 이전 텍스트와 합치기
      const finalText = continuationCount > 0 ? stripHtmlFromChatText(totalText) + text : text;

      // 아티팩트 선언만 하고 툴을 호출하지 않은 경우 → 강제로 재요청
      const ARTIFACT_INTENT = /생성하겠습니다|만들겠습니다|작성하겠습니다|뽑겠습니다|정리하겠습니다/;
      const hasArtifactIntent = ARTIFACT_INTENT.test(text);
      const alreadyHasArtifact = allToolCalls.some(tc => tc.kind === 'artifact');
      const userWantsArtifact = /정리해줘|문서로|보고서|시트.*만들|뽑아줘|만들어줘/.test(
        messages.find(m => m.role === 'user')?.content as string ?? ''
      );

      // ★ 텍스트 마커로 HTML이 스트리밍됐지만 create_artifact를 호출하지 않고 end_turn된 경우 → 자동 아티팩트 생성
      if (streamedArtifactHtml && streamedArtifactHtml.length >= 10 && !alreadyHasArtifact) {
        // 누적 HTML이 있으면 합침
        const finalArtHtml = artifactAccumulatedHtml ? (artifactAccumulatedHtml + streamedArtifactHtml) : streamedArtifactHtml;
        console.log(`[Chat] ⚡ 자동 아티팩트 생성: HTML ${finalArtHtml.length}자 (create_artifact 미호출${artifactAccumulatedHtml ? `, 이어쓰기 ${artifactContinuationCount}회` : ''})`);
        const autoTitle = text.match(/^#+\s*(.+)/m)?.[1]
          ?? text.match(/^(.{1,50})/)?.[1]?.replace(/\s+/g, ' ').trim()
          ?? '문서';
        const autoTc: ArtifactResult = {
          kind: 'artifact',
          title: autoTitle,
          description: artifactAccumulatedHtml ? `(${artifactContinuationCount + 1}회 이어쓰기로 생성)` : '',
          html: finalArtHtml,
          duration: 0,
        };
        allToolCalls.push(autoTc);
        onToolCall?.(autoTc, allToolCalls.length - 1);
        artifactAccumulatedHtml = '';
        artifactContinuationCount = 0;
      }

      if (hasArtifactIntent && !alreadyHasArtifact && !streamedArtifactHtml && userWantsArtifact && allToolCalls.length > 0) {
        // Claude가 선언만 하고 멈춤 → 재촉 (빈 text block 제거)
        const cleanedForRetry = data.content
          .map(b => b.type === 'text' ? { ...b, text: (b as TextBlock).text.replace(/<<<ARTIFACT_START>>>[\s\S]*?<<<ARTIFACT_END>>>/g, '').trim() } : b)
          .filter(b => !(b.type === 'text' && !(b as TextBlock).text));
        messages.push({ role: 'assistant', content: cleanedForRetry.length > 0 ? cleanedForRetry : [{ type: 'text' as const, text: '(계속)' }] });
        messages.push({
          role: 'user',
          content: '지금 바로 <<<ARTIFACT_START>>>로 시작하여 HTML을 텍스트로 출력한 후, <<<ARTIFACT_END>>>로 마무리하고 create_artifact(title=...) 를 호출하세요.',
        });
        continue;
      }

      const tokenUsage: TokenUsageSummary = {
        iterations: tokenIterations,
        total_input: tokenIterations.reduce((s, t) => s + t.input_tokens, 0),
        total_output: tokenIterations.reduce((s, t) => s + t.output_tokens, 0),
        total_tokens: tokenIterations.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0),
        system_prompt_estimate: systemPromptEstimate,
      };
      useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));
      return { content: finalText, toolCalls: allToolCalls, tokenUsage };
    }

    // ── 도구 호출 처리 ──
    if (data.stop_reason === 'tool_use') {
      const toolBlocks = data.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
      // 텍스트 블록에서 마커 + HTML 제거 (히스토리에 저장 시 불필요) + 빈 text block 제거 (API 오류 방지)
      const cleanedContent = data.content
        .map(b => {
          if (b.type === 'text') {
            const cleaned = (b as TextBlock).text.replace(/<<<ARTIFACT_START>>>[\s\S]*?<<<ARTIFACT_END>>>/g, '').trim();
            return { ...b, text: cleaned };
          }
          return b;
        })
        .filter(b => !(b.type === 'text' && !(b as TextBlock).text));
      messages.push({ role: 'assistant', content: cleanedContent });

      const toolResults: { type: 'tool_result'; tool_use_id: string; content: string }[] = [];

      // 툴 병렬 처리
      const toolResultsMap = new Map<string, string>();
      const toolCallsMap = new Map<string, ToolCallResult>();

      const TOOL_LABELS: Record<string, string> = {
        query_game_data: '📊 SQL 쿼리 실행',
        show_table_schema: '📋 테이블 스키마 조회',
        search_git_history: '🔍 Git 히스토리 검색',
        get_revision_diff: '📝 리비전 비교',
        search_images: '🖼️ 이미지 검색',
        create_artifact: '📄 아티팩트 생성',
        patch_artifact: '✏️ 아티팩트 수정',
        search_jira_issues: '🎫 Jira 이슈 검색',
        get_jira_issue: '🎫 Jira 이슈 조회',
        search_confluence: '📚 Confluence 검색',
        get_confluence_page: '📚 Confluence 페이지 조회',
        search_code: '💻 코드 검색',
        read_code_file: '💻 코드 파일 읽기',
        get_code_guide: '💻 코드 가이드',
        search_assets: '🎨 에셋 검색',
        get_scene_yaml: '🎮 씬 데이터 조회',
        preview_prefab: '🧩 프리펩 미리보기',
        preview_fbx_animation: '🎬 애니메이션 미리보기',
        get_character_profile: '👤 캐릭터 프로필 조회',
        save_knowledge: '🧠 널리지 저장',
        read_knowledge: '🧠 널리지 읽기',
      };

      await Promise.all(toolBlocks.map(async (tb) => {
        const inp = tb.input as Record<string, unknown>;
        let resultStr = '';
        let tc: ToolCallResult;

        const toolLabel = TOOL_LABELS[tb.name] ?? `🔧 ${tb.name}`;
        // 도구별 상세 정보
        const toolDetail = tb.name === 'query_game_data' ? String(inp.sql ?? '').slice(0, 80)
          : tb.name === 'show_table_schema' ? String(inp.table_name ?? '')
          : tb.name === 'search_git_history' ? String(inp.keyword ?? '')
          : tb.name === 'create_artifact' ? String(inp.title ?? '')
          : tb.name === 'search_jira_issues' ? String(inp.jql ?? '')
          : tb.name === 'search_confluence' ? String(inp.query ?? '')
          : tb.name === 'search_code' ? String(inp.query ?? '')
          : tb.name === 'search_assets' ? String(inp.query ?? '')
          : tb.name === 'get_scene_yaml' ? String(inp.path ?? '')
          : tb.name === 'preview_prefab' ? String(inp.path ?? '')
          : tb.name === 'preview_fbx_animation' ? String(inp.model_path ?? '')
          : tb.name === 'get_character_profile' ? String(inp.character_id ?? '')
          : tb.name === 'save_knowledge' ? String(inp.name ?? '')
          : tb.name === 'read_knowledge' ? String(inp.name ?? '') || '(목록)'
          : undefined;
        onThinkingUpdate?.({ type: 'tool_start', iteration: i + 1, maxIterations: MAX_ITERATIONS, toolName: tb.name, toolLabel, detail: toolDetail, timestamp: Date.now() });

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
            // 행수 제한 (30행) + 셀 값 길이 제한 (200자) → 토큰 대폭 절약
            const MAX_ROWS = 30;
            const MAX_CELL_LEN = 200;
            const trimmedRows = qr.rows.slice(0, MAX_ROWS).map(row => {
              const trimmedRow: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(row)) {
                if (typeof v === 'string' && v.length > MAX_CELL_LEN) {
                  trimmedRow[k] = v.slice(0, MAX_CELL_LEN) + '...';
                } else {
                  trimmedRow[k] = v;
                }
              }
              return trimmedRow;
            });
            resultStr = JSON.stringify({
              rowCount: qr.rowCount,
              returned: Math.min(qr.rowCount, MAX_ROWS),
              columns: qr.columns,
              rows: trimmedRows,
              ...(qr.rowCount > MAX_ROWS ? { note: `전체 ${qr.rowCount}행 중 ${MAX_ROWS}행만 포함. 나머지는 data-embed 태그 사용 권장.` } : {}),
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
          const repo = inp.repo ? String(inp.repo) : 'data';
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();

          try {
            const commits = await fetchGitHistory(count, filterPath, repo);
            const duration = performance.now() - t0;
            tc = { kind: 'git_history', reason, commits, filterPath, repo, duration };
            resultStr = JSON.stringify({
              repo,
              count: commits.length,
              commits: commits.map((c) => ({
                short: c.short,
                date: c.date,
                author: c.author,
                message: c.message,
                files: c.files?.slice(0, 30), // 파일 목록 30개로 확장
              })),
            });
            // 데이터 수정점 분석을 위한 힌트
            if (commits.length > 0) {
              resultStr += '\n\n[힌트] 특정 커밋의 실제 변경 내용(+/- 라인)을 보려면 show_revision_diff(commit_hash)를 호출하세요.'
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            tc = { kind: 'git_history', reason, commits: [], filterPath, repo, error: msg, duration: performance.now() - t0 };
            resultStr = `Git 히스토리 조회 오류: ${msg}`;
          }
        }
        // ── show_revision_diff ──
        else if (tb.name === 'show_revision_diff') {
          const commitHash = String(inp.commit_hash || '');
          const filePath = inp.file_path ? String(inp.file_path) : undefined;
          const repo = inp.repo ? String(inp.repo) : 'data';
          const reason = inp.reason ? String(inp.reason) : undefined;
          const t0 = performance.now();

          if (!commitHash) {
            tc = { kind: 'revision_diff', reason, commit: undefined, files: [], totalFiles: 0, error: 'commit_hash가 필요합니다.' };
            resultStr = 'commit_hash 파라미터가 없습니다.';
          } else {
            try {
              const params = new URLSearchParams({ hash: commitHash });
              if (filePath) params.append('file', filePath);
              if (repo && repo !== 'data') params.append('repo', repo);
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
                repo,
                duration,
              } as RevisionDiffResult;
              // Claude에게 실제 변경 내용(hunks)을 포함해서 전달
              const diffFiles = (data.files || []) as DiffFile[];
              const MAX_DIFF_LINES = 300; // 파일당 최대 라인
              const MAX_FILES_WITH_CONTENT = 10;
              let totalLines = 0;
              const fileDetails = diffFiles.slice(0, 20).map((f: DiffFile, idx: number) => {
                const base: Record<string, unknown> = {
                  path: f.path,
                  status: f.status === 'A' ? '추가됨' : f.status === 'D' ? '삭제됨' : f.status === 'R' ? '이름변경' : '수정됨',
                  additions: f.additions,
                  deletions: f.deletions,
                };
                if (f.binary) {
                  base.note = '바이너리 파일 (내용 미표시)';
                } else if (idx < MAX_FILES_WITH_CONTENT && f.hunks && f.hunks.length > 0 && totalLines < 1000) {
                  // 실제 변경 라인 포함
                  const diffLines: string[] = [];
                  for (const hunk of f.hunks) {
                    diffLines.push(hunk.header);
                    for (const line of hunk.lines) {
                      if (line.type === 'add') diffLines.push(`+ ${line.content}`);
                      else if (line.type === 'del') diffLines.push(`- ${line.content}`);
                      else diffLines.push(`  ${line.content}`);
                      if (diffLines.length >= MAX_DIFF_LINES) break;
                    }
                    if (diffLines.length >= MAX_DIFF_LINES) {
                      diffLines.push('... (이하 생략)');
                      break;
                    }
                  }
                  totalLines += diffLines.length;
                  base.diff = diffLines.join('\n');
                }
                return base;
              });
              resultStr = JSON.stringify({
                commit: data.commit?.short,
                date: data.commit?.date,
                author: data.commit?.author,
                message: data.commit?.message,
                totalFiles: data.totalFiles,
                files: fileDetails,
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

        // ── read_guide (통합: DB + 코드) ──
        else if (tb.name === 'read_guide' || tb.name === 'read_code_guide') {
          const guideName = String(inp.name ?? '').trim();
          const t0 = performance.now();
          try {
            if (!guideName) {
              // 전체 목록 반환 (통합 /api/guides/list 우선, fallback /api/code/guides)
              const resp = await fetch('/api/guides/list');
              const data = await resp.json() as { guides: { name: string; sizeKB: number; category: string }[] };
              const duration = performance.now() - t0;
              const dbGuides   = data.guides.filter(g => g.category === 'db');
              const codeGuides = data.guides.filter(g => g.category === 'code');
              let list = '';
              if (dbGuides.length) {
                list += `### DB/게임 가이드 (${dbGuides.length}개)\n`;
                list += dbGuides.map(g => `- ${g.name}  (${g.sizeKB} KB)`).join('\n') + '\n\n';
              }
              if (codeGuides.length) {
                list += `### C# 코드 가이드 (${codeGuides.length}개)\n`;
                list += codeGuides.map(g => `- ${g.name}  (${g.sizeKB} KB)`).join('\n');
              }
              resultStr = `사용 가능한 가이드 (${data.guides.length}개):\n\n${list || '없음'}\n\n(${duration.toFixed(0)}ms)\n먼저 _DB_OVERVIEW 또는 _OVERVIEW를 읽으세요.`;
              tc = { kind: 'code_guide', label: '가이드 목록', text: resultStr };
            } else {
              // 통합 /api/guides/read 우선, fallback /api/code/guide
              let resp = await fetch(`/api/guides/read?name=${encodeURIComponent(guideName)}`);
              if (!resp.ok) resp = await fetch(`/api/code/guide?name=${encodeURIComponent(guideName)}`);
              const data = await resp.json() as { name?: string; content?: string; sizeKB?: number; truncated?: boolean; error?: string; available?: string[] };
              const duration = performance.now() - t0;
              if (!resp.ok || data.error) {
                const avail = data.available ? `\n사용 가능: ${data.available.join(', ')}` : '';
                resultStr = `가이드 '${guideName}' 없음.${avail}\n빈 name("")으로 전체 목록을 확인하세요.`;
              } else {
                const isDb = guideName.startsWith('_DB_');
                const kind = isDb ? 'DB 가이드' : '코드 가이드';
                const truncNote = data.truncated ? `\n\n[주의: 파일이 너무 커서 앞 200KB만 반환됨]` : '';
                resultStr = `# ${kind}: ${data.name}  (${data.sizeKB} KB, ${duration.toFixed(0)}ms)\n\n${data.content}${truncNote}`;
              }
              tc = { kind: 'code_guide', label: `가이드: ${guideName}`, text: resultStr };
            }
          } catch (e) {
            resultStr = `가이드 로드 실패: ${String(e)}`;
            tc = { kind: 'code_guide', label: '가이드 오류', text: resultStr, error: String(e) };
          }
        }

        // ── search_assets ──
        else if (tb.name === 'search_assets') {
          const query = String(inp.query ?? '');
          const ext = String(inp.ext ?? '');
          const t0 = performance.now();
          try {
            const params = new URLSearchParams({ q: query });
            if (ext) params.set('ext', ext);
            const resp = await fetch(`/api/assets/index?${params.toString()}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json() as { results: { path: string; name: string; ext: string; sizeKB: number }[]; total: number; message?: string; error?: string };
            const duration = performance.now() - t0;
            if (data.error || data.message) {
              const msg = data.error || data.message || '';
              resultStr = `에셋 인덱스 없음: ${msg}\nsync_assets.ps1 을 먼저 실행하세요.`;
              tc = { kind: 'asset_search', label: '에셋 검색 실패', query, ext, files: [], total: 0, error: msg } as AssetSearchResult;
            } else {
              const results = data.results ?? [];
              const lines = results.map(f => `${f.path}  (${f.sizeKB} KB)`);
              resultStr = `에셋 검색: "${query}"${ext ? ` [.${ext}]` : ''} → ${data.total ?? results.length}개 (${duration.toFixed(0)}ms)\n` +
                (lines.length > 0 ? lines.join('\n') : '결과 없음') +
                (data.total > results.length ? `\n… 상위 ${results.length}개만 표시` : '') +
                '\n\n3D 뷰어: FBX 파일은 /api/assets/file?path=<경로> 로 접근 가능';
              tc = { kind: 'asset_search', label: `에셋 검색: ${query}`, query, ext, files: results, total: data.total ?? results.length } as AssetSearchResult;
            }
          } catch (e) {
            resultStr = `에셋 검색 실패: ${String(e)}`;
            tc = { kind: 'asset_search', label: '에셋 검색 오류', query, ext, files: [], total: 0, error: String(e) } as AssetSearchResult;
          }
        }

        // ── read_scene_yaml ──
        else if (tb.name === 'read_scene_yaml') {
          const scenePath = String(inp.path ?? '');
          const filter = String(inp.filter ?? '');
          const search = String(inp.search ?? '');
          const offsetVal = typeof inp.offset === 'number' ? inp.offset : 0;
          const limitVal = Math.min(typeof inp.limit === 'number' ? inp.limit : 20, 100);

          if (!scenePath) {
            resultStr = 'path 파라미터가 필요합니다. search_assets(ext="unity")로 씬 파일 경로를 먼저 확인하세요.';
            tc = { kind: 'scene_yaml', label: '씬 YAML 조회 실패', scenePath: '', content: resultStr } as SceneYamlResult;
          } else {
            try {
              const params = new URLSearchParams({ path: scenePath, offset: String(offsetVal), limit: String(limitVal) });
              if (filter) params.set('filter', filter);
              if (search) params.set('search', search);
              const resp = await fetch(`/api/assets/scene-yaml?${params.toString()}`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.json().catch(() => ({}))).error || resp.statusText}`);

              const data = await resp.json() as {
                scenePath: string;
                fileSizeKB: number;
                totalSections: number;
                typeCounts: Record<string, number>;
                filter: string | null;
                search: string | null;
                totalFiltered: number;
                offset: number;
                returnedCount: number;
                sections: { classId: number; objectId: string; typeName: string; lineCount: number; truncated: boolean; text: string }[];
              };

              // 타입 카운트 요약
              const typeCountStr = Object.entries(data.typeCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => `  ${type}: ${count}개`)
                .join('\n');

              // 섹션 텍스트
              const sectionTexts = data.sections.map((s, i) => {
                const header = `── [${offsetVal + i}] ${s.typeName} (classId=${s.classId}, objectId=${s.objectId}, ${s.lineCount}줄${s.truncated ? ', 잘림' : ''}) ──`;
                return `${header}\n${s.text}`;
              }).join('\n\n');

              resultStr = `씬 YAML 분석: ${data.scenePath} (${data.fileSizeKB} KB)\n` +
                `총 섹션: ${data.totalSections}개\n` +
                `타입별 구성:\n${typeCountStr}\n\n` +
                (filter || search ? `필터: ${filter || '없음'}, 검색: ${search || '없음'} → ${data.totalFiltered}개 매칭\n` : '') +
                `반환: [${data.offset}~${data.offset + data.returnedCount - 1}] (${data.returnedCount}/${data.totalFiltered}개)\n\n` +
                sectionTexts;

              // resultStr이 너무 길면 잘라서 보내기 (Claude 토큰 제한 보호)
              if (resultStr.length > 60000) {
                resultStr = resultStr.substring(0, 60000) + '\n\n... (결과가 너무 길어 잘림. offset/limit를 조정하세요)';
              }

              tc = {
                kind: 'scene_yaml',
                label: `씬 YAML: ${scenePath.split('/').pop()} ${filter ? `[${filter}]` : ''} ${search ? `"${search}"` : ''}`,
                scenePath,
                fileSizeKB: data.fileSizeKB,
                totalSections: data.totalSections,
                typeCounts: data.typeCounts,
                totalFiltered: data.totalFiltered,
                returnedCount: data.returnedCount,
                content: `${data.totalSections}개 섹션, ${data.totalFiltered}개 매칭, ${data.returnedCount}개 반환`,
              } as SceneYamlResult;
            } catch (e) {
              resultStr = `씬 YAML 조회 실패: ${String(e)}`;
              tc = { kind: 'scene_yaml', label: '씬 YAML 조회 오류', scenePath, content: String(e), error: String(e) } as SceneYamlResult;
            }
          }
        }

        // ── preview_prefab ──
        else if (tb.name === 'preview_prefab') {
          const prefabPath = String(inp.path ?? '');
          const label = String(inp.label ?? prefabPath.split('/').pop()?.replace(/\.prefab$/i, '') ?? 'Prefab');

          if (!prefabPath) {
            resultStr = 'path 파라미터가 필요합니다. search_assets(ext="prefab")로 프리팹 경로를 먼저 확인하세요.';
            tc = { kind: 'prefab_preview', label: '프리팹 미리보기 실패', prefabPath: '', error: resultStr } as PrefabPreviewResult;
          } else {
            try {
              const resp = await fetch(`/api/assets/prefab?path=${encodeURIComponent(prefabPath)}&max=200`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.json().catch(() => ({}))).error || resp.statusText}`);

              const data = await resp.json() as {
                scenePath: string;
                totalPrefabs: number;
                totalDirect: number;
                resolvedCount: number;
                resolvedFbx?: number;
                resolvedProBuilder?: number;
                resolvedBox?: number;
                objects: unknown[];
                hierarchy?: unknown[];
              };

              const totalObjects = data.objects?.length ?? 0;
              resultStr = `프리팹 3D 미리보기: ${label}\n` +
                `경로: ${prefabPath}\n` +
                `오브젝트: ${totalObjects}개 (FBX: ${data.resolvedFbx ?? 0}, ProBuilder: ${data.resolvedProBuilder ?? 0}, Box: ${data.resolvedBox ?? 0})\n` +
                `프리팹 인스턴스: ${data.totalPrefabs}개, 직접 배치: ${data.totalDirect}개\n` +
                `3D 뷰어가 ChatUI에 표시됩니다.\n\n` +
                `아티팩트 임베드: <div data-embed="prefab" data-src="${prefabPath}" data-label="${label}"></div>`;

              tc = {
                kind: 'prefab_preview',
                label,
                prefabPath,
                totalObjects,
                resolvedFbx: data.resolvedFbx,
                resolvedProBuilder: data.resolvedProBuilder,
                resolvedBox: data.resolvedBox,
                hierarchy: data.hierarchy as PrefabHNode[] | undefined,
                objects: data.objects as PrefabSceneObject[] | undefined,
              } as PrefabPreviewResult;
            } catch (e) {
              resultStr = `프리팹 미리보기 실패: ${String(e)}`;
              tc = { kind: 'prefab_preview', label, prefabPath, error: String(e) } as PrefabPreviewResult;
            }
          }
        }

        // ── preview_fbx_animation ──
        else if (tb.name === 'preview_fbx_animation') {
          const modelPathVal = String(inp.model_path ?? '');
          const label = String(inp.label ?? modelPathVal.split('/').pop()?.replace(/\.fbx$/i, '') ?? 'FBX Animation');
          const animPaths = Array.isArray(inp.animation_paths) ? (inp.animation_paths as string[]) : [];
          const catFilter = Array.isArray(inp.categories) ? (inp.categories as string[]).map(c => c.toLowerCase()) : [];

          if (!modelPathVal) {
            resultStr = 'model_path 파라미터가 필요합니다. search_assets(ext="fbx")로 모델 경로를 먼저 확인하세요.';
            tc = { kind: 'fbx_animation', label, modelPath: '', modelUrl: '', animations: [], totalAnimations: 0, categories: [], error: resultStr } as FbxAnimationResult;
          } else {
            try {
              // 모델 URL 생성
              const modelUrl = `/api/assets/file?path=${encodeURIComponent(modelPathVal)}`;

              // 애니메이션 목록: 직접 지정했으면 사용, 아니면 API로 자동 검색
              let animList: { name: string; url: string; category?: string }[] = [];
              let categories: string[] = [];

              if (animPaths.length > 0) {
                animList = animPaths.map(p => ({
                  name: p.split('/').pop()?.replace(/\.fbx$/i, '') ?? p,
                  url: `/api/assets/file?path=${encodeURIComponent(p)}`,
                  category: 'other',
                }));
              } else {
                // 자동 검색
                const resp = await fetch(`/api/assets/animations?model=${encodeURIComponent(modelPathVal)}`);
                if (resp.ok) {
                  const data = await resp.json() as { animations: { name: string; url: string; category?: string }[]; total: number; categories: string[] };
                  animList = data.animations ?? [];
                  categories = data.categories ?? [];
                }
              }

              // 카테고리 필터 적용 (사용자가 필요한 것만 바인딩)
              if (catFilter.length > 0) {
                animList = animList.filter(a => catFilter.includes((a.category ?? 'other').toLowerCase()));
              }

              categories = categories.length > 0 ? categories : [...new Set(animList.map(a => a.category ?? 'other'))];

              resultStr = `FBX 애니메이션 뷰어: ${label}\n` +
                `모델: ${modelPathVal}\n` +
                `애니메이션: ${animList.length}개 발견 (${categories.join(', ')})\n` +
                `3D 뷰어 + 애니메이션 플레이어가 ChatUI에 표시됩니다.\n\n` +
                `아티팩트 임베드: <div data-embed="fbx-anim" data-model="${modelPathVal}" data-label="${label}"></div>`;

              tc = {
                kind: 'fbx_animation',
                label,
                modelPath: modelPathVal,
                modelUrl,
                animations: animList,
                totalAnimations: animList.length,
                categories,
              } as FbxAnimationResult;
            } catch (e) {
              resultStr = `애니메이션 미리보기 실패: ${String(e)}`;
              tc = { kind: 'fbx_animation', label, modelPath: modelPathVal, modelUrl: '', animations: [], totalAnimations: 0, categories: [], error: String(e) } as FbxAnimationResult;
            }
          }
        }

        // ── search_code ──
        else if (tb.name === 'search_code') {
          const query = String(inp.query ?? '');
          const searchType = String(inp.type ?? '');
          const scope = inp.scope ? String(inp.scope) : '';
          const isContentSearch = searchType === 'content';
          const t0 = performance.now();
          try {
            const params = new URLSearchParams({ q: query, limit: '30' });
            if (searchType) params.set('type', searchType);

            const endpoint = isContentSearch
              ? `/api/code/search?q=${encodeURIComponent(query)}&limit=20${scope ? `&scope=${encodeURIComponent(scope)}` : ''}`
              : `/api/code/list?${params.toString()}${scope ? `&scope=${encodeURIComponent(scope)}` : ''}`;

            const resp = await fetch(endpoint);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const rawData = await resp.json() as Record<string, unknown>;

            const duration = performance.now() - t0;

            if (isContentSearch) {
              type ContentHit = { path: string; matches: { line: number; lineContent: string }[] };
              const totalFiles = typeof rawData.totalFiles === 'number' ? rawData.totalFiles : 0;
              const contentHits = (Array.isArray(rawData.results) ? rawData.results : []) as ContentHit[];
              tc = {
                kind: 'code_search',
                query,
                searchType: 'content',
                contentHits,
                results: [],
                duration,
              } as CodeSearchResult;
              resultStr = totalFiles > 0
                ? `"${query}" 발견: ${totalFiles}개 파일\n` + contentHits.slice(0, 5).map(r =>
                    `  📄 ${r.path}\n` + r.matches.slice(0, 3).map(m => `    L${m.line}: ${m.lineContent}`).join('\n')
                  ).join('\n')
                : `"${query}" 코드에서 찾을 수 없음`;
            } else {
              const total = typeof rawData.total === 'number' ? rawData.total : 0;
              const isFallback = rawData.fallbackToContent === true;
              const indexResults = (Array.isArray(rawData.results) ? rawData.results : []) as CodeFileEntry[];

              // 자동 폴백: 인덱스 0건 → content 검색으로 대체됨
              if (isFallback) {
                type ContentHit = { path: string; matches: { line: number; lineContent: string }[] };
                const contentHits = (Array.isArray(rawData.contentHits) ? rawData.contentHits : []) as ContentHit[];
                tc = {
                  kind: 'code_search',
                  query,
                  searchType: 'content',
                  contentHits,
                  results: [],
                  duration,
                } as CodeSearchResult;
                resultStr = contentHits.length > 0
                  ? `"${query}" 인덱스에 없어 전문검색으로 폴백 → ${contentHits.length}개 파일\n` + contentHits.slice(0, 5).map(r =>
                      `  📄 ${r.path}\n` + r.matches.slice(0, 3).map(m => `    L${m.line}: ${m.lineContent}`).join('\n')
                    ).join('\n')
                  : `"${query}" 인덱스·전문검색 모두 결과 없음 (전체 ${total}개 파일). 다른 키워드로 시도하거나 type="content"로 검색하세요.`;
              } else {
                tc = {
                  kind: 'code_search',
                  query,
                  searchType: 'index',
                  total,
                  results: indexResults,
                  duration,
                } as CodeSearchResult;
                resultStr = indexResults.length > 0
                  ? `"${query}" 검색 결과 ${indexResults.length}개:\n` + indexResults.slice(0, 10).map(r =>
                      `  📄 ${r.path}\n     클래스: ${r.classes.join(', ') || '없음'} | 네임스페이스: ${r.namespaces.join(', ') || '없음'}`
                    ).join('\n')
                  : `"${query}" 코드 파일에서 찾을 수 없음 (전체 인덱스 ${total}개 파일)`;
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const noSync = msg.includes('not found') || msg.includes('404');
            tc = {
              kind: 'code_search',
              query,
              searchType: isContentSearch ? 'content' : 'index',
              results: [],
              error: noSync ? 'C# 코드가 아직 동기화되지 않았습니다. sync_cs_files.ps1을 실행하세요.' : msg,
              duration: performance.now() - t0,
            } as CodeSearchResult;
            resultStr = `코드 검색 오류: ${(tc as CodeSearchResult).error}`;
          }
        }

        // ── read_code_file ──
        else if (tb.name === 'read_code_file') {
          const filePath = String(inp.path ?? '');
          const t0 = performance.now();
          if (!filePath) {
            tc = { kind: 'code_file', path: '', content: '', size: 0, truncated: false, error: 'path가 필요합니다.' } as CodeFileResult;
            resultStr = '오류: path 파라미터 없음';
          } else {
            try {
              const resp = await fetch(`/api/code/file?path=${encodeURIComponent(filePath)}`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const raw = await resp.text();
              const fileData = JSON.parse(raw) as { path: string; size: number; truncated: boolean; content: string };
              const duration = performance.now() - t0;

              // 인덱스에서 메타 정보 가져오기
              const indexEntry = await fetch(`/api/code/list?q=${encodeURIComponent(filePath.split('/').pop() ?? '')}&type=file&limit=5`)
                .then(r => r.ok ? r.json() : { results: [] })
                .then((d: { results?: CodeFileEntry[] }) => (d.results ?? []).find((e: CodeFileEntry) => e.path === filePath) ?? null)
                .catch(() => null) as CodeFileEntry | null;

              tc = {
                kind: 'code_file',
                path: fileData.path,
                content: fileData.content,
                size: fileData.size,
                truncated: fileData.truncated,
                namespaces: indexEntry?.namespaces,
                classes: indexEntry?.classes,
                methods: indexEntry?.methods,
                duration,
              } as CodeFileResult;
              resultStr = `파일: ${fileData.path} (${(fileData.size / 1024).toFixed(1)}KB${fileData.truncated ? ', 잘림' : ''})\n\n${fileData.content}`;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              tc = { kind: 'code_file', path: filePath, content: '', size: 0, truncated: false, error: msg, duration: performance.now() - t0 } as CodeFileResult;
              resultStr = `파일 읽기 오류: ${msg}`;
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
            resultStr = `✅ 패치 ${patches.length}개 적용 완료. 아티팩트가 사이드 패널에 업데이트되었습니다. 대화를 이어가세요.`;
          }
        }

        // ── create_artifact ──
        else if (tb.name === 'create_artifact') {
          const title = String(inp.title ?? '문서');
          const description = String(inp.description ?? '');
          // 우선순위: 누적 HTML + 텍스트 마커 캡처 HTML > tool 파라미터 html 폴백
          const currentHtml = streamedArtifactHtml || String(inp.html ?? '');
          const html = artifactAccumulatedHtml ? (artifactAccumulatedHtml + currentHtml) : currentHtml;
          const t0 = performance.now();
          const duration = performance.now() - t0;

          if (allToolCalls.some(tc => tc.kind === 'artifact')) {
            // ── 중복 호출 방지: 이미 아티팩트가 있으면 무시 ──
            tc = { kind: 'artifact', title, description, html, duration } as ArtifactResult;
            resultStr = `⚠️ 이미 아티팩트가 성공적으로 생성되었습니다. 재생성 불필요합니다. 대화를 이어가세요.`;
            console.log(`[Chat] create_artifact 중복 호출 차단: "${title}"`);
          } else {
            // ── 항상 성공 반환 (빈 HTML이어도) — 재시도 방지 ──
            tc = { kind: 'artifact', title, description, html, duration } as ArtifactResult;
            resultStr = `✅ 아티팩트 "${title}" 생성 완료. 사이드 패널에 정상 표시됩니다. 대화를 이어가세요.`;
            console.log(`[Chat] create_artifact: title="${title}" html=${html.length}자 (${artifactAccumulatedHtml ? '이어쓰기+' : ''}${streamedArtifactHtml ? '텍스트 마커' : 'tool 파라미터/없음'})`);
            // 이어쓰기 모드 종료
            if (artifactAccumulatedHtml) {
              console.log(`[Chat] 아티팩트 이어쓰기 완료: ${artifactContinuationCount}회, 최종 ${html.length}자`);
              artifactAccumulatedHtml = '';
              artifactContinuationCount = 0;
            }
          }
        }

        // ── search_jira ──
        else if (tb.name === 'search_jira') {
          const jql = String(inp.jql ?? '');
          const maxResults = Math.min(Number(inp.maxResults ?? 20), 50);
          const t0 = performance.now();
          try {
            const params = new URLSearchParams({ jql, maxResults: String(maxResults) });
            const resp = await fetch(`/api/jira/search?${params.toString()}`);
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Jira 검색 실패 (${resp.status}): ${String((data2 as Record<string,unknown>).error ?? data2)}`;
              tc = { kind: 'jira_search', jql, issues: [], total: 0, error: resultStr, duration } as JiraSearchResult;
            } else {
              type JiraIssue = { id: string; key: string; fields: Record<string, unknown> };
              const issues = (Array.isArray((data2 as Record<string,unknown>).issues) ? (data2 as Record<string,unknown>).issues : []) as JiraIssue[];
              const total = Number((data2 as Record<string,unknown>).total ?? issues.length);
              // Jira browse URL 생성: self 필드에서 base URL 추출
              const jiraBase0 = String((issues[0] as Record<string,unknown>)?.self ?? '').split('/rest/')[0];
              const summaryLines = issues.map((iss) => {
                const f = iss.fields;
                const status = (f.status as Record<string,unknown>)?.name ?? '?';
                const assignee = ((f.assignee as Record<string,unknown>)?.displayName ?? '미배정') as string;
                const priority = (f.priority as Record<string,unknown>)?.name ?? '-';
                const summary = String(f.summary ?? '');
                const issUrl = jiraBase0 ? `${jiraBase0}/browse/${iss.key}` : '';
                return `[${iss.key}](${issUrl}) [${status}] [${priority}] ${summary} (담당: ${assignee})`;
              });
              resultStr = `Jira 검색: "${jql}" → ${total}건 (${duration.toFixed(0)}ms)\n` +
                (summaryLines.length > 0 ? summaryLines.join('\n') : '결과 없음');
              tc = { kind: 'jira_search', jql, issues: issues.map(i => {
                const base = jiraBase0 || String((i as Record<string,unknown>).self ?? '').split('/rest/')[0];
                return {
                  key: i.key, id: i.id,
                  summary: String(i.fields.summary ?? ''),
                  status: String((i.fields.status as Record<string,unknown>)?.name ?? ''),
                  assignee: String((i.fields.assignee as Record<string,unknown>)?.displayName ?? '미배정'),
                  priority: String((i.fields.priority as Record<string,unknown>)?.name ?? ''),
                  issuetype: String((i.fields.issuetype as Record<string,unknown>)?.name ?? ''),
                  updated: String(i.fields.updated ?? ''),
                  url: base ? `${base}/browse/${i.key}` : '',
                };
              }), total, duration } as JiraSearchResult;
            }
          } catch (e) {
            resultStr = `Jira 검색 오류: ${String(e)}`;
            tc = { kind: 'jira_search', jql, issues: [], total: 0, error: String(e), duration: 0 } as JiraSearchResult;
          }
        }

        // ── get_jira_issue ──
        else if (tb.name === 'get_jira_issue') {
          const issueKey = String(inp.issueKey ?? '');
          const t0 = performance.now();
          try {
            const resp = await fetch(`/api/jira/issue/${encodeURIComponent(issueKey)}`);
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Jira 이슈 조회 실패 (${resp.status}): ${String((data2 as Record<string,unknown>).error ?? data2)}`;
              tc = { kind: 'jira_issue', issueKey, error: resultStr, duration } as JiraIssueResult;
            } else {
              const f = (data2.fields ?? {}) as Record<string, unknown>;
              const comments = ((f.comment as Record<string,unknown>)?.comments ?? []) as Array<Record<string,unknown>>;
              // ADF → 플레인텍스트 파싱
              const descText = parseAdfField(f.description);
              const commentLines = comments.slice(-5).map((c) => {
                const author = String((c.author as Record<string,unknown>)?.displayName ?? 'unknown');
                const body = parseAdfField(c.body).slice(0, 200);
                return `  [${author}]: ${body}`;
              });
              // Jira browse URL 생성
              const selfUrl = String(data2.self ?? '');
              const jiraBase1 = selfUrl.split('/rest/')[0];
              const issueUrl = jiraBase1 ? `${jiraBase1}/browse/${issueKey}` : '';
              resultStr = [
                `이슈: [${issueKey}](${issueUrl}) - ${String(f.summary ?? '')}`,
                `URL: ${issueUrl}`,
                `상태: ${String((f.status as Record<string,unknown>)?.name ?? '')}`,
                `유형: ${String((f.issuetype as Record<string,unknown>)?.name ?? '')}`,
                `우선순위: ${String((f.priority as Record<string,unknown>)?.name ?? '')}`,
                `담당자: ${String((f.assignee as Record<string,unknown>)?.displayName ?? '미배정')}`,
                `보고자: ${String((f.reporter as Record<string,unknown>)?.displayName ?? '')}`,
                `생성: ${String(f.created ?? '')}  수정: ${String(f.updated ?? '')}`,
                `컴포넌트: ${((f.components as Array<Record<string,unknown>>) ?? []).map(c => c.name).join(', ') || '-'}`,
                `레이블: ${((f.labels as string[]) ?? []).join(', ') || '-'}`,
                descText ? `설명:\n${descText.slice(0, 500)}` : '',
                comments.length > 0 ? `\n최근 댓글 (${comments.length}개 중 최대 5개):\n${commentLines.join('\n')}` : '',
              ].filter(Boolean).join('\n');
              tc = { kind: 'jira_issue', issueKey,
                url: jiraBase1 ? `${jiraBase1}/browse/${issueKey}` : '',
                summary: String(f.summary ?? ''),
                status: String((f.status as Record<string,unknown>)?.name ?? ''),
                issuetype: String((f.issuetype as Record<string,unknown>)?.name ?? ''),
                priority: String((f.priority as Record<string,unknown>)?.name ?? ''),
                assignee: String((f.assignee as Record<string,unknown>)?.displayName ?? '미배정'),
                reporter: String((f.reporter as Record<string,unknown>)?.displayName ?? ''),
                created: String(f.created ?? ''),
                updated: String(f.updated ?? ''),
                description: descText.slice(0, 1000),
                comments: comments.slice(-5).map(c => ({
                  author: String((c.author as Record<string,unknown>)?.displayName ?? ''),
                  body: parseAdfField(c.body).slice(0, 300),
                  created: String(c.created ?? ''),
                })),
                duration,
              } as JiraIssueResult;
            }
          } catch (e) {
            resultStr = `Jira 이슈 조회 오류: ${String(e)}`;
            tc = { kind: 'jira_issue', issueKey, error: String(e), duration: 0 } as JiraIssueResult;
          }
        }

        // ── create_jira_issue ──
        else if (tb.name === 'create_jira_issue') {
          const t0 = performance.now();
          try {
            const resp = await fetch('/api/jira/issue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summary: String(inp.summary ?? ''),
                description: String(inp.description ?? ''),
                issueType: String(inp.issueType ?? 'Task'),
                priority: String(inp.priority ?? ''),
                assignee: String(inp.assignee ?? ''),
                labels: Array.isArray(inp.labels) ? inp.labels : [],
                epicKey: String(inp.epicKey ?? ''),
                projectKey: String(inp.projectKey ?? ''),
              }),
            });
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Jira 이슈 생성 실패 (${resp.status}): ${String(data2.error ?? data2)}`;
              tc = { kind: 'jira_create', error: resultStr, duration } as unknown as ToolCallResult;
            } else {
              const issueKey = String(data2.issueKey ?? '');
              const issueUrl = String(data2.issueUrl ?? '');
              resultStr = `✅ Jira 이슈 생성 완료!\n이슈 키: ${issueKey}\n제목: ${String(inp.summary ?? '')}\n링크: ${issueUrl}`;
              tc = {
                kind: 'jira_create',
                issueKey, issueUrl,
                summary: String(inp.summary ?? ''),
                issueType: String(inp.issueType ?? 'Task'),
                priority: String(inp.priority ?? ''),
                duration,
              } as unknown as ToolCallResult;
            }
          } catch (e) {
            resultStr = `Jira 이슈 생성 오류: ${String(e)}`;
            tc = { kind: 'jira_create', error: String(e), duration: 0 } as unknown as ToolCallResult;
          }
        }

        // ── add_jira_comment ──
        else if (tb.name === 'add_jira_comment') {
          const rawKey = String(inp.issueKey ?? inp.issueKeyOrUrl ?? '').trim();
          const comment = String(inp.comment ?? inp.commentBody ?? '').trim();
          // URL에서 이슈 키 추출
          const issueKey = rawKey.match(/[A-Z]+-\d+/)?.[0] ?? rawKey;
          const t0 = performance.now();
          try {
            const resp = await fetch('/api/jira/comment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ issueKey, comment }),
            });
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Jira 댓글 작성 실패 (${resp.status}): ${String(data2.error ?? data2)}`;
              tc = { kind: 'jira_comment', issueKey, error: resultStr, duration } as unknown as ToolCallResult;
            } else {
              const commentId = String(data2.commentId ?? '');
              const issueUrl = String(data2.issueUrl ?? '');
              resultStr = `✅ 댓글 작성 완료!\n이슈: ${issueKey}${issueUrl ? ` (${issueUrl})` : ''}\n댓글 ID: ${commentId}\n작성 내용:\n${comment}`;
              tc = { kind: 'jira_comment', issueKey, commentId, issueUrl, comment, duration } as unknown as ToolCallResult;
            }
          } catch (e) {
            resultStr = `Jira 댓글 작성 오류: ${String(e)}`;
            tc = { kind: 'jira_comment', issueKey, error: String(e), duration: 0 } as unknown as ToolCallResult;
          }
        }

        // ── update_jira_issue_status ──
        else if (tb.name === 'update_jira_issue_status') {
          const rawKey = String(inp.issueKey ?? inp.issueKeyOrUrl ?? '').trim();
          const targetStatus = String(inp.targetStatus ?? inp.statusName ?? '').trim();
          const listOnly = Boolean(inp.listTransitions ?? false);
          const issueKey = rawKey.match(/[A-Z]+-\d+/)?.[0] ?? rawKey;
          const t0 = performance.now();
          try {
            // 가능한 트랜지션 목록 조회
            const transResp = await fetch(`/api/jira/transitions/${encodeURIComponent(issueKey)}`);
            const transData = await transResp.json() as Record<string, unknown>;
            type Trans = { id: string; name: string };
            const transitions = (Array.isArray(transData.transitions) ? transData.transitions : []) as Trans[];

            if (listOnly || !targetStatus) {
              const list = transitions.map((t: Trans) => `  [${t.id}] ${t.name}`).join('\n');
              resultStr = `${issueKey} 가능한 상태 전환:\n${list}`;
              tc = { kind: 'jira_status', issueKey, transitions, duration: performance.now() - t0 } as unknown as ToolCallResult;
            } else {
              const target = transitions.find((t: Trans) => t.name.toLowerCase() === targetStatus.toLowerCase())
                ?? transitions.find((t: Trans) => t.name.toLowerCase().includes(targetStatus.toLowerCase()));
              if (!target) {
                const names = transitions.map((t: Trans) => t.name).join(', ');
                resultStr = `상태 "${targetStatus}"를 찾을 수 없습니다. 가능한 상태: ${names}`;
                tc = { kind: 'jira_status', issueKey, error: resultStr, duration: performance.now() - t0 } as unknown as ToolCallResult;
              } else {
                const doResp = await fetch(`/api/jira/transitions/${encodeURIComponent(issueKey)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transitionId: target.id }),
                });
                const duration = performance.now() - t0;
                if (!doResp.ok) {
                  const errData = await doResp.json().catch(() => ({})) as Record<string, unknown>;
                  resultStr = `상태 변경 실패 (${doResp.status}): ${JSON.stringify(errData).slice(0, 200)}`;
                  tc = { kind: 'jira_status', issueKey, error: resultStr, duration } as unknown as ToolCallResult;
                } else {
                  resultStr = `✅ ${issueKey} 상태를 "${target.name}"으로 변경했습니다.`;
                  tc = { kind: 'jira_status', issueKey, newStatus: target.name, duration } as unknown as ToolCallResult;
                }
              }
            }
          } catch (e) {
            resultStr = `Jira 상태 변경 오류: ${String(e)}`;
            tc = { kind: 'jira_status', issueKey, error: String(e), duration: 0 } as unknown as ToolCallResult;
          }
        }

        // ── search_confluence ──
        else if (tb.name === 'search_confluence') {
          const cql = String(inp.cql ?? '');
          const limit = Math.min(Number(inp.limit ?? 10), 20);
          const t0 = performance.now();
          try {
            const params = new URLSearchParams({ cql, limit: String(limit) });
            const resp = await fetch(`/api/confluence/search?${params.toString()}`);
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Confluence 검색 실패 (${resp.status}): ${String((data2 as Record<string,unknown>).error ?? data2)}`;
              tc = { kind: 'confluence_search', cql, pages: [], total: 0, error: resultStr, duration } as ConfluenceSearchResult;
            } else {
              // Confluence Search API 응답: 실제 id/type/_links는 result.content 안에 있음
              type ConfluenceSearchHit = {
                content?: { id?: string; type?: string; _links?: Record<string,unknown>; space?: Record<string,unknown> };
                title?: string;
                url?: string;
                resultGlobalContainer?: { title?: string; displayUrl?: string };
              };
              const baseUrl = String((data2 as Record<string,unknown>)._baseUrl ?? '');
              const results = (Array.isArray((data2 as Record<string,unknown>).results) ? (data2 as Record<string,unknown>).results : []) as ConfluenceSearchHit[];
              const total = Number((data2 as Record<string,unknown>).totalSize ?? results.length);
              const summaryLines = results.map((p) => {
                const pageId = p.content?.id ?? '';
                const spaceKey = (p.content?.space as Record<string,unknown>)?.key ?? p.resultGlobalContainer?.title ?? '-';
                const relUrl = String(p.content?._links?.webui ?? p.url ?? '');
                const fullUrl = relUrl.startsWith('http') ? relUrl : (baseUrl ? `${baseUrl}/wiki${relUrl}` : '');
                return fullUrl
                  ? `[${p.title ?? '(제목 없음)'}](${fullUrl}) (Space: ${spaceKey}, ID: ${pageId})`
                  : `[${pageId}] ${p.title ?? '(제목 없음)'} (Space: ${spaceKey})`;
              });
              resultStr = `Confluence 검색: "${cql}" → ${total}건 (${duration.toFixed(0)}ms)\n` +
                (summaryLines.length > 0 ? summaryLines.join('\n') : '결과 없음') +
                '\n\n페이지 내용이 필요하면 get_confluence_page(pageId) 호출';
              tc = { kind: 'confluence_search', cql, pages: results.map(p => {
                const relUrl = String(p.content?._links?.webui ?? p.url ?? '');
                const fullUrl = relUrl.startsWith('http') ? relUrl : (baseUrl ? `${baseUrl}/wiki${relUrl}` : relUrl);
                return {
                  id: p.content?.id ?? '',
                  title: p.title ?? '',
                  type: p.content?.type ?? 'page',
                  space: String((p.content?.space as Record<string,unknown>)?.key ?? p.resultGlobalContainer?.title ?? ''),
                  url: fullUrl,
                };
              }), total, duration } as ConfluenceSearchResult;
            }
          } catch (e) {
            resultStr = `Confluence 검색 오류: ${String(e)}`;
            tc = { kind: 'confluence_search', cql, pages: [], total: 0, error: String(e), duration: 0 } as ConfluenceSearchResult;
          }
        }

        // ── get_confluence_page ──
        else if (tb.name === 'get_confluence_page') {
          const pageId = String(inp.pageId ?? '');
          const t0 = performance.now();
          try {
            const resp = await fetch(`/api/confluence/page/${encodeURIComponent(pageId)}`);
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Confluence 페이지 조회 실패 (${resp.status}): ${String((data2 as Record<string,unknown>).error ?? data2)}`;
              tc = { kind: 'confluence_page', pageId, error: resultStr, duration } as ConfluencePageResult;
            } else {
              const body = (data2.body as Record<string,unknown>)?.storage as Record<string,unknown>
              const rawHtml = String(body?.value ?? '');
              const htmlContent = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
              const space = (data2.space as Record<string,unknown>)?.key ?? ''
              // Confluence 페이지 URL 생성: _links.base + _links.webui
              const confLinks = (data2._links ?? {}) as Record<string,unknown>;
              const confBase = String(confLinks.base ?? (data2 as Record<string,unknown>)._confluenceBaseUrl ?? '');
              const confWebui = String(confLinks.webui ?? '');
              const confPageUrl = confBase && confWebui ? `${confBase}${confWebui}` : '';

              // ── 미디어 추출 ──
              const media: ConfluenceMedia[] = [];
              const wikiBase = String((data2 as Record<string,unknown>)._confluenceBaseUrl ?? confBase);

              // Confluence 호스팅 URL을 프록시 URL로 변환하는 헬퍼
              const toProxyUrl = (url: string): string => {
                // 이미 프록시 경로이면 그대로
                if (url.startsWith('/api/confluence/attachment')) return url;
                // 외부 URL (Confluence가 아닌)은 그대로
                if (url.startsWith('http') && !url.includes('atlassian.net') && !url.includes(wikiBase.replace(/^https?:\/\//, ''))) return url;
                // Confluence 호스팅 URL → 프록시
                const absUrl = url.startsWith('http') ? url : `${wikiBase}${url.startsWith('/') ? '' : '/'}${url}`;
                return `/api/confluence/attachment?url=${encodeURIComponent(absUrl)}`;
              };

              // 1) Confluence 첨부 이미지: <ac:image><ri:attachment ri:filename="..." /></ac:image>
              const attachImgRe = /<ac:image[^>]*>[\s\S]*?<ri:attachment\s+ri:filename="([^"]+)"[^/]*\/>[\s\S]*?<\/ac:image>/gi;
              let m: RegExpExecArray | null;
              while ((m = attachImgRe.exec(rawHtml)) !== null) {
                const fname = m[1];
                const rawUrl = `${wikiBase}/wiki/download/attachments/${pageId}/${encodeURIComponent(fname)}`;
                media.push({
                  type: 'image', title: fname,
                  url: toProxyUrl(rawUrl),
                });
              }

              // 2) 외부 URL 이미지: <ac:image><ri:url ri:value="..." /></ac:image>
              const extImgRe = /<ac:image[^>]*>[\s\S]*?<ri:url\s+ri:value="([^"]+)"[^/]*\/>[\s\S]*?<\/ac:image>/gi;
              while ((m = extImgRe.exec(rawHtml)) !== null) {
                media.push({ type: 'image', title: m[1].split('/').pop() || 'image', url: toProxyUrl(m[1]) });
              }

              // 3) 일반 <img src="..."> 태그
              const imgTagRe = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
              while ((m = imgTagRe.exec(rawHtml)) !== null) {
                const src = m[1];
                const fullSrc = src.startsWith('http') ? src : (wikiBase ? `${wikiBase}${src}` : src);
                media.push({ type: 'image', title: src.split('/').pop() || 'image', url: toProxyUrl(fullSrc) });
              }

              // 4) 영상 매크로: <ac:structured-macro ac:name="widget"> 또는 multimedia
              const videoMacroRe = /<ac:structured-macro[^>]*ac:name="(widget|multimedia)"[^>]*>[\s\S]*?<ac:parameter\s+ac:name="url">([^<]+)<\/ac:parameter>[\s\S]*?<\/ac:structured-macro>/gi;
              while ((m = videoMacroRe.exec(rawHtml)) !== null) {
                media.push({ type: 'video', title: m[2].split('/').pop() || 'video', url: toProxyUrl(m[2]) });
              }

              // 5) 첨부파일 목록 (API children.attachment)
              const attachChildren = (data2.children as Record<string,unknown>)?.attachment as Record<string,unknown>;
              const attachResults = (attachChildren?.results ?? []) as Array<Record<string,unknown>>;
              for (const att of attachResults) {
                const attTitle = String(att.title ?? '');
                const attLinks = (att._links ?? {}) as Record<string,unknown>;
                const downloadPath = String(attLinks.download ?? '');
                const rawAttUrl = downloadPath.startsWith('http') ? downloadPath : (wikiBase ? `${wikiBase}/wiki${downloadPath}` : downloadPath);
                const ext = attTitle.split('.').pop()?.toLowerCase() ?? '';
                const isImg = ['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext);
                const isVideo = ['mp4','webm','avi','mov','mkv'].includes(ext);
                // 이미 추출된 이미지와 중복 방지
                if (!media.some(md => md.title === attTitle)) {
                  media.push({
                    type: isImg ? 'image' : isVideo ? 'video' : 'attachment',
                    title: attTitle,
                    url: toProxyUrl(rawAttUrl),
                    mimeType: String(att.mediaType ?? ''),
                  });
                }
              }

              // 6) 외부 링크: <a href="http...">
              const linkRe = /<a\s+[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
              while ((m = linkRe.exec(rawHtml)) !== null) {
                const linkUrl = m[1];
                const linkText = m[2] || linkUrl;
                // 이미 추출된 미디어와 중복 방지
                if (!media.some(md => md.url === linkUrl)) {
                  media.push({ type: 'link', title: linkText, url: linkUrl });
                }
              }

              // resultStr 구성
              const mediaLines = media.length > 0
                ? `\n첨부/미디어 (${media.length}개):\n` + media.map(md => {
                    const icon = md.type === 'image' ? '🖼️' : md.type === 'video' ? '🎬' : md.type === 'attachment' ? '📎' : '🔗';
                    return `${icon} [${md.title}](${md.url})`;
                  }).join('\n')
                : '';

              resultStr = [
                `Confluence 페이지: [${String(data2.title ?? '')}](${confPageUrl || `ID:${pageId}`})`,
                confPageUrl ? `URL: ${confPageUrl}` : `ID: ${pageId}`,
                `Space: ${space}`,
                `버전: ${String((data2.version as Record<string,unknown>)?.number ?? '')}`,
                mediaLines,
                `내용 (HTML 태그 제거):\n${htmlContent}`,
              ].filter(Boolean).join('\n');
              tc = { kind: 'confluence_page', pageId,
                url: confPageUrl,
                title: String(data2.title ?? ''),
                space: String(space),
                htmlContent: rawHtml,
                media: media.length > 0 ? media : undefined,
                version: Number((data2.version as Record<string,unknown>)?.number ?? 0),
                duration,
              } as ConfluencePageResult;
            }
          } catch (e) {
            resultStr = `Confluence 페이지 조회 오류: ${String(e)}`;
            tc = { kind: 'confluence_page', pageId, error: String(e), duration: 0 } as ConfluencePageResult;
          }
        }

        // ── save_knowledge ──
        else if (tb.name === 'save_knowledge') {
          const knName = String(inp.name ?? '').trim();
          const knContent = String(inp.content ?? '');
          const t0 = performance.now();
          try {
            if (!knName || !knContent) {
              resultStr = '오류: name과 content가 모두 필요합니다.';
              tc = { kind: 'knowledge', action: 'save', name: knName, error: resultStr };
            } else {
              const resp = await fetch('/api/knowledge/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: knName, content: knContent }),
              });
              const data2 = await resp.json() as { name?: string; sizeKB?: number; created?: boolean; error?: string };
              if (!resp.ok || data2.error) {
                resultStr = `널리지 저장 실패: ${data2.error ?? 'Unknown error'}`;
                tc = { kind: 'knowledge', action: 'save', name: knName, error: resultStr };
              } else {
                resultStr = `✅ 널리지 "${data2.name}" ${data2.created ? '생성' : '업데이트'} 완료 (${data2.sizeKB}KB)`;
                tc = { kind: 'knowledge', action: 'save', name: data2.name ?? knName, sizeKB: data2.sizeKB, created: data2.created };
                // 사이드바 KnowledgeBrowser 즉시 갱신 트리거
                try { window.dispatchEvent(new CustomEvent('knowledge-updated')); } catch { /* 무시 */ }
              }
            }
          } catch (e) {
            resultStr = `널리지 저장 오류: ${String(e)}`;
            tc = { kind: 'knowledge', action: 'save', name: knName, error: String(e) };
          }
        }

        // ── read_knowledge ──
        else if (tb.name === 'read_knowledge') {
          const knName = String(inp.name ?? '').trim();
          const t0 = performance.now();
          try {
            if (!knName) {
              // 목록 반환
              const resp = await fetch('/api/knowledge/list');
              const data2 = await resp.json() as { items?: { name: string; sizeKB: number; updatedAt: string }[]; total?: number };
              const items = data2.items ?? [];
              if (items.length === 0) {
                resultStr = '저장된 널리지가 없습니다. save_knowledge로 지식을 저장할 수 있습니다.';
              } else {
                resultStr = `📚 저장된 널리지 (${items.length}개):\n` +
                  items.map(it => `- ${it.name} (${it.sizeKB}KB, ${new Date(it.updatedAt).toLocaleDateString('ko-KR')})`).join('\n');
              }
              tc = { kind: 'knowledge', action: 'list', name: '', items };
            } else {
              const resp = await fetch(`/api/knowledge/read?name=${encodeURIComponent(knName)}`);
              const data2 = await resp.json() as { name?: string; content?: string; sizeKB?: number; truncated?: boolean; error?: string; available?: string[] };
              if (!resp.ok || data2.error) {
                const avail = data2.available ? `\n사용 가능: ${data2.available.join(', ')}` : '';
                resultStr = `널리지 '${knName}' 없음.${avail}`;
                tc = { kind: 'knowledge', action: 'read', name: knName, error: resultStr };
              } else {
                const truncNote = data2.truncated ? '\n\n[주의: 파일이 너무 커서 앞 200KB만 반환됨]' : '';
                resultStr = `# 널리지: ${data2.name} (${data2.sizeKB}KB)\n\n${data2.content}${truncNote}`;
                tc = { kind: 'knowledge', action: 'read', name: data2.name ?? knName, content: data2.content, sizeKB: data2.sizeKB };
              }
            }
          } catch (e) {
            resultStr = `널리지 읽기 오류: ${String(e)}`;
            tc = { kind: 'knowledge', action: 'read', name: knName, error: String(e) };
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
      for (const tb of toolBlocks) {
        const label = TOOL_LABELS[tb.name] ?? `🔧 ${tb.name}`;
        onThinkingUpdate?.({ type: 'tool_done', iteration: i + 1, maxIterations: MAX_ITERATIONS, toolName: tb.name, toolLabel: label, timestamp: Date.now() });
      }

      // ★ create_artifact 또는 patch_artifact 성공 시 → 즉시 반환 (재시도 방지)
      const hasArtifactOrPatch = allToolCalls.some(tc => tc.kind === 'artifact' || tc.kind === 'artifact_patch');
      if (hasArtifactOrPatch) {
        // 텍스트에서 아티팩트 마커 + HTML 제거
        let finalText = accumulatedText
          .replace(/<<<ARTIFACT_START>>>[\s\S]*?<<<ARTIFACT_END>>>/g, '')
          .trim();
        finalText = stripHtmlFromChatText(finalText);
        if (continuationCount > 0) finalText = stripHtmlFromChatText(totalText) + finalText;

        console.log(`[Chat] ✅ 아티팩트/패치 생성 완료 → 즉시 반환 (불필요한 재시도 방지), text=${finalText.length}자`);
        const tokenUsage: TokenUsageSummary = {
          iterations: tokenIterations,
          total_input: tokenIterations.reduce((s, t) => s + t.input_tokens, 0),
          total_output: tokenIterations.reduce((s, t) => s + t.output_tokens, 0),
          total_tokens: tokenIterations.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0),
          system_prompt_estimate: systemPromptEstimate,
        };
        useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));
        return {
          content: finalText || '아티팩트가 사이드 패널에 생성되었습니다.',
          toolCalls: allToolCalls,
          tokenUsage,
        };
      }

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

    // ★ 아티팩트 HTML 이어쓰기 감지: 텍스트 마커로 스트리밍됐지만 <<<ARTIFACT_END>>>가 안 왔거나, 잘린 경우
    const artHtmlTruncated = streamedArtifactHtml && streamedArtifactHtml.length >= 10;
    // 잘린 HTML인지 판단: </html>, </body>, </div> 등으로 정상 종결되지 않았으면 미완성
    const htmlLooksComplete = streamedArtifactHtml
      ? /<\/(?:html|body)>\s*$/i.test(streamedArtifactHtml.trim())
      : false;
    const needsArtifactContinuation = artHtmlTruncated && !htmlLooksComplete && !hasArtifact;

    // 자동 계속 가능한 경우 (이터레이션 여유 있음)
    if (i < MAX_ITERATIONS - 1) {
      pushAssistantWithOrphanFix(messages);

      // ★★★ 아티팩트 HTML 이어쓰기: 잘린 HTML을 누적하고 다음 이터레이션에서 계속 생성 ★★★
      if (needsArtifactContinuation) {
        artifactAccumulatedHtml += streamedArtifactHtml!;
        artifactContinuationCount++;
        const lastChunk = streamedArtifactHtml!.slice(-200); // 마지막 200자를 컨텍스트로
        console.log(`[Chat] ⚡ 아티팩트 이어쓰기 ${artifactContinuationCount}회: 누적 ${artifactAccumulatedHtml.length}자, 마지막: "${lastChunk.slice(-60)}..."`);
        onThinkingUpdate?.({ type: 'continuation', iteration: i + 1, maxIterations: MAX_ITERATIONS, detail: `아티팩트 이어쓰기 ${artifactContinuationCount}회 (${artifactAccumulatedHtml.length}자)`, timestamp: Date.now() });

        // 사이드 패널에 현재까지 누적된 HTML 표시 (진행 중 상태)
        if (onArtifactProgress) {
          onArtifactProgress(artifactAccumulatedHtml, `생성 중... (${artifactContinuationCount}회 이어쓰기)`, artifactAccumulatedHtml.length, '');
        }

        messages.push({
          role: 'user',
          content:
            'HTML이 잘렸습니다. 바로 이전 HTML의 마지막 부분:\n```\n' + lastChunk + '\n```\n' +
            '위 코드 바로 뒤부터 이어서 작성하세요. ' +
            '⚠️ 규칙: <<<ARTIFACT_START>>>를 다시 쓰지 말고, HTML 코드만 바로 출력한 후 <<<ARTIFACT_END>>>로 마무리하세요. ' +
            '그 후 create_artifact(title=...) 를 호출하세요. 중복 코드 없이 바로 이어주세요.',
        });
        continue;
      }

      // ★ max_tokens로 잘렸지만 완성된 아티팩트 HTML이 있는 경우 → 자동 아티팩트 생성
      if (artHtmlTruncated && htmlLooksComplete && !hasArtifact) {
        const finalArtHtml = artifactAccumulatedHtml + streamedArtifactHtml!;
        console.log(`[Chat] ⚡ max_tokens 자동 아티팩트 생성 (완성): HTML ${finalArtHtml.length}자`);
        const autoTitle = truncatedText.match(/^#+\s*(.+)/m)?.[1] ?? '문서';
        const autoTc: ArtifactResult = { kind: 'artifact', title: autoTitle, description: '', html: finalArtHtml, duration: 0 };
        allToolCalls.push(autoTc);
        onToolCall?.(autoTc, allToolCalls.length - 1);
      }

      // 데이터 수집 완료 & 아티팩트 미생성 → create_artifact 재촉
      if (hasFetchedData && !hasArtifact && !artHtmlTruncated) {
        console.log('[Chat] max_tokens 감지: 데이터 수집 완료, 아티팩트 자동 재시도');
        messages.push({
          role: 'user',
          content:
            '수집한 데이터를 바탕으로 <<<ARTIFACT_START>>>HTML<<<ARTIFACT_END>>> 형식으로 HTML을 먼저 출력한 후, create_artifact(title=...) 를 호출하세요. ' +
            '추가 데이터 조회 없이 현재 데이터만으로 바로 만들어주세요. 핵심 내용을 간결하게 500줄 이내로.',
        });
      } else if (!artHtmlTruncated) {
        // 일반 텍스트 잘림 → 누적 후 자동 계속
        if (truncatedText) {
          totalText += truncatedText;
        }
        continuationCount++;
        console.log(`[Chat] max_tokens 감지: 텍스트 자동 계속 ${continuationCount}회 (누적 ${totalText.length}자)`);
        onThinkingUpdate?.({ type: 'continuation', iteration: i + 1, maxIterations: MAX_ITERATIONS, detail: `자동 계속 ${continuationCount}회 (${totalText.length}자)`, timestamp: Date.now() });
        messages.push({
          role: 'user',
          content: '이어서 계속 작성해주세요. 바로 이전 텍스트 뒤부터 자연스럽게 이어서 작성하세요. 중복 없이 바로 이어주세요.',
        });
      }
      continue;
    }

    // ★ 마지막 이터레이션: 잘린 아티팩트라도 누적된 HTML로 생성
    if (artHtmlTruncated && !hasArtifact) {
      const finalArtHtml = artifactAccumulatedHtml + streamedArtifactHtml!;
      console.log(`[Chat] ⚡ 마지막 이터레이션 자동 아티팩트 생성: HTML ${finalArtHtml.length}자 (잘린 상태)`);
      const autoTitle = truncatedText.match(/^#+\s*(.+)/m)?.[1] ?? '문서 (미완성)';
      const autoTc: ArtifactResult = { kind: 'artifact', title: autoTitle, description: '(max_tokens로 잘린 문서)', html: finalArtHtml, duration: 0 };
      allToolCalls.push(autoTc);
      onToolCall?.(autoTc, allToolCalls.length - 1);
    }

    // 마지막 이터레이션에서도 잘린 경우 → rawMessages 저장하여 '계속해줘' 지원
    pushAssistantWithOrphanFix(messages);
    const finalTruncatedText = stripHtmlFromChatText(continuationCount > 0 ? totalText + truncatedText : truncatedText);
    console.log('[Chat] max_tokens: 최대 이터레이션 도달, rawMessages 저장');
    const tokenUsage: TokenUsageSummary = {
      iterations: tokenIterations,
      total_input: tokenIterations.reduce((s, t) => s + t.input_tokens, 0),
      total_output: tokenIterations.reduce((s, t) => s + t.output_tokens, 0),
      total_tokens: tokenIterations.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0),
      system_prompt_estimate: systemPromptEstimate,
    };
    useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));
    return {
      content: finalTruncatedText || '(응답이 잘렸습니다)',
      toolCalls: allToolCalls,
      rawMessages: messages,
      tokenUsage,
    };
  }

  // ── MAX_ITERATIONS 모두 소진 → rawMessages 포함하여 '계속하기' 지원 ──
  const tokenUsage: TokenUsageSummary = {
    iterations: tokenIterations,
    total_input: tokenIterations.reduce((s, t) => s + t.input_tokens, 0),
    total_output: tokenIterations.reduce((s, t) => s + t.output_tokens, 0),
    total_tokens: tokenIterations.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0),
    system_prompt_estimate: systemPromptEstimate,
  };
  useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));

  // 조회된 데이터가 있으면 rawMessages를 보존하여 계속하기 버튼 지원
  const hasCollectedData = allToolCalls.length > 0;
  const dataToolCount = allToolCalls.filter(
    (tc) => tc.kind === 'data_query' || tc.kind === 'schema_card' || tc.kind === 'character_profile' ||
            tc.kind === 'git_history' || tc.kind === 'jira_search' || tc.kind === 'confluence_page',
  ).length;

  if (hasCollectedData) {
    console.log(`[Chat] MAX_ITERATIONS 소진: 수집된 도구 호출 ${allToolCalls.length}건 (데이터 조회 ${dataToolCount}건), rawMessages 보존`);
    return {
      content: `데이터 조회가 많아 응답이 중단되었습니다 (${allToolCalls.length}건 조회 완료). 아래 '이어서 생성하기' 버튼을 눌러 이미 조회된 데이터로 답변을 이어받을 수 있습니다.`,
      toolCalls: allToolCalls,
      rawMessages: messages,
      tokenUsage,
    };
  }

  return {
    content: '너무 많은 데이터 조회가 필요합니다. 질문을 좀 더 구체적으로 해주세요.',
    toolCalls: allToolCalls,
    tokenUsage,
  };
}
