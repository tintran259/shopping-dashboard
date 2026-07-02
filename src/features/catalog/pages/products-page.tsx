import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataTable,
  type ColumnDef,
  type DataTableSort,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ProductStatus, type PaginationMeta } from '@/types';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useProducts } from '../hooks/use-products';
import { PRODUCT_STATUS_LABEL } from '../lib/labels';
import type { ProductSummary } from '../types';

const ALL = '__all__';

export function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<DataTableSort>({
    field: 'createdAt',
    direction: 'DESC',
  });

  const query = useProducts({
    page,
    limit,
    q: q.trim() || undefined,
    status: status === ALL ? undefined : (status as ProductStatus),
    sort: `${sort.field}:${sort.direction}`,
  });

  // Ánh xạ pagination (page/pageSize/total/totalPages) → PaginationMeta chuẩn.
  const meta: PaginationMeta | undefined = useMemo(() => {
    const p = query.data?.pagination;
    if (!p) return undefined;
    return {
      page: p.page,
      limit: p.pageSize,
      total: p.total,
      pageCount: p.totalPages,
    };
  }, [query.data]);

  const columns: ColumnDef<ProductSummary>[] = [
    {
      id: 'name',
      header: 'Sản phẩm',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {p.thumbnail.url ? (
              <img
                src={p.thumbnail.url}
                alt={p.thumbnail.alt || p.name}
                className="size-full object-cover"
              />
            ) : (
              <Package className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'brand',
      header: 'Thương hiệu',
      cell: (p) => p.brand?.name ?? '—',
    },
    {
      id: 'basePrice',
      header: 'Giá',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right tabular-nums',
      cell: (p) => (
        <span>
          {formatCurrency(p.price.amount)}
          {p.priceVaries && <span className="text-muted-foreground"> +</span>}
        </span>
      ),
    },
    {
      id: 'stock',
      header: 'Tồn',
      cell: (p) =>
        p.inStock ? (
          <StatusBadge kind="inventory" value="in_stock" />
        ) : (
          <StatusBadge kind="inventory" value="out_of_stock" />
        ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (p) => <StatusBadge kind="product" value={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sản phẩm"
        description="Quản lý sản phẩm, biến thể, tùy chọn và hình ảnh."
        actions={
          <Button onClick={() => navigate(ROUTES.productNew)}>
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        }
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
            placeholder="Tìm theo tên sản phẩm…"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
            {Object.values(ProductStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {PRODUCT_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(p) => p.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(p) => navigate(ROUTES.productEdit(p.id))}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setPage(1);
        }}
        emptyTitle="Chưa có sản phẩm"
        emptyDescription="Nhấn “Thêm sản phẩm” để tạo mới."
      />

      <Pagination
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}
