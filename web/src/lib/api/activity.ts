import { platformApiRequest } from "@/lib/api/platform";

export interface TenantAuditEvent {
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

interface TenantAuditEventsResponse {
  events: TenantAuditEvent[];
}

export interface TenantAuditEventsQuery {
  action?: string;
  resource_type?: string;
  resource_id?: string;
  since?: string;
  until?: string;
  limit?: number;
}

export async function listTenantAuditEvents(query: TenantAuditEventsQuery = {}): Promise<TenantAuditEvent[]> {
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
  const response = await platformApiRequest<TenantAuditEventsResponse>(`/audit/events${suffix ? `?${suffix}` : ""}`, {
    method: "GET",
  });
  return response.events;
}
