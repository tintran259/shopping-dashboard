import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  InventoryStatus,
  OrderStatus,
  OrderStockStatus,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
} from '@/types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;
interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  [OrderStatus.PENDING]: { label: 'Chờ xử lý', variant: 'warning' },
  [OrderStatus.CONFIRMED]: { label: 'Đã xác nhận', variant: 'info' },
  [OrderStatus.PROCESSING]: { label: 'Đang xử lý', variant: 'info' },
  [OrderStatus.SHIPPED]: { label: 'Đang giao', variant: 'default' },
  [OrderStatus.DELIVERED]: { label: 'Đã giao', variant: 'success' },
  [OrderStatus.CANCELLED]: { label: 'Đã hủy', variant: 'destructive' },
};

const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  [PaymentStatus.PENDING]: { label: 'Chưa thanh toán', variant: 'warning' },
  [PaymentStatus.PAID]: { label: 'Đã thanh toán', variant: 'success' },
  [PaymentStatus.FAILED]: { label: 'Thất bại', variant: 'destructive' },
  [PaymentStatus.REFUNDED]: { label: 'Đã hoàn tiền', variant: 'muted' },
};

const STOCK_STATUS: Record<OrderStockStatus, StatusMeta> = {
  [OrderStockStatus.RESERVED]: { label: 'Đang giữ chỗ', variant: 'warning' },
  [OrderStockStatus.COMMITTED]: { label: 'Đã trừ kho', variant: 'success' },
  [OrderStockStatus.RELEASED]: { label: 'Đã hoàn kho', variant: 'muted' },
};

const PRODUCT_STATUS: Record<ProductStatus, StatusMeta> = {
  [ProductStatus.ACTIVE]: { label: 'Đang bán', variant: 'success' },
  [ProductStatus.DRAFT]: { label: 'Nháp', variant: 'muted' },
  [ProductStatus.PREORDER]: { label: 'Đặt trước', variant: 'info' },
  [ProductStatus.OUT_OF_STOCK]: { label: 'Hết hàng', variant: 'warning' },
  [ProductStatus.DISCONTINUED]: { label: 'Ngừng bán', variant: 'destructive' },
};

const INVENTORY_STATUS: Record<InventoryStatus, StatusMeta> = {
  [InventoryStatus.IN_STOCK]: { label: 'Còn hàng', variant: 'success' },
  [InventoryStatus.PREORDER]: { label: 'Đặt trước', variant: 'info' },
  [InventoryStatus.OUT_OF_STOCK]: { label: 'Hết hàng', variant: 'destructive' },
};

const REVIEW_STATUS: Record<ReviewStatus, StatusMeta> = {
  [ReviewStatus.PENDING]: { label: 'Chờ duyệt', variant: 'warning' },
  [ReviewStatus.PUBLISHED]: { label: 'Đã hiển thị', variant: 'success' },
  [ReviewStatus.REJECTED]: { label: 'Đã ẩn', variant: 'destructive' },
};

const REGISTRY = {
  order: ORDER_STATUS,
  payment: PAYMENT_STATUS,
  stock: STOCK_STATUS,
  product: PRODUCT_STATUS,
  inventory: INVENTORY_STATUS,
  review: REVIEW_STATUS,
} as const;

type StatusKind = keyof typeof REGISTRY;

interface StatusBadgeProps {
  kind: StatusKind;
  value: string;
  /** Override the display text while keeping the kind's color mapping — e.g. a
   *  fulfillment-specific wording for the same underlying status value. */
  label?: string;
}

/** Maps a domain enum value to a localized label + semantic badge color. */
export function StatusBadge({ kind, value, label }: StatusBadgeProps) {
  const map = REGISTRY[kind] as Record<string, StatusMeta>;
  const meta = map[value];
  if (!meta) return <Badge variant="outline">{label ?? value}</Badge>;
  return <Badge variant={meta.variant}>{label ?? meta.label}</Badge>;
}
