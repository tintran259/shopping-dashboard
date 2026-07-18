import {
  ChevronRight,
  GripVertical,
  ListFilter,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { categoryAvatarClass, categoryInitial } from '../../lib/category-avatar';
import { MAX_DEPTH, productsCountRollup } from '../../lib/category-tree';
import type { CategoryNode } from '../../lib/category-tree';

/** Thụt lề mỗi cấp (px). Dùng chung với `CategoryLevel`. */
export const ROW_INDENT = 28;

export function CategoryRow({
  node,
  depth,
  expanded,
  pathLabel,
  onToggleExpand,
  onEdit,
  onDelete,
  onManageAttributes,
  dragDisabled,
}: {
  node: CategoryNode;
  depth: number;
  expanded: boolean;
  /** When set (search results), shown instead of the products/children subtitle. */
  pathLabel?: string;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageAttributes: () => void;
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id, disabled: dragDisabled });
  const canExpand = depth < MAX_DEPTH;
  const handleRowClick = canExpand ? onToggleExpand : onEdit;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: depth * ROW_INDENT,
      }}
      className={cn(
        'flex items-center gap-3 border-b bg-background py-3 pr-3 last:border-b-0',
        isDragging && 'relative z-10 shadow-md',
      )}
    >
      <button
        type="button"
        className={cn(
          'shrink-0 cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing',
          dragDisabled && 'invisible',
        )}
        aria-label="Kéo để sắp xếp"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {canExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Thu gọn' : 'Xem danh mục con'}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight
            className={cn('size-4 transition-transform', expanded && 'rotate-90')}
          />
        </button>
      )}

      <button
        type="button"
        onClick={handleRowClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {node.imageUrl ? (
          <img
            src={node.imageUrl}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              categoryAvatarClass(node.id),
            )}
          >
            {categoryInitial(node.name)}
          </span>
        )}
        <span className="min-w-0">
          <span
            className={cn(
              'block truncate font-medium',
              !node.isActive && 'text-muted-foreground',
            )}
          >
            {node.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {pathLabel ??
              `${productsCountRollup(node)} sản phẩm${node.children.length ? ` · ${node.children.length} danh mục con` : ''}`}
          </span>
        </span>
      </button>

      <Badge variant={node.isActive ? 'success' : 'muted'} className="shrink-0">
        {node.isActive ? 'Hiển thị' : 'Ẩn'}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Tùy chọn"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Sửa
          </DropdownMenuItem>
          {node.children.length === 0 && (
            <DropdownMenuItem onClick={onManageAttributes}>
              <ListFilter className="size-4" />
              Thuộc tính lọc
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
