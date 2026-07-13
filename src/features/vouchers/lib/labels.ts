import { ShippingMethodCode, VoucherType } from '@/types';
import type { VoucherCustomerRef } from '../types';

export const VOUCHER_TYPE_LABEL: Record<VoucherType, string> = {
  [VoucherType.PERCENT]: 'Phần trăm',
  [VoucherType.FIXED]: 'Số tiền cố định',
  [VoucherType.SHIPPING]: 'Phí vận chuyển',
};

export const SHIPPING_METHOD_LABEL: Record<ShippingMethodCode, string> = {
  [ShippingMethodCode.STANDARD]: 'Giao tiêu chuẩn',
  [ShippingMethodCode.EXPRESS]: 'Giao nhanh',
};

/** "Trần Như Tín" / rỗng nếu chưa nhập tên → dùng email/sđt làm fallback. */
export function customerRefDisplayName(c: VoucherCustomerRef): string {
  const name = [c.lastName, c.firstName].filter(Boolean).join(' ').trim();
  return name || c.email || c.phone || c.id;
}
