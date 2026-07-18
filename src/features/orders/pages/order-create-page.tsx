import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ROUTES } from '@/routes/paths';
import { ORDER_FORM_ID, OrderCreateForm } from '../components/OrderCreateForm';
import { useCreateOrder } from '../hooks/use-order-mutations';
import { formToCreateOrderInput } from '../lib/order-schema';

export function OrderCreatePage() {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.orders)}>
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader
            title="Tạo đơn hàng"
            description="Nhập thông tin đơn hàng thay khách (điện thoại, tại quầy…)."
          />
        </div>
        {/* Submit từ ngoài form qua thuộc tính form={id} — nút luôn ở góc phải trên. */}
        <Button type="submit" form={ORDER_FORM_ID} loading={createOrder.isPending}>
          Tạo đơn hàng
        </Button>
      </div>

      <OrderCreateForm
        onSubmit={(values) =>
          createOrder.mutate(formToCreateOrderInput(values), {
            onSuccess: (created) => navigate(ROUTES.orderDetail(created.id)),
          })
        }
      />
    </div>
  );
}
