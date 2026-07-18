import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShippingMethodCode } from '@/types';
import type { Order } from '../../types';

/** Nhãn cảnh báo "Giao nhanh" — chỉ hiện với đơn khách chọn phương thức hỏa tốc
 *  (`express`), để admin ưu tiên xử lý. Ẩn với đơn giao tiêu chuẩn, đơn nhận tại
 *  cửa hàng, và đơn cũ (chưa lưu phương thức). */
export function ExpressBadge({
  method,
  className,
}: {
  method: Order['shippingMethod'];
  className?: string;
}) {
  if (method !== ShippingMethodCode.EXPRESS) return null;
  return (
    <Badge variant="warning" className={cn('gap-1', className)}>
      <Zap className="size-3 fill-current" />
      Giao nhanh
    </Badge>
  );
}
