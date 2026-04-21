# T15: Derived readiness reader convergence

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T14

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T15 - converge telephony readers on derived readiness`

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

Repoint all telephony readers to derived readiness from the shared contract instead of duplicated local predicates, stale `routing_status` assumptions, or reader-specific status logic.

## Subtasks

- [ ] **Converge API/read-model helpers**: observability, number read models, and support utilities consume the same derived readiness contract.
- [ ] **Converge operator-facing labels**: UI-facing status helpers derive `Ready` / `Needs attention` from the shared contract instead of local ad hoc logic.
- [ ] **Lock the behavior with tests**: unit and integration coverage prove the same row facts produce the same readiness result across surfaces.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/voice/phone_number_types.py` | Modify | Remove duplicated readiness predicate and use the shared helper |
| `packages/platform-core/src/platform_core/telephony/number_support.py` | Modify | Align number-support read models with derived readiness |
| `apps/api/src/platform_api/routes/observability.py` | Modify | Route observability row rendering through the shared contract |
| `apps/api/tests/unit/test_observability_v2_read_models.py` | Modify | Assert derived readiness against the shared rule |
| `apps/web/src/app/(deployment)/admin/telephony/view-models.tsx` | Modify | Collapse UI labels onto derived readiness |
| `apps/web/tests/admin-telephony-page.test.tsx` | Modify | Cover `Ready` / `Needs attention` rendering from derived state |

## Implementation Notes

- This task is reader convergence, not schema deletion.
- If a compatibility field still exists, readers must treat it as informational only, never authoritative.
- Do not add more UI status variants while simplifying.

## Acceptance Criteria

- [ ] Telephony readers no longer define independent readiness predicates.
- [ ] Operator-facing labels come from derived readiness, not stored `routing_status`.
- [ ] Tests prove consistent readiness outcomes across backend and UI surfaces.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T14-shared-routing-readiness-contract.md](./T14-shared-routing-readiness-contract.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
