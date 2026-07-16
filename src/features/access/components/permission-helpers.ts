import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Ticket,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { PermissionGroup } from '../types';

// ── Nhãn quyền (tiếng Việt) ────────────────────────────────────────────────
export const FEATURE_ICON: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ShoppingCart,
  catalog: Package,
  inventory: Warehouse,
  vouchers: Ticket,
  reviews: Star,
  customers: Users,
};

const NOUN: Record<string, string> = {
  orders: 'đơn hàng',
  catalog: 'sản phẩm',
  inventory: 'tồn kho',
  vouchers: 'voucher',
  reviews: 'đánh giá',
  customers: 'khách hàng',
  dashboard: 'tổng quan',
};
const VERB: Record<string, string> = {
  view: 'Xem',
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xóa',
};
const DESC: Record<string, string> = {
  view: 'Xem danh sách và chi tiết',
  create: 'Tạo mới',
  update: 'Cập nhật thông tin',
  delete: 'Xóa khỏi hệ thống',
};

export function actionLabel(feature: string, action: string): string {
  if (feature === 'dashboard') return 'Xem tổng quan';
  return `${VERB[action] ?? action} ${NOUN[feature] ?? feature}`;
}
export function actionDesc(feature: string, action: string): string {
  if (feature === 'dashboard') return 'Xem bảng điều khiển & thống kê';
  return DESC[action] ?? '';
}

// ── Trạng thái quyền: feature → tập action đã cấp ──────────────────────────
export type Granted = Record<string, Set<string>>;

export function grantedFromPermissions(
  catalog: PermissionGroup[],
  permissions: string[],
): Granted {
  const perms = new Set(permissions);
  const g: Granted = {};
  for (const grp of catalog) {
    const s = new Set<string>();
    for (const a of grp.actions) if (perms.has(`${grp.key}.${a}`)) s.add(a);
    g[grp.key] = s;
  }
  return g;
}

export function buildPermissions(granted: Granted): string[] {
  const out: string[] = [];
  for (const [feat, actions] of Object.entries(granted)) {
    for (const a of actions) out.push(`${feat}.${a}`);
    const write =
      actions.has('create') || actions.has('update') || actions.has('delete');
    // ghi ⇒ luôn kèm view (không mutate Set trong state).
    if (write && !actions.has('view')) out.push(`${feat}.view`);
  }
  return out;
}

/** Bật/tắt 1 action. Tắt "view" ⇒ tắt luôn create/update/delete. */
export function toggleGranted(
  prev: Granted,
  feature: string,
  action: string,
  on: boolean,
): Granted {
  const next = { ...prev };
  const s = new Set(next[feature] ?? []);
  if (on) s.add(action);
  else s.delete(action);
  if (action === 'view' && !on) {
    s.delete('create');
    s.delete('update');
    s.delete('delete');
  }
  next[feature] = s;
  return next;
}

/** Bật/tắt cả khu vực (master). */
export function toggleGroupGranted(
  prev: Granted,
  feature: string,
  actions: readonly string[],
  on: boolean,
): Granted {
  return { ...prev, [feature]: new Set(on ? actions : []) };
}
