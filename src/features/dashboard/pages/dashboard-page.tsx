import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  PackageCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { OrderStatus } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/paths';
import { useBranches } from '@/features/inventory';
import { useOrders, useOrderSummary } from '@/features/orders';
import { RevenueAreaChart } from '../components/RevenueAreaChart';
import { OrdersBarChart, type StatusBar } from '../components/OrdersBarChart';
import { PeriodFilter } from '../components/PeriodFilter';
import { buildAreaSeries, defaultPeriod, periodRange } from '../lib/period';

/**
 * Overview aggregated server-side (SQL COUNT/SUM via `GET /admin/orders/summary`),
 * scoped to the topbar branch switcher + the period filter below. Money values
 * come straight from the BE.
 */
export function DashboardPage() {
  const [period, setPeriod] = useState(defaultPeriod);
  const range = useMemo(() => periodRange(period), [period]);

  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const { data: branches } = useBranches();
  const branchName = currentBranchId
    ? (branches?.find((b) => b.id === currentBranchId)?.name ?? null)
    : null;

  const { data: summary, isLoading } = useOrderSummary({
    branchId: currentBranchId ?? undefined,
    dateFrom: range.from.toISOString(),
    dateTo: range.to.toISOString(),
  });

  const recent = useOrders({
    page: 1,
    limit: 6,
    branchId: currentBranchId ?? undefined,
    sortBy: 'placedAt',
    sortOrder: 'DESC',
  });

  const pending = summary?.byStatus[OrderStatus.PENDING] ?? 0;
  const delivered = summary?.byStatus[OrderStatus.DELIVERED] ?? 0;
  const statusBars: StatusBar[] = Object.values(OrderStatus).map((s) => ({
    status: s,
    value: summary?.byStatus[s] ?? 0,
  }));
  const areaSeries = useMemo(
    () => (summary ? buildAreaSeries(summary.series, range, period.kind) : []),
    [summary, range, period.kind],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        description={
          branchName
            ? `Tổng quan hoạt động kinh doanh — ${branchName}`
            : 'Tổng quan hoạt động kinh doanh — tất cả chi nhánh'
        }
        actions={
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            branchId={currentBranchId}
            onBranchChange={setCurrentBranchId}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu đã thu"
          icon={<DollarSign className="size-4.5" />}
          value={formatCurrency(summary?.totalRevenue)}
          loading={isLoading}
          accent="primary"
        />
        <StatCard
          title="Tổng số đơn"
          icon={<ClipboardList className="size-4.5" />}
          value={formatNumber(summary?.totalOrders)}
          loading={isLoading}
          accent="info"
        />
        <StatCard
          title="Đơn chờ xử lý"
          icon={<AlertTriangle className="size-4.5" />}
          value={formatNumber(pending)}
          loading={isLoading}
          accent="warning"
        />
        <StatCard
          title="Đơn đã giao"
          icon={<PackageCheck className="size-4.5" />}
          value={formatNumber(delivered)}
          loading={isLoading}
          accent="success"
        />
      </div>

      {!(period.kind === 'day' && period.dateFrom === period.dateTo) && (
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu — {range.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-55 w-full" />
            ) : (
              <RevenueAreaChart data={areaSeries} />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đơn theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <OrdersBarChart data={statusBars} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn mới nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))
            ) : !recent.data?.data.length ? (
              <p className="text-sm text-muted-foreground">Chưa có đơn hàng.</p>
            ) : (
              recent.data.data.map((o) => (
                <Link
                  key={o.id}
                  to={ROUTES.orderDetail(o.id)}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{o.code}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge kind="order" value={o.status} />
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(o.grandTotal)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type StatAccent = 'primary' | 'info' | 'warning' | 'success';

const STAT_ACCENT_CLASSES: Record<StatAccent, { chip: string; bar: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  info: { chip: 'bg-info/10 text-info', bar: 'bg-info' },
  warning: { chip: 'bg-warning/10 text-warning', bar: 'bg-warning' },
  success: { chip: 'bg-success/10 text-success', bar: 'bg-success' },
};

function StatCard({
  title,
  value,
  icon,
  loading,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  accent: StatAccent;
}) {
  const cls = STAT_ACCENT_CLASSES[accent];
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={cn('absolute inset-x-0 top-0 h-1', cls.bar)} aria-hidden />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            cls.chip,
          )}
        >
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
