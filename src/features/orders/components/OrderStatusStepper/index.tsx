import { useState } from 'react';
import { Ban, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { orderStatusLabel, orderStatusOptions } from '../../lib/labels';
import { useUpdateOrderStatus } from '../../hooks/use-order-mutations';
import type { Order } from '../../types';

/** At-a-glance fulfilment progress — replaces having to read the status
 *  badge + dropdown together to figure out where an order sits in its flow.
 *  Steps come from `orderStatusOptions` (fulfilment-aware: pickup orders
 *  skip "Đang giao" since nothing physically ships) minus CANCELLED, which
 *  is a terminal side-track rather than a further step and gets its own
 *  row instead of trying to freeze the stepper at an ambiguous position.
 *  Clicking a future step opens a confirm dialog to advance the order to
 *  that status — forward-only, no backward transitions allowed. */
export function OrderStatusStepper({ order }: { order: Order }) {
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const updateStatus = useUpdateOrderStatus(order.id);

  if (order.status === OrderStatus.CANCELLED) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-sm font-medium text-destructive">
          <Ban className="size-4 shrink-0" />
          Đơn hàng đã hủy
        </CardContent>
      </Card>
    );
  }

  const steps = orderStatusOptions(order.fulfillment).filter(
    (s) => s !== OrderStatus.CANCELLED,
  );
  const currentIndex = Math.max(0, steps.indexOf(order.status));
  const isLastStep = currentIndex === steps.length - 1;

  return (
    <>
      <Card>
        <CardContent className="overflow-x-auto py-5">
          <ol className="flex min-w-max items-start">
            {steps.map((step, i) => {
              // The last step should show as done (✓) when reached — it's a
              // terminal state, not "in progress", so the number would look wrong.
              const isDone = i < currentIndex || (i === currentIndex && isLastStep);
              const isCurrent = i === currentIndex && !isLastStep;
              const isFuture = i > currentIndex;

              return (
                <li
                  key={step}
                  onClick={() => isFuture ? setPendingStatus(step) : undefined}
                  className={cn(
                    'flex min-w-27.5 flex-col items-center text-center md:flex-1',
                    isFuture && 'cursor-pointer group',
                  )}
                >
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <span
                        className={cn(
                          'h-0.5 flex-1 transition-colors',
                          isDone || isCurrent ? 'bg-primary' : 'bg-border',
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                        isDone && 'border-primary bg-primary text-primary-foreground',
                        isCurrent && 'border-primary text-primary',
                        isFuture && 'border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary/70',
                      )}
                    >
                      {isDone ? <Check className="size-4" /> : i + 1}
                    </span>
                    {i < steps.length - 1 && (
                      <span
                        className={cn(
                          'h-0.5 flex-1 transition-colors',
                          isDone ? 'bg-primary' : 'bg-border',
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium transition-colors',
                      isCurrent || isDone ? 'text-foreground' : 'text-muted-foreground',
                      isFuture && 'group-hover:text-primary/70',
                    )}
                  >
                    {orderStatusLabel(step, order.fulfillment)}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
        title="Cập nhật trạng thái đơn hàng"
        description={
          pendingStatus
            ? `Chuyển sang "${orderStatusLabel(pendingStatus, order.fulfillment)}"? Thao tác này không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xác nhận"
        loading={updateStatus.isPending}
        onConfirm={() => {
          if (!pendingStatus) return;
          updateStatus.mutate(pendingStatus, {
            onSuccess: () => setPendingStatus(null),
            onError: () => setPendingStatus(null),
          });
        }}
      />
    </>
  );
}
