import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomerStatus } from '@/types';
import { ApiError } from '@/lib/api-error';
import { customersApi } from '../api/customers-api';
import type { CreateB2bCustomerInput } from '../types';
import { customerKeys } from './use-customers';

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCreateB2bCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateB2bCustomerInput) => customersApi.createB2b(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Đã tạo khách hàng B2B');
    },
    onError: toastError('Tạo khách hàng B2B thất bại'),
  });
}

export function useUpdateCustomerStatus(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: CustomerStatus) =>
      customersApi.updateStatus(customerId, status),
    onSuccess: (updated) => {
      qc.setQueryData(customerKeys.detail(customerId), updated);
      qc.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Đã cập nhật trạng thái tài khoản');
    },
    onError: toastError('Cập nhật trạng thái thất bại'),
  });
}
