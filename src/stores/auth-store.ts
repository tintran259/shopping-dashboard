import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerRole, CustomerType } from '@/types';

/** The `user` object returned by `POST /auth/login`. */
export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  type: CustomerType;
  role: CustomerRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** True once a token exists (does not guarantee admin — see isAdmin). */
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSession: (token: string, user: AuthUser) => void;
  /** Update the user profile without touching the token (e.g. after /auth/me). */
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Client state ONLY: the auth token + a cached copy of the signed-in user.
 * Server data (orders, products…) never lives here — that's React Query.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      setSession: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        }),
      setUser: (user) => set({ user, isAdmin: user.role === 'admin' }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
        }),
    }),
    {
      name: 'lata-bo-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state.user) {
          state.isAuthenticated = true;
          state.isAdmin = state.user.role === 'admin';
        }
      },
    },
  ),
);

/** Non-reactive accessor for use outside React (e.g. axios interceptors). */
export const authStore = {
  getToken: () => useAuthStore.getState().token,
  logout: () => useAuthStore.getState().logout(),
};
