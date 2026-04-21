# M34 — Wiki as Source of Truth

- **Status:** done
- **Created:** 2026-04-09
- **Owner:** Jakit
- **Stream:** platform
- **Depends on:** none (standalone documentation restructure)
- **Branch:** `feat/M34-wiki-as-source-of-truth`

---

## Problem

1. **Wiki is an auto-generated LLM draft** from 2026-04-08, shallow and partly violating its own schema rules.
2. **`docs/` and `wiki/` duplicate knowledge** in different shapes — two sources of truth, neither trusted.
3. **Milestone directories** carry scattered execution artifacts (`checklist.md`, `ui-requirements.md`, `exec-plans/`, `SESSION-PROMPT.md`, `design-docs/`) instead of clean execution history.
4. **Dead code** from the February 2026 monorepo refactor is still on disk.
5. **Terminology** (`invariants`, `entities`) is unfriendly to the real audience: junior (non-native English) engineers operating AI coding agents.

## Goal

Make the wiki the single source of truth. After M34:

1. `wiki/` has ~31 comprehensive pages a new engineer or AI agent can onboard from in 2–3 file reads
2. `docs/` has only execution history (milestones + tasks) and auto-generated artifacts
3. Dead code is gone, terminology is plain, ASCII diagrams appear everywhere

---

## Design Decisions

### D1. Flat files, grouped by subdirectory — like a spec index

Each wiki page is **one comprehensive file per topic** (concept + rules + module detail + diagrams all in ONE file). No splitting into component/concept/source fragments.

Pages are grouped into subdirectories by domain:

```
wiki/
├── index.md                         ← flat scannable entry point
├── SCHEMA.md                        ← conventions
├── log.md                           ← append-only log
│
├── architecture/                    ← Architecture & Infrastructure (8 pages)
│   ├── architecture.md              ← layer model, ~46 rules, how it all fits
│   ├── grove.md                     ← runtime, tools, protocols, voice glue, temporal
│   ├── platform-core.md             ← auth, tenancy, governance, control plane, billing
│   ├── frontend.md                  ← Next.js, Radix, SWR, shared packages, e2e
│   ├── temporal.md                  ← workflows, activities, worker, serialization
│   ├── database.md                  ← Postgres RLS, schemas, checkpoints, migrations
│   ├── infrastructure.md            ← Terraform, k8s, Flux, k3d, Docker, SOPS
│   └── ci.md                        ← merge-gate, scope routing, PR harness, agents
│
├── solutions/                       ← Business Capabilities (7 pages)
│   ├── appointment-booking.md
│   ├── driver-verification.md
│   ├── lead-capture.md
│   ├── schedule-management.md
│   ├── telematics-ingestion.md
│   ├── notifications.md
│   └── provider-packs.md            ← Telnyx + Genesys
│
├── systems/                         ← Cross-Cutting Systems (8 pages)
│   ├── auth.md                      ← OIDC, JWKS, multi-scope, sessions
│   ├── telephony.md                 ← carriers, trunks, SIP, numbers
│   ├── voice.md                     ← LiveKit, STT/TTS pipeline, control plane
│   ├── observability.md             ← OTLP, Loki, Prometheus, correlation
│   ├── contracts.md                 ← cross-solution adapters, schema registry
│   ├── distribution.md              ← white-label export, client manifests
│   ├── tooling.md                   ← scripts, gates, PR review, regression
│   └── testing.md                   ← architecture tests, e2e harness, evals
│
├── guides/                          ← How-tos (3 pages)
│   ├── development-workflow.md
│   ├── code-style.md
│   └── core-beliefs.md
│
├── history/                         ← Execution history digests (5 pages)
│   ├── observability-voice.md
│   ├── ui-console.md
│   ├── ci-infrastructure.md
│   ├── telephony-distribution.md
│   └── platform-features.md
│
├── debug/                           ← Per-symptom recipes (added over time)
└── queries/                         ← Filed answers to past questions
```

### D2. Terminology — plain words

- `invariants` → **rules**
- `entities` → dropped (pages are named by topic, not by abstract type)
- Old directories (`wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/synthesis/`) → deleted and replaced by the structure above

### D3. Audience — juniors and AI agents

Every page must pass: a non-native English junior can read it without a dictionary, an AI agent with zero context can follow cross-references to get what it needs.

### D4. ASCII diagrams everywhere

Any page describing a flow, relationship, or boundary includes a monospace ASCII box diagram.

### D5. One file per topic — no fragmentation

Each wiki page is comprehensive. The old `components/grove-framework.md` (thin) + `sources/grove-scan.md` (dense) + `sources/grove-core-protocols.md` + `sources/grove-temporal-workflows.md` + `concepts/tool-registration-pattern.md` pattern is replaced by a single `architecture/grove.md` that covers everything. Concept at the top, detail in the middle, cross-links at the bottom.

Module-map sections carry a `Last verified: 2026-04-09` marker. They will drift as code changes — accepted. Re-verify when next touching the area.

### D6. History pages — digests, not mirrors

The 5 `history/*.md` pages are distilled from 45 milestone docs + 283 task files + 87 exec-plans + 422K of product requirements (`checklist.md`, `ui-requirements.md`, `nfq.md`, `vox.md`, `SOW_MAPPING.md`). Each digest captures: what was built, design decisions made (with rejected alternatives), lessons learned, sequencing rationale. Not verbatim copies — distilled context an AI agent can consume in one read.

### D7. Milestone/task format (Style B)

Each `docs/tasks/M{N}/` directory contains exactly `README.md` + `PROGRESS.md` + `T*.md`. Loose `checklist.md`, `ui-requirements.md`, `exec-plans/`, `SESSION-PROMPT.md`, `design-docs/` get merged into the relevant task files.

### D8. Execution order

Fully complete the wiki build before deleting any `docs/` content.

### D9. One task = one commit

Each task is one atomic commit, even when creating multiple files.

---

## How an AI Agent Uses This Wiki

```
Agent wakes up (zero context)
        |
        v
Step 1: Read wiki/index.md               ← scan flat list, 30 seconds
        |
        v
Step 2: Read the matching page            ← e.g., wiki/architecture/grove.md
        (concept + rules + detail +         for Grove work
         diagrams — all in ONE file)
        |
        v  (if needed)
Step 3: Read cross-linked pages           ← grove.md links to temporal.md,
                                            auth.md, code-style.md
        |
        v  (if needs history)
Step 4: Read history digest               ← e.g., history/observability-voice.md
        (design decisions, rejected          for "why does voice work this way?"
         alternatives, lessons)
        |
        v
Agent has full context. Start working.
```

**2–3 file reads to full context.**

---

## Tasks

| Task | Title | Phase | Status | Depends on |
|------|-------|-------|--------|------------|
| T01 | Dead code cleanup + `.gitignore`/`.dockerignore` | 0 (foundation) | not started | none |
| T02 | Restructure wiki directories + update SCHEMA.md terminology | 0 (foundation) | not started | none |
| T02a | Ingest execution history + product requirements into `history/` pages (5 files) | 0 (foundation) | not started | T02 |
| T03 | Write `wiki/architecture/` pages (8 comprehensive files) | C (build) | not started | T02, T02a |
| T04 | Write `wiki/solutions/` pages (7 files) | C (build) | not started | T02, T02a |
| T05 | Write `wiki/systems/` pages (8 files) | C (build) | not started | T02, T02a |
| T06 | Write `wiki/guides/` pages (3 files) | C (build) | not started | T02 |
| T07 | Write `wiki/index.md` + update `SCHEMA.md` + append `log.md` | C (build) | not started | T03, T04, T05, T06 |
| T08 | Delete ALL absorbed `docs/` content (including milestones, tasks, requirements) + rewrite `wiki/index.md` as pointer | A (absorb) | not started | T07 |
| T09 | Update `AGENTS.md` onboarding sequence to wiki-first | A (absorb) | not started | T08 |
| T10 | Verification — full pre-PR CI + arch tests + spot check | verify | not started | T01, T09 |

---

## Target Wiki Content

### `wiki/architecture/` (8 pages)

| Page | Content (comprehensive — one file, not fragments) |
|------|---|
| `architecture.md` | Layer model, ~46 rules (plain language), deployment model, DB namespace split, how it all fits. Absorbs `wiki/architecture/architecture.md`. |
| `grove.md` | Agent executor, tool registry, 12 protocols, voice glue, Temporal workflows, internal layer order. Absorbs `wiki/architecture/grove.md`. |
| `platform-core.md` | All 30 modules grouped into clusters. Concept at top, module map below. No M8.2 / PR refs. Replaces the violating entity page. |
| `frontend.md` | Next.js 15, route map, SWR patterns, @grove/ui primitives, e2e coverage. Absorbs `wiki/design-docs/react-best-practices.md`. |
| `temporal.md` | Workflow catalog, activity catalog, data converter, worker factory, unsafe-imports pattern. |
| `database.md` | RLS, 3 schema namespaces (public/grove/org_*), checkpoint store, advisory locks, migrations. |
| `infrastructure.md` | Terraform/Hetzner + k8s/Flux + SOPS + k3d + Docker profiles. Absorbs `wiki/ops/k3d-local-stack.md`, `wiki/ops/README.md`. |
| `ci.md` | Merge-gate, scope routing, pre-PR harness, PR review bot, pre-commit hooks, architecture tests. Absorbs `wiki/architecture/ci.md`, `wiki/ops/harness_engineering.md`, `wiki/ops/pre-pr-checklist.md`. |

### `wiki/solutions/` (7 pages)

| Page | Content |
|------|---|
| `appointment-booking.md` | NFQ clinic: 6 tools, reminder workflow, knowledge base, observability enricher |
| `driver-verification.md` | VOX Hoptrans: verification workflow, discrepancy detection, CSV import, telematics dep |
| `lead-capture.md` | Multilingual qualify/deliver, CRM webhook, lead events |
| `schedule-management.md` | NL → parse → validate → execute change pipeline |
| `telematics-ingestion.md` | Secure webhook, idempotency, driver_verification hard dependency |
| `notifications.md` | Telnyx SMS, delivery tracking, optional dependency for other solutions |
| `provider-packs.md` | Telnyx + Genesys: `ProviderPackManifest` vs `SolutionManifest`, number search |

### `wiki/systems/` (8 pages)

| Page | Content |
|------|---|
| `auth.md` | OIDC, JWKS, 4-tier FastAPI deps (`require_tenant`/`require_deployment`/`require_admin_tenant`/`solution_required`), sessions |
| `telephony.md` | Carriers, trunks, SIP, phone numbers, Telnyx webhook normalization, provider policy modes |
| `voice.md` | LiveKit bridge, STT/TTS/VAD pipeline, GroveVoiceAgent, voice control plane, call observation, manual takeover |
| `observability.md` | OTLP tracing, structured logging, Loki/Prometheus/Grafana, W3C traceparent propagation path. Absorbs `wiki/ops/local-observability.md`. |
| `contracts.md` | Cross-solution adapters (SchedulingAPI, CRMClient, NotificationSender), schema registry, entry-point discovery |
| `distribution.md` | White-label export, per-client manifests (nfq.yaml), build-time solution exclusion, UI_AUDIT |
| `tooling.md` | 10-subdir script map, key gate scripts (pre-pr-ci, pr-review, check_pr_readiness, etc.), Makefile, obs queries |
| `testing.md` | 144 architecture boundary tests, e2e harness, Playwright, evals, test tree ownership rules |

### `wiki/guides/` (3 pages)

| Page | Content |
|------|---|
| `development-workflow.md` | Setup (`uv sync`, `pnpm install`), gates, commit conventions, PR process, brainstorm→plan→implement→verify→resync loop. Absorbs `wiki/guides/development-workflow.md`. |
| `code-style.md` | ALL coding rules: async-first, RLS, config, JSON payloads, DI, typing, naming, errors, file size, tool schemas, observability, STTCPW, boring tech, no AI attribution, American English. Absorbs `wiki/design-docs/code-style.md`. |
| `core-beliefs.md` | Founding design philosophy. Absorbs `wiki/design-docs/core-beliefs.md`. |

### `wiki/history/` (5 pages)

| Page | Covers | Input files |
|------|--------|---|
| `observability-voice.md` | M1.x, M2, M8.x, M23 arc | ~15 milestone + task + exec-plan files |
| `ui-console.md` | M20–M22, M27, M12, M29–M31 arc | ~20 milestone + task files |
| `ci-infrastructure.md` | M26.x series arc | ~25 milestone + task + exec-plan files |
| `telephony-distribution.md` | M11, M13, M14.x, M28, platform v3 waves | ~30 milestone + task + exec-plan files |
| `platform-features.md` | M3–M10, M16–M18, M32, M33 + `checklist.md` + `ui-requirements.md` + `nfq.md` + `vox.md` + `SOW_MAPPING.md` | ~50 milestone + task + requirements files |

Each digest contains: timeline table, numbered design decisions, lessons learned, sequencing rationale, links to originals.

---

## `docs/` Deletion Map

**Everything in `docs/` gets deleted except `docs/arch/generated/` and `wiki/index.md` (rewritten as pointer).**

History content (`docs/milestones/`, `docs/tasks/`, `docs/milestones/exec-plans/`, `docs/requirements/`) is absorbed into `wiki/history/` pages BEFORE deletion. The wiki becomes the only documentation surface. Source code is the only raw source.

Kept after M34:
- `docs/arch/generated/` — auto-generated from code, CI-verified
- `wiki/index.md` — 3-line pointer to `wiki/index.md`
- `AGENTS.md` / `CLAUDE.md` — agent onboarding, points at wiki

---

## Acceptance Criteria

- [x] `wiki/architecture/` has 8 comprehensive pages
- [x] `wiki/solutions/` has 7 pages
- [x] `wiki/systems/` has 8 pages
- [x] `wiki/guides/` has 3 pages
- [x] `wiki/history/` has 5 execution history digests
- [x] `wiki/index.md` is a flat scannable entry point listing every page
- [x] Old directories (`wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/synthesis/`) do not exist
- [x] Zero `invariant`/`entities` jargon in wiki bodies
- [x] Every page that describes a flow has an ASCII diagram
- [x] All dead code paths deleted (src/grove, root grove-voice-livekit, etc.)
- [x] ALL `docs/` deleted except `docs/arch/generated/` and `wiki/index.md` (pointer)
- [x] `docs/milestones/`, `docs/tasks/`, `docs/requirements/` absorbed into `wiki/history/` then deleted
- [x] `AGENTS.md` Zero-Memory Start points at wiki-first
- [x] `tools/scripts/review/pre-pr-ci.sh` passes
- [x] `uv run pytest tests/architecture/ -q` passes
- [x] 10 random wiki pages spot-checked for quality

---

## Verification

```bash
# Wiki structure
test -d wiki/architecture && test -d wiki/solutions && test -d wiki/systems && test -d wiki/guides && test -d wiki/history
test ! -d wiki/entities && test ! -d wiki/concepts && test ! -d wiki/sources && test ! -d wiki/synthesis

# Page counts
echo "architecture: $(ls wiki/architecture/*.md | wc -l)"  # expect 8
echo "solutions:    $(ls wiki/solutions/*.md | wc -l)"     # expect 7
echo "systems:      $(ls wiki/systems/*.md | wc -l)"       # expect 8
echo "guides:       $(ls wiki/guides/*.md | wc -l)"        # expect 3
echo "history:      $(ls wiki/history/*.md | wc -l)"       # expect 5

# No jargon
! rg 'invariant' wiki/ | grep -v SCHEMA.md | grep -v log.md
! rg '\bentities\b' wiki/ | grep -v SCHEMA.md | grep -v log.md

# Dead code gone
for p in src/grove grove-voice-livekit packages/platform-sdk examples/logistics_driver \
         tests/unit tests/parity solutions/outbound_campaigns wiki/entities; do
  test ! -e "$p"
done

# ALL docs/ gone except arch/generated and index.md
for p in wiki/architecture/architecture.md docs/grove docs/design-docs wiki/guides/development-workflow.md \
         docs/distribution docs/solutions docs/archived docs/milestones docs/tasks \
         docs/requirements docs/ops wiki/guides/core-beliefs.md docs/arch/maps; do
  test ! -e "$p"
done

# Only these survive in docs/
test -d docs/arch/generated
test -f wiki/index.md
lines=$(wc -l < wiki/index.md)
[ "$lines" -lt 10 ]

# CI gates
tools/scripts/review/pre-pr-ci.sh
uv run pytest tests/architecture/ -q
```

---

## Non-Goals

- No code changes in `packages/`, `solutions/`, or `apps/` (except dead-code deletions in T01)
- No runtime behavior changes
- No new architecture rules
- No auto-generation tooling (all wiki pages are manually authored with source grounding)
- No CI topology changes
- No `outbound_campaigns` rewrite (deleted; future milestone rebuilds from scratch)

---

## Impact on Other Milestones

- **M26.5 / M26.6**: no conflict (M34 is docs, those are scripts)
- **M33, M32, M28, M13, M8**: design content absorbed into wiki pages, task files stay as execution history

---

## References

- 2026-04-09 source-code scan session: 7 parallel audit agents covering entire codebase
- Example inspiration: flat spec-index structure with domain groupings
