import { platformApiRequest } from "@grove/web-shared/api/platform";

import { getCallObservabilitySummary, type CallObservabilitySummaryResponse } from "@/lib/api/call-observability";
import type { ActiveCall } from "@/components/call-ops/escalation-modal";

type ActiveCallsResponse = {
  calls: ActiveCall[];
};

export type LiveKitTokenResponse = {
  room_name: string;
  token: string;
  expires_at: string;
};

type CallOpsResource<T> = { status: "success"; data: T } | { status: "error" };

export type CallOpsDashboardData = {
  calls: CallOpsResource<ActiveCall[]>;
  summary: CallOpsResource<CallObservabilitySummaryResponse>;
};

const EMPTY_CALLS: ActiveCall[] = [];

function toCallOpsResource<T>(result: PromiseSettledResult<T>): CallOpsResource<T> {
  if (result.status === "fulfilled") {
    return { status: "success", data: result.value };
  }
  return { status: "error" };
}

export async function getCallOpsDashboardData(): Promise<CallOpsDashboardData> {
  const [callsResult, summaryResult] = await Promise.allSettled([
    platformApiRequest<ActiveCallsResponse>("/calls/active"),
    getCallObservabilitySummary({ limit: 200 }),
  ]);

  return {
    calls:
      callsResult.status === "fulfilled"
        ? { status: "success", data: callsResult.value.calls || EMPTY_CALLS }
        : { status: "error" },
    summary: toCallOpsResource(summaryResult),
  };
}

export function mintLiveKitToken(callId: string, mode: "listen" | "join"): Promise<LiveKitTokenResponse> {
  if (mode === "listen") {
    return platformApiRequest<LiveKitTokenResponse>(`/calls/${encodeURIComponent(callId)}/livekit-token`, {
      method: "POST",
      body: "{}",
    });
  }
  return platformApiRequest<LiveKitTokenResponse>(
    `/calls/${encodeURIComponent(callId)}/livekit-operator-token`,
    {
      method: "POST",
      body: "{}",
    },
  );
}
