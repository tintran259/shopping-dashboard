import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@/types';
import type {
  CreateProductInput,
  Product,
  ProductListParams,
  UpdateProductInput,
} from '../types';

export const productsApi = {
  /** [admin] List products (raw entities, standard {data, meta} envelope). */
  list: (params: ProductListParams) =>
    apiClient.get<PaginatedResult<Product>>('/admin/products', { params }),

  getById: (id: string) => apiClient.get<Product>(`/admin/products/${id}`),

  create: (body: CreateProductInput) =>
    apiClient.post<Product>('/admin/products', body),

  update: (id: string, body: UpdateProductInput) =>
    apiClient.patch<Product>(`/admin/products/${id}`, body),

  remove: (id: string) => apiClient.delete<void>(`/admin/products/${id}`),
};
