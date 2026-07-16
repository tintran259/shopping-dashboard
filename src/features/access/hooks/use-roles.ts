import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { accessApi } from '../api/access-api';
import type { RoleInput } from '../types';

export const roleKeys = {
  all: ['access', 'roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
};

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

/** Catalog nhóm quyền (ít đổi) — dựng ma trận quyền trong form. */
export function usePermissionCatalog() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => accessApi.permissionCatalog(),
    staleTime: 30 * 60_000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => accessApi.listRoles(),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoleInput) => accessApi.createRole(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list() });
      toast.success('Đã tạo vai trò');
    },
    onError: toastError('Tạo vai trò thất bại'),
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<RoleInput>) => accessApi.updateRole(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list() });
      toast.success('Đã cập nhật vai trò');
    },
    onError: toastError('Cập nhật vai trò thất bại'),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessApi.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list() });
      toast.success('Đã xóa vai trò');
    },
    // BE chặn xóa role đang gán → hiện message nguyên văn.
    onError: toastError('Xóa vai trò thất bại'),
  });
}
