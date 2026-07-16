import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Quyền của tài khoản hiện tại (từ auth store). `can(permission)` là cách kiểm
 * chuẩn: super admin luôn true; admin thường true nếu quyền nằm trong role. Dùng
 * để ẩn/hiện menu, gate route, và ẩn nút thao tác (`.manage`).
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const isSuperAdmin = !!user?.isSuperAdmin;
    const permissions = user?.permissions ?? [];
    const set = new Set(permissions);
    const can = (permission: string) => isSuperAdmin || set.has(permission);
    return {
      isSuperAdmin,
      permissions,
      allBranches: !!user?.allBranches,
      branchIds: user?.branchIds ?? [],
      can,
    };
  }, [user]);
}
