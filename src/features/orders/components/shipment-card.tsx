import { useEffect, useState } from 'react';
import { AlertTriangle, Check, FlaskConical, Printer, X, type LucideIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Form } from '@/components/ui/form';
import { OrderStatus, PaymentMethodCode, PaymentStatus, ShipmentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { CarrierLogo } from './carrier-logo';
import { CreateShipmentDialog } from './create-shipment-dialog';
import { isApiIntegratedCarrier } from '../lib/carrier-brand';
import {
  useGetShipmentLabel,
  useResetShipment,
  useSimulateCarrierWebhook,
  useUpdateOrderStatus,
  useUpsertShipment,
} from '../hooks/use-order-mutations';
import { useShipment } from '../hooks/use-orders';
import {
  CARRIER_PRESETS,
  FULFILLMENT_STARTED_STATUSES,
  MOCK_WEBHOOK_STATUS_OPTIONS,
  QUICK_PICK_CARRIERS,
  SELF_DELIVERY_CARRIER,
} from '../lib/labels';
import type { Order, Shipment } from '../types';

const schema = z.object({
  carrierPreset: z.string(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULT_CARRIER = 'GHTK';

function valuesFromShipment(shipment: Shipment | null | undefined): FormValues {
  const carrier = shipment?.carrier ?? '';
  const isPreset = (CARRIER_PRESETS as readonly string[]).includes(carrier);
  return {
    // Default to GHTK when no carrier is set yet — it's the only integrated carrier.
    carrierPreset: carrier && isPreset ? carrier : DEFAULT_CARRIER,
  };
}

/** Shipment section — only rendered for delivery orders once fulfilment has
 *  started (see `order-detail-page.tsx`).
 *
 *  Two carriers available:
 *  - "Tự giao" (self-delivery): only the carrier choice is saved — no tracking/fee/status.
 *  - GHTK: explicit "Tạo vận đơn" button calls GHTK's real API; tracking no, fee, and
 *    status are then auto-populated by their webhook — not manually entered. */
export function ShipmentCard({ order }: { order: Order }) {
  const orderId = order.id;
  const orderStatus = order.status;
  const query = useShipment(orderId);
  const upsert = useUpsertShipment(orderId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditingCarrier, setIsEditingCarrier] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFromShipment(undefined),
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(valuesFromShipment(query.data));
    setIsEditingCarrier(!query.data?.carrier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, query.isLoading]);

  const carrierPreset = form.watch('carrierPreset');
  const shipment = query.data;
  const effectiveCarrier = carrierPreset;
  const isSelfDelivery = effectiveCarrier === SELF_DELIVERY_CARRIER;
  const isApiCarrier = isApiIntegratedCarrier(effectiveCarrier);
  const hasAutoTracking =
    isApiCarrier && !!shipment?.trackingNo && shipment.carrier === effectiveCarrier;
  const isShipmentDone =
    shipment?.status === ShipmentStatus.DELIVERED ||
    shipment?.status === ShipmentStatus.RETURNED;

  const onSubmit = (values: FormValues) => {
    const carrier = values.carrierPreset || undefined;
    upsert.mutate({ carrier });
  };

  if (query.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vận chuyển</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!FULFILLMENT_STARTED_STATUSES.has(orderStatus)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vận chuyển</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chọn đơn vị vận chuyển sẽ hiển thị khi đơn được chuyển sang{' '}
            <span className="font-medium text-foreground">"Đang xử lý"</span>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vận chuyển</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditingCarrier && shipment?.carrier && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CarrierLogo carrier={shipment.carrier} />
              {shipment.carrier}
            </div>
            {!isShipmentDone && (
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setIsEditingCarrier(true)}
              >
                Đổi đơn vị vận chuyển
              </button>
            )}
          </div>
        )}

        {isEditingCarrier && !isShipmentDone ? (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PICK_CARRIERS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      size="sm"
                      variant={carrierPreset === c ? 'default' : 'outline'}
                      onClick={() =>
                        form.setValue('carrierPreset', c, { shouldDirty: true })
                      }
                    >
                      <CarrierLogo carrier={c} />
                      {c}
                    </Button>
                  ))}
                </div>
              </div>

              {isSelfDelivery && (
                <Button type="submit" className="w-full" loading={upsert.isPending}>
                  {shipment?.carrier === SELF_DELIVERY_CARRIER ? 'Đã lưu' : 'Xác nhận tự giao'}
                </Button>
              )}

              {!isSelfDelivery && isApiCarrier && (
                <div className="space-y-3">
                  {hasAutoTracking ? (
                    <CarrierAutoPanel
                      carrier={effectiveCarrier!}
                      shipment={shipment!}
                      order={order}
                    />
                  ) : (
                    effectiveCarrier === 'GHTK' && (
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        Tạo vận đơn GHTK
                      </Button>
                    )
                  )}
                </div>
              )}
            </form>
          </Form>
        ) : (
          <>
            {!isSelfDelivery && isApiCarrier && hasAutoTracking && (
              <CarrierAutoPanel
                carrier={effectiveCarrier!}
                shipment={shipment!}
                order={order}
              />
            )}
            {!isSelfDelivery && isApiCarrier && !hasAutoTracking && shipment?.carrier && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Đã chọn {shipment.carrier} — chưa tạo vận đơn.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Tạo vận đơn {shipment.carrier}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {effectiveCarrier === 'GHTK' && (
        <CreateShipmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          order={order}
        />
      )}
    </Card>
  );
}

/** `Order.status` and `Shipment.status` are deliberately independent state
 *  machines — only `Order.status` drives stock commit/COD auto-confirm, so a
 *  carrier webhook never touches it directly. That leaves a real UX gap though:
 *  once the webhook reports "đang giao"/"đã giao", nothing tells the admin the
 *  order's own status hasn't caught up yet. Suggests (never forces) advancing it
 *  — only forward, only while the order hasn't already reached that stage. */
function suggestedOrderStatusFromShipment(
  shipmentStatus: Shipment['status'],
  orderStatus: OrderStatus,
): OrderStatus | null {
  if (shipmentStatus === ShipmentStatus.DELIVERED && orderStatus !== OrderStatus.DELIVERED) {
    return OrderStatus.DELIVERED;
  }
  if (
    (shipmentStatus === ShipmentStatus.SHIPPED ||
      shipmentStatus === ShipmentStatus.IN_TRANSIT) &&
    orderStatus === OrderStatus.PROCESSING
  ) {
    return OrderStatus.SHIPPED;
  }
  return null;
}

/** Read-only display for a carrier whose real API already created the shipment —
 *  tracking no/fee/status are kept in sync by its webhook. The timeline shows
 *  progress at a glance; problem/return warnings prompt the admin to act. */
function CarrierAutoPanel({
  carrier,
  shipment,
  order,
}: {
  carrier: string;
  shipment: Shipment;
  order: Order;
}) {
  const updateStatus = useUpdateOrderStatus(order.id);
  const resetShipment = useResetShipment(order.id);
  const printLabel = useGetShipmentLabel(order.id);
  const suggestedStatus = suggestedOrderStatusFromShipment(shipment.status, order.status);

  const handleRedeliver = () => {
    // Fire both in parallel — neither depends on the other, and running them
    // sequentially causes a race: updateStatus.onSettled invalidates ['orders']
    // (which is a key prefix of the shipment query) triggering a stale refetch
    // that can overwrite the reset result before it arrives.
    updateStatus.mutate(OrderStatus.PROCESSING);
    resetShipment.mutate();
  };
  const isRedelivering = updateStatus.isPending || resetShipment.isPending;
  const isCodUnpaid =
    order.paymentMethodCode === PaymentMethodCode.COD && order.paymentStatus !== PaymentStatus.PAID;

  return (
    <div className="space-y-4 rounded-md border p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <CarrierLogo carrier={carrier} className="size-6" />
          {carrier}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={printLabel.isPending}
          onClick={() =>
            printLabel.mutate(undefined, {
              onSuccess: (html) => {
                const win = window.open('', '_blank', 'width=700,height=600');
                if (win) {
                  win.document.open();
                  win.document.write(html);
                  win.document.close();
                }
              },
            })
          }
        >
          <Printer className="size-4" />
          In phiếu
        </Button>
      </div>

      <ShipmentTimeline shipment={shipment} />

      {shipment.status === ShipmentStatus.RETURNED && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p>{carrier} báo giao thất bại — hàng đang hoàn về kho.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={isRedelivering}
            onClick={handleRedeliver}
          >
            Giao lại
          </Button>
        </div>
      )}
      {shipment.status === ShipmentStatus.PROBLEM && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p>
            {carrier} báo sự cố
            {shipment.carrierStatusRaw && (
              <> (<span className="font-mono">{shipment.carrierStatusRaw}</span>)</>
            )}{' '}
            — cần kiểm tra.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={isRedelivering}
            onClick={handleRedeliver}
          >
            Giao lại
          </Button>
        </div>
      )}
      {shipment.status === ShipmentStatus.PICKUP_FAILED && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p>{carrier} không lấy được hàng — hàng chưa rời kho.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={isRedelivering}
            onClick={handleRedeliver}
          >
            Giao lại
          </Button>
        </div>
      )}

      {shipment.carrierStatusRaw && (
        <p className="text-xs text-muted-foreground">
          Trạng thái {carrier}:{' '}
          <span className="font-mono">{shipment.carrierStatusRaw}</span>
        </p>
      )}

      {suggestedStatus && (
        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
          <p>
            {carrier} báo đơn{' '}
            {suggestedStatus === OrderStatus.DELIVERED ? 'đã giao' : 'đang giao'} — cập nhật
            trạng thái đơn hàng?
            {suggestedStatus === OrderStatus.DELIVERED &&
              isCodUnpaid &&
              ' Đơn COD sẽ được đánh dấu đã thanh toán.'}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={updateStatus.isPending}
            onClick={() => updateStatus.mutate(suggestedStatus)}
          >
            Đánh dấu {suggestedStatus === OrderStatus.DELIVERED ? 'Đã giao' : 'Đang giao'}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Trạng thái tự động cập nhật qua webhook {carrier} — không chỉnh tay ở đây.
      </p>

      {shipment.trackingNo?.startsWith('MOCK-') && (
        <MockWebhookTrigger orderId={shipment.orderId} carrier={carrier} />
      )}
    </div>
  );
}

/** Linear progress rank of a shipment status. `returned` is a side-branch,
 *  not on this scale, so it's handled separately below. */
const SHIPMENT_RANK: Record<string, number> = {
  [ShipmentStatus.PENDING]: 0,
  [ShipmentStatus.SHIPPED]: 1,
  [ShipmentStatus.IN_TRANSIT]: 2,
  [ShipmentStatus.DELIVERED]: 3,
};

type TimelineStep = {
  label: string;
  at?: string;
  rank: number;
  danger?: boolean;
  Icon?: LucideIcon;
};

/** Vertical timeline. A node is "done" based on the shipment's CURRENT status
 *  (its rank), not merely on whether a timestamp exists — the carrier
 *  overwrites status in place and timestamps are stamped first-time-only and
 *  never cleared, so a status that moves backward must not leave a stale node
 *  lit up.
 *
 *  Crucially the outcome is placed at the stage it actually happened:
 *  - `pickup_failed` (không lấy được hàng) is a failure BEFORE handover, so the
 *    line stops right there — it never shows "Giao cho ĐVVC"/"Đang vận chuyển"
 *    (those never happened), regardless of any stale transit timestamps.
 *  - `returned`/`problem` happen AFTER handover, so the full pickup→transit
 *    path is shown, ending at "Hoàn hàng"/"Sự cố" instead of "Giao thành công". */
function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const pickupFailed = shipment.status === ShipmentStatus.PICKUP_FAILED;

  if (pickupFailed) {
    const steps: TimelineStep[] = [
      { label: 'Tạo vận đơn', at: shipment.createdAt, rank: 0 },
      {
        label: 'Không lấy được hàng',
        at: shipment.problemAt,
        rank: 1,
        danger: true,
        Icon: AlertTriangle,
      },
    ];
    return <TimelineList steps={steps} isDone={() => true} />;
  }

  const returned = shipment.status === ShipmentStatus.RETURNED;
  const problem = shipment.status === ShipmentStatus.PROBLEM;
  const failed = returned || problem;
  const currentRank = SHIPMENT_RANK[shipment.status] ?? 0;

  const outcome: TimelineStep = returned
    ? { label: 'Hoàn hàng', at: shipment.returnedAt, rank: 3, danger: true, Icon: X }
    : problem
      ? { label: 'Sự cố', at: shipment.problemAt, rank: 3, danger: true, Icon: AlertTriangle }
      : { label: 'Giao thành công', at: shipment.deliveredAt, rank: 3 };
  const steps: TimelineStep[] = [
    { label: 'Tạo vận đơn', at: shipment.createdAt, rank: 0 },
    { label: 'Giao cho ĐVVC', at: shipment.shippedAt, rank: 1 },
    { label: 'Đang vận chuyển', at: shipment.inTransitAt, rank: 2 },
    outcome,
  ];

  const isDone = (step: TimelineStep) =>
    failed
      ? step.danger || step.rank === 0 || !!step.at
      : currentRank >= step.rank;

  return <TimelineList steps={steps} isDone={isDone} />;
}

function TimelineList({
  steps,
  isDone,
}: {
  steps: TimelineStep[];
  isDone: (step: TimelineStep) => boolean;
}) {
  return (
    <ol>
      {steps.map((step, i) => {
        const done = isDone(step);
        const next = steps[i + 1];
        const isLast = i === steps.length - 1;
        const lineActive = done && !!next && isDone(next);
        return (
          <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-3 top-3 h-full w-px -translate-x-1/2 transition-colors',
                  lineActive
                    ? next?.danger
                      ? 'bg-destructive'
                      : 'bg-primary'
                    : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                !done && 'border-border bg-card text-muted-foreground',
                done && step.danger && 'border-destructive bg-destructive text-white',
                done && !step.danger && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {!done ? (
                <span className="size-1.5 rounded-full bg-current" />
              ) : step.Icon ? (
                <step.Icon className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium leading-none',
                  !done && 'text-muted-foreground',
                  done && step.danger && 'text-destructive',
                  done && !step.danger && 'text-foreground',
                )}
              >
                {step.label}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {done ? (step.at ? formatDateTime(step.at) : '—') : 'Chưa cập nhật'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Testing helper, only shown for a mock-mode shipment (`MOCK-` tracking
 *  prefix, i.e. no real `GHTK_TOKEN` configured yet) — GHTK can't reach
 *  localhost to call the real webhook, so this simulates one by calling the
 *  exact same handling logic directly. */
function MockWebhookTrigger({
  orderId,
  carrier,
}: {
  orderId: string;
  carrier: string;
}) {
  const simulate = useSimulateCarrierWebhook(orderId);
  const options = MOCK_WEBHOOK_STATUS_OPTIONS[carrier] ?? [];
  const [status, setStatus] = useState(options[0]?.value ?? '');
  if (!options.length) return null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <FlaskConical className="size-3.5 shrink-0" />
        Chưa có token thật — giả lập webhook {carrier} để test luồng cập nhật trạng thái
      </p>
      <div className="flex gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={simulate.isPending}
          onClick={() => simulate.mutate(status)}
        >
          Gửi giả lập
        </Button>
      </div>
    </div>
  );
}
