import {
  CheckCircle2,
  Clock,
  MessagesSquare,
  Star,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ReviewStats } from '../../types';

interface StatDef {
  key: keyof ReviewStats;
  label: string;
  icon: LucideIcon;
  tint: string;
}

const STATS: StatDef[] = [
  { key: 'pending', label: 'Chờ duyệt', icon: Clock, tint: 'bg-warning/10 text-warning' },
  { key: 'published', label: 'Đã hiển thị', icon: CheckCircle2, tint: 'bg-success/10 text-success' },
  { key: 'rejected', label: 'Đã ẩn', icon: XCircle, tint: 'bg-destructive/10 text-destructive' },
  { key: 'total', label: 'Tổng đánh giá', icon: MessagesSquare, tint: 'bg-info/10 text-info' },
  { key: 'average', label: 'Điểm trung bình', icon: Star, tint: 'bg-primary/10 text-primary' },
];

export function ReviewStatsCards({
  stats,
  isLoading,
}: {
  stats?: ReviewStats;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {STATS.map(({ key, label, icon: Icon, tint }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-3 py-4">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                tint,
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              {isLoading || !stats ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums leading-tight">
                  {key === 'average'
                    ? stats.average.toFixed(1)
                    : stats[key].toLocaleString('vi-VN')}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
