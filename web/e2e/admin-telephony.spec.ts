import type { Page } from "@playwright/test";

import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type PhoneNumberBindingRecord = {
  id: string;
  tenant_id: string;
  phone_number: string;
  sip_trunk_id: string;
  active: boolean;
  agent_definition_id: string;
  agent_name: string;
  agent_status: "published";
  published_version: number;
  routing_ready: boolean;
  created_at: string;
};

async function stubAdminTelephonyWorkspace(
  page: Page,
  options?: {
    numberStatus?: "inventory" | "assigned";
    providerStatus?: "connected" | "disconnected" | "archived";
    bootstrapBindingReady?: boolean;
  },
): Promise<{
  assignmentRequests: Array<{
    tenantId: string;
    payload: {
      phone_number: string;
      sip_trunk_id: string;
      agent_definition_id: string;
      active: boolean;
    };
  }>;
}> {
  const tenantId = "tenant-1";
  const providerAccountId = "provider-1";
  const trunkId = "trunk-1";
  const livekitBindingId = "ST_shared_1";
  const numberId = "number-1";
  const assignmentRequests: Array<{
    tenantId: string;
    payload: {
      phone_number: string;
      sip_trunk_id: string;
      agent_definition_id: string;
      active: boolean;
    };
  }> = [];

  const providerOptions = [
    {
      provider_kind: "telnyx",
      display_name: "Telnyx",
      capability_matrix: [
        {
          capability: "telephony.connect_provider_account",
          enabled: true,
          notes: "Provider account management is supported.",
        },
        {
          capability: "telephony.sync_trunks",
          enabled: true,
          notes: "Refreshes trunk inventory from Telnyx.",
        },
        {
          capability: "telephony.sync_numbers",
          enabled: true,
          notes: "Refreshes number inventory from Telnyx.",
        },
        {
          capability: "telephony.assign_published_assistant",
          enabled: true,
          notes: "Published assistants can be assigned to synced numbers.",
        },
      ],
      operations: [
        {
          operation: "validate_account",
          mode: "managed",
          implemented: true,
          notes: "Balance probe validates provider connectivity.",
        },
        {
          operation: "sync_trunks",
          mode: "managed",
          implemented: true,
          notes: "Refreshes Telnyx route inventory.",
        },
        {
          operation: "sync_numbers",
          mode: "managed",
          implemented: true,
          notes: "Refreshes Telnyx number inventory.",
        },
      ],
    },
  ];

  let providerAccounts = [
    {
      id: providerAccountId,
      owner_scope: "deployment",
      owner_tenant_id: null,
      provider_kind: "telnyx",
      display_name: "Telnyx",
      status: options?.providerStatus ?? "connected",
      capability_snapshot: [
        "telephony.connect_provider_account",
        "telephony.sync_trunks",
        "telephony.sync_numbers",
        "telephony.assign_published_assistant",
      ],
      provider_metadata: {},
      control_plane: {
        last_tested_at: "2026-04-04T10:00:00Z",
        last_test_outcome: options?.providerStatus === "disconnected" ? "failure" : "success",
        last_test_message:
          options?.providerStatus === "disconnected" ? "Environment variable 'TELNYX_API_KEY' not set." : "Balance check succeeded.",
        last_test_probe: options?.providerStatus === "disconnected" ? "secret_ref.resolve" : "provider.connectivity",
      },
      credential_configured: true,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ];

  const syncedTrunks = [
    {
      id: trunkId,
      provider_account_id: providerAccountId,
      display_name: "Primary Connection",
      direction: "bidirectional",
      transport_kind: "livekit_sip",
      provider_resource_id: "cred-1",
      livekit_binding_id: livekitBindingId,
      status: "active",
      config: {},
      control_plane: {
        last_synced_at: "2026-04-04T10:05:00Z",
        last_sync_message: "Imported provider trunks",
        last_reconciled_at: null,
        last_reconcile_message: null,
        last_reconcile_issue_codes: [],
      },
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:05:00Z",
    },
  ];
  const unsyncedBootstrapTrunks = syncedTrunks.map((trunk) => ({
    ...trunk,
    livekit_binding_id: null,
  }));

  const initialNumbers = [
    {
      id: numberId,
      provider_account_id: providerAccountId,
      trunk_id: trunkId,
      e164_number: "+15551230000",
      provider_number_id: "tnx-num-1",
      status: options?.numberStatus ?? "inventory",
      source: "imported",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: {
        last_synced_at: "2026-04-04T10:05:00Z",
        last_sync_message: "Imported provider numbers",
        last_seen_in_provider_inventory_at: "2026-04-04T10:05:00Z",
        last_acquired_at: null,
        last_acquisition_message: null,
        last_provider_order_id: null,
      },
      created_at: "2026-04-04T09:30:00Z",
      updated_at: "2026-04-04T10:05:00Z",
    },
  ];
  const syncedNumbers = initialNumbers.map((number) => ({
    ...number,
    status: "assigned" as const,
  }));
  let currentTrunks =
    options?.providerStatus === "disconnected"
      ? []
      : options?.bootstrapBindingReady === false
        ? unsyncedBootstrapTrunks
        : syncedTrunks;
  let currentNumbers = options?.providerStatus === "disconnected" ? [] : initialNumbers;

  const bindingsByTenant: Record<string, PhoneNumberBindingRecord[]> = {
    [tenantId]: [],
  };

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
          environment: "production",
          ui_locale: "en",
          created_at: "2026-04-01T00:00:00Z",
          updated_at: "2026-04-04T00:00:00Z",
        },
      ]),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-options", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(providerOptions),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-accounts", async (route) => {
    const url = new URL(route.request().url());
    const includeArchived = url.searchParams.get("include_archived") === "true";
    const visibleAccounts = includeArchived
      ? providerAccounts
      : providerAccounts.filter((account) => account.status !== "archived");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(visibleAccounts),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-accounts/*/test", async (route) => {
    providerAccounts = providerAccounts.map((account) =>
      account.id === providerAccountId
        ? {
            ...account,
            status: "connected",
            updated_at: "2026-04-04T10:10:00Z",
            control_plane: {
              last_tested_at: "2026-04-04T10:10:00Z",
              last_test_outcome: "success",
              last_test_message: "Balance check succeeded.",
              last_test_probe: "provider.connectivity",
            },
          }
        : account,
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider_account: providerAccounts[0],
        tested_at: "2026-04-04T10:10:00Z",
        outcome: "success",
        message: "Balance check succeeded.",
        probe: "provider.connectivity",
        details: { balance: "42.00" },
      }),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-accounts/*/trunks/sync", async (route) => {
    currentTrunks = syncedTrunks;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider_account_id: providerAccountId,
        synced_at: "2026-04-04T10:12:00Z",
        created_count: 0,
        updated_count: 1,
        trunks: currentTrunks,
        message: "Imported provider trunks",
      }),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-accounts/*/numbers/sync", async (route) => {
    currentNumbers = syncedNumbers;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider_account_id: providerAccountId,
        synced_at: "2026-04-04T10:13:00Z",
        created_count: 0,
        updated_count: 1,
        released_count: 0,
        retained_assigned_count: 0,
        numbers: currentNumbers,
        message: "Imported provider numbers",
      }),
    });
  });

  await page.route("**/api/platform/admin/telephony/provider-accounts/*/archive", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Archive is blocked while this provider still has 1 active route and 1 active number.",
      }),
    });
  });

  await page.route("**/api/platform/admin/telephony/trunks**", async (route) => {
    const url = new URL(route.request().url());
    const providerAccountFilter = url.searchParams.get("provider_account_id");
    const filtered = providerAccountFilter
      ? currentTrunks.filter((trunk) => trunk.provider_account_id === providerAccountFilter)
      : currentTrunks;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(filtered),
    });
  });

  await page.route("**/api/platform/admin/telephony/numbers**", async (route) => {
    const url = new URL(route.request().url());
    const providerAccountFilter = url.searchParams.get("provider_account_id");
    const filtered = providerAccountFilter
      ? currentNumbers.filter((number) => number.provider_account_id === providerAccountFilter)
      : currentNumbers;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(filtered),
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
        updated_at: "2026-04-04T10:00:00Z",
      }),
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
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:00:00Z",
        },
      ]),
    });
  });

  await page.route(`**/api/platform/admin/tenants/${tenantId}/phone-channels`, async (route) => {
    if (route.request().method() === "POST") {
      const payload = JSON.parse(route.request().postData() ?? "{}") as {
        phone_number: string;
        sip_trunk_id: string;
        agent_definition_id: string;
        active: boolean;
      };
      assignmentRequests.push({ tenantId, payload });
      const created: PhoneNumberBindingRecord = {
        id: "binding-1",
        tenant_id: tenantId,
        phone_number: payload.phone_number,
        sip_trunk_id: payload.sip_trunk_id,
        active: payload.active,
        agent_definition_id: payload.agent_definition_id,
        agent_name: "Appointment Intake",
        agent_status: "published",
        published_version: 3,
        routing_ready: Boolean(payload.active),
        created_at: "2026-04-04T10:15:00Z",
      };
      bindingsByTenant[tenantId] = [created];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ phone_numbers: bindingsByTenant[tenantId] }),
    });
  });

  return { assignmentRequests };
}

test.describe("admin telephony", () => {
  test("super admin can connect a disconnected deployment provider from the desktop table", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await primeSessionCookie(page, "super_admin");
    await stubAdminTelephonyWorkspace(page, { providerStatus: "disconnected" });

    await page.goto("/admin/telephony");
    await page.waitForURL("**/admin/telephony");

    await expect(page.getByRole("heading", { name: "Telephony" })).toBeVisible();
    const activeProviderTable = page.getByRole("table").first();
    await expect(activeProviderTable).toBeVisible();
    await expect(activeProviderTable.getByText("Telnyx")).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Provider" })).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Trunks" })).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Numbers" })).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    await expect(activeProviderTable.getByRole("columnheader", { name: "Ownership" })).toHaveCount(0);
    await expect(activeProviderTable.getByRole("columnheader", { name: "Capabilities" })).toHaveCount(0);
    await expect(activeProviderTable.getByRole("columnheader", { name: "Inventory" })).toHaveCount(0);
    await expect(page.getByText(/TELNYX_API_KEY/)).toHaveCount(0);
    await expect(activeProviderTable.getByRole("row", { name: /Telnyx.*Disconnected/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sync inventory" })).toBeVisible();

    await page.getByRole("button", { name: "Sync inventory" }).click();
    await expect(activeProviderTable.getByText("Connected")).toBeVisible();
    await expect(activeProviderTable.getByRole("row", { name: /Telnyx.*Connected/i })).toBeVisible();
    await expect(page.getByTestId("admin-telephony-provider-form")).toHaveCount(0);

    const activeNumbersTable = page.getByRole("table").nth(1);
    await expect(activeNumbersTable).toBeVisible();
    await expect(activeNumbersTable.getByText("+15551230000")).toBeVisible();
  });

  test("super admin can assign an inventory number in one step", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await primeSessionCookie(page, "super_admin");
    const state = await stubAdminTelephonyWorkspace(page);

    await page.goto("/admin/telephony");
    await page.waitForURL("**/admin/telephony");

    const activeNumbersTable = page.locator('[data-ui="data-table-table"]').nth(1);
    await expect(activeNumbersTable).toBeVisible();

    await page.getByTestId("number-actions-number-1").click();
    await page.getByRole("menuitem", { name: "Assign number" }).click();
    const numberDialog = page.getByRole("dialog");
    await expect(numberDialog).toBeVisible();

    await page.getByRole("button", { name: "Assign" }).click();
    await expect
      .poll(() => state.assignmentRequests)
      .toEqual([
        {
          tenantId: "tenant-1",
          payload: {
            phone_number: "+15551230000",
            sip_trunk_id: "ST_shared_1",
            agent_definition_id: "agent-1",
            active: false,
          },
        },
      ]);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const assignedRow = page.getByRole("row", { name: /\+15551230000/ });
    await expect(assignedRow).toContainText("North Clinic");
    await expect(assignedRow).toContainText("Appointment Intake");
    await expect(assignedRow).toContainText("Needs attention");
  });

  test("super admin can assign an unbound provider-assigned number with live routing on", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await primeSessionCookie(page, "super_admin");
    const state = await stubAdminTelephonyWorkspace(page, { numberStatus: "assigned" });

    await page.goto("/admin/telephony");
    await page.waitForURL("**/admin/telephony");

    const activeNumbersTable = page.locator('[data-ui="data-table-table"]').nth(1);
    await expect(activeNumbersTable).toBeVisible();

    await page.getByTestId("number-actions-number-1").click();
    await page.getByRole("menuitem", { name: "Assign number" }).click();
    const numberDialog = page.getByRole("dialog");
    await expect(numberDialog).toBeVisible();

    await page.getByRole("button", { name: "Assign" }).click();
    await expect
      .poll(() => state.assignmentRequests)
      .toEqual([
        {
          tenantId: "tenant-1",
          payload: {
            phone_number: "+15551230000",
            sip_trunk_id: "ST_shared_1",
            agent_definition_id: "agent-1",
            active: true,
          },
        },
      ]);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const assignedRow = page.getByRole("row", { name: /\+15551230000/ });
    await expect(assignedRow).toContainText("North Clinic");
    await expect(assignedRow).toContainText("Appointment Intake");
    await expect(assignedRow).toContainText("Ready");
  });

  test("super admin can assign a provider-synced number after bootstrap linkage is persisted on sync", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await primeSessionCookie(page, "super_admin");
    const state = await stubAdminTelephonyWorkspace(page, {
      numberStatus: "assigned",
      bootstrapBindingReady: false,
    });

    await page.goto("/admin/telephony");
    await page.waitForURL("**/admin/telephony");

    const activeNumbersTable = page.locator('[data-ui="data-table-table"]').nth(1);
    await expect(activeNumbersTable).toBeVisible();

    await page.getByTestId("number-actions-number-1").click();
    await page.getByRole("menuitem", { name: "Assign number" }).click();
    const numberDialog = page.getByRole("dialog");
    await expect(numberDialog).toBeVisible();

    await page.getByRole("button", { name: "Assign" }).click();
    await expect
      .poll(() => state.assignmentRequests)
      .toEqual([
        {
          tenantId: "tenant-1",
          payload: {
            phone_number: "+15551230000",
            sip_trunk_id: "ST_shared_1",
            agent_definition_id: "agent-1",
            active: true,
          },
        },
      ]);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const assignedRow = page.getByRole("row", { name: /\+15551230000/ });
    await expect(assignedRow).toContainText("North Clinic");
    await expect(assignedRow).toContainText("Appointment Intake");
    await expect(assignedRow).toContainText("Ready");
  });

  test("mobile viewport uses the stacked provider and number cards", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await primeSessionCookie(page, "super_admin");
    await stubAdminTelephonyWorkspace(page);

    await page.goto("/admin/telephony");
    await page.waitForURL("**/admin/telephony");

    await expect(page.getByText("Telnyx").first()).toBeVisible();
    await expect(page.getByText("1 trunks · 1 numbers").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sync provider" }).first()).toBeVisible();
    await expect(page.getByTestId("admin-telephony-provider-form")).toHaveCount(0);

    await expect(page.getByText("+15551230000").first()).toBeVisible();
    await page.getByTestId("number-actions-number-1").click();
    await page.getByRole("menuitem", { name: "Assign number" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
