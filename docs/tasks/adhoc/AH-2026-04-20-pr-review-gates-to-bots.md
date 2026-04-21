# AH-2026-04-20: Move PR readiness checks to review bots

> **Status**: Completed
> **Estimate**: M
> **Artifact**: `wiki/queries/2026-04-20-pr-body-gate-review-bot.md`

---

## Description

Remove merge-blocking PR-description content gates while keeping PR template
structure checks and moving reviewer-evidence expectations into the required
PR review bot flow.

## Scope

- Remove hard CI/local/release checks that fail solely because an individual PR
  body has weak or missing template content.
- Keep `.github/pull_request_template.md` template-sync enforcement.
- Add a dedicated `reviewer_qa` persona for tests, observability, alerts,
  documentation, and Garbage Collection pass.
- Rehome dynamic review-context assembly under `tools/scripts/review/`.
- Move review-specific architecture tests under `tests/architecture/review/`.

## Acceptance Criteria

- [x] PR body content is reviewed by the bot, not blocked by CI.
- [x] Required review prompt launches `reviewer_qa`.
- [x] Structured clean review parsing requires all four reviewer summaries.
- [x] Static review-context wording lives in markdown prompt files.
- [x] Targeted review-bot and CI policy tests pass.

## Verification

- `python3 tools/scripts/check_pr_readiness.py --template-sync`
- `python3 tools/scripts/check_pr_readiness.py --pr 1`
- `bash -n tools/scripts/review/pre-pr-ci.sh tools/scripts/ci/merge-gate/validate-contracts.sh`
- `uv run ruff check ...`
- `uv run pytest tests/architecture/review/test_pr_review_bot_prompt_delivery.py tests/architecture/review/test_pr_review_parent_prompt.py tests/architecture/review/test_pr_review_bot_parse_contracts.py tests/architecture/test_pr_orchestrator_support.py tests/architecture/test_pr_review_policy.py -q --tb=short`
- `uv run pytest tests/architecture/test_ci_control_plane_policy.py -q --tb=short`
- `uv run python tools/scripts/review/build_pr_review_context.py --review-mode post_ci --output <tmpfile>`

## References

- Query: `wiki/queries/2026-04-20-pr-body-gate-review-bot.md`
