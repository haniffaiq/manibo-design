import { platformApiRequest } from "@/lib/api/platform";

export interface AdminPhoneChannelRecord {
  id: string;
  tenant_id: string;
  phone_number: string;
  sip_trunk_id: string;
  active: boolean;
  agent_definition_id: string | null;
  agent_name: string | null;
  agent_status: string | null;
  published_version: number | null;
  routing_ready: boolean;
  created_at: string;
}

interface RawAdminPhoneChannelsResponse {
  phone_channels?: AdminPhoneChannelRecord[];
}

export interface AdminPhoneChannelsResponse {
  phone_channels: AdminPhoneChannelRecord[];
}

export interface CreateAdminPhoneChannelRequest {
  phone_number: string;
  sip_trunk_id: string;
  agent_definition_id: string;
  active: boolean;
}

export interface UpdateAdminPhoneChannelRequest {
  phone_number?: string;
  sip_trunk_id?: string;
  agent_definition_id?: string;
  active?: boolean;
}

export async function listAdminTenantPhoneChannels(
  tenantId: string,
  agentDefinitionId?: string,
): Promise<AdminPhoneChannelsResponse> {
  const params = agentDefinitionId ? `?agent_definition_id=${encodeURIComponent(agentDefinitionId)}` : "";
  const response = await platformApiRequest<RawAdminPhoneChannelsResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/phone-channels${params}`,
    { method: "GET" },
  );
  return {
    phone_channels: response.phone_channels ?? [],
  };
}

export function createAdminTenantPhoneChannel(
  tenantId: string,
  payload: CreateAdminPhoneChannelRequest,
): Promise<AdminPhoneChannelRecord> {
  return platformApiRequest<AdminPhoneChannelRecord>(`/admin/tenants/${encodeURIComponent(tenantId)}/phone-channels`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTenantPhoneChannel(
  tenantId: string,
  phoneChannelId: string,
  payload: UpdateAdminPhoneChannelRequest,
): Promise<AdminPhoneChannelRecord> {
  return platformApiRequest<AdminPhoneChannelRecord>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/phone-channels/${encodeURIComponent(phoneChannelId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminTenantPhoneChannel(tenantId: string, phoneChannelId: string): Promise<void> {
  return platformApiRequest<void>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/phone-channels/${encodeURIComponent(phoneChannelId)}`,
    { method: "DELETE" },
  );
}

export type AdminPhoneNumberRoutingRecord = AdminPhoneChannelRecord;
export type CreateAdminPhoneNumberRoutingRequest = CreateAdminPhoneChannelRequest;
export type UpdateAdminPhoneNumberRoutingRequest = UpdateAdminPhoneChannelRequest;

export async function listAdminTenantPhoneNumbers(
  tenantId: string,
  agentDefinitionId?: string,
): Promise<{ phone_numbers: AdminPhoneNumberRoutingRecord[] }> {
  const response = await listAdminTenantPhoneChannels(tenantId, agentDefinitionId);
  return { phone_numbers: response.phone_channels };
}

export const createAdminTenantPhoneNumber = createAdminTenantPhoneChannel;
export const updateAdminTenantPhoneNumber = updateAdminTenantPhoneChannel;
export const deleteAdminTenantPhoneNumber = deleteAdminTenantPhoneChannel;
