# Execution Plan: Platform v3.0 — Wave 3: Solution Framework

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed

### Wave 3: Solution Framework

---

## Status Map (2026-02-22)

| Phase | Status |
| ----- | ------ |
| 3.0-3.10 | DONE |

Source: platform-v3 consolidated review (archived) (open-items tracker).

---

#### Phase 3.0: SolutionManifest protocol and discovery [DONE]

**Objective:** Implement the SolutionManifest protocol (Section 7.3.1) and the discovery mechanism using importlib.metadata.entry_points().

**Input:**
- Architecture doc Section 7.3, 7.3.1

**Deliverables:**
- `packages/platform-core/src/platform_core/solutions/manifest.py` — SolutionManifest dataclass
- `packages/platform-core/src/platform_core/solutions/discovery.py` — discover_solutions()
- `packages/platform-core/src/platform_core/solutions/registry.py` — SolutionRegistry (name collision detection, failed_solutions tracking)
- Entry point group: `platform.solutions`

**Tests:**
- Unit: discovery finds installed solutions
- Unit: missing requires_installed blocks startup
- Unit: name collision blocks startup
- Unit: broken solution is skipped, not fatal

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~40K tokens
**Depends on:** Phase 1.0 (platform-core exists)
**Can run in parallel with:** Wave 2 phases

---

#### Phase 3.1: Solution gating (6 enforcement points) [DONE]

**Objective:** Implement all 6 solution gating enforcement points per Section 6.4 (API, tool invocation, workflow start, agent worker, build-time, Temporal signals).

**Input:**
- Architecture doc Section 6.4

**Deliverables:**
- API middleware: check tenant_solutions before routing to solution sub-routers
- Tool registry: filter plugins by enabled solutions
- Workflow guard: first activity asserts solution_enabled()
- Agent worker: read enabled_plugins from room metadata
- Temporal signal guard: verify target solution enabled before cross-solution calls
- CI test: `test_solution_boundaries.py` (solutions cannot import each other)

**Tests:**
- Unit test per enforcement point
- Integration: disabled solution's API route returns 403
- Integration: disabled solution's tools not available in AgentExecutor

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

**Context budget:** ~50K tokens
**Depends on:** Phase 3.0
**Can run in parallel with:** Phase 3.2

---

#### Phase 3.2: YAML config merge (3-layer hierarchy) [DONE]

**Objective:** Implement the 3-layer config merge: platform defaults < solution templates < tenant overrides, per Section 7.8.

**Input:**
- Architecture doc Section 7.8

**Deliverables:**
- `packages/platform-core/src/platform_core/config/merge.py` — deep merge with defined rules
- Merge rules: scalars override, dicts deep merge, arrays replace, null removes key
- Post-merge validation: tenant cannot enable plugins not from an enabled solution

**Tests:**
- Unit: merge precedence (tenant overrides solution overrides platform)
- Unit: null removes key
- Unit: array replaces (not appends)
- Unit: invalid plugin enablement rejected post-merge

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~25K tokens
**Depends on:** Phase 3.0
**Can run in parallel with:** Phase 3.1

---

#### Phase 3.3: First solution — outbound_campaigns scaffold [DONE]

**Objective:** Create the outbound_campaigns solution package as the reference implementation, demonstrating the full solution pattern.

**Input:**
- Architecture doc Section 7.1, 7.2, 7.7

**Deliverables:**
- `solutions/outbound_campaigns/` — Python package
- `solutions/outbound_campaigns/pyproject.toml` — with entry point declaration
- `solutions/outbound_campaigns/src/outbound_campaigns/manifest.py` — SolutionManifest instance
- Scaffold: Campaign workflow, dial activity, extract activity, plugin
- Temporal naming: `sol.outbound_campaigns.*`
- Tenant-schema migration: campaigns and calls tables

**Tests:**
- Unit: manifest discovery works
- Unit: workflow/activity names follow convention
- Integration: solution gating works (enabled vs disabled)

**Verification gate:**
```bash
uv sync  # registers entry points
uv run pytest solutions/outbound_campaigns/tests/ --tb=short -q
uv run pyright solutions/outbound_campaigns/src/
```

**Context budget:** ~50K tokens
**Depends on:** Phase 3.0, 3.1
**Can run in parallel with:** Wave 4

---

#### Phase 3.4: Platform-core capability contracts (integration interfaces) [DONE]

**Objective:** Define the stable integration contracts in platform-core so capabilities and tenant-specific adapters can evolve independently (diamond dependency through platform-core, no cross-solution imports).

**Input:**
- Architecture doc Section 4.1 (product-line architecture), Section 7.1 (solutions), adapter dependency rules

**Deliverables:**
- `packages/platform-core/src/platform_core/contracts/`:
  - `SchedulingAPI` protocol (read/write availability and schedule updates)
  - `CRMClient` protocol (lead delivery and updates)
  - `NotificationSender` protocol (email/SMS/WhatsApp dispatch)
- Adapter resolution hook in platform-core (registry or DI factory) that selects the tenant's configured adapter implementation at runtime
- Unit tests: contracts import boundary and adapter loading

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~35K tokens
**Depends on:** Phase 1.0
**Can run in parallel with:** Phase 3.2, 3.3

---

#### Phase 3.5: Solution scaffold — lead_capture (VOX website sales agent) [DONE]

**Objective:** Scaffold `lead_capture` as a capability solution for lead qualification and structured lead delivery (web chat UI is out of scope for this epic; API + workflows + integrations are in scope).

**Input:**
- Architecture doc Section 7 (solution model), Section 7.8 (config merge)

**Deliverables:**
- `solutions/lead_capture/` solution package with entry point
- Manifest contributions:
  - Plugin/tool(s) for lead qualification + structured capture
  - Optional API router(s) for lead submission / lead status
  - Workflow(s) for follow-up trigger handoff to `lead_nurture` (by string name, gated)
- Integration through `CRMClient` contract (Phase 3.4)

**Tests:**
- Unit: discovery + gating (enabled vs disabled)
- Unit: tool/plugin naming convention and collision behavior

**Verification gate:**
```bash
uv sync
uv run pytest solutions/lead_capture/tests/ --tb=short -q
uv run pyright solutions/lead_capture/src/
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.0, 3.1, 3.4
**Can run in parallel with:** Wave 4

---

#### Phase 3.6: Solution scaffold — notifications (multi-channel dispatch) [DONE]

**Objective:** Scaffold `notifications` as a capability solution providing multi-channel dispatch, templates, and delivery logs.

**Input:**
- Architecture doc Section 10 (communication patterns), Section 11.3 (data protection), Section 15 invariant #9 (audit append-only)

**Deliverables:**
- `solutions/notifications/` solution package with entry point
- `NotificationSender` integration via platform-core contract (Phase 3.4)
- Minimal delivery log table(s) (tenant schema) and activity to write delivery outcomes

**Tests:**
- Unit: discovery + gating
- Unit: sender adapter selection by tenant config

**Verification gate:**
```bash
uv sync
uv run pytest solutions/notifications/tests/ --tb=short -q
uv run pyright solutions/notifications/src/
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.0, 3.1, 3.4
**Can run in parallel with:** Wave 4

---

#### Phase 3.7: Solution scaffold — schedule_management (VOX planning automation) [DONE]

**Objective:** Scaffold `schedule_management` for natural-language schedule change workflows with validation and safe execution via a tenant adapter.

**Input:**
- Architecture doc Sections 6.5 (tenant lifecycle), 7 (solutions), 10 (webhooks/integrations)

**Deliverables:**
- `solutions/schedule_management/` solution package with entry point
- Uses `SchedulingAPI` contract (Phase 3.4) for read/write operations
- Workflow shape: parse → validate → confirm → execute → notify (notification dispatch via `notifications` solution if enabled)

**Tests:**
- Unit: discovery + gating
- Unit: validation path produces explainable conflict output shape

**Verification gate:**
```bash
uv sync
uv run pytest solutions/schedule_management/tests/ --tb=short -q
uv run pyright solutions/schedule_management/src/
```

**Context budget:** ~50K tokens
**Depends on:** Phase 3.0, 3.1, 3.4
**Can run in parallel with:** Wave 4

---

#### Phase 3.8: Solution scaffold — operations_monitor (overdue task safety net) [DONE]

**Objective:** Scaffold `operations_monitor` for background monitoring, escalation ladders, and "never leave a student uninformed" safeguards (VOX operations).

**Deliverables:**
- `solutions/operations_monitor/` solution package with entry point
- Workflow(s) that poll/subscribe to configured sources and escalate via `notifications`

**Tests:**
- Unit: discovery + gating
- Unit: escalation ladder state machine (remind → escalate → act)

**Verification gate:**
```bash
uv sync
uv run pytest solutions/operations_monitor/tests/ --tb=short -q
uv run pyright solutions/operations_monitor/src/
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.0, 3.1, 3.4, 3.6
**Can run in parallel with:** Wave 4

---

#### Phase 3.9: Solution scaffold — call_monitoring (NFQ call-ops capability) [DONE]

**Objective:** Scaffold `call_monitoring` for call quality scoring, post-call analysis templates, and operator escalation integration (real-time transcript + takeover UI is Phase 5.3; this phase defines the capability layer and data model).

**Deliverables:**
- `solutions/call_monitoring/` solution package with entry point
- Post-call analysis activity + schema (tenant tables) for:
  - transcript storage (post-call)
  - quality scores
  - escalation events / operator actions

**Tests:**
- Unit: discovery + gating
- Unit: post-call analysis schema validation

**Verification gate:**
```bash
uv sync
uv run pytest solutions/call_monitoring/tests/ --tb=short -q
uv run pyright solutions/call_monitoring/src/
```

**Context budget:** ~50K tokens
**Depends on:** Phase 3.0, 3.1, 3.4
**Can run in parallel with:** Wave 4

---

#### Phase 3.10: Solution scaffold — telematics_ingestion (multi-tenant webhooks) [DONE]

**Objective:** Provide a reference vertical ingestion solution that demonstrates secure, multi-tenant inbound webhooks (tenant resolved server-side from an authenticated key mapping, not from request payload) and drives workflows from external events.

**Input:**
- Architecture doc Section 10 (webhook security + multi-tenant tenant resolution), invariants #4 and #17

**Deliverables:**
- `solutions/telematics_ingestion/` solution package with entry point
- API router:
  - `POST /webhooks/telematics/{provider}` endpoint
  - Signature verification + `X-Webhook-Key-Id` lookup (platform-core helpers)
  - Idempotency using provider `event_id` recorded in `public.webhook_events`
- Workflow(s) started from webhook events (e.g., driver outreach / compliance checks) with deterministic workflow IDs derived from `(tenant_id, provider, event_id)`

**Tests (integration/e2e focus):**
- Integration: valid signed webhook resolves tenant via key id mapping and starts workflow
- Integration: wrong signature returns 401 with no side effects
- Integration: replayed `event_id` returns 2xx and does not start duplicate workflow

**Verification gate:**
```bash
uv sync
uv run pytest packages/platform-core/tests/e2e/test_solutions_integrations_compose_e2e.py -q
```

**Context budget:** ~45K tokens
**Depends on:** Phase 2.0 (webhook_endpoints + webhook_events), Phase 3.0, Phase 3.1
**Can run in parallel with:** Wave 4
