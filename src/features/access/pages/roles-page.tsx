import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { useBranches } from '@/features/inventory';
import { ROUTES } from '@/app/routes';
import { usePermissionCatalog, useRoles, useDeleteRole } from '../hooks/use-roles';
import type { Role } from '../types';

/** Gom quyền của role theo khu vực → [{label, manage}] để render badge. */
function useRoleSummary() {
  const { data: catalog } = usePermissionCatalog();
  return useMemo(() => {
    const byKey = new Map((catalog ?? []).map((g) => [g.key, g.label]));
    return (role: Role) => {
      const perms = new Set(role.permissions);
      const rows: { label: string; manage: boolean }[] = [];
      for (const [key, label] of byKey) {
        // Có bất kỳ thao tác ghi nào (Thêm/Sửa/Xóa) = "toàn quyền"; chỉ view = xem.
        const write =
          perms.has(`${key}.create`) ||
          perms.has(`${key}.update`) ||
          perms.has(`${key}.delete`);
        if (write) rows.push({ label, manage: true });
        else if (perms.has(`${key}.view`)) rows.push({ label, manage: false });
      }
      return rows;
    };
  }, [catalog]);
}

export function RolesPage() {
  const navigate = useNavigate();
  const query = useRoles();
  const { data: branches } = useBranches();
  const deleteRole = useDeleteRole();
  const summarize = useRoleSummary();

  const [deleting, setDeleting] = useState<Role | null>(null);

  const branchName = useMemo(() => {
    const map = new Map((branches ?? []).map((b) => [b.id, b.name]));
    return (id: string) => map.get(id) ?? '—';
  }, [branches]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vai trò"
        description="Gói quyền theo khu vực + phạm vi chi nhánh, rồi gán cho tài khoản admin."
        actions={
          <Button onClick={() => navigate(ROUTES.roleNew)}>
            <Plus className="size-4" />
            Tạo vai trò
          </Button>
        }
      />

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Shield className="size-10" />}
          title="Chưa có vai trò nào"
          description="Tạo vai trò đầu tiên để phân quyền cho nhân viên."
          action={
            <Button onClick={() => navigate(ROUTES.roleNew)}>
              <Plus className="size-4" />
              Tạo vai trò
            </Button>
          }
        />
      ) : (
        <div className="divide-y rounded-lg border">
          {(query.data ?? []).map((role) => {
            const rows = summarize(role);
            return (
              <div
                key={role.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(ROUTES.roleDetail(role.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(ROUTES.roleDetail(role.id));
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{role.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {rows.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Chưa cấp quyền
                      </span>
                    ) : (
                      <>
                        {rows.slice(0, 4).map((r) => (
                          <Badge
                            key={r.label}
                            variant={r.manage ? 'default' : 'info'}
                            className="font-normal"
                          >
                            {r.label}
                          </Badge>
                        ))}
                        {rows.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{rows.length - 4}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="hidden max-w-48 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <Building2 className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {role.allBranches
                      ? 'Mọi chi nhánh'
                      : role.branchIds.length
                        ? role.branchIds.map(branchName).join(', ')
                        : 'Chưa gán CN'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive"
                  aria-label="Xóa vai trò"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(role);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={`Xóa vai trò "${deleting?.name}"?`}
        description="Không xóa được nếu vai trò đang gán cho tài khoản nào. Thao tác không thể hoàn tác."
        confirmLabel="Xóa vai trò"
        cancelLabel="Không"
        loading={deleteRole.isPending}
        onConfirm={() =>
          deleting &&
          deleteRole.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}
