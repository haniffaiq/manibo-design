import { expect, test as base, type ConsoleMessage, type Locator, type Page, type Request, type TestInfo } from "@playwright/test";

type ConsoleEvent = {
  type: string;
  text: string;
  location?: { url?: string; lineNumber?: number; columnNumber?: number };
};

type RequestFailureEvent = {
  url: string;
  method: string;
  failure?: string | null;
};

type HttpErrorResponseEvent = {
  url: string;
  method: string;
  status: number;
  statusText: string;
  resourceType: string;
};

type AllowList = RegExp | RegExp[];

type HarnessOptions = {
  allowConsoleErrors: AllowList;
  allowRequestFailures: AllowList;
};

function normalizeAllowList(allow: AllowList | undefined): RegExp[] {
  if (!allow) {
    return [];
  }
  return Array.isArray(allow) ? allow : [allow];
}

function shouldAllowByText(text: string, allow: AllowList) {
  return normalizeAllowList(allow).some((pattern) => pattern.test(text));
}

function shouldAllowByUrl(url: string, allow: AllowList) {
  return normalizeAllowList(allow).some((pattern) => pattern.test(url));
}

function isBrowserHttpErrorConsole(event: ConsoleEvent) {
  return (
    event.type === "error" &&
    event.text.startsWith("Failed to load resource: the server responded with a status of ") &&
    typeof event.location?.url === "string" &&
    event.location.url.length > 0
  );
}

function isBenignRequestFailure(event: RequestFailureEvent) {
  const failure = event.failure ?? "";
  return failure === "net::ERR_ABORTED" || failure === "NS_ERROR_ABORT";
}

function recordConsoleEvent(message: ConsoleMessage): ConsoleEvent {
  const location = message.location();
  return {
    type: message.type(),
    text: message.text(),
    location: location
      ? {
          url: location.url,
          lineNumber: location.lineNumber,
          columnNumber: location.columnNumber,
        }
      : undefined,
  };
}

async function attachJson(testInfo: TestInfo, name: string, payload: unknown) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    contentType: "application/json",
  });
}

async function attachText(testInfo: TestInfo, name: string, text: string) {
  await testInfo.attach(name, {
    body: Buffer.from(text, "utf-8"),
    contentType: "text/plain",
  });
}

export async function expectTextFits(locator: Locator) {
  const allFit = await locator.evaluateAll((elements) =>
    elements.every((element) => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight),
  );
  expect(allFit).toBeTruthy();
}

export async function expectButtonsReadable(locator: Locator) {
  const allReadable = await locator.evaluateAll((elements) =>
    elements.every((element) => {
      const getEffectiveBackground = (node: Element | null): string => {
        let current: Element | null = node;
        while (current) {
          const currentStyle = window.getComputedStyle(current);
          const background = currentStyle.backgroundColor.replace(/\s+/g, "");
          if (background && background !== "rgba(0,0,0,0)" && background !== "transparent") {
            return background;
          }
          current = current.parentElement;
        }
        return "rgb(255,255,255)";
      };
      const style = window.getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") {
        return false;
      }
      if (Number.parseFloat(style.opacity || "1") < 0.95) {
        return false;
      }
      if (!element.textContent?.trim()) {
        return false;
      }
      const textColor = style.color.replace(/\s+/g, "");
      const backgroundColor = getEffectiveBackground(element).replace(/\s+/g, "");
      return textColor !== backgroundColor;
    }),
  );
  expect(allReadable).toBeTruthy();
}

export async function expectElementsInsideDataTable(locator: Locator) {
  const allInside = await locator.evaluateAll((elements) =>
    elements.every((element) => {
      const container = element.closest('[data-ui="data-table"]');
      if (!container) {
        return true;
      }

      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return (
        elementRect.left >= containerRect.left - 1 &&
        elementRect.right <= containerRect.right + 1 &&
        elementRect.top >= containerRect.top - 1 &&
        elementRect.bottom <= containerRect.bottom + 1
      );
    }),
  );
  expect(allInside).toBeTruthy();
}

export async function expectTableCellsInsideDataTable(locator: Locator) {
  const allInside = await locator.evaluateAll((elements) =>
    elements.every((element) => {
      const container = element.closest('[data-ui="data-table"]');
      if (!container) {
        return true;
      }

      const cellRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return (
        cellRect.left >= containerRect.left - 1 &&
        cellRect.right <= containerRect.right + 1 &&
        cellRect.top >= containerRect.top - 1 &&
        cellRect.bottom <= containerRect.bottom + 1
      );
    }),
  );
  expect(allInside).toBeTruthy();
}

export async function expectDataTableFitsViewport(locator: Locator) {
  const allFit = await locator.evaluateAll((elements) =>
    elements.every((element) => element.scrollWidth <= element.clientWidth + 1),
  );
  expect(allFit).toBeTruthy();
}

export async function expectDataTableFillsContainer(locator: Locator, maxGap = 4) {
  const allFill = await locator.evaluateAll(
    (elements, allowedGap) =>
      elements.every((element) => {
        const container = element.closest('[data-ui="data-table"]');
        if (!container) {
          return true;
        }
        const tableRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return containerRect.right - tableRect.right <= allowedGap && tableRect.left - containerRect.left <= allowedGap;
      }),
    maxGap,
  );
  expect(allFill).toBeTruthy();
}

export async function expectActionsAnchoredToTableEdge(locator: Locator, maxGap = 40) {
  const allAnchored = await locator.evaluateAll(
    (elements, allowedGap) =>
      elements.every((element) => {
        const container = element.closest('[data-ui="data-table"]');
        if (!container) {
          return true;
        }
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return containerRect.right - elementRect.right <= allowedGap;
      }),
    maxGap,
  );
  expect(allAnchored).toBeTruthy();
}

export async function expectRowActionsUseCellWidth(locator: Locator, minimumCoverage = 0.72) {
  const allCompact = await locator.evaluateAll(
    (elements, minRatio) =>
      elements.every((element) => {
        const cell = element.closest("td");
        if (!cell) {
          return true;
        }
        const elementRect = element.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        if (cellRect.width === 0) {
          return false;
        }
        return elementRect.width / cellRect.width >= minRatio;
      }),
    minimumCoverage,
  );
  expect(allCompact).toBeTruthy();
}

export const test = base.extend<HarnessOptions>({
  allowConsoleErrors: [[], { option: true }],
  allowRequestFailures: [[], { option: true }],

  page: async ({ page, allowConsoleErrors, allowRequestFailures }, use, testInfo) => {
    const emptyListPayload = (requestUrl: string, key: string) => {
      const url = new URL(requestUrl);
      const limit = Number(url.searchParams.get("limit") || "200");
      const offset = Number(url.searchParams.get("offset") || "0");
      return { [key]: [], total: 0, limit, offset };
    };

    // Default tenant mocks keep generic route/access tests honest without forcing every
    // spec to stub feature data it does not care about.
    await page.route("**/api/platform/solutions", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ solutions: [] }),
      });
    });
    await page.route("**/api/platform/calls/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ calls: [] }),
      });
    });
    await page.route("**/api/platform/calls/observability-summary**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: 0,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-07T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [],
        }),
      });
    });
    // Default deployment mocks keep route/auth coverage focused on navigation instead of
    // failing because the dashboard's background admin fetches have no live API behind them.
    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/oidc-providers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checked_at: "2026-03-07T00:00:00Z",
          call_error_rate: 0,
          average_call_duration_seconds: 0,
          active_calls: { voice_call: 0, inbound_call: 0, total: 0 },
          worker_status: {
            platform_api: "healthy",
            temporal: "healthy",
            temporal_error: null,
          },
        }),
      });
    });
    await page.route("**/api/platform/admin/telephony/provider-options**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/telephony/provider-accounts**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/telephony/trunks**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/telephony/numbers**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/platform/admin/tenants/*/telephony/policy", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/admin\/tenants\/([^/]+)\/telephony\/policy$/);
      const tenantId = match?.[1] ?? "unknown-tenant";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: tenantId,
          mode: "default_with_byo_override",
          allows_deployment_default: true,
          allows_tenant_byo: true,
          usable_provider_account_source: "deployment_default",
          deployment_provider_account_count: 0,
          tenant_provider_account_count: 0,
          updated_at: "2026-03-07T00:00:00Z",
        }),
      });
    });
    await page.route("**/api/platform/admin/tenants/*/phone-channels**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ phone_numbers: [] }),
      });
    });
    await page.route("**/api/platform/drivers?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyListPayload(route.request().url(), "drivers")),
      });
    });
    await page.route("**/api/platform/driver-verification/jobs?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyListPayload(route.request().url(), "jobs")),
      });
    });

    const consoleEvents: ConsoleEvent[] = [];
    const pageErrors: string[] = [];
    const requestFailures: RequestFailureEvent[] = [];
    const httpErrorResponses: HttpErrorResponseEvent[] = [];

    page.on("console", (message) => {
      const event = recordConsoleEvent(message);
      if (event.type === "error") {
        consoleEvents.push(event);
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(String(error?.stack || error?.message || error));
    });

    page.on("requestfailed", (request: Request) => {
      requestFailures.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
      });
    });

    page.on("response", (response) => {
      const status = response.status();
      if (status < 400) {
        return;
      }

      const request = response.request();
      httpErrorResponses.push({
        url: response.url(),
        method: request.method(),
        status,
        statusText: response.statusText(),
        resourceType: request.resourceType(),
      });
    });

    await use(page);

    await attachText(testInfo, "final-url.txt", page.url());
    await attachJson(testInfo, "console-errors.json", consoleEvents);
    await attachJson(testInfo, "page-errors.json", pageErrors);
    await attachJson(testInfo, "request-failures.json", requestFailures);
    await attachJson(testInfo, "http-error-responses.json", httpErrorResponses);

    if (process.env.PW_ATTACH_FINAL_SCREENSHOT !== "0") {
      try {
        await testInfo.attach("final-screenshot.png", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      } catch (error) {
        await attachText(testInfo, "final-screenshot-error.txt", String(error));
      }
    }

    const unexpectedPageErrors = pageErrors;
    const unexpectedConsoleErrors = consoleEvents.filter((event) => {
      if (shouldAllowByText(event.text, allowConsoleErrors)) {
        return false;
      }

      if (isBrowserHttpErrorConsole(event) && shouldAllowByUrl(event.location!.url!, allowRequestFailures)) {
        return false;
      }

      return true;
    });
    const unexpectedRequestFailures = requestFailures.filter(
      (event) => !isBenignRequestFailure(event) && !shouldAllowByUrl(event.url, allowRequestFailures),
    );
    const unexpectedHttpErrorResponses = httpErrorResponses.filter(
      (event) => !shouldAllowByUrl(event.url, allowRequestFailures),
    );

    // Fail hard only when explicitly enabled (CI and bot runs).
    if (process.env.PW_ENFORCE_NO_PAGE_ERRORS === "1") {
      expect(unexpectedPageErrors, "Unexpected page errors (uncaught exceptions) detected.").toEqual([]);
    }

    if (process.env.PW_ENFORCE_NO_CONSOLE_ERRORS === "1") {
      expect(unexpectedConsoleErrors, "Unexpected console.error messages detected.").toEqual([]);
    }

    if (process.env.PW_ENFORCE_NO_REQUEST_FAILURES === "1") {
      expect(
        {
          requestFailures: unexpectedRequestFailures,
          httpErrorResponses: unexpectedHttpErrorResponses,
        },
        "Unexpected request failures and/or HTTP error responses detected.",
      ).toEqual({
        requestFailures: [],
        httpErrorResponses: [],
      });
    }
  },
});

/**
 * Select an option from a Radix Select component by clicking the trigger then the option.
 * Use `optionText` for selecting by visible label, or `optionValue` for selecting by data-value attribute.
 */
export async function selectRadixOption(
  page: Page,
  triggerTestId: string,
  option: { text?: string; value?: string },
): Promise<void> {
  await page.getByTestId(triggerTestId).click();
  if (option.text) {
    await page.getByRole("option", { name: option.text }).click();
  } else if (option.value) {
    await page.locator(`[role="option"][data-value="${option.value}"]`).click();
  }
}

/**
 * Click a Radix Tab by its data-testid or visible text.
 * Verifies the tab becomes active after clicking.
 */
export async function selectRadixTab(
  page: Page,
  tab: { testId?: string; text?: string },
): Promise<void> {
  const locator = tab.testId
    ? page.getByTestId(tab.testId)
    : page.getByRole("tab", { name: tab.text });
  await locator.click();
  await expect(locator).toHaveAttribute("data-state", "active");
}

/**
 * Hover an element and assert the Radix Tooltip content matches.
 */
export async function expectTooltipContent(
  page: Page,
  trigger: { testId?: string; text?: string },
  expectedContent: string,
): Promise<void> {
  const locator = trigger.testId
    ? page.getByTestId(trigger.testId)
    : page.getByText(trigger.text!);
  await locator.hover();
  await expect(page.getByRole("tooltip")).toContainText(expectedContent);
}

export { expect, type Page };
