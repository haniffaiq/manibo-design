import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

type ConnectorType = "crm" | "scheduling" | "notifications";
type ConnectorStatus = "active" | "disabled";

type ConnectorRecord = {
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
  latest_health: {
    id: string;
    connector_id: string;
    checked_at: string;
    status: string;
    error_code: string | null;
    error_message: string | null;
    details: Record<string, unknown>;
    latency_ms: number | null;
  } | null;
};

type ConnectorCatalogType = {
  connector_type: ConnectorType;
  adapters: {
    adapter_name: string;
    title: string;
    description: string;
    config_schema: Record<string, unknown>;
    ui_hints: {
      secret_fields: string[];
      documentation_url: string | null;
      setup_summary: string | null;
      supports_health_check: boolean;
      supports_http_invoke: boolean;
    };
    source_kind: string;
  }[];
};


test.describe("tenant integrations", () => {
  test("client admin can manage integrations", async ({ page }) => {
    const tenantId = "22222222-2222-2222-2222-222222222222";
    const now = "2026-03-06T10:00:00Z";
    const connectors: ConnectorRecord[] = [
      {
        id: "conn-1",
        tenant_id: tenantId,
        connector_type: "crm",
        adapter_name: "clinic_webhook",
        adapter_source_kind: "entry_point",
        adapter_internal_only: false,
        display_name: "Clinic webhook CRM",
        status: "active",
        config: {
          endpoint_url: "https://api.crm.example/clinic-webhook",
          healthcheck_url: "https://api.crm.example/clinic-webhook/health",
          bearer_token: "env://CLINIC_WEBHOOK_TOKEN",
          timeout_seconds: 10,
        },
        created_by: "user-admin",
        created_at: now,
        updated_at: now,
        latest_health: null,
      },
      {
        id: "conn-2",
        tenant_id: tenantId,
        connector_type: "notifications",
        adapter_name: "telnyx_sms",
        adapter_source_kind: "entry_point",
        adapter_internal_only: false,
        display_name: "Patient SMS",
        status: "disabled",
        config: {
          api_key: "env://TELNYX_API_KEY",
          from_number: "+37060000000",
          api_base_url: "https://api.telnyx.com/v2",
          timeout_seconds: 10,
        },
        created_by: "user-admin",
        created_at: now,
        updated_at: now,
        latest_health: {
          id: "health-2",
          connector_id: "conn-2",
          checked_at: now,
          status: "unhealthy",
          error_code: "disabled",
          error_message: "Connector is disabled.",
          details: {},
          latency_ms: 500,
        },
      },
      {
        id: "conn-3",
        tenant_id: tenantId,
        connector_type: "crm",
        adapter_name: "generic_http_invoke",
        adapter_source_kind: "legacy_generic_http",
        adapter_internal_only: false,
        display_name: "Generic clinic fallback",
        status: "disabled",
        config: {
          endpoint: "https://api.example.test",
          invoke_allowlist: ["/"],
          invoke_methods: ["GET"],
        },
        created_by: "user-admin",
        created_at: now,
        updated_at: now,
        latest_health: null,
      },
      {
        id: "conn-4",
        tenant_id: tenantId,
        connector_type: "scheduling",
        adapter_name: "shadow_internal_scheduler",
        adapter_source_kind: "builtin",
        adapter_internal_only: true,
        display_name: "Shadow scheduler bridge",
        status: "disabled",
        config: {},
        created_by: "user-admin",
        created_at: now,
        updated_at: now,
        latest_health: null,
      },
      {
        id: "conn-5",
        tenant_id: tenantId,
        connector_type: "crm",
        adapter_name: "partner_webhook_bridge",
        adapter_source_kind: "entry_point",
        adapter_internal_only: false,
        display_name: "Dormant partner CRM",
        status: "disabled",
        config: {
          endpoint_url: "https://api.crm.example/partner-bridge",
          healthcheck_url: "https://api.crm.example/partner-bridge/health",
          bearer_token: "env://PARTNER_WEBHOOK_TOKEN",
          timeout_seconds: 10,
        },
        created_by: "user-admin",
        created_at: now,
        updated_at: now,
        latest_health: null,
      },
    ];
    const connectorCatalog: ConnectorCatalogType[] = [
      {
        connector_type: "crm",
        adapters: [
          {
            adapter_name: "clinic_webhook",
            title: "Clinic webhook CRM",
            description: "Delivers clinic booking records to a tenant-managed webhook endpoint.",
            config_schema: {
              type: "object",
              properties: {
                endpoint_url: { type: "string" },
                healthcheck_url: { type: "string" },
                bearer_token: { type: "string" },
                timeout_seconds: { type: "number" },
              },
            },
            ui_hints: {
              secret_fields: ["bearer_token"],
              documentation_url: null,
              setup_summary: "Provide webhook URLs plus a SecretRef bearer token when the clinic endpoint requires auth.",
              supports_health_check: true,
              supports_http_invoke: false,
            },
            source_kind: "entry_point",
          },
        ],
      },
      {
        connector_type: "scheduling",
        adapters: [],
      },
      {
        connector_type: "notifications",
        adapters: [
          {
            adapter_name: "telnyx_sms",
            title: "Telnyx SMS",
            description: "Sends outbound SMS notifications through the Telnyx messaging API.",
            config_schema: {
              type: "object",
              properties: {
                api_key: { type: "string" },
                from_number: { type: "string" },
                api_base_url: { type: "string" },
                timeout_seconds: { type: "number" },
              },
            },
            ui_hints: {
              secret_fields: ["api_key"],
              documentation_url: null,
              setup_summary: "Requires a SecretRef API key plus a validated E.164 sender number.",
              supports_health_check: true,
              supports_http_invoke: false,
            },
            source_kind: "entry_point",
          },
        ],
      },
    ];

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              description: "Clinic bookings",
              active_revision: "rev-1",
              desired_revision: "rev-1",
              requires_enabled: [],
              optional_enabled: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/connectors**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname.endsWith("/api/platform/connectors/catalog")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(connectorCatalog),
        });
        return;
      }

      if (request.method() === "GET" && url.pathname.endsWith("/api/platform/connectors")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(connectors),
        });
        return;
      }

      if (request.method() === "POST" && url.pathname.endsWith("/api/platform/connectors")) {
        const body = request.postDataJSON() as {
          connector_type: ConnectorType;
          adapter_name: string;
          display_name: string;
          status: ConnectorStatus;
          config: Record<string, unknown>;
        };
        const created: ConnectorRecord = {
          id: "conn-6",
          tenant_id: tenantId,
          connector_type: body.connector_type,
          adapter_name: body.adapter_name,
          adapter_source_kind: "entry_point",
          adapter_internal_only: false,
          display_name: body.display_name,
          status: body.status,
          config: body.config,
          created_by: "user-admin",
          created_at: now,
          updated_at: now,
          latest_health: null,
        };
        connectors.push(created);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ connector_id: created.id }),
        });
        return;
      }

      await route.fallback();
    });

    await page.route("**/api/platform/connectors/*/health-check?**", async (route) => {
      const connectorId = route.request().url().match(/\/api\/platform\/connectors\/([^/]+)\/health-check/)?.[1];
      const connector = connectors.find((item) => item.id === connectorId);
      if (!connector) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Not found" }) });
        return;
      }
      connector.latest_health =
        connector.id === "conn-2"
          ? {
              id: `health-${connector.id}`,
              connector_id: connector.id,
              checked_at: now,
              status: "unhealthy",
              error_code: "missing_credentials",
              error_message: "Messaging credentials need attention.",
              details: {},
              latency_ms: 210,
            }
          : {
              id: `health-${connector.id}`,
              connector_id: connector.id,
              checked_at: now,
              status: "healthy",
              error_code: null,
              error_message: null,
              details: {},
              latency_ms: 210,
            };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connector_id: connector.id, latest_health: connector.latest_health }),
      });
    });

    await page.route("**/api/platform/connectors/*", async (route) => {
      const request = route.request();
      if (request.method() !== "PATCH") {
        await route.fallback();
        return;
      }

      const connectorId = request.url().match(/\/api\/platform\/connectors\/([^/?]+)/)?.[1];
      const connector = connectors.find((item) => item.id === connectorId);
      if (!connector) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Not found" }) });
        return;
      }
      const body = request.postDataJSON() as {
        display_name?: string;
        status?: ConnectorStatus;
        config?: Record<string, unknown>;
      };
      if (body.display_name) {
        connector.display_name = body.display_name;
      }
      if (body.status) {
        connector.status = body.status;
      }
      if (body.config) {
        connector.config = body.config;
      }
      connector.updated_at = now;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(connector),
      });
    });

    await page.goto("/integrations");

    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    if (isBuildEnabledSolution("appointment_booking")) {
      await expect(page.getByTestId("integrations-clinic-ops-map")).toContainText("Clinic booking connectors");
      await expect(page.getByTestId("integrations-open-clinic-bookings")).toHaveAttribute(
        "href",
        "/bookings#clinic-booking-readiness",
      );
    } else {
      await expect(page.getByTestId("integrations-clinic-ops-map")).toHaveCount(0);
      await expect(page.getByTestId("integrations-open-clinic-bookings")).toHaveCount(0);
    }
    await expect(page.getByTestId("integrations-summary-active")).toContainText("1");
    await expect(page.getByTestId("integrations-summary-attention")).toContainText("1");
    await expect(page.getByTestId("integrations-name-conn-1")).toContainText("Clinic webhook CRM");
    await expect(page.getByTestId("integrations-status-conn-1")).toContainText("Needs check");
    await expect(page.getByTestId("integrations-health-conn-3")).toBeDisabled();

    await page.getByTestId("integrations-health-conn-1").click();
    await expect(page.getByTestId("integrations-action-notice")).toContainText("Health check passed.");
    await expect(page.getByTestId("integrations-status-conn-1")).toContainText("Ready");

    await page.getByTestId("integrations-edit-conn-2").click();
    await expect(page.getByTestId("integrations-form-name")).toHaveValue("Patient SMS");
    await page.getByTestId("integrations-form-name").fill("Reminder SMS");
    await page.getByTestId("integrations-form-status").selectOption("active");
    await page.getByTestId("integrations-form-submit").click();
    await expect(page.getByTestId("integrations-action-notice")).toContainText("Updated Reminder SMS.");
    await expect(page.getByTestId("integrations-name-conn-2")).toContainText("Reminder SMS");

    await page.getByTestId("integrations-health-conn-2").click();
    await expect(page.getByTestId("integrations-action-notice")).toContainText(
      "Health check finished, but this connection still needs attention: Messaging credentials need attention.",
    );
    await expect(page.getByTestId("integrations-status-conn-2")).toContainText("Needs attention");

    await page.getByTestId("integrations-edit-conn-3").click();
    await expect(page.getByTestId("integrations-legacy-adapter-warning")).toContainText(
      "legacy compatibility or undeclared adapter",
    );

    await page.getByTestId("integrations-edit-conn-4").click();
    await expect(page.getByTestId("integrations-internal-adapter-warning")).toContainText(
      "internal-only adapter",
    );
    await expect(page.getByTestId("integrations-form-config")).toBeDisabled();
    await page.getByRole("button", { name: "Cancel edit" }).click();

    await page.getByTestId("integrations-edit-conn-5").click();
    await expect(page.getByTestId("integrations-solution-disabled-adapter-warning")).toContainText(
      "solution that is currently disabled",
    );
    await expect(page.getByTestId("integrations-form-config")).toBeDisabled();
    await page.getByRole("button", { name: "Cancel edit" }).click();

    await page.getByTestId("integrations-form-type").selectOption("scheduling");
    await expect(page.getByTestId("integrations-form-adapter")).toHaveValue("");
    await expect(page.getByTestId("integrations-form-adapter")).toBeDisabled();
    await expect(page.getByTestId("integrations-form-adapter")).toContainText("No connectors declared");
    await page.getByTestId("integrations-form-name").fill("Blocked Local Scheduler");
    await page.getByTestId("integrations-form-submit").click();
    await expect(page.getByTestId("integrations-action-error")).toContainText("Choose a connector from the catalog.");

    await page.getByTestId("integrations-form-type").selectOption("crm");
    await expect(page.getByTestId("integrations-form-adapter")).toHaveValue("clinic_webhook");
    await expect(page.getByTestId("integrations-adapter-metadata")).toContainText("Clinic webhook CRM");
    await expect(page.getByTestId("integrations-form-config")).toContainText("\"endpoint_url\"");
    await page.getByTestId("integrations-form-name").fill("Clinic Booking CRM");
    await page.getByTestId("integrations-form-submit").click();
    await expect(page.getByTestId("integrations-action-notice")).toContainText("Added Clinic Booking CRM.");
    await expect(page.getByTestId("integrations-name-conn-6")).toContainText("Clinic Booking CRM");
  });

  test("client operator sees admin-only message", async ({ page }) => {
    await primeSessionCookie(page, "client_operator");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ solutions: [] }),
      });
    });

    await page.route("**/api/platform/connectors**", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Requires client_admin role" }),
      });
    });

    await page.goto("/integrations");

    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    await expect(page.getByTestId("integrations-forbidden")).toContainText("Only workspace admins can manage integrations.");
  });
});
