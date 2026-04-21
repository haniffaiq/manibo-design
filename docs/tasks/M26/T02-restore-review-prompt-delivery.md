# T02: Restore authoritative review prompt delivery

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T02 - restore review prompt delivery`

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

Make the required `manibo-bot` review lane actually deliver the intended repo review prompt to Codex. Today the common `--base` path suppresses the prompt, which makes the required reviewer weaker than advertised.

## Subtasks

- [x] Identify the current prompt-suppression path in the review wrapper
- [x] Change the authoritative review invocation so the repo prompt is truly consumed
- [x] Add regression coverage proving the required lane fails if prompt delivery silently regresses

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/review.py` | Modify | Stop suppressing the authoritative review prompt |
| `tools/agents/pr_review_bot.py` | Modify | Enforce the correct invocation path for formal review |
| `tests/architecture/` | Modify | Add regression tests for prompt delivery |

## Implementation Notes

If `codex review --base` fundamentally cannot accept the prompt, stop using that command for the required review path. Do not keep fake prompt support in place.

## Acceptance Criteria

- [x] Required formal review actually receives the repo prompt/rubric
- [x] The bot fails loudly if prompt delivery regresses
- [x] Local and CI review paths use the same authoritative review behavior

## Verification Evidence

```bash
bash -n tools/scripts/review/pr-review.sh
uv run ruff check tools/agents/review.py tools/agents/pr_review_bot.py tools/scripts/build_pr_review_prompt.py tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_review_wrapper_prompt_exec_path.py tests/architecture/test_pr_review_bot_prompt_delivery.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_resolution_guard.py tests/architecture/test_ci_control_plane_policy.py
uv run ruff format tools/agents/review.py tools/agents/pr_review_bot.py tools/scripts/build_pr_review_prompt.py tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_review_wrapper_prompt_exec_path.py tests/architecture/test_pr_review_bot_prompt_delivery.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_resolution_guard.py tests/architecture/test_ci_control_plane_policy.py --check
uv run pyright -p pyrightconfig.ci.json
uv run pytest tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_review_wrapper_prompt_exec_path.py tests/architecture/test_pr_review_bot_prompt_delivery.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_pr_review_resolution_guard.py tests/architecture/test_ci_control_plane_policy.py -q
tools/scripts/review/pr-review.sh origin/main pre_ci
tools/scripts/review/pr-review.sh origin/main post_ci
```

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
