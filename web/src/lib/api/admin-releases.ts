import { platformApiRequest } from "@/lib/api/platform";

export interface AdminReleaseSummary {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  notes: string | null;
  component_count: number;
}

export interface AdminReleaseComponent {
  id: string;
  release_id: string;
  component_type: "solution" | "model_policy" | "platform_defaults" | "agent_definition" | string;
  name: string;
  version: string;
  metadata: Record<string, unknown>;
}

export interface CreateAdminReleaseRequest {
  name: string;
  notes?: string | null;
  solution_versions?: Record<string, string>;
  model_policy_version?: string | null;
  platform_defaults_version?: string | null;
  agent_definition_versions?: Record<string, string>;
}

export interface CreateAdminReleaseResponse {
  release_id: string;
}

export interface ApplyAdminTenantReleaseRequest {
  release_id: string;
  wait?: boolean;
}

export interface AdminTenantReleaseAssignment {
  tenant_id: string;
  desired_release_id: string;
  active_release_id: string | null;
  status: string;
  attempt_count: number;
  last_error: string | null;
  rollout_started_at: string | null;
  rollout_completed_at: string | null;
  updated_at: string | null;
}

export function listAdminReleases(limit: number = 100, offset: number = 0): Promise<AdminReleaseSummary[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return platformApiRequest<AdminReleaseSummary[]>(`/admin/releases?${params.toString()}`, {
    method: "GET",
  });
}

export function getAdminReleaseComponents(releaseId: string): Promise<AdminReleaseComponent[]> {
  return platformApiRequest<AdminReleaseComponent[]>(`/admin/releases/${encodeURIComponent(releaseId)}/components`, {
    method: "GET",
  });
}

export function createAdminRelease(payload: CreateAdminReleaseRequest): Promise<CreateAdminReleaseResponse> {
  return platformApiRequest<CreateAdminReleaseResponse>("/admin/releases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminTenantReleaseAssignment(tenantId: string): Promise<AdminTenantReleaseAssignment> {
  return platformApiRequest<AdminTenantReleaseAssignment>(`/admin/tenants/${encodeURIComponent(tenantId)}/release`, {
    method: "GET",
  });
}

export function applyAdminTenantRelease(
  tenantId: string,
  payload: ApplyAdminTenantReleaseRequest,
): Promise<AdminTenantReleaseAssignment> {
  return platformApiRequest<AdminTenantReleaseAssignment>(`/admin/tenants/${encodeURIComponent(tenantId)}/release`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
