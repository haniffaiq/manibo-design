import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createConnector,
  listConnectorCatalog,
  listConnectors,
  runConnectorHealthCheck,
  updateConnector,
} from "@/lib/api/connectors";

const originalFetch = global.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("connectors api client", () => {
  it("lists connectors", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse([])) as typeof fetch;

    await listConnectors();

    expect(global.fetch).toHaveBeenCalledWith("/api/platform/connectors", expect.objectContaining({ method: "GET" }));
  });

  it("lists connector catalog entries", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse([])) as typeof fetch;

    await listConnectorCatalog();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/connectors/catalog",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates a connector", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ connector_id: "conn-1" })) as typeof fetch;

    await createConnector({
      connector_type: "crm",
      adapter_name: "hubspot",
      display_name: "HubSpot CRM",
      status: "active",
      config: { endpoint: "https://api.example.test" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/connectors",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          connector_type: "crm",
          adapter_name: "hubspot",
          display_name: "HubSpot CRM",
          status: "active",
          config: { endpoint: "https://api.example.test" },
        }),
      }),
    );
  });

  it("updates a connector", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ id: "conn-1" })) as typeof fetch;

    await updateConnector("conn-1", {
      display_name: "Updated CRM",
      status: "disabled",
      config: { endpoint: "https://api.example.test/v2" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/connectors/conn-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          display_name: "Updated CRM",
          status: "disabled",
          config: { endpoint: "https://api.example.test/v2" },
        }),
      }),
    );
  });

  it("runs a connector health check", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ connector_id: "conn-1", latest_health: null })) as typeof fetch;

    await runConnectorHealthCheck("conn-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/connectors/conn-1/health-check?wait=true",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
