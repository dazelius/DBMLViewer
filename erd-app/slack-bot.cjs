/**
 * DataMaster Slack Bot
 * 
 * Slack에서 @DataMaster 멘션 또는 DM으로 게임 데이터 조회, 코드 분석,
 * Jira 이슈 관리, 웹 검색 등 DataMaster의 모든 기능을 사용할 수 있습니다.
 * 
 * 사용법:
 *   1. .env 파일에 SLACK_BOT_TOKEN, SLACK_APP_TOKEN 설정
 *   2. node slack-bot.js 실행
 * 
 * 필요한 Slack App 권한:
 *   Bot Token Scopes: chat:write, app_mentions:read, im:read, im:write, im:history,
 *                      channels:history, groups:history, reactions:read
 *   Socket Mode: 활성화 필요
 *   Event Subscriptions: app_mention, message.im
 */

const { App } = require('@slack/bolt');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

// ── .env 로드 ──
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

// ── 설정 ──
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN || '';
const DATAMASTER_URL = process.env.DATAMASTER_URL || 'http://localhost:5173';
// 외부에서 접근 가능한 URL (Slack 링크용)
const DATAMASTER_PUBLIC_URL = process.env.DATAMASTER_PUBLIC_URL || DATAMASTER_URL;

if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  ❌ Slack 토큰이 설정되지 않았습니다!                          ║
║                                                              ║
║  .env 파일에 다음을 추가하세요:                                ║
║                                                              ║
║  SLACK_BOT_TOKEN=xoxb-your-bot-token                        ║
║  SLACK_APP_TOKEN=xapp-your-app-token                        ║
║                                                              ║
║  Slack App 생성 방법:                                         ║
║  1. https://api.slack.com/apps → "Create New App"            ║
║  2. "From scratch" → 앱 이름: DataMaster                     ║
║  3. Settings → Socket Mode → Enable                          ║
║     → App-Level Token 생성 (connections:write 스코프)         ║
║  4. OAuth & Permissions → Bot Token Scopes 추가:             ║
║     chat:write, app_mentions:read,                           ║
║     im:read, im:write, im:history,                           ║
║     channels:history, groups:history                         ║
║  5. Event Subscriptions → Enable → Subscribe to bot events:  ║
║     app_mention, message.im                                  ║
║  6. Install to Workspace → Bot Token 복사                    ║
╚══════════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

// ── Slack App 초기화 (Socket Mode) ──
const app = new App({
  token: SLACK_BOT_TOKEN,
  appToken: SLACK_APP_TOKEN,
  socketMode: true,
});

// ── 세션 관리 (thread_ts → session_id) ──
const threadSessions = new Map();

function getSessionId(channel, threadTs) {
  const key = `${channel}:${threadTs || 'main'}`;
  if (!threadSessions.has(key)) {
    threadSessions.set(key, `slack-${channel}-${threadTs || Date.now()}`);
  }
  return threadSessions.get(key);
}

// ── 쓰레드별 메타정보 축적 ──
// 각 쓰레드에서 조회된 테이블, 스키마, Jira 이슈 등 핵심 데이터를 축적
const threadMeta = new Map();

function getThreadMeta(channel, threadTs) {
  const key = `${channel}:${threadTs || 'main'}`;
  if (!threadMeta.has(key)) {
    threadMeta.set(key, {
      queriedTables: [],   // 조회한 테이블 + 요약
      schemas: [],         // 확인한 스키마
      jiraIssues: [],      // 조회한 Jira 이슈
      codeFiles: [],       // 조회한 코드 파일
      keyFindings: [],     // 핵심 발견사항
      questionCount: 0,
    });
  }
  return threadMeta.get(key);
}

// 도구 결과에서 메타정보 추출하여 축적
function accumulateToolMeta(channel, threadTs, toolCalls) {
  const meta = getThreadMeta(channel, threadTs);
  
  for (const tc of toolCalls) {
    const summary = tc.summary || '';
    
    switch (tc.tool) {
      case 'query_game_data': {
        // "17행 조회됨 (표시: 17행)컬럼: id, name, ..." → 테이블 + 행 수 + 컬럼
        const rowMatch = summary.match(/(\d+)행 조회됨/);
        const colMatch = summary.match(/컬럼:\s*(.+)/);
        const tableMatch = (tc.input || '').match(/FROM\s+[`"]?(\w+)[`"]?/i);
        const entry = {
          table: tableMatch?.[1] || '(알 수 없음)',
          rows: rowMatch?.[1] || '?',
          columns: colMatch?.[1]?.slice(0, 80) || '',
          query: (tc.input || '').slice(0, 100),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        // 중복 방지
        if (!meta.queriedTables.some(t => t.table === entry.table && t.query === entry.query)) {
          meta.queriedTables.push(entry);
          if (meta.queriedTables.length > 10) meta.queriedTables.shift(); // 최대 10개 유지
        }
        break;
      }
      case 'show_table_schema': {
        const tblMatch = summary.match(/테이블:\s*(\S+)/);
        const colMatch = summary.match(/컬럼\s*\((\d+)개\):\s*(.+)/);
        if (tblMatch) {
          const entry = {
            table: tblMatch[1],
            columnCount: colMatch?.[1] || '?',
            columns: colMatch?.[2]?.slice(0, 100) || '',
          };
          if (!meta.schemas.some(s => s.table === entry.table)) {
            meta.schemas.push(entry);
            if (meta.schemas.length > 8) meta.schemas.shift();
          }
        }
        break;
      }
      case 'get_jira_issue':
      case 'search_jira': {
        const issueMatch = summary.match(/([A-Z]+-\d+)/);
        if (issueMatch && !meta.jiraIssues.includes(issueMatch[1])) {
          meta.jiraIssues.push(issueMatch[1]);
          if (meta.jiraIssues.length > 5) meta.jiraIssues.shift();
        }
        break;
      }
      case 'search_code':
      case 'read_code_file': {
        const fileMatch = (tc.input || '').match(/[\w/]+\.\w+/);
        if (fileMatch && !meta.codeFiles.includes(fileMatch[0])) {
          meta.codeFiles.push(fileMatch[0]);
          if (meta.codeFiles.length > 5) meta.codeFiles.shift();
        }
        break;
      }
    }
  }
  
  meta.questionCount++;
}

// 축적된 메타정보를 컨텍스트 텍스트로 변환
function buildMetaContext(channel, threadTs) {
  const meta = getThreadMeta(channel, threadTs);
  if (meta.questionCount === 0) return '';
  
  const parts = [];
  
  if (meta.queriedTables.length > 0) {
    const tableList = meta.queriedTables.map(t => 
      `  • ${t.table} (${t.rows}행) — ${t.columns}`
    ).join('\n');
    parts.push(`📊 이 쓰레드에서 이미 조회한 테이블:\n${tableList}`);
  }
  
  if (meta.schemas.length > 0) {
    const schemaList = meta.schemas.map(s => 
      `  • ${s.table} (${s.columnCount}개 컬럼: ${s.columns})`
    ).join('\n');
    parts.push(`📋 확인한 스키마:\n${schemaList}`);
  }
  
  if (meta.jiraIssues.length > 0) {
    parts.push(`🎫 조회한 Jira 이슈: ${meta.jiraIssues.join(', ')}`);
  }
  
  if (meta.codeFiles.length > 0) {
    parts.push(`💻 조회한 코드 파일: ${meta.codeFiles.join(', ')}`);
  }
  
  if (parts.length === 0) return '';
  
  return `[이전 대화에서 수집된 데이터 — ${meta.questionCount}번째 질문]\n${parts.join('\n')}\n위 데이터를 참고하여 답변하세요. 이미 조회한 테이블은 중복 쿼리하지 않아도 됩니다.`;
}

// ── DataMaster API 호출 (SSE 스트리밍 — 텍스트 + 도구 진행 상황 수집) ──
async function callDataMasterStreaming(message, sessionId, onToolStart) {
  const url = `${DATAMASTER_URL}/api/v1/chat`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000); // 3분 타임아웃

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        stream: true,
        fast: true,  // Slack은 빠른 응답 우선 → Sonnet 모델 사용
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`DataMaster API error ${resp.status}: ${errText}`);
    }

    // SSE 이벤트를 한 줄씩 파싱
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let doneContent = '';           // done 이벤트의 content
    let allStreamedTexts = [];      // 모든 이터레이션의 text_delta 누적 (백업)
    let currentIterText = '';       // 현재 이터레이션의 text_delta
    const toolCalls = [];
    let sessionIdReturned = sessionId;
    let currentEventType = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === '') {
          currentEventType = '';
          continue;
        }
        
        if (trimmed.startsWith('event:')) {
          currentEventType = trimmed.slice(6).trim();
          continue;
        }
        
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;
          
          try {
            const data = JSON.parse(dataStr);
            
            switch (currentEventType) {
              case 'session':
                sessionIdReturned = data.session_id || sessionIdReturned;
                break;
                
              case 'text_delta':
                // full_text: 현재 이터레이션 내 누적 텍스트
                if (data.full_text) currentIterText = data.full_text;
                else if (data.delta) currentIterText += data.delta;
                break;
                
              case 'tool_start':
                toolCalls.push({ tool: data.tool, input: data.input, status: 'running' });
                if (onToolStart) onToolStart(data.tool, data.input);
                break;
                
              case 'tool_done': {
                const running = [...toolCalls].reverse().find(t => t.status === 'running');
                if (running) { running.status = 'done'; running.summary = data.summary; }
                break;
              }
              
              case 'thinking':
                // 새 이터레이션 시작 — 이전 이터레이션 텍스트 저장 후 리셋
                if (currentIterText.trim()) allStreamedTexts.push(currentIterText.trim());
                currentIterText = '';
                break;
                
              case 'done':
                doneContent = data.content || '';
                if (data.tool_calls) {
                  toolCalls.length = 0;
                  toolCalls.push(...data.tool_calls);
                }
                break;
                
              case 'error':
                // 서버에서 보낸 에러 이벤트 (msg_too_long 등)
                const errMsg = data.error || 'Unknown error';
                console.warn(`[SSE] 서버 에러 이벤트: ${errMsg}`);
                if (!data.recoverable) {
                  // 복구 불가능한 에러 → 에러 내용을 content에 포함
                  if (!doneContent) doneContent = `⚠️ ${errMsg}`;
                }
                break;
            }
          } catch (e) {
            console.log(`[SSE] JSON 파싱 실패 (${currentEventType}): ${dataStr.slice(0, 100)}...`);
          }
        }
      }
    }

    // 마지막 이터레이션의 텍스트도 저장
    if (currentIterText.trim()) allStreamedTexts.push(currentIterText.trim());
    
    // 우선순위: done 이벤트 content → 모든 이터레이션 텍스트 합산
    const streamedFull = allStreamedTexts.join('\n\n');
    const finalContent = doneContent || streamedFull;
    
    console.log(`[SSE] 결과: doneContent=${doneContent.length}자, streamedTexts=${allStreamedTexts.length}개(${streamedFull.length}자), 최종=${finalContent.length}자, tools=${toolCalls.length}개`);

    return { content: finalContent, toolCalls, sessionId: sessionIdReturned };
  } finally {
    clearTimeout(timeout);
  }
}

// ── 마크다운 테이블 → Slack 코드블록 변환 ──
function mdTableToSlack(tableText) {
  const lines = tableText.trim().split('\n');
  if (lines.length < 2) return tableText;

  // 헤더와 구분선 제거 후 데이터 파싱
  const rows = [];
  for (const line of lines) {
    if (/^[\s|:-]+$/.test(line)) continue; // 구분선 스킵
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return tableText;

  // 각 컬럼의 최대 너비 계산 (최대 20자)
  const colCount = Math.max(...rows.map(r => r.length));
  const widths = Array(colCount).fill(0);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      widths[i] = Math.min(20, Math.max(widths[i], row[i].length));
    }
  }

  // 정렬된 텍스트 테이블 생성
  const formatted = rows.map((row, ri) => {
    const cells = row.map((cell, ci) => {
      const w = widths[ci] || 10;
      return cell.slice(0, w).padEnd(w);
    });
    let line = cells.join(' │ ');
    if (ri === 0) {
      // 헤더 아래 구분선 추가
      const sep = widths.map(w => '─'.repeat(w)).join('─┼─');
      return line + '\n' + sep;
    }
    return line;
  });

  return '```\n' + formatted.join('\n') + '\n```';
}

// ── 마크다운 → Slack mrkdwn 변환 ──
function mdToSlack(text) {
  if (!text) return '';
  
  // 1) 마크다운 테이블을 먼저 변환 (|로 시작하는 연속된 줄)
  text = text.replace(/((?:^\|.+\|$\n?){2,})/gm, (match) => {
    return mdTableToSlack(match);
  });
  
  return text
    // 볼드: **text** → *text*
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    // 코드블록: ```lang\ncode\n``` → ```\ncode\n```
    .replace(/```\w*\n/g, '```\n')
    // 링크: [text](url) → <url|text>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
    // 헤더: # → *bold* (Slack mrkdwn에는 헤더가 없음)
    .replace(/^#{1,6}\s+(.+)/gm, '*$1*')
    // 체크박스: - [ ] → ☐, - [x] → ☑
    .replace(/- \[ \]/g, '☐')
    .replace(/- \[x\]/gi, '☑')
    // 수평선
    .replace(/^---+$/gm, '─'.repeat(30))
    .trim();
}

// ── 도구 → 사용자 친화적 설명 ──
const TOOL_LABELS = {
  query_game_data:   '📊 데이터 조회',
  show_table_schema: '📋 테이블 구조',
  query_git_history: '📂 Git 이력',
  create_artifact:   '📄 문서 생성',
  patch_artifact:    '✏️ 문서 수정',
  search_code:       '💻 코드 검색',
  read_code_file:    '💻 코드 읽기',
  read_guide:        '📖 가이드 참조',
  search_jira:       '🎫 Jira 검색',
  get_jira_issue:    '🎫 Jira 이슈',
  create_jira_issue: '➕ Jira 생성',
  add_jira_comment:  '✍️ Jira 댓글',
  update_jira_issue_status: '🔄 Jira 상태변경',
  search_confluence: '📚 Confluence 검색',
  get_confluence_page: '📚 Confluence 문서',
  save_knowledge:    '🧠 지식 저장',
  read_knowledge:    '🧠 지식 읽기',
  list_knowledge:    '🧠 지식 목록',
  delete_knowledge:  '🧠 지식 삭제',
  web_search:        '🌐 웹 검색',
  read_url:          '🌐 URL 읽기',
  search_assets:     '🎨 에셋 검색',
  build_character_profile: '👤 캐릭터 프로필',
  preview_prefab:    '🧩 프리팹',
  preview_fbx_animation: '🎬 애니메이션',
  find_resource_image: '🖼️ 이미지 찾기',
};

// ── 도구 결과 요약을 Slack 친화적으로 포맷 ──
function formatToolResultForSlack(tc) {
  const label = TOOL_LABELS[tc.tool] || `🔧 ${tc.tool}`;
  const summary = (tc.summary || '').trim();
  
  // 쿼리 결과: "N행 조회됨..." → 깔끔하게
  if (tc.tool === 'query_game_data') {
    const rowMatch = summary.match(/(\d+)행 조회/);
    const colMatch = summary.match(/컬럼:\s*(.+)/);
    if (rowMatch) {
      const cols = colMatch ? colMatch[1].split(',').slice(0, 5).map(c => c.trim()).join(', ') : '';
      const colInfo = cols ? ` (${cols}${colMatch[1].split(',').length > 5 ? ', ...' : ''})` : '';
      return `${label}: *${rowMatch[1]}행*${colInfo}`;
    }
    if (summary.includes('SQL 오류') || summary.includes('오류')) {
      return `${label}: ⚠️ 쿼리 재시도`;
    }
  }
  
  if (tc.tool === 'show_table_schema') {
    const tableMatch = summary.match(/테이블:\s*(\S+)/);
    const colMatch = summary.match(/컬럼\s*\((\d+)개\)/);
    if (tableMatch) {
      return `${label}: \`${tableMatch[1]}\`${colMatch ? ` (${colMatch[1]}개 컬럼)` : ''}`;
    }
  }
  
  if (tc.tool === 'search_code' || tc.tool === 'read_code_file') {
    const fileMatch = summary.match(/파일:\s*(\S+)/);
    if (fileMatch) return `${label}: \`${fileMatch[1]}\``;
  }
  
  // 기본: 80자 요약
  const short = summary.slice(0, 80).replace(/\n/g, ' ');
  return short ? `${label}: ${short}` : label;
}

// ── 도구 호출 요약 생성 (Slack 블록) ──
function formatToolSummary(toolCalls) {
  if (!toolCalls || toolCalls.length === 0) return '';
  
  // 같은 도구의 연속 호출은 묶기
  const groups = [];
  for (const tc of toolCalls) {
    const last = groups[groups.length - 1];
    if (last && last.tool === tc.tool) {
      last.count++;
      last.items.push(tc);
    } else {
      groups.push({ tool: tc.tool, count: 1, items: [tc] });
    }
  }
  
  const lines = groups.map(g => {
    if (g.count === 1) {
      return formatToolResultForSlack(g.items[0]);
    }
    // 같은 도구 여러 번: 성공/실패 구분
    const ok = g.items.filter(t => !(t.summary || '').includes('오류'));
    const fail = g.items.length - ok.length;
    const label = TOOL_LABELS[g.tool] || `🔧 ${g.tool}`;
    let info = `${label} ×${g.count}`;
    if (fail > 0) info += ` (${fail}건 재시도)`;
    return info;
  });

  return '\n\n─────────────────\n' + lines.join('\n');
}

// ── 마크다운에서 Slack용 요약 추출 (테이블/코드 제외, 주요 텍스트만) ──
function extractSlackSummary(markdown) {
  if (!markdown) return '📊 분석이 완료되었습니다.';
  
  const lines = markdown.split('\n');
  const summaryLines = [];
  let inCodeBlock = false;
  let inTable = false;
  
  for (const line of lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    
    // 테이블 행 스킵
    if (/^\|.+\|/.test(line)) { inTable = true; continue; }
    if (inTable && line.trim() === '') { inTable = false; }
    if (inTable) continue;
    
    // 테이블 구분선 스킵
    if (/^[\s|:-]+$/.test(line)) continue;
    
    const trimmed = line.trim();
    if (!trimmed) {
      if (summaryLines.length > 0) summaryLines.push('');
      continue;
    }
    
    summaryLines.push(trimmed);
    
    // 요약은 최대 600자 정도
    if (summaryLines.join('\n').length > 600) break;
  }
  
  let summary = summaryLines.join('\n').trim();
  if (!summary) summary = '📊 분석이 완료되었습니다.';
  
  // mdToSlack 변환 적용
  summary = mdToSlack(summary);
  
  return summary;
}

// ── Slack 메시지 길이 제한 처리 ──
function truncateForSlack(text, maxLen = 3800) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\n\n... _(응답이 잘렸습니다. DataMaster 웹에서 전체 내용을 확인하세요)_';
}

// ── Slack 메시지에서 링크 추출 ──
function extractLinks(text) {
  const links = [];
  // Slack 형식 링크: <URL|표시텍스트> 또는 <URL>
  const slackLinkRegex = /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>|(?<![<])(https?:\/\/[^\s>]+)/g;
  let m;
  while ((m = slackLinkRegex.exec(text)) !== null) {
    links.push(m[1] || m[2]);
  }
  return [...new Set(links)];
}

// ── Slack 메시지 텍스트 정리 (멘션, 채널 참조 등 제거) ──
function cleanSlackText(text) {
  return (text || '')
    .replace(/<@[A-Z0-9]+>/g, '')           // @멘션 제거
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1') // #채널 참조를 텍스트로
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '$2 ($1)') // 링크 → 텍스트(URL)
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')   // <URL> → URL
    .trim();
}

// ── 쓰레드 컨텍스트 수집 (부모 메시지 + 이전 대화) ──
async function fetchThreadContext(client, channel, threadTs, currentTs) {
  if (!threadTs) return null;
  
  try {
    const result = await client.conversations.replies({
      channel,
      ts: threadTs,
      limit: 20, // 최근 20개
      inclusive: true,
    });
    
    if (!result.ok || !result.messages || result.messages.length === 0) return null;
    
    const contextParts = [];
    const allLinks = [];
    
    for (const msg of result.messages) {
      // 현재 메시지와 봇 자신의 메시지는 스킵
      if (msg.ts === currentTs) continue;
      
      const isBot = !!msg.bot_id || msg.subtype === 'bot_message';
      const who = isBot ? 'DataMaster' : (msg.user ? `사용자(${msg.user})` : '사용자');
      const text = cleanSlackText(msg.text);
      
      if (!text) continue;
      
      // 링크 추출
      const links = extractLinks(msg.text);
      allLinks.push(...links);
      
      // 부모 메시지 vs 리플라이 구분
      const isParent = msg.ts === threadTs;
      if (isParent) {
        contextParts.unshift(`[쓰레드 원글 — ${who}]\n${text}`);
      } else {
        // 최근 5개 리플라이만 포함 (너무 길어지지 않게)
        if (contextParts.length < 6) {
          contextParts.push(`[${who}]\n${text.slice(0, 500)}`);
        }
      }
    }
    
    return {
      context: contextParts.join('\n\n---\n\n'),
      links: [...new Set(allLinks)],
    };
  } catch (e) {
    console.warn('[Slack] 쓰레드 컨텍스트 수집 실패:', e.message);
    return null;
  }
}

// ── 메시지 처리 핸들러 ──
async function handleMessage({ message, say, client, event }) {
  // 봇 자신의 메시지 무시
  if (message?.bot_id || message?.subtype === 'bot_message') return;

  const channel = event?.channel || message?.channel;
  const threadTs = event?.thread_ts || message?.thread_ts || message?.ts || event?.ts;
  const currentTs = message?.ts || event?.ts;
  const userText = cleanSlackText(event?.text || message?.text || '');

  if (!userText) return;

  const sessionId = getSessionId(channel, threadTs);

  // 로딩 표시
  let loadingMsg;
  try {
    loadingMsg = await client.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: '🔍 분석 중...',
      blocks: [
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: '🔍 *DataMaster* 분석 중... 잠시만 기다려주세요.' }],
        },
      ],
    });
  } catch (e) {
    console.error('[Slack] 로딩 메시지 전송 실패:', e.message);
  }

  try {
    console.log(`[Slack] 메시지 수신: channel=${channel} thread=${threadTs} text="${userText.slice(0, 50)}..."`);
    
    // ── 쓰레드 컨텍스트 수집 ──
    let enrichedMessage = userText;
    const threadCtx = await fetchThreadContext(client, channel, threadTs, currentTs);
    
    if (threadCtx) {
      const parts = [];
      
      // 쓰레드 대화 컨텍스트
      if (threadCtx.context) {
        parts.push(`[이 대화는 Slack 쓰레드에서 진행 중입니다. 아래는 쓰레드의 이전 대화입니다]\n\n${threadCtx.context}`);
      }
      
      // 링크 정보 첨부
      if (threadCtx.links.length > 0) {
        const jiraLinks = threadCtx.links.filter(l => l.includes('jira') || l.includes('atlassian.net'));
        const confLinks = threadCtx.links.filter(l => l.includes('confluence') || l.includes('wiki'));
        const otherLinks = threadCtx.links.filter(l => !jiraLinks.includes(l) && !confLinks.includes(l));
        
        const linkDescs = [];
        for (const link of jiraLinks) {
          // Jira 이슈 키 추출 (AEGIS-1234 등)
          const issueMatch = link.match(/\/browse\/([A-Z]+-\d+)/);
          if (issueMatch) {
            linkDescs.push(`• Jira 이슈: ${issueMatch[1]} (${link}) — 이 이슈의 내용을 get_jira_issue로 확인하세요`);
          } else {
            linkDescs.push(`• Jira 링크: ${link}`);
          }
        }
        for (const link of confLinks) {
          linkDescs.push(`• Confluence 문서: ${link} — search_confluence 또는 get_confluence_page로 확인하세요`);
        }
        for (const link of otherLinks) {
          linkDescs.push(`• 참고 링크: ${link} — read_url로 내용을 확인할 수 있습니다`);
        }
        
        if (linkDescs.length > 0) {
          parts.push(`[쓰레드에 언급된 링크]\n${linkDescs.join('\n')}`);
        }
      }
      
      if (parts.length > 0) {
        enrichedMessage = parts.join('\n\n') + `\n\n---\n\n[현재 질문]\n${userText}`;
        console.log(`[Slack] 쓰레드 컨텍스트 추가: ${threadCtx.context?.length || 0}자, 링크 ${threadCtx.links.length}개`);
      }
    }
    
    // ── 현재 메시지의 링크도 추출 ──
    const currentLinks = extractLinks(event?.text || message?.text || '');
    if (currentLinks.length > 0 && !threadCtx?.links?.length) {
      const linkDescs = currentLinks.map(link => {
        const jiraMatch = link.match(/\/browse\/([A-Z]+-\d+)/);
        if (jiraMatch) return `Jira 이슈 ${jiraMatch[1]}의 내용을 get_jira_issue로 확인하세요. URL: ${link}`;
        if (link.includes('confluence') || link.includes('wiki')) return `Confluence 문서: ${link} — get_confluence_page로 확인하세요`;
        return `참고: ${link} — read_url로 내용을 확인할 수 있습니다`;
      });
      enrichedMessage = userText + `\n\n[메시지에 포함된 링크]\n${linkDescs.join('\n')}`;
    }
    
    // ── 축적된 메타정보 주입 ──
    const metaCtx = buildMetaContext(channel, threadTs);
    if (metaCtx) {
      enrichedMessage = `${metaCtx}\n\n---\n\n${enrichedMessage}`;
      console.log(`[Slack] 메타정보 주입: 테이블 ${getThreadMeta(channel, threadTs).queriedTables.length}개, 스키마 ${getThreadMeta(channel, threadTs).schemas.length}개`);
    }
    
    // 실시간 도구 사용 표시 (SSE 스트리밍)
    const toolProgress = [];
    const TOOL_EMOJI = {
      query_game_data: '📊', show_table_schema: '📋', query_git_history: '📂',
      create_artifact: '📄', patch_artifact: '✏️',
      search_code: '💻', read_code_file: '💻', read_guide: '📖',
      search_jira: '🎫', get_jira_issue: '🎫', create_jira_issue: '➕',
      add_jira_comment: '✍️', update_jira_issue_status: '🔄',
      search_confluence: '📚', get_confluence_page: '📚',
      save_knowledge: '🧠', read_knowledge: '🧠',
      web_search: '🌐', read_url: '🌐',
      search_assets: '🎨', build_character_profile: '👤',
      preview_prefab: '🧩', preview_fbx_animation: '🎬',
      find_resource_image: '🖼️',
    };

    let lastUpdate = 0;
    const onToolStart = async (toolName) => {
      const label = TOOL_LABELS[toolName] || `🔧 ${toolName}`;
      toolProgress.push(label);
      
      // 너무 자주 업데이트하지 않도록 1.5초 디바운스
      const now = Date.now();
      if (now - lastUpdate < 1500 || !loadingMsg?.ts) return;
      lastUpdate = now;
      
      try {
        // 최근 3개만 표시
        const recent = toolProgress.slice(-3);
        const dots = toolProgress.length > 3 ? `외 ${toolProgress.length - 3}개...  ` : '';
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: `🔍 분석 중... (${toolProgress.length}단계)`,
          blocks: [{
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `🔍 *DataMaster* 분석 중...\n${dots}${recent.join(' → ')}` }],
          }],
        });
      } catch { /* rate limit 무시 */ }
    };

    const result = await callDataMasterStreaming(enrichedMessage, sessionId, onToolStart);
    const rawContent = result.content || '';
    
    // ── 도구 결과에서 메타정보 축적 ──
    if (result.toolCalls.length > 0) {
      accumulateToolMeta(channel, threadTs, result.toolCalls);
      const meta = getThreadMeta(channel, threadTs);
      console.log(`[Slack] 메타 축적: 테이블 ${meta.queriedTables.length}개, 스키마 ${meta.schemas.length}개, Jira ${meta.jiraIssues.length}개, Q#${meta.questionCount}`);
    }
    
    // ── 복잡한 콘텐츠 감지 (테이블, 긴 응답, 코드블록 등) ──
    const hasTable = /\|.+\|.+\|/.test(rawContent) && rawContent.split('\n').filter(l => l.includes('|')).length > 2;
    const hasCodeBlock = /```[\s\S]{200,}```/.test(rawContent);
    const isLong = rawContent.length > 1200;
    const hasArtifact = result.toolCalls.some(tc => tc.tool === 'create_artifact' || tc.tool === 'patch_artifact');
    const needsPublish = (hasTable || hasCodeBlock || isLong) && !hasArtifact;
    
    // ── 자동 출판: 복잡한 콘텐츠 → HTML 페이지로 변환 후 링크 제공 ──
    let publishedUrl = null;
    if (needsPublish) {
      try {
        const titleGuess = userText.slice(0, 40) + (userText.length > 40 ? '...' : '');
        const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleGuess, markdown: rawContent }),
        });
        if (pubResp.ok) {
          const pubData = await pubResp.json();
          // localhost URL을 외부 접근 가능한 URL로 변환
          publishedUrl = pubData.url.replace(DATAMASTER_URL, DATAMASTER_PUBLIC_URL);
          // 추가 안전장치: localhost가 남아있으면 public URL로 교체
          if (publishedUrl.includes('localhost') && DATAMASTER_PUBLIC_URL !== DATAMASTER_URL) {
            publishedUrl = publishedUrl.replace(/http:\/\/localhost:\d+/, DATAMASTER_PUBLIC_URL);
          }
          console.log(`[Slack] 자동 출판: ${publishedUrl}`);
        }
      } catch (e) {
        console.warn('[Slack] 자동 출판 실패:', e.message);
      }
    }
    
    // ── Slack 메시지 조립 ──
    const blocks = [];
    
    if (publishedUrl) {
      // 출판된 경우: 요약 + 링크 버튼
      const summary = extractSlackSummary(rawContent);
      
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: summary },
      });
      blocks.push({
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: '📊 전체 결과 보기', emoji: true },
          url: publishedUrl,
          style: 'primary',
        }],
      });
    } else {
      // 짧은 응답: Slack mrkdwn으로 직접 표시
      let slackText = mdToSlack(rawContent);
      if (!slackText.trim() && result.toolCalls.length > 0) {
        slackText = result.toolCalls.map(tc => formatToolResultForSlack(tc)).join('\n');
      }
      slackText = truncateForSlack(slackText);
      
      // section 블록 분할 (3000자 제한)
      for (let i = 0; i < slackText.length; i += 2900) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: slackText.slice(i, i + 2900) },
        });
        if (blocks.length >= 8) break;
      }
    }
    
    // 도구 호출 context 추가
    if (result.toolCalls.length > 0) {
      const unique = [...new Set(result.toolCalls.map(tc => TOOL_LABELS[tc.tool] || tc.tool))];
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: unique.join('  ·  ') }],
      });
    }

    // 로딩 메시지 업데이트 → 실제 응답으로 교체
    const fallbackText = publishedUrl 
      ? `${extractSlackSummary(rawContent)}\n\n📊 전체 결과: ${publishedUrl}`
      : mdToSlack(rawContent).slice(0, 3000);
    
    if (loadingMsg?.ts) {
      try {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: fallbackText,
          blocks: blocks.slice(0, 50),
        });
      } catch (updateErr) {
        console.warn('[Slack] blocks 업데이트 실패, plaintext 시도:', updateErr.message);
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: fallbackText.slice(0, 3800),
        });
      }
    } else {
      await say({ text: fallbackText, blocks, thread_ts: threadTs });
    }

    console.log(`[Slack] 응답 완료: ${result.content.length}자, 도구 ${result.toolCalls.length}개`);

  } catch (error) {
    console.error('[Slack] 처리 오류:', error);
    
    const errText = `❌ 오류가 발생했습니다: ${error.message}\n\n_DataMaster 서버(${DATAMASTER_URL})가 실행 중인지 확인해주세요._`;
    
    if (loadingMsg?.ts) {
      try {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: errText,
        });
      } catch { /* ignore */ }
    } else {
      await say({ text: errText, thread_ts: threadTs });
    }
  }
}

// ── 이벤트 리스너 ──

// @DataMaster 멘션
app.event('app_mention', async (args) => {
  await handleMessage({ ...args, message: args.event });
});

// DM (1:1 메시지)
app.event('message', async (args) => {
  const { event } = args;
  // DM 채널만 처리 (im 타입)
  if (event.channel_type === 'im') {
    await handleMessage({ ...args, message: event });
  }
});

// ── 슬래시 커맨드 (선택사항) ──
app.command('/datamaster', async ({ command, ack, respond }) => {
  await ack();
  
  const userText = command.text?.trim();
  if (!userText) {
    await respond('사용법: `/datamaster 전사 HP 데이터 보여줘`');
    return;
  }

  await respond({ text: '🔍 분석 중...' });

  try {
    const sessionId = getSessionId(command.channel_id, null);
    const result = await callDataMaster(userText, sessionId);
    
    let response = mdToSlack(result.content);
    const toolSummary = formatToolSummary(result.toolCalls);
    response = truncateForSlack(response + toolSummary);

    await respond({
      text: response,
      response_type: 'in_channel', // 채널 전체에 표시
    });
  } catch (error) {
    await respond({ text: `❌ 오류: ${error.message}` });
  }
});

// ── 서버 시작 ──
(async () => {
  try {
    await app.start();
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✅ DataMaster Slack Bot 실행 중!                            ║
║                                                              ║
║  📡 Socket Mode 연결됨                                       ║
║  🔗 DataMaster API: ${DATAMASTER_URL.padEnd(38)}║
║                                                              ║
║  사용 방법:                                                   ║
║  • 채널에서 @DataMaster 멘션                                 ║
║  • DM으로 직접 메시지                                         ║
║  • /datamaster 슬래시 커맨드                                  ║
║                                                              ║
║  종료: Ctrl+C                                                ║
╚══════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Slack Bot 시작 실패:', error);
    process.exit(1);
  }
})();
