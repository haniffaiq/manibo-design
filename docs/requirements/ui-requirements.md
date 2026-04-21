# UI Requirements (Coverage + API Mapping)

> **Status: legacy reference, not actively maintained.** This document is kept as a historical scope/coverage snapshot. Specific route names, file paths, and `live` claims here may not match the current codebase — surfaces have been added, renamed, or removed since this was last touched. Do **not** treat this document as the current source of truth and do **not** update it as part of unrelated PRs. For current state, consult the wiki and `docs/arch/generated/api_inventory.md`.

**Source documents:** `wiki/architecture/architecture.md` v3.0, `platform-v3-implementation-plan (archived)`, `docs/requirements/nfq.md`, `docs/requirements/vox.md`

**Purpose:** Frontend engineer planning checklist — every platform feature that *should* have a UI surface (current + planned).

**Important reality check (do not skip):**
- This file currently mixes **implemented UI surfaces** with **target-state wishlist**.
- Many endpoints listed here are **NOT implemented** in `apps/api/` today.
- This document is only useful if it does **not lie**: every endpoint below must be either **implemented** (repo-validated) or explicitly marked **TBD / planned**.
- Demo-week scope guard (2026-03-07): deployed login and real call observability come before any new clinic wishlist UI. If a UI slice does not improve browser access, platform health visibility, or a remaining NFQ checklist row, it is probably scope drift.
- Audit correction (2026-03-09): the repo now has real tenant and deployment console pages, but the UI is still uneven. The deployment console ships dashboard, tenants, solutions, phone numbers, assistants, releases, users, health, security, and settings pages; the tenant console ships dashboard, call ops/history/alerts, bookings, clinic knowledge base, team, activity, integrations, automations, settings, and generated solution routes. What is still missing is fail-closed route-role hardening for `/admin`, a dedicated tenant `/solutions` page, and many docs-listed APIs still have no web consumer.
- NFQ clinic tenant reality (2026-03-09): `/bookings` is already more than a placeholder. It now exposes booking outcomes, a staff follow-up queue, selected-call detail, integration readiness, and appointment-booking config editing. The remaining gap is not “build a bookings page” but “finish clinic operator workflow around live handoff, call-to-bookings context transfer, and deployment-proof verification”.
- Agent lifecycle audit (2026-03-09): `/admin/agent-definitions` is real, but it is a governed YAML/versioning console, not a Telnyx-style assistant workspace. It supports tenant selection, draft version creation, review/publish, retire, and compiled artifact inspection. Missing today: prompt-focused editing forms, side-by-side version diff, saved tests/evals, browser preview, and traffic distribution between agent versions.
- Observability audit (2026-03-09): tenant `/call-ops` and `/call-ops/history` already render live event markers, transcript streaming, latency summaries, route selections, LangGraph node timings, trace/correlation references, and recording playback. Deployment `/admin/health` renders cross-tenant call observability rollups. Missing today: a unified session timeline that combines transcript, runtime events, trace, logs, and audio in one surface; deployment-wide session drill-down; and LiveKit-style support-share workflows.

**Columns:** Feature — what the UI must do; User Story — full story sentence (if one exists in requirements); API Endpoints — endpoints the UI would consume (**implemented or proposed**; verify before building).

---

## Implemented API surfaces (repo-validated, as of 2026-03-07)

This is the minimum “don’t waste a frontend engineer’s week” set:

- Auth/session: `GET /auth/session`, `GET /auth/me`
- Health: `GET /health`
- Calls (tenant): `GET /calls`, `GET /calls/{call_id}`
- Call ops (tenant): `GET /calls/active`, `GET /calls/active/{call_id}`, `GET /calls/active/{call_id}/events`, `GET /calls/{call_id}/ops/stream`, `GET /calls/{call_id}/events`, `GET /calls/{call_id}/latency`, `GET /calls/{call_id}/trace`, `GET /calls/observability-summary`, `POST /calls/{call_id}/livekit-token`, `POST /calls/{call_id}/livekit-operator-token`, `GET /calls/{call_id}/transcript/stream`, `GET /calls/{call_id}/recordings`, `POST /calls/{call_id}/takeover`
- Call ops (deployment): `GET /admin/calls/observability-summary`
- Recordings: `GET /recordings/{recording_id}/signed-url`
- Team users: `GET /team/users`, `POST /team/users/invite`, `PATCH /team/users/{user_id}/role`, `POST /team/users/{user_id}/deactivate`, `DELETE /team/users/{user_id}`
- Workflows: `GET /workflows/executions`, `GET /workflows/executions/{workflow_id}/{run_id}`, `GET /workflows/executions/{workflow_id}/{run_id}/steps`, `POST /workflows/executions/{workflow_id}/{run_id}/retry`
- Operator events: `GET /operator-events`, `POST /operator-events/{event_id}/ack`, `POST /operator-events/{event_id}/resolve`
- Audit events: `GET /audit/events`, `GET /admin/tenants/{tenant_id}/audit-events`
- Driver registry (solution: `driver_verification`, when installed): `GET /drivers`, `POST /drivers/import`, `GET /drivers/{driver_id}`, `PATCH /drivers/{driver_id}`
- Clinic appointment booking (solution: `appointment_booking`, when installed): `GET /clinic/knowledge-base`, `GET /clinic/availability`, `POST /clinic/patient-identification/readback`, `POST /clinic/appointments`, `GET /clinic/booking-results`, `GET /clinic/booking-results/{call_id}`, `GET /clinic/integration-status`, `GET /clinic/booking-results/{call_id}/automation-status`, `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/complete`, `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/fail`, `GET /clinic/follow-ups`, `GET /clinic/follow-ups/{call_id}`, `POST /clinic/follow-ups/{call_id}/claim`, `POST /clinic/follow-ups/{call_id}/assign`, `POST /clinic/follow-ups/{call_id}/resolve`
- Tenant settings: `GET /tenant/settings/recordings`, `PATCH /tenant/settings/recordings`
- Connectors: `POST /connectors`, `GET /connectors`, `GET /connectors/{connector_id}`, `PATCH /connectors/{connector_id}`, `POST /connectors/{connector_id}/health-check`
- Billing: `GET /billing/usage`, `GET /admin/billing/usage`, `GET /admin/pricing-tiers`, `POST /admin/pricing-tiers`, `PUT /admin/tenants/{tenant_id}/plan`, `POST /admin/tenants/{tenant_id}/invoice`, `GET /admin/tenants/{tenant_id}/invoices`, `GET /admin/tenants/{tenant_id}/invoices/{invoice_id}`
- Reports (tenant): `GET /reports/lead-funnel`, `GET /reports/calls`, `GET /reports/schedule-changes`, `GET /reports/notifications`, `GET /reports/followups`, `GET /reports/response-time`
- Reports (deployment): `GET /admin/reports/lead-funnel`, `GET /admin/reports/calls`, `GET /admin/reports/schedule-changes`, `GET /admin/reports/notifications`, `GET /admin/reports/followups`, `GET /admin/reports/response-time`
- Tenant lifecycle (deployment): `GET /admin/tenants`, `POST /admin/tenants/onboard`, `PATCH /admin/tenants/{tenant_id}/status`, `GET /admin/tenants/{tenant_id}/export`, `POST /admin/tenants/{tenant_id}/offboard`
- OIDC providers (deployment): `GET /admin/oidc-providers`, `POST /admin/oidc-providers`, `PATCH /admin/oidc-providers/{provider_id}`, `DELETE /admin/oidc-providers/{provider_id}`
- Platform defaults (deployment): `GET /admin/platform-defaults`, `POST /admin/platform-defaults`
- Approvals (admin-tenant): `GET /admin/tenants/{tenant_id}/approvals/inbound/{call_id}`, `POST /admin/tenants/{tenant_id}/approvals/inbound/{call_id}/approve`, `POST /admin/tenants/{tenant_id}/approvals/inbound/{call_id}/reject`, `GET /admin/tenants/{tenant_id}/approvals/outbound/{campaign_id}/{contact_id}`, `POST /admin/tenants/{tenant_id}/approvals/outbound/{campaign_id}/{contact_id}/approve`, `POST /admin/tenants/{tenant_id}/approvals/outbound/{campaign_id}/{contact_id}/reject`
- Releases (deployment + admin-tenant): `POST /admin/releases`, `POST /admin/tenants/{tenant_id}/release`
- Governed agents (tenant): `POST /agent-definitions`, `PUT /agent-definitions/{agent_definition_id}/overrides`, `GET /agent-definitions/by-name/{name}/artifact`, `GET /agent-definitions/{agent_definition_id}/versions/{version}/artifact`
- Governed agents (admin-tenant): `POST /admin/tenants/{tenant_id}/agent-definitions`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/submit`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/review`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/publish`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/retire`, `GET /admin/tenants/{tenant_id}/agent-definitions/by-name/{name}/artifact`
- Webhooks: `POST /webhooks/livekit/room-started`, `POST /webhooks/{source}` (multi-tenant envelope), plus solution webhook `POST /webhooks/telematics/{provider}` when the solution is installed.
- Solution config (tenant + admin-tenant): `GET /solutions/{solution_name}/config`, `PUT /solutions/{solution_name}/config`, `GET /solutions/{solution_name}/config/schema`, `GET /admin/tenants/{tenant_id}/solutions/{solution_name}/config`, `PUT /admin/tenants/{tenant_id}/solutions/{solution_name}/config`, `GET /admin/tenants/{tenant_id}/solutions/{solution_name}/config/schema`

Everything else in this file should be treated as “planned unless proven”.

---

## VOX SOW delivery modules (planning view)

This view is for **module-by-module delivery planning** against `docs/requirements/vox.md` §9 (Phase 1) and §10 (Phase 2).

### Phase 1 (Month 1)

| Deliverable | UI surfaces in this file | API readiness (as of 2026-02-25) |
|---|---|---|
| **9.1 Platform foundation** (prod env, monitoring, tenant isolation, auth/access control) | Sections **1**, **2**, **3**, **28** | **Partial:** auth introspection, tenant lifecycle summary, OIDC provider CRUD, platform defaults, tenant team management, and deployment health/call observability surfaces are implemented in repo. The live deployment still needs browser-login recovery and real-call proof before this module is honestly demo-ready. |
| **9.2 VOX knowledge base (v1)** (KB content + guardrails + escalation rules, VOX final approval) | Sections **6**, **15**, **19** | **Blocked:** no KB/guardrails APIs in `apps/api/` today (only tenant overrides exist for instructions/variables) |
| **9.3 Website Sales Agent (WSA)** (chat widget + multilingual + course lookup + lead delivery) | Sections **24**, **27**, **14** | **Blocked:** public chat widget APIs + lead APIs are **TBD**; connectors CRUD exists (`/connectors`) but does not cover VOX-specific lead/schedule flows yet |
| **9.4 Out-of-office conversational engagement** (real conversation outside hours) | Sections **24**, **27**, **16** | **Blocked:** depends on the same missing public chat + lead delivery surfaces as 9.3 (plus analytics validation for SLA) |
| **9.5 Analytics baseline** (response time, leads captured, conversations initiated, leads delivered, escalations) | Sections **16** | **Partial:** tenant reports exist (`GET /reports/*`) but “conversations initiated / leads delivered / escalations” breakdown is still **TBD** |

### Phase 2 (Months 2–3)

| Deliverable | UI surfaces in this file | API readiness (as of 2026-02-25) |
|---|---|---|
| **10.1 Voice Sales Agent (VSA) — Pilot** (outbound calls + checklist + summary + CRM push + escalation) | Sections **4**, **5**, **8**, **9**, **10**, **16** | **Partial/Blocked:** active calls, snapshot-backed per-call live state + recent latency snapshot, active-call event timeline markers, live SSE ops stream, completed-call event history, completed-call latency detail with STT/LLM/TTS stack identity, transcript streaming, takeover, recordings, historical call review, operator events, per-call trace-summary drill-down, tenant cross-call observability summary (`GET /calls/observability-summary`), and deployment-wide call observability rollups (`GET /admin/calls/observability-summary`) are implemented. Remaining gaps are telephony carrier admin, outbound campaign APIs, and explicit post-call extraction APIs. |
| **10.2 Follow-Up & Lead Nurture Agent (FNA)** (email sequences, cadence, prioritization) | Sections **27**, **25**, **12**, **16** | **Blocked:** solution APIs are **TBD** |
| **10.3 Schedule Management Agent (SMA)** (NL changes + validation + execution + notifications) | Sections **11**, **25**, **12**, **16** | **Blocked:** schedule + notifications/workflow APIs are **TBD** |
| **10.4 Operations Monitor Agent (OMA)** (overdue tasks + escalation ladder + missed notification alerts) | Sections **26**, **25**, **12**, **16** | **Blocked:** solution APIs are **TBD** |

### SOW terms (always-on)

| SOW section | UI surfaces in this file | API readiness (as of 2026-02-25) |
|---|---|---|
| **14 Data protection & compliance** (encryption, access control, audit logging, retention, data subject rights) | Sections **18**, **22**, **23** | **Mostly blocked:** retention has an API (`GET/PATCH /tenant/settings/recordings`), but audit/GDPR request APIs are **TBD** |
| **15 Termination / offboarding** (export + delete within 30 days) | Sections **2**, **23** | **Partial:** export preview (`GET /admin/tenants/{tenant_id}/export`) and offboard start (`POST /admin/tenants/{tenant_id}/offboard`) exist, but archive jobs, download flow, and deletion-completion evidence are still **TBD** |

---

## NFQ logistics demo (Hoptrans tenant) delivery modules (2-week MVP planning view)

This view is for an **NFQ logistics-first** delivery plan (Hoptrans tenant as the demo) where the core flow is:
**telematics event → outbound driver call → structured outcome → discrepancy queue**.

| Deliverable (NFQ logistics MVP) | UI surfaces in this file | API readiness (as of 2026-02-25) |
|---|---|---|
| **Telematics webhook ingestion** (Samsara/other provider → tenant workflow) | *(no UI; inbound)* | **Partial:** `POST /webhooks/telematics/{provider}` exists, but processing is currently a **stub** (`sol.telematics_ingestion.process_telematics_event`) |
| **Outbound call orchestration** (dial driver; retries; outcomes) | Sections **4**, **5**, **9**, **16** | **Partial/Blocked:** outbound orchestration workflows exist (`sol.outbound_campaigns.*`), but there is no tenant/admin API to start calls/campaigns yet |
| **Ops console for NFQ logistics demo** (driver registry + call log search) | Sections **4**, **5**, **16** | **Partial:** tenant driver-checks UI now exists at `/driver-verification/drivers` with registry maintenance, latest telematics review, and recent verification queue. Dedicated call-log linking back into the generic call history route is still basic. |
| **Driver registry + import** (CSV or connector sync) | Section **14** | **Partial:** driver registry APIs exist when `driver_verification` is installed (`GET /drivers`, `POST /drivers/import`, `GET /drivers/{driver_id}`, `PATCH /drivers/{driver_id}`), and tenant UI now exposes CSV import plus in-place driver maintenance at `/driver-verification/drivers`. Connector-driven sync is still **TBD**. |
| **Billing visibility (NFQ readiness)** | Section **17** | **Partial:** billing APIs exist (`GET /billing/usage`, pricing tiers, tenant plans), and the tenant dashboard already surfaces usage/spend summary. Dedicated admin billing/pricing/invoice UI is still **TBD**. |
| **NFQ healthcare clinic appointment booking** (inbound call -> scheduling -> patient capture -> booking confirmation) | Sections **4**, **5**, **8**, **13**, **14**, **16**, **31** | **Partial:** clinic solution APIs now cover knowledge base, availability, booking creation, booking-result review, follow-up queue claim/assign/resolve, post-call automation status, system-driven patient-record sync via the current CRM connector surface, system-driven confirmation SMS dispatch, system-driven reminder scheduling via the notifications adapter surface, and tenant/admin solution-config APIs for reminder and adapter settings. The tenant clinic workspace at `/bookings` now exposes booking outcomes, a staff follow-up queue, selected-call detail, integration readiness, and appointment-booking config editing. Remaining UI gaps are richer live handoff workflow, stronger call-ops -> bookings continuity, self-service clinic telephony, and deployment-proof verification. Do not let this module outrank deployed login recovery or real-call observability proof. |

---

## 1. Authentication & Session

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Login via OIDC (redirect to IdP) | — | OIDC authorization endpoint (IdP, not platform API) |
| Bootstrap a signed web session from a validated OIDC token | — | `GET /auth/session` |
| Token refresh (silent) | — | IdP token refresh endpoint |
| Logout (clear session + revoke refresh token) | — | IdP logout endpoint |
| Redirect unauthenticated users to login | — | All protected endpoints return `401` |

Notes:
- The platform auth model is OIDC-first and provider-agnostic. Google and Microsoft are examples, not the architecture.
- Tenant users are provisioned users, not public self-signups. Real login requires a `public.memberships` row for the tenant; `public.users.subject` may be pre-provisioned, or `/auth/session` can bind it on the first verified login when the exact normalized email maps to one provisioned user row. If verified email proof is missing or normalized email is ambiguous, operators must provision `subject` explicitly.
- Deployment `super_admin` users are deployment-scoped and should land in `/admin`; tenant users should land in tenant routes like `/call-ops` and `/bookings`.
- `/signup` and `/verify-email/resend` should not behave like live consumer auth entry points for this product. In the current branch they redirect back to `/login`.
- Repo auth proof now includes strict browser routing/session coverage in `apps/web/e2e/auth-flow.spec.ts` and `apps/web/e2e/routes.spec.ts`, with the shared harness stubbing deployment-dashboard background fetches so auth tests do not depend on unrelated backend availability.
- The deployment/provider bootstrap recipe for Google OIDC, `public.oidc_providers`, `public.users.subject`, and deployment `super_admin` provisioning is documented in `wiki/ops/first-time-platform-setup-provider-onboarding.md`. The broader tenant/user onboarding flow is still covered in `wiki/ops/runbooks/deployment_provisioning.md` and `wiki/ops/runbooks/tenant_onboarding.md`.
- Local k3d auth proof must use the real web ingress host `http://app.grove.localtest.me`; pointing `NEXT_PUBLIC_APP_URL` at `web.grove.localtest.me` is wrong because that host is not served by `infrastructure/kubernetes/base/platform/core/ingress-platform.yaml`.
- Trusted proxy recovery now also needs `x-forwarded-port` support for non-default external ports, and local image builds must derive `NEXT_PUBLIC_APP_URL` from the served ingress host plus `K3D_INGRESS_HTTP_PORT` when CI randomizes the ingress port. `GROVE_PUBLIC_APP_URL` is the runtime server override; `NEXT_PUBLIC_APP_URL` is the build-time fallback baked into the image and should not be clobbered later by runtime ConfigMaps, or middleware can still generate trash redirect origins outside the production publish workflow.
- The checklist k3d proof harness must also tolerate transient ingress-nginx chart fetch failures from GitHub release URLs; otherwise auth-proof CI goes red on upstream `502` noise before the web stack even boots.
- Live deployment note (2026-03-08): Google OIDC env vars, provider registration, demo-user `public.users.subject` provisioning, Hetzner Flux runtime config for `GROVE_PUBLIC_APP_URL=https://platform.jakitlabs.com`, and the production web-image build arg `NEXT_PUBLIC_APP_URL=https://platform.jakitlabs.com` are all in place on this branch for `platform.jakitlabs.com`. The remaining deployed-browser blocker is image drift: the current in-cluster `platform-api` still exposes `/auth/me` only, not `/auth/session`, and production `platform-web` has not yet been rebuilt from this branch’s public-origin patchset, so browser login cannot succeed until the fresh auth-bootstrap images are published and rolled out.
- Demo priority: make one real Google path work first, hide or clearly disable any unconfigured provider buttons, and remove consumer-style auth copy that implies self-service signup.

---

## 2. Tenant Management (SuperAdmin) — VOX 9.1

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Onboard a tenant (create tenant + admin membership + start provisioning) | — | `POST /admin/tenants/onboard` |
| List all tenants with status (active / suspended / offboarded) | — | `GET /admin/tenants` |
| View tenant details (config, solution enablement, status) | — | **Partial:** `GET /admin/tenants` returns summary only; dedicated detail endpoint is **TBD** |
| Suspend a tenant (block all tenant-scoped API access) | — | `PATCH /admin/tenants/{tenant_id}/status` |
| Offboard / delete a tenant (triggers data destruction workflow) | — | `POST /admin/tenants/{tenant_id}/offboard` |
| Trigger tenant provisioning workflow (schema + migrations) | — | Covered by `POST /admin/tenants/onboard`; standalone provision endpoint is **TBD** |
| Cross-tenant deployment-wide analytics summary (usage, call counts) | — | **Partial** (`GET /admin/reports/*` exists for KPI families, and `GET /admin/calls/observability-summary` now provides deployment-wide call latency and route rollups; unified billing+ops summary endpoint is still **TBD**) |
| Configure tenant limits / quotas (e.g., concurrency, minutes, storage) | As a provider, I want to set limits, quotas & pricing so I can manage tenant usage and cost exposure. | **TBD (no quota/limits endpoints in `apps/api/`)** |
| Submit tenant data export request (export all tenant data in standard format) | On termination, export all VOX data in a standard format and delete it from Provider systems within 30 days. | **Partial:** `GET /admin/tenants/{tenant_id}/export` returns an inline export payload/preview; archive job workflow is **TBD** |
| View data export job progress (status, completion %, retention countdown) | — | **TBD (no endpoint in `apps/api/`)** |
| Download exported data archive | — | **TBD (no endpoint in `apps/api/`)** |

---

## 3. User & Membership Management — VOX 9.1

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| List users within a tenant (name, email, role) | — | `GET /team/users` |
| Invite / create a user and assign role (client_admin or client_operator) | — | `POST /team/users/invite` |
| Update user role | — | `PATCH /team/users/{user_id}/role` |
| Deactivate a user without deleting the record | — | `POST /team/users/{user_id}/deactivate` |
| Remove a user from a tenant | — | `DELETE /team/users/{user_id}` |
| View own profile (current user) | — | `GET /auth/me` |

---

## 4. Live Call Monitoring — Active Dashboard (ClientOperator + ClientAdmin) — VOX 10.1 (enabler)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View all active calls in real-time (caller, agent, duration, status) | As a Client Operator, I want to see all active calls in real-time so that I can monitor operations. | `GET /calls/active` |
| View live state and recent latency metrics for one active call | As a Client Operator, I want one active-call detail API so the UI can show current call phase and recent STT/LLM/TTS timing without scraping multiple sources. | `GET /calls/active/{call_id}` |
| View recent operational markers for one active call (phase changes, first-token timing, TTS start, agent/caller speech state) | As a Client Operator, I want a live event timeline so the UI can explain what the call is doing right now without reverse-engineering raw traces. | `GET /calls/active/{call_id}/events` |
| Subscribe to live operational markers for one active call (SSE with reconnect cursor) | As a Client Operator, I want the call page to update without refreshes while the call is running. | `GET /calls/{call_id}/ops/stream` |
| View live transcript of an ongoing call | As a Client Operator, I want to view live transcripts of ongoing calls so that I understand current conversations. | `GET /calls/{call_id}/transcript/stream` |
| Join a call as silent observer (via LiveKit room) | As a Client Operator, I want to join a call room as observer so that I can listen without interruption. | `POST /calls/{call_id}/livekit-token` |
| Take over a call from the agent | As a Client Operator, I want to take over a call from the agent so that I can handle escalations. | `POST /calls/{call_id}/takeover` |
| Obtain operator LiveKit token to speak on call (after takeover) | — | `POST /calls/{call_id}/livekit-operator-token` |
| View real-time escalation alerts / agent escalation events | As an operator, I want to see alerts for problematic calls so I act quickly. | `GET /operator-events` |
| Acknowledge or resolve an alert | — | `POST /operator-events/{event_id}/ack`, `POST /operator-events/{event_id}/resolve` |
| View live operational timeline for one active call (route changes, phases, latency markers, provider TTFT) | — | `GET /calls/active/{call_id}`, `GET /calls/active/{call_id}/events`, `GET /calls/{call_id}/ops/stream`, `GET /calls/{call_id}/trace`, `GET /calls/observability-summary`, `GET /admin/calls/observability-summary` |
| View active-call route path and LangGraph node timing | As a Client Operator, I want to see which graph nodes ran and how long they took so I can explain slow or wrong live calls without reading raw traces. | `GET /calls/{call_id}/trace` |
| View cross-call latency hot spots and provider/model comparisons | As a Client Admin, I want to see which routes and stack components are consistently slow so I can decide whether the problem is prompts, routing, or providers. | `GET /calls/observability-summary`, `GET /admin/calls/observability-summary` |
| View a unified live session-insights timeline (transcript + events + trace + logs + audio) | — | **Partial:** current UI composes transcript, runtime events, route/node trace, and LiveKit listen-in from `GET /calls/active/{call_id}`, `GET /calls/active/{call_id}/events`, `GET /calls/{call_id}/ops/stream`, `GET /calls/{call_id}/trace`, `GET /calls/{call_id}/transcript/stream`, and `POST /calls/{call_id}/livekit-token`, but there is no single timeline surface and no logs endpoint in `apps/api/`. |

---

## 5. Historical Call Management (ClientAdmin + ClientOperator) — VOX 10.1 (enabler)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Search and filter historical calls (date range, phone number, agent, status, escalation flag, full-text transcript) | As a Client Admin, I want to search historical calls so that I can find specific conversations. | `GET /calls` |
| View call detail (metadata, duration, outcome, quality score, transcript) | — | `GET /calls/{call_id}` |
| View completed-call latency breakdown (STT finalize, LLM TTFT, TTS TTFB, agent response timing) | As a Client Operator, I want a clean latency API for completed calls so the UI can explain slow calls without scraping raw metadata. | `GET /calls/{call_id}/latency` (includes stack identity for LLM/STT/TTS when runtime events are available) |
| View persisted operational timeline for a completed call | As a Client Operator, I want a post-call event timeline so the UI can explain what happened after the call ends without depending on live workflow memory. | `GET /calls/{call_id}/events` |
| List recordings for a call | As a Client Admin, I want to replay call recordings so that I can review agent performance. | `GET /calls/{call_id}/recordings` |
| Play/download a recording (time-limited signed URL) | As a Client Admin, I want to replay call recordings so that I can review agent performance. | `GET /recordings/{recording_id}/signed-url` |
| View full transcript of a completed call | — | `GET /calls/{call_id}` |
| View completed-call route path and LangGraph node timing | As a Client Operator, I want to see which graph nodes ran and how long they took after the call ends so I can debug bad outcomes and latency. | `GET /calls/{call_id}/trace` |
| View extracted / structured data from a call (post-call analysis output) | As a Client Admin, I want to configure post-call analysis so that I get structured data extraction. | **Partial:** `GET /calls/{call_id}` returns `call.metadata` today; dedicated extraction contract is **TBD** |
| View automatically generated quality score for a call | As a System, I want to generate quality scores automatically so that calls are rated for review. | `GET /calls`, `GET /calls/{call_id}` |

---

## 6. Agent Management (ClientAdmin — Customization Surface) — VOX 9.2–9.3 (enabler)

**Note:** Legacy `/agents` routes are removed in this branch. Agent-management UI planning should target governed-agent contracts only.

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create a governed agent definition shell | — | `POST /agent-definitions` |
| Edit tenant-editable agent instructions (governed agents) | As a Client Admin, I want to edit agent instructions so that I can customize business context. | `PUT /agent-definitions/{agent_definition_id}/overrides` (instructions field) |
| Set business-specific variables (governed agents) | As a Client Admin, I want to set business-specific variables so that agent knows operating hours, contacts. | `PUT /agent-definitions/{agent_definition_id}/overrides` (variables field) |
| View compiled/effective governed agent config | — | `GET /agent-definitions/by-name/{name}/artifact` or `GET /agent-definitions/{agent_definition_id}/versions/{version}/artifact` |
| List tenant governed agent definitions and their current status | — | **TBD (no tenant list/detail endpoints in `apps/api/`)** |
| Update knowledge base content (upload documents / FAQs for retrieval) | As a Client Admin, I want to update knowledge base content so that agent has current business information. | **TBD (no endpoint in `apps/api/`)** |

---

## 7. Agent Lifecycle Governance (Super Admin / Deployment Super Admin) — VOX 9.1–9.2 (deployment-owned)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create a governed agent definition for a tenant | As a Deployment Super Admin, I want to create agents in code so that I have full control over agent behavior. | `POST /admin/tenants/{tenant_id}/agent-definitions` |
| List governed agent definitions for one tenant | — | `GET /admin/tenants/{tenant_id}/agent-definitions` |
| Create a new version (source YAML) | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions` |
| View version history and review trail for one governed agent | — | `GET /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions` |
| Submit an agent version for review | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/submit` |
| Approve/reject an agent version (review decision) | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/review` |
| Publish a reviewed agent version | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/publish` |
| Retire an agent definition | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/retire` |
| Fetch published artifact (admin view) | — | `GET /admin/tenants/{tenant_id}/agent-definitions/by-name/{name}/artifact` |
| View and list all agent definitions across tenants | — | **TBD (no endpoint in `apps/api/`)** |
| View diff between agent versions (prompt/tools/flow changes) | — | **TBD (no endpoint in `apps/api/`)** |
| Test agent with mock conversation input (simulation sandbox) | — | **TBD (no endpoint in `apps/api/`)** |
| Shift live traffic between agent versions / canary rollout | — | **TBD (no traffic-splitting endpoint in `apps/api/`)** |
| Seed/update deployment-level platform defaults | — | `GET /admin/platform-defaults`, `POST /admin/platform-defaults` |

---

## 8. Telephony & Phone Number Management (ClientAdmin) — VOX 10.1

Current repo reality: telephony routing management is now available only in deployment backoffice via `/admin/channels` and `/admin/telephony` using admin-tenant phone-channel APIs. The ClientAdmin self-service telephony surface described below is still mostly unimplemented.

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Connect an existing SIP trunk (provide SIP credentials / trunk ID) | As a Client Admin, I want to connect my existing SIP trunk so that I can use my current phone numbers. | **TBD (no telephony endpoints in `apps/api/`)** |
| View configured SIP trunks | — | **TBD (no telephony endpoints in `apps/api/`)** |
| Use platform-default telephony (no SIP trunk required) | As a Client Admin, I want to use NFQ's default telephony so that I can start quickly without infrastructure. | **TBD (no tenant setting / telephony config endpoint in `apps/api/`)** |
| Acquire phone numbers through the platform | As a Client Admin, I want to acquire phone numbers through the platform so that I can get new numbers for campaigns. | **TBD (no telephony endpoints in `apps/api/`)** |
| View registered phone numbers (DID → agent routing) | — | **Partial (deployment backoffice only):** `GET /admin/tenants/{tenant_id}/phone-channels` with deployment backoffice UI at `/admin/channels` and `/admin/telephony`. ClientAdmin endpoint/UI still **TBD**. |
| Configure inbound routing (DID → agent config mapping) | As a System, I want to route inbound calls to appropriate agents so that callers reach the right automation. | **Partial (deployment backoffice only):** `GET /admin/tenants/{tenant_id}/phone-channels`, `POST /admin/tenants/{tenant_id}/phone-channels`, `PATCH /admin/tenants/{tenant_id}/phone-channels/{phone_channel_id}`, `DELETE /admin/tenants/{tenant_id}/phone-channels/{phone_channel_id}` with deployment backoffice UI at `/admin/channels` and `/admin/telephony`. ClientAdmin endpoint/UI still **TBD**. |

---

## 9. Outbound Campaign Management (ClientAdmin — `outbound_campaigns` solution) — VOX 10.1

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create an outbound call campaign (target list, agent config, schedule, retry policy) | As a System, I want to support outbound campaigns so that agents can initiate calls. | **TBD (solution has no API router mounted in `apps/api/`)** |
| List campaigns with status (pending / running / paused / completed) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View campaign progress (targets called, pending, failed, success rate) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Pause / resume a campaign | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Cancel a campaign | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View per-target call results (outcome, extracted data, retry count) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Upload target contact list (CSV / JSON) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure voice sales discovery checklist (items agent must cover) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure call script / conversation flow for campaign | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View per-call discovery checklist completion (% of items covered) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure campaign retry policy (max attempts, backoff, failure threshold for auto-pause) | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 10. Post-Call Analysis Configuration (ClientAdmin — `call_monitoring` solution) — VOX 10.1

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Configure post-call analysis (which fields to extract, extraction model) | As a Client Admin, I want to configure post-call analysis so that I get structured data extraction. | **TBD (solution has no API router mounted in `apps/api/`)** |
| Create / update extraction templates (field names, types, descriptions) | As a Client Admin, I want to set up extraction templates so that agent extracts relevant business data. | **TBD (solution has no API router mounted in `apps/api/`)** |
| View configured extraction templates | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 11. Schedule Change Approvals (ClientAdmin — `schedule_management` solution) — VOX 10.3

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View pending schedule change proposals (plan, diff, conflict summary) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Approve a schedule change proposal | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Reject a schedule change proposal with reason | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View history of applied schedule changes | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Submit natural-language schedule change request | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View schedule change validation result (affected sessions, conflicts, suggested alternatives) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Preview affected parties before confirming a schedule change | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Confirm validated schedule change for execution | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View notification delivery status after schedule change execution | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 12. Workflow Management (ClientAdmin) — VOX 10.2–10.4 (enabler)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Configure workflow triggers (event type, conditions, target workflow) | As a Client Admin, I want to configure workflow triggers so that automations run at the right time. | `PUT /agent-definitions/{agent_definition_id}/overrides` (workflow trigger fields) |
| Map extracted data fields to integration destinations (CRM, notifications) | As a Client Admin, I want to map extracted data to integrations so that data flows to my business systems. | `PUT /agent-definitions/{agent_definition_id}/overrides` (workflow data mapping fields) |
| Monitor active and recent workflow executions (status, start/end time, error) | As a Client Admin, I want to monitor workflow executions so that I can track automation status. | `GET /workflows/executions` (tenant UI route: `/automations`) |
| View workflow execution detail and step results | — | `GET /workflows/executions/{workflow_id}/{run_id}`, `GET /workflows/executions/{workflow_id}/{run_id}/steps` |
| Retry a failed or timed-out workflow run | As a Client Admin, I want one safe “try again” action so staff can recover from transient failures without debugging Temporal. | `POST /workflows/executions/{workflow_id}/{run_id}/retry` |
| Configure error / failure notifications for workflows | As a Client Admin, I want to set up error notifications so that I know when workflows fail. | **Partial:** workflow failures can already surface through `GET /operator-events`; configurable notification routing is **TBD** |
| View workflow template catalog (available workflow patterns) | As a Deployment Super Admin, I want to define workflow templates so that common patterns are reusable. | **TBD (no workflow endpoints in `apps/api/`)** |

---

## 13. Solution Enablement & Configuration (ClientAdmin + SuperAdmin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View available solutions for this tenant (installed, enabled status) | — | `GET /solutions`; current repo reality: tenant solution state is consumed for nav/dashboard gating, but there is no dedicated tenant `/solutions` page yet. |
| Enable a solution for the tenant | — | **Admin-tenant scoped:** `PUT /admin/tenants/{tenant_id}/solutions/{solution_name}` with `{ "enabled": true }` |
| Disable a solution for the tenant | — | **Admin-tenant scoped:** `PUT /admin/tenants/{tenant_id}/solutions/{solution_name}` with `{ "enabled": false }` |
| Tenant UI only shows enabled solutions for that tenant (feature-flag style nav/routes/cards) | As a client user, I only want to see capabilities relevant to my business so the portal stays understandable. | **Current repo reality:** backend route gating is tenant-aware via `public.tenant_solutions`, and the web now intersects runtime tenant solution state with the build-time `NEXT_PUBLIC_SOLUTIONS` manifest so nav and dashboard links only appear for workspaces shipped in the current deployment. |
| Hide irrelevant solutions completely (clinic tenants do not see logistics screens; logistics tenants do not see clinic appointment screens) | As a tenant user, I do not want unrelated workflows in my UI because they create confusion and training overhead. | **Current repo reality:** tenant-specific frontend visibility is now enforced by intersecting runtime tenant enablement with build-time route generation. Deployment backoffice also distinguishes “enabled for tenant” from “shipped in this deployment” on `/admin/solutions`. |
| Configure solution-specific settings (per-solution config schema) | As a tenant admin or super admin, I want the UI to render only the settings that a solution actually uses so staff are not forced to learn internal config trivia. | **Partial:** `GET /solutions/{solution_name}/config`, `PUT /solutions/{solution_name}/config`, `GET /solutions/{solution_name}/config/schema`, `GET /admin/tenants/{tenant_id}/solutions/{solution_name}/config`, `PUT /admin/tenants/{tenant_id}/solutions/{solution_name}/config`, `GET /admin/tenants/{tenant_id}/solutions/{solution_name}/config/schema`. The only real tenant UI using this today is the appointment-booking clinic setup on `/bookings`; there is no generic per-solution settings workspace yet. |
| View solution migration status (pending / applied / failed) | — | **TBD (no solution management endpoints in `apps/api/`)** |
| List installed solutions across all tenants (SuperAdmin) | — | **TBD (no solution management endpoints in `apps/api/`)** |
| Register / install a new solution package (SuperAdmin) | — | **TBD (no solution management endpoints in `apps/api/`)** |
| View solution dependencies (required solutions or connectors) | — | **TBD (no solution management endpoints in `apps/api/`)** |
| View required configuration schema before enabling | — | **TBD (no solution management endpoints in `apps/api/`)** |
| View solution migration logs (detailed output) | — | **TBD (no solution management endpoints in `apps/api/`)** |
| Retry failed solution migration | — | **TBD (no solution management endpoints in `apps/api/`)** |

---

## 14. Integration Connector Management (ClientAdmin) — VOX 9.3 + 10.2–10.4 (enabler)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| List configured integrations / connectors (CRM, scheduling, notifications) | As a Client Admin, I want one place to see which business systems are connected so I can spot setup gaps quickly. | `GET /connectors`; tenant UI now exposes this at `/integrations`. |
| Add a new connector (type, display name, credentials via SecretRef) | As a Client Admin, I want to add a business-system connection without changing code so onboarding stays operational. | `POST /connectors`; tenant UI now exposes an admin setup form at `/integrations`, and `GET /connectors/catalog` now drives the adapter picker, setup hints, schema-backed default config, and health-check affordances instead of free-text adapter IDs. Legacy `generic_http_invoke` compatibility remains API-only and is intentionally hidden from the typed setup flow. |
| View connector details (includes latest health) | As a Client Admin, I want to inspect the current setup and last health check so I know whether a system is usable. | `GET /connectors/{connector_id}`; current tenant UI surfaces this inline from the list response on `/integrations`. |
| Update connector configuration | As a Client Admin, I want to change names, status, and configuration without redeploying anything. | `PATCH /connectors/{connector_id}`; tenant UI now edits display name, enabled state, and JSON config on `/integrations`. |
| Trigger a manual health check | As a Client Admin, I want to test a connector after setup changes so I know whether it is ready before staff rely on it. | `POST /connectors/{connector_id}/health-check`; tenant UI now exposes a “Run check” action on `/integrations`. |
| Remove a connector | — | **TBD (no endpoint in `apps/api/`)** |
| Configure connector field mapping (map extracted data to connector payload) | — | **TBD (no endpoint in `apps/api/`)** |
| Test connector with sample data | — | **TBD (no endpoint in `apps/api/`)** |
| Rotate connector credentials (update API key / secret) | — | **TBD (no endpoint in `apps/api/`)** |
| View connector credential expiry status | — | **TBD (no endpoint in `apps/api/`)** |

---

## 15. Knowledge Base Management (ClientAdmin — P7.8 foundation) — VOX 9.2

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Upload / ingest knowledge base documents (PDFs, text, FAQs) | As a Client Admin, I want to update knowledge base content so that agent has current business information. | **TBD (no knowledge base endpoints in `apps/api/`)** |
| List knowledge sources (name, type, ingestion status) | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| Delete / replace a knowledge source | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| View ingestion job status (processing / indexed / failed) | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| Submit knowledge source for review (mark as ready for approval) | As a Client Admin, I want to update knowledge base content so that agent has current business information. | **TBD (no knowledge base endpoints in `apps/api/`)** |
| Approve a knowledge source (publish to live agents) | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| Reject a knowledge source with feedback | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| View knowledge source version history and approver audit trail | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| View ingestion errors for a knowledge source | — | **TBD (no knowledge base endpoints in `apps/api/`)** |
| Retry failed ingestion | — | **TBD (no knowledge base endpoints in `apps/api/`)** |

---

## 16. Analytics & KPI Reporting (ClientAdmin) — VOX 9.5

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View lead funnel KPIs | As a Client Admin, I want to view aggregated analytics so that I understand overall performance. | `GET /reports/lead-funnel` |
| View call KPIs | As a Client Admin, I want to view aggregated analytics so that I understand overall performance. | `GET /reports/calls` |
| View response-time KPIs | Provide analytics baseline report/dashboard (response time, leads captured, conversations initiated, leads delivered, escalations). | `GET /reports/response-time` |
| View notification delivery KPIs | — | `GET /reports/notifications` |
| View schedule change KPIs | — | `GET /reports/schedule-changes` |
| View follow-up KPIs | — | `GET /reports/followups` |
| View error rate / failure KPIs (workflow failures, integration failures) | Provide production-grade infrastructure with monitoring, logging, and error alerting. | **TBD (no error-rate reporting endpoints in `apps/api/`)** |
| Export KPI data (CSV / JSON) | — | **TBD (no endpoint in `apps/api/`)** |
| View SLA compliance dashboard (p50/p95/p99, % within SLA threshold) | — | **TBD (no endpoint in `apps/api/`)** |
| View response-time breakdown by language | — | **TBD (no endpoint in `apps/api/`)** |
| Configure SLA alert rules (threshold, notification targets) | — | **TBD (no endpoint in `apps/api/`)** |
| View SLA alert history | — | **TBD (no endpoint in `apps/api/`)** |

---

## 17. Usage & Billing (ClientAdmin + SuperAdmin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View month-to-date usage summary (LLM tokens, call minutes, STT/TTS usage) | — | `GET /billing/usage` (optional `period=YYYY-MM`) |
| View estimated cost against budget for current period | — | `GET /billing/usage` (includes `total_cents`, `monthly_budget_cents`, `over_budget`, `utilization_percent`) |
| View monthly invoices / line items | — | `POST /admin/tenants/{tenant_id}/invoice?period=YYYY-MM`, `GET /admin/tenants/{tenant_id}/invoices`, `GET /admin/tenants/{tenant_id}/invoices/{invoice_id}` |
| Configure budget limits and alert thresholds | — | **Partial:** `PUT /admin/tenants/{tenant_id}/plan` (supports `budget_mode`, `monthly_budget_cents`, `alert_thresholds_percent`; alert delivery UI/ops is **TBD**) |
| View cross-tenant usage rollups (SuperAdmin) | — | `GET /admin/billing/usage?period=YYYY-MM` |
| Manage pricing tiers (SuperAdmin) | — | `GET /admin/pricing-tiers`, `POST /admin/pricing-tiers` |
| Assign pricing tier to a tenant (SuperAdmin) | — | `PUT /admin/tenants/{tenant_id}/plan` |
| View usage breakdown by component (platform fee, telephony, AI processing) | — | `GET /billing/usage` (returns component fees + `line_items`) |
| View per-call usage detail (platform/telephony/AI minutes) | — | **TBD (no per-call usage detail endpoints in `apps/api/`)** |
| View test vs. production usage separately | — | `GET /billing/usage` (returns `production_voice_seconds`, `production_voice_minutes`, `test_voice_seconds`, `test_voice_minutes`) |
| Configure per-component budget alerts (platform, telephony, AI) | — | **TBD (no per-component alert endpoints in `apps/api/`)** |

---

## 18. Recording Retention Configuration (ClientAdmin) — VOX 14 (compliance)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View current recording retention policy (days) | — | `GET /tenant/settings/recordings` |
| Update recording retention policy | — | `PATCH /tenant/settings/recordings` |

---

## 19. Guardrails Policy (ClientAdmin — P7.16) — VOX 9.2

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View active guardrails policy for the tenant (allowed claims, forbidden commitments, escalation triggers) | Provide configurable guardrails defining what the agent can/cannot say, promise, or commit to on behalf of VOX. | **TBD (no guardrails endpoints in `apps/api/`)** |
| Request update to guardrails policy (provider-approved) | — | **TBD (no guardrails endpoints in `apps/api/`)** |
| View guardrails violation events (what was blocked/rewritten and when) | — | **TBD (no guardrails endpoints in `apps/api/`)** |
| View guardrails policy detail (allowed claims, forbidden commitments, escalation triggers as structured lists) | Provide configurable guardrails defining what the agent can/cannot say, promise, or commit to on behalf of VOX. | **TBD (no guardrails endpoints in `apps/api/`)** |
| Preview guardrails evaluation on sample transcript | — | **TBD (no guardrails endpoints in `apps/api/`)** |
| View guardrails violation analytics (top violated rules, trend over time) | — | **TBD (no guardrails endpoints in `apps/api/`)** |
| Export guardrails violation report | — | **TBD (no guardrails endpoints in `apps/api/`)** |

---

## 20. Release Management (SuperAdmin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create a release bundle (solution versions + model policy + platform defaults + agent pins) | — | `POST /admin/releases` |
| Apply a release to a tenant (start rollout workflow) | — | `POST /admin/tenants/{tenant_id}/release` |
| List releases (name, components, created_at) | — | **TBD (no endpoint in `apps/api/`)** |
| View release detail (component versions, rollout status across tenants) | — | **TBD (no endpoint in `apps/api/`)** |
| View tenant release assignment status (pending / running / applied / failed) | — | **TBD (no endpoint in `apps/api/`)** |

---

## 21. Model Policy Management (SuperAdmin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View deployment model catalog (available models, channel constraints) | — | **TBD (no model policy endpoints in `apps/api/`; today it is env/config-driven)** |
| Update model catalog (add/remove models, fallback chains) | — | **TBD (no model policy endpoints in `apps/api/`; today it is env/config-driven)** |
| View per-tenant model policy (allowed model subset) | — | **TBD (no model policy endpoints in `apps/api/`)** |
| Update per-tenant model policy | — | **TBD (no model policy endpoints in `apps/api/`)** |

---

## 22. Audit Log (SuperAdmin + ClientAdmin) — VOX 14 (compliance)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View tenant audit log (who changed what, when, for which resource) | Implement security measures: encryption in transit/at rest, access controls, audit logging, regular security reviews. | `GET /audit/events`; tenant UI now exposes this at `/activity` for `client_admin` users with a plain-language activity timeline and owner-friendly summaries. |
| View deployment-wide audit log (cross-tenant, SuperAdmin only) | — | `GET /admin/tenants/{tenant_id}/audit-events`; provider support UI exposes this at `/admin/security`. |
| Filter audit events by actor, action type, target resource | — | **Partial:** action/resource/time-window filters exist on `GET /audit/events` and `GET /admin/tenants/{tenant_id}/audit-events`; actor-specific filtering is still **TBD**. |

---

## 23. GDPR / Data Subject Erasure (ClientAdmin) — VOX 14–15 (compliance/offboarding)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Submit a data subject erasure request (pseudonymise PII across tenant tables + delete recordings) | Comply with Swiss data protection (nDSG/FADP) and GDPR where applicable. | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| View status of a submitted erasure request (pending / running / completed) | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| List all erasure requests (history) | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| View erasure request progress detail (items deleted, items remaining, affected tables) | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| Download erasure completion report (for compliance audit) | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| Submit data subject export request (GDPR Art. 20 — right to portability) | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| View data export request status | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |
| Download exported personal data archive | — | **TBD (no GDPR/data-subject endpoints in `apps/api/`)** |

---

## 24. Public Web Chat Widget (Anonymous Users — VOX website) — VOX 9.3–9.4

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Embed embeddable chat widget on website (JavaScript snippet) | Provide website live chat widget on vox-sprachschule.ch with branding/placement approved by VOX. | Widget JS served from `apps/web` or CDN |
| Localize widget UI + greeting (EN, DE, FR, IT, ES, RU) | The system shall operate in all languages available on the VOX website (EN, DE, FR, IT, ES, RU) for sales conversations. | **TBD (depends on widget config + public chat APIs)** |
| Show “typing” / response-in-progress indicator (avoid instant-robotic feel) | The system shall respond to new website inquiries within 15 minutes, 24/7/365, including outside business hours. | **TBD (depends on streaming semantics; no public chat APIs in `apps/api/` yet)** |
| Render course recommendations clearly (clickable options + registration link) | The system shall check available courses (schedules, locations, languages, levels) and propose matching options to the lead in real time during conversation. | **TBD (depends on public chat APIs + schedule integration)** |
| Support structured lead capture inside chat flow (contact details) | The system shall capture structured lead data (name, email, phone, assessed level, goals, availability, preferred location, language) and deliver it to the sales team's CRM/inbox in a ready-to-action format. | **TBD (depends on public chat APIs + lead delivery integration)** |
| Create an anonymous chat session (rate-limited, scoped to tenant + conversation) | Support a public/anonymous web chat session ingress suitable for VOX website lead capture. | **TBD (no endpoint in `apps/api/`)** |
| Send a message in an active chat session | — | **TBD (no endpoint in `apps/api/`)** |
| Receive streamed agent responses (SSE with reconnect cursor) | — | **TBD (no endpoint in `apps/api/`)** |
| View conversation history for current session | — | **TBD (no endpoint in `apps/api/`)** |
| Escalate to human (trigger escalation flag in session) | Flag and escalate leads requiring human intervention (complex cases, complaints, high-value prospects). | **TBD (no endpoint in `apps/api/`)** |
| Create chat session with language preference | Support a public/anonymous web chat session ingress suitable for VOX website lead capture. | **TBD (no endpoint in `apps/api/`)** |
| Configure chat widget appearance (branding, colors, position, button text) | Provide website live chat widget on vox-sprachschule.ch with branding/placement approved by VOX. | **TBD (no endpoint in `apps/api/`)** |
| Get chat widget embed code snippet | — | **TBD (no endpoint in `apps/api/`)** |
| View chat widget analytics (sessions started, leads captured, escalation rate) | — | **TBD (no endpoint in `apps/api/`)** |
| Configure business hours / out-of-office mode | VOX Phase 1 requires full out-of-office engagement; this needs explicit hours config. | **TBD (no endpoint in `apps/api/`)** |

---

## 25. Notifications Configuration (ClientAdmin — `notifications` solution) — VOX 10.2–10.4

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View configured notification channels (email, SMS, WhatsApp) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Create / update a notification template (channel, content, locale) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View notification delivery log (sent, delivered, failed) | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 26. Operations Monitor (ClientAdmin — `operations_monitor` solution) — VOX 10.4

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View overdue tasks and escalation ladder status | Monitor CRM/task management for overdue tasks and escalate (remind → escalate → optional autonomous action). | **TBD (solution has no API router mounted in `apps/api/`)** |
| View incident detail (task, escalation history, current state) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure escalation rules (thresholds, ladder levels, notification targets) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Acknowledge / resolve an incident manually | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure autonomous action rules (what OMA may do without human approval) | Monitor CRM/task management for overdue tasks and escalate (remind → escalate → optional autonomous action). | **TBD (solution has no API router mounted in `apps/api/`)** |
| View autonomous action log (actions OMA took without human confirmation) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Approve or reject a pending autonomous action request | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 27. Lead Management (ClientAdmin — `lead_capture` + `lead_nurture` solutions) — VOX 9.3 + 10.2

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View captured leads (name, contact, intent, qualification status) | Run a conversational sales interaction (website chat) to qualify leads. | **TBD (solution has no API router mounted in `apps/api/`)** |
| View lead detail (conversation history, extracted fields, CRM delivery status) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View lead nurture / follow-up sequence status (active, paused, stopped) | Automatically follow up on non-responsive leads. | **TBD (solution has no API router mounted in `apps/api/`)** |
| Pause / stop a follow-up sequence for a lead | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Configure follow-up cadence (attempt count, intervals, stop conditions) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View pending escalated leads (filtered queue) | Flag and escalate leads requiring human intervention (complex cases, complaints, high-value prospects). | **TBD (solution has no API router mounted in `apps/api/`)** |
| View escalation context for a lead (full chat history + escalation reason) | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| Assign escalated lead to operator or sales queue | — | **TBD (solution has no API router mounted in `apps/api/`)** |
| View CRM delivery status for a lead | — | **TBD (solution has no API router mounted in `apps/api/`)** |

---

## 28. Health & System Status — VOX 9.1

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View platform health status (API) | Provide production-grade infrastructure with monitoring, logging, and error alerting. | `GET /health` |
| View platform health status (agent worker) | Provide production-grade infrastructure with monitoring, logging, and error alerting. | **TBD (no endpoint in `apps/api/`)** |
| View failed solution discovery list (solutions that failed to load on startup) | — | **TBD (no endpoint in `apps/api/`)** |
| View connector health summary across all tenant connectors (SuperAdmin) | — | **TBD (no endpoint in `apps/api/`)** |
| View system dependency health (Temporal, LiveKit, LLM providers, database) | Provide production-grade infrastructure with monitoring, logging, and error alerting. | **TBD (no endpoint in `apps/api/`)** |
| Configure system alert rules (error rate thresholds, latency thresholds) | — | **TBD (no endpoint in `apps/api/`)** |
| View system alert history | — | **TBD (no endpoint in `apps/api/`)** |

---

## 29. Workflow Definition & Composition (ClientAdmin + Deployment Super Admin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create a new workflow (from template or blank canvas) | As a Deployment Super Admin, I want to create complex multi-step workflows so that business processes are fully automated. | **TBD (no workflow definition endpoints in `apps/api/`)** |
| Edit workflow definition (add/remove/reorder steps) | — | **TBD (no workflow definition endpoints in `apps/api/`)** |
| View available workflow actions (action catalog) | — | **TBD (no workflow definition endpoints in `apps/api/`)** |
| Configure conditional branching in workflow steps | — | Included in workflow definition body (`next` as dict with conditions) |
| View workflow version history | — | **TBD (no workflow definition endpoints in `apps/api/`)** |
| Rollback workflow to a previous version | — | **TBD (no workflow definition endpoints in `apps/api/`)** |
| Manually retry a failed workflow step | As a Client Admin, I want to monitor workflow executions so that I can track automation status. | **Planned:** whole-run retry first via `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`; per-step retry remains intentionally blocked pending idempotency rules |
| View workflow step error details | — | `GET /workflows/executions/{workflow_id}/{run_id}/steps` |

---

## 30. Agent Development Workspace (Deployment Super Admin)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| Create agent definition (deployment-managed; per-tenant) | As a Deployment Super Admin, I want to create agents in code so that I have full control over agent behavior. | `POST /admin/tenants/{tenant_id}/agent-definitions` |
| Author/edit agent YAML (create new version) | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions` (body includes `source_yaml`) |
| Submit/review/publish agent versions (governed lifecycle) | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/submit`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/review`, `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions/{version}/publish` |
| Retire an agent definition | — | `POST /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/retire` |
| Fetch compiled artifact for debugging (provider view) | — | `GET /admin/tenants/{tenant_id}/agent-definitions/by-name/{name}/artifact` |
| List/search agent definitions and versions in the selected tenant workspace | — | `GET /admin/tenants/{tenant_id}/agent-definitions`, `GET /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions` |
| View review trail for one versioned agent | — | `GET /admin/tenants/{tenant_id}/agent-definitions/{agent_definition_id}/versions` |
| View diff between versions (prompt/tools/flow changes) | — | **TBD (no diff endpoint in `apps/api/`)** |
| Test agent with mock conversation (sandbox simulation) | — | **TBD (no simulation/test endpoint in `apps/api/`)** |
| Save named tests/eval scenarios and compare runs | — | **TBD (no test/eval workspace endpoints in `apps/api/`)** |
| Shift live traffic between versions / promote winner | — | **TBD (no traffic-splitting endpoint in `apps/api/`)** |
| View available tools and plugins for agent composition | — | **TBD (no tools registry endpoint in `apps/api/`)** |
| Access tenant as provider for support / debugging (impersonation/support session) | — | **TBD (no support/impersonation endpoints in `apps/api/`)** |
| View provider-wide system dashboard (cross-tenant metrics, worker health) | — | `GET /admin/reports/platform-health`, `GET /admin/calls/observability-summary` |

---

## 31. NFQ Healthcare — Clinic Appointment Booking (ClientAdmin + ClientOperator)

| Feature | User Story | API Endpoints |
|---------|-----------|---------------|
| View clinic booking knowledge base (specialties, cities, clinics, doctors, pricing) | As a clinic admin, I want to review the booking knowledge base so I know what the voice agent can offer callers. | `GET /clinic/knowledge-base` |
| Review inbound clinic call outcomes in historical calls | As a clinic operator, I want to review booking calls so I can follow up on pending or handed-off patients. | `GET /clinic/booking-results` |
| View structured booking extraction on a completed clinic call (appointment, patient, booking status, handoff reason) | As a clinic operator, I want to see the captured booking data in plain language so I can verify what happened without reading the whole transcript. | `GET /clinic/booking-results/{call_id}` |
| Check clinic availability options for a requested specialty/city/doctor | As a clinic admin, I want to verify available slots so I can confirm the scheduling integration is returning sane options. | `GET /clinic/availability` |
| Confirm patient identification code readback before booking | As a clinic operator, I want to verify the patient identification code readback flow so that booking errors are caught early. | `POST /clinic/patient-identification/readback` |
| Create an appointment after explicit patient confirmation | As a clinic operator, I want the system to create the appointment only after the patient accepts the offered slot and price. | `POST /clinic/appointments` |
| View handoff/callback cases for clinic bookings that need a human | As a clinic operator, I want a focused list of handed-off or failed booking attempts so I know who needs follow-up. | `GET /clinic/follow-ups` |
| View one clinic follow-up case with ownership and resolution state | As a clinic operator, I want a single follow-up detail response so the booking detail screen can stay in sync without reconstructing queue state client-side. | `GET /clinic/follow-ups/{call_id}` |
| Claim, assign, and resolve clinic follow-up work | As a clinic operator, I want to take ownership of follow-up work so another staff member does not duplicate effort. | `POST /clinic/follow-ups/{call_id}/claim`, `POST /clinic/follow-ups/{call_id}/assign`, `POST /clinic/follow-ups/{call_id}/resolve` |
| See live human-handoff state during an active clinic call | As a clinic operator, I want to know when the agent has already asked for human help so I do not wait for a stale transcript. | `GET /calls/{call_id}/ops/stream`, `GET /calls/{call_id}/events` with `call.escalated` events |
| See urgent transfer attempt state during an active clinic call | As a clinic operator, I want to know whether the system already requested immediate takeover for an urgent caller so I can join without guessing. | `GET /calls/{call_id}/ops/stream`, `GET /calls/{call_id}/events` with `call.escalation.transfer_requested` / `call.escalation.transfer_failed` events |
| View post-call automation status (patient record update, confirmation SMS, reminder scheduling) | As a clinic admin, I want to see whether the follow-up automations completed so staff do not need to guess. | **Partial:** `GET /clinic/booking-results/{call_id}/automation-status` exposes readiness plus manual outcome state, and tenant UI now surfaces this in `/bookings`. Real system-driven execution receipts are still **TBD**. |
| View clinic integration readiness without opening a specific call | As a clinic admin, I want one plain-language status view for patient-record sync and SMS integrations so I can fix blocked setup before a patient call fails. | `GET /clinic/integration-status` |
| View system-driven patient-record sync outcome for a clinic booking | As a clinic operator, I want to know whether the patient record was actually synced so staff do not duplicate chart updates. | `GET /clinic/booking-results/{call_id}/automation-status` |
| View system-driven confirmation SMS delivery outcome for a clinic booking | As a clinic operator, I want to see whether the patient confirmation SMS was actually queued so I do not call the patient twice. | `GET /clinic/booking-results/{call_id}/automation-status` |
| View scheduled reminder timing and final reminder delivery outcome for a clinic booking | As a clinic operator, I want to know whether the reminder is merely planned, already scheduled, or already sent so staff do not manually duplicate outreach. | `GET /clinic/booking-results/{call_id}/automation-status` |
| Configure how long before the appointment the reminder SMS is sent | As a clinic admin, I want to control the reminder lead time so the clinic can match its operating policy. | `GET /solutions/appointment_booking/config`, `PUT /solutions/appointment_booking/config`, `GET /solutions/appointment_booking/config/schema`, `GET /admin/tenants/{tenant_id}/solutions/appointment_booking/config`, `PUT /admin/tenants/{tenant_id}/solutions/appointment_booking/config`, `GET /admin/tenants/{tenant_id}/solutions/appointment_booking/config/schema` |
| Record a manual post-call automation outcome when staff complete work outside the platform | As a clinic operator, I want to mark record sync or patient notifications as complete/failed so the operations queue reflects reality before deep integrations are live. | `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/complete`, `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/fail` |
| Configure clinic patient-system sync using the current connector surface | As a clinic admin, I want to connect the clinic record system so confirmed bookings update the patient record automatically. | **Partial:** adapter selection is now configurable through `GET/PUT /solutions/appointment_booking/config` and `GET/PUT /admin/tenants/{tenant_id}/solutions/appointment_booking/config`, but connector creation/health still lives in the generic connector surface and there is no clinic-specific integration UI yet |
| Configure clinic inbound routing to the appointment-booking solution | As a clinic admin, I want calls to the clinic number to reach the booking agent automatically. | **Partial:** deployment-backoffice telephony APIs now exist (`GET/POST/PATCH/DELETE /admin/tenants/{tenant_id}/phone-channels...`) and deployment routing UI now exists at `/admin/channels` and `/admin/telephony`. Clinic-facing self-service routing remains **TBD**. |
| Ensure clinic tenant UI only shows clinic-relevant workflows and not logistics modules | As a clinic user, I want a focused UI that matches my business, not another client's demo. | `GET /solutions` + runtime tenant visibility in the web app; see Section **13** |

Notes:
- Demo-week scope guard: do not start a full clinic handoff console until deployed login and one real observable call are working end-to-end.
- Current tenant-console audit (2026-03-09): `/bookings`, `/clinic/knowledge-base`, `/call-ops`, `/call-ops/history`, `/dashboard`, `/team`, `/integrations`, `/activity`, and `/settings/recordings` are real pages with API consumers and local test coverage. The open work is workflow completion, not route scaffolding.
- The live handoff backend is now real, but UI must still translate low-level event names into business language:
  - `call.escalated` -> `Needs human help`
  - `call.escalation.transfer_requested` -> `Urgent transfer requested`
  - `call.escalation.transfer_failed` -> `Urgent transfer failed; join manually`
- Do not expose raw `reason_code` strings as the primary UI. Those are backend/operator semantics, not SME-facing copy.
- Current repo reality: tenant call-ops and call-history now apply that translation through `apps/web/src/lib/call-observability-presenters.ts`.
- Post-merge follow-up: this is still not a full clinic handoff console. The repo needs richer live support workflow after this PR, and calling the current call-ops/history UI “done” for clinic handoff would be trash.
- Historical execution plan for the NFQ clinic tenant + deployment console finish pass lives in `docs/milestones/exec-plans/nfq-clinic-and-deployment-console-ui-finish-plan.md`; current live tracking belongs in `docs/milestones/README.md` plus the relevant milestone and task docs.

### Clinic Registrator Runtime Mapping

Current focus is API/runtime. Do not confuse the full clinic solution API surface with the smaller live-call tool surface.

The clinic registrator agent should use only the conversation-time tools defined in:
- `solutions/appointment_booking/src/appointment_booking/plugin.py`
- `solutions/appointment_booking/src/appointment_booking/tools.py`
- `solutions/appointment_booking/configs/clinic_registration_agent.yaml`

Registrator runtime tools:
- discovery and narrowing: `search_clinic_booking_options`
- booking execution: `check_availability`, `confirm_patient_identification_code`, `collect_patient_details`, `confirm_appointment_price`, `book_appointment`
- control/system: `set_route`, `request_human_handoff`

These are the only tools that belong in the live clinic booking conversation. They map to the specialty -> city -> clinic -> doctor -> slot -> identity -> patient data -> price -> booking flow.

Clinic solution APIs that are not live registrator tools:
- operator review/read models: `GET /clinic/knowledge-base`, `GET /clinic/booking-results`, `GET /clinic/booking-results/{call_id}`, `GET /clinic/follow-ups`, `GET /clinic/follow-ups/{call_id}`
- operator action APIs: `POST /clinic/follow-ups/{call_id}/claim`, `POST /clinic/follow-ups/{call_id}/assign`, `POST /clinic/follow-ups/{call_id}/resolve`
- post-call automation status/actions: `GET /clinic/booking-results/{call_id}/automation-status`, `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/complete`, `POST /clinic/booking-results/{call_id}/automation-actions/{action_id}/fail`
- admin/integration/config APIs: `GET /clinic/integration-status`, solution config routes under `/solutions/appointment_booking/config` and `/admin/tenants/{tenant_id}/solutions/appointment_booking/config`

If an endpoint exists mainly so staff can review, claim, assign, resolve, audit, or fix something after the call, it does not belong in the registrator agent loop.

### Clinic TODO List

API/runtime now:
- keep the registrator runtime tool surface minimal and stable; do not add follow-up or automation endpoints to the live agent without a conversation-time reason
- add explicit ownership tests that fail if non-runtime clinic APIs get pulled into the registrator YAML/plugin surface
- finish the Gemini two-agent patient-vs-registrator evaluator so booking completion is proven through a real back-and-forth, not just one-shot prompts
- keep Lithuanian flow validation ahead of WebRTC/PSTN proof so transport issues do not hide logic failures

UI later:
- strengthen call-ops -> bookings continuity so live handoff context lands staff in the correct clinic follow-up record
- expose plain-language clinic telephony/routing setup only when deployment login and observable real-call proof are stable
- avoid building a “full clinic console” fantasy before the remaining checklist gaps are actually closed

Delivered now:
- browser click-to-talk entry for the clinic agent exists in `/bookings` and uses the same registrator runtime/profile, not a separate business flow

---

## Notes for Frontend Engineer

1. **Route scopes:** Every API call falls into one of three scopes. Middleware enforces DB context:
   - **Tenant-scoped** (currently unversioned paths like `/calls`, `/reports`, `/connectors`, `/tenant/settings`, `/clinic/...`) — JWT required; role from `public.memberships`
   - **Deployment-scoped** (`/admin/…`) — SuperAdmin only; no `tenant_id` needed
   - **Public / unauthenticated** (currently webhooks under `/webhooks/...`) — no JWT; signature/key verification required

2. **Role-gated UI surfaces:**
   | UI Surface | Minimum Role |
   |-----------|--------------|
   | Active calls dashboard, live transcript, join room, takeover | `client_operator` |
   | Historical calls, reports, agent config, KPIs, extractions, recordings | `client_admin` |
   | Agent lifecycle governance, release management, tenant management | SuperAdmin |

3. **LiveKit integration:** The call-ops console connects directly to LiveKit Cloud for real-time audio/video. Room access tokens are ALWAYS minted server-side via the platform API — never computed client-side.

4. **SSE streaming:** Live transcript streaming is Server-Sent Events (`GET /calls/{call_id}/transcript/stream`). Public chat streaming is **planned** but has no API in `apps/api/` yet.

5. **Solution-gated routes and UI visibility:** Solution API routers are mounted via discovery and gated by tenant enablement in `public.tenant_solutions`. Frontend visibility now uses runtime tenant solution state from `GET /solutions`, so clinic surfaces can stay hidden for logistics tenants and logistics surfaces can stay hidden for clinic tenants. Runtime config schema metadata now exists for solution-specific settings forms, while deeper per-solution install/config workflows are still **TBD**.

6. **Language routing (requirement):** VOX requires multi-language routing (EN, DE, FR, IT, ES, RU). UI should assume language selection/routing exists, but it requires **public chat widget APIs + tenant language config endpoints** (currently **TBD**).

7. **Knowledge base approval (requirement):** Knowledge sources need a lifecycle: `draft` → `pending_review` → `approved` / `rejected`, with version history + approver audit trail. This UI exists only after knowledge base APIs are implemented (currently **TBD**).

8. **SLA monitoring (requirement):** VOX expects response-time SLA reporting (and likely alerting). The repo has `GET /reports/response-time`, but SLA dashboards/alerts are mostly **TBD** in API and UI.

9. **Autonomous OMA actions (requirement):** Operations Monitor autonomous actions need explicit configuration + audit log + approval flows. No tenant-facing solution API exists yet (currently **TBD**).

10. **Approvals API scoping is fixed:** approval routes are correctly mounted under `/admin/tenants/{tenant_id}/approvals/...`, which satisfies `require_admin_tenant` and avoids the earlier missing-path-param failure mode.
