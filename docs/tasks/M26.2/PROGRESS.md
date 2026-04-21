# M26.2: CI Workflow Clarity + Test Surface Truth — Progress

## Status

Milestone completed on 2026-04-02 after explicit reopen from human request, then archived after PR `#764` merged. The implementation branch was `feat/M26.2-ci-workflow-clarity`; this task pack is now historical record, not an active execution surface.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Audit workflow names, runner truth, and real E2E coverage | Done | 2026-04-02 |
| T02 | Clarify workflow intent and browser proof ownership while preserving one live PR workflow | Done | 2026-04-02 |
| T03 | Browser-proof task split retired; scope merged into T02 | Merged into T02 | 2026-04-02 |
| T04 | Align runner-pool terminology, health checks, and docs with the real fleet | Done | 2026-04-02 |
| T05 | Add release-environment smoke and retire orphaned CI fiction | Done | 2026-04-02 |
| T06 | Replace prerelease k3d smoke with a full k3d E2E release gate | Done | 2026-04-02 |

## Notes

1. M26 is closed and M26.1 is already tied to PR `#742`; reopened M26.2 work must stay isolated in PR `#764`.
2. T01 completed on 2026-04-02.
3. Canonical current-state inventory now lives in `wiki/architecture/ci.md` and the milestone doc.
4. T01 audit findings:
   - no GitHub workflow owns `apps/web/e2e/*.spec.ts`; browser proof is local-only today
   - the voice-room suite is GitHub-owned, but the docs originally mis-described the package-relative path as a broken repo-root path
   - the repo has two self-hosted runner hosts, but active fast-path `control` jobs are GitHub-hosted and the self-hosted `control` service remains only for manual replay / runner health
5. Targeted architecture verification ran after the T01 inventory/test update; see the branch work log for exact commands.
6. T02 completed on 2026-04-02.
7. Current human-facing workflow surface now uses operator-readable names:
   - `PR + Mainline Proof`
   - `K8s Overlay Validation`
   - `Release - Deploy Production / Run Full K3d E2E`
   - `Periodic Regression`
   - `Nightly Deep Regression`
   - `Distribution Export Proof`
   - `Release - Publish Platform Images`
   - `Release - Deploy Production`
   - `Release Environment Smoke`
8. Browser proof ownership is now explicit: `apps/web/e2e/*.spec.ts` remains local-harness-owned via `tools/scripts/e2e/run-web-e2e.sh` and `tools/scripts/review/pre-pr-ci.sh`; GitHub workflows do not claim that suite yet.
9. T04 completed on 2026-04-02.
10. Runner vocabulary is now explicit across policy/docs/health scripts:
   - physical runner host / execution surface
   - runner service
   - runner label
   - runner pool
11. Monitor workflow names now match their purpose without pretending one pool equals one machine:
   - `Monitor - Runner Pool Health`
   - `Monitor - CI Duration Health`
   - `Monitor - CI Scheduler Health`
   - `Monitor - CI Metrics Summary`
12. `tools/scripts/check_ci_runner_pool_presence.py` now reports both runner-pool / runner-label identity and the backing self-hosted host groups, and `infra/ci-runner/main.tf` now uses `host_group` metadata instead of the misleading `pool` host label.
13. T05 completed on 2026-04-02.
14. Release/deploy surfaces are now explicit:
   - `Release - Publish Platform Images`
   - `Release - Deploy Production`
   - `Release Environment Smoke`
   - `Ops - Production Maintenance`
15. `Release - Deploy Production` hands post-deploy validation to `Release Environment Smoke` instead of hiding smoke ownership inside the deploy workflow itself.
16. The E2E inventory no longer pretends orphaned suites are GitHub-owned:
   - `apps/web/e2e/*.spec.ts` remains local-only via the web UI harness
   - campaign / driver verification / clinic audio+two-agent / telematics compose and the remaining provider probes are now documented as manual-only lanes
   - `packages/grove-voice-livekit/tests/e2e/test_voice_room_e2e.py` is recorded as covered, because GitHub and local harnesses both invoke the package-relative path correctly
17. T06 is the reopened seam:
   - retire prerelease `k3d` bootstrap smoke as a fake release gate
   - keep cheap infra PR overlay validation
   - require the full deterministic `k3d` E2E suite before production deploy
18. T06 completed on 2026-04-02.
   - `K8s Overlay Validation` is now static-only and does not pretend to be prerelease proof
   - `Release - Deploy Production / Run Full K3d E2E` is the inline prerelease gate inside the release workflow
   - the old `ci_k8s_local_stack_smoke.sh` bootstrap theater path is deleted
