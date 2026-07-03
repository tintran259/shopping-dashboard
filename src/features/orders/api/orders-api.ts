import { apiClient } from '@/lib/api-client';
import type { OrderStatus, PaginatedResult } from '@/types';
import type {
  AdminOrderListParams,
  Order,
  OrderSummary,
  OrderSummaryParams,
} from '../types';

export const ordersApi = {
  /**
   * [admin] List orders. All filtering/search/sort/pagination is server-side:
   * branchId, status, paymentStatus, q, sortBy, sortOrder, page, limit.
   */
  list: (params: AdminOrderListParams) =>
    apiClient.get<PaginatedResult<Order>>('/admin/orders', { params }),

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
