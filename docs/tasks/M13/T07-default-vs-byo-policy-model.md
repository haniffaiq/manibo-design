# T07: Deployment-default telephony and tenant BYO policy model

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03
> **Completed**: 2026-04-04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T07 - model default vs BYO telephony policy`

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

Define how deployment-shared default telephony and tenant-owned BYO telephony coexist. This task prevents ownership ambiguity when a tenant can either use provider-managed Telnyx resources or connect its own Genesys/Telnyx account.

## Subtasks

- [x] **Define ownership rules**: deployment-owned shared resources vs tenant-owned resources.
- [x] **Define eligibility and visibility rules**: which tenants can consume shared telephony resources.
- [x] **Define override semantics**: tenant BYO must override defaults without hidden coupling.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/policy.py` | Create | Ownership and share-policy rules |
| `apps/api/src/platform_api/routes/telephony_policy.py` | Create | Admin APIs for default/BYO policy control |
| `wiki/ops/phone-number-onboarding.md` | Modify | Document default-vs-BYO flows |

## Implementation Notes

- Shared provider accounts must never blur tenant ownership or routing boundaries.
- Policy needs to be explicit, audited, and explainable in UI copy.

## Acceptance Criteria

- [x] Platform-default telephony and tenant BYO can coexist in one deployment model.
- [x] Policy rules define visibility, override, and assignment boundaries clearly.
- [x] No operator workflow depends on browser env values for policy behavior.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [phone-number-onboarding.md](../../../wiki/ops/phone-number-onboarding.md)
