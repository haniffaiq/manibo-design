import { useState } from "react";

import { Button } from "@grove/ui/button";
import { Modal } from "@grove/ui/modal";
import { platformApiRequest } from "@grove/web-shared/api/platform";
import type { CallEscalationState } from "@/lib/call-ops-escalation";
import { normalizeWorkflowLabel } from "@/lib/call-ops-presenters";

export type EscalationAction = "takeover" | "terminate-transfer";

export type ActiveCall = {
  call_id: string;
  workflow_id: string;
  run_id: string;
  workflow_type: string;
  escalation?: CallEscalationState | null;
};

export type EscalationDraft = {
  action: EscalationAction;
  call: ActiveCall;
};

function escalationTitle(action: EscalationAction): string {
  return action === "terminate-transfer" ? "Transfer caller to a person now" : "Ask a teammate to take over";
}

function escalationDescription(action: EscalationAction): string {
  return action === "terminate-transfer"
    ? "Use this for urgent situations where the AI should stop handling the call immediately."
    : "Use this when a teammate should continue the conversation from here.";
}

function escalationSubmitLabel(action: EscalationAction): string {
  return action === "terminate-transfer" ? "Transfer now" : "Request takeover";
}

function escalationPlaceholder(action: EscalationAction): string {
  return action === "terminate-transfer"
    ? "Example: Urgent clinical question. Move the caller to a person immediately."
    : "Example: Caller asked about insurance coverage and needs a staff member.";
}

function escalationSuccessMessage(action: EscalationAction): string {
  return action === "terminate-transfer" ? "Transfer request accepted." : "Takeover signal accepted.";
}

export interface EscalationModalProps {
  draft: EscalationDraft | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function EscalationModal({ draft, onClose, onSuccess, onError }: EscalationModalProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleClose(): void {
    setReason("");
    setLocalError(null);
    onClose();
  }

  async function handleSubmit(): Promise<void> {
    if (!draft) return;

    const trimmedReason = reason.trim() || undefined;
    setBusy(true);
    setLocalError(null);
    try {
      await platformApiRequest(`/calls/${encodeURIComponent(draft.call.call_id)}/${draft.action}`, {
        method: "POST",
        body: JSON.stringify({ reason: trimmedReason }),
      });
      const message = escalationSuccessMessage(draft.action);
      setReason("");
      setLocalError(null);
      onSuccess(message);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setLocalError(message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={draft !== null}
      onClose={handleClose}
      title={draft ? escalationTitle(draft.action) : "Escalation"}
      description={draft ? escalationDescription(draft.action) : undefined}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            data-testid="call-ops-escalation-confirm"
            variant={draft?.action === "terminate-transfer" ? "destructive" : "primary"}
            onClick={() => void handleSubmit()}
            disabled={busy}
          >
            {busy ? "Sending\u2026" : draft ? escalationSubmitLabel(draft.action) : "Confirm"}
          </Button>
        </div>
      }
    >
      <div data-testid="call-ops-escalation-modal" className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">
            {draft?.call.call_id ?? "No call selected"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            {draft?.call
              ? `${normalizeWorkflowLabel(draft.call.workflow_type)} · Run ${draft.call.run_id}`
              : "Select a live call first."}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="call-ops-escalation-reason" className="text-sm font-medium text-[var(--color-neutral-700)]">
            What should the next person know?
          </label>
          <textarea
            id="call-ops-escalation-reason"
            data-testid="call-ops-escalation-reason"
            className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-neutral-900)]"
            placeholder={draft ? escalationPlaceholder(draft.action) : "Add a short handoff note."}
            value={reason}
            disabled={busy}
            onChange={(event) => setReason(event.currentTarget.value)}
          />
          <p className="text-xs text-[var(--color-neutral-500)]">
            Optional, but recommended. It becomes the operator handoff note.
          </p>
        </div>

        {localError ? <p className="text-sm text-[var(--color-error-700)]">{localError}</p> : null}
      </div>
    </Modal>
  );
}
