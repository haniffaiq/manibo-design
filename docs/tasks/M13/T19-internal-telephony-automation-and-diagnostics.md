# T19: Internal telephony automation and diagnostics boundary

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T17

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T19 - move telephony repair behind internal automation`

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

Move bootstrap linkage, LiveKit binding repair, and trunk-repair guidance behind internal automation or admin-only diagnostics so the default operator workspace stays simple.

## Subtasks

- [ ] **Move bootstrap and repair into automation seams**: reconcile/bootstrap scripts and service helpers own LiveKit/trunk repair logic.
- [ ] **Create an internal diagnostics boundary**: advanced repair details live in diagnostics or ops runbooks, not in the operator page.
- [ ] **Update runbooks and proof expectations**: operator docs explain the simplified surface; internal docs explain the deeper repair path.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/telephony/reconcile_bootstrap.py` | Modify | Treat bootstrap/linkage repair as automation, not operator ceremony |
| `wiki/ops/phone-number-onboarding.md` | Modify | Reflect the simplified operator flow |
| `wiki/ops/inbound-voice-routing.md` | Modify | Move deeper repair guidance into ops/admin diagnostics language |
| `wiki/ops/voice-call-local-demo.md` | Modify | Clarify what remains operator-visible vs internal diagnostics |
| `apps/api/src/platform_api/routes/telephony/runtime.py` | Modify | Keep advanced runtime/bootstrap helpers behind non-operator seams where needed |

## Implementation Notes

- This task does not remove the underlying automation; it removes operator exposure to it.
- Keep provider sync as the only explicit operator maintenance action.
- Any remaining advanced diagnostics surface should be deliberately admin-only or ops-only.

## Acceptance Criteria

- [ ] Bootstrap/livekit/trunk repair are no longer default operator concerns.
- [ ] Runbooks distinguish operator workflow from internal diagnostics clearly.
- [ ] The simplified telephony workspace can stay focused on providers, numbers, assignment, and health.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T18-operator-telephony-workspace-simplification.md](./T18-operator-telephony-workspace-simplification.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
