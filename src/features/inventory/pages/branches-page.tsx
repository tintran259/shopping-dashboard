import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  useBranches,
  useCreateBranch,
  useDeleteBranch,
} from '../hooks/use-branches';
import type { Branch } from '../types';

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên chi nhánh'),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export function BranchesPage() {
  const query = useBranches();
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '', city: '', phone: '' },
  });

  const columns: ColumnDef<Branch>[] = [
    {
      id: 'name',
      header: 'Chi nhánh',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{b.name}</span>
          {b.isDefault && <Badge variant="info">Mặc định</Badge>}
        </div>
      ),
    },
    { id: 'address', header: 'Địa chỉ', cell: (b) => b.address ?? '—' },
    { id: 'phone', header: 'Điện thoại', cell: (b) => b.phone ?? '—' },
    {
      id: 'isActive',
      header: 'Trạng thái',
      cell: (b) =>
        b.isActive ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="muted">Tạm ngưng</Badge>
        ),
    },
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
        title="Chi nhánh"
        description="Quản lý các chi nhánh/kho hàng của hệ thống."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Thêm chi nhánh
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm chi nhánh</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) =>
                    createBranch.mutate(values, {
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
                    label="Tên chi nhánh"
                    render={(f) => <Input {...f} placeholder="LATA's Đà Lạt" />}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    label="Địa chỉ"
                    render={(f) => <Input {...f} />}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    label="Thành phố"
                    render={(f) => <Input {...f} placeholder="Đà Lạt" />}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    label="Điện thoại"
                    render={(f) => <Input {...f} />}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={createBranch.isPending}
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
        emptyTitle="Chưa có chi nhánh"
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa chi nhánh "${toDelete?.name}"?`}
        confirmLabel="Xóa"
        loading={deleteBranch.isPending}
        onConfirm={() =>
          toDelete &&
          deleteBranch.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </div>
  );
}
