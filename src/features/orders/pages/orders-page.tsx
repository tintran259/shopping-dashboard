import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BranchSwitcher } from '@/components/shared/branch-switcher';
import {
  DataTable,
  type ColumnDef,
  type DataTableSort,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { OrderChannel, OrderStatus, PaymentStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useBranches } from '@/features/inventory';
import { useOrders } from '../hooks/use-orders';
import {
  ORDER_CHANNEL_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  orderStatusLabel,
} from '../lib/labels';
import type { Order, OrderSortField } from '../types';

const ALL = '__all__';

export function OrdersPage() {
  const navigate = useNavigate();
  // Chi nhánh lọc riêng của trang này (không dùng chung state với Dashboard).
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const { data: branches } = useBranches();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [paymentStatus, setPaymentStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<DataTableSort>({
    field: 'placedAt',
    direction: 'DESC',
  });

  // Debounce ô tìm kiếm để không gọi API mỗi phím gõ.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  // Đổi bất kỳ bộ lọc nào → về trang 1.
  useEffect(() => {
    setPage(1);
  }, [q, status, paymentStatus, currentBranchId, sort.field, sort.direction]);

  const query = useOrders({
    page,
    limit,
    q: q || undefined,
    branchId: currentBranchId ?? undefined,
    status: status === ALL ? undefined : (status as OrderStatus),
    paymentStatus:
      paymentStatus === ALL ? undefined : (paymentStatus as PaymentStatus),
    sortBy: sort.field as OrderSortField,
    sortOrder: sort.direction,
  });

  const branchName = useMemo(() => {
    const map = new Map((branches ?? []).map((b) => [b.id, b.name]));
    return (id: string) => map.get(id) ?? '—';
  }, [branches]);

  const columns: ColumnDef<Order>[] = [
    {
      id: 'code',
      header: 'Mã đơn',
      sortable: true,
      cell: (o) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{o.code}</span>
          {/* Chỉ gắn nhãn trường hợp ngoại lệ (BO tạo) — mặc định khách tự đặt. */}
          {o.channel === OrderChannel.ADMIN && (
            <Badge variant="info">{ORDER_CHANNEL_LABEL[OrderChannel.ADMIN]}</Badge>
          )}
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Chi nhánh',
      cell: (o) => (
        <span className="whitespace-nowrap">{branchName(o.branchId)}</span>
      ),
    },
    {
      id: 'placedAt',
      header: 'Thời gian',
      sortable: true,
      cell: (o) => (
        <span className="whitespace-nowrap text-muted-foreground">
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
      sortable: true,
      cell: (o) => (
        <StatusBadge
          kind="order"
          value={o.status}
          label={orderStatusLabel(o.status, o.fulfillment)}
        />
      ),
    },
    {
      id: 'payment',
      header: 'Thanh toán',
      cell: (o) => <StatusBadge kind="payment" value={o.paymentStatus} />,
    },
    {
      id: 'grandTotal',
      header: 'Tổng tiền',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right font-medium tabular-nums',
      cell: (o) => formatCurrency(o.grandTotal),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng"
        description="Lọc theo chi nhánh, tìm kiếm và sắp xếp — xử lý phía máy chủ."
        actions={
          <Button onClick={() => navigate(ROUTES.orderNew)}>
            <Plus className="size-4" />
            Tạo đơn hàng
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Tìm theo mã đơn, tên, SĐT…"
            className="pl-8"
          />
        </div>

        <BranchSwitcher value={currentBranchId} onChange={setCurrentBranchId} />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-44">
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

        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="lg:w-44">
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
        data={query.data?.data}
        rowKey={(o) => o.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(o) => navigate(ROUTES.orderDetail(o.id))}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="Không có đơn hàng phù hợp"
        emptyDescription="Thử đổi bộ lọc chi nhánh, trạng thái hoặc từ khóa tìm kiếm."
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
