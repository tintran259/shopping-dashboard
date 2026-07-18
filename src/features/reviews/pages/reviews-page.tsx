import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, EyeOff, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { ReviewStatus } from '@/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/paths';
import { useUpdateReviewStatus } from '../hooks/use-review-mutations';
import { useReviews } from '../hooks/use-reviews';
import { reviewerDisplayName } from '../lib/labels';
import type { Review } from '../types';

const ALL = '__all__';

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'Chờ duyệt',
  [ReviewStatus.PUBLISHED]: 'Đã hiển thị',
  [ReviewStatus.REJECTED]: 'Đã ẩn',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating}/5 sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}

/** Review moderation queue — mặc định lọc "Chờ duyệt" vì đó là việc admin
 *  cần làm mỗi khi mở trang; có thể đổi sang xem theo trạng thái khác. */
export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ReviewStatus.PENDING);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const query = useReviews({
    page,
    limit,
    q: q || undefined,
    status: status === ALL ? undefined : (status as ReviewStatus),
  });

  const updateStatus = useUpdateReviewStatus();

  const columns: ColumnDef<Review>[] = [
    {
      id: 'content',
      header: 'Đánh giá',
      className: 'max-w-md',
      cell: (r) => (
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <StarRating rating={r.rating} />
            {r.title && <p className="truncate font-medium">{r.title}</p>}
          </div>
          {r.body && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
          )}
        </div>
      ),
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: (r) =>
        r.product ? (
          <Link
            to={ROUTES.productEdit(r.product.id)}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium hover:underline"
          >
            {r.product.name}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'customer',
      header: 'Khách hàng',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{reviewerDisplayName(r.customer)}</p>
          {r.customer?.email && (
            <p className="truncate text-xs text-muted-foreground">{r.customer.email}</p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r) => <StatusBadge kind="review" value={r.status} />,
    },
    {
      id: 'createdAt',
      header: 'Ngày gửi',
      className: 'text-muted-foreground whitespace-nowrap',
      cell: (r) => formatDate(r.createdAt),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            disabled={r.status === ReviewStatus.PUBLISHED || updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: r.id, status: ReviewStatus.PUBLISHED })}
          >
            <Check className="size-3.5" />
            Duyệt
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={r.status === ReviewStatus.REJECTED || updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: r.id, status: ReviewStatus.REJECTED })}
          >
            <EyeOff className="size-3.5" />
            Ẩn
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá"
        description="Duyệt / ẩn đánh giá sản phẩm của khách hàng."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, nội dung đánh giá…"
            className="pl-8"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
            {Object.values(ReviewStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {REVIEW_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(r) => r.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="Không có đánh giá phù hợp"
        emptyDescription="Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
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
