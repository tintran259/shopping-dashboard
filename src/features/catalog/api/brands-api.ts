import { apiClient } from '@/lib/api-client';
import type { Brand } from '../types';

export interface BrandInput {
  slug: string;
  name: string;
  logoUrl?: string;
}

export const brandsApi = {
  list: () => apiClient.get<Brand[]>('/brands'),
  create: (body: BrandInput) => apiClient.post<Brand>('/brands', body),
  update: (id: string, body: Partial<BrandInput>) =>
    apiClient.patch<Brand>(`/brands/${id}`, body),
  remove: (id: string) => apiClient.delete<void>(`/brands/${id}`),
};
