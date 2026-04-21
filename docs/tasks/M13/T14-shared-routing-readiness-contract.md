# T14: Shared routing readiness contract

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T14 - unify telephony routing readiness`

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

Define one shared routing-readiness contract in `platform-core` and make inbound DID lookup enforce the same trunk-readiness rules already expected by observability and routing read models.

## Subtasks

- [ ] **Create one shared readiness helper**: centralize the readiness predicate and its required row fields in a `platform-core` helper module.
- [ ] **Converge inbound DID lookup on that contract**: join `public.telephony_trunks`, require active trunks plus non-empty `livekit_binding_id`, and fail closed when the route is not ready.
- [ ] **Add regression coverage**: unit tests cover degraded trunks, missing trunk bindings, and the healthy path.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/voice/routing_readiness.py` | Create | Shared readiness predicate and row contract |
| `packages/platform-core/src/platform_core/voice/inbound.py` | Modify | DID lookup uses the shared readiness contract |
| `packages/platform-core/tests/unit/test_voice/test_inbound.py` | Modify | Coverage for degraded and missing-trunk DID cases |
| `packages/platform-core/src/platform_core/voice/phone_number_types.py` | Modify | Reuse the shared readiness helper instead of duplicating the predicate |
| `apps/api/src/platform_api/routes/observability_channel_runtime_support.py` | Modify | Import the shared readiness helper or remove the local duplicate |

## Implementation Notes

- Do not introduce a second readiness enum or status taxonomy.
- The shared helper should encode one rule only: whether a route is ready to handle live traffic now.
- `lookup_did()` must stop being more permissive than observability.

## Acceptance Criteria

- [ ] One shared readiness contract exists in `platform-core`.
- [ ] `lookup_did()` requires an active trunk and a non-empty `livekit_binding_id`.
- [ ] Inbound DID lookup and observability cannot disagree on a degraded-trunk route anymore.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
