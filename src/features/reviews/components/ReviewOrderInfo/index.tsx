import { Copy, MapPin, Store, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { FulfillmentType } from '@/types';
import { useBranches } from '@/features/inventory';
import { useOrder, useShipment } from '@/features/orders';

/**
 * Thông tin đơn hàng gắn với một đánh giá (chỉ hiện khi review có `orderId` và
 * người dùng có quyền `orders.view`): mã đơn + copy, chi nhánh bán, nơi giao,
 * và thông tin vận chuyển. Dùng lại hook/type của feature orders qua barrel.
 */
export function ReviewOrderInfo({ orderId }: { orderId: string }) {
  const orderQuery = useOrder(orderId);
  const { data: branches } = useBranches();
  const order = orderQuery.data;
  const isDelivery = order?.fulfillment === FulfillmentType.DELIVERY;
  const shipmentQuery = useShipment(isDelivery ? orderId : undefined);

  if (orderQuery.isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (orderQuery.isError || !order) {
    return (
      <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
        Không tải được thông tin đơn hàng.
      </p>
    );
  }

  const branch = branches?.find((b) => b.id === order.branchId);
  const addr = order.shippingAddress;
  const shipment = shipmentQuery.data;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.code);
      toast.success(`Đã sao chép mã "${order.code}"`);
    } catch {
      toast.error('Không sao chép được mã');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Thông tin đơn hàng
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium">{order.code}</span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Sao chép mã đơn hàng"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>

      <Row icon={Store} label="Chi nhánh bán" value={branch?.name ?? '—'} />

      <Row icon={MapPin} label={isDelivery ? 'Giao đến' : 'Nhận hàng'}>
        {isDelivery && addr ? (
          <>
            <p className="text-sm">
              {addr.recipientName} · {addr.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              {[addr.street, addr.wardName, addr.provinceName]
                .filter(Boolean)
                .join(', ')}
            </p>
          </>
        ) : (
          <p className="text-sm">
            Nhận tại cửa hàng{branch ? ` — ${branch.name}` : ''}
          </p>
        )}
      </Row>

      <Row icon={Truck} label="Vận chuyển">
        {shipment && (shipment.carrier || shipment.trackingNo) ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">
              {shipment.carrier ?? 'Đơn vị vận chuyển'}
              {shipment.trackingNo ? ` · ${shipment.trackingNo}` : ''}
            </span>
            <StatusBadge kind="shipment" value={shipment.status} />
          </div>
        ) : isDelivery ? (
          <p className="text-sm text-muted-foreground">Chưa có vận đơn.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Không áp dụng (nhận tại cửa hàng).
          </p>
        )}
      </Row>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-inset ring-border">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? <p className="text-sm font-medium">{value}</p> : children}
      </div>
    </div>
  );
}
