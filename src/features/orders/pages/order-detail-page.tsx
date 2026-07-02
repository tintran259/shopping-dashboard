import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { QueryBoundary } from '@/components/shared/query-boundary';
import { StatusBadge } from '@/components/shared/status-badge';
import { OrderStatus, PaymentStatus, type OrderStatus as OrderStatusT } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { OrderItemsTable } from '../components/order-items-table';
import {
  useCancelOrder,
  useConfirmPayment,
  useUpdateOrderStatus,
} from '../hooks/use-order-mutations';
import { useOrder } from '../hooks/use-orders';
import {
  FULFILLMENT_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
} from '../lib/labels';
import type { Order } from '../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useOrder(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.orders)}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title={query.data ? `Đơn ${query.data.code}` : 'Chi tiết đơn hàng'}
        />
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        fallback={<OrderDetailSkeleton />}
      >
        {query.data && <OrderDetailContent order={query.data} />}
      </QueryBoundary>
    </div>
  );
}

function OrderDetailContent({ order }: { order: Order }) {
  const [cancelOpen, setCancelOpen] = useState(false);

  const updateStatus = useUpdateOrderStatus(order.id);
  const confirmPayment = useConfirmPayment(order.id);
  const cancelOrder = useCancelOrder(order.id);

  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const isPaid = order.paymentStatus === PaymentStatus.PAID;
  const addr = order.shippingAddress;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Cột trái: sản phẩm + tổng tiền */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OrderItemsTable items={order.items} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow label="Tạm tính" value={formatCurrency(order.subtotal)} />
            <SummaryRow
              label="Phí vận chuyển"
              value={formatCurrency(order.shippingFee)}
            />
            <SummaryRow
              label={`Giảm giá${order.voucherCode ? ` (${order.voucherCode})` : ''}`}
              value={`- ${formatCurrency(order.discountTotal)}`}
            />
            <Separator className="my-2" />
            <SummaryRow
              label="Tổng cộng"
              value={formatCurrency(order.grandTotal)}
              emphasize
            />
          </CardContent>
        </Card>
      </div>

      {/* Cột phải: hành động + thông tin */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Xử lý đơn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="order" value={order.status} />
              <StatusBadge kind="payment" value={order.paymentStatus} />
              <StatusBadge kind="stock" value={order.stockStatus} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cập nhật trạng thái</label>
              <Select
                value={order.status}
                disabled={isCancelled || updateStatus.isPending}
                onValueChange={(v) => updateStatus.mutate(v as OrderStatusT)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Hệ thống (BE) sẽ kiểm tra tính hợp lệ của bước chuyển & tự động
                cập nhật tồn kho.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                loading={confirmPayment.isPending}
                disabled={isPaid || isCancelled}
                onClick={() => confirmPayment.mutate()}
              >
                <BadgeCheck className="size-4" />
                {isPaid ? 'Đã thanh toán' : 'Xác nhận thanh toán'}
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                disabled={isCancelled || isDelivered}
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="size-4" />
                Hủy đơn hàng
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Mã đơn" value={order.code} />
            <InfoRow
              label="Đặt lúc"
              value={formatDateTime(order.placedAt ?? order.createdAt)}
            />
            <InfoRow
              label="Hình thức"
              value={FULFILLMENT_LABEL[order.fulfillment]}
            />
            <InfoRow
              label="Phương thức TT"
              value={
                order.paymentMethodCode
                  ? PAYMENT_METHOD_LABEL[order.paymentMethodCode]
                  : '—'
              }
            />
            {order.notes && <InfoRow label="Ghi chú" value={order.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Người nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.recipientName}</p>
            <p className="text-muted-foreground">{order.recipientPhone}</p>
            {order.recipientEmail && (
              <p className="text-muted-foreground">{order.recipientEmail}</p>
            )}
            {addr && (
              <p className="pt-1 text-muted-foreground">
                {addr.street}, {addr.wardName}, {addr.provinceName}
              </p>
            )}
          </CardContent>
        </Card>

        {order.invoice && (
          <Card>
            <CardHeader>
              <CardTitle>Hóa đơn VAT (B2B)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <InfoRow label="Công ty" value={order.invoice.companyName} />
              <InfoRow label="MST" value={order.invoice.taxCode} />
              <InfoRow label="Địa chỉ" value={order.invoice.address} />
              <InfoRow label="Email" value={order.invoice.email} />
            </CardContent>
          </Card>
        )}

        <Button variant="link" asChild className="px-0">
          <Link to={ROUTES.orders}>← Quay lại danh sách</Link>
        </Button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        destructive
        title={`Hủy đơn ${order.code}?`}
        description="Chỉ hủy được khi đơn chưa giao. Tồn kho sẽ được hoàn/điều chỉnh tự động bởi hệ thống."
        confirmLabel="Hủy đơn"
        cancelLabel="Không"
        loading={cancelOrder.isPending}
        onConfirm={() =>
          cancelOrder.mutate(undefined, {
            onSuccess: () => setCancelOpen(false),
          })
        }
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={emphasize ? 'font-medium' : 'text-muted-foreground'}>
        {label}
      </span>
      <span
        className={
          emphasize
            ? 'text-base font-semibold tabular-nums text-primary'
            : 'tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
