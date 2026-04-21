"use client";

import { useMemo } from "react";
import { useSWRConfig } from "swr";

import { Card, CardContent, CardHeader } from "@grove/ui/card";

import type { ClinicFollowUpQueueItem } from "../api/clinic-bookings";
import type { TeamUser } from "@/lib/api/team";
import { useBookingResultDetail } from "../hooks/use-booking-results";
import { useFollowUpDetail } from "../hooks/use-follow-ups";
import { useBookingAutomation } from "../hooks/use-booking-automation";
import { toErrorMessage } from "./booking-detail-helpers";
import { BookingNextSteps } from "./booking-next-steps";
import { BookingAppointmentDetails } from "./booking-appointment-details";
import { BookingFollowUpActions } from "./booking-follow-up-actions";
import { BookingAutomationTasks } from "./booking-automation-tasks";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BookingDetailProps {
  activeCallId: string | null;
  callHistoryHref: string | null;
  observabilityHref: string | null;
  requestedSource: string | null;
  teamUsers: TeamUser[];
  teamUsersError: unknown;
  queueFollowUpItem?: ClinicFollowUpQueueItem | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BookingDetail({
  activeCallId,
  callHistoryHref,
  observabilityHref,
  requestedSource,
  teamUsers,
  teamUsersError,
  queueFollowUpItem,
}: BookingDetailProps) {
  const enabled = activeCallId !== null;

  const { bookingDetailData, bookingDetailError, bookingDetailLoading } = useBookingResultDetail({
    enabled,
    callId: activeCallId,
  });

  const needsFollowUp = !!queueFollowUpItem || bookingDetailData?.needs_follow_up === true;

  const { followUpDetailData, followUpDetailError, followUpDetailLoading, mutateFollowUpDetail } = useFollowUpDetail({
    enabled,
    callId: activeCallId,
    needsFollowUp,
  });

  const { automationData, automationError, automationLoading, mutateAutomationData } = useBookingAutomation({
    enabled,
    callId: activeCallId,
  });

  const activeFollowUpItem = useMemo(() => {
    return followUpDetailData?.item ?? queueFollowUpItem ?? null;
  }, [followUpDetailData, queueFollowUpItem]);

  const { mutate: globalMutate } = useSWRConfig();

  async function refreshBookingWorkspace(): Promise<void> {
    await Promise.all([
      mutateFollowUpDetail(),
      mutateAutomationData(),
      globalMutate((key: unknown) => Array.isArray(key) && (key[0] === "clinic-follow-ups" || key[0] === "clinic-booking-results")),
    ]);
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Selected call</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Keep this simple: what the patient asked for, what was captured, and what happens next.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {bookingDetailError ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
            {toErrorMessage(bookingDetailError)}
          </div>
        ) : null}
        {!activeCallId ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Choose a call to review its booking details.</p>
        ) : bookingDetailLoading || !bookingDetailData ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Loading booking details...</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <BookingNextSteps
                bookingDetailData={bookingDetailData}
                activeFollowUpItem={activeFollowUpItem}
                automationActions={automationData?.actions ?? []}
                bookingStatus={automationData?.booking_status ?? null}
                requestedSource={requestedSource}
              />
              <BookingAppointmentDetails
                bookingDetailData={bookingDetailData}
                callHistoryHref={callHistoryHref}
                observabilityHref={observabilityHref}
              />
            </div>

            {/* Right column: follow-up + automation */}
            <div className="space-y-4">
              <BookingFollowUpActions
                activeFollowUpItem={activeFollowUpItem}
                followUpDetailLoading={followUpDetailLoading}
                followUpDetailError={followUpDetailError}
                teamUsers={teamUsers}
                teamUsersError={teamUsersError}
                refreshBookingWorkspace={refreshBookingWorkspace}
              />
              <BookingAutomationTasks
                activeCallId={activeCallId}
                automationData={automationData}
                automationLoading={automationLoading}
                automationError={automationError}
                mutateAutomationData={mutateAutomationData}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
