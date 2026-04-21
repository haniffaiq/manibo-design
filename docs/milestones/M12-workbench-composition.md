# M12: Workbench Composition + Role-Scoped Shells

Status: done
Created: 2026-03-20
Owner: Jakit
Branch: feat/M12-workbench-composition
Stream: platform
Depends on: none
Reference: wiki/architecture/architecture.md; docs/requirements/checklist.md:45,54

## Goal

Replace hard-coded tenant navigation and workbench layout with manifest-driven, role-scoped composition. Operators, client admins, and deployment admins each get a composed shell that renders only the solutions and routes they should see. Observability primitives (queue, case, compare) become shared cross-solution workbench surfaces, not solution-specific pages.

## GitHub Issues

- **#615**: Introduce shared Operator, ClientAdmin, and Deployment workbench shells — `done`
- **#617**: Replace hard-coded tenant nav with role and solution composed navigation — `done`
- **#618**: Promote observability queue-case-compare primitives into shared cross-solution workbench — `done`
- **#698**: Define shared workbench page archetypes and state grammar in `apps/web` — `open` (follow-on design debt, not a blocker for the active M12 task table)

## Current State (audited 2026-03-26)

### Shipped
- `SolutionUIManifest` type + per-solution manifests for appointment_booking, driver_verification (#616 DONE)
- Manifest-driven nav in `tenant-shell.tsx` with `OperatorWorkbenchShell` + `ClientAdminWorkbenchShell`
- Separate `DeploymentShell` wired into `/app/(deployment)/admin/layout.tsx`
- `getSolutionNavItems(enabledSet, role)` filters routes by enabled solutions and session role
- `resolveServerLandingRoute(role, enabledSolutions)` now drives root/login redirect surfaces with manifest-owned single-solution defaults and safe role fallbacks
- Solution UI in `solutions/<name>/ui/src/` with `@solution/<name>-ui` packages
- Route generation via `scripts/generate-solution-routes.mjs` → generated manifests + pages
- Export script with client manifests for NFQ/VOX (#619 DONE)
- Architecture isolation tests in `test_solution_isolation.py` — no cross-solution imports
- Role-scoped shell tests plus full `apps/web` Playwright and UI harness proof are recorded for the shipped shell/layout flows
- Observability workspace accepts solution-contributed coverage via `resolveSubjectCoverage()`
- Shared queue/case/compare — single workspace, not duplicated per solution
- Shared observability API exposes typed `solution_enrichers`
- Shared observability case detail/evidence rail render typed enrichers for shipped appointment-booking and driver-verification data without forking custom screens

### Future / out of active M12 scope
- No tenant `Today` route or equivalent shared multi-solution work summary
- No urgent-work landing-route precedence beyond the shipped safe fallback rules
- #698 page-archetype/state-grammar cleanup remains follow-on design debt

## Visual Status

Historical problem framing from before the final proof pass is preserved below for context. Treat `Current State`, `Acceptance Criteria`, and `Verification` as the source of truth for shipped M12 status.

### #617 — Landing-route resolution is still static

```text
today

login -> resolveLandingRoute(role) -> static map -> redirect

  SuperAdmin   -> /admin
  ClientAdmin  -> /dashboard
  Operator     -> /call-ops

missing inputs:
  x enabled solutions
  x zero/one/many-solution handling
  x urgent-work precedence
  x manifest-owned default routes
```

```text
needed

login -> resolveLandingRoute(role, enabledSolutions, urgentSignals?) -> route

  SuperAdmin  -> /admin
  Tenant role:
    0 solutions -> shared workbench entry / enablement-safe fallback
    1 solution  -> manifest default route
    N solutions -> shared workbench entry such as Today
    urgent work -> hot queue route wins
```

### #618 — Shared observability exists, but enrichers do not

```text
today

Queue -> Case -> Compare -> Evidence Rail
   |       |        |             |
   +-------+--------+-------------+---- shared workspace works

solution contribution today:
  observability: [{ key, label, detail, state }]

meaning:
  + header badges/coverage cards
  - no case-detail enrichers
  - no evidence-rail enrichers
  - no timeline decorators
  - no typed or registry-backed solution actions/links
  + one-off hardcoded links may still appear in shared detail today
```

```text
needed

Queue -> Case -> Compare -> Evidence Rail
   |       |        |             |
   +-------+--------+-------------+---- shared core
                         |
                         +---- solution enrichers
                               - case detail fields
                               - evidence items
                               - timeline decorators
                               - related actions/links
```

## Ownership Split

### #617 — Landing route is frontend-first, with one real backend follow-up

```text
+------------------------------------+----------------------------+------------------------------+
| What is needed                     | Backend exists today?      | Frontend exists today?       |
+------------------------------------+----------------------------+------------------------------+
| Active solutions for tenant        | yes: GET /solutions        | no: not used at redirect     |
| Role from authenticated session    | yes: role in session/cookie| partial: feeds static map    |
| 0/1/N-solution landing rules       | n/a                        | no: not implemented          |
| Urgent work across solutions       | no: no shared aggregator   | no: nowhere to consume it    |
+------------------------------------+----------------------------+------------------------------+
```

```text
intermediate slice

login
  -> read role
  -> read enabled tenant solutions
  -> 1 solution: manifest-owned default route
  -> otherwise: current role-safe fallback
       client_admin    -> /dashboard
       client_operator -> /call-ops

full closure later
  -> shared tenant workbench entry such as Today
  -> cross-solution urgent summary for hot-route precedence
```

### #618 — Shared observability enrichers are backend-contract first

```text
+------------------------------------+----------------------------+------------------------------+
| What is needed                     | Backend exists today?      | Frontend exists today?       |
+------------------------------------+----------------------------+------------------------------+
| Shared queue/case/compare          | yes                        | yes                          |
| Core evidence (timeline/transcript)| yes                        | yes                          |
| Solution extraction detail         | partial: per-solution only | no shared consumer           |
| Shared enricher contract           | no                         | no                           |
| Observability API with enrichers   | no                         | no                           |
+------------------------------------+----------------------------+------------------------------+
```

```text
today

shared workspace
  -> renders core evidence
  -> reads manifest coverage badges

missing
  -> typed "solution evidence" contract
  -> shared API shape for case/evidence enrichers
  -> frontend rendering for those enrichers

order
  1. backend contract
  2. shared API response
  3. frontend adoption in case/evidence rail
```

## Design Decisions

1. **SolutionUIManifest is the contract** — solutions declare routes, observability contributions, and role restrictions. The shell reads manifests; it never hardcodes solution names.
2. **Two tenant shells, one deployment shell** — `OperatorWorkbenchShell` and `ClientAdminWorkbenchShell` for tenant; `DeploymentShell` for super_admin. Each composes nav from manifests + core sections.
3. **Route generation, not runtime discovery** — `generate-solution-routes.mjs` creates Next.js pages at build time. No dynamic routing at runtime.
4. **Observability is a shared primitive** — one workspace serves all solutions. Solutions contribute coverage metadata via manifests, not custom pages.
5. **Landing route is deterministic** — role → default route, modified by active solutions count and urgency signals.

## Tasks

| Task | Title | Status | Depends on | Issue |
|------|-------|--------|------------|-------|
| T01 | Deployment workbench shell parity with tenant shell | done | none | #615 |
| T02 | FE — Landing-route precedence rules using role + enabled solutions | done | none | #617 |
| T03 | Solution-contributed observability coverage in shared workspace | done | none | #618 |
| T04 | Shared queue/case/compare primitives usable by all solutions | done | T03 | #618 |
| T05 | Verify manifest-driven nav covers all solution routes | done | none | #617 |
| T06 | UI proof backfill for role-scoped shell rendering | done | T01 | #615 |
| T08 | BE — Shared solution enricher contract + observability API response shape | not started | T03-T04 | #618 |
| T09 | FE — Adopt typed solution enrichers in shared case detail/evidence rail | done | T08 | #618 |

## Engineering Split

```text
+----------------------+----------------------------------------------------------+
| Frontend engineering | T02 landing-route precedence using role + enabled set   |
|                      | T06 UI proof backfill for role-scoped shells            |
|                      | T09 typed shared observability enrichers in UI          |
+----------------------+----------------------------------------------------------+
| Backend engineering  | T08 shared solution-evidence contract + API extensions  |
+----------------------+----------------------------------------------------------+
```

## Task Details

### T01 — Deployment workbench shell parity

**Problem:** `/app/(deployment)/admin/layout.tsx` had hardcoded `sections` array with all nav items inline. Solutions could not contribute deployment-level routes. No parity with tenant shell's manifest-driven approach.

**Work:**
- Create the deployment workbench shell component (implemented in repo as `DeploymentShell`, parallel to `TenantShell`)
- Extract hardcoded nav from layout into `buildDeploymentWorkbenchSections()` that reads manifests
- The builder is manifest-aware, but current in-tree proof covers shipped platform sections only; manifest-contributed deployment routes still need focused proof
- Wire into `/app/(deployment)/admin/layout.tsx`

**Key files:**
- Current hardcoded layout: `apps/web/src/app/(deployment)/admin/layout.tsx`
- Pattern to follow: `apps/web/src/components/tenant-shell.tsx`
- Manifest type: `packages/web-shared/src/types/solution-manifest.ts`

### T02 — FE landing-route precedence

**Problem:** `resolveLandingRoute(role)` is still just a static role map. The frontend does not use enabled tenant solutions at redirect time, so login/root redirects cannot even do the simplest useful upgrade: “if there is exactly one enabled solution, go there.”

**Work:**
- This is an intermediate slice, not full `#617` closure
- Create a server-safe landing-route resolver that uses `role + enabledSolutions`
- Rules:
  - 1 active solution → that solution's manifest-owned default route
  - 0 or multiple active solutions → keep the current role-safe fallback route for now
  - `super_admin` → `/admin`
- Wire into root redirect and login callback / server-rendered redirect surfaces
- Keep `Today` and urgency out of the first slice; they remain future work required for full closure of `#617`
- Do not create a separate parked task for urgent-work summary until a requirement/checklist row explicitly justifies it

### T08 — BE shared solution enricher contract + API

**Problem:** Solutions can currently contribute only `observability` coverage metadata. They cannot add real typed enrichers to case detail, evidence rail, timeline decorators, or related actions, and the shared observability API does not expose a generic solution-evidence shape.

**Work:**
- Define the minimal typed contribution contract for shared observability enrichers
- Keep it serializable and registry-backed; do not invent a plugin circus
- Cover at least:
  - case-detail fields
  - evidence items
  - timeline decorators
  - related action/link contributions
- Extend the shared observability API response shape to carry those enrichers

### T09 — FE typed solution enrichers in shared workspace

**Problem:** Even with shared queue/case/compare primitives, the operator still sees only generic transcript/tool/escalation/timing truth in the shared workspace.

**Work:**
- Render the backend-provided typed enrichers in shared case detail and evidence rail
- Add first real enrichers for shipped solutions
- Clinic example: booking outcome / callback state
- Driver example: discrepancy / doc-review context
- Prove those enrichers land inside the shared case/evidence model instead of forking separate screens

### T06 — UI proof backfill for role-scoped shell rendering

**Problem:** Historical shell tests exist, but the repo-standard UI proof package for changed shell/layout flows was never backfilled into the milestone. Under the repo UI gate, that means `#615` is not honestly closed yet.

**Work:**
- Test: `client_operator` session → admin nav items (Team, Settings) hidden
- Test: `client_admin` session → all nav items visible
- Test: solution routes with `roles: [ClientAdmin]` restriction → not accessible by operator
- Test: deployment shell renders shared platform nav sections and shell parity
- Backfill repo-standard UI proof before calling this fully done:
  - Chrome DevTools MCP desktop + mobile verification
  - Playwright MCP desktop + mobile verification
  - artifact paths recorded in this milestone
  - full `apps/web` Playwright suite + `tools/scripts/e2e/run-web-e2e.sh`

## Acceptance Criteria

- [x] Deployment admin shell reads routes from manifests (no hardcoded solution nav)
- [x] `DeploymentShell` component exists and is wired into layout
- [x] Landing route no longer relies on a static role map alone; at minimum, a single enabled solution can win
- [x] Observability queue/case/compare are shared primitives, not duplicated per solution
- [x] Solutions contribute observability coverage metadata via manifests, not hardcoded lists
- [x] Shared observability API exposes typed solution enrichers, not just coverage metadata
- [x] Shared workspace renders typed solution enrichers without forking per-solution screens
- [x] E2E test proves `client_operator` cannot see admin-only nav sections
- [x] E2E test proves deployment shell renders shipped platform nav sections
- [x] Repo-standard UI proof for the changed shell/layout flows is recorded with Chrome DevTools MCP + Playwright artifacts on desktop and mobile
- [x] Full `apps/web` Playwright suite and `tools/scripts/e2e/run-web-e2e.sh` are recorded for the changed shell/layout flows
- [x] `pnpm -C apps/web lint` and `pnpm -C apps/web check-types` pass

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && pnpm -C apps/web exec vitest run tests/landing-route.test.ts tests/tenant-workbench.test.ts tests/auth-oidc-routes.test.ts tests/auth-session-route.test.ts tests/middleware.test.ts tests/observability-api.test.ts tests/observability-workspace.test.ts
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/observability.spec.ts e2e/workbench-shells.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/agent-test-workbench.spec.ts e2e/observability-live.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts e2e/agent-test-workbench.spec.ts e2e/call-history.spec.ts e2e/call-ops-live.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/clinic-handoff.spec.ts:116 --project=chromium
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/workbench-shells.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web playwright:test
source ~/.nvm/nvm.sh && nvm use 22.14.0 >/dev/null && tools/scripts/e2e/run-web-e2e.sh
```

```text
Results recorded on 2026-03-26

- `pnpm -C apps/web exec vitest run tests/landing-route.test.ts tests/tenant-workbench.test.ts tests/auth-oidc-routes.test.ts tests/auth-session-route.test.ts tests/middleware.test.ts tests/observability-api.test.ts tests/observability-workspace.test.ts`
  Result: `112 passed`
- `pnpm -C apps/web check-types`
  Result: success
- `pnpm -C apps/web lint`
  Result: `✔ No ESLint warnings or errors`
- `pnpm -C apps/web exec playwright test e2e/observability.spec.ts e2e/workbench-shells.spec.ts --project=chromium`
  Result: `12 passed`
- `pnpm -C apps/web exec playwright test e2e/agent-test-workbench.spec.ts e2e/observability-live.spec.ts --project=chromium`
  Result: `13 passed`
- `PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts e2e/agent-test-workbench.spec.ts e2e/call-history.spec.ts e2e/call-ops-live.spec.ts --project=chromium`
  Result: `22 passed`
- `PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/clinic-handoff.spec.ts:116 --project=chromium`
  Result: `1 passed`
- `PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web exec playwright test e2e/workbench-shells.spec.ts --project=chromium`
  Result: `6 passed`
- `NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm -C apps/web playwright:test`
  Result: `119 passed`
- `tools/scripts/e2e/run-web-e2e.sh`
  Result: passed; artifact directory `tools/agents/artifacts/ui-harness/local-20260326T122506Z/`, with `playwright-results.json` showing `expected=119`, `unexpected=0`, `flaky=0`, and `test-results/.last-run.json` showing `"status": "passed"`
- Chrome DevTools MCP artifacts:
  - desktop shell proof: `tools/agents/artifacts/m12-manual-20260326/chrome-desktop-client-admin-dashboard.png`
  - mobile observability enricher proof: `tools/agents/artifacts/m12-manual-20260326/chrome-mobile-observability-enricher.png`
- Playwright browser artifacts:
  - desktop observability enricher proof: `tools/agents/artifacts/m12-manual-20260326/playwright-desktop-observability-enricher.png`
  - mobile call-ops proof: `tools/agents/artifacts/m12-manual-20260326/playwright-mobile-call-ops.png`
- Playwright MCP returned a successful desktop DOM verification during manual proof, then the MCP transport closed before screenshot capture. Equivalent desktop/mobile screenshots were captured with raw Playwright against the same local app instance and route-backed fixtures.
```

## Non-Goals

- No new observability case types (that's M1-M02)
- No VOX-specific widget or chat work (that's M4)
- No export pipeline changes (that's M11)
- No separate M12.x vanity milestone. Remaining shell/workbench gaps stay inside M12 until they are truly done.
