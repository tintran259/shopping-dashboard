import type { BaseEntity, InventoryStatus } from '@/types';

export interface Branch extends BaseEntity {
  name: string;
  address?: string;
  city?: string;
  provinceCode?: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateBranchInput {
  name: string;
  address?: string;
  city?: string;
  provinceCode?: string;
  phone?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

/** Per-branch stock for a variant, from GET /branches/inventory/variant/:id. */
export interface BranchStock extends BaseEntity {
  branchId: string;
  variantId: string;
  quantity: number;
  reserved: number;
  status: InventoryStatus;
  /** available = quantity − reserved (BE-derived; do not recompute for truth). */
  branch?: Branch;
}

export interface UpsertInventoryInput {
  branchId: string;
  variantId: string;
  quantity: number;
  status?: InventoryStatus;
}
