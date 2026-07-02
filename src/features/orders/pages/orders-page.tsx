import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { OrderStatus, PaymentStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useUiStore } from '@/stores/ui-store';
import { useOrders } from '../hooks/use-orders';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../lib/labels';
import type { Order } from '../types';

const ALL = '__all__';

export function OrdersPage() {
  const navigate = useNavigate();
  const currentBranchId = useUiStore((s) => s.currentBranchId);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState('');
  // Filter phía client trên trang hiện tại (BE admin list chỉ nhận page/limit/q).
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [paymentFilter, setPaymentFilter] = useState<string>(ALL);

  const query = useOrders({ page, limit, q: q.trim() || undefined });

  const rows = useMemo(() => {
    let data = query.data?.data ?? [];
    if (currentBranchId) data = data.filter((o) => o.branchId === currentBranchId);
    if (statusFilter !== ALL) data = data.filter((o) => o.status === statusFilter);
    if (paymentFilter !== ALL)
      data = data.filter((o) => o.paymentStatus === paymentFilter);
    return data;
  }, [query.data, currentBranchId, statusFilter, paymentFilter]);

  const columns: ColumnDef<Order>[] = [
    {
      id: 'code',
      header: 'Mã đơn',
      cell: (o) => <span className="font-medium">{o.code}</span>,
    },
    {
      id: 'placedAt',
      header: 'Thời gian',
      cell: (o) => (
        <span className="text-muted-foreground">
          {formatDateTime(o.placedAt ?? o.createdAt)}
        </span>
      ),
    },
    {
      id: 'recipient',
      header: 'Người nhận',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate">{o.recipientName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {o.recipientPhone}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (o) => <StatusBadge kind="order" value={o.status} />,
    },
    {
      id: 'payment',
      header: 'Thanh toán',
      cell: (o) => <StatusBadge kind="payment" value={o.paymentStatus} />,
    },
    {
      id: 'grandTotal',
      header: 'Tổng tiền',
      headerClassName: 'text-right',
      className: 'text-right font-medium tabular-nums',
      cell: (o) => formatCurrency(o.grandTotal),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng"
        description="Quản lý và xử lý toàn bộ đơn hàng của hệ thống."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã đơn, tên, SĐT…"
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
            {Object.values(OrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Thanh toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi thanh toán</SelectItem>
            {Object.values(PaymentStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(o) => navigate(ROUTES.orderDetail(o.id))}
        emptyTitle="Chưa có đơn hàng nào"
        emptyDescription="Đơn khớp bộ lọc sẽ hiển thị tại đây."
      />

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
