import type { BaseEntity, PaginationParams, ReviewStatus } from '@/types';

/** Minimal shape joined in for display — admin moderation doesn't need the
 *  full Product/Customer entity. */
export interface ReviewProductRef {
  id: string;
  slug: string;
  name: string;
}

export interface ReviewCustomerRef {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface Review extends BaseEntity {
  productId: string;
  customerId: string;
  rating: number;
  title?: string;
  body?: string;
  status: ReviewStatus;
  product?: ReviewProductRef;
  customer?: ReviewCustomerRef;
}

/** Query params for GET /admin/reviews (server-side filter/paginate). */
export interface AdminReviewListParams extends PaginationParams {
  status?: ReviewStatus;
}
