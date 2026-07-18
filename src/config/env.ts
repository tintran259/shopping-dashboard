const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api';

/** Gốc WebSocket (bỏ hậu tố `/api` của apiUrl) — socket namespace `/notifications`
 *  gắn vào đây. Override bằng `VITE_WS_URL` nếu WS chạy ở host khác. */
const wsUrl = import.meta.env.VITE_WS_URL ?? apiUrl.replace(/\/api\/?$/, '');

/** Centralised, typed access to runtime env vars. */
export const env = {
  apiUrl,
  wsUrl,
} as const;
