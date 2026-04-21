## Status

Active

## Created

2026-03-15

## Owner

Codex

## Branch

`feat/v2-ui-ux-admin-cleanup`

## Goal

Fix the V2 web UI grammar so the deployment console and clinic-support surfaces behave like operator tools instead of backend-shaped mockups. The target is not a cosmetic refresh. The target is:

- correct page structure
- truthful action affordances
- plain-language operator copy
- production-safe data visibility
- a layout system that supports dense workflows

## Checklist Rows Advanced

This track is allowed to ship only if it materially improves these `docs/requirements/checklist.md` rows:

- `Tenant UI only shows solutions enabled for that tenant: clinics do not see logistics modules and logistics tenants do not see clinic-booking modules`
- `Deployment Super Admin can create, configure, and deactivate tenants from the backoffice`
- `Deployment Super Admin has a code-first agent development environment: create/edit prompts, tool definitions, flow configurations`
- `Deployment Super Admin can deploy and manage agent versions across all tenants`
- `Deployment Super Admin can monitor platform health: error rates, latency, worker status, active calls`
- `SuperAdmin (NFQ) has full platform control: can manage all tenants, providers, and system settings`
- `Agent hands off to human operator for: insurance/compensated visits, urgent medical needs, complex multi-appointment requests, and specialty not available in the requested city`
- `Agent transfers immediately for urgent medical needs without completing booking flow`
- `Clinic operators can claim, assign, and resolve follow-up work for pending / failed / handed-off bookings`

## Scope Guard

Do not expand this track into:

- public chat/widget work
- outbound campaign UI
- full billing/pricing backoffice
- fake assistant-builder parity
- generic white-label redesign theater

If a change does not improve provider backoffice usability, clinic support continuity, or observability/operator clarity for a shipped V2 surface, it is probably scope drift.

## Current Failures

1. The deployment console leaks raw API paths and backend semantics into the UI.
2. Dense pages are constrained twice, so tables and workflow controls are too narrow.
3. Production admin lists do not distinguish real tenants from test/demo/E2E data.
4. Important actions feel dead because the next step is hidden in weak modal flows.
5. Observability implementation drifted away from the active case-first evidence-rail plan.
6. Deployment and clinic pages do not share a clear page grammar, so every screen invents its own layout rules.

## UX System Rules

### 1. Page Archetypes

Every screen must declare one of four archetypes:

- `directory`: find, scan, filter, bulk-manage
- `workflow`: start or complete one guided action
- `workspace`: monitor and act across a live operational surface
- `record`: inspect one case, call, booking, release, or tenant detail

### 2. Width Model

Every screen must declare one width:

- `reading`
- `standard`
- `workspace`
- `full`

Dense operational surfaces must not use the same frame as simple forms.

### 3. Truthful UI States

Every action must be one of:

- `live`
- `partial`
- `blocked by backend`

Do not render dead-looking controls without an explanation.

### 4. Copy Policy

- No raw API paths in operator-facing UI
- No raw event codes as primary labels
- No backend nouns when plain-language job nouns exist

Every page header must answer:

- what this page is for
- who uses it
- what to do next

### 5. Production Data Hygiene

Production-facing backoffice screens must not silently mix customer tenants with test/demo/E2E tenants.

### 6. Layout Integrity Gate

- No clipped or half-hidden CTA labels. If the action text does not fit, the layout is wrong.
- Data tables must reserve explicit width for action columns instead of hoping the browser does something sensible.
- Desktop and mobile verification must include a literal text-fit pass:
  - no cropped button text
  - no overlapping controls
  - no truncated primary actions without an intentional ellipsis treatment
  - no “technically clickable” controls that look broken

### 7. Minimal Workflow Rule

- First-step workflows must ask only for the fields required to complete the step.
- Optional identity, routing, or advanced provisioning belongs in a later setup screen unless the requirement explicitly says otherwise.
- A “simple” form that still dumps advanced plumbing on non-technical operators is fake simplicity.

## Delivery Plan

### Phase 1: Frame System and Copy Cleanup

Status: in progress

Deliver:

- shared page-frame component with width variants
- removal of double-container layout on deployment pages
- operator-facing copy for tenants, users, releases, assistants, security, settings, and health
- removal of raw API-path labels from user-facing page chrome

### Phase 2: Action Truthfulness

Deliver:

- clear next-step guidance for onboard, invite, create definition, and create release flows
- disable or annotate blocked actions instead of making them feel broken
- consistent empty/error/loading states across deployment pages

### Phase 3: Production Data Hygiene

Deliver:

- test/demo/E2E tenant segregation strategy
- explicit production-safe labeling and filtering
- no accidental “E2E Tenant” trust-destruction in default production views

### Phase 4: Observability Case-First Rebuild

Deliver:

- queue / case / compare structure aligned with `docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md`
- evidence-rail mental model
- deployment drill-down path from rollup to one affected interaction

### Phase 5: Clinic Support Continuity

Deliver:

- stronger `/call-ops` -> `/bookings` continuity
- clearer handoff and urgent transfer language
- booking follow-up record context that does not require staff to reconstruct what happened

## Immediate Slice

Build now:

- page frame component
- deployment layout width cleanup
- copy cleanup on the core deployment console pages

Hold for later:

- observability information-architecture rewrite
- backend-driven tenant filtering rules
- broader clinic support workflow polish

## Current Status Snapshot

This track is not done. The foundation is real, but the hardest operator flows still need work.

- Overall UI/admin/operator track: `~72% complete`, `~28% left`
- Confidence in the percentage: medium
- Why not higher: the remaining work is concentrated in the highest-cognitive-load surfaces, not in cosmetic cleanup

### Progress by track

- Deployment admin frame, copy, and layout grammar: `~82% complete`
- Tenant onboarding, access, and action-rail usability: `~78% complete`
- Solution visibility and phone-routing clarity: `~58% complete`
- Assistant and release governance UX: `~45% complete`
- Observability case-first UX: `~68% complete` functionally, `~58% complete` visually
- Responsive/mobile admin fallback: `~42% complete`
- Regression guardrails and browser-proof stability: `~72% complete`

## Remaining Work Ordered by Priority

### Priority 1: Fix broken trust on core admin surfaces

Why first:

- These screens are the first thing operators see
- If actions look broken or meaning is unclear, the whole console feels fake

Tasks:

1. Stabilize tenant and user table layouts so action columns never collapse or drift
2. Remove any remaining low-contrast disabled actions that read as missing controls
3. Add explicit next-step hints on tenant actions:
   - activate
   - suspend
   - offboard
   - export
4. Translate backend-shaped error/loading states into operator language everywhere
5. Verify desktop and mobile text fit for:
   - tenants
   - users
   - settings
   - security

Remaining effort: `~5%`

### Priority 2: Make setup flows obvious to non-technical admins

Why second:

- Onboarding pain is still too high
- People should not need repo knowledge to finish basic platform setup

Tasks:

1. Finish tenant onboarding guidance:
   - show the local dev login hint reliably after onboarding in local mode
   - explain active vs suspended vs offboarded plainly
2. Clarify staff sign-in setup:
   - rename residual platform jargon
   - explain issuer/app-id in human terms
3. Clarify shared AI starting settings:
   - explain what the baseline is for
   - explain when a new version is needed
   - make the Google + Gemini standard example the default explanation
4. Clarify phone-number setup:
   - explain imported number inventory vs routed number configuration
   - explain why no number appears when no routing record exists yet
   - point users to the exact next action when a Telnyx number exists but is not yet connected

Remaining effort: `~7%`

### Priority 3: Rework assistant and release governance UX

Why third:

- These are the most confusing product areas today
- They currently require too much platform interpretation

Tasks:

1. Assistant definitions:
   - auto-normalize business names into stable system names
   - explain clinic-registration starter/template availability in UI
   - verify and fix the workflow handoff so `Open workflow` is obviously live or honestly blocked
   - remove hide/show builder clutter unless it materially helps
2. Releases:
   - replace rollout jargon with business language
   - explain what a release package actually is
   - explain the real-world use case
   - make the sequence obvious:
     - build package
     - review contents
     - assign to tenant
3. Ensure both surfaces answer:
   - what this does
   - when to use it
   - what to do next

Remaining effort: `~10%`

### Priority 4: Finish observability readability without breaking the V2 model

Why fourth:

- The case-first model is directionally right now
- The visual density is still too high, especially in admin mode

Tasks:

1. Reduce over-compaction in the case workspace
2. Strengthen hierarchy between:
   - queue
   - case summary
   - evidence rail
   - right-rail actions/context
3. Keep the V2-safe subject model visible:
   - voice session
   - workflow run
   - control-plane incident
   - tenant composition
   - interactive channel session placeholder
4. Make the `What to do next` rail calmer and more actionable
5. Keep raw payloads hidden behind disclosure instead of leading the page
6. Verify desktop and mobile on real cases, not only empty state

Remaining effort: `~5%`

### Priority 5: Responsive fallback and regression hardening

Why last:

- Desktop operator use is still the primary path
- But without guardrails, the same bugs keep returning

Tasks:

1. Convert the worst mobile table fallbacks into record/card views where needed
2. Expand Playwright layout assertions for:
   - action-column fit
   - button-label visibility
   - metadata-column overflow
3. Add one visual/browser-proof pass per slice in both:
   - Playwright MCP
   - Chrome DevTools MCP
4. Keep the harness evidence current in the active doc

Remaining effort: `~2%`

## Definition of Done for the Remaining 28%

This track is done only when:

- non-technical admins can finish tenant, user, OIDC, and phone-routing setup without interpreting backend terms
- assistant and release flows explain themselves in business language
- observability reads as a calm case tool instead of a compressed internal console
- desktop action rails are stable and readable
- mobile fallback is acceptable on the changed admin pages
- desktop and mobile browser proof exists for every changed slice

## Progress Log

### 2026-03-15: Slice 1 shipped on branch

Delivered:

- added shared `apps/web/src/components/page-frame.tsx`
- widened deployment shell frame in `apps/web/src/app/(deployment)/admin/layout.tsx`
- moved deployment pages onto explicit `workspace` frames
- removed raw API-path labels from tenants, users, releases, assistants, security, settings, and health page chrome
- rewrote top-level deployment copy toward operator jobs instead of backend route exposure

Not solved yet:

- production test/demo/E2E tenant segregation
- observability case-first IA rebuild
- deeper clinic handoff/support workflow continuity

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- tests/admin-tenants-api.test.ts tests/admin-users-api.test.ts tests/admin-releases-api.test.ts tests/admin-agent-definitions-api.test.ts tests/admin-health-api.test.ts tests/admin-security-api.test.ts tests/admin-settings-api.test.ts
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test e2e/admin-dashboard.spec.ts e2e/admin-tenants.spec.ts e2e/admin-users.spec.ts e2e/admin-releases.spec.ts e2e/admin-agent-definitions.spec.ts e2e/admin-health.spec.ts e2e/admin-security.spec.ts e2e/admin-settings.spec.ts e2e/admin-solutions.spec.ts e2e/admin-phone-numbers.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260315T151054Z/devtools-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T151054Z/devtools-admin-health-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260315T151054Z/playwright-admin-agent-definitions-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T151054Z/playwright-admin-releases-mobile.png`

### 2026-03-15: Slice 2 action truthfulness + observability framing

Delivered:

- replaced modal-first primary actions with inline builders on tenants, users, releases, agent definitions, and settings
- changed primary action labels to truthful next-step copy such as `Open onboarding form`, `Open invite form`, and `Open release builder`
- kept destructive or secondary flows as modals instead of pretending every action deserves the same weight
- cleaned deployment health error states so backend feed failures degrade into operator-readable availability warnings with technical detail hidden behind disclosure
- rebuilt observability list framing around a case queue instead of a filter slab
- demoted advanced filters behind an expandable section and added applied-filter badges so the queue still explains current scope
- renamed observability summary cards and workspace copy toward generalized case/evidence language so the UI is less tightly coupled to today’s `call_session` / `workflow_run` API nouns
- aligned admin and tenant observability loading copy with the case-first model described in the reference observability UX plan `docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md` and the V2 observability endgame notes in `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`

Not solved yet:

- real V2 observability subjects still require backend APIs beyond sessions and workflow runs
- production-safe tenant segregation is still pending
- health still reflects real backend failures when the slowdown summary feed breaks; this slice only made the failure honest instead of raw

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/admin-tenants.spec.ts e2e/admin-users.spec.ts e2e/admin-releases.spec.ts e2e/admin-agent-definitions.spec.ts e2e/admin-settings.spec.ts e2e/admin-health.spec.ts e2e/observability.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260315T172146Z/devtools-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T172146Z/devtools-admin-observability-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260315T172146Z/playwright-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T172146Z/playwright-admin-observability-mobile.png`

### 2026-03-15: Slice 3 minimal onboarding + action-fit regression guard

Delivered:

- reduced tenant onboarding to the minimum required fields: tenant name, tenant slug, and first admin email
- removed optional identity, solution enablement, and phone bootstrap fields from the first-step onboarding flow
- replaced tenant onboarding placeholders with generic examples instead of client-specific examples
- fixed the tenant-solutions action column so workspace toggle labels keep enough width to stay readable
- shortened workspace action copy to `Show workspace` / `Hide workspace`
- added a Playwright regression check that fails if workspace-toggle labels overflow their buttons
- added explicit execution-plan rules for action-label fit and minimal first-step workflows

Not solved yet:

- destructive row actions on some deployment tables still render poorly in the live dev UI and need a dedicated pass
- full-suite Playwright and the UI harness remain blocked by repo-level Next.js/runtime instability outside this slice

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/admin-solutions.spec.ts e2e/admin-tenants.spec.ts --project=chromium
```

Artifacts:

- local Playwright screenshot: `admin-tenants-minimal-desktop-wide.png`
- local Playwright screenshot: `admin-tenants-minimal-desktop.png`

### 2026-03-15: Slice 4 operator-safe error copy + V2-safe observability broadening

Delivered:

- added shared login error translation so auth failures stop leaking raw HTTP status and JSON into operator-facing login screens
- changed `/api/auth/session` to return polite, actionable error copy for suspended tenants, invalid tokens, unreachable auth services, and missing user context
- applied the same operator-safe login error translation to both tenant and admin login forms
- hardened shared button and badge primitives so dense action rows stop clipping, collapsing, or wrapping in ugly ways under real table pressure
- translated tenant lifecycle and solution visibility failures into operator copy instead of backend-shaped messages like `409 Conflict`
- reserved explicit width for tenant action columns and added regression assertions that fail if action text no longer fits
- broadened observability UI framing toward the V2 endgame by adding one normalized subject model section and an evidence/context map that already accounts for voice sessions, workflow runs, interactive channel sessions, control-plane incidents, and tenant composition state
- kept planned V2 observability subjects visibly honest as `planned` or `partial` instead of faking data the backend does not expose yet

Not solved yet:

- V2 observability still needs backend API expansion for real control-plane, channel-runtime, and tenant-composition read models; this slice only made the UI architecture survive that future

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- tests/auth-session-route.test.ts
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/auth-flow.spec.ts e2e/admin-tenants.spec.ts e2e/admin-solutions.spec.ts e2e/observability.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260315T2200Z/playwright-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T2200Z/playwright-login-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260315T2200Z/devtools-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260315T2200Z/devtools-admin-tenants-mobile.png`

### 2026-03-15: Slice 4 verification closure + harness hardening

Delivered:

- confirmed the earlier full-suite Playwright failure was `.next` cache corruption caused by running the live dev stack and verification commands against the same worktree at once
- confirmed the earlier harness `/signup` build failure was stale build state, not a real missing route
- hardened `apps/web/e2e/harness.ts` so browser-generated `Failed to load resource` console noise for intentionally allowlisted API error routes now piggybacks on the request-failure allowlist instead of forcing duplicate regex plumbing in every error-path test
- reran the full `apps/web` Playwright suite cleanly from an isolated build/test environment
- reran `tools/scripts/run_web_ui_harness.sh` cleanly from a fresh production build

Not solved yet:

- V2 observability still needs backend API expansion for real control-plane, channel-runtime, and tenant-composition read models; the UI is now ready to absorb those subjects, but the APIs still do not exist

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- tests/auth-session-route.test.ts
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && PW_ENFORCE_NO_PAGE_ERRORS=1 PW_ENFORCE_NO_CONSOLE_ERRORS=1 PW_ENFORCE_NO_REQUEST_FAILURES=1 NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/auth-flow.spec.ts e2e/admin-tenants.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260315T201748Z/playwright-report/index.html`
- `tools/agents/artifacts/ui-harness/local-20260315T201748Z/playwright-results.json`

### 2026-03-15: Slice 5 V2 observability read models + tenant hygiene defaults

Delivered:

- added real backend observability read models for three V2 subject kinds:
  - `control_plane_incident`
  - `channel_runtime`
  - `tenant_composition`
- widened the normalized observability API contract so run list/detail/timeline payloads can carry:
  - `subject_id`
  - `integrity_gaps`
  - deeper context blocks for composition, runtime, and control-plane investigation
- added tenant and admin detail routes for those new observability subjects instead of faking them in the UI
- added integrity-gap reporting so the case surface can say when correlation, rollout state, or runtime linkage is missing instead of pretending evidence is complete
- made admin observability tenant lists production-safe by default:
  - demo/test/E2E tenants are hidden unless the operator explicitly asks to include non-production data
- applied the same production-safe hygiene to `/admin/tenants` and surfaced tenant environment in the API contract so the UI can label what it is showing
- widened the observability UI and routing layer to absorb the new V2-safe subjects without hard-coding everything to only `call_session` and `workflow_run`

Not solved yet:

- the dedicated DB-backed observability integration test still stalls in this local environment, so there is still one residual proof gap on the full asyncpg/testcontainer path
- this slice does not invent the future channel/control-plane backend truth; it only exposes the first read models the current schema can honestly support

Evidence:

```bash
uv run ruff check apps/api/src/platform_api/routes/observability.py apps/api/src/platform_api/routes/tenants.py packages/platform-core/src/platform_core/tenancy/hygiene.py apps/api/tests/unit/test_observability_v2_read_models.py apps/api/tests/integration/test_tenants.py
uv run pyright apps/api/src/platform_api/routes/observability.py apps/api/src/platform_api/routes/tenants.py packages/platform-core/src/platform_core/tenancy/hygiene.py apps/api/tests/unit/test_observability_v2_read_models.py
uv run pytest apps/api/tests/unit/test_observability_v2_read_models.py -q --tb=short
uv run pytest apps/api/tests/integration/test_tenants.py -k 'list_tenants_returns_provider_visible_tenants or list_tenants_hides_non_production_by_default_but_can_include_them' -q --tb=short
tools/scripts/generated_artifacts.sh refresh
```

Residual risk recorded:

- `uv run pytest apps/api/tests/integration/test_observability.py -k 'admin_observability_supports_v2_control_plane_runtime_and_composition_cases' -q --tb=short` still stalls on the local DB-backed integration path and was manually terminated after confirming the hang persisted

### 2026-03-16: Slice 6 deeper observability case detail

Delivered:

- enriched the normalized observability detail contract with `recommended_actions` so every case can point operators to the next concrete fix instead of dumping evidence with no conclusion
- added richer control-plane incident detail:
  - linked session/workflow context
  - operator ownership context
  - fix-oriented actions for incident queue review and jumping straight to the related session/workflow
- made channel runtime detail honest about current backend limits:
  - route/publish evidence is visible
  - delivery/retry/backoff telemetry is explicitly flagged as missing instead of fabricated
  - operator actions now point to the exact phone-routing or assistant-publish lane that can unblock the runtime
- added composition drift explanations that tell operators what to fix:
  - rollout mismatch
  - drifted solution revisions
  - missing platform defaults pinning
- broadened observability browser proof so admin and tenant flows both render the new `What to do next` section and the new V2 subject kinds:
  - `control_plane_incident`
  - `channel_runtime`
  - `tenant_composition`

Not solved yet:

- interactive channel session evidence still needs real backend read models before the UI can show web-chat/public-ingress lifecycle honestly
- the DB-backed asyncpg/testcontainer observability integration path is still not green locally; on the latest run the Postgres testcontainer never stayed up long enough for `psql` readiness, so the residual full-path proof gap remains

Evidence:

```bash
uv run ruff check apps/api/src/platform_api/routes/observability.py apps/api/tests/unit/test_observability_v2_read_models.py apps/api/tests/integration/test_observability.py
uv run pyright apps/api/src/platform_api/routes/observability.py
uv run pytest apps/api/tests/unit/test_observability_v2_read_models.py -q --tb=short
uv run pytest apps/api/tests/integration/test_observability.py -k 'admin_observability_supports_v2_control_plane_runtime_and_composition_cases' -q --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- tests/observability-api.test.ts
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/observability.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260316T054959Z/chrome-devtools-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T054959Z/chrome-devtools-admin-observability-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260316T054959Z/playwright-mcp-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T054959Z/playwright-mcp-admin-observability-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260316T054959Z/playwright-report/index.html`

Residual risk recorded:

- `uv run pytest apps/api/tests/integration/test_observability.py -k 'admin_observability_supports_v2_control_plane_runtime_and_composition_cases' -q --tb=short` still fails locally because the `postgres:16-alpine` testcontainer exits before readiness completes (`409 Client Error ... container ... is not running`)

### 2026-03-16: Slice 7 case-file observability detail + clinic handoff continuity proof

Delivered:

- reorganized observability case detail so it reads like one case file instead of a bag of cards:
  - `Case record`
  - `What to do next`
  - `Integrity gaps`
  - `Open related records`
  - `Runtime and release context`
  - `Evidence rail`
- kept the evidence rail as the primary narrative lane and moved fix-oriented action/context blocks into a disciplined right rail instead of making operators hunt through the page
- made the clinic bookings detail more explicit about handoff continuity from live support:
  - source badge and case badge in the context banner
  - stronger “same case story” copy instead of generic navigation chrome
  - three-step case journey strip
  - direct quick links back to live support, case evidence, call history, and the staff queue
  - selected-case checklist copy that explicitly carries the live-support note into booking review
- tightened Playwright regression coverage so the suite now fails if:
  - the case record stops rendering
  - the right-rail action/context blocks disappear
  - the evidence rail label disappears
  - the clinic handoff journey/quick links stop showing on the live-support path

Not solved yet:

- this still is not a full clinic handoff console; the repo has a better continuity path, not the final support cockpit
- interactive channel-session observability still needs backend truth before the same case model can show web/public-ingress lifecycle honestly

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/observability.spec.ts e2e/clinic-bookings.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260316T070107Z/chrome-devtools-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T070107Z/chrome-devtools-admin-observability-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260316T070107Z/playwright-mcp-admin-observability-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T070107Z/playwright-mcp-admin-observability-mobile.png`

### 2026-03-16: Slice 8 non-technical admin cleanup + stable action rails

Delivered:

- stacked tenant and user row actions vertically so `Suspend`, `Export`, `Offboard`, `Deactivate`, and `Remove` stay readable instead of collapsing into half-hidden controls
- hardened the shared disabled-button treatment so disabled destructive actions stay visible and legible instead of fading into white-on-white trash
- renamed assistant lifecycle copy away from internal jargon:
  - `definition` -> `assistant`
  - `open version steps` -> `continue setup`
  - `version steps` -> `setup steps`
- made the assistant setup panel scroll into view every time the row action is used, including when the panel is already open, so the action does not look dead
- kept the clinic registration starter visible inside assistant setup with:
  - source path
  - business summary
  - starter YAML preview/load path
- clarified public-number onboarding in plain language:
  - numbers do not appear here automatically from Telnyx
  - keep the number in Telnyx
  - paste the routing details here
  - publish an assistant first
- cleaned settings copy so non-technical admins see:
  - `staff sign-in`
  - `application ID`
  - `shared starting settings`
  - `advanced YAML for now`
  - a concrete Google/Gemini baseline example
- added a reusable Playwright `expectTextFits(...)` guard so dense admin labels fail the test suite when text overflows its control

Not solved yet:

- the long-running `dev-live` Next server on `3100` can still serve stale chunk errors in browser sessions after heavy UI changes; this is repo/runtime instability, not a page-specific logic failure

### 2026-03-16: Slice 9 deterministic action rails + wording cleanup proof

Delivered:

- replaced fragile flex-based row actions on tenant and user tables with deterministic grid action rails so destructive actions stop clipping or vanishing when one button wraps
- kept disabled destructive actions readable by pairing the shared disabled-button palette with explicit full-width action slots instead of hoping browser layout picks a good wrap
- widened the assistant table structure so:
  - the assistant traffic summary no longer collapses into a tall unreadable text stack
  - `Open version setup` keeps a stable button width in the actions column
- tightened assistant wording further toward operator language:
  - `Form open`
  - `Finish this here`
  - `Start assistant setup`
  - `Open version setup`
- corrected solution-language drift so tenant operators see `Enable solution` / `Disable solution` with `Enabled` / `Disabled` states instead of hidden/show-workspace jargon
- confirmed one real harness regression in observability detail navigation, then fixed the spec to target the intended related record instead of a duplicate text match
- added explicit browser-proof expectation that dense admin actions stay readable rather than merely technically clickable

Not solved yet:

- `dev-live` on `3100` still occasionally throws stale `.next` chunk/runtime noise under heavy edit cycles, so the durable proof source remains isolated Playwright runs and the UI harness rather than the long-running dev session alone
- broader product simplification questions such as whether rollout plans or starting-settings YAML should become non-technical editors are still separate product work, not closed by this slice

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3127 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3127 pnpm -C apps/web exec playwright test e2e/admin-tenants.spec.ts e2e/admin-users.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3126 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3126 pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3125 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3125 pnpm -C apps/web exec playwright test e2e/observability.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260316T110846Z/chrome-devtools-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110846Z/chrome-devtools-admin-settings-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110846Z/chrome-devtools-admin-solutions-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110846Z/playwright-report/index.html`
- `pnpm -C apps/web exec tsc --noEmit` can still fail when generated tenant-route files are missing from the current generated-solution state
- full harness proof still needs one clean pass after resetting the unstable dev server

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3117 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3117 pnpm -C apps/web exec playwright test e2e/admin-tenants.spec.ts e2e/admin-users.spec.ts e2e/admin-solutions.spec.ts e2e/admin-phone-numbers.spec.ts e2e/admin-agent-definitions.spec.ts e2e/admin-settings.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec tsc --noEmit
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260316T110500Z/chrome-devtools-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110500Z/chrome-devtools-admin-assistants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110500Z/chrome-devtools-admin-tenants-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260316T110500Z/chrome-devtools-admin-settings-mobile.png`

## Verification

Minimum gate for each UI slice:

```bash
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/run_web_ui_harness.sh
```

Also verify changed desktop and mobile flows with Chrome DevTools MCP and Playwright MCP before calling the slice done.
When the slice contains tables or dense action rows, verification must explicitly confirm that every visible action label fits its control at desktop and mobile widths.

### 2026-03-16: Slice 10 live-stack recovery + operator wording pass

Delivered:

- strengthened disabled button contrast in `packages/ui/src/components/button.tsx` so disabled actions stop fading into white-on-white sludge
- softened the inline-builder chrome in `apps/web/src/components/action-builder-card.tsx` from backend-ish `Form open / Finish this here` wording to `Editing here / Complete on this page`
- confirmed the current tenant action rail in the live `3100` stack shows all three row actions again:
  - `Suspend`
  - `Export`
  - `Offboard`
- confirmed the live settings page now reads in operator terms:
  - `Staff sign-in providers`
  - `Set up staff sign-in`
  - `Shared AI starting settings`
  - explicit Google + Gemini 3.0 Flash Lite Preview example text
- recovered the local `dev-live` stack by restarting it after the corrupted Next middleware session started throwing `ReferenceError: self is not defined` and `missing required error components`

Not solved yet:

- dense admin tables on mobile still degrade to horizontal scrolling; they are now readable and bounded, but not elegant
- `tools/scripts/run_web_ui_harness.sh` still has one flaky proof path in this repo:
  - several tests fail under the production-build harness with Playwright artifact `ENOENT` churn
  - the strict a11y smoke also still catches `_next` asset 404 console noise on the isolated production server
- those harness failures are proof/runtime instability, not the same thing as the product regressions fixed in this slice

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/admin-tenants.spec.ts e2e/admin-users.spec.ts e2e/admin-settings.spec.ts e2e/admin-releases.spec.ts e2e/admin-agent-definitions.spec.ts --project=chromium
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh
tools/scripts/dev-live.sh stop
tools/scripts/dev-live.sh up
tools/scripts/dev-live.sh status
```

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260316T122155Z/chrome-devtools-admin-tenants-desktop-latest.png`
- `tools/agents/artifacts/ui-harness/local-20260316T122155Z/chrome-devtools-admin-settings-mobile-latest.png`
- `playwright-mcp-admin-tenants-desktop-latest.png`
- `playwright-mcp-admin-tenants-mobile-latest.png`

### 2026-03-17: #558 rebuild trimmed to the still-relevant tenant-layout slice

Delivered:

- rebuilt the stale `feat/v2-ui-ux-foundation` stack on top of current `feat/v2-observability-runs` and dropped the old observability/backend/admin churn that is already present or superseded on the newer base
- kept the two UI changes that still earn their keep on today’s stack:
  - widened the deployment shell content frame so dense admin pages stop fighting an unnecessarily tight wrapper
  - tightened the tenant table column budget and shortened the action labels to keep the action cell inside the table bounds on desktop
- added a real browser regression for the actual bug by asserting the last tenant-table cell stays inside the data-table container instead of trusting weaker button-only checks

Not solved yet:

- mobile tenants still rely on horizontal table scroll; the row actions stay reachable, but this is acceptable fallback, not finished responsive design
- the rest of the old #558 branch was not kept because it would either delete already-working onboarding behavior or replay observability changes that the newer stack already absorbed

Evidence:

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- --run tests/admin-tenants-api.test.ts
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3112 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3112 pnpm -C apps/web exec playwright test e2e/admin-tenants.spec.ts --project=chromium
```

Browser proof:

- Playwright MCP on `http://localhost:3114/admin/tenants` with mocked admin tenant data:
  - desktop action-cell metrics: `tableRight=1227`, `actionCellRight=1226`
  - mobile fallback confirmed via horizontal table scroll to the action rail
- Chrome DevTools MCP on `http://localhost:3114/admin/tenants` with the same mocked tenant data:
  - desktop action-cell metrics: `tableRight=1387`, `actionCellRight=1386`
  - mobile fallback confirmed with scrollable table and reachable action rail

Artifacts:

- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/playwright-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/playwright-admin-tenants-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/playwright-admin-tenants-mobile-scrolled.png`
- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/chrome-devtools-admin-tenants-desktop.png`
- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/chrome-devtools-admin-tenants-mobile.png`
- `tools/agents/artifacts/ui-harness/local-20260317T105600Z/chrome-devtools-admin-tenants-mobile-scrolled.png`

### 2026-03-16: Slice 11 fixed-width admin tables + live onboarding/offboarding proof

Delivered:

- added the missing data-table regression checks on settings, solutions, and security so those pages now fail the browser suite when a dense table overflows its container or collapses its action column
- tightened tenant, user, settings, solutions, and security column budgets so the live admin tables stop overshooting their wrapper width and shoving the action rail off to the right
- kept tenant and user row actions in deterministic one-column rails, which makes `Suspend`, `Export`, `Offboard tenant`, `Deactivate`, and `Remove` readable instead of relying on browser wrap luck
- confirmed the live local onboarding flow now does two critical operator-safe things:
  - creates the tenant with the minimum first-step fields
  - immediately shows the tenant-specific local `dev:<user-id>` sign-in token with plain-language guidance about activation and `/login`
- confirmed the live `Offboard tenant` action opens a real confirmation dialog in the browser instead of feeling dead

Not solved yet:

- observability still needs a calmer final information rhythm; the case-first structure is right, but the admin workspace is still visually dense
- mobile fallback for dense tables is acceptable, not finished; the desktop action rails are now stable, but smaller widths still rely on horizontal scrolling more than they should

Evidence:

```bash
tools/scripts/dev-live.sh status
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types
```

Browser proof:

- live Playwright MCP verification on `http://localhost:3100/admin/tenants`
  - `Offboard tenant` opens the confirmation dialog
  - `Start onboarding` creates a tenant and shows the tenant-specific local dev login hint
- live Playwright MCP verification on:
  - `http://localhost:3100/admin/users`
  - `http://localhost:3100/admin/settings`
  - `http://localhost:3100/admin/solutions`
  - `http://localhost:3100/admin/security`
  confirmed the fixed-width tables stay inside their container with readable action columns
