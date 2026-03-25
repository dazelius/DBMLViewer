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
 *                      channels:history, groups:history, reactions:read, links:read, links:write,
 *                      users:read
 *   Socket Mode: 활성화 필요
 *   Event Subscriptions: app_mention, message.im, link_shared, app_home_opened
 *   Interactivity: 활성화 필요 (모달/버튼 인터랙션)
 *   App Home Tab: 활성화 필요 (Home Tab → Show Tab 체크)
 *   App Unfurl Domains: DataMaster 퍼블릭 URL 도메인 등록 필요
 */

const { App } = require('@slack/bolt');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');
const os = require('os');

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
const DATAMASTER_PORT = process.env.PORT || '5173';
const DATAMASTER_URL = process.env.DATAMASTER_URL || `http://localhost:${DATAMASTER_PORT}`;
// 외부에서 접근 가능한 URL (Slack 링크용) — 자동 감지
function detectLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}
const DATAMASTER_PUBLIC_URL = process.env.DATAMASTER_PUBLIC_URL
  || `http://${detectLocalIp()}:${DATAMASTER_PORT}`;

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

// ── 차트 캐시 (모달 표시용) ──
// chartCacheId → { charts: [{url, title, type}], vizBlocks: [...], publishedUrl, timestamp }
const chartCache = new Map();
const CHART_CACHE_TTL = 2 * 60 * 60 * 1000; // 2시간

function storeChartData(charts, vizBlocks, publishedUrl) {
  const id = `chart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  chartCache.set(id, { charts, vizBlocks, publishedUrl, timestamp: Date.now() });
  if (chartCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of chartCache) {
      if (now - v.timestamp > CHART_CACHE_TTL) chartCache.delete(k);
    }
  }
  return id;
}

// ── Home Tab 활동 추적 ──
// userId → [{ query, tools, charts, publishedUrl, timestamp }]
const userActivity = new Map();
const MAX_ACTIVITY_PER_USER = 15;

function trackUserActivity(userId, info) {
  if (!userActivity.has(userId)) userActivity.set(userId, []);
  const list = userActivity.get(userId);
  list.unshift({ ...info, timestamp: Date.now() });
  if (list.length > MAX_ACTIVITY_PER_USER) list.length = MAX_ACTIVITY_PER_USER;
}

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
async function callDataMasterStreaming(message, sessionId, onToolStart, onIteration, images) {
  const url = `${DATAMASTER_URL}/api/v1/chat`;
  
  const controller = new AbortController();
  const TOTAL_TIMEOUT = 300_000;  // 전체 5분 타임아웃
  const READ_TIMEOUT = 120_000;   // 개별 read 2분 타임아웃 (도구 실행이 오래 걸릴 수 있으므로)
  const totalTimeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT);

  try {
    const bodyPayload = {
      message,
      session_id: sessionId,
      stream: true,
    };
    if (images && images.length > 0) {
      bodyPayload.images = images;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
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

// ── :::visualizer 블록 파싱 ──
function extractVisualizerBlocks(text) {
  const blocks = [];
  const vizRegex = /:::visualizer\{([^}]*)\}\n([\s\S]*?)(?:\n:::\s*(?:\n|$)|$)/g;
  let match;
  while ((match = vizRegex.exec(text)) !== null) {
    const attrStr = match[1];
    const body = match[2].trim();
    const typeMatch = attrStr.match(/type="([^"]+)"/);
    const titleMatch = attrStr.match(/title="([^"]+)"/);
    if (typeMatch) {
      blocks.push({
        type: typeMatch[1],
        title: titleMatch ? titleMatch[1] : '',
        body,
        raw: match[0],
      });
    }
  }
  let stripped = text;
  for (const b of blocks) {
    stripped = stripped.replace(b.raw, '');
  }
  stripped = stripped.replace(/\n{3,}/g, '\n\n').trim();
  return { blocks, stripped };
}

// ── visualizer → QuickChart.io 이미지 URL ──
const QUICKCHART_TYPES = new Set(['bar', 'hbar', 'line', 'area', 'pie', 'donut', 'scatter', 'radar', 'bubble']);

function parseVisualizerData(body) {
  const lines = body.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  const firstCols = lines[0].split('|').map(c => c.trim());
  const hasHeader = firstCols[0] === '_' || firstCols[0] === '';
  let headers = null;
  let dataLines = lines;

  if (hasHeader && lines.length > 1) {
    headers = firstCols.slice(1);
    dataLines = lines.slice(1);
  }

  const labels = [];
  const datasets = [];

  for (const line of dataLines) {
    const cols = line.split('|').map(c => c.trim());
    labels.push(cols[0]);
    const values = cols.slice(1).map(v => parseFloat(v) || 0);
    while (datasets.length < values.length) datasets.push([]);
    values.forEach((v, i) => datasets[i].push(v));
  }

  return { labels, datasets, headers };
}

function visualizerToQuickChartUrl(block) {
  if (!QUICKCHART_TYPES.has(block.type)) return null;

  const parsed = parseVisualizerData(block.body);
  if (!parsed || parsed.labels.length === 0) return null;

  const COLORS = [
    'rgba(54,162,235,0.8)', 'rgba(255,99,132,0.8)', 'rgba(75,192,192,0.8)',
    'rgba(255,206,86,0.8)', 'rgba(153,102,255,0.8)', 'rgba(255,159,64,0.8)',
    'rgba(46,204,113,0.8)', 'rgba(231,76,60,0.8)',
  ];
  const BORDER_COLORS = COLORS.map(c => c.replace('0.8', '1'));

  let chartType;
  let indexAxis;
  const fill = block.type === 'area';
  switch (block.type) {
    case 'hbar': chartType = 'horizontalBar'; break;
    case 'pie': case 'donut': chartType = block.type === 'donut' ? 'doughnut' : 'pie'; break;
    case 'scatter': case 'bubble': chartType = block.type; break;
    case 'radar': chartType = 'radar'; break;
    case 'area': chartType = 'line'; break;
    default: chartType = 'bar';
  }

  let datasets;
  if (chartType === 'pie' || chartType === 'doughnut') {
    datasets = [{
      data: parsed.datasets[0] || [],
      backgroundColor: parsed.labels.map((_, i) => COLORS[i % COLORS.length]),
    }];
  } else if (chartType === 'scatter') {
    const points = parsed.labels.map((label, i) => ({
      x: (parsed.datasets[0] || [])[i] || 0,
      y: (parsed.datasets[1] || [])[i] || 0,
    }));
    datasets = [{ label: block.title || 'Data', data: points, backgroundColor: COLORS[0] }];
  } else {
    datasets = parsed.datasets.map((data, i) => ({
      label: parsed.headers ? parsed.headers[i] : `시리즈 ${i + 1}`,
      data,
      backgroundColor: parsed.datasets.length === 1
        ? parsed.labels.map((_, j) => COLORS[j % COLORS.length])
        : COLORS[i % COLORS.length],
      borderColor: BORDER_COLORS[i % BORDER_COLORS.length],
      fill,
    }));
  }

  const config = {
    type: chartType,
    data: { labels: parsed.labels, datasets },
    options: {
      plugins: {
        title: block.title ? { display: true, text: block.title, font: { size: 16 } } : undefined,
        legend: { display: parsed.datasets.length > 1 || chartType === 'pie' || chartType === 'doughnut' },
      },
      ...(chartType === 'horizontalBar' ? { indexAxis: 'y' } : {}),
    },
  };

  try {
    const encoded = encodeURIComponent(JSON.stringify(config));
    if (encoded.length > 8000) return null;
    return `https://quickchart.io/chart?c=${encoded}&w=600&h=400&bkg=white&f=png`;
  } catch {
    return null;
  }
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
  edit_game_data:      '📝 바이브테이블링',
  add_game_data_rows:  '➕ 데이터 행 추가',
  search_published_artifacts: '🔍 기존 문서 검색',
  get_published_artifact:     '📄 기존 문서 가져오기',
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
  
  // 바이브테이블링: 편집 결과 + 다운로드 링크
  if (tc.tool === 'edit_game_data') {
    const cellMatch = summary.match(/셀:\s*(\d+)개 변경/);
    const rowMatch = summary.match(/행:\s*(\d+)개 매치/);
    const downloadMatch = summary.match(/다운로드:\s*(https?:\/\/\S+)/);
    let text = `${label}`;
    if (cellMatch) text += `: *${cellMatch[1]}셀* 편집`;
    if (rowMatch) text += ` (${rowMatch[1]}행)`;
    if (downloadMatch) text += ` 📥 <${downloadMatch[1]}|다운로드>`;
    return text;
  }
  
  if (tc.tool === 'add_game_data_rows') {
    const addMatch = summary.match(/추가된 행:\s*(\d+)/);
    const downloadMatch = summary.match(/다운로드:\s*(https?:\/\/\S+)/);
    let text = `${label}`;
    if (addMatch) text += `: *${addMatch[1]}행* 추가`;
    if (downloadMatch) text += ` 📥 <${downloadMatch[1]}|다운로드>`;
    return text;
  }
  
  // 기존 아티팩트 검색: 결과 개수
  if (tc.tool === 'search_published_artifacts') {
    const matchCount = summary.match(/(\d+)개 발견/);
    if (matchCount) return `${label}: *${matchCount[1]}개* 기존 문서 발견`;
    if (summary.includes('찾을 수 없습니다')) return `${label}: 유사 문서 없음`;
  }
  
  if (tc.tool === 'get_published_artifact') {
    const titleMatch = summary.match(/아티팩트:\s*"([^"]+)"/);
    if (titleMatch) return `${label}: _${titleMatch[1]}_`;
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

// ── 중복 메시지 / 동시 처리 방지 ──
const _processedMessages = new Set();   // 이미 처리한 메시지 ts
const _activeThreads = new Map();       // 현재 처리 중인 thread → 시작시각

// 오래된 항목 정리 (10분)
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const ts of _processedMessages) {
    // ts는 slack 타임스탬프 → 초 단위, *1000 해서 비교
    const msgTime = parseFloat(ts) * 1000;
    if (msgTime < cutoff) _processedMessages.delete(ts);
  }
  for (const [key, startTime] of _activeThreads) {
    if (startTime < cutoff) _activeThreads.delete(key);
  }
}, 5 * 60 * 1000);

// ── Slack 파일에서 이미지 다운로드 → base64 ──
async function downloadSlackImages(files, botToken, slackClient) {
  if (!files || files.length === 0) return [];
  const images = [];
  const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
  const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB (Claude 제한)

  for (const rawFile of files) {
    // 파일이 이미지인지 확인 (mimetype 또는 filetype으로)
    const mime = rawFile.mimetype || '';
    const ftype = (rawFile.filetype || '').toLowerCase();
    if (!IMAGE_MIMES.has(mime) && !IMAGE_EXTS.has(ftype) && !mime.startsWith('image/')) continue;

    console.log(`[Slack] 이미지 파일 감지: id=${rawFile.id} name=${rawFile.name} mime=${mime} ftype=${ftype} url_private=${!!rawFile.url_private} url_private_download=${!!rawFile.url_private_download}`);

    // url_private이 없으면 files.info API로 조회
    let file = rawFile;
    if (!file.url_private && !file.url_private_download && file.id && slackClient) {
      try {
        console.log(`[Slack] url_private 없음 — files.info로 조회: ${file.id}`);
        const infoResp = await slackClient.files.info({ file: file.id });
        if (infoResp.ok && infoResp.file) {
          file = infoResp.file;
          console.log(`[Slack] files.info 성공: url_private=${!!file.url_private}`);
        } else {
          console.log(`[Slack] files.info 실패: ${JSON.stringify(infoResp.error || 'unknown')}`);
        }
      } catch (e) {
        console.error(`[Slack] files.info 오류:`, e.message);
      }
    }

    if (file.size > MAX_SIZE) {
      console.log(`[Slack] 이미지 건너뜀 (크기 초과): ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      continue;
    }

    const downloadUrl = file.url_private_download || file.url_private;
    if (!downloadUrl) {
      console.log(`[Slack] 이미지 건너뜀 (URL 없음): ${file.name} — keys: ${Object.keys(file).join(',')}`);
      continue;
    }

    try {
      const resp = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${botToken}` },
      });
      if (!resp.ok) {
        console.log(`[Slack] 이미지 다운로드 실패: ${file.name} (${resp.status} ${resp.statusText})`);
        continue;
      }
      const arrayBuf = await resp.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString('base64');
      const mediaType = IMAGE_MIMES.has(file.mimetype) ? file.mimetype
        : ftype === 'jpg' || ftype === 'jpeg' ? 'image/jpeg'
        : ftype === 'png' ? 'image/png'
        : ftype === 'gif' ? 'image/gif'
        : ftype === 'webp' ? 'image/webp'
        : 'image/png';
      images.push({ data: base64, media_type: mediaType, name: file.name });
      console.log(`[Slack] 이미지 다운로드 완료: ${file.name} (${(arrayBuf.byteLength / 1024).toFixed(0)}KB, ${mediaType})`);
    } catch (e) {
      console.error(`[Slack] 이미지 다운로드 오류: ${file.name}`, e.message);
    }
  }
  return images;
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

  // 이미지 첨부 파일 감지 (mimetype 또는 filetype으로 판별)
  let attachedFiles = event?.files || message?.files || [];
  const IMAGE_FILE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

  console.log(`[Slack:debug] handleMessage: text="${userText.slice(0,50)}" event.files=${event?.files?.length ?? 'undefined'} message.files=${message?.files?.length ?? 'undefined'} subtype=${event?.subtype || message?.subtype || 'none'} channel=${channel} ts=${currentTs}`);

  // event.files / message.files 가 비어있으면 여러 방법으로 파일 복원 시도
  if (attachedFiles.length === 0 && currentTs && channel && client) {
    // 방법 1: conversations.history — 해당 메시지의 원본 조회
    try {
      const histResp = await client.conversations.history({
        channel, latest: currentTs, inclusive: true, limit: 1,
      });
      const origMsg = histResp.messages?.[0];
      if (origMsg?.files && origMsg.files.length > 0) {
        attachedFiles = origMsg.files;
        console.log(`[Slack:debug] conversations.history에서 파일 ${attachedFiles.length}개 복원`);
      }
    } catch (e) {
      console.log(`[Slack:debug] conversations.history 실패: ${e.message}`);
    }

    // 방법 2: conversations.replies — 스레드에서 최근 파일이 포함된 메시지 조회
    if (attachedFiles.length === 0 && threadTs) {
      try {
        const repliesResp = await client.conversations.replies({
          channel, ts: threadTs, limit: 10,
        });
        const msgs = repliesResp.messages || [];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].files && msgs[i].files.length > 0) {
            attachedFiles = msgs[i].files;
            console.log(`[Slack:debug] conversations.replies에서 파일 ${attachedFiles.length}개 복원 (msg ts=${msgs[i].ts})`);
            break;
          }
        }
      } catch (e) {
        console.log(`[Slack:debug] conversations.replies 실패: ${e.message}`);
      }
    }
  }

  if (attachedFiles.length > 0) {
    console.log(`[Slack:debug] 파일 목록: ${JSON.stringify(attachedFiles.map(f => ({ id: f.id, name: f.name, mimetype: f.mimetype, filetype: f.filetype, has_url: !!f.url_private })))}`);
  }

  const hasImages = attachedFiles.some(f =>
    f.mimetype?.startsWith('image/') || IMAGE_FILE_EXTS.has((f.filetype || '').toLowerCase())
  );

  if (!userText && !hasImages) return;

  // ── 중복 이벤트 방지 (같은 메시지 ts를 두 번 처리 안 함) ──
  if (currentTs && _processedMessages.has(currentTs)) {
    console.log(`[Slack] 중복 메시지 무시: ts=${currentTs}`);
    return;
  }
  if (currentTs) _processedMessages.add(currentTs);

  // ── 같은 쓰레드에서 이미 처리 중이면 안내 메시지만 ──
  const threadKey = `${channel}:${threadTs || 'main'}`;
  if (_activeThreads.has(threadKey)) {
    console.log(`[Slack] 쓰레드 처리 중 — 대기 안내: ${threadKey}`);
    await say({ text: '⏳ 이전 질문을 처리 중입니다. 완료 후 다시 질문해주세요.', thread_ts: threadTs });
    return;
  }
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
    _activeThreads.delete(threadKey);
    await say({ text: '🔄 세션이 초기화되었습니다. 새로운 대화를 시작합니다!', thread_ts: threadTs });
    return;
  }

  // ── 동시 처리 중 방지 (help/reset 이후에 설정) ──
  _activeThreads.set(threadKey, Date.now());

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
    
    // ── 이미지 첨부 처리 ──
    let slackImages = [];
    if (hasImages) {
      const imgFileCount = attachedFiles.filter(f => f.mimetype?.startsWith('image/') || ['png','jpg','jpeg','gif','webp'].includes((f.filetype||'').toLowerCase())).length;
      console.log(`[Slack] 이미지 ${imgFileCount}개 감지, 다운로드 중...`);
      slackImages = await downloadSlackImages(attachedFiles, SLACK_BOT_TOKEN, client);
      if (slackImages.length > 0) {
        const imgNames = slackImages.map(i => i.name).join(', ');
        enrichedMessage = enrichedMessage + `\n\n[첨부 이미지: ${imgNames}]`;
        console.log(`[Slack] 이미지 ${slackImages.length}개 다운로드 성공 → API에 전송`);
      } else {
        console.log(`[Slack] 이미지 다운로드 결과: 0개 (감지 ${imgFileCount}개에서 모두 실패)`);
      }
    }

    // 실시간 도구 사용 표시 (SSE 스트리밍)
    const toolProgress = [];

    let lastUpdate = 0;
    let iterationCount = 0;
    const onToolStart = async (toolName, toolInput) => {
      const label = TOOL_LABELS[toolName] || `🔧 ${toolName}`;
      
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
      } else if (toolName === 'edit_game_data' || toolName === 'add_game_data_rows') {
        const titleMatch = inputStr.match(/title['":\s]*['"]?([^'"}{,]+)/i);
        if (titleMatch) detail = titleMatch[1].trim().slice(0, 40);
      } else if (toolName === 'search_published_artifacts') {
        const qMatch = inputStr.match(/query['":\s]*['"]?([^'"}{,]+)/i);
        if (qMatch) detail = qMatch[1].trim().slice(0, 40);
        else detail = '최근 문서';
      } else if (toolName === 'get_published_artifact') {
        const idMatch = inputStr.match(/artifact_id['":\s]*['"]?([^'"}{,]+)/i);
        if (idMatch) detail = idMatch[1].trim().slice(0, 20);
      }
      
      const stepLine = detail ? `${label}  _${detail}_` : label;
      toolProgress.push(stepLine);
      
      // 너무 자주 업데이트하지 않도록 1초 디바운스
      const now = Date.now();
      if (now - lastUpdate < 1000 || !loadingMsg?.ts) return;
      lastUpdate = now;
      
      try {
        // 전체 과정을 줄바꿈으로 표시 (최대 15개, 넘으면 앞부분 생략)
        const maxShow = 15;
        const total = toolProgress.length;
        let stepLines;
        if (total <= maxShow) {
          stepLines = toolProgress.map((s, i) => {
            const num = `\`${String(i + 1).padStart(2)}\``;
            // 마지막 항목 = 현재 진행 중 → :loading2:, 나머지 = 완료 → ✅
            return i < total - 1 ? `${num} ✅ ${s}` : `${num} :loading2: ${s}`;
          });
        } else {
          const skip = total - maxShow;
          stepLines = [
            `_... ${skip}단계 완료 ..._`,
            ...toolProgress.slice(skip).map((s, i) => {
              const num = `\`${String(skip + i + 1).padStart(2)}\``;
              return (skip + i) < total - 1 ? `${num} ✅ ${s}` : `${num} :loading2: ${s}`;
            }),
          ];
        }
        
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: `🔍 분석 중... (${total}단계)`,
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `:loading2: *DataMaster* 분석 중... _(${total}단계)_` },
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
        result = await callDataMasterStreaming(enrichedMessage, sessionId, onToolStart, onIteration, slackImages);
        break; // 성공 시 루프 탈출
      } catch (apiErr) {
        const errMsg = apiErr.message || '';
        const isRetryable = errMsg.includes('429') || errMsg.includes('upstream connect') 
          || errMsg.includes('connection termination') || errMsg.includes('ECONNREFUSED')
          || errMsg.includes('ECONNRESET') || errMsg.includes('fetch failed')
          || errMsg.includes('SSE read timeout');
        
        if (isRetryable && attempt < MAX_RETRIES) {
          const waitSec = errMsg.includes('429') ? (attempt + 1) * 5 : (attempt + 1) * 3; // 429: 5초/10초, 기타: 3초/6초
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
    
    // ── :::visualizer 블록 추출 → 차트 이미지 URL 변환 ──
    const { blocks: vizBlocks, stripped: contentWithoutViz } = extractVisualizerBlocks(rawContent);
    const chartImageUrls = [];
    for (const vb of vizBlocks) {
      const url = visualizerToQuickChartUrl(vb);
      if (url) chartImageUrls.push({ url, title: vb.title || `${vb.type} 차트`, type: vb.type });
    }
    if (chartImageUrls.length > 0) {
      console.log(`[Slack] 차트 이미지 ${chartImageUrls.length}개 생성: ${chartImageUrls.map(c => c.type).join(', ')}`);
    }
    
    // ── 도구 결과에서 메타정보 축적 ──
    if (result.toolCalls.length > 0) {
      accumulateToolMeta(channel, threadTs, result.toolCalls);
      const meta = getThreadMeta(channel, threadTs);
      console.log(`[Slack] 메타 축적: 테이블 ${meta.queriedTables.length}개, 스키마 ${meta.schemas.length}개, Jira ${meta.jiraIssues.length}개, Q#${meta.questionCount}`);
    }
    
    // ── 아티팩트 감지 + 자동 출판 ──
    let publishedUrl = null;
    
    // 웹에서만 동작하는 비주얼 도구 목록 (Slack에서는 링크가 아닌 텍스트로 떨어짐 → 반드시 출판)
    // ※ create_artifact/patch_artifact는 여기 넣지 않음 — 조건1에서 HTML로 직접 처리
    const VISUAL_TOOLS = new Set([
      'preview_fbx_animation', 'preview_prefab', 'find_resource_image',
      'build_character_profile', 'search_assets',
    ]);
    const usedTools = new Set(result.toolCalls.map(tc => tc.tool));
    const hasVisualTool = [...usedTools].some(t => VISUAL_TOOLS.has(t));
    const usedArtifactTool = usedTools.has('create_artifact') || usedTools.has('patch_artifact');
    
    // 대화형 진행 텍스트 필터링: "~하겠습니다", "~가져올게요" 같은 중간 진행 텍스트 제거
    function stripProgressText(text) {
      const lines = text.split('\n');
      const filtered = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true; // 빈 줄 유지
        // 진행 알림성 문장 패턴 (단독 문장으로 끝나는 것만 제거)
        // 미래형: "~하겠습니다", "~할게요" 등
        if (/^.{5,300}(하겠습니다|할게요|올게요|겠습니다|보겠습니다|드리겠습니다|니다나닝|니다데스|시작합니다|살펴보겠|확인하겠|분석하겠|수집하겠|검색하겠|조회하겠|정리하겠|가져오겠|만들어보겠|작성하겠|준비하겠|진행하겠|생성합니다|만들겠습니다)[.!~…]*$/.test(trimmed)) {
          return false;
        }
        // 과거형 상태 보고: "~확보했습니다", "~읽었습니다" 등 (실질적 내용 없이 상태만 보고)
        if (/^.{5,300}(확보했습니다|가져왔습니다|완료했습니다|읽었습니다|확인했습니다|수집했습니다|시작했습니다|마쳤습니다|받았습니다|찾았습니다|모았습니다)[.!~…]*$/.test(trimmed)) {
          return false;
        }
        return true;
      });
      return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    
    // 대화형 텍스트인지 판별 (실질적 데이터 없이 진행 안내만 있는 경우)
    function isConversationalOnly(text) {
      const stripped = stripProgressText(text);
      // 진행 텍스트 제거 후 실질적 내용이 100자 미만이면 대화형
      if (stripped.length < 100) return true;
      // 남은 줄이 3줄 미만이면 대화형
      const meaningfulLines = stripped.split('\n').filter(l => l.trim().length > 10);
      if (meaningfulLines.length < 3) return true;
      return false;
    }
    
    // 아티팩트 도구 사용 시 rawContent에서 HTML/코드 블록 제거
    // AI가 아티팩트 내용(HTML, YAML 등)을 텍스트에 포함시키는 경우 Slack에 코드가 노출되는 것을 방지
    function stripArtifactCode(text) {
      let cleaned = text;
      // YAML 블록 형태: "id: xxx\ntitle: xxx\nhtml: |\n  <!DOCTYPE..." 패턴 제거
      cleaned = cleaned.replace(/^(?:id:\s*.+\n)?(?:title:\s*.+\n)?html:\s*\|?\s*\n[\s\S]*?(?:<\/html>|<\/body>|<\/style>|<\/script>)[^\n]*/gm, '');
      // 인라인 HTML 블록: <!DOCTYPE ... </html> 전체 제거
      cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?<\/html>/gi, '');
      // 마크다운 코드펜스 안의 HTML 제거: ```html ... ```
      cleaned = cleaned.replace(/```(?:html|htm|css|xml)\n[\s\S]*?```/gi, '');
      // 길게 이어지는 HTML 태그 라인 제거 (style, div, table 등이 3줄 이상)
      cleaned = cleaned.replace(/(?:^[ \t]*<(?:style|div|table|tr|td|th|head|body|meta|link|section|h[1-6]|span|p|ul|ol|li|img|a |!--|script)[^>]*>.*\n){3,}/gim, '');
      // 남은 빈 줄 정리
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
      return cleaned;
    }

    // 출판용 콘텐츠: visualizer 블록 제거 + 진행 텍스트 필터링 (단, 필터 후 너무 짧으면 원본 사용)
    let textForSlack = chartImageUrls.length > 0 ? contentWithoutViz : rawContent;
    if (usedArtifactTool) {
      textForSlack = stripArtifactCode(textForSlack);
    }
    const _stripped = stripProgressText(textForSlack);
    const publishContent = _stripped.length >= 50 ? _stripped : textForSlack;
    
    // 구조화된 내용 판별 (대화형 텍스트가 아닌 실제 데이터/문서 내용인지)
    const hasTable = /\|.+\|.+\|/.test(publishContent) && publishContent.split('\n').filter(l => l.includes('|')).length > 2;
    const hasCodeBlock = /```[\s\S]{200,}```/.test(publishContent);
    const hasHeaders = (publishContent.match(/^#{1,3}\s+.+/gm) || []).length >= 2;
    const hasList = (publishContent.match(/^[-*]\s+.+/gm) || []).length >= 5;
    const hasStructuredContent = hasTable || hasCodeBlock || hasHeaders || hasList;
    
    // 강제 출판 조건: 비주얼 도구 + 대화형이 아닌 경우만
    const shouldForcePublish = (hasVisualTool && !isConversationalOnly(publishContent)) 
      || (result.toolCalls.length >= 2 && hasStructuredContent);
    
    // 출판 URL 추출 헬퍼
    function extractPublishedUrl(pubData) {
      let url = (pubData.url || '').replace(DATAMASTER_URL, DATAMASTER_PUBLIC_URL);
      if (url.includes('localhost') && DATAMASTER_PUBLIC_URL !== DATAMASTER_URL) {
        url = url.replace(/http:\/\/localhost:\d+/, DATAMASTER_PUBLIC_URL);
      }
      return url;
    }

    // 1) AI가 create_artifact/patch_artifact 도구로 만든 아티팩트 → HTML 직접 출판
    // result가 없는 경우도 포함하여 넓게 탐색
    const artifactTC = result.toolCalls.find(tc => 
      tc.tool === 'create_artifact' || tc.tool === 'patch_artifact'
    );
    if (artifactTC) {
      const artResult = artifactTC.result;
      const artData = (typeof artResult === 'object' && artResult) ? artResult : {};
      const artHtml = artData.html || '';
      const artTitle = artData.title || artifactTC.input?.title || userText.slice(0, 40);

      if (artHtml.length > 50) {
        try {
          const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: artTitle, html: artHtml, source: 'slack' }),
          });
          if (pubResp.ok) {
            publishedUrl = extractPublishedUrl(await pubResp.json());
            console.log(`[Slack] 아티팩트 출판 (HTML): "${artTitle}" → ${publishedUrl}`);
          }
        } catch (e) {
          console.warn('[Slack] 아티팩트 HTML 출판 실패:', e.message);
        }
      }

      // HTML이 없거나 짧거나 출판 실패 → rawContent에서 HTML 추출 시도
      if (!publishedUrl) {
        const htmlMatch = rawContent.match(/<!DOCTYPE[\s\S]*?<\/html>/i)
          || rawContent.match(/<html[\s\S]*?<\/html>/i);
        if (htmlMatch && htmlMatch[0].length > 100) {
          try {
            const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: artTitle, html: htmlMatch[0], source: 'slack' }),
            });
            if (pubResp.ok) {
              publishedUrl = extractPublishedUrl(await pubResp.json());
              console.log(`[Slack] 아티팩트 출판 (rawContent HTML 추출): "${artTitle}" → ${publishedUrl}`);
            }
          } catch (e) {
            console.warn('[Slack] rawContent HTML 출판 실패:', e.message);
          }
        }
      }

      // 그래도 실패 → publishContent(코드 제거된)를 마크다운으로 출판
      if (!publishedUrl && publishContent.length > 100) {
        try {
          const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: artTitle, markdown: publishContent, source: 'slack' }),
          });
          if (pubResp.ok) {
            publishedUrl = extractPublishedUrl(await pubResp.json());
            console.log(`[Slack] 아티팩트 출판 (마크다운 fallback): "${artTitle}" → ${publishedUrl}`);
          }
        } catch (e) {
          console.warn('[Slack] 아티팩트 마크다운 출판 실패:', e.message);
        }
      }
    }
    
    // 2) 비주얼 도구 사용 or 구조화된 데이터가 충분할 때 → 강제 출판
    if (!publishedUrl && !usedArtifactTool && shouldForcePublish && publishContent.length > 200) {
      try {
        const titleGuess = userText.slice(0, 40) + (userText.length > 40 ? '...' : '');
        const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleGuess, markdown: publishContent, source: 'slack' }),
        });
        if (pubResp.ok) {
          publishedUrl = extractPublishedUrl(await pubResp.json());
          console.log(`[Slack] 강제 출판 (${hasVisualTool ? '비주얼도구' : `구조화${result.toolCalls.length}도구`}): ${publishedUrl}`);
        }
      } catch (e) {
        console.warn('[Slack] 강제 출판 실패:', e.message);
      }
    }
    
    // 3) 나머지: 테이블/코드블록/긴 구조화 텍스트가 있으면 출판 (아티팩트 도구 미사용 시만)
    if (!publishedUrl && !usedArtifactTool && hasStructuredContent && publishContent.length > 600) {
      try {
        const titleGuess = userText.slice(0, 40) + (userText.length > 40 ? '...' : '');
        const pubResp = await fetch(`${DATAMASTER_URL}/api/v1/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleGuess, markdown: publishContent, source: 'slack' }),
        });
        if (pubResp.ok) {
          publishedUrl = extractPublishedUrl(await pubResp.json());
          console.log(`[Slack] 텍스트 출판: ${publishedUrl}`);
        }
      } catch (e) {
        console.warn('[Slack] 텍스트 출판 실패:', e.message);
      }
    }
    
    // ── Slack 메시지 조립 ──
    const blocks = [];
    
    if (publishedUrl) {
      // 출판된 경우: 요약 + 링크 버튼 (진행 텍스트 제거된 버전 사용)
      const summary = extractSlackSummary(publishContent);
      
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
      // 짧은 응답: 진행 텍스트("~하겠습니다" 등) 제거 후 Slack mrkdwn으로 표시
      let slackText = mdToSlack(publishContent);
      
      // 필터링 후 빈 경우 → rawContent fallback (아티팩트 사용 시 코드 제거)
      if (!slackText.trim()) {
        const fallbackRaw = usedArtifactTool ? stripArtifactCode(rawContent) : rawContent;
        slackText = mdToSlack(fallbackRaw);
      }
      
      // 아티팩트 도구를 사용했지만 출판 실패 + 남은 텍스트가 여전히 HTML 코드인 경우 안전장치
      if (usedArtifactTool && (/<[a-z][\s\S]*>/i.test(slackText) || /^\s*(body|html|style|div|meta|head)\s*\{/m.test(slackText))) {
        const artTitle = result.toolCalls.find(tc => tc.tool === 'create_artifact' || tc.tool === 'patch_artifact');
        const titleStr = artTitle?.input?.title || artTitle?.result?.title || '문서';
        slackText = '📄 *' + titleStr + '*이(가) 생성되었습니다.\n웹에서 확인해주세요.';
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
    
    // ── 차트 이미지 블록 추가 (QuickChart.io) ──
    let chartCacheId = null;
    if (chartImageUrls.length > 0) {
      chartCacheId = storeChartData(chartImageUrls, vizBlocks, publishedUrl);
      blocks.push({ type: 'divider' });
      for (const chart of chartImageUrls.slice(0, 3)) {
        blocks.push({
          type: 'image',
          image_url: chart.url,
          alt_text: chart.title,
          title: { type: 'plain_text', text: chart.title, emoji: true },
        });
      }

      // 차트가 2개 이상이거나 웹에서만 지원하는 타입이 있으면 모달 버튼 추가
      const unsupported = vizBlocks.filter(vb => !QUICKCHART_TYPES.has(vb.type));
      const actionElements = [];
      if (chartImageUrls.length >= 2 || unsupported.length > 0) {
        actionElements.push({
          type: 'button',
          text: { type: 'plain_text', text: '🔍 차트 모아보기', emoji: true },
          action_id: 'open_chart_modal',
          value: chartCacheId,
        });
      }
      if (publishedUrl) {
        actionElements.push({
          type: 'button',
          text: { type: 'plain_text', text: '🌐 웹에서 상세 보기', emoji: true },
          url: publishedUrl,
        });
      }
      if (actionElements.length > 0) {
        blocks.push({ type: 'actions', elements: actionElements });
      }
      if (unsupported.length > 0) {
        blocks.push({
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `💡 _${unsupported.map(u => u.type).join(', ')} 차트는 모달 또는 웹에서 확인할 수 있습니다_` }],
        });
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
    let fallbackText;
    if (publishedUrl) {
      fallbackText = extractSlackSummary(publishContent) + '\n\n📊 전체 결과: ' + publishedUrl;
    } else {
      let fbSource = publishContent || rawContent;
      if (usedArtifactTool) fbSource = stripArtifactCode(fbSource);
      fallbackText = mdToSlack(fbSource).slice(0, 3000);
    }
    
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

    // Home Tab 활동 추적
    trackUserActivity(userId, {
      query: userText.slice(0, 100),
      tools: [...new Set(result.toolCalls.map(tc => tc.tool))],
      chartCount: chartImageUrls.length,
      publishedUrl,
    });

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
    _activeThreads.delete(threadKey);
  }
}

// ── 이벤트 리스너 ──

let _botUserId = '';

// @DataMaster 멘션
app.event('app_mention', async (args) => {
  const ev = args.event;
  // files가 없으면 약간 대기 — message 이벤트(파일 포함)가 먼저 처리될 수 있도록
  if (!ev.files || ev.files.length === 0) {
    await new Promise(r => setTimeout(r, 500));
  }
  await handleMessage({ ...args, message: ev });
});

// DM + 채널 메시지 (파일 첨부 시 app_mention에 files가 누락될 수 있으므로 message 이벤트도 처리)
app.event('message', async (args) => {
  const { event } = args;

  // DM → 항상 처리
  if (event.channel_type === 'im') {
    await handleMessage({ ...args, message: event });
    return;
  }

  // 채널 메시지: 파일이 첨부되고 봇 멘션이 포함된 경우만 처리
  // (app_mention 이벤트에서 files가 누락되는 케이스 보완)
  if (event.files && event.files.length > 0 && event.text) {
    if (!_botUserId) {
      try {
        const authResp = await args.client.auth.test();
        _botUserId = authResp.user_id || '';
      } catch { /* ignore */ }
    }
    const hasBotMention = _botUserId
      ? event.text.includes(`<@${_botUserId}>`)
      : /datamaster/i.test(event.text);
    if (hasBotMention) {
      console.log(`[Slack:debug] message 이벤트에서 파일+멘션 감지 (files=${event.files.length})`);
      await handleMessage({ ...args, message: event });
    }
  }
});

// ── 차트 모달 (버튼 클릭 → 차트 모아보기) ──
app.action('open_chart_modal', async ({ ack, body, client }) => {
  await ack();
  const cacheId = body.actions?.[0]?.value;
  const cached = cacheId ? chartCache.get(cacheId) : null;

  if (!cached || cached.charts.length === 0) {
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: '📊 차트 보기' },
          close: { type: 'plain_text', text: '닫기' },
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '차트 데이터가 만료되었습니다. 다시 질문해주세요.' } }],
        },
      });
    } catch (e) { console.warn('[Slack] 차트 모달 오류:', e.message); }
    return;
  }

  const modalBlocks = [];

  for (let i = 0; i < cached.charts.length; i++) {
    const chart = cached.charts[i];
    if (i > 0) modalBlocks.push({ type: 'divider' });
    modalBlocks.push({
      type: 'header',
      text: { type: 'plain_text', text: chart.title || `차트 ${i + 1}`, emoji: true },
    });
    modalBlocks.push({
      type: 'image',
      image_url: chart.url.replace('w=600&h=400', 'w=800&h=500'),
      alt_text: chart.title || `차트 ${i + 1}`,
    });
    // 차트 원본 데이터 표시
    const vizBlock = cached.vizBlocks.find(vb => (vb.title || `${vb.type} 차트`) === chart.title);
    if (vizBlock?.body) {
      const dataPreview = vizBlock.body.split('\n').slice(0, 8).join('\n');
      modalBlocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `📋 _${chart.type}_ 차트 · 데이터:\n\`\`\`${dataPreview}\`\`\`` }],
      });
    }
  }

  // 웹에서만 지원하는 차트 타입 안내
  const unsupported = cached.vizBlocks.filter(vb => !QUICKCHART_TYPES.has(vb.type));
  if (unsupported.length > 0) {
    modalBlocks.push({ type: 'divider' });
    for (const vb of unsupported) {
      modalBlocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*${vb.title || vb.type}* (_${vb.type}_ 타입)\n이 차트는 Slack에서 이미지로 표시할 수 없습니다.` },
      });
      if (vb.body) {
        const preview = vb.body.split('\n').slice(0, 5).join('\n');
        modalBlocks.push({
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `\`\`\`${preview}\`\`\`` }],
        });
      }
    }
  }

  // 웹 링크 버튼
  if (cached.publishedUrl) {
    modalBlocks.push({ type: 'divider' });
    modalBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '🌐 인터랙티브 차트와 전체 결과는 웹에서 확인할 수 있습니다.' },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: '웹에서 보기', emoji: true },
        url: cached.publishedUrl,
        style: 'primary',
      },
    });
  }

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: '📊 차트 모아보기' },
        close: { type: 'plain_text', text: '닫기' },
        blocks: modalBlocks.slice(0, 100),
      },
    });
    console.log(`[Slack] 차트 모달 열림: ${cached.charts.length}개 차트`);
  } catch (e) {
    console.error('[Slack] 차트 모달 오류:', e.message);
  }
});

// ── App Home Tab (대시보드) ──
app.event('app_home_opened', async ({ event, client }) => {
  const userId = event.user;

  try {
    const blocks = [];

    // 헤더
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: '📊 DataMaster 대시보드', emoji: true },
    });
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 기준_` }],
    });
    blocks.push({ type: 'divider' });

    // 서버 상태
    let serverOk = false;
    try {
      const healthResp = await fetch(`${DATAMASTER_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      serverOk = healthResp.ok;
    } catch { /* ignore */ }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🖥️ 서버 상태*\n${serverOk ? '✅ DataMaster 온라인' : '❌ DataMaster 오프라인'}\n📡 Socket Mode 연결 중`,
      },
    });
    blocks.push({ type: 'divider' });

    // 최근 출판 문서 (전체)
    let publishedDocs = [];
    try {
      const pubResp = await fetch(`${DATAMASTER_URL}/api/published`, { signal: AbortSignal.timeout(5000) });
      if (pubResp.ok) publishedDocs = await pubResp.json();
    } catch { /* ignore */ }

    if (publishedDocs.length > 0) {
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: '📄 최근 출판 문서', emoji: true },
      });

      const recent = publishedDocs
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      for (const doc of recent) {
        const dateStr = doc.createdAt
          ? new Date(doc.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '';
        const docUrl = DATAMASTER_PUBLIC_URL + '/api/p/' + doc.id;
        const docTitle = doc.title || '(제목 없음)';
        const sourceBadge = doc.source === 'slack' ? ' · Slack에서 생성' : '';
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: '*<' + docUrl + '|' + docTitle + '>*\n' + dateStr + sourceBadge },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: '열기', emoji: true },
            url: docUrl,
          },
        });
      }
      blocks.push({ type: 'divider' });
    }

    // 내 최근 활동
    const myActivity = userActivity.get(userId) || [];
    if (myActivity.length > 0) {
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: '🕐 내 최근 질문', emoji: true },
      });

      for (const act of myActivity.slice(0, 8)) {
        const timeStr = new Date(act.timestamp).toLocaleString('ko-KR', {
          timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const toolIcons = (act.tools || []).map(t => TOOL_LABELS[t] || t).slice(0, 4).join(' ');
        const chartBadge = act.chartCount > 0 ? ` · 📈 차트 ${act.chartCount}개` : '';
        const pubBadge = act.publishedUrl ? ` · <${act.publishedUrl}|📄 문서>` : '';
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*${act.query}*\n${timeStr} · ${toolIcons}${chartBadge}${pubBadge}` },
        });
      }
      blocks.push({ type: 'divider' });
    }

    // 사용법 안내
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: '💡 사용법', emoji: true },
    });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          '• 채널에서 *@DataMaster* 멘션하여 질문',
          '• DM으로 직접 메시지 보내기',
          '• `/datamaster` 슬래시 커맨드 사용',
          '• 👍/👎 리액션으로 답변 피드백',
          '',
          '*예시 질문:*',
          '> 전사 캐릭터의 스탯 비교해줘',
          '> 아이템 테이블 구조 보여줘',
          '> AEGIS-1234 이슈 알려줘',
        ].join('\n'),
      },
    });

    // 통계
    const totalSessions = threadSessions.size;
    const totalActivities = [...userActivity.values()].reduce((sum, list) => sum + list.length, 0);
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `📊 활성 세션: ${totalSessions} · 총 질문: ${totalActivities} · 출판 문서: ${publishedDocs.length}개` }],
    });

    await client.views.publish({
      user_id: userId,
      view: {
        type: 'home',
        blocks: blocks.slice(0, 100),
      },
    });
    console.log(`[Slack] Home Tab 업데이트: user=${userId}`);
  } catch (err) {
    console.error('[Slack] Home Tab 오류:', err.message);
  }
});

// ── 링크 언펄링 (DataMaster URL 공유 시 리치 프리뷰) ──
app.event('link_shared', async ({ event, client }) => {
  try {
    const unfurls = {};
    for (const link of event.links || []) {
      const url = link.url || '';
      const docMatch = url.match(/\/api\/p\/([a-z0-9_]+)/i) || url.match(/\/api\/v1\/published\/([a-z0-9_]+)/i);
      if (!docMatch) continue;

      const docId = docMatch[1];
      let title = 'DataMaster 분석 결과';
      let description = '자세한 내용은 링크를 클릭해 확인하세요.';

      try {
        const metaResp = await fetch(`${DATAMASTER_URL}/api/published`);
        if (metaResp.ok) {
          const allDocs = await metaResp.json();
          const doc = allDocs.find(d => d.id === docId);
          if (doc) {
            title = doc.title || title;
            description = doc.description || `${doc.author ? doc.author + ' · ' : ''}${new Date(doc.createdAt).toLocaleDateString('ko-KR')} 생성`;
          }
        }
      } catch (metaErr) {
        console.warn('[Slack] 문서 메타 조회 실패:', metaErr.message);
      }

      unfurls[url] = {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📊 ${title}*\n${description}`,
            },
            accessory: {
              type: 'button',
              text: { type: 'plain_text', text: '열기', emoji: true },
              url: url,
              style: 'primary',
            },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: '📋 _DataMaster에서 생성된 문서입니다_' },
            ],
          },
        ],
      };
    }

    if (Object.keys(unfurls).length > 0) {
      await client.chat.unfurl({
        ts: event.message_ts,
        channel: event.channel,
        unfurls,
      });
      console.log(`[Slack] 링크 언펄링 완료: ${Object.keys(unfurls).length}개`);
    }
  } catch (err) {
    console.error('[Slack] 링크 언펄링 오류:', err.message);
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
    
    const { blocks: cmdVizBlocks, stripped: cmdStripped } = extractVisualizerBlocks(result.content);
    const cmdCharts = cmdVizBlocks.map(vb => ({ url: visualizerToQuickChartUrl(vb), title: vb.title || `${vb.type} 차트` })).filter(c => c.url);
    
    let response = mdToSlack(cmdCharts.length > 0 ? cmdStripped : result.content);
    const toolSummary = formatToolSummary(result.toolCalls);
    response = truncateForSlack(response + toolSummary);

    const cmdBlocks = [{ type: 'section', text: { type: 'mrkdwn', text: response.slice(0, 2900) } }];
    for (const chart of cmdCharts.slice(0, 3)) {
      cmdBlocks.push({ type: 'image', image_url: chart.url, alt_text: chart.title, title: { type: 'plain_text', text: chart.title, emoji: true } });
    }

    await respond({
      text: response,
      blocks: cmdBlocks,
      response_type: 'in_channel',
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
║  기능:                                                        ║
║  • 📊 차트 모아보기 모달 (버튼 클릭)                          ║
║  • 🏠 App Home Tab 대시보드                                  ║
║  • 🔗 링크 언펄링 · 👍👎 피드백                              ║
║                                                              ║
║  종료: Ctrl+C                                                ║
╚══════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Slack Bot 시작 실패:', error);
    process.exit(1);
  }
})();
