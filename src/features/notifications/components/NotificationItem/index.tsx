import { cn } from '@/lib/utils';
import {
  FALLBACK_NOTIFICATION_ICON,
  NOTIFICATION_META,
  timeAgo,
} from '../../lib/notification-meta';
import type { AppNotification } from '../../types';

/**
 * Một dòng thông báo — dùng chung cho dropdown chuông và trang "Xem tất cả" để
 * hai nơi luôn cùng ngôn ngữ thiết kế. Item chưa đọc: thanh accent trái + nền
 * primary nhạt + ô icon gradient/ring; đã đọc: ô icon xám phẳng, chữ nhẹ hơn.
 * Bọc trong container `divide-y` ở phía gọi.
 */
export function NotificationItem({
  notification: n,
  onSelect,
}: {
  notification: AppNotification;
  onSelect: (n: AppNotification) => void;
}) {
  const meta = NOTIFICATION_META[n.type];
  const Icon = meta?.icon ?? FALLBACK_NOTIFICATION_ICON;
  const unread = !n.readAt;

  return (
    <div className="relative">
      {unread && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
      )}
      <button
        type="button"
        onClick={() => onSelect(n)}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/60',
          unread && 'bg-primary/4',
        )}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            unread
              ? 'bg-linear-to-br from-primary/20 to-primary/5 text-primary ring-primary/15'
              : 'bg-muted text-muted-foreground ring-transparent',
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[10.5px] font-semibold uppercase tracking-wider',
                unread ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {meta?.label ?? 'Thông báo'}
            </span>
            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {timeAgo(n.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              'mt-0.5 truncate text-sm leading-snug',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {n.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {n.body}
          </p>
        </div>

        {unread && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </button>
    </div>
  );
}
