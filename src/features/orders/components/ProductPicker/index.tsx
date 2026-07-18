import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductStatus } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useProducts, type Product, type ProductVariant } from '@/features/catalog';
import { stockAvailability, useVariantStock } from '@/features/inventory';

export interface PickedVariant {
  variantId: string;
  productName: string;
  variantTitle: string;
  sku: string;
  price: string;
}

interface ProductPickerProps {
  onPick: (variant: PickedVariant) => void;
  /** Branch selected at the top of the order form — used to show stock at
   *  that specific branch next to each result (display only; the BE re-checks
   *  availability authoritatively when the order is actually submitted). */
  branchId?: string;
}

/** "500g · Đen" — joins the variant's declared option values in order. Display
 *  only, mirrors OrdersService.variantLabel on the BE. */
function variantLabel(variant: ProductVariant): string {
  return [...(variant.optionValues ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => v.value)
    .join(' · ');
}

/**
 * Server-side product/variant search for the order-creation item picker — typing
 * hits GET /admin/products?q=… (debounced), never a client-side filter of an
 * already-fetched page. Picking a variant hands it to the caller; the items
 * field array owns dedupe/quantity logic.
 */
export function ProductPicker({ onPick, branchId }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  // Bắt buộc chọn chi nhánh trước: tồn kho hiển thị/kiểm theo chi nhánh, nên
  // chưa chọn thì khóa ô tìm để tránh thêm sản phẩm "mù" tồn kho.
  const noBranch = !branchId;

  const query = useProducts(
    { q, limit: 8, status: ProductStatus.ACTIVE },
    { enabled: q.length >= 2 && !noBranch },
  );
  const results = query.data?.data ?? [];

  return (
    <Popover open={open && !noBranch} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            disabled={noBranch}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => input.trim().length >= 2 && setOpen(true)}
            placeholder={
              noBranch
                ? 'Chọn chi nhánh xử lý trước khi tìm sản phẩm…'
                : 'Tìm sản phẩm theo tên để thêm vào đơn…'
            }
            className="pl-8"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-80 w-96 overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {q.length < 2 ? (
          <p className="p-3 text-sm text-muted-foreground">
            Nhập ít nhất 2 ký tự để tìm sản phẩm…
          </p>
        ) : query.isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : results.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        ) : (
          <ul className="divide-y">
            {results.flatMap((p: Product) =>
              (p.variants ?? []).map((v: ProductVariant) => (
                <VariantResultRow
                  key={v.id}
                  product={p}
                  variant={v}
                  branchId={branchId}
                  onPick={() => {
                    onPick({
                      variantId: v.id,
                      productName: p.name,
                      variantTitle: variantLabel(v),
                      sku: v.sku,
                      price: v.price,
                    });
                    setOpen(false);
                    setInput('');
                    setQ('');
                  }}
                />
              )),
            )}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function VariantResultRow({
  product,
  variant,
  branchId,
  onPick,
}: {
  product: Product;
  variant: ProductVariant;
  branchId?: string;
  onPick: () => void;
}) {
  // One row = one variant → the hook here is per list item, not per keystroke.
  const { data: stock } = useVariantStock(variant.id);
  const avail = stockAvailability(stock, branchId);

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
        onClick={onPick}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{product.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {variantLabel(variant) ? `${variantLabel(variant)} · ` : ''}
            {variant.sku}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="tabular-nums text-muted-foreground">
            {formatCurrency(variant.price)}
          </span>
          {avail &&
            (avail.isPreorder ? (
              <span className="text-[11px] text-info">Đặt trước</span>
            ) : (
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  avail.available > 0
                    ? 'text-muted-foreground'
                    : 'font-medium text-destructive',
                )}
              >
                Còn {formatNumber(avail.available)} tại chi nhánh
              </span>
            ))}
        </span>
      </button>
    </li>
  );
}
