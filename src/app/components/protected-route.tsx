import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/features/auth';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Guards every BO route. Rules:
 *  - no token → /login
 *  - token present → verify via GET /auth/me; keep loading until confirmed
 *  - confirmed non-admin → logout + /login
 */
export function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading, isError, error } = useProfile();

  // Đồng bộ role mới nhất từ BE vào store.
  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  // Không có token → về login (giữ lại đường dẫn muốn tới).
  if (!token) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  // 401 khi verify → interceptor đã logout; điều hướng về login.
  if (isError) {
    const status = (error as { status?: number } | undefined)?.status;
    if (status === 401) {
      return <Navigate to={ROUTES.login} replace />;
    }
  }

  // Đang xác thực phiên → hiển thị loading, tránh nháy nội dung.
  if (isLoading || !profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Chỉ nhân viên (admin) hoặc super admin mới vào được BO.
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    toast.error('Tài khoản của bạn không có quyền truy cập Back Office.');
    logout();
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}
