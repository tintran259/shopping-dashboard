import { apiClient } from '@/lib/api-client';
import type {
  AdminAccount,
  CreateAdminInput,
  PermissionGroup,
  Role,
  RoleInput,
  UpdateAdminInput,
} from '../types';

export const accessApi = {
  // ── Roles ────────────────────────────────────────────────────────────────
  permissionCatalog: () =>
    apiClient.get<PermissionGroup[]>('/admin/roles/permissions'),
  listRoles: () => apiClient.get<Role[]>('/admin/roles'),
  createRole: (body: RoleInput) => apiClient.post<Role>('/admin/roles', body),
  updateRole: (id: string, body: Partial<RoleInput>) =>
    apiClient.patch<Role>(`/admin/roles/${id}`, body),
  deleteRole: (id: string) => apiClient.delete<void>(`/admin/roles/${id}`),

  // ── Admin accounts ─────────────────────────────────────────────────────────
  listAdmins: () => apiClient.get<AdminAccount[]>('/admin/admins'),
  createAdmin: (body: CreateAdminInput) =>
    apiClient.post<AdminAccount>('/admin/admins', body),
  updateAdmin: (id: string, body: UpdateAdminInput) =>
    apiClient.patch<AdminAccount>(`/admin/admins/${id}`, body),
  deleteAdmin: (id: string) => apiClient.delete<void>(`/admin/admins/${id}`),
};
