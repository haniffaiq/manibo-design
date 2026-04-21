# T10: Fix Temporal Helm v1 values for the prerelease release gate

> **Milestone**: M26.5-test-infrastructure-cleanup
> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: T08, T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `fix: M26.5 T10 - repair Temporal chart values for release gate`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.5-test-infrastructure-cleanup`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.5/PROGRESS.md` for current state

5. **Definition of Done**
   - Local prerelease Temporal values render against the pinned prerelease Helm chart contract
   - Production Temporal values remain aligned with the still-pinned production chart contract
   - The prerelease `k3d` bootstrap no longer fails on deprecated Temporal keys
   - A dedicated regression test fails closed on Temporal chart/value mismatches

6. **After Completing This Task**
   - Update `docs/tasks/M26.5/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

The release gate now exercises a real prerelease `k3d` bootstrap, which exposed that the local Temporal Helm values
still used the pre-`1.0.0` chart schema. The current prerelease chart rejects deprecated top-level sub-chart keys
such as `cassandra:` and expects persistence under `server.config.persistence.datastores`. Production, however, is
still pinned to chart `0.73.2`, so its values must remain on the legacy contract until that chart pin is upgraded.
This task updates the prerelease/local values and adds a mechanical guard so release gating cannot silently regress
on chart/value alignment.

## Subtasks

- [x] **Reproduce the chart failure**: prove the current repo values fail against the active `temporal/temporal` chart.
- [x] **Migrate local values**: update the prerelease/local values file to the v1 persistence contract.
- [x] **Pin the prerelease chart**: make `k3d-up.sh` install an explicit Temporal chart version instead of floating to upstream latest.
- [x] **Preserve production compatibility**: keep production values on the `0.73.2` contract until the HelmRelease is upgraded.
- [x] **Guard the contract**: add an architecture test that fails when local/prod values drift from their owning chart contracts.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/base/platform/temporal/values.local.yaml` | Modify | Move local Temporal persistence to the Helm chart v1 schema |
| `infrastructure/kubernetes/overlays/hetzner/production/helm-values/temporal.values.yaml` | Modify | Keep production Temporal persistence aligned to the pinned `0.73.2` chart |
| `tests/architecture/test_temporal_helm_values.py` | Create | Lock the accepted local/prod Temporal chart contracts |
| `docs/milestones/M26.5-test-infrastructure-cleanup.md` | Modify | Track the follow-up release-gate task in the milestone task table |
| `docs/tasks/M26.5/PROGRESS.md` | Modify | Record the release-gate follow-up status and verification evidence |

## Implementation Notes

- Do not widen scope into unrelated Temporal upgrades or image changes; this task is about chart-values compatibility only.
- Prefer a static architecture test over another heavyweight workflow-only check; the release workflow should not be the first line of defense.
- Keep the release gate honest: local `k3d` values and production HelmRelease values must stay aligned with their owning chart versions.

## Acceptance Criteria

- [x] `helm template temporal temporal/temporal --values infrastructure/kubernetes/base/platform/temporal/values.local.yaml` succeeds.
- [x] `tests/architecture/test_temporal_helm_values.py` fails closed when local/prerelease values stop following the v1 chart contract.
- [x] `tests/architecture/test_temporal_helm_values.py` fails closed when production values stop following the pinned `0.73.2` chart contract.

## Completion Notes

1. Local/prerelease Temporal values now use `server.config.persistence.datastores` plus per-store
   `createDatabase`/`manageSchema`, which is the contract expected by `temporal/temporal` chart `1.0.0`.
2. `tools/scripts/infra/k3d-up.sh` now pins prerelease installs to Temporal chart `1.0.0` so the release gate no
   longer floats to whatever upstream chart schema ships next.
3. Production Temporal values stay on the legacy `default` / `visibility` / `schema.*` shape required by the
   production Flux HelmRelease pin (`0.73.2`).
4. `tests/architecture/test_temporal_helm_values.py` now mechanically enforces both contracts so prerelease runs are
   no longer the first detector for local/prod Temporal chart drift.

## References

- Milestone: [M26.5-test-infrastructure-cleanup.md](../../milestones/M26.5-test-infrastructure-cleanup.md)
- Related: [T06-replace-prerelease-k3d-smoke-with-full-k3d-e2e-release-gate.md](../M26.2/T06-replace-prerelease-k3d-smoke-with-full-k3d-e2e-release-gate.md)
