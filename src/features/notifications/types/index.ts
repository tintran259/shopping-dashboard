import type { BaseEntity } from '@/types';

/** Đồng bộ với `NotificationType` ở BE (`common/enums.ts`). */
export const NOTIFICATION_TYPES = [
  'order',
  'review',
  'complaint',
  'refund',
  'inventory',
  'promotion',
  'customer',
  'product',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationData {
  orderId?: string;
  orderCode?: string;
  branchId?: string;
  branchName?: string;
  [key: string]: unknown;
}

/** Đặt tên `AppNotification` để không đụng global `Notification` của DOM. */
export interface AppNotification extends BaseEntity {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  data?: NotificationData | null;
  /** Null = chưa đọc. */
  readAt?: string | null;
}

export interface NotificationSetting {
  type: NotificationType;
  enabled: boolean;
}
