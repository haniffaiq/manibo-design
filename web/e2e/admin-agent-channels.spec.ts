import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function mockPlatformDefaultsRoute(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/admin/platform-defaults", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          version: "clinic_default_v1",
          config_yaml_hash: "cfg-hash-1",
          created_by: "11111111-1111-1111-1111-111111111111",
          created_at: "2026-03-28T00:00:00Z",
        },
      ]),
    });
  });
}

test.describe("assistant channels panel", () => {
  test("super admin sees the channel summary and attaches an existing deployment number", async ({ page }) => {
    const tenantId = "tenant-1";
    const definitionId = "def-1";

    await primeSessionCookie(page, "super_admin");
    await mockPlatformDefaultsRoute(page);

    // Mock agent definition
    await page.route(`**/api/platform/admin/tenants/${tenantId}/agent-definitions/${definitionId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: definitionId,
          tenant_id: tenantId,
          name: "clinic_registrator",
          status: "published",
          published_version: 1,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-28T00:00:00Z",
        }),
      });
    });

    // Mock versions
    await page.route(`**/api/platform/admin/tenants/${tenantId}/agent-definitions/${definitionId}/versions`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock starters
    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    // Mock solutions
    await page.route(`**/api/platform/admin/tenants/${tenantId}/solutions`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    const attachedNumber: Record<string, unknown> = {
      id: "number-current",
      provider_account_id: "provider-1",
      trunk_id: "trunk-1",
      e164_number: "+37060000001",
      provider_number_id: "telnyx-number-1",
      status: "assigned",
      source: "imported",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: null,
      binding_summary: {
        id: "binding-current",
        tenant_id: tenantId,
        tenant_name: "Clinic One",
        tenant_slug: "clinic-one",
        sip_trunk_id: "lk-trunk-1",
        active: true,
        agent_definition_id: definitionId,
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: true,
        created_at: "2026-03-28T10:00:00Z",
      },
      created_at: "2026-03-28T10:00:00Z",
      updated_at: "2026-03-28T10:00:00Z",
    };
    const unassignedNumber: Record<string, unknown> = {
      id: "number-unassigned",
      provider_account_id: "provider-1",
      trunk_id: "trunk-1",
      e164_number: "+37060000002",
      provider_number_id: "telnyx-number-2",
      status: "assigned",
      source: "purchased",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: null,
      binding_summary: null,
      created_at: "2026-03-28T08:00:00Z",
      updated_at: "2026-03-28T08:00:00Z",
    };
    const telephonyNumbers = [attachedNumber, unassignedNumber];
    const tenantPhoneNumbers = [
      {
        id: "binding-current",
        tenant_id: tenantId,
        phone_number: "+37060000001",
        sip_trunk_id: "lk-trunk-1",
        active: true,
        agent_definition_id: definitionId,
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: true,
        created_at: "2026-03-28T10:00:00Z",
      },
    ];

    await page.route("**/api/platform/admin/telephony/numbers**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(telephonyNumbers),
      });
    });

    await page.route("**/api/platform/admin/telephony/trunks**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "trunk-1",
            provider_account_id: "provider-1",
            display_name: "Inbound route",
            direction: "inbound",
            transport_kind: "sip",
            provider_resource_id: "resource-1",
            livekit_binding_id: "lk-trunk-1",
            status: "active",
            config: {},
            control_plane: null,
            created_at: "2026-03-28T08:00:00Z",
            updated_at: "2026-03-28T08:00:00Z",
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/telephony/provider-accounts**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "provider-1",
            owner_scope: "deployment",
            owner_tenant_id: null,
            provider_kind: "telnyx",
            display_name: "Primary Telnyx",
            status: "connected",
            capability_snapshot: ["telephony.sync_numbers", "telephony.assign_published_assistant"],
            provider_metadata: {},
            control_plane: null,
            credential_configured: true,
            created_at: "2026-03-28T08:00:00Z",
            updated_at: "2026-03-28T08:00:00Z",
          },
        ]),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/telephony/policy`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: tenantId,
          mode: "default_with_byo_override",
          allows_deployment_default: true,
          allows_tenant_byo: true,
          usable_provider_account_source: "deployment_default",
          deployment_provider_account_count: 1,
          tenant_provider_account_count: 0,
          updated_at: "2026-03-28T08:00:00Z",
        }),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ phone_numbers: tenantPhoneNumbers }),
        });
        return;
      }
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const payload = JSON.parse(route.request().postData() ?? "{}");
      unassignedNumber.binding_summary = {
        id: "binding-created",
        tenant_id: tenantId,
        tenant_name: "Clinic One",
        tenant_slug: "clinic-one",
        sip_trunk_id: payload.sip_trunk_id,
        active: payload.active,
        agent_definition_id: payload.agent_definition_id,
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: payload.active,
        created_at: "2026-03-28T11:00:00Z",
      };
      tenantPhoneNumbers.push({
        id: "binding-created",
        tenant_id: tenantId,
        phone_number: payload.phone_number,
        sip_trunk_id: payload.sip_trunk_id,
        active: payload.active,
        agent_definition_id: payload.agent_definition_id,
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: payload.active,
        created_at: "2026-03-28T11:00:00Z",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "binding-created",
          tenant_id: tenantId,
          phone_number: payload.phone_number,
          sip_trunk_id: payload.sip_trunk_id,
          active: payload.active,
          agent_definition_id: payload.agent_definition_id,
          agent_name: "clinic_registrator",
          agent_status: "published",
          published_version: 1,
          routing_ready: payload.active,
          created_at: "2026-03-28T11:00:00Z",
        }),
      });
    });

    // Navigate to assistant detail page
    await page.goto(`/admin/agent-definitions/${definitionId}?tenant_id=${tenantId}`);

    // Verify the assistant detail page shows attached channels and keeps the attach flow on this screen.
    await expect(page.getByRole("heading", { name: "Attached channels", level: 3 })).toBeVisible();
    const attachedChannelsTable = page.getByRole("table").last();
    await expect(attachedChannelsTable.getByText("+37060000001")).toBeVisible();
    await expect(attachedChannelsTable.getByText("+37060000002")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Attach existing number" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Telephony" })).toHaveAttribute(
      "href",
      `/admin/telephony?tab=numbers&tenant_id=${tenantId}&assistant_id=${definitionId}#numbers`,
    );

    await page.getByRole("button", { name: "Attach existing number" }).click();
    await expect(page.getByTestId("admin-telephony-number-picker")).toBeVisible();
    await page.getByTestId("admin-telephony-number-picker-option-number-unassigned").click();
    await page.getByRole("button", { name: "Attach number" }).click();

    await expect(page.getByText("Attached +37060000002.")).toBeVisible();
    await expect(attachedChannelsTable.getByText("+37060000002")).toBeVisible();
  });
});
