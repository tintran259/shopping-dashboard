import {
  MessageSquareWarning,
  Package,
  RotateCcw,
  Settings2,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '../types';

interface TypeMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Loại đã hoạt động? Hiện chỉ `order`; còn lại để dành, hiện disabled. */
  implemented: boolean;
}

export const NOTIFICATION_META: Record<NotificationType, TypeMeta> = {
  order: {
    label: 'Đơn hàng',
    description: 'Khi có đơn hàng mới tại chi nhánh bạn quản lý.',
    icon: ShoppingCart,
    implemented: true,
  },
  review: {
    label: 'Đánh giá',
    description: 'Khi sản phẩm bị đánh giá điểm thấp (≤2★) cần xử lý.',
    icon: Star,
    implemented: true,
  },
  complaint: {
    label: 'Khiếu nại',
    description: 'Khi khách gửi khiếu nại về đơn hàng.',
    icon: MessageSquareWarning,
    implemented: false,
  },
  refund: {
    label: 'Hoàn tiền',
    description: 'Khi có yêu cầu hoàn tiền cần xử lý.',
    icon: RotateCcw,
    implemented: false,
  },
  inventory: {
    label: 'Tồn kho',
    description: 'Khi tồn kho thấp hoặc hết hàng.',
    icon: Warehouse,
    implemented: false,
  },
  promotion: {
    label: 'Khuyến mãi',
    description: 'Khi chương trình khuyến mãi bắt đầu/kết thúc.',
    icon: Ticket,
    implemented: false,
  },
  customer: {
    label: 'Khách hàng',
    description: 'Khi có khách hàng mới hoặc cần chăm sóc.',
    icon: Users,
    implemented: false,
  },
  product: {
    label: 'Sản phẩm',
    description: 'Khi sản phẩm thay đổi trạng thái đáng chú ý.',
    icon: Package,
    implemented: false,
  },
  system: {
    label: 'Hệ thống',
    description: 'Thông báo hệ thống & bảo trì.',
    icon: Settings2,
    implemented: false,
  },
};

/** Icon dự phòng khi type lạ (không có trong map). */
export const FALLBACK_NOTIFICATION_ICON = Tag;

/** "x phút trước" theo tiếng Việt. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
