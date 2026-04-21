# T05: Write `wiki/systems/` pages (8 files)

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02 (directory exists), T02a (history context available)

---

## Description

Write 8 comprehensive pages under `wiki/systems/` covering cross-cutting concerns that span multiple components. Each page combines what was previously split across concept + source + entity fragments.

## Pages to write

### 1. `auth.md` — Authentication and authorization
- OIDC + JWKS + JWT extraction
- 4-tier FastAPI dependency pattern: `require_tenant`, `require_deployment`, `require_admin_tenant`, `solution_required()`
- Scope resolution flow (ASCII diagram: request → JWT → claims → tenancy lookup → scope)
- Session management (cookies: `grove_session`, `grove_api_token`)
- OIDC provider storage + JWKS rotation
- Source: Agent 2 (platform_core/auth/), Agent 4 (apps/web auth client)
- 200–300 lines

### 2. `telephony.md` — Carrier management and phone numbers
- Platform-core telephony: trunks, provider accounts, phone numbers, policy modes
- Telnyx webhook normalization (canonical carrier event envelope)
- Provider pack integration: ProviderPackManifest, `create_provider_pack()` factory
- SIP trunk lifecycle states
- ASCII diagram: inbound SIP → provider solution → platform-core normalization → routing
- Source: Agent 2 (platform_core/telephony/ + voice/), Agent 3 (provider_telnyx, provider_genesys)
- 250–350 lines

### 3. `voice.md` — Voice pipeline and control plane
- LiveKit bridge: `GroveVoiceAgent` overrides `llm_node`, session bootstrap, RTC quality monitoring
- Voice pipeline components: Silero VAD, Google STT/TTS (defaults), LiveKit WebRTC/SIP
- Temporal signaling via `CallSignaler` to `VoiceCallWorkflow`
- Voice latency collection (TTFT, response time)
- Voice control plane: operator view, subscription access, SSE streaming, manual takeover
- ASCII diagram: full voice path — SIP → LiveKit → VAD → STT → AgentExecutor → TTS → outbound
- Source: Agent 1 (grove-voice-livekit), Agent 2 (calls/, control_plane/), Agent 4 (apps/agent-worker)
- Absorbs `wiki/systems/voice.md`
- **Boundary with architecture/grove.md:** grove.md covers the executor + protocol layer; this page covers LiveKit-specific integration + control plane
- 300–400 lines

### 4. `observability.md` — Tracing, logging, metrics
- OTLP trace export to Tempo
- Structured logging to Loki (structlog + context vars)
- Metrics to Prometheus
- W3C traceparent propagation: API header → structlog → Temporal headers → LiveKit metadata
- Correlation interceptor (`platform_core/temporal/correlation.py`)
- Local observability stack: docker/observability/ (Tempo + Loki + Prometheus + Grafana)
- Observability queries: `tools/scripts/obs/` (logql, promql, traceql)
- Absorbs `wiki/ops/local-observability.md`
- ASCII diagram: application → OTLP collector → Tempo/Loki/Prometheus → Grafana
- 200–300 lines

### 5. `contracts.md` — Cross-solution adapters and schema registry
- The Protocol-based adapter registry in `platform_core/contracts/`
- 3 adapter families: `SchedulingAPI`, `CRMClient`, `NotificationSender`
- Entry-point discovery: solutions register adapters on install
- `AdapterRegistry` + `SchemaRegistry`
- Rule: solutions communicate through contracts only, never by importing each other
- ASCII diagram: solution A registers adapter → registry → solution B calls interface
- Source: Agent 2 (platform_core/contracts/)
- 150–250 lines

### 6. `distribution.md` — White-label export
- Per-client manifests: `distribution/clients/nfq.yaml` specifying contracted solutions + path exclusions
- Repo template: `distribution/clients/nfq/repo-template/`
- Build-time solution exclusion: physical exclusion from partner artifacts
- `tools/scripts/artifact/export-client.sh`
- UI component migration tracking: `distribution/UI_AUDIT.md`
- ASCII diagram: monorepo → export-client.sh + manifest → per-client artifact (only contracted solutions)
- 150–250 lines

### 7. `tooling.md` — Scripts, gates, automation
- `tools/scripts/` 10-subdir map: review/, check/, ci/merge-gate/, ci/runner/, ci/scope/, artifact/, e2e/, infra/, dev/, lib/, obs/
- Key gate scripts: pre-pr-ci.sh, pr-review.sh, check_pr_readiness.py, distribution-docs.sh, generate_api_inventory.py, check_api_inventory.py, check_payload_types.py
- PR review bot: `tools/agents/pr_review_bot.py`, `pr_orchestrator.py`, `pr_followup.py`
- `tools/regression/` test tooling
- `.githooks/`, `.pre-commit-config.yaml`
- Makefile targets
- ASCII diagram: dev edit → pre-commit → push → merge-gate → detect-changes → conditional jobs
- 250–350 lines

### 8. `testing.md` — Architecture tests, e2e harness, evals
- `tests/architecture/` (144 cross-layer tests, 33K LOC) — the cross-package gate that validates dependency declarations, component graph, API inventory, Temporal determinism, build profiles, PR review policy
- Distinction: root tests/ is cross-layer; per-package tests/ is within-package
- E2e harness: Playwright + Chrome DevTools MCP verification for UI changes, allowlist for LiveKit errors
- `tests/evals/` — eval runner framework (1 file, 54 LOC)
- Test tree ownership rule: "tests live with the runtime surface they prove"
- Absorbs content from `wiki/ops/harness_engineering.md`
- ASCII diagram: change → which test tree? → root tests/ (cross-layer) vs packages/*/tests/ (within-package) vs apps/web/e2e/ (browser)
- 200–300 lines

## Implementation Notes

- **Read source code before writing.** Ground every claim in current source.
- **Read history digests** from T02a for design decisions and context.
- **Read `docs/` files being absorbed** (voice-middleware-architecture.md, local-observability.md, harness_engineering.md) — ensure all load-bearing content is preserved.
- **Boundary discipline**: clearly define what each systems/ page owns vs what architecture/ pages own. The auth.md page should not re-describe platform-core's module map; it should describe the auth SYSTEM across components.

## Acceptance Criteria

- [ ] 8 files exist under `wiki/systems/`
- [ ] Each has at least 1 ASCII diagram
- [ ] Each has cross-links to architecture/ and/or solutions/ pages
- [ ] No "invariant" / "entities" jargon
- [ ] No PR numbers or commit SHAs
- [ ] `uv run pytest tests/architecture/ -q` passes

## Verification

```bash
for f in auth telephony voice observability contracts distribution tooling testing; do
  test -f "wiki/systems/$f.md" && echo "OK: $f" || echo "FAIL: $f"
done
for f in wiki/systems/*.md; do
  grep -q '^+\-\|^|' "$f" && echo "OK diagram: $f" || echo "FAIL: $f"
done
! rg 'invariant' wiki/systems/
! rg 'PR #[0-9]+' wiki/systems/
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Source: Agents 1–6 audit reports + T02a history digests
- Absorbed: wiki/systems/voice.md, wiki/ops/local-observability.md, wiki/ops/harness_engineering.md
