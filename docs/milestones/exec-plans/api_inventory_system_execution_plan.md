# Execution Plan: Generated API Inventory System

> **Status:** Draft
> **Created:** 2026-03-07
> **Owner:** Codex
> **Track:** Epic

## 1. Feature Definition

**Goal:** Generate a backend-owned API inventory that shows what endpoints exist, who owns them, who consumes them, which requirements they serve, and which capabilities are still missing or unconsumed.

**Evidence expectation (when Completed):**
- Generated docs exist under `docs/arch/generated/`
- At least one checker script blocks drift in CI
- At least one machine-readable inventory artifact exists for agents/scripts

**Acceptance Criteria:**
- [ ] All mounted platform and solution API endpoints are captured in a generated inventory.
- [ ] Each public endpoint is linked to explicit metadata: business capability, owner area, consumer kinds, and requirement references.
- [ ] The inventory reports both implemented-but-unconsumed endpoints and required-but-missing endpoints.
- [ ] CI fails when generated inventory artifacts drift or when public endpoints lack inventory metadata.

**Scope Boundaries:**

Included:
- Platform route discovery from `apps/api/src/platform_api/routes/*.py`
- Solution router discovery from mounted routers / solution manifests
- OpenAPI-backed final route extraction
- Consumer discovery for `apps/web`, Grove/system tool callers, and other repo-local platform consumers
- Generated Markdown, JSON, and Mermaid inventory artifacts
- CI freshness and completeness checks

Excluded:
- Replacing OpenAPI docs or Swagger UI
- Auto-generating UI requirements or checklist content
- Building UI screens from the inventory
- Runtime service-call tracing beyond endpoint/consumer mapping

---

## 2. Phase Plan

### Phase 1: Inventory Source Model

**Objective:** Define the canonical data model and extraction boundaries for the inventory system.

**Input:**
- `apps/api/src/platform_api/main.py`
- `apps/api/src/platform_api/routes/*.py`
- `packages/platform-core/src/platform_core/solutions/manifest.py`
- `tools/scripts/check_ui_requirements.py`
- `AGENTS.md`
- `docs/arch/arch_spine.md`

**Deliverables:**
- Typed inventory schema for endpoint records, consumer records, and requirement links
- Clear split between discoverable facts and explicit metadata
- Documented source priority:
  1. mounted routes / OpenAPI
  2. route/module ownership
  3. sidecar metadata
  4. consumer scan

**Tests:**
- Schema/unit tests for inventory record validation
- Unit tests for source-priority and merge rules

**Verification gate:**
```bash
uv run pytest tests/architecture/ -k api_inventory --tb=short -q
uv run pyright -p pyrightconfig.ci.json
```

**Context budget:** ~20K tokens

**Depends on:** none

**Can run in parallel with:** none -- sequential foundation

### Phase 2: Endpoint Discovery Generator

**Objective:** Generate the complete mounted endpoint list for platform and installed solutions.

**Input:**
- Phase 1 inventory schema
- `apps/api/src/platform_api/main.py`
- `apps/api/src/platform_api/routes/*.py`
- solution `api.py` / router modules

**Deliverables:**
- `tools/scripts/generate_api_inventory.py`
- Endpoint extraction from mounted FastAPI routes and/or OpenAPI
- `docs/arch/generated/api_inventory.json`

**Tests:**
- Unit tests for platform route extraction
- Unit tests for solution route extraction
- Golden test for deterministic JSON output

**Verification gate:**
```bash
uv run pytest tests/architecture/ -k api_inventory_generation --tb=short -q
python3 tools/scripts/generate_api_inventory.py
uv run pyright -p pyrightconfig.ci.json
```

**Context budget:** ~30K tokens

**Depends on:** Phase 1

**Can run in parallel with:** none -- generator is the base for later phases

### Phase 3: Metadata and Requirement Linking

**Objective:** Attach the semantics OpenAPI cannot infer.

**Input:**
- Phase 2 generated endpoint set
- `docs/requirements/ui-requirements.md`
- `docs/requirements/checklist.md`
- route-module ownership

**Deliverables:**
- Typed sidecar metadata format for endpoint groups
- Requirement-reference linking with stable IDs or explicit temporary refs
- Generated `docs/arch/generated/api_inventory.md`

**Tests:**
- Validation tests for metadata completeness
- Validation tests for requirement-ref resolution
- Golden test for Markdown rendering

**Verification gate:**
```bash
uv run pytest tests/architecture/ -k api_inventory_metadata --tb=short -q
python3 tools/scripts/generate_api_inventory.py
uv run pyright -p pyrightconfig.ci.json
```

**Context budget:** ~35K tokens

**Depends on:** Phase 2

**Can run in parallel with:** none -- metadata must stabilize before consumer reporting

### Phase 4: Consumer Discovery and Gap Reporting

**Objective:** Show what is consumed, what is orphaned, and what is still missing.

**Input:**
- Phase 3 inventory
- `apps/web/src/lib/api/**`
- `apps/web/src/app/api/**`
- Grove/system tool callers
- app/worker HTTP client callers

**Deliverables:**
- Consumer scanner
- Generated consumer matrix
- Gap sections in inventory:
  - implemented but no known consumer
  - consumer references missing endpoint
  - required/planned but missing endpoint
- `docs/arch/generated/api_inventory.mmd`

**Tests:**
- Consumer scan unit tests
- Golden tests for Markdown and Mermaid output
- Coverage tests for known web and tool consumers

**Verification gate:**
```bash
uv run pytest tests/architecture/ -k api_inventory_consumers --tb=short -q
python3 tools/scripts/generate_api_inventory.py
uv run pyright -p pyrightconfig.ci.json
```

**Context budget:** ~40K tokens

**Depends on:** Phase 3

**Can run in parallel with:** none -- output depends on stable metadata

### Phase 5: CI Contract and Doc Transition

**Objective:** Enforce freshness and make the inventory the long-term map without breaking short-term delivery docs.

**Input:**
- Phases 2-4 artifacts
- `.github/workflows/ci.yml`
- `tools/scripts/check_system_graph.py`
- `tools/scripts/check_ui_requirements.py`
- `wiki/ops/harness_engineering.md`

**Deliverables:**
- `tools/scripts/check_api_inventory.py`
- CI job for inventory freshness/completeness
- Harness docs update describing the new contract
- Short-term cross-link from `ui-requirements.md` and/or docs index to the generated inventory

**Tests:**
- Checker tests for stale/missing artifact failures
- CI-local smoke execution for generator + checker

**Verification gate:**
```bash
python3 tools/scripts/generate_api_inventory.py
python3 tools/scripts/check_api_inventory.py
uv run pytest tests/architecture/ -k api_inventory_contract --tb=short -q
```

**Context budget:** ~25K tokens

**Depends on:** Phase 4

**Can run in parallel with:** none -- integration phase

---

## 3. Execution Graph

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

---

## 4. Implementation Notes

### Inventory outputs

Generate three outputs:

1. `docs/arch/generated/api_inventory.md`
2. `docs/arch/generated/api_inventory.json`
3. `docs/arch/generated/api_inventory.mmd`

### Required inventory fields

Each endpoint record must carry:

1. HTTP method
2. Path
3. Route module or solution router source
4. Owner area
5. Business capability
6. Consumer kinds
7. Audience/scope
8. Requirement references
9. Status:
   - `implemented`
   - `internal_only`
   - `planned`
   - `deprecated`

### Recommended metadata strategy

Do not try to derive business semantics from router tags or function names alone. That is too weak.

Use small typed metadata sidecars adjacent to route groups or in one explicit registry. The metadata layer should be the minimum extra structure required to answer:

1. Why does this endpoint exist?
2. Who owns it?
3. Who should consume it?
4. Which requirement does it satisfy?
5. Is lack of consumer expected or a gap?

### Missing endpoint reporting

The inventory must distinguish:

1. Endpoint exists and has at least one consumer
2. Endpoint exists but has no known consumer
3. Requirement/capability exists but endpoint is missing
4. Consumer references endpoint that does not exist

That is the core value of this system. Without these reports, the inventory is just a prettier route dump.

### Short-term vs long-term source of truth

Short term:

- `docs/requirements/checklist.md` and `docs/requirements/ui-requirements.md` remain delivery documents
- inventory links to them through explicit requirement refs

Long term:

- generated API inventory becomes the API map
- checklist can be deprecated once requirement IDs and capability coverage are tracked outside the checklist tables

---

## 5. Rules

1. OpenAPI alone is not sufficient; it does not know owner, capability, or consumer intent.
2. AST alone is not sufficient; it does not know final mounted paths for installed solutions.
3. Sidecar metadata must be typed and mechanically validated.
4. Unknown public endpoints without metadata fail the contract.
5. Consumer scans are informative but must not invent fake consumers from tests unless explicitly labeled as test-only.
6. Generated docs must be deterministic.
7. This plan should reuse the existing generated-doc pattern (`component_graph` / `system_graph`) instead of adding ad hoc docs.

---

## 6. Progress Tracking

| Phase | Status | Date | Tests | Notes |
|-------|--------|------|-------|-------|
| 1 | Pending | 2026-03-07 | — | Define schema + metadata model |
| 2 | Pending | 2026-03-07 | — | Build endpoint generator |
| 3 | Pending | 2026-03-07 | — | Attach metadata + requirement refs |
| 4 | Pending | 2026-03-07 | — | Add consumer scan + gap report |
| 5 | Pending | 2026-03-07 | — | Add checker + CI contract |

---

## 7. Cross-References

- Architecture spine: `docs/arch/arch_spine.md`
- Repository guidelines: `AGENTS.md`
- UI/API contract checker: `tools/scripts/check_ui_requirements.py`
- Generated graph pattern: `tools/scripts/generate_component_graph.py`
- Harness guidance: `wiki/ops/harness_engineering.md`
