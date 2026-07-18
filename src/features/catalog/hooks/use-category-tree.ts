import { useEffect, useMemo, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  buildCategoryTree,
  type CategoryNode,
} from '../lib/category-tree';
import { useReorderCategories } from './use-catalog-refs';
import type { Category } from '../types';

/**
 * Trạng thái cây danh mục cho trang Nhóm sản phẩm: dựng cây, tra cứu theo id,
 * expand/collapse, và kéo-thả sắp xếp (ghi đè lạc quan `dragOverride` trong lúc
 * chờ mutate, tự reset khi dữ liệu mới về). Tách khỏi component để trang chỉ còn
 * việc ghép UI.
 */
export function useCategoryTree(categories: Category[]) {
  const reorderCategories = useReorderCategories();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragOverride, setDragOverride] = useState<{
    key: string;
    order: string[];
  } | null>(null);

  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const nodeById = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    const walk = (nodes: CategoryNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        walk(n.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  useEffect(() => {
    setDragOverride(null);
  }, [categories]);

  const siblingsOf = (parentId: string | undefined): CategoryNode[] => {
    const list = parentId ? (nodeById.get(parentId)?.children ?? []) : tree;
    const sorted = [...list].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
    const key = parentId ?? 'root';
    if (dragOverride?.key === key) {
      const ordered = dragOverride.order
        .map((id) => nodeById.get(id))
        .filter((n): n is CategoryNode => !!n);
      if (ordered.length === sorted.length) return ordered;
    }
    return sorted;
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expand = (id: string) => setExpanded((prev) => new Set(prev).add(id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeCat = byId.get(String(active.id));
    const overCat = byId.get(String(over.id));
    if (!activeCat || !overCat) return;
    const parentKey = activeCat.parentId ?? 'root';
    if ((overCat.parentId ?? 'root') !== parentKey) return; // ignore cross-group drops

    const current = siblingsOf(activeCat.parentId).map((n) => n.id);
    const oldIndex = current.indexOf(String(active.id));
    const newIndex = current.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(current, oldIndex, newIndex);
    setDragOverride({ key: parentKey, order: newOrder });
    const changed = newOrder
      .map((id, index) => ({ id, sortOrder: index }))
      .filter(({ id, sortOrder }) => byId.get(id)?.sortOrder !== sortOrder);
    if (changed.length) reorderCategories.mutate(changed);
  };

  return {
    tree,
    byId,
    nodeById,
    expanded,
    toggleExpand,
    expand,
    siblingsOf,
    sensors,
    handleDragEnd,
  };
}
