import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@/types';
import type {
  AppNotification,
  NotificationSetting,
  NotificationType,
} from '../types';

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export const notificationsApi = {
  list: (params: NotificationListParams) =>
    apiClient.get<PaginatedResult<AppNotification>>('/admin/notifications', {
      params,
    }),
  unreadCount: () =>
    apiClient.get<{ count: number }>('/admin/notifications/unread-count'),
  markRead: (id: string) =>
    apiClient.patch<{ count: number }>(`/admin/notifications/${id}/read`),
  readAll: () =>
    apiClient.post<{ count: number }>('/admin/notifications/read-all'),
  getSettings: () =>
    apiClient.get<NotificationSetting[]>('/admin/notifications/settings'),
  updateSettings: (settings: NotificationSetting[]) =>
    apiClient.put<NotificationSetting[]>('/admin/notifications/settings', {
      settings,
    }),
};
