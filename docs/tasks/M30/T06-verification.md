# T06: Verification: publish, rollback, and archive flow

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04, T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T06 - verify version rollback flow`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify all T01-T05 are completed

5. **Definition of Done**
   - All verification commands pass
   - Evidence captured

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark all tasks done

---

## Description

Verify the complete lifecycle: create v1 → publish v1 → create v2 → publish v2 (v1 becomes previously_published) → rollback to v1 (v2 becomes previously_published) → archive v2.

## Subtasks

- [x] **Backend verification**: Run governance tests, pyright, ruff.
- [x] **Frontend verification**: Run lint, typecheck, Vitest.
- [x] **Integration test**: Add a test that exercises the full publish → rollback → archive cycle.
- [x] **Capture evidence**: Commands and output.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M30/PROGRESS.md` | Modify | Mark all tasks done with dates |
| `packages/platform-core/tests/` | Modify | Add rollback lifecycle integration test |

## Acceptance Criteria

- [x] `uv run pyright packages/platform-core/src/platform_core/agents/governance.py` passes.
- [x] `uv run ruff check packages/platform-core/src/platform_core/agents/` passes.
- [x] Backend governance tests pass including rollback scenario.
- [x] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes.
- [x] `pnpm -C apps/web test` passes.
- [x] Full lifecycle (publish → rollback → archive) works in dev-live.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
