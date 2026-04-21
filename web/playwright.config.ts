import { defineConfig, devices, type ReporterDescription } from "@playwright/test";

const reporter: ReporterDescription[] = [["html", { open: "never" }]];
const webSolutions = process.env.NEXT_PUBLIC_SOLUTIONS ?? "appointment_booking,driver_verification";
const webPort = process.env.NEXT_E2E_PORT ?? "3200";
const webBaseUrl = process.env.PLAYWRIGHT_WEB_BASE_URL ?? `http://localhost:${webPort}`;
const useBuiltServer = process.env.PLAYWRIGHT_USE_BUILT_SERVER === "1";
const includeVisualTests = process.env.PLAYWRIGHT_INCLUDE_VISUAL !== "0";
const testAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH ?? (useBuiltServer ? "false" : "true");
const tokenPasteLoginEnabled = process.env.GROVE_ENABLE_TOKEN_PASTE_LOGIN ?? (useBuiltServer ? "true" : "false");
const webSessionSecret = process.env.GROVE_WEB_SESSION_SECRET ?? "playwright-web-session-secret";
if (process.env.PW_JSON_REPORT_PATH) {
  reporter.push(["json", { outputFile: process.env.PW_JSON_REPORT_PATH }]);
}

export default defineConfig({
  testDir: ".",
  testMatch: includeVisualTests ? ["e2e/**/*.spec.ts", "tests/**/*.spec.ts"] : ["e2e/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: (() => {
    const raw = process.env.PLAYWRIGHT_WORKERS;
    if (raw !== undefined && raw !== "") {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
        throw new Error(`PLAYWRIGHT_WORKERS must be a positive integer; got: ${raw}`);
      }
      return parsed;
    }
    return process.env.CI ? 4 : undefined;
  })(),
  reporter,
  expect: {
    toHaveScreenshot: {
      pathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
    },
  },
  use: {
    baseURL: webBaseUrl,
    trace: process.env.PW_TRACE === "1" ? "on" : "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.PW_VIDEO === "1" ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: useBuiltServer ? "pnpm start:e2e" : "pnpm dev:e2e",
    url: webBaseUrl,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_SOLUTIONS: webSolutions,
      NEXT_PUBLIC_ENABLE_TEST_AUTH: testAuthEnabled,
      GROVE_ENABLE_TOKEN_PASTE_LOGIN: tokenPasteLoginEnabled,
      GROVE_WEB_SESSION_SECRET: webSessionSecret,
      NEXT_E2E_PORT: webPort,
    },
  },
});
