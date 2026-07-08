import type { Category } from '../types';

/** Tree capped at 3 levels (root → child → grandchild) — mirrors the BE's
 *  `CategoriesService` limit. A grandchild is always a leaf. */
export const MAX_DEPTH = 2;

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function categoryDepth(id: string, byId: Map<string, Category>): number {
  let depth = 0;
  let cur = byId.get(id);
  while (cur?.parentId) {
    depth++;
    cur = byId.get(cur.parentId);
  }
  return depth;
}

/** Is `candidateId` `selfId` itself, or one of its descendants? Both make an
 *  invalid parent choice (self-reference / cycle). */
export function isSelfOrDescendant(
  candidateId: string,
  selfId: string,
  byId: Map<string, Category>,
): boolean {
  let cur: Category | undefined = byId.get(candidateId);
  while (cur) {
    if (cur.id === selfId) return true;
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return false;
}

/** "Đồ khô › Cà phê › Rang xay" — full ancestor chain, root first. */
export function categoryPath(id: string, byId: Map<string, Category>): string {
  const parts: string[] = [];
  let cur = byId.get(id);
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return parts.join(' › ');
}

/** Products attach only to leaves — whichever node in a branch has no
 *  children, root included if that branch was never split into sub-groups. */
export function leafCategories(categories: Category[]): Category[] {
  const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
  return categories.filter((c) => !parentIds.has(c.id));
}

/** Sum of a node's own `productsCount` plus every descendant's — the BE only
 *  gives the direct (per-node) count, so a non-leaf's displayed total is
 *  rolled up here from the tree already in memory. */
export function productsCountRollup(node: CategoryNode): number {
  return (
    (node.productsCount ?? 0) +
    node.children.reduce((sum, child) => sum + productsCountRollup(child), 0)
  );
}
