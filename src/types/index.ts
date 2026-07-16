/**
 * Domain types mirrored from the NestJS backend (`src/common/enums.ts`).
 * BE is the source of truth; keep these in sync.
 */

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderStockStatus = {
  RESERVED: 'reserved',
  COMMITTED: 'committed',
  RELEASED: 'released',
} as const;
export type OrderStockStatus =
  (typeof OrderStockStatus)[keyof typeof OrderStockStatus];

export const ProductStatus = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  PREORDER: 'preorder',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const InventoryStatus = {
  IN_STOCK: 'in_stock',
  PREORDER: 'preorder',
  OUT_OF_STOCK: 'out_of_stock',
} as const;
export type InventoryStatus =
  (typeof InventoryStatus)[keyof typeof InventoryStatus];

export const FulfillmentType = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
} as const;
export type FulfillmentType =
  (typeof FulfillmentType)[keyof typeof FulfillmentType];

/** Where an order was placed from — lets the BO tell staff-entered orders
 *  (phone/walk-in/B2B) apart from ones the customer placed themselves. */
export const OrderChannel = {
  STOREFRONT: 'storefront',
  ADMIN: 'admin',
} as const;
export type OrderChannel = (typeof OrderChannel)[keyof typeof OrderChannel];

export const CustomerRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;
export type CustomerRole = (typeof CustomerRole)[keyof typeof CustomerRole];

export const CustomerType = {
  INDIVIDUAL: 'individual',
  B2B: 'b2b',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CustomerStatus = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const OptionDisplayType = {
  SWATCH: 'swatch',
  PILL: 'pill',
  DROPDOWN: 'dropdown',
} as const;
export type OptionDisplayType =
  (typeof OptionDisplayType)[keyof typeof OptionDisplayType];

export const VoucherType = {
  PERCENT: 'percent',
  FIXED: 'fixed',
  SHIPPING: 'shipping',
} as const;
export type VoucherType = (typeof VoucherType)[keyof typeof VoucherType];

/** Who a voucher's customer restriction applies to — `SPECIFIC` with an
 *  empty picked-customers list means unrestricted (anyone, guest or
 *  account); `GUESTS`/`USERS` ignore that list and gate purely on whether
 *  the order has an account at all. */
export const VoucherCustomerScope = {
  SPECIFIC: 'specific',
  GUESTS: 'guests',
  USERS: 'users',
} as const;
export type VoucherCustomerScope =
  (typeof VoucherCustomerScope)[keyof typeof VoucherCustomerScope];

/** Home-delivery methods a shipping voucher can be restricted to (mirrors the
 *  storefront + BE `ShippingMethodCode`). */
export const ShippingMethodCode = {
  STANDARD: 'standard',
  EXPRESS: 'express',
} as const;
export type ShippingMethodCode =
  (typeof ShippingMethodCode)[keyof typeof ShippingMethodCode];

export const ReviewStatus = {
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const PaymentMethodCode = {
  BANK_TRANSFER: 'bank_transfer',
  MOMO: 'momo',
  ATM_CARD: 'atm_card',
  COD: 'cod',
} as const;
export type PaymentMethodCode =
  (typeof PaymentMethodCode)[keyof typeof PaymentMethodCode];

/** Shipment tracking status (carrier/tracking no) — supplementary info,
 *  independent of `OrderStatus`. */
export const ShipmentStatus = {
  PENDING: 'pending', // chờ lấy hàng
  SHIPPED: 'shipped', // đã lấy hàng (giao cho ĐVVC)
  IN_TRANSIT: 'in_transit', // đang vận chuyển
  DELIVERED: 'delivered', // đã giao
  /** Giao thất bại / hàng hoàn về (mapped from carrier fail/return webhooks). */
  RETURNED: 'returned',
  /** Sự cố sau bàn giao: hủy phía carrier / mất / hư hỏng trong vận chuyển. */
  PROBLEM: 'problem',
  /** Sự cố trước bàn giao: carrier không lấy được hàng — hàng chưa rời kho. */
  PICKUP_FAILED: 'pickup_failed',
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

/** Every persisted BE entity extends this. */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Standard paginated envelope: `{ data, meta }`. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Query params shared by every list endpoint. */
export interface PaginationParams {
  page?: number;
  limit?: number;
  q?: string;
}
