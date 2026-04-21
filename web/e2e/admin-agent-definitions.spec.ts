import { test, expect, expectButtonsReadable, expectTextFits, selectRadixOption } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  created_at: string;
  updated_at: string;
};

type Definition = {
  id: string;
  tenant_id: string;
  name: string;
  status: "draft" | "published" | "retired";
  published_version: number | null;
  created_at: string;
  updated_at: string;
};

type DefinitionVersion = {
  id: string;
  agent_definition_id: string;
  tenant_id: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "rejected" | "published" | "previously_published" | "archived";
  source_yaml: string;
  source_yaml_hash: string;
  compiled_hash: string;
  model_policy_snapshot_ref: string | null;
  platform_defaults_version: string | null;
  created_at: string;
  submitted_at: string | null;
  published_at: string | null;
  review_decision: "approved" | "rejected" | null;
  review_reason: string | null;
  review_submitted_at: string | null;
  review_decided_at: string | null;
};


function nowIso(): string {
  return new Date().toISOString();
}

async function mockAgentDefinitionDetailRoute(
  page: import("@playwright/test").Page,
  resolveDefinition: (tenantId: string, definitionId: string) => Definition | undefined,
) {
  await page.route("**/api/platform/admin/tenants/*/agent-definitions/*", async (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(request.url());
    const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/agent-definitions\/([^/]+)$/);
    if (!match) {
      await route.fallback();
      return;
    }

    const tenantId = decodeURIComponent(match[1]);
    const definitionId = decodeURIComponent(match[2]);
    const definition = resolveDefinition(tenantId, definitionId);
    if (!definition) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Agent definition not found" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(definition),
    });
  });
}

async function mockAgentDefinitionByNameRoute(
  page: import("@playwright/test").Page,
  resolveDefinition: (tenantId: string, definitionName: string) => Definition | undefined,
) {
  await page.route("**/api/platform/admin/tenants/*/agent-definitions/by-name/*", async (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(request.url());
    const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/agent-definitions\/by-name\/([^/]+)$/);
    if (!match) {
      await route.fallback();
      return;
    }

    const tenantId = decodeURIComponent(match[1]);
    const definitionName = decodeURIComponent(match[2]);
    const definition = resolveDefinition(tenantId, definitionName);
    if (!definition) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Agent definition not found" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(definition),
    });
  });
}

async function mockAgentDefinitionChannelsRoute(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/admin/tenants/*/phone-channels**", async (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(request.url());
    const phoneChannelsPath = url.pathname.match(/\/admin\/tenants\/[^/]+\/phone-channels$/);
    if (!phoneChannelsPath) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ phone_channels: [] }),
    });
  });
}

test.describe("admin agent definitions", () => {
  test.beforeEach(async ({ page }) => {
    await mockAgentDefinitionChannelsRoute(page);
  });

  test("super admin can manage governed agent definition lifecycle", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const tenantQueryLog: string[] = [];
    const createDefinitionLog: Array<Record<string, unknown>> = [];
    const createVersionLog: Array<{ definitionId: string; payload: Record<string, unknown> }> = [];
    const submitLog: Array<{ definitionId: string; version: number }> = [];
    const reviewLog: Array<{ definitionId: string; version: number; decision: string }> = [];
    const publishLog: Array<{ definitionId: string; version: number }> = [];
    const archiveLog: Array<{ definitionId: string; version: number }> = [];
    const retireLog: string[] = [];

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [];
    const versionsByDefinition = new Map<string, DefinitionVersion[]>();

    await primeSessionCookie(page, "super_admin");
    page.on("dialog", async (dialog) => {
      if (dialog.type() === "confirm") {
        await dialog.accept();
        return;
      }
      await dialog.dismiss();
    });

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      tenantQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{
          key: "appointment_booking:clinic_registration",
          title: "Clinic registration",
          recommended_definition_name: "clinic_registrator",
          solution: "appointment_booking",
          summary: "Lithuanian clinic booking starter.",
          yaml: clinicStarterYaml,
        }]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions/*/submit", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions\/(\d+)\/submit$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      const version = match ? Number.parseInt(match[2], 10) : 0;
      const versions = versionsByDefinition.get(definitionId) ?? [];
      const target = versions.find((candidate) => candidate.version === version);
      if (!target) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Version not found" }),
        });
        return;
      }

      target.status = "in_review";
      target.submitted_at = nowIso();
      target.review_submitted_at = target.submitted_at;
      submitLog.push({ definitionId, version });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "submitted" }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions/*/review", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const payload = JSON.parse(request.postData() || "{}") as { decision?: "approved" | "rejected"; reason?: string };
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions\/(\d+)\/review$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      const version = match ? Number.parseInt(match[2], 10) : 0;
      const versions = versionsByDefinition.get(definitionId) ?? [];
      const target = versions.find((candidate) => candidate.version === version);
      if (!target || !payload.decision) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Version not found" }),
        });
        return;
      }

      target.status = payload.decision === "approved" ? "approved" : "rejected";
      target.review_decision = payload.decision;
      target.review_reason = payload.reason ?? null;
      target.review_decided_at = nowIso();
      reviewLog.push({ definitionId, version, decision: payload.decision });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: payload.decision }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions/*/publish", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions\/(\d+)\/publish$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      const version = match ? Number.parseInt(match[2], 10) : 0;
      const versions = versionsByDefinition.get(definitionId) ?? [];
      const target = versions.find((candidate) => candidate.version === version);
      const definition = definitions.find((candidate) => candidate.id === definitionId);
      if (!target || !definition) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Version not found" }),
        });
        return;
      }

      for (const entry of versions) {
        if (entry.status === "published") {
          entry.status = "previously_published";
        }
      }
      target.status = "published";
      target.published_at = nowIso();
      definition.status = "published";
      definition.published_version = version;
      definition.updated_at = nowIso();
      publishLog.push({ definitionId, version });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "published" }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions/*/archive", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions\/(\d+)\/archive$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      const version = match ? Number.parseInt(match[2], 10) : 0;
      const versions = versionsByDefinition.get(definitionId) ?? [];
      const target = versions.find((candidate) => candidate.version === version);
      if (!target) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Version not found" }),
        });
        return;
      }
      if (target.status !== "previously_published" && target.status !== "rejected") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Cannot archive this version" }),
        });
        return;
      }

      target.status = "archived";
      archiveLog.push({ definitionId, version });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "archived" }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/retire", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/retire$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      const definition = definitions.find((candidate) => candidate.id === definitionId);
      if (!definition) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Definition not found" }),
        });
        return;
      }

      definition.status = "retired";
      definition.updated_at = nowIso();
      retireLog.push(definitionId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "retired" }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";

      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(versionsByDefinition.get(definitionId) ?? []),
        });
        return;
      }

      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData() || "{}") as {
          source_yaml?: string;
          platform_defaults_version?: string;
          model_policy_snapshot_ref?: string;
        };
        const definition = definitions.find((candidate) => candidate.id === definitionId);
        if (!definition || !payload.source_yaml) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Definition not found" }),
          });
          return;
        }

        const existing = versionsByDefinition.get(definitionId) ?? [];
        const nextVersion = existing.length > 0 ? Math.max(...existing.map((entry) => entry.version)) + 1 : 1;
        const createdAt = nowIso();
        const created: DefinitionVersion = {
          id: `version-${nextVersion}`,
          agent_definition_id: definitionId,
          tenant_id: tenantId,
          version: nextVersion,
          status: "draft",
          source_yaml: payload.source_yaml,
          source_yaml_hash: `hash-${nextVersion}`,
          compiled_hash: `compiled-${nextVersion}`,
          model_policy_snapshot_ref: payload.model_policy_snapshot_ref ?? null,
          platform_defaults_version: payload.platform_defaults_version ?? null,
          created_at: createdAt,
          submitted_at: null,
          published_at: null,
          review_decision: null,
          review_reason: null,
          review_submitted_at: null,
          review_decided_at: null,
        };
        versionsByDefinition.set(definitionId, [created, ...existing]);
        createVersionLog.push({ definitionId, payload: payload as Record<string, unknown> });

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: created.id,
            agent_definition_id: definitionId,
            tenant_id: tenantId,
            version: created.version,
            status: created.status,
            source_yaml_hash: created.source_yaml_hash,
            compiled_hash: created.compiled_hash,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitions),
      });
    });
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(definitions),
        });
        return;
      }

      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData() || "{}") as { name?: string };
        if (!payload.name) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ detail: "name is required" }),
          });
          return;
        }

        const createdAt = nowIso();
        const created: Definition = {
          id: `definition-${definitions.length + 1}`,
          tenant_id: tenantId,
          name: payload.name,
          status: "draft",
          published_version: null,
          created_at: createdAt,
          updated_at: createdAt,
        };
        definitions.push(created);
        createDefinitionLog.push(payload as Record<string, unknown>);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: created.id,
            tenant_id: created.tenant_id,
            name: created.name,
            status: created.status,
            published_version: created.published_version,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.goto("/admin/agent-definitions");
    await expect(page.getByRole("heading", { name: "Agents", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-agent-definitions-tenant-select")).toContainText("Affidea");

    await page.getByTestId("admin-agent-definitions-open-create").click();
    await page.getByTestId("admin-agent-definitions-create-name").fill("Clinic registrator");
    await expect(page.getByText("Saved as clinic_registrator. Spaces and punctuation are converted automatically.")).toBeVisible();
    await page.getByTestId("admin-agent-definitions-create-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    // After creation, navigation goes to detail page
    await page.waitForURL(/\/admin\/agent-definitions\/definition-1\?tenant_id=/);

    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();

    // Open the new version form
    await page.getByTestId("admin-agent-definitions-open-new-version").click();

    await expect(page.getByTestId("admin-agent-definitions-platform-defaults-prerequisite")).toHaveCount(0);
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).toContainText("clinic_registrator");
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toBeEnabled();

    await page.getByTestId("admin-agent-definitions-version-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    // Versions are always visible — check the created version
    await expect(page.getByTestId("admin-agent-definition-version-status-1")).toContainText("Draft");

    await expectTextFits(page.locator('[data-testid^="admin-agent-definition-publish-"]'));
    await expectButtonsReadable(page.locator('[data-testid^="admin-agent-definition-publish-"]'));

    // One-click publish chains submit -> approve -> publish
    await page.getByTestId("admin-agent-definition-publish-1").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definition-version-status-1")).toContainText("Live");

    await page.getByTestId("admin-agent-definitions-open-new-version").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await page.getByTestId("admin-agent-definitions-version-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definition-version-status-2")).toContainText("Draft");

    await page.getByTestId("admin-agent-definition-publish-2").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definition-version-status-2")).toContainText("Live");
    await expect(page.getByTestId("admin-agent-definition-version-status-1")).toContainText("Previously live");

    await page.getByTestId("admin-agent-definition-publish-1").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definition-version-status-1")).toContainText("Live");
    await expect(page.getByTestId("admin-agent-definition-version-status-2")).toContainText("Previously live");

    await page.getByTestId("admin-agent-definition-archive-2").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definition-version-status-2")).toContainText("Archived");
    await expect(page.getByTestId("admin-agent-definition-publish-2")).toHaveCount(0);

    // Retire the definition
    await page.getByTestId("admin-agent-definitions-retire").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByTestId("admin-agent-definitions-action-notice")).toContainText("Retired assistant clinic_registrator");

    expect(tenantQueryLog.length).toBeGreaterThan(0);
    expect(createDefinitionLog).toEqual([{ name: "clinic_registrator" }]);
    expect(createVersionLog).toHaveLength(2);
    expect(String(createVersionLog[0]?.payload?.source_yaml ?? "").trim()).toBe(clinicStarterYaml.trim());
    expect(String(createVersionLog[1]?.payload?.source_yaml ?? "").trim()).toBe(clinicStarterYaml.trim());
    expect(submitLog).toEqual([
      { definitionId: "definition-1", version: 1 },
      { definitionId: "definition-1", version: 2 },
    ]);
    expect(reviewLog).toEqual([
      { definitionId: "definition-1", version: 1, decision: "approved" },
      { definitionId: "definition-1", version: 2, decision: "approved" },
    ]);
    expect(publishLog).toEqual([
      { definitionId: "definition-1", version: 1 },
      { definitionId: "definition-1", version: 2 },
      { definitionId: "definition-1", version: 1 },
    ]);
    expect(archiveLog).toEqual([{ definitionId: "definition-1", version: 2 }]);
    expect(retireLog).toEqual(["definition-1"]);
  });

  test("draft creation works even when no platform defaults version exists yet", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const createVersionLog: Array<{ definitionId: string; payload: Record<string, unknown> }> = [];
    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "clinic_registrator",
        status: "draft",
        published_version: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{
          key: "appointment_booking:clinic_registration",
          title: "Clinic registration",
          recommended_definition_name: "clinic_registrator",
          solution: "appointment_booking",
          summary: "Lithuanian clinic booking starter.",
          yaml: clinicStarterYaml,
        }]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitions),
      });
    });
    await mockAgentDefinitionByNameRoute(page, (targetTenantId, definitionName) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.name === definitionName),
    );
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      if (route.request().method() === "POST") {
        const url = new URL(route.request().url());
        const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions$/);
        const definitionId = match ? decodeURIComponent(match[1]) : "";
        createVersionLog.push({
          definitionId,
          payload: JSON.parse(route.request().postData() || "{}") as Record<string, unknown>,
        });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "version-4",
            agent_definition_id: definitionId,
            tenant_id: tenantId,
            version: 4,
            status: "draft",
            source_yaml_hash: "hash-4",
            compiled_hash: "compiled-4",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Navigate directly to the detail page for definition-1
    await page.goto(`/admin/agent-definitions/definition-1?tenant_id=${tenantId}`);

    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();

    // Open the new version form and confirm create is still available without seeded defaults.
    await page.getByTestId("admin-agent-definitions-open-new-version").click();

    await expect(page.getByTestId("admin-agent-definitions-platform-defaults-prerequisite")).toHaveCount(0);
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toBeEnabled();
    await page.getByTestId("admin-agent-definitions-version-submit").click();

    await expect.poll(() => createVersionLog.length).toBe(1);
    expect(createVersionLog[0]?.payload).toEqual(
      expect.objectContaining({
        source_yaml: clinicStarterYaml.trimEnd(),
      }),
    );
  });

  test("observability links can focus the governed assistant release lane", async ({ page }) => {
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

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "sales",
        status: "published",
        published_version: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    const versionsByDefinition = new Map<string, DefinitionVersion[]>([
      [
        "definition-1",
        [
          {
            id: "version-2",
            agent_definition_id: "definition-1",
            tenant_id: tenantId,
            version: 2,
            status: "published",
            source_yaml: "name: sales\nmission: production mission\n",
            source_yaml_hash: "hash-v2",
            compiled_hash: "compiled-v2",
            model_policy_snapshot_ref: "policy_v2",
            platform_defaults_version: "pd_hoptrans",
            created_at: now,
            submitted_at: now,
            published_at: now,
            review_decision: "approved",
            review_reason: null,
            review_submitted_at: now,
            review_decided_at: now,
          },
          {
            id: "version-1",
            agent_definition_id: "definition-1",
            tenant_id: tenantId,
            version: 1,
            status: "previously_published",
            source_yaml: "name: sales\nmission: legacy mission\n",
            source_yaml_hash: "hash-v1",
            compiled_hash: "compiled-v1",
            model_policy_snapshot_ref: "policy_v1",
            platform_defaults_version: "pd_hoptrans",
            created_at: now,
            submitted_at: now,
            published_at: now,
            review_decision: "approved",
            review_reason: null,
            review_submitted_at: now,
            review_decided_at: now,
          },
        ],
      ],
    ]);

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "pd_hoptrans",
            config_yaml_hash: "cfg-hash-hoptrans",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitions),
      });
    });
    await mockAgentDefinitionByNameRoute(page, (targetTenantId, definitionName) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.name === definitionName),
    );
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(versionsByDefinition.get(definitionId) ?? []),
      });
    });

    // Navigate through the legacy list-page observability link shape.
    await page.goto(
      `/admin/agent-definitions?tenant_id=${tenantId}&definition_name=sales&version=2&source=observability`,
    );

    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();
    await expect(page.getByTestId("admin-agent-definitions-route-focus")).toContainText("version v2 in focus");
    await expect(page.getByTestId("admin-agent-definitions-focused-version")).toContainText("Observed run");
    await expect(page.getByTestId("admin-agent-definitions-version-row-2")).toContainText("v2");
  });

  test("source-only observability links still show release-lane context", async ({ page }) => {
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

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "sales",
        status: "published",
        published_version: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitions),
      });
    });
    await mockAgentDefinitionByNameRoute(page, (targetTenantId, definitionName) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.name === definitionName),
    );
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto(
      `/admin/agent-definitions?tenant_id=${tenantId}&definition_name=sales&source=observability`,
    );

    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();
    await expect(page.getByTestId("admin-agent-definitions-route-focus")).toContainText(
      "Opened from observability. Review the governed release lane before changing what callers hear.",
    );
  });

  test("changing tenants clears starter choices that no longer apply", async ({ page }) => {
    const now = nowIso();
    const clinicTenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const driverTenantId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const createDefinitionLog: Array<{ tenantId: string; payload: Record<string, unknown> }> = [];

    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");
    const driverStarterYaml = [
      "agent:",
      "  name: hoptrans_driver_verification",
      "mission: verify drivers",
      "plugins:",
      "  driver_verification:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: clinicTenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: driverTenantId,
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitionsByTenant = new Map<string, Definition[]>([
      [clinicTenantId, [{ id: "definition-1", tenant_id: clinicTenantId, name: "hoptrans_driver_verification", status: "draft", published_version: null, created_at: now, updated_at: now }]],
      [driverTenantId, []],
    ]);

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      const tenantMatch = route.request().url().match(/\/admin\/tenants\/([^/]+)\/solutions$/);
      const tenantId = tenantMatch ? decodeURIComponent(tenantMatch[1]) : "";
      const solutionName = tenantId === driverTenantId ? "driver_verification" : "appointment_booking";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: solutionName,
              enabled: true,
              version: "1.0.0",
              description: "Enabled",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            key: "appointment_booking:clinic_registration",
            title: "Clinic registration",
            recommended_definition_name: "clinic_registrator",
            solution: "appointment_booking",
            summary: "Lithuanian clinic booking starter.",
            yaml: clinicStarterYaml,
          },
          {
            key: "driver_verification:driver_verification",
            title: "Driver verification",
            recommended_definition_name: "hoptrans_driver_verification",
            solution: "driver_verification",
            summary: "Driver verification starter.",
            yaml: driverStarterYaml,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      const tenantMatch = route.request().url().match(/\/admin\/tenants\/([^/]+)\/agent-definitions/);
      const tenantId = tenantMatch ? decodeURIComponent(tenantMatch[1]) : "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitionsByTenant.get(tenantId) ?? []),
      });
    });
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      (definitionsByTenant.get(targetTenantId) ?? []).find((candidate) => candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const tenantMatch = route.request().url().match(/\/admin\/tenants\/([^/]+)\/agent-definitions$/);
      const tenantId = tenantMatch ? decodeURIComponent(tenantMatch[1]) : "";
      createDefinitionLog.push({
        tenantId,
        payload: JSON.parse(route.request().postData() || "{}") as Record<string, unknown>,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "definition-1",
          tenant_id: tenantId,
          name: "hoptrans_driver_verification",
          status: "draft",
          published_version: null,
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/admin/agent-definitions");
    await selectRadixOption(page, "admin-agent-definitions-tenant-select", { value: driverTenantId });
    await page.getByTestId("admin-agent-definitions-open-create").click();
    await page.getByRole("button", { name: "Driver verification" }).click();
    await expect(page.getByTestId("admin-agent-definitions-create-name")).toHaveValue("hoptrans_driver_verification");

    await selectRadixOption(page, "admin-agent-definitions-tenant-select", { value: clinicTenantId });
    await page.getByTestId("admin-agent-definitions-create-submit").click();

    await page.waitForURL(new RegExp(`/admin/agent-definitions/definition-1\\?tenant_id=${clinicTenantId}$`));
    expect(page.url()).not.toContain("starter=");
    expect(createDefinitionLog).toEqual([
      {
        tenantId: clinicTenantId,
        payload: { name: "hoptrans_driver_verification" },
      },
    ]);
  });

  test("changing tenants preserves starter choices that still apply after solution reload", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const now = nowIso();
    const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const createDefinitionLog: Array<{ tenantId: string; payload: Record<string, unknown> }> = [];
    let releaseTenantBSolutions!: () => void;
    const tenantBSolutionsReady = new Promise<void>((resolve) => {
      releaseTenantBSolutions = () => resolve();
    });

    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: tenantA,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: tenantB,
        name: "Clinic B",
        slug: "clinic-b",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];
    const createdDefinitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantB,
        name: "clinic_registrator",
        status: "draft",
        published_version: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      const tenantMatch = route.request().url().match(/\/admin\/tenants\/([^/]+)\/solutions$/);
      const tenantId = tenantMatch ? decodeURIComponent(tenantMatch[1]) : "";
      if (tenantId === tenantB) {
        await tenantBSolutionsReady;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Enabled",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            key: "appointment_booking:clinic_registration",
            title: "Clinic registration",
            recommended_definition_name: "clinic_registrator",
            solution: "appointment_booking",
            summary: "Lithuanian clinic booking starter.",
            yaml: clinicStarterYaml,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      createdDefinitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const tenantMatch = route.request().url().match(/\/admin\/tenants\/([^/]+)\/agent-definitions$/);
      const tenantId = tenantMatch ? decodeURIComponent(tenantMatch[1]) : "";
      createDefinitionLog.push({
        tenantId,
        payload: JSON.parse(route.request().postData() || "{}") as Record<string, unknown>,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "definition-1",
          tenant_id: tenantId,
          name: "clinic_registrator",
          status: "draft",
          published_version: null,
        }),
      });
    });
    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/admin/agent-definitions");
    await page.getByTestId("admin-agent-definitions-open-create").click();
    await page.getByRole("button", { name: "Clinic registration" }).click();
    await expect(page.getByTestId("admin-agent-definitions-create-name")).toHaveValue("clinic_registrator");

    await selectRadixOption(page, "admin-agent-definitions-tenant-select", { value: tenantB });
    await page.waitForTimeout(100);
    releaseTenantBSolutions();
    await expect(page.getByTestId("admin-agent-definitions-create-name")).toHaveValue("clinic_registrator");

    await page.getByTestId("admin-agent-definitions-create-submit").click();

    await page.waitForURL(
      new RegExp(
        `/admin/agent-definitions/definition-1\\?tenant_id=${tenantB}&starter=appointment_booking%3Aclinic_registration$`,
      ),
    );
    expect(createDefinitionLog).toEqual([
      {
        tenantId: tenantB,
        payload: { name: "clinic_registrator" },
      },
    ]);
  });

  test("starter-selected drafts wait for tenant solution context before enabling creation", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "clinic_registrator",
        status: "draft",
        published_version: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            key: "appointment_booking:clinic_registration",
            title: "Clinic registration",
            recommended_definition_name: "clinic_registrator",
            solution: "appointment_booking",
            summary: "Lithuanian clinic booking starter.",
            yaml: clinicStarterYaml,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/agent-definitions?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(definitions),
      });
    });
    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto(`/admin/agent-definitions/definition-1?tenant_id=${tenantId}&starter=clinic_registration`);
    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();
    await page.getByTestId("admin-agent-definitions-open-new-version").click();
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toBeDisabled();
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).toContainText("appointment_booking");
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toBeEnabled();
  });

  test("blank starter drafts do not wait for solution discovery", async ({ page }) => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "clinic_registrator",
        status: "draft",
        published_version: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ solutions: [] }),
      });
    });

    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto(`/admin/agent-definitions/definition-1?tenant_id=${tenantId}&starter=blank`);
    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();
    await page.getByTestId("admin-agent-definitions-open-new-version").click();
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).toContainText("mission: describe your agent mission");
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toBeEnabled({ timeout: 300 });
  });

  test("cancel resets a first-version draft back to the selected starter skeleton", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");
    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "clinic_registrator",
        status: "draft",
        published_version: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            key: "appointment_booking:clinic_registration",
            title: "Clinic registration",
            recommended_definition_name: "clinic_registrator",
            solution: "appointment_booking",
            summary: "Lithuanian clinic booking starter.",
            yaml: clinicStarterYaml,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto(`/admin/agent-definitions/definition-1?tenant_id=${tenantId}&starter=clinic_registration`);
    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();

    await page.getByTestId("admin-agent-definitions-open-new-version").click();
    const yamlEditor = page.getByTestId("admin-agent-definitions-version-yaml");
    await expect(yamlEditor).toContainText("appointment_booking");

    await page.getByLabel("Mission").fill("edited and cancelled");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("admin-agent-definitions-version-submit")).toHaveCount(0);

    await page.getByTestId("admin-agent-definitions-open-new-version").click();
    await expect(yamlEditor).toContainText("appointment_booking");
    await expect(yamlEditor).not.toContainText("edited and cancelled");
  });

  test("new version keeps latest YAML after starter discovery finishes", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Clinic starter coverage only applies when appointment booking ships in the build.");

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = nowIso();
    const clinicStarterYaml = [
      "name: clinic_registrator",
      "mission: register clinic appointments",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");
    const latestVersionYaml = [
      "name: clinic_registrator",
      "mission: production mission",
      "plugins:",
      "  appointment_booking:",
      "    enabled: true",
      "",
    ].join("\n");

    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Affidea",
        slug: "affidea",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const definitions: Definition[] = [
      {
        id: "definition-1",
        tenant_id: tenantId,
        name: "clinic_registrator",
        status: "published",
        published_version: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    const versionsByDefinition = new Map<string, DefinitionVersion[]>([
      [
        "definition-1",
        [
          {
            id: "version-2",
            agent_definition_id: "definition-1",
            tenant_id: tenantId,
            version: 2,
            status: "published",
            source_yaml: latestVersionYaml,
            source_yaml_hash: "hash-v2",
            compiled_hash: "compiled-v2",
            model_policy_snapshot_ref: "policy_v2",
            platform_defaults_version: "clinic_default_v1",
            created_at: now,
            submitted_at: now,
            published_at: now,
            review_decision: "approved",
            review_reason: null,
            review_submitted_at: now,
            review_decided_at: now,
          },
        ],
      ],
    ]);

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            version: "clinic_default_v1",
            config_yaml_hash: "cfg-hash-1",
            created_by: "11111111-1111-1111-1111-111111111111",
            created_at: now,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/agent-starters", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            key: "appointment_booking:clinic_registration",
            title: "Clinic registration",
            recommended_definition_name: "clinic_registrator",
            solution: "appointment_booking",
            summary: "Lithuanian clinic booking starter.",
            yaml: clinicStarterYaml,
          },
        ]),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/solutions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await mockAgentDefinitionDetailRoute(page, (targetTenantId, definitionId) =>
      definitions.find((candidate) => candidate.tenant_id === targetTenantId && candidate.id === definitionId),
    );

    await page.route("**/api/platform/admin/tenants/*/agent-definitions/*/versions", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/agent-definitions\/([^/]+)\/versions$/);
      const definitionId = match ? decodeURIComponent(match[1]) : "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(versionsByDefinition.get(definitionId) ?? []),
      });
    });

    await page.goto(`/admin/agent-definitions/definition-1?tenant_id=${tenantId}`);
    await expect(page.getByTestId("admin-agent-definitions-workflow-modal")).toBeVisible();

    await page.getByTestId("admin-agent-definitions-open-new-version").click();
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).toContainText("production mission");
    await page.waitForTimeout(800);
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).toContainText("production mission");
    await expect(page.getByTestId("admin-agent-definitions-version-yaml")).not.toContainText("register clinic appointments");
  });
});
