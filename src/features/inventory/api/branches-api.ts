import { apiClient } from '@/lib/api-client';
import type {
  Branch,
  BranchStock,
  CreateBranchInput,
  UpdateBranchInput,
  UpsertInventoryInput,
} from '../types';

export const branchesApi = {
  list: () => apiClient.get<Branch[]>('/branches'),

  create: (body: CreateBranchInput) =>
    apiClient.post<Branch>('/branches', body),

  update: (id: string, body: UpdateBranchInput) =>
    apiClient.patch<Branch>(`/branches/${id}`, body),

  remove: (id: string) => apiClient.delete<void>(`/branches/${id}`),

  /** Per-branch stock rows for a single variant. */
  variantStock: (variantId: string) =>
    apiClient.get<BranchStock[]>(`/branches/inventory/variant/${variantId}`),

  /** Set stock for a (branch, variant) pair. */
  upsertInventory: (body: UpsertInventoryInput) =>
    apiClient.put<BranchStock>('/branches/inventory', body),
};
