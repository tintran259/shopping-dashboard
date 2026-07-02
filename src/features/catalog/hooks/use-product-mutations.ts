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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.list({}) });
      qc.invalidateQueries({ queryKey: productKeys.all });
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
