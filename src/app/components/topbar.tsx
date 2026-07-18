import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/features/notifications';
import { useUiStore } from '@/stores/ui-store';
import { AccountMenu } from './account-menu';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ẩn/hiện thanh điều hướng"
          onClick={toggleSidebar}
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
