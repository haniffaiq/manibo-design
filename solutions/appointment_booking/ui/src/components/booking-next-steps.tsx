"use client";

import { useMemo } from "react";

import { Badge } from "@grove/ui/badge";

import type {
  ClinicAutomationActionStatus,
  ClinicBookingResultDetailResponse,
  ClinicBookingStatus,
  ClinicFollowUpQueueItem,
} from "../api/clinic-bookings";
import {
  followUpPriorityLabel,
  followUpPriorityVariant,
  handoffSourceLabel,
  humanizeReason,
  shouldShowManualAutomationControls,
} from "./booking-detail-helpers";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BookingNextStepsProps {
  bookingDetailData: ClinicBookingResultDetailResponse;
  activeFollowUpItem: ClinicFollowUpQueueItem | null;
  automationActions: ClinicAutomationActionStatus[];
  bookingStatus: ClinicBookingStatus | null;
  requestedSource: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BookingNextSteps({
  bookingDetailData,
  activeFollowUpItem,
  automationActions,
  bookingStatus,
  requestedSource,
}: BookingNextStepsProps) {
  const automationNeedsManualAttention =
    bookingStatus
      ? automationActions.filter((action) => shouldShowManualAutomationControls(bookingStatus, action))
      : [];

  const selectedCaseChecklist = useMemo(() => {
    const checklist: string[] = [];

    if (activeFollowUpItem && activeFollowUpItem.follow_up_status !== "resolved") {
      if (!activeFollowUpItem.owner_user_id) {
        checklist.push("Claim or assign this case so one teammate owns the callback.");
      }
      checklist.push(activeFollowUpItem.recommended_action);
      checklist.push("Record the callback outcome before you leave this case.");
    } else if (bookingDetailData.needs_follow_up) {
      checklist.push("Review why the AI handed this call to staff and decide who owns the next step.");
    } else {
      checklist.push("No human callback is required unless the clinic wants an extra check.");
    }

    if (automationNeedsManualAttention.length > 0) {
      checklist.push(
        `Review ${automationNeedsManualAttention.length} after-call ${
          automationNeedsManualAttention.length === 1 ? "task" : "tasks"
        } before closing the case.`,
      );
    }

    if (requestedSource === "live-support") {
      checklist.unshift("Carry the live support note into this booking review before you promise a callback or close the case.");
    }

    return checklist;
  }, [activeFollowUpItem, automationNeedsManualAttention.length, bookingDetailData.needs_follow_up, requestedSource]);

  return (
    <div
      data-testid="clinic-selected-case-next-step"
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">What staff does next</h3>
            {requestedSource ? (
              <Badge variant={requestedSource === "live-support" ? "warning" : "neutral"}>
                {handoffSourceLabel(requestedSource)}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Use this short list so live handoff, callback work, and after-call admin do not split into separate mental models.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={bookingDetailData.needs_follow_up ? "warning" : "success"}>
            {bookingDetailData.needs_follow_up ? "Follow-up still open" : "No callback needed"}
          </Badge>
          {activeFollowUpItem ? (
            <Badge variant={followUpPriorityVariant(activeFollowUpItem.follow_up_priority)}>
              {followUpPriorityLabel(activeFollowUpItem.follow_up_priority)}
            </Badge>
          ) : null}
        </div>
      </div>
      <ol className="mt-4 grid gap-2">
        {selectedCaseChecklist.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-700)]"
          >
            <span className="mr-2 font-semibold text-[var(--color-neutral-900)]">{index + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
      {(bookingDetailData.result.handoff_reason || activeFollowUpItem?.handoff_reason) ? (
        <p className="mt-3 text-xs text-[var(--color-neutral-500)]">
          Handoff reason:{" "}
          <span className="font-medium text-[var(--color-neutral-900)]">
            {humanizeReason(activeFollowUpItem?.handoff_reason ?? bookingDetailData.result.handoff_reason) ?? "Not recorded"}
          </span>
        </p>
      ) : null}
    </div>
  );
}
