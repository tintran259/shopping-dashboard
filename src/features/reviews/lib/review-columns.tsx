import { Link } from 'react-router-dom';
import { Check, Eye, ImageIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ColumnDef } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ReviewStatus } from '@/types';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/paths';
import { StarRating } from '../components/StarRating';
import {
  reviewerAvatarColor,
  reviewerDisplayName,
  reviewerInitial,
} from './labels';
import type { Review } from '../types';

interface ReviewColumnHandlers {
  pending: boolean;
  onView: (review: Review) => void;
  onApprove: (review: Review) => void;
  onReject: (review: Review) => void;
}

/** Cột bảng đánh giá (giống layout ShopAdmin). Tách khỏi page để page chỉ ghép. */
export function buildReviewColumns({
  pending,
  onView,
  onApprove,
  onReject,
}: ReviewColumnHandlers): ColumnDef<Review>[] {
  return [
    {
      id: 'review',
      header: 'Đánh giá',
      className: 'max-w-sm',
      cell: (r) => {
        const images = r.imageUrls ?? [];
        return (
          <div className="flex min-w-0 gap-3">
            {images[0] ? (
              <div className="relative size-12 shrink-0">
                <img
                  src={images[0]}
                  alt=""
                  className="size-12 rounded-lg object-cover ring-1 ring-border"
                  loading="lazy"
                />
                {images.length > 1 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background ring-2 ring-background">
                    +{images.length - 1}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImageIcon className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              {r.title && (
                <p className="truncate text-sm font-medium">{r.title}</p>
              )}
              {r.body && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {r.body}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: (r) =>
        r.product ? (
          <div className="min-w-0">
            <Link
              to={ROUTES.productEdit(r.product.id)}
              onClick={(e) => e.stopPropagation()}
              className="line-clamp-1 text-sm font-medium hover:underline"
            >
              {r.product.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {r.variantTitle ? r.variantTitle : `/${r.product.slug}`}
            </p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      id: 'customer',
      header: 'Khách hàng',
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
              reviewerAvatarColor(r.customer),
            )}
          >
            {reviewerInitial(r.customer)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm">{reviewerDisplayName(r.customer)}</p>
            {r.customer?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {r.customer.email}
              </p>
            )}
            {r.orderId && (
              <Badge variant="success" className="mt-0.5 font-normal">
                Đã mua hàng
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'rating',
      header: 'Điểm',
      cell: (r) => <StarRating rating={r.rating} />,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r) => <StatusBadge kind="review" value={r.status} />,
    },
    {
      id: 'createdAt',
      header: 'Ngày gửi',
      className: 'whitespace-nowrap text-muted-foreground',
      cell: (r) => formatDateTime(r.createdAt),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xem chi tiết"
            onClick={() => onView(r)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Duyệt"
            className="text-success"
            disabled={r.status === ReviewStatus.PUBLISHED || pending}
            onClick={() => onApprove(r)}
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ẩn"
            className="text-destructive"
            disabled={r.status === ReviewStatus.REJECTED || pending}
            onClick={() => onReject(r)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
