# T04: Release-pin PR auto-merge gated on staging E2E + `blocks-auto-promote` label

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T03 (staging E2E status check lives on commit)

---

## Description

Extend the release-pin PR creator in
`.github/workflows/publish-platform-images.yml` (or wherever the PR is
opened) to:

1. Read the source PR's labels and inherit `blocks-auto-promote` if
   present.
2. Add the `staging-e2e-<sha>` check as a required context on the
   release-pin PR.
3. Enable `gh pr merge --auto --squash` unless the label is set.

## Subtasks

- [ ] **Bot extension:** update the PR-creator step to inherit the
  `blocks-auto-promote` label from the source PR (trace via
  `github.event.pull_request.merge_commit_sha`).
- [ ] **Branch protection rule:** on `prod-release/*`, add
  `staging-e2e-*` as a required status check.
- [ ] **Auto-merge enable step:** after PR open, call `gh pr merge
  --auto --squash` if label absent. GitHub will wait for required
  contexts + reviews.
- [ ] **Labels catalog:** add `blocks-auto-promote` to the
  `.github/labels.yml` (or equivalent) with a red-orange colour so
  it's visible in PR lists.
- [ ] **Documentation:** add a new section to
  `wiki/architecture/ci.md` explaining the dangerous-update gate.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/publish-platform-images.yml` | Modify | Extend the release-pin PR step with label inheritance + auto-merge enable. |
| `.github/labels.yml` (or equivalent) | Modify | Add `blocks-auto-promote` label definition. |
| `wiki/architecture/ci.md` | Modify | Document the gate, the label, how to set it. |
| Branch protection (out-of-band, document the change) | — | Add `staging-e2e` required status check on `prod-release/*` refs. |

## Implementation Notes

1. GitHub's auto-merge feature requires the PR to be in mergeable
   state AND all required contexts to pass. We let it wait.
2. `blocks-auto-promote` label on the release-pin PR is sufficient
   to block auto-merge because the check-gate still requires
   `staging-e2e`; a labelled PR just never gets merge approval
   from a human either.
3. Alternative to label-inheritance: commit trailer
   `Blocks-Auto-Promote: true` parsed from the source PR's merge
   commit. Rejected because labels are visible in the GitHub UI
   and less likely to be forgotten. Documented as an alternative
   in the wiki entry.

## Acceptance Criteria

- [ ] Merging a source PR with `blocks-auto-promote` label yields
  a release-pin PR with the same label and no auto-merge enabled.
- [ ] Merging without the label yields a release-pin PR with
  auto-merge enabled; once `staging-e2e` reports success, the PR
  auto-merges.
- [ ] Manually adding `blocks-auto-promote` to a release-pin PR
  cancels pending auto-merge.
- [ ] Removing the label re-enables auto-merge (one-liner
  `gh pr merge --auto`).

## Verification

```bash
# Dry-run on a test PR
gh pr view <release-pin-pr> --json autoMergeRequest,labels
# Expect autoMergeRequest to be set when label absent, null when present.
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Current release-pin workflow: `.github/workflows/publish-platform-images.yml`
