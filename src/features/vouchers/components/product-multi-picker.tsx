import { useEffect, useState } from 'react';
import { Package, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency } from '@/lib/format';
import { useProducts, type Product } from '@/features/catalog';
import type { VoucherProductRef } from '../types';

interface ProductMultiPickerProps {
  value: VoucherProductRef[];
  onChange: (value: VoucherProductRef[]) => void;
}

/** Primary image (or first) of a product, if any — same convention as the
 *  Products list page. Takes `images` directly (not a whole Product) so the
 *  exact same function reads both a live search result and an already-saved
 *  voucher's product ref loaded from the BE. */
function thumbnailOf(images?: { url: string; isPrimary: boolean }[]): string | undefined {
  const imgs = images ?? [];
  return (imgs.find((i) => i.isPrimary) ?? imgs[0])?.url;
}

function toRef(p: Product): VoucherProductRef {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    images: p.images,
    basePrice: p.basePrice,
    status: p.status,
  };
}

/** Search-and-add product picker — empty selection = "combo" restriction is
 *  off (voucher applies to every product). Adding 1 = specific to that
 *  product; adding several = the "combo/group" case. */
export function ProductMultiPicker({ value, onChange }: ProductMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  const query = useProducts({ q, limit: 8 }, { enabled: q.length >= 2 });
  const results = (query.data?.data ?? []).filter(
    (p) => !value.some((v) => v.id === p.id),
  );

  const add = (p: VoucherProductRef) => {
    onChange([...value, p]);
    setInput('');
    setQ('');
    setOpen(false);
  };
  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));

  return (
    <div className="space-y-2">
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
              placeholder="Tìm sản phẩm để thêm vào combo…"
              className="pl-8"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[28rem] max-h-72 overflow-y-auto p-0"
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
              {results.map((p) => {
                const thumb = thumbnailOf(p.images);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => add(toRef(p))}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <Package className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(p.basePrice)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((p) => {
            const thumb = thumbnailOf(p.images);
            return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
                {thumb ? (
                  <img src={thumb} alt={p.name} className="size-full object-cover" />
                ) : (
                  <Package className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatCurrency(p.basePrice)}
              </span>
              <StatusBadge kind="product" value={p.status} />
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Bỏ ${p.name}`}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
