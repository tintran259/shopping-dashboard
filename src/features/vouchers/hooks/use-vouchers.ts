import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { vouchersApi } from '../api/vouchers-api';
import type { AdminVoucherListParams } from '../types';

export const voucherKeys = {
  all: ['vouchers'] as const,
  list: (params: AdminVoucherListParams) =>
    [...voucherKeys.all, 'list', params] as const,
  stats: () => [...voucherKeys.all, 'stats'] as const,
  detail: (id: string) => [...voucherKeys.all, 'detail', id] as const,
};

export function useVouchers(params: AdminVoucherListParams) {
  return useQuery({
    queryKey: voucherKeys.list(params),
    queryFn: () => vouchersApi.list(params),
    // Giữ dữ liệu trang trước khi đổi trang → không nháy skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useVoucherStats() {
  return useQuery({
    queryKey: voucherKeys.stats(),
    queryFn: () => vouchersApi.stats(),
  });
}

export function useVoucher(id: string | undefined) {
  return useQuery({
    queryKey: voucherKeys.detail(id ?? ''),
    queryFn: () => vouchersApi.getById(id as string),
    enabled: !!id,
  });
}
