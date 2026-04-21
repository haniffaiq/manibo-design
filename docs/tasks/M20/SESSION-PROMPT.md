# M20 Session Prompt: Deployment Console UX

> Historical prompt only. M20 is complete and archived; do not use this as a live implementation brief.

Historical implementation prompt for M20 (Deployment Console UX).

## Context
- Historical context: M21 had remaining T13/T14 work that depended on M20 delivering Skeleton and Tooltip components.
- M20 has 16 tasks. Start with T01-T04 (component library additions) first — they unblock M21 T13+T14 and the rest of M20.
- Historical note: branch/PR setup guidance below reflects the original implementation moment, not current workflow.

## Key files to read first
- docs/milestones/M20-deployment-console-ux.md (milestone doc with all 16 tasks + wireframes)
- docs/tasks/M20/PROGRESS.md (task status tracker)
- wiki/design-docs/deployment-console-ux-spec.md (full design spec — 586 lines)
- AGENTS.md (repository guidelines)
- wiki/design-docs/react-best-practices.md (React/Next.js rules)
- packages/ui/src/ (existing component library — check what already exists)

## Task execution order

Phase 1 (component library — do first, unblocks everything):
  T01 (Tabs) + T02 (Tooltip) + T03 (Select) + T04 (Skeleton) — all independent, can parallel

Phase 2 (admin structure — independent quick wins):
  T05 (sidebar reorg) + T06 (dashboard redesign) + T07 (disabled button contrast) + T10 (assistant labels) + T16 (confirm→Modal) — all independent

Phase 3 (component integration — depends on Phase 1):
  T08 (Select on pickers) depends on T03
  T09 (Skeleton loading states) depends on T04
  T11 (Tabs on observability) depends on T01
  T14 (Tooltip on blocked actions) depends on T02

Phase 4 (observability polish — sequential):
  T12 (observability layout) depends on T11
  T13 (observability density) depends on T12

Phase 5 (verification):
  T15 (Playwright regression) depends on T05-T14, T16

## Critical implementation notes
1. Components go in packages/ui/src/ following existing patterns (Badge, Button, Card, Modal, etc.)
2. Use Radix UI primitives: Tabs (@radix-ui/react-tabs), Tooltip (@radix-ui/react-tooltip), Select (@radix-ui/react-select)
3. Skeleton is CSS-only (no Radix dependency) — just animated placeholder shapes with animate-pulse
4. All components use the existing brand token CSS variables (--color-*, --radius-*, --shadow-*)
5. Disabled buttons: bg-neutral-100 text-neutral-400 border-neutral-200 (never opacity). Destructive disabled: bg-error-50 text-error-300
6. No refresh buttons — pages auto-update via SWR refreshInterval (UX decision from M21)
7. Assistant lifecycle labels: draft→"Draft", published→"Live", retired→"Retired". "Under review" only on version detail.
8. Observability already has full-width layout and admin route support — T11-T13 add Tabs and density improvements

## After M20 ships
M21 T13 (Skeleton on tenant pages) and T14 (Tooltip on tenant pages) can be unblocked. Session prompt at docs/tasks/M21/SESSION-PROMPT-T13-T14.md.

## What was learned from M21 implementation
- Decompose early, not after. T16/T24/T25 proved that extracting from a monolith after the fact creates rework.
- Components that own their data (SWR hooks) scale better than prop-drilling from a parent shell.
- SWR keys should be centralized from the start (T31 was a cleanup pass).
- No refresh buttons — SWR refreshInterval + SSE handles freshness.
- File size gates catch creep from import additions — keep imports tight.
- Codex review catches real issues (stale caches, missing error handling, accessibility gaps) — address before merging.
