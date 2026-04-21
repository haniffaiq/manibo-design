# M28: Solution Visibility Contract + Tenant Access UX

Status: not started
Created: 2026-03-27
Owner: Jakit
Branch: feat/M28-solution-visibility
Stream: ui
Depends on: M11 (done), M20 (done), M21 (done), M22 (done), M27 (done)
Reference: `docs/requirements/checklist.md` execution rows “Client Operator account can be created with restricted permissions”, “Tenant UI only shows solutions enabled for that tenant”, “Tenant workspace shell shows the active client identity”, “Authenticated tenant users can sign out from the tenant workspace”, and “Client Admin can assign roles: Client Admin or Client Operator”; 2026-03-27 deployment/tenant console debugging session

## Goal

Fix the current lie in solution enablement and tenant access UX. A deployment must ship an explicit superset of solution UIs, tenant enablement must control runtime visibility only inside that shipped bundle, tenant shells must show a human-readable client identity plus sign-out, and tenant team-management surfaces must show honest role/access behavior. This milestone does not productize unfinished solution domains; it fixes the contract so shipped solutions become visible when enabled and non-shipped solutions stop pretending they are one click away.

This milestone is a corrective follow-up on the tenant-solution gating, tenant-shell identity/sign-out, and tenant team-management requirements listed above. The current repo already has solution gating, auth/session, and team-management proof, but the shipped UI still leaves holes in the operator contract: impossible solution-enable actions, generic tenant shell chrome with no sign-out path, ambiguous role language on team-management surfaces, and fake-editable admin surfaces for operator sessions.

## Design Decisions

1. **Deployment bundle is the UI superset** -- `NEXT_PUBLIC_SOLUTIONS` remains the build-time bundle contract. We do not add runtime plugin loading or manifest execution.

2. **Tenant enablement controls visibility only inside the shipped bundle** -- when a solution UI is shipped in the deployment bundle, enabling it for a tenant must make it appear in tenant nav/dashboard without a rebuild.

3. **Unavailable-in-this-deployment is a first-class state** -- admin solution access must distinguish:
   - shipped and enabled now
   - shipped but disabled for this tenant
   - not shipped in this deployment
   Impossible actions do not get the normal enable CTA.

4. **Tenant shell must expose client identity and sign-out** -- tenant users see the active client/workspace context in shell chrome and can sign out directly from the shell using the existing auth logout path.

5. **Tenant team-management surfaces use explicit client-role language** -- team-management screens say `Client Admin` / `Client Operator` instead of generic `Admin` / `Operator` labels that blur deployment-vs-workspace access and drift from the requirement contract.

6. **Admin-only tenant pages fail closed in UI** -- operator sessions do not see fake-editable team/admin controls followed by a buried `403`. Permission failure replaces the edit surface.

7. **No fake solution activation** -- `call_monitoring` and `operations_monitor` only become tenant-visible when their actual tenant routes/UI ship in the deployment bundle. This milestone does not invent placeholder pages to satisfy the toggle.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Define deployment solution bundle contract + generated manifest pipeline | not started | none |
| T02 | Admin solution access uses honest shipped/unshipped states | not started | T01 |
| T03 | Tenant shell shows client identity and sign out | not started | none |
| T04 | Tenant team-management surfaces use explicit client-role language and fail closed for operators | not started | none |
| T05 | Verification: shipped-solution enablement and team-management UX proof | not started | T01, T02, T03, T04 |

## Acceptance Criteria

- [ ] Deployment bundle contract is explicit and generated solution manifests/routes come from one source of truth.
- [ ] Admin solution access does not present a normal enable CTA for solutions whose tenant UI is not shipped in the current deployment.
- [ ] Enabling a shipped tenant solution makes it appear in tenant nav/dashboard for the matching tenant session without a rebuild.
- [ ] Tenant shell shows a human-readable client identity in a visible location and includes a working sign-out action.
- [ ] Tenant team-management surfaces use explicit `Client Admin` / `Client Operator` labels instead of generic deployment-like labels.
- [ ] Operator sessions do not see editable team-management controls or fake zero-state counts on authorization failure.
- [ ] This milestone does not claim `call_monitoring` or `operations_monitor` tenant product surfaces unless their real routes/UI are bundled.
- [ ] `pnpm -C apps/web lint`, `pnpm -C apps/web check-types`, relevant Vitest coverage, the full `apps/web` Playwright suite, and `tools/scripts/e2e/run-web-e2e.sh` all pass.
- [ ] If T03 uses the auth/bootstrap exception, the touched backend auth/session files also pass scoped `ruff`, scoped `pyright`, `uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short`, and generated inventory checks when the shared API contract changes.
- [ ] The changed admin/tenant flows are verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts captured before the milestone is marked done.
- [ ] OTLP evidence is captured for any PR that touches repo `src/**` surfaces (`apps/*/src/**`, `packages/*/src/**`, `solutions/*/src/**`), with `OTLP spans emitted = Yes` plus TraceQL, LogQL, and PromQL commands/output in the PR body.

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/solutions.test.ts tests/solution-route-wrappers.test.ts tests/tenant-workbench.test.ts tests/team-page.test.tsx tests/dashboard-api.test.ts tests/auth-session-route.test.ts tests/auth-logout-route.test.ts
pnpm -C apps/web playwright:test
tools/scripts/e2e/run-web-e2e.sh
uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short
uv run ruff check apps/api/src/platform_api/routes/auth.py apps/api/tests/integration/test_auth.py
uv run pyright apps/api/src/platform_api/routes/auth.py apps/api/tests/integration/test_auth.py
uv run python tools/scripts/generate_api_inventory.py
uv run python tools/scripts/check_api_inventory.py
```

Desktop/mobile browser proof for the touched flows is also required with both Chrome DevTools MCP and Playwright MCP; store screenshots/artifacts for:

- deployment admin solution visibility states
- tenant dashboard visibility after solution enablement
- tenant shell tenant-reference and sign-out state
- tenant team-management restrictions for operator vs Client Admin sessions
- tenant team-management role-language state

If T01 changes the route-generation or build-artifact scripts themselves, extend the targeted web test slice to include the generator/assertion coverage too (for example `apps/web/tests/build-artifacts.test.ts`) instead of pretending `solutions.test.ts` alone proves the bundle contract.

If the implementation touches repo `src/**` surfaces, including the T03 auth/bootstrap exception, the PR body must also include OTLP evidence blocks with captured output from:

```bash
tools/scripts/obs/traceql.sh '<traceql query>'
tools/scripts/obs/logql.sh '<logql query>'
tools/scripts/obs/promql.sh '<promql query>'
```

## Non-Goals

- No runtime plugin loading or manifest execution.
- No backend solution APIs for `operations_monitor` or other unfinished solution domains.
- No fake tenant pages for solutions that are not actually productized.
- No cross-solution business logic refactor.
- No redesign of dedicated solution pages beyond the access/visibility contract needed to make them honestly reachable.
