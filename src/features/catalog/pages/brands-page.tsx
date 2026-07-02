import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus, Tag, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { PageHeader } from '@/components/shared/page-header';
import {
  useBrands,
  useCreateBrand,
  useDeleteBrand,
} from '../hooks/use-catalog-refs';
import type { Brand } from '../types';

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ'),
  logoUrl: z.string().trim().url('URL không hợp lệ').or(z.literal('')).optional(),
});
type FormValues = z.infer<typeof schema>;

export function BrandsPage() {
  const query = useBrands();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Brand | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', logoUrl: '' },
  });

  const columns: ColumnDef<Brand>[] = [
    {
      id: 'logo',
      header: '',
      className: 'w-12',
      cell: (b) => (
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {b.logoUrl ? (
            <img src={b.logoUrl} alt={b.name} className="size-full object-contain" />
          ) : (
            <Tag className="size-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      id: 'name',
      header: 'Tên',
      cell: (b) => <span className="font-medium">{b.name}</span>,
    },
    { id: 'slug', header: 'Slug', cell: (b) => b.slug },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (b) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setToDelete(b)}
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
        title="Thương hiệu"
        description="Quản lý thương hiệu/nhà cung cấp sản phẩm."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Thêm thương hiệu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm thương hiệu</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) =>
                    createBrand.mutate(
                      { ...values, logoUrl: values.logoUrl || undefined },
                      {
                        onSuccess: () => {
                          setDialogOpen(false);
                          form.reset();
                        },
                      },
                    ),
                  )}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    label="Tên"
                    render={(f) => <Input {...f} placeholder="LATA's" />}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    render={(f) => <Input {...f} placeholder="lata-s" />}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    label="Logo (URL)"
                    render={(f) => <Input {...f} placeholder="https://…" />}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={createBrand.isPending}
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
        rowKey={(b) => b.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="Chưa có thương hiệu"
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa thương hiệu "${toDelete?.name}"?`}
        confirmLabel="Xóa"
        loading={deleteBrand.isPending}
        onConfirm={() =>
          toDelete &&
          deleteBrand.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </div>
  );
}
