import type {
  BaseEntity,
  PaginationParams,
  ProductStatus,
  VoucherCustomerScope,
  VoucherType,
} from '@/types';

/** Minimal refs joined in for display/picking — the voucher doesn't need
 *  the full Product/Branch/Customer shape. The BE relation actually returns
 *  the full Product entity; `images` is kept as-is (not pre-flattened to a
 *  single `thumbnail` string) so both the picker's live "just added" items
 *  and an existing voucher's loaded-from-BE items go through the exact same
 *  `thumbnailOf()` derivation — one source of truth, nothing to forget to
 *  recompute when loading an existing voucher. */
export interface VoucherProductRef {
  id: string;
  name: string;
  slug: string;
  images?: { url: string; isPrimary: boolean }[];
  basePrice: string;
  status: ProductStatus;
}

export interface VoucherBranchRef {
  id: string;
  name: string;
}

export interface VoucherCustomerRef {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface Voucher extends BaseEntity {
  code: string;
  type: VoucherType;
  value: string;
  minSubtotal: string;
  maxDiscount?: string;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  /** Empty/absent = no restriction on that dimension. */
  products?: VoucherProductRef[];
  branches?: VoucherBranchRef[];
  /** SPECIFIC + empty `customers` = unrestricted (today's default). GUESTS/
   *  USERS ignore `customers` entirely and gate on whether the order has an
   *  account at all — see the "Khách hàng áp dụng" section of the form. */
  customerScope: VoucherCustomerScope;
  customers?: VoucherCustomerRef[];
  /** Only for `shipping` vouchers: which home-delivery methods it applies to
   *  (standard/express). Empty = every method. */
  shippingMethods?: string[];
  /** Counts on the paginated list response. `products`/`customers` come back as
   *  counts only there (list shows "N sản phẩm/khách"); `branches` above IS
   *  returned in full on the list too, so it can name the branches. The edit
   *  form's `GET /vouchers/:id` returns every relation in full. */
  productsCount?: number;
  branchesCount?: number;
  customersCount?: number;
}

export interface VoucherInput {
  code: string;
  type: VoucherType;
  value: string;
  minSubtotal?: string;
  maxDiscount?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  productIds?: string[];
  branchIds?: string[];
  customerScope?: VoucherCustomerScope;
  customerIds?: string[];
  shippingMethods?: string[];
}

export type UpdateVoucherInput = Partial<VoucherInput>;

/** Mirrors the BE's `deriveState()`-equivalent SQL filter — not a stored
 *  column, computed from `isActive` + `startsAt`/`endsAt`. */
export type VoucherState = 'active' | 'scheduled' | 'expired' | 'disabled';

export interface AdminVoucherListParams extends PaginationParams {
  state?: VoucherState;
}

export type VoucherStateCounts = Record<VoucherState, number> & { total: number };
