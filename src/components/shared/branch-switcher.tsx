import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllowedBranches } from '@/features/inventory';
import { cn } from '@/lib/utils';

const ALL_BRANCHES = '__all__';

interface BranchSwitcherProps {
  value: string | null;
  onChange: (branchId: string | null) => void;
}

/**
 * Shared branch selector. Controlled — each page owns its own selection (not
 * global state), so picking a branch on one page never affects another.
 * Picking a specific branch tints the trigger to signal a "focused" view.
 */
export function BranchSwitcher({ value, onChange }: BranchSwitcherProps) {
  const { data: branches, isLoading } = useAllowedBranches();
  const isScoped = !!value;

  return (
    <Select
      value={value ?? ALL_BRANCHES}
      onValueChange={(v) => onChange(v === ALL_BRANCHES ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger
        className={cn(
          'w-55 transition-colors',
          isScoped && 'border-primary/40 bg-primary/5',
        )}
      >
        <SelectValue placeholder="Chọn chi nhánh" />
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
