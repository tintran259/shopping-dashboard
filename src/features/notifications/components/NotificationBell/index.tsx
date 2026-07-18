import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck, Inbox, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/routes/paths';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '../../hooks/use-notifications';
import { NotificationItem } from '../NotificationItem';
import type { AppNotification } from '../../types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: count = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ page: 1, limit: 8 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = data?.data ?? [];

  const onItemClick = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const goto = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Thông báo"
          className="relative"
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white ring-2 ring-background">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-100 overflow-hidden rounded-xl p-0 shadow-xl shadow-primary/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">Thông báo</h3>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="size-3.5" />
                Đọc tất cả
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label="Cài đặt thông báo"
              onClick={() => goto(ROUTES.notificationSettings)}
            >
              <Settings2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-104 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="size-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Chưa có thông báo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Thông báo mới sẽ xuất hiện ở đây.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onSelect={onItemClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              className="group h-9 w-full justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => goto(ROUTES.notifications)}
            >
              Xem tất cả
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
