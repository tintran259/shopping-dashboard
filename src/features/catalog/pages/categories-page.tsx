import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { PageHeader } from '@/components/shared/page-header';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from '../hooks/use-catalog-refs';
import type { Category } from '../types';

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ'),
  description: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CategoriesPage() {
  const query = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const columns: ColumnDef<Category>[] = [
    {
      id: 'name',
      header: 'Tên',
      cell: (c) => <span className="font-medium">{c.name}</span>,
    },
    { id: 'slug', header: 'Slug', cell: (c) => c.slug },
    {
      id: 'isActive',
      header: 'Trạng thái',
      cell: (c) =>
        c.isActive ? (
          <Badge variant="success">Hiển thị</Badge>
        ) : (
          <Badge variant="muted">Ẩn</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (c) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setToDelete(c)}
          aria-label="Xóa"
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm sản phẩm"
        description="Quản lý danh mục phân loại sản phẩm."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Thêm nhóm
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm nhóm sản phẩm</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) =>
                    createCategory.mutate(values, {
                      onSuccess: () => {
                        setDialogOpen(false);
                        form.reset();
                      },
                    }),
                  )}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    label="Tên"
                    render={(f) => <Input {...f} placeholder="Đặc sản Đà Lạt" />}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    render={(f) => <Input {...f} placeholder="dac-san-da-lat" />}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    label="Mô tả"
                    render={(f) => <Input {...f} />}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={createCategory.isPending}
                  >
                    Tạo
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={query.data}
        rowKey={(c) => c.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="Chưa có nhóm sản phẩm"
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa nhóm "${toDelete?.name}"?`}
        confirmLabel="Xóa"
        loading={deleteCategory.isPending}
        onConfirm={() =>
          toDelete &&
          deleteCategory.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </div>
  );
}
