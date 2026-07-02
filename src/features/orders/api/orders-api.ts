import { apiClient } from '@/lib/api-client';
import type { OrderStatus, PaginatedResult, PaginationParams } from '@/types';
import type { Order } from '../types';

export const ordersApi = {
  /** [admin] List all orders. BE only accepts page/limit/q. */
  list: (params: PaginationParams) =>
    apiClient.get<PaginatedResult<Order>>('/orders/admin/all', { params }),

  getById: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status }),

  confirmPayment: (id: string) =>
    apiClient.post<Order>(`/orders/${id}/confirm-payment`),

  cancel: (id: string) => apiClient.post<Order>(`/orders/${id}/cancel`),
};
