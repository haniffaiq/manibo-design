# T03: Fail closed on suppressed, malformed, or ambiguous formal review output

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T03 - fail closed formal review`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26-ci-control-plane`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

The required review lane must not silently normalize transcript noise, suppressed prompts, or ambiguous output into `No blocking findings.`. This task hardens parser behavior and fallback policy.

## Subtasks

- [x] Remove optimistic clean fallbacks from the formal review lane
- [x] Treat malformed or transcript-like output as failure, not clean
- [x] Add regressions for ambiguous output shapes and timeout/fallback paths

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/pr_review_bot.py` | Modify | Harden formal review parsing and fallback rules |
| `tests/architecture/` | Modify | Add fail-closed review parser regressions |

## Implementation Notes

Advisory/manual review can stay more forgiving. The required merge-critical review lane cannot.

## Acceptance Criteria

- [x] Suppressed prompt delivery cannot produce a clean required review
- [x] Ambiguous or malformed review output fails the required lane
- [x] The parser no longer upgrades noisy output to `No blocking findings.` on the required path

## Completion Notes

1. `tools/agents/pr_review_bot.py` now treats quota exhaustion and timeout as hard required-lane failures instead of posting fallback clean reviews.
2. The strict parser now rejects empty output, transcript-shaped output, mixed clean-plus-noise output, and ambiguous unstructured summaries on the required path.
3. `_run_codex_review()` now parses only successful stdout on the success path, so fallback retry notices on stderr do not poison a clean required review.
4. `tools/scripts/review/pr-review.sh` restores the documented default fallback lane for local attended review without requiring manual env exports.

## Verification Evidence

```bash
bash -n tools/scripts/review/pr-review.sh
uv run ruff check tools/agents/pr_review_bot.py tools/agents/ci_control_plane_policy.py tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_pr_review_bot_fail_closed.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_bot_prompt_delivery.py
uv run ruff format tools/agents/pr_review_bot.py tools/agents/ci_control_plane_policy.py tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_pr_review_bot_fail_closed.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_bot_prompt_delivery.py --check
uv run pyright -p pyrightconfig.ci.json
uv run pytest tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_pr_review_bot_fail_closed.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_bot_prompt_delivery.py -q
tools/scripts/review/pr-review.sh origin/main pre_ci
tools/scripts/review/pr-review.sh origin/main post_ci
```

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [review_agent.md](../../../wiki/ops/codex_ci_bots.md)
