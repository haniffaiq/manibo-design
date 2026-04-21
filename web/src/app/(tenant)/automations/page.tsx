"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Skeleton } from "@grove/ui/skeleton";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import {
  getWorkflowExecutionDetail,
  getWorkflowExecutionSteps,
  listWorkflowExecutions,
  retryWorkflowExecution,
  type WorkflowExecutionDetail,
  type WorkflowExecutionItem,
  type WorkflowExecutionStatus,
  type WorkflowExecutionStep,
  type WorkflowStepStatus,
} from "@/lib/api/workflows";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { observabilitySelectionHref } from "@/lib/observability-routes";
import { formatSolutionLabel } from "@/lib/solutions";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_EXECUTIONS: WorkflowExecutionItem[] = [];
const EMPTY_STEPS: WorkflowExecutionStep[] = [];

type StatusFilter = "all" | Exclude<WorkflowExecutionStatus, "Unknown">;

function humanizeToken(value: string): string {
  return value
    .replace(/[./-]/g, "_")
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function workflowLabel(workflowType: string): string {
  if (!workflowType) {
    return "Automation";
  }
  if (workflowType.startsWith("sol.")) {
    const parts = workflowType.split(".");
    const solutionLabel = formatSolutionLabel(parts[1] ?? "automation");
    const workflowName = parts.slice(2).map(humanizeToken).join(" ");
    return workflowName ? `${solutionLabel}: ${workflowName}` : solutionLabel;
  }
  const tail = workflowType.split(".").at(-1) ?? workflowType;
  return humanizeToken(tail);
}

function statusLabel(status: WorkflowExecutionStatus): string {
  if (status === "Running") {
    return "In progress";
  }
  if (status === "Failed") {
    return "Needs attention";
  }
  if (status === "Canceled" || status === "Terminated") {
    return "Stopped";
  }
  if (status === "TimedOut") {
    return "Timed out";
  }
  if (status === "ContinuedAsNew") {
    return "Continued";
  }
  return status;
}

function statusVariant(status: WorkflowExecutionStatus): "success" | "warning" | "error" | "neutral" {
  if (status === "Completed") {
    return "success";
  }
  if (status === "Running" || status === "ContinuedAsNew") {
    return "warning";
  }
  if (status === "Failed" || status === "TimedOut") {
    return "error";
  }
  return "neutral";
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

function formatDurationMs(value: number | null): string {
  if (value == null) {
    return "Not recorded";
  }
  if (value < 1000) {
    return `${value} ms`;
  }
  return `${(value / 1000).toFixed(1)} s`;
}

function formatStepLabel(step: WorkflowExecutionStep): string {
  return humanizeToken(step.action || step.step_id);
}

function canRetry(status: WorkflowExecutionStatus): boolean {
  return status === "Failed" || status === "Canceled" || status === "Terminated" || status === "TimedOut";
}

function stepStatusLabel(status: WorkflowStepStatus): string {
  if (status === "Running") {
    return "In progress";
  }
  if (status === "Failed") {
    return "Needs attention";
  }
  if (status === "TimedOut") {
    return "Timed out";
  }
  if (status === "Scheduled") {
    return "Queued";
  }
  return status;
}

function stepStatusVariant(status: WorkflowStepStatus): "success" | "warning" | "error" | "neutral" {
  if (status === "Completed") {
    return "success";
  }
  if (status === "Running" || status === "Scheduled") {
    return "warning";
  }
  if (status === "Failed" || status === "TimedOut") {
    return "error";
  }
  return "neutral";
}

export default function AutomationsPage() {
  const copy = useTenantCopy();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedExecutionKey, setSelectedExecutionKey] = useState<string | null>(null);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listKey = useMemo(() => swrKeys.workflowExecutions(statusFilter), [statusFilter]);
  const {
    data: executionsData,
    error: executionsError,
    isLoading: executionsLoading,
    mutate: mutateExecutions,
  } = useSWR(
    listKey,
    ([, nextStatusFilter]) =>
      listWorkflowExecutions({
        status: nextStatusFilter === "all" ? undefined : (nextStatusFilter as Exclude<WorkflowExecutionStatus, "Unknown">),
        limit: 50,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const executions = executionsData?.executions ?? EMPTY_EXECUTIONS;
  const activeExecution = useMemo(() => {
    if (!selectedExecutionKey) {
      return executions[0] ?? null;
    }
    return (
      executions.find((execution) => `${execution.workflow_id}:${execution.run_id}` === selectedExecutionKey) ??
      executions[0] ??
      null
    );
  }, [executions, selectedExecutionKey]);

  const detailKey = activeExecution
    ? swrKeys.workflowDetail(activeExecution.workflow_id, activeExecution.run_id)
    : null;
  const {
    data: detail,
    error: detailError,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR(
    detailKey,
    ([, workflowId, runId]) => getWorkflowExecutionDetail(workflowId, runId),
    { revalidateOnFocus: false },
  );

  const stepsKey = activeExecution ? swrKeys.workflowSteps(activeExecution.workflow_id, activeExecution.run_id) : null;
  const {
    data: stepsData,
    error: stepsError,
    isLoading: stepsLoading,
    mutate: mutateSteps,
  } = useSWR(
    stepsKey,
    ([, workflowId, runId]) => getWorkflowExecutionSteps(workflowId, runId),
    { revalidateOnFocus: false },
  );

  const steps = stepsData?.steps ?? EMPTY_STEPS;
  const failedCount = executions.filter((execution) =>
    execution.execution_status === "Failed" ||
    execution.execution_status === "TimedOut" ||
    execution.execution_status === "Canceled" ||
    execution.execution_status === "Terminated",
  ).length;
  const runningCount = executions.filter((execution) => execution.execution_status === "Running").length;
  const completedCount = executions.filter((execution) => execution.execution_status === "Completed").length;

  async function handleRetry(currentDetail: WorkflowExecutionDetail): Promise<void> {
    const key = `${currentDetail.workflow_id}:${currentDetail.run_id}`;
    setRetryingKey(key);
    setActionNotice(null);
    setActionError(null);
    try {
      const response = await retryWorkflowExecution(currentDetail.workflow_id, currentDetail.run_id);
      await Promise.all([mutateExecutions(), mutateDetail(), mutateSteps()]);
      setActionNotice(
        `Started a new run for ${workflowLabel(currentDetail.workflow_type)}. Reference: ${response.retry_workflow_id}.`,
      );
    } catch (error) {
      setActionError(toErrorMessage(error));
    } finally {
      setRetryingKey(null);
    }
  }

  return (
    <PageFrame className="px-6 py-8">
      <PageHeader title={copy.automations.title} description={copy.automations.description} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">Needs attention</p></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{failedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">In progress</p></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{runningCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">Completed recently</p></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{completedCount}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Recent runs</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  Focus on runs that stopped unexpectedly or are taking too long.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="workflow-status-filter" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Status
                </label>
                <select
                  id="workflow-status-filter"
                  data-testid="automations-status-filter"
                  className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.currentTarget.value as StatusFilter)}
                >
                  <option value="all">All runs</option>
                  <option value="Running">In progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Needs attention</option>
                  <option value="TimedOut">Timed out</option>
                  <option value="Canceled">Stopped</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {executionsError ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
                {toErrorMessage(executionsError)}
              </div>
            ) : null}
            {executionsLoading ? (
              <div className="space-y-3" role="status" aria-label="Loading">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}
            {!executionsLoading && executions.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-6 text-sm text-[var(--color-neutral-600)]">
                No automation runs match this filter yet.
              </div>
            ) : null}
            <div className="space-y-3" role="status" aria-label="Loading">
              {executions.map((execution) => {
                const executionKey = `${execution.workflow_id}:${execution.run_id}`;
                const isActive = activeExecution?.workflow_id === execution.workflow_id && activeExecution?.run_id === execution.run_id;
                return (
                  <button
                    key={executionKey}
                    type="button"
                    data-testid={`automation-open-${execution.workflow_id}-${execution.run_id}`}
                    className={`w-full rounded-[var(--radius-lg)] border p-4 text-left transition-colors ${
                      isActive
                        ? "border-[var(--color-primary-300)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-200)] hover:bg-[var(--color-bg-subtle)]"
                    }`}
                    onClick={() => setSelectedExecutionKey(executionKey)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--color-neutral-900)]">{workflowLabel(execution.workflow_type)}</p>
                        <p className="text-xs text-[var(--color-neutral-500)]">
                          Started {formatDateTime(execution.started_at)}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-500)]">
                          Finished {formatDateTime(execution.closed_at)}
                        </p>
                      </div>
                      <Badge variant={statusVariant(execution.execution_status)}>{statusLabel(execution.execution_status)}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Run detail</h2>
                  <p className="text-sm text-[var(--color-neutral-500)]">
                    Open one run to see where it stopped and whether it is safe to try again.
                  </p>
                </div>
                {detail ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={observabilitySelectionHref("tenant", {
                        kind: "workflow_run",
                        subjectId: `${detail.workflow_id}/${detail.run_id}`,
                        workflowId: detail.workflow_id,
                        runId: detail.run_id,
                      })}
                      data-testid="automations-open-observability"
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                    >
                      Open in observability
                    </Link>
                    {canRetry(detail.execution_status) ? (
                      <Button
                        data-testid="automations-retry"
                        disabled={retryingKey === `${detail.workflow_id}:${detail.run_id}`}
                        onClick={() => handleRetry(detail)}
                      >
                        {retryingKey === `${detail.workflow_id}:${detail.run_id}` ? "Starting…" : "Try again"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionNotice ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">
                  {actionNotice}
                </div>
              ) : null}
              {actionError ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
                  {actionError}
                </div>
              ) : null}
              {detailError ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
                  {toErrorMessage(detailError)}
                </div>
              ) : null}
              {detailLoading ? (
                <div className="space-y-3" role="status" aria-label="Loading">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}
              {!detailLoading && !detail ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-6 text-sm text-[var(--color-neutral-600)]">
                  Pick a run to see what happened.
                </div>
              ) : null}
              {detail ? (
                <>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-[var(--color-neutral-900)]">{workflowLabel(detail.workflow_type)}</p>
                      <Badge variant={statusVariant(detail.execution_status)}>{statusLabel(detail.execution_status)}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-neutral-500)]">
                      Started {formatDateTime(detail.started_at)} · Finished {formatDateTime(detail.closed_at)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">Current stage</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">
                        {detail.current_step ? humanizeToken(detail.current_step) : "No active step"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">Problem stage</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">
                        {detail.failed_step ? humanizeToken(detail.failed_step) : "No failed step recorded"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">Steps finished</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">
                        {detail.completed_steps} of {detail.total_steps}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">Retries used</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">
                        {detail.retry_summary.total_retry_attempts}
                      </p>
                    </div>
                  </div>

                  {detail.error_summary ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-500)] bg-[var(--color-warning-50)] px-4 py-3 text-sm text-[var(--color-warning-800)]">
                      <p className="font-medium">What needs attention</p>
                      <p className="mt-1">{detail.error_summary}</p>
                    </div>
                  ) : null}

                  <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-[var(--color-neutral-900)]">
                      Support reference
                    </summary>
                    <div className="mt-3 space-y-1 text-xs text-[var(--color-neutral-600)]">
                      <p>Workflow ID: {detail.workflow_id}</p>
                      <p>Run ID: {detail.run_id}</p>
                      <p>Workflow type: {detail.workflow_type}</p>
                    </div>
                  </details>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Step timeline</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  Review the order of steps and where retries happened.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stepsError ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
                  {toErrorMessage(stepsError)}
                </div>
              ) : null}
              {stepsLoading ? (
                <div className="space-y-3" role="status" aria-label="Loading">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}
              {!stepsLoading && steps.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-6 text-sm text-[var(--color-neutral-600)]">
                  No step history is available for this run yet.
                </div>
              ) : null}
              <ol className="space-y-3">
                {steps.map((step) => (
                  <li
                    key={`${step.sequence}-${step.step_id}`}
                    data-testid={`automation-step-${step.sequence}`}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--color-neutral-900)]">
                          {step.sequence}. {formatStepLabel(step)}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-500)]">
                          Attempt {step.attempt} · Took {formatDurationMs(step.duration_ms)}
                        </p>
                      </div>
                      <Badge variant={stepStatusVariant(step.status)}>{stepStatusLabel(step.status)}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[var(--color-neutral-600)] sm:grid-cols-2">
                      <p>Started: {formatDateTime(step.started_at)}</p>
                      <p>Finished: {formatDateTime(step.ended_at)}</p>
                    </div>
                    {step.retry_state ? (
                      <p className="mt-3 text-sm text-[var(--color-neutral-600)]">Retry state: {humanizeToken(step.retry_state)}</p>
                    ) : null}
                    {step.error_detail ? (
                      <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-warning-500)] bg-[var(--color-warning-50)] px-3 py-2 text-sm text-[var(--color-warning-800)]">
                        {step.error_detail}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}
