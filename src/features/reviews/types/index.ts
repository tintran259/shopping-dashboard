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
  /** Biến thể (order item) được đánh giá — mỗi item 1 review. */
  variantId?: string | null;
  /** Nhãn biến thể snapshot (vd "Trắng · L"); rỗng cho sản phẩm không tùy chọn. */
  variantTitle?: string | null;
  title?: string;
  body?: string;
  tags?: string[];
  /** Ảnh khách đính kèm khi đánh giá (feedback). */
  imageUrls?: string[];
  status: ReviewStatus;
  /** Phản hồi công khai của shop (null/rỗng = chưa phản hồi). */
  reply?: string | null;
  repliedAt?: string | null;
  /** Có đơn hàng gắn kèm ⇒ "Đã mua hàng" (verified). */
  orderId?: string | null;
  product?: ReviewProductRef;
  customer?: ReviewCustomerRef;
}

/** Query params for GET /admin/reviews (server-side filter/paginate). */
export interface AdminReviewListParams extends PaginationParams {
  status?: ReviewStatus;
  rating?: number;
}

/** Thẻ tổng quan (GET /admin/reviews/stats). */
export interface ReviewStats {
  pending: number;
  published: number;
  rejected: number;
  total: number;
  average: number;
}
