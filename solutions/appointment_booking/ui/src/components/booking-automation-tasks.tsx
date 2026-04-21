"use client";

import { useState } from "react";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";

import {
  completeClinicAutomationAction,
  failClinicAutomationAction,
  type ClinicAutomationActionStatus,
  type ClinicPostCallAutomationStatusResponse,
} from "../api/clinic-bookings";
import {
  automationExecutionLabel,
  automationExecutionVariant,
  automationManualPanelCopy,
  automationModeLabel,
  automationReadinessLabel,
  automationReadinessVariant,
  automationRecordedLabel,
  defaultAutomationActionNote,
  shouldShowManualAutomationControls,
  toErrorMessage,
} from "./booking-detail-helpers";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BookingAutomationTasksProps {
  activeCallId: string | null;
  automationData: ClinicPostCallAutomationStatusResponse | undefined;
  automationLoading: boolean;
  automationError: unknown;
  mutateAutomationData: () => Promise<unknown>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BookingAutomationTasks({
  activeCallId,
  automationData,
  automationLoading,
  automationError,
  mutateAutomationData,
}: BookingAutomationTasksProps) {
  const [automationActionBusy, setAutomationActionBusy] = useState<string | null>(null);
  const [automationActionError, setAutomationActionError] = useState<string | null>(null);
  const [automationActionNotice, setAutomationActionNotice] = useState<string | null>(null);
  const [automationActionNotes, setAutomationActionNotes] = useState<Record<string, string>>({});

  async function runAutomationAction(
    action: ClinicAutomationActionStatus,
    mode: "complete" | "fail",
  ): Promise<void> {
    if (!activeCallId) {
      return;
    }
    const busyKey = `${action.action_id}:${mode}`;
    const statusDetail = automationActionNotes[action.action_id]?.trim() || defaultAutomationActionNote(action, mode);
    setAutomationActionBusy(busyKey);
    setAutomationActionError(null);
    setAutomationActionNotice(null);
    try {
      if (mode === "complete") {
        await completeClinicAutomationAction(activeCallId, action.action_id, {
          status_detail: statusDetail,
        });
        setAutomationActionNotice(`${action.label} is now marked done for this booking.`);
      } else {
        await failClinicAutomationAction(activeCallId, action.action_id, {
          status_detail: statusDetail,
        });
        setAutomationActionNotice(`${action.label} is now marked as blocked or failed for this booking.`);
      }
      await mutateAutomationData();
    } catch (error) {
      setAutomationActionError(toErrorMessage(error));
    } finally {
      setAutomationActionBusy(null);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">After-call tasks</h3>
      {automationError ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
          {toErrorMessage(automationError)}
        </div>
      ) : automationLoading || !automationData ? (
        <p className="mt-3 text-sm text-[var(--color-neutral-500)]">Loading post-call tasks...</p>
      ) : (
        <div className="mt-3 space-y-3">
          {automationActionNotice ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">
              {automationActionNotice}
            </div>
          ) : null}
          {automationActionError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
              {automationActionError}
            </div>
          ) : null}
          {automationData.actions.map((action: ClinicAutomationActionStatus) => {
            const recordedLabel = automationRecordedLabel(action);
            const modeLabel = automationModeLabel(action.execution_mode);
            const manualPanelCopy = automationManualPanelCopy(action);

            return (
              <div
                key={action.action_id}
                data-testid={`clinic-automation-card-${action.action_id}`}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--color-neutral-900)]">{action.label}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={automationExecutionVariant(action.execution_status)}>
                      {automationExecutionLabel(action)}
                    </Badge>
                    <Badge variant={automationReadinessVariant(action.readiness_status)}>
                      {automationReadinessLabel(action.readiness_status)}
                    </Badge>
                    {modeLabel ? <Badge variant="neutral">{modeLabel}</Badge> : null}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{action.status_detail}</p>
                {action.connector_display_name ? (
                  <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                    Routed through {action.connector_display_name}
                    {action.channel ? ` (${action.channel.toUpperCase()})` : ""}.
                  </p>
                ) : null}
                {recordedLabel ? (
                  <p className="mt-2 text-xs text-[var(--color-neutral-500)]">{recordedLabel}</p>
                ) : null}
                {shouldShowManualAutomationControls(automationData.booking_status, action) ? (
                  <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--color-neutral-900)]">{manualPanelCopy.title}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {manualPanelCopy.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor={`clinic-automation-note-${action.action_id}`}
                        className="text-sm font-medium text-[var(--color-neutral-700)]"
                      >
                        What happened?
                      </label>
                      <textarea
                        id={`clinic-automation-note-${action.action_id}`}
                        data-testid={`clinic-automation-note-${action.action_id}`}
                        className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-neutral-900)]"
                        placeholder={defaultAutomationActionNote(action, "complete")}
                        value={automationActionNotes[action.action_id] ?? ""}
                        disabled={automationActionBusy !== null}
                        onChange={(event) => {
                          const nextValue = event.currentTarget.value;
                          setAutomationActionNotes((current) => ({
                            ...current,
                            [action.action_id]: nextValue,
                          }));
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        data-testid={`clinic-automation-complete-${action.action_id}`}
                        disabled={automationActionBusy !== null}
                        onClick={() => void runAutomationAction(action, "complete")}
                      >
                        {automationActionBusy === `${action.action_id}:complete`
                          ? "Saving..."
                          : "Mark done outside the platform"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`clinic-automation-fail-${action.action_id}`}
                        disabled={automationActionBusy !== null}
                        onClick={() => void runAutomationAction(action, "fail")}
                      >
                        {automationActionBusy === `${action.action_id}:fail`
                          ? "Saving..."
                          : "Record a problem"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
