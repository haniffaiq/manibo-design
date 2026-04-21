import { test, expect, selectRadixOption } from "./harness";
import { primeSessionCookie } from "./session-helpers";

test.describe("admin phone numbers", () => {
  test("super admin can filter, route to telephony, and pause routing", async ({ page }) => {
    const tenantId = "tenant-1";
    const agentId = "agent-1";
    let phoneNumbers = [
      {
        id: "pn-1",
        tenant_id: tenantId,
        phone_number: "+37061230001",
        sip_trunk_id: "trunk-clinic-1",
        active: true,
        agent_definition_id: agentId,
        agent_name: "Appointment Intake",
        agent_status: "published",
        published_version: 3,
        routing_ready: true,
        created_at: "2026-03-06T09:00:00Z",
      },
      {
        id: "pn-3",
        tenant_id: tenantId,
        phone_number: "+37061230002",
        sip_trunk_id: "trunk-clinic-2",
        active: true,
        agent_definition_id: agentId,
        agent_name: "Appointment Intake",
        agent_status: "draft",
        published_version: null,
        routing_ready: false,
        created_at: "2026-03-06T09:30:00Z",
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: tenantId,
            name: "North Clinic",
            slug: "north-clinic",
            status: "active",
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
        ]),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/agent-definitions?**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: agentId,
            tenant_id: tenantId,
            name: "Appointment Intake",
            status: "published",
            published_version: 3,
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
        ]),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ phone_channels: phoneNumbers }),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels/pn-1`, async (route) => {
      const payload = JSON.parse(route.request().postData() ?? "{}");
      phoneNumbers = phoneNumbers.map((record) =>
        record.id === "pn-1"
          ? {
              ...record,
              active: payload.active,
              routing_ready: Boolean(payload.active),
            }
          : record,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(phoneNumbers[0]),
      });
    });

    await page.goto("/admin/channels");

    await expect(page.getByRole("heading", { level: 1, name: "Channels" })).toBeVisible();
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toContainText("+37061230001");
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toContainText("Appointment Intake (v3)");
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toContainText("Ready");
    await expect(page.getByTestId("admin-phone-number-row-pn-3")).toContainText("+37061230002");
    await expect(page.getByTestId("admin-phone-number-row-pn-3")).toContainText("Needs attention");

    await page.getByTestId("admin-phone-filter-search").fill("30002");
    await expect(page.getByTestId("admin-phone-number-row-pn-3")).toBeVisible();
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toHaveCount(0);

    await page.getByTestId("admin-phone-filter-search").fill("9999");
    await expect(page.getByText("No matches found.")).toBeVisible();
    await page.getByTestId("admin-phone-filter-search").fill("");
    await expect(page.getByTestId("admin-phone-open-telephony")).toHaveAttribute(
      "href",
      "/admin/telephony?tab=numbers&tenant_id=tenant-1#numbers",
    );

    await page.getByTestId("admin-phone-number-row-pn-1").click();
    await page.getByTestId("admin-phone-toggle-selected").click();
    await expect(page.getByText("+37061230001 is now paused for North Clinic.")).toBeVisible();
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toContainText("Paused");
  });

  test("switching tenants clears stale edit state", async ({ page }) => {
    const tenantA = "tenant-1";
    const tenantB = "tenant-2";
    const tenantNumbers: Record<string, Array<Record<string, unknown>>> = {
      [tenantA]: [
        {
          id: "pn-a-1",
          tenant_id: tenantA,
          phone_number: "+37061230001",
          sip_trunk_id: "trunk-a-1",
          active: true,
          agent_definition_id: "agent-a-1",
          agent_name: "North Clinic Assistant",
          agent_status: "published",
          published_version: 2,
          routing_ready: true,
          created_at: "2026-03-06T09:00:00Z",
        },
      ],
      [tenantB]: [
        {
          id: "pn-b-1",
          tenant_id: tenantB,
          phone_number: "+37061230099",
          sip_trunk_id: "trunk-b-1",
          active: true,
          agent_definition_id: "agent-b-1",
          agent_name: "South Clinic Assistant",
          agent_status: "published",
          published_version: 4,
          routing_ready: true,
          created_at: "2026-03-06T10:00:00Z",
        },
      ],
    };
    const assistantsByTenant: Record<string, Array<Record<string, unknown>>> = {
      [tenantA]: [
        {
          id: "agent-a-1",
          tenant_id: tenantA,
          name: "North Clinic Assistant",
          status: "published",
          published_version: 2,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-06T00:00:00Z",
        },
      ],
      [tenantB]: [
        {
          id: "agent-b-1",
          tenant_id: tenantB,
          name: "South Clinic Assistant",
          status: "published",
          published_version: 4,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-06T00:00:00Z",
        },
      ],
    };
    const requestLog: Array<{ method: string; tenantId: string; recordId: string | null }> = [];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: tenantA,
            name: "North Clinic",
            slug: "north-clinic",
            status: "active",
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
          {
            id: tenantB,
            name: "South Clinic",
            slug: "south-clinic",
            status: "active",
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      const tenantId = route.request().url().match(/\/admin\/tenants\/([^/]+)\/agent-definitions/)?.[1] ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(assistantsByTenant[tenantId] ?? []),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/phone-channels**", async (route) => {
      const request = route.request();
      const match = request.url().match(/\/admin\/tenants\/([^/]+)\/phone-channels(?:\/([^/?]+))?/);
      const tenantId = match?.[1] ?? "";
      const recordId = match?.[2] ?? null;
      requestLog.push({ method: request.method(), tenantId, recordId });

      if (request.method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify((tenantNumbers[tenantId] ?? []).find((record) => record.id === recordId)),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ phone_channels: tenantNumbers[tenantId] ?? [] }),
      });
    });

    await page.goto("/admin/channels");

    await expect(page.getByRole("heading", { level: 1, name: "Channels" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "+37061230001" })).toBeVisible();
    await expect(page.getByText("trunk-a-1")).toBeVisible();
    await expect(page.getByTestId("admin-phone-detail-active-checkbox")).toBeChecked();

    await page.getByTestId("admin-phone-detail-active-checkbox").uncheck();
    await expect(page.getByTestId("admin-phone-detail-active-checkbox")).not.toBeChecked();

    await selectRadixOption(page, "admin-phone-numbers-tenant-select", { value: tenantB });

    await expect(page.getByRole("heading", { name: "+37061230099" })).toBeVisible();
    await expect(page.getByText("trunk-b-1")).toBeVisible();
    await expect(page.getByTestId("admin-phone-detail-active-checkbox")).toBeChecked();
    await expect(page.getByTestId("admin-phone-number-row-pn-b-1")).toContainText("+37061230099");
    await expect(page.getByTestId("admin-phone-open-telephony")).toHaveAttribute(
      "href",
      "/admin/telephony?tab=numbers&tenant_id=tenant-2#numbers",
    );
    expect(requestLog.some((entry) => entry.method === "PATCH" && entry.tenantId === tenantB && entry.recordId === "pn-a-1")).toBeFalsy();
    expect(requestLog.some((entry) => entry.method === "PATCH" && entry.tenantId === tenantA && entry.recordId === "pn-a-1")).toBeFalsy();
  });

  test("editing an unassigned line requires selecting an assistant first", async ({ page }) => {
    const tenantId = "tenant-1";
    const phoneNumbers = [
      {
        id: "pn-1",
        tenant_id: tenantId,
        phone_number: "+37061230001",
        sip_trunk_id: "trunk-clinic-1",
        active: true,
        agent_definition_id: null,
        agent_name: null,
        agent_status: null,
        published_version: null,
        routing_ready: false,
        created_at: "2026-03-06T09:00:00Z",
      },
    ];
    const patchPayloads: Array<Record<string, unknown>> = [];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: tenantId,
            name: "North Clinic",
            slug: "north-clinic",
            status: "active",
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
        ]),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/agent-definitions?**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "agent-1",
            tenant_id: tenantId,
            name: "Appointment Intake",
            status: "published",
            published_version: 3,
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-06T00:00:00Z",
          },
        ]),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ phone_channels: phoneNumbers }),
      });
    });

    await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels/pn-1`, async (route) => {
      const payload = JSON.parse(route.request().postData() ?? "{}");
      patchPayloads.push(payload);
      const updated = {
        ...phoneNumbers[0],
        agent_definition_id: payload.agent_definition_id ?? phoneNumbers[0].agent_definition_id,
        agent_name: payload.agent_definition_id ? "Appointment Intake" : phoneNumbers[0].agent_name,
        agent_status: payload.agent_definition_id ? "published" : phoneNumbers[0].agent_status,
        published_version: payload.agent_definition_id ? 3 : phoneNumbers[0].published_version,
        active: Boolean(payload.active ?? phoneNumbers[0].active),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
    });

    await page.goto("/admin/channels");

    await expect(page.getByRole("heading", { name: "+37061230001" })).toBeVisible();
    await expect(page.getByTestId("admin-phone-number-row-pn-1")).toContainText("Needs attention");
    await expect(page.getByTestId("admin-phone-detail-assistant-select")).toContainText("Select published assistant");
    await expect(page.getByText("trunk-clinic-1")).toBeVisible();
    await expect(page.getByTestId("admin-phone-detail-submit")).toBeDisabled();
    await expect(page.getByTestId("admin-phone-toggle-selected")).toBeDisabled();

    await selectRadixOption(page, "admin-phone-detail-assistant-select", { value: "agent-1" });
    await expect(page.getByTestId("admin-phone-detail-submit")).toBeEnabled();
    await page.getByTestId("admin-phone-detail-submit").click();

    await expect(page.getByText("Saved routing changes for +37061230001.")).toBeVisible();
    expect(patchPayloads).toHaveLength(1);
    expect(patchPayloads[0]).toMatchObject({ agent_definition_id: "agent-1", active: true });
    expect(patchPayloads[0]).not.toHaveProperty("phone_number");
    expect(patchPayloads[0]).not.toHaveProperty("sip_trunk_id");
  });
});
