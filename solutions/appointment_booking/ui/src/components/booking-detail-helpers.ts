"use client";

import { PlatformApiError } from "@grove/web-shared/api/platform";

import type {
  ClinicAutomationActionStatus,
  ClinicBookingStatus,
  ClinicFollowUpPriority,
  ClinicFollowUpQueueItem,
  ClinicFollowUpStatus,
} from "../api/clinic-bookings";
import type { TeamUser } from "@/lib/api/team";

/* ------------------------------------------------------------------ */
/*  Generic formatters                                                 */
/* ------------------------------------------------------------------ */

export function toErrorMessage(error: unknown): string {
  if (error instanceof PlatformApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Not confirmed";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function formatMoney(value: number | null): string {
  if (value == null) {
    return "Not set";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(value);
}

export function humanizeReason(reason: string | null): string | null {
  if (!reason) {
    return null;
  }
  return reason
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTeamMemberLabel(user: TeamUser): string {
  const label = user.display_name?.trim();
  if (label) {
    return `${label} (${user.email})`;
  }
  return user.email;
}

/* ------------------------------------------------------------------ */
/*  Booking status helpers                                             */
/* ------------------------------------------------------------------ */

export function statusLabel(status: ClinicBookingStatus): string {
  if (status === "confirmed") {
    return "Booking confirmed";
  }
  if (status === "pending") {
    return "Waiting for follow-up";
  }
  if (status === "failed") {
    return "Booking failed";
  }
  return "Handed to staff";
}

export function statusVariant(status: ClinicBookingStatus): "success" | "warning" | "error" | "neutral" {
  if (status === "confirmed") {
    return "success";
  }
  if (status === "pending") {
    return "warning";
  }
  if (status === "failed") {
    return "error";
  }
  return "neutral";
}

/* ------------------------------------------------------------------ */
/*  Follow-up helpers                                                  */
/* ------------------------------------------------------------------ */

export function followUpPriorityLabel(priority: ClinicFollowUpPriority): string {
  return priority === "urgent" ? "Urgent today" : "Normal follow-up";
}

export function followUpPriorityVariant(priority: ClinicFollowUpPriority): "error" | "warning" {
  return priority === "urgent" ? "error" : "warning";
}

export function followUpStatusLabel(status: ClinicFollowUpStatus): string {
  if (status === "claimed") {
    return "Owned by staff";
  }
  if (status === "resolved") {
    return "Completed";
  }
  return "Open";
}

export function followUpStatusVariant(status: ClinicFollowUpStatus): "warning" | "success" | "neutral" {
  if (status === "claimed") {
    return "warning";
  }
  if (status === "resolved") {
    return "success";
  }
  return "neutral";
}

export function followUpCategoryLabel(item: ClinicFollowUpQueueItem): string {
  if (item.follow_up_category === "urgent_transfer") {
    return "Urgent medical handoff";
  }
  if (item.follow_up_category === "manual_review") {
    return "Staff review needed";
  }
  if (item.follow_up_category === "callback_required") {
    return "Callback required";
  }
  return "Booking failed";
}

export function formatFollowUpActionError(error: unknown): string {
  if (error instanceof PlatformApiError) {
    if (error.status === 409 && error.message.includes("already claimed")) {
      return "Someone else already took this follow-up. Refresh the queue to see the current owner.";
    }
    if (error.status === 409 && error.message.includes("already been resolved")) {
      return "This follow-up is already marked complete.";
    }
    if (error.status === 404 && error.message.includes("Assigned user is not a member")) {
      return "That teammate no longer has access to this workspace.";
    }
  }
  return toErrorMessage(error);
}

export function handoffSourceLabel(value: string | null): string {
  if (value === "live-support") {
    return "Opened from live support";
  }
  if (value === "dashboard") {
    return "Opened from dashboard triage";
  }
  if (value === "integrations") {
    return "Opened from clinic setup";
  }
  return "Opened from bookings";
}

/* ------------------------------------------------------------------ */
/*  Automation helpers                                                 */
/* ------------------------------------------------------------------ */

export function automationExecutionLabel(action: ClinicAutomationActionStatus): string {
  if (action.execution_status === "scheduled") {
    if (action.action_id === "appointment_reminder") {
      return "Reminder scheduled";
    }
    return "Scheduled";
  }
  if (action.execution_status === "completed") {
    if (action.execution_mode === "system") {
      if (action.action_id === "confirmation_sms") {
        return "Sent automatically";
      }
      if (action.action_id === "patient_record_sync") {
        return "Synced automatically";
      }
      return "Scheduled automatically";
    }
    return "Done";
  }
  if (action.execution_status === "failed") {
    return action.execution_mode === "system" ? "Automatic step failed" : "Problem recorded";
  }
  if (action.execution_status === "blocked") {
    return action.execution_mode === "system" ? "Automatic step blocked" : "Blocked";
  }
  if (action.execution_status === "not_required") {
    return "Not needed";
  }
  return action.execution_mode === "system" ? "Automatic" : "Ready to run";
}

export function automationExecutionVariant(
  status: string,
): "success" | "warning" | "error" | "neutral" {
  if (status === "completed" || status === "scheduled") {
    return "success";
  }
  if (status === "failed") {
    return "error";
  }
  if (status === "blocked") {
    return "warning";
  }
  return "neutral";
}

export function automationReadinessLabel(
  status: ClinicAutomationActionStatus["readiness_status"],
): string {
  if (status === "not_configured") {
    return "Connector missing";
  }
  if (status === "unhealthy") {
    return "Connector issue";
  }
  return "Connector ready";
}

export function automationReadinessVariant(
  status: ClinicAutomationActionStatus["readiness_status"],
): "success" | "warning" | "error" {
  if (status === "ready") {
    return "success";
  }
  if (status === "unhealthy") {
    return "error";
  }
  return "warning";
}

export function automationModeLabel(mode: ClinicAutomationActionStatus["execution_mode"]): string | null {
  if (mode === "system") {
    return "Automatic";
  }
  if (mode === "manual") {
    return "Updated by staff";
  }
  return null;
}

export function automationRecordedLabel(action: ClinicAutomationActionStatus): string | null {
  if (!action.recorded_at && !action.recorded_by_display_name) {
    return null;
  }
  if (action.execution_mode === "system" && !action.recorded_by_display_name) {
    if (action.execution_status === "scheduled") {
      if (action.recorded_at) {
        return `Scheduled automatically on ${formatDateTime(action.recorded_at)}.`;
      }
      return "Scheduled automatically by the platform.";
    }
    if (action.recorded_at) {
      return `Updated automatically on ${formatDateTime(action.recorded_at)}.`;
    }
    return "Updated automatically by the platform.";
  }
  return `Last updated by ${action.recorded_by_display_name || "a teammate"}${
    action.recorded_at ? ` on ${formatDateTime(action.recorded_at)}` : ""
  }.`;
}

export function shouldShowManualAutomationControls(
  bookingStatus: ClinicBookingStatus,
  action: ClinicAutomationActionStatus,
): boolean {
  if (bookingStatus !== "confirmed" || action.execution_status === "completed" || action.execution_status === "scheduled") {
    return false;
  }
  if (action.execution_mode === "system") {
    return action.execution_status === "blocked" || action.execution_status === "failed";
  }
  return true;
}

export function automationManualPanelCopy(action: ClinicAutomationActionStatus): {
  title: string;
  description: string;
} {
  if (action.execution_mode === "system") {
    return {
      title: "Manual fallback",
      description:
        "The platform could not finish this automatically. Record what staff did so the booking stays accurate.",
    };
  }
  return {
    title: "Update this task manually",
    description:
      "Use this only when staff handled the work outside the platform and you need the record to match reality.",
  };
}

export function defaultAutomationActionNote(action: ClinicAutomationActionStatus, mode: "complete" | "fail"): string {
  if (mode === "complete") {
    if (action.action_id === "patient_record_sync") {
      return "Reception staff updated the patient record outside the platform.";
    }
    if (action.action_id === "confirmation_sms") {
      return "Reception staff sent the confirmation text outside the platform.";
    }
    return "Reception staff scheduled the reminder outside the platform.";
  }
  if (action.action_id === "patient_record_sync") {
    return "The patient record could not be updated yet.";
  }
  if (action.action_id === "confirmation_sms") {
    return "The confirmation text could not be sent yet.";
  }
  return "The reminder could not be scheduled yet.";
}
