import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CallTraceSummaryResponse } from "@/lib/api/call-observability";

const mocks = vi.hoisted(() => ({
  getAdminCallTrace: vi.fn(),
  getCallTrace: vi.fn(),
}));

vi.mock("@/lib/api/call-observability", () => ({
  getAdminCallTrace: mocks.getAdminCallTrace,
  getCallTrace: mocks.getCallTrace,
}));

import { useCallTrace } from "@/lib/realtime/use-call-trace";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 } },
    children,
  );
}

function makeTraceResponse(overrides: Partial<CallTraceSummaryResponse> = {}): CallTraceSummaryResponse {
  return {
    call_id: overrides.call_id ?? "call-1",
    has_trace_context: false,
    trace_context: overrides.trace_context ?? {
      source: "none",
      correlation_id: null,
      traceparent: null,
      trace_id: null,
      parent_span_id: null,
      tracestate: null,
    },
    event_count: overrides.event_count ?? 0,
    first_event_at_ms: overrides.first_event_at_ms ?? null,
    last_event_at_ms: overrides.last_event_at_ms ?? null,
    stack: overrides.stack ?? null,
    nodes: overrides.nodes ?? [],
    routes: overrides.routes ?? [],
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useCallTrace", () => {
  it("returns empty state when callId is null", () => {
    const { result } = renderHook(() => useCallTrace(null, false), { wrapper });

    expect(result.current.nodes).toEqual([]);
    expect(result.current.routes).toEqual([]);
    expect(result.current.stack).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isValidating).toBe(false);
  });

  it("uses the admin trace route with tool payloads when requested", async () => {
    mocks.getAdminCallTrace.mockResolvedValueOnce(
      makeTraceResponse({
        nodes: [
          {
            graph_type: "voice",
            node_name: "booking",
            started_at_ms: 100,
            completed_at_ms: 200,
            latency_ms: 100,
            ttft_ms: 20,
            route: null,
            next_node_name: null,
            llm_roundtrips: 1,
            retry_count: 0,
            tools_called: ["search_clinics"],
            prompt_tokens: 10,
            completion_tokens: 5,
            tool_io: [
              {
                tool_name: "search_clinics",
                tool_args: { city: "Vilnius", api_key: "[REDACTED]" },
                tool_result: { access_token: "[REDACTED]", status: "ok" },
                duration_ms: 48,
                status: "success",
                error_detail: null,
              },
            ],
          },
        ],
      }),
    );

    const { result } = renderHook(
      () =>
        useCallTrace("call-1", false, {
          adminTenantId: "tenant-admin-1",
          includeToolPayloads: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.getAdminCallTrace).toHaveBeenCalledTimes(1);
    expect(mocks.getAdminCallTrace).toHaveBeenCalledWith("tenant-admin-1", "call-1", {
      includeToolPayloads: true,
    });
    expect(mocks.getCallTrace).not.toHaveBeenCalled();
    expect(result.current.nodes[0]?.tool_io[0]?.tool_args).toEqual({
      city: "Vilnius",
      api_key: "[REDACTED]",
    });
  });
});
