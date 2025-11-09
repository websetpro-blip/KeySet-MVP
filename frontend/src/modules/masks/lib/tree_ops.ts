// lib/tree_ops.ts
export type UNode = {
  id: string;
  title: string;
  labels?: string[];
  children?: UNode[];
  collapsed?: boolean;
};

export const genId = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : `id_${Math.random().toString(36).slice(2)}`;

export const findNode = (root: UNode, id: string): UNode | null => {
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
};

export const mapTree = (root: UNode, fn: (n: UNode) => UNode): UNode => {
  const recur = (n: UNode): UNode => {
    const nn = fn({ ...n, children: n.children ? [...n.children] : [] });
    nn.children = (nn.children || []).map(recur);
    return nn;
  };
  return recur(root);
};

// --- deleteMany (на случай, если ещё нет)
export const deleteMany = (root: UNode, ids: Set<string>): UNode => {
  if (ids.has(root.id)) return root;
  const recur = (n: UNode): UNode => {
    const kept = (n.children || []).filter((c) => !ids.has(c.id)).map(recur);
    return { ...n, children: kept };
  };
  return recur(root);
};

// --- перенос поддерева/одного узла
export const isDescendant = (root: UNode, ancestorId: string, id: string): boolean => {
  const anc = findNode(root, ancestorId);
  if (!anc) return false;
  const dfs = (n: UNode): boolean => {
    if (n.id === id) return true;
    for (const c of n.children || []) if (dfs(c)) return true;
    return false;
  };
  return dfs(anc);
};

export const removeAndReturn = (root: UNode, id: string): [UNode, UNode | null, string | null] => {
  if (root.id === id) return [root, null, null];
  const recur = (n: UNode): [UNode, UNode | null, string | null] => {
    let removed: UNode | null = null;
    let parentId: string | null = null;
    const children: UNode[] = [];
    for (const c of n.children || []) {
      if (c.id === id) { removed = c; parentId = n.id; }
      else {
        const [nn, r, p] = recur(c);
        children.push(nn);
        if (r) { removed = r; parentId = p; }
      }
    }
    return [{ ...n, children }, removed, parentId];
  };
  return recur(root);
};

export const insertChild = (root: UNode, parentId: string, child: UNode): UNode =>
  mapTree(root, (n) => (n.id === parentId ? { ...n, children: [...(n.children || []), child] } : n));

export const moveSubtree = (root: UNode, id: string, newParentId: string): UNode => {
  if (id === newParentId || isDescendant(root, id, newParentId)) return root;
  const [r1, node] = removeAndReturn(root, id);
  if (!node) return root;
  return insertChild(r1, newParentId, node);
};

export const moveSingleNode = (root: UNode, id: string, newParentId: string): UNode => {
  if (id === newParentId || isDescendant(root, id, newParentId)) return root;
  const [r1, node, oldPid] = removeAndReturn(root, id);
  if (!node || !oldPid) return root;
  const r2 = mapTree(r1, (n) =>
    n.id === oldPid ? { ...n, children: [...(n.children || []), ...(node.children || [])] } : n
  );
  const moved: UNode = { ...node, children: [] };
  return insertChild(r2, newParentId, moved);
};

// --- копирование/вставка
export const cloneWithNewIds = (n: UNode): UNode => ({
  id: genId(),
  title: n.title,
  labels: [...(n.labels || [])],
  collapsed: !!n.collapsed,
  children: (n.children || []).map(cloneWithNewIds),
});

export const pasteForestUnder = (root: UNode, parentId: string, forest: UNode[]): [UNode, string[]] => {
  const clones = forest.map(cloneWithNewIds);
  const newIds = clones.map((c) => c.id);
  const nr = mapTree(root, (n) => (n.id === parentId ? { ...n, children: [...(n.children || []), ...clones] } : n));
  return [nr, newIds];
};

export const toggleCollapse = (root: UNode, id: string): UNode => {
  return updateNode(root, id, { collapsed: !findNode(root, id)?.collapsed });
};

export const addChild = (root: UNode, parentId: string, title = "Новый узел"): UNode => {
  return mapTree(root, (n) => {
    if (n.id !== parentId) return n;
    const child: UNode = { id: genId(), title, labels: [], children: [] };
    const children = [...(n.children || []), child];
    return { ...n, children };
  });
};

export const addSibling = (root: UNode, id: string, title = "Новый узел"): [UNode, string] => {
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
};

export const updateNode = (root: UNode, id: string, patch: Partial<UNode>): UNode => {
  return mapTree(root, (n) => (n.id === id ? { ...n, ...patch } : n));
};
