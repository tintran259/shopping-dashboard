import { useMemo, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryAttributesDialog } from '../components/CategoryAttributesDialog';
import { CategoryFormDialog } from '../components/CategoryFormDialog';
import { CategoryLevel } from '../components/CategoryLevel';
import { CategoryRow } from '../components/CategoryRow';
import { useCategoryTree } from '../hooks/use-category-tree';
import {
  NO_PARENT,
  type CategoryDialogTarget,
  type CategoryFormValues,
} from '../lib/category-schema';
import {
  categoryDepth,
  categoryPath,
  isSelfOrDescendant,
  MAX_DEPTH,
  type CategoryNode,
} from '../lib/category-tree';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/use-catalog-refs';

export function CategoriesPage() {
  const query = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = useMemo(() => query.data ?? [], [query.data]);
  const { tree, byId, nodeById, expanded, toggleExpand, expand, siblingsOf, sensors, handleDragEnd } =
    useCategoryTree(categories);

  const [search, setSearch] = useState('');
  const [dialogTarget, setDialogTarget] = useState<CategoryDialogTarget | null>(null);
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [attributesTarget, setAttributesTarget] = useState<CategoryNode | null>(null);

  const editingId = dialogTarget?.mode === 'edit' ? dialogTarget.category.id : undefined;

  // Cấp cha hợp lệ: chưa ở cấp sâu nhất, và (khi sửa) không phải chính nó/hậu duệ của nó.
  const parentOptions = categories.filter((c) => {
    if (categoryDepth(c.id, byId) >= MAX_DEPTH) return false;
    if (editingId && isSelfOrDescendant(c.id, editingId, byId)) return false;
    return true;
  });

  const isPending = createCategory.isPending || updateCategory.isPending;

  const onSubmit = (values: CategoryFormValues) => {
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
        ? {
            metaTitle: values.metaTitle || undefined,
            metaDescription: values.metaDescription || undefined,
          }
        : null,
    };
    const onSuccess = () => {
      setDialogTarget(null);
      // Mở sẵn danh mục cha để thấy ngay danh mục con vừa tạo.
      if (dialogTarget?.mode === 'create' && parentId) expand(parentId);
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
            <p className="p-6 text-sm text-muted-foreground">
              Không tìm thấy danh mục phù hợp.
            </p>
          )
        ) : tree.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
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

      <CategoryFormDialog
        target={dialogTarget}
        parentOptions={parentOptions}
        loading={isPending}
        onOpenChange={(o) => !o && setDialogTarget(null)}
        onSubmit={onSubmit}
      />

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
