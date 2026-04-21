import { platformApiRequest } from "@/lib/api/platform";

export type ConnectorType = "crm" | "scheduling" | "notifications";
export type ConnectorStatus = "active" | "disabled";

export interface ConnectorHealthResponse {
  id: string;
  connector_id: string;
  checked_at: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  details: Record<string, unknown>;
  latency_ms: number | null;
}

export interface ConnectorCatalogUiHints {
  secret_fields: string[];
  documentation_url: string | null;
  setup_summary: string | null;
  supports_health_check: boolean;
  supports_http_invoke: boolean;
}

export interface ConnectorCatalogAdapter {
  adapter_name: string;
  title: string;
  description: string;
  config_schema: Record<string, unknown>;
  ui_hints: ConnectorCatalogUiHints;
  source_kind: string;
}

export interface ConnectorCatalogType {
  connector_type: ConnectorType;
  adapters: ConnectorCatalogAdapter[];
}

export interface ConnectorResponse {
  id: string;
  tenant_id: string;
  connector_type: ConnectorType;
  adapter_name: string;
  adapter_source_kind: string | null;
  adapter_internal_only: boolean;
  display_name: string;
  status: ConnectorStatus;
  config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  latest_health: ConnectorHealthResponse | null;
}

export interface CreateConnectorInput {
  connector_type: ConnectorType;
  adapter_name: string;
  display_name: string;
  status: ConnectorStatus;
  config: Record<string, unknown>;
}

export interface UpdateConnectorInput {
  display_name?: string;
  status?: ConnectorStatus;
  config?: Record<string, unknown>;
}

interface CreateConnectorResponse {
  connector_id: string;
}

interface HealthCheckResponse {
  connector_id: string;
  latest_health: ConnectorHealthResponse | null;
}

export function listConnectors(): Promise<ConnectorResponse[]> {
  return platformApiRequest<ConnectorResponse[]>("/connectors", {
    method: "GET",
  });
}

export function listConnectorCatalog(): Promise<ConnectorCatalogType[]> {
  return platformApiRequest<ConnectorCatalogType[]>("/connectors/catalog", {
    method: "GET",
  });
}

export function createConnector(input: CreateConnectorInput): Promise<CreateConnectorResponse> {
  return platformApiRequest<CreateConnectorResponse>("/connectors", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConnector(connectorId: string, input: UpdateConnectorInput): Promise<ConnectorResponse> {
  return platformApiRequest<ConnectorResponse>(`/connectors/${encodeURIComponent(connectorId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function runConnectorHealthCheck(connectorId: string, wait = true): Promise<HealthCheckResponse> {
  return platformApiRequest<HealthCheckResponse>(
    `/connectors/${encodeURIComponent(connectorId)}/health-check?wait=${wait ? "true" : "false"}`,
    {
      method: "POST",
    },
  );
}
