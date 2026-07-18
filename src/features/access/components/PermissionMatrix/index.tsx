import { useMemo, useState } from 'react';
import { ChevronDown, Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/shared/switch';
import { cn } from '@/lib/utils';
import type { PermissionGroup } from '../../types';
import {
  FEATURE_ICON,
  actionDesc,
  actionLabel,
  type Granted,
} from '../permission-helpers';

interface PermissionMatrixProps {
  catalog: PermissionGroup[];
  granted: Granted;
  onToggle: (feature: string, action: string, on: boolean) => void;
  onToggleGroup: (feature: string, on: boolean) => void;
}

export function PermissionMatrix({
  catalog,
  granted,
  onToggle,
  onToggleGroup,
}: PermissionMatrixProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const searching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  const groups = useMemo<
    { key: string; label: string; actions: readonly string[] }[]
  >(() => {
    if (!searching)
      return catalog.map((g) => ({
        key: g.key,
        label: g.label,
        actions: g.actions,
      }));
    const out: { key: string; label: string; actions: readonly string[] }[] = [];
    for (const g of catalog) {
      const labelMatch = g.label.toLowerCase().includes(q);
      const matched = g.actions.filter(
        (a) =>
          actionLabel(g.key, a).toLowerCase().includes(q) ||
          actionDesc(g.key, a).toLowerCase().includes(q),
      );
      if (labelMatch) out.push({ key: g.key, label: g.label, actions: g.actions });
      else if (matched.length)
        out.push({ key: g.key, label: g.label, actions: matched });
    }
    return out;
  }, [catalog, searching, q]);

  const collapseAll = () =>
    setCollapsed((prev) =>
      prev.size === catalog.length ? new Set() : new Set(catalog.map((g) => g.key)),
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm quyền…"
            className="pl-8"
          />
        </div>
        <button
          type="button"
          onClick={collapseAll}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          {collapsed.size === catalog.length ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const actions = granted[group.key] ?? new Set<string>();
          const allActions = catalog.find((c) => c.key === group.key)!.actions;
          const allOn = allActions.every((a) => actions.has(a));
          const isCollapsed = collapsed.has(group.key) && !searching;
          const canView = actions.has('view');
          const Icon = FEATURE_ICON[group.key] ?? Package;

          return (
            <div key={group.key} className="overflow-hidden rounded-lg border">
              {/* Header khu vực */}
              <div className="flex items-center gap-2 bg-muted/40 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(group.key)) next.delete(group.key);
                      else next.add(group.key);
                      return next;
                    })
                  }
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-semibold">
                    {group.label}
                  </span>
                </button>
                <Switch
                  checked={allOn}
                  onCheckedChange={(on) => onToggleGroup(group.key, on)}
                />
              </div>

              {/* Rows */}
              {!isCollapsed && (
                <div className="divide-y">
                  {group.actions.map((action) => {
                    const disabled = action !== 'view' && !canView;
                    return (
                      <div
                        key={action}
                        className={cn(
                          'flex items-center justify-between gap-3 px-3 py-2.5 pl-9',
                          disabled && 'opacity-50',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {actionLabel(group.key, action)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {actionDesc(group.key, action)}
                          </p>
                        </div>
                        <Switch
                          checked={actions.has(action)}
                          disabled={disabled}
                          onCheckedChange={(on) =>
                            onToggle(group.key, action, on)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
