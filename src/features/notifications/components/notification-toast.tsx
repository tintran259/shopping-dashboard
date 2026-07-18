import { ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  FALLBACK_NOTIFICATION_ICON,
  NOTIFICATION_META,
  timeAgo,
} from '../lib/notification-meta';
import type { AppNotification } from '../types';

const DURATION_MS = 6000;

/**
 * Toast tùy biến cho notification realtime.
 *
 * Thẩm mỹ (theo design-taste): ô icon bo góc với gradient + viền trong ám
 * primary; phân cấp chữ rõ (nhãn micro in hoa → tiêu đề đậm tracking-tight →
 * mô tả muted); bóng đổ ám màu primary thay vì đen thuần; nút "Xem chi tiết"
 * có mũi tên trượt khi hover; thanh đếm ngược mảnh dưới đáy cho thời gian tự
 * đóng. Dùng token của app nên khớp cả light/dark.
 */
export function showNotificationToast(
  n: AppNotification,
  onView: (link: string) => void,
) {
  const meta = NOTIFICATION_META[n.type];
  const Icon = meta?.icon ?? FALLBACK_NOTIFICATION_ICON;
  const label = meta?.label ?? 'Thông báo';

  toast.custom(
    (id) => (
      <div className="group relative flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3.5 overflow-hidden rounded-2xl border bg-card p-4 pr-9 text-card-foreground shadow-xl shadow-primary/10 ring-1 ring-black/[0.04] transition-transform duration-200 hover:-translate-y-0.5 dark:ring-white/[0.06]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-inset ring-primary/15">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
              {label}
            </span>
            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
              {timeAgo(n.createdAt)}
            </span>
          </div>

          <p className="mt-1 truncate text-sm font-semibold leading-snug tracking-tight">
            {n.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {n.body}
          </p>

          {n.link && (
            <button
              type="button"
              onClick={() => {
                onView(n.link as string);
                toast.dismiss(id);
              }}
              className="group/btn mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Xem chi tiết
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Đóng"
          onClick={() => toast.dismiss(id)}
          className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-colors hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>

        <span
          className="toast-countdown absolute inset-x-0 bottom-0 h-0.5 bg-primary/60"
          style={{ animationDuration: `${DURATION_MS}ms` }}
        />
      </div>
    ),
    { duration: DURATION_MS },
  );
}
