import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CallLatencyResponse } from "@/lib/api/call-observability";

const mocks = vi.hoisted(() => ({
  getAdminCallLatency: vi.fn(),
  getCallLatency: vi.fn(),
}));

vi.mock("@/lib/api/call-observability", () => ({
  getAdminCallLatency: mocks.getAdminCallLatency,
  getCallLatency: mocks.getCallLatency,
}));

import { useCallLatency } from "@/lib/realtime/use-call-latency";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 } },
    children,
  );
}

function makeLatencyResponse(overrides: Partial<CallLatencyResponse> = {}): CallLatencyResponse {
  return {
    call_id: overrides.call_id ?? "call-1",
    source: "persisted_metadata",
    has_latency_data: true,
    turns: overrides.turns ?? [],
    summaries: overrides.summaries ?? {},
    stack: overrides.stack ?? null,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useCallLatency", () => {
  it("returns empty state when callId is null", () => {
    const { result } = renderHook(() => useCallLatency(null, false), { wrapper });

    expect(result.current.turns).toEqual([]);
    expect(result.current.summaries).toEqual({});
    expect(result.current.stack).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isValidating).toBe(false);
    expect(mocks.getCallLatency).not.toHaveBeenCalled();
  });

  it("fetches on mount for historical calls", async () => {
    const response = makeLatencyResponse({
      turns: [
        {
          turn_index: 0,
          user_speech_started_at_ms: 100,
          user_speech_ended_at_ms: 500,
          user_final_transcript_at_ms: 600,
          user_final_transcript_chars: 20,
          stt_duration_ms: 100,
          llm_start_at_ms: 610,
          llm_ttft_at_ms: 700,
          llm_duration_ms: 200,
          agent_speaking_started_at_ms: 750,
          agent_speaking_ended_at_ms: 1200,
          tts_ttfb_ms: 40,
          tts_duration_ms: 450,
          stt_finalize_delay_ms: 10,
          eot_to_llm_start_ms: 10,
          llm_ttft_ms: 90,
          eot_to_agent_speak_ms: 150,
          first_speech_latency_ms: 250,
          tts_pre_speech_gap_ms: 50,
          user_interrupted_agent: false,
          interruption_started_at_ms: null,
          agent_stop_after_interrupt_ms: null,
          speech_overlap_duration_ms: null,
          tool_executions: [],
        },
      ],
    });
    mocks.getCallLatency.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useCallLatency("call-1", false), { wrapper });

    await waitFor(() => {
      expect(result.current.turns).toHaveLength(1);
    });

    expect(result.current.turns[0].turn_index).toBe(0);
    expect(mocks.getCallLatency).toHaveBeenCalledTimes(1);
    expect(mocks.getCallLatency).toHaveBeenCalledWith("call-1");
  });

  it("uses the admin latency route when an admin tenant id is provided", async () => {
    const response = makeLatencyResponse();
    mocks.getAdminCallLatency.mockResolvedValueOnce(response);

    const { result } = renderHook(
      () => useCallLatency("call-1", false, { adminTenantId: "tenant-admin-1" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.getAdminCallLatency).toHaveBeenCalledTimes(1);
    expect(mocks.getAdminCallLatency).toHaveBeenCalledWith("tenant-admin-1", "call-1");
    expect(mocks.getCallLatency).not.toHaveBeenCalled();
  });

  it("configures SWR with refreshInterval 3000 when isLive is true", async () => {
    // We verify that the hook passes refreshInterval: 3000 for live calls
    // by checking that after an initial fetch, SWR will re-fetch.
    // Use shouldAdvanceTime so promise resolution still works.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const response = makeLatencyResponse();
    mocks.getCallLatency.mockResolvedValue(response);

    renderHook(() => useCallLatency("call-1", true), { wrapper });

    // Wait for the initial fetch.
    await waitFor(() => {
      expect(mocks.getCallLatency).toHaveBeenCalledTimes(1);
    });

    // Advance past the 3s polling interval.
    vi.advanceTimersByTime(3200);

    await waitFor(() => {
      expect(mocks.getCallLatency).toHaveBeenCalledTimes(2);
    });
  });

  it("does not poll when isLive is false", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const response = makeLatencyResponse();
    mocks.getCallLatency.mockResolvedValue(response);

    renderHook(() => useCallLatency("call-1", false), { wrapper });

    await waitFor(() => {
      expect(mocks.getCallLatency).toHaveBeenCalledTimes(1);
    });

    // Advance well past a polling interval; no second call expected.
    vi.advanceTimersByTime(10_000);

    // Give SWR a tick to ensure it doesn't fire.
    await waitFor(() => {
      expect(mocks.getCallLatency).toHaveBeenCalledTimes(1);
    });
  });

  it("performs a final revalidation when isLive transitions to false", async () => {
    const response = makeLatencyResponse();
    mocks.getCallLatency.mockResolvedValue(response);

    const { result, rerender } = renderHook(
      ({ callId, isLive }: { callId: string | null; isLive: boolean }) => useCallLatency(callId, isLive),
      { wrapper, initialProps: { callId: "call-1", isLive: true } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterMount = mocks.getCallLatency.mock.calls.length;

    // Transition live -> historical: should trigger one final revalidation.
    rerender({ callId: "call-1", isLive: false });

    await waitFor(() => {
      expect(mocks.getCallLatency).toHaveBeenCalledTimes(callCountAfterMount + 1);
    });
  });

  it("surfaces errors from the fetcher", async () => {
    mocks.getCallLatency.mockRejectedValueOnce(new Error("network failure"));

    const { result } = renderHook(() => useCallLatency("call-1", false), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toBe("network failure");
    expect(result.current.turns).toEqual([]);
  });

  it("reports loading state while fetching", async () => {
    let resolvePromise: ((v: CallLatencyResponse) => void) | undefined;
    mocks.getCallLatency.mockReturnValueOnce(
      new Promise<CallLatencyResponse>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useCallLatency("call-1", false), { wrapper });

    // Initially loading.
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the fetch.
    resolvePromise!(makeLatencyResponse());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
