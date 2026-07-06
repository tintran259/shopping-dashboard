import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { vouchersApi } from '../api/vouchers-api';
import type { UpdateVoucherInput, VoucherInput } from '../types';
import { voucherKeys } from './use-vouchers';

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VoucherInput) => vouchersApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.all });
      toast.success('Đã tạo mã giảm giá');
    },
    onError: toastError('Tạo mã giảm giá thất bại'),
  });
}

export function useUpdateVoucher(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateVoucherInput) => vouchersApi.update(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(voucherKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: voucherKeys.all });
      toast.success('Đã cập nhật mã giảm giá');
    },
    onError: toastError('Cập nhật mã giảm giá thất bại'),
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vouchersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.all });
      toast.success('Đã xóa mã giảm giá');
    },
    onError: toastError('Xóa mã giảm giá thất bại'),
  });
}
