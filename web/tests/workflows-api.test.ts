import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getWorkflowExecutionDetail,
  getWorkflowExecutionSteps,
  listWorkflowExecutions,
  retryWorkflowExecution,
} from "@/lib/api/workflows";

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

describe("workflows api client", () => {
  it("lists workflow executions with status filter", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        executions: [],
        limit: 50,
      }),
    ) as typeof fetch;

    await listWorkflowExecutions({ status: "Failed", limit: 50 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/workflows/executions?status=Failed&limit=50",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads workflow detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        workflow_id: "sol.appointment_booking/send-reminder",
        run_id: "run-1",
        workflow_type: "sol.appointment_booking.send_reminder",
        execution_status: "Failed",
        started_at: null,
        closed_at: null,
        current_step: null,
        failed_step: "send_sms",
        error_summary: "sms unavailable",
        total_steps: 3,
        completed_steps: 2,
        retry_summary: {
          steps_with_retries: 1,
          total_retry_attempts: 1,
          max_attempt: 2,
        },
      }),
    ) as typeof fetch;

    await getWorkflowExecutionDetail("sol.appointment_booking/send-reminder", "run-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/workflows/executions/sol.appointment_booking%2Fsend-reminder/run-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads workflow steps", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        workflow_id: "wf-1",
        run_id: "run-1",
        steps: [],
      }),
    ) as typeof fetch;

    await getWorkflowExecutionSteps("wf-1", "run-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/workflows/executions/wf-1/run-1/steps",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("retries a workflow execution", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        source_workflow_id: "wf-1",
        source_run_id: "run-1",
        retry_workflow_id: "wf-1/retry-1234",
        retry_run_id: "run-2",
        status: "started",
      }),
    ) as typeof fetch;

    await retryWorkflowExecution("wf-1", "run-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/workflows/executions/wf-1/run-1/retry",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
