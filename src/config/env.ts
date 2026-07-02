/** Centralised, typed access to runtime env vars. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api',
} as const;
