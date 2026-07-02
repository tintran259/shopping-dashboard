import { apiClient } from '@/lib/api-client';
import type { Category } from '../types';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (body: CategoryInput) => apiClient.post<Category>('/categories', body),
  update: (id: string, body: Partial<CategoryInput>) =>
    apiClient.patch<Category>(`/categories/${id}`, body),
  remove: (id: string) => apiClient.delete<void>(`/categories/${id}`),
};
