import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { branchesApi } from '../api/branches-api';
import type {
  BranchStock,
  CreateBranchInput,
  UpdateBranchInput,
  UpsertInventoryInput,
} from '../types';

export const branchKeys = {
  all: ['branches'] as const,
  list: () => [...branchKeys.all, 'list'] as const,
  variantStock: (variantId: string) =>
    [...branchKeys.all, 'stock', variantId] as const,
};

export function useBranches() {
  return useQuery({
    queryKey: branchKeys.list(),
    queryFn: () => branchesApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useVariantStock(variantId: string | undefined) {
  return useQuery({
    queryKey: branchKeys.variantStock(variantId ?? ''),
    queryFn: () => branchesApi.variantStock(variantId as string),
    enabled: !!variantId,
  });
}

/** Stock for several variants at once (order-create validation). Results keep
 *  the same order as `variantIds`; shares the per-variant cache with
 *  {@link useVariantStock} (identical query keys), so rows and form-level
 *  validation never double-fetch. */
export function useVariantsStock(variantIds: string[]) {
  return useQueries({
    queries: variantIds.map((id) => ({
      queryKey: branchKeys.variantStock(id),
      queryFn: () => branchesApi.variantStock(id),
      enabled: !!id,
    })),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBranchInput) => branchesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.list() });
      toast.success('Đã tạo chi nhánh');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Tạo thất bại'),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBranchInput }) =>
      branchesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.list() });
      toast.success('Đã cập nhật chi nhánh');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Cập nhật thất bại'),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.list() });
      toast.success('Đã xóa chi nhánh');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Xóa thất bại'),
  });
}

export function useUpsertInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertInventoryInput) =>
      branchesApi.upsertInventory(body),
    onSuccess: (updated: BranchStock) => {
      qc.invalidateQueries({
        queryKey: branchKeys.variantStock(updated.variantId),
      });
      toast.success('Đã cập nhật tồn kho');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Cập nhật tồn kho thất bại'),
  });
}
