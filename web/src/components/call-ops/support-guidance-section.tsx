import Link from "next/link";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import type { ActiveCall, EscalationAction } from "@/components/call-ops/escalation-modal";

export type SupportGuidance = {
  title: string;
  detail: string;
  variant: "success" | "warning" | "neutral";
};

export interface SupportGuidanceSectionProps {
  call: ActiveCall;
  guidance: SupportGuidance;
  bookingsAvailable: boolean;
  bookingsGuidanceDetail: string;
  bookingsUnavailableNote: string | null;
  actionBusy: boolean;
  onEscalate: (call: ActiveCall, action: EscalationAction) => void;
  onJoin: (callId: string) => void;
  onTranscript: (callId: string) => void;
}

export function SupportGuidanceSection({
  call,
  guidance,
  bookingsAvailable,
  bookingsGuidanceDetail,
  bookingsUnavailableNote,
  actionBusy,
  onEscalate,
  onJoin,
  onTranscript,
}: SupportGuidanceSectionProps) {
  return (
    <section
      data-testid="call-ops-support-guidance"
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">Live support workflow</h3>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            {bookingsGuidanceDetail}
          </p>
        </div>
        <Badge variant={guidance.variant}>{guidance.title}</Badge>
      </div>
      <p className="mt-3 text-sm text-[var(--color-neutral-700)]">{guidance.detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={actionBusy}
          onClick={() => onTranscript(call.call_id)}
        >
          Watch transcript
        </Button>
        <Button size="sm" variant="outline" disabled={actionBusy} onClick={() => onJoin(call.call_id)}>
          Join call
        </Button>
        <Button size="sm" disabled={actionBusy} onClick={() => onEscalate(call, "takeover")}>
          Take over
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={actionBusy}
          onClick={() => onEscalate(call, "terminate-transfer")}
        >
          Transfer now
        </Button>
        {bookingsAvailable ? (
          <Link
            data-testid="call-ops-open-bookings"
            href={`/bookings?call_id=${encodeURIComponent(call.call_id)}&source=live-support#clinic-selected-case`}
            prefetch={false}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
          >
            Open clinic handoff workspace
          </Link>
        ) : (
          <p data-testid="call-ops-bookings-unavailable" className="text-xs text-[var(--color-neutral-500)]">
            {bookingsUnavailableNote}
          </p>
        )}
      </div>
    </section>
  );
}
