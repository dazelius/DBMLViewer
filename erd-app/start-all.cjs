/**
 * start-all.cjs — 모든 서버를 한 번에 기동
 *
 * 1) vite build → vite preview (메인 앱)
 * 2) node slack-bot.cjs (슬랙 봇)
 * 3) python bible-tabling/main.py (바이브테이블링)
 *
 * 자식 프로세스의 stdout/stderr를 접두사 태그와 함께 콘솔에 출력합니다.
 * Ctrl+C로 종료하면 모든 자식 프로세스도 함께 종료됩니다.
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const children = [];

function log(tag, msg) {
  const ts = new Date().toLocaleTimeString('en-GB');
  const lines = msg.toString().trimEnd().split('\n');
  for (const line of lines) {
    console.log(`[${ts}] [${tag}] ${line}`);
  }
}

function launch(tag, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...opts.env },
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', d => log(tag, d));
  child.stderr.on('data', d => log(tag, d));
  child.on('exit', (code) => log(tag, `exited (code=${code})`));
  children.push(child);
  return child;
}

function cleanup() {
  log('MAIN', 'shutting down all services...');
  for (const c of children) {
    try { c.kill('SIGTERM'); } catch { /* ignore */ }
  }
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr ":${port} "`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const m = line.trim().split(/\s+/);
        const pid = m[m.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch { /* ignore */ }
      }
      if (pids.size > 0) log('MAIN', `killed ${pids.size} process(es) on port ${port}`);
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'pipe' });
    }
  } catch { /* no process on port */ }
}

// ── 0. 기존 포트 점유 프로세스 정리 ──
const appPort = process.env.PORT || '5173';
const btPort = process.env.SECONDARY_PORT || process.env.TOOL_PORT || '8100';
killPort(appPort);
killPort(btPort);

// ── 1. Vite build ──
log('MAIN', 'running vite build...');
try {
  execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' });
  log('MAIN', 'vite build complete');
} catch (e) {
  log('MAIN', `vite build failed: ${e.message}`);
  process.exit(1);
}

// ── 2. Vite preview (메인 앱) ──
launch('VITE', 'npx', ['vite', 'preview']);

// ── 3. Slack Bot (토큰이 있을 때만) ──
const slackBotPath = path.join(ROOT, 'slack-bot.cjs');
if (fs.existsSync(slackBotPath) && process.env.SLACK_BOT_TOKEN) {
  launch('SLACK', 'node', ['slack-bot.cjs']);
} else {
  log('SLACK', 'skipped (no SLACK_BOT_TOKEN or slack-bot.cjs not found)');
}

// ── 4. Bible Tabling Python 서버 ──
const btMain = path.join(ROOT, 'bible-tabling', 'main.py');
const btReqs = path.join(ROOT, 'bible-tabling', 'requirements.txt');
if (fs.existsSync(btMain)) {
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  if (fs.existsSync(btReqs)) {
    log('BIBLE', 'installing Python dependencies...');
    try { execSync(`${pythonCmd} -m pip install -r requirements.txt -q`, { cwd: path.join(ROOT, 'bible-tabling'), stdio: 'pipe' }); }
    catch { log('BIBLE', 'pip install warning (may already be installed)'); }
  }
  launch('BIBLE', pythonCmd, ['main.py'], { cwd: path.join(ROOT, 'bible-tabling') });
} else {
  log('BIBLE', 'skipped (bible-tabling/main.py not found)');
}

log('MAIN', 'all services launched. Press Ctrl+C to stop.');
