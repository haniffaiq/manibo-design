import { platformApiRequest } from "@/lib/api/platform";

export interface AdminAuditEvent {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  outcome: string | null;
  created_at: string;
}

interface AdminAuditEventsResponse {
  events: AdminAuditEvent[];
}

export interface AdminAuditEventsQuery {
  action?: string;
  resource_type?: string;
  resource_id?: string;
  since?: string;
  until?: string;
  limit?: number;
}

export async function listAdminTenantAuditEvents(
  tenantId: string,
  query: AdminAuditEventsQuery = {},
): Promise<AdminAuditEvent[]> {
  const params = new URLSearchParams();
  if (query.action) {
    params.set("action", query.action);
  }
  if (query.resource_type) {
    params.set("resource_type", query.resource_type);
  }
  if (query.resource_id) {
    params.set("resource_id", query.resource_id);
  }
  if (query.since) {
    params.set("since", query.since);
  }
  if (query.until) {
    params.set("until", query.until);
  }
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }

  const suffix = params.toString();
  const path = `/admin/tenants/${encodeURIComponent(tenantId)}/audit-events${suffix ? `?${suffix}` : ""}`;
  const response = await platformApiRequest<AdminAuditEventsResponse>(path, {
    method: "GET",
  });
  return response.events;
}
