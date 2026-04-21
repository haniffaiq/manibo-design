# M27 Session Prompt: Console Craft & Progressive Disclosure

Start implementing M27 on branch `feat/M27-console-craft` (worktree already exists at `../manibo-M27-console-craft`).

## Context

- M20 (deployment console), M21 (operator console), and M22 (admin shared patterns) are all done — the UI is structurally correct but lacks craft.
- An interface design critique (2026-03-26) identified 10 findings affecting non-technical operator usability: button overload, exposed technical metrics, no progressive disclosure, inconsistent components, visual mismatches.
- This milestone is **pure frontend/UI** — no backend changes, no new API endpoints (except migrating alerts to SWR).
- The audience is clinical operators, driver dispatchers, and deployment admins — people who are not developers.

## Key files to read first

- `docs/milestones/M27-console-craft-progressive-disclosure.md` (milestone doc with 17 design decisions)
- `docs/tasks/M27/PROGRESS.md` (task status + dependency graph + execution phases)
- `AGENTS.md` (repository guidelines)
- `wiki/design-docs/react-best-practices.md` (React/Next.js rules — waterfalls, bundle size, SSR)

### @grove/ui package (where new shared components go)

- `packages/ui/src/components/index.ts` — barrel export (add new components here)
- `packages/ui/package.json:6-36` — exports map (add `"./drawer"`, `"./overflow-menu"` entries)
- `packages/ui/src/components/sheet.tsx` — existing Radix Dialog-based Sheet (evaluate as Drawer base)
- `packages/ui/src/components/badge.tsx` — Badge component (replaces custom EscalationBadge)
- `packages/ui/src/components/data-table.tsx` — DataTable (add row hover here)
- `packages/ui/src/tokens/brand.css` — design tokens (add missing `--color-error-100`, `--color-warning-100`)

### Operator console (what gets redesigned)

- `apps/web/src/app/(tenant)/call-ops/page.tsx` (296 lines) — active calls page, needs button hierarchy + collapsed performance
- `apps/web/src/components/call-ops/active-calls-table.tsx` (131 lines) — 6 buttons per row, replace with 2 + overflow
- `apps/web/src/components/call-ops/escalation-badge.tsx` (20 lines) — DELETE, replace with Badge
- `apps/web/src/components/call-ops/support-drawer.tsx` (200 lines) — custom positioning, needs Drawer + 3-tier progressive disclosure
- `apps/web/src/components/call-ops/support-guidance-section.tsx` (91 lines) — excellent guidance text, keep as-is, make it the focal point
- `apps/web/src/components/call-ops/urgent-banner.tsx` (26 lines) — add inline Transfer + Join buttons
- `apps/web/src/components/call-ops/live-transcript.tsx` (108 lines) — minor: hide seq#, show speaker + time
- `apps/web/src/components/call-ops/slowdown-summary.tsx` (151 lines) — moves inside collapsed `<details>`
- `apps/web/src/app/(tenant)/call-ops/history/page.tsx` (768 lines) — biggest file, needs master-detail split + Drawer for technical details
- `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` (292 lines) — manual state → SWR, card layout, relative timestamps

### Deployment console

- `apps/web/src/app/(deployment)/admin/page.tsx` (172 lines) — flat KPI strip → health hero card

### Shared components (sidebar, errors)

- `apps/web/src/components/sidebar-nav.tsx` (138 lines) — `rounded-2xl` → `rounded-lg`, `rgba()` → tokens
- `apps/web/src/components/tenant-shell.tsx` (100 lines) — "K" icon styling, language selector
- `apps/web/src/components/action-banners.tsx` (37 lines) — DELETE after T21 migration
- `apps/web/src/components/inline-notice.tsx` (17 lines) — DELETE after T21 migration
- `apps/web/src/components/session-insights-feed.tsx` (78 lines) — reused in call history detail panel
- `apps/web/src/lib/tenant-workbench.ts` (98 lines) — nav item types (add badge support)
- `apps/web/src/lib/swr-keys.ts` — SWR key factories (add `operatorAlerts` for T17)

### Escalation modal (minimal changes)

- `apps/web/src/components/call-ops/escalation-modal.tsx:96` — remove `className="top-8 max-h-[calc(100vh-4rem)] -translate-y-0 overflow-y-auto"` hack

## Task execution order

Phase 1 — Foundations (all independent, run in parallel):
  T01 (design tokens) — add `--color-error-100`, `--color-warning-100`, `--color-warning-200` to brand.css
  T02 (Drawer component) — `@grove/ui`, wraps existing Sheet or builds on Radix Dialog
  T03 (OverflowMenu) — `@grove/ui`, install `@radix-ui/react-dropdown-menu` first
  T04 (RelativeTime) — app-level utility, pure function + auto-updating component
  T05 (StatusMessage) — app-level, replaces 3 different error patterns
  T07 (DataTable hover) — `hover:bg-[var(--color-bg-subtle)]` on body `<tr>`
  T11 (urgent banner buttons) — add Transfer + Join call inline
  T22 (escalation modal) — remove className position hack

Then sequentially:
  T06 (sidebar alignment) — needs T01 tokens
  T08 (EscalationBadge → Badge) — needs T01 tokens

Phase 2 — Core redesigns (after Phase 1):
  T09 (button hierarchy) — needs T03 + T08 → T10 (card-per-call) — needs T09
  T12 (collapse performance) — independent
  T13 (drawer progressive disclosure) — needs T02 → T14 (migrate to Drawer) — needs T13
  T15 (master-detail history) — needs T02 → T16 (technical Drawer) — needs T15
  T17 (alerts SWR) — independent

Phase 3 — Polish (after Phase 2):
  T18 (card-per-alert) — needs T04 + T17
  T19 (health hero) — independent
  T20 (nav pills) — needs T06
  T21 (unify errors) — needs T05

Phase 4 — Verification (after all code):
  T23 (Playwright visual regression) — needs T09-T22
  T24 (screenshots + QA checklist) — needs T23

## Critical implementation notes

1. **Package names**: web app is `@nfq/web`, UI library is `@grove/ui`. Script is `check-types` (NOT `typecheck`). Playwright is `playwright:test`.
2. **UI exports pattern**: New components in `packages/ui/` need BOTH a barrel export in `src/components/index.ts` AND an entry in `package.json` `exports` map (e.g., `"./drawer": "./src/components/drawer.tsx"`).
3. **`@radix-ui/react-dropdown-menu` is NOT installed** — T03 must add it: `pnpm --filter @grove/ui add @radix-ui/react-dropdown-menu`.
4. **Sheet component exists** — `packages/ui/src/components/sheet.tsx` is a Radix Dialog-based side panel. Evaluate as base for Drawer before building from scratch.
5. **No refresh buttons** — UX decision from M21: pages must auto-update via SWR intervals. Remove any manual refresh buttons.
6. **`<details>` for progressive disclosure** — Use native HTML `<details>`/`<summary>` for collapsed sections. No JS needed, works without hydration.
7. **data-testid preservation** — Every component has Playwright-facing `data-testid` attributes. Preserve them through all refactors. Overflow menu items need testids too.
8. **T11 and T12 both modify `call-ops/page.tsx`** — sequence them carefully to avoid merge conflicts within the same commit chain.
9. **File size gate** — `call-ops/history/page.tsx` is 768 lines. The master-detail split should reduce it, not grow it. Extract the detail panel into a separate component if needed.
10. **Verification commands**:
    ```bash
    pnpm --filter @nfq/web check-types    # TypeScript
    pnpm --filter @grove/ui check-types   # UI library
    pnpm --filter @nfq/web lint           # Lint
    pnpm --filter @nfq/web test           # Vitest
    pnpm --filter @nfq/web playwright:test -- tests/visual/  # Playwright
    ```
11. **OTLP evidence** — Required in PR body even for frontend-only changes. For pure UI, check `[x] Yes` and provide evidence blocks explaining no new spans/logs/metrics were introduced.
12. **One task = one commit**. Commit message: `feat: M27 T{NN} - {short description}`. Update PROGRESS.md after each task.
