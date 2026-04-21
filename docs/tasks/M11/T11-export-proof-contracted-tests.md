# T11: Export Proof: Run Contracted Tests Only

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T10

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T11 - export proof: run contracted tests only`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Run the contracted test suite on the exported source and verify that no import errors arise from excluded solutions. This proves that test partitioning (T09) works correctly — the exported tests are self-contained and do not reference code that was stripped during export.

## Subtasks

- [x] **Run contracted tests** — execute pytest on the exported source with only contracted solution tests
- [x] **Verify no import errors** — no `ModuleNotFoundError` or `ImportError` from excluded solution packages
- [x] **Verify all contracted tests pass** — no failures in the contracted test subset

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| No new files | — | This is a verification task |

## Acceptance Criteria

- [x] All contracted tests pass on exported source
- [x] No import errors from excluded solution packages
- [x] Test output captured as evidence

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T10 (export proof build/lint/typecheck)
