import { apiClient } from '@/lib/api-client';
import type { Province, Ward } from '../types';

export const locationsApi = {
  provinces: () => apiClient.get<Province[]>('/locations/provinces'),
  wards: (code: number) =>
    apiClient.get<Ward[]>(`/locations/provinces/${code}/wards`),
  sync: () =>
    apiClient.post<{ provinces: number; wards: number }>('/locations/sync'),
};
