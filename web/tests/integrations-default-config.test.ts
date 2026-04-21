import { describe, expect, it } from "vitest";

import { buildDefaultConfigForAdapter } from "@/lib/connectors/default-config";

describe("connector default config", () => {
  it("keeps the clinic webhook adapter shape", () => {
    expect(JSON.parse(buildDefaultConfigForAdapter("crm", "clinic_webhook"))).toEqual({
      endpoint_url: "https://api.example.com/clinic-webhook",
      healthcheck_url: "https://api.example.com/clinic-webhook/health",
      bearer_token: "env://CLINIC_WEBHOOK_TOKEN",
      timeout_seconds: 10,
    });
  });

  it("uses a neutral notifications sender placeholder", () => {
    expect(JSON.parse(buildDefaultConfigForAdapter("notifications", null))).toEqual({
      from: "Example Sender",
      credentials: { token: "env://NOTIFICATIONS_TOKEN" },
    });
  });
});
