import { Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Customers (B2C/B2B). Framed for future work: the BE currently only exposes
 * self-service `/me/*` endpoints — there is no admin "list customers" endpoint
 * yet. Wire the table here once `GET /customers` (admin) lands.
 */
export function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Danh sách khách hàng B2C/B2B và địa chỉ."
      />
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Users className="size-6" />}
            title="Chưa có API danh sách khách hàng"
            description="Backend hiện chỉ có endpoint /me/* (self-service). Khi có GET /customers (admin), khung này sẽ hiển thị bảng danh sách + phân trang."
          />
        </CardContent>
      </Card>
    </div>
  );
}
