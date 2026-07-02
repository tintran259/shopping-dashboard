import { apiClient } from '@/lib/api-client';
import type {
  CreateProductInput,
  ProductDetail,
  ProductListParams,
  ProductListResponse,
  UpdateProductInput,
} from '../types';

/** Raw product entity returned by create/update (id is all the UI needs). */
export interface ProductMutationResult {
  id: string;
  slug: string;
  name: string;
}

export const productsApi = {
  list: (params: ProductListParams) =>
    apiClient.get<ProductListResponse>('/products', { params }),

  getById: (id: string) => apiClient.get<ProductDetail>(`/products/${id}`),

  create: (body: CreateProductInput) =>
    apiClient.post<ProductMutationResult>('/products', body),

  update: (id: string, body: UpdateProductInput) =>
    apiClient.patch<ProductMutationResult>(`/products/${id}`, body),

  remove: (id: string) => apiClient.delete<void>(`/products/${id}`),
};
