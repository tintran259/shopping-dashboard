import { apiClient } from '@/lib/api-client';
import type { OrderStatus, PaginatedResult } from '@/types';
import type {
  AdminOrderListParams,
  CreateGhtkShipmentInput,
  CreateOrderInput,
  Order,
  OrderSummary,
  OrderSummaryParams,
  Shipment,
  UpsertShipmentInput,
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
    /** Fulfilling branch — required so a branch-restricted voucher previews the
     *  same way it's enforced on submit (the create payload always sends it). */
    branchId?: string;
    /** Chosen delivery method — lets a method-restricted shipping voucher
     *  (e.g. express-only) preview correctly, mirroring the BE enforcement. */
    shippingMethod?: string;
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

  /** Null until an admin fills it in — supplementary tracking info,
   *  independent of the order's own fulfilment status. */
  getShipment: (id: string) =>
    apiClient.get<Shipment | null>(`/admin/orders/${id}/shipment`),

  upsertShipment: (id: string, body: UpsertShipmentInput) =>
    apiClient.put<Shipment>(`/admin/orders/${id}/shipment`, body),

  /** Explicitly create a real GHTK shipping order — admin supplies the
   *  delivery district (see `CreateGhtkShipmentInput`). */
  createGhtkShipment: (id: string, body: CreateGhtkShipmentInput) =>
    apiClient.post<Shipment>(`/admin/orders/${id}/shipment/ghtk`, body),

  /** Testing helper — simulates the carrier's own webhook (GHN/GHTK can't
   *  reach localhost), so the status-sync flow can be exercised without a
   *  real account. Only meaningful while the shipment is in mock mode. */
  simulateCarrierWebhook: (id: string, carrierStatus: string) =>
    apiClient.post<Shipment>(`/admin/orders/${id}/shipment/mock-webhook`, {
      carrierStatus,
    }),

  /** Reset a failed shipment (returned/problem/pickup-failed) back to blank
   *  so the admin can choose a carrier and create a fresh shipment. */
  resetShipment: (id: string) =>
    apiClient.post<Shipment>(`/admin/orders/${id}/shipment/reset`),

  /** Returns printable GHTK label HTML. Mock mode: BE generates a label from
   *  order data (no real token needed). Real mode: proxies GHTK's label API. */
  getShipmentLabel: (id: string) =>
    apiClient.get<string>(`/admin/orders/${id}/shipment/label`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    }),
};
