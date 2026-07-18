import { apiClient } from '@/lib/api-client';

/** Phản hồi từ `POST /admin/cms/login-token` — đủ để auto-login vào admin CMS. */
export interface CmsLoginToken {
  /** JWT admin CMS (hạn ~1 năm, do Strapi cấu hình). */
  token: string;
  /** Origin CMS, vd `http://localhost:1337` — targetOrigin cho postMessage. */
  cmsUrl: string;
  /** Trang cầu nối ghi token vào localStorage rồi chuyển tới `/admin`. */
  ssoUrl: string;
}

export const cmsApi = {
  loginToken: () => apiClient.post<CmsLoginToken>('/admin/cms/login-token', {}),
};
