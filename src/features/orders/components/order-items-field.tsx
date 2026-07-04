import { useFieldArray, type Control } from 'react-hook-form';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryStatus } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useVariantStock } from '@/features/inventory';
import type { OrderFormValues, OrderItemFormValue } from '../lib/order-schema';
import { ProductPicker, type PickedVariant } from './product-picker';

interface OrderItemsFieldProps {
  control: Control<OrderFormValues>;
  /** Branch selected at the top of the order form — each row checks its stock
   *  against this branch specifically (display only; the BE re-checks
   *  availability authoritatively when the order is actually submitted). */
  branchId?: string;
}

/**
 * Picked-variant line items for the order being created. Prices shown here are
 * a client preview only (already-known variant prices) — the BE recomputes and
 * owns the authoritative subtotal/total once the order is actually submitted.
 */
export function OrderItemsField({ control, branchId }: OrderItemsFieldProps) {
  const items = useFieldArray<OrderFormValues, 'items'>({ control, name: 'items' });

  const handlePick = (picked: PickedVariant) => {
    const existingIndex = items.fields.findIndex(
      (f) => f.variantId === picked.variantId,
    );
    if (existingIndex >= 0) {
      const current = items.fields[existingIndex];
      if (!current) return;
      items.update(existingIndex, {
        variantId: current.variantId,
        productName: current.productName,
        variantTitle: current.variantTitle,
        sku: current.sku,
        price: current.price,
        quantity: current.quantity + 1,
      });
    } else {
      items.append({ ...picked, quantity: 1 });
    }
  };

  const subtotal = items.fields.reduce(
    (sum, f) => sum + Number(f.price) * f.quantity,
    0,
  );

  return (
    <div className="space-y-3">
      <ProductPicker onPick={handlePick} branchId={branchId} />

      {items.fields.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Chưa có sản phẩm nào — tìm và thêm sản phẩm ở trên.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="w-36 text-center">Số lượng</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.fields.map((field, index) => (
                <OrderItemRow
                  key={field.id}
                  field={field}
                  branchId={branchId}
                  onChangeQuantity={(quantity) =>
                    items.update(index, { ...field, quantity })
                  }
                  onRemove={() => items.remove(index)}
                />
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Tạm tính:</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(String(subtotal))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderItemRow({
  field,
  branchId,
  onChangeQuantity,
  onRemove,
}: {
  field: OrderItemFormValue;
  branchId?: string;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  // One row = one variant → the hook here is per line item, not per keystroke.
  const { data: stock } = useVariantStock(field.variantId);
  const branchStock = branchId
    ? stock?.find((s) => s.branchId === branchId)
    : undefined;
  const isPreorder = branchStock?.status === InventoryStatus.PREORDER;
  const available = branchStock
    ? Math.max(0, branchStock.quantity - branchStock.reserved)
    : undefined;
  const exceedsStock =
    !!branchId && !isPreorder && available !== undefined && field.quantity > available;

  return (
    <TableRow className="hover:bg-transparent align-top">
      <TableCell>
        <p className="font-medium">{field.productName}</p>
        <p className="text-xs text-muted-foreground">
          {field.variantTitle ? `${field.variantTitle} · ` : ''}
          {field.sku}
        </p>
        {branchId &&
          (exceedsStock ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3" />
              Vượt tồn kho tại chi nhánh (còn {formatNumber(available ?? 0)})
            </p>
          ) : isPreorder ? (
            <p className="mt-1 text-xs text-info">Hàng đặt trước tại chi nhánh</p>
          ) : available !== undefined ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Còn {formatNumber(available)} tại chi nhánh
            </p>
          ) : null)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(field.price)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={field.quantity <= 1}
            onClick={() => onChangeQuantity(field.quantity - 1)}
            aria-label="Giảm số lượng"
          >
            <Minus className="size-3" />
          </Button>
          <Input
            type="number"
            min={1}
            value={field.quantity}
            // Đã có nút +/- riêng — ẩn spinner mặc định của trình duyệt vì nó
            // đè lên chữ số trong ô hẹp này.
            className="h-7 w-14 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) => onChangeQuantity(Math.max(1, Number(e.target.value) || 1))}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onChangeQuantity(field.quantity + 1)}
            aria-label="Tăng số lượng"
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(String(Number(field.price) * field.quantity))}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={onRemove}
          aria-label="Xóa sản phẩm"
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
