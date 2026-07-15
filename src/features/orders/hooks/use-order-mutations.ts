import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OrderStatus } from '@/types';
import { ApiError } from '@/lib/api-error';
import { ordersApi } from '../api/orders-api';
import type {
  CreateGhtkShipmentInput,
  CreateOrderInput,
  Order,
  UpsertShipmentInput,
} from '../types';
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

/** Staff-entered order (phone order, walk-in…) — BE resolves price/stock itself. */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderInput) => ordersApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      toast.success('Đã tạo đơn hàng');
    },
    onError: toastError('Tạo đơn hàng thất bại'),
  });
}

/** Create or update the order's shipment tracking info (carrier/tracking
 *  no/fee/status) — supplementary, independent of `Order.status`. */
export function useUpsertShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertShipmentInput) => ordersApi.upsertShipment(orderId, body),
    onSuccess: (updated) => {
      qc.setQueryData(orderKeys.shipment(orderId), updated);
      toast.success('Đã lưu thông tin vận chuyển');
    },
    onError: toastError('Lưu thông tin vận chuyển thất bại'),
  });
}

/** Explicitly create a real GHTK shipping order for this order — admin
 *  supplies the delivery district (the one field we can't derive). */
export function useCreateGhtkShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGhtkShipmentInput) =>
      ordersApi.createGhtkShipment(orderId, body),
    onSuccess: (shipment) => {
      qc.setQueryData(orderKeys.shipment(orderId), shipment);
      toast.success('Đã tạo vận đơn GHTK');
    },
    onError: toastError('Tạo vận đơn GHTK thất bại'),
  });
}

/** Testing helper — simulates the carrier webhook so the status-sync flow
 *  can be exercised without a real account (GHN/GHTK can't reach localhost). */
export function useSimulateCarrierWebhook(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (carrierStatus: string) =>
      ordersApi.simulateCarrierWebhook(orderId, carrierStatus),
    onSuccess: (shipment) => {
      qc.setQueryData(orderKeys.shipment(orderId), shipment);
      toast.success('Đã giả lập cập nhật webhook');
    },
    onError: toastError('Giả lập webhook thất bại'),
  });
}

/** Reset a failed shipment back to blank so the carrier picker re-appears
 *  and the admin can start a fresh delivery attempt.
 *
 *  Race-condition note: `useUpdateOrderStatus.onSettled` calls
 *  `invalidateQueries(['orders'])` which is a prefix of the shipment key
 *  `['orders','shipment',id]` — this triggers a background refetch that can
 *  overwrite the reset result with stale server data. `onMutate` cancels any
 *  in-flight shipment fetch before the reset starts to prevent that. */
export function useResetShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.resetShipment(orderId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: orderKeys.shipment(orderId) });
    },
    onSuccess: (shipment) => {
      qc.setQueryData(orderKeys.shipment(orderId), shipment);
      toast.success('Sẵn sàng giao lại — chọn đơn vị vận chuyển bên dưới');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: orderKeys.shipment(orderId) });
    },
    onError: toastError('Không thể reset thông tin vận chuyển'),
  });
}

/** Fetch printable GHTK label HTML on demand — opens in a new window which
 *  auto-calls window.print() so the admin can send it straight to the printer. */
export function useGetShipmentLabel(orderId: string) {
  return useMutation({
    mutationFn: () => ordersApi.getShipmentLabel(orderId),
    onError: toastError('Không thể tải phiếu vận chuyển'),
  });
}

/** On-demand voucher preview while filling the create form — display only. */
export function useValidateVoucher() {
  return useMutation({
    mutationFn: (params: {
      code: string;
      subtotal: number;
      shippingFee?: number;
      branchId?: string;
      shippingMethod?: string;
    }) => ordersApi.validateVoucher(params),
    onError: toastError('Mã giảm giá không hợp lệ'),
  });
}
