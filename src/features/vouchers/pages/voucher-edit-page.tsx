import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { QueryBoundary } from '@/components/shared/query-boundary';
import { ROUTES } from '@/routes/paths';
import { VOUCHER_FORM_ID, VoucherForm } from '../components/VoucherForm';
import {
  useDeleteVoucher,
  useUpdateVoucher,
} from '../hooks/use-voucher-mutations';
import { useVoucher } from '../hooks/use-vouchers';
import { formToUpdatePayload, voucherToForm } from '../lib/schema';

export function VoucherEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useVoucher(id);
  const updateVoucher = useUpdateVoucher(id ?? '');
  const deleteVoucher = useDeleteVoucher();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.vouchers)}>
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader title={query.data ? `Sửa mã "${query.data.code}"` : 'Sửa mã giảm giá'} />
        </div>
        {query.data && (
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Xóa
            </Button>
            <Button type="submit" form={VOUCHER_FORM_ID} loading={updateVoucher.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        )}
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}
      >
        {query.data && (
          <VoucherForm
            defaultValues={voucherToForm(query.data)}
            onSubmit={(values) => updateVoucher.mutate(formToUpdatePayload(values))}
          />
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title={`Xóa mã "${query.data?.code}"?`}
        description="Hành động không thể hoàn tác."
        confirmLabel="Xóa"
        loading={deleteVoucher.isPending}
        onConfirm={() =>
          id &&
          deleteVoucher.mutate(id, {
            onSuccess: () => navigate(ROUTES.vouchers),
          })
        }
      />
    </div>
  );
}
