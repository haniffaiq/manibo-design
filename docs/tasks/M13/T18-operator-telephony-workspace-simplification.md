# T18: Operator telephony workspace simplification

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T16, T17, T08, T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T18 - simplify operator telephony workspace`

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

Simplify the operator telephony workspace so it exposes only provider connection/sync, number assignment/pause, and plain-language health. Trunk lifecycle and transport-repair concepts must disappear from the default operator product.

## Subtasks

- [ ] **Collapse health language**: the default operator health surface uses `Ready` and `Needs attention`.
- [ ] **Keep only operator-relevant actions**: provider sync stays explicit; trunk lifecycle and transport repair actions disappear from the default workspace.
- [ ] **Preserve assistant/inventory consistency**: the assistant attach flow and the numbers workspace keep showing the same simplified status model.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/telephony/page.tsx` | Modify | Remove trunk-lifecycle prominence and keep only provider/numbers flows |
| `apps/web/src/app/(deployment)/admin/telephony/view-models.tsx` | Modify | Simplify health/status presentation |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Modify | Align assistant-side channel status language |
| `apps/web/tests/admin-telephony-page.test.tsx` | Modify | Coverage for simplified operator actions and statuses |
| `apps/web/tests/channels-panel.test.tsx` | Modify | Coverage for assistant-side simplified status display |
| `apps/web/e2e/admin-telephony.spec.ts` | Modify | Browser proof for the simplified operator workflow |

## Implementation Notes

- Default operator UI must not expose `archive`, `reconcile`, `livekit_binding_id`, or raw trunk lifecycle language.
- Assignment and pause are still valid operator actions.
- `Needs attention` should point to the next action, not dump transport internals.

## Acceptance Criteria

- [ ] The default workspace exposes only provider sync plus number assignment/pause as maintenance actions.
- [ ] Operator health language is collapsed to `Ready` / `Needs attention`.
- [ ] Assistant-side and inventory-side telephony views stay aligned after the simplification.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T17-sync-owned-trunk-lifecycle.md](./T17-sync-owned-trunk-lifecycle.md)
- Related: [2026-04-12-design-m13-telephony-control-plane-simplification.md](../../../wiki/queries/2026-04-12-design-m13-telephony-control-plane-simplification.md)
