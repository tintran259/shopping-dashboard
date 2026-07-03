import {
  FulfillmentType,
  OrderStatus,
  PaymentMethodCode,
  PaymentStatus,
} from '@/types';

/** Human labels for enums used only in the orders UI. */
export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  [FulfillmentType.DELIVERY]: 'Giao hàng',
  [FulfillmentType.PICKUP]: 'Nhận tại cửa hàng',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodCode, string> = {
  [PaymentMethodCode.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentMethodCode.MOMO]: 'Ví MoMo',
  [PaymentMethodCode.ATM_CARD]: 'Thẻ ATM',
  [PaymentMethodCode.COD]: 'Thu hộ (COD)',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPED]: 'Đang giao',
  [OrderStatus.DELIVERED]: 'Đã giao',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chưa thanh toán',
  [PaymentStatus.PAID]: 'Đã thanh toán',
  [PaymentStatus.FAILED]: 'Thất bại',
  [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
};

/** Selectable next statuses (BE validates the actual transition). */
const ORDER_STATUS_OPTIONS = Object.values(OrderStatus);

/** Payment methods captured upfront — must be confirmed PAID before fulfilment
 *  starts (unlike COD, captured at the door). Mirrors OrdersService.PREPAID_METHODS. */
export const PREPAID_PAYMENT_METHODS = new Set<PaymentMethodCode>([
  PaymentMethodCode.BANK_TRANSFER,
  PaymentMethodCode.MOMO,
  PaymentMethodCode.ATM_CARD,
]);

/** Statuses that mean fulfilment has started. Mirrors OrdersService.FULFILLMENT_STARTED. */
export const FULFILLMENT_STARTED_STATUSES = new Set<OrderStatus>([
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]);

/** Statuses that mean the goods already left the building — cancelling from here
 *  needs a manual return, not a stock-only rollback. Mirrors OrdersService.SHIPPED_OR_BEYOND. */
export const SHIPPED_OR_BEYOND_STATUSES = new Set<OrderStatus>([
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]);

/** Order-status label, aware of fulfillment: pickup orders never ship, so
 *  "processing"/"delivered" read as "packed, ready for pickup" / "picked up". */
export function orderStatusLabel(
  status: OrderStatus,
  fulfillment: FulfillmentType,
): string {
  if (fulfillment === FulfillmentType.PICKUP) {
    if (status === OrderStatus.PROCESSING) return 'Đã đóng hàng xong';
    if (status === OrderStatus.DELIVERED) return 'Giao thành công';
  }
  return ORDER_STATUS_LABEL[status];
}

/** Selectable statuses for the admin dropdown, aware of fulfillment — pickup
 *  orders skip "shipped" (nothing is physically shipped). The BE still validates
 *  the actual transition; this only prunes options that never make sense to show. */
export function orderStatusOptions(fulfillment: FulfillmentType): OrderStatus[] {
  if (fulfillment === FulfillmentType.PICKUP) {
    return ORDER_STATUS_OPTIONS.filter((s) => s !== OrderStatus.SHIPPED);
  }
  return ORDER_STATUS_OPTIONS;
}
