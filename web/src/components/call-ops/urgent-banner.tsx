"use client";

import { Button } from "@grove/ui/button";
import type { ActiveCall } from "@/components/call-ops/escalation-modal";
import { handoffReasonLabel } from "@/lib/call-observability-presenters";

interface UrgentCallBannerProps {
  calls: ActiveCall[];
  onTransfer?: (call: ActiveCall) => void;
  onJoin?: (callId: string) => void;
  disabled?: boolean;
}

export function UrgentCallBanner({ calls, onTransfer, onJoin, disabled }: UrgentCallBannerProps) {
  const urgentCalls = calls.filter((c) => c.escalation?.status === "transfer_requested");
  if (urgentCalls.length === 0) return null;

  return (
    <div data-testid="call-ops-urgent-banner" className="flex flex-col gap-2">
      {urgentCalls.map((call) => (
        <div
          key={call.call_id}
          className="flex items-center gap-3 rounded-lg border border-[var(--color-error-200)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-800)]"
        >
          <span className="font-semibold">{call.call_id}</span>
          <span className="flex-1">needs immediate transfer</span>
          {call.escalation?.reason ? (
            <span className="text-[var(--color-error-600)]">— {handoffReasonLabel(call.escalation.reason)}</span>
          ) : null}
          <div className="flex shrink-0 gap-2">
            <Button
              data-testid={`call-ops-urgent-transfer-${call.call_id}`}
              variant="destructive"
              size="sm"
              disabled={disabled}
              onClick={() => onTransfer?.(call)}
            >
              Transfer
            </Button>
            <Button
              data-testid={`call-ops-urgent-join-${call.call_id}`}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onJoin?.(call.call_id)}
            >
              Join call
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
