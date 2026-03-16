/**
 * UnityPage.tsx
 * Unity 에셋 브라우저 — FBX / Prefab / C# / Scene / Texture / Material 등
 * /api/assets/list 를 통해 파일 트리를 가져와 브라우징
 */
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

const FbxViewer = lazy(() =>
  import('../components/FbxViewer').then(m => ({ default: m.FbxViewer }))
);
const SceneViewer = lazy(() =>
  import('../components/SceneViewer').then(m => ({ default: m.SceneViewer }))
);

// ── 에셋 타입 정의 ─────────────────────────────────────────────────────────────
type AssetType = 'fbx' | 'prefab' | 'cs' | 'unity' | 'mat' | 'png' | 'jpg' | 'tga' | 'anim' | 'controller' | 'asset' | 'other';

interface AssetFile {
  name: string;      // 파일명
  path: string;      // 상대 경로
  type: AssetType;
  size?: number;
  modified?: string;
}

interface AssetDir {
  name: string;
  path: string;
  children: AssetNode[];
  fileCount?: number;
}

type AssetNode = { kind: 'file'; file: AssetFile } | { kind: 'dir'; dir: AssetDir };

// ── 타입별 메타 ────────────────────────────────────────────────────────────────
const TYPE_META: Record<AssetType | 'other', { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  fbx:        { label: 'FBX',        color: '#818cf8', bg: 'rgba(99,102,241,0.12)',   icon: <FbxIcon /> },
  prefab:     { label: 'Prefab',     color: '#34d399', bg: 'rgba(52,211,153,0.12)',   icon: <PrefabIcon /> },
  cs:         { label: 'C#',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: <CsIcon /> },
  unity:      { label: 'Scene',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  icon: <SceneIcon /> },
  mat:        { label: 'Material',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   icon: <MatIcon /> },
  png:        { label: 'Texture',    color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',   icon: <TexIcon /> },
  jpg:        { label: 'Texture',    color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',   icon: <TexIcon /> },
  tga:        { label: 'Texture',    color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',   icon: <TexIcon /> },
  anim:       { label: 'Animation',  color: '#e879f9', bg: 'rgba(232,121,249,0.12)',  icon: <AnimIcon /> },
  controller: { label: 'Animator',   color: '#e879f9', bg: 'rgba(232,121,249,0.12)',  icon: <AnimIcon /> },
  asset:      { label: 'Asset',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',  icon: <OtherIcon /> },
  other:      { label: 'Other',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',  icon: <OtherIcon /> },
};

const ALL_FILTERS: Array<{ key: AssetType | 'all'; label: string }> = [
  { key: 'all',        label: '전체' },
  { key: 'fbx',        label: 'FBX' },
  { key: 'prefab',     label: 'Prefab' },
  { key: 'cs',         label: 'C#' },
  { key: 'unity',      label: 'Scene' },
  { key: 'anim',       label: 'Animation' },
  { key: 'mat',        label: 'Material' },
  { key: 'png',        label: 'Texture' },
  { key: 'asset',      label: 'Asset' },
];

function extToType(ext: string): AssetType {
  switch (ext.toLowerCase()) {
    case 'fbx':        return 'fbx';
    case 'prefab':     return 'prefab';
    case 'cs':         return 'cs';
    case 'unity':      return 'unity';
    case 'mat':        return 'mat';
    case 'png': case 'jpg': case 'jpeg': return 'png';
    case 'tga':        return 'tga';
    case 'anim':       return 'anim';
    case 'controller': return 'controller';
    case 'asset':      return 'asset';
    default:           return 'other';
  }
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ── 아이콘 컴포넌트 ─────────────────────────────────────────────────────────────
function FbxIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>;
}
function PrefabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>;
}
function CsIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
  </svg>;
}
function SceneIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
    <line x1="12" y1="22" x2="12" y2="15.5"/>
    <polyline points="22 8.5 12 15.5 2 8.5"/>
  </svg>;
}
function MatIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
  </svg>;
}
function TexIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>;
}
function AnimIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="10 8 16 12 10 16 10 8"/>
  </svg>;
}
function OtherIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>;
}
function FolderIcon({ open }: { open?: boolean }) {
  return open
    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>;
}

// ── API ──────────────────────────────────────────────────────────────────────
interface ApiFile { name: string; path: string; size?: number; modified?: string }
interface ApiListResponse { path: string; dirs: Array<{ name: string; path: string; count?: number }>; files: ApiFile[] }

async function fetchDir(path: string): Promise<{ dirs: Array<{ name: string; path: string; count?: number }>; files: ApiFile[] }> {
  const url = `/api/assets/browse?path=${encodeURIComponent(path)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data: ApiListResponse = await resp.json();
  return { dirs: data.dirs ?? [], files: data.files ?? [] };
}

async function fetchFileContent(path: string): Promise<string> {
  const resp = await fetch(`/api/assets/file?path=${encodeURIComponent(path)}`);
  if (!resp.ok) throw new Error(`파일 로드 실패: ${resp.status}`);
  return resp.text();
}

// ── 검색: 재귀적으로 파일 수집 ───────────────────────────────────────────────
async function searchFiles(
  basePath: string,
  query: string,
  typeFilter: AssetType | 'all',
  signal: AbortSignal,
  onProgress?: (count: number) => void,
  maxDepth = 6,
): Promise<AssetFile[]> {
  const results: AssetFile[] = [];
  const q = query.toLowerCase();

  async function walk(p: string, depth: number) {
    if (depth > maxDepth || signal.aborted) return;
    try {
      const { dirs, files } = await fetchDir(p);
      for (const f of files) {
        if (signal.aborted) return;
        const ext = f.name.split('.').pop() ?? '';
        const type = extToType(ext);
        const matchType = typeFilter === 'all'
          || type === typeFilter
          || (typeFilter === 'png' && (type === 'png' || type === 'jpg' || type === 'tga'));
        const matchQuery = !q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
        if (matchType && matchQuery) {
          results.push({ name: f.name, path: f.path, type, size: f.size, modified: f.modified });
          onProgress?.(results.length);
        }
      }
      await Promise.all(dirs.map(d => walk(d.path, depth + 1)));
    } catch { /* skip failed dirs */ }
  }

  await walk(basePath, 0);
  return results;
}

// ── 파일 트리 노드 ─────────────────────────────────────────────────────────────
interface TreeNodeProps {
  name: string;
  path: string;
  depth: number;
  onSelectDir: (path: string) => void;
  selectedDir: string;
}

function TreeNode({ name, path, depth, onSelectDir, selectedDir }: TreeNodeProps) {
  const [open, setOpen] = useState(depth < 1);
  const [children, setChildren] = useState<Array<{ name: string; path: string }>>([]);
  const [loaded, setLoaded] = useState(false);
  const isSelected = selectedDir === path;

  const toggle = useCallback(async () => {
    if (!loaded) {
      try {
        const { dirs } = await fetchDir(path);
        setChildren(dirs.map(d => ({ name: d.name, path: d.path })));
        setLoaded(true);
      } catch { setLoaded(true); }
    }
    setOpen(v => !v);
    onSelectDir(path);
  }, [path, loaded, onSelectDir]);

  return (
    <div>
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          paddingLeft: 8 + depth * 12, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
          cursor: 'pointer',
          background: isSelected ? 'rgba(99,102,241,0.2)' : 'transparent',
          borderLeft: isSelected ? '2px solid #818cf8' : '2px solid transparent',
          color: isSelected ? '#e2e8f0' : '#94a3b8',
          fontSize: 12, userSelect: 'none',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
        title={path}
      >
        <span style={{ width: 10, textAlign: 'center', fontSize: 8, color: '#475569', flexShrink: 0 }}>
          {children.length > 0 || !loaded ? (open ? '▼' : '▶') : ''}
        </span>
        <FolderIcon open={open} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
      </div>
      {open && children.map(c => (
        <TreeNode key={c.path} name={c.name} path={c.path} depth={depth + 1} onSelectDir={onSelectDir} selectedDir={selectedDir} />
      ))}
    </div>
  );
}

// ── 코드 뷰어 ─────────────────────────────────────────────────────────────────
function CodeViewer({ path, onClose }: { path: string; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetchFileContent(path)
      .then(c => { setCode(c); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [path]);

  const lines = code.split('\n');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          width: '80vw', maxWidth: 900, height: '80vh',
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#161b22',
          flexShrink: 0,
        }}>
          <span style={{ color: '#f59e0b', fontSize: 13 }}>⬡</span>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{path.split('/').pop()}</span>
          <span style={{ color: '#475569', fontSize: 11, marginLeft: 4 }}>{path}</span>
          <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 11 }}>{lines.length} lines</span>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
          >✕</button>
        </div>

        {/* 코드 */}
        <div style={{ flex: 1, overflow: 'auto', fontFamily: 'Consolas, "Cascadia Code", monospace' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', gap: 8, fontSize: 13 }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              로딩 중...
            </div>
          )}
          {error && <div style={{ color: '#f87171', padding: 16, fontSize: 12 }}>{error}</div>}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} style={{ lineHeight: '20px' }}>
                    <td style={{
                      width: 50, minWidth: 50, textAlign: 'right', paddingRight: 12, paddingLeft: 8,
                      color: '#3d4d5e', userSelect: 'none', borderRight: '1px solid #1e293b',
                      fontSize: 11, verticalAlign: 'top',
                    }}>
                      {i + 1}
                    </td>
                    <td style={{ paddingLeft: 16, paddingRight: 16, color: '#cdd9e5', whiteSpace: 'pre', verticalAlign: 'top' }}>
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FBX 인라인 뷰어 모달 ───────────────────────────────────────────────────────
function FbxModal({ path, name, onClose }: { path: string; name: string; onClose: () => void }) {
  const fbxUrl = `/api/assets/file?path=${encodeURIComponent(path)}`;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{ width: '85vw', maxWidth: 1100, height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: '#161b22', borderBottom: '1px solid rgba(99,102,241,0.2)', flexShrink: 0,
        }}>
          <span style={{ color: '#818cf8' }}>⬡</span>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{name}</span>
          <span style={{ color: '#475569', fontSize: 11, marginLeft: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{path}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 13 }}>로딩 중...</div>}>
            <FbxViewer url={fbxUrl} filename={name} height="100%" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ── Scene 인라인 뷰어 모달 ─────────────────────────────────────────────────────
function SceneModal({ path, name, onClose }: { path: string; name: string; onClose: () => void }) {
  const sceneUrl = `/api/assets/prefab?path=${encodeURIComponent(path)}&max=200`;
  const isPrefab = name.endsWith('.prefab');
  const apiUrl = isPrefab
    ? `/api/assets/prefab?path=${encodeURIComponent(path)}&max=200`
    : `/api/assets/scene?path=${encodeURIComponent(path)}&max=300`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{ width: '90vw', maxWidth: 1300, height: '88vh', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: '#161b22', borderBottom: `1px solid ${isPrefab ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)'}`, flexShrink: 0,
        }}>
          <span style={{ color: isPrefab ? '#34d399' : '#a78bfa', fontSize: 14 }}>
            {isPrefab ? '⬡' : '◇'}
          </span>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{name}</span>
          <span style={{ color: '#475569', fontSize: 11, marginLeft: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{path}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 13 }}>로딩 중...</div>}>
            <SceneViewer scenePath={apiUrl} height={window.innerHeight * 0.88 - 44} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ── 에셋 카드 ─────────────────────────────────────────────────────────────────
function AssetCard({ file, onOpen }: { file: AssetFile; onOpen: (f: AssetFile) => void }) {
  const meta = TYPE_META[file.type] ?? TYPE_META.other;

  return (
    <div
      onClick={() => onOpen(file)}
      style={{
        background: '#161b22',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#1c2333';
        e.currentTarget.style.borderColor = meta.color + '55';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#161b22';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 타입 배지 + 아이콘 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: meta.bg, color: meta.color,
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
          letterSpacing: 0.3,
        }}>
          <span style={{ color: meta.color }}>{meta.icon}</span>
          {meta.label}
        </span>
        {file.size && (
          <span style={{ color: '#475569', fontSize: 10 }}>{formatSize(file.size)}</span>
        )}
      </div>

      {/* 파일명 */}
      <div style={{
        color: '#e2e8f0', fontSize: 12, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={file.name}>
        {file.name}
      </div>

      {/* 경로 */}
      <div style={{
        color: '#475569', fontSize: 10, fontFamily: 'monospace',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }} title={file.path}>
        {file.path}
      </div>
    </div>
  );
}

// ── 에셋 목록 (디렉토리 브라우징) ─────────────────────────────────────────────
function AssetList({
  dirPath,
  typeFilter,
  onOpen,
}: {
  dirPath: string;
  typeFilter: AssetType | 'all';
  onOpen: (f: AssetFile) => void;
}) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [subdirs, setSubdirs] = useState<Array<{ name: string; path: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dirPath) return;
    setLoading(true); setError('');
    fetchDir(dirPath)
      .then(({ dirs, files: rawFiles }) => {
        setSubdirs(dirs.map(d => ({ name: d.name, path: d.path })));
        const assetFiles: AssetFile[] = rawFiles
          .map(f => {
            const ext = f.name.split('.').pop() ?? '';
            return { name: f.name, path: f.path, type: extToType(ext), size: f.size, modified: f.modified };
          })
          .filter(f => {
            if (typeFilter === 'all') return true;
            if (typeFilter === 'png') return f.type === 'png' || f.type === 'jpg' || f.type === 'tga';
            return f.type === typeFilter;
          });
        setFiles(assetFiles);
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [dirPath, typeFilter]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: '#475569', fontSize: 13 }}>
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      로딩 중...
    </div>
  );
  if (error) return <div style={{ color: '#f87171', padding: 16, fontSize: 12 }}>{error}</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
      {/* 파일 카드 그리드 */}
      {files.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, paddingTop: 16 }}>
          {files.map(f => <AssetCard key={f.path} file={f} onOpen={onOpen} />)}
        </div>
      ) : (
        <div style={{ color: '#475569', fontSize: 12, paddingTop: 24, textAlign: 'center' }}>
          {typeFilter === 'all' ? '파일이 없습니다' : `${ALL_FILTERS.find(f => f.key === typeFilter)?.label} 파일이 없습니다`}
        </div>
      )}
    </div>
  );
}

// ── 검색 결과 ─────────────────────────────────────────────────────────────────
function SearchResults({
  basePath,
  query,
  typeFilter,
  onOpen,
}: {
  basePath: string;
  query: string;
  typeFilter: AssetType | 'all';
  onOpen: (f: AssetFile) => void;
}) {
  const [results, setResults] = useState<AssetFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true); setResults([]); setProgress(0);
    searchFiles(basePath, query, typeFilter, ctrl.signal, setProgress)
      .then(r => { if (!ctrl.signal.aborted) { setResults(r); setLoading(false); } })
      .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [basePath, query, typeFilter]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 8, fontSize: 12, color: '#64748b' }}>
        {loading ? (
          <>
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            검색 중... ({progress}개 발견)
          </>
        ) : (
          <>{results.length}개 파일 발견</>
        )}
      </div>
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {results.map(f => <AssetCard key={f.path} file={f} onOpen={onOpen} />)}
        </div>
      )}
      {!loading && results.length === 0 && (
        <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', paddingTop: 32 }}>검색 결과가 없습니다</div>
      )}
    </div>
  );
}

// ── 레벨 맵 타입 ────────────────────────────────────────────────────────────────
interface MapEntry {
  folder: string;
  sceneName: string;
  meshCount: number;
  thumbUrl: string;
}

interface MapSceneInfo {
  sceneName: string;
  meshCount: number;
  exportTime?: string;
  spawnPoints?: Array<{ name: string; position: { x: number; y: number; z: number } }>;
  neutralPointCaptures?: Array<{ name: string; uniqueID: number; radius: number; position: { x: number; y: number; z: number } }>;
  safetyZones?: Array<{ name: string; worldCenter: { x: number; y: number; z: number }; size: { x: number; y: number; z: number } }>;
}

// ── 레벨 브라우저 ───────────────────────────────────────────────────────────────
function LevelBrowser({ onOpenLevel }: { onOpenLevel: (map: MapEntry) => void }) {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [infos, setInfos] = useState<Record<string, MapSceneInfo>>({});

  useEffect(() => {
    setLoading(true);
    fetch('/api/assets/map-list')
      .then(r => r.json())
      .then(async (d: { maps: MapEntry[] }) => {
        setMaps(d.maps || []);
        setLoading(false);
        const infoMap: Record<string, MapSceneInfo> = {};
        for (const m of (d.maps || [])) {
          try {
            const res = await fetch(`/api/assets/map-scene-info?map=${encodeURIComponent(m.folder)}`);
            if (res.ok) infoMap[m.folder] = await res.json();
          } catch (e) { /* non-critical */ }
        }
        setInfos(infoMap);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 8, color: '#475569', fontSize: 13 }}>
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      레벨 목록 로딩 중...
    </div>
  );

  if (maps.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#475569' }}>
      <div style={{ fontSize: 40 }}>🗺️</div>
      <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: 14 }}>Baked 레벨이 없습니다</div>
      <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', maxWidth: 400 }}>
        .unity 씬 파일을 열어 Bake를 실행하면 레벨 데이터가 생성됩니다.<br/>
        Assets에서 .unity 파일을 클릭하여 씬을 로드하세요.
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {maps.map(m => {
          const info = infos[m.folder];
          const spCount = info?.spawnPoints?.length || 0;
          const cpCount = info?.neutralPointCaptures?.length || 0;
          const szCount = info?.safetyZones?.length || 0;
          const hasLevelData = spCount > 0 || cpCount > 0 || szCount > 0;

          return (
            <div
              key={m.folder}
              onClick={() => onOpenLevel(m)}
              style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1c2333';
                e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#161b22';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18 }}>🗺️</span>
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{m.sceneName}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    {m.meshCount.toLocaleString()} meshes
                    {info?.exportTime && ` · ${info.exportTime.split('T')[0]}`}
                  </div>
                </div>
              </div>

              {/* 레벨 데이터 배지 */}
              {hasLevelData && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {spCount > 0 && (
                    <span style={{ padding: '2px 8px', background: 'rgba(34,211,238,0.12)', color: '#22d3ee', borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
                      🚩 Spawn ×{spCount}
                    </span>
                  )}
                  {cpCount > 0 && (
                    <span style={{ padding: '2px 8px', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
                      ⚔ Capture ×{cpCount}
                    </span>
                  )}
                  {szCount > 0 && (
                    <span style={{ padding: '2px 8px', background: 'rgba(163,230,53,0.12)', color: '#a3e635', borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
                      🛡 Safety ×{szCount}
                    </span>
                  )}
                </div>
              )}

              {/* 레벨 상세 정보 */}
              {info?.neutralPointCaptures && info.neutralPointCaptures.length > 0 && (
                <div style={{ fontSize: 10, color: '#64748b', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {info.neutralPointCaptures.map((cp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: '#94a3b8' }}>{cp.name}</span>
                      <span>R={cp.radius}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
                color: '#3b82f6', fontSize: 11, fontWeight: 600,
              }}>
                3D 뷰어로 열기 →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function UnityPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'assets' | 'levels'>('assets');
  const [selectedDir, setSelectedDir] = useState('GameContents');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rootDirs, setRootDirs] = useState<Array<{ name: string; path: string }>>([]);
  const [rootLoaded, setRootLoaded] = useState(false);

  // 열린 뷰어
  const [openFbx, setOpenFbx] = useState<AssetFile | null>(null);
  const [openScene, setOpenScene] = useState<AssetFile | null>(null);
  const [openCode, setOpenCode] = useState<AssetFile | null>(null);
  

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // 루트 디렉토리 로드
  useEffect(() => {
    fetchDir('GameContents')
      .then(({ dirs }) => {
        setRootDirs(dirs.map(d => ({ name: d.name, path: d.path })));
        setRootLoaded(true);
      })
      .catch(() => setRootLoaded(true));
  }, []);

  // 파일 열기
  const handleOpen = useCallback((f: AssetFile) => {
    if (f.type === 'fbx') { setOpenFbx(f); return; }
    if (f.type === 'prefab' || f.type === 'unity') { setOpenScene(f); return; }
    if (f.type === 'cs' || f.type === 'mat' || f.type === 'asset' || f.type === 'other') { setOpenCode(f); return; }
    // 텍스처: 새 탭에서 이미지 열기
    if (f.type === 'png' || f.type === 'jpg' || f.type === 'tga') {
      window.open(`/api/assets/file?path=${encodeURIComponent(f.path)}`, '_blank');
    }
  }, []);

  const isSearching = debouncedQuery.trim().length > 0;

  // 빵 부스러기 경로
  const breadcrumbs = selectedDir.split('/').filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── 상단 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
        background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7, color: '#94a3b8', fontSize: 12, cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          뒤로
        </button>

        {/* 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #34d399, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>Unity Asset Browser</span>
        </div>

        {/* 모드 스위처 */}
        <div style={{ display: 'flex', gap: 2, background: '#0d1117', borderRadius: 6, padding: 2 }}>
          <button
            onClick={() => setMode('assets')}
            style={{
              padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: mode === 'assets' ? '#1e293b' : 'transparent',
              color: mode === 'assets' ? '#e2e8f0' : '#64748b',
            }}
          >
            📁 Assets
          </button>
          <button
            onClick={() => setMode('levels')}
            style={{
              padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: mode === 'levels' ? '#1e293b' : 'transparent',
              color: mode === 'levels' ? '#e2e8f0' : '#64748b',
            }}
          >
            🗺️ Levels
          </button>
        </div>

        {mode === 'assets' && (
          <>
            {/* 검색 */}
            <div style={{ flex: 1, maxWidth: 400, position: 'relative', marginLeft: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="파일명 검색..."
                style={{
                  width: '100%', paddingLeft: 34, paddingRight: searchQuery ? 32 : 12,
                  paddingTop: 7, paddingBottom: 7,
                  background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, fontSize: 14,
                }}>×</button>
              )}
            </div>

            {/* 타입 필터 */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflowX: 'auto' }}>
              {ALL_FILTERS.map(f => {
                const active = typeFilter === f.key;
                const meta = f.key !== 'all' ? (TYPE_META[f.key as AssetType] ?? TYPE_META.other) : null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key as AssetType | 'all')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      background: active ? (meta?.bg ?? 'rgba(99,102,241,0.15)') : 'transparent',
                      color: active ? (meta?.color ?? '#818cf8') : '#64748b',
                      border: active ? `1px solid ${meta?.color ?? '#818cf8'}44` : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 메인 레이아웃 ── */}
      {mode === 'levels' ? (
        <LevelBrowser onOpenLevel={(m) => navigate(`/level-viewer?map=${encodeURIComponent(m.folder)}`)} />
      ) : (
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* 사이드바: 파일 트리 */}
        <div style={{
          width: 240, flexShrink: 0,
          background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto', fontSize: 12,
        }}>
          {/* 사이드바 헤더 */}
          <div style={{ padding: '8px 8px 4px', color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
            PROJECT
          </div>

          {/* GameContents 루트 */}
          <div
            onClick={() => setSelectedDir('GameContents')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', cursor: 'pointer',
              background: selectedDir === 'GameContents' ? 'rgba(99,102,241,0.15)' : 'transparent',
              borderLeft: selectedDir === 'GameContents' ? '2px solid #818cf8' : '2px solid transparent',
              color: selectedDir === 'GameContents' ? '#e2e8f0' : '#94a3b8',
            }}
          >
            <FolderIcon open />
            <span>GameContents</span>
          </div>

          {/* 서브 디렉토리 트리 */}
          {rootLoaded && rootDirs.map(d => (
            <TreeNode key={d.path} name={d.name} path={d.path} depth={1} onSelectDir={setSelectedDir} selectedDir={selectedDir} />
          ))}
        </div>

        {/* 오른쪽: 빵 부스러기 + 파일 목록 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* 빵 부스러기 / 경로 표시 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
          }}>
            {isSearching ? (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                🔍 검색: <span style={{ color: '#818cf8', fontWeight: 600 }}>{debouncedQuery}</span>
                {typeFilter !== 'all' && <span style={{ color: '#64748b' }}> · {ALL_FILTERS.find(f => f.key === typeFilter)?.label}</span>}
              </span>
            ) : (
              breadcrumbs.map((crumb, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i > 0 && <span style={{ color: '#334155', fontSize: 10 }}>›</span>}
                  <button
                    onClick={() => setSelectedDir(breadcrumbs.slice(0, i + 1).join('/'))}
                    style={{
                      background: 'none', border: 'none', color: i === breadcrumbs.length - 1 ? '#e2e8f0' : '#64748b',
                      fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                    }}
                  >
                    {crumb}
                  </button>
                </span>
              ))
            )}
          </div>

          {/* 파일 목록 또는 검색 결과 */}
          {isSearching ? (
            <SearchResults
              basePath={selectedDir}
              query={debouncedQuery}
              typeFilter={typeFilter}
              onOpen={handleOpen}
            />
          ) : (
            <AssetList
              dirPath={selectedDir}
              typeFilter={typeFilter}
              onOpen={handleOpen}
            />
          )}
        </div>
      </div>
      )}

      {/* ── 모달: FBX 뷰어 ── */}
      {openFbx && (
        <FbxModal path={openFbx.path} name={openFbx.name} onClose={() => setOpenFbx(null)} />
      )}

      {/* ── 모달: Scene / Prefab 뷰어 ── */}
      {openScene && (
        <SceneModal path={openScene.path} name={openScene.name} onClose={() => setOpenScene(null)} />
      )}

      {/* ── 모달: 코드 뷰어 ── */}
      {openCode && (
        <CodeViewer path={openCode.path} onClose={() => setOpenCode(null)} />
      )}

      
    </div>
  );
}
