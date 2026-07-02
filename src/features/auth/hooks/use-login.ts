import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import type { LoginRequest, LoginResponse } from '../types';

export function useLogin() {
  return useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: (body) => authApi.login(body),
  });
}
