import {
  test,
  expect,
  expectDataTableFillsContainer,
  expectDataTableFitsViewport,
  expectRowActionsUseCellWidth,
  expectTableCellsInsideDataTable,
} from "./harness";
import { primeSessionCookie } from "./session-helpers";

type TenantStatus = "active" | "suspended" | "offboarded";

type MockTenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  environment: "production" | "demo" | "test" | "e2e";
  ui_locale: "en" | "lt";
  created_at: string;
  updated_at: string;
};

type OnboardPayload = {
  tenant_slug?: string;
  tenant_name?: string;
  admin_email?: string;
  admin_display_name?: string;
  admin_subject?: string;
  enable_solutions?: string[];
  phone_numbers?: Array<{
    phone_number?: string;
    sip_trunk_id?: string;
    agent_config?: string;
    agent_definition_id?: string;
    active?: boolean;
  }>;
  oidc_provider?: {
    issuer?: string;
    jwks_uri?: string;
    audience?: string;
  };
  wait_for_provisioning?: boolean;
};

type OffboardPayload = {
  grace_period_days?: number;
  wait_for_completion?: boolean;
};


test.describe("admin tenants", () => {
  test("super admin can onboard, toggle status, and offboard tenants", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const now = new Date().toISOString();
    const listQueryLog: string[] = [];
    const statusActionLog: Array<{ tenantId: string; status: TenantStatus }> = [];
    const onboardLog: OnboardPayload[] = [];
    const offboardLog: Array<{ tenantId: string; payload: OffboardPayload }> = [];

    const tenants: MockTenant[] = [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Acme Transport",
        slug: "acme_transport",
        status: "suspended",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
    ];
    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      listQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/oidc-providers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/status", async (route) => {
      const request = route.request();
      if (request.method() !== "PATCH") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const statusPayload = JSON.parse(request.postData() || "{}") as { status?: TenantStatus };
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/status$/);
      const tenantId = match ? decodeURIComponent(match[1]) : "";
      const tenant = tenants.find((candidate) => candidate.id === tenantId);
      if (!tenant || (statusPayload.status !== "active" && statusPayload.status !== "suspended")) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Invalid request" }),
        });
        return;
      }
      statusActionLog.push({ tenantId, status: statusPayload.status });
      tenant.status = statusPayload.status;
      tenant.updated_at = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: tenant.id,
          status: tenant.status,
          updated_at: tenant.updated_at,
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/onboard", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const payload = JSON.parse(request.postData() || "{}") as OnboardPayload;
      onboardLog.push(payload);
      const tenantId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
      tenants.unshift({
        id: tenantId,
        name: payload.tenant_name ?? "Unknown Tenant",
        slug: payload.tenant_slug ?? "unknown",
        status: "suspended",
        environment: "demo",
        ui_locale: "en",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: tenantId,
          tenant_schema: `tenant_${payload.tenant_slug ?? "unknown"}`,
          admin_user_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          provisioning_started: true,
          provision_workflow_id: `platform.provision-tenant/${tenantId}`,
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/offboard", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const payload = JSON.parse(request.postData() || "{}") as OffboardPayload;
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/offboard$/);
      const tenantId = match ? decodeURIComponent(match[1]) : "";
      const tenant = tenants.find((candidate) => candidate.id === tenantId);
      if (!tenant) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Tenant not found" }),
        });
        return;
      }

      tenant.status = "offboarded";
      tenant.updated_at = new Date().toISOString();
      offboardLog.push({ tenantId, payload });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: tenant.id,
          status: "suspended",
          offboard_workflow_id: `platform.offboard-tenant/${tenant.id}`,
          started: true,
        }),
      });
    });

    await page.goto("/admin/tenants");
    await expect(page.getByRole("heading", { name: "Tenants" })).toBeVisible();
    await expect(page.getByText("Manage tenant access, language, and retirement from one list.")).toBeVisible();
    await expect(page.getByTestId("admin-tenants-onboard-open")).toBeVisible();
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));
    await expectTableCellsInsideDataTable(page.locator('[data-ui="data-table"] tbody tr td:last-child'));

    await page.getByTestId("admin-tenants-onboard-open").click();
    await page.getByTestId("admin-tenants-onboard-name").fill("Northfleet");
    await expect(page.getByTestId("admin-tenants-onboard-slug")).toHaveValue("northfleet");
    await page.getByTestId("admin-tenants-onboard-admin-email").fill("admin@northfleet.test");
    await page.getByTestId("admin-tenants-onboard-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("tenant-name-cccccccc-cccc-cccc-cccc-cccccccccccc")).toContainText("Northfleet");
    await expect(page.getByTestId("admin-tenants-action-notice")).toContainText("Onboarding started for Northfleet");
    await page.reload();
    await page.getByTestId("tenant-actions-cccccccc-cccc-cccc-cccc-cccccccccccc").click();
    await expect(page.getByRole("menuitem", { name: "Copy token" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));
    await expectTableCellsInsideDataTable(page.locator('[data-ui="data-table"] tbody tr td:last-child'));

    const hoptransRow = page.locator("tr", { has: page.getByTestId("tenant-name-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") });
    await expect(hoptransRow.getByText("Active")).toBeVisible();

    await page.getByTestId("tenant-actions-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await page.getByRole("menuitem", { name: "Deactivate" }).click();
    await expect(hoptransRow.getByText("Deactivated")).toBeVisible();

    await page.getByTestId("tenant-actions-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await page.getByRole("menuitem", { name: "Activate" }).click();
    await expect(hoptransRow.getByText("Active")).toBeVisible();

    await page.getByTestId("tenant-actions-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await page.getByTestId("tenant-offboard-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await expect(page.getByRole("heading", { name: /Offboard/ })).toBeVisible();
    await page.getByTestId("admin-tenants-offboard-grace-days").fill("1");
    await page.getByTestId("admin-tenants-offboard-slug-confirm").fill("hoptrans");
    await page.getByTestId("admin-tenants-offboard-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(hoptransRow.getByText("Offboarded")).toBeVisible();
    await expect(page.getByTestId("admin-tenants-action-notice")).toContainText("Offboarding started for hoptrans");
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));
    await expectTableCellsInsideDataTable(page.locator('[data-ui="data-table"] tbody tr td:last-child'));

    expect(listQueryLog).toContain("limit=100&offset=0&include_non_production=true");
    expect(onboardLog).toEqual([
      {
        tenant_slug: "northfleet",
        tenant_name: "Northfleet",
        admin_email: "admin@northfleet.test",
        wait_for_provisioning: false,
      },
    ]);
    expect(statusActionLog).toEqual([
      { tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", status: "suspended" },
      { tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", status: "active" },
    ]);
    expect(offboardLog).toEqual([
      {
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        payload: {
          grace_period_days: 1,
          wait_for_completion: false,
        },
      },
    ]);
  });

  test("super admin can onboard a tenant from the empty production state", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const now = new Date().toISOString();
    const onboardLog: OnboardPayload[] = [];
    const tenants: MockTenant[] = [];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/tenants/onboard", async (route) => {
      const payload = JSON.parse(route.request().postData() || "{}") as OnboardPayload;
      onboardLog.push(payload);
      tenants.unshift({
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        name: payload.tenant_name ?? "Affidea",
        slug: payload.tenant_slug ?? "affidea",
        status: "suspended",
        environment: "demo",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          tenant_schema: "tenant_affidea",
          admin_user_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
          provisioning_started: true,
          provision_workflow_id: "platform.provision-tenant/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        }),
      });
    });

    await page.goto("/admin/tenants");
    await expect(page.getByText("No tenants exist yet. Start onboarding when you are ready to create a new tenant.")).toBeVisible();
    await page.getByTestId("admin-tenants-onboard-open").click();
    await page.getByTestId("admin-tenants-onboard-name").fill("Affidea");
    await page.getByTestId("admin-tenants-onboard-admin-email").fill("ops@affidea.test");
    await page.getByTestId("admin-tenants-onboard-submit").click();

    await expect(page.getByTestId("admin-tenants-action-notice")).toContainText("Onboarding started for Affidea.");
    await expect(page.getByTestId("tenant-name-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")).toContainText("Affidea");
    await page.reload();
    await page.getByTestId("tenant-actions-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee").click();
    await expect(page.getByRole("menuitem", { name: "Copy token" })).toBeVisible();
    expect(onboardLog).toEqual([
      {
        tenant_slug: "affidea",
        tenant_name: "Affidea",
        admin_email: "ops@affidea.test",
        wait_for_provisioning: false,
      },
    ]);
  });

});

test.describe("admin tenants handled error responses", () => {
  test.use({
    allowConsoleErrors: [/Failed to load resource: the server responded with a status of 409 \(Conflict\)/],
    allowRequestFailures: [/\/api\/platform\/admin\/tenants\/tenant-conflict\/status$/],
  });

  test("tenant action conflicts use operator copy instead of raw HTTP jargon", async ({ page }) => {
    const now = new Date().toISOString();
    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "tenant-conflict",
            name: "Demo Tenant",
            slug: "demo",
            status: "suspended",
            created_at: now,
            updated_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/tenant-conflict/status", async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Tenant provisioning is still in progress" }),
      });
    });

    await page.goto("/admin/tenants");
    await page.getByTestId("tenant-toggle-status-tenant-conflict").click();
    const errorBanner = page.getByTestId("admin-tenants-action-error");
    await expect(errorBanner).toContainText("Tenant setup is still running.");
    await expect(errorBanner).not.toContainText("409");
    await expect(errorBanner).not.toContainText("Conflict");
  });
});

/* ---------------------------------------------------------------------------
 * Redesigned tenant table: switch toggle, overflow menu, search, sort,
 * column visibility, offboard slug confirmation dialog.
 * --------------------------------------------------------------------------- */

const DEMO_TENANTS: MockTenant[] = [
  {
    id: "tenant-1",
    name: "Clinic Alpha",
    slug: "clinic_alpha",
    status: "active",
    environment: "demo",
    ui_locale: "en",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-28T10:00:00Z",
  },
  {
    id: "tenant-2",
    name: "Clinic Beta",
    slug: "clinic_beta",
    status: "suspended",
    environment: "demo",
    ui_locale: "en",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-25T14:00:00Z",
  },
];

/** Clone demo tenants so mutations in one test don't leak to the next. */
function freshTenants(): MockTenant[] {
  return DEMO_TENANTS.map((t) => ({ ...t }));
}

/** Shared route setup: returns `tenants` array on list, mutates on status PATCH. */
async function mockTenantRoutes(
  page: import("@playwright/test").Page,
  tenants: MockTenant[],
) {
  await page.route("**/api/platform/admin/tenants?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tenants),
    });
  });

  await page.route("**/api/platform/admin/tenants/*/status", async (route) => {
    const request = route.request();
    if (request.method() !== "PATCH") {
      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
      return;
    }

    const statusPayload = JSON.parse(request.postData() || "{}") as { status?: TenantStatus };
    const url = new URL(request.url());
    const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/status$/);
    const tenantId = match ? decodeURIComponent(match[1]) : "";
    const tenant = tenants.find((c) => c.id === tenantId);
    if (!tenant || (statusPayload.status !== "active" && statusPayload.status !== "suspended")) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid request" }),
      });
      return;
    }
    tenant.status = statusPayload.status;
    tenant.updated_at = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tenant_id: tenant.id, status: tenant.status, updated_at: tenant.updated_at }),
    });
  });

  await page.route("**/api/platform/admin/tenants/*/offboard", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ detail: "Method not allowed" }) });
      return;
    }
    const url = new URL(request.url());
    const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/offboard$/);
    const tenantId = match ? decodeURIComponent(match[1]) : "";
    const tenant = tenants.find((c) => c.id === tenantId);
    if (!tenant) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Not found" }) });
      return;
    }
    tenant.status = "offboarded";
    tenant.updated_at = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tenant_id: tenant.id, status: "suspended", offboard_workflow_id: `offboard/${tenant.id}`, started: true }),
    });
  });
}

test.describe("admin tenants redesigned table", () => {
  test("renders tenant table with switch toggle and overflow menu", async ({ page }) => {
    const tenants = freshTenants();
    await primeSessionCookie(page, "super_admin");
    await mockTenantRoutes(page, tenants);

    await page.goto("/admin/tenants");
    await expect(page.getByTestId("tenant-name-tenant-1")).toContainText("Clinic Alpha");
    await expect(page.getByTestId("tenant-name-tenant-2")).toContainText("Clinic Beta");

    // Switch toggle visible for both tenants.
    await expect(page.getByTestId("tenant-toggle-status-tenant-1")).toHaveRole("switch");
    await expect(page.getByTestId("tenant-toggle-status-tenant-2")).toHaveRole("switch");

    // Overflow menu trigger visible for both tenants.
    await expect(page.getByTestId("tenant-actions-tenant-1")).toBeVisible();
    await expect(page.getByTestId("tenant-actions-tenant-2")).toBeVisible();

    // Status labels: active tenant shows "Active", suspended shows "Deactivated".
    const row1 = page.locator("tr", { has: page.getByTestId("tenant-name-tenant-1") });
    await expect(row1.getByText("Active")).toBeVisible();

    const row2 = page.locator("tr", { has: page.getByTestId("tenant-name-tenant-2") });
    await expect(row2.getByText("Deactivated")).toBeVisible();
  });

  test("toggle switch deactivates an active tenant", async ({ page }) => {
    const tenants = [{ ...DEMO_TENANTS[0] }]; // single active tenant
    await primeSessionCookie(page, "super_admin");
    await mockTenantRoutes(page, tenants);

    await page.goto("/admin/tenants");

    const toggle = page.getByTestId("tenant-toggle-status-tenant-1");
    await expect(toggle).toBeChecked();

    await toggle.click();

    // After toggle, the switch becomes unchecked and the label changes.
    await expect(toggle).not.toBeChecked();
    const row = page.locator("tr", { has: page.getByTestId("tenant-name-tenant-1") });
    await expect(row.getByText("Deactivated")).toBeVisible();
  });

  test("toggle switch reactivates a deactivated tenant", async ({ page }) => {
    const tenants = [{ ...DEMO_TENANTS[1] }]; // single suspended tenant
    await primeSessionCookie(page, "super_admin");
    await mockTenantRoutes(page, tenants);

    await page.goto("/admin/tenants");

    const toggle = page.getByTestId("tenant-toggle-status-tenant-2");
    await expect(toggle).not.toBeChecked();

    await toggle.click();

    await expect(toggle).toBeChecked();
    const row = page.locator("tr", { has: page.getByTestId("tenant-name-tenant-2") });
    await expect(row.getByText("Active")).toBeVisible();
  });

  test("overflow menu shows Activate/Deactivate and Offboard actions", async ({ page }) => {
    const tenants = freshTenants();
    await primeSessionCookie(page, "super_admin");
    await mockTenantRoutes(page, tenants);

    await page.goto("/admin/tenants");

    // Active tenant overflow menu: "Deactivate" + "Offboard".
    await page.getByTestId("tenant-actions-tenant-1").click();
    await expect(page.getByTestId("tenant-toggle-status-tenant-1").last()).toBeVisible();
    await expect(page.getByTestId("tenant-offboard-tenant-1")).toBeVisible();
    // "Deactivate" is the label for an active tenant's toggle action.
    await expect(page.getByTestId("tenant-toggle-status-tenant-1").last()).toContainText("Deactivate");
    // "Offboard" has destructive styling (red text).
    const offboardItem = page.getByTestId("tenant-offboard-tenant-1");
    await expect(offboardItem).toContainText("Offboard");

    // Dismiss the menu by pressing Escape.
    await page.keyboard.press("Escape");

    // Suspended tenant overflow menu: "Activate" + "Offboard".
    await page.getByTestId("tenant-actions-tenant-2").click();
    await expect(page.getByTestId("tenant-toggle-status-tenant-2").last()).toContainText("Activate");
    await expect(page.getByTestId("tenant-offboard-tenant-2")).toContainText("Offboard");
    await page.keyboard.press("Escape");
  });

  test("offboard dialog requires slug confirmation", async ({ page }) => {
    const tenants = freshTenants();
    await primeSessionCookie(page, "super_admin");
    await mockTenantRoutes(page, tenants);

    await page.goto("/admin/tenants");

    // Open overflow menu and click "Offboard".
    await page.getByTestId("tenant-actions-tenant-1").click();
    await page.getByTestId("tenant-offboard-tenant-1").click();

    // Modal opens with confirmation input.
    await expect(page.getByRole("heading", { name: /Offboard/ })).toBeVisible();
    const submitButton = page.getByTestId("admin-tenants-offboard-submit");
    await expect(submitButton).toBeDisabled();

    // Type wrong slug -- button stays disabled.
    await page.getByTestId("admin-tenants-offboard-slug-confirm").fill("wrong_slug");
    await expect(submitButton).toBeDisabled();

    // Type correct slug -- button becomes enabled.
    await page.getByTestId("admin-tenants-offboard-slug-confirm").fill("clinic_alpha");
    await expect(submitButton).toBeEnabled();
  });

});
