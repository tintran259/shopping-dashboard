import type { BaseEntity } from '@/types';

/** Nhóm quyền từ BE (`GET /admin/roles/permissions`) — dựng ma trận quyền. */
export interface PermissionGroup {
  key: string;
  label: string;
  actions: readonly string[];
}

/** Vai trò nhân viên (StaffRole). */
export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
  allBranches: boolean;
  branchIds: string[];
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: string[];
  allBranches: boolean;
  branchIds: string[];
}

/** Tài khoản back-office (admin / super_admin), kèm vai trò được gán. */
export interface AdminAccount extends BaseEntity {
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  staffRoleId?: string | null;
  staffRole?: Role | null;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  staffRoleId: string;
}

export interface UpdateAdminInput {
  firstName?: string;
  lastName?: string;
  staffRoleId?: string;
  status?: string;
  password?: string;
}
