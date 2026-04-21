# Execution Plan: Platform v3.0 — Wave 9: VOX Phase 1 + Platform Completeness (100% Checklist Coverage)

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Draft
> **Created:** 2026-02-25
> **Track:** Epic

## 1. Feature Definition

**Goal:** Ensure **every requirement row** in `docs/requirements/checklist.md` is covered by an execution plan home:
- Implemented in Wave 7, OR
- Implemented in Wave 8 (Hoptrans), OR
- Implemented in Wave 9 (this wave), OR
- Explicitly marked as **Client/Operations/Legal dependency** (not buildable in repo).

If you want “100% coverage”, this is the only honest definition. Anything else is vibes.

**Primary sources:**
- `docs/requirements/checklist.md` (system-of-record checklist)
- `docs/requirements/vox.md` (VOX SOW + acceptance criteria)
- `docs/requirements/nfq.md` (platform vision + verticals)
- `docs/requirements/ui-requirements.md` (UI surface inventory; must not list fake endpoints)
- `wiki/architecture/architecture.md` (target architecture; must match actual routing contracts)

**Non-negotiable deliverable:** A cross-module “definition of done” that forces evidence:
- tests (unit/integration/e2e) AND/OR
- demo recording + logs + seeded data proof

**Backend-first constraint (for now):** The immediate objective is to make checklist `API`/`Repo` surfaces real and green (tests + wiring). UI delivery is a follow-up and must not block backend proof gates.

### Acceptance Criteria (coverage-level)

- [ ] Every section in `docs/requirements/checklist.md` §1–§22 is assigned to a Wave:
  - Wave 7 (governance/control plane)
  - Wave 8 (Hoptrans MVP)
  - Wave 9 (VOX Phase 1 + remaining platform modules)
  - External dependency (explicitly “not code”)
- [ ] Every checklist row with `Repo` status **❌ or 🐛** has a Phase in Wave 8 or Wave 9 that names:
  - concrete files to create/change
  - endpoints/contracts
  - tests + verification gate
- [ ] Any architecture drift discovered during implementation results in updating `wiki/architecture/architecture.md` (target) and regenerating `docs/arch/arch_spine.md`.

### Scope boundaries

Included:
- VOX Phase 1 (Website Sales Agent + out-of-office + analytics baseline) end-to-end
- Knowledge base ingestion + approval lifecycle + guardrails UI/API (VOX hard requirement)
- Workflow engine surfaces (definition/composition) and governance hooks
- User/team management (invites/roles) for real tenant portals
- Telephony admin surfaces (SIP trunk + phone numbers) required to configure inbound routing
- Compliance exports/offboarding + audit read visibility
- NFQ Healthcare vertical is included as **planned module** (not a 2-week deliverable)

Excluded:
- Hoptrans delivery implementation (Wave 8 owns it)

---

## 2. Coverage Map (Checklist → Wave Home)

| Checklist section | Module | Wave home |
|---:|---|---|
| 1 | Platform Foundation & Infrastructure | Wave 9 (ops + hardening gaps) |
| 2 | Authentication & Access Control | Wave 9 |
| 3 | Agent Management | Wave 7 (governance) + Wave 9 (templates/catalog + client surfaces) |
| 4 | VOX Knowledge Base | Wave 9 |
| 5 | Website Sales Agent (VOX Phase 1) | Wave 9 |
| 6 | Lead Follow-Up & Nurture (VOX) | Wave 9 |
| 7 | Voice Sales Agent (VOX Phase 2) | Wave 9 (planned; not Phase 1 delivery) |
| 8 | Schedule Management Agent (VOX Phase 2) | Wave 9 (planned; not Phase 1 delivery) |
| 9 | Operations Monitor Agent (VOX Phase 2) | Wave 9 (planned; not Phase 1 delivery) |
| 10 | Integrations | Wave 9 |
| 11 | Call Monitoring | Wave 8 (Hoptrans slice) + Wave 9 (general historical + review UX) |
| 12 | Analytics & Reporting | Wave 9 |
| 13 | Compliance & Data Protection | Wave 9 (product surfaces) + External (legal) |
| 14 | KPI Baselines (VOX pre-launch) | External (VOX + Provider operations) |
| 15 | Client Readiness (VOX dependencies) | External (VOX-owned) |
| 16 | Workflow Engine | Wave 9 |
| 17 | Telephony Infrastructure | Wave 9 |
| 18 | User & Team Management | Wave 9 |
| 19 | Billing & Usage | Wave 7 (foundations) + Wave 9 (remaining gaps + UI) |
| 20 | Provider Backoffice | Wave 9 |
| 21 | Hoptrans — Driver Work Time Verification | Wave 8 |
| 22 | NFQ Healthcare — Clinic Appointment Booking | Wave 9 (planned) |

This table is the “100% coverage” claim. If you add new checklist sections, update this map.

---

## 3. Phase Plan (modules-first)

### Phase 9.1: Tenant portal users/teams (invites, roles, revocation)

**Objective:** Make the portal usable by real client teams (Admin vs Operator) instead of a single bootstrapped user.

**Status update (2026-02-28):**
- ✅ Tenant team-user backend API is wired:
  - `GET /team/users`
  - `POST /team/users/invite`
  - `PATCH /team/users/{user_id}/role`
  - `POST /team/users/{user_id}/deactivate`
  - `DELETE /team/users/{user_id}`
- ✅ Operator restriction proof: `client_operator` receives `403` on team-user management endpoints.
- ✅ Super-admin support access is tenant-targetable via admin-tenant scope (`require_admin_tenant`) and exercised by admin-tenant audit reads.
- ✅ Super-admin tenant onboarding is API-wired (`POST /admin/tenants/onboard`) and provisioning is integration-gated via onboarding service tests.
- ✅ Client-admin login path is OIDC-backed end-to-end:
  - `GET /auth/me` validates bearer token via `OidcAuthProvider` + membership resolution (`apps/api/src/platform_api/routes/auth.py`).
  - Web login uses OIDC access token introspection (`/auth/me`) before setting the portal session cookie (`apps/web/src/app/(auth)/login/page.tsx`).
- ✅ Super-admin tenant backoffice management is API-wired for provider operations:
  - `GET /admin/tenants` (cross-tenant list for support visibility)
  - `PATCH /admin/tenants/{tenant_id}/status` (active/suspended lifecycle controls)
- Gates:
  - `uv run pytest apps/api/tests/integration/test_team_users.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_tenant_onboarding_service.py -q --tb=short`
  - `tools/scripts/run_auth_login_e2e.sh`
  - `cd apps/web && pnpm playwright test e2e/auth-flow.spec.ts --project=chromium`
  - `uv run pytest packages/platform-core/tests/unit/test_auth/test_middleware.py -k test_superadmin_with_tenant_path_param -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_audit_events.py -k test_admin_tenant_audit_events_are_available_for_super_admin -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §2 + §18
- Auth middleware: `packages/platform-core/src/platform_core/auth/middleware.py`
- Public schema: `public.users`, `public.memberships`

**Deliverables:**
- API (tenant-scoped):
  - Invite user, accept invite, list users, set role, deactivate
- UI (deferred):
  - Team management pages (ClientAdmin)

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
pnpm -C apps/web test
```

---

### Phase 9.2: Telephony admin (SIP trunks + phone numbers + inbound routing config)

**Objective:** Stop treating inbound routing as “magic DB state”. Provide real admin surfaces.

**Status update (2026-03-01):**
- ✅ Inbound DID routing is wired and fail-closed at runtime:
  - DID resolution: `public.phone_numbers` → tenant + governed `agent_definition_id` (`packages/platform-core/src/platform_core/voice/inbound.py`).
  - Dispatch path: LiveKit `room-started` webhook → `platform.InboundCallOrchestratorWorkflow` start (`packages/platform-core/src/platform_core/voice/webhook.py`).
  - Tenant-state enforcement: suspended/offboarded tenants are rejected before dispatch.
- Gates:
  - `uv run pytest packages/platform-core/tests/unit/test_voice/test_inbound.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/unit/test_voice/test_webhook.py -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §17
- Inbound routing: `packages/platform-core/src/platform_core/voice/webhook.py`
- Public schema: `public.phone_numbers` (governed agent refs)

**Deliverables:**
- API:
  - CRUD SIP trunks (or LiveKit trunk refs) per tenant
  - CRUD phone numbers mapping (`phone_number` → `agent_definition_id`, `sip_trunk_id`, `active`)
  - Provision/update LiveKit SIP dispatch rules (server-side) as needed
- UI (deferred):
  - Telephony settings pages (ClientAdmin)

#### Phase 9.2a: Telnyx carrier option (default telephony + BYO numbers + queue/voicemail)

This is the concrete plan to cover checklist §17 rows:
- “connect existing SIP trunk (use current phone numbers)”
- “default telephony option”
- “acquire numbers through platform”
- “inbound call queue”
- “voicemail + callback”

If we don’t scope this explicitly, we’ll ship a half-feature and call it “done”. That would be trash.

**Hard clarification (scope sanity):**
- “Client connects existing SIP trunk” is not a Telnyx feature. It’s a platform feature.
  - If the client insists on keeping their carrier trunk (Telia/Tele2/etc.) unchanged, we support it via LiveKit SIP + customer SBC config.
  - If the client wants to “use current phone numbers” with the platform-managed carrier, that means porting numbers to the platform’s carrier (Telnyx in this plan).

**Architecture decision (STTCPW):**
- Keep LiveKit as the media plane + agent runtime (already wired via `room-started` webhook).
- Use Telnyx as a PSTN carrier option:
  - Default telephony: platform provisions Telnyx numbers + Telnyx SIP connection and points it at LiveKit SIP.
  - BYO numbers: platform supports port-in to Telnyx, or BYO carrier trunk directly to LiveKit SIP (no Telnyx involvement).

**Telnyx primitives we rely on (evidence links):**
- Phone numbers: search/order/reserve/bulk-order
  - https://developers.telnyx.com/docs/numbers/phone-numbers/buy-phone-number
  - https://developers.telnyx.com/docs/numbers/phone-numbers/number-reservations
  - https://developers.telnyx.com/docs/numbers/phone-numbers/bulk-ordering/index
- Porting (for “use current phone numbers” on default telephony)
  - https://developers.telnyx.com/api-reference/porting-orders/create-a-porting-order
  - Lithuania: https://support.telnyx.com/en/articles/3303715-lithuania-number-porting
- Voice connections (SIP trunking)
  - https://developers.telnyx.com/docs/voice/sip-trunking/authentication/credential-types
  - https://developers.telnyx.com/docs/voice/sip-trunking/configuration/outbound-voice-profiles/index
- LiveKit SIP + Telnyx trunk setup (provider bridge)
  - https://docs.livekit.io/sip/quickstarts/configuring-telnyx-trunk/

**Lithuania-specific compliance requirements (don’t lie to ourselves):**
- Purchasing/activating Lithuanian DIDs requires meeting local requirements (Telnyx “Requirements” + documentation). This must be surfaced in the admin UX and validated server-side.
  - https://support.telnyx.com/en/articles/1995178-lithuania-did-requirements
- Porting Lithuanian numbers requires LOA + latest invoice and either company Tax/VAT or personal ID code. If we can’t capture/validate this, “port-in” is not shippable.
  - https://support.telnyx.com/en/articles/3303715-lithuania-number-porting

**Implementation steps (backend-first):**
1) Provider model (minimal abstraction, no overengineering)
   - Add `telephony_providers` concept at tenant level:
     - `provider_type`: `telnyx` | `byo_sip`
     - provider config: references to secrets + connection ids + trunk metadata
   - Keep the interface narrow:
     - `provision_default_number()`
     - `search_numbers() / order_numbers()`
     - `request_port_in()`
     - `configure_inbound_destination()`

2) Admin API (tenant-scoped)
   - SIP trunks / connections:
     - Create/update a “trunk config” for `byo_sip` (LiveKit SIP ingress details + allowlist requirements)
     - Create/update Telnyx connection details (connection id, outbound voice profile id)
   - Numbers:
     - Search Telnyx inventory
     - Place order / reserve
     - Attach DID → agent mapping (`public.phone_numbers` remains the runtime source-of-truth)
   - Porting:
     - Create porting order and track status; store required docs metadata + workflow state

3) Inbound queue + voicemail/callback (Telnyx-only, explicitly gated)
   - Don’t pretend this works for BYO trunks until we build it for them.
   - Use Telnyx Programmable Voice queueing + recording + gather:
     - Queueing concept docs: https://developers.telnyx.com/docs/voice/programmable-voice/queueing-calls
     - Enqueue call command: https://developers.telnyx.com/api-reference/call-commands/enqueue-call
     - Leave queue command: https://developers.telnyx.com/api-reference/call-commands/remove-call-from-a-queue
     - Gather (callback number/choice): https://developers.telnyx.com/api-reference/call-commands/gather-using-speak
     - Voicemail recording: https://developers.telnyx.com/api-reference/call-commands/recording-start
   - Flow:
     - Inbound call hits Telnyx app/webhook first (not LiveKit).
     - Platform checks “agent capacity” (our definition; e.g. max concurrent sessions per tenant).
     - If capacity available: bridge/dial into LiveKit SIP.
     - If busy: enqueue + play wait loop; offer:
       - “leave voicemail” → record → persist recording URL + metadata
       - “request callback” → gather number/time → persist callback request → hang up
     - Outside business hours: skip queue and offer voicemail/callback directly.

4) Tests (integration/E2E-first, not vibes)
   - **PR-gating must be deterministic.** Do not hit real Telnyx/PSTN in CI: it’s flaky, slow, and costs money.
   - Test Telnyx integration via a compose E2E **`telnyx-mock`** service and assert:
     - platform → Telnyx API requests (recorded by mock)
     - Telnyx → platform webhook handling (simulated callbacks)
     - platform state transitions (DB writes + workflow state)

   **E2E harness changes (compose `--profile e2e`):**
   - Add `telnyx-mock` to `docker-compose.yml` under the `e2e` profile.
   - Inject `TELNYX_API_BASE_URL=http://telnyx-mock:<port>` into:
     - `platform-api-e2e`
     - `temporal-worker-e2e` (if workers call Telnyx directly)
   - Keep existing OIDC + LiveKit wiring untouched.
   - Use existing harness scripts:
     - `tools/scripts/compose-worktree.sh up-e2e`
     - `tools/scripts/compose-worktree.sh test-e2e`

   **Unit (fast fail-closed):**
   - Provider config validation (no “best effort” parsing)
   - Lithuania requirements validation (reject missing fields with 4xx, no side effects)

   **Integration (API contract + state machine):**
   - Number search/order/reserve/port request endpoints:
     - validate request shape
     - validate LT compliance fields
     - assert correct Telnyx API calls against `telnyx-mock`
   - Inbound queue state machine:
     - webhook payload in → expected Telnyx commands out (enqueue/leave_queue/gather/record)

   **E2E (compose-worktree, PR-gating):**
   - New file: `packages/platform-core/tests/e2e/test_wave9_telnyx_telephony_compose.py`
     - `test_telnyx_in_hours_and_capacity_available_bridges_to_livekit_sip`
       - Arrange: tenant + DID routing + provider=`telnyx`, capacity available
       - Act: post Telnyx inbound webhook to platform
       - Assert: telnyx-mock received a dial/bridge to the LiveKit SIP destination; DB/workflow correlation persisted
     - `test_telnyx_busy_enqueues_and_offers_callback_then_persists_callback_request`
       - Arrange: capacity busy, queue not full
       - Act: inbound webhook → enqueue; then simulate `call.gather.ended` digits
       - Assert: telnyx-mock saw `enqueue` then `gather`; callback request persisted
     - `test_telnyx_queue_full_or_outside_hours_routes_to_voicemail_and_persists_recording`
       - Arrange: queue full OR outside-hours policy
       - Act: inbound webhook → voicemail path; then simulate `call.recording.saved`
       - Assert: telnyx-mock saw `record_start`; voicemail metadata persisted
     - `test_telnyx_lithuania_requirements_missing_rejected`
       - Act: attempt LT number order/port without required fields
       - Assert: 4xx + no Telnyx calls + no DB side effects

   **Nightly canary (optional, explicitly non-gating):**
   - Separate scheduled job using a dedicated Telnyx account + test numbers.
   - Purpose: detect drift (auth changes, rate limits, behavior changes). Never block PRs.

**Operational playbook (explicitly deferred):**
- After implementation: update `wiki/ops/phone-number-onboarding.md` and `wiki/ops/inbound-voice-routing.md` to cover secrets, webhook verification, dashboards/alerts, and Lithuania compliance/porting runbooks.

**Tests / gate:**
```bash
uv run pytest packages/platform-core/tests/integration/ --tb=short -q
uv run pytest apps/api/tests/integration/ --tb=short -q
tools/scripts/compose-worktree.sh e2e
```

---

### Phase 9.3: VOX Website Sales Agent (public chat ingress + widget + multilingual routing + lead capture)

**Objective:** Deliver VOX Phase 1 core: secure public chat session ingress + widget + lead qualification.

**Input:**
- `docs/requirements/checklist.md` §5
- `docs/requirements/vox.md` (REQ-S01..S06, SOW Phase 1 deliverables)

**Includes (ex-Wave 7 carryover):**
- P7.21 public/anonymous web chat session foundation
- P7.22 locale + multilingual foundation (deterministic resolution + policy-enforced fallbacks)

**Deliverables:**
- Public API (anonymous):
  - Create chat session (language + tenant routing)
  - Stream responses safely (rate limit + abuse protection)
- Tenant API:
  - Lead list/detail + export
  - Escalations queue for sales team
- Widget (deferred):
  - Embed script + theming + placement config

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
pnpm -C apps/web test
```

---

### Phase 9.4: VOX Knowledge Base v1 (ingestion + lifecycle + VOX approval)

**Objective:** Make “knowledge base” real and enforce VOX final approval on brand content.

**Input:**
- `docs/requirements/checklist.md` §4
- `docs/requirements/vox.md` §9.2 / §10 acceptance criteria

**Deliverables:**
- API:
  - Upload/ingest docs (jobs + error visibility + retry)
  - Content lifecycle: draft → in_review → approved/rejected → published
  - Reviewer/audit trail (VOX approval required for brand-representing content)
- UI (deferred):
  - KB management screens + approval inbox + diff/version history

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
```

---

### Phase 9.5: Notifications solution (email/SMS/WhatsApp) + delivery confirmation

**Objective:** Provide the messaging substrate needed by VOX follow-ups and schedule notifications.

**Status update (2026-02-28):**
- ✅ Notifications activity `sol.notifications.send_notification` is unit-gated for both email and SMS channel dispatch.
- ✅ Delivery receipt persistence is integration-gated through `sol.notifications.record_delivery` writes to tenant `notification_deliveries`.
- Gates:
  - `uv run pytest solutions/notifications/tests/unit/test_notifications.py -q --tb=short`
  - `uv run pytest solutions/notifications/tests/unit/test_notifications_config_adapter_selection.py -q --tb=short`
  - `uv run pytest solutions/notifications/tests/integration/test_notification_delivery_activity.py -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §10

**Deliverables:**
- Solution/API for sending notifications with provider adapters
- Delivery receipts + fallback strategy (or explicit “not supported”)
- UI for templates + routing rules (ClientAdmin) (deferred)

**Tests / gate:**
```bash
uv run pytest solutions/notifications/tests/ --tb=short -q
```

---

### Phase 9.6: Integrations (VOX scheduling + CRM lead delivery + generic REST tool)

**Objective:** Stop hand-waving “integrations”. Implement the minimum to satisfy VOX Phase 1 (course lookup + lead delivery).

**Status update (2026-02-28):**
- ✅ Inbound webhook authenticity + replay/idempotency semantics are now explicitly integration-gated for telematics ingestion.
- ✅ Outbound webhook sender is wired as reusable workflow action (`platform.deliver_outgoing_webhook`) with direct delivery+dedupe integration coverage and workflow-trigger integration coverage.
- ✅ Connector API now demonstrates tenant-configurable endpoint/credential/mapping updates (config-only, no tenant code forks), including secret-ref rotation.
- ✅ Generic REST connector tool is now wired end-to-end: tenant connector invoke API enforces allowlisted path/method policy with secret-backed auth, and Grove system tool `call_rest_connector` calls that endpoint for agent usage.
- Gates:
  - `uv run pytest solutions/telematics_ingestion/tests/integration/test_inbound_webhook.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/integration/test_outgoing_webhooks.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/integration/test_driver_verification_e2e.py -k test_driver_verification_completed_call_persists_extraction_results_and_webhook -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_connectors.py -q --tb=short`
  - `uv run pytest packages/grove/tests/unit/tools/test_rest_connector_tool.py packages/grove/tests/unit/tools/test_registry.py -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §10

**Deliverables:**
- VOX scheduling connector (read) + contract tests
- CRM delivery path (webhook/API/email with schema)
- Generic REST tool for agents (provider-managed allowlist)

**Tests / gate:**
```bash
uv run pytest solutions/*/tests/ --tb=short -q
```

---

### Phase 9.7: Call history + transcript/extraction review + escalation ops

**Objective:** Provide completed-call review workflows (not only “active calls”), for VOX and NFQ.

**Input:**
- `docs/requirements/checklist.md` §11
- Hoptrans slice is Wave 8, but platform-wide call review must exist for clients.

**Includes (ex-Wave 7 carryover):**
- P7.23 historical call search API (generalized platform version; Hoptrans-first slice lives in Wave 8)

**Deliverables:**
- API:
  - Historical call search, call detail, transcript fetch, extraction fetch
  - Escalation queue backed by operator events/incidents
- UI (deferred):
  - Call log + call detail + recording playback + transcript view

**Status update (2026-02-28):**
- ✅ `GET /calls/{call_id}` now provides post-call transcript review even when voice workers only persisted incremental `call_transcript_segments`; detail response falls back to deterministic segment reconstruction.
- ✅ `GET /calls` and `GET /calls/{call_id}` now emit deterministic call quality scores and `needs_human_review` flags from transcript content so operators can prioritize post-call review queues.
- ✅ `POST /calls/{call_id}/terminate-transfer` explicitly supports urgent operator terminate+transfer handoff and audits the action before signaling workflow takeover.
- ✅ `PUT /agent-definitions/{agent_definition_id}/overrides` now accepts tenant `extraction_schema` templates so post-call extraction fields (outcome/notes/checklist) are client-configurable and reflected in published runtime artifacts.
- Gate:
  - `uv run pytest apps/api/tests/integration/test_calls_history.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_calls.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
pnpm -C apps/web test
```

---

### Phase 9.8: Analytics + SLA monitoring (VOX KPI baseline and ongoing)

**Objective:** Make KPI claims measurable: response times, leads captured, escalations, follow-ups.

**Status update (2026-02-28):**
- ✅ Tenant usage/cost summary API (`GET /billing/usage`) is integration-gated for real-time minutes/cost/budget visibility.
- ✅ Billing usage summary now reports production vs test call minutes separately, backed by outbound metering that stamps `metadata.environment` on usage events.
- ✅ Reports calls API (`GET /reports/calls`) is integration-gated for tenant-isolated escalation-rate computation.
- ✅ Reports calls API now includes per-bucket `total_calls`, `average_duration_seconds`, and deterministic `outcome_distribution` for aggregated analytics.
- ✅ Client admins can access tenant-scoped analytics reports through `/reports/calls` with membership-gated isolation proofs.
- Gates:
  - `uv run pytest apps/api/tests/integration/test_billing.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/integration/test_campaign_e2e.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
**Input:**
- `docs/requirements/checklist.md` §12 + §14

**Deliverables:**
- Reports correctness proof (seeded fixtures + deterministic expectations)
- SLA dashboard + alert config (if alerting in-scope)

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
```

---

### Phase 9.9: Workflow engine UI (definition/composition) + governance hooks

**Objective:** Provide workflow CRUD and composition surfaces promised by NFQ vision (and required for scalable ops).

**Status update (2026-02-28):**
- ✅ Complex multi-step workflows are integration-proven across multiple actions/systems (transform + HTTP) and
  explicit time-delay steps (`delay`) in the runtime engine, with governed API publish proof for super-admin authored
  workflows.
- ✅ Transient workflow step failures now retry automatically in the runtime engine (fixed/exponential backoff from
  `WorkflowConfig.retry`, default policy applied when omitted) with retry telemetry spans (`workflow.step.retry`).
- ✅ Workflow execution visibility is tenant-scoped for client admins/operators via `GET /workflows/executions`
  (supports workflow-type and execution-status filters).
- ✅ Client-admin workflow toggles are wired through tenant overrides: `PUT /agent-definitions/{agent_definition_id}/overrides`
  now accepts `workflow_enabled` flags, rejects unknown workflow names fail-closed, and post-call trigger execution
  skips disabled workflows.
- ✅ Client-admin trigger overrides are wired through tenant overrides: `PUT /agent-definitions/{agent_definition_id}/overrides`
  now accepts per-workflow `workflow_triggers` (`event`/`schedule`/`manual`), validates trigger shape fail-closed,
  and rejects unknown workflow names before persistence.
- ✅ Reusable workflow templates are now shipped in solution defaults and reused across tenants during agent compile;
  lead-capture template includes `lead_capture_follow_up` with cross-tenant API publish proof.
- ✅ Client-admin data-to-integration mapping is wired through tenant overrides: `PUT /agent-definitions/{agent_definition_id}/overrides`
  now accepts `workflow_data_mappings` (workflow → `transform_data` step → extract mapping), rejects unknown/non-`transform_data`
  step targets fail-closed, and merged compiled artifacts expose mapped payload keys for downstream integration actions.
- ✅ Workflow failure notifications are now emitted as critical operator events (`ops.workflow_execution_failed`) when
  post-call workflow execution raises, with workflow/call correlation metadata and trace span
  `workflow.failure.notification`.
- Gates:
  - `uv run pytest packages/grove/tests/integration/test_workflow_integration.py -k complex_multi_step_sequence_with_delay -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -k super_admin_can_publish_complex_multi_step_workflow -q --tb=short`
  - `uv run pytest packages/grove/tests/unit/runtime/test_workflow_engine.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_workflows.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -k toggle_workflows -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -k solution_workflow_templates_are_reused_across_tenants -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -k map_workflow_data -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/unit -k workflow_triggers -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_schema_registry_enforcement.py -k workflow_trigger_failure_emits_operator_event_notification -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §16

**Deliverables:**
- API:
  - Workflow CRUD + action catalog + branching config + versioning
- UI (deferred):
  - Workflow builder (MVP, not a full Zapier clone)

**Tests / gate:**
```bash
uv run pytest packages/grove/tests/integration/ --tb=short -q
uv run pytest apps/api/tests/integration/ --tb=short -q
```

---

### Phase 9.10: Compliance surfaces (audit read, export/offboarding, DSAR)

**Objective:** Make compliance provable in-product, not only “we have audit writes”.

**Status update (2026-02-28):**
- ✅ Audit read APIs are now wired for tenant admins and super-admin tenant support scopes:
  - `GET /audit/events`
  - `GET /admin/tenants/{tenant_id}/audit-events`
- ✅ Compliance export/offboarding API surfaces are now wired for backoffice tenant lifecycle operations:
  - `GET /admin/tenants/{tenant_id}/export` (public + tenant-schema JSON export for portability)
  - `POST /admin/tenants/{tenant_id}/offboard` (starts `platform.OffboardTenantWorkflow` with configurable grace period)
- Gates:
  - `uv run pytest apps/api/tests/integration/test_audit_events.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_tenant_lifecycle_workflows.py -q --tb=short`

**Input:**
- `docs/requirements/checklist.md` §13

**Includes (ex-Wave 7 carryover):**
- P7.24 individual GDPR erasure (DSAR “right to deletion”)

**Deliverables:**
- API (required):
  - Audit log read (tenant-scoped + admin-tenant scoped)
  - Export job + progress + retention countdown
  - Offboarding workflow primitives (suspend → export → delete state machine)
- UI (deferred):
  - Export/offboarding UI (progress + countdown + confirmations)
  - Tenant audit log UI

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
```

---

### Phase 9.11: Provider backoffice (minimum viable control panel)

**Objective:** Give NFQ/Provider the operational backoffice surfaces needed to manage tenants, releases, agents, and support access.
Backend primitives come first; UI can be deferred.

**Input:**
- `docs/requirements/checklist.md` §20

**Deliverables:**
- API (required): any missing admin endpoints needed for tenant/release/agent operations
- UI (deferred): surfaces consuming admin APIs (tenants, releases, agent governance)
- Explicit support access pattern (no “hacky URL switching”)

**Status (2026-02-28):**
- ✅ Super-admin tenant quota controls are wired through tenant plans (`PUT /admin/tenants/{tenant_id}/plan`) with budget enforcement gates:
  - `uv run pytest apps/api/tests/integration/test_billing.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py -q --tb=short`
- ✅ Provider-managed governed agent lifecycle is wired (`/admin/tenants/{tenant_id}/agent-definitions*`) with integration gate:
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`
- ✅ Standard solution agent templates are reusable across tenants (same baseline mission/config before tenant customization) with integration gate:
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`
- ✅ Tenant release rollout management is wired (`/admin/releases`, `/admin/tenants/{tenant_id}/release`) with API + rollout gates:
  - `uv run pytest apps/api/tests/integration/test_release_rollout.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_release_units_and_rollout.py -q --tb=short`
- ✅ Super-admin platform health analytics are deployment-scoped via `/admin/reports/*` with cross-tenant KPI aggregation gate:
  - `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
- ✅ Deployment-super-admin platform-health snapshot is wired via `GET /admin/reports/platform-health` (error rate, latency, worker health status, active call workflow counts), with degraded Temporal handling gate:
  - `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
- ✅ Super-admin provider + system settings controls are wired for full backoffice governance:
  - OIDC provider management: `GET/POST/PATCH/DELETE /admin/oidc-providers`
  - Platform defaults management: `GET/POST /admin/platform-defaults`
  - Gate: `uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short`
- ✅ Client-editable override lock boundaries are mechanically enforced (provider-only fields blocked; bounded tenant overrides allowed) with gate:
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`
- ✅ Layered config precedence is integration-proven as platform defaults → solution templates → tenant overrides with tenant isolation guarantees.
- ✅ Client-admin knowledge-base content updates are wired through tenant override variables (`product_catalog`, `faq`, `narrative`) and compiled into runtime artifacts with gate:
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py -k test_agent_overrides_apply_business_variables -q --tb=short`
- ✅ Client-admin version history visibility is wired via tenant-scoped `GET /agents/{name}` (ordered status/version history) with gate:
  - `uv run pytest apps/api/tests/integration/test_agents.py -q --tb=short`

**Tests / gate:**
```bash
uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short
```

---

### Phase 9.12: NFQ Healthcare vertical — clinic booking

**Objective:** Deliver clinic-booking capability slices with mechanical gates (no docs-only claims).

**Input:**
- `docs/requirements/checklist.md` §22

**Includes (ex-Wave 7 carryover):**
- P7.19 `clinic_booking` solution scaffold

**Deliverables:**
- `solutions/appointment_booking/` solution package with entry point + tenant-gated clinic API router.
- Seeded clinic knowledge base (specialties, cities, clinic locations, doctors, pricing) available via `GET /clinic/knowledge-base`.
- Appointment-booking plugin + agent template that load clinic knowledge base into runtime variables.
- Follow-on phases keep scheduling adapters, booking execution, and handoff policies in separate gated slices.

**Status (2026-03-01):**
- ✅ Checklist row L409 closed (`Clinic knowledge base is loaded`) with real package + API wiring:
  - `solutions/appointment_booking/src/appointment_booking/knowledge_base.py`
  - `solutions/appointment_booking/src/appointment_booking/api.py`
  - `solutions/appointment_booking/src/appointment_booking/manifest.py`
  - `solutions/appointment_booking/src/appointment_booking/agent_template.py`
- ✅ Checklist row L410 closed (`Inbound calls to the clinic phone number are answered automatically`) with clinic-specific
  compose proof:
  - `packages/platform-core/tests/e2e/test_wave9_clinic_inbound_auto_answer_compose.py`
  - `tools/scripts/run_clinic_inbound_auto_answer_e2e.sh`
- ✅ Checklist row L412 closed (`Agent queries real-time available appointment slots from the clinic scheduling system`)
  with solution-native scheduling logic + API + plugin wiring:
  - `solutions/appointment_booking/src/appointment_booking/scheduling.py`
  - `solutions/appointment_booking/src/appointment_booking/tools.py`
  - `solutions/appointment_booking/src/appointment_booking/plugin.py`
  - `solutions/appointment_booking/src/appointment_booking/api.py`
- ✅ Checklist row L413 closed (`Agent collects and reads back patient identification code to confirm accuracy`)
  with a solution-native confirmation tool wired into appointment-booking plugin composition and tenant-gated runtime
  readback route:
  - `solutions/appointment_booking/src/appointment_booking/tools.py`
  - `solutions/appointment_booking/src/appointment_booking/plugin.py`
  - `solutions/appointment_booking/src/appointment_booking/api.py` (`POST /clinic/patient-identification/readback`)

**Tests / gate:**
```bash
uv run pytest solutions/appointment_booking/tests/unit/test_appointment_booking.py -q --tb=short
uv run pytest solutions/appointment_booking/tests/integration/test_patient_identification_tool.py -q --tb=short
uv run pytest apps/api/tests/integration/test_clinic_patient_identification.py -q --tb=short
uv run pytest apps/api/tests/integration/test_clinic_knowledge_base.py -q --tb=short
uv run pytest apps/api/tests/integration/test_clinic_availability.py -q --tb=short
uv run pytest packages/platform-core/tests/e2e/test_wave9_clinic_knowledge_base_compose.py -q --tb=short
uv run pytest packages/platform-core/tests/e2e/test_wave9_clinic_inbound_auto_answer_compose.py -q --tb=short
uv run pytest packages/platform-core/tests/e2e/test_wave9_clinic_availability_compose.py -q --tb=short
uv run pytest packages/platform-core/tests/e2e/test_wave9_clinic_patient_identification_compose.py -q --tb=short
tools/scripts/run_clinic_knowledge_base_e2e.sh
tools/scripts/run_clinic_inbound_auto_answer_e2e.sh
tools/scripts/run_clinic_availability_e2e.sh
tools/scripts/run_clinic_patient_identification_e2e.sh
```

---

### Phase 9.13: Zero “legacy agents” surfaces (governed agents only)

**Objective:** Delete the legacy agent control plane and legacy runtime routing so there is a single source of truth:
**governed agent definitions**.

If you don’t do this, you’ll keep paying a tax forever: release rollouts compile from one source, inbound runtime reads another,
and UI shows a third.

**Includes (ex-Wave 7 carryover):**
- P7.25 zero legacy agent surfaces (A–D cutover)

**Current repo reality (what still exists today):**
- Legacy API routes still exist: `/agents` + `/admin/tenants/{tenant_id}/agents`
- Release artifact refresh still compiles from tenant `agents` YAML into `agent_compiled_artifacts`

**Deliverables (phased, but owned by Wave 9 as a coordinated cutover):**
- A) Governed routing everywhere: inbound DID mapping uses `agent_definition_id` (no filesystem paths)
- B) Worker-facing runtime artifact fetch (no `Path`-based YAML loads)
- C) Release rollout materializes governed artifacts (remove dependency on tenant `agents`)
- D) Delete legacy endpoints and cut over schema: remove `/agents`, remove `admin_agents`, remove tenant `agents` runtime dependency

**Tests / gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/integration/ --tb=short -q
uv run pytest tests/architecture/ -v --tb=short
```

---

### Phase 9.14: Solution scaffold — lead_nurture (follow-ups and keep-warm sequences)

**Objective:** Implement `lead_nurture` as a capability solution for systematic follow-ups (VOX REQ-S07) and "cooling lead"
re-engagement without turning into spam.

**Includes (ex-Wave 7 carryover):**
- P7.18 `lead_nurture` solution scaffold

**Deliverables:**
- `solutions/lead_nurture/` solution package with entry point
- Follow-up workflow(s): configurable cadence + stop conditions + escalation triggers
- Gated delivery via `notifications` (fail closed if notifications is not enabled for the tenant)

**Tests / gate:**
```bash
uv run pytest solutions/lead_nurture/tests/ --tb=short -q
uv run pyright solutions/lead_nurture/src/
```

---

## 4. Reality Check (don’t lie to yourself)

- “Wave 9 covers everything” does **not** mean “Wave 9 ships in one sprint.” This is a **program**.
- If you need Hoptrans in 2 weeks, Wave 9 is not your execution focus — Wave 8 is.
- VOX Phase 1 is still massively underbuilt (public chat ingress + KB + approvals + integrations). Pretending otherwise is self-sabotage.

---

## 5. Files Modified

| File | Change |
|------|--------|
| `docs/milestones/exec-plans/platformv3_wave_9.md` | New Wave 9 plan with full checklist coverage map |
