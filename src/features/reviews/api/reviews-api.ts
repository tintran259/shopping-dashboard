import { apiClient } from '@/lib/api-client';
import type { PaginatedResult, ReviewStatus } from '@/types';
import type { AdminReviewListParams, Review } from '../types';

export const reviewsApi = {
  /** [admin] List reviews. Filter/paginate is server-side: status, q, page, limit. */
  list: (params: AdminReviewListParams) =>
    apiClient.get<PaginatedResult<Review>>('/admin/reviews', { params }),

  updateStatus: (id: string, status: ReviewStatus) =>
    apiClient.patch<Review>(`/admin/reviews/${id}/status`, { status }),
};
