import { platformApiRequest } from "@/lib/api/platform";
import type { TenantUiLocale } from "@/lib/api/tenant-settings";

export type TenantStatus = "active" | "suspended" | "offboarded";
export type MutableTenantStatus = "active" | "suspended";
export type TenantEnvironment = "production" | "demo" | "test" | "e2e";

export interface AdminTenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  environment: TenantEnvironment;
  ui_locale: TenantUiLocale;
  created_at: string;
  updated_at: string;
}

export interface ListAdminTenantsOptions {
  include_non_production?: boolean;
}

export interface UpdateTenantStatusResponse {
  tenant_id: string;
  status: TenantStatus;
  updated_at: string;
}

export interface UpdateTenantLocaleResponse {
  tenant_id: string;
  ui_locale: TenantUiLocale;
  updated_at: string;
}

export interface OnboardTenantRequest {
  tenant_slug: string;
  tenant_name: string;
  admin_email: string;
  admin_display_name?: string;
  admin_subject?: string;
  enable_solutions?: string[];
  oidc_provider?: OidcProviderProvisioningSpec;
  wait_for_provisioning?: boolean;
  force_reprovision_if_active?: boolean;
}

export interface OnboardTenantResponse {
  tenant_id: string;
  tenant_schema: string;
  admin_user_id: string;
  provisioning_started: boolean;
  provision_workflow_id: string | null;
}

export interface OffboardTenantRequest {
  grace_period_days?: number;
  wait_for_completion?: boolean;
}

export interface OidcProviderProvisioningSpec {
  issuer: string;
  jwks_uri: string;
  audience: string;
}

export interface OffboardTenantResponse {
  tenant_id: string;
  status: TenantStatus;
  offboard_workflow_id: string;
  started: boolean;
}

export interface TenantDataExportResponse {
  tenant_id: string;
  tenant_slug: string;
  exported_at: string;
  format: string;
  row_limit: number;
  public_data: Record<string, Array<Record<string, unknown>>>;
  grove_data: Record<string, Array<Record<string, unknown>>>;
  tenant_data: Record<string, Array<Record<string, unknown>>>;
}

export function listAdminTenants(
  limit = 100,
  offset = 0,
  options: ListAdminTenantsOptions = {},
): Promise<AdminTenantSummary[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (options.include_non_production) {
    params.set("include_non_production", "true");
  }
  return platformApiRequest<AdminTenantSummary[]>(`/admin/tenants?${params.toString()}`, { method: "GET" });
}

export function updateAdminTenantStatus(
  tenantId: string,
  status: MutableTenantStatus,
): Promise<UpdateTenantStatusResponse> {
  return platformApiRequest<UpdateTenantStatusResponse>(`/admin/tenants/${encodeURIComponent(tenantId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateAdminTenantLocale(
  tenantId: string,
  uiLocale: TenantUiLocale,
): Promise<UpdateTenantLocaleResponse> {
  return platformApiRequest<UpdateTenantLocaleResponse>(`/admin/tenants/${encodeURIComponent(tenantId)}/locale`, {
    method: "PATCH",
    body: JSON.stringify({ ui_locale: uiLocale }),
  });
}

export function onboardAdminTenant(payload: OnboardTenantRequest): Promise<OnboardTenantResponse> {
  return platformApiRequest<OnboardTenantResponse>("/admin/tenants/onboard", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function offboardAdminTenant(
  tenantId: string,
  payload: OffboardTenantRequest,
): Promise<OffboardTenantResponse> {
  return platformApiRequest<OffboardTenantResponse>(`/admin/tenants/${encodeURIComponent(tenantId)}/offboard`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function exportAdminTenant(tenantId: string, rowLimit = 100): Promise<TenantDataExportResponse> {
  const params = new URLSearchParams({
    row_limit: String(rowLimit),
  });
  return platformApiRequest<TenantDataExportResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/export?${params.toString()}`,
    { method: "GET" },
  );
}
