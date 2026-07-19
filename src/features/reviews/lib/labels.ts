import type { ReviewCustomerRef } from '../types';

/** "Trần Như Tín" / rỗng nếu chưa nhập tên → dùng email/sđt làm fallback. */
export function reviewerDisplayName(c: ReviewCustomerRef | undefined): string {
  if (!c) return '—';
  const name = [c.lastName, c.firstName].filter(Boolean).join(' ').trim();
  return name || c.email || c.phone || '—';
}

/** Ký tự đầu cho avatar khách. */
export function reviewerInitial(c: ReviewCustomerRef | undefined): string {
  return reviewerDisplayName(c).charAt(0).toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
];

/** Màu nền avatar ổn định theo id/email (hash đơn giản). */
export function reviewerAvatarColor(c: ReviewCustomerRef | undefined): string {
  const seed = c?.id ?? c?.email ?? '';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-blue-500';
}
