import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { authStore } from '@/stores/auth-store';
import { ApiError, type ApiErrorBody } from './api-error';

/** Path (relative to base URL) that must never trigger the 401 auto-logout. */
const LOGIN_PATH = '/auth/login';

const instance: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

// ── Request: gắn Bearer token ────────────────────────────────────────
instance.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ── Response: chuẩn hoá lỗi + xử lý 401 ──────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // 401 (trừ chính trang login) → xoá phiên; ProtectedRoute sẽ điều hướng
    // về /login khi state đổi. BE hiện chưa có refresh token nên ta logout.
    if (status === 401 && !url.includes(LOGIN_PATH)) {
      authStore.logout();
    }

    return Promise.reject(ApiError.fromAxios(error));
  },
);

/** Thin typed wrapper so feature APIs return `T` directly, not `AxiosResponse`. */
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    instance.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    instance.patch<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    instance.put<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.delete<T>(url, config).then((r) => r.data),
};

export { instance as axiosInstance };
