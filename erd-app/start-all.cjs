/**
 * start-all.cjs — 모든 서버를 한 번에 기동
 *
 * 플랫폼 헬스체크에 즉시 응답하기 위해 임시 HTTP 서버를 먼저 띄운 뒤,
 * vite build를 비동기로 실행하고, 완료 후 vite preview로 교체합니다.
 *
 * 1) 임시 HTTP 서버 (포트 즉시 점유, 헬스체크 응답)
 * 2) vite build (비동기)
 * 3) 빌드 완료 → 임시 서버 종료 → vite preview 시작
 * 4) node slack-bot.cjs
 * 5) python bible-tabling/main.py
 */
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const children = [];
const appPort = parseInt(process.env.PORT || '5173');
const btPort = parseInt(process.env.SECONDARY_PORT || process.env.TOOL_PORT || '8100');

function log(tag, msg) {
  const ts = new Date().toLocaleTimeString('en-GB');
  for (const line of msg.toString().trimEnd().split('\n')) {
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
  for (const c of children) { try { c.kill('SIGTERM'); } catch {} }
  if (tempServer) { try { tempServer.close(); } catch {} }
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
      for (const pid of pids) { try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch {} }
      if (pids.size > 0) log('MAIN', `killed ${pids.size} process(es) on port ${port}`);
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'pipe' });
    }
  } catch {}
}

// ── 0. 기존 포트 점유 프로세스 정리 ──
killPort(appPort);
killPort(btPort);

// ── 1. 임시 HTTP 서버 즉시 시작 (헬스체크 응답용) ──
let tempServer = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<html><body style="background:#0f1117;color:#94a3b8;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><div style="font-size:24px;margin-bottom:12px">Building...</div><div style="font-size:14px;opacity:0.6">앱을 빌드 중입니다. 잠시만 기다려주세요.</div></div></body></html>');
});
tempServer.listen(appPort, '0.0.0.0', () => {
  log('MAIN', `temp server listening on port ${appPort} (health check ready)`);
});

// ── 2. Slack Bot (빌드와 병렬로 시작) ──
const slackBotPath = path.join(ROOT, 'slack-bot.cjs');
if (fs.existsSync(slackBotPath) && process.env.SLACK_BOT_TOKEN) {
  launch('SLACK', 'node', ['slack-bot.cjs']);
} else {
  log('SLACK', 'skipped (no SLACK_BOT_TOKEN or slack-bot.cjs not found)');
}

// ── 3. Bible Tabling Python 서버 (빌드와 병렬로 시작) ──
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

// ── 4. Vite build (비동기) → 완료 후 임시 서버 종료 → vite preview 시작 ──
log('MAIN', 'running vite build...');
const buildProc = spawn('npx', ['vite', 'build'], {
  cwd: ROOT,
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
buildProc.stdout.on('data', d => log('BUILD', d));
buildProc.stderr.on('data', d => log('BUILD', d));

buildProc.on('exit', (code) => {
  if (code !== 0) {
    log('BUILD', `vite build failed (code=${code})`);
    if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
      log('MAIN', 'no previous build found, exiting');
      cleanup();
      return;
    }
    log('MAIN', 'using previous build');
  } else {
    log('BUILD', 'vite build complete');
  }

  // 임시 서버 종료 → vite preview 시작
  if (tempServer) {
    tempServer.close(() => {
      log('MAIN', 'temp server closed, starting vite preview...');
      launch('VITE', 'npx', ['vite', 'preview']);
    });
    tempServer = null;
  } else {
    launch('VITE', 'npx', ['vite', 'preview']);
  }

  log('MAIN', 'all services launched. Press Ctrl+C to stop.');
});
