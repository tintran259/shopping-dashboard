import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { carrierBrand } from '../../lib/carrier-brand';

/** Round "logo" badge for a shipping carrier — a colored initials mark since
 *  we don't ship licensed courier logo assets, kept self-contained. Falls
 *  back to a neutral package icon when no carrier is set yet. */
export function CarrierLogo({
  carrier,
  className,
}: {
  carrier?: string;
  className?: string;
}) {
  if (!carrier) {
    return (
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full bg-muted',
          className,
        )}
      >
        <Package className="size-3.5 text-muted-foreground" />
      </span>
    );
  }

  const brand = carrierBrand(carrier);
  if (brand.logo) {
    return (
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/5',
          className,
        )}
        title={carrier}
      >
        <img src={brand.logo} alt={carrier} className="size-full object-contain p-0.5" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold leading-none tracking-tight',
        brand.className,
        className,
      )}
      title={carrier}
    >
      {brand.initials}
    </span>
  );
}
