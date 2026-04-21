# T14: Add Tooltip to Disabled Actions on Tenant Pages

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None (uses Tooltip from M20 T02)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T14 - add Tooltip to disabled actions on tenant pages`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Add Tooltip explanations to every disabled button on tenant pages so operators understand why an action is unavailable. This uses the Tooltip component created in M20 T02. A `TooltipProvider` must be added to the tenant layout to enable tooltips across all tenant pages.

## Subtasks

- [x] **Add TooltipProvider** to tenant layout (wraps all tenant page content)
- [x] **call-ops** (`call-ops/page.tsx`) — Tooltip when action buttons are disabled during busy state
- [x] **dashboard** (`dashboard/page.tsx`) — Tooltip on disabled refresh button during loading
- [x] **alerts** (`call-ops/alerts/page.tsx`) — Tooltip on disabled acknowledge/resolve during busy
- [x] **team** (`team/page.tsx`) — Tooltip when invite is disabled
- [x] **automations** (`automations/page.tsx`) — Tooltip when retry is disabled
- [x] **settings** (`settings/recordings/page-client.tsx`) — Tooltip on disabled save during submit
- [x] **integrations** (`integrations/page-client.tsx`) — Tooltip on disabled add/edit/health-check during busy
- [x] **bookings** (`solutions/appointment-booking/bookings-page.tsx`) — Tooltip on disabled claim/assign/resolve during busy
- [x] **driver-verification** (`solutions/driver-verification/drivers-page.tsx`) — Tooltip on disabled import/edit during busy

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/layout.tsx` | Modify | Add TooltipProvider wrapper |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Tooltip on disabled action buttons |
| `apps/web/src/app/(tenant)/dashboard/page.tsx` | Modify | Tooltip on disabled refresh |
| `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Tooltip on disabled ack/resolve |
| `apps/web/src/app/(tenant)/team/page.tsx` | Modify | Tooltip on disabled invite button |
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Tooltip on disabled retry button |
| `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx` | Modify | Tooltip on disabled save |
| `apps/web/src/app/(tenant)/integrations/page-client.tsx` | Modify | Tooltip on disabled connector actions |
| `apps/web/src/solutions/appointment-booking/bookings-page.tsx` | Modify | Tooltip on disabled claim/assign/resolve |
| `apps/web/src/solutions/driver-verification/drivers-page.tsx` | Modify | Tooltip on disabled import/edit |

## Acceptance Criteria

- [x] TooltipProvider wraps tenant layout content
- [x] Every disabled button on the listed tenant pages has a Tooltip explaining why it is disabled
- [x] Tooltip text is descriptive and actionable (tells user what to do)
- [x] Tooltips appear on hover and focus
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Prior art: M20 T14 (Tooltip on admin page disabled actions)
- Depends on: M20 T02 (Tooltip component in packages/ui)
