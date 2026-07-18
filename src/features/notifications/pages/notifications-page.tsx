import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { Switch } from '@/components/shared/switch';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '../hooks/use-notifications';
import { NOTIFICATION_META } from '../lib/notification-meta';
import { NotificationItem } from '../components/notification-item';
import {
  NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationType,
} from '../types';

const ALL = '__all__';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [type, setType] = useState<string>(ALL);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => setPage(1), [type, unreadOnly]);

  const query = useNotifications({
    page,
    limit,
    unreadOnly: unreadOnly || undefined,
    type: type === ALL ? undefined : (type as NotificationType),
  });
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = query.data?.data ?? [];

  const onItemClick = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo"
        description={
          unread > 0
            ? `Bạn có ${unread} thông báo chưa đọc.`
            : 'Toàn bộ thông báo của bạn.'
        }
        actions={
          unread > 0 && (
            <Button
              variant="outline"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="size-4" />
              Đánh dấu đã đọc tất cả
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Loại thông báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi loại</SelectItem>
            {NOTIFICATION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {NOTIFICATION_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          Chỉ chưa đọc
        </label>
      </div>

      {query.isLoading ? (
        <Card className="divide-y p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-7" />
          </div>
          <div>
            <p className="text-sm font-medium">Chưa có thông báo</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {unreadOnly || type !== ALL
                ? 'Không có thông báo khớp bộ lọc.'
                : 'Thông báo mới sẽ xuất hiện ở đây.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="divide-y overflow-hidden p-0">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onSelect={onItemClick}
            />
          ))}
        </Card>
      )}

      <Pagination
        meta={query.data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}
