import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/app/routes';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Also highlight when the current path starts with these prefixes. */
  matchPrefixes?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Sidebar navigation, nhóm theo domain nghiệp vụ. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { label: 'Bảng điều khiển', to: ROUTES.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Bán hàng',
    items: [
      {
        label: 'Đơn hàng',
        to: ROUTES.orders,
        icon: ShoppingCart,
        matchPrefixes: ['/orders'],
      },
      {
        label: 'Mã giảm giá',
        to: ROUTES.vouchers,
        icon: Ticket,
        matchPrefixes: ['/vouchers'],
      },
      {
        label: 'Khách hàng',
        to: ROUTES.customers,
        icon: Users,
        matchPrefixes: ['/customers'],
      },
    ],
  },
  {
    label: 'Danh mục sản phẩm',
    items: [
      {
        label: 'Sản phẩm',
        to: ROUTES.products,
        icon: Package,
        matchPrefixes: ['/catalog/products'],
      },
      { label: 'Nhóm sản phẩm', to: ROUTES.categories, icon: FolderTree },
      { label: 'Thương hiệu', to: ROUTES.brands, icon: Tag },
    ],
  },
  {
    label: 'Kho & Chi nhánh',
    items: [
      { label: 'Chi nhánh', to: ROUTES.branches, icon: Warehouse },
      { label: 'Tồn kho', to: ROUTES.inventory, icon: Boxes },
    ],
  },
  {
    label: 'Nội dung & Hệ thống',
    items: [
      { label: 'Đánh giá', to: ROUTES.reviews, icon: Star },
      { label: 'Địa chỉ (Tỉnh/Phường)', to: ROUTES.locations, icon: MapPin },
    ],
  },
];
