import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { ReviewStatus } from '@/types';
import { ReviewDetailDialog } from '../components/ReviewDetailDialog';
import { ReviewStatsCards } from '../components/ReviewStatsCards';
import { useUpdateReviewStatus } from '../hooks/use-review-mutations';
import { useReviews, useReviewStats } from '../hooks/use-reviews';
import { buildReviewColumns } from '../lib/review-columns';
import type { Review } from '../types';

const ALL = '__all__';

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'Chờ duyệt',
  [ReviewStatus.PUBLISHED]: 'Đã hiển thị',
  [ReviewStatus.REJECTED]: 'Đã ẩn',
};

/** Review moderation — thẻ tổng quan + bộ lọc + bảng (thumbnail/ảnh feedback,
 *  sản phẩm, khách, điểm, trạng thái, thao tác). Mọi lọc đều server-side. */
export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [rating, setRating] = useState<string>(ALL);
  const [detailTarget, setDetailTarget] = useState<Review | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
  }, [q, status, rating]);

  const query = useReviews({
    page,
    limit,
    q: q || undefined,
    status: status === ALL ? undefined : (status as ReviewStatus),
    rating: rating === ALL ? undefined : Number(rating),
  });
  const statsQuery = useReviewStats();
  const updateStatus = useUpdateReviewStatus();

  const columns = useMemo(
    () =>
      buildReviewColumns({
        pending: updateStatus.isPending,
        onView: setDetailTarget,
        onApprove: (r) =>
          updateStatus.mutate({ id: r.id, status: ReviewStatus.PUBLISHED }),
        onReject: (r) =>
          updateStatus.mutate({ id: r.id, status: ReviewStatus.REJECTED }),
      }),
    [updateStatus],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá sản phẩm"
        description="Duyệt / ẩn, xem ảnh feedback và phản hồi đánh giá của khách hàng."
      />

      <ReviewStatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
          <div className="relative lg:max-w-xs lg:flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Tìm nội dung, sản phẩm…"
              className="pl-8"
            />
          </div>

          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Số sao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Mọi số sao</SelectItem>
              {[5, 4, 3, 2, 1].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} sao
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
              {Object.values(ReviewStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {REVIEW_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(r) => r.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={setDetailTarget}
        emptyTitle="Không có đánh giá phù hợp"
        emptyDescription="Thử đổi bộ lọc hoặc từ khóa tìm kiếm."
      />

      <Pagination
        meta={query.data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ReviewDetailDialog
        review={detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
      />
    </div>
  );
}
