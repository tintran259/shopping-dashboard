import { apiClient } from '@/lib/api-client';
import type { CustomerStatus, PaginatedResult } from '@/types';
import type {
  AdminCustomerListParams,
  CreateB2bCustomerInput,
  Customer,
  UpdateCustomerInput,
} from '../types';

export const customersApi = {
  /** [admin] List customers. All filtering/search/sort/pagination is
   *  server-side: type, status, q, sortBy, sortOrder, page, limit. */
  list: (params: AdminCustomerListParams) =>
    apiClient.get<PaginatedResult<Customer>>('/admin/customers', { params }),

  getById: (id: string) => apiClient.get<Customer>(`/admin/customers/${id}`),

  /** [admin] Edit customer profile (name, phone). Returns the full detail
   *  (incl. addresses + B2B profile) so the detail cache stays consistent. */
  update: (id: string, body: UpdateCustomerInput) =>
    apiClient.patch<Customer>(`/admin/customers/${id}`, body),

  updateStatus: (id: string, status: CustomerStatus) =>
    apiClient.patch<Customer>(`/admin/customers/${id}/status`, { status }),

  /** [admin] Staff-entered B2B account — creates the login + company profile
   *  together (atomic on the BE). */
  createB2b: (body: CreateB2bCustomerInput) =>
    apiClient.post<Customer>('/admin/customers/b2b', body),
};
