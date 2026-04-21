# T09: Update `AGENTS.md` onboarding sequence to wiki-first

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T08

---

## Description

Rewrite the Zero-Memory Start section and Mandatory Reading by Area section of `AGENTS.md` to point at the wiki as primary source. Replace the 13-step onboarding with a 3-step flow.

## Subtasks

- [ ] Rewrite Zero-Memory Start:
  ```
  1. Read wiki/index.md — find the area you're touching
  2. Read the matching page (e.g., wiki/architecture/grove.md)
  3. If you need project history → wiki/history/<relevant>.md
  ```
- [ ] Rewrite Mandatory Reading by Area — replace all `docs/` paths with wiki paths
- [ ] Remove references to deleted `docs/` files throughout `AGENTS.md`
- [ ] Grep repo-wide for any remaining references to old paths and fix them
- [ ] Verify `CLAUDE.md` symlink still works

## Acceptance Criteria

- [ ] `AGENTS.md` Zero-Memory Start is 3 steps, wiki-first
- [ ] Zero references to deleted docs/ paths in `AGENTS.md`
- [ ] `CLAUDE.md` symlink resolves correctly
- [ ] `uv run pytest tests/architecture/ -q` passes

## Verification

```bash
grep -A 5 'Zero-Memory Start' AGENTS.md | grep -q 'wiki/index.md'
! rg 'ARCHITECTURE\.md|grove/ARCHITECTURE|design-docs/code-style|ops/ci-operations|CONTRIBUTING\.md' AGENTS.md
test -L CLAUDE.md && readlink CLAUDE.md | grep -q AGENTS.md
uv run pytest tests/architecture/ -q
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
