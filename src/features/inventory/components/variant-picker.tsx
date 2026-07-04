import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductStatus } from '@/types';
import { useProducts, type Product, type ProductVariant } from '@/features/catalog';

export interface PickedInventoryVariant {
  variantId: string;
  productId: string;
  productName: string;
  productStatus: ProductStatus;
  variantTitle: string;
  sku: string;
}

interface VariantPickerProps {
  onPick: (variant: PickedInventoryVariant) => void;
}

/** "500g · Đen" — joins the variant's declared option values in order. */
function variantLabel(variant: ProductVariant): string {
  return [...(variant.optionValues ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => v.value)
    .join(' · ');
}

/**
 * Server-side product/variant search for looking up stock — typing hits
 * GET /admin/products?q=… (debounced), never a client-side filter. Replaces
 * the old "paste a variant UUID copied from the product editor" flow. No
 * status filter — staff may need to check stock on a draft/discontinued item
 * too, not just active ones (unlike the order-creation picker).
 */
export function VariantPicker({ onPick }: VariantPickerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  const query = useProducts({ q, limit: 8 }, { enabled: q.length >= 2 });
  const results = query.data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => input.trim().length >= 2 && setOpen(true)}
            placeholder="Tìm sản phẩm theo tên hoặc SKU để tra cứu tồn kho…"
            className="pl-8"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-80 w-[28rem] overflow-y-auto"
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
                <li key={v.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onPick({
                        variantId: v.id,
                        productId: p.id,
                        productName: p.name,
                        productStatus: p.status,
                        variantTitle: variantLabel(v),
                        sku: v.sku,
                      });
                      setOpen(false);
                      setInput('');
                      setQ('');
                    }}
                  >
                    <span className="block w-full truncate font-medium">{p.name}</span>
                    <span className="block w-full truncate text-xs text-muted-foreground">
                      {variantLabel(v) ? `${variantLabel(v)} · ` : ''}
                      {v.sku}
                    </span>
                  </button>
                </li>
              )),
            )}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
