/* Git-based repository sync & file loading */

export interface GitSyncResult {
  status: 'cloned' | 'updated' | 'up-to-date';
  message: string;
  commit?: string;
}

export interface GitStatus {
  cloned: boolean;
  commit?: string;
  date?: string;
  message?: string;
}

export interface GitFilesResult {
  count: number;
  files: { name: string; base64: string }[];
}

export async function gitSync(
  repoUrl?: string,
  token?: string,
  branch = 'main'
): Promise<GitSyncResult> {
  const body: Record<string, string> = { branch };
  if (repoUrl) body.repoUrl = repoUrl;
  if (token) body.token = token;

  const res = await fetch('/api/git/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Sync failed: ${res.status}`);
  }

  return res.json();
}

export async function gitStatus(): Promise<GitStatus> {
  const res = await fetch('/api/git/status');
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

export async function gitLoadFiles(
  path: string
): Promise<{ name: string; data: ArrayBuffer }[]> {
  const res = await fetch(`/api/git/files?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Load failed: ${res.status}`);
  }

  const result: GitFilesResult = await res.json();

  return result.files.map((f) => ({
    name: f.name,
    data: base64ToArrayBuffer(f.base64),
  }));
}

/* ---------- Git Log / Diff APIs ---------- */

export interface GitCommit {
  hash: string;
  short: string;
  date: string;
  author: string;
  message: string;
}

export interface GitDiffChange {
  status: string;
  file: string;
}

export interface GitDiffResult {
  from: string;
  to: string;
  changes: GitDiffChange[];
  statSummary: string;
}

export async function gitLog(count = 20, path = ''): Promise<GitCommit[]> {
  const params = new URLSearchParams({ count: String(count) });
  if (path) params.set('path', path);
  const res = await fetch(`/api/git/log?${params}`);
  if (!res.ok) throw new Error(`Log failed: ${res.status}`);
  const data = await res.json();
  return data.commits;
}

export async function gitDiff(from: string, to: string, path = ''): Promise<GitDiffResult> {
  const params = new URLSearchParams({ from, to });
  if (path) params.set('path', path);
  const res = await fetch(`/api/git/diff?${params}`);
  if (!res.ok) throw new Error(`Diff failed: ${res.status}`);
  return res.json();
}

export async function gitDiffDetail(from: string, to: string, file: string): Promise<string> {
  const params = new URLSearchParams({ from, to, file });
  const res = await fetch(`/api/git/diff-detail?${params}`);
  if (!res.ok) throw new Error(`Diff detail failed: ${res.status}`);
  const data = await res.json();
  return data.diff;
}

export async function gitFilesAtCommit(
  commit: string,
  path: string
): Promise<{ name: string; data: ArrayBuffer }[]> {
  const params = new URLSearchParams({ commit, path });
  const res = await fetch(`/api/git/files-at-commit?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Load failed: ${res.status}`);
  }
  const result = await res.json();
  return result.files.map((f: { name: string; base64: string }) => ({
    name: f.name,
    data: base64ToArrayBuffer(f.base64),
  }));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}
