# T16: Binding model derived-status cleanup

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T15

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T16 - demote routing status to derived state`

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

Demote `routing_status` from an authoritative stored routing decision to derived or compatibility-only state. Persist real facts only, and remove runtime/business decisions that depend on the stored field.

## Subtasks

- [ ] **Simplify write paths**: binding create/update/delete paths persist only real facts needed for routing.
- [ ] **Clean up models and APIs**: runtime and API surfaces stop treating `routing_status` as a first-class authoritative contract.
- [ ] **Make the migration explicit**: either remove the stored field or keep it as an explicitly documented compatibility mirror that no decision path trusts.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/voice/phone_numbers.py` | Modify | Remove authoritative `routing_status` decision-making from binding mutations |
| `packages/platform-core/src/platform_core/voice/phone_number_service_support.py` | Modify | Validation and repair paths rely on real facts, not stored routing state |
| `packages/platform-core/src/platform_core/telephony/models.py` | Modify | Domain model reflects derived routing state direction |
| `packages/platform-core/src/platform_core/alembic_public/versions/*` | Create/Modify | Schema cleanup or explicit compatibility migration for `routing_status` |
| `apps/api/src/platform_api/routes/telephony/phone_numbers.py` | Modify | API responses align with derived status semantics |
| `packages/platform-core/tests/integration/test_telephony_numbers_service.py` | Modify | Coverage for fact-driven binding state |
| `apps/api/tests/integration/test_phone_numbers_api_mutations.py` | Modify | API regression coverage for derived status behavior |

## Implementation Notes

- The desired end state is facts-only persistence.
- If the DB column cannot be deleted in one safe step, the task must still make the compatibility posture explicit and ensure no runtime path trusts it.
- Do not replace `routing_status` with a new stored mini state machine under another name.

## Acceptance Criteria

- [ ] No runtime routing decision depends on a stored `routing_status` value.
- [ ] Binding mutations persist real facts rather than business-readiness guesses.
- [ ] The codebase has an explicit, documented path for removing or isolating the old stored field.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T15-derived-readiness-reader-convergence.md](./T15-derived-readiness-reader-convergence.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
