import {
  test,
  expect,
  expectButtonsReadable,
  expectDataTableFillsContainer,
  expectDataTableFitsViewport,
  expectRowActionsUseCellWidth,
  expectTextFits,
  selectRadixOption,
} from "./harness";
import { primeSessionCookie } from "./session-helpers";

type OidcProvider = {
  id: string;
  issuer: string;
  jwks_uri: string;
  audience: string;
  tenant_id: string | null;
  created_at: string;
};

type PlatformDefaultsEntry = {
  version: string;
  config_yaml_hash: string;
  created_by: string;
  created_at: string;
};

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  created_at: string;
  updated_at: string;
};


test.describe("admin settings", () => {
  test("super admin can manage sign-in setup and starting settings", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const now = new Date().toISOString();
    const oidcCreateLog: Array<Record<string, unknown>> = [];
    const oidcUpdateLog: Array<{ providerId: string; payload: Record<string, unknown> }> = [];
    const oidcDeleteLog: string[] = [];
    const defaultsCreateLog: Array<Record<string, unknown>> = [];
    const tenantsQueryLog: string[] = [];

    const providers: OidcProvider[] = [
      {
        id: "provider-1",
        issuer: "https://issuer.example.test",
        jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
        audience: "voice-agent-platform",
        tenant_id: null,
        created_at: now,
      },
    ];

    const defaults: PlatformDefaultsEntry[] = [
      {
        version: "pd_existing",
        config_yaml_hash: "abcd1234efgh5678",
        created_by: "11111111-1111-1111-1111-111111111111",
        created_at: now,
      },
    ];

    const tenants: TenantSummary[] = [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Northfleet",
        slug: "northfleet",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/oidc-providers", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(providers),
        });
        return;
      }

      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData() || "{}") as {
          issuer?: string;
          jwks_uri?: string;
          audience?: string;
          tenant_id?: string | null;
        };
        oidcCreateLog.push(payload as Record<string, unknown>);
        const created: OidcProvider = {
          id: "provider-2",
          issuer: payload.issuer ?? "",
          jwks_uri: payload.jwks_uri ?? "",
          audience: payload.audience ?? "",
          tenant_id: payload.tenant_id ?? null,
          created_at: new Date().toISOString(),
        };
        providers.unshift(created);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.route("**/api/platform/admin/oidc-providers/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const providerId = url.pathname.split("/").at(-1) || "";
      const targetIndex = providers.findIndex((provider) => provider.id === providerId);

      if (targetIndex < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "OIDC provider not found" }),
        });
        return;
      }

      if (request.method() === "PATCH") {
        const payload = JSON.parse(request.postData() || "{}") as {
          issuer?: string;
          jwks_uri?: string;
          audience?: string;
          tenant_id?: string | null;
        };
        oidcUpdateLog.push({ providerId, payload: payload as Record<string, unknown> });
        providers[targetIndex] = {
          ...providers[targetIndex],
          issuer: payload.issuer ?? providers[targetIndex].issuer,
          jwks_uri: payload.jwks_uri ?? providers[targetIndex].jwks_uri,
          audience: payload.audience ?? providers[targetIndex].audience,
          tenant_id: payload.tenant_id ?? null,
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(providers[targetIndex]),
        });
        return;
      }

      if (request.method() === "DELETE") {
        oidcDeleteLog.push(providerId);
        providers.splice(targetIndex, 1);
        await route.fulfill({
          status: 204,
          body: "",
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(defaults),
        });
        return;
      }

      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData() || "{}") as { version?: string; config_yaml?: string };
        defaultsCreateLog.push(payload as Record<string, unknown>);
        const created: PlatformDefaultsEntry = {
          version: payload.version ?? "",
          config_yaml_hash: "newhash123456",
          created_by: "11111111-1111-1111-1111-111111111111",
          created_at: new Date().toISOString(),
        };
        defaults.unshift(created);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ version: created.version, config_yaml_hash: created.config_yaml_hash }),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.route("**/api/platform/admin/platform-defaults/*", async (route) => {
      const version = route.request().url().split("/").at(-1) || "";
      const entry = defaults.find((item) => item.version === version);
      if (!entry) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Platform defaults version not found" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: entry.version,
          config_yaml: "model:\n  provider: openai\n  model: gpt-4o-mini\n",
          config_yaml_hash: entry.config_yaml_hash,
        }),
      });
    });

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      tenantsQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Staff sign-in and shared AI starting settings" })).toBeVisible();

    await page.getByTestId("settings-provider-open-create").click();
    await page.getByTestId("settings-provider-issuer").fill("https://issuer.new.example.test");
    await page.getByTestId("settings-provider-jwks-uri").fill("https://issuer.new.example.test/.well-known/jwks.json");
    await page.getByTestId("settings-provider-audience").fill("voice-agent-platform-new");
    await selectRadixOption(page, "settings-provider-tenant", { value: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" });
    await page.getByTestId("settings-provider-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("settings-provider-issuer-provider-2")).toContainText("https://issuer.new.example.test");
    await expect(page.getByTestId("settings-action-notice")).toContainText("Sign-in provider saved");
    await expectTextFits(page.locator('[data-testid^="settings-provider-edit-"], [data-testid^="settings-provider-delete-"]'));
    await expectButtonsReadable(page.locator('[data-testid^="settings-provider-edit-"], [data-testid^="settings-provider-delete-"]'));
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]').first());
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]').first());
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]').first());

    await page.getByTestId("settings-provider-edit-provider-1").click();
    await page.getByTestId("settings-provider-issuer").fill("https://issuer.updated.example.test");
    await page.getByTestId("settings-provider-audience").fill("voice-agent-platform-updated");
    await page.getByTestId("settings-provider-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("settings-provider-issuer-provider-1")).toContainText("https://issuer.updated.example.test");

    await page.getByTestId("settings-provider-delete-provider-1").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("settings-provider-confirm-delete").click();
    await expect(page.getByTestId("settings-provider-issuer-provider-1")).toHaveCount(0);
    await expect(page.getByTestId("settings-action-notice")).toContainText("Sign-in provider removed");

    await page.getByTestId("settings-platform-default-open").click();
    await page.getByTestId("settings-platform-default-version").fill("pd_provider_control");
    await page
      .getByTestId("settings-platform-default-yaml")
      .fill("model:\n  provider: openai\n  model: gpt-4o-mini\n");
    await page.getByTestId("settings-platform-default-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("settings-defaults-version-pd_provider_control")).toContainText("pd_provider_control");
    await expect(page.getByTestId("settings-action-notice")).toContainText("Starting settings saved");
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]').nth(1));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]').nth(1));

    await page.getByTestId("settings-defaults-start-from-pd_provider_control").click();
    await expect(page.getByTestId("settings-platform-default-version")).toHaveValue("");
    await expect(page.getByTestId("settings-platform-default-yaml")).toHaveValue(
      "model:\n  provider: openai\n  model: gpt-4o-mini\n",
    );
    await expect(page.getByTestId("settings-action-notice")).toContainText(
      "Loaded starting settings pd_provider_control",
    );

    expect(tenantsQueryLog).toContain("limit=500&offset=0&include_non_production=true");
    expect(oidcCreateLog).toEqual([
      {
        issuer: "https://issuer.new.example.test",
        jwks_uri: "https://issuer.new.example.test/.well-known/jwks.json",
        audience: "voice-agent-platform-new",
        tenant_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      },
    ]);
    expect(oidcUpdateLog).toEqual([
      {
        providerId: "provider-1",
        payload: {
          issuer: "https://issuer.updated.example.test",
          jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
          audience: "voice-agent-platform-updated",
          tenant_id: null,
        },
      },
    ]);
    expect(oidcDeleteLog).toEqual(["provider-1"]);
    expect(defaultsCreateLog).toEqual([
      {
        version: "pd_provider_control",
        config_yaml: "model:\n  provider: openai\n  model: gpt-4o-mini",
      },
    ]);
  });
});
