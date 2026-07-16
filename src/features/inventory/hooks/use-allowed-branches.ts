import { useMemo } from 'react';
import { usePermissions } from '@/features/auth';
import { useBranches } from './use-branches';

/**
 * Danh sách chi nhánh tài khoản được phép thấy (RBAC). Super admin / role mọi
 * chi nhánh → toàn bộ; ngược lại lọc theo `branchIds` của role. Dùng cho bộ chọn
 * chi nhánh (đơn hàng, tồn kho, dashboard) để admin chỉ thấy chi nhánh của mình.
 */
export function useAllowedBranches() {
  const query = useBranches();
  const { allBranches, branchIds } = usePermissions();

  const data = useMemo(() => {
    if (!query.data) return query.data;
    if (allBranches) return query.data;
    const set = new Set(branchIds);
    return query.data.filter((b) => set.has(b.id));
  }, [query.data, allBranches, branchIds]);

  return { ...query, data };
}
