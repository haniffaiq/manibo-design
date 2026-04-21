# T08: Minimal telephony workspace: providers + numbers

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02, T05, T06, T07
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T08 - add minimal telephony workspace`

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

Build the first operator-facing telephony workspace as one page with two tabs: `Providers` and `Numbers`. This is the minimum usable UI for connecting providers, refreshing numbers, and assigning numbers to assistants without exposing trunk/control-plane internals by default.

## Subtasks

- [x] **Add Providers tab**: list installed provider accounts with ownership, connection status, and simple capability summary.
- [x] **Add provider connect/test flow**: connect or validate provider credentials with plain-language status and inventory refresh actions.
- [x] **Add Numbers tab**: show number inventory with provider, assigned assistant, and status; rows are clickable and open the editor without exposing raw trunk internals.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/telephony/page.tsx` | Create | Combined providers + numbers workspace |
| `apps/web/src/components/admin-telephony-provider-form.tsx` | Create | Provider account connect/edit flow |
| `apps/web/src/components/admin-telephony-number-table.tsx` | Create | Number inventory and assignment list |

## Implementation Notes

- Use the same `Card` + `DataTable` + toolbar pattern as deployment admin `Tenants` and `Users`.
- No dedicated trunks page in this task.
- No default exposure of LiveKit IDs, provider route IDs, or dispatch rules.
- Do not use vague action labels like `Manage`.
- Do not use vague statuses like `Needs review`.
- UI must be capability-aware and honest. Unsupported actions stay hidden or disabled with explicit reason.
- Use the house admin palette and low-cognitive-load operator copy, not vendor-clone styling.

## Acceptance Criteria

- [x] Operators can see provider accounts and number inventory in one telephony workspace.
- [x] UI exposes ownership, status, and capability state plainly.
- [x] Providers and Numbers tables match the existing admin table format used by Tenants/Users on desktop, with mobile card fallbacks for narrow screens.
- [x] Number assignment does not require env lookups or raw transport IDs in the normal flow.
- [x] Desktop/mobile verification was completed in the implementation slice with Chrome DevTools MCP, Playwright MCP, the full `apps/web` Playwright suite, and `tools/scripts/run_web_ui_harness.sh`.

## Current Status

- Implemented `/admin/telephony` as one operator workspace with `Providers` and `Numbers` tabs.
- Added deployment-admin provider account create/edit/test affordances with installed-provider discovery via the T03 provider-pack surface.
- Added number inventory, tenant-aware assignment detail, and row-click editing without exposing raw trunk/provider IDs in the normal flow.
- Reused the existing deployment admin workbench navigation and dashboard entry points instead of creating a sidecar telephony shell.
- Kept assistant detail pages on the contextual `/admin/channels` hub instead of deep-linking into the deployment-only telephony workspace before tenant-BYO channel flows exist.
- Dedicated local PR review completed clean with `tools/scripts/run_local_pr_review.sh origin/main post_ci` returning `No blocking findings.` after fixing the degraded-binding editor path, BYO-only policy regression coverage, and the assistant-channel entrypoint mismatch.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
