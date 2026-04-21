# M1.1: Observability Navigation Modes — Progress

## Task Status

### Phase 0 — Post-decomposition cleanup

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T08 | Split useWorkspaceState into useQueueFilters + useCaseDetail + useCaseCompare | Done | 2026-03-25 |
| T09 | Extract QueueFilters sub-component from case-queue.tsx | Done | 2026-03-25 |
| T10 | Replace loadRunDetail/loadTimelinePage cascading ifs with registry pattern | Done | 2026-03-25 |
| T11 | Migrate toErrorMessage consumers to direct @grove/web-shared import | Done | 2026-03-25 |
| T12 | Adopt AdminPageShell across admin pages | Done | 2026-03-25 |
| T13 | Support dynamic allowEmpty on Select for conditional empty option | Done | 2026-03-25 |

### Phase 1 — Navigation modes

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Mode detection from URL/selection state | Done | 2026-03-25 |
| T02 | Queue-mode full-width layout with channel badges | Done | 2026-03-25 |
| T03 | Channel filter dropdown in queue filters | Done | 2026-03-25 |
| T04 | Live case pinning with separator and live badge | Done | 2026-03-25 |
| T05 | Case-mode full-width layout with back-nav | Done | 2026-03-25 |
| T06 | Compare-mode full-width layout | Done | 2026-03-25 |
| T07 | Update E2E tests for new layout and channel badges | Done | 2026-03-25 |

## Notes

Depends on M1 completion (component decomposition) — DONE.

Phase 0 addresses pain points discovered during M1 implementation:
- T08: use-workspace-state.ts is at 700-line ceiling, needs hook decomposition
- T09: case-queue.tsx advanced filters is ~200 lines of raw HTML selects
- T10: utils.ts has 70-line switch statements that should be a registry
- T11: toErrorMessage re-export chain in use-action-state.ts is tech debt
- T12: AdminPageShell exists but zero pages use it yet
- T13: phone-numbers page can't use allowEmpty because empty option is conditional

Channel badges: 📞 Voice, 💬 Chat (widget/WhatsApp), 📧 Email, ⚙ Workflow, 🔴 Incident
Live pinning: running cases pin to top with [Live] badge and live duration counter.
