import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth-store';
import { showNotificationToast } from '../components/notification-toast';
import { notificationKeys } from './use-notifications';
import type { AppNotification } from '../types';

/**
 * Kết nối WebSocket tới Notification Center của BE, xác thực bằng JWT hiện tại.
 * `notification:new` → làm mới danh sách + toast (bấm "Xem" điều hướng);
 * `notification:count` → cập nhật số chưa đọc tức thì. Tự ngắt khi logout.
 */
export function useNotificationsSocket() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const socket = io(`${env.wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification:new', (n: AppNotification) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      showNotificationToast(n, (link) => navigate(link));
    });

    socket.on('notification:count', (count: number) => {
      qc.setQueryData(notificationKeys.unread(), { count });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, qc, navigate]);
}
