import { useEffect, useState } from 'react';
import {
  useController,
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
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
import { formatCurrency, formatNumber } from '@/lib/format';
import { stockAvailability, useVariantStock } from '@/features/inventory';
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
  const { getValues, setValue } = useFormContext<OrderFormValues>();
  // Live values (setValue on a quantity doesn't refresh useFieldArray's `fields`
  // snapshot) so the subtotal below tracks typed quantities in real time.
  const watched = useWatch({ control, name: 'items' }) ?? [];

  const handlePick = (picked: PickedVariant) => {
    const existingIndex = items.fields.findIndex(
      (f) => f.variantId === picked.variantId,
    );
    if (existingIndex >= 0) {
      // Already in the cart → bump quantity by 1. Read the CURRENT quantity
      // (may have been typed) via getValues, and use setValue rather than
      // fieldArray.update so the row isn't remounted (would steal input focus).
      const current = getValues(`items.${existingIndex}.quantity`) ?? 1;
      setValue(`items.${existingIndex}.quantity`, current + 1, {
        shouldDirty: true,
      });
    } else {
      items.append({ ...picked, quantity: 1 });
    }
  };

  const subtotal = watched.reduce(
    (sum, i) => sum + Number(i.price) * (i.quantity || 0),
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
                  control={control}
                  index={index}
                  item={field}
                  branchId={branchId}
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
  control,
  index,
  item,
  branchId,
  onRemove,
}: {
  control: Control<OrderFormValues>;
  index: number;
  /** Display-only snapshot (name/sku/price/title never change after picking). */
  item: OrderItemFormValue;
  branchId?: string;
  onRemove: () => void;
}) {
  // Quantity is driven through a controller (not fieldArray.update) so editing
  // it never remounts the row — typing keeps focus and multi-digit input works.
  const { field: qty } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const quantity = qty.value;

  // Local draft lets the field go momentarily empty while typing (so a digit can
  // be deleted and retyped) without the value snapping back to 1 mid-edit.
  const [draft, setDraft] = useState(String(quantity));
  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const setQuantity = (n: number) => qty.onChange(Math.max(1, n));

  // One row = one variant → the hook here is per line item, not per keystroke.
  // Shares cache with the form-level useVariantsStock (same query key).
  const { data: stock } = useVariantStock(item.variantId);
  const avail = stockAvailability(stock, branchId);
  const exceedsStock =
    !!avail && !avail.isPreorder && quantity > avail.available;

  return (
    <TableRow className="hover:bg-transparent align-top">
      <TableCell>
        <p className="font-medium">{item.productName}</p>
        <p className="text-xs text-muted-foreground">
          {item.variantTitle ? `${item.variantTitle} · ` : ''}
          {item.sku}
        </p>
        {avail &&
          (exceedsStock ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3" />
              Vượt tồn kho tại chi nhánh (còn {formatNumber(avail.available)})
            </p>
          ) : avail.isPreorder ? (
            <p className="mt-1 text-xs text-info">Hàng đặt trước tại chi nhánh</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Còn {formatNumber(avail.available)} tại chi nhánh
            </p>
          ))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(item.price)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
            aria-label="Giảm số lượng"
          >
            <Minus className="size-3" />
          </Button>
          <Input
            inputMode="numeric"
            // Đã có nút +/- riêng — ẩn spinner mặc định của trình duyệt vì nó
            // đè lên chữ số trong ô hẹp này.
            className="h-7 w-14 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={draft}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              setDraft(raw);
              if (raw !== '') qty.onChange(Math.max(1, Number(raw)));
            }}
            onBlur={() => {
              if (draft === '' || Number(draft) < 1) {
                setDraft('1');
                qty.onChange(1);
              }
              qty.onBlur();
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Tăng số lượng"
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(String(Number(item.price) * quantity))}
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
