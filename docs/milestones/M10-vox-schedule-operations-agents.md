# M10: VOX Phase 2 -- Schedule + Operations Agents

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M10-vox-schedule-operations
Stream: platform
Depends on: M8, M9
Reference: docs/requirements/vox.md (REQ-P01 through REQ-P05), docs/requirements/checklist.md rows 173-196, 209-210

## Goal

SMA (Schedule Management Agent) handles natural-language schedule changes with conflict detection and notification dispatch. OMA (Operations Management Agent) provides continuous monitoring with an escalation ladder for overdue tasks, missing confirmations, and operational anomalies.

## Design Decisions

1. **Scheduling API is an integration adapter** -- SMA reads/writes via a pluggable scheduling adapter, not a built-in calendar.
2. **Conflict detection is synchronous** -- SMA validates conflicts before executing changes, not after.
3. **Notifications fan out to all affected parties** -- schedule changes notify students, teachers, and admins via the existing notification system.
4. **OMA runs on a periodic Temporal schedule** -- scan interval is configurable per tenant, not hardcoded.
5. **Escalation ladder is a ordered rule set** -- L1 auto-remind, L2 staff notify, L3 manager escalate, L4 auto-action. Each level has a timeout before escalation.
6. **Autonomous actions require explicit policy** -- OMA only takes auto-actions (cancel, reschedule) when the tenant policy allows it.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Scheduling API integration (read/write) | not started | none |
| T02 | SMA intent parsing | not started | T01 |
| T03 | Conflict detection + validation | not started | T01 |
| T04 | Change execution + notification dispatch | not started | T02, T03 |
| T05 | OMA task scanner | not started | none |
| T06 | Escalation ladder implementation | not started | T05 |
| T07 | Autonomous action rules | not started | T05, T06 |
| T08 | Observability for SMA/OMA in UI | not started | T04, T07 |
| T09 | E2E tests | not started | T01-T08 |

## Acceptance Criteria

- [ ] SMA executes schedule changes via natural language with conflict detection
- [ ] Conflicts are detected and reported before execution
- [ ] Notifications sent to all affected parties (students, teachers, admins)
- [ ] OMA detects overdue tasks on configured scan interval
- [ ] Escalation ladder advances through levels with configurable timeouts
- [ ] Autonomous actions execute only when tenant policy permits
- [ ] SMA and OMA activity visible in observability
- [ ] `uv run pytest` passes for scheduling, conflict, OMA, and escalation tests
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## Verification

```bash
uv run pytest apps/temporal-worker/tests/ -k "schedule or oma or escalation" -v --tb=short
uv run pytest apps/api/tests/ -k "schedule or oma" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No built-in calendar UI (SMA operates via chat/voice NL interface)
- No OMA rule editor in UI (escalation config is admin/backend)
- No cross-tenant OMA monitoring

## M33 Impact

**Enables new scope (highest autonomous value).** SMA and OMA shift from periodic rail workflows to continuous autonomous agents with pattern learning. OMA learns escalation rules from feedback ("When teacher confirms late, remind student 1 hour before"). SMA learns conflict resolution patterns across sessions. Both gain contact-context awareness via M32 integration.
