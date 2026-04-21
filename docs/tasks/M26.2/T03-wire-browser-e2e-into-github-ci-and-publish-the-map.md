# T03: Browser-proof task split retired; scope merged into T02

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Merged into T02
> **Estimate**: —
> **Depends on**: T02
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.2 is explicitly activated.

---

## Status Note

This task was split out initially, then merged back into **T02** on 2026-04-02.

Why:

1. The browser-proof ownership work modifies the same merge-critical workflow files, CI policy files, docs, and architecture tests as the naming/topology cleanup.
2. Keeping T02 and T03 as separate “one task = one commit” tasks would create overlapping commits and fake intermediate states.
3. The simplest truthful plan is one task that settles workflow naming/topology and browser-proof ownership together.

## What Moved To T02

- Browser-proof workflow ownership
- Harness responsibility
- PR vs mainline/nightly browser routing
- The authoritative E2E-to-job map

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Active task: [T02-split-and-rename-pr-vs-mainline-workflows.md](./T02-split-and-rename-pr-vs-mainline-workflows.md)
