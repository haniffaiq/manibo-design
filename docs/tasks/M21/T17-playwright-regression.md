# T17: Playwright Regression + Chrome DevTools Verification

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T17 - Playwright regression + Chrome DevTools verification`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Update all tenant E2E tests to account for the changed UI (sidebar job-groups, PageFrame wrappers, new component structure from call-ops decomposition, bookings decomposition). Add `expectTextFits()` guards on call-ops action buttons to catch text overflow. Run the full Playwright suite, UI harness, and Chrome DevTools MCP verification for desktop and mobile screenshots on all changed pages.

## Subtasks

- [x] **Update sidebar tests** — account for job-group structure (Live Support, Review, solution domains, Manage)
- [x] **Update call-ops tests** — account for extracted components (ActiveCallsTable, SlowdownSummary, LiveTranscript, SupportDrawer, EscalationModal)
- [x] **Update call-history tests** — account for shared hooks (use-sse-stream, use-call-detail)
- [x] **Update bookings tests** — account for decomposed components
- [x] **Add expectTextFits() guards** on call-ops action buttons (Support, Listen, Join, Take over, Transfer now)
- [x] **Run full Playwright suite** — all tenant E2E specs pass
- [x] **Run UI harness** — `tools/scripts/e2e/run-web-e2e.sh`
- [x] **Chrome DevTools MCP screenshots** — desktop and mobile for all changed tenant pages (call-ops, bookings, dashboard, team, settings)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/call-ops-live.spec.ts` | Modify | Update for extracted components, add expectTextFits() |
| `apps/web/e2e/dashboard.spec.ts` | Modify | Update for PageFrame wrapper |
| `apps/web/e2e/call-history.spec.ts` | Modify | Update for shared hooks |
| `apps/web/e2e/clinic-bookings.spec.ts` | Modify | Update for decomposed bookings components |
| `apps/web/e2e/operator-alerts.spec.ts` | Modify | Update for PageFrame + Skeleton |
| `apps/web/e2e/automations.spec.ts` | Modify | Update for Select + Skeleton |
| `apps/web/e2e/team-management.spec.ts` | Modify | Update for Modal confirmation |
| `apps/web/e2e/integrations.spec.ts` | Modify | Update for PageFrame + Skeleton |
| `apps/web/e2e/driver-verification.spec.ts` | Modify | Update for PageFrame + Skeleton |

## Acceptance Criteria

- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] All Playwright E2E tests pass
- [x] `expectTextFits()` guards on call-ops action buttons
- [x] UI harness passes
- [x] Chrome DevTools MCP desktop screenshots for: call-ops, bookings, dashboard, team, settings, integrations, alerts
- [x] Chrome DevTools MCP mobile screenshots for: call-ops, bookings, dashboard, team, settings, integrations, alerts (AGENTS.md rule 7 requires mobile proof for every changed apps/web page)

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Depends on: all preceding tasks (T01-T16)
