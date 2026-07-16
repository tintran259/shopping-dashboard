import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { accessApi } from '../api/access-api';
import type { CreateAdminInput, UpdateAdminInput } from '../types';

export const adminKeys = {
  all: ['access', 'admins'] as const,
  list: () => [...adminKeys.all, 'list'] as const,
};

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useAdmins() {
  return useQuery({
    queryKey: adminKeys.list(),
    queryFn: () => accessApi.listAdmins(),
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminInput) => accessApi.createAdmin(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.list() });
      toast.success('Đã tạo tài khoản admin');
    },
    onError: toastError('Tạo tài khoản thất bại'),
  });
}

export function useUpdateAdmin(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAdminInput) => accessApi.updateAdmin(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.list() });
      toast.success('Đã cập nhật tài khoản');
    },
    onError: toastError('Cập nhật tài khoản thất bại'),
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessApi.deleteAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.list() });
      toast.success('Đã xóa tài khoản');
    },
    onError: toastError('Xóa tài khoản thất bại'),
  });
}
