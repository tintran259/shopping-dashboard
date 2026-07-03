import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders-api';
import type { AdminOrderListParams, OrderSummaryParams } from '../types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: AdminOrderListParams) =>
    [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  summary: (params: OrderSummaryParams) =>
    [...orderKeys.all, 'summary', params] as const,
};

export function useOrders(params: AdminOrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    // Giữ dữ liệu trang trước khi đổi trang → không nháy skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useOrderSummary(params: OrderSummaryParams) {
  return useQuery({
    queryKey: orderKeys.summary(params),
    queryFn: () => ordersApi.summary(params),
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
