import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews-api';
import type { AdminReviewListParams } from '../types';

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (params: AdminReviewListParams) => [...reviewKeys.all, 'list', params] as const,
  stats: () => [...reviewKeys.all, 'stats'] as const,
};

export function useReviews(params: AdminReviewListParams) {
  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: () => reviewsApi.list(params),
    // Giữ dữ liệu trang trước khi đổi trang/lọc → không nháy skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: reviewKeys.stats(),
    queryFn: () => reviewsApi.stats(),
  });
}
