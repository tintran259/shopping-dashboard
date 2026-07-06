import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@/types';
import type {
  AdminVoucherListParams,
  UpdateVoucherInput,
  Voucher,
  VoucherInput,
  VoucherStateCounts,
} from '../types';

export const vouchersApi = {
  /** [admin] List vouchers. All filtering (q/state) + pagination is server-side. */
  list: (params: AdminVoucherListParams) =>
    apiClient.get<PaginatedResult<Voucher>>('/vouchers', { params }),

  /** [admin] Voucher counts by state, for the list page's stat cards — a real
   *  aggregate over every voucher, not derived from whatever page is loaded. */
  stats: () => apiClient.get<VoucherStateCounts>('/vouchers/stats'),

  getById: (id: string) => apiClient.get<Voucher>(`/vouchers/${id}`),

  create: (body: VoucherInput) => apiClient.post<Voucher>('/vouchers', body),

  update: (id: string, body: UpdateVoucherInput) =>
    apiClient.patch<Voucher>(`/vouchers/${id}`, body),

  remove: (id: string) => apiClient.delete<void>(`/vouchers/${id}`),
};
