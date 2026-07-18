import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { ROUTES } from '@/routes/paths';
import { ApiError } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth-store';
import { useLogin } from '../../hooks/use-login';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        // Nhân viên (admin) hoặc super admin mới được vào BO.
        if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
          toast.error('Tài khoản này không có quyền truy cập Back Office.');
          return;
        }
        setSession(data.accessToken, data.user);
        toast.success('Đăng nhập thành công');
        navigate(ROUTES.dashboard, { replace: true });
      },
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : 'Đăng nhập thất bại';
        toast.error(message);
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          label="Email"
          render={(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              placeholder="admin@latadalat.vn"
            />
          )}
        />
        <FormField
          control={form.control}
          name="password"
          label="Mật khẩu"
          render={(field) => (
            <Input
              {...field}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          )}
        />
        <Button type="submit" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
      </form>
    </Form>
  );
}
