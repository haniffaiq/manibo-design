# T07: Staging rebuild-from-fixture make target + runbook

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T02 (staging running)

---

## Description

Add `make staging-reset` that reseeds the staging database from a
checked-in fixture, clears Temporal state, and rebuilds deterministic
tenant setup. Target: <5 minutes end-to-end, usable for debugging
test flakes + recovering from bad commits that corrupted staging.

## Subtasks

- [ ] **Fixture file** at
  `infrastructure/kubernetes/overlays/hetzner/staging/fixtures/staging-seed.sql`
  containing:
  - Tenant: `staging-tenant-01`
  - Users: operator, admin, e2e-test-user
  - One appointment-booking agent + one driver-verification agent
  - One phone number binding (the staging Telnyx number)
- [ ] **Make target** in repo root `Makefile`:
  ```make
  staging-reset:
      ./tools/scripts/staging/reset-from-fixture.sh
  ```
- [ ] **Reset script** `tools/scripts/staging/reset-from-fixture.sh`
  that:
  1. Scales down platform-api, temporal-worker, agent-worker
  2. TRUNCATE + replay the fixture SQL into `grove` database
  3. Reset Temporal namespace state
  4. Scale workloads back up
  5. Runs a 30s health-gate before exiting
- [ ] **Runbook** at `wiki/ops/staging-reset.md` covering when to
  use, what it does NOT reset (backups, PVCs), how to extend the
  fixture.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `Makefile` | Modify | Add `staging-reset` target. |
| `tools/scripts/staging/reset-from-fixture.sh` | Create | Shell script implementing the 5-step reset. |
| `infrastructure/kubernetes/overlays/hetzner/staging/fixtures/staging-seed.sql` | Create | Deterministic fixture. |
| `wiki/ops/staging-reset.md` | Create | Runbook. |

## Implementation Notes

1. Fixture must not embed secrets (auth tokens, webhook URLs).
   Use placeholders + env-var substitution at runtime.
2. Temporal namespace reset uses `tctl` or the admin gRPC to purge
   workflow history; not a `kubectl delete` because that drops the
   CRD.
3. The reset should be idempotent: running it twice in a row on a
   fresh staging must leave the same state.
4. Kubeconfig for the script uses the same staging secret as
   staging-e2e.yml.

## Acceptance Criteria

- [ ] `make staging-reset` runs end-to-end in <5 minutes on a
  local laptop with staging kubeconfig.
- [ ] After reset, staging has exactly the fixture's tenants /
  users / agents.
- [ ] E2E test suite passes against the just-reset staging.
- [ ] Fixture SQL passes `psql --dry-run` validation in CI.

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
