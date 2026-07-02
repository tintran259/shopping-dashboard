import type { AuthUser } from '@/stores/auth-store';
import type { BaseEntity, CustomerRole, CustomerType } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

/** Response of `POST /auth/login`. */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Response of `GET /auth/me` (full customer entity, no secrets). */
export interface Profile extends BaseEntity {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  type: CustomerType;
  role: CustomerRole;
  status: string;
  defaultBranchId?: string;
}
