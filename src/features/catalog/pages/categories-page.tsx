import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  GripVertical,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormField } from '@/components/shared/form-field';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryAttributesDialog } from '../components/category-attributes-dialog';
import { SingleImageUpload } from '../components/image-upload';
import { cn } from '@/lib/utils';
import { categoryAvatarClass, categoryInitial } from '../lib/category-avatar';
import {
  buildCategoryTree,
  categoryDepth,
  categoryPath,
  isSelfOrDescendant,
  MAX_DEPTH,
  productsCountRollup,
  type CategoryNode,
} from '../lib/category-tree';
import { slugify } from '../lib/product-schema';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from '../hooks/use-catalog-refs';
import type { Category } from '../types';

const NO_PARENT = '__root__';
const ROW_INDENT = 28;

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ'),
  description: z.string().trim().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string(),
  isActive: z.boolean(),
  metaTitle: z.string().trim().max(70, 'Tối đa 70 ký tự').optional(),
  metaDescription: z.string().trim().max(160, 'Tối đa 160 ký tự').optional(),
});
type FormValues = z.infer<typeof schema>;

type DialogTarget =
  | { mode: 'create'; parentId?: string }
  | { mode: 'edit'; category: Category };

function CategoryRow({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: dragDisabled,
  });
  const canExpand = depth < MAX_DEPTH;
  const handleRowClick = canExpand ? onToggleExpand : onEdit;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, paddingLeft: depth * ROW_INDENT }}
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
          <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
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
          <span className={cn('block truncate font-medium', !node.isActive && 'text-muted-foreground')}>
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
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Tùy chọn">
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
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="size-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** One sibling group (root list, or one node's children) — recurses into
 *  whichever of its members are currently expanded. */
function CategoryLevel({
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
    <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
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

export function CategoriesPage() {
  const query = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const reorderCategories = useReorderCategories();
  const deleteCategory = useDeleteCategory();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [dragOverride, setDragOverride] = useState<{ key: string; order: string[] } | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [attributesTarget, setAttributesTarget] = useState<CategoryNode | null>(null);

  const categories = useMemo(() => query.data ?? [], [query.data]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
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
    const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: NO_PARENT,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
    },
  });

  useEffect(() => {
    if (!dialogTarget) return;
    if (dialogTarget.mode === 'edit') {
      const c = dialogTarget.category;
      form.reset({
        name: c.name,
        slug: c.slug,
        description: c.description ?? '',
        imageUrl: c.imageUrl ?? '',
        parentId: c.parentId ?? NO_PARENT,
        isActive: c.isActive,
        metaTitle: c.seo?.metaTitle ?? '',
        metaDescription: c.seo?.metaDescription ?? '',
      });
      setSeoOpen(!!(c.seo?.metaTitle || c.seo?.metaDescription));
    } else {
      setSeoOpen(false);
      form.reset({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        parentId: dialogTarget.parentId ?? NO_PARENT,
        isActive: true,
        metaTitle: '',
        metaDescription: '',
      });
    }
  }, [dialogTarget, form]);

  const editingId = dialogTarget?.mode === 'edit' ? dialogTarget.category.id : undefined;

  // Cấp cha hợp lệ: chưa ở cấp sâu nhất, và (khi sửa) không phải chính nó/hậu duệ của nó.
  const parentOptions = categories.filter((c) => {
    if (categoryDepth(c.id, byId) >= MAX_DEPTH) return false;
    if (editingId && isSelfOrDescendant(c.id, editingId, byId)) return false;
    return true;
  });

  const isPending = createCategory.isPending || updateCategory.isPending;

  const onSubmit = (values: FormValues) => {
    // `null` (not `undefined`) so "— Danh mục gốc —" actually clears an
    // existing parent — JSON.stringify drops `undefined` keys entirely, so
    // the BE would never see the field and would leave the old parent as-is.
    const parentId = values.parentId === NO_PARENT ? null : values.parentId;
    const hasSeo = !!(values.metaTitle || values.metaDescription);
    const body = {
      name: values.name,
      slug: values.slug,
      description: values.description || undefined,
      imageUrl: values.imageUrl || undefined,
      parentId,
      isActive: values.isActive,
      // `null` (not `undefined`) so clearing both SEO fields actually clears
      // an existing `seo` value on update — same JSON.stringify gotcha as parentId.
      seo: hasSeo
        ? { metaTitle: values.metaTitle || undefined, metaDescription: values.metaDescription || undefined }
        : null,
    };
    const onSuccess = () => {
      setDialogTarget(null);
      // Mở sẵn danh mục cha để thấy ngay danh mục con vừa tạo.
      if (dialogTarget?.mode === 'create' && parentId) {
        setExpanded((prev) => new Set(prev).add(parentId));
      }
    };
    if (dialogTarget?.mode === 'edit') {
      updateCategory.mutate({ id: dialogTarget.category.id, body }, { onSuccess });
    } else {
      createCategory.mutate(body, { onSuccess });
    }
  };

  const openAddChild = (parentId?: string) => setDialogTarget({ mode: 'create', parentId });

  const searching = search.trim().length > 0;
  const searchResults = searching
    ? categories
      .filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
      .map((c) => nodeById.get(c.id))
      .filter((n): n is CategoryNode => !!n)
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nhóm sản phẩm"
        description="Cây danh mục tối đa 3 cấp — bấm vào một danh mục để xem/thêm danh mục con bên dưới."
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm danh mục…"
          className="pl-8"
        />
      </div>

      <div className="rounded-lg border">
        {query.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Đang tải…</p>
        ) : searching ? (
          searchResults.length ? (
            searchResults.map((node) => (
              <CategoryRow
                key={node.id}
                node={node}
                depth={0}
                expanded={false}
                dragDisabled
                pathLabel={categoryPath(node.id, byId)}
                onToggleExpand={() => setDialogTarget({ mode: 'edit', category: node })}
                onEdit={() => setDialogTarget({ mode: 'edit', category: node })}
                onDelete={() => setToDelete(node)}
                onManageAttributes={() => setAttributesTarget(node)}
              />
            ))
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Không tìm thấy danh mục phù hợp.</p>
          )
        ) : tree.length ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <CategoryLevel
              parentId={undefined}
              depth={0}
              nodesFor={siblingsOf}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onEdit={(node) => setDialogTarget({ mode: 'edit', category: node })}
              onDelete={(node) => setToDelete(node)}
              onAddChild={openAddChild}
              onManageAttributes={(node) => setAttributesTarget(node)}
            />
          </DndContext>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Chưa có danh mục nào.</p>
        )}

        {!searching && (
          <button
            type="button"
            onClick={() => openAddChild(undefined)}
            className="flex w-full items-center justify-center gap-2 border-t border-dashed py-3 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          >
            <Plus className="size-4" />
            Thêm danh mục
          </button>
        )}
      </div>

      <Dialog open={!!dialogTarget} onOpenChange={(o) => !o && setDialogTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogTarget?.mode === 'edit' ? 'Sửa danh mục' : 'Thêm danh mục'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form id="category-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Ảnh đại diện cạnh tên/slug — nhóm 3 trường "định danh" của danh
                  mục vào cùng một hàng, thay vì xếp dọc từng ô như trước. */}
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  className="shrink-0"
                  render={(f) => <SingleImageUpload value={f.value ?? ''} onChange={f.onChange} size="sm" />}
                />
                <div className="flex-1 space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    label="Tên"
                    render={(f) => (
                      <Input
                        {...f}
                        placeholder="Đặc sản Đà Lạt"
                        onChange={(e) => {
                          f.onChange(e);
                          if (dialogTarget?.mode !== 'edit') {
                            form.setValue('slug', slugify(e.target.value), { shouldValidate: false });
                          }
                        }}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    render={(f) => (
                      <div className="flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring">
                        <span className="shrink-0 pl-3 text-sm text-muted-foreground">/c/</span>
                        <Input
                          {...f}
                          placeholder="dac-san-da-lat"
                          className="border-0 focus-visible:ring-0"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentId"
                  label="Danh mục cha"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>— Danh mục gốc —</SelectItem>
                        {parentOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  label="Trạng thái"
                  render={(f) => (
                    <div className="flex gap-2">
                      {(
                        [
                          { value: true, label: 'Hiển thị' },
                          { value: false, label: 'Ẩn' },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={String(opt.value)}
                          className={cn(
                            'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-sm transition-colors',
                            f.value === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                          )}
                        >
                          <input
                            type="radio"
                            className="size-3.5"
                            checked={f.value === opt.value}
                            onChange={() => f.onChange(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                label="Mô tả"
                render={(f) => <Textarea {...f} rows={3} placeholder="Mô tả danh mục…" />}
              />

              <div className="rounded-md border">
                <button
                  type="button"
                  onClick={() => setSeoOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
                >
                  Cài đặt SEO (tùy chọn)
                  <ChevronRight className={cn('size-4 transition-transform', seoOpen && 'rotate-90')} />
                </button>
                {seoOpen && (
                  <div className="space-y-3 border-t p-3">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      label="Meta title"
                      description="Tối đa 70 ký tự — hiển thị trên tab trình duyệt/kết quả tìm kiếm."
                      render={(f) => <Input {...f} placeholder="Để trống = dùng tên danh mục" />}
                    />
                    <FormField
                      control={form.control}
                      name="metaDescription"
                      label="Meta description"
                      description="Tối đa 160 ký tự — đoạn mô tả hiển thị dưới tiêu đề trên Google."
                      render={(f) => <Textarea {...f} rows={2} placeholder="Để trống = dùng mô tả danh mục" />}
                    />
                  </div>
                )}
              </div>
            </form>
          </Form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTarget(null)}>
              Hủy
            </Button>
            <Button type="submit" form="category-form" loading={isPending}>
              {dialogTarget?.mode === 'edit' ? 'Lưu' : 'Tạo danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa danh mục "${toDelete?.name}"?`}
        description={
          toDelete?.children.length
            ? `${toDelete.children.length} danh mục con sẽ chuyển thành danh mục gốc.`
            : undefined
        }
        confirmLabel="Xóa"
        loading={deleteCategory.isPending}
        onConfirm={() =>
          toDelete &&
          deleteCategory.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />

      <CategoryAttributesDialog
        category={attributesTarget}
        onOpenChange={(o) => !o && setAttributesTarget(null)}
      />
    </div>
  );
}
