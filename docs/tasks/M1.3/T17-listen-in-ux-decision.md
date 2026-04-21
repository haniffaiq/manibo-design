# T17: Decide listen-in UX and wire OperatorActionBar to LiveKit observer

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

The "Listen in" button in `OperatorActionBar` and the `useLiveKitObserver` hook are disconnected. The button fetches a token and shows a notice. The observer also fetches a token and auto-connects when `isLive && isVoiceCase`. They don't coordinate.

Two options need a product decision:

**Option A — Auto-connect (current behavior, just remove the button's token fetch):**
LiveKit connects automatically when a live voice case opens. The "Listen in" button becomes redundant or is removed. Pro: zero-click listen-in. Con: every voice case view creates a LiveKit connection — bandwidth and cost.

**Option B — Opt-in (button triggers connection):**
LiveKit observer starts with `enabled: false`. Clicking "Listen in" sets `listeningEnabled: true`, which the observer uses. Pro: explicit user intent, no wasted connections. Con: one extra click.

## Subtasks

- [x] **Get product decision**: auto-connect vs opt-in (requires human checkpoint)
- [x] **If opt-in**: add `listeningEnabled` state to workspace, pass to `useLiveKitObserver`, wire "Listen in" button onClick to toggle it, remove the duplicate token fetch from the button handler
- [x] **If auto-connect**: remove the "Listen in" button's token fetch (it's redundant), change button to show connection status instead
- [x] **Update E2E tests** to match the chosen behavior

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/operator-action-bar.tsx` | Modify | Remove duplicate token fetch or convert to toggle |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Wire listening state if opt-in |
| `apps/web/src/components/observability/use-livekit-observer.ts` | Modify | Accept external enabled flag if opt-in |

## Acceptance Criteria

- [x] "Listen in" button and LiveKit observer are coordinated — no duplicate token fetches
- [x] Chosen UX is consistent (either always connects or only on click)
- [x] E2E test covers the chosen flow

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Current button: `operator-action-bar.tsx:59-67`
- Current observer: `use-livekit-observer.ts:41-114`
