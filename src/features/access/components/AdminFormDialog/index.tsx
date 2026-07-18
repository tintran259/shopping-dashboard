import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoles } from '../../hooks/use-roles';
import { useCreateAdmin, useUpdateAdmin } from '../../hooks/use-admins';
import type { AdminAccount } from '../../types';

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tạo mới; AdminAccount = sửa. */
  admin: AdminAccount | null;
}

export function AdminFormDialog({ open, onOpenChange, admin }: AdminFormDialogProps) {
  const { data: roles } = useRoles();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin(admin?.id ?? '');
  const pending = createAdmin.isPending || updateAdmin.isPending;
  const isEdit = !!admin;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail(admin?.email ?? '');
    setPassword('');
    setFirstName(admin?.firstName ?? '');
    setLastName(admin?.lastName ?? '');
    setStaffRoleId(admin?.staffRoleId ?? '');
    setError(null);
  }, [open, admin]);

  const submit = () => {
    if (!staffRoleId) return setError('Chọn vai trò cho tài khoản');
    if (password && password.length < 8)
      return setError('Mật khẩu tối thiểu 8 ký tự');
    if (isEdit) {
      updateAdmin.mutate(
        {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          staffRoleId,
          ...(password ? { password } : {}),
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }
    if (!email.trim()) return setError('Nhập email');
    if (password.length < 8) return setError('Mật khẩu tối thiểu 8 ký tự');
    createAdmin.mutate(
      {
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        staffRoleId,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-5 text-primary" />
            {isEdit ? 'Sửa tài khoản admin' : 'Thêm tài khoản admin'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Đổi vai trò, họ tên, hoặc đặt lại mật khẩu.'
              : 'Tạo tài khoản nhân viên và gán một vai trò.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              disabled={isEdit}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@lata.vn"
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">Không đổi được email.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Họ</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nguyễn"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tên</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="An"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Vai trò</label>
            <Select value={staffRoleId} onValueChange={setStaffRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isEdit ? 'Đặt lại mật khẩu (tùy chọn)' : 'Mật khẩu'}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Để trống nếu không đổi' : 'Tối thiểu 8 ký tự'}
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Hủy
          </Button>
          <Button onClick={submit} loading={pending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
