# T06: Retire `flux-production-deploy.yml` `Run Full K3d E2E` job

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T04 (release-pin auto-merge wired)

---

## Description

Remove the duplicate `Run Full K3d E2E` job from
`.github/workflows/flux-production-deploy.yml`. After M26.9, staging
E2E already proved the SHA before the release-pin PR was allowed to
merge. The release-deploy workflow becomes thin: just the `deploy`
job.

This is the 31.6m per-run job that caused 9 of 10 recent deploy
failures (2026-04-15 audit — pure k3d flake, no product regressions
caught).

## Subtasks

- [ ] **Remove the `Run Full K3d E2E` job** from the workflow.
- [ ] **Update `deploy` job `needs:`** to not depend on the removed
  job.
- [ ] **Replace with a post-deploy smoke** (optional, T06 scope):
  a 2-3m curl-based health check against the prod ingress after
  flux push reports healthy.
- [ ] **Drop prerelease-only scripts** if only this workflow used
  them (`tools/scripts/e2e/run-k3d-prerelease-e2e.sh` or similar).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/flux-production-deploy.yml` | Modify | Remove `Run Full K3d E2E` job. Update `deploy` job needs. |
| `tools/scripts/e2e/run-prerelease-k3d-e2e.sh` (if it exists) | Delete | Orphaned. |
| `tools/scripts/e2e/run-prod-smoke.sh` | Create (optional) | 2-3m curl health check: API /healthz, auth roundtrip, one solution-owned endpoint. |
| `wiki/architecture/ci.md` | Modify | Reflect the thin release-deploy. |

## Implementation Notes

1. Per 2026-04-15 audit, the `Run Full K3d E2E` job had a 60%
   failure rate, 12 of 22 failures pure k3d infra flake. Removing
   it should raise release success rate from 38% to near-100% when
   the `deploy` job itself is stable.
2. Release wall-clock drops from ~78m to ~15m.
3. Post-deploy smoke is recommended but not required for closing
   T06. If added, it should assert real prod health (200 on
   /healthz, 200 on a protected endpoint via the staging test
   user's refresh token flow).

## Acceptance Criteria

- [ ] `Run Full K3d E2E` job absent from
  `flux-production-deploy.yml`.
- [ ] `deploy` job's `needs:` list updated; workflow passes on a
  no-op commit.
- [ ] Release-deploy wall-clock median drops below 20m across
  5 consecutive prod-release merges.
- [ ] Release-deploy success rate on 20 consecutive prod-release
  merges ≥90%.

## Verification

```bash
actionlint .github/workflows/flux-production-deploy.yml

# Historical comparison after 5 releases
gh run list --repo jakit-labs/manibo \
  --workflow flux-production-deploy.yml \
  --branch main --event push --limit 10 \
  --json createdAt,updatedAt,conclusion
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Failure audit: `wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`
