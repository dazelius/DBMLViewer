import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Toolbar from '../components/Layout/Toolbar.tsx';
import { useSchemaStore } from '../store/useSchemaStore.ts';
import { useCanvasStore } from '../store/useCanvasStore.ts';
import { useDebouncedParse } from '../hooks/useDebouncedParse.ts';
import { useRagTraceStore } from '../store/useRagTraceStore.ts';
import type { RagTrace } from '../store/useRagTraceStore.ts';
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import {
  TOOL_META,
  DATA_SOURCE_META,
  DOMAIN_KEYWORDS,
} from '../core/ai/chatEngine.ts';

// ── 타입 ──

type NodeType = 'guide_db' | 'guide_code' | 'table' | 'tool' | 'source' | 'domain' | 'system_prompt';

interface GNode {
  id: string; name: string; label: string; type: NodeType;
  sizeKB?: number; tokenEst?: number; group?: string; val: number;
  connections?: number;
  x?: number; y?: number; z?: number;
}
interface GLink { source: string; target: string; type: string }

// ── 색상 ──

const C: Record<NodeType, string> = {
  system_prompt: '#ef4444', domain: '#c084fc', tool: '#f472b6',
  source: '#22d3ee', guide_db: '#818cf8', guide_code: '#4ade80', table: '#f59e0b',
};
const GLOW: Record<NodeType, string> = {
  system_prompt: '0 0 24px #ef4444, 0 0 60px #ef444466',
  domain: '0 0 16px #c084fc, 0 0 40px #c084fc44',
  tool: '0 0 12px #f472b6, 0 0 30px #f472b644',
  source: '0 0 12px #22d3ee, 0 0 30px #22d3ee44',
  guide_db: '0 0 10px #818cf8, 0 0 24px #818cf844',
  guide_code: '0 0 10px #4ade80, 0 0 24px #4ade8044',
  table: '0 0 6px #f59e0b, 0 0 16px #f59e0b33',
};
const TYPE_LABELS: Record<NodeType, string> = {
  system_prompt: '시스템 프롬프트', domain: '도메인', tool: '도구 (Tool)',
  source: '데이터소스', guide_db: 'DB 가이드', guide_code: '코드 가이드', table: '테이블',
};

const DIM_OPACITY = 0.08;
const ACTIVE_GLOW = '#ffffff';

// ── 트레이스에서 활성 노드 ID 추출 ──

function traceToNodeIds(trace: RagTrace, allNodes: GNode[]): Set<string> {
  const ids = new Set<string>();
  ids.add('sys:prompt');

  for (const step of trace.steps) {
    const toolId = `tool:${step.toolName}`;
    ids.add(toolId);

    const toolMeta = TOOL_META.find(t => t.name === step.toolName);
    if (toolMeta) {
      for (const ds of toolMeta.dataSources) ids.add(`src:${ds}`);
    }

    for (const tName of step.tables ?? []) {
      const exact = allNodes.find(n => n.type === 'table' && n.name.toLowerCase() === tName.toLowerCase());
      if (exact) {
        ids.add(exact.id);
        for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
          if (keywords.some(k => tName.toLowerCase().includes(k))) {
            ids.add(`domain:${domain}`);
            break;
          }
        }
      }
    }

    for (const gName of step.guides ?? []) {
      const guideNode = allNodes.find(n => (n.type === 'guide_db' || n.type === 'guide_code') && n.name === gName);
      if (guideNode) ids.add(guideNode.id);
      ids.add('src:guides');
    }
  }
  return ids;
}

// ── 메인 컴포넌트 ──

export default function GraphPage() {
  useDebouncedParse();
  const schema = useSchemaStore(s => s.schema);
  const tableData = useCanvasStore(s => s.tableData);
  const traces = useRagTraceStore(s => s.traces);
  const activeTraceId = useRagTraceStore(s => s.activeTraceId);
  const setActiveTrace = useRagTraceStore(s => s.setActiveTrace);

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const nodeObjectsRef = useRef<Map<string, THREE.Group>>(new Map());
  const [graphData, setGraphData] = useState<{ nodes: GNode[]; links: GLink[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<GNode | null>(null);
  const [stats, setStats] = useState({ nodes: 0, links: 0, guides: 0, tables: 0, tools: 0, domains: 0, sources: 0 });
  const [filter, setFilter] = useState<Set<NodeType>>(new Set(Object.keys(C) as NodeType[]));
  const [traceOpen, setTraceOpen] = useState(true);

  const activeTrace = useMemo(() => traces.find(t => t.id === activeTraceId) ?? null, [traces, activeTraceId]);
  const activeNodeIds = useMemo(() => {
    if (!activeTrace || !graphData) return null;
    return traceToNodeIds(activeTrace, graphData.nodes);
  }, [activeTrace, graphData]);

  // ── 그래프 구축 ──

  const buildGraph = useCallback(async () => {
    const nodes: GNode[] = [];
    const links: GLink[] = [];
    const ids = new Set<string>();
    const add = (n: GNode) => { if (!ids.has(n.id)) { ids.add(n.id); nodes.push(n); } };

    add({ id: 'sys:prompt', name: 'System Prompt', label: '🧠 시스템 프롬프트', type: 'system_prompt', val: 10 });

    for (const src of DATA_SOURCE_META) {
      add({ id: `src:${src.name}`, name: src.name, label: `${src.emoji} ${src.label}`, type: 'source', val: 4 });
    }

    for (const tool of TOOL_META) {
      add({ id: `tool:${tool.name}`, name: tool.name, label: `${tool.emoji} ${tool.label}`, type: 'tool', val: 3 });
      links.push({ source: 'sys:prompt', target: `tool:${tool.name}`, type: 'prompt_tool' });
      for (const ds of tool.dataSources) {
        const srcId = `src:${ds}`;
        if (ids.has(srcId)) links.push({ source: `tool:${tool.name}`, target: srcId, type: 'tool_source' });
      }
    }

    const guideContents: Record<string, string> = {};
    try {
      const res = await fetch('/api/guides/list');
      const data = await res.json();
      for (const g of (data.guides ?? []) as Array<{ name: string; sizeKB: number; category: string }>) {
        const type: NodeType = g.category === 'db' ? 'guide_db' : 'guide_code';
        const tokenEst = Math.round(g.sizeKB * 1024 / 3.5);
        add({ id: `guide:${g.name}`, name: g.name, label: g.name, type, sizeKB: g.sizeKB, tokenEst, val: Math.max(2.5, g.sizeKB / 3) });
        links.push({ source: 'src:guides', target: `guide:${g.name}`, type: 'source_guide' });
        links.push({ source: 'tool:read_guide', target: `guide:${g.name}`, type: 'tool_reads' });
      }
      const fetches = (data.guides ?? []).slice(0, 50).map(async (g: any) => {
        try {
          const r = await fetch(`/api/guides/read?name=${encodeURIComponent(g.name)}`);
          const d = await r.json();
          guideContents[g.name] = (d.content ?? '').toLowerCase();
        } catch { /* skip */ }
      });
      await Promise.all(fetches);
    } catch { /* */ }

    const tableNames: string[] = [];
    if (schema && schema.tables.length > 0) {
      for (const t of schema.tables) {
        const rows = tableData.get(t.name.toLowerCase())?.rows?.length ?? 0;
        add({ id: `table:${t.name}`, name: t.name, label: t.name, type: 'table', group: t.groupName ?? undefined, val: Math.max(1.2, Math.log10(rows + 1) * 1.5) });
        tableNames.push(t.name);
      }
      for (const r of schema.refs) {
        const from = schema.tables.find(t => t.id === r.fromTable)?.name;
        const to = schema.tables.find(t => t.id === r.toTable)?.name;
        if (from && to) links.push({ source: `table:${from}`, target: `table:${to}`, type: 'fk' });
      }
    }

    const domainAssigned = new Set<string>();
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matched = tableNames.filter(tn => keywords.some(k => tn.toLowerCase().includes(k)));
      if (matched.length > 0) {
        const domId = `domain:${domain}`;
        add({ id: domId, name: domain, label: `🏷 ${domain}`, type: 'domain', val: Math.max(3.5, matched.length / 2) });
        for (const tn of matched) { links.push({ source: domId, target: `table:${tn}`, type: 'domain_table' }); domainAssigned.add(tn); }
        if (ids.has(`guide:_DB_${domain}`)) links.push({ source: domId, target: `guide:_DB_${domain}`, type: 'domain_guide' });
        links.push({ source: 'sys:prompt', target: domId, type: 'prompt_domain' });
      }
    }
    const unassigned = tableNames.filter(tn => !domainAssigned.has(tn));
    if (unassigned.length > 0) {
      add({ id: 'domain:Misc', name: 'Misc', label: '🏷 기타', type: 'domain', val: Math.max(3, unassigned.length / 4) });
      for (const tn of unassigned.slice(0, 40)) links.push({ source: 'domain:Misc', target: `table:${tn}`, type: 'domain_table' });
      links.push({ source: 'sys:prompt', target: 'domain:Misc', type: 'prompt_domain' });
    }

    links.push({ source: 'sys:prompt', target: 'src:excel', type: 'prompt_injects' });

    for (const [gName, content] of Object.entries(guideContents)) {
      for (const tName of tableNames) {
        if (content.includes(tName.toLowerCase())) links.push({ source: `guide:${gName}`, target: `table:${tName}`, type: 'guide_table' });
      }
      for (const tool of TOOL_META) {
        if (content.includes(tool.name.toLowerCase())) links.push({ source: `guide:${gName}`, target: `tool:${tool.name}`, type: 'guide_tool' });
      }
    }

    const connCount = new Map<string, number>();
    for (const l of links) { connCount.set(l.source, (connCount.get(l.source) ?? 0) + 1); connCount.set(l.target, (connCount.get(l.target) ?? 0) + 1); }
    for (const n of nodes) n.connections = connCount.get(n.id) ?? 0;

    setStats({
      nodes: nodes.length, links: links.length,
      guides: nodes.filter(n => n.type === 'guide_db' || n.type === 'guide_code').length,
      tables: nodes.filter(n => n.type === 'table').length,
      tools: nodes.filter(n => n.type === 'tool').length,
      domains: nodes.filter(n => n.type === 'domain').length,
      sources: nodes.filter(n => n.type === 'source').length,
    });
    return { nodes, links };
  }, [schema, tableData]);

  useEffect(() => { buildGraph().then(d => { setGraphData(d); setLoading(false); }); }, [buildGraph]);

  // ── 글로우 텍스처 캐시 ──

  const glowTextures = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const getGlowTex = useCallback((color: string) => {
    if (glowTextures.current.has(color)) return glowTextures.current.get(color)!;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.15, color);
    grad.addColorStop(0.4, color + '88');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    glowTextures.current.set(color, tex);
    return tex;
  }, []);

  // ── 3D 렌더링 ──

  useEffect(() => {
    if (!graphData || !containerRef.current) return;
    const el = containerRef.current;

    const fNodes = graphData.nodes.filter(n => filter.has(n.type));
    const fIds = new Set(fNodes.map(n => n.id));
    const fLinks = graphData.links.filter(l => {
      const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return fIds.has(s) && fIds.has(t);
    });

    el.innerHTML = '';
    nodeObjectsRef.current.clear();

    const graph = (ForceGraph3D as any)()(el)
      .graphData({ nodes: JSON.parse(JSON.stringify(fNodes)), links: JSON.parse(JSON.stringify(fLinks)) })
      .backgroundColor('#05060a')
      .showNavInfo(false)
      .nodeThreeObject((n: any) => {
        const type = n.type as NodeType;
        const group = new THREE.Group();
        (group as any).__nodeId = n.id;

        const isCore = type === 'system_prompt';
        const isMid = type === 'domain' || type === 'tool' || type === 'source';
        const isGuide = type === 'guide_db' || type === 'guide_code';

        const dotSize = isCore ? 5 : isMid ? 3 : isGuide ? 2.2 : 1.4;
        const color = new THREE.Color(C[type] ?? '#555');

        const dotMat = new THREE.SpriteMaterial({
          map: getGlowTex(C[type] ?? '#555'),
          color, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const dot = new THREE.Sprite(dotMat);
        dot.scale.set(dotSize, dotSize, 1);
        dot.name = 'dot';
        group.add(dot);

        const label = new SpriteText(n.label || n.name);
        label.color = C[type] ?? '#aaa';
        label.fontFace = "'Segoe UI', 'Apple SD Gothic Neo', system-ui, sans-serif";
        label.textHeight = isCore ? 3.5 : isMid ? 2.2 : isGuide ? 1.6 : 1.1;
        label.fontWeight = isCore || type === 'domain' ? 'bold' : 'normal';
        label.backgroundColor = 'rgba(0,0,0,0)';
        label.borderWidth = 0;
        label.padding = [0, 0] as any;
        label.position.y = dotSize * 0.7 + label.textHeight * 0.6;
        label.name = 'label';
        group.add(label);

        nodeObjectsRef.current.set(n.id, group);
        return group;
      })
      .nodeThreeObjectExtend(false)
      .linkColor((l: any) => {
        const t = l.type as string;
        if (t === 'fk') return 'rgba(245,158,11,0.06)';
        if (t === 'domain_table') return 'rgba(192,132,252,0.06)';
        if (t.startsWith('guide')) return 'rgba(129,140,248,0.06)';
        if (t.startsWith('tool') || t.startsWith('prompt')) return 'rgba(244,114,182,0.08)';
        if (t.startsWith('source')) return 'rgba(34,211,238,0.06)';
        return 'rgba(255,255,255,0.03)';
      })
      .linkWidth(0.15)
      .linkOpacity(0.4)
      .linkDirectionalParticles((l: any) => {
        const t = l.type as string;
        return t.startsWith('prompt') || t === 'tool_source' ? 2 : 1;
      })
      .linkDirectionalParticleWidth(0.4)
      .linkDirectionalParticleSpeed(0.0015)
      .linkDirectionalParticleColor((l: any) => {
        const t = l.type as string;
        if (t === 'fk') return '#f59e0b';
        if (t.includes('domain')) return '#c084fc';
        if (t.startsWith('guide')) return '#818cf8';
        if (t.startsWith('tool') || t.startsWith('prompt')) return '#f472b6';
        return '#22d3ee';
      })
      .onNodeHover((n: any) => setHovered(n as GNode | null))
      .onNodeClick((n: any) => {
        if (!n) return;
        const dist = 80;
        const r = 1 + dist / Math.hypot(n.x ?? 1, n.y ?? 1, n.z ?? 1);
        graph.cameraPosition({ x: (n.x ?? 0) * r, y: (n.y ?? 0) * r, z: (n.z ?? 0) * r }, n as any, 1200);
      })
      .width(el.clientWidth)
      .height(el.clientHeight);

    graph.d3Force('charge')?.strength(-35);
    graph.d3Force('link')?.distance((l: any) => {
      const t = l.type as string;
      if (t === 'fk' || t === 'domain_table') return 25;
      if (t.startsWith('prompt')) return 90;
      if (t === 'tool_source' || t === 'source_guide') return 55;
      return 40;
    });

    graphRef.current = graph;
    const onResize = () => { if (containerRef.current) graph.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); graph._destructor?.(); };
  }, [graphData, filter, getGlowTex]);

  // ── 트레이스 하이라이트 애니메이션 ──

  useEffect(() => {
    const objects = nodeObjectsRef.current;
    if (!objects.size) return;

    const animIds: number[] = [];
    let pulsePhase = 0;

    if (activeNodeIds) {
      // 비활성 노드 어둡게
      objects.forEach((group, id) => {
        const isActive = activeNodeIds.has(id);
        group.traverse(child => {
          if (child instanceof THREE.Sprite && child.name === 'dot') {
            (child.material as THREE.SpriteMaterial).opacity = isActive ? 1 : DIM_OPACITY;
          }
          if (child instanceof SpriteText) {
            (child as any).color = isActive ? ACTIVE_GLOW : 'rgba(255,255,255,0.05)';
          }
        });
      });

      // 활성 노드 펄스 애니메이션
      const animate = () => {
        pulsePhase += 0.04;
        const pulse = 0.7 + Math.sin(pulsePhase) * 0.3;
        objects.forEach((group, id) => {
          if (!activeNodeIds.has(id)) return;
          group.traverse(child => {
            if (child instanceof THREE.Sprite && child.name === 'dot') {
              const base = child.scale.x;
              const target = base > 4 ? 5 : base > 2.5 ? 3 : base > 1.8 ? 2.2 : 1.4;
              child.scale.setScalar(target * (0.9 + pulse * 0.2));
            }
          });
        });
        animIds.push(requestAnimationFrame(animate));
      };
      animIds.push(requestAnimationFrame(animate));

      // 링크 하이라이트
      if (graphRef.current) {
        graphRef.current
          .linkColor((l: any) => {
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            if (activeNodeIds.has(s) && activeNodeIds.has(t)) {
              const lt = l.type as string;
              if (lt.startsWith('prompt')) return 'rgba(239,68,68,0.5)';
              if (lt.startsWith('tool')) return 'rgba(244,114,182,0.5)';
              if (lt.startsWith('source') || lt === 'tool_source') return 'rgba(34,211,238,0.4)';
              if (lt.startsWith('guide')) return 'rgba(129,140,248,0.4)';
              if (lt === 'domain_table') return 'rgba(192,132,252,0.3)';
              return 'rgba(255,255,255,0.3)';
            }
            return 'rgba(255,255,255,0.01)';
          })
          .linkWidth((l: any) => {
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return (activeNodeIds.has(s) && activeNodeIds.has(t)) ? 0.6 : 0.05;
          })
          .linkDirectionalParticles((l: any) => {
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return (activeNodeIds.has(s) && activeNodeIds.has(t)) ? 4 : 0;
          })
          .linkDirectionalParticleWidth((l: any) => {
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return (activeNodeIds.has(s) && activeNodeIds.has(t)) ? 1.2 : 0.3;
          })
          .linkDirectionalParticleSpeed(0.006);
      }
    } else {
      // 트레이스 해제 → 원래 상태 복원
      objects.forEach((group, _id) => {
        const nodeId = (group as any).__nodeId as string;
        const node = graphData?.nodes.find(n => n.id === nodeId);
        const type = node?.type ?? 'table';
        group.traverse(child => {
          if (child instanceof THREE.Sprite && child.name === 'dot') {
            (child.material as THREE.SpriteMaterial).opacity = 1;
          }
          if (child instanceof SpriteText) {
            (child as any).color = C[type] ?? '#aaa';
          }
        });
      });

      if (graphRef.current) {
        graphRef.current
          .linkColor((l: any) => {
            const t = l.type as string;
            if (t === 'fk') return 'rgba(245,158,11,0.06)';
            if (t === 'domain_table') return 'rgba(192,132,252,0.06)';
            if (t.startsWith('guide')) return 'rgba(129,140,248,0.06)';
            if (t.startsWith('tool') || t.startsWith('prompt')) return 'rgba(244,114,182,0.08)';
            if (t.startsWith('source')) return 'rgba(34,211,238,0.06)';
            return 'rgba(255,255,255,0.03)';
          })
          .linkWidth(0.15)
          .linkDirectionalParticles((l: any) => {
            const t = l.type as string;
            return t.startsWith('prompt') || t === 'tool_source' ? 2 : 1;
          })
          .linkDirectionalParticleWidth(0.4)
          .linkDirectionalParticleSpeed(0.0015);
      }
    }

    return () => { animIds.forEach(id => cancelAnimationFrame(id)); };
  }, [activeNodeIds, graphData]);

  const toggle = (t: NodeType) => setFilter(p => { const n = new Set(p); if (n.has(t)) n.delete(t); else n.add(t); return n; });

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#05060a', color: '#e2e8f0' }}>
      <Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(5,6,10,0.95)' }}>
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(129,140,248,0.2)' }} />
                <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'rgba(129,140,248,0.4)' }} />
                <div className="absolute inset-4 rounded-full" style={{ background: '#818cf8' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#a5b4fc' }}>RAG Graph 구성 중...</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>챗엔진 도구·데이터소스 동기화</p>
            </div>
          </div>
        )}

        {/* 좌상단: 제목 */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
          <h2 className="text-xl font-bold tracking-tight" style={{
            color: '#e2e8f0',
            textShadow: '0 0 30px rgba(129,140,248,0.4), 0 0 60px rgba(129,140,248,0.15), 0 2px 8px rgba(0,0,0,0.9)',
          }}>RAG Graph</h2>
          <p className="text-[10px] font-mono mt-1 leading-relaxed" style={{ color: '#64748b', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {stats.tools} tools · {stats.sources} sources · {stats.domains} domains · {stats.guides} guides · {stats.tables} tables
            <br />{stats.nodes} nodes · {stats.links} edges
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] mt-1" style={{
            background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.15)',
          }}>
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            chatEngine 동기화
          </span>
        </div>

        {/* 우상단: 필터 */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-0.5 p-2 rounded-xl" style={{
          background: 'rgba(5,6,10,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <p className="text-[8px] uppercase tracking-widest mb-1 px-1" style={{ color: '#475569' }}>Node Types</p>
          {(Object.keys(C) as NodeType[]).map(type => {
            const count = graphData?.nodes.filter(n => n.type === type).length ?? 0;
            if (count === 0) return null;
            const active = filter.has(type);
            return (
              <button key={type} onClick={() => toggle(type)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-300 text-left"
                style={{ color: active ? C[type] : 'rgba(255,255,255,0.15)', background: active ? `${C[type]}08` : 'transparent' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all" style={{
                  background: active ? C[type] : 'rgba(255,255,255,0.08)', boxShadow: active ? GLOW[type] : 'none',
                }} />
                <span className="flex-1">{TYPE_LABELS[type]}</span>
                <span className="font-mono text-[9px]" style={{ opacity: 0.4 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* 좌하단: 트레이스 패널 */}
        <div className="absolute bottom-4 left-4 z-10 rounded-xl overflow-hidden" style={{
          width: traceOpen ? 320 : 'auto',
          background: 'rgba(5,6,10,0.85)', backdropFilter: 'blur(16px)',
          border: `1px solid ${activeTrace ? 'rgba(244,114,182,0.2)' : 'rgba(255,255,255,0.04)'}`,
          boxShadow: activeTrace ? '0 0 40px rgba(244,114,182,0.06)' : 'none',
          transition: 'all 0.3s',
        }}>
          <button onClick={() => setTraceOpen(!traceOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left"
            style={{ borderBottom: traceOpen ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span className="text-[10px]">⚡</span>
            <span className="text-[11px] font-medium flex-1" style={{ color: '#e2e8f0' }}>
              Query Trace {traces.length > 0 && <span className="font-mono" style={{ color: '#64748b' }}>({traces.length})</span>}
            </span>
            <svg className={`w-3 h-3 transition-transform ${traceOpen ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#475569' }}>
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {traceOpen && (
            <div className="max-h-64 overflow-y-auto">
              {traces.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-[11px]" style={{ color: '#475569' }}>아직 트레이스가 없습니다</p>
                  <p className="text-[9px] mt-1" style={{ color: '#334155' }}>ChatBot에서 질의하면 여기에 경로가 표시됩니다</p>
                </div>
              ) : (
                <div className="py-1">
                  {/* 해제 버튼 */}
                  {activeTrace && (
                    <button onClick={() => setActiveTrace(null)}
                      className="w-full px-3 py-1.5 text-left text-[10px] transition-colors"
                      style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      ✕ 하이라이트 해제
                    </button>
                  )}
                  {traces.map(trace => {
                    const isActive = trace.id === activeTraceId;
                    const toolNames = [...new Set(trace.steps.map(s => s.toolName))];
                    const toolEmojis = toolNames.map(tn => TOOL_META.find(t => t.name === tn)?.emoji ?? '🔧').join('');
                    return (
                      <button key={trace.id}
                        onClick={() => setActiveTrace(isActive ? null : trace.id)}
                        className="w-full px-3 py-2 text-left transition-all"
                        style={{
                          background: isActive ? 'rgba(244,114,182,0.08)' : 'transparent',
                          borderLeft: isActive ? '2px solid #f472b6' : '2px solid transparent',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono flex-shrink-0" style={{ color: '#475569' }}>{fmtTime(trace.timestamp)}</span>
                          <span className="text-[11px] font-medium truncate flex-1" style={{ color: isActive ? '#f472b6' : '#cbd5e1' }}>
                            {trace.query.length > 40 ? trace.query.slice(0, 40) + '…' : trace.query}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px]">{toolEmojis}</span>
                          <span className="text-[9px] font-mono" style={{ color: '#64748b' }}>
                            {trace.steps.length} calls
                          </span>
                          {(trace.totalInputTokens + trace.totalOutputTokens) > 0 && (
                            <span className="text-[9px] font-mono" style={{ color: '#475569' }}>
                              {((trace.totalInputTokens + trace.totalOutputTokens) / 1000).toFixed(1)}k tok
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {trace.steps.map((step, i) => {
                              const meta = TOOL_META.find(t => t.name === step.toolName);
                              return (
                                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px]" style={{
                                  background: step.error ? 'rgba(239,68,68,0.12)' : 'rgba(244,114,182,0.1)',
                                  color: step.error ? '#ef4444' : '#f472b6',
                                }}>
                                  {meta?.emoji ?? '🔧'}
                                  {meta?.label ?? step.toolName}
                                  {step.tables?.length ? ` → ${step.tables.slice(0, 2).join(', ')}` : ''}
                                  {step.guides?.length ? ` → ${step.guides[0]}` : ''}
                                  {step.duration ? ` (${(step.duration / 1000).toFixed(1)}s)` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우하단: 호버 */}
        {hovered && (
          <div className="absolute bottom-4 right-4 z-10 rounded-xl px-4 py-3 max-w-xs" style={{
            background: 'rgba(5,6,10,0.88)', border: `1px solid ${C[hovered.type]}25`,
            backdropFilter: 'blur(16px)', boxShadow: `0 0 40px ${C[hovered.type]}08`,
          }}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: C[hovered.type], boxShadow: GLOW[hovered.type] }} />
              <span className="text-sm font-bold" style={{ color: C[hovered.type] }}>{hovered.label || hovered.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="px-2 py-0.5 rounded-full" style={{ background: `${C[hovered.type]}12`, color: C[hovered.type] }}>{TYPE_LABELS[hovered.type]}</span>
              <span style={{ color: '#64748b' }}>연결 {hovered.connections ?? 0}개</span>
              {activeNodeIds?.has(hovered.id) && <span style={{ color: '#f472b6' }}>⚡ 활성</span>}
            </div>
            {hovered.sizeKB != null && (
              <p className="text-[10px] mt-2" style={{ color: '#94a3b8' }}>📦 {hovered.sizeKB.toFixed(1)} KB · ≈ {((hovered.tokenEst ?? 0) / 1000).toFixed(1)}k tokens</p>
            )}
            {hovered.group && <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>📁 그룹: {hovered.group}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
