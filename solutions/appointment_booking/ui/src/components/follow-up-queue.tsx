"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import type {
  ClinicBookingStatus,
  ClinicFollowUpPriority,
  ClinicFollowUpQueueItem,
  ClinicFollowUpQueueSummary,
  ClinicFollowUpStatus,
} from "../api/clinic-bookings";

function statusLabel(status: ClinicBookingStatus): string {
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

function statusVariant(status: ClinicBookingStatus): "success" | "warning" | "error" | "neutral" {
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

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not confirmed";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function followUpPriorityLabel(priority: ClinicFollowUpPriority): string {
  return priority === "urgent" ? "Urgent today" : "Normal follow-up";
}

function followUpPriorityVariant(priority: ClinicFollowUpPriority): "error" | "warning" {
  return priority === "urgent" ? "error" : "warning";
}

function followUpStatusLabel(status: ClinicFollowUpStatus): string {
  if (status === "claimed") {
    return "Owned by staff";
  }
  if (status === "resolved") {
    return "Completed";
  }
  return "Open";
}

function followUpStatusVariant(status: ClinicFollowUpStatus): "warning" | "success" | "neutral" {
  if (status === "claimed") {
    return "warning";
  }
  if (status === "resolved") {
    return "success";
  }
  return "neutral";
}

function followUpCategoryLabel(item: ClinicFollowUpQueueItem): string {
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

function humanizeReason(reason: string | null): string | null {
  if (!reason) {
    return null;
  }
  return reason
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export interface FollowUpQueueProps {
  followUpItems: ClinicFollowUpQueueItem[];
  followUpSummary: ClinicFollowUpQueueSummary;
  priorityFilter: ClinicFollowUpPriority | "all";
  onPriorityFilterChange: (value: ClinicFollowUpPriority | "all") => void;
  activeCallId: string | null;
  onSelectCall: (callId: string) => void;
  isLoading: boolean;
  error: unknown;
}

export function FollowUpQueue({
  followUpItems,
  followUpSummary,
  priorityFilter,
  onPriorityFilterChange,
  activeCallId,
  onSelectCall,
  isLoading,
  error,
}: FollowUpQueueProps) {
  return (
    <Card id="clinic-follow-up-queue">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Staff follow-up queue</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              Start with urgent medical cases, then work through the remaining callbacks and failed bookings.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Queue today</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{followUpSummary.total}</p>
              <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                {followUpSummary.urgent} urgent, {followUpSummary.open} open, {followUpSummary.claimed} already owned.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clinic-follow-ups-priority" className="text-sm font-medium text-[var(--color-neutral-700)]">
                Priority
              </label>
              <select
                id="clinic-follow-ups-priority"
                data-testid="clinic-follow-ups-priority"
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                value={priorityFilter}
                onChange={(event) => onPriorityFilterChange(event.currentTarget.value as ClinicFollowUpPriority | "all")}
              >
                <option value="all">All follow-ups</option>
                <option value="urgent">Urgent today</option>
                <option value="normal">Normal follow-up</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
            {toErrorMessage(error)}
          </div>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Loading follow-up queue...</p>
        ) : null}
        {!isLoading && followUpItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-6 text-sm text-[var(--color-neutral-600)]">
            No clinic calls need staff follow-up for these filters.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {followUpItems.map((item) => (
              <div
                key={item.call_id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4"
                data-testid={`clinic-follow-up-row-${item.call_id}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--color-neutral-900)]">{item.patient_full_name || "Patient name not captured"}</p>
                      <Badge variant={followUpPriorityVariant(item.follow_up_priority)}>
                        {followUpPriorityLabel(item.follow_up_priority)}
                      </Badge>
                      <Badge variant={statusVariant(item.booking_status)}>{statusLabel(item.booking_status)}</Badge>
                      <Badge variant={followUpStatusVariant(item.follow_up_status)}>
                        {followUpStatusLabel(item.follow_up_status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-neutral-600)]">
                      {followUpCategoryLabel(item)}
                      {item.patient_phone || item.caller_number ? ` · ${item.patient_phone || item.caller_number}` : ""}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-900)]">{item.recommended_action}</p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      {item.specialty || "Specialty pending"}
                      {item.clinic_city ? ` · ${item.clinic_city}` : ""}
                      {item.appointment_time ? ` · ${item.appointment_time}` : ""}
                      {item.appointment_date ? ` · ${formatDate(item.appointment_date)}` : ""}
                    </p>
                    {item.handoff_reason ? (
                      <p className="text-xs text-[var(--color-neutral-500)]">Reason: {humanizeReason(item.handoff_reason)}</p>
                    ) : null}
                    {item.owner_display_name || item.owner_email ? (
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        Owned by {item.owner_display_name || item.owner_email}
                        {item.owner_assigned_at ? ` since ${formatDateTime(item.owner_assigned_at)}` : ""}.
                      </p>
                    ) : null}
                    {item.follow_up_status === "resolved" && item.resolved_by_display_name ? (
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        Completed by {item.resolved_by_display_name}
                        {item.resolved_at ? ` on ${formatDateTime(item.resolved_at)}` : ""}.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant={activeCallId === item.call_id ? "secondary" : "outline"}
                    size="sm"
                    data-testid={`clinic-follow-up-open-${item.call_id}`}
                    onClick={() => onSelectCall(item.call_id)}
                  >
                    {activeCallId === item.call_id ? "Viewing" : "Open details"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
