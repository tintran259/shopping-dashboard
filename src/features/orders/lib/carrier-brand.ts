import ghtkLogo from '@/assets/carriers/ghtk.png';
import { SELF_DELIVERY_CARRIER } from './labels';

/** Whether a carrier has a real API integration (explicit create + webhook
 *  status sync) vs. manual entry only. Only GHTK is currently integrated. */
export const API_INTEGRATED_CARRIERS = new Set<string>(['GHTK']);

interface CarrierBrand {
  /** Short mark shown in the round logo badge (2-4 chars) — fallback when
   *  no real `logo` is available (self-delivery, or an unrecognized custom
   *  carrier name typed via "Khác"). */
  initials: string;
  /** Fallback background color for the initials badge. */
  className: string;
  /** Real courier logo (self-hosted asset, official favicon) — preferred
   *  over the initials fallback whenever present. */
  logo?: string;
}

const CARRIER_BRANDS: Record<string, CarrierBrand> = {
  [SELF_DELIVERY_CARRIER]: { initials: 'TG', className: 'bg-slate-500 text-white' },
  GHTK: { initials: 'GHTK', className: 'bg-emerald-600 text-white', logo: ghtkLogo },
};

/** Falls back to a generic grey badge with the carrier's own initials for a
 *  custom ("Khác") name not in the preset list. */
export function carrierBrand(carrier: string): CarrierBrand {
  return (
    CARRIER_BRANDS[carrier] ?? {
      initials: carrier.slice(0, 3).toUpperCase(),
      className: 'bg-muted text-muted-foreground',
    }
  );
}

export function isApiIntegratedCarrier(carrier: string | undefined): boolean {
  return !!carrier && API_INTEGRATED_CARRIERS.has(carrier);
}
