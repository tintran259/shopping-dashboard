import { apiClient } from '@/lib/api-client';
import type { Category, CategorySeo } from '../types';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  /** `null` explicitly clears the parent (→ root) — `undefined` is dropped
   *  entirely by JSON.stringify, so it must never be used for "clear". */
  parentId?: string | null;
  /** `null` explicitly clears an existing SEO value — see the `parentId` note. */
  seo?: CategorySeo | null;
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (body: CategoryInput) => apiClient.post<Category>('/categories', body),
  update: (id: string, body: Partial<CategoryInput>) =>
    apiClient.patch<Category>(`/categories/${id}`, body),
  remove: (id: string) => apiClient.delete<void>(`/categories/${id}`),
  /** One request for a whole drag-and-drop reorder, instead of one PATCH per
   *  moved row. */
  reorder: (items: { id: string; sortOrder: number }[]) =>
    apiClient.patch<void>('/categories/reorder', { items }),
};
