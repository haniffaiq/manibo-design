# T05: Verification: shipped-solution enablement and access UX proof

> **Milestone**: M28-solution-visibility-tenant-access-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M28 T05 - verify solution visibility and access ux`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M28-solution-visibility`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M28/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M28/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Close the milestone with proof that the product contract is now honest: shipped solutions become visible when enabled, unshipped solutions do not pretend to be one-click available, tenant shells show active client identity plus sign-out, tenant team-management surfaces use explicit client-role language, and operators no longer see fake admin surfaces. This task refreshes checklist proof for tenant-shell identity/sign-out, tenant-solution visibility, operator restriction, and client-role assignment.

## Subtasks

- [ ] **Run targeted frontend tests**: Cover solution bundle parsing, tenant-shell identity/sign-out, dashboard visibility, and tenant team-management role-language + restriction mapping with page/state-level UI tests.
- [ ] **Run direct logout-route proof**: Cover `apps/web/src/app/api/auth/logout/route.ts` with a focused route-handler test so tenant sign-out is not inferred only from shell/E2E behavior.
- [ ] **Run targeted backend auth proof when T03 uses the auth/bootstrap exception**: Cover the auth/session payload change with scoped backend lint/type checks and `uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short`.
- [ ] **Run full route/browser proof**: Cover deployment admin solution access, tenant dashboard visibility, tenant-shell identity/sign-out, team restrictions, and tenant team-management role copy in the full `apps/web` Playwright suite plus UI harness.
- [ ] **Capture desktop/mobile browser artifacts**: Verify the touched flows with both Chrome DevTools MCP and Playwright MCP on desktop and mobile.
- [ ] **Capture OTLP evidence for any touched `src/**` surfaces**: If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, include `OTLP spans emitted = Yes` plus TraceQL, LogQL, and PromQL commands/output in the PR body.
- [ ] **Capture exact evidence**: Store the commands and artifacts needed to update checklist proof and milestone progress honestly.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M28/PROGRESS.md` | Modify | Mark completed tasks with dates and proof notes |
| `docs/requirements/checklist.md` | Modify if warranted | Update proof text only when the shipped-solution visibility contract is actually improved |
| `apps/web/tests/*` | Modify if needed | Targeted Vitest proof for touched flows |
| `apps/web/e2e/*` | Modify if needed | Route-level and workflow-level browser proof |
| `apps/web/tests/auth-logout-route.test.ts` | Create/Modify if needed | Direct proof that `/api/auth/logout` clears cookies |
| `apps/api/tests/integration/test_auth.py` | Modify if needed | Auth/session proof when T03 extends backend bootstrap payload |

## Implementation Notes

- Do not mark the milestone done without full `apps/web` Playwright coverage, UI harness evidence, and Chrome DevTools MCP + Playwright MCP desktop/mobile artifacts for the changed flows.
- If the deployment bundle contract changes, verify both admin and tenant flows in the same run.
- Do not treat shell/browser proof as a substitute for the logout route contract; if tenant sign-out UX changes, add direct route coverage too.
- If T03 touches backend auth/bootstrap code, run scoped backend lint/type checks plus `uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short`; if shared route/API inventory changes, regenerate and re-check the generated inventory before closing the task.
- If a checklist row does not materially improve, do not paper over it with fake prose.

## Acceptance Criteria

- [ ] Relevant Vitest coverage passes for solution visibility, tenant-shell identity/sign-out, dashboard, team restriction flows, and team-management role-language mapping.
- [ ] Direct logout-route coverage passes when tenant sign-out work lands.
- [ ] Backend auth/session proof runs when T03 uses the auth/bootstrap exception.
- [ ] Full Playwright suite passes.
- [ ] UI harness artifacts exist for desktop and mobile on the touched flows.
- [ ] Chrome DevTools MCP and Playwright MCP desktop/mobile screenshots exist for the touched flows.
- [ ] OTLP evidence is present for any PR that touches repo `src/**` surfaces.
- [ ] Milestone and requirement tracking are updated only with real proof.

## References

- Milestone: [M28-solution-visibility-tenant-access-ux.md](../../milestones/M28-solution-visibility-tenant-access-ux.md)
- Related: `docs/requirements/checklist.md` rows “Client Operator account can be created with restricted permissions”, “Tenant UI only shows solutions enabled for that tenant”, “Tenant workspace shell shows the active client identity”, “Authenticated tenant users can sign out from the tenant workspace”, and “Client Admin can assign roles: Client Admin or Client Operator”; `tools/scripts/e2e/run-web-e2e.sh`
