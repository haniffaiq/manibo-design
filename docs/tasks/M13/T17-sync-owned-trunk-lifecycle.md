# T17: Sync-owned trunk lifecycle

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T04, T14

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T17 - simplify trunk lifecycle to sync ownership`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M13-telephony-management`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M13/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M13/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Remove archive and reconcile as operator lifecycle actions for trunks. Provider sync becomes the only explicit lifecycle owner for local trunk inventory, including handling provider-missing trunks.

## Subtasks

- [ ] **Remove archive/reconcile surfaces**: delete API routes, service methods, UI affordances, and tests that present trunk archive or reconcile as operator actions.
- [ ] **Make sync own missing-provider behavior**: provider sync updates matched trunks, deletes safe orphans, and retains broken dependencies only as internal `Needs attention` cases.
- [ ] **Lock the lifecycle with regression coverage**: tests cover provider-missing trunks with and without dependent numbers.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/trunks.py` | Modify | Remove archive/reconcile lifecycle paths and make sync own provider-missing behavior |
| `apps/api/src/platform_api/routes/telephony_trunks.py` | Modify | Remove archive/reconcile operator routes |
| `apps/web/src/app/(deployment)/admin/telephony/page.tsx` | Modify | Remove any UI assumptions about archive/reconcile actions |
| `packages/platform-core/tests/integration/test_telephony_trunks_review_regressions.py` | Modify | Regression coverage for missing-provider trunk handling |
| `apps/api/tests/integration/test_telephony_trunks_api.py` | Modify | API coverage after archive/reconcile removal |
| `apps/api/tests/integration/test_telephony_trunks_reconcile_api.py` | Delete/Replace | Remove reconcile-specific operator API coverage |

## Implementation Notes

- Sync-owned lifecycle does not mean silent destructive deletion of active dependencies.
- If a provider-missing trunk still has non-released numbers, keep enough state to surface `Needs attention` internally.
- The operator workflow should stay at provider sync + number assignment, not trunk surgery.

## Acceptance Criteria

- [ ] Operator-facing archive and reconcile actions are gone.
- [ ] Provider sync handles provider-missing trunks deterministically.
- [ ] The platform no longer depends on local tombstone/archive semantics to hide stale trunks.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
