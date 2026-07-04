import { CustomerStatus, CustomerType } from '@/types';

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  [CustomerType.INDIVIDUAL]: 'Cá nhân',
  [CustomerType.B2B]: 'Doanh nghiệp (B2B)',
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  [CustomerStatus.ACTIVE]: 'Hoạt động',
  [CustomerStatus.DISABLED]: 'Đã khóa',
};

/** "Trần Như Tín" / rỗng nếu chưa nhập tên → dùng email làm fallback. */
export function customerDisplayName(c: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): string {
  const name = [c.lastName, c.firstName].filter(Boolean).join(' ').trim();
  return name || c.email || c.phone || '—';
}
