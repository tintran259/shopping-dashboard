import type {
  BaseEntity,
  FulfillmentType,
  OrderStatus,
  OrderStockStatus,
  PaymentMethodCode,
  PaymentStatus,
} from '@/types';

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
