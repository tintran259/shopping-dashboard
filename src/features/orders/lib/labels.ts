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
export const ORDER_STATUS_OPTIONS = Object.values(OrderStatus);
