# Execution Plan: NFQ UI Implementation (Must + Should, No Date Commitments)

## Summary
Build the UI in dependency order, not as disconnected mock screens.

Goal: ship a real Provider Backoffice + Client Portal aligned to `docs/requirements/nfq.md`, with every implemented screen traceable to requirement IDs and backed by tested API contracts.

This plan assumes implementation in `apps/web/` with shared primitives in `packages/ui/` and solution UI in `solutions/*/ui/`.

## Public Interfaces / API Contracts
1. Standardize one typed frontend API layer in `apps/web/src/lib/api/`:
   - `auth.ts`, `calls.ts`, `agents.ts`, `agent-definitions.ts`, `team.ts`, `reports.ts`, `billing.ts`, `tenants.ts`, `workflows.ts`, `campaigns.ts`, `connectors.ts`, `operator-events.ts`.
2. Route groups are fixed:
   - Provider: `/admin/*` (SuperAdmin).
   - Tenant: `/dashboard`, `/call-ops`, `/calls`, `/agents`, `/workflows`, `/analytics`, `/settings/*`, `/team`, `/billing`.
3. Solution UI contract:
   - `solutions/<solution>/ui/src/manifest.ts` exports nav + routes.
   - `apps/web/src/app/(solutions)/*` stays thin wrappers only.
4. Enforce role guards at route level:
   - `super_admin`, `client_admin`, `client_operator` hard fail to 403 page.
5. Requirement traceability artifact:
   - maintain `platform-ui-nfq-traceability (archived)` mapping each NFQ story (T*, AM*, CM*, WF*, P*, C*, O*) to page, API, tests.

## Execution Phases

## Phase 0: Reality Lock (no feature work)
1. Build a repo-truth endpoint catalog from `apps/api/src/platform_api/routes/*.py`.
2. Mark each NFQ UI feature as:
   - `Ready` (API exists),
   - `Partial` (API exists but missing payload needed by UI),
   - `Blocked` (API missing).
3. Freeze implementation order:
   - `Must` first, then `Should`.
4. Output:
   - traceability matrix + backlog labels (`ready/partial/blocked`).

## Phase 1: Platform Foundation (cross-cutting)
1. Replace per-page ad hoc `fetch` logic with shared typed API client + normalized error model.
2. Add auth/session hardening:
   - remove ad hoc test-flow assumptions from primary paths,
   - keep dev-only fallback explicitly gated.
3. Build reusable page primitives:
   - `PageHeader`, `KpiCard`, `EntityTable`, `FilterBar`, `StatusBadge`, `EmptyState`, `ErrorPanel`, `ConfirmDialog`.
4. Apply `react-best-practices.md` controls:
   - SWR for client data,
   - parallel fetch with `Promise.all`,
   - Suspense boundaries for async sections,
   - no heavy barrel imports.
5. Gate:
   - typecheck, lint, unit tests pass.

## Phase 2: Provider Backoffice (NFQ 10.1, P1-P8, AM1-AM4)
1. Implement `/admin` dashboard with platform KPIs and health summaries.
2. Implement tenant management:
   - list, detail, onboard, status/suspend/offboard, export lifecycle.
3. Implement provider agent governance:
   - definitions, versions, submit/review/publish/retire, artifact view.
4. Implement releases/deployment surfaces:
   - create release, assign release to tenant, rollout history.
5. Implement platform defaults + OIDC provider configuration pages.
6. Implement support/audit view:
   - admin-tenant scoped audit events, tenant targeting controls.
7. Gate:
   - API contract tests for all admin pages,
   - role-based e2e (`super_admin` only).

## Phase 3: Client Portal Core (C1-C10, CM1-C10, O*)
1. Implement tenant dashboard with active calls, recent outcomes, queue health.
2. Upgrade Call Ops to full feature:
   - active calls, live transcript, observer token, operator token, takeover, terminate-transfer.
3. Implement historical calls:
   - search/filter list, call detail tabs (summary/transcript/recordings/extraction/quality).
4. Implement team management:
   - list/invite/role-change/deactivate/remove.
5. Implement recording settings:
   - retention load/update with confirmation and audit visibility.
6. Implement analytics/reports:
   - calls, lead funnel, schedule-changes, notifications, followups, response-time.
7. Implement tenant billing usage:
   - usage now, trend, plan limits/alerts.
8. Gate:
   - operator/admin role e2e,
   - pagination/filter tests,
   - SSE transcript stability tests.

## Phase 4: Agent Customization + Workflow + Integrations (AM5-AM8, WF3-WF6)
1. Tenant agent customization:
   - instruction overrides, business variables, artifact preview, version history view.
2. Workflow executions UI:
   - list/filter/status detail from workflow execution endpoints.
3. Outbound campaigns UI:
   - create/list campaign runs, status/progress drilldown.
4. Connectors UI:
   - CRUD, health check, invocation test harness, secret-safe forms.
5. Operator events UI:
   - alerts queue with ack/resolve actions.
6. Gate:
   - contract tests on validation/error states,
   - forbidden-action tests for `client_operator`.

## Phase 5: Telephony + Usage Controls (T1-T5, P8, C10)
1. Implement telephony management surfaces if API-ready:
   - SIP/provider config, DID routing map, inbound/outbound defaults.
2. If API partial/missing:
   - ship read-only status pages with explicit "backend pending" state,
   - keep IA stable to avoid future routing churn.
3. Implement usage limits + alerts UI from billing/admin data.
4. Gate:
   - action-level permission tests,
   - configuration validation tests.

## Phase 6: NFQ Workflow Solution UIs (from NFQ workflow patterns)
1. Driver Verification UI package:
   - driver list/import/maintain,
   - verification job timeline and discrepancy queue,
   - call outcome audit trail.
2. Clinic Appointment UI package:
   - knowledge-base view, availability query surface, booking audit/review queue.
3. Route injection via solution manifests and `NEXT_PUBLIC_SOLUTIONS`.
4. Gate:
   - solution enabled/disabled e2e,
   - tenant isolation e2e.

## Phase 7: Hardening + Go-Live Readiness
1. Accessibility and UX hardening:
   - keyboard flows, focus states, semantic tables/forms, error messaging.
2. Performance hardening:
   - remove waterfalls, dynamic import heavy components, cache stable metadata.
3. Observability:
   - frontend error boundary telemetry, user action audit hooks for critical ops.
4. Security:
   - CSRF-safe mutations, secret redaction, no token leaks in UI/logs.
5. Release readiness checklist:
   - requirement coverage signed against traceability doc.

## Test Plan
1. Unit:
   - API adapters, mappers, guards, form validation, manifest gating.
2. Component:
   - table/filter states, dialogs, role-conditional actions.
3. Integration:
   - web-to-proxy-to-API contract for each domain module.
4. E2E:
   - SuperAdmin journey,
   - ClientAdmin journey,
   - ClientOperator journey,
   - solution-on/solution-off journey.
5. Regression suites:
   - auth redirects/session expiry,
   - transcript streaming resilience,
   - bulk table operations and pagination.

## Acceptance Criteria
1. Every Must + Should NFQ story has:
   - mapped page,
   - mapped API contract,
   - automated test reference.
2. No placeholder pages remain for NFQ-required surfaces.
3. Role boundaries are enforced and tested.
4. All blocked requirements are explicitly tagged with backend dependency and excluded from the done count.

## Assumptions and Defaults
1. Scope is Must + Should from `docs/requirements/nfq.md`.
2. Plan is dependency-ordered with effort bands, not date-anchored.
3. Existing backend routes are source of truth; UI does not invent payloads.
4. For missing APIs, UI ships stable IA plus explicit blocked states, not fake forms.
5. React/Next implementation follows `wiki/design-docs/react-best-practices.md` as a hard gate.
