import { platformApiRequest } from "@/lib/api/platform";

export type AdminAgentDefinitionStatus = "draft" | "published" | "retired";
export type AdminAgentDefinitionVersionStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "published"
  | "previously_published"
  | "archived";
export type AdminReviewDecision = "approved" | "rejected";

export interface AdminAgentDefinitionSummary {
  id: string;
  tenant_id: string;
  name: string;
  status: AdminAgentDefinitionStatus;
  published_version: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminAgentDefinitionRequest {
  name: string;
}

export interface AdminAgentDefinition {
  id: string;
  tenant_id: string;
  name: string;
  status: AdminAgentDefinitionStatus;
  published_version: number | null;
}

export interface CreateAdminAgentDefinitionVersionRequest {
  source_yaml: string;
  model_policy_snapshot_ref?: string | null;
  platform_defaults_version?: string | null;
  expected_source_yaml_hash?: string | null;
}

export interface AdminAgentDefinitionVersion {
  id: string;
  agent_definition_id: string;
  tenant_id: string;
  version: number;
  status: AdminAgentDefinitionVersionStatus;
  source_yaml_hash: string;
  compiled_hash: string;
}

export interface AdminAgentDefinitionVersionDetail {
  id: string;
  agent_definition_id: string;
  tenant_id: string;
  version: number;
  status: AdminAgentDefinitionVersionStatus;
  source_yaml: string;
  source_yaml_hash: string;
  compiled_hash: string;
  model_policy_snapshot_ref: string | null;
  platform_defaults_version: string | null;
  created_at: string;
  submitted_at: string | null;
  published_at: string | null;
  review_decision: AdminReviewDecision | null;
  review_reason: string | null;
  review_submitted_at: string | null;
  review_decided_at: string | null;
}

export interface ReviewAdminAgentDefinitionVersionRequest {
  decision: AdminReviewDecision;
  reason?: string | null;
  test_call_ids?: string[];
}

export interface AdminAgentDefinitionActionResponse {
  status: string;
}

export interface AdminAgentDefinitionArtifact {
  agent_definition_id: string;
  tenant_id: string;
  name: string;
  version: number;
  compiled_config: Record<string, unknown>;
  compiled_hash: string;
}

export function listAdminTenantAgentDefinitions(
  tenantId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<AdminAgentDefinitionSummary[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return platformApiRequest<AdminAgentDefinitionSummary[]>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions?${params.toString()}`,
    {
      method: "GET",
    },
  );
}

export function getAdminTenantAgentDefinition(
  tenantId: string,
  agentDefinitionId: string,
): Promise<AdminAgentDefinitionSummary> {
  return platformApiRequest<AdminAgentDefinitionSummary>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminTenantAgentDefinitionByName(
  tenantId: string,
  agentName: string,
): Promise<AdminAgentDefinitionSummary> {
  return platformApiRequest<AdminAgentDefinitionSummary>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/by-name/${encodeURIComponent(agentName)}`,
    {
      method: "GET",
    },
  );
}

export function createAdminTenantAgentDefinition(
  tenantId: string,
  payload: CreateAdminAgentDefinitionRequest,
): Promise<AdminAgentDefinition> {
  return platformApiRequest<AdminAgentDefinition>(`/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listAdminTenantAgentDefinitionVersions(
  tenantId: string,
  agentDefinitionId: string,
): Promise<AdminAgentDefinitionVersionDetail[]> {
  return platformApiRequest<AdminAgentDefinitionVersionDetail[]>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions`,
    {
      method: "GET",
    },
  );
}

export function createAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  payload: CreateAdminAgentDefinitionVersionRequest,
): Promise<AdminAgentDefinitionVersion> {
  return platformApiRequest<AdminAgentDefinitionVersion>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  version: number,
  payload: CreateAdminAgentDefinitionVersionRequest,
): Promise<AdminAgentDefinitionVersion> {
  return platformApiRequest<AdminAgentDefinitionVersion>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions/${version}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function submitAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  version: number,
): Promise<AdminAgentDefinitionActionResponse> {
  return platformApiRequest<AdminAgentDefinitionActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions/${version}/submit`,
    {
      method: "POST",
    },
  );
}

export function reviewAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  version: number,
  payload: ReviewAdminAgentDefinitionVersionRequest,
): Promise<AdminAgentDefinitionActionResponse> {
  return platformApiRequest<AdminAgentDefinitionActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions/${version}/review`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function publishAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  version: number,
): Promise<AdminAgentDefinitionActionResponse> {
  return platformApiRequest<AdminAgentDefinitionActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions/${version}/publish`,
    {
      method: "POST",
    },
  );
}

export function archiveAdminTenantAgentDefinitionVersion(
  tenantId: string,
  agentDefinitionId: string,
  version: number,
): Promise<AdminAgentDefinitionActionResponse> {
  return platformApiRequest<AdminAgentDefinitionActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/versions/${version}/archive`,
    {
      method: "POST",
    },
  );
}

export function retireAdminTenantAgentDefinition(
  tenantId: string,
  agentDefinitionId: string,
): Promise<AdminAgentDefinitionActionResponse> {
  return platformApiRequest<AdminAgentDefinitionActionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}/retire`,
    {
      method: "POST",
    },
  );
}

export interface BrowserSessionResponse {
  room_name: string;
  token: string;
  connect_url: string;
  call_id: string;
  agent_definition_version: number;
  agent_definition_name: string;
  compiled_hash: string;
  expires_at: string;
}

export function createBrowserVoiceSession(
  tenantId: string,
  agentDefinitionId: string,
  agentDefinitionVersion?: number | null,
): Promise<BrowserSessionResponse> {
  const payload: Record<string, unknown> = { agent_definition_id: agentDefinitionId };
  if (agentDefinitionVersion != null) {
    payload.agent_definition_version = agentDefinitionVersion;
  }
  return platformApiRequest<BrowserSessionResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/calls/browser-session`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function cleanupBrowserVoiceSession(tenantId: string, callId: string): Promise<void> {
  return platformApiRequest<void>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/calls/browser-session/${encodeURIComponent(callId)}`,
    {
      method: "DELETE",
    },
  );
}

export interface TestCallSummary {
  call_id: string;
  started_at: string | null;
  duration_seconds: number | null;
  outcome: string | null;
  agent_definition_version: number | null;
  agent_definition_name: string | null;
  compiled_hash: string | null;
}

export function listTestCalls(
  tenantId: string,
  agentDefinitionId: string,
  version?: number | null,
  compiledHash?: string | null,
  limit = 10,
): Promise<TestCallSummary[]> {
  const params = new URLSearchParams({
    agent_definition_id: agentDefinitionId,
    limit: String(limit),
  });
  if (version != null) params.set("version", String(version));
  if (compiledHash) params.set("compiled_hash", compiledHash);
  return platformApiRequest<TestCallSummary[]>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/calls/test-history?${params.toString()}`,
  );
}

export function getAdminTenantAgentDefinitionArtifactByName(
  tenantId: string,
  name: string,
): Promise<AdminAgentDefinitionArtifact> {
  return platformApiRequest<AdminAgentDefinitionArtifact>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/agent-definitions/by-name/${encodeURIComponent(name)}/artifact`,
    {
      method: "GET",
    },
  );
}
