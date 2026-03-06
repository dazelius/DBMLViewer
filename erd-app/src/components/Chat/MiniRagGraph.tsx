import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import {
  TOOL_META,
  DATA_SOURCE_META,
  DOMAIN_KEYWORDS,
} from '../../core/ai/chatEngine.ts';
import type { ToolCallResult } from '../../core/ai/chatEngine.ts';
import { useSchemaStore } from '../../store/useSchemaStore.ts';

// ── 타입 ──

type NT = 'guide_db' | 'guide_code' | 'table' | 'tool' | 'source' | 'domain' | 'system_prompt' | 'knowledge' | 'web';
interface N { id: string; name: string; label: string; type: NT; val: number; x?: number; y?: number; z?: number }
interface L { source: string; target: string; type: string }

const C: Record<NT, string> = {
  system_prompt: '#ef4444', domain: '#c084fc', tool: '#f472b6',
  source: '#22d3ee', guide_db: '#818cf8', guide_code: '#4ade80', table: '#f59e0b',
  knowledge: '#a78bfa',
  web: '#60a5fa',
};

// ── tool call → 활성 노드 ──

const KIND_TO_TOOL: Record<string, string> = {
  data_query: 'query_game_data', schema_card: 'show_table_schema',
  git_history: 'query_git_history', revision_diff: 'show_revision_diff',
  image_search: 'find_resource_image', character_profile: 'build_character_profile',
  code_guide: 'read_guide', code_search: 'search_code', code_file: 'read_code_file',
  artifact: 'create_artifact', artifact_patch: 'patch_artifact',
  asset_search: 'search_assets', scene_yaml: 'read_scene_yaml',
  prefab_preview: 'preview_prefab', fbx_animation: 'preview_fbx_animation',
  jira_search: 'search_jira', jira_issue: 'get_jira_issue',
  confluence_search: 'search_confluence', confluence_page: 'get_confluence_page',
  knowledge: 'read_knowledge',
  web_search: 'web_search', web_read: 'read_url',
};

interface TraceResult {
  allIds: Set<string>;
  perCall: Array<{ toolId: string; nodeIds: string[] }>;
}

function extractTrace(calls: ToolCallResult[], allNodes: N[]): TraceResult {
  const allIds = new Set<string>(['sys:prompt']);
  const perCall: TraceResult['perCall'] = [];

  for (const tc of calls) {
    const toolName = KIND_TO_TOOL[tc.kind] ?? tc.kind;
    const toolId = `tool:${toolName}`;
    const stepIds: string[] = [toolId];
    allIds.add(toolId);

    const meta = TOOL_META.find(t => t.name === toolName);
    if (meta) meta.dataSources.forEach(ds => { allIds.add(`src:${ds}`); stepIds.push(`src:${ds}`); });

    const tables: string[] = [];
    if (tc.kind === 'data_query') {
      const m = (tc as any).sql?.toUpperCase()?.match(/FROM\s+[`"]?(\w+)/gi);
      m?.forEach((x: string) => { const t = x.replace(/FROM\s+[`"]?/i, ''); if (t) tables.push(t); });
    } else if (tc.kind === 'schema_card') {
      tables.push((tc as any).tableName);
    } else if (tc.kind === 'character_profile') {
      if ((tc as any).charTableName) tables.push((tc as any).charTableName);
      (tc as any).connections?.forEach((c: any) => tables.push(c.tableName));
    }
    for (const tn of tables) {
      const node = allNodes.find(n => n.type === 'table' && n.name.toLowerCase() === tn.toLowerCase());
      if (node) {
        allIds.add(node.id);
        stepIds.push(node.id);
        for (const [domain, kw] of Object.entries(DOMAIN_KEYWORDS)) {
          if (kw.some(k => tn.toLowerCase().includes(k))) { allIds.add(`domain:${domain}`); stepIds.push(`domain:${domain}`); break; }
        }
      }
    }

    if (tc.kind === 'code_guide') {
      const label = (tc as any).label as string;
      if (label && label !== '가이드 목록') {
        const gName = label.replace(/^(DB |코드 )가이드: /, '');
        const gNode = allNodes.find(n => (n.type === 'guide_db' || n.type === 'guide_code') && n.name === gName);
        if (gNode) { allIds.add(gNode.id); stepIds.push(gNode.id); }
        allIds.add('src:guides'); stepIds.push('src:guides');
      }
    }

    // knowledge tool call → 해당 md 노드 활성화
    if (tc.kind === 'knowledge') {
      const knName = (tc as any).name as string;
      if (knName) {
        const knId = `kn:${knName}`;
        const knNode = allNodes.find(n => n.id === knId);
        if (knNode) { allIds.add(knId); stepIds.push(knId); }
      }
      allIds.add('src:knowledge'); stepIds.push('src:knowledge');
    }

    // web_search / web_read → web 소스 활성화
    if (tc.kind === 'web_search' || tc.kind === 'web_read') {
      allIds.add('src:web'); stepIds.push('src:web');
    }

    perCall.push({ toolId, nodeIds: stepIds });
  }
  return { allIds, perCall };
}

// ── 컴포넌트 ──

interface Props {
  liveToolCalls?: ToolCallResult[];
  isStreaming?: boolean;
  knowledgeNames?: string[];
}

export default function MiniRagGraph({ liveToolCalls, isStreaming, knowledgeNames }: Props) {
  const schema = useSchemaStore(s => s.schema);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const nodesRef = useRef<N[]>([]);
  const nodeObjRef = useRef<Map<string, THREE.Group>>(new Map());
  const builtRef = useRef(false);
  const prevActiveRef = useRef<Set<string> | null>(null);
  const ringObjsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // 그래프 데이터 (한번만 빌드)
  const graphData = useMemo(() => {
    const nodes: N[] = [];
    const links: L[] = [];
    const ids = new Set<string>();
    const add = (n: N) => { if (!ids.has(n.id)) { ids.add(n.id); nodes.push(n); } };

    add({ id: 'sys:prompt', name: 'System Prompt', label: 'System Prompt', type: 'system_prompt', val: 6 });

    for (const src of DATA_SOURCE_META) {
      add({ id: `src:${src.name}`, name: src.name, label: src.label, type: 'source', val: 3 });
    }

    for (const tool of TOOL_META) {
      add({ id: `tool:${tool.name}`, name: tool.name, label: tool.label, type: 'tool', val: 2.5 });
      links.push({ source: 'sys:prompt', target: `tool:${tool.name}`, type: 'prompt_tool' });
      for (const ds of tool.dataSources) {
        if (ids.has(`src:${ds}`)) links.push({ source: `tool:${tool.name}`, target: `src:${ds}`, type: 'tool_source' });
      }
    }

    if (schema) {
      const domainAssigned = new Set<string>();
      const tableNames = schema.tables.map(t => t.name);

      for (const t of schema.tables) {
        add({ id: `table:${t.name}`, name: t.name, label: t.name, type: 'table', val: 1 });
      }
      for (const r of schema.refs) {
        const from = schema.tables.find(t => t.id === r.fromTable)?.name;
        const to = schema.tables.find(t => t.id === r.toTable)?.name;
        if (from && to) links.push({ source: `table:${from}`, target: `table:${to}`, type: 'fk' });
      }

      for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        const matched = tableNames.filter(tn => keywords.some(k => tn.toLowerCase().includes(k)));
        if (matched.length > 0) {
          const domId = `domain:${domain}`;
          add({ id: domId, name: domain, label: domain, type: 'domain', val: 2.5 });
          for (const tn of matched) { links.push({ source: domId, target: `table:${tn}`, type: 'domain_table' }); domainAssigned.add(tn); }
          links.push({ source: 'sys:prompt', target: domId, type: 'prompt_domain' });
        }
      }
      const unassigned = tableNames.filter(tn => !domainAssigned.has(tn));
      if (unassigned.length > 0) {
        add({ id: 'domain:Misc', name: 'Misc', label: '기타', type: 'domain', val: 2 });
        for (const tn of unassigned.slice(0, 20)) links.push({ source: 'domain:Misc', target: `table:${tn}`, type: 'domain_table' });
        links.push({ source: 'sys:prompt', target: 'domain:Misc', type: 'prompt_domain' });
      }

      links.push({ source: 'sys:prompt', target: 'src:excel', type: 'prompt_injects' });
    }

    // ── 널리지 개별 노드 (md 파일 하나당 하나) ──
    if (knowledgeNames && knowledgeNames.length > 0) {
      for (const kn of knowledgeNames) {
        const knId = `kn:${kn}`;
        // .md 확장자 제거한 짧은 라벨
        const shortLabel = kn.replace(/\.md$/i, '');
        add({ id: knId, name: kn, label: shortLabel, type: 'knowledge', val: 1.2 });
        // knowledge 소스 노드에 연결
        if (ids.has('src:knowledge')) {
          links.push({ source: 'src:knowledge', target: knId, type: 'source_knowledge' });
        }
      }
    }

    // ── 웹 검색 소스 노드 ──
    add({ id: 'src:web', name: 'web', label: '🌐 웹', type: 'web', val: 2.5 });
    links.push({ source: 'sys:prompt', target: 'src:web', type: 'prompt_injects' });

    nodesRef.current = nodes;
    return { nodes, links };
  }, [schema, knowledgeNames]);

  // 글로우 텍스처 캐시
  const texCache = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const getTex = useCallback((color: string) => {
    if (texCache.current.has(color)) return texCache.current.get(color)!;
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, color);
    g.addColorStop(0.4, color + '88');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    texCache.current.set(color, tex);
    return tex;
  }, []);

  // 링 텍스처 (포커스 표시용)
  const ringTexRef = useRef<THREE.CanvasTexture | null>(null);
  const getRingTex = useCallback(() => {
    if (ringTexRef.current) return ringTexRef.current;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    // 바깥 글로우 링
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // 내부 글로우
    const g = ctx.createRadialGradient(64, 64, 40, 64, 64, 60);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    ringTexRef.current = tex;
    return tex;
  }, []);

  // graphData 변경 시 기존 3D 그래프에 데이터 업데이트 (knowledgeNames 등 추가 시)
  const prevGraphDataRef = useRef(graphData);
  useEffect(() => {
    if (!graphRef.current || graphData === prevGraphDataRef.current) return;
    prevGraphDataRef.current = graphData;
    graphRef.current.graphData({
      nodes: JSON.parse(JSON.stringify(graphData.nodes)),
      links: JSON.parse(JSON.stringify(graphData.links)),
    });
    nodesRef.current = graphData.nodes;
  }, [graphData]);

  // 3D 렌더
  useEffect(() => {
    if (!containerRef.current || builtRef.current) return;
    builtRef.current = true;
    const el = containerRef.current;

    const graph = (ForceGraph3D as any)()(el)
      .graphData({ nodes: JSON.parse(JSON.stringify(graphData.nodes)), links: JSON.parse(JSON.stringify(graphData.links)) })
      .backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeThreeObject((n: any) => {
        const type = n.type as NT;
        const group = new THREE.Group();
        (group as any).__nodeId = n.id;

        const isCore = type === 'system_prompt';
        const isMid = type === 'domain' || type === 'tool' || type === 'source';
        const isGuide = type === 'guide_db' || type === 'guide_code';
        const dotSize = isCore ? 3 : isMid ? 1.5 : isGuide ? 1.0 : 0.6;

        const dotMat = new THREE.SpriteMaterial({
          map: getTex(C[type] ?? '#555'),
          color: new THREE.Color(C[type] ?? '#555'),
          transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const dot = new THREE.Sprite(dotMat);
        dot.scale.set(dotSize, dotSize, 1);
        dot.name = 'dot';
        group.add(dot);

        // 레이블 — 반투명 배경 + 더 큰 폰트 + 아웃라인 효과
        const lbl = new SpriteText(n.label || n.name);
        lbl.color = '#ffffff';
        lbl.fontFace = "'Segoe UI', 'Apple SD Gothic Neo', system-ui, sans-serif";
        lbl.textHeight = isCore ? 3.5 : isMid ? 2.2 : isGuide ? 1.6 : 1.1;
        lbl.fontWeight = isCore || type === 'domain' ? '900' : '600';
        lbl.backgroundColor = 'rgba(0,0,0,0.55)';
        lbl.borderRadius = 3 as any;
        lbl.borderWidth = 0.5;
        lbl.borderColor = C[type] ?? '#555';
        lbl.padding = [2, 4] as any;
        lbl.position.y = dotSize * 0.6 + lbl.textHeight * 0.7;
        lbl.name = 'label';
        group.add(lbl);

        nodeObjRef.current.set(n.id, group);
        return group;
      })
      .nodeThreeObjectExtend(false)
      .linkColor(() => 'rgba(255,255,255,0.04)')
      .linkWidth(0.1)
      .linkOpacity(0.35)
      .linkDirectionalParticles(0)
      .width(el.clientWidth)
      .height(el.clientHeight);

    graph.d3Force('charge')?.strength(-30);
    graph.d3Force('link')?.distance((l: any) => {
      const t = l.type as string;
      if (t === 'fk' || t === 'domain_table') return 20;
      if (t.startsWith('prompt')) return 70;
      if (t === 'tool_source' || t === 'source_guide') return 45;
      return 35;
    });

    // 초기 카메라 거리
    setTimeout(() => {
      graph.cameraPosition({ x: 0, y: 0, z: 180 });
    }, 500);

    graphRef.current = graph;

    // 링 펄스 애니메이션
    const clock = new THREE.Clock();
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      ringObjsRef.current.forEach((ring) => {
        const pulse = 1.0 + 0.3 * Math.sin(t * 3);
        ring.scale.set(pulse, pulse, 1);
        (ring.material as THREE.SpriteMaterial).opacity = 0.4 + 0.3 * Math.sin(t * 3 + 0.5);
      });
    };
    animate();

    const onResize = () => {
      if (containerRef.current) graph.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [graphData, getTex, getRingTex]);

  // ── 실시간 하이라이트 (카메라 포커스 + 노드/링크 강조) ──

  useEffect(() => {
    const objects = nodeObjRef.current;
    const graph = graphRef.current;
    if (!objects.size || !graph) return;

    const calls = liveToolCalls ?? [];
    const trace = calls.length > 0 ? extractTrace(calls, nodesRef.current) : null;
    const active = trace?.allIds ?? null;

    // 이전과 같은 활성 집합이면 스킵 (불필요한 업데이트 방지)
    const prevActive = prevActiveRef.current;
    const isSame = active && prevActive && active.size === prevActive.size && [...active].every(id => prevActive.has(id));
    if (isSame) return;
    prevActiveRef.current = active ? new Set(active) : null;

    // 기존 링 제거
    ringObjsRef.current.forEach((ring, id) => {
      const group = objects.get(id);
      if (group) group.remove(ring);
    });
    ringObjsRef.current.clear();

    if (active) {
      // 활성 노드 좌표 수집 (카메라 포커스용)
      const activePositions: THREE.Vector3[] = [];

      objects.forEach((group, id) => {
        const isActive = active.has(id);
        const node = nodesRef.current.find(n => n.id === id);
        const type = (node?.type ?? 'table') as NT;
        const color = C[type] ?? '#aaa';

        group.traverse(child => {
          if (child instanceof THREE.Sprite && child.name === 'dot') {
            const mat = child.material as THREE.SpriteMaterial;
            if (isActive) {
              mat.opacity = 1;
              // 활성 노드 1.5배 스케일업
              const origScale = child.scale.x;
              child.scale.set(origScale * 1.5, origScale * 1.5, 1);
            } else {
              mat.opacity = 0.08;
              // 비활성은 원래 크기 유지 (이미 set된 상태)
            }
          }
          if (child instanceof SpriteText && child.name === 'label') {
            if (isActive) {
              (child as any).color = '#ffffff';
              (child as any).fontWeight = '900';
              (child as any).backgroundColor = `${color}99`;
              (child as any).borderColor = color;
              (child as any).borderWidth = 1;
            } else {
              (child as any).color = 'rgba(255,255,255,0.06)';
              (child as any).fontWeight = 'normal';
              (child as any).backgroundColor = 'rgba(0,0,0,0)';
              (child as any).borderWidth = 0;
            }
          }
        });

        if (isActive) {
          // 포커스 링 추가
          const ringMat = new THREE.SpriteMaterial({
            map: getRingTex(),
            color: new THREE.Color(color),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: 0.6,
          });
          const ring = new THREE.Sprite(ringMat) as any;
          const isCore = type === 'system_prompt';
          const isMid = type === 'domain' || type === 'tool' || type === 'source';
          const ringSize = isCore ? 8 : isMid ? 5 : 3.5;
          ring.scale.set(ringSize, ringSize, 1);
          ring.name = 'ring';
          group.add(ring);
          ringObjsRef.current.set(id, ring);

          // 위치 수집
          if (group.position) {
            activePositions.push(new THREE.Vector3(group.position.x, group.position.y, group.position.z));
          }
          // ForceGraph3D의 __data 에서 좌표 가져오기
          const gd = graph.graphData();
          const nodeData = gd.nodes?.find((nd: any) => nd.id === id);
          if (nodeData && (nodeData.x !== undefined)) {
            activePositions.push(new THREE.Vector3(nodeData.x, nodeData.y ?? 0, nodeData.z ?? 0));
          }
        }
      });

      // ── 카메라를 활성 노드 중심으로 포커스 ──
      if (activePositions.length > 0) {
        const centroid = new THREE.Vector3();
        activePositions.forEach(p => centroid.add(p));
        centroid.divideScalar(activePositions.length);

        // 활성 노드들의 바운딩 반경 계산
        let maxDist = 0;
        activePositions.forEach(p => {
          const d = p.distanceTo(centroid);
          if (d > maxDist) maxDist = d;
        });
        const camDist = Math.max(60, maxDist * 2.5 + 40);

        graph.cameraPosition(
          { x: centroid.x, y: centroid.y + camDist * 0.15, z: centroid.z + camDist },
          centroid,
          800, // 800ms 부드러운 전환
        );
      }

      // 링크 하이라이트
      graph
        .linkColor((l: any) => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (active.has(s) && active.has(t)) {
            const lt = l.type as string;
            if (lt.startsWith('prompt')) return 'rgba(239,68,68,0.6)';
            if (lt.startsWith('tool')) return 'rgba(244,114,182,0.6)';
            if (lt.includes('source')) return 'rgba(34,211,238,0.5)';
            if (lt.includes('domain')) return 'rgba(192,132,252,0.4)';
            return 'rgba(255,255,255,0.4)';
          }
          return 'rgba(255,255,255,0.01)';
        })
        .linkWidth((l: any) => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          return (active.has(s) && active.has(t)) ? 0.7 : 0.03;
        })
        .linkDirectionalParticles((l: any) => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          return (active.has(s) && active.has(t)) ? 4 : 0;
        })
        .linkDirectionalParticleWidth(1.2)
        .linkDirectionalParticleSpeed(0.008)
        .linkDirectionalParticleColor((l: any) => {
          const lt = l.type as string;
          if (lt.startsWith('prompt')) return '#ef4444';
          if (lt.startsWith('tool')) return '#f472b6';
          if (lt.includes('domain')) return '#c084fc';
          return '#22d3ee';
        });
    } else {
      // ── 트레이스 해제 → 원래 상태 복원 ──
      objects.forEach((group, id) => {
        const node = nodesRef.current.find(n => n.id === id);
        const type = (node?.type ?? 'table') as NT;
        group.traverse(child => {
          if (child instanceof THREE.Sprite && child.name === 'dot') {
            (child.material as THREE.SpriteMaterial).opacity = 1;
          }
          if (child instanceof SpriteText && child.name === 'label') {
            (child as any).color = '#ffffff';
            (child as any).fontWeight = type === 'system_prompt' || type === 'domain' ? '900' : '600';
            (child as any).backgroundColor = 'rgba(0,0,0,0.55)';
            (child as any).borderColor = C[type] ?? '#555';
            (child as any).borderWidth = 0.5;
          }
        });
      });

      graph
        .linkColor(() => 'rgba(255,255,255,0.04)')
        .linkWidth(0.1)
        .linkDirectionalParticles(0);

      // 카메라 원래 위치로
      graph.cameraPosition({ x: 0, y: 0, z: 180 }, { x: 0, y: 0, z: 0 }, 600);
    }
  }, [liveToolCalls, getRingTex]);

  const activeCount = useMemo(() => {
    if (!liveToolCalls?.length) return 0;
    return extractTrace(liveToolCalls, nodesRef.current).allIds.size;
  }, [liveToolCalls]);

  return (
    <div className="relative w-full h-full" style={{ background: '#05060a', overflow: 'hidden' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* 범례 */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none select-none">
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-2.5 py-1.5 rounded-lg" style={{
          background: 'rgba(5,6,10,0.8)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {Object.entries(C).map(([type, color]) => {
            const labels: Record<string, string> = {
              system_prompt: 'Prompt', domain: '도메인', tool: '도구',
              source: '소스', guide_db: 'DB가이드', guide_code: '코드가이드', table: '테이블',
              knowledge: '널리지',
              web: '웹검색',
            };
            return (
              <div key={type} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[9px]" style={{ color: color + 'cc' }}>{labels[type] ?? type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 정보 */}
      {activeCount > 0 && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none select-none">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
            background: 'rgba(5,6,10,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(244,114,182,0.25)',
            boxShadow: '0 0 20px rgba(244,114,182,0.1)',
          }}>
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ boxShadow: '0 0 8px #f472b6' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#f472b6' }}>
              {activeCount} nodes
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#f472b6', opacity: 0.6 }}>
              · {liveToolCalls?.length ?? 0} tool calls
            </span>
          </div>
        </div>
      )}

      {/* 우하단: 조작법 */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none select-none text-right" style={{
        color: '#475569', fontSize: 9, textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>
        <p>드래그 · 회전 / 스크롤 · 줌</p>
      </div>
    </div>
  );
}
