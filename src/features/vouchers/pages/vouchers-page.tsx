import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VoucherCustomerScope, VoucherType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/paths';
import { usePermissions } from '@/features/auth';
import { useDeleteVoucher } from '../hooks/use-voucher-mutations';
import { useVouchers, useVoucherStats } from '../hooks/use-vouchers';
import { VOUCHER_TYPE_LABEL } from '../lib/labels';
import type { Voucher, VoucherState } from '../types';

const STATE_META: Record<VoucherState, { label: string; variant: 'success' | 'info' | 'muted' | 'destructive' }> = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  scheduled: { label: 'Đã lên lịch', variant: 'info' },
  expired: { label: 'Hết hạn', variant: 'muted' },
  disabled: { label: 'Đã tắt', variant: 'destructive' },
};

function valueLabel(v: Voucher): string {
  if (v.type === VoucherType.PERCENT) return `Giảm ${v.value}%`;
  if (v.type === VoucherType.SHIPPING) return `Giảm ${formatCurrency(v.value)} phí ship`;
  return `Giảm ${formatCurrency(v.value)}`;
}

/** Trạng thái hiển thị cho 1 dòng — chỉ dùng cho badge cột "Trạng thái"; bộ lọc
 *  và số liệu thống kê đã tính phía server (xem `AdminVoucherQueryDto.state`). */
function deriveState(v: Voucher): VoucherState {
  if (!v.isActive) return 'disabled';
  const now = Date.now();
  if (v.startsAt && new Date(v.startsAt).getTime() > now) return 'scheduled';
  if (v.endsAt && new Date(v.endsAt).getTime() < now) return 'expired';
  return 'active';
}

const ALL = '__all__';

export function VouchersPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCreate = can('vouchers.create');
  const canUpdate = can('vouchers.update');
  const canDelete = can('vouchers.delete');
  const deleteVoucher = useDeleteVoucher();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);

  // Debounce ô tìm kiếm để không gọi API mỗi phím gõ.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  // Đổi bất kỳ bộ lọc nào → về trang 1.
  useEffect(() => {
    setPage(1);
  }, [q, stateFilter]);

  const query = useVouchers({
    page,
    limit,
    q: q || undefined,
    state: stateFilter === ALL ? undefined : (stateFilter as VoucherState),
  });
  const statsQuery = useVoucherStats();
  const stats = statsQuery.data;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã "${code}"`);
    } catch {
      toast.error('Không thể sao chép mã');
    }
  };

  const columns: ColumnDef<Voucher>[] = [
    {
      id: 'code',
      header: 'Mã',
      cell: (v) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-medium">{v.code}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Sao chép mã"
            onClick={(e) => {
              e.stopPropagation();
              copyCode(v.code);
            }}
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: 'value',
      header: 'Ưu đãi',
      cell: (v) => (
        <div>
          <p className="font-medium">{valueLabel(v)}</p>
          <p className="text-xs text-muted-foreground">
            {VOUCHER_TYPE_LABEL[v.type]}
            {v.type === VoucherType.PERCENT && v.maxDiscount
              ? ` · tối đa ${formatCurrency(v.maxDiscount)}`
              : ''}
          </p>
        </div>
      ),
    },
    {
      id: 'scope',
      header: 'Phạm vi',
      cell: (v) => {
        const customerPart =
          v.customerScope === VoucherCustomerScope.GUESTS
            ? 'khách vãng lai'
            : v.customerScope === VoucherCustomerScope.USERS
              ? 'mọi tài khoản'
              : v.customersCount
                ? `${v.customersCount} khách`
                : null;
        // Nêu tên chi nhánh khi giới hạn ít (≤2) để nhìn là biết ngay; nhiều
        // hơn thì rút gọn về số lượng cho khỏi tràn cột.
        const branchPart =
          v.branches?.length && v.branches.length <= 2
            ? v.branches.map((b) => b.name).join(', ')
            : v.branchesCount
              ? `${v.branchesCount} chi nhánh`
              : null;
        const parts = [
          v.productsCount ? `${v.productsCount} SP` : null,
          branchPart,
          customerPart,
        ].filter(Boolean);
        return (
          <span className="text-sm text-muted-foreground">
            {parts.length ? parts.join(' · ') : 'Toàn hệ thống'}
          </span>
        );
      },
    },
    {
      id: 'usage',
      header: 'Đã dùng',
      cell: (v) => {
        const pct = v.usageLimit ? Math.min(100, (v.usedCount / v.usageLimit) * 100) : 0;
        return (
          <div className="w-28 space-y-1">
            <p className="text-xs tabular-nums">
              {v.usedCount} / {v.usageLimit ?? '∞'}
              {v.perCustomerLimit ? ` · ${v.perCustomerLimit}/khách` : ''}
            </p>
            {v.usageLimit != null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', pct >= 100 ? 'bg-destructive' : 'bg-primary')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'validity',
      header: 'Hiệu lực',
      className: 'whitespace-nowrap text-muted-foreground',
      cell: (v) =>
        !v.startsAt && !v.endsAt
          ? 'Không giới hạn'
          : `${v.startsAt ? formatDate(v.startsAt) : '—'} → ${v.endsAt ? formatDate(v.endsAt) : '—'}`,
    },
    {
      id: 'state',
      header: 'Trạng thái',
      cell: (v) => {
        const meta = STATE_META[deriveState(v)];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    ...(canUpdate || canDelete
      ? [
          {
            id: 'actions',
            header: '',
            className: 'text-right',
            cell: (v: Voucher) => (
              <div
                className="flex justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sửa"
                    onClick={() => navigate(ROUTES.voucherEdit(v.id))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="Xóa"
                    onClick={() => setToDelete(v)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mã giảm giá"
        description="Quản lý mã khuyến mãi và điều kiện áp dụng."
        actions={
          canCreate && (
            <Button onClick={() => navigate(ROUTES.voucherNew)}>
              <Plus className="size-4" />
              Thêm mã
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['total', 'Tổng số mã', stats?.total ?? 0, 'text-foreground'],
            ['active', 'Đang hoạt động', stats?.active ?? 0, 'text-success'],
            ['scheduled', 'Đã lên lịch', stats?.scheduled ?? 0, 'text-info'],
            [
              'expired',
              'Hết hạn / đã tắt',
              (stats?.expired ?? 0) + (stats?.disabled ?? 0),
              'text-muted-foreground',
            ],
          ] as const
        ).map(([key, label, value, cls]) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-semibold tabular-nums', cls)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Tìm theo mã…"
          className="lg:max-w-xs"
        />
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
            {(Object.keys(STATE_META) as VoucherState[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATE_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(v) => v.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={
          canUpdate ? (v) => navigate(ROUTES.voucherEdit(v.id)) : undefined
        }
        emptyTitle="Chưa có mã giảm giá"
        emptyDescription="Thử đổi bộ lọc hoặc tạo mã mới."
      />

      <Pagination
        meta={query.data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa mã "${toDelete?.code}"?`}
        confirmLabel="Xóa"
        loading={deleteVoucher.isPending}
        onConfirm={() =>
          toDelete &&
          deleteVoucher.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </div>
  );
}
