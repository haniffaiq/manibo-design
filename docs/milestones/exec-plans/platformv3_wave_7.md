# Execution Plan: Platform v3.0 — Wave 7: Control Plane & Release Governance

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Active

### Wave 7: Control Plane & Release Governance

---

## Status Map (2026-02-22)

Open (NOT IMPLEMENTED) phases tracked in the current review/audit docs:
- P7.8, P7.10, P7.15-P7.17 (and re-homed P7.18-P7.25)

Note: Some phases originally drafted under “Wave 7” are now explicitly **re-homed** into Wave 8 (Hoptrans delivery) and
Wave 9 (VOX Phase 1 + platform completeness) to keep this file focused on control plane + governance.

Resolved since last review snapshot:
- P7.5 (2026-02-22): LiveKit room metadata now includes `correlation_id` and has an end-to-end integration proof gate.
- P7.7 (2026-02-22): Schema registry ("ontology-lite") implemented with fail-closed boundary validation + compose E2E gate in CI.
- Call-monitoring backend slice (2026-02-28): active calls API (`GET /calls/active`) and live transcript SSE (`GET /calls/{call_id}/transcript/stream`) are integration-gated via `apps/api/tests/integration/test_calls.py` and `apps/api/tests/integration/test_calls_transcript_stream.py`.
- Call-monitoring escalation controls (2026-02-28): observer token minting (`POST /calls/{call_id}/livekit-token`) and manual takeover signaling (`POST /calls/{call_id}/takeover`) are integration-gated via `apps/api/tests/integration/test_calls.py`.
- Call-recording playback APIs (2026-02-28): recording listing + signed URL minting remain tenant/role gated and are covered by `apps/api/tests/integration/test_recordings.py`.
- Agent-management deployment governance slice (2026-02-28): deployment-scoped admin routes now have explicit integration proof for create/publish/rollback and tenant-isolated deployments in `apps/api/tests/integration/test_agents.py` (gate: `uv run pytest apps/api/tests/integration/test_agents.py -q --tb=short`).
- Agent-management tenant override slice (2026-02-28): client-admin overrides for instruction text and business variables are integration-gated in `apps/api/tests/integration/test_agent_definitions.py` (gate: `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`).
- Guardrails policy-pack slice (2026-02-28): configurable guardrails are compile-time enforced at publish and fail closed on unknown pack refs, gated by `packages/platform-core/tests/integration/test_agent_governance_registry.py` (`uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -k guardrails -q --tb=short`).

Sources:
- `wiki/architecture/ci.md`
- `wiki/architecture/ci.md`

---

#### Phase 7.0: Tenant DB context API hardening (asyncpg + psycopg) and architecture enforcement

**Objective:** Harden tenant-scoped DB access so asyncpg and psycopg usage cannot bypass the tenant transaction/context helper.

**Deliverables:**
- Tenant transaction/context helper used by API + workers (sets `SET LOCAL app.tenant_id` + `search_path`)
- Architecture test preventing raw `grove.*` access in tenant-scoped code paths without the helper

**Tests:**
- Architecture test fails on forbidden access patterns

**Verification gate:**
```bash
uv run pytest tests/architecture/ -v --tb=short
```

**Context budget:** ~25K tokens
**Depends on:** Phase 2.1, Phase 2.3
**Can run in parallel with:** Phase 7.1-7.4

---

#### Phase 7.1: Solution lifecycle + migration runner

**Objective:** Implement explicit solution lifecycle state per tenant and a safe migration runner with `public.solution_migration_state` semantics.

**Deliverables:**
- Solution lifecycle state machine (desired vs active version) tied to `public.solution_migration_state`
- Migration runner: advisory locks, idempotency, and resumable execution

**Tests:**
- Integration: concurrent upgrade attempts serialize via advisory lock
- Integration: re-run is idempotent and preserves correct state

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Context budget:** ~45K tokens
**Depends on:** Phase 2.0, Phase 3.0
**Can run in parallel with:** Phase 7.0, 7.2, 7.3

---

#### Phase 7.2: Temporal workflow versioning + worker rollout compatibility (determinism gates)

**Objective:** Ensure workflow evolution is deterministic and worker rollouts do not break in-flight workflows.

**Deliverables:**
- Determinism/versioning policy for workflow changes (additive-only vs versioned names)
- Rollout compatibility approach validated for mixed worker versions

**Tests:**
- Unit/integration: determinism gate catches non-deterministic changes

**Verification gate:**
```bash
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~40K tokens
**Depends on:** Phase 1.3, Phase 5.1
**Can run in parallel with:** Phase 7.0, 7.1, 7.3

---

#### Phase 7.3: Build-time artifact exclusion enforcement + CI proof

**Objective:** Enforce build-time exclusion of non-allowlisted solutions and prove it in CI.

**Deliverables:**
- Allowlist of solutions per deployment profile
- CI verification: excluded solution entry points are absent; discovery returns allowlist only
- Build profiles match Architecture Section 13.5:
  - Each profile has its own dependency list (dedicated `pyproject.toml` or equivalent lock input)
  - Container builds use selective COPY of only required packages/solutions (no `COPY . .`)
  - Licensed/Single-Tenant artifacts prove excluded solution code is physically absent (not just runtime-gated)

**Tests:**
- Architecture/CI test validating entry points absent for excluded solutions
- CI build proof: build a Licensed/Single-Tenant profile artifact and assert excluded packages cannot be imported and have no entry points

**Verification gate:**
```bash
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

**Context budget:** ~30K tokens
**Depends on:** Phase 3.0, Phase 3.1
**Can run in parallel with:** Phase 7.0-7.2, 7.4

---

#### Phase 7.4: Secrets contract implementation

**Status:** Done (2026-02-24)

**Objective:** Implement a secrets contract (SecretRef + provider) so no plaintext secrets are stored in DB/logs/config and rotation is expected.

**Deliverables:**
- `SecretRef` type + secret provider interface; runtime resolution only
- Redaction/validation preventing plaintext secrets in logs and stored config

**Tests:**
- Unit: SecretRef validation
- Unit/architecture: redaction prevents accidental logging

**Evidence (implementation + enforcement):**
- Secret contract: `packages/platform-core/src/platform_core/secrets/provider.py`
- Dev/test provider: `packages/platform-core/src/platform_core/secrets/env_provider.py`
- Config validation gate: `packages/platform-core/src/platform_core/config/merge.py`
- Audit metadata redaction gate: `packages/platform-core/src/platform_core/audit/writer.py`
- Webhook signature auth uses SecretRef resolution: `packages/platform-core/src/platform_core/webhooks/inbound.py`

**Evidence (tests):**
- Unit: `packages/platform-core/tests/unit/test_secrets/test_provider.py`
- Unit: `packages/platform-core/tests/unit/test_audit/test_writer.py`
- Unit: `packages/platform-core/tests/unit/test_solutions/test_config_model.py`
- Architecture: `tests/architecture/test_architecture_invariants.py`
- E2E usage proof (webhook secret_ref): `packages/platform-core/tests/e2e/test_solutions_integrations_compose_e2e.py`

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Context budget:** ~30K tokens
**Depends on:** Phase 2.0
**Can run in parallel with:** Phase 7.0-7.3

---

#### Phase 7.5: End-to-end correlation propagation proof (API -> Temporal -> LiveKit)

**Status:** Done (2026-02-22)

**Objective:** Prove correlation ID propagation across API -> Temporal -> LiveKit boundaries and gate regressions with an integration test.

**Deliverables:**
- Mandatory correlation/trace ID propagated via HTTP headers, Temporal headers, and LiveKit room metadata
- Integration test gate proving propagation end-to-end

**Evidence (webhook → LiveKit metadata):**
- Implementation: `packages/platform-core/src/platform_core/voice/webhook.py` writes `correlation_id` into the room metadata payload.
- Tests: `packages/platform-core/tests/unit/test_voice/test_webhook.py` asserts header precedence + deterministic fallback + bound context during Temporal start.
- Integration proof gate: `packages/platform-core/tests/integration/test_correlation_propagation.py` verifies `traceparent` reaches Temporal headers and LiveKit room metadata using a real LiveKit server (Docker) and Temporal test server.

**Tests:**
- Integration: correlation ID is observable at each boundary

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/integration/test_correlation_propagation.py -v --tb=short
```

**Context budget:** ~35K tokens
**Depends on:** Phase 6.3, Phase 4.0, Phase 5.0, Phase 5.1, Phase 5.2
**Can run in parallel with:** none

---

#### Phase 7.6: Agent registry + lifecycle governance (draft/review/publish/retire)

**Objective:** Implement the missing "Agent Management Platform" foundation (Kore.ai / Palantir agent lifecycle) as backend primitives: governed agent definitions, versioning, approvals, and controlled rollout — without building a full UI.

Why this matters: without an agent registry + lifecycle, you are not building a platform, you're shipping YAML files and praying.

**Status:** Done (2026-02-24)

**Input:**
- Architecture doc Section 14.4 (Control Plane, Versioning, and Release Governance)
- Architecture doc Section 7.8 (YAML configuration hierarchy + compilation)

**Deliverables:**
- Public schema tables (minimal, STTCPW):
  - `public.agent_definitions` (tenant-scoped): identity, name, current status, created_by, timestamps
  - `public.agent_definition_versions` (append-only): version number, YAML source, compiled/resolved config hash, referenced solution set, model policy snapshot ref
  - `public.agent_definition_reviews` (approval trail): submitted_by, approved_by, decision, reason, decided_at
- API endpoints (tenant-scoped, RBAC):
  - create agent, submit for review, approve/reject, publish, retire
  - get active/published version and compiled config artifact for runtime
- Runtime contract:
  - Agent workers and API never load "random YAML from disk" in production code paths; they load a compiled artifact by `(tenant_id, agent_id, version)` (defense-in-depth)
  - Publishing is a state transition with audit events and an immutable version record
- Integration with Wave 3 config compiler:
  - On version creation: compile `platform < solution templates < tenant overrides` and store the resolved artifact + hash
  - Persist referenced solutions/plugins/tools list for later gating checks and debugging
  - Fail-closed if no platform defaults version exists (platform defaults are real DB state, not implied defaults)

**Tests (integration focus):**
- Integration: cannot publish without an approval record (ClientAdmin only)
- Integration: publishing persists immutable version + resolved config hash; subsequent edits create a new version
- Integration: agent worker fetch of compiled artifact is deterministic and rejects missing/retired agents

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -v --tb=short
uv run pytest apps/api/tests/integration/test_agent_definitions.py -v --tb=short
```

**Evidence (implemented):**
- Public schema tables + constraints: `packages/platform-core/src/platform_core/alembic_public/versions/20260224_090000_agent_registry_governance.py`
- Platform defaults versions (Wave 3 merge Layer 1): `packages/platform-core/src/platform_core/alembic_public/versions/20260224_091000_platform_defaults_versions.py`
- Governance service (draft → review → approve/reject → publish → retire) + artifact fetch contract: `packages/platform-core/src/platform_core/agents/governance.py`
- Wave 3 compiler (platform defaults < solution templates < tenant overrides): `packages/platform-core/src/platform_core/agents/compiler.py`, `packages/platform-core/src/platform_core/config/platform_defaults_store.py`
- Solution template contract + example template: `packages/platform-core/src/platform_core/solutions/manifest.py`, `solutions/lead_capture/src/lead_capture/agent_template.py`
- API endpoints (tenant-scoped RBAC): `apps/api/src/platform_api/routes/agent_definitions.py`
- Platform defaults seeding API (deployment scope): `apps/api/src/platform_api/routes/platform_defaults.py`
- API wiring: `apps/api/src/platform_api/main.py`
- Integration tests (behavioral): `packages/platform-core/tests/integration/test_agent_governance_registry.py`, `apps/api/tests/integration/test_agent_definitions.py`
- Tier 0 compose E2E: `packages/platform-core/tests/e2e/test_wave7_agent_governance_compose.py`

**Context budget:** ~55K tokens
**Depends on:** Phase 3.2 (config merge), Phase 6.0 (audit trail), Phase 2.0 (public schema)
**Can run in parallel with:** Phase 7.0-7.4

---

#### Phase 7.7: Schema registry ("ontology-lite") + validation enforcement

**Objective:** Implement the "ontology-lite" foundation from the architecture doc so events/extractions have typed schemas and are validated at every boundary (webhooks, extraction outputs, workflow triggers). This is the non-delusional version of Palantir's ontology: enough structure to be safe and interoperable, not a taxonomy time-sink.

**Input:**
- Architecture doc Section 14.2 (Schema Registry / Ontology-Lite)
- Architecture invariants: webhook authenticity + validation semantics (Section 15)

**Deliverables:**
- `platform-core/contracts/schema_registry.py` (or equivalent):
  - Registry keyed by `(namespace, name, version)`
  - JSON schema (or Pydantic model) representation + canonical serialization hash
- Conventions:
  - Shared schemas live in platform-core contracts
  - Solution-owned schemas live inside the solution package and register via entry points
- Enforcement points:
  - Webhook ingestion validates payloads against registered schemas before any side effects
  - Extraction activities validate outputs against schema before persisting
  - Workflow triggers reject unknown/unversioned schema payloads (fail-closed)

**Tests:**
- Unit: schema registration collisions rejected deterministically
- Integration: webhook payload with unknown schema version is rejected with 4xx and no side effects
- Integration: extraction output failing schema validation does not persist and emits an ops/audit event

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Evidence (implemented):**
- Schema registry: `packages/platform-core/src/platform_core/contracts/schema_registry.py`
- Built-in/shared schemas: `packages/platform-core/src/platform_core/contracts/builtin_schemas.py`
- Webhook enforcement (fail-closed): `packages/platform-core/src/platform_core/webhooks/router.py`
- Extraction validation + persistence gate: `apps/temporal-worker/src/temporal_worker/activities/extraction.py`, `apps/temporal-worker/src/temporal_worker/activities/call_extraction_persistence.py`
- Workflow trigger validation (fail-closed): `apps/temporal-worker/src/temporal_worker/activities/workflow_triggers.py`
- Unit tests: `packages/platform-core/tests/unit/test_contracts/test_schema_registry.py`
- Integration tests: `packages/platform-core/tests/integration/test_schema_registry_enforcement.py`
- Compose E2E harness + tests: `docker-compose.yml` (`--profile e2e`), `packages/platform-core/tests/e2e/test_schema_registry_compose.py`
- CI job: `.github/workflows/ci.yml` (`platform-e2e`)

**Context budget:** ~45K tokens
**Depends on:** Phase 3.0 (solution discovery), Phase 2.0 (public schema), Phase 6.0 (audit trail)
**Can run in parallel with:** Phase 7.0-7.6

---

#### Phase 7.8: Knowledge base + retrieval ("Agent Context") foundation (RAG without cosplay)

**Objective:** Add the missing "Search & Data AI (Agent Context)" foundation (Kore.ai) needed for support triage and other context-heavy use cases: ingestion + indexing + retrieval contract, with a single boring reference implementation.

This is not "build a knowledge graph." Start with: documents → chunks → embeddings → retrieval. Anything more in v1 is cosplay.

**Input:**
- Architecture doc Section 14 (Use Case mapping includes "Knowledge Base" capability)
- Architecture doc Section 4.1 (capability contracts)

**Deliverables:**
- Platform-core contract interfaces:
  - `KnowledgeSource` (ingestion of docs/articles/FAQs)
  - `KnowledgeIndex` (upsert chunks + search(query) with filters)
- Reference storage implementation:
  - Postgres-based with pgvector (preferred STTCPW: one database, not a new service) using tenant schemas for tenant-owned knowledge data
  - Minimal tables: documents, chunks, embeddings, metadata, ingestion_jobs
- Agent integration:
  - A Grove tool (solution-owned or platform-core tool contract) that calls `KnowledgeIndex.search()` and returns citations/snippets
  - Gated by tenant enablement (knowledge capability must be enabled)

**Tests (behavioral):**
- Integration: ingest → search returns relevant chunk(s) with deterministic ordering + tenant isolation
- Integration: retrieval tool refuses access when knowledge capability not enabled for tenant

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~60K tokens
**Depends on:** Phase 3.4 (capability contracts), Phase 2.1 (RLS), Phase 7.0 (tenant DB context hardening)
**Can run in parallel with:** Phase 7.1-7.4

---

#### Phase 7.9: Connector registry + integration health (enterprise integrations baseline)

**Status:** Done (2026-02-24)

**Objective:** Add the missing integration foundation behind "100+ connectors" marketing: a boring connector registry, credential contract, and health checks. This makes adapters operable at scale without per-tenant snowflakes.

**Input:**
- Architecture doc Section 4.1 (capability contracts + adapters)
- Architecture doc Section 11.3 (secrets contract) and audit requirements

**Deliverables:**
- Public schema tables:
  - `public.connectors` (tenant-scoped instances): connector type, display name, status, config (SecretRef only), created_by
  - `public.connector_health` (append-only): last_check_at, status, error codes (no secrets)
- Connector discovery:
  - Connector implementations are provided by adapter packages (installable) and discovered via entry points (same "installed-only discovery" principle as solutions)
- Enforcement:
  - Tenant-scoped workflows that depend on connectors fail fast with explicit errors when connector health is failing/missing
  - Any connector config write is audited; secret material is never stored (SecretRef only)

**Tests:**
- Integration: connector config rejects plaintext secrets (must be SecretRef)
- Integration: connector health check results are tenant-isolated and append-only

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Evidence (implemented):**
- Public schema tables + constraints + append-only triggers: `packages/platform-core/src/platform_core/alembic_public/versions/20260224_092000_connector_registry_and_health.py`
- Connector service (create/update, health checks, SecretRef-only config validation): `packages/platform-core/src/platform_core/connectors/service.py`
- Store (public.connectors + public.connector_health access): `packages/platform-core/src/platform_core/connectors/store.py`
- API endpoints (tenant-scoped RBAC + health-check workflow kickoff): `apps/api/src/platform_api/routes/connectors.py`
- Temporal activity + workflow (health check execution): `apps/temporal-worker/src/temporal_worker/activities/connectors.py`, `apps/temporal-worker/src/temporal_worker/workflows/connector_health_check.py`
- Integration tests: `packages/platform-core/tests/integration/test_connector_registry_and_health.py`
- Compose E2E: `packages/platform-core/tests/e2e/test_wave7_connectors_compose.py`

**Evidence (tests):**
```bash
uv run pytest \
  solutions/lead_capture/tests/unit/test_lead_capture_config_adapter_selection.py \
  solutions/schedule_management/tests/unit/test_schedule_management_config_adapter_selection.py \
  solutions/notifications/tests/unit/test_notifications_config_adapter_selection.py \
  packages/platform-core/tests/integration/test_connector_registry_and_health.py \
  -v --tb=short

# 5 passed

tools/scripts/compose-worktree.sh up-e2e
tools/scripts/compose-worktree.sh test-e2e

# 49 passed, 2 skipped
```

**Context budget:** ~45K tokens
**Depends on:** Phase 7.4 (secrets contract), Phase 6.0 (audit trail), Phase 3.4 (capability contracts)
**Can run in parallel with:** Phase 7.1-7.3, 7.6-7.8

---

#### Phase 7.10: Release units + governed rollout (package/release/deploy primitives)

**Objective:** Implement the missing "package, release, deploy" foundation (Palantir / Kore.ai "Versions") as explicit release units that bundle governed artifacts and allow controlled rollout per tenant — without inventing a bespoke CI/CD system inside the app.

If you skip this, "publish" becomes an unaudited pile of mutable configuration. That is not enterprise-ready; it's chaos with invoices.

**Input:**
- Architecture doc Section 14.4 (release unit + promotion requirements)

**Deliverables:**
- Public schema tables (deployment-owned):
  - `public.releases`: immutable release records (id, name, created_by, created_at, notes)
  - `public.release_components`: referenced solution versions, model catalog/policy version, platform defaults version, agent definition version pins
  - `public.tenant_release_assignments`: desired vs active release per tenant with rollout state (pending/running/applied/failed)
- Enforcement:
  - Creating a release fails if it references solutions not installed in the deployment
  - Activating a release for a tenant triggers: solution migration runner + agent compiled artifact refresh + audit trail
  - Rollout state is authoritative and resumable (fail-closed)

**Tests (integration focus):**
- Integration: release creation rejects references to non-installed solutions
- Integration: tenant assignment triggers migration runner and transitions state correctly on success/failure
- Integration: audit events emitted for release create + tenant rollout actions

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
```

**Evidence (implemented):**
- Schema + migrations: `packages/platform-core/src/platform_core/alembic_public/versions/20260222_120000_release_units_and_rollout.py`
- Release primitives: `packages/platform-core/src/platform_core/releases/service.py`, `packages/platform-core/src/platform_core/releases/store.py`
- Agent compiled artifacts (tenant schema): `packages/platform-core/src/platform_core/alembic/versions/20260222_130000_agent_compiled_artifacts.py`
- Artifact refresh implementation: `packages/platform-core/src/platform_core/agents/artifacts.py`
- Public schema models: `packages/platform-core/src/platform_core/models/public_schema.py`
- Integration tests: `packages/platform-core/tests/integration/test_release_units_and_rollout.py`
- E2E wiring: `apps/api/src/platform_api/routes/releases.py`, `apps/temporal-worker/src/temporal_worker/workflows/release_rollout.py`
- Docker Compose harness (opt-in): `docker-compose.yml` (`--profile platform`)
- Opt-in E2E test: `apps/api/tests/e2e/test_release_rollout_compose_e2e.py`
- Worktree-scoped compose helper: `tools/scripts/compose-worktree.sh`, `tools/scripts/e2e-release-rollout.sh`

**Limitations (be honest):**
- No rollback/compensation semantics: a migration can succeed and artifact refresh can fail; rollout ends `failed` and must be re-run after fixing the cause.
- Concurrency is best-effort: advisory lock prevents two rollouts from running concurrently for the same tenant, but this is not a distributed scheduler or queueing system.
- "Artifact refresh" is *tenant-schema agent YAML compile+validate* into `agent_compiled_artifacts`. This is not the Phase 7.6 governed public agent registry (draft/review/publish) or a worker-facing immutable artifact contract yet.

**Context budget:** ~55K tokens
**Depends on:** Phase 7.1 (solution lifecycle + migration runner), Phase 6.0 (audit trail), Phase 6.4 (model policy). Phase 7.6 (agent registry) is still required for the *target* governed agent lifecycle; this phase compiles the current tenant-schema agents as an interim artifact refresh.
**Can run in parallel with:** Phase 7.2-7.4, 7.7-7.9

---

#### Phase 7.11: Call recordings + asset storage foundation (access + retention)

**Status:** Done (2026-02-24)

**Objective:** Close the gap between "LiveKit supports call recording egress" and an actual platform foundation: record where recordings live, control access per tenant, and enforce retention. Without this, your "compliance story" is mostly fiction.

**Input:**
- Architecture doc Section 11.3 (Data Protection: call recordings + retention)
- Architecture doc Section 8 (Voice) and Section 10 (LiveKit webhooks)

**Deliverables (STTCPW):**
- Storage contract in platform-core:
  - `StorageRef` type (bucket/container + object key + provider)
  - `SignedUrlProvider` interface (mint time-bound read URLs)
- Tenant schema tables:
  - `tenant_*/call_recordings` linking `call_id` → `StorageRef`, created_at, expires_at, status
- API endpoints (tenant-scoped, RBAC):
  - list recordings for a call
  - mint signed URL for a recording (ClientAdmin/ClientOperator), with audit event on access
- Retention enforcement:
  - Per-tenant retention config (days) applied by a scheduled Temporal workflow that marks expired recordings and deletes objects via activity (idempotent)

**Tests (integration focus):**
- Integration: signed URL minting is role-gated and audited (no anonymous access)
- Integration: cross-tenant access to recording refs is blocked by schema isolation + RBAC
- Integration: retention workflow deletes expired recordings idempotently

**Evidence (implemented + wired):**
- Storage contracts + provider factory: `packages/platform-core/src/platform_core/recordings/types.py`, `packages/platform-core/src/platform_core/recordings/factory.py`
- S3/MinIO backend provider: `packages/platform-core/src/platform_core/recordings/s3_provider.py`
- Tenant schema recording metadata + status: `packages/platform-core/src/platform_core/alembic/versions/20260224_150000_call_recordings_storage_ref_and_retention.py`
- Per-tenant retention config: `packages/platform-core/src/platform_core/alembic_public/versions/20260224_150500_tenant_recording_retention_config.py`
- API endpoints + audit on access: `apps/api/src/platform_api/routes/recordings.py`, `apps/api/src/platform_api/routes/calls.py`
- API storage wiring: `apps/api/src/platform_api/main.py`
- Retention workflow + activity wiring: `packages/platform-core/src/platform_core/recordings/workflows.py`, `apps/temporal-worker/src/temporal_worker/activities/recordings.py`, `apps/temporal-worker/src/temporal_worker/worker.py`
- Retention schedule wiring (provision/offboard): `apps/temporal-worker/src/temporal_worker/activities/recording_retention_schedule.py`, `packages/platform-core/src/platform_core/tenancy/workflows.py`

**Evidence (tests):**
- Unit: `packages/platform-core/tests/unit/test_recordings/test_ref_parsing.py`
- Integration (API): `apps/api/tests/integration/test_recordings.py`
- Integration (Temporal+DB): `packages/platform-core/tests/integration/test_recordings_retention_workflow.py`
- Integration (schedule wired into lifecycle): `packages/platform-core/tests/integration/test_tenant_lifecycle_workflows.py`
- Compose E2E: `packages/platform-core/tests/e2e/test_wave7_recordings_retention_compose.py`

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
```

**Context budget:** ~55K tokens
**Depends on:** Phase 6.0 (audit trail), Phase 7.4 (secrets contract), Phase 5.0 (API), Phase 4.1 (LiveKit webhooks for inbound)
**Can run in parallel with:** Phase 7.6-7.10

---

#### Phase 7.12: Temporal payload hygiene (no-PII workflow inputs/outputs) + enforcement gate

**Objective:** Implement and enforce the architecture rule that Temporal workflow inputs/outputs must not contain PII. The Temporal UI is cross-tenant by nature; leaking PII into workflow payloads is an avoidable self-own.

**Status:** Done (2026-02-24)

**Input:**
- Architecture doc Section 9.4 (Temporal UI access control + payload constraints)
- Architecture doc Section 11.3 (Data Protection)

**Deliverables:**
- Target-state coding rule (platform-wide): workflow payloads contain IDs only; business data lives in PostgreSQL and is referenced by ID.
- Enforced today (fail-closed, shippable):
  - Temporal payload encryption codec is mandatory (SDK PayloadCodec) via `grove.temporal.data_converter.temporal_data_converter()`.
  - Keying: dev/test uses env-provided keys; production uses KMS-provisioned keys injected as environment variables into clients/workers. Rotation is supported via a keyring env var (multiple decrypt keys + one active encrypt key id).
  - PII/raw-content fields in workflow payload dataclasses are scanned and must be explicitly tracked as temporary exceptions (with a removal plan). This prevents “accidental” introduction of new PII fields while we burn down the remaining exceptions.
- Architecture test:
  - Scan workflow input/output dataclasses and reject fields likely to contain PII or raw content (`email`, `name`, `phone`, `address`, `transcript`, `content`, etc.)
  - Enforce wiring: all `Client.connect(...)` calls must pass a `data_converter` (codec cannot be bypassed)
- Documentation note: "Temporal payloads are identifiers only" with examples for new workflow authors

**Tests:**
- Unit: payload codec roundtrip + key-id handling
- Architecture: intentionally bad payload fixture fails the gate; `Client.connect(...)` wiring is enforced

**Verification gate:**
```bash
uv run pytest tests/architecture/ -v --tb=short
uv run pytest packages/grove/tests/unit/temporal/test_payload_codec.py -v --tb=short
```

**Context budget:** ~35K tokens
**Depends on:** Phase 6.7 (architecture test framework exists)
**Can run in parallel with:** Phase 7.2-7.11

---

#### Phase 7.13: Tenant state enforcement (active/suspended/offboarded) + fail-closed middleware

**Objective:** Make tenant lifecycle states real at runtime: when a tenant is suspended or offboarded, tenant-scoped API requests must be rejected immediately with no side effects. Tokens are not an authority for tenant status; the database is.

This is foundational for supportability and compliance. If "suspend" doesn't actually block the platform, it's theater.

**Input:**
- Architecture doc Section 6.5 (tenant lifecycle)
- Architecture doc Section 11 (tenant suspended behavior)
- Architecture invariants #29 (tenant state enforced)

**Deliverables:**
- Middleware hook in `apps/api/`:
  - On every tenant-scoped request: load `public.tenants.status` for the resolved tenant and enforce:
    - `active`: allow
    - `suspended`: 403 (no side effects)
    - `offboarded` (“deleted”): 410 (no side effects)
  - Must not be bypassable by internal routes, background tasks, or "trusted" callers
- Deployment-scoped admin endpoints:
  - Reject actions targeting offboarded tenants (already required by architecture doc)
- Tests:
  - Integration: suspended tenant token returns 403 consistently
  - Integration: offboarded tenant returns 410 consistently
  - Integration: side-effecting routes do not write anything when tenant is suspended/offboarded

**Verification gate:**
```bash
uv run pytest apps/api/tests/ --tb=short -q
```

**Context budget:** ~30K tokens
**Depends on:** Phase 2.0 (public.tenants), Phase 5.0 (API)
**Can run in parallel with:** Phase 7.6-7.12

---

#### Phase 7.14: Client-editable configuration boundaries (provider-managed vs tenant overrides)

**Objective:** Implement the NFQ "provider-managed" model properly: clients can edit only an explicit allowlist of fields (instructions, variables, approved model routing within policy). Anything provider-only (tools, workflow wiring, core prompt, plugin enablement beyond allowed set) must be rejected deterministically.

If you don't do this, you are back to RetellAI-style "clients can break everything," just with extra paperwork. Trash.

**Input:**
- NFQ Vision user story P3 (settings clients can modify)
- Architecture doc Section 7.8 (config hierarchy) and invariant #30 (bounded overrides)

**Deliverables (STTCPW):**
- Tenant override schema:
  - Define a strict Pydantic model for tenant overrides with `extra='forbid'`
  - Explicitly model which keys are tenant-editable (instructions, variables, approved model routing within policy)
  - Guardrail thresholds belong in Phase 7.16 (guardrails policy packs) once the schema exists
- Compilation enforcement:
  - Config compiler rejects unknown keys and provider-only fields in tenant overrides
  - Compile output includes a "diff summary" (what tenant changed) for audit + debugging
- API enforcement:
  - Tenant override update endpoint validates against the override schema (no raw YAML passthrough)
  - All updates are audited (who changed what, when)

**Tests:**
- Integration: tenant override attempting to set provider-only fields fails with 4xx and no state change
- Integration: allowed override fields succeed and affect compiled config deterministically

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
```

**Evidence (implemented):**
- Tenant override schema (explicit allowlist + `extra='forbid'`): `packages/platform-core/src/platform_core/agents/tenant_overrides.py`
- Tenant override persistence + fail-closed validation (secrets, model policy, plugin enablement) + audit diff summary (`changed_keys`): `packages/platform-core/src/platform_core/agents/tenant_overrides_store.py`
- Artifact fetch applies tenant overrides and recomputes `compiled_hash` from resolved config: `packages/platform-core/src/platform_core/agents/governance.py`
- API wiring:
  - Tenant-scoped override update + artifact fetch: `apps/api/src/platform_api/routes/agent_definitions.py`
  - Deployment-scoped admin endpoints for provider-managed lifecycle: `apps/api/src/platform_api/routes/admin_agent_definitions.py`
  - Closed legacy bypass: tenant-scoped `/agents` is read-only; provider-managed tenant-schema agents live under `/admin/tenants/{tenant_id}/agents`:
    - Tenant: `apps/api/src/platform_api/routes/agents.py`
    - Admin: `apps/api/src/platform_api/routes/admin_agents.py`
  - Router registration: `apps/api/src/platform_api/main.py`
- Public schema migration (tenant overrides table + updated_at trigger): `packages/platform-core/src/platform_core/alembic_public/versions/20260224_093000_agent_definition_tenant_overrides.py`

**Evidence (tests):**
```bash
uv run pytest packages/platform-core/tests/unit/test_agents/test_tenant_overrides.py -q
uv run pytest apps/api/tests/integration/test_agent_definitions.py -q
uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -q

tools/scripts/compose-worktree.sh test-e2e
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.2 (config merge), Phase 6.0 (audit trail), Phase 7.6 (agent registry)
**Can run in parallel with:** Phase 7.7-7.12

---

#### Phase 7.15: Business analytics + KPI reporting foundation (VOX/NFQ baseline)

**Objective:** Provide the missing "analytics/reporting" foundation required by VOX REQ-T05 and NFQ call monitoring analytics: a stable event model and queryable KPI endpoints. Observability metrics are not a product dashboard.

If you skip this, you'll ship "automation" with no way to prove impact. That's not a platform, it's vibes.

**Input:**
- VOX requirements REQ-T05 in `docs/requirements/vox.md`
- NFQ call monitoring stories in `docs/requirements/nfq.md`
- Architecture invariants: cross-tenant analytics from `public.*` only

**Deliverables (STTCPW):**
- Public schema tables:
  - `public.kpi_events` (append-only): `(tenant_id, event_type, entity_type, entity_id, occurred_at, payload_json)`
  - Minimal event types: `lead.captured`, `lead.escalated`, `lead.converted`, `followup.sent`, `schedule.change_proposed`, `schedule.change_executed`, `notification.sent`, `call.completed`, `call.escalated`
- Aggregation queries (server-side):
  - Response time distribution (website inquiry → first response)
  - Lead funnel counts + conversion rate
  - Follow-up volume + response rate
  - Schedule change throughput + conflict rate
  - Notification delivery success rate
- API endpoints:
  - Tenant-scoped `/reports/*` endpoints returning time-bucketed KPIs
  - Deployment-scoped rollups (public-only) for SuperAdmin

**Status:** Done (2026-02-24)

**Evidence (implemented + wired):**
- Public schema event table: `packages/platform-core/src/platform_core/alembic_public/versions/20260224_160000_kpi_events.py`
- KPI aggregation query store: `packages/platform-core/src/platform_core/reports/kpi.py`
- Call KPI emission on post-call trigger execution (public-only): `apps/temporal-worker/src/temporal_worker/activities/workflow_triggers.py`
- API endpoints:
  - Tenant-scoped: `apps/api/src/platform_api/routes/reports.py`
  - Deployment-scoped: `apps/api/src/platform_api/routes/reports.py`
- Router registration: `apps/api/src/platform_api/main.py`

**Evidence (tests):**
- Integration (tenant isolation + offboarded blocked; admin public-only shadowing guard): `apps/api/tests/integration/test_reports_kpis.py`

**Tests:**
- Integration: KPI events are tenant-isolated and queryable; deleted tenant data is excluded from tenant-scoped endpoints
- Integration: deployment-scoped KPI endpoint cannot read tenant schemas or grove tables

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
```

**Context budget:** ~50K tokens
**Depends on:** Phase 2.0 (public schema), Phase 5.0 (API), Phase 6.0 (audit trail)
**Can run in parallel with:** Phase 7.6-7.14

---

#### Phase 7.16: Guardrails policy packs + enforcement (what the agent must not promise)

**Objective:** Make VOX REQ-T04 real: configurable guardrails that are enforced (compile-time + runtime + eval gates), not just prompt text.

If "guardrails" are only in prose, they will be violated in production. Period.

**Status:** Done (2026-02-25)

**Evidence (implementation + wiring):**
- Policy packs (public schema): `packages/platform-core/src/platform_core/alembic_public/versions/20260225_110000_guardrails_policy_packs.py`
- Policy pack compilation: `packages/platform-core/src/platform_core/guardrails/store.py`, `packages/platform-core/src/platform_core/agents/compiler.py`
- Runtime enforcement (deterministic): `packages/grove/src/grove/runtime/guardrails.py`, `packages/grove/src/grove/runtime/guardrails_enforcement.py`, `packages/grove/src/grove/runtime/graph.py`
- Voice escalation path: `packages/grove/src/grove/temporal/inbound_call_workflow.py`, `packages/grove/src/grove/temporal/voice_call_workflow.py`, `packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py`
- Inbound DID dispatch uses governed artifacts (no YAML config paths): `packages/platform-core/src/platform_core/alembic_public/versions/20260225_110500_phone_numbers_agent_definition_ref.py`, `packages/platform-core/src/platform_core/voice/webhook.py`, `apps/api/src/platform_api/routes/internal_agent_config.py`, `packages/grove-voice-livekit/src/grove_voice_livekit/metadata.py`

**Evidence (tests):**
- Unit: `packages/platform-core/tests/unit/test_guardrails/test_policy_validation.py`, `packages/grove/tests/integration/runtime/test_graph_integration.py`
- Integration: `packages/platform-core/tests/integration/test_agent_governance_registry.py`
- Eval gate: `tests/evals/`
- Compose E2E: `packages/platform-core/tests/e2e/test_wave7_agent_governance_compose.py`, `packages/platform-core/tests/e2e/test_voice_pipeline_compose.py`

**Input:**
- VOX requirements REQ-T04 and guardrail ownership in `docs/requirements/vox.md`
- Architecture doc: approval checkpoint pattern (for side effects) and evaluation suites

**Deliverables (minimal, enforceable):**
- Guardrails schema:
  - `GuardrailsPolicy` typed config (allowed claims, forbidden commitments, required disclosures, escalation triggers)
  - Stored as versioned policy pack per tenant (linked to agent definition version / release unit)
- Enforcement:
  - Compile-time: config compiler rejects unknown/invalid policy packs
  - Runtime: deterministic "commitment detector" (simple rules + regex + allowlist) flags high-risk outputs and forces escalation / inserts disclosure
  - Eval: at least one golden trace per solution asserting "forbidden promise never appears"
- Audit:
  - Any runtime guardrail violation (blocked/rewritten output) emits an audit + ops event for review

**Tests:**
- Unit: policy validation rejects invalid packs deterministically
- E2E: golden trace fails if a forbidden promise appears in output

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest tests/evals/ -v --tb=short
```

**Context budget:** ~55K tokens
**Depends on:** Phase 6.6 (eval harness), Phase 7.6 (agent registry), Phase 7.10 (release units)
**Can run in parallel with:** Phase 7.7-7.15

---

#### Phase 7.17: Pricing tiers + budgets + invoicing primitives (NFQ billing readiness)

**Objective:** Extend usage metering into actual billing foundations (NFQ pricing model) without building a full billing product. Metering without pricing/budgets is just a graph; it doesn't support contracts.

**Input:**
- NFQ billing model and provider story P8 in `docs/requirements/nfq.md`
- Architecture doc Section 10.1 (usage metering) and model policy budget enforcement (Section 7.8.1)

**Deliverables (STTCPW):**
- Public schema tables:
  - `public.pricing_tiers` (deployment-owned): rate cards (platform/minute, telephony passthrough flags), discounts
  - `public.tenant_plans` (tenant-owned): tier assignment, monthly budget limits, alert thresholds
  - `public.invoices` (append-only): monthly aggregates by tenant + line items derived from `public.usage_events`
- Budget enforcement hooks:
  - Hard cap option: reject new calls / new LLM requests when over budget (with explicit operator event)
  - Soft cap option: emit alerts and require manual override (approval checkpoint)
- Reporting endpoints:
  - Tenant-scoped "usage & cost" summary (month-to-date)
  - Deployment-scoped rollups for SuperAdmin (public-only)

**Tests:**
- Integration: invoice aggregation is deterministic from usage_events
- Integration: budget cap rejects new usage and emits audit + ops event

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
```

**Status:** Completed (2026-02-25)

**Wiring + coverage evidence (high signal):**
- Per-LLM-request enforcement hook (Grove, framework-safe): `packages/grove/src/grove/runtime/llm_request_policy.py`
- Platform policy endpoint (hard cap LLM enforcement): `apps/api/src/platform_api/routes/internal_llm_policy.py`
- Pricing tiers/tenant plans/invoices migrations: `packages/platform-core/src/platform_core/alembic_public/versions/20260224_210000_billing_primitives.py`
- Pricing for LLM/STT/TTS + invoicing: `packages/platform-core/src/platform_core/alembic_public/versions/20260225_090000_billing_pricing_rates_v1.py`
- Concurrency-safe reservations: `packages/platform-core/src/platform_core/alembic_public/versions/20260225_100000_budget_reservations_v1.py`
- Soft-cap approval API (operator path): `apps/api/src/platform_api/routes/approvals.py`
- Compose E2E regression for Wave 7 billing: `packages/platform-core/tests/e2e/test_wave7_billing_budget_enforcement_compose.py`
- Checklist closure update (2026-02-28):
  - Per-minute billing unit proven (`61s -> 2 minutes`) via `apps/api/tests/integration/test_billing.py`
  - Metering persistence to `public.usage_events` proven via `apps/temporal-worker/tests/integration/test_usage_db.py`
  - Real-time client-admin usage dashboard backend proven via tenant-scoped `GET /billing/usage` integration gate (`apps/api/tests/integration/test_billing.py`)
  - Tenant-plan API proven for per-tenant hard/soft budget + alert-threshold configuration (`PUT /admin/tenants/{tenant_id}/plan`) via `apps/api/tests/integration/test_billing.py`
  - Runtime hard/soft-cap enforcement proven via `apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py`
  - Pricing-tier volume-discount configuration (`discount_percent`) proven via `GET/POST /admin/pricing-tiers` in `apps/api/tests/integration/test_billing.py`
  - Monthly invoice generation + breakdown retrieval proven via `POST /admin/tenants/{tenant_id}/invoice`, `GET /admin/tenants/{tenant_id}/invoices`, and `GET /admin/tenants/{tenant_id}/invoices/{invoice_id}` in `apps/api/tests/integration/test_billing.py`
  - Component-separated fees (platform/telephony/LLM/STT/TTS) proven via
    `packages/platform-core/tests/integration/test_billing_primitives.py`

**Context budget:** ~55K tokens
**Depends on:** Phase 6.1 (usage metering), Phase 6.0 (audit trail), Phase 7.15 (KPI foundation) or reuse its event model
**Can run in parallel with:** Phase 7.6-7.16

---

## Deferred / re-homed phases (ex-P7.18–P7.25)

Wave 7’s deliverables are **control plane + release governance**. The following phases were drafted under the Wave 7 umbrella,
but are executed as part of NFQ delivery (Wave 8) or platform completeness (Wave 9).

| Phase | New home | Notes |
|---|---|---|
| P7.18 — `lead_nurture` solution scaffold | Wave 9 (Phase 9.14) | VOX follow-ups (REQ-S07) |
| P7.19 — `clinic_booking` solution scaffold | Wave 9 (Phase 9.12) | NFQ healthcare reference vertical |
| P7.20 — `driver_verification` solution scaffold | Wave 8 (Phase 8.0+) | Hoptrans MVP delivery |
| P7.21 — public web chat channel foundation | Wave 9 (Phase 9.3) | VOX Phase 1 ingress |
| P7.22 — locale + multilingual foundation | Wave 9 (Phase 9.3) | Implemented as part of VOX Phase 1 ingress/contracts |
| P7.23 — historical call search API | Wave 8 (Phase 8.4) + Wave 9 (Phase 9.7) | Hoptrans first, then generalize |
| P7.24 — individual GDPR erasure (DSAR) | Wave 9 (Phase 9.10) | Compliance surfaces |
| P7.25 — zero legacy agent surfaces | Wave 9 (Phase 9.13) | Required to remove `/agents` and tenant YAML routing |

Do not re-add the full phase specs here; keep details in the owning wave files to avoid contradictions.
