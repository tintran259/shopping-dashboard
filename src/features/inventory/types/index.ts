import type { BaseEntity, InventoryStatus } from '@/types';

export interface Branch extends BaseEntity {
  name: string;
  address?: string;
  city?: string;
  provinceCode?: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
  /** GHN "shop id" this branch ships from — the pickup address itself is
   *  configured once in GHN's own merchant dashboard against this id. */
  ghnShopId?: string;
  /** District/ward (quận/huyện, phường/xã) this branch ships from, for GHTK's
   *  pickup address — GHTK requires them but our own location data no
   *  longer models a district level (2025 reform: province → ward only). */
  ghtkPickupDistrict?: string;
  ghtkPickupWard?: string;
}

export interface CreateBranchInput {
  name: string;
  address?: string;
  city?: string;
  provinceCode?: string;
  phone?: string;
  isDefault?: boolean;
  isActive?: boolean;
  ghnShopId?: string;
  ghtkPickupDistrict?: string;
  ghtkPickupWard?: string;
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
