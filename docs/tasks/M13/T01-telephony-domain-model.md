# T01: Telephony domain model + migration envelope

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Execution**: Completed on 2026-04-03 after explicit human activation of M13.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T01 - establish telephony domain model`

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

Define the persisted telephony resource model for provider accounts, trunks/routes, number inventory, and tenant-scoped assistant bindings. T01 stays clean-slate: no compatibility projection back to `public.phone_numbers`.

## Subtasks

- [x] **Define persisted resource boundaries**: provider accounts, trunks/routes, numbers, and bindings each have distinct typed models.
- [x] **Lock clean-slate scope**: document that T01 does not include legacy `public.phone_numbers` projection or dual-write behavior.
- [x] **Lock scope and ownership**: document which data is deployment-scoped, tenant-scoped, or shared by policy.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/models.py` | Create | Typed telephony domain models |
| `packages/platform-core/src/platform_core/alembic_public/versions/*_telephony_resources.py` | Create | Public-schema migration for telephony resources |
| `wiki/ops/phone-number-onboarding.md` | Modify | Replace env-centric operator guidance with resource-model guidance |

## Implementation Notes

- Keep the telephony resource model clean and independent from legacy DID tables.
- Do not leak provider-specific fields into generic platform models unless the field is truly universal.
- Do not add speculative compatibility bridges when the setup is greenfield.

## Acceptance Criteria

- [x] Telephony resource model is explicitly defined with typed fields and scope rules.
- [x] Clean-slate telephony resource boundaries are explicit and technically plausible.
- [x] Legacy compatibility is explicitly out of scope for T01.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [inbound-voice-routing.md](../../../wiki/ops/inbound-voice-routing.md)
