import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  /** Chi nhánh đang được chọn ở topbar (branch switcher). null = tất cả. */
  currentBranchId: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentBranch: (branchId: string | null) => void;
}

/** UI-only client state. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      currentBranchId: null,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentBranch: (branchId) => set({ currentBranchId: branchId }),
    }),
    { name: 'lata-bo-ui' },
  ),
);
