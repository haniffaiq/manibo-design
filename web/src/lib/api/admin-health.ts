import { platformApiRequest } from "@/lib/api/platform";

export type WorkerHealthStatus = "healthy" | "degraded" | "unconfigured";

export interface PlatformHealthResponse {
  checked_at: string;
  call_error_rate: number | null;
  average_call_duration_seconds: number | null;
  active_calls: {
    voice_call: number;
    inbound_call: number;
    total: number;
  };
  worker_status: {
    platform_api: WorkerHealthStatus;
    temporal: WorkerHealthStatus;
    temporal_error: string | null;
  };
}

export interface PlatformHealthQuery {
  start?: string;
  end?: string;
  bucket?: "hour" | "day" | "week" | "month";
}

export function getPlatformHealth(query: PlatformHealthQuery = {}): Promise<PlatformHealthResponse> {
  const params = new URLSearchParams();
  if (query.start) {
    params.set("start", query.start);
  }
  if (query.end) {
    params.set("end", query.end);
  }
  if (query.bucket) {
    params.set("bucket", query.bucket);
  }

  const suffix = params.toString();
  const path = `/admin/reports/platform-health${suffix ? `?${suffix}` : ""}`;
  return platformApiRequest<PlatformHealthResponse>(path, { method: "GET" });
}
