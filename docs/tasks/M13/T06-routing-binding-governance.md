# T06: Governed number-binding refactor + DID invariant preservation

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01, T04, T05
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T06 - refactor number binding with governed DID invariants`

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

Refactor the number-to-assistant binding layer so persisted telephony inventory can coexist with the current DID lookup contract without breaking fail-closed governed inbound routing.

## Subtasks

- [x] **Define binding projection**: admin phone-number routing now reads and writes `public.phone_number_bindings` joined to persisted telephony inventory.
- [x] **Preserve DID lookup contract**: inbound routing now resolves active live bindings from `public.phone_number_bindings` + `public.telephony_numbers` without weakening governed `agent_definition_id` enforcement.
- [x] **Add migration and rollback notes**: inbound routing runbooks now describe the binding-backed flow and the temporary legacy fallback.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/voice/phone_numbers.py` | Modify | Evolve current binding service toward new inventory-backed model |
| `packages/platform-core/src/platform_core/voice/inbound.py` | Modify | Preserve DID lookup invariant during migration |
| `wiki/ops/inbound-voice-routing.md` | Modify | Update governed binding and rollback instructions |

## Implementation Notes

- Do not weaken published-assistant enforcement.
- Fail-closed behavior is more important than migration convenience.

## Acceptance Criteria

- [x] Migration path preserves current inbound routing guarantees.
- [x] Binding layer remains governed and tenant-safe.
- [x] Rollback steps are documented before execution.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [inbound-voice-routing.md](../../../wiki/ops/inbound-voice-routing.md)
