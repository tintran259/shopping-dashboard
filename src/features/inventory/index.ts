export { BranchesPage } from './pages/branches-page';
export { InventoryPage } from './pages/inventory-page';
export {
  useBranches,
  useVariantStock,
  useVariantsStock,
  useUpsertInventory,
  branchKeys,
} from './hooks/use-branches';
export { useAllowedBranches } from './hooks/use-allowed-branches';
export { stockAvailability, type StockAvailability } from './lib/stock';
export type { Branch, BranchStock } from './types';
