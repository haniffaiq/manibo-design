import { afterEach, describe, expect, it, vi } from "vitest";
import * as driverVerificationApi from "../src/api/driver-verification";

type AsyncApiFunction = (...args: unknown[]) => Promise<unknown>;

type DriverVerificationApiModule = {
  getDriverStatus: AsyncApiFunction;
  getDriverVerificationJob: AsyncApiFunction;
  importDriversCsv: AsyncApiFunction;
  listDriverVerificationJobs: AsyncApiFunction;
  listDrivers: AsyncApiFunction;
  updateDriver: AsyncApiFunction;
};

const originalFetch = globalThis.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("driver verification api client", () => {
  it("lists drivers with filters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        drivers: [],
        total: 0,
        limit: 100,
        offset: 0,
      }),
    ) as typeof fetch;

    await driverVerificationApi.listDrivers({ active: true, limit: 100, offset: 0 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/drivers?active=true&limit=100&offset=0",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns structured import validation errors on bad csv", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse(
        {
          dry_run: true,
          rows_received: 1,
          rows_valid: 0,
          created: 0,
          updated: 0,
          errors: [{ row_number: 2, field: "phone", message: "phone must be E.164 (e.g. +15551234567)" }],
        },
        { status: 400, statusText: "Bad Request" },
      ),
    ) as typeof fetch;

    const result = (await driverVerificationApi.importDriversCsv("driver_id,phone\ndrv-1,5551234567\n", {
      dryRun: true,
    })) as { status: number; errors: Array<{ field?: string }> };

    expect(result.status).toBe(400);
    expect(result.errors[0]?.field).toBe("phone");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/drivers/import?dry_run=true",
      expect.objectContaining({ method: "POST", body: "driver_id,phone\ndrv-1,5551234567\n" }),
    );
  });

  it("updates driver details", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({ driver_id: "drv-1", name: "Driver One", phone: "+37061234567", active: true }),
    ) as typeof fetch;

    await driverVerificationApi.updateDriver("drv-1", { name: "Driver One" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/drivers/drv-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ name: "Driver One" }) }),
    );
  });

  it("loads latest driver status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        driver_id: "drv-1",
        job_id: "job-1",
        source_provider: "fleet_hand",
        telematics_status: "unloading",
        telematics_occurred_at: "2026-03-06T08:00:00Z",
        telematics_position: { label: "Vilnius" },
        telematics_snapshot: { location: "Vilnius" },
      }),
    ) as typeof fetch;

    await driverVerificationApi.getDriverStatus("drv-1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/drivers/drv-1/status",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists and loads driver verification jobs", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({
          jobs: [],
          total: 0,
          limit: 50,
          offset: 0,
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          job_id: "job-1",
          driver_id: "drv-1",
          driver_name: "Driver One",
          status: "completed",
          scheduled_at: "2026-03-06T09:00:00Z",
          attempt_count: 1,
          last_error: null,
          call_id: "call-1",
          call_started_at: "2026-03-06T09:01:00Z",
          call_ended_at: "2026-03-06T09:03:00Z",
          outcome: "confirmed",
          discrepancy_flags: {},
          telematics_status: "on_time",
          telematics_occurred_at: "2026-03-06T09:00:00Z",
          telematics_snapshot: {},
          extracted_fields: {},
        }),
      ) as typeof fetch;

    await driverVerificationApi.listDriverVerificationJobs({ limit: 50, offset: 0 });
    await driverVerificationApi.getDriverVerificationJob("job-1");

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/platform/driver-verification/jobs?limit=50&offset=0",
      expect.objectContaining({ method: "GET" }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/platform/driver-verification/jobs/job-1",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
