import type { ParsedSchema } from '../schema/types.ts';
import type { Row, TableDataMap } from '../query/schemaQueryEngine.ts';
import { executeDataSQL, RESERVED_TABLE_NAMES, VIRTUAL_TABLE_SCHEMA } from '../query/schemaQueryEngine.ts';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import { useCanvasStore, type ClaudeModelId } from '../../store/useCanvasStore.ts';
import { anomalyReportToPrompt } from './anomalyDetector.ts';

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

  // :::visualizer 블록 보존 (내부 HTML 유지)
  const vizPlaceholders: string[] = [];
  text = text.replace(/:::visualizer(?:\{[^}]*\})?[\s\S]*?(?:\n:::\s*(?:\n|$)|$)/g, (m) => {
    vizPlaceholders.push(m);
    return `\x00VIZ${vizPlaceholders.length - 1}\x00`;
  });

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

  // :::visualizer 블록 복원
  let result = cleaned;
  vizPlaceholders.forEach((viz, idx) => {
    result = result.replace(`\x00VIZ${idx}\x00`, viz);
  });

  // 연속 빈 줄 정리
  return result.replace(/\n{3,}/g, '\n\n').trim();
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
  images: { name: string; relPath: string; url: string; isAtlas?: boolean; dataUri?: string }[];
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
  totalComments?: number;
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

export interface WebSearchResult {
  kind: 'web_search';
  query: string;
  results: { title: string; url: string; snippet: string; age?: string }[];
  error?: string;
  duration?: number;
}

export interface WebReadResult {
  kind: 'web_read';
  url: string;
  title: string;
  content: string;
  contentLength: number;
  error?: string;
  duration?: number;
}

export interface BibleTablingEditResult {
  kind: 'bible_tabling_edit';
  title: string;
  reason?: string;
  jobId: string;
  downloadUrl: string;
  downloadFilename: string;
  files: Array<{ filename: string; url: string }>;
  filesModified: number;
  totalRowsMatched: number;
  totalCellsModified: number;
  tables: string[];
  details?: Array<{ table: string; file?: string; rows_matched?: number; cells_modified?: number; changes?: Array<Record<string, unknown>> }>;
  error?: string;
  partial?: boolean;
  errorCount?: number;
  duration?: number;
}

export interface BibleTablingAddRowsResult {
  kind: 'bible_tabling_add_rows';
  table: string;
  file?: string;
  jobId: string;
  downloadUrl: string;
  downloadFilename: string;
  rowsAdded: number;
  inputRows?: Array<Record<string, unknown>>;
  overrideColumns?: string[];
  sampleRows?: Array<Record<string, string>>;
  error?: string;
  duration?: number;
}

export type ToolCallResult = DataQueryResult | SchemaCardResult | GitHistoryResult | RevisionDiffResult | ImageResult | ArtifactResult | ArtifactPatchResult | CharacterProfileResult | CodeSearchResult | CodeFileResult | CodeGuideResult | AssetSearchResult | JiraSearchResult | JiraIssueResult | JiraCreateResult | JiraCommentResult | JiraStatusResult | ConfluenceSearchResult | ConfluencePageResult | SceneYamlResult | PrefabPreviewResult | FbxAnimationResult | KnowledgeResult | WebSearchResult | WebReadResult | BibleTablingEditResult | BibleTablingAddRowsResult;

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
  { name: 'search_published_artifacts', label: '기존 문서 검색', emoji: '🔍', dataSources: [] },
  { name: 'get_published_artifact', label: '기존 문서 가져오기',  emoji: '📄', dataSources: [] },
  { name: 'search_jira',            label: 'Jira 검색',          emoji: '🎫', dataSources: ['jira'] },
  { name: 'get_jira_issue',         label: 'Jira 이슈',          emoji: '🎫', dataSources: ['jira'] },
  { name: 'create_jira_issue',      label: 'Jira 일감 생성',     emoji: '➕', dataSources: ['jira'] },
  { name: 'add_jira_comment',       label: 'Jira 댓글 작성',     emoji: '✍️', dataSources: ['jira'] },
  { name: 'update_jira_issue_status', label: 'Jira 상태 변경',   emoji: '🔄', dataSources: ['jira'] },
  { name: 'search_confluence',      label: 'Confluence 검색',    emoji: '📚', dataSources: ['confluence'] },
  { name: 'get_confluence_page',    label: 'Confluence 페이지',   emoji: '📚', dataSources: ['confluence'] },
  { name: 'add_confluence_comment', label: 'Confluence 댓글 작성', emoji: '💬', dataSources: ['confluence'] },
  { name: 'save_knowledge',         label: '널리지 저장',         emoji: '🧠', dataSources: ['knowledge'] },
  { name: 'read_knowledge',         label: '널리지 읽기',         emoji: '🧠', dataSources: ['knowledge'] },
  { name: 'save_validation_rule',   label: '검증 룰 등록',       emoji: '🛡️', dataSources: ['knowledge'] },
  { name: 'list_validation_rules',  label: '검증 룰 목록',       emoji: '🛡️', dataSources: ['knowledge'] },
  { name: 'delete_validation_rule', label: '검증 룰 삭제',       emoji: '🛡️', dataSources: ['knowledge'] },
  { name: 'web_search',             label: '웹 검색',             emoji: '🌐', dataSources: ['web'] },
  { name: 'edit_game_data',         label: '바이브테이블링',       emoji: '📝', dataSources: ['excel'] },
  { name: 'add_game_data_rows',     label: '데이터 행 추가',       emoji: '➕', dataSources: ['excel'] },
  { name: 'read_url',               label: '웹페이지 읽기',       emoji: '🌐', dataSources: ['web'] },
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
  { name: 'web',        label: '웹 검색',          emoji: '🌐' },
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
    description: '아티팩트(HTML 문서) 등록. 호출 직전에 <<<ARTIFACT_START>>>HTML<<<ARTIFACT_END>>> 형식으로 출력 후 title만으로 호출. 수정 시에는 patch_artifact 사용.',
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
  // ── 출판 아티팩트 검색/가져오기 ──────────────────────────────────────────
  {
    name: 'search_published_artifacts',
    description: '출판된 아티팩트(문서/보고서) 검색. 아티팩트 생성 전 반드시 호출하여 유사 기존 문서 확인.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드 (제목/설명에서 검색). 비워두면 최근 문서 목록 반환.' },
        limit: { type: 'number', description: '최대 결과 수 (기본 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_published_artifact',
    description: '출판된 아티팩트 HTML 전체 가져오기. 수정/갱신 시 사용.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: '아티팩트 ID (search_published_artifacts 결과에서 확인)' },
      },
      required: ['artifact_id'],
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
    description: 'Confluence 문서 검색. query→자동 CQL 변환. cql로 직접 지정 가능.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드' },
        cql: { type: 'string', description: '직접 CQL (query보다 우선)' },
        space: { type: 'string', description: 'Space 키' },
        limit: { type: 'number' },
      },
      required: [],
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
  // ── 검증 룰 도구 ──────────────────────────────────────────────────────────
  {
    name: 'save_validation_rule',
    description: '검증 룰 등록/수정. 자연어→구조화 룰 변환.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '룰 ID (영문 snake_case, 신규면 자동생성 가능)' },
        name: { type: 'string', description: '룰 이름 (한글 가능, 예: "캐릭터 HP 양수 필수")' },
        table: { type: 'string', description: '대상 테이블명 (와일드카드 가능: "*Stat", "*", 정확한 이름)' },
        severity: { type: 'string', enum: ['error', 'warning'], description: 'error=필수, warning=권장' },
        condition: {
          type: 'object',
          description: '조건 객체. type 필수. 지원: range{column,min?,max?}, not_null{column}, in{column,values[]}, not_in{column,values[]}, regex{column,pattern}, compare_columns{left,op,right}, conditional{when:{column,op,value},then:{column,op,value}}, unique{column}, fk_ref{column,ref_table,ref_column?(기본"id"),allow_sentinel?(기본true,-1/0허용)}',
          properties: {
            type: { type: 'string', enum: ['range', 'not_null', 'in', 'not_in', 'regex', 'compare_columns', 'conditional', 'unique', 'fk_ref'] },
          },
          required: ['type'],
        },
      },
      required: ['name', 'table', 'severity', 'condition'],
    },
  },
  {
    name: 'list_validation_rules',
    description: '등록된 데이터 검증 룰 목록을 반환합니다.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'delete_validation_rule',
    description: '검증 룰을 삭제합니다.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '삭제할 룰 ID' },
      },
      required: ['id'],
    },
  },
  // ── Jira 쓰기 툴 ──────────────────────────────────────────────────────────
  {
    name: 'create_jira_issue',
    description: '새 Jira 이슈 생성.',
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
    description: 'Jira 이슈에 댓글 작성. issueKey 또는 URL.',
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
    name: 'add_confluence_comment',
    description: 'Confluence 페이지에 댓글 작성. pageId 또는 URL.',
    input_schema: {
      type: 'object',
      properties: {
        pageIdOrUrl: { type: 'string', description: 'Confluence 페이지 ID(숫자) 또는 전체 URL' },
        comment: { type: 'string', description: '작성할 댓글 내용 (마크다운/텍스트 지원)' },
      },
      required: ['pageIdOrUrl', 'comment'],
    },
  },
  {
    name: 'update_jira_issue_status',
    description: 'Jira 이슈 상태 변경. listTransitions:true로 가능한 상태 조회.',
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
  // ── 웹 검색 / URL 읽기 ──
  {
    name: 'web_search',
    description: '웹 검색. 외부 레퍼런스/기술 문서/용어 검색.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색 키워드' },
        count: { type: 'number', description: '결과 수 (기본 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_url',
    description: 'URL 웹페이지 내용 읽기.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL' },
        maxLength: { type: 'number', description: '최대 길이 (기본 15000)' },
      },
      required: ['url'],
    },
  },
  // ── 바이브테이블링 (Excel 편집) ──
  {
    name: 'edit_game_data',
    description: `게임 데이터 Excel 기존 셀 편집 (바이브테이블링). 편집된 셀은 노란색 하이라이트.
⭐ 같은 xlsx 여러 시트 수정 시 → 하나의 edit_game_data에 edit_plan 배열로 모두 포함! 분리 호출 시 이전 편집 유실!
edit_plan: [{order(부모먼저), table, sheet?, file?, csv_set? 또는 filters+changes}]
csv_set: 대량 set 편집 권장. "id,hp,mp\\nCHR001,1000,500" (첫열=PK필터eq, 나머지=set값). multiply/add/subtract/append는 filters+changes 사용.
op: eq/neq/gt/gte/lt/lte/in/contains/starts_with/ends_with. action: set/multiply/add/subtract/append.`,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '구체적 작업 제목 (예: "캐릭터5001 스탯 수정"). "바이브테이블링" 같은 일반 제목 금지!' },
        reason: { type: 'string', description: '사유' },
        edit_plan: {
          type: 'array',
          description: '편집 계획 배열. order 순서대로 실행',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number', description: '실행 순서' },
              table: { type: 'string', description: '시트명' },
              sheet: { type: 'string', description: '시트명 (생략 시 table)' },
              file: { type: 'string', description: 'xlsx 파일명' },
              csv_set: { type: 'string', description: 'CSV set편집. 첫열=PK필터,나머지=set값' },
              filters: {
                type: 'array',
                description: '행 필터 (csv_set 미사용 시)',
                items: {
                  type: 'object',
                  properties: {
                    column: { type: 'string' },
                    op: { type: 'string', enum: ['eq','neq','gt','gte','lt','lte','in','contains','starts_with','ends_with'] },
                    value: { type: 'string' },
                    values: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['column', 'op'],
                },
              },
              changes: {
                type: 'array',
                description: '변경 목록 (csv_set 미사용 시)',
                items: {
                  type: 'object',
                  properties: {
                    column: { type: 'string' },
                    action: { type: 'string', enum: ['set','multiply','add','subtract','append'] },
                    value: { description: '값' },
                  },
                  required: ['column', 'action', 'value'],
                },
              },
            },
            required: ['table'],
          },
        },
      },
      required: ['title', 'edit_plan'],
    },
  },
  {
    name: 'add_game_data_rows',
    description: `게임 데이터 Excel 새 행 추가 (바이브테이블링). 추가된 셀은 노란색 하이라이트.
🔴 기존 데이터 복제/복사 시 → clone_source 필수! query 결과를 rows/csv로 재입력 절대 금지!
clone_source: {column, value} + override_csv → Python이 원본 복사, 바꿀 컬럼만 교체. 원본 M행 × override N세트 = M×N행 자동생성.
csv: 완전히 새로운 데이터만. rows: 1~2행 소량 전용 (3행 이상 금지).`,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '구체적 작업 제목 (예: "캐릭터5001 스탯 10행 추가"). 일반 제목 금지!' },
        reason: { type: 'string' },
        table: { type: 'string', description: '시트명' },
        file: { type: 'string', description: 'xlsx 파일명' },
        clone_source: {
          type: 'object',
          description: '기존 행 복제. Python이 원본 복사+override 적용',
          properties: {
            column: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['column', 'value'],
        },
        override_csv: { type: 'string', description: 'clone_source용. 바꿀 컬럼 CSV' },
        csv: { type: 'string', description: '새 데이터 CSV' },
        rows: {
          type: 'array',
          description: '1~2행 소량 추가 전용',
          items: { type: 'object' },
        },
      },
      required: ['table'],
    },
  },
];

// ── 도구 그룹화: 질문 기반 동적 선택 ────────────────────────────────────────
const TOOL_GROUPS: Record<string, { tools: string[]; keywords: RegExp }> = {
  data: {
    tools: ['query_game_data', 'show_table_schema', 'edit_game_data', 'add_game_data_rows'],
    keywords: /데이터|테이블|스키마|sql|조회|수정|편집|밸런스|엑셀|바이블|컬럼|행\s*추가|값\s*변경|select|where|insert|update|query|영향|임팩트|캐스케이드|관련.*테이블|함께.*수정|같이.*수정|전체.*검증|QA|이상치|무결성/i,
  },
  git: {
    tools: ['query_git_history', 'show_revision_diff'],
    keywords: /커밋|깃|git|히스토리|변경.*이력|diff|리비전|수정됐|언제.*바뀌|수정점|변경점|변경사항|바뀐\s*거|뭐\s*바뀌|뭐\s*수정|최근.*변경|최근.*수정|패치.*노트|업데이트.*내역|누가.*바꿨|누가.*수정/i,
  },
  asset: {
    tools: ['find_resource_image', 'search_assets', 'read_scene_yaml', 'preview_prefab', 'preview_fbx_animation'],
    keywords: /에셋|리소스|이미지|fbx|프리팹|씬|모델|애니메이션|3d|png|wav|오디오|사운드|텍스처|unity/i,
  },
  code: {
    tools: ['search_code', 'read_code_file'],
    keywords: /코드|c#|클래스|메서드|스크립트|함수|소스|구현|로직/i,
  },
  artifact: {
    tools: ['create_artifact', 'patch_artifact', 'search_published_artifacts', 'get_published_artifact'],
    keywords: /아티팩트|문서로.*만들|보고서.*만들|시트.*만들|기획서|정리해줘|작성해줘|만들어줘|릴리즈.*노트|수정.*요청|\[아티팩트|기존.*문서|이전.*문서|출판/i,
  },
  jira: {
    tools: ['search_jira', 'get_jira_issue', 'create_jira_issue', 'add_jira_comment', 'update_jira_issue_status'],
    keywords: /지라|jira|이슈|일감|티켓|스프린트|aegis-|버그.*등록|댓글|코멘트/i,
  },
  confluence: {
    tools: ['search_confluence', 'get_confluence_page', 'add_confluence_comment'],
    keywords: /컨플루언스|컨플|confluence|위키|기획.*문서|스펙.*문서|회의록|기획서|디자인.*문서|기획.*페이지|문서.*찾|문서.*검색|\/wiki\/|\/pages\/\d+|댓글.*컨플|컨플.*댓글|코멘트.*컨플|컨플.*코멘트/i,
  },
  character: {
    tools: ['build_character_profile'],
    keywords: /캐릭터|프로파일|프로필|인물|영웅|전사|마법사|궁수/i,
  },
  web: {
    tools: ['web_search', 'read_url'],
    keywords: /검색|웹|url|http|사이트|레퍼런스|참고.*자료|외부/i,
  },
};
const ALWAYS_TOOLS = ['read_knowledge', 'save_knowledge', 'read_guide', 'query_game_data', 'show_table_schema', 'save_validation_rule', 'list_validation_rules', 'delete_validation_rule', 'search_confluence', 'get_confluence_page', 'add_confluence_comment'];

function selectToolsForQuery(query: string, existingFilter?: string[]): typeof TOOLS {
  if (existingFilter) return TOOLS.filter(t => existingFilter.includes(t.name));

  const matched = new Set<string>(ALWAYS_TOOLS);
  let anyGroupMatched = false;

  for (const group of Object.values(TOOL_GROUPS)) {
    if (group.keywords.test(query)) {
      for (const t of group.tools) matched.add(t);
      anyGroupMatched = true;
    }
  }

  if (!anyGroupMatched) return TOOLS;

  // 아티팩트 수정 요청이면 data 그룹도 포함 (query_game_data 등 필요)
  if (matched.has('patch_artifact') || matched.has('create_artifact')) {
    for (const t of TOOL_GROUPS.data.tools) matched.add(t);
    matched.add('build_character_profile');
    matched.add('find_resource_image');
  }

  // 데이터 질문 시 기존 아티팩트 수정 도구만 포함 (create_artifact는 사용자가 명시적으로 요청할 때만)
  if (matched.has('query_game_data')) {
    matched.add('patch_artifact');
  }

  // 데이터+변경 질문이면 Git 도구도 포함 ("Character 수정점" 등)
  if (matched.has('query_game_data') && /수정|변경|바뀌|업데이트|패치|최근/i.test(query)) {
    for (const t of TOOL_GROUPS.git.tools) matched.add(t);
  }
  // Git 질문에 테이블명이 포함되면 데이터 도구도 포함 (변경 전후 비교 가능)
  if (matched.has('query_git_history')) {
    matched.add('show_table_schema');
    matched.add('query_game_data');
  }

  // 버그 헌팅 키워드 → 데이터 + 코드 도구 모두 포함
  if (/버그.*찾|버그.*헌팅|게임.*버그|QA.*해|런타임.*버그|크래시.*찾/i.test(query)) {
    for (const t of TOOL_GROUPS.data.tools) matched.add(t);
    for (const t of TOOL_GROUPS.code.tools) matched.add(t);
    matched.add('read_guide');
    anyGroupMatched = true;
  }

  // 댓글/코멘트 키워드 + Confluence URL → confluence 도구 보장
  if (/댓글|코멘트|comment/i.test(query) && /\/wiki\/|\/pages\/\d+|confluence|컨플/i.test(query)) {
    for (const t of TOOL_GROUPS.confluence.tools) matched.add(t);
  }
  // 댓글/코멘트 키워드 → Jira + Confluence 도구 모두 포함
  if (/댓글|코멘트|comment/i.test(query)) {
    for (const t of TOOL_GROUPS.jira.tools) matched.add(t);
    matched.add('add_confluence_comment');
  }

  const selected = TOOLS.filter(t => matched.has(t.name));
  return selected;
}

// ── 시스템 프롬프트 빌더 ─────────────────────────────────────────────────────

/** 질문-널리지 관련도 점수 계산 (파일명 + 헤딩 키워드 매칭) */
function scoreKnowledgeRelevance(query: string, entry: { name: string; content: string }): number {
  const q = query.toLowerCase();
  const words = q.split(/[\s,?!.]+/).filter(w => w.length >= 2);
  let score = 0;

  const nameLower = entry.name.toLowerCase().replace(/[-_]/g, ' ');
  for (const w of words) {
    if (nameLower.includes(w)) score += 3;
  }

  const headings: string[] = [];
  for (const line of entry.content.split('\n')) {
    if (line.startsWith('#')) headings.push(line.replace(/^#+\s*/, '').trim().toLowerCase());
    if (headings.length >= 10) break;
  }
  for (const w of words) {
    for (const h of headings) {
      if (h.includes(w)) { score += 1; break; }
    }
  }

  return score;
}

function buildSystemPrompt(
  schema: ParsedSchema | null,
  tableData: TableDataMap,
  knowledgeEntries?: { name: string; sizeKB: number; content: string }[],
  _userQuery?: string,
  selectedToolNames?: string[],
  anomalyPrompt?: string,
  validationPrompt?: string,
  detectedWorkflow?: 'new_content' | 'balance_change' | 'data_qa' | 'game_bug_hunt' | null,
): string {
  const hasTools = (names: string[]) => !selectedToolNames || names.some(n => selectedToolNames.includes(n));
  const lines: string[] = [];

  // ── 널리지: 관련 파일 전문 주입 + 나머지 목차만 ──
  if (knowledgeEntries && knowledgeEntries.length > 0) {
    const MAX_INJECT = 2;        // 전문 주입 최대 파일 수
    const MAX_INJECT_CHARS = 4096; // 파일당 최대 주입 글자수

    // 질문-널리지 관련도 계산 → 상위 N개만 전문 주입
    const scored = knowledgeEntries.map(e => ({
      entry: e,
      score: _userQuery ? scoreKnowledgeRelevance(_userQuery, e) : 0,
    })).sort((a, b) => b.score - a.score);

    const injected = scored.filter(s => s.score >= 2).slice(0, MAX_INJECT);
    const rest = scored.filter(s => !injected.includes(s));

    if (injected.length > 0) {
      lines.push(`## 📚 관련 널리지 (질문 매칭, ${injected.length}개 전문 포함)`);
      for (const { entry } of injected) {
        const content = entry.content.length > MAX_INJECT_CHARS
          ? entry.content.slice(0, MAX_INJECT_CHARS) + '\n...(잘림)'
          : entry.content;
        lines.push(`\n### 📌 ${entry.name} (${entry.sizeKB}KB)`);
        lines.push(content);
      }
      lines.push('');
    }

    if (rest.length > 0) {
      lines.push(`## 📚 기타 널리지 목록 (${rest.length}개, 필요 시 read_knowledge 도구로 읽기)`);
      for (const { entry } of rest) {
        const headings: string[] = [];
        for (const line of entry.content.split('\n')) {
          if (line.startsWith('#')) {
            headings.push(line.replace(/^#+\s*/, '').trim());
            if (headings.length >= 3) break;
          }
        }
        const firstLine = entry.content.split('\n').find(l => l.trim() && !l.startsWith('#'))?.trim().slice(0, 60) ?? '';
        const preview = headings.length > 0 ? headings.join(' > ') : firstLine || entry.content.slice(0, 60).replace(/\n/g, ' ').trim();
        lines.push(`  📌 ${entry.name} (${entry.sizeKB}KB) — ${preview}`);
      }
      lines.push('');
    }

    lines.push('📋 널리지 규칙: 위 전문 포함된 널리지를 우선 참고. 목록의 파일은 read_knowledge(name)으로 읽기.');
    lines.push('');
  }

  lines.push('당신은 게임 데이터 전문 어시스턴트입니다. 한국어로 답변하세요.');
  lines.push('');
  lines.push('## 핵심 규칙');
  lines.push('- 모호한 질문 → A)/B)/C) 형식 객관식 되질문 (UI가 버튼으로 변환). 복수선택은 - [ ] 체크리스트.');
  lines.push('- ⭐ 답변 전 반드시 read_guide로 관련 가이드 먼저 읽기 (DB: _DB_OVERVIEW, 코드: _OVERVIEW)');
  lines.push('- "기억해/저장해" → save_knowledge(name=영문_snake_case). 읽기: read_knowledge(name).');
  lines.push('- "룰 등록/검증 룰/HP는 0보다 커야/조건 추가" → save_validation_rule. 자연어를 구조화된 condition으로 변환. FK 참조 검증은 fk_ref 타입 사용 (예: {type:"fk_ref", column:"passive_id", ref_table:"Passive"}). 목록: list_validation_rules. 삭제: delete_validation_rule(id).');
  lines.push('  condition types: range{column,min?,max?}, not_null{column}, in{column,values[]}, compare_columns{left,op,right}, conditional{when:{column,op,value},then:{column,op,value}}, unique{column}, regex{column,pattern}');
  lines.push('- 채팅에 HTML 태그 절대 금지. HTML은 아티팩트 또는 :::visualizer 블록 안에만.');
  lines.push('- 다단계 작업 시 :::progress 트래커 사용 (형식: 번호|상태|라벨|설명, 상태: done/active/pending/skipped)');
  lines.push('');
  lines.push('## 📊 인라인 비주얼라이저 (:::visualizer) — 아티팩트와 완전히 별개!');
  lines.push('텍스트 답변 중간에 차트/다이어그램을 끼워넣는 기능. HTML 작성 불필요! 타입+데이터만 출력하면 프론트엔드가 렌더링.');
  lines.push('');
  lines.push('### 🔴 아티팩트 vs 비주얼라이저 — 반드시 하나만 선택!');
  lines.push('| 구분 | 아티팩트 (create_artifact) | 비주얼라이저 (:::visualizer) |');
  lines.push('|------|---------------------------|------------------------------|');
  lines.push('| 용도 | 보고서/문서/대시보드 등 **영구 산출물** | 답변 중간 **보조 차트/다이어그램** |');
  lines.push('| 위치 | 사이드 패널 | 채팅 인라인 |');
  lines.push('| 방식 | <<<ARTIFACT_START>>> + create_artifact 도구 | :::visualizer 텍스트 블록 (도구 호출 없음!) |');
  lines.push('| 트리거 | "문서로 만들어줘", "보고서", "아티팩트" | "차트로", "시각화", "그래프", "비교해줘" |');
  lines.push('');
  lines.push('### 🔴🔴🔴 절대 금지');
  lines.push('- ❌ 비주얼라이저와 아티팩트 동시 사용 금지! 한 턴에 둘 중 하나만!');
  lines.push('- ❌ 비주얼라이저 안에 <<<ARTIFACT_START>>> 마커 금지!');
  lines.push('- ❌ "문서/보고서/시트 만들어줘" → 아티팩트! 비주얼라이저 아님!');
  lines.push('');
  lines.push('### 차트 타입 & 데이터 형식 (HTML 작성 금지! 아래 형식만 사용!)');
  lines.push('타입 헤더: :::visualizer{type="타입" title="제목"}');
  lines.push('데이터: 라벨|값 또는 라벨|값1|값2... (파이프 구분). 닫기: :::');
  lines.push('');
  lines.push('**bar** — 세로 막대 차트 (비교):');
  lines.push('```');
  lines.push(':::visualizer{type="bar" title="캐릭터 HP 비교"}');
  lines.push('프리드벨|2500');
  lines.push('카야|1800');
  lines.push('엔젤|1200');
  lines.push(':::');
  lines.push('```');
  lines.push('다중 시리즈 (헤더행 추가): _|HP|MP → 첫 줄이 헤더, 이후 라벨|값1|값2');
  lines.push('');
  lines.push('');
  lines.push('**📈 수치 차트:**');
  lines.push('- **hbar** — 가로 막대 (긴 라벨): 라벨|값');
  lines.push('- **stack** — 스택 바 (구성비): 헤더행+라벨|값1|값2...');
  lines.push('- **pie** — 파이 (비율): 라벨|값');
  lines.push('- **donut** — 도넛 (비율+중앙 합계): 라벨|값');
  lines.push('- **line** — 꺾은선 (추세): 라벨|값 또는 헤더행+다중시리즈');
  lines.push('- **area** — 영역 (추세+면적): line과 동일 형식');
  lines.push('- **radar** — 레이더 (다차원 비교): 축|값1|값2, 헤더행 가능');
  lines.push('- **scatter** — 산점도: 라벨|x|y');
  lines.push('- **bubble** — 버블 (3차원): 라벨|x|y|크기');
  lines.push('- **gauge** — 게이지 (달성률): 라벨|현재|최대');
  lines.push('- **treemap** — 트리맵 (점유율): 라벨|값');
  lines.push('- **funnel** — 퍼널 (전환율): 라벨|값 (위→아래 순서)');
  lines.push('- **waterfall** — 워터폴 (증감): 라벨|증감값 (+/-)');
  lines.push('- **bullet** — 불릿 (목표 대비 실적): 라벨|실적|목표|최대?');
  lines.push('');
  lines.push('**📊 비교/분석:**');
  lines.push('- **compare** — 카드 비교: 키: 값 형식, --- 구분');
  lines.push('- **stat** — KPI 통계 카드: 라벨|값|변화(+2%)|설명');
  lines.push('- **matrix** — 히트맵 매트릭스: 헤더행(_|열1|열2)+데이터(행|값1|값2)');
  lines.push('- **quadrant** — 사분면: 축: X축|Y축 (첫줄), 라벨|x(-10~10)|y(-10~10)');
  lines.push('- **progress** — 진행률 바: 라벨|현재|목표');
  lines.push('- **dumbbell** — 덤벨 (전후 비교, 같은 축): 헤더행(_|이전|이후)+라벨|이전값|이후값');
  lines.push('');
  lines.push('**🔀 다이어그램/구조:**');
  lines.push('- **flow** — 플로우차트: A -> B 또는 A -> B | 라벨');
  lines.push('- **swimlane** — 스윔레인: 레인이름: 단계1 -> 단계2 -> 단계3');
  lines.push('- **hierarchy** — 트리 구조: 들여쓰기(2칸)로 깊이 표현');
  lines.push('- **mindmap** — 마인드맵: 첫줄=중심, 2칸들여쓰기=가지, 4칸=잎');
  lines.push('- **relation** — 관계도: A -> B | 라벨(방향) 또는 A -- B | 라벨(양방향)');
  lines.push('- **process** — 단계 프로세스: 단계명|상태(완료/진행/대기/실패)|설명?');
  lines.push('');
  lines.push('**📅 기타:**');
  lines.push('- **timeline** — 타임라인: 날짜|제목|설명');
  lines.push('- **kanban** — 칸반 보드: --- 구분, 첫줄=컬럼명, 이후=카드 항목');
  lines.push('- **changelog** — 패치 노트/변경 이력: 버전 헤더 줄 + 태그|내용 (태그: new/fix/change/remove/balance)');
  lines.push('');
  lines.push('**🎮 게임 데이터 특화:**');
  lines.push('- **tier** — 티어 리스트 (등급 랭킹): S: 항목1, 항목2 (줄바꿈으로 등급 구분)');
  lines.push('- **itemcard** — 아이템/캐릭터 카드: 키: 값 형식, --- 구분. 숫자값=스탯바 자동 생성. 이미지: URL로 카드 상단에 썸네일 표시 (이미지/image/img/썸네일/icon 키 사용)');
  lines.push('- **gallery** — 이미지 갤러리: 이미지URL|캡션|설명? (캐릭터/아이템 이미지 그리드)');
  lines.push('- **table** — 조건부 서식 테이블: 헤더행(열1|열2|...) + 데이터행. 숫자 셀은 자동 히트맵 색상');
  lines.push('- **diff** — 변경 전후 비교 (밸런스 패치): 헤더행(_|이전|이후) + 항목|이전값|이후값. 자동 증감률');
  lines.push('- **histogram** — 히스토그램 (분포): 구간|빈도');
  lines.push('- **calendar** — 캘린더 히트맵: 날짜|값|라벨?');
  lines.push('- **gantt** — 간트 차트 (일정): 작업명|시작|끝|그룹?');
  lines.push('');
  lines.push('예시 — 이미지 포함 캐릭터 카드:');
  lines.push('```');
  lines.push(':::visualizer{type="itemcard" title="신규 캐릭터"}');
  lines.push('이름: 프리드벨');
  lines.push('이미지: https://example.com/friedbel.png');
  lines.push('등급: SSR');
  lines.push('클래스: Tank');
  lines.push('속성: 화염');
  lines.push('HP: 2500');
  lines.push('ATK: 120');
  lines.push('DEF: 350');
  lines.push('---');
  lines.push('이름: 카야');
  lines.push('이미지: https://example.com/kaya.png');
  lines.push('등급: SR');
  lines.push('클래스: Damage');
  lines.push('속성: 빙결');
  lines.push('HP: 1800');
  lines.push('ATK: 280');
  lines.push('DEF: 80');
  lines.push(':::');
  lines.push('```');
  lines.push('예시 — 패치 노트:');
  lines.push('```');
  lines.push(':::visualizer{type="changelog" title="v1.2.3 패치 노트"}');
  lines.push('v1.2.3 (2026-03-13)');
  lines.push('밸런스|프리드벨 HP 2500→2200 하향');
  lines.push('밸런스|카야 ATK 280→300 상향');
  lines.push('신규|새로운 던전 "심연의 탑" 추가');
  lines.push('수정|스킬 쿨타임 표시 오류 수정');
  lines.push('삭제|기존 이벤트 "겨울 축제" 종료');
  lines.push(':::');
  lines.push('```');
  lines.push('⭐ **이미지 사용 팁**: find_resource_image로 검색한 URL을 itemcard의 이미지 필드나 gallery에 바로 사용!');
  lines.push('');
  lines.push('### 🎨 커스텀 인터랙티브 시각화 (type="html")');
  lines.push('위 42개 템플릿에 맞지 않는 **유니크한 시각화**가 필요할 때 사용.');
  lines.push('전체 HTML+CSS+JS를 직접 작성하여 완전 자유로운 인터랙티브 시각화를 생성.');
  lines.push('');
  lines.push('**사용 시점:**');
  lines.push('- 복합 인터랙티브 (슬라이더로 수치 조절, 필터, 드릴다운 등)');
  lines.push('- 게임 밸런스 시뮬레이터 (파라미터 조정 → 실시간 결과 변화)');
  lines.push('- 커스텀 대시보드 (여러 차트 + 필터 컨트롤 조합)');
  lines.push('- 데이터 탐색기 (검색/정렬/확장이 결합된 복합 UI)');
  lines.push('- 인터랙티브 튜토리얼 (클릭하면 상세 정보 전개)');
  lines.push('');
  lines.push('**작성 규칙:**');
  lines.push('```');
  lines.push(':::visualizer{type="html" title="밸런스 시뮬레이터"}');
  lines.push('<div id="app">...</div>');
  lines.push('<style>');
  lines.push('  /* 다크테마 기반: bg=#0f1117, text=#e2e8f0, accent=#818cf8 */');
  lines.push('  * { box-sizing:border-box; margin:0; }');
  lines.push('  body { font-family:-apple-system,sans-serif; color:#e2e8f0; }');
  lines.push('</style>');
  lines.push('<script>');
  lines.push('  // 바닐라 JS만 사용 (외부 라이브러리 없음)');
  lines.push('  // SVG, Canvas, CSS Grid/Flex 자유 활용');
  lines.push('  // 인터랙션: click, hover, input, range slider 등');
  lines.push('</script>');
  lines.push(':::');
  lines.push('```');
  lines.push('');
  lines.push('**디자인 가이드:**');
  lines.push('- 배경: #0f1117, 서피스: #1e293b, 보더: rgba(255,255,255,0.08)');
  lines.push('- 텍스트: #e2e8f0(주), #94a3b8(보조), #64748b(약한)');
  lines.push('- 액센트: #818cf8(보라), #34d399(녹), #f87171(적), #fbbf24(황)');
  lines.push('- border-radius:8~12px, transition:0.2~0.3s, font-size:11~13px');
  lines.push('- 인터랙티브 요소에 hover 효과 + cursor:pointer 필수');
  lines.push('- 모든 수치에 .toLocaleString() 적용');
  lines.push('');
  lines.push('⚡ 쿼리 결과 데이터를 JSON으로 <script> 안에 임베드하면 강력한 데이터 탐색기 생성 가능!');
  lines.push('');
  lines.push('### 규칙');
  lines.push('- 간단한 표/리스트는 마크다운 테이블로. 비주얼라이저는 시각적 표현이 필요할 때만!');
  lines.push('- 정형 데이터는 구조화된 타입(bar/pie/table 등)을 우선 사용.');
  lines.push('- 게임 데이터 조회 결과에 맞는 타입을 적극 활용: 밸런스 비교→diff, 등급 정리→tier, 장비/캐릭터 상세→itemcard, 스케줄→gantt');
  lines.push('- 텍스트 설명과 함께: 차트 전 설명 → 차트 → 차트 후 해석');
  lines.push('');
  lines.push('## ⚡ 최적 호출 패턴 (이터레이션 최소화)');
  lines.push('- **데이터 조회**: 위 사전주입 스키마가 있으면 → 바로 query_game_data(sql). show_table_schema 생략.');
  lines.push('- **데이터 수정**: show_table_schema + query_game_data 동시 호출(스키마 알면 생략) → edit_game_data. 최소 1~2회!');
  lines.push('- **변경 이력**: query_git_history(repo=data) + query_git_history(repo=aegis) 병렬 호출 → show_revision_diff(hash).');
  lines.push('- **단순 질문**: 스키마/데이터를 이미 알고 있으면 도구 없이 바로 텍스트 응답. 불필요한 확인 호출 금지.');
  lines.push('');

  lines.push('## 자율 워크플로 (복합 작업)');
  lines.push('⚠️ 시스템이 워크플로를 감지하면 아래 규칙이 강제 적용됩니다:');
  lines.push('');
  lines.push('### 계획 필수');
  lines.push('- 복합 작업 시작 시 :::progress 형식으로 실행 계획을 반드시 출력');
  lines.push('- 각 단계 완료 시 :::progress 업데이트');
  lines.push('- "2-3 이터레이션 최소화" 원칙 해제 — 모든 단계 완료까지 계속 실행');
  lines.push('');
  lines.push('### 편집 후 검증 필수');
  lines.push('- edit_game_data / add_game_data_rows 호출 후, 같은 턴에서 반드시:');
  lines.push('  1. FK 무결성 쿼리 (NOT IN 패턴) 또는');
  lines.push('  2. list_validation_rules → 검증 실행');
  lines.push('- 시스템이 편집 후 자동으로 FK 관련 테이블 힌트를 제공합니다');
  lines.push('');
  lines.push('### 완결성 원칙');
  lines.push('- 편집 대상의 FK 관계를 확인하고, 관련 테이블도 함께 수정할지 사용자에게 질문');
  lines.push('- "캐릭터 추가/삭제/복제" → workflow_new_content 참조');
  lines.push('- "밸런스/수치 조정" → workflow_balance_change 참조');
  lines.push('- "검증/QA/확인" → workflow_data_qa 참조');
  lines.push('- "버그 찾아줘/게임 버그/QA 해줘" → workflow_bug_hunt 참조 (코드+데이터 크로스 체크)');
  lines.push('');
  lines.push('### 맥락 유지');
  lines.push('- 이전에 편집한 테이블을 기억하고, 관련 작업이 남아있으면 proactive하게 제안');
  lines.push('');

  if (detectedWorkflow) {
    const WF_LABELS: Record<string, string> = {
      new_content: '신규 콘텐츠 추가',
      balance_change: '밸런스 조정',
      data_qa: '데이터 QA',
      game_bug_hunt: '🐛 게임 버그 헌팅',
    };
    lines.push('### ⚡ 워크플로 모드 활성화');
    lines.push(`감지된 워크플로: **${WF_LABELS[detectedWorkflow] ?? detectedWorkflow}**`);
    lines.push('이 작업은 복합 워크플로입니다. 반드시:');
    lines.push('1. 첫 응답에서 :::progress 형식으로 실행 계획을 출력');
    lines.push('2. 각 단계 완료 시 :::progress 업데이트');
    lines.push('3. "2-3 이터레이션 최소화" 원칙을 해제 — 모든 단계 완료까지 계속 실행');
    lines.push('4. 편집 후 반드시 같은 턴 내에서 검증 수행');
    lines.push('시스템이 편집 완료 시 FK 관련 테이블 힌트를 자동 제공합니다. 이를 참고하여 검증하세요.');
    lines.push('');

    if (detectedWorkflow === 'game_bug_hunt') {
      lines.push('### 🐛 버그 헌팅 특별 지시');
      lines.push('이 워크플로는 **게임 데이터 + C# 코드를 크로스 체크**하여 런타임 버그를 찾습니다.');
      lines.push('반드시 workflow_bug_hunt 널리지를 참조하여 단계별로 진행하세요.');
      lines.push('핵심: query_game_data로 데이터 수집 → search_code/read_code_file로 관련 코드 분석 → 데이터×코드 크로스 체크');
      lines.push('발견된 버그는 심각도(CRASH/LOGIC/BALANCE)별로 분류하여 리포트하세요.');
      lines.push('');
    }
  }

  // ── 바이브테이블링 규칙: edit_game_data/add_game_data_rows 포함 시에만 ──
  if (hasTools(['edit_game_data', 'add_game_data_rows'])) {
    lines.push('## 📝 바이브테이블링 (Excel 편집)');
    lines.push('데이터 수정/편집/추가 요청 시 반드시 사용.');
    lines.push('');
    lines.push('⚡ 속도 최적화 — 2~3 이터레이션으로 끝내기!');
    lines.push('⭐ 스키마를 이미 알면(사전주입/이전 턴) → 바로 edit_game_data!');
    lines.push('⭐ 모르면 → show_table_schema + query_game_data를 한번에 동시 호출 (1 이터레이션)');
    lines.push('→ 다음 이터레이션에서 바로 edit_game_data/add_game_data_rows 호출');
    lines.push('⚠️ 컬럼명 추측 금지! #메모 컬럼(#effect_memo 등)에는 한글 설명 텍스트를 채워주세요!');
    lines.push('🔴 NotNull(!) 컬럼은 빈값/null 절대 금지! 반드시 적절한 값을 채워야 합니다. 빈값 → 크래시 발생!');
    lines.push('');
    lines.push('### ⚡⚡⚡ CSV 포맷 (대량 편집/추가 시 필수!)');
    lines.push('토큰 50~70% 절약 + PK 룩업으로 처리 속도 향상. 2행 이상 편집/추가 시 반드시 CSV 사용!');
    lines.push('');
    lines.push('**edit_game_data — csv_set**: 여러 행의 값을 set으로 변경할 때');
    lines.push('```');
    lines.push('edit_plan: [{ table: "CharStat", file: "Character.xlsx", sheet: "CharStat",');
    lines.push('  csv_set: "id,hp,mp,atk\\nCHR001,1000,500,120\\nCHR002,600,1200,80" }]');
    lines.push('```');
    lines.push('첫 열=PK필터(eq), 나머지=set 값. filters/changes 생략.');
    lines.push('multiply/add/subtract/append 필요 시에만 기존 filters+changes 사용.');
    lines.push('');
    lines.push('**add_game_data_rows — csv**: 여러 행 추가할 때');
    lines.push('```');
    lines.push('{ table: "CharStat", csv: "id,name,hp,mp\\nCHR100,새전사,1000,500\\nCHR101,새마법사,600,1200" }');
    lines.push('```');
    lines.push('첫 행=헤더, 이후=값. rows 배열 대신 사용.');
    lines.push('');
    lines.push('edit_plan: [{order, table, sheet?, file?, csv_set? | (filters, changes)}]');
    lines.push('⭐ 같은 xlsx 여러 시트 → 하나의 edit_game_data에 edit_plan 배열로 모두 포함!');
    lines.push('⭐ add_game_data_rows: 기존 데이터 패턴에 맞춰서, ID 중복 없게!');
    lines.push('');
    lines.push('### 🔴🔴🔴 복제 모드 (clone_source) — 기존 데이터 기반 추가 시 반드시 사용!');
    lines.push('아래 상황에서는 무조건 clone_source를 사용하세요:');
    lines.push('- "카야 스탯 복제", "기존 캐릭터 기반으로 추가", "동일하게 복사", "N행 추가"');
    lines.push('- query_game_data로 기존 데이터를 조회한 후, 그 데이터를 기반으로 행을 추가할 때');
    lines.push('- 기존 캐릭터의 스탯/스킬/아이템을 새 캐릭터에게 복사할 때');
    lines.push('');
    lines.push('❌ 절대 금지: query로 데이터를 조회한 뒤 rows[]나 csv로 하나하나 재입력');
    lines.push('❌ 절대 금지: 10행 이상의 데이터를 rows 배열로 직접 생성');
    lines.push('✅ 올바른 방법: clone_source로 원본 지정 → Python이 자동 복사 (1초 완료)');
    lines.push('');
    lines.push('예시 1: 카야(2001)의 CharacterStat을 새 캐릭터 3001, 3002에게 복제');
    lines.push('```');
    lines.push('add_game_data_rows({');
    lines.push('  table: "CharacterStat",');
    lines.push('  clone_source: { column: "character_id", value: "2001" },');
    lines.push('  override_csv: "character_id\\n3001\\n3002"');
    lines.push('})');
    lines.push('```');
    lines.push('→ 2001의 스탯 행이 10개면, 3001용 10행 + 3002용 10행 = 총 20행 자동 생성');
    lines.push('');
    lines.push('예시 2: 동일 캐릭터에게 기존 스탯을 그대로 10행 더 추가');
    lines.push('```');
    lines.push('add_game_data_rows({');
    lines.push('  table: "CharacterStat",');
    lines.push('  clone_source: { column: "character_id", value: "2001" }');
    lines.push('  // override_csv 생략 → 원본 그대로 1회 복제');
    lines.push('})');
    lines.push('```');
    lines.push('');
    lines.push('🔴🔴🔴 절대 금지: 테이블/데이터 생략!');
    lines.push('- 데이터가 많다는 이유로 테이블을 생략하거나 "~는 생략합니다" 금지!');
    lines.push('- 데이터가 많으면 → 여러 번 나눠서 호출! (예: 1~5레벨 + 6~10레벨)');
    lines.push('- 사용자가 요청한 테이블은 100% 전부 편집/추가. 하나라도 빠지면 실패.');
    lines.push('');
    lines.push('📌 바이브테이블링 응답 스타일 (텍스트로 중계! 아티팩트 만들지 마!):');
    lines.push('- ❌❌❌ 바이브테이블링 후 create_artifact 절대 호출 금지!');
    lines.push('- ❌❌❌ 바이브테이블링 결과를 "정리/요약/종합" 명목으로 아티팩트 만드는 것도 금지!');
    lines.push('- 도구 호출 전: 수정/추가할 테이블 목록과 계획을 텍스트로 설명');
    lines.push('- 도구 호출 후: 결과를 텍스트+마크다운 표로 요약 (아티팩트 아닌 일반 텍스트!)');
    lines.push('- ⭐ 텍스트 응답 마지막에 다운로드 링크 포함! 예: "📥 [Character.xlsx](URL)"');
    lines.push('- ❌ "N행 추가됨"만 나열 금지. 실제 세팅된 주요 값을 보여줄 것.');
    lines.push('');
  }

  // ── 아티팩트 규칙: artifact 도구 포함 시에만 ──
  if (hasTools(['create_artifact', 'patch_artifact'])) {
    lines.push('## 아티팩트 생성 프로토콜 — :::visualizer와 완전히 별개!');
    lines.push('🔴 아티팩트는 사용자가 명시적으로 요청할 때만 생성하세요!');
    lines.push('- "정리해줘", "문서로 만들어줘", "보고서 작성해줘", "시트 만들어줘", "아티팩트" 등 → create_artifact');
    lines.push('- "차트로 보여줘", "시각화", "그래프" 등 → ❌ 아티팩트 아님! → :::visualizer 사용!');
    lines.push('- 🔴 아티팩트 생성 시 :::visualizer 동시 사용 절대 금지! 한 턴에 하나만!');
    lines.push('- 사용자가 명시적으로 요청하지 않은 경우 → 텍스트+마크다운 표로 응답. 아티팩트 만들지 마세요!');
    lines.push('- 질문에 대한 답변, 데이터 조회 결과 등은 텍스트로 충분합니다. 선제적으로 아티팩트를 만들지 마세요.');
    lines.push('');
    lines.push('⭐ 아티팩트 생성 시에는 **반드시** search_published_artifacts로 유사한 기존 문서를 먼저 검색하세요!');
    lines.push('- 유사한 기존 아티팩트가 있으면 → **반드시 [문서제목](./api/p/아티팩트_id) 형식 인라인 링크 포함**하여 사용자에게 제안');
    lines.push('- 예: "기존에 [AEGIS 캐릭터 종합 데이터 시트](./api/p/aegis_character_sheet) 문서가 있습니다. 갱신할까요?"');
    lines.push('- 사용자가 "갱신/수정/업데이트" 요청 시 → get_published_artifact로 기존 HTML 가져와서 create_artifact로 수정본 생성');
    lines.push('- 사용자가 기존 아티팩트를 언급/링크하면 → get_published_artifact로 가져와서 수정');
    lines.push('- 🔴 예외: edit_game_data / add_game_data_rows (바이브테이블링) 결과는 절대 아티팩트로 만들지 마세요! "정리/요약" 명목도 금지! 다운로드 링크가 결과물.');
    lines.push('<<<ARTIFACT_START>>> + HTML(body만, 다크테마 bg:#0f1117 text:#e2e8f0 accent:#6366f1) + <<<ARTIFACT_END>>> → create_artifact(title). 수정은 patch_artifact만.');
    lines.push('');
    lines.push('### 📊 아티팩트 내 차트 삽입 — <viz-chart> 태그');
    lines.push('아티팩트 HTML 안에서 차트/시각화가 필요할 때, 전체 JS/SVG를 직접 작성하지 말고 `<viz-chart>` 태그를 사용하세요!');
    lines.push('인라인 비주얼라이저와 동일한 32가지 템플릿이 자동 렌더링됩니다. **토큰 대폭 절약!**');
    lines.push('');
    lines.push('**형식:** `<viz-chart type="타입" title="제목">데이터</viz-chart>`');
    lines.push('**데이터 형식**은 인라인 비주얼라이저(:::visualizer)와 100% 동일합니다.');
    lines.push('');
    lines.push('예시:');
    lines.push('```html');
    lines.push('<h2>캐릭터 밸런스 보고서</h2>');
    lines.push('<p>시즌3 주요 캐릭터 HP 비교입니다.</p>');
    lines.push('<viz-chart type="bar" title="캐릭터 HP">');
    lines.push('프리드벨|2500');
    lines.push('카야|1800');
    lines.push('엔젤|1200');
    lines.push('</viz-chart>');
    lines.push('<p>티어 분포:</p>');
    lines.push('<viz-chart type="tier" title="시즌3 티어">');
    lines.push('S: 프리드벨, 카야');
    lines.push('A: 엔젤');
    lines.push('B: 슬라임킹');
    lines.push('</viz-chart>');
    lines.push('<viz-chart type="diff" title="1.2.3 밸런스 패치">');
    lines.push('스탯|패치 전|패치 후');
    lines.push('공격력|250|280');
    lines.push('방어력|120|100');
    lines.push('</viz-chart>');
    lines.push('```');
    lines.push('');
    lines.push('⭐ **규칙:**');
    lines.push('- 아티팩트에서 차트/그래프/시각화가 필요하면 **반드시** `<viz-chart>` 사용! 직접 JS/Canvas/Chart.js 작성 금지!');
    lines.push('- 일반 HTML(텍스트, 테이블, 카드 레이아웃 등)과 `<viz-chart>`를 자유롭게 혼합 가능');
    lines.push('- 하나의 아티팩트에 여러 `<viz-chart>` 사용 가능 (보고서에 복수 차트)');
    lines.push('- type은 인라인 비주얼라이저와 동일: bar, hbar, stack, pie, donut, line, area, radar, scatter, bubble, gauge, treemap, funnel, waterfall, histogram, bullet, compare, stat, matrix, quadrant, progress, dumbbell, diff, table, flow, swimlane, hierarchy, mindmap, process, timeline, kanban, changelog, relation, tier, itemcard, gallery, calendar, gantt');
    lines.push('');
    lines.push('임베드: data-embed="schema|query|relations|graph|diff|csv|scene|prefab|fbx-anim" 속성 사용. [[TableName]]→스키마 팝업.');
    lines.push('이미지: find_resource_image로 검색한 결과의 url 필드(전체 URL)를 <img src="...">에 사용. /api/images/... 상대경로 금지!');
    lines.push('Mermaid: \\n+4칸 들여쓰기, 노드ID=영문, 한글=["..."], 특수문자 금지.');
    lines.push('');
  }

  // ── Jira 규칙: jira 도구 포함 시에만 ──
  if (hasTools(['search_jira', 'get_jira_issue', 'create_jira_issue', 'add_jira_comment']) || hasTools(['add_confluence_comment'])) {
    lines.push('## Jira/Confluence');
    lines.push('프로젝트: AEGIS. JQL 날짜필터 자동추가 금지. AEGIS-1234 언급→get_jira_issue 즉시 호출.');
    lines.push('이슈 생성: create_jira_issue(summary). Jira 댓글: add_jira_comment(issueKey, comment). 상태변경: update_jira_issue_status.');
    lines.push('⭐⭐⭐ Confluence 댓글: add_confluence_comment(pageIdOrUrl, comment) — Confluence 페이지에 댓글을 직접 작성할 수 있습니다!');
    lines.push('- URL 구분: /browse/KEY-123 = Jira 이슈 → add_jira_comment, /wiki/spaces/.../pages/ID = Confluence → add_confluence_comment');
    lines.push('- "쓰기 불가", "API가 없다", "직접 할 수 없다" 절대 금지! 두 도구 모두 즉시 사용 가능!');
    lines.push('### Confluence 검색 패턴');
    lines.push('- **자연어 검색**: search_confluence(query: "캐릭터 밸런스") → 자동 CQL 변환');
    lines.push('- **Space 필터**: search_confluence(query: "기획서", space: "AEGIS")');
    lines.push('- **직접 CQL**: search_confluence(cql: \'type="page" AND text~"스킬" AND space="AEGIS"\')');
    lines.push('- 검색 결과에서 페이지 내용이 필요하면 get_confluence_page(pageId) 추가 호출');
    lines.push('- query만 넘기면 됨. CQL 문법 몰라도 OK.');
    lines.push('### ⚠️ Confluence URL 감지 (필수)');
    lines.push('- 사용자가 atlassian.net/wiki 또는 confluence URL을 붙여넣으면 **반드시 get_confluence_page(pageId)** 사용');
    lines.push('- URL에서 pageId 추출: .../pages/926910300/... → pageId="926910300"');
    lines.push('- **절대 read_url이나 web_search로 Confluence 페이지를 읽지 마라** (인증 실패함)');
    lines.push('- Confluence 페이지는 get_confluence_page만 접근 가능 (API 토큰 인증 자동 처리)');
    lines.push('');
  }

  // ── 캐릭터 규칙: build_character_profile 포함 시에만 ──
  if (hasTools(['build_character_profile'])) {
    lines.push('## 캐릭터 기획서');
    lines.push('build_character_profile 먼저 호출. [EMBED_SQL] 힌트→data-embed="query" 활용. 기획서=카드, 시트뷰=탭 레이아웃.');
    lines.push('');
  }

  // ── Git 규칙: git 도구 포함 시에만 ──
  if (hasTools(['query_git_history', 'show_revision_diff'])) {
    lines.push('## Git 이력 분석 (2개 저장소)');
    lines.push('- **data 저장소** (기본): xlsx 원본 데이터. 경로 예시: "GameData/Data/Character"');
    lines.push('- **aegis 저장소**: 엔진 코드 + xlsx→C# 파싱 결과. 경로 예시: "ReferenceTable/RefCharacter.cs"');
    lines.push('- 데이터 변경 질문 시 → **양쪽 모두** 조회해야 완전한 이력을 제공 가능');
    lines.push('  1. query_git_history(repo="data", filter_path="GameData/Data/테이블명") — xlsx 원본 수정');
    lines.push('  2. query_git_history(repo="aegis", filter_path="ReferenceTable/Ref테이블명") — 파싱된 C# 코드 변경');
    lines.push('- 커밋 목록 확인 후 → show_revision_diff(commit_hash, repo=해당repo)로 상세 diff 표시');
    lines.push('- xlsx 자체는 바이너리라 diff 불가 → aegis 쪽 Ref*.cs diff가 실제 데이터 변경 내용을 보여줌');
    lines.push('- 양쪽 이력을 교차 분석하면 "언제 데이터가 바뀌었고, 엔진에 언제 반영됐는지" 파악 가능');
    lines.push('- 결과를 아티팩트로 정리하면 더 좋음 (패치노트/변경 이력 문서)');
    lines.push('');
  }

  // ── 코드 규칙: code 도구 포함 시에만 ──
  if (hasTools(['search_code', 'read_code_file'])) {
    lines.push('## 코드 분석');
    lines.push('read_guide("_OVERVIEW") → 도메인 가이드 → search_code → read_code_file 순서.');
    lines.push('');
  }

  // ── 웹 검색 규칙: web 도구 포함 시에만 ──
  if (hasTools(['web_search', 'read_url'])) {
    lines.push('## 웹 검색');
    lines.push('외부 레퍼런스 필요 시 web_search(query). URL 직접 제공 시 read_url(url).');
    lines.push('');
  }
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
      // FK는 질문 관련 테이블이 사전주입에 이미 포함되어 있으므로 전체 목록은 초압축
      // show_table_schema 호출 시 상세 FK를 알 수 있으므로 여기서는 개수만 표시
      const refsByFrom = new Map<string, number>();
      for (const r of schema.refs) {
        const from = nameById.get(r.fromTable) ?? r.fromTable;
        refsByFrom.set(from, (refsByFrom.get(from) ?? 0) + 1);
      }
      const topFKTables = [...refsByFrom.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      lines.push(`## FK 관계 (${schema.refs.length}개, 상세: show_table_schema 또는 위 사전주입 참고)`);
      lines.push(`주요: ${topFKTables.map(([t, n]) => `${t}(${n})`).join(', ')}`);
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

  // ── 질문에서 언급된 테이블의 컬럼을 사전 주입 (show_table_schema 호출 절약) ──
  if (schema && _userQuery) {
    const q = _userQuery.toLowerCase();
    const mentionedTables = schema.tables.filter(t => {
      const nameLow = t.name.toLowerCase();
      const aliasLow = t.alias?.toLowerCase() ?? '';
      return q.includes(nameLow) || (aliasLow && q.includes(aliasLow));
    });
    if (mentionedTables.length > 0 && mentionedTables.length <= 5) {
      const nameById = new Map(schema.tables.map(t => [t.id, t.name]));
      lines.push(`## 🎯 질문 관련 테이블 스키마 (사전주입 — 바로 query_game_data 가능)`);
      for (const t of mentionedTables) {
        const cols = t.columns.map(c => {
          let s = c.name;
          if (c.isPrimaryKey) s += '*';
          else if (c.isForeignKey) s += '^';
          if (c.isNotNull && !c.isPrimaryKey) s += '!';
          return s;
        }).join(',');
        const fks = schema.refs
          .filter(r => r.fromTable === t.id)
          .map(r => `${r.fromColumns[0]}>${nameById.get(r.toTable) ?? r.toTable}`)
          .join(',');
        const rowCount = tableData.get(t.name)?.rows.length ?? '?';
        const reservedNote = RESERVED_TABLE_NAMES.has(t.name.toUpperCase()) ? ` SQL:__u_${t.name}` : '';
        lines.push(`${t.name}(${rowCount}${reservedNote}):${cols}${fks ? `|FK:${fks}` : ''}`);
      }
      lines.push('(*=PK ^=FK !=NotNull)');
      lines.push('');
    }
  }

  lines.push('## SQL 규칙');
  lines.push('테이블명 대소문자 무시. #컬럼→백틱(`#col`). 값=문자열(WHERE id=\'1001\'). 숫자비교=CAST(col AS NUMBER). AS별칭=영문만(한글 AS 절대금지).');
  lines.push('⭐ 질문 관련 테이블 스키마가 위에 포함되어 있으면 show_table_schema 호출 없이 바로 query_game_data 호출.');
  lines.push('');
  lines.push('## Enum 조회 (가상테이블 ENUMS)');
  lines.push(VIRTUAL_TABLE_SCHEMA);
  lines.push('SELECT * FROM ENUMS WHERE enum_name=\'이름\'. ⛔ FROM Enum (예약어), FROM __u_enum 절대 금지.');
  lines.push('');

  // 예약어 테이블 목록 (질문 관련 사전주입에 이미 ⚠️ 표시했으므로 간소화)
  const reservedTableNames: string[] = [];
  for (const [key] of tableData) {
    if (RESERVED_TABLE_NAMES.has(key.toUpperCase())) reservedTableNames.push(key);
  }
  if (reservedTableNames.length > 0) {
    lines.push(`## ⛔ alasql 예약어: ${reservedTableNames.map(k => `${k}→__u_${k}`).join(', ')}`);
  }

  if (anomalyPrompt) {
    lines.push('');
    lines.push(anomalyPrompt);
  }

  if (validationPrompt) {
    lines.push('');
    lines.push(validationPrompt);
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
  | { role: 'user'; content: Array<Record<string, unknown>> }
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
): Promise<ClaudeResponse & { usage?: TokenUsage; _streamedArtifactHtml?: string; _streamAborted?: boolean }> {
  // ── 자동 재시도 + 429 모델 폴백 체인 (현재 선택 모델 이후부터) ──
  const ALL_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
  const currentModel = (requestBody as Record<string, unknown>).model as string || 'claude-opus-4-6';
  const currentIdx = ALL_MODELS.indexOf(currentModel);
  const MODEL_FALLBACK_CHAIN = ALL_MODELS.filter((_, i) => i > currentIdx);
  const MAX_RETRIES = 5;
  const RETRY_DELAYS = [2000, 5000, 10000, 20000, 30000];
  let response!: Response;
  let fallbackIdx = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-TM-Knowledge': 'injected' },
        body: JSON.stringify({ ...requestBody, stream: true }),
      });

      if (response.ok) break;

      // 429 Rate Limit → 모델 폴백 체인: Opus → Sonnet → Haiku → 대기 후 재시도
      if (response.status === 429) {
        const currentModel = String((requestBody as Record<string, unknown>).model ?? '');
        if (fallbackIdx < MODEL_FALLBACK_CHAIN.length) {
          const nextModel = MODEL_FALLBACK_CHAIN[fallbackIdx++];
          const label = nextModel.includes('sonnet') ? 'Sonnet' : nextModel.includes('haiku') ? 'Haiku' : nextModel;
          console.warn(`[streamClaude] ⚠️ 429 (${currentModel}) → ${label}로 폴백`);
          onTextDelta(`\n⏳ Rate Limit (${currentModel.split('-').slice(0, 2).join('-')}) — ${label}로 자동 전환합니다...\n`);
          (requestBody as Record<string, unknown>).model = nextModel;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        // 모든 모델 소진 → 대기 후 현재 모델로 재시도
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
          console.warn(`[streamClaude] ⚠️ 429 모든 모델 제한 — ${delay / 1000}초 대기 후 재시도`);
          onTextDelta(`\n⏳ 모든 모델 Rate Limit — ${delay / 1000}초 후 재시도합니다... (${attempt + 1}/${MAX_RETRIES})\n`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }

      if (response.status === 529 || response.status === 503 || response.status === 502 || response.status === 504) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
          const label = response.status === 504 ? 'Gateway Timeout' : 'Overloaded';
          console.warn(`[streamClaude] ⚠️ ${response.status} ${label} — ${delay / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
          onTextDelta(`\n⏳ ${label} (${response.status}) — ${delay / 1000}초 후 자동 재시도합니다... (${attempt + 1}/${MAX_RETRIES})\n`);
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

  // 빠른 모델(Haiku/Sonnet)은 모든 text_delta가 한 청크에 도착하므로
  // React가 중간 렌더를 할 수 없음 → text_delta 후 이벤트 루프 양보 필요
  const reqModel = String((requestBody as Record<string, unknown>).model ?? '');
  const _needsStreamYield = reqModel.includes('haiku') || reqModel.includes('sonnet');

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
  let _textDeltaCount = 0;
  let _streamAborted = false;
  const _streamStart = performance.now();
  if (_needsStreamYield) console.log(`[streamClaude] 🔀 Fast model (${reqModel}) — streaming yield enabled`);
  try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    _readCount++;
    const chunk = decoder.decode(value, { stream: true });
    buf += chunk;

    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      // SSE event: 타입 추적 (error 이벤트 감지용)
      if (line.startsWith('event: ')) {
        lastEventType = line.slice(7).trim();
        if (lastEventType === 'ping') { lastEventType = ''; continue; }
        continue;
      }

      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]' || raw === '{}') continue;

      let ev: Record<string, unknown>;
      try { ev = JSON.parse(raw); } catch { continue; }

      if (ev.type === 'ping' || (!ev.type && Object.keys(ev).length === 0)) continue;

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
            // patch_artifact 블록 시작 → 아티팩트 패널 오픈
            // create_artifact는 텍스트 마커에서 이미 패널 오픈되므로, 마커가 없을 때만 여기서 오픈
            if ((cb as ToolUseBlock).name === 'patch_artifact' && onArtifactProgress) {
              onArtifactProgress('', '', 0, '');
            }
            if ((cb as ToolUseBlock).name === 'create_artifact' && onArtifactProgress && !_artStreamedHtml && _artMarkerState === 'idle') {
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
            _textDeltaCount++;
            processTextForArtifact(delta.text ?? '');
            if (_needsStreamYield) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise<void>(r => { setTimeout(r, 20); });
            }
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
  } catch (streamErr) {
    _streamAborted = true;
    console.warn(`[streamClaude] ⚠️ 스트림 중단 (네트워크/504): ${streamErr}`);
    onTextDelta('\n⚠️ 연결이 끊겼습니다. 부분 결과를 보존합니다...\n');
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
    console.warn(`[ArtTextStream] ⚠️ 스트림 종료 but <<<ARTIFACT_END>>> 미수신 → HTML ${_artStreamedHtml.length}자 강제 확정`);
    if (onArtifactProgress) {
      onArtifactProgress(_artStreamedHtml, '', _artStreamedHtml.length, '');
    }
  }

  const _streamElapsed = performance.now() - _streamStart;
  console.log(`[streamClaude] ✅ ${reqModel} — ${_readCount} reads, ${_textDeltaCount} text deltas, ${Math.round(_streamElapsed)}ms`);

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

  return {
    content: contentArray,
    stop_reason: _streamAborted ? 'stream_aborted' as ClaudeResponse['stop_reason'] : stopReason,
    usage,
    _streamedArtifactHtml: _artStreamedHtml || undefined,
    _streamAborted,
  };
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
  confluence_search: 'search_confluence', confluence_page: 'get_confluence_page', confluence_comment: 'add_confluence_comment',
  web_search: 'web_search', web_read: 'read_url',
  bible_tabling_edit: 'edit_game_data', bible_tabling_add_rows: 'add_game_data_rows',
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
      duration: ('duration' in tc ? (tc as unknown as Record<string, unknown>).duration as number | undefined : undefined),
      error: !!('error' in tc && (tc as unknown as Record<string, unknown>).error),
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
  /** API가 보고한 input_tokens 합계 (캐시 미포함, 과금용) */
  total_input: number;
  total_output: number;
  total_tokens: number;
  /** 캐시 포함 실제 논리적 입력 토큰 = input_tokens + cache_read + cache_creation */
  total_input_logical: number;
  system_prompt_estimate: number;
  /** 실제 사용된 모델 (라우팅 결과) */
  model?: string;
  /** 스마트 라우팅으로 다운그레이드 되었는지 */
  routedDown?: boolean;
}

// ── 널리지 인메모리 캐시 (30초 TTL) ────────────────────────────────────────
// 매 메시지마다 API 2~N회 호출하던 것을 캐시에서 즉시 반환
let _knowledgeCache: { entries: { name: string; sizeKB: number; content: string }[]; ts: number } | null = null;
const KNOWLEDGE_CACHE_TTL = 30_000; // 30초

export async function getKnowledgeEntries(): Promise<{ name: string; sizeKB: number; content: string }[]> {
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

// ── FastPath: 간단한 질문에 대한 로컬 즉답 (API 호출 없음) ──────────────────
// 스키마/데이터 조회, 사용법 등 로컬 데이터만으로 답할 수 있는 질문을 감지하여 즉시 응답

export async function tryFastPath(
  userMessage: string,
  schema: ParsedSchema | null,
  tableData: TableDataMap,
): Promise<{ content: string; toolCalls: ToolCallResult[] } | null> {
  const msg = userMessage.trim();
  const effectiveSchema = schema ?? useSchemaStore.getState().schema;
  if (!effectiveSchema) return null;

  const tables = effectiveSchema.tables;
  const refs = effectiveSchema.refs;
  const nameById = new Map(tables.map(t => [t.id, t.name]));

  // ── 1. 테이블 목록 (정확한 명령만) ──
  if (/^(테이블|table)\s*(목록|리스트|list|몇\s*개|갯수|개수|전체)\s*[?？.!]*$/i.test(msg) ||
      /^(전체|모든)\s*테이블\s*[?？.!]*$/i.test(msg)) {
    const groups = new Map<string, string[]>();
    for (const t of tables) {
      const g = t.groupName ?? '기타';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(t.name);
    }
    let text = `📋 **전체 테이블 ${tables.length}개**\n\n`;
    for (const [group, names] of groups) {
      text += `**${group}** (${names.length}개)\n`;
      text += names.map(n => {
        const td = tableData.get(n);
        const rowCount = td ? td.rows.length : 0;
        return `- ${n}${rowCount > 0 ? ` (${rowCount}행)` : ''}`;
      }).join('\n') + '\n\n';
    }
    return { content: text, toolCalls: [] };
  }

  // ── 2. 특정 테이블 스키마 (정확한 명령만: "X 컬럼", "X 스키마", "describe X") ──
  const schemaMatch = msg.match(/^(.+?)\s*(테이블\s+)?(컬럼|필드|스키마|column|field|schema|구조)\s*[?？.!]*$/i)
    ?? msg.match(/^(show|describe|desc)\s+(\w+)\s*[;]?$/i);
  if (schemaMatch) {
    const tblName = (schemaMatch[1] || schemaMatch[2] || '').trim();
    const info = resolveTableSchema(tblName, effectiveSchema);
    if (info) {
      const tc: SchemaCardResult = {
        kind: 'schema_card',
        tableName: info.name,
        tableInfo: info,
      };
      let text = `📊 **${info.name}** 테이블 — ${info.columns.length}개 컬럼`;
      if (info.group) text += ` (${info.group})`;
      if (info.note) text += `\n> ${info.note}`;
      const td = tableData.get(info.name);
      if (td && td.rows.length > 0) text += `\n\n데이터: ${td.rows.length}행`;
      return { content: text, toolCalls: [tc] };
    }
  }

  // ── 3. 데이터 미리보기 (정확한 명령만: "X 데이터", "X 샘플", "X 미리보기") ──
  const previewMatch = msg.match(/^(.+?)\s*(테이블\s+)?(데이터|미리\s*보기|preview|샘플)\s*[?？.!]*$/i);
  if (previewMatch) {
    const tblName = (previewMatch[1] || '').trim();
    const lower = tblName.toLowerCase();
    const tbl = tables.find(t => t.name.toLowerCase() === lower || t.alias?.toLowerCase() === lower);
    if (tbl) {
      const td = tableData.get(tbl.name);
      if (td && td.rows.length > 0) {
        const MAX_PREVIEW = 10;
        const MAX_CELL = 30;
        const previewRows = td.rows.slice(0, MAX_PREVIEW);
        const headers = td.headers;
        const displayRows = previewRows.map((r: Record<string, string>) => {
          const row: Record<string, string> = {};
          for (const h of headers) {
            const v = String(r[h] ?? '');
            row[h] = v.length > MAX_CELL ? v.slice(0, MAX_CELL) + '…' : v;
          }
          return row;
        });
        const tc: DataQueryResult = {
          kind: 'data_query',
          sql: `SELECT * FROM ${tbl.name} LIMIT ${MAX_PREVIEW}`,
          columns: headers,
          rows: displayRows as Row[],
          rowCount: td.rows.length,
        };
        return {
          content: `📊 **${tbl.name}** 데이터 미리보기 (${td.rows.length}행 중 상위 ${Math.min(MAX_PREVIEW, td.rows.length)}행)`,
          toolCalls: [tc],
        };
      }
    }
  }

  // ── 4. FK/관계 조회 (정확한 명령만: "X 관계", "X FK") ──
  if (/^(.+?)\s*(의?\s*)(관계|FK|외래키|참조)\s*[?？.!]*$/i.test(msg)) {
    const m = msg.match(/^(.+?)\s*(의?\s*)(관계|FK|외래키|참조)\s*[?？.!]*$/i);
    if (m) {
      const tblName = m[1].trim();
      const info = resolveTableSchema(tblName, effectiveSchema);
      if (info && info.relations.length > 0) {
        let text = `🔗 **${info.name}** 관계 (${info.relations.length}개)\n\n`;
        for (const r of info.relations) {
          const arrow = r.direction === 'out' ? '→' : '←';
          text += `- ${arrow} **${r.table}** (${r.fromCol} ${r.relType} ${r.toCol})\n`;
        }
        return { content: text, toolCalls: [] };
      }
    }
  }

  // ── 5. 행 수 / 데이터 통계 (정확한 명령만) ──
  if (/^(데이터|행)\s*(수|통계|현황|요약)\s*[?？.!]*$/i.test(msg) ||
      /^(data|row)\s*(count|stat|summary)\s*[?？.!]*$/i.test(msg)) {
    const sorted = tables
      .map(t => ({ name: t.name, group: t.groupName ?? '기타', rows: tableData.get(t.name)?.rows.length ?? 0 }))
      .sort((a, b) => b.rows - a.rows);
    const totalRows = sorted.reduce((s, t) => s + t.rows, 0);
    const withData = sorted.filter(t => t.rows > 0);
    let text = `📊 **데이터 현황** — ${tables.length}개 테이블, ${totalRows.toLocaleString()}행\n\n`;
    text += `데이터 있는 테이블: ${withData.length}개\n\n`;
    if (withData.length > 0) {
      text += '| 테이블 | 그룹 | 행 수 |\n|--------|------|------|\n';
      for (const t of withData.slice(0, 30)) {
        text += `| ${t.name} | ${t.group} | ${t.rows.toLocaleString()} |\n`;
      }
      if (withData.length > 30) text += `\n... 외 ${withData.length - 30}개 테이블`;
    }
    return { content: text, toolCalls: [] };
  }

  // ── 6. 사용법 / 도움말 ──
  if (/^(도움말?|help|사용법|사용\s*방법)\s*[?？.!]*$/i.test(msg) ||
      /^(즉답|빠른\s*명령|명령어|커맨드)\s*(목록|리스트|list)?\s*[?？.!]*$/i.test(msg)) {
    const text = `## ⚡ 즉답 명령어 (API 호출 없이 즉시 응답)\n\n` +
      `| 분류 | 명령어 | 예시 |\n` +
      `|------|--------|------|\n` +
      `| 테이블 목록 | \`테이블 목록\`, \`전체 테이블\` | 테이블 목록 |\n` +
      `| 스키마 조회 | \`{테이블명} 컬럼\`, \`{테이블명} 스키마\` | Character 컬럼 |\n` +
      `| 데이터 미리보기 | \`{테이블명} 데이터\`, \`{테이블명} 샘플\` | Skill 데이터 |\n` +
      `| FK/관계 | \`{테이블명} FK\`, \`{테이블명} 관계\` | Character FK |\n` +
      `| 데이터 통계 | \`데이터 통계\`, \`행 수\` | 데이터 현황 |\n` +
      `| Enum 조회 | \`{이름} enum\`, \`{이름} 이넘\` | WeaponType enum |\n` +
      `| 그룹 목록 | \`그룹 목록\`, \`전체 그룹\` | 그룹 리스트 |\n` +
      `| 검증 실행 | \`검증 실행\`, \`검증 돌려\` | 검증 실행 |\n` +
      `| 검증 룰 | \`룰 목록\`, \`검증 룰 리스트\` | 룰 목록 |\n` +
      `| 도움말 | \`도움말\`, \`help\`, \`명령어\` | 도움말 |\n\n` +
      `> 위 명령은 **정확한 형식**으로 입력해야 작동합니다.\n` +
      `> 그 외 모든 질문은 AI(Claude)가 답변합니다.`;
    return { content: text, toolCalls: [] };
  }

  // ── 7. enum 조회 (정확한 명령만: "X enum", "X 이넘") ──
  const enumMatch = msg.match(/^(.+?)\s*(enum|이넘|열거)\s*[?？.!]*$/i);
  if (enumMatch) {
    const enumName = enumMatch[1].trim().toLowerCase();
    const found = effectiveSchema.enums.find(e => e.name.toLowerCase() === enumName || e.name.toLowerCase().includes(enumName));
    if (found) {
      let text = `📌 **${found.name}** enum (${found.values.length}개 값)\n\n`;
      for (const v of found.values.slice(0, 50)) {
        text += `- \`${v.name}\`${v.note ? ` — ${v.note}` : ''}\n`;
      }
      if (found.values.length > 50) text += `\n... 외 ${found.values.length - 50}개`;
      return { content: text, toolCalls: [] };
    }
  }

  // ── 8. 그룹 조회 (정확한 명령만) ──
  if (/^(그룹|group)\s*(목록|리스트|list)\s*[?？.!]*$/i.test(msg) ||
      /^(전체|모든)\s*그룹\s*[?？.!]*$/i.test(msg)) {
    const groups = effectiveSchema.tableGroups;
    if (groups.length > 0) {
      let text = `📁 **테이블 그룹 ${groups.length}개**\n\n`;
      for (const g of groups) {
        text += `- **${g.name}** (${g.tables.length}개 테이블)`;
        if (g.note) text += ` — ${g.note}`;
        text += '\n';
      }
      return { content: text, toolCalls: [] };
    }
  }

  // Git 변경점/디프 질문 → FastPath 안 함 (Claude AI가 양쪽 레포를 깊이 분석하도록)

  // ── 검증 실행 / 룰 목록 (정확한 명령만) ──
  if (/^(전체\s*)?(데이터\s*)?(검증|밸리데이션|validation)\s*(실행|해줘|해봐|돌려|run|ㄱㄱ)\s*[.!~]*$/i.test(msg) ||
      /^(검증|밸리데이션)\s*(결과|위반|현황|상태)\s*[?？.!]*$/i.test(msg) ||
      /^검증\s*(실행|돌려)\s*[.!~]*$/i.test(msg)) {
    const { fetchRulesFromServer, runValidation } = await import('./validationEngine.ts');
    const rules = await fetchRulesFromServer();
    if (rules.length === 0) {
      return {
        content: '🛡️ **등록된 검증 룰이 없습니다.**\n\n채팅으로 룰을 등록해보세요:\n- "캐릭터 HP는 0보다 커야 해"\n- "스킬 쿨타임은 0.1~300 사이"\n- "아이템 이름은 비어있으면 안 돼"\n- "min_damage ≤ max_damage"',
        toolCalls: [],
      };
    }
    if (tableData.size === 0) {
      return { content: '🛡️ 데이터가 아직 로드되지 않았습니다. 먼저 Import 해주세요.', toolCalls: [] };
    }
    const result = runValidation(tableData, rules);
    useCanvasStore.getState().setValidationResult(result);

    const enabled = rules.filter(r => r.enabled).length;
    let text = `🛡️ **데이터 유효성 검증 완료** (${result.durationMs.toFixed(0)}ms)\n\n`;
    text += `📋 룰: ${rules.length}개 (활성 ${enabled}개), 검증 대상: ${result.checkedRules}개 룰\n\n`;

    if (result.violations.length === 0) {
      text += '✅ **위반 없음!** 모든 데이터가 룰을 통과했습니다.\n';
    } else {
      const errCount = result.violations.filter(v => v.severity === 'error').length;
      const warnCount = result.violations.filter(v => v.severity === 'warning').length;
      text += `⚠️ **${result.violations.length}건 위반** (🔴 error ${errCount}, 🟡 warning ${warnCount})\n\n`;

      const byRule = new Map<string, typeof result.violations>();
      for (const v of result.violations) {
        if (!byRule.has(v.ruleName)) byRule.set(v.ruleName, []);
        byRule.get(v.ruleName)!.push(v);
      }
      for (const [ruleName, vs] of byRule) {
        const icon = vs[0].severity === 'error' ? '🔴' : '🟡';
        text += `${icon} **${ruleName}** — ${vs.length}건\n`;
        for (const v of vs.slice(0, 5)) {
          text += `  - \`${v.table}\` id=${v.rowId}: ${v.details}\n`;
        }
        if (vs.length > 5) text += `  - _... 외 ${vs.length - 5}건_\n`;
        text += '\n';
      }
    }

    text += '\n💡 룰 관리: "검증 룰 목록", "룰 삭제해줘", "새 룰 등록해줘"';
    return { content: text, toolCalls: [] };
  }

  // ── 검증 룰 목록 (정확한 명령만) ──
  if (/^(검증\s*)?룰\s*(목록|리스트|list)\s*[?？.!]*$/i.test(msg) ||
      /^(validation\s*)?rules?\s*(list)?\s*$/i.test(msg)) {
    const { fetchRulesFromServer, rulesToSummary } = await import('./validationEngine.ts');
    const rules = await fetchRulesFromServer();
    if (rules.length === 0) {
      return {
        content: '🛡️ **등록된 검증 룰이 없습니다.**\n\n채팅으로 룰을 등록해보세요:\n- "캐릭터 HP는 0보다 커야 해"\n- "스킬 쿨타임은 0.1~300 사이"',
        toolCalls: [],
      };
    }
    return { content: rulesToSummary(rules), toolCalls: [] };
  }

  return null;
}

function detectWorkflow(query: string): 'new_content' | 'balance_change' | 'data_qa' | 'game_bug_hunt' | null {
  if (/추가|등록|세팅|새.*캐릭|새.*스킬|새.*아이템|신규|복제|클론/i.test(query)) return 'new_content';
  if (/밸런스|상향|하향|너프|버프|수치.*조정|HP|ATK|배율/i.test(query)) return 'balance_change';
  if (/버그.*찾|버그.*헌팅|게임.*버그|QA.*해|코드.*데이터.*비교|런타임.*버그|크래시.*찾/i.test(query)) return 'game_bug_hunt';
  if (/QA|검증|이상|무결성|데이터.*확인|깨진|orphan/i.test(query)) return 'data_qa';
  return null;
}

// ── 대화 서머라이제이션 ─────────────────────────────────────────────────────
const SUMMARY_THRESHOLD = 12;
const KEEP_RECENT = 6;
const SUMMARY_MAX_CHARS = 800;

/**
 * 오래된 대화 턴을 Haiku로 요약하여 장기 기억 + 토큰 절감.
 * 이전 요약이 있으면 누적 요약 (rolling summary).
 */
export async function summarizeConversation(
  oldTurns: ChatTurn[],
  existingSummary?: string,
): Promise<string> {
  const turnsText = oldTurns.map(t => {
    const role = t.role === 'user' ? '사용자' : 'AI';
    const tools = t.toolCalls?.length
      ? ` [도구: ${t.toolCalls.map(tc => tc.kind).join(', ')}]`
      : '';
    return `${role}: ${t.content.slice(0, 400)}${t.content.length > 400 ? '...' : ''}${tools}`;
  }).join('\n');

  const existingBlock = existingSummary
    ? `\n\n<기존 요약>\n${existingSummary}\n</기존 요약>\n\n위 기존 요약에 아래 새 대화 내용을 통합하여 하나의 요약으로 만드세요.`
    : '';

  const summaryPrompt = `당신은 대화 요약 전문가입니다. 아래 대화를 ${SUMMARY_MAX_CHARS}자 이내로 요약하세요.
${existingBlock}

<대화 내용>
${turnsText}
</대화 내용>

요약 규칙:
- 핵심 사실, 결정사항, 편집한 테이블/데이터, 사용자 선호/지시를 우선 보존
- 구체적 수치, 테이블명, 컬럼명 등 고유명사는 보존
- 대화의 목적과 진행 상황을 명확히
- 불필요한 인사말, 중간 과정 설명은 생략
- 한국어로 작성`;

  try {
    const resp = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: [{ type: 'text', text: '대화 요약 전문가. 간결하고 핵심만 보존.' }],
        messages: [{ role: 'user', content: summaryPrompt }],
        stream: false,
      }),
    });
    if (!resp.ok) throw new Error(`Summarization API ${resp.status}`);
    const data = await resp.json();
    const text = data?.content?.[0]?.text ?? '';
    return text.slice(0, SUMMARY_MAX_CHARS);
  } catch {
    return existingSummary ?? '';
  }
}

export { SUMMARY_THRESHOLD, KEEP_RECENT };

export interface ChatImage {
  data: string;        // base64
  media_type: string;  // image/png, image/jpeg, etc.
}

type RoutingTier = 'opus' | 'sonnet' | 'haiku';

/**
 * 질문 복잡도 3단계 분류
 * - haiku: 인사, 감사, 잡담 등 (도구 불필요)
 * - sonnet: 단순 질문, 짧은 조회 (가벼운 도구 1~2회)
 * - opus: 복잡한 분석, 다단계 도구, 아티팩트 생성 등
 */
function classifyQueryComplexity(
  msg: string,
  history: ChatTurn[],
  tools: Array<{ name: string }>,
  images?: ChatImage[],
): RoutingTier {
  const trimmed = msg.trim();

  // ── Haiku 판별: 도구가 전혀 필요 없는 가벼운 대화 ──
  const HAIKU_PATTERNS = [
    /^(안녕|하이|헬로|hello|hi|hey)\b/i,
    /^(고마워|감사|ㄳ|땡큐|thanks|thank you)/i,
    /^(ㅎㅎ|ㅋㅋ|ㅇㅇ|ㅇㅋ|ㄴㄴ|넵|네|응|ㅇ|ok|ㅎ|ㅋ)+$/i,
    /^(잘 ?했어|좋아|좋네|오키|알겠어|알았어|그래|ㅎ)/,
    /^(수고|잘 ?자|바이|bye)/i,
    /^(뭐해|뭐 ?하고 ?있어|심심)/,
    /^.{1,15}$/,  // 15자 이하 초단문
  ];
  const isGreetingContext = history.length <= 2;
  if (isGreetingContext && HAIKU_PATTERNS.some(p => p.test(trimmed))) return 'haiku';
  if (/^(ㅎㅎ|ㅋㅋ|ㅇㅇ|ㅇㅋ|넵|네|응|ㅎ|ㅋ|ok)+$/i.test(trimmed)) return 'haiku';

  // ── Opus 판별: 복잡한 작업 ──
  if (images && images.length > 0) return 'opus';

  const COMPLEX_PATTERNS = [
    /아티팩트/, /바이블/, /테이블링/, /밸런스.*조정/, /분석해/, /전체.*조회/,
    /비교해/, /요약해/, /정리해/, /리팩토링/, /최적화/, /설계/,
    /보고서/, /문서.*만들/, /릴리즈.*노트/, /시트.*만들/,
    /수정해/, /편집해/, /추가해/, /삭제해/, /변경해/,
    /이어서.*생성/, /계속해/, /FK.*무결성/, /검증/,
    /코드.*분석/, /쿼리.*짜/, /SQL.*작성/, /시각화/,
    /Jira/, /Confluence/, /이슈.*만들/, /티켓/,
    /3[dD]/, /모델링/, /씬.*뷰/, /프리팹/,
  ];
  if (COMPLEX_PATTERNS.some(p => p.test(msg))) return 'opus';

  const heavyTools = ['edit_game_data', 'add_game_data_rows', 'create_artifact', 'patch_artifact',
    'jira_create_issue', 'jira_search', 'confluence_search', 'web_search'];
  if (tools.some(t => heavyTools.includes(t.name)) && msg.length > 100) return 'opus';
  if (msg.length > 300) return 'opus';
  if (history.length > 10) return 'opus';

  // ── Sonnet 판별: 단순하지만 데이터 관련 질문 ──
  const SIMPLE_PATTERNS = [
    /^.{0,50}\?$/,
    /뭐야/, /뭔가요/, /뭐지/, /알려줘/, /설명해/,
    /몇 ?개/, /몇 ?명/, /얼마/, /어디/, /언제/, /누구/,
    /있어\?/, /있나요/, /있나\?/, /있니/,
    /맞아\?/, /맞나요/, /인가요/, /인가\?/,
    /차이/, /다른 ?점/, /의미/, /뜻/,
  ];
  if (SIMPLE_PATTERNS.some(p => p.test(msg))) return 'sonnet';

  return msg.length <= 150 ? 'sonnet' : 'opus';
}

const ROUTING_LABELS: Record<RoutingTier, { model: ClaudeModelId; label: string; saving: string }> = {
  haiku:  { model: 'claude-haiku-4-5-20251001', label: 'Haiku',  saving: '~97% 비용 절감' },
  sonnet: { model: 'claude-sonnet-4-6',          label: 'Sonnet', saving: '~80% 비용 절감' },
  opus:   { model: 'claude-opus-4-6',            label: 'Opus',   saving: '' },
};

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
  /** 대화 서머라이제이션: 이전 대화 요약 (있으면 히스토리 앞에 주입) */
  conversationSummary?: string,
  /** 이미지 첨부 (Claude vision) */
  images?: ChatImage[],
): Promise<{ content: string; toolCalls: ToolCallResult[]; rawMessages?: ClaudeMsg[]; tokenUsage?: TokenUsageSummary }> {
  // 컴포넌트가 아직 로딩 중일 때 schema가 null일 수 있으므로 스토어에서 fallback
  const effectiveSchema = schema ?? useSchemaStore.getState().schema;

  // 저장된 널리지 목록 + 내용 가져오기 (인메모리 캐싱으로 매번 API 호출 방지)
  const knowledgeEntries = await getKnowledgeEntries();

  // 동적 도구 선택 (toolFilter 또는 질문 키워드 기반)
  const filteredTools = selectToolsForQuery(userMessage, toolFilter);
  const selectedToolNames = filteredTools.map(t => t.name);

  // 이상치 탐지 결과를 시스템 프롬프트에 주입 (데이터 로드 시 자동 감지된 것)
  const anomalyReport = useCanvasStore.getState().anomalyReport;
  const anomalyPrompt = anomalyReport && anomalyReport.anomalies.length > 0
    ? anomalyReportToPrompt(anomalyReport) : undefined;

  // 유효성 검증 결과도 주입
  const validationRes = useCanvasStore.getState().validationResult;
  let validationPrompt: string | undefined;
  if (validationRes && validationRes.violations.length > 0) {
    const { validationResultToPrompt } = await import('./validationEngine.ts');
    validationPrompt = validationResultToPrompt(validationRes);
  }

  const detectedWf = detectWorkflow(userMessage);
  const systemPrompt = buildSystemPrompt(effectiveSchema, tableData, knowledgeEntries, userMessage, selectedToolNames, anomalyPrompt, validationPrompt, detectedWf);

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
   * 대화 히스토리 토큰 다이어트 (강화판):
   * - tool_result: 1.5KB 임계값, HTML 행/JSON rows 압축
   * - tool_use input: 아티팩트 HTML/큰 SQL 요약
   * - assistant text: 아티팩트 마커 내 HTML → 한 줄 요약
   * - 오래된 메시지(idx < half): 더 공격적 압축 (800자)
   */
  /** 마크다운 테이블의 데이터 행을 maxRows개로 자르고 나머지는 요약 */
  function truncateMarkdownTable(text: string, maxRows: number): string {
    return text.replace(
      /((?:\|[^\n]+\|\n)(?:\|[-: ]+\|\n))((?:\|[^\n]+\|\n?)+)/g,
      (_match, header: string, body: string) => {
        const rows = body.split('\n').filter((r: string) => r.trim());
        if (rows.length <= maxRows) return header + body;
        const kept = rows.slice(0, maxRows).join('\n');
        return header + kept + `\n| ... 외 ${rows.length - maxRows}행 생략 |\n`;
      }
    );
  }

  function compressHistory(msgs: ClaudeMsg[]): ClaudeMsg[] {
    const halfIdx = Math.floor(msgs.length / 2);
    const thirdIdx = Math.floor(msgs.length / 3);

    const compressed = msgs.map((m, msgIdx) => {
      const isVeryOld = msgIdx < thirdIdx;
      const isOld = msgIdx < halfIdx;
      const THRESHOLD = isVeryOld ? 300 : isOld ? 800 : 1500;

      // ── user 메시지: tool_result 압축 ──
      if (m.role === 'user' && Array.isArray(m.content)) {
        const content = (m.content as Array<Record<string, unknown>>).map(b => {
          if (b.type !== 'tool_result' || typeof b.content !== 'string') return b;
          let c = b.content as string;

          // 마크다운 테이블 행 축소: 오래된 턴은 2행, 최근은 5행
          if (/\|[^\n]+\|/.test(c)) {
            c = truncateMarkdownTable(c, isVeryOld ? 2 : isOld ? 3 : 5);
          }

          // 매우 오래된 턴: tool_result 극단적 압축
          if (isVeryOld && c.length > 300) {
            return { ...b, content: c.slice(0, 200) + `\n...(${c.length}자, 이전 대화 요약 참조)` };
          }

          if (c.length <= THRESHOLD) return { ...b, content: c };

          if (/<[a-zA-Z]/.test(c)) {
            const htmlCompressed = compressHtmlRows(c);
            if (htmlCompressed.length < c.length * 0.7) {
              const limit = isOld ? 600 : 1500;
              return { ...b, content: htmlCompressed.slice(0, limit) + `\n...(HTML ${c.length}자→${Math.min(htmlCompressed.length, limit)}자)` };
            }
          }

          if (c.startsWith('{') || c.startsWith('[')) {
            const jsonCompressed = compressJsonData(c);
            if (jsonCompressed.length <= THRESHOLD) return { ...b, content: jsonCompressed };
            const limit = isVeryOld ? 200 : isOld ? 600 : 1500;
            return { ...b, content: jsonCompressed.slice(0, limit) + `\n...(JSON ${c.length}자)` };
          }

          const limit = isVeryOld ? 200 : isOld ? 500 : 1200;
          return { ...b, content: c.slice(0, limit) + `\n...(${c.length}자)` };
        });
        return { ...m, content } as ClaudeMsg;
      }

      // ── assistant 메시지: tool_use/아티팩트 HTML/마크다운 테이블 압축 ──
      if (m.role === 'assistant' && Array.isArray(m.content)) {
        const content = (m.content as ContentBlock[]).map(b => {
          if (b.type === 'tool_use') {
            const tb = b as ToolUseBlock;
            const inp = tb.input as Record<string, unknown>;
            if (tb.name === 'create_artifact' && typeof inp.html === 'string' && (inp.html as string).length > 200) {
              return { ...tb, input: { ...inp, html: `(HTML ${(inp.html as string).length}자 생략)` } };
            }
            if (tb.name === 'patch_artifact' && inp.patches && Array.isArray(inp.patches) && JSON.stringify(inp.patches).length > 500) {
              const pLen = (inp.patches as unknown[]).length;
              return { ...tb, input: { ...inp, patches: `(${pLen}개 패치, 생략)` } };
            }
            if (typeof inp.sql === 'string' && (inp.sql as string).length > 500) {
              return { ...tb, input: { ...inp, sql: (inp.sql as string).slice(0, 300) + '...' } };
            }
            // 오래된 턴: edit_plan/rows/csv 등 큰 입력 축소
            if (isOld) {
              const inputStr = JSON.stringify(inp);
              if (inputStr.length > (isVeryOld ? 300 : 800)) {
                const keys = Object.keys(inp).join(', ');
                return { ...tb, input: { _summary: `(${keys}, ${inputStr.length}자 생략)` } };
              }
            }
            return b;
          }

          if (b.type === 'text') {
            const tb = b as TextBlock;
            let text = tb.text;
            if (text.includes('<<<ARTIFACT_START>>>')) {
              text = text.replace(
                /<<<ARTIFACT_START>>>([\s\S]*?)<<<ARTIFACT_END>>>/g,
                (_m, html: string) => `<<<ARTIFACT_START>>>(아티팩트 HTML ${html.length}자 생략)<<<ARTIFACT_END>>>`
              );
            }
            // 마크다운 테이블 행 축소 (오래된 턴)
            if (isOld && /\|[^\n]+\|/.test(text)) {
              text = truncateMarkdownTable(text, isVeryOld ? 2 : 3);
            }
            if (isVeryOld && text.length > 1000) {
              text = text.slice(0, 800) + `\n...(${text.length}자)`;
            }
            if (text !== tb.text) return { ...b, text } as TextBlock;
          }

          return b;
        });
        return { ...m, content } as ClaudeMsg;
      }

      return m;
    });

    // ── 연속 동일 도구 호출 결과 병합 (오래된 턴에서) ──
    if (compressed.length > 6) {
      for (let i = 0; i < Math.min(halfIdx, compressed.length); i++) {
        const m = compressed[i];
        if (m.role !== 'assistant' || !Array.isArray(m.content)) continue;
        const blocks = m.content as ContentBlock[];
        const toolUses = blocks.filter(b => b.type === 'tool_use') as ToolUseBlock[];
        if (toolUses.length < 3) continue;

        // 동일 도구 연속 호출 횟수 세기
        const toolCounts = new Map<string, number>();
        for (const tu of toolUses) toolCounts.set(tu.name, (toolCounts.get(tu.name) ?? 0) + 1);

        for (const [toolName, count] of toolCounts) {
          if (count < 3) continue;
          // 마지막 호출만 유지, 나머지는 제거
          let seen = 0;
          const newContent = blocks.filter(b => {
            if (b.type === 'tool_use' && (b as ToolUseBlock).name === toolName) {
              seen++;
              if (seen < count) return false;
              // 마지막 하나만 유지, input에 요약 추가
              (b as ToolUseBlock).input = { _summary: `${toolName} ${count}회 호출, 마지막 결과만 유지` };
            }
            return true;
          });
          (m as { content: ContentBlock[] }).content = newContent as ContentBlock[];

          // 대응하는 user 메시지(i+1)의 tool_result도 정리
          if (i + 1 < compressed.length && compressed[i + 1].role === 'user' && Array.isArray(compressed[i + 1].content)) {
            const userBlocks = compressed[i + 1].content as Array<Record<string, unknown>>;
            const removedIds = new Set(
              toolUses.filter(tu => tu.name === toolName).slice(0, count - 1).map(tu => tu.id)
            );
            (compressed[i + 1] as { content: Array<Record<string, unknown>> }).content =
              userBlocks.filter(b => b.type !== 'tool_result' || !removedIds.has(b.tool_use_id as string));
          }
        }
      }
    }

    return compressed;
  }

  let rawHistoryMsgs = historyToMessages(history);
  // 히스토리 지능적 압축 (HTML 행, JSON rows, tool_use input)
  rawHistoryMsgs = compressHistory(rawHistoryMsgs);

  // ── 대화 서머라이제이션: 요약이 있으면 히스토리 앞에 주입 ──
  if (conversationSummary) {
    const summaryMsgs: ClaudeMsg[] = [
      { role: 'user', content: `[이전 대화 요약]\n${conversationSummary}` },
      { role: 'assistant', content: '네, 이전 대화 내용을 기억하고 있습니다. 요약 내용을 참고하여 답변하겠습니다.' },
    ];
    rawHistoryMsgs = [...summaryMsgs, ...rawHistoryMsgs];
  }

  // 그래도 초과하면 오래된 메시지부터 제거 (요약 메시지 쌍은 보존)
  const minKeep = conversationSummary ? 2 : 0;
  while (rawHistoryMsgs.length > minKeep + 2 && estimateMsgChars(rawHistoryMsgs) > MAX_MSG_CHARS) {
    rawHistoryMsgs = [...rawHistoryMsgs.slice(0, minKeep), ...rawHistoryMsgs.slice(minKeep + 2)];
  }

  const sysChars = systemPrompt.length;
  const msgChars = estimateMsgChars(rawHistoryMsgs);

  // ── 멀티턴 대화 캐싱: 히스토리 끝에 cache_control 브레이크포인트 ──
  // 먼저 기존 cache_control을 모두 제거 (rawMessages 재사용 시 중복 방지, API 최대 4개 제한)
  for (const msg of rawHistoryMsgs) {
    if (Array.isArray(msg.content)) {
      for (const block of msg.content as Array<Record<string, unknown>>) {
        delete block.cache_control;
      }
    }
  }
  // 히스토리가 충분히 길면 마지막 메시지에 캐시 마커 1개만 추가 (system + tools + history = 최대 3개)
  if (rawHistoryMsgs.length >= 4) {
    const lastHistMsg = rawHistoryMsgs[rawHistoryMsgs.length - 1];
    if (lastHistMsg.role === 'assistant' && Array.isArray(lastHistMsg.content)) {
      const blocks = lastHistMsg.content as ContentBlock[];
      if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        (lastBlock as Record<string, unknown>).cache_control = { type: 'ephemeral' };
      }
    } else if (lastHistMsg.role === 'user') {
      if (typeof lastHistMsg.content === 'string') {
        (lastHistMsg as Record<string, unknown>).content = [
          { type: 'text', text: lastHistMsg.content, cache_control: { type: 'ephemeral' } },
        ];
      } else if (Array.isArray(lastHistMsg.content)) {
        const blocks = lastHistMsg.content as Array<Record<string, unknown>>;
        if (blocks.length > 0) {
          blocks[blocks.length - 1].cache_control = { type: 'ephemeral' };
        }
      }
    }
  }

  // 이미지가 있으면 content를 배열로 구성 (Claude vision)
  const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  let userMsgObj: ClaudeMsg;
  if (images && images.length > 0) {
    const blocks: Array<Record<string, unknown>> = images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: ALLOWED_MEDIA.has(img.media_type) ? img.media_type : 'image/png',
        data: img.data,
      },
    }));
    blocks.push({ type: 'text', text: userMessage });
    userMsgObj = { role: 'user', content: blocks };
  } else {
    userMsgObj = { role: 'user', content: userMessage };
  }

  const messages: ClaudeMsg[] = [
    ...rawHistoryMsgs,
    userMsgObj,
  ];

  const allToolCalls: ToolCallResult[] = [];
  const MAX_ITERATIONS = 20;
  let accumulatedText = '';
  let totalText = ''; // max_tokens 자동 계속 시 누적 텍스트
  let continuationCount = 0; // 자동 계속 횟수
  let artifactAccumulatedHtml = ''; // 이터레이션 간 아티팩트 HTML 누적 (이어쓰기 지원)
  let artifactContinuationCount = 0; // 아티팩트 이어쓰기 횟수

  // ── 워크플로 상태 추적 (에이전틱 모드) ──
  const wfState: {
    type: 'new_content' | 'balance_change' | 'data_qa' | 'game_bug_hunt' | null;
    editedTables: Map<string, { jobId: string; rows: number }>;
    verifiedAfterEdit: boolean;
    planEmitted: boolean;
    nudgeCount: number;
  } = {
    type: detectedWf,
    editedTables: new Map(),
    verifiedAfterEdit: false,
    planEmitted: false,
    nudgeCount: 0,
  };

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
  const systemPromptEstimate = Math.ceil(systemPrompt.length / 3.5);

  const buildTokenSummary = (): TokenUsageSummary => {
    const total_input = tokenIterations.reduce((s, t) => s + t.input_tokens, 0);
    const total_output = tokenIterations.reduce((s, t) => s + t.output_tokens, 0);
    const total_cache_read = tokenIterations.reduce((s, t) => s + (t.cache_read ?? 0), 0);
    const total_cache_creation = tokenIterations.reduce((s, t) => s + (t.cache_creation ?? 0), 0);
    const total_input_logical = total_input + total_cache_read + total_cache_creation;
    return {
      iterations: [...tokenIterations],
      total_input,
      total_output,
      total_tokens: total_input_logical + total_output,
      total_input_logical,
      system_prompt_estimate: systemPromptEstimate,
      model: selectedModel,
      routedDown,
    };
  };

  // ── 동적 max_tokens: 아티팩트/바이브테이블링이면 16384, 일반 대화면 4096 ──
  const ARTIFACT_KEYWORDS = /정리해줘|문서로.*만들|보고서.*만들|시트.*만들|뽑아줘|만들어줘|아티팩트|3D|모델링|릴리즈.*노트|작성해줘/;
  const BT_KEYWORDS = /바이블|테이블링|편집해|추가해|수정해|데이터.*넣|행.*추가|값.*변경|만들어줘.*캐릭|세팅해|밸런스|스탯|스킬.*추가|레벨.*추가|이어서.*생성/;
  const hasBtTools = filteredTools.some(t => t.name === 'edit_game_data' || t.name === 'add_game_data_rows');
  const needsLargeTokens = ARTIFACT_KEYWORDS.test(userMessage) || BT_KEYWORDS.test(userMessage) || hasBtTools;
  const dynamicMaxTokens = needsLargeTokens ? 16384 : 4096;

  // ── Anthropic Prompt Caching: 시스템 프롬프트 + 도구 정의를 캐싱하여 TTFT 대폭 감소 ──
  const cachedTools = filteredTools.map((tool, idx) =>
    idx === filteredTools.length - 1
      ? { ...tool, cache_control: { type: 'ephemeral' as const } }  // 마지막 도구에 캐시 브레이크포인트
      : tool
  );

  // ── 스마트 라우팅: 질문 복잡도에 따라 모델 자동 선택 ──
  const userPrefModel = useCanvasStore.getState().claudeModel || 'claude-opus-4-6';
  let routedDown = false;
  let selectedModel = userPrefModel;
  let routingTier: RoutingTier = 'opus';

  if (userPrefModel.includes('opus')) {
    routingTier = classifyQueryComplexity(userMessage, history, filteredTools, images);
    if (routingTier !== 'opus') {
      const info = ROUTING_LABELS[routingTier];
      selectedModel = info.model;
      routedDown = true;
      onThinkingUpdate?.({
        type: 'tool_start', iteration: 0, maxIterations: MAX_ITERATIONS,
        toolName: 'smart_routing', toolLabel: '⚡ 스마트 라우팅',
        detail: `${routingTier === 'haiku' ? '가벼운 대화' : '단순 질문'} 감지 → ${info.label}로 전환`,
        timestamp: Date.now(),
      });
      onThinkingUpdate?.({
        type: 'tool_done', iteration: 0, maxIterations: MAX_ITERATIONS,
        toolName: 'smart_routing', toolLabel: `⚡ ${info.label} 사용`,
        detail: `Opus → ${info.label} (${info.saving})`,
        timestamp: Date.now(),
      });
    }
  }

  // Haiku: 도구 없이 경량 응답 (도구가 있으면 TTFT가 늘고 짧은 응답이 한꺼번에 나타남)
  const routedMaxTokens = routingTier === 'haiku' ? 1024 : dynamicMaxTokens;
  const routedTools = routingTier === 'haiku' ? [] : cachedTools;

  const requestBase = {
    model: selectedModel,
    max_tokens: routedMaxTokens,
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    ...(routedTools.length > 0 ? { tools: routedTools } : {}),
  };

  // 바이브테이블링 job 체이닝: 이전 job의 출력 파일을 다음 job의 기반으로 사용
  let lastBibleTablingJobId: string | undefined = undefined;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    accumulatedText = '';
    let _lastIterClean = '';
    onThinkingUpdate?.({ type: 'iteration_start', iteration: i + 1, maxIterations: MAX_ITERATIONS, timestamp: Date.now() });

    // 529 재시도 포함 스트리밍 호출
    let data: (ClaudeResponse & { _streamedArtifactHtml?: string; _streamAborted?: boolean }) | null = null;
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
            // :::visualizer 블록은 stripHtmlFromChatText가 보존하므로 전체 텍스트 기반으로 전달
            const iterClean = stripHtmlFromChatText(accumulatedText);
            if (iterClean !== _lastIterClean) {
              _lastIterClean = iterClean;
              const fullClean = continuationCount > 0 ? totalText + iterClean : iterClean;
              onTextDelta?.(iterClean, fullClean);
            }
          },
          wrappedArtifactProgress,
          isArtContinuation, // 이어쓰기 모드 전달
        );
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') || msg.includes('rate_limit')) {
          if (attempt < 2) {
            const wait = 10000 * (attempt + 1);
            console.warn(`[Chat] ⚠️ 429 Rate Limit — ${wait / 1000}초 대기 후 재시도`);
            onTextDelta?.(`\n⏳ Rate Limit — ${wait / 1000}초 후 재시도합니다...\n`, '');
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          throw err;
        } else if (msg.includes('529') || msg.includes('과부하')) {
          if (attempt === 2) throw err;
        } else if ((msg.includes('504') || msg.includes('Gateway') || msg.includes('network') || err instanceof TypeError) && attempt < 2) {
          const wait = 3000 * (attempt + 1);
          console.warn(`[Chat] ⚠️ 네트워크/504 오류 — ${wait / 1000}초 후 재시도 (${attempt + 1}/3)`);
          onTextDelta?.(`\n⏳ 연결 오류 — ${wait / 1000}초 후 재시도합니다... (${attempt + 1}/3)\n`, '');
          await new Promise(r => setTimeout(r, wait));
          continue;
        } else {
          throw err;
        }
      }
    }
    if (!data) throw new Error('Claude API 연결 실패');

    // ★ 스트림이 중간에 끊긴 경우: 부분 아티팩트 보존 후 이어쓰기 시도
    if (data._streamAborted && data._streamedArtifactHtml && data._streamedArtifactHtml.length > 50) {
      console.warn(`[Chat] ⚠️ 스트림 중단 — 아티팩트 ${data._streamedArtifactHtml.length}자 보존, 이어쓰기 예약`);
      artifactAccumulatedHtml += data._streamedArtifactHtml;
      artifactContinuationCount++;
      onTextDelta?.(`\n🔄 아티팩트 생성 중 연결 끊김 — 자동 이어쓰기합니다... (${data._streamedArtifactHtml.length}자 보존)\n`, '');
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
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
      const summary = buildTokenSummary();
      onTokenUsage?.(summary);
    }

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
      const userWantsArtifact = /정리해줘|문서로.*만들|보고서.*만들|시트.*만들|뽑아줘|만들어줘|아티팩트/.test(
        messages.find(m => m.role === 'user')?.content as string ?? ''
      );

      // ★ 텍스트 마커로 HTML이 스트리밍됐지만 create_artifact를 호출하지 않고 end_turn된 경우 → 자동 아티팩트 생성
      if (streamedArtifactHtml && streamedArtifactHtml.length >= 10 && !alreadyHasArtifact) {
        // 누적 HTML이 있으면 합침
        const finalArtHtml = artifactAccumulatedHtml ? (artifactAccumulatedHtml + streamedArtifactHtml) : streamedArtifactHtml;
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

      // ★ 워크플로 완료 게이트: 편집 후 검증 미수행 시 재촉
      if (wfState.type && wfState.editedTables.size > 0
          && !wfState.verifiedAfterEdit && wfState.nudgeCount < 2) {
        const editedList = [...wfState.editedTables.keys()].join(', ');
        const nudgeText = `⚡ 워크플로 미완료: ${editedList} 편집 후 검증이 수행되지 않았습니다. ` +
          `검증 실행 또는 FK 무결성 확인을 수행하고, :::progress를 업데이트해주세요.`;
        messages.push({ role: 'assistant', content: data.content });
        messages.push({ role: 'user', content: nudgeText });
        wfState.nudgeCount++;
        continue;
      }

      const tokenUsage = buildTokenSummary();
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
        save_validation_rule: '🛡️ 검증 룰 등록',
        list_validation_rules: '🛡️ 검증 룰 목록',
        delete_validation_rule: '🛡️ 검증 룰 삭제',
        web_search: '🌐 웹 검색',
        read_url: '🌐 웹페이지 읽기',
        edit_game_data: '📝 바이브테이블링',
        add_game_data_rows: '➕ 데이터 행 추가',
        search_published_artifacts: '🔍 기존 문서 검색',
        get_published_artifact: '📄 기존 문서 가져오기',
      };

      // 바이브테이블링 도구는 같은 xlsx 파일의 여러 시트를 순차 편집해야 하므로
      // prev_job_id 체이닝을 위해 순차 실행. 나머지 도구는 병렬 실행.
      const BT_TOOLS = new Set(['edit_game_data', 'add_game_data_rows']);
      const btBlocks = toolBlocks.filter(tb => BT_TOOLS.has(tb.name));
      const nonBtBlocks = toolBlocks.filter(tb => !BT_TOOLS.has(tb.name));

      const executeToolBlock = async (tb: typeof toolBlocks[0]) => {
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
          : tb.name === 'search_confluence' ? String(inp.query ?? inp.cql ?? '')
          : tb.name === 'search_code' ? String(inp.query ?? '')
          : tb.name === 'search_assets' ? String(inp.query ?? '')
          : tb.name === 'get_scene_yaml' ? String(inp.path ?? '')
          : tb.name === 'preview_prefab' ? String(inp.path ?? '')
          : tb.name === 'preview_fbx_animation' ? String(inp.model_path ?? '')
          : tb.name === 'get_character_profile' ? String(inp.character_id ?? '')
          : tb.name === 'save_knowledge' ? String(inp.name ?? '')
          : tb.name === 'read_knowledge' ? String(inp.name ?? '') || '(목록)'
          : tb.name === 'save_validation_rule' ? String(inp.name ?? '')
          : tb.name === 'delete_validation_rule' ? String(inp.id ?? '')
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
            // 행수 제한 (15행) + 셀 값 길이 제한 (150자) → 토큰 대폭 절약
            // UI에는 전체 데이터가 보이므로 Claude에게는 판단에 충분한 양만 전달
            const MAX_ROWS = 15;
            const MAX_CELL_LEN = 150;
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

          // 워크플로: 편집 후 검증 쿼리 감지
          if (wfState.editedTables.size > 0 && !wfState.verifiedAfterEdit) {
            const sqlLower = sql.toLowerCase();
            if (/not\s+in|validation|검증|count\s*\(|min\s*\(|max\s*\(|avg\s*\(|orphan|무결성/i.test(sqlLower)) {
              wfState.verifiedAfterEdit = true;
            }
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
            if (commits.length > 0) {
              resultStr += '\n\n[힌트] 특정 커밋의 실제 변경 내용(+/- 라인)을 보려면 show_revision_diff(commit_hash, repo="' + repo + '")를 호출하세요.';
              if (repo === 'data') {
                resultStr += '\n[힌트] xlsx 원본은 바이너리라 diff 불가. 엔진 쪽 파싱 결과도 확인하려면 query_git_history(repo="aegis", filter_path="ReferenceTable/Ref테이블명")도 호출하세요.';
              } else if (repo === 'aegis') {
                resultStr += '\n[힌트] 이것은 엔진 파싱 결과입니다. xlsx 원본 수정 이력도 보려면 query_git_history(repo="data", filter_path="GameData/Data/테이블명")도 호출하세요.';
              }
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
              // Claude에게 실제 변경 내용(hunks)을 포함해서 전달 (토큰 절약을 위해 제한)
              const diffFiles = (data.files || []) as DiffFile[];
              const MAX_DIFF_LINES = 150;
              const MAX_FILES_WITH_CONTENT = 5;
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
        // 서버에 위임하여 base64 data URI를 직접 포함받음 (프록시 환경에서 별도 이미지 GET 불필요)
        else if (tb.name === 'find_resource_image') {
          const query = String(inp.query ?? '');
          const reason = inp.reason ? String(inp.reason) : undefined;
          try {
            const resp = await fetch('/api/tool/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: 'find_resource_image', input: { query } }),
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const serverResult = await resp.json() as { result: string; data?: { total: number; images: { name: string; relPath: string; url: string; dataUri?: string; isAtlas?: boolean }[] } };
            if (serverResult.data?.images) {
              const _ab = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
              const images = serverResult.data.images.map(img => ({
                ...img,
                url: img.url || `${_ab}/api/images/file?path=${encodeURIComponent(img.relPath)}`,
              }));
              tc = { kind: 'image_search', query, images, total: serverResult.data.total } as ImageResult;
              resultStr = serverResult.result;
            } else {
              tc = { kind: 'image_search', query, images: [], total: 0 } as ImageResult;
              resultStr = serverResult.result || `"${query}" 이미지 없음`;
            }
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
                    const r = executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE ${pkCol} = ${Number(directCharId)} LIMIT 1`,
                      tableData, resolvedSchema,
                    );
                    if (r.rows.length > 0) character = r.rows[0] as Record<string, unknown>;
                  } catch { /* skip */ }
                }
                // 0-b: 문자열 비교 (PK가 VARCHAR인 경우)
                if (!character) {
                  try {
                    const r = executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE ${pkCol} = '${directCharId.replace(/'/g, "''")}' LIMIT 1`,
                      tableData, resolvedSchema,
                    );
                    if (r.rows.length > 0) character = r.rows[0] as Record<string, unknown>;
                  } catch { /* skip */ }
                }
                // 0-c: JS 전체 탐색 폴백 (타입 불일치 최후 수단)
                if (!character) {
                  try {
                    const allRows = executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 500`, tableData, resolvedSchema);
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
                    const r = executeDataSQL(
                      `SELECT * FROM "${charTable.name}" WHERE LOWER(${nc}) LIKE LOWER('%${safeInput}%') LIMIT 1`,
                      tableData, resolvedSchema,
                    );
                    if (r.rows.length > 0) { character = r.rows[0] as Record<string, unknown>; break; }
                  } catch { /* 비문자열 컬럼 스킵 */ }
                }

                // 전략 2: 전체 컬럼에서 LIKE 검색
                if (!character) {
                  const allColumns = charTable.columns.map(c => c.name.toLowerCase());
                  for (const nc of allColumns) {
                    try {
                      const r = executeDataSQL(
                        `SELECT * FROM "${charTable.name}" WHERE LOWER(${nc}) LIKE LOWER('%${safeInput}%') LIMIT 1`,
                        tableData, resolvedSchema,
                      );
                      if (r.rows.length > 0) { character = r.rows[0] as Record<string, unknown>; break; }
                    } catch { /* skip */ }
                  }
                }

                // 전략 3: JS 측 완전 탐색 (인코딩/특수문자 차이 대비)
                if (!character) {
                  try {
                    const allRows = executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 500`, tableData, resolvedSchema);
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
                  const allChars = executeDataSQL(`SELECT * FROM "${charTable.name}" LIMIT 100`, tableData, resolvedSchema);
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
                    const res = executeDataSQL(
                      `SELECT * FROM "${connTable.name}" WHERE ${fkCol} = ${charIdLiteral} LIMIT 5`,
                      tableData, resolvedSchema,
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
                          const subRes = executeDataSQL(
                            `SELECT COUNT(*) as cnt FROM "${subTable.name}" WHERE ${subFk} IN (${ids})`,
                            tableData, resolvedSchema,
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
                  ? `"${query}" 전문검색 → ${contentHits.length}개 파일\n` + contentHits.slice(0, 5).map(r =>
                      `  📄 ${r.path}\n` + r.matches.slice(0, 3).map(m => `    L${m.line}: ${m.lineContent}`).join('\n')
                    ).join('\n')
                  : `"${query}" 검색 결과 없음 (전체 ${total}개 파일). 다른 키워드로 시도해보세요.`;
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

          // 🔴 바이브테이블링 후 아티팩트 생성 차단 (코드 레벨 강제)
          const hadBibleTabling = allToolCalls.some(tc => tc.kind === 'bible_tabling_edit' || tc.kind === 'bible_tabling_add_rows');
          if (hadBibleTabling) {
            tc = { kind: 'artifact', title, description, html: '', duration } as ArtifactResult;
            resultStr = `🔴 바이브테이블링 결과는 아티팩트로 만들지 마세요! 다운로드 링크가 결과물입니다. 텍스트 응답으로 요약하세요.`;
          } else if (allToolCalls.some(tc => tc.kind === 'artifact')) {
            // ── 중복 호출 방지: 이미 아티팩트가 있으면 무시 ──
            tc = { kind: 'artifact', title, description, html, duration } as ArtifactResult;
            resultStr = `⚠️ 이미 아티팩트가 성공적으로 생성되었습니다. 재생성 불필요합니다. 대화를 이어가세요.`;
          } else {
            // ── 항상 성공 반환 (빈 HTML이어도) — 재시도 방지 ──
            tc = { kind: 'artifact', title, description, html, duration } as ArtifactResult;
            resultStr = `✅ 아티팩트 "${title}" 생성 완료. 사이드 패널에 정상 표시됩니다. 대화를 이어가세요.`;
            // 이어쓰기 모드 종료
            if (artifactAccumulatedHtml) {
              artifactAccumulatedHtml = '';
              artifactContinuationCount = 0;
            }
          }
        }

        // ── search_published_artifacts ──
        else if (tb.name === 'search_published_artifacts') {
          const t0 = performance.now();
          try {
            const resp = await fetch('/api/tool/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: 'search_published_artifacts', input: inp }),
            });
            if (!resp.ok) {
              const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
              throw new Error(errText.slice(0, 200));
            }
            const data2 = await resp.json() as { result: string; data?: { total: number; matched: number; artifacts: { id: string; title: string; description: string; createdAt: string }[] } };
            const duration = performance.now() - t0;
            resultStr = data2.result;
            const artifacts = data2.data?.artifacts ?? [];
            tc = { kind: 'knowledge', action: 'read', name: '기존 문서 검색', content: resultStr, duration } as KnowledgeResult;
            if (artifacts.length > 0) {
              resultStr += '\n\n⚠️ 기존 문서를 사용자에게 언급할 때 반드시 인라인 링크 포함: [문서제목](./api/p/아티팩트_id)';
              resultStr += '\n예: [' + artifacts[0].title + '](./api/p/' + artifacts[0].id + ')';
              resultStr += '\n수정하려면 get_published_artifact(artifact_id)로 HTML을 가져온 후 create_artifact로 수정본 생성.';
            }
          } catch (e) {
            const errMsg = String(e).replace(/^Error:\s*/, '').slice(0, 200);
            resultStr = `출판 아티팩트 검색 오류: ${errMsg}`;
            tc = { kind: 'knowledge', action: 'read', name: '기존 문서 검색', content: resultStr, error: errMsg } as KnowledgeResult;
          }
        }

        // ── get_published_artifact ──
        else if (tb.name === 'get_published_artifact') {
          const artifactId = String(inp.artifact_id ?? '');
          const t0 = performance.now();
          try {
            const resp = await fetch('/api/tool/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: 'get_published_artifact', input: inp }),
            });
            if (!resp.ok) {
              const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
              throw new Error(errText.slice(0, 200));
            }
            const data2 = await resp.json() as { result: string; data?: { id: string; title: string; html: string; description: string; createdAt: string; url: string } };
            const duration = performance.now() - t0;
            resultStr = data2.result;
            const art = data2.data;
            if (art?.html) {
              tc = { kind: 'artifact', title: art.title, html: art.html, description: art.description ?? '', duration } as ArtifactResult;
            } else {
              tc = { kind: 'knowledge', action: 'read', name: art?.title ?? '문서 가져오기', content: resultStr, duration } as KnowledgeResult;
            }
          } catch (e) {
            const errMsg = String(e).replace(/^Error:\s*/, '').slice(0, 200);
            resultStr = `출판 아티팩트 조회 오류: ${errMsg}`;
            tc = { kind: 'knowledge', action: 'read', name: '문서 가져오기', content: resultStr, error: errMsg } as KnowledgeResult;
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
              const commentMeta = (f.comment ?? {}) as Record<string, unknown>;
              const totalComments = Number(commentMeta.total ?? 0);
              // 서버에서 최신 댓글로 교체한 배열 사용 (orderBy=-created)
              const comments = ((commentMeta.comments ?? []) as Array<Record<string, unknown>>).slice(0, 10);
              // ADF → 플레인텍스트 파싱
              const descText = parseAdfField(f.description);
              const commentLines = comments.map((c) => {
                const author = String((c.author as Record<string, unknown>)?.displayName ?? '(알 수 없음)');
                const created = String(c.created ?? '').slice(0, 16).replace('T', ' ');
                const body = parseAdfField(c.body).slice(0, 500);
                return `  [${created}] ${author}: ${body}`;
              });
              // Jira browse URL 생성
              const selfUrl = String(data2.self ?? '');
              const jiraBase1 = selfUrl.split('/rest/')[0];
              const issueUrl = jiraBase1 ? `${jiraBase1}/browse/${issueKey}` : '';
              resultStr = [
                `이슈: [${issueKey}](${issueUrl}) - ${String(f.summary ?? '')}`,
                `URL: ${issueUrl}`,
                `상태: ${String((f.status as Record<string, unknown>)?.name ?? '')}`,
                `유형: ${String((f.issuetype as Record<string, unknown>)?.name ?? '')}`,
                `우선순위: ${String((f.priority as Record<string, unknown>)?.name ?? '')}`,
                `담당자: ${String((f.assignee as Record<string, unknown>)?.displayName ?? '미배정')}`,
                `보고자: ${String((f.reporter as Record<string, unknown>)?.displayName ?? '')}`,
                `레이블: ${((f.labels as string[]) ?? []).join(', ') || '-'}`,
                `컴포넌트: ${((f.components as Array<Record<string, unknown>>) ?? []).map(c => c.name).join(', ') || '-'}`,
                `생성: ${String(f.created ?? '')}  수정: ${String(f.updated ?? '')}`,
                descText ? `\n설명:\n${descText.slice(0, 800)}` : '',
                totalComments > 0
                  ? `\n댓글 (전체 ${totalComments}개 중 최근 ${comments.length}개):\n${commentLines.join('\n')}`
                  : '\n댓글: 없음',
              ].filter(Boolean).join('\n');
              tc = { kind: 'jira_issue', issueKey,
                url: jiraBase1 ? `${jiraBase1}/browse/${issueKey}` : '',
                summary: String(f.summary ?? ''),
                status: String((f.status as Record<string, unknown>)?.name ?? ''),
                issuetype: String((f.issuetype as Record<string, unknown>)?.name ?? ''),
                priority: String((f.priority as Record<string, unknown>)?.name ?? ''),
                assignee: String((f.assignee as Record<string, unknown>)?.displayName ?? '미배정'),
                reporter: String((f.reporter as Record<string, unknown>)?.displayName ?? ''),
                created: String(f.created ?? ''),
                updated: String(f.updated ?? ''),
                description: descText.slice(0, 1000),
                comments: comments.map(c => ({
                  author: String((c.author as Record<string, unknown>)?.displayName ?? ''),
                  body: parseAdfField(c.body).slice(0, 500),
                  created: String(c.created ?? ''),
                })),
                totalComments,
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

        // ── add_jira_comment (Confluence URL 자동 리다이렉트 포함) ──
        else if (tb.name === 'add_jira_comment') {
          const rawKey = String(inp.issueKey ?? inp.issueKeyOrUrl ?? '').trim();
          const comment = String(inp.comment ?? inp.commentBody ?? '').trim();
          const t0 = performance.now();
          // Confluence URL 감지 → 자동으로 Confluence 댓글 API 호출
          if (/\/wiki\/spaces\/|\/pages\/\d+/i.test(rawKey)) {
            const pageIdMatch = rawKey.match(/\/pages\/(\d+)/);
            const pageId = pageIdMatch ? pageIdMatch[1] : '';
            if (!pageId) {
              resultStr = `Confluence URL에서 페이지 ID를 추출할 수 없습니다: "${rawKey}"`;
              tc = { kind: 'confluence_comment', error: resultStr, duration: 0 } as unknown as ToolCallResult;
            } else {
              try {
                const resp = await fetch('/api/confluence/comment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pageId, comment }),
                });
                const data2 = await resp.json() as Record<string, unknown>;
                const duration = performance.now() - t0;
                if (!resp.ok) {
                  resultStr = `Confluence 댓글 작성 실패 (${resp.status}): ${String(data2.error ?? data2)}`;
                  tc = { kind: 'confluence_comment', pageId, error: resultStr, duration } as unknown as ToolCallResult;
                } else {
                  const commentId = String(data2.commentId ?? '');
                  const pageUrl = String(data2.pageUrl ?? '');
                  resultStr = `✅ Confluence 댓글 작성 완료!\n페이지 ID: ${pageId}${pageUrl ? ` (${pageUrl})` : ''}\n댓글 ID: ${commentId}\n작성 내용:\n${comment}`;
                  tc = { kind: 'confluence_comment', pageId, commentId, pageUrl, comment, duration } as unknown as ToolCallResult;
                }
              } catch (e) {
                resultStr = `Confluence 댓글 작성 오류: ${String(e)}`;
                tc = { kind: 'confluence_comment', pageId, error: String(e), duration: 0 } as unknown as ToolCallResult;
              }
            }
          } else {
            const issueKey = rawKey.match(/[A-Z]+-\d+/)?.[0] ?? rawKey;
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
        }

        // ── add_confluence_comment ──
        else if (tb.name === 'add_confluence_comment') {
          const rawPageRef = String(inp.pageIdOrUrl ?? inp.pageId ?? '').trim();
          const comment = String(inp.comment ?? '').trim();
          const pageIdMatch = rawPageRef.match(/\/pages\/(\d+)/);
          const pageId = pageIdMatch ? pageIdMatch[1] : rawPageRef.replace(/\D/g, '');
          const t0 = performance.now();
          try {
            const resp = await fetch('/api/confluence/comment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pageId, comment }),
            });
            const data2 = await resp.json() as Record<string, unknown>;
            const duration = performance.now() - t0;
            if (!resp.ok) {
              resultStr = `Confluence 댓글 작성 실패 (${resp.status}): ${String(data2.error ?? data2)}`;
              tc = { kind: 'confluence_comment', pageId, error: resultStr, duration } as unknown as ToolCallResult;
            } else {
              const commentId = String(data2.commentId ?? '');
              const pageUrl = String(data2.pageUrl ?? '');
              resultStr = `✅ Confluence 댓글 작성 완료!\n페이지 ID: ${pageId}${pageUrl ? ` (${pageUrl})` : ''}\n댓글 ID: ${commentId}\n작성 내용:\n${comment}`;
              tc = { kind: 'confluence_comment', pageId, commentId, pageUrl, comment, duration } as unknown as ToolCallResult;
            }
          } catch (e) {
            resultStr = `Confluence 댓글 작성 오류: ${String(e)}`;
            tc = { kind: 'confluence_comment', pageId, error: String(e), duration: 0 } as unknown as ToolCallResult;
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
          // query → CQL 자동 변환 (cql이 없으면)
          let cql = String(inp.cql ?? '').trim();
          const query = String(inp.query ?? '').trim();
          const space = String(inp.space ?? '').trim();
          if (!cql && query) {
            const parts: string[] = [];
            parts.push(`type = "page"`);
            if (space) parts.push(`space = "${space}"`);
            // 여러 키워드로 분리하여 각각 text~ 으로 AND 연결
            const keywords = query.split(/\s+/).filter(Boolean);
            for (const kw of keywords) {
              parts.push(`text ~ "${kw}"`);
            }
            cql = parts.join(' AND ');
          }
          if (!cql) {
            cql = 'type = "page" ORDER BY lastmodified DESC';
          }
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
              const CONF_MAX = 50_000;
              let htmlContent = rawHtml
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/?(p|div|h[1-6]|li|tr|section|article)[^>]*>/gi, '\n')
                .replace(/<\/?(td|th)[^>]*>/gi, ' | ')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
              const fullContentLength = htmlContent.length;
              if (htmlContent.length > CONF_MAX) {
                htmlContent = htmlContent.slice(0, CONF_MAX) + `\n\n⚠️ 내용이 ${fullContentLength.toLocaleString()}자로 길어 ${CONF_MAX.toLocaleString()}자까지만 표시됩니다.`;
              }
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
                if (url.includes('/api/confluence/attachment')) return url;
                if (url.startsWith('http') && !url.includes('atlassian.net') && !url.includes(wikiBase.replace(/^https?:\/\//, ''))) return url;
                const absUrl = url.startsWith('http') ? url : `${wikiBase}${url.startsWith('/') ? '' : '/'}${url}`;
                return `./api/confluence/attachment?url=${encodeURIComponent(absUrl)}`;
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

        // ── save_validation_rule ──
        else if (tb.name === 'save_validation_rule') {
          try {
            const vMod = await import('./validationEngine.ts');
            const ruleId = String(inp.id ?? `rule_${Date.now()}`);
            const ruleName = String(inp.name ?? '');
            const ruleTable = String(inp.table ?? '*');
            const severity = (inp.severity === 'warning' ? 'warning' : 'error') as 'error' | 'warning';
            const condition = inp.condition as Record<string, unknown> | undefined;

            if (!ruleName || !condition?.type) {
              resultStr = '오류: name과 condition.type이 필요합니다.';
              tc = { kind: 'knowledge', action: 'save', name: '', error: resultStr };
            } else {
              const newRule = {
                id: ruleId, name: ruleName, table: ruleTable, severity,
                condition: condition as unknown as import('./validationEngine.ts').RuleCondition,
                enabled: true, scope: 'personal' as const,
                createdAt: Date.now(), updatedAt: Date.now(),
              };
              const allRules = await vMod.addRule(newRule);
              const tableData = useCanvasStore.getState().tableData;
              if (tableData.size > 0) {
                const vResult = vMod.runValidation(tableData, allRules);
                useCanvasStore.getState().setValidationResult(vResult);
                const vCount = vResult.violations.filter(v => v.ruleId === ruleId).length;
                resultStr = `✅ 검증 룰 "${ruleName}" 등록 완료 (id: ${ruleId})\n현재 데이터 검증 결과: ${vCount > 0 ? `⚠️ ${vCount}건 위반 감지` : '✅ 위반 없음'}\n\n전체: ${allRules.length}개 룰 활성`;
              } else {
                resultStr = `✅ 검증 룰 "${ruleName}" 등록 완료 (id: ${ruleId})\n데이터 로드 시 자동 검증됩니다.`;
              }
              tc = { kind: 'knowledge', action: 'save', name: ruleId } as unknown as ToolCallResult;
            }
          } catch (e) {
            resultStr = `검증 룰 저장 오류: ${String(e)}`;
            tc = { kind: 'knowledge', action: 'save', name: '', error: String(e) };
          }
        }

        // ── list_validation_rules ──
        else if (tb.name === 'list_validation_rules') {
          try {
            const vMod = await import('./validationEngine.ts');
            const rules = await vMod.fetchRulesFromServer();
            resultStr = vMod.rulesToSummary(rules);
            tc = { kind: 'knowledge', action: 'list', name: '', items: [] } as unknown as ToolCallResult;
          } catch (e) {
            resultStr = `검증 룰 목록 오류: ${String(e)}`;
            tc = { kind: 'knowledge', action: 'list', name: '', error: String(e) };
          }
          if (wfState.editedTables.size > 0) wfState.verifiedAfterEdit = true;
        }

        // ── delete_validation_rule ──
        else if (tb.name === 'delete_validation_rule') {
          try {
            const vMod = await import('./validationEngine.ts');
            const ruleId = String(inp.id ?? '');
            if (!ruleId) {
              resultStr = '오류: 삭제할 룰 id가 필요합니다.';
              tc = { kind: 'knowledge', action: 'save', name: '', error: resultStr };
            } else {
              const remaining = await vMod.deleteRule(ruleId);
              const tableData = useCanvasStore.getState().tableData;
              if (tableData.size > 0) {
                const vResult = vMod.runValidation(tableData, remaining);
                useCanvasStore.getState().setValidationResult(vResult);
              }
              resultStr = `✅ 룰 "${ruleId}" 삭제 완료. 남은 룰: ${remaining.length}개`;
              tc = { kind: 'knowledge', action: 'save', name: ruleId } as unknown as ToolCallResult;
            }
          } catch (e) {
            resultStr = `검증 룰 삭제 오류: ${String(e)}`;
            tc = { kind: 'knowledge', action: 'save', name: '', error: String(e) };
          }
        }

        // ── web_search ──
        else if (tb.name === 'web_search') {
          const query = String(inp.query ?? '').trim();
          const count = Number(inp.count ?? 5);
          const t0 = Date.now();
          try {
            const resp = await fetch('/api/web/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, count }),
            });
            const data2 = await resp.json() as { query?: string; results?: Array<{ title: string; url: string; snippet: string; age?: string }>; error?: string };
            const duration = Date.now() - t0;
            if (!resp.ok || data2.error) {
              resultStr = `웹 검색 오류: ${data2.error ?? resp.status}`;
              tc = { kind: 'web_search', query, results: [], error: resultStr, duration };
            } else {
              const results = data2.results ?? [];
              resultStr = `🔍 "${query}" 웹 검색 결과 (${results.length}건):\n\n`;
              results.forEach((r, idx) => {
                resultStr += `${idx + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}${r.age ? ` (${r.age})` : ''}\n\n`;
              });
              resultStr += '상세 내용이 필요하면 read_url(url)로 특정 페이지를 읽을 수 있습니다.';
              tc = { kind: 'web_search', query, results, duration };
            }
          } catch (e) {
            resultStr = `웹 검색 오류: ${String(e)}`;
            tc = { kind: 'web_search', query, results: [], error: String(e), duration: Date.now() - t0 };
          }
        }
        // ── read_url ──
        else if (tb.name === 'read_url') {
          const url = String(inp.url ?? '').trim();

          // Confluence URL 감지 → get_confluence_page로 자동 전환
          const confPageMatch = url.match(/atlassian\.net\/wiki\/.*?\/pages\/(\d+)/i);
          if (confPageMatch) {
            const pageId = confPageMatch[1];
            const t0c = performance.now();
            try {
              const confResp = await fetch(`/api/confluence/page/${encodeURIComponent(pageId)}`);
              const confData = await confResp.json() as Record<string, unknown>;
              const duration = performance.now() - t0c;
              if (!confResp.ok) {
                resultStr = `Confluence 페이지 조회 실패 (${confResp.status}): ${String((confData as Record<string,unknown>).error ?? confData)}`;
                tc = { kind: 'confluence_page', pageId, error: resultStr, duration } as ConfluencePageResult;
              } else {
                const title = String(confData.title ?? '');
                const spaceKey = String(((confData as Record<string, unknown>).space as Record<string,unknown>)?.key ?? '');
                const bodyHtml = String((((confData as Record<string, unknown>).body as Record<string, unknown>)?.storage as Record<string,unknown>)?.value ?? '');
                const plainText = bodyHtml
                  .replace(/<ac:structured-macro[\s\S]*?<\/ac:structured-macro>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;/gi, ' ')
                  .replace(/&[a-z]+;/gi, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                const truncated = plainText.length > 12000 ? plainText.slice(0, 12000) + '...(잘림)' : plainText;
                resultStr = `📚 Confluence 페이지: ${title} (Space: ${spaceKey}, ID: ${pageId})\n🔗 ${url}\n\n${truncated}`;
                tc = { kind: 'confluence_page', pageId, title, space: spaceKey, bodyText: truncated, duration } as ConfluencePageResult;
              }
            } catch (e) {
              resultStr = `Confluence 페이지 조회 오류: ${String(e)}`;
              tc = { kind: 'confluence_page', pageId, error: String(e), duration: 0 } as ConfluencePageResult;
            }
            // Confluence URL이면 여기서 처리 완료 → read_url 로직 건너뜀
          } else {
          // 일반 URL 처리
          const maxLength = Number(inp.maxLength ?? 15000);
          const t0 = Date.now();
          try {
            const resp = await fetch('/api/web/read-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, maxLength }),
            });
            const data2 = await resp.json() as { url?: string; title?: string; content?: string; contentLength?: number; error?: string };
            const duration = Date.now() - t0;
            if (!resp.ok || data2.error) {
              resultStr = `URL 읽기 오류: ${data2.error ?? resp.status}`;
              tc = { kind: 'web_read', url, title: '', content: '', contentLength: 0, error: resultStr, duration };
            } else {
              const title = data2.title ?? url;
              const content = data2.content ?? '';
              resultStr = `📄 ${title}\n🔗 ${url}\n📏 ${data2.contentLength ?? content.length}자 추출\n\n${content}`;
              if (resultStr.length > 20000) resultStr = resultStr.slice(0, 20000) + '\n...(잘림)';
              tc = { kind: 'web_read', url, title, content, contentLength: data2.contentLength ?? content.length, duration };
            }
          } catch (e) {
            resultStr = `URL 읽기 오류: ${String(e)}`;
            tc = { kind: 'web_read', url, title: '', content: '', contentLength: 0, error: String(e), duration: Date.now() - t0 };
          }
          } // end else (일반 URL)
        }

        // ── edit_game_data (바이브테이블링 — 데이터 편집, SSE 스트리밍) ──
        else if (tb.name === 'edit_game_data') {
          const BIBLE_TABLING_URL = ''; // Vite 프록시 경유 (/api/bible-tabling/ → localhost:8100)
          const title = String(inp.title ?? '바이브테이블링');
          const reason = inp.reason ? String(inp.reason) : '';
          const t0 = Date.now();
          try {
            const resp = await fetch(`${BIBLE_TABLING_URL}/api/bible-tabling/edit-stream`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                reason,
                edit_plan: inp.edit_plan as unknown[],
                prev_job_id: lastBibleTablingJobId,
              }),
            });
            if (!resp.ok) {
              const duration = Date.now() - t0;
              const errText = await resp.text();
              resultStr = `바이브테이블링 오류 (${resp.status}): ${errText}`;
              tc = { kind: 'bible_tabling_edit', title, reason, jobId: '', downloadUrl: '', downloadFilename: '', files: [], filesModified: 0, totalRowsMatched: 0, totalCellsModified: 0, tables: [], error: resultStr, duration };
            } else {
              // SSE 스트리밍으로 실시간 진행 상태 수신
              const reader = resp.body!.getReader();
              const decoder = new TextDecoder();
              let sseBuffer = '';
              let doneEvent: Record<string, unknown> | null = null;
              let fatalError: string | null = null;

              while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;
                sseBuffer += decoder.decode(value, { stream: true });
                const lines = sseBuffer.split('\n');
                sseBuffer = lines.pop()!;

                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue;
                  let evt: Record<string, unknown>;
                  try { evt = JSON.parse(line.slice(6)); } catch { continue; }

                  if (evt.type === 'file_open') {
                    onThinkingUpdate?.({
                      type: 'tool_start', iteration: i + 1, maxIterations: MAX_ITERATIONS,
                      toolName: 'edit_game_data', toolLabel: '📂 파일 열기',
                      detail: `${evt.file} (${evt.sheets}시트, ${evt.load_sec}s)`,
                      timestamp: Date.now(),
                    });
                  } else if (evt.type === 'edit_done') {
                    const r = evt.result as Record<string, unknown>;
                    onThinkingUpdate?.({
                      type: 'tool_start', iteration: i + 1, maxIterations: MAX_ITERATIONS,
                      toolName: 'edit_game_data', toolLabel: `📝 편집 ${evt.step}/${evt.total}`,
                      detail: `${r.table}: ${r.rows_matched}행 ${r.cells_modified}셀 ✅`,
                      timestamp: Date.now(),
                    });
                  } else if (evt.type === 'edit_error') {
                    const r = evt.result as Record<string, unknown>;
                    onThinkingUpdate?.({
                      type: 'tool_start', iteration: i + 1, maxIterations: MAX_ITERATIONS,
                      toolName: 'edit_game_data', toolLabel: `📝 편집 ${evt.step}/${evt.total}`,
                      detail: `${r.table}: ❌ ${r.error}`,
                      timestamp: Date.now(),
                    });
                  } else if (evt.type === 'file_saved') {
                    onThinkingUpdate?.({
                      type: 'tool_start', iteration: i + 1, maxIterations: MAX_ITERATIONS,
                      toolName: 'edit_game_data', toolLabel: '💾 저장',
                      detail: `${evt.file} (${evt.save_sec}s)`,
                      timestamp: Date.now(),
                    });
                  } else if (evt.type === 'done') {
                    doneEvent = evt;
                  } else if (evt.type === 'fatal_error') {
                    fatalError = String(evt.error ?? '알 수 없는 오류');
                  }
                }
              }

              const duration = Date.now() - t0;

              if (fatalError) {
                resultStr = `바이브테이블링 오류: ${fatalError}`;
                tc = { kind: 'bible_tabling_edit', title, reason, jobId: '', downloadUrl: '', downloadFilename: '', files: [], filesModified: 0, totalRowsMatched: 0, totalCellsModified: 0, tables: [], error: resultStr, duration };
              } else if (doneEvent) {
                const summary = doneEvent.summary as Record<string, unknown>;
                const details = (summary.details as Array<Record<string, unknown>>) || [];
                const jobId = String(doneEvent.job_id ?? '');
                const downloadUrl = `${BIBLE_TABLING_URL}${doneEvent.download_url}`;
                const downloadFilename = String(doneEvent.download_filename ?? '');
                const isPartial = !!doneEvent.partial;
                const errorCount = Number(summary.error_count ?? 0);

                const isZip = downloadUrl.endsWith('.zip');
                const seenFiles = new Set<string>();
                const files: Array<{ filename: string; url: string }> = [];
                if (isZip) {
                  for (const d of details) {
                    const fname = String(d.file ?? '');
                    if (fname && !seenFiles.has(fname)) {
                      seenFiles.add(fname);
                      files.push({
                        filename: fname,
                        url: `${BIBLE_TABLING_URL}/api/bible-tabling/download/${jobId}/${fname}`,
                      });
                    }
                  }
                }

                let resultText = isPartial
                  ? `⚠️ 바이브테이블링 부분 완료 (${errorCount}건 오류)\n`
                  : `✅ 바이브테이블링 편집 완료\n`;
                resultText += `제목: ${summary.title}\n`;
                if (summary.reason) resultText += `사유: ${summary.reason}\n`;
                resultText += `파일: ${summary.files_modified}개 | 행: ${summary.total_rows_matched}개 매치 | 셀: ${summary.total_cells_modified}개 변경\n`;
                resultText += `테이블: ${(summary.tables as string[]).join(', ')}\n\n`;

                for (const d of details) {
                  if (d.error) {
                    resultText += `❌ ${d.table} (${d.file}): 오류 — ${d.error}\n`;
                    continue;
                  }
                  resultText += `📊 ${d.table} (${d.file}): ${d.rows_matched}행 매치, ${d.cells_modified}셀 변경\n`;
                  const changes = (d.changes as Array<Record<string, unknown>>) || [];
                  if (changes.length > 0) {
                    const uniqueCols = [...new Set(changes.map(c => String(c.column)))];
                    const dispCols = uniqueCols.slice(0, 8);
                    const colHeaders = ['PK', ...dispCols.map(c => c.length > 12 ? c.slice(0, 10) + '..' : c)];
                    resultText += `| ${colHeaders.join(' | ')} |\n`;
                    resultText += `| ${colHeaders.map(() => '---').join(' | ')} |\n`;
                    const byPk = new Map<string, Record<string, { old: string; new: string }>>();
                    for (const c of changes) {
                      const pk = String(c.pk ?? '');
                      if (!byPk.has(pk)) byPk.set(pk, {});
                      byPk.get(pk)![String(c.column)] = { old: String(c.old ?? ''), new: String(c.new ?? '') };
                    }
                    let rowCount = 0;
                    for (const [pk, cols] of byPk) {
                      if (rowCount >= 10) { resultText += `... 외 ${byPk.size - 10}행\n`; break; }
                      const vals = dispCols.map(col => {
                        const ch = cols[col];
                        if (!ch) return '-';
                        const o = ch.old.length > 8 ? ch.old.slice(0, 6) + '..' : ch.old;
                        const n = ch.new.length > 8 ? ch.new.slice(0, 6) + '..' : ch.new;
                        return `~~${o}~~ → **${n}**`;
                      });
                      resultText += `| ${pk} | ${vals.join(' | ')} |\n`;
                      rowCount++;
                    }
                    resultText += '\n';
                  }
                }

                if (isPartial) {
                  resultText += `\n⚠️ 일부 편집이 실패했지만 성공한 편집은 보존되었습니다.\n`;
                  resultText += `실패한 테이블만 다시 편집하면 됩니다 (prev_job_id: ${jobId}).\n`;
                }
                resultText += `📥 다운로드: ${downloadUrl}\n`;
                resultText += `(노란색 하이라이트 = AI 편집 셀)`;

                resultStr = resultText;
                lastBibleTablingJobId = jobId;
                tc = {
                  kind: 'bible_tabling_edit',
                  title,
                  reason,
                  jobId,
                  downloadUrl,
                  downloadFilename,
                  files,
                  filesModified: Number(summary.files_modified ?? 0),
                  totalRowsMatched: Number(summary.total_rows_matched ?? 0),
                  totalCellsModified: Number(summary.total_cells_modified ?? 0),
                  tables: (summary.tables as string[]) || [],
                  details: details.map(d => ({
                    table: String(d.table ?? ''), file: d.file ? String(d.file) : undefined,
                    rows_matched: Number(d.rows_matched ?? 0), cells_modified: Number(d.cells_modified ?? 0),
                    changes: (d.changes as Array<Record<string, unknown>> ?? []).slice(0, 50),
                  })),
                  partial: isPartial,
                  errorCount,
                  duration,
                };
              } else {
                resultStr = '바이브테이블링: SSE 스트림이 완료 이벤트 없이 종료됨';
                tc = { kind: 'bible_tabling_edit', title, reason, jobId: '', downloadUrl: '', downloadFilename: '', files: [], filesModified: 0, totalRowsMatched: 0, totalCellsModified: 0, tables: [], error: resultStr, duration };
              }
            }
          } catch (e) {
            const duration = Date.now() - t0;
            resultStr = `바이브테이블링 연결 실패: ${String(e)}\nstart.bat을 실행하여 바이브테이블링 서버를 시작하세요.`;
            tc = { kind: 'bible_tabling_edit', title, reason, jobId: '', downloadUrl: '', downloadFilename: '', files: [], filesModified: 0, totalRowsMatched: 0, totalCellsModified: 0, tables: [], error: resultStr, duration };
          }
        }
        // ── add_game_data_rows (바이브테이블링 — 행 추가) ──
        else if (tb.name === 'add_game_data_rows') {
          const BIBLE_TABLING_URL = ''; // Vite 프록시 경유 (/api/bible-tabling/ → localhost:8100)
          const title = String(inp.title ?? '바이브테이블링 — 행 추가');
          const reason = inp.reason ? String(inp.reason) : '';
          const table = String(inp.table ?? '');
          const file = inp.file ? String(inp.file) : undefined;
          const csvData = inp.csv ? String(inp.csv) : undefined;
          const cloneSource = inp.clone_source as { column: string; value: string } | undefined;
          const overrideCsv = inp.override_csv ? String(inp.override_csv) : undefined;
          // rows가 문자열로 직렬화된 경우 파싱 (AI가 JSON string으로 넘기는 케이스 대응)
          let rows: unknown[] = [];
          if (!csvData && !cloneSource) {
            try {
              const rawRows = inp.rows;
              if (typeof rawRows === 'string') {
                rows = JSON.parse(rawRows);
              } else if (Array.isArray(rawRows)) {
                rows = rawRows;
              }
            } catch {
              rows = [];
            }
          }

          // rows 3행 이상 차단 — clone_source 또는 csv 사용 강제
          if (!cloneSource && !csvData && rows.length >= 3) {
            resultStr = `🔴 rows에 ${rows.length}행이 포함되어 있습니다. 3행 이상은 rows로 직접 추가할 수 없습니다.\n`
              + `기존 데이터를 복제하는 경우 → clone_source: {column:"PK컬럼명", value:"원본값"}, override_csv: "바꿀컬럼\\n새값1\\n새값2" 사용\n`
              + `완전히 새로운 데이터인 경우 → csv: "컬럼1,컬럼2\\n값1,값2\\n값3,값4" 사용\n`
              + `clone_source는 Python이 원본을 자동 복사하므로 1초 만에 완료됩니다. rows/csv로 재입력하지 마세요!`;
            tc = { kind: 'bible_tabling_add_rows', table, jobId: '', downloadUrl: '', downloadFilename: '', rowsAdded: 0, error: resultStr };
          } else {

          const t0 = Date.now();
          try {
            const bodyPayload: Record<string, unknown> = { title, reason, table, file, prev_job_id: lastBibleTablingJobId };
            if (cloneSource) {
              bodyPayload.clone_source = cloneSource;
              if (overrideCsv) bodyPayload.override_csv = overrideCsv;
            } else if (csvData) {
              bodyPayload.csv = csvData;
            } else {
              bodyPayload.rows = rows;
            }
            const resp = await fetch(`${BIBLE_TABLING_URL}/api/bible-tabling/add-rows`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload),
            });
            const duration = Date.now() - t0;
            if (!resp.ok) {
              const errText = await resp.text();
              resultStr = `바이브테이블링 행 추가 오류 (${resp.status}): ${errText}`;
              tc = { kind: 'bible_tabling_add_rows', table, file, jobId: '', downloadUrl: '', downloadFilename: '', rowsAdded: 0, error: resultStr, duration };
            } else {
              const data = await resp.json() as Record<string, unknown>;
              const summary = data.summary as Record<string, unknown>;
              const jobId = String(data.job_id ?? '');
              const downloadUrl = `${BIBLE_TABLING_URL}${data.download_url}`;
              const downloadFilename = String(data.download_filename ?? '');

              let resultText = `✅ 바이브테이블링 행 추가 완료\n`;
              resultText += `테이블: ${summary.table} (${summary.file})\n`;
              resultText += `추가된 행: ${summary.rows_added}개`;
              if (summary.source_rows) resultText += ` (원본 ${summary.source_rows}행 × ${summary.override_sets}세트 복제)`;
              resultText += '\n';
              if (summary.override_columns && (summary.override_columns as string[]).length > 0) {
                resultText += `변경 컬럼: ${(summary.override_columns as string[]).join(', ')}\n`;
              }
              resultText += '\n';

              // clone 결과의 sample_rows 또는 입력된 rows 데이터를 마크다운 테이블로 표시
              const sampleRows = (summary.sample_rows as Array<Record<string, string>>) ?? [];
              const inputRows = sampleRows.length > 0
                ? sampleRows
                : (Array.isArray(rows) ? rows : []) as Array<Record<string, unknown>>;
              if (inputRows.length > 0) {
                const allCols = new Set<string>();
                for (const r of inputRows) for (const k of Object.keys(r)) allCols.add(k);
                const cols = [...allCols].slice(0, 12);
                const colHeaders = cols.map(c => c.length > 15 ? c.slice(0, 13) + '..' : c);
                resultText += `📋 ${sampleRows.length > 0 ? '변경된 컬럼 값' : '추가된 데이터'}:\n`;
                resultText += `| ${colHeaders.join(' | ')} |\n`;
                resultText += `| ${cols.map(() => '---').join(' | ')} |\n`;
                const showRows = inputRows.slice(0, 15);
                for (const row of showRows) {
                  const vals = cols.map(c => {
                    const v = String((row as Record<string, unknown>)[c] ?? '');
                    return v.length > 18 ? v.slice(0, 16) + '..' : v;
                  });
                  resultText += `| ${vals.join(' | ')} |\n`;
                }
                if (inputRows.length > 15) resultText += `... 외 ${inputRows.length - 15}행\n`;
                resultText += '\n';
              }

              resultText += `📥 다운로드: ${downloadUrl}\n`;
              resultText += `(노란색 하이라이트 = AI 추가 셀)`;

              resultStr = resultText;
              lastBibleTablingJobId = jobId; // 다음 job의 prev_job_id로 사용
              tc = {
                kind: 'bible_tabling_add_rows',
                table,
                file,
                jobId,
                downloadUrl,
                downloadFilename,
                rowsAdded: Number(summary.rows_added ?? 0),
                inputRows: sampleRows.length > 0
                  ? sampleRows.slice(0, 20)
                  : (Array.isArray(rows) ? rows : []).slice(0, 20) as Array<Record<string, unknown>>,
                overrideColumns: (summary.override_columns as string[]) ?? [],
                sampleRows: sampleRows.slice(0, 20),
                duration,
              };
            }
          } catch (e) {
            const duration = Date.now() - t0;
            resultStr = `바이브테이블링 연결 실패: ${String(e)}\nstart.bat을 실행하여 바이브테이블링 서버를 시작하세요.`;
            tc = { kind: 'bible_tabling_add_rows', table, file, jobId: '', downloadUrl: '', downloadFilename: '', rowsAdded: 0, error: resultStr, duration };
          }
          } // rows 차단 else 블록 닫기
        }

        else {
          return; // 알 수 없는 툴 → 건너뜀
        }

        toolCallsMap.set(tb.id, tc!);
        toolResultsMap.set(tb.id, resultStr);
      };

      // 비-BT 도구: 병렬 실행
      await Promise.all(nonBtBlocks.map(executeToolBlock));
      // BT 도구: 순차 실행 (prev_job_id 체이닝을 위해)
      for (const tb of btBlocks) {
        await executeToolBlock(tb);
      }

      // 원래 순서대로 결과 수집 및 콜백 호출
      for (const tb of toolBlocks) {
        const tc = toolCallsMap.get(tb.id);
        const resultStr = toolResultsMap.get(tb.id) ?? '';
        if (!tc) continue;
        allToolCalls.push(tc);
        onToolCall?.(tc, allToolCalls.length - 1);
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: resultStr });
      }

      for (const tb of toolBlocks) {
        const label = TOOL_LABELS[tb.name] ?? `🔧 ${tb.name}`;
        onThinkingUpdate?.({ type: 'tool_done', iteration: i + 1, maxIterations: MAX_ITERATIONS, toolName: tb.name, toolLabel: label, timestamp: Date.now() });
      }

      // ── 워크플로: 편집 후 FK 힌트 + 검증 알림 자동 주입 ──
      if (wfState.type && btBlocks.length > 0) {
        const btEditedTables: string[] = [];
        for (const tb of btBlocks) {
          const tc = toolCallsMap.get(tb.id);
          if (tc && !('error' in tc && (tc as unknown as Record<string, unknown>).error)) {
            const inp = tb.input as Record<string, unknown>;
            const editPlan = inp.edit_plan as Array<Record<string, unknown>> | undefined;
            const tableName = String(inp.table ?? editPlan?.[0]?.table ?? '');
            if (tableName) btEditedTables.push(tableName);
            if (editPlan && editPlan.length > 1) {
              for (let p = 1; p < editPlan.length; p++) {
                const t = String(editPlan[p].table ?? '');
                if (t && !btEditedTables.includes(t)) btEditedTables.push(t);
              }
            }
          }
        }

        if (btEditedTables.length > 0) {
          const resolvedSchema = effectiveSchema;
          const fkHints = btEditedTables.map(t => {
            const tLower = t.toLowerCase();
            const refs = resolvedSchema?.refs?.filter(r =>
              r.fromTable.toLowerCase() === tLower || r.toTable.toLowerCase() === tLower
            ) ?? [];
            const related = refs.flatMap(r => [r.fromTable, r.toTable])
              .filter(n => n.toLowerCase() !== tLower && !btEditedTables.some(bt => bt.toLowerCase() === n.toLowerCase()));
            return { table: t, related: [...new Set(related)] };
          });

          const hintLines = [
            `⚡ [워크플로 시스템] 편집 완료: ${btEditedTables.join(', ')}`,
            ...fkHints.filter(h => h.related.length > 0).map(h =>
              `  FK 관련 테이블: ${h.related.slice(0, 8).join(', ')}`
            ),
            '→ 다음 필수 단계: 검증 실행 (validation rule 또는 FK 무결성 쿼리)',
            '→ :::progress 업데이트 필수',
          ];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          toolResults.push({ type: 'text', text: hintLines.join('\n') } as any);

          for (const t of btEditedTables) {
            wfState.editedTables.set(t, { jobId: lastBibleTablingJobId ?? '', rows: 0 });
          }
          wfState.verifiedAfterEdit = false;
        }
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

        const tokenUsage = buildTokenSummary();
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
        const autoTitle = truncatedText.match(/^#+\s*(.+)/m)?.[1] ?? '문서';
        const autoTc: ArtifactResult = { kind: 'artifact', title: autoTitle, description: '', html: finalArtHtml, duration: 0 };
        allToolCalls.push(autoTc);
        onToolCall?.(autoTc, allToolCalls.length - 1);
      }

      // 데이터 수집 완료 & 아티팩트 미생성 → create_artifact 재촉 (단, 바이브테이블링이면 제외!)
      const hadBibleTabling = allToolCalls.some(tc => tc.kind === 'bible_tabling_edit' || tc.kind === 'bible_tabling_add_rows');
      if (hasFetchedData && !hasArtifact && !artHtmlTruncated && !hadBibleTabling) {
        messages.push({
          role: 'user',
          content:
            '수집한 데이터를 바탕으로 <<<ARTIFACT_START>>>HTML<<<ARTIFACT_END>>> 형식으로 HTML을 먼저 출력한 후, create_artifact(title=...) 를 호출하세요. ' +
            '추가 데이터 조회 없이 현재 데이터만으로 바로 만들어주세요. 핵심 내용을 간결하게 500줄 이내로.',
        });
      } else if (hadBibleTabling && !artHtmlTruncated) {
        // 바이브테이블링 중 max_tokens → 데이터를 줄여서 재시도 안내
        messages.push({
          role: 'user',
          content:
            '바이브테이블링 도구 호출이 max_tokens로 잘렸습니다. 데이터 양을 줄여서 다시 호출하세요.\n' +
            '⚠️ rows 배열을 절반으로 나눠서 2번에 걸쳐 호출하세요. (예: 10행 → 5행씩 2번)\n' +
            '❌ create_artifact 절대 금지! edit_game_data/add_game_data_rows만 사용하세요.',
        });
      } else if (!artHtmlTruncated) {
        // 일반 텍스트 잘림 → 누적 후 자동 계속
        if (truncatedText) {
          totalText += truncatedText;
        }
        continuationCount++;
        onThinkingUpdate?.({ type: 'continuation', iteration: i + 1, maxIterations: MAX_ITERATIONS, detail: `자동 계속 ${continuationCount}회 (${totalText.length}자)`, timestamp: Date.now() });
        messages.push({
          role: 'user',
          content: '이어서 계속 작성해주세요. 바로 이전 텍스트 뒤부터 자연스럽게 이어서 작성하세요. 중복 없이 바로 이어주세요.',
        });
      }
      continue;
    }

    // ★ 마지막 이터레이션: 잘린 아티팩트라도 누적된 HTML로 생성 (바이브테이블링이면 제외)
    const hadBT = allToolCalls.some(tc => tc.kind === 'bible_tabling_edit' || tc.kind === 'bible_tabling_add_rows');
    if (artHtmlTruncated && !hasArtifact && !hadBT) {
      const finalArtHtml = artifactAccumulatedHtml + streamedArtifactHtml!;
      const autoTitle = truncatedText.match(/^#+\s*(.+)/m)?.[1] ?? '문서 (미완성)';
      const autoTc: ArtifactResult = { kind: 'artifact', title: autoTitle, description: '(max_tokens로 잘린 문서)', html: finalArtHtml, duration: 0 };
      allToolCalls.push(autoTc);
      onToolCall?.(autoTc, allToolCalls.length - 1);
    }

    // 마지막 이터레이션에서도 잘린 경우 → rawMessages 저장하여 '계속해줘' 지원
    pushAssistantWithOrphanFix(messages);
    const finalTruncatedText = stripHtmlFromChatText(continuationCount > 0 ? totalText + truncatedText : truncatedText);
    const tokenUsage = buildTokenSummary();
    useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));
    return {
      content: finalTruncatedText || '(응답이 잘렸습니다)',
      toolCalls: allToolCalls,
      rawMessages: messages,
      tokenUsage,
    };
  }

  // ── MAX_ITERATIONS 모두 소진 → rawMessages 포함하여 '계속하기' 지원 ──
  const tokenUsage = buildTokenSummary();
  useRagTraceStore.getState().pushTrace(buildRagTrace(userMessage, allToolCalls, tokenUsage));

  // 조회된 데이터가 있으면 rawMessages를 보존하여 계속하기 버튼 지원
  const hasCollectedData = allToolCalls.length > 0;
  const dataToolCount = allToolCalls.filter(
    (tc) => tc.kind === 'data_query' || tc.kind === 'schema_card' || tc.kind === 'character_profile' ||
            tc.kind === 'git_history' || tc.kind === 'jira_search' || tc.kind === 'confluence_page' ||
            tc.kind === 'bible_tabling_edit' || tc.kind === 'bible_tabling_add_rows',
  ).length;

  if (hasCollectedData) {
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
