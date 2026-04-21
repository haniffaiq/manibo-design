import { platformApiRequest } from "@/lib/api/platform";

export type WorkflowExecutionStatus =
  | "Running"
  | "Completed"
  | "Failed"
  | "Canceled"
  | "Terminated"
  | "TimedOut"
  | "ContinuedAsNew"
  | "Unknown";

export type WorkflowStepStatus = "Scheduled" | "Running" | "Completed" | "Failed" | "Canceled" | "TimedOut";

export interface WorkflowExecutionItem {
  workflow_id: string;
  run_id: string;
  workflow_type: string;
  execution_status: WorkflowExecutionStatus;
  started_at: string | null;
  closed_at: string | null;
}

export interface WorkflowExecutionsResponse {
  executions: WorkflowExecutionItem[];
  limit: number;
}

export interface WorkflowExecutionRetrySummary {
  steps_with_retries: number;
  total_retry_attempts: number;
  max_attempt: number;
}

export interface WorkflowExecutionDetail {
  workflow_id: string;
  run_id: string;
  workflow_type: string;
  execution_status: WorkflowExecutionStatus;
  started_at: string | null;
  closed_at: string | null;
  current_step: string | null;
  failed_step: string | null;
  error_summary: string | null;
  total_steps: number;
  completed_steps: number;
  retry_summary: WorkflowExecutionRetrySummary;
}

export interface WorkflowExecutionStep {
  sequence: number;
  step_id: string;
  action: string;
  status: WorkflowStepStatus;
  attempt: number;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  error_detail: string | null;
  retry_state: string | null;
}

export interface WorkflowExecutionStepsResponse {
  workflow_id: string;
  run_id: string;
  steps: WorkflowExecutionStep[];
}

export interface RetryWorkflowExecutionResponse {
  source_workflow_id: string;
  source_run_id: string;
  retry_workflow_id: string;
  retry_run_id: string;
  status: string;
}

export interface ListWorkflowExecutionsQuery {
  status?: Exclude<WorkflowExecutionStatus, "Unknown">;
  limit?: number;
}

export function listWorkflowExecutions(query: ListWorkflowExecutionsQuery = {}): Promise<WorkflowExecutionsResponse> {
  const params = new URLSearchParams();
  if (query.status) {
    params.set("status", query.status);
  }
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }
  const suffix = params.toString();
  return platformApiRequest<WorkflowExecutionsResponse>(`/workflows/executions${suffix ? `?${suffix}` : ""}`, {
    method: "GET",
  });
}

export function getWorkflowExecutionDetail(workflowId: string, runId: string): Promise<WorkflowExecutionDetail> {
  return platformApiRequest<WorkflowExecutionDetail>(
    `/workflows/executions/${encodeURIComponent(workflowId)}/${encodeURIComponent(runId)}`,
    { method: "GET" },
  );
}

export function getWorkflowExecutionSteps(workflowId: string, runId: string): Promise<WorkflowExecutionStepsResponse> {
  return platformApiRequest<WorkflowExecutionStepsResponse>(
    `/workflows/executions/${encodeURIComponent(workflowId)}/${encodeURIComponent(runId)}/steps`,
    { method: "GET" },
  );
}

export function retryWorkflowExecution(workflowId: string, runId: string): Promise<RetryWorkflowExecutionResponse> {
  return platformApiRequest<RetryWorkflowExecutionResponse>(
    `/workflows/executions/${encodeURIComponent(workflowId)}/${encodeURIComponent(runId)}/retry`,
    { method: "POST" },
  );
}
