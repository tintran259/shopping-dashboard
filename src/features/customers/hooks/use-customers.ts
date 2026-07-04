import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers-api';
import type { AdminCustomerListParams } from '../types';

export const customerKeys = {
  all: ['customers'] as const,
  list: (params: AdminCustomerListParams) =>
    [...customerKeys.all, 'list', params] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

export function useCustomers(params: AdminCustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.list(params),
    // Giữ dữ liệu trang trước khi đổi trang → không nháy skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => customersApi.getById(id as string),
    enabled: !!id,
  });
}
