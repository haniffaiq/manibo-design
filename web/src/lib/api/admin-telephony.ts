import { platformApiRequest } from "@/lib/api/platform";

export type TelephonyProviderKind = "telnyx" | "genesys";
export type TelephonyOwnerScope = "deployment" | "tenant";
export type TelephonyProviderAccountStatus =
  | "draft"
  | "validating"
  | "connected"
  | "degraded"
  | "disconnected"
  | "archived";
export type TelephonyProviderCapability =
  | "telephony.connect_provider_account"
  | "telephony.sync_trunks"
  | "telephony.sync_numbers"
  | "telephony.buy_numbers"
  | "telephony.byo_sip_trunk"
  | "telephony.assign_published_assistant";
export type TelephonyTrunkStatus = "active" | "degraded";
export type TelephonyTrunkDirection = "inbound" | "outbound" | "bidirectional";
export type TelephonyNumberStatus = "inventory" | "assigned" | "degraded" | "released";
export type TelephonyNumberSource = "purchased" | "imported" | "ported";
export type TelephonyTenantPolicyMode = "default_only" | "default_with_byo_override" | "byo_only";
export type TelephonyUsableProviderAccountSource = "deployment_default" | "tenant_byo" | "none";
export type TelephonyProviderOperation =
  | "validate_account"
  | "sync_trunks"
  | "search_available_numbers"
  | "sync_numbers"
  | "acquire_numbers"
  | "reconcile";
export type TelephonyProviderOperationMode = "managed" | "import_only" | "reconcile_only" | "unsupported";
export type TelephonyProviderAccountTestOutcome = "success" | "failure";
export type TelephonyProviderAccountProbeKind =
  | "secret_ref.resolve"
  | "provider.connectivity"
  | "provider.unsupported";

export interface TelephonyProviderCapabilitySupport {
  capability: TelephonyProviderCapability;
  enabled: boolean;
  notes: string | null;
}

export interface TelephonyProviderOperationSupport {
  operation: TelephonyProviderOperation;
  mode: TelephonyProviderOperationMode;
  implemented: boolean;
  notes: string | null;
}

export interface TelephonyProviderPackMetadata {
  provider_kind: TelephonyProviderKind;
  display_name: string;
  capability_matrix: TelephonyProviderCapabilitySupport[];
  operations: TelephonyProviderOperationSupport[];
}

export interface TelephonyProviderAccountControlPlaneSnapshot {
  last_tested_at: string;
  last_test_outcome: TelephonyProviderAccountTestOutcome;
  last_test_message: string;
  last_test_probe: TelephonyProviderAccountProbeKind;
}

export interface TelephonyProviderAccountView {
  id: string;
  owner_scope: TelephonyOwnerScope;
  owner_tenant_id: string | null;
  provider_kind: TelephonyProviderKind;
  display_name: string;
  status: TelephonyProviderAccountStatus;
  can_delete?: boolean;
  capability_snapshot: TelephonyProviderCapability[];
  provider_metadata: Record<string, unknown>;
  control_plane: TelephonyProviderAccountControlPlaneSnapshot | null;
  credential_configured: boolean;
  created_at: string;
  updated_at: string;
}

export interface TelephonyProviderAccountCreateRequest {
  provider_kind: TelephonyProviderKind;
  display_name: string;
  credential_ref?: string;
  provider_metadata?: Record<string, unknown>;
}

export interface TelephonyProviderAccountUpdateRequest {
  display_name?: string;
  credential_ref?: string | null;
  provider_metadata?: Record<string, unknown> | null;
}

export interface TelephonyProviderAccountTestResult {
  provider_account: TelephonyProviderAccountView;
  tested_at: string;
  outcome: TelephonyProviderAccountTestOutcome;
  message: string;
  probe: TelephonyProviderAccountProbeKind;
  details: Record<string, unknown>;
}

export interface TelephonyTrunkControlPlaneSnapshot {
  last_synced_at: string | null;
  last_sync_message: string | null;
  last_reconciled_at: string | null;
  last_reconcile_message: string | null;
  last_reconcile_issue_codes: string[];
}

export interface TelephonyTrunkView {
  id: string;
  provider_account_id: string;
  display_name: string;
  direction: TelephonyTrunkDirection;
  transport_kind: string;
  provider_resource_id: string | null;
  livekit_binding_id: string | null;
  status: TelephonyTrunkStatus;
  config: Record<string, unknown>;
  control_plane: TelephonyTrunkControlPlaneSnapshot | null;
  created_at: string;
  updated_at: string;
}

export interface TelephonyTrunkSyncResult {
  provider_account_id: string;
  synced_at: string;
  created_count: number;
  updated_count: number;
  trunks: TelephonyTrunkView[];
  message: string;
}

export interface TelephonyNumberControlPlaneSnapshot {
  last_synced_at: string | null;
  last_sync_message: string | null;
  last_seen_in_provider_inventory_at: string | null;
  last_acquired_at: string | null;
  last_acquisition_message: string | null;
  last_provider_order_id: string | null;
}

export interface TelephonyNumberBindingSummary {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  tenant_slug: string | null;
  sip_trunk_id: string;
  active: boolean;
  agent_definition_id: string | null;
  agent_name: string | null;
  agent_status: string | null;
  published_version: number | null;
  routing_ready: boolean;
  created_at: string;
}

export interface TelephonyNumberView {
  id: string;
  provider_account_id: string;
  trunk_id: string | null;
  e164_number: string;
  provider_number_id: string | null;
  status: TelephonyNumberStatus;
  source: TelephonyNumberSource;
  capability_snapshot: TelephonyProviderCapability[];
  number_metadata: Record<string, unknown>;
  control_plane: TelephonyNumberControlPlaneSnapshot | null;
  binding_summary: TelephonyNumberBindingSummary | null;
  created_at: string;
  updated_at: string;
}

export interface TelephonyNumberSyncResult {
  provider_account_id: string;
  synced_at: string;
  created_count: number;
  updated_count: number;
  released_count: number;
  retained_assigned_count: number;
  numbers: TelephonyNumberView[];
  message: string;
}

export interface TelephonyTenantPolicyView {
  tenant_id: string;
  mode: TelephonyTenantPolicyMode;
  allows_deployment_default: boolean;
  allows_tenant_byo: boolean;
  usable_provider_account_source: TelephonyUsableProviderAccountSource;
  deployment_provider_account_count: number;
  tenant_provider_account_count: number;
  updated_at: string;
}

export function listAdminTelephonyProviderOptions(): Promise<TelephonyProviderPackMetadata[]> {
  return platformApiRequest<TelephonyProviderPackMetadata[]>("/admin/telephony/provider-options", {
    method: "GET",
  });
}

export function listAdminTelephonyProviderAccounts(includeArchived = false): Promise<TelephonyProviderAccountView[]> {
  const params = new URLSearchParams();
  if (includeArchived) {
    params.set("include_archived", "true");
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return platformApiRequest<TelephonyProviderAccountView[]>(`/admin/telephony/provider-accounts${suffix}`, {
    method: "GET",
  });
}

export function createAdminTelephonyProviderAccount(
  payload: TelephonyProviderAccountCreateRequest,
): Promise<TelephonyProviderAccountView> {
  return platformApiRequest<TelephonyProviderAccountView>("/admin/telephony/provider-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTelephonyProviderAccount(
  providerAccountId: string,
  payload: TelephonyProviderAccountUpdateRequest,
): Promise<TelephonyProviderAccountView> {
  return platformApiRequest<TelephonyProviderAccountView>(
    `/admin/telephony/provider-accounts/${encodeURIComponent(providerAccountId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function testAdminTelephonyProviderAccount(
  providerAccountId: string,
): Promise<TelephonyProviderAccountTestResult> {
  return platformApiRequest<TelephonyProviderAccountTestResult>(
    `/admin/telephony/provider-accounts/${encodeURIComponent(providerAccountId)}/test`,
    { method: "POST" },
  );
}

export function deleteAdminTelephonyProviderAccount(providerAccountId: string): Promise<void> {
  return platformApiRequest<void>(`/admin/telephony/provider-accounts/${encodeURIComponent(providerAccountId)}`, {
    method: "DELETE",
  });
}

export function listAdminTelephonyTrunks(
  options: { providerAccountId?: string } = {},
): Promise<TelephonyTrunkView[]> {
  const params = new URLSearchParams();
  if (options.providerAccountId) {
    params.set("provider_account_id", options.providerAccountId);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return platformApiRequest<TelephonyTrunkView[]>(`/admin/telephony/trunks${suffix}`, {
    method: "GET",
  });
}

export function syncAdminTelephonyTrunks(providerAccountId: string): Promise<TelephonyTrunkSyncResult> {
  return platformApiRequest<TelephonyTrunkSyncResult>(
    `/admin/telephony/provider-accounts/${encodeURIComponent(providerAccountId)}/trunks/sync`,
    { method: "POST" },
  );
}

export function listAdminTelephonyNumbers(
  options: { providerAccountId?: string; includeReleased?: boolean } = {},
): Promise<TelephonyNumberView[]> {
  const params = new URLSearchParams();
  if (options.providerAccountId) {
    params.set("provider_account_id", options.providerAccountId);
  }
  if (options.includeReleased) {
    params.set("include_released", "true");
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return platformApiRequest<TelephonyNumberView[]>(`/admin/telephony/numbers${suffix}`, {
    method: "GET",
  });
}

export function syncAdminTelephonyNumbers(providerAccountId: string): Promise<TelephonyNumberSyncResult> {
  return platformApiRequest<TelephonyNumberSyncResult>(
    `/admin/telephony/provider-accounts/${encodeURIComponent(providerAccountId)}/numbers/sync`,
    { method: "POST" },
  );
}

export function getAdminTenantTelephonyPolicy(tenantId: string): Promise<TelephonyTenantPolicyView> {
  return platformApiRequest<TelephonyTenantPolicyView>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/telephony/policy`,
    { method: "GET" },
  );
}
