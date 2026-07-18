import { useMemo } from 'react';
import { ExternalLink, Leaf } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePermissions } from '@/features/auth';
import { useOpenCms } from '@/features/cms';
import { NAV_GROUPS } from '@/config/nav';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

export function Sidebar() {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const { can, isSuperAdmin } = usePermissions();
  const { openCms, isPending: openingCms } = useOpenCms();

  // Ẩn mục không có quyền `view` (và mục super-admin-only nếu không phải super
  // admin); ẩn luôn nhóm rỗng sau khi lọc.
  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            (!item.superAdminOnly || isSuperAdmin) &&
            (!item.permission || can(item.permission)),
        ),
      })).filter((g) => g.items.length > 0),
    [can, isSuperAdmin],
  );

  const isActive = (to: string, prefixes?: string[]) => {
    if (location.pathname === to) return true;
    return (prefixes ?? []).some((p) => location.pathname.startsWith(p));
  };

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r bg-card transition-[width] md:flex md:flex-col',
        collapsed ? 'md:w-16' : 'md:w-64',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Leaf className="size-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">LATA&apos;s Đà Lạt</span>
            <span className="text-xs text-muted-foreground">Back Office</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const baseClass = cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center',
              );

              // Mục "mở cửa sổ mới" (vd CMS) — nút hành động, không phải route.
              if (item.external) {
                return (
                  <button
                    key={item.to}
                    type="button"
                    title={item.label}
                    disabled={openingCms}
                    onClick={openCms}
                    className={cn(
                      baseClass,
                      'w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        <ExternalLink className="ml-auto size-3.5 shrink-0 opacity-60" />
                      </>
                    )}
                  </button>
                );
              }

              const active = isActive(item.to, item.matchPrefixes);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    baseClass,
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
