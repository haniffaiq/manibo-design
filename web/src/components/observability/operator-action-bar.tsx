"use client";

import { useState } from "react";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import type { ObservabilityRunKind } from "@/lib/api/observability";
import { platformApiRequest } from "@/lib/api/platform";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import type { ObserverConnectionState } from "./use-livekit-observer";

/* ------------------------------------------------------------------ */
/*  Channel action sets                                                */
/* ------------------------------------------------------------------ */

type ActionKind = "join_call" | "leave_call" | "takeover" | "transfer" | "watch" | "join" | "escalate";

type ActionDef = { kind: ActionKind; label: string; variant: "primary" | "outline" };

const VOICE_JOINED: ActionDef[] = [
  { kind: "leave_call", label: "Leave call", variant: "outline" },
  { kind: "takeover", label: "Take over call", variant: "primary" },
  { kind: "transfer", label: "Transfer now", variant: "outline" },
];

const VOICE_NOT_JOINED: ActionDef[] = [
  { kind: "join_call", label: "Join call", variant: "outline" },
  { kind: "takeover", label: "Take over call", variant: "primary" },
  { kind: "transfer", label: "Transfer now", variant: "outline" },
];

const CHAT_ACTIONS: ActionDef[] = [
  { kind: "watch", label: "Watch session", variant: "outline" },
  { kind: "join", label: "Join as operator", variant: "primary" },
  { kind: "escalate", label: "Escalate to human", variant: "outline" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface OperatorActionBarProps {
  callId: string;
  channelKind: ObservabilityRunKind;
  /** LiveKit connection state — drives Join/Leave button label */
  liveKitState?: ObserverConnectionState;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
}

export function OperatorActionBar({
  callId,
  channelKind,
  liveKitState = "disconnected",
  onJoinCall,
  onLeaveCall,
}: OperatorActionBarProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inCall = liveKitState === "connected" || liveKitState === "reconnecting";
  const connecting = liveKitState === "connecting";

  const actions = channelKind === "call_session"
    ? (inCall ? VOICE_JOINED : VOICE_NOT_JOINED)
    : channelKind === "interactive_channel_session"
      ? CHAT_ACTIONS
      : [];

  if (actions.length === 0) return null;

  async function handleAction(action: ActionKind): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      switch (action) {
        case "join_call": {
          onJoinCall?.();
          break;
        }
        case "leave_call": {
          onLeaveCall?.();
          break;
        }
        case "takeover": {
          await platformApiRequest(
            `/calls/${encodeURIComponent(callId)}/takeover`,
            { method: "POST", body: JSON.stringify({}) },
          );
          setNotice("Take over initiated");
          break;
        }
        case "transfer": {
          await platformApiRequest(
            `/calls/${encodeURIComponent(callId)}/terminate-transfer`,
            { method: "POST", body: JSON.stringify({}) },
          );
          setNotice("Transfer initiated");
          break;
        }
        case "watch": {
          setNotice("Watch session acknowledged (chat backend pending)");
          break;
        }
        case "join": {
          setNotice("Join as operator acknowledged (chat backend pending)");
          break;
        }
        case "escalate": {
          setNotice("Escalate to human acknowledged (chat backend pending)");
          break;
        }
        default: {
          const _exhaustive: never = action;
          throw new Error(`Unhandled action kind: ${_exhaustive}`);
        }
      }
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-testid="operator-action-bar"
      className="rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(239,246,255,0.6)] px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="warning">Live</Badge>
          <span className="text-sm font-semibold text-[var(--color-neutral-950)]">Operator actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.kind}
              size="sm"
              variant={action.variant}
              disabled={busy || (action.kind === "join_call" && connecting)}
              onClick={() => void handleAction(action.kind)}
              data-testid={`operator-action-${action.kind}`}
            >
              {action.kind === "join_call" && connecting ? "Connecting..." : action.label}
            </Button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-[var(--color-error-700)]">{error}</p>
      ) : null}
      {notice ? (
        <p className="mt-2 text-sm text-[var(--color-success-700)]">{notice}</p>
      ) : null}
    </div>
  );
}
