import { Warehouse } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranches } from '@/features/inventory';
import { useUiStore } from '@/stores/ui-store';

const ALL_BRANCHES = '__all__';

/** Topbar branch selector; drives the `currentBranchId` UI state. */
export function BranchSwitcher() {
  const { data: branches, isLoading } = useBranches();
  const currentBranchId = useUiStore((s) => s.currentBranchId);
  const setCurrentBranch = useUiStore((s) => s.setCurrentBranch);

  return (
    <Select
      value={currentBranchId ?? ALL_BRANCHES}
      onValueChange={(v) => setCurrentBranch(v === ALL_BRANCHES ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <span className="flex items-center gap-2 truncate">
          <Warehouse className="size-4 text-muted-foreground" />
          <SelectValue placeholder="Chọn chi nhánh" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_BRANCHES}>Tất cả chi nhánh</SelectItem>
        {branches?.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
