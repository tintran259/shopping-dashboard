import { useEffect, useState } from 'react';
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
import {
  DataTable,
  type ColumnDef,
  type DataTableSort,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { CustomerStatus, CustomerType } from '@/types';
import { formatDate } from '@/lib/format';
import { ROUTES } from '@/routes/paths';
import { CreateB2bCustomerDialog } from '../components/CreateB2bCustomerDialog';
import { useCustomers } from '../hooks/use-customers';
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_TYPE_LABEL,
  customerDisplayName,
} from '../lib/labels';
import type { Customer, CustomerSortField } from '../types';

const ALL = '__all__';

export function CustomersPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<DataTableSort>({
    field: 'createdAt',
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
  }, [q, type, status, sort.field, sort.direction]);

  const query = useCustomers({
    page,
    limit,
    q: q || undefined,
    type: type === ALL ? undefined : (type as CustomerType),
    status: status === ALL ? undefined : (status as CustomerStatus),
    sortBy: sort.field as CustomerSortField,
    sortOrder: sort.direction,
  });

  const columns: ColumnDef<Customer>[] = [
    {
      id: 'lastName',
      header: 'Khách hàng',
      sortable: true,
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{customerDisplayName(c)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {c.email ?? c.phone ?? '—'}
          </p>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Điện thoại',
      cell: (c) => <span className="whitespace-nowrap">{c.phone ?? '—'}</span>,
    },
    {
      id: 'type',
      header: 'Loại khách',
      cell: (c) => (
        <span className="whitespace-nowrap">{CUSTOMER_TYPE_LABEL[c.type]}</span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (c) => <StatusBadge kind="customer" value={c.status} />,
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right text-muted-foreground',
      cell: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Danh sách khách hàng B2C/B2B — lọc, tìm kiếm và sắp xếp phía máy chủ."
        actions={<CreateB2bCustomerDialog />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại…"
            className="pl-8"
          />
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Loại khách" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi loại khách</SelectItem>
            {Object.values(CustomerType).map((t) => (
              <SelectItem key={t} value={t}>
                {CUSTOMER_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
            {Object.values(CustomerStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {CUSTOMER_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(c) => c.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(c) => navigate(ROUTES.customerDetail(c.id))}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="Không có khách hàng phù hợp"
        emptyDescription="Thử đổi bộ lọc loại khách, trạng thái hoặc từ khóa tìm kiếm."
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
