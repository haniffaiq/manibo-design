import { test, expect, expectButtonsReadable, expectTextFits } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  created_at: string;
  updated_at: string;
};

type ReleaseSummary = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  notes: string | null;
  component_count: number;
};

type ReleaseComponent = {
  id: string;
  release_id: string;
  component_type: string;
  name: string;
  version: string;
  metadata: Record<string, unknown>;
};

type TenantReleaseAssignment = {
  tenant_id: string;
  desired_release_id: string;
  active_release_id: string | null;
  status: string;
  attempt_count: number;
  last_error: string | null;
  rollout_started_at: string | null;
  rollout_completed_at: string | null;
  updated_at: string | null;
};


function nowIso(): string {
  return new Date().toISOString();
}

test.describe("admin releases", () => {
  test("super admin can create release and assign it to a tenant", async ({ page }) => {
    const tenantQueryLog: string[] = [];
    const releaseCreateLog: Array<Record<string, unknown>> = [];
    const releaseApplyLog: Array<{ tenantId: string; releaseId: string; wait: boolean }> = [];

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();

    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const releases: ReleaseSummary[] = [
      {
        id: "release-seed-1",
        name: "seed-release",
        created_by: "user-1",
        created_at: now,
        notes: "existing",
        component_count: 1,
      },
    ];

    const componentsByRelease = new Map<string, ReleaseComponent[]>();
    componentsByRelease.set("release-seed-1", [
      {
        id: "component-seed-1",
        release_id: "release-seed-1",
        component_type: "solution",
        name: "appointment_booking",
        version: "v1",
        metadata: {},
      },
    ]);

    let assignment: TenantReleaseAssignment = {
      tenant_id: tenantId,
      desired_release_id: "release-seed-1",
      active_release_id: null,
      status: "pending",
      attempt_count: 0,
      last_error: null,
      rollout_started_at: null,
      rollout_completed_at: null,
      updated_at: nowIso(),
    };

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      tenantQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/releases?**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(releases),
      });
    });

    await page.route("**/api/platform/admin/releases/*/components", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/admin\/releases\/([^/]+)\/components$/);
      const releaseId = match ? decodeURIComponent(match[1]) : "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(componentsByRelease.get(releaseId) ?? []),
      });
    });

    await page.route("**/api/platform/admin/releases", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      const payload = JSON.parse(route.request().postData() || "{}") as {
        name?: string;
        notes?: string;
        solution_versions?: Record<string, string>;
        agent_definition_versions?: Record<string, string>;
        model_policy_version?: string;
        platform_defaults_version?: string;
      };

      if (!payload.name) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ detail: "name is required" }),
        });
        return;
      }

      const releaseId = `release-${releases.length + 1}`;
      const solutionComponents = Object.entries(payload.solution_versions ?? {}).map(([name, version], index) => ({
        id: `component-${releaseId}-solution-${index + 1}`,
        release_id: releaseId,
        component_type: "solution",
        name,
        version,
        metadata: {},
      }));
      const assistantComponents = Object.entries(payload.agent_definition_versions ?? {}).map(([name, version], index) => ({
        id: `component-${releaseId}-assistant-${index + 1}`,
        release_id: releaseId,
        component_type: "agent_definition",
        name,
        version,
        metadata: {},
      }));

      releases.unshift({
        id: releaseId,
        name: payload.name,
        created_by: "user-1",
        created_at: nowIso(),
        notes: payload.notes ?? null,
        component_count: solutionComponents.length + assistantComponents.length,
      });
      componentsByRelease.set(releaseId, [...solutionComponents, ...assistantComponents]);
      releaseCreateLog.push(payload as Record<string, unknown>);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ release_id: releaseId }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/release", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/release$/);
      const targetTenantId = match ? decodeURIComponent(match[1]) : "";
      if (targetTenantId !== tenantId) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Tenant not found" }),
        });
        return;
      }

      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(assignment),
        });
        return;
      }

      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData() || "{}") as { release_id?: string; wait?: boolean };
        if (!payload.release_id) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ detail: "release_id is required" }),
          });
          return;
        }

        assignment = {
          tenant_id: tenantId,
          desired_release_id: payload.release_id,
          active_release_id: null,
          status: payload.wait ? "applied" : "running",
          attempt_count: payload.wait ? 1 : 0,
          last_error: null,
          rollout_started_at: nowIso(),
          rollout_completed_at: payload.wait ? nowIso() : null,
          updated_at: nowIso(),
        };
        releaseApplyLog.push({ tenantId, releaseId: payload.release_id, wait: Boolean(payload.wait) });

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(assignment),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.goto("/admin/releases");
    await expect(page.getByRole("heading", { name: "Tenant rollouts", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-releases-guardrails-note")).toContainText("Traffic splitting");
    await expect(page.getByTestId("admin-releases-tenant-select")).toContainText("Hoptrans");
    await expect(page.getByTestId("admin-release-name-release-seed-1")).toContainText("seed-release");
    await expect(page.getByTestId("admin-releases-assignment-status")).toContainText("pending");
    await expectTextFits(page.locator('[data-testid^="admin-release-components-"], [data-testid^="admin-release-apply-"]'));
    await expectButtonsReadable(page.locator('[data-testid^="admin-release-components-"], [data-testid^="admin-release-apply-"]'));

    await page.getByTestId("admin-releases-open-create").click();
    await page.getByTestId("admin-releases-create-name").fill("wave-9-hardened");
    await page.getByTestId("admin-releases-create-notes").fill("Rollout for hoptrans");
    await page.getByText("Advanced version pins (JSON)").click();
    await expect(page.getByTestId("admin-releases-solution-versions")).toHaveValue("{}");
    await page.getByTestId("admin-releases-agent-definition-versions").fill('{"assistant":"2"}');
    await page.getByTestId("admin-releases-create-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("admin-release-name-release-2")).toContainText("wave-9-hardened");
    await expect(page.getByTestId("admin-releases-action-notice")).toContainText("Saved rollout package release-2");

    await page.getByTestId("admin-release-components-release-2").click();
    await expect(page.getByTestId("admin-release-components-table")).toContainText("assistant");
    await expect(page.getByRole("heading", { name: "Package details: wave-9-hardened" })).toBeVisible();

    await page.getByTestId("admin-release-apply-release-2").click();
    await expect(page.getByTestId("admin-releases-assignment-status")).toContainText("running");
    await expect(page.getByTestId("admin-releases-assignment-desired")).toContainText("release-2");
    await expect(page.getByTestId("admin-releases-assignment-attempts")).toContainText("0");
    await expect(page.getByTestId("admin-releases-assignment-started")).not.toHaveText(/^-\s*$/);

    expect(tenantQueryLog.length).toBeGreaterThan(0);
    expect(releaseCreateLog).toHaveLength(1);
    expect(releaseCreateLog[0]?.solution_versions).toEqual({});
    expect(releaseCreateLog[0]?.agent_definition_versions).toEqual({ assistant: "2" });
    expect(releaseApplyLog).toEqual([{ tenantId, releaseId: "release-2", wait: false }]);
  });
});
