import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import {
  notificationsApi,
  type NotificationListParams,
} from '../api/notifications-api';
import type { NotificationSetting } from '../types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: NotificationListParams) =>
    [...notificationKeys.all, 'list', params] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
};

export function useNotifications(params: NotificationListParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsApi.unreadCount(),
    select: (d) => d.count,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => notificationsApi.getSettings(),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: () => toast.error('Không đánh dấu đã đọc được'),
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: NotificationSetting[]) =>
      notificationsApi.updateSettings(settings),
    onSuccess: (data) => {
      qc.setQueryData(notificationKeys.settings(), data);
      toast.success('Đã lưu cài đặt thông báo');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Lưu cài đặt thất bại'),
  });
}
