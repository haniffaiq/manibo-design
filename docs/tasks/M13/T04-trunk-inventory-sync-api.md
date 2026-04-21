# T04: Trunk and route inventory APIs + reconciliation

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T04 - add trunk inventory and reconcile APIs`

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

Add control-plane APIs and services for trunk/route inventory, sync, and reconciliation. This task turns free-text hidden trunk IDs into explicit resources that can be listed, refreshed, health-checked, and selected by operators.

## Subtasks

- [x] **Persist trunk resources**: model inbound/outbound/bidirectional routes with provider and LiveKit bindings.
- [x] **Add sync/reconcile operations**: pull or import trunk state from provider packs and detect drift.
- [x] **Expose operator APIs**: list, refresh, inspect health, and archive trunks/routes.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/trunks.py` | Create | Trunk inventory and reconciliation service |
| `apps/api/src/platform_api/routes/telephony_trunks.py` | Create | Admin APIs for trunk inventory |
| `wiki/ops/phone-number-onboarding.md` | Modify | Update trunk onboarding steps to inventory-driven model |

## Implementation Notes

- One provider account may own many trunks/routes.
- LiveKit binding IDs should be stored as transport metadata, not treated as the only trunk identity.

## Acceptance Criteria

- [x] Operators can list persisted trunks/routes instead of relying on env IDs.
- [x] Reconcile flow can detect stale or missing provider/LiveKit state.
- [x] API contract distinguishes provider trunk identity from LiveKit binding identity.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [phone-number-onboarding.md](../../../wiki/ops/phone-number-onboarding.md)
