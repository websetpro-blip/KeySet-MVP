import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { 
  moveSubtree, 
  moveSingleNode, 
  deleteMany, 
  mapTree, 
  findNode, 
  toggleCollapse,
  addChild,
  addSibling,
  updateNode,
  genId,
  UNode as UNodeType 
} from "./lib/tree_ops";

/**
 * KeySet — Веб‑демо «Маски + XMind» — Редактор (v15)
 * ------------------------------------------------------------------
 * Фикс: незавершённый JSX в ветке else (tab === 'tests'). Восстановлен
 * корректный рендер <TestsPanel />, удалён оборванный div. Полная
 * проверка всех кавычек и закрытия тегов.
 */

// ---------- HELPERS ----------
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && (navigator.clipboard as any).writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fallthrough */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}

// ---------- МОДЕЛЬ ДАННЫХ ----------
export type UNode = UNodeType;

// ---------- ДЕРЕВО: УТИЛИТЫ + ПЕРЕТАСКИВАНИЕ ----------

function withIds(root: UNode | null): UNode | null {
  if (!root) return null;
  const walk = (n: UNode): UNode => ({
    id: n.id || genId(),
    title: n.title,
    labels: n.labels || [],
    collapsed: !!n.collapsed,
    children: (n.children || []).map(walk),
  });
  return walk(root);
}





function addChildWithReturn(root: UNode, parentId: string, title = "Новый узел"): [UNode, string] {
  const newId = genId();
  const newRoot = mapTree(root, (n) => (n.id === parentId
    ? { ...n, children: [...(n.children || []), { id: newId, title, children: [] }] }
    : n));
  return [newRoot, newId];
}

function addSiblingWithReturn(root: UNode, id: string, title = "Новый узел"): [UNode, string] {
  const newId = genId();
  const recur = (n: UNode): UNode => {
    const idx = (n.children || []).findIndex((c) => c.id === id);
    if (idx !== -1) {
      const child: UNode = { id: newId, title, children: [] };
      return { ...n, children: [...(n.children || []), child] };
    }
    return { ...n, children: (n.children || []).map(recur) };
  };
  const newRoot = root.id === id ? addChild(root, id, title) : recur(root);
  return [newRoot, newId];
}

function deleteNode(root: UNode, id: string): UNode {
  if (root.id === id) return root; // корень не удаляем
  const recur = (n: UNode): UNode => {
    const ch = (n.children || []).filter((c) => c.id !== id).map(recur);
    return { ...n, children: ch };
  };
  return recur(root);
}





// ---------- ПАРСИНГ XMind ----------
async function parseXMindFile(file: File): Promise<UNode | null> {
  const ab = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(ab);

  // XMind 2020/Zen — content.json
  const jsonEntry = Object.values(zip.files).find((f) => /content\.json$/i.test(f.name));
  if (jsonEntry) {
    const jsonStr = await jsonEntry.async("string");
    try {
      const data = JSON.parse(jsonStr);
      const n = normalizeFromJSON(data);
      if (n) return withIds(n);
    } catch (e) { console.warn("JSON parse error", e); }
  }

  // XMind 8 — content.xml
  const xmlEntry = Object.values(zip.files).find((f) => /content\.xml$/i.test(f.name));
  if (xmlEntry) {
    const xmlStr = await xmlEntry.async("string");
    try {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });
      const data = parser.parse(xmlStr);
      const n = normalizeFromXML(data);
      if (n) return withIds(n);
    } catch (e) { console.warn("XML parse error", e); }
  }

  // Fallback: любой JSON внутри архива
  const anyJson = Object.values(zip.files).find((f) => /\.json$/i.test(f.name));
  if (anyJson) {
    const jsonStr = await anyJson.async("string");
    try {
      const data = JSON.parse(jsonStr);
      const n = normalizeFromJSON(data);
      if (n) return withIds(n);
    } catch {}
  }
  return null;
}

function pickTitle(v: any): string {
  if (!v) return "";
  return (v.title ?? v.TopicName ?? v.text ?? v.caption ?? v["@title"] ?? v["@TEXT"] ?? "(без названия)");
}

function arrayify<T>(v: T | T[] | undefined): T[] { return !v ? [] : (Array.isArray(v) ? v : [v]); }

// --- JSON нормализация ---
function normalizeFromJSON(data: any): UNode | null {
  const candidate = findFirstTopicLike(data);
  if (!candidate) return null;
  return topicToUNode(candidate);
}

function findFirstTopicLike(obj: any): any | null {
  if (!obj || typeof obj !== "object") return null;
  if (obj.topic || obj.rootTopic || looksLikeTopic(obj)) {
    return (obj.topic ?? obj.rootTopic ?? obj);
  }
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (Array.isArray(v)) {
      for (const it of v) {
        const got = findFirstTopicLike(it);
        if (got) return got;
      }
    } else if (typeof v === "object") {
      const got = findFirstTopicLike(v);
      if (got) return got;
    }
  }
  return null;
}

function looksLikeTopic(o: any): boolean {
  if (!o || typeof o !== "object") return false;
  const hasTitle = ("title" in o) || ("@title" in o) || ("text" in o) || ("TopicName" in o);
  const hasChildren = ("topics" in o) || ("children" in o) || ("subTopics" in o);
  return !!(hasTitle && hasChildren);
}

function topicToUNode(topic: any): UNode {
  const title = pickTitle(topic);
  const labels: string[] = arrayify(topic.labels || topic.label || topic.markers).map((x: any) => {
    if (typeof x === "string") return x;
    if (x?.label) return x.label;
    if (x?.title) return x.title;
    return String(x ?? "");
  });
  const childBlocks = (topic.topics ?? topic.subTopics ?? topic.children?.topics ?? topic.children?.attached ?? topic.children ?? []);
  const flat = arrayify(childBlocks).flat();
  const children: UNode[] = [];
  for (const blk of flat) {
    if (!blk) continue;
    const tps = blk.topic ? [blk.topic] : blk.topics ? arrayify(blk.topics) : [blk];
    for (const t of tps) children.push(topicToUNode(t));
  }
  return { id: genId(), title, labels, children };
}

// --- XML нормализация ---
function normalizeFromXML(data: any): UNode | null {
  const xmap = data["xmap-content"] || data.xmap || data;
  const sheets = arrayify(xmap?.sheet);
  const sheet0 = sheets[0];
  const root = sheet0?.topic || sheet0?.rootTopic || findFirstTopicLike(sheet0);
  if (!root) return null;
  return topicXMLToUNode(root);
}

function topicXMLToUNode(topic: any): UNode {
  const rawTitle = (topic.title ?? topic["@title"] ?? topic["@TEXT"] ?? topic.plain);
  const title = typeof rawTitle === "string" ? rawTitle : pickTitle(rawTitle ?? topic);
  const labels: string[] = arrayify(topic.labels?.label).map((l: any) => (typeof l === "string" ? l : (l?.["@text"] || l?.["@TITLE"] || String(l))));
  const topicsBlock = topic.children?.topics || topic.topics;
  const topicArr = arrayify(topicsBlock?.topic ?? topicsBlock);
  const children = topicArr.map((t: any) => topicXMLToUNode(t));
  return { id: genId(), title: title || "(без названия)", labels, children };
}

// ---------- L/R MINDMAP (классика + marquee + inline edit) ----------
function MindMapClassic({
  data,
  selectedIds,
  onSelect,
  onToggle,
  onAddChild,
  onAddSibling,
  onDeleteIds,
  onRename,
  onReparent,
  controlsRef,
  onContextMenu,
}: {
  data: UNode | null;
  selectedIds: Set<string>;
  onSelect: (ids: Set<string>) => void; // заменить текущее выделение
  onToggle: (id: string) => void;
  onAddChild: (id: string) => string | null; // возвращает созданный id
  onAddSibling: (id: string) => string | null;
  onDeleteIds: (ids: Set<string>) => void;
  onRename: (id: string, title: string) => void;
  onReparent: (id: string, newParentId: string, mode: 'subtree' | 'single') => void;
  controlsRef: React.MutableRefObject<any>;
  onContextMenu?: (kind: 'bg' | 'node', clientX: number, clientY: number, id?: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const outerRef = useRef<SVGGElement | null>(null); // держит translate(cx,cy)
  const vpRef = useRef<SVGGElement | null>(null); // zoom/pan сюда
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomT = useRef(d3.zoomIdentity);

  const [bbox, setBbox] = useState({ w: 1100, h: 680 });
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [marquee, setMarquee] = useState<null | { x1: number; y1: number; x2: number; y2: number }>(null);
  const nodesCache = useRef<{ id: string; x: number; y: number; w: number; h: number }[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const pendingFocusRef = useRef<string | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceHeld(true); };
    const ku = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceHeld(false); };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current as SVGSVGElement);
    const vp = d3.select(vpRef.current as SVGGElement);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 6])
      .on("zoom", (ev) => {
        zoomT.current = ev.transform;
        vp.attr("transform", ev.transform);
      });
    svg.call(zoom as any);
    svg.on("dblclick.zoom", null); // dblclick — редактирование, а не зум
    zoomRef.current = zoom;

    const centerTo = (id: string, k?: number, after?: () => void) => {
      const svgSel = svg as any;
      const z = zoomRef.current as any;
      const kCur = typeof k === "number" ? k : zoomT.current.k;
      const pos = id === data?.id ? { x: 0, y: 0 } : (nodesCache.current.find((n) => n.id === id) || null);
      if (!pos) { after?.(); return; }
      const sx = pos.x, sy = pos.y;
      const t = d3.zoomIdentity.translate(-kCur * sx, -kCur * sy).scale(kCur);
      svgSel.transition().duration(240).call(z.transform, t).on("end", after || null);
    };

    controlsRef.current = {
      zoomIn: () => svg.transition().call((zoom as any).scaleBy, 1.2),
      zoomOut: () => svg.transition().call((zoom as any).scaleBy, 1 / 1.2),
      reset: () => svg.transition().call((zoom as any).transform, d3.zoomIdentity),
      fit: () => {
        try {
          const vpEl = vpRef.current as SVGGElement;
          const s = svgRef.current as SVGSVGElement;
          const b = vpEl.getBBox();
          const m = 24;
          const scale = Math.min((s.clientWidth - m * 2) / b.width, (s.clientHeight - m * 2) / b.height, 6);
          const tx = (s.clientWidth - scale * (b.x + b.width)) / 2 + scale * b.x * -1;
          const ty = (s.clientHeight - scale * (b.y + b.height)) / 2 + scale * b.y * -1;
          const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
          svg.transition().call((zoom as any).transform, t);
        } catch {}
      },
      focusNode: (id: string, k?: number) => centerTo(id, k),
    };

    const tryFocusAfterLayout = () => {
      const id = pendingFocusRef.current;
      if (!id) return;
      pendingFocusRef.current = null;
      centerTo(id, undefined, () => setEditing({ id, value: "" }));
    };

    const raf = requestAnimationFrame(tryFocusAfterLayout);
    return () => { controlsRef.current = null; svg.on("zoom", null); cancelAnimationFrame(raf); };
  }, [controlsRef, data]);

  useEffect(() => {
    const onResize = () => {
      const el = svgRef.current?.parentElement; if (!el) return;
      const r = el.getBoundingClientRect();
      setBbox({ w: Math.max(800, r.width), h: Math.max(520, r.height) });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const nodeWidth = (title: string) => Math.max(64, Math.min(320, 10 * title.length + 28));
  const nodeHeight = 28;

  const layout = useMemo(() => {
    if (!data) return { nodes: [] as any[], links: [] as any[], rootLayout: null as any };
    const visibleChildren = (n: UNode) => (n.collapsed ? [] : (n.children || []));
    const kids = visibleChildren(data);
    const left: UNode[] = [], right: UNode[] = [];
    kids.forEach((k, i) => ((i % 2) ? left : right).push(k));

    const rawLinks: { s: string | null; t: string }[] = [];

    const mk = (children: UNode[], dir: 1 | -1) => {
      const pseudo = { id: "__root__" + dir, title: "", children } as UNode;
      const h = d3.hierarchy(pseudo as any, (d: UNode) => (d.collapsed ? [] : (d.children || [])));
      const tree = d3.tree<UNode>().nodeSize([36, 140]);
      tree(h as any);
      const nodes: any[] = [];
      h.each((d: any) => {
        if (d.data.id.startsWith("__root__")) return;
        nodes.push({ x: d.x, y: dir * d.y, d, w: nodeWidth(d.data.title), h: nodeHeight });
        if (d.parent && !d.parent.data.id.startsWith("__root__")) rawLinks.push({ s: d.parent.data.id, t: d.data.id });
        else if (d.parent) rawLinks.push({ s: data.id, t: d.data.id });
      });
      return { nodes };
    };

    const L = mk(left, -1), R = mk(right, 1);
    const nodes = [...L.nodes, ...R.nodes];

    const byId = new Map<string, any>(nodes.map((n) => [n.d.data.id, n]));
    const rootLayout = { x: 0, y: 0, d: { data }, w: nodeWidth(data.title), h: 40 } as any;
    byId.set(data.id, rootLayout);

    const links = rawLinks.map(({ s, t }) => ({ s: byId.get(s || data.id), t: byId.get(t)! }));

    nodesCache.current = nodes.map((n) => ({ id: n.d.data.id, x: n.y, y: n.x, w: n.w, h: n.h }));
    return { nodes, links, rootLayout };
  }, [data]);

  const cx = bbox.w / 2, cy = bbox.h / 2;

  // --- клавиши ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!data) return;
      const primary = Array.from(selectedIds)[0] || data.id;
      if (editing) {
        if (e.key === "Escape") { setEditing(null); }
        else if (e.key === "Enter") { e.preventDefault(); onRename(editing.id, editing.value.trim() || ""); setEditing(null); }
        else if (e.key === "Tab") { e.preventDefault(); const nid = onAddSibling(editing.id); if (nid) { pendingFocusRef.current = nid; } }
        return;
      }
      if (e.key === "Tab") { e.preventDefault(); const nid = onAddChild(primary); if (nid) { pendingFocusRef.current = nid; } }
      if (e.key === "Enter") { e.preventDefault(); const nid = onAddSibling(primary); if (nid) { pendingFocusRef.current = nid; } }
      if (e.key === "Delete") { if (selectedIds.size > 0) onDeleteIds(selectedIds); }
      if ((e.ctrlKey || (e as any).metaKey) && e.key.toLowerCase() === "c") {
        const titles: string[] = []; selectedIds.forEach((id) => { const n = data && findNode(data, id); if (n) titles.push(n.title); });
        const text = Array.from(new Set(titles)).join("\n"); copyText(text);
      }
      if (e.key === "F2") { const node = findNode(data, primary); if (node) setEditing({ id: primary, value: node.title }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, selectedIds, editing, onAddChild, onAddSibling, onDeleteIds, onRename]);

  // --- преобразования координат ---
  const screenToScene = (clientX: number, clientY: number) => {
    const svg = svgRef.current as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    const p = zoomT.current.invert([x, y]);
    return { x: p[0], y: p[1] };
  };

  const startMarquee = (e: React.MouseEvent) => {
    if (spaceHeld) return; // панорамирование
    if ((e.target as HTMLElement).closest('[data-node="1"]')) return; // не стартуем с узла
    e.preventDefault();
    const p = screenToScene(e.clientX, e.clientY);
    setMarquee({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    onSelect(new Set());
  };
  const moveMarquee = (e: React.MouseEvent) => {
    if (!marquee) return;
    const p = screenToScene(e.clientX, e.clientY);
    const r = { ...marquee, x2: p.x, y2: p.y };
    setMarquee(r);
    const x1 = Math.min(r.x1, r.x2), x2 = Math.max(r.x1, r.x2);
    const y1 = Math.min(r.y1, r.y2), y2 = Math.max(r.y1, r.y2);
    const sel = new Set<string>();
    for (const n of nodesCache.current) if (n.x >= x1 && n.x <= x2 && n.y >= y1 && n.y <= y2) sel.add(n.id);
    onSelect(sel);
  };
  const stopMarquee = () => setMarquee(null);

  const onNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sel = new Set(selectedIds);
    if (e.shiftKey) { sel.has(id) ? sel.delete(id) : sel.add(id); }
    else { sel.clear(); sel.add(id); }
    onSelect(sel);
  };
  const onNodeDbl = (e: React.MouseEvent, id: string) => { e.stopPropagation(); const node = data ? findNode(data, id) : null; if (node) setEditing({ id, value: node.title }); };
  const onTextDbl = (e: React.MouseEvent, id: string, title: string) => { e.stopPropagation(); setEditing({ id, value: title }); };
  const onNodeCtx = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedIds.has(id)) onSelect(new Set([id]));
    onContextMenu?.('node', e.clientX, e.clientY, id);
  };
  const onBgCtx = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node="1"]')) return;
    e.preventDefault();
    onContextMenu?.('bg', e.clientX, e.clientY);
  };

  // Состояние drag'n'drop
  const dragStart = useRef<{ id: string; x0: number; y0: number; mode: 'subtree' | 'single'; started: boolean } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const preventClick = useRef(false);

  const hitTestNode = (x: number, y: number, exclude?: string): string | null => {
    const pad = 6;
    for (const n of nodesCache.current) {
      if (exclude && n.id === exclude) continue;
      const L = n.x - n.w / 2 - pad, R = n.x + n.w / 2 + pad;
      const T = n.y - n.h / 2 - pad, B = n.y + n.h / 2 + pad;
      if (x >= L && x <= R && y >= T && y <= B) return n.id;
    }
    if (data) {
      const w = Math.max(64, Math.min(320, 10 * data.title.length + 28)), h = 40;
      const L = -w / 2 - pad, R = w / 2 + pad, T = -h / 2 - pad, B = h / 2 + pad;
      if (x >= L && x <= R && y >= T && y <= B) return data.id;
    }
    return null;
  };

  const startNodeDrag = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = screenToScene(e.clientX, e.clientY);
    dragStart.current = { id, x0: p.x, y0: p.y, mode: (e.shiftKey ? 'single' : 'subtree'), started: false };
    preventClick.current = false;

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const pt = screenToScene(ev.clientX, ev.clientY);
      const dx = pt.x - dragStart.current.x0, dy = pt.y - dragStart.current.y0;
      if (!dragStart.current.started && Math.hypot(dx, dy) > 6) dragStart.current.started = true;
      if (dragStart.current.started) {
        preventClick.current = true;
        setDragOverId(hitTestNode(pt.x, pt.y, dragStart.current.id));
      }
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const st = dragStart.current; dragStart.current = null;
      if (!st || !st.started) { setDragOverId(null); return; }
      const dropId = dragOverId; setDragOverId(null);
      if (dropId && dropId !== st.id) onReparent(st.id, dropId, st.mode);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const hasChildren = (n: UNode | null | undefined) => !!(n && (n.children?.length || 0) > 0);

  const scenePt = (n: any) => ({ x: n.y, y: n.x, w: n.w, h: n.h });
  const linkPath = (s: any, t: any) => {
    const S = scenePt(s), T = scenePt(t);
    const dir = Math.sign(T.x - S.x) || 1;
    const sx = S.x + dir * (S.w / 2);
    const sy = S.y;
    const tx = T.x - dir * (T.w / 2);
    const ty = T.y;
    const mx = (sx + tx) / 2;
    return `M ${sx},${sy} C ${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  };

  const ToggleIcon = ({ id, w, x, y, parentX, parentY, collapsed }: { 
    id: string; 
    w: number; 
    x: number; 
    y: number;
    parentX: number;
    parentY: number;
    collapsed?: boolean 
  }) => {
    // Позиционирование иконки со стороны входа линии
    const dir = x < 0 ? 1 : -1; // для левой половины — справа; для правой — слева
    const cxIcon = dir * (w / 2 + 12);
    const cyIcon = 0;
    const r = 9;
    const handle = (e: React.MouseEvent) => { e.stopPropagation(); onToggle(id); };
    return (
      <g className="cursor-pointer" onClick={handle}>
        <circle cx={cxIcon} cy={cyIcon} r={r} className="fill-white stroke-[#C8D1DC] hover:stroke-black" />
        <line x1={cxIcon - 4} y1={cyIcon} x2={cxIcon + 4} y2={cyIcon} stroke="#111" strokeWidth={1.5} />
        {collapsed && (<line x1={cxIcon} y1={cyIcon - 4} x2={cxIcon} y2={cyIcon + 4} stroke="#111" strokeWidth={1.5} />)}
      </g>
    );
  };

  return (
    <svg ref={svgRef} width={bbox.w} height={bbox.h} className="bg-white rounded-2xl shadow-inner select-none"
         onMouseDown={startMarquee} onMouseMove={moveMarquee} onMouseUp={stopMarquee} onMouseLeave={stopMarquee}
         onContextMenu={onBgCtx}
         style={{ cursor: spaceHeld ? "grab" : "default" }}>
      <g ref={outerRef} transform={`translate(${cx},${cy})`}>
        <g ref={vpRef}>
          <g stroke="#D9DEE5" fill="none">
            {layout.links.map((l: any, i: number) => (
              <path key={i} d={linkPath(l.s, l.t)} />
            ))}
          </g>

          {data && (
            <g transform={`translate(0,0)`}
               data-node="1"
               onDoubleClick={(e) => onNodeDbl(e, data.id)}
               onClick={(e) => { if (preventClick.current) return; onNodeClick(e, data.id); }}
               onContextMenu={(e) => onNodeCtx(e, data.id)}
               onMouseDown={(e) => startNodeDrag(e, data.id)}
               onMouseEnter={() => setHoveredId(data.id)}
               onMouseLeave={() => setHoveredId((h) => (h === data.id ? null : h))}
            >
              <rect x={-nodeWidth(data.title) / 2} y={-20} rx={10} ry={10}
                    width={nodeWidth(data.title)} height={40}
                    className={selectedIds.has(data.id) ? "fill-[#EAF2FF] stroke-black" : "fill-[#EAF2FF] stroke-[#7EA9FF]"} />
              {dragOverId === data.id && (
                <rect x={-nodeWidth(data.title)/2} y={-20} width={nodeWidth(data.title)} height={40} rx={10} ry={10}
                      className="fill-transparent stroke-amber-500" strokeWidth={2}/>
              )}
              <text textAnchor="middle" y={5} className="text-sm font-semibold" onDoubleClick={(e) => onTextDbl(e, data.id, data.title)}>{data.title}</text>
              {hoveredId === data.id && hasChildren(data) && (
                <ToggleIcon id={data.id} w={nodeWidth(data.title)} x={0} y={0} parentX={0} parentY={0} collapsed={!!data.collapsed} />
              )}
            </g>
          )}

          <g>
            {layout.nodes.map((n: any, i: number) => {
              const d: UNode = n.d.data;
              const isSel = selectedIds.has(d.id);
              const w = n.w; const h = n.h;
              const x = n.y; const y = n.x;
              
              // Найти родительский layout для правильного позиционирования кнопки
              let parentLayout = layout.rootLayout;
              if (n.d.parent && !n.d.parent.data.id.startsWith("__root__")) {
                const parentId = n.d.parent.data.id;
                const parentNode = layout.nodes.find((node: any) => node.d.data.id === parentId);
                if (parentNode) {
                  parentLayout = { x: parentNode.y, y: parentNode.x };
                }
              }
              
              return (
                <g key={i}
                   transform={`translate(${x},${y})`}
                   className="cursor-pointer"
                   data-node="1"
                   onDoubleClick={(e) => onNodeDbl(e, d.id)}
                   onClick={(e) => { if (preventClick.current) return; onNodeClick(e, d.id); }}
                   onContextMenu={(e) => onNodeCtx(e, d.id)}
                   onMouseDown={(e) => startNodeDrag(e, d.id)}
                   onMouseEnter={() => setHoveredId(d.id)}
                   onMouseLeave={() => setHoveredId((h) => (h === d.id ? null : h))}
                >
                  <rect x={-w/2} y={-h/2} width={w} height={h} rx={8} ry={8}
                        className={isSel ? "fill-white stroke-black" : "fill-white stroke-[#C8D1DC]"}

                  />
                  {dragOverId === d.id && (
                    <rect x={-w/2} y={-h/2} width={w} height={h} rx={8} ry={8}
                          className="fill-transparent stroke-amber-500" strokeWidth={2}/>
                  )}
                  <text textAnchor="middle" y={4} className="text-xs" onDoubleClick={(e) => onTextDbl(e, d.id, d.title)}>{d.title}</text>
                  {hoveredId === d.id && hasChildren(d) && (
                    <ToggleIcon 
                      id={d.id} 
                      w={w} 
                      x={x} 
                      y={y}
                      parentX={parentLayout?.x || 0}
                      parentY={parentLayout?.y || 0}
                      collapsed={!!d.collapsed} 
                    />
                  )}
                </g>
              );
            })}
          </g>



          {editing && (() => {
            const pos = nodesCache.current.find((n) => n.id === editing.id) || { x: 0, y: 0, w: 300, h: 28 };
            return (
              <foreignObject x={pos.x - Math.min(300, pos.w)} y={pos.y - 16} width={Math.min(300, pos.w * 1.2)} height={32}>
                <input autoFocus value={editing.value}
                  onChange={(e) => setEditing({ id: editing.id, value: e.target.value })}
                  onBlur={() => { onRename(editing.id, editing.value.trim() || ""); setEditing(null); }}
                  className="w-full h-full border rounded px-2 text-sm bg-white" />
              </foreignObject>
            );
          })()}

          {marquee && (
            <rect x={Math.min(marquee.x1, marquee.x2)} y={Math.min(marquee.y1, marquee.y2)}
                  width={Math.abs(marquee.x2 - marquee.x1)} height={Math.abs(marquee.y2 - marquee.y1)}
                  className="fill-blue-500/10 stroke-blue-500" strokeDasharray="4 4" />
          )}
          

        </g>
      </g>
    </svg>
  );
}

function countVisible(n: UNode): number {
  let c = 1;
  if (!n.collapsed) for (const ch of n.children || []) c += countVisible(ch);
  return c;
}

// ---------- ГЕНЕРАТОР МАСОК (MVP) ----------
const GROUPS = ["core", "products", "mods", "attrs", "geo", "brands"] as const;

type Groups = Record<(typeof GROUPS)[number], string>;

function generateMasks(groups: Groups, maxWords = 5) {
  const parts = GROUPS.map((g) => splitLines(groups[g]));
  let out: string[] = [];
  const rec = (idx: number, acc: string[]) => {
    if (idx === parts.length) {
      const phrase = acc.filter(Boolean).join(" ").trim();
      if (!phrase) return;
      const words = phrase.split(/\s+/);
      if (words.length <= maxWords) out.push(phrase.toLowerCase());
      return;
    }
    for (const w of parts[idx]) rec(idx + 1, [...acc, w]);
  };
  rec(0, []);
  out = Array.from(new Set(out));
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

function splitLines(s: string): string[] { return (s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean); }

// ---------- ТЕСТЫ ----------
function runTests() {
  type Test = { name: string; run: () => boolean | string };
  const tests: Test[] = [];

  tests.push({ name: "pickTitle priority", run: () => {
    const obj = { TopicName: "TN", text: "TXT", caption: "CAP", "@title": "AT", "@TEXT": "AX", title: "T" };
    return pickTitle(obj) === "T";
  }});

  tests.push({ name: "normalizeFromJSON basic tree", run: () => {
    const jsonLike = { rootTopic: { title: "Root", topics: [ { topic: { title: "A", topics: [{ topic: { title: "A1" } }] } }, { topic: { title: "B" } } ] } };
    const n = normalizeFromJSON(jsonLike); if (!n) return "null root";
    return n.title === "Root" && (n.children?.length ?? 0) === 2 && (n.children?.[0].children?.length ?? 0) === 1;
  }});

  tests.push({ name: "normalizeFromXML minimal", run: () => {
    const xmlLike = { "xmap-content": { sheet: { topic: { title: "R", children: { topics: { topic: [ { title: "L1" }, { title: "L2", children: { topics: { topic: [{ title: "L2-1" }] } } } ] } } } } } };
    const n = normalizeFromXML(xmlLike); if (!n) return "null root";
    return n.title === "R" && (n.children?.length ?? 0) === 2 && (n.children?.[1].children?.length ?? 0) === 1;
  }});

  tests.push({ name: "tree ops add/rename/delete/toggle", run: () => {
    let r: UNode = { id: "r", title: "R", children: [{ id: "a", title: "A" }] };
    const c = addChildWithReturn(r, "a", "A1"); r = c[0];
    r = updateNode(r, "a", { title: "A*" });
    r = toggleCollapse(r, "a");
    r = deleteNode(r, "a");
    const s = addSiblingWithReturn(r, "r", "S"); r = s[0];
    const ok = (r.children?.length ?? 0) === 1; // у корня появился дочерний (как «сосед» для root)
    return ok ? true : JSON.stringify(r);
  }});

  tests.push({ name: "generateMasks respects maxWords", run: () => {
    const g: Groups = { core: "купить", products: "iphone 15", mods: "в наличии", attrs: "128 гб", geo: "москва", brands: "apple" };
    const res = generateMasks(g, 3);
    return res.every((p) => p.split(/\s+/).length <= 3);
  }});

  tests.push({ name: "splitLines trims and filters", run: () => {
    const res = splitLines(" a \n \n b \n");
    return res.length === 2 && res[0] === "a" && res[1] === "b";
  }});

  tests.push({ name: "generateMasks handles empties", run: () => {
    const g: Groups = { core: "", products: "", mods: "A\n", attrs: "", geo: "", brands: "B" } as any;
    const res = generateMasks(g, 5);
    return Array.isArray(res) && res.every((x) => typeof x === "string");
  }});

  const results = tests.map((t) => ({ name: t.name, result: t.run() }));
  const passed = results.filter((r) => r.result === true).length;
  const failed = results.filter((r) => r.result !== true);
  return { results, passed, failed };
}

function TestsPanel() {
  const [out, setOut] = useState<ReturnType<typeof runTests> | null>(null);
  return (
    <div className="rounded-2xl bg-white p-4 shadow border border-zinc-200">
      <h3 className="font-semibold mb-3">🧪 Тесты</h3>
      <button className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm" onClick={() => setOut(runTests())}>Запустить тесты</button>
      {out && (
        <div className="mt-3 text-sm">
          <div className="mb-2">Пройдено: <b>{out.passed}</b> / {out.results.length}</div>
          <div className="grid gap-1">
            {out.results.map((r, i) => (
              <div key={i} className={`px-2 py-1 rounded ${r.result === true ? "bg-green-50" : "bg-red-50"}`}>
                <b>{r.name}</b>: {r.result === true ? "OK" : String(r.result)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { ProfessionalGenerator } from './components/ProfessionalGenerator';

// ---------- ПРИЛОЖЕНИЕ ----------
export default function App() {
  const [tab, setTab] = useState<"map" | "gen" | "prof" | "tests">("map");
  const [data, setData] = useState<UNode | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const mapControlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [ctx, setCtx] = useState<null | { x: number; y: number; id?: string }>(null);
  const [toast, setToast] = useState<string>("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 1200); };

  const [groups, setGroups] = useState<Groups>({ core: "", products: "", mods: "", attrs: "", geo: "", brands: "" });
  const masks = useMemo(() => generateMasks(groups, 5), [groups]);

  const onFile = useCallback(async (f: File) => {
    setFileName(f.name);
    const parsed = await parseXMindFile(f);
    setData(parsed);
    setSelectedIds(new Set(parsed?.id ? [parsed.id] : []));
  }, []);

  const onDrop = useCallback(async (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const f = ev.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const onChoose = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const doSelect = (ids: Set<string>) => setSelectedIds(new Set(ids));
  const doToggle = (id: string) => setData((r) => (r ? toggleCollapse(r, id) : r));
  const doAddChild = (id: string) => {
    if (!data) return null;
    const [nr, nid] = addChildWithReturn(data, id, "Новый узел");
    setData(nr); setSelectedIds(new Set([nid]));
    return nid;
  };
  const doAddSibling = (id: string) => {
    if (!data) return null;
    const [nr, nid] = addSiblingWithReturn(data, id, "Новый узел");
    setData(nr); setSelectedIds(new Set([nid]));
    return nid;
  };
  const doDeleteIds = (ids: Set<string>) => setData((r) => (r ? deleteMany(r, ids) : r));
  const doRename = (id: string, title: string) => setData((r) => (r ? updateNode(r, id, { title }) : r));
  const doReparent = (id: string, newParentId: string, mode: 'subtree' | 'single') => {
    if (!data) return;
    setData(mode === 'subtree' ? moveSubtree(data, id, newParentId) : moveSingleNode(data, id, newParentId));
    setSelectedIds(new Set([id]));
  };

  const openCtx = (kind: 'bg' | 'node', clientX: number, clientY: number, id?: string) => {
    const el = containerRef.current as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    setCtx({ x: clientX - rect.left, y: clientY - rect.top, id });
  };
  const copySelection = async () => {
    if (!data) return;
    const titles: string[] = [];
    selectedIds.forEach((id) => { const n = findNode(data, id); if (n) titles.push(n.title); });
    const ok = await copyText(Array.from(new Set(titles)).join("\n"));
    if (ok) showToast("Скопировано");
    setCtx(null);
  };
  const toggleTarget = () => { if (ctx?.id) doToggle(ctx.id); setCtx(null); };
  const deleteSelection = () => { if (selectedIds.size) doDeleteIds(selectedIds); setCtx(null); };

  const exportSVG = () => {
    const svg = document.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName?.replace(/\.[^.]+$/, "") || "mindmap") + ".svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-zinc-100 min-h-[540px]" onClick={() => setCtx(null)}>
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold">KeySet — Маски + XMind (редактор)</h1>
          <nav className="flex items-center gap-2 rounded-xl bg-white p-1 shadow">
            <button onClick={() => setTab("map")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "map" ? "bg-black text-white" : "hover:bg-zinc-100"}`}>🧠 Карта</button>
            <button onClick={() => setTab("gen")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "gen" ? "bg-black text-white" : "hover:bg-zinc-100"}`}>🧬 Генератор масок</button>
            <button onClick={() => setTab("prof")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "prof" ? "bg-black text-white" : "hover:bg-zinc-100"}`}>⚡ Проф. генератор</button>
            <button onClick={() => setTab("tests")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "tests" ? "bg-black text-white" : "hover:bg-zinc-100"}`}>🧪 Тесты</button>
          </nav>
        </header>

        {tab === "map" ? (
          <section>
            <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} ref={containerRef} className="relative rounded-2xl bg-white p-4 shadow border border-zinc-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white cursor-pointer">
                    <input type="file" accept=".xmind" className="hidden" onChange={onChoose} />
                    <span>Загрузить .xmind</span>
                  </label>
                  <span className="text-xs text-zinc-500">или перетащите файл сюда</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => (mapControlsRef.current && mapControlsRef.current.zoomOut?.())} className="px-2 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">−</button>
                  <button onClick={() => (mapControlsRef.current && mapControlsRef.current.reset?.())} className="px-2 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">1:1</button>
                  <button onClick={() => (mapControlsRef.current && mapControlsRef.current.zoomIn?.())} className="px-2 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">＋</button>
                  <button onClick={() => (mapControlsRef.current && mapControlsRef.current.fit?.())} className="px-2 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">Fit</button>
                  <button onClick={exportSVG} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">Экспорт SVG</button>
                </div>
              </div>
              <div className="text-sm text-zinc-600 mb-2">{fileName ? `Файл: ${fileName}` : "Файл не загружен"}</div>

              <MindMapClassic
                data={data}
                selectedIds={selectedIds}
                onSelect={doSelect}
                onToggle={doToggle}
                onAddChild={doAddChild}
                onAddSibling={doAddSibling}
                onDeleteIds={doDeleteIds}
                onRename={doRename}
                onReparent={doReparent}
                controlsRef={mapControlsRef}
                onContextMenu={openCtx}
              />

              {ctx && (
                <div style={{ left: ctx.x, top: ctx.y }} className="absolute z-50 min-w-[160px] rounded-xl border bg-white shadow-lg text-sm overflow-hidden">
                  <button className="w-full text-left px-3 py-2 hover:bg-zinc-100" onClick={copySelection}>Копировать</button>
                  {ctx.id && (<button className="w-full text-left px-3 py-2 hover:bg-zinc-100" onClick={toggleTarget}>Свернуть/развернуть</button>)}
                  <button className="w-full text-left px-3 py-2 hover:bg-zinc-100 text-red-600" onClick={deleteSelection}>Удалить</button>
                </div>
              )}

              {!!toast && (
                <div className="absolute right-4 bottom-4 bg-black text-white text-xs px-3 py-2 rounded-lg shadow">{toast}</div>
              )}

              <p className="text-xs text-zinc-500 mt-3">Подсказка: 1 клик — выделение; <b>Tab/Enter</b> — создают узел и камера переносится к нему; двойной клик — редактирование. Наведи на узел — появится кнопка «−/+» в точке подключения линии. Перетаскивание узлов — зажми и перетащи на другой узел. Ctrl+C или ПКМ → «Копировать». Space — панорамирование, колесо — зум.</p>
            </div>
          </section>
        ) : tab === "prof" ? (
          <section className="mt-4">
            <ProfessionalGenerator 
              xmindData={data}
              onExport={(result) => {
                console.log('Экспорт результатов:', result);
                // Можно добавить уведомление об успешном экспорте
              }}
            />
          </section>
        ) : tab === "gen" ? (
          <section className="rounded-2xl bg-white p-4 shadow border border-zinc-200 mt-4">
            <h3 className="font-semibold mb-3">Умный генератор масок (MVP)</h3>
            <div className="grid lg:grid-cols-6 gap-3 mb-4">
              {GROUPS.map((g) => (
                <div key={g} className="flex flex-col">
                  <label className="text-xs font-medium mb-1 uppercase tracking-wide text-zinc-600">{g}</label>
                  <textarea
                    className="min-h-[110px] rounded-xl border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                    placeholder={g === "core" ? "купить\nзаказать\nцены" : g === "products" ? "iphone 15\nсмартфон\nxiaomi 8 pro" : g === "mods" ? "дешево\nв наличии\nс гарантией" : g === "attrs" ? "черный\n128 гб\nновый" : g === "geo" ? "москва\nспб\nновосибирск" : "apple\nxiaomi\nsamsung"}
                    value={groups[g]}
                    onChange={(e) => setGroups((st) => ({ ...st, [g]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-600">Итоговых масок: <b>{masks.length}</b></div>
              <div className="flex gap-2">
                <button
                  onClick={async () => { const ok = await copyText(masks.join("\n")); if (ok) showToast("Скопировано"); }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm"
                >
                  Копировать всё
                </button>
                <button
                  onClick={() => {
                    const csv = "mask\n" + masks.join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "masks.csv"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm"
                >
                  Экспорт CSV
                </button>
              </div>
            </div>

            <div className="h-[320px] overflow-auto border rounded-xl p-3 text-sm bg-zinc-50">
              {masks.map((m, i) => (
                <div key={i} className="py-1 border-b last:border-b-0 border-zinc-200">{m}</div>
              ))}
            </div>
          </section>
        ) : (
          <TestsPanel />
        )}
      </div>
    </div>
  );
}
