import { platformApiRequest } from "@/lib/api/platform";

export type TeamRole = "client_admin" | "client_operator";

export interface TeamUser {
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string | null;
  role: TeamRole;
  user_created_at: string;
  membership_created_at: string;
}

export interface TeamUsersResponse {
  users: TeamUser[];
}

interface TeamUserActionResponse {
  user_id: string;
  tenant_id: string;
  removed: boolean;
}

interface InviteTeamUserPayload {
  email: string;
  role: TeamRole;
  display_name?: string;
}

interface UpdateTeamUserRolePayload {
  role: TeamRole;
}

export function listTeamUsers(): Promise<TeamUsersResponse> {
  return platformApiRequest<TeamUsersResponse>("/team/users", { method: "GET" });
}

export function inviteTeamUser(payload: InviteTeamUserPayload): Promise<TeamUser> {
  return platformApiRequest<TeamUser>("/team/users/invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTeamUserRole(userId: string, payload: UpdateTeamUserRolePayload): Promise<TeamUser> {
  return platformApiRequest<TeamUser>(`/team/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateTeamUser(userId: string): Promise<TeamUserActionResponse> {
  return platformApiRequest<TeamUserActionResponse>(`/team/users/${encodeURIComponent(userId)}/deactivate`, {
    method: "POST",
  });
}

export function removeTeamUser(userId: string): Promise<TeamUserActionResponse> {
  return platformApiRequest<TeamUserActionResponse>(`/team/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

