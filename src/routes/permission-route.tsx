import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/features/auth';
import { NAV_GROUPS } from '@/config/nav';
import { useAuthStore } from '@/stores/auth-store';

type Can = (permission: string) => boolean;

/** Trang đầu tiên trong menu mà tài khoản được phép vào (theo thứ tự sidebar),
 *  hoặc null nếu không được cấp quyền vào đâu. */
function firstAccessibleRoute(can: Can, isSuperAdmin: boolean): string | null {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.superAdminOnly && !isSuperAdmin) continue;
      if (!item.permission || can(item.permission)) return item.to;
    }
  }
  return null;
}

/** Màn hình khi tài khoản chưa được cấp quyền vào bất kỳ khu vực nào. */
function NoAccess() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-3 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" />
      <p className="text-lg font-semibold">Chưa được cấp quyền</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tài khoản của bạn chưa được gán quyền vào khu vực nào. Vui lòng liên hệ
        quản trị viên để được cấp quyền.
      </p>
      <Button variant="outline" onClick={logout}>
        Đăng xuất
      </Button>
    </div>
  );
}

/** Điều hướng tới trang đầu tiên được phép (dùng cho route index). */
export function LandingRedirect() {
  const { can, isSuperAdmin } = usePermissions();
  const landing = firstAccessibleRoute(can, isSuperAdmin);
  return landing ? <Navigate to={landing} replace /> : <NoAccess />;
}

/**
 * Bọc một route: chỉ render khi tài khoản có `permission` (super admin luôn
 * qua). Thiếu quyền → điều hướng về trang đầu tiên được phép, hoặc màn "chưa
 * được cấp quyền" nếu không có khu vực nào. Không vào được `view` ⇒ không mở
 * được trang đó (đúng yêu cầu).
 */
export function PermissionRoute({
  permission,
  superAdminOnly,
  children,
}: {
  permission?: string;
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  const { can, isSuperAdmin } = usePermissions();
  const allowed =
    (!superAdminOnly || isSuperAdmin) && (!permission || can(permission));
  if (!allowed) {
    const landing = firstAccessibleRoute(can, isSuperAdmin);
    return landing ? <Navigate to={landing} replace /> : <NoAccess />;
  }
  return <>{children}</>;
}
