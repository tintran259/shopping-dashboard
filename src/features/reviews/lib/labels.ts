import type { ReviewCustomerRef } from '../types';

/** "Trần Như Tín" / rỗng nếu chưa nhập tên → dùng email/sđt làm fallback. */
export function reviewerDisplayName(c: ReviewCustomerRef | undefined): string {
  if (!c) return '—';
  const name = [c.lastName, c.firstName].filter(Boolean).join(' ').trim();
  return name || c.email || c.phone || '—';
}
