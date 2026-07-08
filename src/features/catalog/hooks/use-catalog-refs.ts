import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { brandsApi, type BrandInput } from '../api/brands-api';
import { categoriesApi, type CategoryInput } from '../api/categories-api';

export const brandKeys = { all: ['brands'] as const };
export const categoryKeys = { all: ['categories'] as const };

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.all,
    queryFn: () => brandsApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60_000,
  });
}

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BrandInput) => brandsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.all });
      toast.success('Đã tạo thương hiệu');
    },
    onError: toastError('Tạo thương hiệu thất bại'),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.all });
      toast.success('Đã xóa thương hiệu');
    },
    onError: toastError('Xóa thương hiệu thất bại'),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryInput) => categoriesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Đã tạo nhóm sản phẩm');
    },
    onError: toastError('Tạo nhóm sản phẩm thất bại'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CategoryInput> }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Đã cập nhật nhóm sản phẩm');
    },
    onError: toastError('Cập nhật nhóm sản phẩm thất bại'),
  });
}

/** Drag-and-drop reorder: one request for the whole batch, no success toast
 *  (too frequent/ambient an action to interrupt with one) — errors still
 *  surface since a silently-failed reorder would look like data loss. */
export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => categoriesApi.reorder(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: toastError('Sắp xếp nhóm sản phẩm thất bại'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Đã xóa nhóm sản phẩm');
    },
    onError: toastError('Xóa nhóm sản phẩm thất bại'),
  });
}
