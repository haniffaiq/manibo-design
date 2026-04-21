# T11: Urgent Banner — Inline Action Buttons

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T11 - urgent banner inline action buttons`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The urgent call banner currently shows "call_8f2a needs immediate transfer — reason" as text only. The operator must then scroll down and find the matching row in the calls table to act. Add "Transfer" and "Join call" buttons directly inside the banner so operators can act immediately without hunting.

## Subtasks

- [x] **Add action buttons to UrgentCallBanner**: For each urgent call, render "Transfer" (destructive variant, sm) and "Join call" (outline, sm) buttons
- [x] **Thread callbacks through**: `UrgentCallBanner` needs `onTransfer` and `onJoin` callbacks — add props
- [x] **Wire from CallOpsPage**: Pass the existing `openEscalationModal` and `mintOperatorToken` handlers

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/urgent-banner.tsx` | Modify | Add action buttons per urgent call |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Pass action handlers to UrgentCallBanner |

## Implementation Notes

- Buttons should be right-aligned within the banner flex row.
- "Transfer" uses `variant="destructive" size="sm"` — this is the most critical action.
- "Join call" uses `variant="outline" size="sm"`.
- Keep the banner's existing error color scheme.
- Add `data-testid` on the new buttons: `call-ops-urgent-transfer-{call_id}`, `call-ops-urgent-join-{call_id}`.

## Acceptance Criteria

- [x] Each urgent call banner has Transfer and Join call buttons
- [x] Buttons call the correct handlers (escalation modal for transfer, token mint for join)
- [x] Banner still renders correctly when there are 0 urgent calls (null return)
- [x] `data-testid` attributes present on new buttons
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Wireframe: "CALL OPS — ACTIVE CALLS" sketch, urgent banner section
