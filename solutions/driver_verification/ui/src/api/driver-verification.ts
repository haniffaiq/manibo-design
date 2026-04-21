import { PlatformApiError, platformApiRequest } from "@grove/web-shared/api/platform";

import type {
  DriverRecord,
  ListDriversResponse,
  DriverVerificationJobSummary,
  DriverVerificationJobsListResponse,
} from "@grove/web-shared/types/driver";

export type {
  DriverRecord,
  ListDriversResponse,
  DriverVerificationJobSummary,
  DriverVerificationJobsListResponse,
} from "@grove/web-shared/types/driver";

export interface ListDriversQuery {
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface DriverImportError {
  row_number: number;
  field: string;
  message: string;
}

export interface DriverImportResponse {
  dry_run: boolean;
  rows_received: number;
  rows_valid: number;
  created: number;
  updated: number;
  errors: DriverImportError[];
}

export interface DriverImportResult extends DriverImportResponse {
  status: number;
}

export interface UpdateDriverRequest {
  name?: string | null;
  phone?: string | null;
  active?: boolean;
}

export interface DriverStatusResponse {
  driver_id: string;
  job_id: string;
  source_provider: string;
  telematics_status: string | null;
  telematics_occurred_at: string | null;
  telematics_position: Record<string, unknown>;
  telematics_snapshot: Record<string, unknown>;
}

export interface DriverVerificationJobDetail extends DriverVerificationJobSummary {
  telematics_status: string | null;
  telematics_occurred_at: string | null;
  telematics_snapshot: Record<string, unknown>;
  extracted_fields: Record<string, unknown>;
}

export interface ListDriverVerificationJobsQuery {
  limit?: number;
  offset?: number;
}

function buildQuery<T extends object>(params: T): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const suffix = searchParams.toString();
  return suffix.length > 0 ? `?${suffix}` : "";
}

function formatImportErrorMessage(status: number, statusText: string, detail: string | null): string {
  if (detail && detail.trim().length > 0) {
    return `${status} ${statusText}: ${detail}`;
  }
  return `${status} ${statusText}`;
}

async function parseImportPayload(response: Response): Promise<DriverImportResponse> {
  const raw = await response.text();
  if (!raw) {
    return {
      dry_run: false,
      rows_received: 0,
      rows_valid: 0,
      created: 0,
      updated: 0,
      errors: [],
    };
  }

  try {
    return JSON.parse(raw) as DriverImportResponse;
  } catch {
    throw new PlatformApiError(formatImportErrorMessage(response.status, response.statusText, raw), response.status);
  }
}

export function listDrivers(query: ListDriversQuery = {}): Promise<ListDriversResponse> {
  const suffix = buildQuery(query);
  return platformApiRequest<ListDriversResponse>(`/drivers${suffix}`, { method: "GET" });
}

export async function importDriversCsv(csv: string, options: { dryRun?: boolean } = {}): Promise<DriverImportResult> {
  const suffix = options.dryRun ? "?dry_run=true" : "";
  const response = await fetch(`/api/platform/drivers/import${suffix}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
    },
    body: csv,
  });

  const payload = await parseImportPayload(response);
  if (response.status !== 200 && response.status !== 400) {
    const detail = payload.errors[0]?.message ?? null;
    throw new PlatformApiError(formatImportErrorMessage(response.status, response.statusText, detail), response.status);
  }

  return {
    ...payload,
    status: response.status,
  };
}

export function getDriver(driverId: string): Promise<DriverRecord> {
  return platformApiRequest<DriverRecord>(`/drivers/${encodeURIComponent(driverId)}`, { method: "GET" });
}

export function updateDriver(driverId: string, payload: UpdateDriverRequest): Promise<DriverRecord> {
  return platformApiRequest<DriverRecord>(`/drivers/${encodeURIComponent(driverId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getDriverStatus(driverId: string): Promise<DriverStatusResponse> {
  return platformApiRequest<DriverStatusResponse>(`/drivers/${encodeURIComponent(driverId)}/status`, { method: "GET" });
}

export function listDriverVerificationJobs(
  query: ListDriverVerificationJobsQuery = {},
): Promise<DriverVerificationJobsListResponse> {
  const suffix = buildQuery(query);
  return platformApiRequest<DriverVerificationJobsListResponse>(`/driver-verification/jobs${suffix}`, { method: "GET" });
}

export function getDriverVerificationJob(jobId: string): Promise<DriverVerificationJobDetail> {
  return platformApiRequest<DriverVerificationJobDetail>(`/driver-verification/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
}
