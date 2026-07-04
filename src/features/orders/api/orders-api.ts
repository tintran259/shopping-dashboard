import { apiClient } from '@/lib/api-client';
import type { OrderStatus, PaginatedResult } from '@/types';
import type {
  AdminOrderListParams,
  CreateOrderInput,
  Order,
  OrderSummary,
  OrderSummaryParams,
  VoucherValidation,
} from '../types';

export const ordersApi = {
  /**
   * [admin] List orders. All filtering/search/sort/pagination is server-side:
   * branchId, status, paymentStatus, q, sortBy, sortOrder, page, limit.
   */
  list: (params: AdminOrderListParams) =>
    apiClient.get<PaginatedResult<Order>>('/admin/orders', { params }),

  /** [admin] Create an order on behalf of a customer/walk-in (phone order, etc).
   *  Same shape/logic as guest checkout — BE resolves price/stock server-side. */
  create: (body: CreateOrderInput) =>
    apiClient.post<Order>('/admin/orders', body),

  /** Preview a voucher's discount against a subtotal (public endpoint) — UX-only,
   *  the real discount is recomputed by the BE when the order is actually created. */
  validateVoucher: (params: {
    code: string;
    subtotal: number;
    shippingFee?: number;
  }) => apiClient.get<VoucherValidation>('/vouchers/validate', { params }),

  /** [admin] Dashboard aggregate — branch/date-range scoped, not paginated. */
  summary: (params: OrderSummaryParams) =>
    apiClient.get<OrderSummary>('/admin/orders/summary', { params }),

  getById: (id: string) => apiClient.get<Order>(`/admin/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/admin/orders/${id}/status`, { status }),

  confirmPayment: (id: string) =>
    apiClient.post<Order>(`/admin/orders/${id}/confirm-payment`),

  cancel: (id: string) => apiClient.post<Order>(`/admin/orders/${id}/cancel`),
};
