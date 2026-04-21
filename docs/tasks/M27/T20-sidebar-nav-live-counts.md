# T20: Sidebar — Nav Live Count Pills

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T20 - sidebar nav live count pills`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The sidebar nav items for "Active Calls" and "Alerts" should show live count pills. The data is already fetched by the pages — this task makes it visible in navigation so operators know at a glance if there are active calls or unacknowledged alerts without navigating to those pages.

## Subtasks

- [x] **Extend NavItem interface**: Add optional `badge?: string | number | null` property to nav items
- [x] **Render badge in SidebarNav**: When an item has a badge, show it as a small pill (e.g., `<span className="ml-auto text-xs ...">3</span>`)
- [x] **Create a data provider**: Lightweight SWR hook that fetches active call count and unacked alert count
  - Endpoint: reuse existing `/calls/active` (count) and `listOperatorEvents({ status: "open" })` (count)
  - Refresh: every 30s (lighter than page-level polling)
- [x] **Wire counts into TenantShell**: Pass badge values to the nav sections for "Active Calls" and "Alerts" items
- [x] **Alert indicator**: When there are unacked critical alerts, show a red dot or "!" next to the count

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/sidebar-nav.tsx` | Modify | Support badge prop on nav items |
| `apps/web/src/components/tenant-shell.tsx` | Modify | Fetch and pass badge data |
| `apps/web/src/hooks/use-nav-badges.ts` | Create | SWR hook for nav badge data |
| `apps/web/src/lib/tenant-workbench.ts` | Modify | NavItem type supports badge |

## Implementation Notes

- The badge should not cause layout shifts — use `min-w-5` and center the text.
- Badge style: `ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary-100)] px-1.5 text-[11px] font-semibold text-[var(--color-primary-700)]`
- Critical alert indicator: `bg-[var(--color-error-100)] text-[var(--color-error-700)]` when unacked criticals exist.
- The hook should be lightweight — count-only queries if the API supports it, or just `.length` from a small result set.
- Do NOT add badges to deployment console sidebar (it's for technical users who don't need at-a-glance counts).

## Acceptance Criteria

- [x] Active Calls nav item shows count of live calls
- [x] Alerts nav item shows count of open alerts
- [x] Critical alerts get a visually distinct indicator (red dot or badge)
- [x] Counts auto-update every 30s
- [x] No layout shift when counts appear/disappear
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Wireframe: "SIDEBAR NAV" sketch (2026-03-26)
