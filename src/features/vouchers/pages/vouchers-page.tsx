import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { VoucherType, type BaseEntity } from '@/types';
import { Badge } from '@/components/ui/badge';
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
import { formatDate } from '@/lib/format';

// ── Types ────────────────────────────────────────────────────────────
export interface Voucher extends BaseEntity {
  code: string;
  type: VoucherType;
  value: string;
  minSubtotal?: string;
  usageLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

interface VoucherInput {
  code: string;
  type: VoucherType;
  value: string;
  minSubtotal?: string;
}

// ── API ──────────────────────────────────────────────────────────────
const vouchersApi = {
  list: () => apiClient.get<Voucher[]>('/vouchers'),
  create: (body: VoucherInput) => apiClient.post<Voucher>('/vouchers', body),
  remove: (id: string) => apiClient.delete<void>(`/vouchers/${id}`),
};

const keys = { all: ['vouchers'] as const };

function useVouchers() {
  return useQuery({ queryKey: keys.all, queryFn: () => vouchersApi.list() });
}

function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: VoucherInput) => vouchersApi.create(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success('Đã tạo mã giảm giá');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Tạo thất bại'),
  });
}

function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vouchersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success('Đã xóa mã giảm giá');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Xóa thất bại'),
  });
}

// ── Page ─────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<VoucherType, string> = {
  [VoucherType.PERCENT]: 'Phần trăm',
  [VoucherType.FIXED]: 'Số tiền',
  [VoucherType.SHIPPING]: 'Phí ship',
};

const schema = z.object({
  code: z.string().trim().min(1, 'Nhập mã'),
  type: z.nativeEnum(VoucherType),
  value: z.string().trim().min(1, 'Nhập giá trị'),
  minSubtotal: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export function VouchersPage() {
  const query = useVouchers();
  const createVoucher = useCreateVoucher();
  const deleteVoucher = useDeleteVoucher();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', type: VoucherType.PERCENT, value: '', minSubtotal: '' },
  });

  const columns: ColumnDef<Voucher>[] = [
    {
      id: 'code',
      header: 'Mã',
      cell: (v) => <span className="font-mono font-medium">{v.code}</span>,
    },
    { id: 'type', header: 'Loại', cell: (v) => TYPE_LABEL[v.type] },
    { id: 'value', header: 'Giá trị', cell: (v) => v.value },
    {
      id: 'endsAt',
      header: 'Hết hạn',
      cell: (v) => (v.endsAt ? formatDate(v.endsAt) : '—'),
    },
    {
      id: 'isActive',
      header: 'Trạng thái',
      cell: (v) =>
        v.isActive ? (
          <Badge variant="success">Kích hoạt</Badge>
        ) : (
          <Badge variant="muted">Tắt</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (v) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setToDelete(v)}
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
        title="Mã giảm giá"
        description="Quản lý mã khuyến mãi và điều kiện áp dụng."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Thêm mã
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm mã giảm giá</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) =>
                    createVoucher.mutate(
                      { ...values, minSubtotal: values.minSubtotal || undefined },
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
                    name="code"
                    label="Mã"
                    render={(f) => <Input {...f} placeholder="WELCOME15" />}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    label="Loại"
                    render={(f) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(VoucherType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    label="Giá trị"
                    render={(f) => <Input {...f} placeholder="15" />}
                  />
                  <FormField
                    control={form.control}
                    name="minSubtotal"
                    label="Đơn tối thiểu (tùy chọn)"
                    render={(f) => <Input {...f} placeholder="0" />}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={createVoucher.isPending}
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
        rowKey={(v) => v.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="Chưa có mã giảm giá"
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa mã "${toDelete?.code}"?`}
        confirmLabel="Xóa"
        loading={deleteVoucher.isPending}
        onConfirm={() =>
          toDelete &&
          deleteVoucher.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </div>
  );
}
