import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '../api/auth-api';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * Fetches the current profile to (re)confirm the session & admin role on load.
 * Only runs when a token exists.
 */
export function useProfile() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.me(),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
