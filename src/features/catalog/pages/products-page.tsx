import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ProductStatus } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useCategories } from '../hooks/use-catalog-refs';
import { useProducts } from '../hooks/use-products';
import { PRODUCT_STATUS_LABEL } from '../lib/labels';
import type { Product, ProductExpiryState } from '../types';

const ALL = '__all__';

/** Ngưỡng "sắp hết hạn" (ngày) — khớp mặc định BE. */
const EXPIRING_SOON_DAYS = 30;

const EXPIRY_FILTER_LABEL: Record<ProductExpiryState, string> = {
  expiring: 'Sắp hết hạn',
  expired: 'Đã hết hạn',
  valid: 'Còn hạn',
  none: 'Vô thời hạn',
};

/** Số ngày còn lại tới HSD (âm = đã quá hạn); null nếu vô thời hạn. Chỉ để hiển
 *  thị badge trên dữ liệu đã tải — việc lọc vẫn do BE làm (server-side). */
function daysToExpiry(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiryDate.slice(0, 10)}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Primary image (or first) of a product, if any. */
function thumbnailOf(p: Product): string | undefined {
  const imgs = p.images ?? [];
  return (imgs.find((i) => i.isPrimary) ?? imgs[0])?.url;
}

export function ProductsPage() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [expiry, setExpiry] = useState<string>(ALL);
  const [sort, setSort] = useState<DataTableSort>({
    field: 'createdAt',
    direction: 'DESC',
  });

  // Debounce ô tìm kiếm để không gọi API mỗi phím gõ.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  // Đổi từ khóa tìm kiếm (sau debounce) → về trang 1.
  useEffect(() => {
    setPage(1);
  }, [q]);

  const query = useProducts({
    page,
    limit,
    q: q || undefined,
    status: status === ALL ? undefined : (status as ProductStatus),
    // BE lọc theo slug nhóm sản phẩm (server-side).
    category: category === ALL ? undefined : category,
    // Lọc theo hạn dùng — server-side (BE tự tính theo CURRENT_DATE).
    expiryState: expiry === ALL ? undefined : (expiry as ProductExpiryState),
    sort: `${sort.field}:${sort.direction}`,
  });

  const columns: ColumnDef<Product>[] = [
    {
      id: 'name',
      header: 'Sản phẩm',
      cell: (p) => {
        const thumb = thumbnailOf(p);
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {thumb ? (
                <img src={thumb} alt={p.name} className="size-full object-cover" />
              ) : (
                <Package className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'brand',
      header: 'Thương hiệu',
      cell: (p) => p.brand?.name ?? '—',
    },
    {
      id: 'basePrice',
      header: 'Giá cơ bản',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right tabular-nums',
      cell: (p) => formatCurrency(p.basePrice),
    },
    {
      id: 'variants',
      header: 'Biến thể',
      headerClassName: 'text-right',
      className: 'text-right tabular-nums text-muted-foreground',
      cell: (p) => formatNumber(p.variants?.length ?? 0),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (p) => <StatusBadge kind="product" value={p.status} />,
    },
    {
      id: 'expiryDate',
      header: 'Hạn sử dụng',
      sortable: true,
      cell: (p) => {
        const days = daysToExpiry(p.expiryDate);
        if (days === null)
          return <span className="text-xs text-muted-foreground">Vô thời hạn</span>;
        const label = formatDate(p.expiryDate!);
        if (days < 0)
          return (
            <div className="space-y-0.5">
              <Badge variant="destructive">Đã hết hạn</Badge>
              <p className="text-xs text-muted-foreground tabular-nums">{label}</p>
            </div>
          );
        if (days <= EXPIRING_SOON_DAYS)
          return (
            <div className="space-y-0.5">
              <Badge variant="warning">Còn {days} ngày</Badge>
              <p className="text-xs text-muted-foreground tabular-nums">{label}</p>
            </div>
          );
        return <span className="text-sm tabular-nums">{label}</span>;
      },
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
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm…"
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Nhóm sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi nhóm sản phẩm</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Select
          value={expiry}
          onValueChange={(v) => {
            setExpiry(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Hạn sử dụng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi hạn dùng</SelectItem>
            {(
              ['expiring', 'expired', 'valid', 'none'] as ProductExpiryState[]
            ).map((s) => (
              <SelectItem key={s} value={s}>
                {EXPIRY_FILTER_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data}
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
