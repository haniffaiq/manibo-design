# T03: Write `wiki/architecture/` pages (8 comprehensive files)

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02 (directory exists), T02a (history context available)

---

## Description

Write 8 comprehensive pages under `wiki/architecture/`. Each page covers one topic completely — concept + rules + module detail + ASCII diagrams in ONE file. No fragmentation into separate component/source/concept pages.

Content sources: source-code audit reports from agents 1–6 (2026-04-09), history digests from T02a, absorbed content from `wiki/architecture/architecture.md`, `wiki/architecture/grove.md`, `wiki/architecture/ci.md`, `wiki/ops/k3d-local-stack.md`, etc.

## Pages to write

### 1. `architecture.md` — Layer model, rules, how it all fits
- The 4-layer model (Grove → platform-core → solutions → apps) with ASCII diagram
- ALL platform rules (~46) in plain language. Each rule: name, what it means, why it exists, where enforced (file:line)
- Database namespace split: `public.*` / `grove.*` / `org_<slug>.*` with ASCII diagram
- Voice call flow end-to-end (ASCII diagram: SIP → LiveKit → Grove → Temporal → platform-core → operator UI)
- HTTP request flow end-to-end (ASCII diagram: request → API shell → auth → platform-core → grove → response)
- Absorbs ALL of `wiki/architecture/architecture.md`
- 600–900 lines (this is the big one)

### 2. `grove.md` — AI runtime framework
- What Grove is (2–3 sentences), what it does NOT do (no platform-core imports, no business nouns)
- Rules (5–6 rules)
- Internal layer order (ASCII diagram: bootstrap.py at top, core/ at bottom)
- Agent executor loop (ASCII diagram: input → LLM → tools → guardrails → repeat/exit)
- Module map: 13 subdirs, one row each (purpose, key files, LOC). Marked `Last verified: 2026-04-09`
- 12 Protocols + ABCs catalog (table: name, shape, purpose, implementers)
- Temporal workflows catalog (table: workflow, input, output, signals)
- Voice pipeline defaults (STT/TTS/VAD/LLM table)
- Absorbs `wiki/architecture/grove.md`
- Cross-links: temporal.md, voice.md (in systems/), code-style.md, history/observability-voice.md
- **Must NOT overlap with systems/voice.md** — grove.md covers the executor + protocol layer; voice.md covers LiveKit bridge + control plane
- 400–500 lines

### 3. `platform-core.md` — Governance layer
- What platform-core is, what it does NOT do (no solution imports, no becoming "one giant blob")
- Rules (6–8 rules: no L3 imports, RLS everywhere, fail-closed tenant state, immutable artifacts, etc.)
- Module clusters (thin map, ≤10 rows: auth, tenancy, solutions, control_plane, contracts, calls, telephony, observability, billing, public_ingress)
- Cross-cutting patterns: Temporal workflow+activity pattern, RLS, Pydantic+dataclass mix, FastAPI dependency gating, advisory locks, immutable content, Protocol-based adapters
- ASCII diagram: platform-core as middle layer
- Absorbs the load-bearing parts of the old wiki/entities/platform-core.md (after stripping violations)
- Cross-links: auth.md, telephony.md, voice.md, contracts.md (all in systems/)
- 400–500 lines

### 4. `frontend.md` — Operator UI
- Tech stack: Next.js 15, React 19, TypeScript 5.7, Tailwind, SWR, Playwright
- Route map by layout group: (auth), (tenant), (deployment), (generated-solutions), (solutions)
- Data patterns: SWR hooks → `platformApiRequest` → API shell
- Component library: exclusively `@grove/ui` (Radix-based)
- Shared packages: `@grove/web-shared` (API client, auth types, locale)
- E2E coverage: 33 specs, 17K LOC
- Solution auto-routing via `generate-solution-routes.mjs`
- Absorbs `wiki/design-docs/react-best-practices.md`
- ASCII diagram: user → Next.js page → SWR hook → API shell → platform-core
- 300–400 lines

### 5. `temporal.md` — Workflow orchestration
- Why Temporal (durable workflows, retries, signals, continue_as_new)
- Rules: workflows are deterministic, activity is the DB boundary, unsafe imports for Pydantic
- Workflow catalog across all layers (Grove + platform-core + solutions): table with name, owner, purpose
- Activity catalog: naming pattern (`sol.*`, `platform.*`), retry policies
- Data converter, worker factory, task queue
- Correlation interceptor (W3C traceparent through Temporal headers)
- ASCII diagram: Temporal client → task queue → worker → workflow → activities → DB
- 250–350 lines

### 6. `database.md` — PostgreSQL
- 3-namespace schema: `public.*` (cross-tenant metadata), `grove.*` (runtime, RLS-gated), `org_<slug>.*` (per-tenant business)
- RLS pattern: `tenant_connection(pool, tenant_id)` + `SET LOCAL app.tenant_id`
- Checkpoint store: ContextVar + psycopg pool callbacks for LangGraph isolation
- Advisory lock pattern for migration serialization
- Alembic migration layout: grove has `alembic/`, platform-core has `alembic/` + `alembic_public/`, solutions have their own
- ASCII diagrams: (1) 3-namespace layout, (2) RLS enforcement flow
- 250–350 lines

### 7. `infrastructure.md` — Deployment + local stack
- Production: Hetzner → Terraform → Kubernetes (Kustomize overlays) → Flux GitOps → SOPS secrets
- Local: k3d per worktree (authoritative for proof), Docker Compose (fast iteration, not authoritative)
- Terraform structure: `hetzner/environments/production/`, `hetzner/shared/ci-runner/`, `gcp/`
- Kubernetes: `base/` + `overlays/hetzner/production/` + `flux/`
- k3d scripts: `k3d-up.sh`, `configure-k3d-ci-env.sh`, `k3d-sync-app-runtime.sh`
- Docker profiles: `single-tenant/`, `licensed-platform/`
- Observability stack: Tempo + Loki + Prometheus + Grafana
- Absorbs `wiki/ops/k3d-local-stack.md`, `wiki/ops/README.md`
- ASCII diagrams: (1) production deploy path, (2) local k3d worktree isolation
- 300–400 lines

### 8. `ci.md` — CI/CD pipeline
- Merge-gate.yml as the ONLY PR-gating workflow (hard rule)
- Scope routing: `detect-changes.sh` → ~50 scope labels → conditional downstream jobs
- Pre-PR harness: `pre-pr-ci.sh` (403 LOC)
- PR review: `pr-review.sh` (Codex wrapper), `check_pr_readiness.py`
- Pre-commit hooks: ruff-format + ci-control-plane-guard (pre-push)
- Architecture boundary tests (144 files, 33K LOC in tests/architecture/)
- Key check scripts: `check_api_inventory.py`, `check_payload_types.py`, `distribution-docs.sh`
- Absorbs `wiki/architecture/ci.md`, `wiki/ops/harness_engineering.md`, `wiki/ops/pre-pr-checklist.md`
- ASCII diagram: PR → merge-gate → detect-changes → [static/runtime/k3d/artifact/dist] → merge
- 300–400 lines

## Implementation Notes

- **Read source code before writing.** Each page is grounded in current source, not memory. Use `rg`, `Read`, `Glob` to verify claims.
- **Read history digests from T02a.** Each architecture page should include "why" context from the relevant `wiki/history/*.md` digest (design decisions, rejected alternatives).
- **Read `docs/` files being absorbed.** Before writing the page, read the `docs/` file it absorbs to ensure no load-bearing content is lost.
- **ASCII diagrams required.** Every page needs at least 1. Architecture.md needs 4+.
- **Plain language.** Non-native English juniors + AI agents. No jargon without explanation.
- **`Last verified: 2026-04-09`** on module-map sections. Accepted: these will drift as code changes.

## Acceptance Criteria

- [ ] 8 files exist under `wiki/architecture/`
- [ ] `architecture.md` contains ≥35 named rules
- [ ] Every page has at least 1 ASCII diagram
- [ ] Every page has cross-links to related pages in other wiki directories
- [ ] No "invariant" / "entities" jargon
- [ ] No PR numbers or commit SHAs in body text
- [ ] `uv run pytest tests/architecture/ -q` still passes

## Verification

```bash
for f in architecture grove platform-core frontend temporal database infrastructure ci; do
  test -f "wiki/architecture/$f.md" && echo "OK: $f" || echo "FAIL: $f"
done
count=$(grep -c '^### Rule' wiki/architecture/architecture.md 2>/dev/null)
[ "$count" -ge 35 ] && echo "OK rules ($count)" || echo "FAIL rules ($count)"
for f in wiki/architecture/*.md; do
  grep -q '^+\-\|^|' "$f" && echo "OK diagram: $f" || echo "FAIL: $f"
done
! rg 'invariant' wiki/architecture/
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Source: Agents 1, 2, 4, 5, 6 audit reports + T02a history digests
- Absorbed: wiki/architecture/architecture.md, wiki/architecture/grove.md, wiki/architecture/ci.md, wiki/ops/harness_engineering.md, wiki/ops/k3d-local-stack.md, wiki/ops/pre-pr-checklist.md, wiki/ops/README.md
