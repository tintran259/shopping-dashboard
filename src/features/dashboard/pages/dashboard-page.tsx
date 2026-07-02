import { useMemo } from 'react';
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
import { OrderStatus, PaymentStatus } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useOrders } from '@/features/orders';

/**
 * Overview built by aggregating the admin order list (BE has no dedicated
 * dashboard endpoint yet). Money values come straight from the BE.
 */
export function DashboardPage() {
  // Lấy tối đa 100 đơn gần nhất để tổng hợp nhanh phía client.
  const { data, isLoading } = useOrders({ page: 1, limit: 100 });

  const stats = useMemo(() => {
    const orders = data?.data ?? [];
    const paidRevenue = orders
      .filter((o) => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
    const byStatus = Object.values(OrderStatus).reduce<Record<string, number>>(
      (acc, s) => {
        acc[s] = orders.filter((o) => o.status === s).length;
        return acc;
      },
      {},
    );
    const pending = byStatus[OrderStatus.PENDING] ?? 0;
    return {
      total: data?.meta.total ?? orders.length,
      paidRevenue,
      pending,
      byStatus,
      recent: orders.slice(0, 6),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        description="Tổng quan hoạt động kinh doanh (dựa trên 100 đơn gần nhất)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu đã thu"
          icon={<DollarSign className="size-4" />}
          value={formatCurrency(stats.paidRevenue)}
          loading={isLoading}
        />
        <StatCard
          title="Tổng số đơn"
          icon={<ClipboardList className="size-4" />}
          value={formatNumber(stats.total)}
          loading={isLoading}
        />
        <StatCard
          title="Đơn chờ xử lý"
          icon={<AlertTriangle className="size-4" />}
          value={formatNumber(stats.pending)}
          loading={isLoading}
        />
        <StatCard
          title="Đơn đã giao"
          icon={<PackageCheck className="size-4" />}
          value={formatNumber(stats.byStatus[OrderStatus.DELIVERED] ?? 0)}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đơn theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(OrderStatus).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge kind="order" value={s} />
                <span className="text-sm font-medium tabular-nums">
                  {formatNumber(stats.byStatus[s] ?? 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn mới nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))
            ) : stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có đơn hàng.</p>
            ) : (
              stats.recent.map((o) => (
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

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
