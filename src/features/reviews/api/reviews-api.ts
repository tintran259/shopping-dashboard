import { apiClient } from '@/lib/api-client';
import type { PaginatedResult, ReviewStatus } from '@/types';
import type { AdminReviewListParams, Review, ReviewStats } from '../types';

export const reviewsApi = {
  /** [admin] List reviews. Filter/paginate is server-side: status, rating, q, page, limit. */
  list: (params: AdminReviewListParams) =>
    apiClient.get<PaginatedResult<Review>>('/admin/reviews', { params }),

  stats: () => apiClient.get<ReviewStats>('/admin/reviews/stats'),

  updateStatus: (id: string, status: ReviewStatus) =>
    apiClient.patch<Review>(`/admin/reviews/${id}/status`, { status }),

  /** [admin] Phản hồi công khai cho đánh giá (chuỗi rỗng = xóa phản hồi). */
  reply: (id: string, reply: string) =>
    apiClient.patch<Review>(`/admin/reviews/${id}/reply`, { reply }),
};
