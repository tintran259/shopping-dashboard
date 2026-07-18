import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/shared/switch';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { useBranches } from '@/features/inventory';
import { ROUTES } from '@/routes/paths';
import { PermissionMatrix } from '../PermissionMatrix';
import {
  buildPermissions,
  grantedFromPermissions,
  toggleGranted,
  toggleGroupGranted,
  type Granted,
} from '../permission-helpers';
import {
  usePermissionCatalog,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../../hooks/use-roles';
import { useAdmins } from '../../hooks/use-admins';
import type { Role } from '../../types';

/** "Store Manager HCM" → "STORE_MANAGER_HCM" (bỏ dấu). Mã hiển thị, không lưu. */
function roleCode(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'ROLE'
  );
}

/**
 * Trình soạn vai trò — dùng chung cho cả trang **tạo mới** (`role === null`) và
 * trang **chi tiết/sửa** (`role` có giá trị), nên 2 màn luôn cùng một layout.
 */
export function RoleEditor({ role }: { role: Role | null }) {
  const isEdit = role !== null;
  const navigate = useNavigate();
  const { data: catalog } = usePermissionCatalog();
  const { data: branches } = useBranches();
  const { data: admins } = useAdmins();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? '');
  const deleteRole = useDeleteRole();
  const saving = createRole.isPending || updateRole.isPending;

  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [granted, setGranted] = useState<Granted>({});
  const [allBranches, setAllBranches] = useState(role?.allBranches ?? false);
  const [branchIds, setBranchIds] = useState<string[]>(role?.branchIds ?? []);
  const [tab, setTab] = useState<'perms' | 'users'>('perms');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (catalog) setGranted(grantedFromPermissions(catalog, role?.permissions ?? []));
  }, [catalog, role?.permissions]);

  const permissions = useMemo(() => buildPermissions(granted), [granted]);
  const usersWithRole = useMemo(
    () => (isEdit ? (admins ?? []).filter((a) => a.staffRoleId === role.id) : []),
    [admins, isEdit, role],
  );

  const dirty = useMemo(() => {
    if (!isEdit) return true; // tạo mới: luôn cho phép submit (validate khi bấm).
    if (!catalog) return false; // chưa có catalog ⇒ granted rỗng, chưa so sánh được.
    const a = JSON.stringify({
      name: name.trim(),
      description: description.trim(),
      permissions: [...permissions].sort(),
      allBranches,
      branchIds: [...branchIds].sort(),
    });
    const b = JSON.stringify({
      name: role.name.trim(),
      description: (role.description ?? '').trim(),
      permissions: [...role.permissions].sort(),
      allBranches: role.allBranches,
      branchIds: [...role.branchIds].sort(),
    });
    return a !== b;
  }, [isEdit, catalog, name, description, permissions, allBranches, branchIds, role]);

  const submit = () => {
    setError(null);
    if (!name.trim()) return setError('Nhập tên vai trò');
    if (permissions.length === 0) return setError('Chọn ít nhất 1 quyền');
    if (!allBranches && branchIds.length === 0)
      return setError('Chọn ít nhất 1 chi nhánh, hoặc bật "Mọi chi nhánh"');
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      permissions,
      allBranches,
      branchIds: allBranches ? [] : branchIds,
    };
    if (isEdit) {
      // Sửa: ở lại trang, danh sách được invalidate → role refetch → dirty reset.
      updateRole.mutate(body);
    } else {
      // Tạo: về danh sách vai trò sau khi tạo xong.
      createRole.mutate(body, { onSuccess: () => navigate(ROUTES.roles) });
    }
  };

  const toggleBranch = (bid: string) =>
    setBranchIds((prev) =>
      prev.includes(bid) ? prev.filter((x) => x !== bid) : [...prev, bid],
    );

  return (
    <div className="space-y-6">
      <DetailHeader
        eyebrow={isEdit ? 'Vai trò · Chi tiết' : 'Vai trò · Tạo mới'}
        title={isEdit ? 'Chi tiết vai trò' : 'Tạo vai trò'}
        description={
          isEdit
            ? 'Xem và quản lý thông tin, quyền hạn và phạm vi chi nhánh.'
            : 'Chọn quyền theo khu vực và giới hạn phạm vi chi nhánh.'
        }
        actions={
          isEdit ? (
            <>
              <Button
                variant="outline"
                loading={updateRole.isPending}
                disabled={!dirty}
                onClick={submit}
              >
                <Save className="size-4" />
                Lưu thay đổi
              </Button>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Xóa vai trò
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => navigate(ROUTES.roles)}
              >
                Hủy
              </Button>
              <Button loading={createRole.isPending} onClick={submit}>
                <Plus className="size-4" />
                Tạo vai trò
              </Button>
            </>
          )
        }
      />

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Cột chính */}
        <main className="space-y-6">
          {/* Header card */}
          <Card>
            <CardContent className="py-5">
              <div className="flex gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="size-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-auto max-w-xs border-0 bg-transparent px-0 py-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                      placeholder="Tên vai trò"
                    />
                    {isEdit ? (
                      <Badge variant="success">Đang dùng</Badge>
                    ) : (
                      <Badge variant="info">Vai trò mới</Badge>
                    )}
                  </div>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 h-auto border-0 bg-transparent px-0 py-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
                    placeholder="Mô tả ngắn về vai trò…"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
                <Meta label="Mã vai trò" value={roleCode(name)} mono />
                {isEdit ? (
                  <>
                    <Meta label="Ngày tạo" value={formatDate(role.createdAt)} />
                    <Meta label="Cập nhật" value={formatDate(role.updatedAt)} />
                  </>
                ) : (
                  <Meta label="Ngày tạo" value="Sau khi lưu" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div>
            <div className="flex gap-1 border-b">
              <TabBtn active={tab === 'perms'} onClick={() => setTab('perms')}>
                Quyền hạn
              </TabBtn>
              <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
                Người dùng ({usersWithRole.length})
              </TabBtn>
            </div>

            <div className="pt-4">
              {tab === 'perms' ? (
                <PermissionMatrix
                  catalog={catalog ?? []}
                  granted={granted}
                  onToggle={(f, a, on) =>
                    setGranted((p) => toggleGranted(p, f, a, on))
                  }
                  onToggleGroup={(f, on) =>
                    setGranted((p) =>
                      toggleGroupGranted(
                        p,
                        f,
                        catalog?.find((g) => g.key === f)?.actions ?? [],
                        on,
                      ),
                    )
                  }
                />
              ) : (
                <UsersTab
                  users={usersWithRole.map((u) => ({
                    id: u.id,
                    email: u.email ?? '—',
                    name: [u.lastName, u.firstName].filter(Boolean).join(' '),
                    locked: u.status === 'disabled',
                  }))}
                  emptyText={
                    isEdit
                      ? 'Chưa có tài khoản nào được gán vai trò này.'
                      : 'Lưu vai trò trước, sau đó gán cho tài khoản ở trang Tài khoản admin.'
                  }
                />
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tóm tắt vai trò</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                icon={<ShieldCheck className="size-4 text-success" />}
                label="Trạng thái"
              >
                {isEdit ? (
                  <Badge variant="success">Đang dùng</Badge>
                ) : (
                  <Badge variant="info">Vai trò mới</Badge>
                )}
              </SummaryRow>
              <SummaryRow
                icon={<KeyRound className="size-4 text-primary" />}
                label="Tổng số quyền"
              >
                <span className="font-medium tabular-nums">{permissions.length}</span>
              </SummaryRow>
              <SummaryRow
                icon={<Building2 className="size-4 text-info" />}
                label="Chi nhánh truy cập"
              >
                <span className="font-medium tabular-nums">
                  {allBranches ? 'Tất cả' : branchIds.length}
                </span>
              </SummaryRow>
              <SummaryRow
                icon={<Users className="size-4 text-warning" />}
                label="Người dùng"
              >
                <span className="font-medium tabular-nums">
                  {usersWithRole.length}
                </span>
              </SummaryRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chi nhánh truy cập</CardTitle>
              <p className="text-xs text-muted-foreground">
                Chi nhánh mà vai trò này được phép làm việc.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Mọi chi nhánh</p>
                  <p className="text-xs text-muted-foreground">
                    Bật = truy cập tất cả chi nhánh.
                  </p>
                </div>
                <Switch checked={allBranches} onCheckedChange={setAllBranches} />
              </div>

              {!allBranches && (
                <div className="space-y-2">
                  {(branches ?? []).map((b) => {
                    const checked = branchIds.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors',
                          checked && 'border-primary/40 bg-primary/5',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Building2 className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm">{b.name}</span>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={() => toggleBranch(b.id)}
                        />
                      </div>
                    );
                  })}
                  <p className="pt-1 text-xs text-muted-foreground">
                    {branchIds.length} / {branches?.length ?? 0} chi nhánh được chọn
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {isEdit && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          destructive
          title={`Xóa vai trò "${role.name}"?`}
          description="Không xóa được nếu vai trò đang gán cho tài khoản nào. Thao tác không thể hoàn tác."
          confirmLabel="Xóa vai trò"
          cancelLabel="Không"
          loading={deleteRole.isPending}
          onConfirm={() =>
            deleteRole.mutate(role.id, {
              onSuccess: () => navigate(ROUTES.roles),
            })
          }
        />
      )}
    </div>
  );
}

/** Header trang: back + breadcrumb + tiêu đề, slot nút thao tác bên phải. */
function DetailHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5"
          onClick={() => navigate(ROUTES.roles)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('truncate text-sm font-medium', mono && 'font-mono')}>
        {value}
      </p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function UsersTab({
  users,
  emptyText,
}: {
  users: { id: string; email: string; name: string; locked: boolean }[];
  emptyText: string;
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="divide-y rounded-lg border">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserCircle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{u.email}</p>
            {u.name && (
              <p className="truncate text-xs text-muted-foreground">{u.name}</p>
            )}
          </div>
          {u.locked ? (
            <Badge variant="destructive">Đã khóa</Badge>
          ) : (
            <Badge variant="success">Hoạt động</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
