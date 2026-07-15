import { InventoryStatus } from '@/types';
import type { BranchStock } from '../types';

export interface StockAvailability {
  /** quantity − reserved, floored at 0. */
  available: number;
  /** Branch sells this variant as preorder (stock overage is allowed). */
  isPreorder: boolean;
}

/**
 * Available stock for a variant at a specific branch, plus whether that branch
 * sells it as preorder. Returns `null` when the branch is unknown or has no
 * stock row for the variant (availability can't be asserted). Single source of
 * truth for both the on-screen warnings and the submit-blocking validation, so
 * the two never drift.
 */
export function stockAvailability(
  stock: BranchStock[] | undefined,
  branchId: string | undefined,
): StockAvailability | null {
  if (!branchId) return null;
  const branchStock = stock?.find((s) => s.branchId === branchId);
  if (!branchStock) return null;
  return {
    available: Math.max(0, branchStock.quantity - branchStock.reserved),
    isPreorder: branchStock.status === InventoryStatus.PREORDER,
  };
}
