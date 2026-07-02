import { Star } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Reviews moderation. Framed for future work: the BE currently exposes only
 * `GET /reviews/product/:productId` and `POST /reviews` — no admin
 * list/approve/hide endpoints yet. Wire moderation here once they land.
 */
export function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá"
        description="Duyệt / ẩn đánh giá sản phẩm của khách hàng."
      />
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Star className="size-6" />}
            title="Chưa có API kiểm duyệt đánh giá"
            description="Backend hiện chỉ có GET /reviews/product/:productId và POST /reviews. Khi có endpoint admin (list + duyệt/ẩn), khung này sẽ hiển thị hàng chờ kiểm duyệt."
          />
        </CardContent>
      </Card>
    </div>
  );
}
