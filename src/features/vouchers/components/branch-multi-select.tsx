import { useBranches } from '@/features/inventory';
import { cn } from '@/lib/utils';
import type { VoucherBranchRef } from '../types';

interface BranchMultiSelectProps {
  value: VoucherBranchRef[];
  onChange: (value: VoucherBranchRef[]) => void;
}

/** Checkbox list (not search) — the branch count is small and already fully
 *  loaded everywhere else in the app. Checking none = no branch restriction;
 *  1 = specific to that branch; several = the "group" case. */
export function BranchMultiSelect({ value, onChange }: BranchMultiSelectProps) {
  const { data: branches, isLoading } = useBranches();

  const toggle = (b: VoucherBranchRef) => {
    const checked = value.some((v) => v.id === b.id);
    onChange(checked ? value.filter((v) => v.id !== b.id) : [...value, b]);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải danh sách chi nhánh…</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(branches ?? []).map((b) => {
        const checked = value.some((v) => v.id === b.id);
        return (
          <label
            key={b.id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              checked ? 'border-primary bg-primary/5' : 'hover:bg-accent',
            )}
          >
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={checked}
              onChange={() => toggle({ id: b.id, name: b.name })}
            />
            {b.name}
          </label>
        );
      })}
    </div>
  );
}
