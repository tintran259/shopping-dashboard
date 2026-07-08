import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import {
  categoryAttributesApi,
  type CategoryAttributeInput,
} from '../api/category-attributes-api';

export const categoryAttributeKeys = {
  all: (categoryId: string) => ['categories', categoryId, 'attributes'] as const,
};

function toastError(fallback: string) {
  return (error: unknown) => toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCategoryAttributes(categoryId: string | undefined) {
  return useQuery({
    queryKey: categoryAttributeKeys.all(categoryId ?? ''),
    queryFn: () => categoryAttributesApi.list(categoryId as string),
    enabled: !!categoryId,
  });
}

export function useCreateCategoryAttribute(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryAttributeInput) => categoryAttributesApi.create(categoryId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryAttributeKeys.all(categoryId) });
      toast.success('Đã thêm thuộc tính lọc');
    },
    onError: toastError('Thêm thuộc tính lọc thất bại'),
  });
}

export function useUpdateCategoryAttribute(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CategoryAttributeInput> }) =>
      categoryAttributesApi.update(categoryId, id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryAttributeKeys.all(categoryId) });
      toast.success('Đã cập nhật thuộc tính lọc');
    },
    onError: toastError('Cập nhật thuộc tính lọc thất bại'),
  });
}

export function useDeleteCategoryAttribute(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryAttributesApi.remove(categoryId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryAttributeKeys.all(categoryId) });
      toast.success('Đã xóa thuộc tính lọc');
    },
    onError: toastError('Xóa thuộc tính lọc thất bại'),
  });
}
