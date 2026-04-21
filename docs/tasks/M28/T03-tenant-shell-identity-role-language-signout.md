# T03: Tenant shell shows active client identity and sign out

> **Milestone**: M28-solution-visibility-tenant-access-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M28 T03 - add tenant shell identity and signout`

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

Make the tenant shell honest and usable. This task advances the checklist rows for tenant-shell identity and tenant-shell sign-out by exposing a human-readable tenant name/slug in shell chrome and wiring a visible sign-out action. Because the current signed session does not carry tenant name/slug, this task explicitly includes the minimal auth-bootstrap/session extension plus server-to-client handoff needed to surface that identity safely to the shell.

## Subtasks

- [ ] **Expose active client identity in shell chrome**: Show a human-readable tenant name/slug instead of only generic `Clinic workspace` / `Operator console` labels.
- [ ] **Add tenant-shell sign out**: Reuse the existing `/api/auth/logout` path so tenant users can leave the workspace directly from the shell.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/layout.tsx` | Modify | Pass client identity into the tenant shell from a server-side boundary |
| `apps/api/src/platform_api/routes/auth.py` | Modify if needed | Extend the platform auth bootstrap payload with tenant identity metadata if that is the simplest safe source |
| `apps/web/src/app/api/auth/session/route.ts` | Modify if needed | Extend the session payload with tenant name/slug if the current route is the simplest safe source |
| `apps/web/src/lib/auth.ts` | Modify if needed | Extend server-side session types/helpers to carry tenant identity metadata |
| `apps/web/src/components/tenant-shell.tsx` | Modify | Show human-readable client identity and a tenant-shell sign-out action |
| `apps/web/src/components/sidebar-nav.tsx` | Modify if needed | Support the shell footer/header layout needed for identity + sign-out |
| `apps/web/src/lib/tenant-locale.ts` | Modify | Replace generic shell copy with client-aware labels |
| `apps/web/tests/tenant-workbench.test.ts` | Modify | Prove tenant-shell identity/sign-out and route composition stays correct |
| `apps/web/tests/auth-session-route.test.ts` | Modify if needed | Prove the client-identity session payload if the route is extended |
| `apps/web/tests/auth-logout-route.test.ts` | Create/Modify | Prove `/api/auth/logout` clears tenant-session cookies directly |
| `apps/api/tests/integration/test_auth.py` | Modify if needed | Prove the platform auth bootstrap exposes tenant identity metadata when extended |
| `apps/web/e2e/workbench-shells.spec.ts` | Modify | Verify tenant-shell identity/sign-out |

## Implementation Notes

- Keep copy obvious for non-technical users.
- Reuse the existing deployment-shell logout path instead of inventing a second auth exit flow.
- Prefer a tenant slug/name in the shell; if `tenant_id` is also shown for support/debugging, keep it secondary.
- Close the logout proof gap directly: this task is not done unless `/api/auth/logout` has focused route-level test coverage, not just shell/E2E coverage.
- If this task touches backend auth/bootstrap files, it inherits the same proof bar as any other `src/**` change: scoped backend lint/type checks, `uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short`, and OTLP evidence in the PR body.

## Acceptance Criteria

- [ ] Tenant shell shows a human-readable client identity in a visible location.
- [ ] Tenant users have a working sign-out action in the shell.

## References

- Milestone: [M28-solution-visibility-tenant-access-ux.md](../../milestones/M28-solution-visibility-tenant-access-ux.md)
- Related: `docs/requirements/checklist.md` rows “Tenant workspace shell shows the active client identity” and “Authenticated tenant users can sign out from the tenant workspace”; `apps/web/src/components/tenant-shell.tsx`
