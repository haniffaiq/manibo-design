# M27: Console Craft & Progressive Disclosure

Status: done
Created: 2026-03-26
Owner: Jakit
Branch: feat/M27-console-craft
Stream: ui
Depends on: M21 (done), M20 (done), M22 (done)
Reference: UI critique session 2026-03-26 (ASCII wireframes in conversation)

## Goal

Raise the deployment console and operators console from correct to crafted. The current UI was built with solid structure (M20/M21/M22) but exposes technical metrics to non-coders, overloads operators with peer-level buttons, offers no progressive disclosure, and has visual inconsistencies between the sidebar and content area. This milestone fixes the ten findings from the interface design critique, adds browser-based verification via Playwright, and ensures every change is visually validated.

## Design Decisions

1. **Button hierarchy on active calls** — Each call row shows 2 primary actions (Take over / Transfer) + 1 overflow menu ("...") containing secondary actions (Support details, Listen in, Join call, Watch transcript). "Take over" is primary variant, "Transfer" is outline. When escalated, "Claim" replaces "Take over" in same position.

2. **Progressive disclosure in three tiers** — Operator-facing content is always visible (guidance, actions, session insights). Technical metrics (latency, stack cards) are in a collapsed `<details>` section. Deep technical trace (assistant path, node table, trace IDs) is in a second collapsed section. Operators see what matters; tech staff expand what they need.

3. **Call ops performance section collapsed** — SlowdownSummary and hotspot table move into a collapsible "Performance summary" section below the active calls, collapsed by default.

4. **Call history master-detail layout** — Replace the stacked cards with a side-by-side layout: compact results list on the left, call detail panel on the right. Familiar email-client pattern for non-coders.

5. **Alerts auto-refresh** — Replace manual state management with SWR + `refreshInterval: 10_000`. Remove the "Refresh" button. Show "Updated Xs ago" instead. Filters auto-apply on change.

6. **Unified Drawer component** — Build a proper `Drawer` in `@grove/ui` to replace both the custom SupportDrawer positioning and the Modal-with-className-hack in call history. Both consumers switch to the shared component.

7. **OverflowMenu component** — Build using Radix DropdownMenu (already a dependency). The "..." trigger button with a dropdown of secondary actions.

8. **Unified error/notice pattern** — Consolidate ActionBanners, InlineNotice, and scattered inline error `<p>` tags into a single `StatusMessage` component with variant support.

9. **Sidebar visual alignment** — Switch sidebar nav items from `rounded-2xl` to `rounded-lg`, replace raw `rgba()` borders with `var(--color-border)`, replace custom shadows with `var(--shadow-sm)`.

10. **EscalationBadge uses Badge** — Delete the custom EscalationBadge component. Use `<Badge variant="error">` and `<Badge variant="warning">` from `@grove/ui` directly.

11. **Deployment dashboard health hero** — Promote platform health + error rate to a hero card at the top. Demote the KPI strip items into the quick links grid.

12. **Missing design tokens** — Add `--color-error-100` and `--color-warning-100` to `brand.css`.

13. **DataTable row hover** — Add `hover:bg-[var(--color-bg-subtle)]` to table rows globally.

14. **Nav live counts** — Show pill counts on Active Calls and Alerts sidebar items using data already fetched by the pages.

15. **Card-per-call layout** — Replace the DataTable in active calls with individual call cards. Each card shows call ID + escalation badge + workflow label + primary actions + overflow menu.

16. **Card-per-alert layout** — Replace the DataTable in alerts with individual alert cards. Severity indicated by left border color. Relative timestamps ("2 min ago") with absolute on hover.

17. **Urgent banner inline actions** — Add Transfer + Join call buttons directly inside the urgent call banner, so operators don't have to find the row first.

## Tasks

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T01 | Add missing design tokens to brand.css | not started | none | S |
| T02 | Build Drawer component in @grove/ui | not started | none | M |
| T03 | Build OverflowMenu component | not started | none | M |
| T04 | Build RelativeTime utility component | not started | none | S |
| T05 | Build StatusMessage unified notice component | not started | none | S |
| T06 | Align sidebar visual language (radius, tokens, shadows) | not started | T01 | M |
| T07 | Add DataTable row hover states | not started | none | S |
| T08 | Replace EscalationBadge with Badge from @grove/ui | not started | T01 | S |
| T09 | Active calls: button hierarchy + overflow menu | not started | T03, T08 | L |
| T10 | Active calls: card-per-call layout | not started | T09 | L |
| T11 | Urgent banner: inline action buttons | not started | none | S |
| T12 | Call ops: collapse performance section | not started | none | M |
| T13 | Support drawer: progressive disclosure (3 tiers) | not started | T02 | L |
| T14 | Support drawer: migrate to Drawer component | not started | T02, T13 | M |
| T15 | Call history: master-detail split layout | not started | T02 | L |
| T16 | Call history: technical drawer uses Drawer component | not started | T02, T15 | M |
| T17 | Alerts: SWR auto-refresh, remove Refresh button | not started | none | M |
| T18 | Alerts: card-per-alert layout + relative timestamps | not started | T04, T17 | L |
| T19 | Deployment dashboard: health hero card | not started | none | M |
| T20 | Sidebar: nav live count pills | not started | T06 | M |
| T21 | Unify error/notice patterns across all pages | not started | T05 | L |
| T22 | Escalation modal: remove position hack | not started | none | S |
| T23 | Playwright visual regression suite | not started | T09-T22 | L |
| T24 | Browser screenshot verification + manual QA checklist | not started | T23 | M |

## Acceptance Criteria

- [x] Active calls page shows max 2 primary buttons + overflow menu per call (not 6 peer buttons)
- [x] Support drawer has 3 tiers: always-visible guidance, collapsed performance, collapsed technical trace
- [x] Call history uses master-detail split layout (list left, detail right)
- [x] Alerts page auto-refreshes every 10s with SWR, no manual Refresh button
- [x] All sidebar nav items use `rounded-lg` and `var(--color-border)`, no raw `rgba()`
- [x] EscalationBadge component deleted, replaced with Badge from @grove/ui
- [x] One Drawer component in @grove/ui used by both SupportDrawer and call history technical details
- [x] One StatusMessage component replaces ActionBanners + InlineNotice + scattered error `<p>` tags
- [x] Deployment dashboard has health hero card as focal point
- [x] DataTable rows highlight on hover
- [x] `--color-error-100` and `--color-warning-100` exist in brand.css
- [x] Sidebar shows live count pills on Active Calls and Alerts
- [x] Playwright visual regression suite covers all modified screens
- [x] Browser screenshots captured for all redesigned pages (before/after)
- [x] `uv run pyright packages/grove/src/` passes (0 errors)
- [x] `pnpm --filter @nfq/web check-types` passes (0 errors)
- [x] `pnpm --filter @nfq/web lint` passes
- [x] All existing tests continue to pass

## Verification

```bash
# TypeScript
pnpm --filter @nfq/web check-types
pnpm --filter @grove/ui check-types

# Lint
pnpm --filter @nfq/web lint
pnpm --filter @grove/ui lint

# Existing tests
pnpm --filter @nfq/web test

# Playwright visual regression
pnpm --filter @nfq/web playwright:test -- tests/visual/

# Manual: open browser, screenshot each page, compare to wireframes
```

## Non-Goals

- No backend changes. This is pure frontend/UI.
- No new API endpoints or data fetching changes (except alerts SWR migration).
- No changes to observability workspace (M1 scope).
- No solution page redesigns (clinic bookings, driver verification keep current layout).
- No mobile-first responsive redesign (mobile sidebar already works).
- No dark mode.

## Wireframes

All wireframes were captured in the critique session (2026-03-26). Key layouts:

1. **Active Calls** — Card-per-call with 2 primary + overflow, urgent banner with inline actions
2. **Support Drawer** — 3-tier progressive disclosure (guidance → insights → technical)
3. **Call History** — Master-detail split (list left, detail right)
4. **Alerts** — Card-per-alert with severity left border, relative timestamps, auto-refresh
5. **Deployment Dashboard** — Health hero card (2/3 width) + error rate card (1/3), quick links below
6. **Sidebar** — Live count pills, aligned radius/tokens
