import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ReviewStatus } from '@/types';
import { ApiError } from '@/lib/api-error';
import { reviewsApi } from '../api/reviews-api';
import { reviewKeys } from './use-reviews';

function toastError(fallback: string) {
  return (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : fallback);
}

/** Approve/hide — both directions use the same mutation, no one-way gate. */
export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      reviewsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success('Đã cập nhật trạng thái đánh giá');
    },
    onError: toastError('Cập nhật trạng thái thất bại'),
  });
}
