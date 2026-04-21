# T04: Verification, metrics capture, wiki re-sync, PROGRESS finalisation

> **Milestone**: M26.8-in-cluster-test-parallelism
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03

---

## Description

Land the wall-clock evidence that the acceptance criteria require. Capture
before/after timings for merge-gate heavy job and Playwright web E2E, file
them into `docs/tasks/M26.8/PROGRESS.md`, update
`wiki/history/ci-infrastructure.md` with a dated note, and flip M26.8 status
to `done` only when the acceptance criteria in the milestone doc are
actually met.

## Subtasks

- [ ] **Baseline capture**: pull `gh run list --workflow merge-gate.yml
  --json databaseId,displayTitle,createdAt,updatedAt,conclusion,event
  --limit 30` for the 10 most recent pre-change merge-gate runs on main and
  record wall-clock, heavy-job duration, in-cluster pytest step duration.
  Evidence goes in PROGRESS.md.
- [ ] **Post-change capture**: after T02 and T03 have merged to main and
  five merge-gate runs on main have completed, repeat the capture. Record
  the same three numbers per run.
- [ ] **Acceptance check**: confirm 30% merge-gate heavy-job reduction and
  25% Playwright reduction against baseline. If short, do not mark M26.8
  done — file a follow-on task instead.
- [ ] **Flake guardrail**: count same-SHA merge-gate reruns across 20
  consecutive post-change pushes. Must remain zero.
- [ ] **Wiki re-sync**: append a dated entry to
  `wiki/history/ci-infrastructure.md` summarising the change (one paragraph)
  and append `wiki/log.md` per `wiki/SCHEMA.md`.
- [ ] **PROGRESS.md finalisation**: mark tasks complete, include all
  captured numbers, close out the milestone status header.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M26.8/PROGRESS.md` | Modify | Finalise status, task table, evidence numbers, verification commands that were run. |
| `wiki/history/ci-infrastructure.md` | Modify | Append a dated entry describing the xdist + Playwright widening and the observed impact. |
| `wiki/log.md` | Modify | Append a `## [YYYY-MM-DD] note | ...` entry per `wiki/SCHEMA.md`. |
| `docs/milestones/M26.8-in-cluster-test-parallelism.md` | Modify | Flip the `Status:` field to `done` and set `completed: YYYY-MM-DD` frontmatter. |
| `docs/milestones/README.md` | Modify | Update the readiness table row for M26.8 with the completion date. |

## Implementation Notes

1. If the 30% / 25% targets are not met after T02 and T03 are live, the
   honest action is to keep the milestone `in progress`, file a follow-on
   task to widen workers (e.g. `E2E_PYTEST_WORKERS=4`), and re-measure. Do
   not move the acceptance bar; do not declare a partial win.
2. The `gh run list` commands in the milestone Verification section are the
   source of truth. Do not eyeball timings from the Actions UI.
3. Keep the wiki history entry focused on the decision and the measured
   impact. Do not restate the investigation — that already lives in
   `wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md` and the
   milestone doc.
4. After this task lands, the runbook for widening further is: bump
   `E2E_PYTEST_WORKERS` in `merge-gate.yml`, wait three consecutive green
   main runs, keep or revert. No design changes required.

## Acceptance Criteria

- [ ] `docs/tasks/M26.8/PROGRESS.md` includes the baseline and post-change
  numbers for at least five main runs on each side.
- [ ] Merge-gate heavy job wall-clock median drops at least 30% on main.
- [ ] Playwright web E2E wall-clock median drops at least 25% on merge-gate
  PR runs that exercise the frontend lane.
- [ ] Zero same-SHA merge-gate reruns across 20 consecutive post-change
  pushes to main.
- [ ] `wiki/history/ci-infrastructure.md` and `wiki/log.md` have dated
  entries.
- [ ] `docs/milestones/M26.8-in-cluster-test-parallelism.md` status is
  `done` with a completion date.

## Verification

```bash
# Baseline and post-change capture
gh run list --workflow merge-gate.yml \
  --repo jakit-labs/manibo \
  --json databaseId,displayTitle,createdAt,updatedAt,conclusion,event,headBranch \
  --limit 30 > /tmp/m268-mg.json

# Same-SHA rerun audit (must be zero)
gh run list --workflow merge-gate.yml \
  --repo jakit-labs/manibo \
  --branch main --event push \
  --json databaseId,headSha --limit 50 \
  | jq 'group_by(.headSha) | map({sha: .[0].headSha, runs: length}) | map(select(.runs > 1))'

# Architecture tests still green
uv run python -m pytest tests/architecture/test_ci_runtime_smoke_workflow.py \
  tests/architecture/test_playwright_web_e2e_config.py -q
```

## References

- Milestone: [M26.8-in-cluster-test-parallelism.md](../../milestones/M26.8-in-cluster-test-parallelism.md)
- Depends on: [T02-env-gate-pytest-xdist-in-k3d-runner.md](T02-env-gate-pytest-xdist-in-k3d-runner.md), [T03-playwright-workers-env.md](T03-playwright-workers-env.md)
- Wiki schema: `wiki/SCHEMA.md`
- Investigation context: `wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`
