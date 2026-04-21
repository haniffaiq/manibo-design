# T12: CI Gate: Export Check on Relevant PRs

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T10

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T12 - CI gate: export check on relevant PRs`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Add a CI workflow that automatically runs the export proof when files in `distribution/`, `solutions/`, or `docker/profiles/` change. This prevents regressions where a code change breaks the source distribution pipeline without anyone noticing until export time.

## Subtasks

- [x] **Create CI workflow** (or add job to existing workflow) triggered on PRs that modify ANY of: `distribution/`, `solutions/`, `docker/profiles/`, `tools/scripts/artifact/export-client.sh`, `apps/web/scripts/generate-solution-routes.mjs`, `apps/web/package.json`, `pnpm-workspace.yaml`, `pyproject.toml`
- [x] **Run export proof** — execute `tools/scripts/artifact/export-client.sh nfq` and verify build/lint/typecheck
- [x] **Report results** — CI status check visible on the PR

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/export-check.yml` | Create | CI workflow for export proof on relevant PRs |

## Acceptance Criteria

- [x] CI workflow exists at `.github/workflows/export-check.yml`
- [x] Workflow triggers on PRs modifying: `distribution/`, `solutions/`, `docker/profiles/`, `tools/scripts/artifact/export-client.sh`, `apps/web/scripts/generate-solution-routes.mjs`, `apps/web/package.json`, `pnpm-workspace.yaml`, `pyproject.toml`
- [x] Workflow runs the export proof (build + lint + typecheck)
- [x] CI gate appears as a status check on relevant PRs

## 2026-04-02 Evidence

- `.github/workflows/export-check.yml` now runs the NFQ export proof with `uv run ruff check .`, `uv run pyright -p pyrightconfig.ci.json`, `pnpm lint`, `pnpm check-types`, and `pnpm -C apps/web build` inside the exported tree.
- Local proof executed successfully from `/tmp/nfq-export-check.rpoB6b/export`.

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T10 (export proof must work before gating on it)
