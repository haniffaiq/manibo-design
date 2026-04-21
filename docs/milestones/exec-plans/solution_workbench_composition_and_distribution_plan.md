# Execution Plan: Solution Workbench Composition And Client Distribution

> **Status:** Active
> **Created:** 2026-03-18
> **Owner:** Jakit
> **Track:** Architecture / delivery protection

## 1. Goal

Define the operator/admin UI as a shared workbench that composes installed solutions without leaking one client's private solution code into another client's source handoff.

This plan exists because the current repo has the right low-level instincts:

- installable solutions
- installed-only discovery
- build-time artifact exclusion
- observability as persisted truth -> projection -> UI

But it still lacks the concrete web workbench contract needed for:

- role-specific tenant UX
- solution-contributed UI
- deterministic left-nav and landing-route composition
- customer source handoff boundaries that are stronger than runtime gating

## 2. Source Anchors

- `docs/requirements/checklist.md:45`
- `docs/requirements/checklist.md:51`
- `docs/requirements/checklist.md:54`
- `wiki/architecture/architecture.md`
- `docs/arch/arch_spine.md`
- `docs/requirements/nfq.md`
- `docs/requirements/vox.md`
- `docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md`
- `docs/milestones/exec-plans/nfq_source_distribution_separation.md`
- `apps/web/src/components/tenant-shell.tsx`
- `apps/web/src/lib/solutions.ts`
- `packages/platform-core/src/platform_core/solutions/manifest.py`

Checklist rows this plan is meant to advance:

- `docs/requirements/checklist.md:45` by replacing hard-coded tenant solution visibility with manifest-driven workbench composition
- `docs/requirements/checklist.md:51` by making customer source handoff/export boundaries explicit instead of pretending runtime/build visibility is enough
- `docs/requirements/checklist.md:54` by promoting observability queue/case/compare/evidence-rail behavior into a shared cross-solution workbench primitive

Explicit non-claim:

- this plan may support later VOX blockers in `docs/requirements/checklist.md:40-41`, but it does **not** close them by itself because it does not ship the missing public-ingress/widget or KB approval contracts

## 3. Current Truth

Already real:

- solution packages are real Layer 3 units with manifests and installed-only discovery
- `solutions/driver_verification/ui/src/manifest.ts` already proves the repo can ship a solution-owned UI manifest and route contribution
- constrained deployments already require physical artifact exclusion
- role and scope concepts exist in the canonical architecture
- observability already has a case-first execution plan

Still missing:

- a standardized cross-solution UI contribution contract built from the existing driver-verification manifest instead of another competing format
- role-scoped workbench composition rules in the web shell
- deterministic landing-route precedence across multiple active solutions
- a source-handoff rule stronger than runtime/build visibility toggles

## 4. Concrete Module Map

### 4.1 Shared Platform Core Contracts

These stay shared and client-agnostic at the architecture level.

- package registry and installed-only discovery
- organization composition and dependency validation
- role/scope resolution (`client_operator`, `client_admin`, `super_admin`)
- solution enablement state and dependency enforcement
- control-plane and observability read models
- transcript, recording, workflow, alert, and audit API contracts
- connector/config metadata contracts
- workbench contribution schema validation and compatibility checks

Important correction:

- React page shells do not belong in `packages/platform-core`
- but the contracts that govern solution-contributed UI absolutely do belong there

### 4.2 Shared Web Workbench Layer

This stays shared in `apps/web` and is safe to ship to multiple clients.

- `OperatorWorkbench` shell
- `ClientAdminWorkbench` shell
- `DeploymentWorkbench` shell
- page archetypes: queue, workspace, record, directory
- shared queue / case / history / compare layout grammar
- shared transcript, recording, action rail, evidence rail, timeline, and empty-state primitives
- navigation composer that reads role + active solution contributions
- landing-route resolver that reads role + active solution set + current work state
- plain-language status grammar for errors, degraded state, blocked actions, and next steps

This is the reusable UI chassis.
It must not contain VOX-specific sales logic or NFQ-specific clinic assumptions.

### 4.3 What Moves Into `solutions/*`

Every solution contributes business-specific UI through a manifest-driven surface, not by hard-coding `if solution == X` into the tenant shell.
The starting point should be to generalize the existing `solutions/driver_verification/ui/src/manifest.ts` contract, not invent a second incompatible manifest format.

Each solution should own:

- role-scoped nav contributions
- default landing route candidates
- queue definitions and saved views
- case-detail panels
- domain actions
- domain empty-state copy
- domain status badges and terminology
- observability enrichers for its workflow/runtime evidence
- solution-specific settings panels and integration setup panels

Examples:

- `appointment_booking`
  - follow-up queue
  - booking result detail
  - call-to-booking handoff actions
  - clinic integration readiness panel
- `driver_verification`
  - driver review queue
  - discrepancy detail panel
  - verification outcome actions
- `lead_capture`
  - lead inbox
  - qualification detail
  - offer/callback actions
- `outbound_campaigns`
  - campaign run queue
  - run detail
  - retry / pause / escalate actions

### 4.4 What NFQ Can Receive

NFQ handoff should include only the shared platform plus contracted NFQ-relevant solutions.

Blunt truth:

- this is a target export shape, not the current repo layout
- today, handing NFQ the entire `apps/api`, `apps/temporal-worker`, or `apps/web` trees would still leak VOX/private code
- issue `#619` cannot be satisfied until shared app shells are split or allowlist-filtered hard enough to remove those private slices physically

Current blockers inside shared app trees:

- `apps/api/src/platform_api/routes/public_ingress.py`
- `apps/api/src/platform_api/routes/campaigns.py`
- `apps/temporal-worker/src/temporal_worker/worker.py`
- `apps/web/src/lib/solutions.ts`
- `apps/web/src/components/observability-workspace.tsx`

Day-1 safe bundle after issues `#615`, `#617`, `#618`, and `#619` land, aligned with the updated NFQ separation plan:

- `packages/grove`
- `packages/grove-voice-livekit`
- `packages/platform-core`
- allowlist-filtered shared shell code from `apps/api`, `apps/temporal-worker`, `apps/agent-worker`, and `apps/web`, including the shared observability primitives retained by `#618`
- `solutions/appointment_booking`
- `solutions/driver_verification`
- `solutions/telematics_ingestion`
- `solutions/call_monitoring`
- `solutions/notifications`
- tests and docs that cover only the above surfaces

### 4.5 What Must Stay Out Of NFQ Handoff

Until explicitly productized and contracted, these stay private to VOX or to provider-only distribution:

- `solutions/lead_capture`
- `solutions/outbound_campaigns`
- VOX website public-ingress chat/widget slices
- VOX sales qualification flows
- VOX course-matching logic and schedule-specific sales UX
- VOX brand copy, multilingual sales narratives, and guardrails
- VOX-only prompts, follow-up cadences, and knowledge artifacts
- tests that exercise excluded VOX/private solutions

Blunt truth:

- runtime gating is not enough
- `NEXT_PUBLIC_SOLUTIONS` is not enough
- "we just won't click those pages" is not architecture

### 4.6 Left-Nav And Landing-Route Composition

The shell should compose from three inputs:

1. request role
2. active installed+enabled solutions
3. current operational urgency

Role-first top-level workbench rules:

- `client_operator`
  - `Today`
  - `Live`
  - solution work queues
  - no admin plumbing by default
- `client_admin`
  - `Today`
  - `Live`
  - `History`
  - solution workspaces
  - `Team`
  - `Integrations`
  - `Settings`
  - analytics/reporting when shipped
- `super_admin`
  - separate deployment workbench, not a polluted tenant shell

Landing-route rules:

- no active solutions -> onboarding / enablement state
- one active solution -> solution manifest may nominate the default route for each role
- multiple active solutions -> shared `Today` queue with solution sections
- urgent live work always surfaces in `Today`; it should not require guessing which module to open

Cross-solution rule:

- observability drill-down stays shared
- solutions enrich the case, but they do not own a second truth model

## 5. Architecture Gaps

`docs/arch/arch_spine.md` is not wrong, but it is incomplete for this problem.

~~Missing or under-specified in the canonical architecture today:~~

1. **Workbench contribution contract** — **CLOSED (PR #625)**
   - `SolutionUIManifest` type at `apps/web/src/lib/solution-manifest-types.ts`
   - Per-solution manifests at `apps/web/src/solutions/*/manifest.ts`
   - Registry at `apps/web/src/solutions/registry.ts`

2. **Role-scoped web composition contract** — **PARTIAL (PR #625)**
   - the architecture defines roles and scopes
   - tenant `apps/web` now composes operator vs client-admin sections from the same manifest set using session role
   - deployment workbench is still separate and not yet normalized into the same contract language

3. **Landing-route precedence** — **NOT STARTED**
   - there is no canonical or execution-level rule for how the tenant shell chooses the initial route when multiple solutions are active

4. **Customer source-handoff boundary** — **CLOSED (PR #625)**
   - `tools/scripts/export-client.sh` performs allowlist-based rsync exports
   - `distribution/clients/{nfq,vox}.yaml` define contracted solutions per client
   - `tests/architecture/test_solution_isolation.py` enforces no cross-solution imports
   - Shared tenant pages now consume generated manifest/widget registries plus shared API wrappers instead of importing removable `apps/web/src/solutions/*` files directly
   - Export strips `.venv`, `.env`, `distribution/`, non-contracted solution UI code

5. **Shared observability-as-workbench primitive** — **PARTIAL (PR #625)**
   - the execution plan says queue / case / compare / evidence rail
   - the shared observability workspace now accepts manifest-owned subject coverage contributions instead of a closed hard-coded list
   - deeper per-solution queue/case/evidence enrichers are still not factored into first-class primitives

6. **Web shell hard-coding** — **CLOSED (PR #625)**
   - `tenant-shell.tsx` now reads nav items from solution manifests via `getSolutionNavItems()`
   - `solutions.ts` derives labels from manifest registry instead of hardcoded maps
   - Feature components moved from `apps/web/src/features/` to `apps/web/src/solutions/`
   - Generated registries now bind shared shell/dashboard code to only the build-enabled solution manifests and dashboard widgets
   - Shared tenant pages use `apps/web/src/lib/api/*` wrappers where exported clients must keep building even after excluded solution folders are stripped

## 6. Issue Backlog

This plan is intentionally backed by a discrete issue set instead of one fake epic.

Latest progress (2026-03-26, post-merge M12 follow-up):

- `#616` **CLOSED**: `SolutionUIManifest` type defined, manifests for appointment_booking and driver_verification created, solution UI moved to `apps/web/src/solutions/`
- `#617` **OPEN**: hardcoded nav composition is gone, but landing-route resolution is still only a static role map
- `#619` **CLOSED**: export script + client manifests + architecture isolation tests shipped
- `#614` **CLOSED**: canonical architecture and generated spine already define the governed workbench/source-handoff contract
- `#615` **OPEN**: tenant/deployment shells shipped in code, but repo-standard UI proof backfill is still missing
- `#618` **PARTIAL**: shared observability workspace now reads solution-contributed coverage metadata; deeper queue/case/evidence enrichers are still future work
- checklist rows materially advanced in this lane: `45`, `51`, and `54`

Issue list:

- Issue 1: `#614` Add canonical workbench-composition and customer source-handoff rules to V2 architecture — **DONE ON BRANCH**
- Issue 2: `#615` Introduce shared Operator, ClientAdmin, and Deployment workbench shells in `apps/web` — **OPEN (verification backfill remains)**
- Issue 3: `#616` Extend solution manifests with UI/workbench contribution contracts — **DONE**
- Issue 4: `#617` Replace hard-coded tenant nav with role and solution composed navigation plus landing-route resolution — **OPEN**
- Issue 5: `#618` Promote observability queue-case-compare primitives into a shared cross-solution workbench — **PARTIAL**
- Issue 6: `#619` Make NFQ source handoff an allowlist-based export that excludes VOX and other private solutions — **DONE**

## 7. Outcome Standard

This track is only done when all of the following are true:

- ~~solution UI composition is manifest-driven instead of hard-coded~~ **DONE**
- operator/admin shells are role-first and solution-enriched — **PARTIAL (#615)**
- observability is a shared workbench primitive — **PARTIAL (#618)**
- landing routes are deterministic — **NOT STARTED**
- ~~NFQ source export physically excludes VOX/private solution code and tests~~ **DONE**
- canonical architecture and generated spine describe the real contract instead of leaving it implied
