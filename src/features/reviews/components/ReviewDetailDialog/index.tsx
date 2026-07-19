import { useEffect, useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/status-badge';
import { ReviewStatus } from '@/types';
import { formatDateTime } from '@/lib/format';
import { usePermissions } from '@/features/auth';
import { StarRating } from '../StarRating';
import { ReviewImageLightbox } from '../ReviewImageLightbox';
import { ReviewOrderInfo } from '../ReviewOrderInfo';
import {
  useReplyToReview,
  useUpdateReviewStatus,
} from '../../hooks/use-review-mutations';
import { reviewerDisplayName } from '../../lib/labels';
import type { Review } from '../../types';

export function ReviewDetailDialog({
  review,
  onOpenChange,
}: {
  review: Review | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { can } = usePermissions();
  const updateStatus = useUpdateReviewStatus();
  const replyMutation = useReplyToReview();
  const [reply, setReply] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (review) setReply(review.reply ?? '');
  }, [review]);

  const images = review?.imageUrls ?? [];
  const hasReply = !!review?.reply?.trim();

  const moderate = (status: ReviewStatus) => {
    if (!review) return;
    updateStatus.mutate(
      { id: review.id, status },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <>
      <Dialog open={!!review} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
          </DialogHeader>

          {review && (
            <div className="space-y-4">
              {/* Đầu: sao + khách + trạng thái */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">
                      {reviewerDisplayName(review.customer)}
                    </span>
                    {review.orderId && (
                      <Badge variant="success">Đã mua hàng</Badge>
                    )}
                  </div>
                  {review.product && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {review.product.name}
                      {review.variantTitle ? ` · ${review.variantTitle}` : ''} ·{' '}
                      {formatDateTime(review.createdAt)}
                    </p>
                  )}
                </div>
                <StatusBadge kind="review" value={review.status} />
              </div>

              {/* Nội dung */}
              {review.title && (
                <p className="text-sm font-medium">{review.title}</p>
              )}
              {review.body && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.body}
                </p>
              )}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {review.tags.map((t) => (
                    <Badge key={t} variant="muted" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Ảnh feedback */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-primary/40"
                      aria-label={`Xem ảnh ${i + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Ảnh đánh giá ${i + 1}`}
                        className="size-20 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Thông tin đơn hàng (review đã mua hàng + có quyền xem đơn) */}
              {review.orderId && can('orders.view') && (
                <ReviewOrderInfo orderId={review.orderId} />
              )}

              {/* Phản hồi */}
              <div className="space-y-1.5 border-t pt-4">
                <label className="text-sm font-medium">Phản hồi của shop</label>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Phản hồi công khai kèm đánh giá trên storefront…"
                />
                <div className="flex justify-end gap-2">
                  {hasReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={replyMutation.isPending}
                      onClick={() =>
                        replyMutation.mutate({ id: review.id, reply: '' })
                      }
                    >
                      Xóa phản hồi
                    </Button>
                  )}
                  <Button
                    size="sm"
                    loading={replyMutation.isPending}
                    disabled={!reply.trim()}
                    onClick={() =>
                      replyMutation.mutate({ id: review.id, reply })
                    }
                  >
                    {hasReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                  </Button>
                </div>
              </div>

              {/* Kiểm duyệt */}
              <div className="flex gap-2 border-t pt-4">
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={
                    review.status === ReviewStatus.PUBLISHED ||
                    updateStatus.isPending
                  }
                  onClick={() => moderate(ReviewStatus.PUBLISHED)}
                >
                  <Check className="size-4" />
                  Duyệt hiển thị
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={
                    review.status === ReviewStatus.REJECTED ||
                    updateStatus.isPending
                  }
                  onClick={() => moderate(ReviewStatus.REJECTED)}
                >
                  <EyeOff className="size-4" />
                  Ẩn đánh giá
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewImageLightbox
        images={lightboxIndex !== null ? images : null}
        startIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}
