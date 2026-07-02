import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, Profile } from '../types';

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', body),

  me: () => apiClient.get<Profile>('/auth/me'),
};
