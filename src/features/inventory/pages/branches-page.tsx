import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { PageHeader } from '@/components/shared/page-header';
import { usePermissions } from '@/features/auth';
import { useProvinces } from '@/features/locations';
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
} from '../hooks/use-branches';
import type { Branch } from '../types';

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên chi nhánh'),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  provinceCode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  ghnShopId: z.string().trim().optional(),
  ghtkPickupDistrict: z.string().trim().optional(),
  ghtkPickupWard: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: '',
  address: '',
  city: '',
  provinceCode: '',
  phone: '',
  ghnShopId: '',
  ghtkPickupDistrict: '',
  ghtkPickupWard: '',
};

type DialogTarget = { mode: 'create' } | { mode: 'edit'; branch: Branch };

export function BranchesPage() {
  const { can } = usePermissions();
  const canManage = can('inventory.create');
  const query = useBranches();
  const { data: provinces } = useProvinces();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!dialogTarget) return;
    if (dialogTarget.mode === 'edit') {
      const b = dialogTarget.branch;
      form.reset({
        name: b.name,
        address: b.address ?? '',
        city: b.city ?? '',
        provinceCode: b.provinceCode ?? '',
        phone: b.phone ?? '',
        ghnShopId: b.ghnShopId ?? '',
        ghtkPickupDistrict: b.ghtkPickupDistrict ?? '',
        ghtkPickupWard: b.ghtkPickupWard ?? '',
      });
    } else {
      form.reset(emptyValues);
    }
  }, [dialogTarget, form]);

  const isPending = createBranch.isPending || updateBranch.isPending;

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => setDialogTarget(null);
    if (dialogTarget?.mode === 'edit') {
      updateBranch.mutate({ id: dialogTarget.branch.id, body: values }, { onSuccess });
    } else {
      createBranch.mutate(values, { onSuccess });
    }
  };

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
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialogTarget({ mode: 'edit', branch: b })}
            aria-label="Sửa"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setToDelete(b)}
            aria-label="Xóa"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chi nhánh"
        description="Quản lý các chi nhánh/kho hàng của hệ thống."
        actions={
          canManage && (
            <Button onClick={() => setDialogTarget({ mode: 'create' })}>
              <Plus className="size-4" />
              Thêm chi nhánh
            </Button>
          )
        }
      />

      <Dialog open={!!dialogTarget} onOpenChange={(o) => !o && setDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTarget?.mode === 'edit' ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                name="provinceCode"
                label="Tỉnh/Thành (lấy hàng)"
                description="Dùng để tạo vận đơn qua GHTK."
                render={(f) => (
                  <Select
                    value={f.value ?? ''}
                    onValueChange={f.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces?.map((p) => (
                        <SelectItem key={p.code} value={String(p.code)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                label="Điện thoại"
                render={(f) => <Input {...f} />}
              />
              <FormField
                control={form.control}
                name="ghnShopId"
                label="GHN Shop ID"
                description="Mã shop trên GHN — địa chỉ lấy hàng cấu hình sẵn bên GHN theo mã này."
                render={(f) => <Input {...f} placeholder="Không bắt buộc" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ghtkPickupDistrict"
                  label="Quận/huyện lấy hàng (GHTK)"
                  render={(f) => <Input {...f} placeholder="VD: Quận Bảo Lộc" />}
                />
                <FormField
                  control={form.control}
                  name="ghtkPickupWard"
                  label="Phường/xã lấy hàng (GHTK)"
                  render={(f) => <Input {...f} placeholder="VD: Phường 1" />}
                />
              </div>
              <Button type="submit" className="w-full" loading={isPending}>
                {dialogTarget?.mode === 'edit' ? 'Lưu' : 'Tạo'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
