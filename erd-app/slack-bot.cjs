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

// ── 마크다운 → Slack mrkdwn 변환 ──
function mdToSlack(text) {
  if (!text) return '';
  
  return text
    // 볼드: **text** → *text*
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    // 이탤릭: *text* (이미 Slack 호환)
    // 코드블록: ```lang\ncode\n``` → ```\ncode\n```
    .replace(/```\w*\n/g, '```\n')
    // 인라인 코드: `code` (이미 Slack 호환)
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

// ── 도구 호출 요약 생성 ──
function formatToolSummary(toolCalls) {
  if (!toolCalls || toolCalls.length === 0) return '';

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

  const lines = toolCalls.map(tc => {
    const emoji = TOOL_EMOJI[tc.tool] || '🔧';
    const summary = tc.summary ? ` — ${tc.summary.slice(0, 80)}` : '';
    return `${emoji} \`${tc.tool}\`${summary}`;
  });

  return `\n\n> *사용한 도구 (${toolCalls.length}개):*\n> ${lines.join('\n> ')}`;
}

// ── Slack 메시지 길이 제한 처리 ──
function truncateForSlack(text, maxLen = 3800) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\n\n... _(응답이 잘렸습니다. DataMaster 웹에서 전체 내용을 확인하세요)_';
}

// ── 메시지 처리 핸들러 ──
async function handleMessage({ message, say, client, event }) {
  // 봇 자신의 메시지 무시
  if (message?.bot_id || message?.subtype === 'bot_message') return;

  const channel = event?.channel || message?.channel;
  const threadTs = event?.thread_ts || message?.thread_ts || message?.ts || event?.ts;
  const userText = (event?.text || message?.text || '').replace(/<@[A-Z0-9]+>/g, '').trim();

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
      const emoji = TOOL_EMOJI[toolName] || '🔧';
      toolProgress.push(`${emoji} \`${toolName}\``);
      
      // 너무 자주 업데이트하지 않도록 1초 디바운스
      const now = Date.now();
      if (now - lastUpdate < 1000 || !loadingMsg?.ts) return;
      lastUpdate = now;
      
      try {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: `🔍 분석 중... (${toolProgress.length}개 도구 사용)`,
          blocks: [{
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `🔍 *DataMaster* 분석 중...\n${toolProgress.join(' → ')}` }],
          }],
        });
      } catch { /* rate limit 무시 */ }
    };

    const result = await callDataMasterStreaming(userText, sessionId, onToolStart);
    
    // 응답 포맷팅
    let response = mdToSlack(result.content);
    const toolSummary = formatToolSummary(result.toolCalls);
    
    // 텍스트가 비어있고 도구 결과가 있으면 → 도구 결과를 포맷팅하여 대체 응답 생성
    if (!response.trim() && result.toolCalls.length > 0) {
      const fallbackLines = ['📊 *DataMaster 분석 결과*\n'];
      for (const tc of result.toolCalls) {
        const emoji = TOOL_EMOJI[tc.tool] || '🔧';
        const summary = tc.summary || '(결과 없음)';
        fallbackLines.push(`${emoji} *\`${tc.tool}\`*`);
        // 요약을 정리하여 표시 (최대 500자)
        const cleanSummary = summary
          .replace(/\n/g, '\n> ')
          .slice(0, 500);
        fallbackLines.push(`> ${cleanSummary}`);
        fallbackLines.push('');
      }
      response = fallbackLines.join('\n');
      console.log(`[Slack] 텍스트 응답 없음 → 도구 결과 폴백 (${response.length}자)`);
    }
    
    // 도구 호출 요약 추가
    if (toolSummary && result.content.trim()) {
      response = truncateForSlack(response, 3400) + toolSummary;
    } else {
      response = truncateForSlack(response);
    }

    // 로딩 메시지 업데이트 → 실제 응답으로 교체
    if (loadingMsg?.ts) {
      // Slack 블록은 최대 50개, 텍스트는 3000자 제한 → 긴 응답은 분할
      if (response.length > 3800) {
        // 첫 블록 업데이트
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: response.slice(0, 3800),
        });
        // 나머지는 별도 메시지로 (3800자씩 분할)
        for (let i = 3800; i < response.length; i += 3800) {
          await say({
            text: response.slice(i, i + 3800),
            thread_ts: threadTs,
          });
        }
      } else {
        await client.chat.update({
          channel,
          ts: loadingMsg.ts,
          text: response,
        });
      }
    } else {
      await say({ text: response, thread_ts: threadTs });
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
