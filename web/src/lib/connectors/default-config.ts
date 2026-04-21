import type { ConnectorType } from "@/lib/api/connectors";

export function serializeConfig(config: Record<string, unknown>): string {
  return JSON.stringify(config, null, 2);
}

export function buildDefaultConfigForAdapter(type: ConnectorType, adapterName: string | null): string {
  switch (adapterName) {
    case "clinic_webhook":
      return serializeConfig({
        endpoint_url: "https://api.example.com/clinic-webhook",
        healthcheck_url: "https://api.example.com/clinic-webhook/health",
        bearer_token: "env://CLINIC_WEBHOOK_TOKEN",
        timeout_seconds: 10,
      });
    case "lead_capture_webhook":
      return serializeConfig({
        endpoint_url: "https://api.example.com/lead-capture",
        healthcheck_url: "https://api.example.com/lead-capture/health",
        bearer_token: "env://LEAD_CAPTURE_TOKEN",
        timeout_seconds: 10,
      });
    case "telnyx_sms":
      return serializeConfig({
        api_key: "env://TELNYX_API_KEY",
        from_number: "+37060000000",
        api_base_url: "https://api.telnyx.com/v2",
        timeout_seconds: 10,
      });
    default:
      break;
  }

  switch (type) {
    case "crm":
      return serializeConfig({
        endpoint: "https://api.example.com",
        credentials: { token: "env://CRM_TOKEN" },
      });
    case "scheduling":
      return serializeConfig({
        endpoint: "https://calendar.example.com",
        credentials: { token: "env://SCHEDULING_TOKEN" },
      });
    case "notifications":
      return serializeConfig({
        from: "Example Sender",
        credentials: { token: "env://NOTIFICATIONS_TOKEN" },
      });
  }
}
