# T05: Support Manibo session profiles and NFQ API-key profiles without forking the review flow

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T05 - decouple review runners and auth`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.7-portable-review-system`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.7/PROGRESS.md` for current state

5. **Definition of Done**
   - The same runner script can execute with a Manibo session profile or an NFQ API-key profile
   - Repo-specific auth/account names are not hard-coded into the review logic
   - Manibo and NFQ can share the same review flow

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Use Codex profiles and small runner selection rules instead of building custom runner abstractions. Manibo should be able to keep its session-based Codex review path. NFQ should be able to run the same script through an API-key-backed Codex profile. The review logic stays the same; only the selected Codex profile/provider differs.

## Subtasks

- [x] **Add review-capable Codex profiles**: define the minimum profile/config needed for the Manibo session path and the NFQ API-key path.
- [x] **Teach the runner script how to select a profile**: profile or auth selection must be script arguments or env-driven, not forked review code.
- [x] **Keep review logic shared**: the same parent prompt, agents, and result parsing must run for both auth paths.
- [x] **Preserve explicit failures**: quota/auth/timeout errors still need to surface clearly even though profile selection is simpler.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.codex/config.toml` | Modify | Add review profiles or provider settings if needed |
| `tools/scripts/review/run_pr_review.py` | Modify | Select the Codex profile/provider without changing review logic |
| `tools/agents/review.py` | Modify | Shrink or delegate if it still participates in the path |
| `tools/scripts/review/pr-review.sh` | Modify | Thread config profiles cleanly without conflating them with auth-home aliases |
| `tools/agents/codex_exec.py` | Modify | Pass the selected Codex config profile through to `codex exec` |

## Implementation Notes

- Prefer Codex config/profiles over custom Python runner classes.
- Preserve failure classification: quota/auth/timeout/transport still matter even in the simpler profile-based path.
- Do not let the NFQ profile quietly diverge from the Manibo prompt, parser, or publish contract.
- Keep auth/project-specific values out of the review logic itself.

## Acceptance Criteria

- [x] The same review script can execute through a Manibo session profile or an NFQ API-key profile.
- [x] Repo-specific account names and secret wiring are not embedded in the review logic.
- [x] Failure semantics remain explicit and test-covered for both auth paths.
- [x] The existing Manibo review path remains compatible while NFQ can use an API-key path without forking the review flow.

## Completion Notes

1. `.codex/config.toml` now defines the minimal shared review profiles: `review_session` for ChatGPT-session auth and `review_api` for API-key auth.
2. `CODEX_REVIEW_CONFIG_PROFILE` / `--profile` now flows through `tools/scripts/review/run_pr_review.py`, `tools/agents/review.py`, and `tools/agents/codex_exec.py`.
3. The existing named auth-home path remains intact through `CODEX_REVIEW_PROFILE` and `CODEX_REVIEW_AUTH_HOME`, so old Manibo account aliases still work while NFQ can use the shared review logic with an API-key-backed profile.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `.codex/config.toml`, `tools/agents/review.py`, `tools/scripts/review/run_pr_review.py`
