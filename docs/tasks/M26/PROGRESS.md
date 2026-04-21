# M26: CI Control Plane Reliability — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Audit `manibo-bot` vs connector review parity on recent PRs | Done | 2026-03-24 |
| T02 | Restore authoritative review prompt delivery | Done | 2026-03-24 |
| T03 | Fail closed on suppressed, malformed, or ambiguous formal review output | Done | 2026-03-24 |
| T04 | Replace head-bound clean approvals with durable bot summaries | Done | 2026-03-24 |
| T05 | Make merge readiness trust repo-owned review truth only | Done | 2026-03-24 |
| T06 | Demote connector review to advisory and update review docs | Done | 2026-03-25 |
| T07 | Split `merge-gate.yml`, move fast path to GitHub-hosted runners, and keep heavy proof self-hosted | Done | 2026-03-25 |
| T08 | Split CI architecture tests below the repo size cap | Done | 2026-03-25 |
| T09 | Reduce docs-only and release-pin gate tax on the single merge path | Done | 2026-03-26 |

Additional merged scope:

1. T10 (`rotate Codex CI accounts on quota exhaustion`) landed on 2026-03-25 even though this milestone does not have a standalone `docs/tasks/M26/T10-*.md` task file.

## Notes

Starting state:

1. Static runner topology and the single live `Merge gate` workflow are already merged.
2. Review authority is still split between `manibo-bot` and `chatgpt-codex-connector`.
3. The required review path still suffers from prompt suppression, per-head clean approvals, and oversized CI-policy files.

T01 audit result:

1. 19 recent merged human PRs were sampled.
2. 11 of 19 showed `manibo-bot` clean review vs connector P1/P2 findings somewhere on the PR.
3. Same-head mismatches were confirmed on `#656`, `#655`, `#646`, `#638`, and `#634`.
4. The highest-confidence root cause is prompt suppression in the authoritative review wrapper, not just weak prompt wording.

T02 completion result:

1. `tools/agents/review.py` now preserves and executes the authoritative repo prompt instead of silently dropping it on the common `--base` path.
2. `tools/agents/pr_review_bot.py` now fails loudly if the review wrapper suppresses the repo prompt.
3. `tools/scripts/review/pr-review.sh` now routes local review through the same review wrapper path as CI instead of bypassing it with a direct `codex_exec.py` call.
4. Regression coverage now proves prompt delivery, degraded PR-context fallback, and local-wrapper parity.

T03 completion result:

1. `tools/agents/pr_review_bot.py` now fails the required review lane on quota exhaustion, timeout, empty output, transcript-shaped output, mixed clean-plus-noise output, and other ambiguous review summaries instead of normalizing them to `No blocking findings.`.
2. Successful fallback retries no longer contaminate the strict parser with stderr retry notices; only the actual review summary is parsed on success.
3. `tools/scripts/review/pr-review.sh` now restores the repo-default local fallback lane (`gpt-5.4` / `high` primary, `gpt-5.2-codex` / `high` fallback) without depending on ambient shell state.
4. Focused verification passed: pyright, the affected architecture pytest slice, and both local review lanes (`pre_ci` and `post_ci`) returned `No blocking findings.`.

T04 completion result:

1. `tools/agents/pr_review_bot.py` no longer uses fresh GitHub `APPROVED` reviews as the clean-state carrier for each new head SHA.
2. Clean required reviews now upsert one durable repo-owned summary comment per review mode, keyed with explicit markers in `tools/agents/pr_review_summary.py`.
3. Blocking findings still use real formal review state and review-thread artifacts; only the clean-state transport changed.
4. Regression coverage now proves durable summary creation/update behavior, newest-artifact selection, and rejection of forged marker comments.

T05 completion result:

1. `tools/agents/pr_mergeability.py` now treats merge truth as one repo-owned contract: the required `manibo-bot review (required)` check result plus authoritative `manibo-bot` review state and unresolved authoritative bot threads.
2. Clean required state no longer depends on fresh GitHub `APPROVED` reviews. Durable clean summary comments can satisfy clean review truth for the current head when they are the newest authoritative artifact.
3. `tools/agents/pr_followup.py` now uses the same repo-owned review truth instead of raw GitHub `reviewDecision` or connector noise, and it will not let stale blocking reviews outrank newer clean summaries.
4. Focused verification passed: pyright, the T05 architecture pytest slice, and both local review lanes (`pre_ci` and `post_ci`) returned `No blocking findings.` after the final fixes.

T05 follow-up (2026-03-25):

1. `tools/agents/pr_mergeability.py` now paginates `GET /commits/{sha}/check-runs` instead of trusting only the first 100 check runs for required-review status.
2. Regression coverage now proves page-2 required review checks still satisfy merge-readiness truth.

T06 completion result:

1. `wiki/architecture/ci.md` and `wiki/architecture/ci.md` now make the review contract explicit: `manibo-bot review (required)` owns merge-critical review, while `chatgpt-codex-connector` remains visible but advisory-only.
2. The live merge path no longer auto-requests connector review as a second authority.
3. Operator guidance now matches the code path instead of pretending there are two equal review owners.

T07 completion result:

1. `.github/workflows/merge-gate.yml` shrank from 1214 lines to 699 lines, so it is back under the repo file-size gate without deleting runtime proof.
2. The stateless fast path now runs on GitHub-hosted `ubuntu-24.04`: `changes`, cheap repo checks, cheap product checks, and final `gate`.
3. Self-hosted lanes still own environment-bound work: required formal review plus merge-readiness on `bots`, and runtime-heavy/k3d-backed proof on `ci-heavy-runtime`.
4. Bulky workflow shell moved into repo scripts such as `tools/scripts/ci/merge-gate/detect-changes.sh`, `tools/scripts/ci/merge-gate/prepare-pr-review.sh`, `tools/scripts/ci/merge-gate/run-full-runtime.sh`, and related helper scripts.
5. Focused topology verification passed for runner mapping, job-name stability, and workflow/file-size policy.

T10 merged sidecar result:

1. Required and local review lanes now auto-rotate provisioned Codex CI accounts when quota exhaustion is detected.
2. That keeps the repo-owned review path alive under quota pressure without changing merge authority semantics.

T08 completion result:

1. The two oversized CI architecture junk drawers (`test_ci_merge_gate_topology.py` and `test_pr_agent_queue_controls.py`) were replaced by eleven focused modules split by review topology, merge-gate topology, follow-up queue policy, recovery actions, and CI scope classification.
2. A tiny shared helper module (`tests/architecture/ci_architecture_test_support.py`) now owns the repeated loader/path setup without hiding policy assertions behind a new mega-helper.
3. The repo file-size allowlist no longer needs exemptions for those two deleted monoliths.
4. Focused verification passed: ruff on the new modules and `139` targeted architecture tests including `test_repo_file_size.py`.

Backfilled Tier 0 regression follow-up (2026-03-27, recorded 2026-03-29) (#711):

1. Root cause: `apps/api/tests/e2e/test_release_rollout_compose_e2e.py` still bootstrapped release-rollout setup with the app DSN (`PLATFORM_E2E_DATABASE_URL`) instead of the elevated admin DSN exported by the k3d / traceability wrappers.
2. Fix: the bootstrap now prefers `PLATFORM_E2E_ADMIN_DATABASE_URL`, then `DATABASE_URL`, for both asyncpg and Alembic bootstrap; `PLATFORM_E2E_ALEMBIC_DATABASE_URL` is only consulted when no elevated DSN is present.
3. Regression guard: `apps/api/tests/unit/test_release_rollout_e2e_helpers.py` now locks the env-precedence contract so Tier 0 cannot silently drift back to the app-only bootstrap path.

T09 completion result:

1. `docs_only` and `automation_fast_track` PRs now emit `ci_ready_for_review_required=false`, so the live `Merge gate` workflow skips the leftover `admission summary` job for those cheap lanes.
2. Cheap PRs still keep the same required `gate` branch-protection surface and still prove `changes` plus the fast repo/product checks they actually need.
3. Required-review lanes keep the `ci-ready` summary path; this change only cuts fake queue tax from docs-only and release-pin PRs.

T09 follow-up (2026-03-28):

1. Event-driven orchestrator apply mode is back on (`ORCHESTRATOR_EVENT_APPLY=1`), so PR automation no longer waits for the 6-hour watchdog unless the repo owner explicitly disables it again.
2. `Agent — PR Orchestrator` now listens to submitted PR reviews for in-scope bot PRs, including authoritative bot-authored formal blocking reviews, as first-class follow-up triggers, but only for the PR’s current head SHA. Authoritative bot `issue_comment` deep-review markers remain only as a legacy fallback, and they must also target the current head SHA while using `mode=post_ci` or the legacy no-mode marker, so generic PR chatter and advisory `pre_ci` summaries still cannot wake or spoof follow-up automation.
3. Targeted follow-up runs now wait through a short review-signal settle window before recording `await_review`, which closes the GitHub eventual-consistency race between a submitted formal review and the next follow-up pass.
4. Raw artifact fallback in follow-up is now mode-aware: authoritative current-head `post_ci` artifacts and legacy no-mode markers still count, but `pre_ci` alone no longer satisfies required follow-up gating.
3. Bot-authored PRs that finish `Merge gate` with failing checks can now receive targeted advisory deep review without a fake `gate=SUCCESS` prerequisite, which removes the current-head review deadlock for CI-failure remediation.
4. `Agent — PR Follow-up` no longer posts dead-end “waiting for deep review” comments while the control plane is still arranging the review needed to unblock that head SHA.
5. `Agent — PR Follow-up` now trusts shared authoritative current-head review state before it falls back to raw authoritative review artifacts, so required review gating is less fragile and no longer depends on issue-comment transport when mergeability already knows the answer.
6. Blocking required reviews now keep the formal `request changes` review plus inline comments and skip the duplicate top-level blocking summary comment unless GitHub fails to post the formal review, which cuts PR noise without weakening mergeability.

T09 follow-up (2026-03-29):

1. `Agent — PR Orchestrator` now allows bot-only backlog deep-review rescue on the normal `workflow_run` path after `Agent — PR Follow-up` completes, but only when at least one tracked bot PR still lacks current-head authoritative review state.
2. That rescue dispatch uses `review_mode=post_ci` with `require_gate_success=false`, so stale failing or gate-missing bot PRs can earn a current-head authoritative review signal and escape the follow-up -> `await_review` loop without spamming already-reviewed heads.
3. Review completion events still do not chain generic backlog review immediately, so the control plane can drain the backlog incrementally without spinning review-on-review loops.
