export interface DriverRecord {
  driver_id: string;
  name: string | null;
  phone: string | null;
  active: boolean;
}

export interface ListDriversResponse {
  drivers: DriverRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface DriverVerificationJobSummary {
  job_id: string;
  driver_id: string;
  driver_name: string | null;
  status: string;
  scheduled_at: string | null;
  attempt_count: number;
  last_error: string | null;
  call_id: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  outcome: string | null;
  discrepancy_flags: Record<string, unknown>;
}

export interface DriverVerificationJobsListResponse {
  jobs: DriverVerificationJobSummary[];
  total: number;
  limit: number;
  offset: number;
}
