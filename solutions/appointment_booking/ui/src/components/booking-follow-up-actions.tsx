"use client";

import { useState } from "react";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";

import {
  assignClinicFollowUp,
  claimClinicFollowUp,
  resolveClinicFollowUp,
  type ClinicFollowUpQueueItem,
} from "../api/clinic-bookings";
import type { TeamUser } from "@/lib/api/team";
import {
  followUpCategoryLabel,
  followUpPriorityLabel,
  followUpPriorityVariant,
  followUpStatusLabel,
  followUpStatusVariant,
  formatDateTime,
  formatFollowUpActionError,
  formatTeamMemberLabel,
  toErrorMessage,
} from "./booking-detail-helpers";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BookingFollowUpActionsProps {
  activeFollowUpItem: ClinicFollowUpQueueItem | null;
  followUpDetailLoading: boolean;
  followUpDetailError: unknown;
  teamUsers: TeamUser[];
  teamUsersError: unknown;
  refreshBookingWorkspace: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BookingFollowUpActions({
  activeFollowUpItem,
  followUpDetailLoading,
  followUpDetailError,
  teamUsers,
  teamUsersError,
  refreshBookingWorkspace,
}: BookingFollowUpActionsProps) {
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [followUpActionBusy, setFollowUpActionBusy] = useState<"claim" | "assign" | "resolve" | null>(null);
  const [followUpActionError, setFollowUpActionError] = useState<string | null>(null);
  const [followUpActionNotice, setFollowUpActionNotice] = useState<string | null>(null);

  async function runFollowUpAction(
    action: "claim" | "assign" | "resolve",
    work: () => Promise<void>,
    successNotice: string,
  ): Promise<void> {
    setFollowUpActionBusy(action);
    setFollowUpActionError(null);
    setFollowUpActionNotice(null);
    try {
      await work();
      await refreshBookingWorkspace();
      setFollowUpActionNotice(successNotice);
    } catch (error) {
      setFollowUpActionError(formatFollowUpActionError(error));
    } finally {
      setFollowUpActionBusy(null);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Staff follow-up</h3>
      <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
        Keep ownership clear so callbacks are not missed or duplicated.
      </p>
      {followUpActionError ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
          {followUpActionError}
        </div>
      ) : null}
      {followUpActionNotice ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">
          {followUpActionNotice}
        </div>
      ) : null}
      {followUpDetailError ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
          {toErrorMessage(followUpDetailError)}
        </div>
      ) : null}
      {followUpDetailLoading ? (
        <p className="mt-3 text-sm text-[var(--color-neutral-500)]">Loading follow-up status...</p>
      ) : activeFollowUpItem ? (
        <div className="mt-3 space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={followUpStatusVariant(activeFollowUpItem.follow_up_status)}>
                {followUpStatusLabel(activeFollowUpItem.follow_up_status)}
              </Badge>
              <Badge variant={followUpPriorityVariant(activeFollowUpItem.follow_up_priority)}>
                {followUpPriorityLabel(activeFollowUpItem.follow_up_priority)}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--color-neutral-900)]">
              {activeFollowUpItem.recommended_action}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-neutral-600)]">
              <p>
                <span className="font-medium text-[var(--color-neutral-900)]">Case type:</span>{" "}
                {followUpCategoryLabel(activeFollowUpItem)}
              </p>
              <p>
                <span className="font-medium text-[var(--color-neutral-900)]">Current owner:</span>{" "}
                {activeFollowUpItem.owner_display_name || activeFollowUpItem.owner_email || "Unassigned"}
              </p>
              {activeFollowUpItem.owner_assigned_at ? (
                <p>
                  <span className="font-medium text-[var(--color-neutral-900)]">Taken on:</span>{" "}
                  {formatDateTime(activeFollowUpItem.owner_assigned_at)}
                </p>
              ) : null}
              {activeFollowUpItem.resolved_by_display_name ? (
                <p>
                  <span className="font-medium text-[var(--color-neutral-900)]">Completed by:</span>{" "}
                  {activeFollowUpItem.resolved_by_display_name}
                  {activeFollowUpItem.resolved_at ? ` on ${formatDateTime(activeFollowUpItem.resolved_at)}` : ""}
                </p>
              ) : null}
              {activeFollowUpItem.resolution_note ? (
                <p>
                  <span className="font-medium text-[var(--color-neutral-900)]">Staff note:</span>{" "}
                  {activeFollowUpItem.resolution_note}
                </p>
              ) : null}
            </div>
          </div>

          {activeFollowUpItem.follow_up_status !== "resolved" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  data-testid="clinic-follow-up-claim"
                  disabled={followUpActionBusy !== null}
                  onClick={() =>
                    void runFollowUpAction(
                      "claim",
                      async () => {
                        await claimClinicFollowUp(activeFollowUpItem.call_id);
                      },
                      "You now own this follow-up.",
                    )
                  }
                >
                  {followUpActionBusy === "claim" ? "Taking ownership..." : "Take this case"}
                </Button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="clinic-follow-up-assignee"
                  className="text-sm font-medium text-[var(--color-neutral-700)]"
                >
                  Assign to teammate
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    id="clinic-follow-up-assignee"
                    data-testid="clinic-follow-up-assignee"
                    className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                    value={selectedAssigneeUserId}
                    disabled={followUpActionBusy !== null || teamUsers.length === 0}
                    onChange={(event) => setSelectedAssigneeUserId(event.currentTarget.value)}
                  >
                    <option value="">Choose teammate</option>
                    {teamUsers.map((user: TeamUser) => (
                      <option key={user.user_id} value={user.user_id}>
                        {formatTeamMemberLabel(user)}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="clinic-follow-up-assign"
                    disabled={followUpActionBusy !== null || selectedAssigneeUserId.length === 0}
                    onClick={() => {
                      if (!selectedAssigneeUserId) {
                        setFollowUpActionError("Choose a teammate before assigning this follow-up.");
                        return;
                      }
                      const assignee = teamUsers.find((user: TeamUser) => user.user_id === selectedAssigneeUserId);
                      void runFollowUpAction(
                        "assign",
                        async () => {
                          await assignClinicFollowUp(activeFollowUpItem.call_id, selectedAssigneeUserId);
                        },
                        assignee
                          ? `This follow-up is now assigned to ${assignee.display_name || assignee.email}.`
                          : "This follow-up is now assigned.",
                      );
                    }}
                  >
                    {followUpActionBusy === "assign" ? "Assigning..." : "Assign"}
                  </Button>
                </div>
                {teamUsersError ? (
                  <p className="text-xs text-[var(--color-error-700)]">{toErrorMessage(teamUsersError)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="clinic-follow-up-resolution-note"
                  className="text-sm font-medium text-[var(--color-neutral-700)]"
                >
                  What did staff do?
                </label>
                <textarea
                  id="clinic-follow-up-resolution-note"
                  data-testid="clinic-follow-up-resolution-note"
                  className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-neutral-900)]"
                  placeholder="Example: Called the patient back, offered a new slot, and confirmed the booking."
                  value={resolutionNote}
                  disabled={followUpActionBusy !== null}
                  onChange={(event) => setResolutionNote(event.currentTarget.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="clinic-follow-up-resolve"
                  disabled={followUpActionBusy !== null}
                  onClick={() =>
                    void runFollowUpAction(
                      "resolve",
                      async () => {
                        await resolveClinicFollowUp(activeFollowUpItem.call_id, resolutionNote);
                      },
                      "This follow-up is marked complete.",
                    )
                  }
                >
                  {followUpActionBusy === "resolve" ? "Marking complete..." : "Mark follow-up complete"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-neutral-500)]">
          This call does not need staff follow-up right now.
        </p>
      )}
    </div>
  );
}
