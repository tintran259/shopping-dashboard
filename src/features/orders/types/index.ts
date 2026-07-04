import type {
  BaseEntity,
  FulfillmentType,
  OrderChannel,
  OrderStatus,
  OrderStockStatus,
  PaymentMethodCode,
  PaymentStatus,
  PaginationParams,
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
