import type {
  BaseEntity,
  FulfillmentType,
  OrderChannel,
  OrderStatus,
  OrderStockStatus,
  PaymentMethodCode,
  PaymentStatus,
  PaginationParams,
  ShipmentStatus,
  ShippingMethodCode,
} from '@/types';

/** Columns the admin order list can be sorted by (must match BE allowlist). */
export type OrderSortField =
  | 'createdAt'
  | 'placedAt'
  | 'grandTotal'
  | 'status'
  | 'code';

/** Query params for GET /orders/admin/all (server-side filter/sort/paginate). */
export interface AdminOrderListParams extends PaginationParams {
  branchId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  sortBy?: OrderSortField;
  sortOrder?: 'ASC' | 'DESC';
}

/** Query params for GET /admin/orders/summary (aggregate, not paginated). */
export interface OrderSummaryParams {
  branchId?: string;
  /** Inclusive ISO start. */
  dateFrom?: string;
  /** Exclusive ISO end. */
  dateTo?: string;
}

/** One day's PAID revenue within the summary's date range. */
export interface OrderRevenuePoint {
  date: string;
  revenue: string;
}

/** Dashboard aggregate — branch/date-range scoped, computed server-side in SQL. */
export interface OrderSummary {
  totalOrders: number;
  totalRevenue: string;
  byStatus: Record<OrderStatus, number>;
  series: OrderRevenuePoint[];
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  variantId: string;
  productName: string;
  imageUrl?: string;
  variantTitle: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  provinceCode: number;
  provinceName: string;
  wardCode: number;
  wardName: string;
  street: string;
}

export interface InvoiceSnapshot {
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
}

export interface Order extends BaseEntity {
  code: string;
  customerId?: string;
  branchId: string;
  fulfillment: FulfillmentType;
  /** Phương thức giao hàng khách chọn (giao tiêu chuẩn / giao nhanh). Chỉ có
   *  với đơn giao tận nơi; null cho đơn nhận tại cửa hàng hoặc đơn cũ. Dùng để
   *  gắn nhãn "giao nhanh" cho đơn cần ưu tiên xử lý. */
  shippingMethod?: ShippingMethodCode | null;
  /** Who placed the order — 'admin' = staff-entered (phone/walk-in/B2B), not
   *  the customer themselves. */
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stockStatus: OrderStockStatus;
  paymentMethodCode?: PaymentMethodCode;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  shippingAddress?: ShippingAddressSnapshot;
  subtotal: string;
  shippingFee: string;
  discountTotal: string;
  grandTotal: string;
  currency: string;
  voucherCode?: string;
  invoice?: InvoiceSnapshot;
  notes?: string;
  placedAt?: string;
  items: OrderItem[];
  /** Virtual — populated by admin list query; null when no shipment exists yet. */
  shipmentStatus?: ShipmentStatus | null;
}

/** Shipment tracking (carrier/tracking no/fee/status) — supplementary info
 *  attached to an order, fetched separately from `Order` itself
 *  (`GET /admin/orders/:id/shipment`, `null` until an admin fills it in). */
export interface Shipment extends BaseEntity {
  orderId: string;
  carrier?: string;
  trackingNo?: string;
  status: ShipmentStatus;
  /** The carrier's own status string verbatim (e.g. GHN's "delivering") —
   *  set automatically by their webhook, far more granular than `status`. */
  carrierStatusRaw?: string;
  fee: string;
  shippedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  /** Stamped when the carrier reports a failed delivery / return. */
  returnedAt?: string;
  /** Stamped when the carrier reports a problem (cancel/lost/damage/pickup-fail). */
  problemAt?: string;
}

export interface UpsertShipmentInput {
  carrier?: string;
  trackingNo?: string;
  status?: ShipmentStatus;
  fee?: string;
}

/** What the admin fills in to create a real GHTK shipping order — everything
 *  else (recipient/address/pickup) is derived server-side; `district` is the
 *  one field our own location data can't provide (2025 reform: province →
 *  ward only, no district). */
export interface CreateGhtkShipmentInput {
  district: string;
  value?: number;
  note?: string;
  isFreeship?: boolean;
}

// ── Create (staff-entered order, POST /admin/orders) ────────────────
export interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
}

/** Raw address entry (no saved address book for admin-created orders yet). */
export interface CreateOrderShippingAddressInput {
  recipientName: string;
  phone: string;
  provinceCode: number;
  wardCode: number;
  street: string;
}

export interface CreateOrderInvoiceInput {
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
}

export interface CreateOrderInput {
  branchId: string;
  fulfillment: FulfillmentType;
  paymentMethodCode: PaymentMethodCode;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  shippingAddress?: CreateOrderShippingAddressInput;
  voucherCode?: string;
  /** Phương thức giao (giao tiêu chuẩn / giao nhanh) — chỉ đơn giao tận nơi. */
  shippingMethod?: ShippingMethodCode;
  shippingFee?: string;
  invoice?: CreateOrderInvoiceInput;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface VoucherValidation {
  valid: boolean;
  code: string;
  type: string;
  discount: number;
}
