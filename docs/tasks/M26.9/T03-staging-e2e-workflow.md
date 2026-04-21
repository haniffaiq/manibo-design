# T03: Staging E2E workflow

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: M (2-4h)
> **Depends on**: T02 (Flux reconciling staging)

---

## Description

Add a new GitHub Actions workflow
`.github/workflows/staging-e2e.yml` that fires on every push to main,
waits for Flux reconciliation on the staging cluster, runs the full
E2E + regression suite against staging's real endpoints, and posts
the result as a status check on the release-pin PR (handed off to
T04 for the auto-merge gate).

## Subtasks

- [ ] **Workflow trigger:** `push` to `main` + `workflow_dispatch`.
- [ ] **Wait step:** poll Flux's latest `Kustomization` status for
  the staging cluster; block until `Ready=True` with `ObservedRef`
  matching `${{ github.sha }}`. Timeout 10 minutes.
- [ ] **Test step:** run pytest + Playwright against
  `https://api.staging.manibo.ai` and `wss://sip.staging.manibo.ai`
  endpoints. Credentials: dedicated `STAGING_E2E_TEST_USER` in the
  staging tenant.
- [ ] **Status report:** post GitHub Status check named
  `staging-e2e-e66...<sha>` on the commit, success/failure.
- [ ] **Artifact upload:** Playwright report + pytest JSON report
  on failure.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/staging-e2e.yml` | Create | Full workflow per Subtasks above. |
| `tools/scripts/e2e/run-staging-e2e.sh` | Create | Shell wrapper similar to run-k3d-e2e.sh but against external staging endpoints. |
| `tools/scripts/e2e/wait-for-staging-reconcile.sh` | Create | Polls Flux kustomization status via kubectl until ObservedRef matches the expected SHA. |
| `wiki/systems/testing.md` | Modify | Add a section on staging E2E signal. |

## Implementation Notes

1. kubeconfig for staging is a GitHub Actions secret
   `STAGING_KUBECONFIG` (base64 of the kube-hetzner-output kubeconfig).
   Decoded at the start of the workflow.
2. Staging endpoints:
   - `https://api.staging.manibo.ai` — platform-api
   - `wss://sip.staging.manibo.ai` — LiveKit SIP
   - Real PSTN testing via Telnyx number assigned in staging tenant.
3. Test scope (same as prod E2E today, minus k3d boot):
   - `packages/platform-core/tests/e2e/`
   - `apps/api/tests/e2e/`
   - `apps/web/e2e/` Playwright specs
4. Failure should NOT block future main pushes; staging is allowed
   to go red briefly. T04 gates the release-pin PR auto-merge on
   this check, so a red staging just means no auto-promote to prod
   until the next green run.

## Acceptance Criteria

- [ ] Workflow fires on every push to main.
- [ ] Fluxwait step honours the 10m timeout; logs the observed ref
  and expected ref on timeout.
- [ ] Success posts GH status check on the commit.
- [ ] Failure uploads Playwright + pytest artifacts, posts status
  check as failed, does not fail the main branch (main keeps going).

## Verification

```bash
# Dry-run workflow syntax
actionlint .github/workflows/staging-e2e.yml

# Manual trigger post-merge
gh workflow run staging-e2e.yml --ref main

# Check status checks land on the commit
gh api "/repos/:owner/:repo/commits/<sha>/check-runs" | jq '.check_runs[] | {name, status, conclusion}'
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Current k3d E2E wrapper: `tools/scripts/e2e/run-k3d-e2e.sh`
