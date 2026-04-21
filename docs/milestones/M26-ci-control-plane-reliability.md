# M26: CI Control Plane Reliability

Status: done
Created: 2026-03-24
Owner: Jakit
Branch: feat/M26-ci-control-plane
Stream: ci
Depends on: none
Reference: wiki/architecture/ci.md
Prior art: wiki/architecture/ci.md

## Goal

Turn the recent CI firefighting into one tracked milestone that makes the control plane boring: one authoritative review actor, one cheap live PR path, one thin merge gate, and no more fake “clean” reviews or giant CI-policy monoliths hiding real failure modes.

## Current Status Snapshot

The repo already has meaningful groundwork merged:

1. Static runner topology replaced the old autoscaler-heavy mess.
2. The live PR path collapsed into `Merge gate`, so active pull requests no longer dispatch separate `PR admission` and `PR heavy` workflows.
3. A repo-wide file-size gate now exists for code, CI YAML, and shell scripts.
4. T06 demoted `chatgpt-codex-connector` to advisory-only on 2026-03-25.
5. T10 Codex CI account rotation landed on 2026-03-25, so required/local review lanes can rotate away from quota-exhausted accounts.
6. T07 now shrinks `merge-gate.yml` below the repo size gate and keeps the stateless fast path on GitHub-hosted `ubuntu-24.04`.

What was still broken before T09 landed:

1. Docs-only and release-promotion PRs still pay more gate tax than they should.

Recent evidence is not subtle: in a spot audit of recent merged human PRs, `manibo-bot` posted clean reviews while `chatgpt-codex-connector` still opened P1/P2 comments on the same head SHA for PRs such as `#656`, `#655`, `#646`, `#638`, and `#634`.

### T01 Audit Snapshot (2026-03-24)

Audit scope: 19 recent merged human-authored PRs (`#659`, `#658`, `#656`, `#655`, `#654`, `#647`, `#646`, `#645`, `#644`, `#638`, `#634`, `#632`, `#631`, `#628`, `#625`, `#622`, `#621`, `#613`, `#608`).

What the audit found:

1. In 11 of 19 sampled PRs, `manibo-bot` posted a clean review while `chatgpt-codex-connector` still left P1/P2 findings somewhere on the PR.
2. The stronger same-head mismatch also exists. On PRs `#656`, `#655`, `#646`, `#638`, and `#634`, `manibo-bot` clean-approved the exact same head SHA that `chatgpt-codex-connector` commented on with actionable findings.
3. The biggest technical root cause is not vague “prompt quality.” The required review wrapper suppresses the custom prompt for the normal `--base` path, so `manibo-bot` often runs a generic review instead of the repo rubric.
4. Review parser and merge semantics still lean optimistic: clean bot reviews become head-bound approvals, and malformed/suppressed review output can still degrade into fake confidence instead of a hard failure.

Audit conclusion: `manibo-bot` is not yet trustworthy enough to be sole authority without fixing prompt delivery and fail-closed review semantics first.

### T02 Prompt Delivery Snapshot (2026-03-24)

1. `tools/agents/review.py` now executes authoritative prompt-based reviews through `codex_exec.py` instead of silently discarding the repo rubric on `--base`.
2. `tools/agents/pr_review_bot.py` now hard-fails when the review wrapper suppresses the repo prompt.
3. `tools/scripts/review/pr-review.sh` now uses the same review wrapper path as CI, so local review no longer bypasses authoritative prompt delivery.
4. Focused verification passed:
   - `uv run pyright -p pyrightconfig.ci.json`
   - `tools/scripts/review/pre-pr-ci.sh`
   - `tools/scripts/review/pr-review.sh origin/main pre_ci`
   - `tools/scripts/review/pr-review.sh origin/main post_ci`

### T03 Fail-Closed Review Snapshot (2026-03-24)

1. `tools/agents/pr_review_bot.py` no longer posts optimistic clean fallbacks on the required lane. Quota exhaustion, timeout, prompt suppression, empty output, transcript-shaped output, and ambiguous review output now fail the formal review instead of degrading into false clean state.
2. Successful fallback retries no longer leak stderr retry notices into the strict parser, so a clean review that succeeds on fallback still stays clean.
3. `tools/scripts/review/pr-review.sh` restores the documented local fallback lane (`gpt-5.4` / `high` primary, `gpt-5.2-codex` / `high` fallback) without requiring manual env setup.
4. Focused verification passed:
   - `uv run pyright -p pyrightconfig.ci.json`
   - `tools/scripts/review/pre-pr-ci.sh`
   - `tools/scripts/review/pr-review.sh origin/main pre_ci`
   - `tools/scripts/review/pr-review.sh origin/main post_ci`

### T04 Durable Clean Summary Snapshot (2026-03-24)

1. `tools/agents/pr_review_bot.py` no longer posts a fresh clean `APPROVED` review for every head SHA on the required lane.
2. Clean required reviews now upsert one durable repo-owned summary comment per review mode, with the marker/parsing contract centralized in `tools/agents/pr_review_summary.py`.
3. Blocking findings still use formal request-changes reviews plus resolvable review-thread comments, so only the clean-state transport changed.
4. Focused verification passed:
   - `uv run pyright -p pyrightconfig.ci.json`
   - `tools/scripts/review/pre-pr-ci.sh`
   - `tools/scripts/review/pr-review.sh origin/main pre_ci`
   - `tools/scripts/review/pr-review.sh origin/main post_ci`

### T05 Single-Source Merge Truth Snapshot (2026-03-24)

1. `tools/agents/pr_mergeability.py` and `tools/scripts/check_pr_review_resolution.py` now trust one repo-owned merge contract: the required `manibo-bot review (required)` check result plus authoritative `manibo-bot` review state and unresolved authoritative bot threads.
2. Clean required state no longer depends on head-bound GitHub `APPROVED` reviews. The newest authoritative artifact wins, so a newer durable clean summary can supersede an older blocking review while a newer blocking review still overrides stale clean state.
3. `tools/agents/pr_followup.py` now uses the same repo-owned review truth instead of raw GitHub `reviewDecision`, and advisory connector output still does not own merge policy.
4. The required merge-readiness and follow-up bot surfaces now declare the `checks: read` permission needed by the new required-review check-run lookup, and the durable bot GitHub App contract docs were updated to match.
5. Focused verification passed:
   - `uv run pyright -p pyrightconfig.ci.json`
   - `uv run pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_pr_mergeability_guard.py tests/architecture/test_pr_mergeability_fallback_reviews.py tests/architecture/test_pr_review_resolution_guard.py tests/architecture/test_pr_orchestrator_queue_controls.py tests/architecture/test_pr_followup_queue_budget.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_bot_durable_summaries.py -q`
   - `tools/scripts/review/pre-pr-ci.sh`
   - `uv run pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_pr_mergeability_guard.py tests/architecture/test_pr_mergeability_fallback_reviews.py tests/architecture/test_pr_review_resolution_guard.py tests/architecture/test_pr_orchestrator_queue_controls.py tests/architecture/test_pr_followup_queue_budget.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_bot_durable_summaries.py -q`
   - `tools/scripts/review/pr-review.sh origin/main pre_ci`
   - `tools/scripts/review/pr-review.sh origin/main post_ci`

### T05 Check-Run Pagination Follow-Up (2026-03-25)

1. `tools/agents/pr_mergeability.py` now paginates `check-runs` lookup for the current head SHA before declaring the required review signal missing.
2. This removes the merged regression where PR heads with more than 100 check runs could incorrectly fail merge-readiness even when `manibo-bot review (required)` succeeded on a later page.

### T06 Advisory Connector Snapshot (2026-03-25)

1. `chatgpt-codex-connector` is now documented and treated as advisory-only; it is no longer auto-requested as a second review authority on the merge path.
2. `wiki/architecture/ci.md` and `wiki/architecture/ci.md` now describe one merge-critical review actor: `manibo-bot review (required)`.
3. Merge-readiness semantics remain repo-owned; connector findings stay visible but do not own branch protection.

### T07 Hosted Fast Path + Workflow Shrink Snapshot (2026-03-25)

1. `.github/workflows/merge-gate.yml` shrank from 1214 lines to 699 lines, which puts it back below the repo file-size gate without deleting proof.
2. The stateless fast path now runs on GitHub-hosted `ubuntu-24.04`: `changes`, `distribution docs`, `docs contracts`, `repo contracts`, `lint`, `frontend`, `admission proof`, `admission contracts`, `admission product`, and `gate`.
3. Self-hosted lanes still own environment-bound work: `manibo-bot review (required)` and `merge readiness` on `bots`; runtime-heavy and k3d-backed proof on `ci-heavy-runtime`.
4. Bulky workflow shell moved into repo scripts (`ci_merge_gate_changes.sh`, `ci_merge_gate_pr_static_prepare.sh`, `ci_merge_gate_merge_readiness.sh`, `ci_merge_gate_pr_traceability_harness.sh`, `ci_merge_gate_artifact_profile_proof.sh`, and related helpers) so YAML owns orchestration only.
5. Topology tests now prove the hosted/self-hosted split and the stable branch-protection surface.

### T10 Review Account Rotation Snapshot (2026-03-25)

1. Required and local review lanes now auto-rotate provisioned Codex CI accounts when quota exhaustion is detected.
2. This keeps `tools/scripts/review/pr-review.sh` and the required review lane from failing just because one account is temporarily burned out.
3. The rotation work stays under repo-owned review semantics; it does not add a second review authority.

### T08 CI Architecture Test Split Snapshot (2026-03-25)

1. The old merge-gate topology and queue-control monoliths are gone; their coverage now lives in focused policy modules plus the stable wrapper commands (`tools/scripts/review/pre-pr-ci.sh`, `tools/scripts/review/pr-review.sh origin/main pre_ci`, and `tools/scripts/review/pr-review.sh origin/main post_ci`).
2. The split keeps one tiny shared loader/path helper in `tests/architecture/ci_architecture_test_support.py` instead of recreating a new junk-drawer abstraction.
3. The repo file-size guard no longer needs allowlist ceilings for the deleted monoliths.
4. Focused verification passed: `uv run ruff check` on the new module set and `uv run pytest ... test_repo_file_size.py -q` returned `139 passed`.

## Design Decisions

1. **`Merge gate` remains the only live PR workflow.** We fix the current path instead of resurrecting cross-workflow waiters or more orchestration sludge.
2. **`manibo-bot review (required)` is the only merge-critical review actor.** `chatgpt-codex-connector` remains visible, but advisory only.
3. **Clean review truth lives in a required check plus one durable bot summary.** Clean results must not create a fresh `APPROVED` review on every head SHA.
4. **Formal review must fail closed.** If the intended prompt/rubric is not delivered, or the output is malformed, the required review lane must fail rather than silently bless garbage.
5. **CI policy belongs in typed scripts and small modules.** Workflow YAML owns orchestration only; bulky logic belongs in scripts, and tests must stay decomposed too.
6. **Cheap PRs keep the same branch-protection surface.** Docs-only and release-pin PRs should stay under `gate`, but that gate must become near-instant instead of paying fake queue tax.
7. **If CI still hurts after the hosted fast-path split, fix the self-hosted review/heavy queues or cut PR tax further before inventing new runner choreography.**

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Audit `manibo-bot` vs connector review parity on recent PRs | done | none |
| T02 | Restore authoritative review prompt delivery | done | T01 |
| T03 | Fail closed on suppressed, malformed, or ambiguous formal review output | done | T02 |
| T04 | Replace head-bound clean approvals with durable bot summaries | done | T03 |
| T05 | Make merge readiness trust repo-owned review truth only | done | T03, T04 |
| T06 | Demote connector review to advisory and update review docs | done | T05 |
| T07 | Split `merge-gate.yml`, move fast path to GitHub-hosted runners, and keep heavy proof self-hosted | done | none |
| T08 | Split CI architecture tests below the repo size cap | done | T07 |
| T09 | Reduce docs-only and release-pin gate tax on the single merge path | done | T05, T07 |

Additional merged work:

1. T10 (`rotate Codex CI accounts on quota exhaustion`) landed on 2026-03-25 even though this milestone does not have a standalone `docs/tasks/M26/T10-*.md` task file.

## Acceptance Criteria

- [x] The required `manibo-bot` review lane actually uses the intended repo review rubric instead of silently suppressing the prompt.
- [x] Suppressed prompt delivery, malformed review output, and timeout-clean fallback cannot silently become `No blocking findings.` on the required review path.
- [x] Clean required reviews no longer add a new `APPROVED` GitHub review for every head SHA.
- [x] Merge readiness uses repo-owned required review truth plus unresolved authoritative bot threads; advisory connector output does not own merge policy.
- [x] `chatgpt-codex-connector` remains advisory and visible, but not merge-authoritative.
- [x] `.github/workflows/merge-gate.yml` stays below the repo size gate and only owns orchestration.
- [x] Stateless fast-path jobs (`changes`, cheap repo/product checks, and `gate`) run on GitHub-hosted `ubuntu-24.04` while required review and runtime-heavy proof stay self-hosted.
- [x] CI architecture tests are split into focused modules that also stay below the repo size gate.
- [x] Docs-only and release-promotion PRs complete on the cheap gate path without paying heavy/review tax they do not need.
- [x] `wiki/architecture/ci.md` and `wiki/architecture/ci.md` match the final review and gate topology.

## Verification

```bash
uv run pyright -p pyrightconfig.ci.json
uv run ruff check tools/agents/pr_review_bot.py tools/agents/review.py tests/architecture/
uv run ruff format tools/agents/pr_review_bot.py tools/agents/review.py tests/architecture/ --check
tools/scripts/review/pre-pr-ci.sh
tools/scripts/review/pr-review.sh origin/main pre_ci
tools/scripts/review/pr-review.sh origin/main post_ci
```

## Non-Goals

- No return to PR-scoped runner labels or dynamic autoscaler fiction.
- No second merge-critical review actor.
- No branch-protection carve-out zoo for special PR types if the same `gate` surface can stay cheap.
- No feature work hidden inside CI patches.
