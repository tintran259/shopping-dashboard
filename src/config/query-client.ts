import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-error';

/**
 * Shared React Query client. Server state lives here exclusively — never
 * duplicated into Zustand.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Không retry lỗi 4xx (client) — chỉ retry lỗi mạng/5xx, tối đa 2 lần.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
