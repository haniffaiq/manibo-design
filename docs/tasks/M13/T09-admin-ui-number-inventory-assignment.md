# T09: Assistant attach flow + progressive disclosure guardrails

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T08

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T09 - add assistant attach flow and disclosure rules`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M13-telephony-management`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M13/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M13/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Add the assistant-side `Attach existing number` flow and lock the progressive-disclosure rules that keep telephony internals out of the default UI. This task makes M31 assistant channels work against the new telephony inventory without turning assistant pages into telephony control-plane surfaces.

## Subtasks

- [x] **Add assistant attach flow**: assistant detail page can open a picker of existing unassigned numbers.
- [x] **Align assistant-centric and inventory-centric flows**: assistant pages and telephony page stay consistent views over the same binding model.
- [x] **Enforce progressive disclosure guardrails**: trunk IDs, LiveKit bindings, and provider route internals stay hidden from default UI unless a degraded state requires repair guidance.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/telephony/page.tsx` | Modify | Open the numbers tab directly when assistant/tenant context is provided |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Modify | Reuse inventory-backed binding data on assistant page and hide healthy transport internals |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Pass assistant identity into the attach flow |
| `apps/web/src/components/admin-telephony-number-picker.tsx` | Create | Shared number-select and assignment component |
| `apps/web/tests/channels-panel.test.tsx` | Create | Regression coverage for assistant attach flow and BYO guardrails |
| `apps/web/e2e/admin-agent-channels.spec.ts` | Modify | Browser proof for the assistant attach flow |
| `apps/web/e2e/harness.ts` | Modify | Default admin-route mocks for the new telephony background fetches so unrelated suites stay proof-clean |

## Implementation Notes

- Assistant pages attach existing numbers only. They do not create providers, manage routes, or expose trunk internals.
- The telephony table format must match the existing deployment admin `DataTable` pattern from Tenants/Users.
- Inventory view and assistant view must not drift into two different binding models.
- UI copy should separate "provider-owned number" and "published assistant" clearly. Transport details stay hidden unless repair is needed.
- Rows open the editor; do not add a generic action column in the first slice.
- Use concrete statuses: `Live` and `Unassigned` only in the first slice. Do not use `Needs review`.

## Acceptance Criteria

- [x] Operators can assign imported numbers to assistants from the assistant page via `Attach existing number`.
- [x] Telephony list surfaces use the same table structure as existing admin tables.
- [x] The first-slice numbers table exposes only `Live` and `Unassigned` as visible statuses.
- [x] Default UI does not expose raw trunk/route/internal IDs in healthy states.
- [x] Assistant-centric and inventory-centric views reflect the same data model.

## Verification

- `source ~/.nvm/nvm.sh && nvm use 22.21.1 >/dev/null && pnpm --dir apps/web check-types`
- `source ~/.nvm/nvm.sh && nvm use 22.21.1 >/dev/null && pnpm --dir apps/web test -- tests/channels-panel.test.tsx tests/admin-telephony-page.test.tsx tests/admin-telephony-number-table.test.tsx`
- `UV_CACHE_DIR=.uv-cache uv run pytest apps/api/tests/integration/test_phone_numbers_api.py apps/api/tests/integration/test_phone_numbers_api_mutations.py packages/platform-core/tests/integration/test_telephony_numbers_service.py -q --tb=short`
- `UV_CACHE_DIR=.uv-cache uv run python tools/scripts/generate_api_inventory.py`
- `UV_CACHE_DIR=.uv-cache uv run python tools/scripts/check_api_inventory.py`
- `source ~/.nvm/nvm.sh && nvm use 22.21.1 >/dev/null && tools/scripts/run_web_ui_harness.sh e2e/admin-agent-channels.spec.ts`
- `source ~/.nvm/nvm.sh && nvm use 22.21.1 >/dev/null && tools/scripts/run_web_ui_harness.sh`
- `tools/scripts/run_local_pr_review.sh origin/main post_ci`
- Manual MCP proof saved to:
  - `tools/agents/artifacts/manual-ui/t09-playwright-desktop-assistant-channels.png`
  - `tools/agents/artifacts/manual-ui/t09-playwright-mobile-assistant-channels.png`
  - `tools/agents/artifacts/manual-ui/t09-devtools-desktop-assistant-channels.png`
  - `tools/agents/artifacts/manual-ui/t09-devtools-mobile-assistant-channels.png`
- Targeted UI harness artifacts: `tools/agents/artifacts/ui-harness/local-20260404T164550Z`
- Full UI harness artifacts: `tools/agents/artifacts/ui-harness/local-20260404T170313Z`

Dedicated local PR review completed clean before push: `tools/scripts/run_local_pr_review.sh origin/main post_ci` -> `No blocking findings.`

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
