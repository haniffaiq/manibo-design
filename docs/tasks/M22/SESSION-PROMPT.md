# M22 Session Prompt: Admin Shared Patterns

> Historical prompt only. M22 is complete and archived; do not use this as a live implementation brief.

Historical implementation prompt for M22 (Admin Shared Patterns).

## Context
- M20 (Deployment Console UX) is done. During implementation, 6+ admin pages were found to duplicate the same action state, tenant picker, confirmation dialog, and disabled-button Tooltip plumbing.
- M22 extracts those patterns into shared hooks and component props.
- No new features. Pure refactor. Net line count should decrease.

## Key files to read first
- docs/milestones/M22-admin-shared-patterns.md (milestone doc with all 8 tasks)
- docs/tasks/M22/PROGRESS.md (task status tracker)
- AGENTS.md (repository guidelines)
- wiki/design-docs/react-best-practices.md (React/Next.js rules)
- apps/web/src/hooks/ (existing hooks — use-notice.ts is the composable pattern)
- apps/web/src/app/(deployment)/admin/users/page.tsx (most complete example of all 3 duplicated patterns)

## Task execution order

Phase 1 (hooks + component — all independent):
  T01 (useActionState) + T02 (useTenantPicker) + T03 (useConfirmDialog) + T04 (disabledReason) + T05 (Modal CSS) + T06 (SelectItem guard) — all independent, can parallel

Phase 2 (integration — depends on Phase 1):
  T07 (migrate admin pages) depends on T01, T02, T03
  T08 (E2E cleanup) depends on T05

## Critical implementation notes
1. Hooks go in `apps/web/src/hooks/` following `use-notice.ts` pattern
2. Components go in `apps/web/src/components/` or `packages/ui/src/components/`
3. Preserve all existing `data-testid` attributes — E2E tests depend on them
4. Run E2E tests after each page migration in T07 to catch regressions early
5. The `toErrorMessage()` function is duplicated in 6 pages — extract to shared util
6. OTLP evidence is required in PR body even for frontend-only changes (see CLAUDE.md)
