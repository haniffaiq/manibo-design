# T02: Provider account control plane + secret references

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Execution**: Completed on 2026-04-03 after explicit human activation of M13.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T02 - add provider account control plane`

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

Create the generic control-plane contract for telephony provider accounts. This task owns provider-account lifecycle, secret-reference handling, status transitions, ownership scope, and audit behavior for deployment-managed vs tenant-owned accounts.

## Subtasks

- [x] **Define provider account lifecycle**: draft, validating, connected, degraded, disconnected, archived.
- [x] **Model secret references**: provider credentials are server-side only and never browser-exposed env values.
- [x] **Add API surface and audits**: create/list/update/test/archive provider accounts with audited state transitions.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/provider_accounts.py` | Create | Provider-account service and validation rules |
| `apps/api/src/platform_api/routes/telephony_provider_accounts.py` | Create | Admin/provider control-plane routes |
| `wiki/ops/first-time-platform-setup-provider-onboarding.md` | Modify | Separate deployment bootstrap from telephony account onboarding |

## Implementation Notes

- Secrets must be represented as server-side refs or encrypted stored credentials, not plaintext config in browser-facing models. Tenant-scoped browser routes must not accept raw `credential_ref` values until tenant-owned secret storage exists, but tenant admins must still be able to test tenant-owned accounts that were provisioned server-side with an existing credential ref.
- Ownership rules must support deployment-shared default telephony and tenant BYO.

## Acceptance Criteria

- [x] Provider accounts are first-class persisted resources with scope and lifecycle.
- [x] Secret handling is server-side only and documented.
- [x] Audit trail exists for provider account lifecycle operations.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [first-time-platform-setup-provider-onboarding.md](../../../wiki/ops/first-time-platform-setup-provider-onboarding.md)
