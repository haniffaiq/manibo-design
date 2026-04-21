# M26.7: Codex Subagent PR Review Simplification — Progress

## Status

Activated on 2026-04-14 by explicit human request. The milestone was reset the same day after validating the official Codex subagent and config model. T01 survives from the earlier branch work because the durable case-file and parsing seam is still useful. Everything else is reopened under the simpler target: one namespaced script path plus repo-scoped `.codex/` config and review agents.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Stabilize the durable case-file and finding parser seam | Completed | 2026-04-14 |
| T02 | Define repo-scoped Codex config, reviewer agents, and the parent review prompt | Completed | 2026-04-14 |
| T03 | Create one namespaced review runner under `tools/scripts/review/` | Completed | 2026-04-14 |
| T04 | Move GitHub fetch/publish and same-head review authority into namespaced review scripts | Completed | 2026-04-14 |
| T05 | Support Manibo session profiles and NFQ API-key profiles without forking the review flow | Completed | 2026-04-14 |
| T06 | Add GitLab MR support through the same runner | Completed | 2026-04-14 |
| T07 | Delete obsolete review glue and cut workflows/docs over to the simple path | Completed | 2026-04-14 |

## Notes

1. One visible review only. Codex subagents are internal reviewers, not public review products.
2. Codex should do the persona orchestration. Python should only do deterministic plumbing.
3. All new deterministic review plumbing must live under `tools/scripts/review/`.
4. Repo-scoped Codex behavior belongs in `.codex/config.toml` and `.codex/agents/*.toml`.
5. Hooks are optional future guardrails, not part of the core design.
6. The extracted helpers in `tools/agents/reviewbot/` are temporary foundation only. Keep only what still earns its keep after the namespaced script path lands.
7. T02 defined the minimal `.codex/config.toml`, three read-only reviewer agents, and the parent review prompt under `tools/scripts/review/prompts/parent_review.md`. No new Python prompt abstraction was introduced.
8. T03 added `tools/scripts/review/run_pr_review.py` as the one namespaced local review entrypoint. The shell wrapper now delegates to it instead of manually composing prompt and review subprocess calls.
9. T04 introduced `tools/scripts/review/github.py` as the namespaced GitHub compatibility adapter while preserving the existing `tools/agents/pr_review_bot.py` implementation surface that the repo already allowlists and the test suite still patches directly.
10. T05 separated Codex config profile selection from alternate auth homes. `.codex/config.toml` now defines `review_session` and `review_api`, while the runner stack accepts `CODEX_REVIEW_CONFIG_PROFILE`/`--profile` without forking the review logic or breaking named auth-home aliases.
11. T06 added `tools/scripts/review/gitlab.py` as a small env-driven GitLab adapter. It reuses `run_pr_review.py` for the actual Codex review, then upserts one authoritative MR note instead of inventing a second review framework.
12. T07 kept the GitHub workflows on `tools/agents/pr_review_bot.py`, updated the harness classification/docs, and left `tools/scripts/review/github.py` as a small compatibility shim because the repo's size/test guards are already anchored in the existing implementation. The old prompt builder remains in place because that implementation still consumes it.
