# T10: Export Proof: Build + Lint + Typecheck on Filtered Source

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T07, T08, T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T10 - export proof: build + lint + typecheck on filtered source`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Run the full export pipeline for NFQ and verify that the exported source is a self-consistent, buildable, lintable, type-safe codebase. This is the definitive proof that source distribution works end-to-end: the export script produces a clean artifact that a client can build and develop against.

## Subtasks

- [x] **Run export** — `tools/scripts/artifact/export-client.sh nfq /tmp/nfq-export`
- [x] **Verify Python toolchain** — `cd /tmp/nfq-export && uv sync` succeeds
- [x] **Verify Node toolchain** — `cd /tmp/nfq-export && pnpm install` succeeds
- [x] **Run Python lint** — `uv run ruff check` passes
- [x] **Run Python typecheck** — `uv run pyright` passes
- [x] **Run web lint** — `pnpm -C apps/web lint` passes
- [x] **Run web typecheck** — `pnpm -C apps/web check-types` passes
- [x] **Document any fixups needed** — if the export requires patches, document them for T08/T09

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| No new files | — | This is a verification task; fixes go to T08/T09 if needed |

## Acceptance Criteria

- [x] `tools/scripts/artifact/export-client.sh nfq /tmp/nfq-export` completes without errors
- [x] `uv sync` succeeds in exported source
- [x] `pnpm install` succeeds in exported source
- [x] `uv run ruff check` passes on exported source
- [x] `uv run pyright` passes on exported source
- [x] `pnpm -C apps/web lint` passes on exported source
- [x] `pnpm -C apps/web check-types` passes on exported source

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T07 (profile build proof), T08 (API route filtering), T09 (test partitioning)
