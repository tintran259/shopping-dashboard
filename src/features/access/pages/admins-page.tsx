import { useMemo, useState } from 'react';
import { Lock, LockOpen, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { AdminFormDialog } from '../components/admin-form-dialog';
import { useAdmins, useDeleteAdmin, useUpdateAdmin } from '../hooks/use-admins';
import type { AdminAccount } from '../types';

const fullName = (a: AdminAccount) =>
  [a.lastName, a.firstName].filter(Boolean).join(' ') || '—';

/** 1 dòng — tách để dùng hook mutation riêng cho từng tài khoản (khóa/mở nhanh). */
function AdminRow({
  admin,
  onEdit,
  onDelete,
}: {
  admin: AdminAccount;
  onEdit: (a: AdminAccount) => void;
  onDelete: (a: AdminAccount) => void;
}) {
  const update = useUpdateAdmin(admin.id);
  const isSuper = admin.role === 'super_admin';
  const locked = admin.status === 'disabled';
  const scope = admin.staffRole
    ? admin.staffRole.allBranches
      ? 'Mọi chi nhánh'
      : `${admin.staffRole.branchIds.length} chi nhánh`
    : '—';

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <p className="font-medium">{admin.email}</p>
        <p className="text-xs text-muted-foreground">{fullName(admin)}</p>
      </TableCell>
      <TableCell>
        {isSuper ? (
          <Badge variant="default">Super Admin</Badge>
        ) : admin.staffRole ? (
          <Badge variant="secondary">{admin.staffRole.name}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Chưa gán</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {isSuper ? 'Mọi chi nhánh' : scope}
      </TableCell>
      <TableCell>
        {locked ? (
          <Badge variant="destructive">Đã khóa</Badge>
        ) : (
          <Badge variant="success">Đang hoạt động</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isSuper ? (
          <span className="text-xs text-muted-foreground">Không thể sửa</span>
        ) : (
          <div className="flex justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              loading={update.isPending}
              title={locked ? 'Mở khóa' : 'Khóa tài khoản'}
              aria-label={locked ? 'Mở khóa' : 'Khóa'}
              onClick={() =>
                update.mutate({ status: locked ? 'active' : 'disabled' })
              }
            >
              {locked ? (
                <LockOpen className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(admin)}
              aria-label="Sửa"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => onDelete(admin)}
              aria-label="Xóa"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AdminsPage() {
  const query = useAdmins();
  const deleteAdmin = useDeleteAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [deleting, setDeleting] = useState<AdminAccount | null>(null);

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản admin"
        description="Tạo tài khoản nhân viên, gán vai trò, khóa/mở hoặc đặt lại mật khẩu."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm tài khoản
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<UserCog className="size-10" />}
          title="Chưa có tài khoản admin"
          description="Thêm tài khoản nhân viên và gán vai trò để phân quyền."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Thêm tài khoản
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tài khoản</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Phạm vi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((admin) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  onEdit={(a) => {
                    setEditing(a);
                    setFormOpen(true);
                  }}
                  onDelete={setDeleting}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} admin={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={`Xóa tài khoản "${deleting?.email}"?`}
        description="Tài khoản sẽ mất quyền truy cập ngay. Thao tác không thể hoàn tác."
        confirmLabel="Xóa tài khoản"
        cancelLabel="Không"
        loading={deleteAdmin.isPending}
        onConfirm={() =>
          deleting &&
          deleteAdmin.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}
