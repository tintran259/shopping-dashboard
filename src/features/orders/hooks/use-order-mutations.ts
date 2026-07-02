import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OrderStatus } from '@/types';
import { ApiError } from '@/lib/api-error';
import { ordersApi } from '../api/orders-api';
import type { Order } from '../types';
import { orderKeys } from './use-orders';

/** Surface the BE message verbatim (business rules require exact wording). */
function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

/**
 * Update fulfilment status with an optimistic patch to the cached detail, and
 * rollback if the BE rejects (e.g. invalid transition / stock guard).
 */
export function useUpdateOrderStatus(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: OrderStatus) =>
      ordersApi.updateStatus(orderId, status),
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: orderKeys.detail(orderId) });
      const previous = qc.getQueryData<Order>(orderKeys.detail(orderId));
      if (previous) {
        qc.setQueryData<Order>(orderKeys.detail(orderId), {
          ...previous,
          status,
        });
      }
      return { previous };
    },
    onError: (error, _status, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(orderKeys.detail(orderId), ctx.previous);
      }
      toastError('Cập nhật trạng thái thất bại')(error);
    },
    onSuccess: () => toast.success('Đã cập nhật trạng thái đơn hàng'),
    onSettled: () => {
      // BE là chân lý (đặc biệt về tồn kho) → đồng bộ lại số thật.
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useConfirmPayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.confirmPayment(orderId),
    onSuccess: (updated) => {
      qc.setQueryData(orderKeys.detail(orderId), updated);
      qc.invalidateQueries({ queryKey: orderKeys.all });
      toast.success('Đã xác nhận thanh toán');
    },
    onError: toastError('Xác nhận thanh toán thất bại'),
  });
}

export function useCancelOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: (updated) => {
      qc.setQueryData(orderKeys.detail(orderId), updated);
      qc.invalidateQueries({ queryKey: orderKeys.all });
      toast.success('Đã hủy đơn hàng');
    },
    // Hủy không hợp lệ (đã giao...) → hiển thị message BE nguyên văn.
    onError: toastError('Hủy đơn hàng thất bại'),
  });
}
