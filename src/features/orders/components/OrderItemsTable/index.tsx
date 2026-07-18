import { Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { OrderItem } from '../../types';

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Sản phẩm</TableHead>
          <TableHead className="text-right">Đơn giá</TableHead>
          <TableHead className="text-right">SL</TableHead>
          <TableHead className="text-right">Thành tiền</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="hover:bg-transparent">
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.productName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.variantTitle} · SKU: {item.sku}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(item.unitPrice)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              ×{formatNumber(item.quantity)}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCurrency(item.lineTotal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
