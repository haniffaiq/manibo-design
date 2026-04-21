import { platformApiRequest } from "@/lib/api/platform";
import type { TeamRole, TeamUser } from "@/lib/api/team";

interface AdminUsersResponse {
  users: TeamUser[];
}

interface AdminUserActionResponse {
  user_id: string;
  tenant_id: string;
  removed: boolean;
}

export interface InviteAdminTenantUserPayload {
  email: string;
  role: TeamRole;
  display_name?: string;
  subject?: string;
}

export interface UpdateAdminTenantUserRolePayload {
  role: TeamRole;
}

export function listAdminTenantUsers(tenantId: string): Promise<AdminUsersResponse> {
  return platformApiRequest<AdminUsersResponse>(`/admin/tenants/${encodeURIComponent(tenantId)}/users`, {
    method: "GET",
  });
}

export function inviteAdminTenantUser(tenantId: string, payload: InviteAdminTenantUserPayload): Promise<TeamUser> {
  return platformApiRequest<TeamUser>(`/admin/tenants/${encodeURIComponent(tenantId)}/users/invite`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTenantUserRole(
  tenantId: string,
  userId: string,
  payload: UpdateAdminTenantUserRolePayload,
): Promise<TeamUser> {
  return platformApiRequest<TeamUser>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deactivateAdminTenantUser(tenantId: string, userId: string): Promise<AdminUserActionResponse> {
  return platformApiRequest<AdminUserActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/deactivate`,
    {
      method: "POST",
    },
  );
}

export function removeAdminTenantUser(tenantId: string, userId: string): Promise<AdminUserActionResponse> {
  return platformApiRequest<AdminUserActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  );
}
