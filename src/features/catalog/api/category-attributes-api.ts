import { apiClient } from '@/lib/api-client';
import type { CategoryAttribute, CategoryAttributeType } from '../types';

export interface CategoryAttributeInput {
  name: string;
  type: CategoryAttributeType;
  options?: string[];
  isRequired?: boolean;
  sortOrder?: number;
}

export const categoryAttributesApi = {
  list: (categoryId: string) =>
    apiClient.get<CategoryAttribute[]>(`/categories/${categoryId}/attributes`),
  create: (categoryId: string, body: CategoryAttributeInput) =>
    apiClient.post<CategoryAttribute>(`/categories/${categoryId}/attributes`, body),
  update: (categoryId: string, id: string, body: Partial<CategoryAttributeInput>) =>
    apiClient.patch<CategoryAttribute>(`/categories/${categoryId}/attributes/${id}`, body),
  remove: (categoryId: string, id: string) =>
    apiClient.delete<void>(`/categories/${categoryId}/attributes/${id}`),
};
