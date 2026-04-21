# T02: Wrap All Tenant Pages in PageFrame

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T02 - wrap all tenant pages in PageFrame`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Replace raw `<main>` tags and bare `<div>` wrappers on all tenant pages with the `PageFrame` component, using the correct width archetype for each page.

Important: several tenant routes do NOT have a direct `page.tsx` in their route directory. Verify the actual file paths before editing:
- Settings lives at `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx`
- Alerts lives at `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx`
- Bookings is solution-owned at `apps/web/src/solutions/appointment-booking/bookings-page.tsx`
- Knowledge Base lives at `apps/web/src/app/(tenant)/clinic/knowledge-base/page.tsx`
- Driver Verification is solution-owned at `apps/web/src/solutions/driver-verification/drivers-page.tsx`

## Subtasks

- [x] **dashboard** (`apps/web/src/app/(tenant)/dashboard/page.tsx`) → `PageFrame width="standard"`
- [x] **call-ops** (`apps/web/src/app/(tenant)/call-ops/page.tsx`) → `PageFrame width="workspace"`
- [x] **call-history** (`apps/web/src/app/(tenant)/call-ops/history/page.tsx`) → `PageFrame width="standard"`
- [x] **alerts** (`apps/web/src/app/(tenant)/call-ops/alerts/page.tsx`) → `PageFrame width="standard"`
- [x] **observability** (`apps/web/src/app/(tenant)/observability/page.tsx`) → already uses PageFrame via shared component; verify only
- [x] **automations** (`apps/web/src/app/(tenant)/automations/page.tsx`) → `PageFrame width="standard"`
- [x] **team** (`apps/web/src/app/(tenant)/team/page.tsx`) → `PageFrame width="standard"`
- [x] **activity** (`apps/web/src/app/(tenant)/activity/page.tsx` or `page-client.tsx`) → `PageFrame width="standard"`
- [x] **integrations** (`apps/web/src/app/(tenant)/integrations/page-client.tsx`) → `PageFrame width="standard"`
- [x] **settings** (`apps/web/src/app/(tenant)/settings/recordings/page-client.tsx`) → `PageFrame width="reading"`
- [x] **bookings** (`apps/web/src/solutions/appointment-booking/bookings-page.tsx`) → `PageFrame width="standard"`
- [x] **knowledge-base** (`apps/web/src/app/(tenant)/clinic/knowledge-base/page.tsx`) → `PageFrame width="standard"`
- [x] **driver-verification** (`apps/web/src/solutions/driver-verification/drivers-page.tsx`) → `PageFrame width="standard"`
- [x] **Verify** no raw `<main>` tags remain in tenant page files

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/dashboard/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Wrap in PageFrame workspace |
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/team/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/activity/page-client.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/integrations/page-client.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx` | Modify | Wrap in PageFrame reading |
| `apps/web/src/app/(tenant)/clinic/knowledge-base/page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/solutions/appointment-booking/bookings-page.tsx` | Modify | Wrap in PageFrame standard |
| `apps/web/src/solutions/driver-verification/drivers-page.tsx` | Modify | Wrap in PageFrame standard |

## Acceptance Criteria

- [x] No raw `<main>` tags in any tenant page file
- [x] dashboard uses `standard`, call-ops uses `workspace`, settings uses `reading`
- [x] All other tenant pages use `standard`
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
