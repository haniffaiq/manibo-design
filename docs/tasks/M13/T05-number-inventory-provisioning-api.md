# T05: Number inventory and acquisition/import APIs

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03, T04
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T05 - add number inventory and provisioning APIs`

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

Add number inventory APIs that support importing, syncing, and, where provider capabilities allow, acquiring phone numbers in product. Telnyx should support search/order/import. Genesys should support import/sync even if purchase is unsupported.

## Subtasks

- [x] **Persist number inventory**: provider-owned numbers are local resources with provider IDs and status.
- [x] **Implement import/sync flow**: refresh provider numbers into local inventory.
- [x] **Capability-gated acquisition**: expose number search/order only for providers that support it.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/numbers.py` | Create | Number inventory service |
| `apps/api/src/platform_api/routes/telephony_numbers.py` | Create | Admin APIs for number inventory |
| `solutions/provider_telnyx/src/provider_telnyx/telephony_numbers.py` | Create | Telnyx number search/order/import logic |

## Implementation Notes

- Imported numbers and purchased numbers should converge into one inventory model.
- Genesys may require manual import/reconcile flows; do not fake purchase support.

## Acceptance Criteria

- [x] Number inventory is persisted and queryable in product.
- [x] Import/sync works for supported providers.
- [x] Acquisition UI/API is capability-gated and provider-aware.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [phone-number-onboarding.md](../../../wiki/ops/phone-number-onboarding.md)
