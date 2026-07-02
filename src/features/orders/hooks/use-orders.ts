import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PaginationParams } from '@/types';
import { ordersApi } from '../api/orders-api';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: PaginationParams) =>
    [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders(params: PaginationParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    // Giữ dữ liệu trang trước khi đổi trang → không nháy skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => ordersApi.getById(id as string),
    enabled: !!id,
  });
}
