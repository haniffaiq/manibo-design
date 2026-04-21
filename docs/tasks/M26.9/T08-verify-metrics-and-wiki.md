# T08: Verification, metrics capture, wiki re-sync

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T05, T06 landed + ≥20 consecutive main pushes under the new flow

---

## Description

Close out M26.9 with real evidence. Capture the push-to-prod
wall-clock and release success rate delta measured over ≥20
consecutive main merges AFTER T05 and T06 have both landed. Update
the wiki history + milestone frontmatter to `done`.

## Subtasks

- [ ] **Baseline capture** from the 2026-04-15 audit (already in
  `wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`):
  - merge-gate wall-clock: 45-68m
  - push-to-prod: 2-3h typical
  - release-deploy success rate: 38% over 40 runs
- [ ] **Post-M26.9 capture** — 20 consecutive main pushes after T05
  and T06 land:
  - merge-gate wall-clock (target: <20m)
  - staging E2E wall-clock (target: <15m)
  - push-to-prod wall-clock (target: <60m)
  - release-deploy success rate (target: ≥90%)
- [ ] **Cost capture** — staging Hetzner invoice line item
  (target: <€12/month, against the ~€10 baseline from T01's pricing
  snapshot; buffer covers small provider price drift).
- [ ] **Wiki history entry** in
  `wiki/history/ci-infrastructure.md` — one paragraph summarising
  the transition and the measured improvement.
- [ ] **Wiki log entry** per `wiki/SCHEMA.md`.
- [ ] **Milestone frontmatter** → `status: done`, add
  `completed: YYYY-MM-DD`.
- [ ] **Milestones README row** — update status column.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M26.9/PROGRESS.md` | Modify | Finalise with numbers. |
| `wiki/history/ci-infrastructure.md` | Modify | Dated entry. |
| `wiki/log.md` | Modify | Dated log line. |
| `docs/milestones/M26.9-staging-cluster-and-post-merge-e2e.md` | Modify | Frontmatter → done. |
| `docs/milestones/README.md` | Modify | Readiness row update. |

## Acceptance Criteria

- [ ] All four post-metrics hit their targets.
- [ ] Wiki pages carry the dated entries.
- [ ] Milestone status `done`.

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Baseline: `wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`
