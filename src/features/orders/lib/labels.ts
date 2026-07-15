import {
  FulfillmentType,
  OrderChannel,
  OrderStatus,
  PaymentMethodCode,
  PaymentStatus,
  ShipmentStatus,
  ShippingMethodCode,
} from '@/types';

/** Human labels for enums used only in the orders UI. */
export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  [FulfillmentType.DELIVERY]: 'Giao hàng',
  [FulfillmentType.PICKUP]: 'Nhận tại cửa hàng',
};

/** Home-delivery methods offered when staff create an order (BO). */
export const SHIPPING_METHOD_LABEL: Record<ShippingMethodCode, string> = {
  [ShippingMethodCode.STANDARD]: 'Giao tiêu chuẩn',
  [ShippingMethodCode.EXPRESS]: 'Giao nhanh',
};

export const ORDER_CHANNEL_LABEL: Record<OrderChannel, string> = {
  [OrderChannel.STOREFRONT]: 'Khách tự đặt',
  [OrderChannel.ADMIN]: 'BO tạo',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodCode, string> = {
  [PaymentMethodCode.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentMethodCode.MOMO]: 'Ví MoMo',
  [PaymentMethodCode.ATM_CARD]: 'Thẻ ATM',
  [PaymentMethodCode.COD]: 'Thu hộ (COD)',
};

/** Payment methods selectable when staff create an order (BO). MoMo/ATM card
 *  assume the customer completes payment themselves through a gateway redirect
 *  at storefront checkout — that never happens for a staff-entered order, and
 *  the BE has no live gateway integration anyway (`confirmPayment` is a manual
 *  stand-in for all prepaid methods alike), so only COD and bank transfer are
 *  meaningful here. The full enum still applies to storefront checkout. */
export const BO_PAYMENT_METHODS = [
  PaymentMethodCode.COD,
  PaymentMethodCode.BANK_TRANSFER,
] as const;

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

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  [ShipmentStatus.PENDING]: 'Chờ lấy hàng',
  [ShipmentStatus.SHIPPED]: 'Đã lấy hàng',
  [ShipmentStatus.IN_TRANSIT]: 'Đang vận chuyển',
  [ShipmentStatus.DELIVERED]: 'Đã giao',
  [ShipmentStatus.RETURNED]: 'Hoàn hàng',
  [ShipmentStatus.PROBLEM]: 'Sự cố',
  [ShipmentStatus.PICKUP_FAILED]: 'Không lấy được hàng',
};

export const SHIPMENT_STATUS_OPTIONS = Object.values(ShipmentStatus);

/** Sentinel for "tự giao" (in-house/self-delivery) — not a real courier, so it
 *  isn't in the carrier preset list proper; kept separate for clarity. */
export const SELF_DELIVERY_CARRIER = 'Tự giao';

/** Common couriers operating in Vietnam — a starting preset, not an
 *  enforced enum (`Shipment.carrier` is free text on the BE on purpose, so a
 *  new courier never needs a code change). The form also offers "Khác" to
 *  type any other name. */
/** Representative raw carrier statuses for the "giả lập webhook" testing
 *  helper — mirrors `GHTK_STATUS_MAP` (shopping-api, `carrier-status-maps.ts`),
 *  not the full vocabulary, just enough to exercise pending → shipped → delivered
 *  and the failed-delivery → hoàn hàng path. */
export const MOCK_WEBHOOK_STATUS_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  GHTK: [
    { value: '2', label: '2 — đã tiếp nhận' },
    { value: '3', label: '3 — đã lấy hàng' },
    { value: '4', label: '4 — đang vận chuyển' },
    { value: '5', label: '5 — đã giao, chờ đối soát' },
    { value: '9', label: '9 — không giao được (hoàn hàng)' },
    { value: '20', label: '20 — đang hoàn (hoàn hàng)' },
    { value: '21', label: '21 — đã hoàn (hoàn hàng)' },
    { value: '7', label: '7 — không lấy được hàng (trước bàn giao)' },
    { value: '-1', label: '-1 — hủy đơn (sự cố)' },
  ],
};

export const CARRIER_PRESETS = [SELF_DELIVERY_CARRIER, 'GHTK'] as const;

/** Quick-pick carriers — self-delivery plus the API-integrated courier. */
export const QUICK_PICK_CARRIERS = [SELF_DELIVERY_CARRIER, 'GHTK'] as const;

/** No long-tail presets — only GHTK is the active carrier. "Khác" free-text
 *  is still available in the dropdown for edge cases. */
export const LONG_TAIL_CARRIER_PRESETS: string[] = [];
