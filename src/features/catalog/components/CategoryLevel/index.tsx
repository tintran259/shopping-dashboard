import { Plus } from 'lucide-react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CategoryRow, ROW_INDENT } from '../CategoryRow';
import type { CategoryNode } from '../../lib/category-tree';

/**
 * Một nhóm anh-em (danh sách gốc, hoặc danh mục con của một node) — đệ quy vào
 * những node đang mở. Kèm hàng "Thêm danh mục con" sau danh sách con.
 */
export function CategoryLevel({
  parentId,
  depth,
  nodesFor,
  expanded,
  toggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  onManageAttributes,
}: {
  parentId: string | undefined;
  depth: number;
  nodesFor: (parentId: string | undefined) => CategoryNode[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: CategoryNode) => void;
  onAddChild: (parentId: string) => void;
  onManageAttributes: (node: CategoryNode) => void;
}) {
  const nodes = nodesFor(parentId);
  if (!nodes.length) return null;

  return (
    <SortableContext
      items={nodes.map((n) => n.id)}
      strategy={verticalListSortingStrategy}
    >
      {nodes.map((node) => {
        const isExpanded = expanded.has(node.id);
        return (
          <div key={node.id}>
            <CategoryRow
              node={node}
              depth={depth}
              expanded={isExpanded}
              dragDisabled={nodes.length < 2}
              onToggleExpand={() => toggleExpand(node.id)}
              onEdit={() => onEdit(node)}
              onDelete={() => onDelete(node)}
              onManageAttributes={() => onManageAttributes(node)}
            />
            {isExpanded && (
              <>
                <CategoryLevel
                  parentId={node.id}
                  depth={depth + 1}
                  nodesFor={nodesFor}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  onManageAttributes={onManageAttributes}
                />
                <button
                  type="button"
                  onClick={() => onAddChild(node.id)}
                  style={{ paddingLeft: (depth + 1) * ROW_INDENT + 12 }}
                  className="flex w-full items-center gap-2 border-b border-dashed py-2.5 pr-3 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                >
                  <Plus className="size-4" />
                  Thêm danh mục con
                </button>
              </>
            )}
          </div>
        );
      })}
    </SortableContext>
  );
}
