import { Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/stores/auth-store';
import { LoginForm } from '../components/login-form';

export function LoginPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  // Đã đăng nhập admin thì bỏ qua trang login.
  if (isAdmin) return <Navigate to={ROUTES.dashboard} replace />;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Leaf className="size-6" />
          </div>
          <CardTitle className="text-xl">LATA&apos;s Đà Lạt · Back Office</CardTitle>
          <CardDescription>
            Đăng nhập bằng tài khoản quản trị viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
