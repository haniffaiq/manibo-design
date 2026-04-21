# Execution Plan: Platform v3.0 — Wave 6: Hardening & Operations

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed
> **Completed:** 2026-02-22

### Wave 6: Hardening & Operations

---

#### Phase 6.0: Audit trail [DONE]

**Objective:** Implement append-only audit logging with INSERT-only DB role.

**Input:**
- Architecture doc Section 11.3, 15 invariant #9

**Deliverables:**
- `audit_writer` DB role — INSERT only, UPDATE/DELETE revoked
- Audit middleware: log state-changing operations
- PII pseudonymization: user_id references only, no raw PII

**Tests:**
- Integration: audit INSERT works with audit_writer role
- Integration: audit UPDATE fails with audit_writer role
- Unit: PII fields not stored in audit events

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Context budget:** ~30K tokens
**Depends on:** Phase 2.0 (public schema)
**Can run in parallel with:** Phase 6.1, 6.2

---

#### Phase 6.1: Usage metering [DONE]

**Objective:** Implement usage event tracking for LLM tokens, voice duration, STT/TTS.

**Input:**
- Architecture doc Section 10.1

**Deliverables:**
- LiteLLM CustomLogger callback for token counting
- Usage event Temporal activity
- VoiceCallWorkflow: accumulate voice metrics from signals, persist on completion

**Tests:**
- Unit: callback captures token counts
- Unit: usage events written to public.usage_events
- Integration: end-to-end metering for a conversation

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Context budget:** ~35K tokens
**Depends on:** Phase 5.1 (temporal worker)
**Can run in parallel with:** Phase 6.0, 6.2

---

#### Phase 6.2: Tenant provisioning/offboarding workflow [DONE]

**Objective:** Implement Temporal workflows for tenant lifecycle management per Section 6.5.

**Input:**
- Architecture doc Section 6.5
- Review finding ORCH-001: Saga/compensation pattern needed

**Deliverables:**
- `ProvisionTenantWorkflow`: set suspended → resolve tenant_schema (from public.tenants) → create schema → apply migrations → enable solutions → apply solution migrations → set active
- `OffboardTenantWorkflow`: suspend → grace period → delete grove rows → drop schema → clean up
- Compensation: if base tenant schema migration fails, drop schema and remove the (newly-created) tenant record
- Idempotent: re-running skips completed steps

**Reconciliation note (spec vs impl):**
- Per `wiki/architecture/architecture.md` §6.5.1 explicit scope, tenant record creation and initial users/memberships are API-layer responsibilities.
  The workflow assumes `public.tenants` already exists (so it can resolve `tenant_schema`) and does not create the initial admin user.

**Tests:**
- Unit: provisioning happy path
- Unit: provisioning failure at step 3 triggers compensation
- Unit: offboarding deletes all tenant data
- Integration: full provision + offboard cycle

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Context budget:** ~45K tokens
**Depends on:** Phase 2.0 (public schema), Phase 2.1 (RLS)
**Can run in parallel with:** Phase 6.0, 6.1

---

#### Phase 6.3: Observability foundation [DONE]

**Objective:** Implement structlog configuration, correlation ID propagation, and key metrics.

**Input:**
- Architecture doc Section 12
- Review findings OPS-003, OPS-006

**Deliverables:**
- structlog configuration: JSON output, tenant_id binding
- Correlation ID: W3C Trace Context header, propagated via Temporal HeaderCodec, passed to agent worker via room metadata
- Prometheus metrics: call_duration_seconds, calls_concurrent, llm_tokens_used, queue_depth
- Health endpoints for all services

**Tests:**
- Unit: correlation ID propagation across request → activity
- Unit: metrics exported in Prometheus format
- Unit: health endpoint returns service status

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
```

**Context budget:** ~40K tokens
**Depends on:** Phase 5.0 (API), Phase 5.1 (worker)
**Can run in parallel with:** Phase 6.0, 6.1, 6.2

---

#### Phase 6.4: Model catalog + policy enforcement [DONE]

**Objective:** Prevent "arbitrary model string" configuration drift by enforcing a deployment-defined model catalog and per-tenant model policy (voice vs chat constraints, allowlists, fallbacks).

**Input:**
- Architecture doc Section 7.8.1 (Model catalog and policy)

**Deliverables:**
- Model catalog representation (deployment-level) with channel/capability constraints
  - Stored as deployment-owned YAML (versioned, code-reviewed) and loaded at startup
  - Tenant overrides only apply allowlist overlays (subset), never introduce new models/providers
- Policy checks in config resolution:
  - reject configs referencing models outside catalog/policy
  - support fallback chains (voice-optimized)
- Documentation of cost/latency guardrails and how policy ties into metering

**Tests (integration/e2e focus):**
- Integration: tenant config selecting a disallowed model is rejected deterministically
- Integration: voice channel rejects a chat-only model class
- Integration: fallback model selected on simulated provider failure and emits an ops/audit event

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/agent-worker/tests/ --tb=short -q
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.2 (config merge), Phase 6.1 (metering hooks for enforcement)
**Can run in parallel with:** Phase 6.5, 6.6

---

#### Phase 6.5: Approval checkpoint primitives (plan → validate → confirm) [DONE]

**Objective:** Standardize safety-critical workflow checkpoints (schedule changes, destructive ops) as a reusable pattern: compute plan, present diff, wait for approval signal, then execute idempotently.

**Input:**
- Architecture doc Section 9.1 (Approval checkpoint pattern), VOX scheduling requirements

**Deliverables:**
- Shared approval types (proposal/diff shape, approve/reject signals, timeout semantics)
- Audit integration: every approve/reject recorded with actor + reason
- Reference integration in `schedule_management` workflow shape (even as scaffold): plan → validate → confirm → execute

**Tests (integration/e2e focus):**
- Integration: schedule change proposal created and workflow blocks until approval signal
- Integration: reject signal aborts without executing side effects
- Integration: timeout escalates to operator event (no side effects)

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~45K tokens
**Depends on:** Phase 6.0 (audit), Phase 3.7 (schedule_management scaffold)
**Can run in parallel with:** Phase 6.4, 6.6

---

#### Phase 6.6: Evaluation suites (golden traces) release gates [DONE]

**Objective:** Add a shared evaluation harness and per-solution golden traces to gate prompt/model/workflow changes. This is how you stop regressions before they hit customers.

**Input:**
- Architecture doc Section 14.1 (Evaluation suites)

**Deliverables:**
- `tests/evals/` harness that can run:
  - chat traces (ConversationWorkflow)
  - voice traces (VoiceCallWorkflow) using stored transcripts / simulated signals
- Per-solution eval packs (initial set):
  - VOX lead capture trace(s): required extraction fields + escalation behavior
  - NFQ call monitoring trace(s): QA scoring shape + operator escalation trigger
- CI gate wiring: evaluation failures fail the build

**Tests (e2e focus):**
- E2E: run eval suite locally against deterministic fixtures and assert pass/fail semantics
- E2E: regression test demonstrating a failing trace blocks CI (one intentionally failing fixture kept as a negative control)

**Verification gate:**
```bash
uv run pytest tests/evals/ -v --tb=short
```

**Context budget:** ~50K tokens
**Depends on:** Phase 4.4 (transcript persistence shapes), Phase 3.5/3.9 (solution scaffolds), Phase 5.1 (worker wiring)
**Can run in parallel with:** none — gates releases

---

#### Phase 6.7: Architecture invariants CI tests [DONE]

---

## Completion Evidence (2026-02-22)

- Review tracker: platform-v3 consolidated review (archived)
- PASS evidence (representative):
  - P6.0: `packages/platform-core/tests/integration/test_audit_writer_activity.py:1`
  - P6.2: `packages/platform-core/tests/integration/test_tenant_lifecycle_workflows.py:1`
  - P6.3: `apps/temporal-worker/src/temporal_worker/health.py:1`
  - P6.7: `.github/workflows/ci.yml:164` runs `uv run pytest tests/architecture/ -v --tb=short`

**Objective:** Implement CI test suite enforcing all architecture invariants from Section 15.

**Input:**
- Architecture doc Section 15

**Deliverables:**
- `test_architecture_invariants.py` — one test per invariant
- Tests cover: RLS context, request scope declaration, deployment-scoped isolation, no header-based tenant, RS256 only, JWKS restriction, role from DB, solution enablement closure, audit append-only, Grove independence, cross-tenant from public, agent-worker no-DI, room metadata server-only, backward-compatible deployments, migration idempotency, signal gating, webhook authenticity, operator takeover control, solution lifecycle + migration state, migration locking/idempotency, Temporal workflow versioning + rollout compatibility, build-time exclusion proof, secrets contract, correlation propagation

**Tests:**
- One test per invariant

**Verification gate:**
```bash
uv run pytest tests/architecture/ -v --tb=short  # all invariants passed
uv run ruff check . --exclude=.venv
uv run ruff format --check . --exclude=.venv
```

**Context budget:** ~40K tokens
**Depends on:** All prior waves
**Can run in parallel with:** none — final gate
