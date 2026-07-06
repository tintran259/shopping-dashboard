import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ROUTES } from '@/app/routes';
import { VOUCHER_FORM_ID, VoucherForm } from '../components/voucher-form';
import { useCreateVoucher } from '../hooks/use-voucher-mutations';
import { emptyVoucherForm, formToCreatePayload } from '../lib/schema';

export function VoucherCreatePage() {
  const navigate = useNavigate();
  const createVoucher = useCreateVoucher();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.vouchers)}>
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader title="Thêm mã giảm giá" />
        </div>
        <Button type="submit" form={VOUCHER_FORM_ID} loading={createVoucher.isPending}>
          Tạo mã
        </Button>
      </div>

      <VoucherForm
        defaultValues={emptyVoucherForm()}
        onSubmit={(values) =>
          createVoucher.mutate(formToCreatePayload(values), {
            onSuccess: (created) => navigate(ROUTES.voucherEdit(created.id)),
          })
        }
      />
    </div>
  );
}
