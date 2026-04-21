"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { OverflowMenu, type OverflowMenuItem } from "@grove/ui/overflow-menu";
import { Skeleton } from "@grove/ui/skeleton";
import type { ActiveCall } from "@/components/call-ops/escalation-modal";
import { normalizeWorkflowLabel } from "@/lib/call-ops-presenters";

export interface ActiveCallsTableProps {
  calls: ActiveCall[];
  loading: boolean;
  disabled: boolean;
  onSupport: (call: ActiveCall) => void;
  onListen: (callId: string) => void;
  onJoin: (callId: string) => void;
  onTakeOver: (call: ActiveCall) => void;
  onTransfer: (call: ActiveCall) => void;
  onTranscript: (callId: string) => void;
}

export function ActiveCallsTable({
  calls,
  loading,
  disabled,
  onSupport,
  onListen,
  onJoin,
  onTakeOver,
  onTransfer,
  onTranscript,
}: ActiveCallsTableProps) {
  if (loading) {
    return (
      <div data-testid="call-ops-active-table" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div data-testid="call-ops-active-table">
        <p className="py-8 text-center text-sm text-[var(--color-neutral-500)]">No live calls right now.</p>
      </div>
    );
  }

  return (
    <div data-testid="call-ops-active-table" className="space-y-3">
      {calls.map((call) => {
        const overflowItems: OverflowMenuItem[] = [
          { label: "Support details", onClick: () => onSupport(call), testId: `call-ops-support-${call.call_id}` },
          { label: "Listen in", onClick: () => onListen(call.call_id), testId: `call-ops-observe-${call.call_id}`, disabled },
          { label: "Join call", onClick: () => onJoin(call.call_id), testId: `call-ops-talk-${call.call_id}`, disabled },
          { label: "Watch transcript", onClick: () => onTranscript(call.call_id), testId: `call-ops-transcript-${call.call_id}`, disabled },
        ];

        return (
          <div
            key={call.call_id}
            className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span data-testid={`call-ops-call-id-${call.call_id}`} className="truncate font-mono text-xs text-[var(--color-neutral-700)]">
                  {call.call_id}
                </span>
                {call.escalation ? (
                  <Badge
                    data-testid={`call-ops-escalation-badge-${call.call_id}`}
                    variant={call.escalation.status === "transfer_requested" ? "error" : "warning"}
                  >
                    {call.escalation.status === "transfer_requested" ? "Urgent transfer" : "Needs help"}
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs text-[var(--color-neutral-500)]">{normalizeWorkflowLabel(call.workflow_type)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                data-testid={call.escalation ? `call-ops-claim-${call.call_id}` : `call-ops-takeover-${call.call_id}`}
                size="sm"
                disabled={disabled}
                onClick={() => onTakeOver(call)}
              >
                {call.escalation ? "Claim" : "Take over"}
              </Button>
              <Button
                data-testid={`call-ops-terminate-transfer-${call.call_id}`}
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onTransfer(call)}
              >
                Transfer
              </Button>
              <OverflowMenu
                items={overflowItems}
                data-testid={`call-ops-overflow-${call.call_id}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
