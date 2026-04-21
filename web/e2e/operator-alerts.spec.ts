import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type OperatorEvent = {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acked" | "resolved";
  entity_type: string | null;
  entity_id: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  acked_at: string | null;
  acked_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
};

test.describe("operator alerts", () => {
  test("client operator can filter, ack, and resolve operator events", async ({ page }) => {
    const listLog: string[] = [];
    const actionLog: string[] = [];
    const now = new Date().toISOString();
    const events: OperatorEvent[] = [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        event_type: "ops.workflow_execution_failed",
        severity: "critical",
        status: "open",
        entity_type: "call",
        entity_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        message: "Workflow failed after retries",
        metadata: {},
        created_at: now,
        updated_at: now,
        acked_at: null,
        acked_by: null,
        resolved_at: null,
        resolved_by: null,
      },
    ];

    await primeSessionCookie(page, "client_operator");

    await page.route("**/api/platform/operator-events**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }
      const url = new URL(request.url());
      listLog.push(url.searchParams.toString());
      const severity = url.searchParams.get("severity");
      const status = url.searchParams.get("status");
      const filtered = events.filter((event) => {
        if (severity && event.severity !== severity) {
          return false;
        }
        if (status && event.status !== status) {
          return false;
        }
        return true;
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ events: filtered }),
      });
    });

    await page.route("**/api/platform/operator-events/*/ack", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/operator-events\/([^/]+)\/ack$/);
      const eventId = match ? decodeURIComponent(match[1]) : "";
      const event = events.find((candidate) => candidate.id === eventId);
      if (!event) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "operator_event not found" }),
        });
        return;
      }
      event.status = "acked";
      event.acked_at = new Date().toISOString();
      event.acked_by = "11111111-1111-1111-1111-111111111111";
      event.updated_at = new Date().toISOString();
      actionLog.push(`ack:${eventId}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ event }),
      });
    });

    await page.route("**/api/platform/operator-events/*/resolve", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/operator-events\/([^/]+)\/resolve$/);
      const eventId = match ? decodeURIComponent(match[1]) : "";
      const event = events.find((candidate) => candidate.id === eventId);
      if (!event) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "operator_event not found" }),
        });
        return;
      }
      event.status = "resolved";
      event.resolved_at = new Date().toISOString();
      event.resolved_by = "11111111-1111-1111-1111-111111111111";
      event.updated_at = new Date().toISOString();
      actionLog.push(`resolve:${eventId}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ event }),
      });
    });

    await page.goto("/call-ops/alerts");
    await expect(page.getByRole("heading", { name: "Operator Alerts" })).toBeVisible();

    await page.getByTestId("operator-events-filter-severity").selectOption("critical");
    await page.getByTestId("operator-events-filter-status").selectOption("open");
    await expect.poll(() => listLog.some((value) => value.includes("severity=critical"))).toBeTruthy();
    await expect.poll(() => listLog.some((value) => value.includes("status=open"))).toBeTruthy();

    await expect(page.getByText("Workflow failed after retries")).toBeVisible();
    await page.getByTestId("operator-events-ack-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await expect(page.getByTestId("operator-events-notice")).toContainText("acknowledged");
    await expect(page.getByTestId("operator-events-ack-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toHaveCount(0);

    await page.getByTestId("operator-events-resolve-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await expect(page.getByTestId("operator-events-notice")).toContainText("resolved");
    await expect(page.getByTestId("operator-events-resolve-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toHaveCount(0);

    expect(listLog.length).toBeGreaterThanOrEqual(2);
    expect(listLog.some((value) => value.includes("severity=critical"))).toBeTruthy();
    expect(listLog.some((value) => value.includes("status=open"))).toBeTruthy();
    expect(actionLog).toEqual([
      "ack:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "resolve:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    ]);
  });
});
