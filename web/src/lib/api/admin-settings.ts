import { platformApiRequest } from "@/lib/api/platform";

export interface OidcProviderSummary {
  id: string;
  issuer: string;
  jwks_uri: string;
  audience: string;
  tenant_id: string | null;
  created_at: string;
}

export interface UpsertOidcProviderRequest {
  issuer: string;
  jwks_uri: string;
  audience: string;
  tenant_id?: string | null;
}

export interface PlatformDefaultsSummary {
  version: string;
  config_yaml_hash: string;
  created_by: string;
  created_at: string;
}

export interface PlatformDefaultsDetail {
  version: string;
  config_yaml: string;
  config_yaml_hash: string;
}

export interface CreatePlatformDefaultsRequest {
  version: string;
  config_yaml: string;
}

export interface CreatePlatformDefaultsResponse {
  version: string;
  config_yaml_hash: string;
}

export function listOidcProviders(): Promise<OidcProviderSummary[]> {
  return platformApiRequest<OidcProviderSummary[]>("/admin/oidc-providers", { method: "GET" });
}

export function createOidcProvider(payload: UpsertOidcProviderRequest): Promise<OidcProviderSummary> {
  return platformApiRequest<OidcProviderSummary>("/admin/oidc-providers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOidcProvider(providerId: string, payload: UpsertOidcProviderRequest): Promise<OidcProviderSummary> {
  return platformApiRequest<OidcProviderSummary>(`/admin/oidc-providers/${encodeURIComponent(providerId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteOidcProvider(providerId: string): Promise<void> {
  return platformApiRequest<void>(`/admin/oidc-providers/${encodeURIComponent(providerId)}`, {
    method: "DELETE",
  });
}

export function listPlatformDefaults(): Promise<PlatformDefaultsSummary[]> {
  return platformApiRequest<PlatformDefaultsSummary[]>("/admin/platform-defaults", { method: "GET" });
}

export function getPlatformDefaultsVersion(version: string): Promise<PlatformDefaultsDetail> {
  return platformApiRequest<PlatformDefaultsDetail>(`/admin/platform-defaults/${encodeURIComponent(version)}`, {
    method: "GET",
  });
}

export function createPlatformDefaults(
  payload: CreatePlatformDefaultsRequest,
): Promise<CreatePlatformDefaultsResponse> {
  return platformApiRequest<CreatePlatformDefaultsResponse>("/admin/platform-defaults", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
