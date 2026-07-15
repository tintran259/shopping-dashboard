import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  MapPin,
  Receipt,
  RotateCcw,
  Store,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useBranches } from '@/features/inventory';
import {
  FulfillmentType,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  type OrderStatus as OrderStatusT,
} from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { ExpressBadge } from '../components/express-badge';
import { OrderItemsTable } from '../components/order-items-table';
import { OrderStatusStepper } from '../components/order-status-stepper';
import { ShipmentCard } from '../components/shipment-card';
import {
  useCancelOrder,
  useConfirmPayment,
  useResetShipment,
  useUpdateOrderStatus,
} from '../hooks/use-order-mutations';
import { useOrder, useShipment } from '../hooks/use-orders';
import {
  FULFILLMENT_STARTED_STATUSES,
  ORDER_CHANNEL_LABEL,
  PAYMENT_METHOD_LABEL,
  PREPAID_PAYMENT_METHODS,
  SHIPPED_OR_BEYOND_STATUSES,
  orderStatusLabel,
  orderStatusOptions,
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
          description={
            query.data
              ? `Đặt lúc ${formatDateTime(query.data.placedAt ?? query.data.createdAt)} · ${ORDER_CHANNEL_LABEL[query.data.channel]}`
              : undefined
          }
          actions={<ExpressBadge method={query.data?.shippingMethod} />}
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
  const resetShipment = useResetShipment(order.id);
  const { data: branches } = useBranches();

  const isDelivery = order.fulfillment === FulfillmentType.DELIVERY;
  // Shares the ShipmentCard's cached query (React Query dedupes), so surfacing
  // the shipment status in the sidebar summary costs no extra request.
  const shipmentQuery = useShipment(isDelivery ? order.id : undefined);
  const shipment = shipmentQuery.data;

  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isPaid = order.paymentStatus === PaymentStatus.PAID;
  const isShippedOrBeyond = SHIPPED_OR_BEYOND_STATUSES.has(order.status);
  // Vận chuyển gặp trục trặc: hoàn hàng (giao thất bại, hàng về) hoặc sự cố
  // (hủy/mất/hư/không lấy được). Đơn vẫn ở order status 'shipped' — admin chọn
  // Giao lại (về processing) hoặc Hủy (BE cho hủy đơn shipped khi shipment ở
  // RETURNED/PROBLEM).
  const shipmentReturned = shipment?.status === ShipmentStatus.RETURNED;
  const shipmentProblem = shipment?.status === ShipmentStatus.PROBLEM;
  const shipmentPickupFailed = shipment?.status === ShipmentStatus.PICKUP_FAILED;
  const shipmentFailed = shipmentReturned || shipmentProblem || shipmentPickupFailed;
  const isPrepaid =
    !!order.paymentMethodCode &&
    PREPAID_PAYMENT_METHODS.has(order.paymentMethodCode);
  const awaitingPrepayment = isPrepaid && !isPaid;
  const needsRefund = isCancelled && isPaid;
  const addr = order.shippingAddress;
  const branch = branches?.find((b) => b.id === order.branchId);

  return (
    <div className="space-y-6">
      <OrderStatusStepper order={order} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Cột chính: sản phẩm + vận chuyển */}
        <main className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <OrderItemsTable items={order.items} />
            </CardContent>
            <CardContent className="space-y-2 border-t pt-4 text-sm">
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

          {isDelivery && <ShipmentCard order={order} />}
        </main>

        {/* Sidebar dính: tóm tắt · thao tác · khách hàng · địa chỉ */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="space-y-4 py-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tổng cộng</p>
                <p className="text-2xl font-semibold tabular-nums text-primary">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Thanh toán</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {order.paymentMethodCode
                        ? PAYMENT_METHOD_LABEL[order.paymentMethodCode]
                        : '—'}
                    </span>
                    <StatusBadge kind="payment" value={order.paymentStatus} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Vận chuyển</span>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <ExpressBadge method={order.shippingMethod} />
                    {!isDelivery ? (
                      <span className="text-sm text-muted-foreground">Nhận tại cửa hàng</span>
                    ) : shipment ? (
                      <StatusBadge kind="shipment" value={shipment.status} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa tạo</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Tồn kho</span>
                  <StatusBadge kind="stock" value={order.stockStatus} />
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cập nhật trạng thái đơn</label>
                <Select
                  value={order.status}
                  disabled={isCancelled || updateStatus.isPending}
                  onValueChange={(v) => updateStatus.mutate(v as OrderStatusT)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatusOptions(order.fulfillment).map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        disabled={
                          awaitingPrepayment &&
                          s !== OrderStatus.CANCELLED &&
                          FULFILLMENT_STARTED_STATUSES.has(s)
                        }
                      >
                        {orderStatusLabel(s, order.fulfillment)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hệ thống kiểm tra tính hợp lệ của bước chuyển & tự động cập nhật tồn kho.
                </p>
              </div>

              {awaitingPrepayment && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Đơn thanh toán trước ({PAYMENT_METHOD_LABEL[order.paymentMethodCode!]}) chưa
                  được xác nhận — cần xác nhận thanh toán trước khi xử lý đơn.
                </p>
              )}
              {needsRefund && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Đơn đã hủy nhưng khách đã thanh toán — cần hoàn tiền thủ công.
                </p>
              )}
              {shipmentFailed && !isCancelled && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {shipmentPickupFailed ? (
                    <>Không lấy được hàng — hàng chưa rời kho.</>
                  ) : shipmentProblem ? (
                    <>Vận chuyển gặp sự cố — cần kiểm tra.</>
                  ) : (
                    <>Giao thất bại — hàng đang hoàn về.</>
                  )}{' '}
                  <strong>Giao lại</strong> để giao tiếp, hoặc <strong>Hủy đơn</strong> (tồn
                  kho được hoàn, hoàn tiền nếu đã thanh toán).
                </p>
              )}

              <div className="space-y-2">
                {shipmentFailed && !isCancelled && (
                  <Button
                    className="w-full"
                    loading={updateStatus.isPending || resetShipment.isPending}
                    onClick={() => {
                      updateStatus.mutate(OrderStatus.PROCESSING);
                      resetShipment.mutate();
                    }}
                  >
                    <RotateCcw className="size-4" />
                    Giao lại
                  </Button>
                )}
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
                  disabled={isCancelled || (isShippedOrBeyond && !shipmentFailed)}
                  onClick={() => setCancelOpen(true)}
                >
                  <Ban className="size-4" />
                  Hủy đơn hàng
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <User className="size-4" /> Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-0.5">
                <p className="font-medium">{order.recipientName}</p>
                <p className="text-muted-foreground">{order.recipientPhone}</p>
                {order.recipientEmail && (
                  <p className="text-muted-foreground">{order.recipientEmail}</p>
                )}
              </div>
              {order.customerId && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={ROUTES.customerDetail(order.customerId)}>
                    Xem hồ sơ khách hàng
                  </Link>
                </Button>
              )}
              {order.notes && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Ghi chú đơn</p>
                  <p className="mt-0.5">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isDelivery ? 'Địa chỉ' : 'Nhận hàng'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {isDelivery && addr && (
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Giao đến</p>
                    <p>
                      {addr.street}, {addr.wardName}, {addr.provinceName}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Store className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {isDelivery ? 'Chi nhánh bán' : 'Nhận tại chi nhánh'}
                  </p>
                  <p className="font-medium">{branch?.name ?? '—'}</p>
                  {branch?.address && (
                    <p className="text-muted-foreground">{branch.address}</p>
                  )}
                  {branch?.phone && (
                    <p className="text-muted-foreground">{branch.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {order.invoice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Receipt className="size-4" /> Hóa đơn VAT (B2B)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Công ty" value={order.invoice.companyName} />
                <InfoRow label="MST" value={order.invoice.taxCode} />
                <InfoRow label="Địa chỉ" value={order.invoice.address} />
                <InfoRow label="Email" value={order.invoice.email} />
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <Button variant="link" asChild className="px-0">
        <Link to={ROUTES.orders}>← Quay lại danh sách</Link>
      </Button>

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
        className={cn(
          'tabular-nums',
          emphasize && 'text-base font-semibold text-primary',
        )}
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
    <div className="space-y-6">
      <Skeleton className="h-6 w-40 rounded-md" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
