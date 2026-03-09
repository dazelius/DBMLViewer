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

// ── 봇 응답 추적 (리액션 피드백용) ──
// 봇 응답 ts → { channel, threadTs, userText, toolCount, responseLen, timestamp }
const botResponses = new Map();
const BOT_RESPONSE_TTL = 24 * 60 * 60 * 1000; // 24시간

function trackBotResponse(msgTs, info) {
  botResponses.set(msgTs, { ...info, timestamp: Date.now() });
  // 오래된 항목 정리
  if (botResponses.size > 200) {
    const now = Date.now();
    for (const [ts, data] of botResponses) {
      if (now - data.timestamp > BOT_RESPONSE_TTL) botResponses.delete(ts);
    }
  }
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
        const inputStr = typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input || '');
        const tableMatch = inputStr.match(/FROM\s+[`"]?(\w+)[`"]?/i);
        const entry = {
          table: tableMatch?.[1] || '(알 수 없음)',
          rows: rowMatch?.[1] || '?',
          columns: colMatch?.[1]?.slice(0, 80) || '',
          query: inputStr.slice(0, 100),
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
        const inputStr2 = typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input || '');
        const fileMatch = inputStr2.match(/[\w/]+\.\w+/);
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
async function callDataMasterStreaming(message, sessionId, onToolStart, onIteration) {
  const url = `${DATAMASTER_URL}/api/v1/chat`;
  
  const controller = new AbortController();
  const TOTAL_TIMEOUT = 300_000;  // 전체 5분 타임아웃
  const READ_TIMEOUT = 120_000;   // 개별 read 2분 타임아웃 (도구 실행이 오래 걸릴 수 있으므로)
  const totalTimeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        stream: true,
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
    let lastDataTime = Date.now();  // 마지막으로 데이터 받은 시간

    while (true) {
      // 개별 read에 타임아웃 적용
      const readPromise = reader.read();
      const timeoutPromise = new Promise((_, reject) => {
        const tid = setTimeout(() => reject(new Error('SSE read timeout')), READ_TIMEOUT);
        readPromise.then(() => clearTimeout(tid), () => clearTimeout(tid));
      });
      
      let readResult;
      try {
        readResult = await Promise.race([readPromise, timeoutPromise]);
      } catch (readErr) {
        console.warn(`[SSE] read 타임아웃 (${READ_TIMEOUT/1000}초 무응답) — 현재까지의 결과 반환`);
        break;
      }
      
      const { done, value } = readResult;
      if (done) break;
      lastDataTime = Date.now();

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
                if (onIteration) onIteration(allStreamedTexts.length + 1);
                break;
                
              case 'done':
                doneContent = data.content || '';
                if (data.tool_calls) {
                  toolCalls.length = 0;
                  toolCalls.push(...data.tool_calls);
                }
                break;
                
              case 'heartbeat':
                // 서버가 도구 실행 중 — 연결 유지용 (아무것도 안 해도 됨)
                lastDataTime = Date.now();
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
    clearTimeout(totalTimeout);
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
      const who = isBot ? 'DataMaster' : (msg.user ? await getUserDisplayName(client, msg.user) : '사용자');
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

// ── 세션/메타 TTL 자동 정리 (1시간마다, 4시간 이상 미사용 세션 삭제) ──
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4시간
const sessionLastUsed = new Map(); // key → timestamp

function touchSession(key) {
  sessionLastUsed.set(key, Date.now());
}

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, lastUsed] of sessionLastUsed) {
    if (now - lastUsed > SESSION_TTL) {
      threadSessions.delete(key);
      threadMeta.delete(key);
      sessionLastUsed.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`[Slack] 세션 정리: ${cleaned}개 만료 세션 삭제 (남은: ${threadSessions.size}개)`);
}, 60 * 60 * 1000); // 1시간마다

// ── help / reset 커맨드 처리 ──
const HELP_BLOCKS = [
  {
    type: 'header',
    text: { type: 'plain_text', text: '📖 DataMaster 사용 가이드', emoji: true },
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: [
      '*📊 데이터 조회*',
      '`전사 HP 데이터 보여줘` · `MapInfo 테이블 구조 알려줘`',
      '`카드 프리셋 중 type이 attack인 것만`',
      '',
      '*💻 코드 분석*',
      '`GunBase.cs의 Reload 로직 분석해줘`',
      '`Skill 시스템 구조 설명해줘`',
      '',
      '*🎫 Jira / Confluence*',
      '`AEGIS-1234 이슈 내용 보여줘`',
      '`AEGIS-1234에 댓글 달아줘: 확인했습니다`',
      '`Confluence에서 전장변수 문서 찾아줘`',
      '',
      '*📄 문서/아티팩트 생성*',
      '`전사 캐릭터 기획서 만들어줘`',
      '`MapInfo 관련 데이터 정리해줘`',
      '',
      '*🌐 웹 검색*',
      '`Unity ECS 최신 문서 검색해줘`',
      '',
      '*🔧 기타 명령*',
      '`새 대화` 또는 `reset` — 세션 초기화',
      '`도움말` 또는 `help` — 이 가이드 표시',
    ].join('\n') },
  },
  {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: '💡 쓰레드에서 대화하면 이전 맥락을 기억합니다. | ✅ 👍 리액션으로 좋은 답변 피드백을 남겨주세요!' }],
  },
];

function isHelpCommand(text) {
  const lower = text.toLowerCase().trim();
  return ['help', '도움말', '도움', '사용법', '가이드', '?'].includes(lower);
}

function isResetCommand(text) {
  const lower = text.toLowerCase().trim();
  return ['reset', '새 대화', '새대화', '리셋', '초기화', 'new', 'clear'].includes(lower);
}

// ── 사용자 이름 캐시 (Slack user ID → 표시 이름) ──
const userNameCache = new Map(); // userId → { name, fetchedAt }

async function getUserDisplayName(client, userId) {
  if (!userId) return '사용자';
  
  // 캐시 확인 (1시간 유효)
  const cached = userNameCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < 3600_000) {
    return cached.name;
  }
  
  try {
    const result = await client.users.info({ user: userId });
    if (result.ok && result.user) {
      const profile = result.user.profile || {};
      // 우선순위: display_name > real_name > name
      const name = profile.display_name || profile.real_name || result.user.name || userId;
      userNameCache.set(userId, { name, fetchedAt: Date.now() });
      return name;
    }
  } catch (e) {
    console.warn(`[Slack] 사용자 정보 조회 실패 (${userId}):`, e.message);
  }
  
  return userId; // fallback
}

// ── 메시지 처리 핸들러 ──
async function handleMessage({ message, say, client, event }) {
  // 봇 자신의 메시지 무시
  if (message?.bot_id || message?.subtype === 'bot_message') return;

  const channel = event?.channel || message?.channel;
  const threadTs = event?.thread_ts || message?.thread_ts || message?.ts || event?.ts;
  const currentTs = message?.ts || event?.ts;
  const userId = event?.user || message?.user || '';
  const userText = cleanSlackText(event?.text || message?.text || '');

  if (!userText) return;

  // ── help 커맨드 ──
  if (isHelpCommand(userText)) {
    await say({ blocks: HELP_BLOCKS, text: 'DataMaster 사용 가이드', thread_ts: threadTs });
    return;
  }

  // ── reset 커맨드 ──
  if (isResetCommand(userText)) {
    const key = `${channel}:${threadTs || 'main'}`;
    threadSessions.delete(key);
    threadMeta.delete(key);
    sessionLastUsed.delete(key);
    await say({ text: '🔄 세션이 초기화되었습니다. 새로운 대화를 시작합니다!', thread_ts: threadTs });
    return;
  }

  const sessionId = getSessionId(channel, threadTs);
  touchSession(`${channel}:${threadTs || 'main'}`);

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

  // ── 글로벌 타임아웃: 5분 초과 시 강제 응답 ──
  const GLOBAL_TIMEOUT_MS = 5 * 60 * 1000;
  let globalTimeoutFired = false;
  const globalTimeout = setTimeout(async () => {
    globalTimeoutFired = true;
    console.warn('[Slack] 글로벌 타임아웃 (5분) — 강제 응답');
    if (loadingMsg?.ts) {
      try {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: '⏱️ 처리 시간이 너무 길어 중단되었습니다.',
          blocks: [
            { type: 'section', text: { type: 'mrkdwn', text: '⏱️ 처리 시간이 5분을 초과하여 중단되었습니다.\n질문을 더 구체적으로 해보시거나 잠시 후 다시 시도해주세요.' } },
            { type: 'context', elements: [{ type: 'mrkdwn', text: `_${new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })} · 시간 초과_` }] },
          ],
        });
      } catch { /* ignore */ }
    }
  }, GLOBAL_TIMEOUT_MS);

  try {
    // ── 사용자 이름 조회 ──
    const userName = await getUserDisplayName(client, userId);
    console.log(`[Slack] 메시지 수신: user=${userName}(${userId}) channel=${channel} thread=${threadTs} text="${userText.slice(0, 50)}..."`);
    
    // ── 쓰레드 컨텍스트 수집 ──
    let enrichedMessage = `[Slack 사용자: ${userName}]\n${userText}`;
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
    let iterationCount = 0;
    const onToolStart = async (toolName, toolInput) => {
      const emoji = TOOL_EMOJI[toolName] || '🔧';
      const label = TOOL_LABELS[toolName] || toolName;
      
      // 도구별 상세 설명 생성
      let detail = '';
      const inputStr = typeof toolInput === 'string' ? toolInput : JSON.stringify(toolInput || {});
      if (toolName === 'query_game_data') {
        const sqlMatch = inputStr.match(/sql['":\s]*['"]?([^'"}{]+)/i);
        if (sqlMatch) detail = sqlMatch[1].trim().slice(0, 50);
      } else if (toolName === 'show_table_schema') {
        const tblMatch = inputStr.match(/table['":\s]*['"]?([^'"}{,]+)/i);
        if (tblMatch) detail = tblMatch[1].trim();
      } else if (toolName === 'search_code' || toolName === 'read_code_file') {
        const qMatch = inputStr.match(/(?:query|path)['":\s]*['"]?([^'"}{,]+)/i);
        if (qMatch) detail = qMatch[1].trim().slice(0, 40);
      } else if (toolName === 'search_jira' || toolName === 'get_jira_issue') {
        const jMatch = inputStr.match(/(?:query|issue_key)['":\s]*['"]?([^'"}{,]+)/i);
        if (jMatch) detail = jMatch[1].trim().slice(0, 40);
      } else if (toolName === 'read_knowledge') {
        const kMatch = inputStr.match(/name['":\s]*['"]?([^'"}{,]+)/i);
        if (kMatch) detail = kMatch[1].trim();
      } else if (toolName === 'create_artifact') {
        const tMatch = inputStr.match(/title['":\s]*['"]?([^'"}{,]+)/i);
        if (tMatch) detail = tMatch[1].trim().slice(0, 30);
      }
      
      const stepLine = detail ? `${emoji} ${label}  _${detail}_` : `${emoji} ${label}`;
      toolProgress.push(stepLine);
      
      // 너무 자주 업데이트하지 않도록 1초 디바운스
      const now = Date.now();
      if (now - lastUpdate < 1000 || !loadingMsg?.ts) return;
      lastUpdate = now;
      
      try {
        // 전체 과정을 줄바꿈으로 표시 (최대 15개, 넘으면 앞부분 생략)
        const maxShow = 15;
        let stepLines;
        if (toolProgress.length <= maxShow) {
          stepLines = toolProgress.map((s, i) => `\`${String(i + 1).padStart(2)}\` ${s}`);
        } else {
          const skip = toolProgress.length - maxShow;
          stepLines = [
            `_... ${skip}단계 생략 ..._`,
            ...toolProgress.slice(skip).map((s, i) => `\`${String(skip + i + 1).padStart(2)}\` ${s}`),
          ];
        }
        
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: `🔍 분석 중... (${toolProgress.length}단계)`,
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `🔍 *DataMaster* 분석 중... _(${toolProgress.length}단계)_` },
            },
            {
              type: 'context',
              elements: [{ type: 'mrkdwn', text: stepLines.join('\n') }],
            },
          ],
        });
      } catch { /* rate limit 무시 */ }
    };

    // 이터레이션 구분 콜백 (슬랙에서는 표시하지 않음 — 사용자에게 유용한 정보가 아님)
    const onIteration = async (_iterNum) => {
      // no-op: 이터레이션 번호는 슬랙 진행상황에 표시하지 않음
    };
    
    // 에러 시 자동 재시도 (최대 2회)
    let result;
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await callDataMasterStreaming(enrichedMessage, sessionId, onToolStart, onIteration);
        break; // 성공 시 루프 탈출
      } catch (apiErr) {
        const errMsg = apiErr.message || '';
        const isRetryable = errMsg.includes('429') || errMsg.includes('upstream connect') 
          || errMsg.includes('connection termination') || errMsg.includes('ECONNREFUSED')
          || errMsg.includes('ECONNRESET') || errMsg.includes('fetch failed')
          || errMsg.includes('SSE read timeout');
        
        if (isRetryable && attempt < MAX_RETRIES) {
          const waitSec = (attempt + 1) * 3; // 3초, 6초
          console.warn(`[Slack] 재시도 ${attempt + 1}/${MAX_RETRIES}: ${errMsg.slice(0, 80)} — ${waitSec}초 대기`);
          if (loadingMsg?.ts) {
            try {
              await client.chat.update({
                channel, ts: loadingMsg.ts,
                text: `⏳ 일시적 오류 — ${waitSec}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})...`,
                blocks: [{ type: 'context', elements: [{ type: 'mrkdwn', text: `⏳ 일시적 오류 발생 — *${waitSec}초 후 자동 재시도* (${attempt + 1}/${MAX_RETRIES})` }] }],
              });
            } catch { /* ignore */ }
          }
          await new Promise(r => setTimeout(r, waitSec * 1000));
          // 재시도 시 진행상황 초기화
          toolProgress.length = 0;
          lastUpdate = 0;
          continue;
        }
        throw apiErr; // 재시도 불가능한 오류 → 위쪽 catch로
      }
    }
    if (!result) throw new Error('재시도 횟수 초과');
    const rawContent = result.content || '';
    
    // ── 도구 결과에서 메타정보 축적 ──
    if (result.toolCalls.length > 0) {
      accumulateToolMeta(channel, threadTs, result.toolCalls);
      const meta = getThreadMeta(channel, threadTs);
      console.log(`[Slack] 메타 축적: 테이블 ${meta.queriedTables.length}개, 스키마 ${meta.schemas.length}개, Jira ${meta.jiraIssues.length}개, Q#${meta.questionCount}`);
    }
    
    // ── 아티팩트 감지 + 자동 출판 ──
    let publishedUrl = null;
    
    // 웹에서만 동작하는 비주얼 도구 목록 (Slack에서는 링크가 아닌 텍스트로 떨어짐 → 반드시 출판)
    const VISUAL_TOOLS = new Set([
      'preview_fbx_animation', 'preview_prefab', 'find_resource_image',
      'build_character_profile', 'search_assets', 'create_artifact', 'patch_artifact',
    ]);
    const usedTools = new Set(result.toolCalls.map(tc => tc.tool));
    const hasVisualTool = [...usedTools].some(t => VISUAL_TOOLS.has(t));
    const shouldForcePublish = hasVisualTool || result.toolCalls.length >= 2;
    
    // 1) AI가 create_artifact/patch_artifact 도구로 만든 아티팩트 → HTML 직접 출판
    const artifactTC = result.toolCalls.find(tc => 
      (tc.tool === 'create_artifact' || tc.tool === 'patch_artifact') && tc.result
    );
    if (artifactTC) {
      try {
        const artData = typeof artifactTC.result === 'object' ? artifactTC.result : {};
        const artHtml = artData.html || '';
        const artTitle = artData.title || userText.slice(0, 40);
        
        if (artHtml.length > 50) {
          const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: artTitle, html: artHtml }),
          });
          if (pubResp.ok) {
            const pubData = await pubResp.json();
            publishedUrl = pubData.url.replace(DATAMASTER_URL, DATAMASTER_PUBLIC_URL);
            if (publishedUrl.includes('localhost') && DATAMASTER_PUBLIC_URL !== DATAMASTER_URL) {
              publishedUrl = publishedUrl.replace(/http:\/\/localhost:\d+/, DATAMASTER_PUBLIC_URL);
            }
            console.log(`[Slack] 아티팩트 출판: "${artTitle}" → ${publishedUrl}`);
          }
        }
      } catch (e) {
        console.warn('[Slack] 아티팩트 출판 실패:', e.message);
      }
    }
    
    // 2) 비주얼 도구 사용했는데 아직 출판 안 됨 → 마크다운을 강제 출판
    //    또는 도구 2개 이상 사용 + 내용이 충분할 때
    if (!publishedUrl && shouldForcePublish && rawContent.length > 100) {
      try {
        const titleGuess = userText.slice(0, 40) + (userText.length > 40 ? '...' : '');
        const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleGuess, markdown: rawContent }),
        });
        if (pubResp.ok) {
          const pubData = await pubResp.json();
          publishedUrl = pubData.url.replace(DATAMASTER_URL, DATAMASTER_PUBLIC_URL);
          if (publishedUrl.includes('localhost') && DATAMASTER_PUBLIC_URL !== DATAMASTER_URL) {
            publishedUrl = publishedUrl.replace(/http:\/\/localhost:\d+/, DATAMASTER_PUBLIC_URL);
          }
          console.log(`[Slack] 강제 출판 (${hasVisualTool ? '비주얼도구' : `도구${result.toolCalls.length}개`}): ${publishedUrl}`);
        }
      } catch (e) {
        console.warn('[Slack] 강제 출판 실패:', e.message);
      }
    }
    
    // 3) 나머지: 테이블/코드블록/긴 텍스트가 있으면 출판
    if (!publishedUrl) {
      const hasTable = /\|.+\|.+\|/.test(rawContent) && rawContent.split('\n').filter(l => l.includes('|')).length > 2;
      const hasCodeBlock = /```[\s\S]{200,}```/.test(rawContent);
      const isLong = rawContent.length > 1200;
      
      if (hasTable || hasCodeBlock || isLong) {
        try {
          const titleGuess = userText.slice(0, 40) + (userText.length > 40 ? '...' : '');
          const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleGuess, markdown: rawContent }),
          });
          if (pubResp.ok) {
            const pubData = await pubResp.json();
            publishedUrl = pubData.url.replace(DATAMASTER_URL, DATAMASTER_PUBLIC_URL);
            if (publishedUrl.includes('localhost') && DATAMASTER_PUBLIC_URL !== DATAMASTER_URL) {
              publishedUrl = publishedUrl.replace(/http:\/\/localhost:\d+/, DATAMASTER_PUBLIC_URL);
            }
            console.log(`[Slack] 텍스트 출판: ${publishedUrl}`);
          }
        } catch (e) {
          console.warn('[Slack] 텍스트 출판 실패:', e.message);
        }
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

    // 봇 응답 추적 (리액션 피드백용)
    const botMsgTs = loadingMsg?.ts;
    if (botMsgTs) {
      trackBotResponse(botMsgTs, {
        channel,
        threadTs,
        userText: userText.slice(0, 200),
        toolCount: result.toolCalls.length,
        tools: [...new Set(result.toolCalls.map(tc => tc.tool))],
        responseLen: rawContent.length,
        published: !!publishedUrl,
      });
    }

  } catch (error) {
    if (globalTimeoutFired) return; // 글로벌 타임아웃이 이미 응답함
    console.error('[Slack] 처리 오류:', error);
    
    // 사용자 친화적 에러 메시지 (원인별 분류)
    const errMsg = error.message || '알 수 없는 오류';
    let userMsg;
    if (errMsg.includes('SSE read timeout')) {
      userMsg = '⏱️ 응답 시간이 초과되었습니다. 질문을 좀 더 구체적으로 해보세요.';
    } else if (errMsg.includes('429') || errMsg.includes('처리 중인 요청')) {
      userMsg = '🚦 서버가 바쁩니다. 잠시 후 다시 시도해주세요.';
    } else if (errMsg.includes('ECONNREFUSED') || errMsg.includes('fetch failed')) {
      userMsg = '🔌 DataMaster 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.';
    } else if (errMsg.includes('upstream connect') || errMsg.includes('connection termination')) {
      userMsg = '🌐 AI 서버 연결이 불안정합니다. 잠시 후 다시 시도해주세요.';
    } else if (errMsg.includes('재시도 횟수 초과')) {
      userMsg = '🔄 여러 번 시도했지만 실패했습니다. 잠시 후 다시 시도해주세요.';
    } else {
      userMsg = `❌ 오류: ${errMsg.slice(0, 200)}`;
    }
    
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: userMsg } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `_${new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })} · 다시 질문하시면 재시도합니다_` }] },
    ];
    
    if (loadingMsg?.ts) {
      try {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: userMsg,
          blocks,
        });
      } catch { /* ignore */ }
    } else {
      try {
        await say({ text: userMsg, blocks, thread_ts: threadTs });
      } catch { /* ignore */ }
    }
  } finally {
    clearTimeout(globalTimeout);
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

// ── 리액션 피드백 (👍 ✅ ❤️ = 긍정, 👎 ❌ = 부정) ──
const POSITIVE_REACTIONS = new Set(['+1', 'thumbsup', 'white_check_mark', 'heavy_check_mark', 'heart', 'star', 'fire', 'clap', '100']);
const NEGATIVE_REACTIONS = new Set(['-1', 'thumbsdown', 'x', 'no_entry', 'confused', 'disappointed']);

app.event('reaction_added', async ({ event, client }) => {
  try {
    const { reaction, item, user } = event;
    if (item.type !== 'message') return;

    const msgTs = item.ts;
    const botResp = botResponses.get(msgTs);
    if (!botResp) return; // 봇 응답이 아닌 메시지에 달린 리액션은 무시

    const isPositive = POSITIVE_REACTIONS.has(reaction);
    const isNegative = NEGATIVE_REACTIONS.has(reaction);
    if (!isPositive && !isNegative) return;

    const feedbackType = isPositive ? 'positive' : 'negative';
    const emoji = isPositive ? '👍' : '👎';
    
    console.log(`[Slack] ${emoji} 피드백 수신: user=${user}, reaction=:${reaction}:, question="${botResp.userText.slice(0, 50)}"`);

    // DataMaster 서버의 피드백 API 호출 (knowledge 저장)
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const toolList = botResp.tools?.join(', ') || '없음';
    
    const feedbackEntry = [
      `## ${isPositive ? '✅' : '❌'} [${timestamp}] ${isPositive ? '긍정' : '부정'} 피드백 (Slack)`,
      `- **질문**: ${botResp.userText}`,
      `- **사용 도구**: ${toolList}`,
      `- **응답 길이**: ${botResp.responseLen}자`,
      `- **아티팩트 생성**: ${botResp.published ? '예' : '아니오'}`,
      `- **리액션**: :${reaction}:`,
      `- **${isPositive ? '유지 패턴' : '개선 필요'}**: ${isPositive ? '이런 방식의 답변이 Slack에서 효과적' : '답변 개선 필요'}`,
    ].join('\n');

    // 피드백 로그 저장 (DataMaster API 경유)
    try {
      const saveFeedbackResp = await fetch(`${DATAMASTER_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[시스템] 피드백을 _feedback_log에 추가해줘. 아래 내용을 기존 내용 뒤에 추가:\n\n${feedbackEntry}`,
          session_id: `feedback-${Date.now()}`,
          stream: false,
        }),
      });
      
      if (saveFeedbackResp.ok) {
        console.log(`[Slack] ${emoji} 피드백 저장 완료`);
      } else {
        console.warn(`[Slack] 피드백 저장 실패: ${saveFeedbackResp.status}`);
      }
    } catch (feedbackErr) {
      console.warn('[Slack] 피드백 저장 오류:', feedbackErr.message);
    }

    // 부정 피드백 시 쓰레드에 안내 메시지
    if (isNegative && botResp.channel && botResp.threadTs) {
      try {
        await client.chat.postMessage({
          channel: botResp.channel,
          thread_ts: botResp.threadTs,
          text: '💡 답변이 마음에 들지 않으셨군요. 어떤 부분이 아쉬웠는지 알려주시면 더 나은 답변을 드릴 수 있어요!',
          blocks: [{
            type: 'context',
            elements: [{ type: 'mrkdwn', text: '💡 답변이 아쉬우셨나요? 구체적으로 어떤 점이 부족했는지 알려주시면 개선하겠습니다!' }],
          }],
        });
      } catch { /* ignore */ }
    }

    // 추적 데이터에서 제거 (중복 피드백 방지)
    botResponses.delete(msgTs);
    
  } catch (err) {
    console.error('[Slack] 리액션 이벤트 처리 오류:', err.message);
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
