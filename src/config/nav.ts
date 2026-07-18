import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Package,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  UserCog,
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
  /** Quyền `<feature>.view` cần có để thấy mục này. Bỏ trống = ai vào BO cũng thấy. */
  permission?: string;
  /** Chỉ Super Admin thấy (màn quản trị role/tài khoản admin). */
  superAdminOnly?: boolean;
  /** Mở cửa sổ mới thay vì điều hướng nội bộ (vd auto-login CMS). `to` chỉ là id. */
  external?: boolean;
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
      {
        label: 'Bảng điều khiển',
        to: ROUTES.dashboard,
        icon: LayoutDashboard,
        permission: 'dashboard.view',
      },
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
        permission: 'orders.view',
      },
      {
        label: 'Mã giảm giá',
        to: ROUTES.vouchers,
        icon: Ticket,
        matchPrefixes: ['/vouchers'],
        permission: 'vouchers.view',
      },
      {
        label: 'Khách hàng',
        to: ROUTES.customers,
        icon: Users,
        matchPrefixes: ['/customers'],
        permission: 'customers.view',
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
        permission: 'catalog.view',
      },
      {
        label: 'Nhóm sản phẩm',
        to: ROUTES.categories,
        icon: FolderTree,
        permission: 'catalog.view',
      },
      {
        label: 'Thương hiệu',
        to: ROUTES.brands,
        icon: Tag,
        permission: 'catalog.view',
      },
    ],
  },
  {
    label: 'Kho & Chi nhánh',
    items: [
      {
        label: 'Chi nhánh',
        to: ROUTES.branches,
        icon: Warehouse,
        permission: 'inventory.view',
      },
      {
        label: 'Tồn kho',
        to: ROUTES.inventory,
        icon: Boxes,
        permission: 'inventory.view',
      },
    ],
  },
  {
    label: 'Nội dung & Hệ thống',
    items: [
      {
        label: 'Đánh giá',
        to: ROUTES.reviews,
        icon: Star,
        permission: 'reviews.view',
      },
      {
        label: 'Địa chỉ (Tỉnh/Phường)',
        to: ROUTES.locations,
        icon: MapPin,
        permission: 'inventory.view',
      },
      {
        label: 'CMS (Nội dung)',
        to: '#cms',
        icon: Newspaper,
        permission: 'cms.view',
        external: true,
      },
    ],
  },
  {
    label: 'Phân quyền',
    items: [
      {
        label: 'Vai trò',
        to: ROUTES.roles,
        icon: ShieldCheck,
        superAdminOnly: true,
      },
      {
        label: 'Tài khoản admin',
        to: ROUTES.admins,
        icon: UserCog,
        superAdminOnly: true,
      },
    ],
  },
];
