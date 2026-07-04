import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '../api/locations-api';

export const locationKeys = {
  all: ['locations'] as const,
  provinces: () => [...locationKeys.all, 'provinces'] as const,
  wards: (code: number) => [...locationKeys.all, 'wards', code] as const,
};

/** Administrative data is effectively static — never goes stale in a session. */
export function useProvinces() {
  return useQuery({
    queryKey: locationKeys.provinces(),
    queryFn: () => locationsApi.provinces(),
    staleTime: Infinity,
  });
}

export function useWards(provinceCode: number | undefined) {
  return useQuery({
    queryKey: locationKeys.wards(provinceCode ?? 0),
    queryFn: () => locationsApi.wards(provinceCode as number),
    enabled: !!provinceCode,
    staleTime: Infinity,
  });
}
