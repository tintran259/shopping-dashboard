import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { productsApi } from '../api/products-api';
import type { CreateProductInput, UpdateProductInput } from '../types';
import { productKeys } from './use-products';

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductInput) => productsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      toast.success('Đã tạo sản phẩm');
    },
    onError: toastError('Tạo sản phẩm thất bại'),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProductInput) => productsApi.update(id, body),
    onSuccess: (updated) => {
      // The PATCH response already IS the fresh detail (BE returns the full
      // entity) — write it straight into the cache instead of invalidating
      // `productKeys.detail(id)`/`.all`. The edit page's `useProduct(id)` is
      // still mounted at this point, so invalidating it (a stale query React
      // Query refetches immediately for active subscribers) fired a redundant
      // GET right after the PATCH for no new data.
      qc.setQueryData(productKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: productKeys.list({}) });
      // A status change to out_of_stock/discontinued resets stock BE-side —
      // the Inventory page's cache for this product's variants would
      // otherwise keep showing pre-reset quantities. Invalidated by the raw
      // key literal (matching `branchKeys.all` in the inventory feature) —
      // not imported from there, since inventory already imports from
      // catalog and a reverse import would make the two features circular.
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Đã cập nhật sản phẩm');
    },
    onError: toastError('Cập nhật sản phẩm thất bại'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      toast.success('Đã xóa sản phẩm');
    },
    onError: toastError('Xóa sản phẩm thất bại'),
  });
}
