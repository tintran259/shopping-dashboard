import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products-api';
import type { ProductListParams } from '../types';

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) =>
    [...productKeys.all, 'list', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => productsApi.getById(id as string),
    enabled: !!id,
  });
}
