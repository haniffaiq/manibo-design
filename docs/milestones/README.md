# Milestones Index

## Quick Start for Agents

1. Load `docs/arch/arch_spine.md` — architecture entry point with layer model and invariants
2. Read this file — current milestone status, execution order, and architecture guards
3. Read `docs/milestones/ARCHITECTURE_GUARDS.md` — layer constraints that apply to ALL milestones
4. Read `docs/milestones/CLAUDE.md` — conventions for milestones and tasks
5. Pick a milestone only after the readiness table marks it implementable, then read its doc and check `docs/tasks/M{N}/PROGRESS.md`
6. If detailed `T*.md` task files don't exist yet, create them from `docs/tasks/_templates/task-template.md` only for milestones the readiness table marks ready. Planning-only or parked milestones do not get implementation work until the milestone status/readiness is explicitly changed by the human; the only exception is a planning backlog explicitly requested by the human, and those task files must say they are planning-only and blocked from execution.

Archived milestone docs live in [README.md](README.md). This directory currently contains finished milestone docs that no longer need to stay in the active execution-order catalog. Cross-cutting operational milestones stay at the top level only while they still act as live reference docs.

### Readiness Status

| Milestone | Design Spec | Task Files | Ready to Implement? |
|-----------|------------|------------|-------------------|
| **M15** | [workflow-client-ux-spec.md](../../wiki/design-docs/workflow-client-ux-spec.md) | 10 tasks | Yes (after M20) |
| **M14** | [M14-integration-depth.md](M14-integration-depth.md) | 1 planning task + parked future notes | Planning backlog owner for the unmet outbound preferred-channel WhatsApp transport/routing row. Broader connector-governance ideas are parked until a regression or new checklist row justifies reopening them. |
| **M8** | [M8-v2-voice-control-plane.md](M8-v2-voice-control-plane.md) | 8 tasks | Planning only — task-ready, but execution starts only when the milestone is explicitly activated by the human |
| **M13** | [M13-telephony-management.md](M13-telephony-management.md) | 19 task files | Active implementation branch from explicit human activation on 2026-04-03. T01-T09 and T12 are complete, T11 remains the live PSTN proof track, and T14-T19 now track the explicit telephony-control-plane simplification follow-on. |
| **M13.1** | [M13.1-telephony-autonomous-evaluation.md](M13.1-telephony-autonomous-evaluation.md) | 8 task files | Planning only — docs-approved follow-on for autonomous PSTN evaluation. Starts only after M13 lands and explicit human activation. |
| **M4–M7, M9–M10, M16–M18** | milestone docs only | — | Need task files before work begins |
| **M19** | legacy placeholder milestone doc only | — | Parked; outbound WhatsApp notifications stay with M14, and interactive runtime planning stays with M14.3 |
| **M14.1–M14.2** | milestone docs only | — | Planning reference notes only. They stay in the catalog to reserve naming, boundaries, and dependencies, but they are not activation-ready until explicit checklist rows materially justify implementation and the human activates them. |
| **M14.3** | milestone doc only | — | Planning note only for future interactive WhatsApp runtime. Outbound WhatsApp notification transport remains in M14. No task backlog until an explicit interactive-WhatsApp checklist row and endpoint contract exist, plus explicit human activation. |
| **Future Slack interactive** | architecture note only | — | No milestone/task backlog until an explicit Slack-interactive checklist row exists |
| **M26.1** | [M26.1-bot-pr-recovery-control-plane-simplification.md](M26.1-bot-pr-recovery-control-plane-simplification.md) | 5 tasks | Active implementation branch from explicit human activation on 2026-03-29; closes checklist row 63 follow-on control-plane cleanup |
| **M26.2** | [M26.2-ci-workflow-clarity-and-test-surface-truth.md](M26.2-ci-workflow-clarity-and-test-surface-truth.md) | 6 tasks | Completed on 2026-04-02 and archived after PR `#764` merged the CI workflow clarity and release-gate work |
| **M26.3** | [M26.3-infrastructure-directory-structure-migration.md](M26.3-infrastructure-directory-structure-migration.md) | 10 tasks | Completed on 2026-04-03; `infrastructure/` is now the only live top-level infrastructure root, with the last `infra/` and `clusters/` dependencies removed |
| **M26.4** | [M26.4-mainline-k3d-proof-consolidation.md](M26.4-mainline-k3d-proof-consolidation.md) | 4 tasks | Active implementation branch from explicit human activation on 2026-04-03; consolidates mainline `k3d` runtime proof, traceability harness ownership, and coupled frontend proof for checklist row 63 |
| **M26.5** | [M26.5-test-infrastructure-cleanup.md](M26.5-test-infrastructure-cleanup.md) | 9 tasks | In review on `refactor/simplify-test-scripts` / PR #795. Shell-script side of the `tools/scripts/` + wave-test rename. Originally numbered M23.3 until 2026-04-05. |
| **M26.6** | session prompt only ([docs/tasks/M26.6/SESSION-PROMPT.md](../tasks/M26.6/SESSION-PROMPT.md)) | 11 tasks planned | Follow-up to M26.5 covering the 63 Python scripts in `tools/scripts/*.py` and the 133 flat architecture tests. Originally scoped as M23.4 until 2026-04-05. No milestone doc yet — promote from session prompt once M26.5 merges. |
| **M26.7** | [M26.7-portable-prompt-first-review-system.md](M26.7-portable-prompt-first-review-system.md) | 7 tasks | Completed 2026-04-14. Final shape: namespaced review scripts under `tools/scripts/review/`, repo-scoped `.codex/` review agents, Codex-managed internal fan-out, and one merged public verdict. |
| **M26.8** | [M26.8-in-cluster-test-parallelism.md](M26.8-in-cluster-test-parallelism.md) | 4 tasks | Task-ready on `feat/M26.8-in-cluster-test-parallelism` after the 2026-04-15 CI-speed investigation (`wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`). Introduces `pytest-xdist` and Playwright `workers>1` inside the M26.4 per-job `k3d` isolation contract; rejects the vCluster/warm-cluster alternatives. Execution starts only after explicit human activation. |
| **M26.9** | [M26.9-staging-cluster-and-post-merge-e2e.md](M26.9-staging-cluster-and-post-merge-e2e.md) | 8 tasks | Planning-ready on `feat/M26.9-staging-cluster` after the 2026-04-15 release-reliability audit (22/40 flux-production-deploy runs failing, 12 pure k3d infra flake). Stands up a 1-node Hetzner staging cluster that Flux reconciles from `main`, moves E2E off CI-embedded k3d onto staging, auto-merges the existing release-pin PR once staging E2E passes (opt-out via `blocks-auto-promote` label), and retires the duplicate `Run Full K3d E2E` on the release path. Execution starts only after explicit human activation of T01. |
| **M27** | [M27-console-craft-progressive-disclosure.md](M27-console-craft-progressive-disclosure.md) | 24 tasks | Yes — all dependencies done (M20, M21, M22) |
| **M28** | [M28-solution-visibility-tenant-access-ux.md](M28-solution-visibility-tenant-access-ux.md) | 5 tasks | Yes — all dependencies done (M11, M20, M21, M22, M27) |
| **M33** | [M33-grove-autonomous-runtime.md](M33-grove-autonomous-runtime.md) | 24 tasks | Planning only — task-ready, but execution starts only when the milestone is explicitly activated by the human |
| **M35** | [M35-env-settings-centralization.md](M35-env-settings-centralization.md) | 8 tasks | Planning only — awaits human activation |
| **M38** | [M38-nfq-gcp-bootstrap.md](M38-nfq-gcp-bootstrap.md) | 11 tasks | Active implementation branch after explicit human activation on 2026-04-13; ports the Saturn GCP baseline into provider-isolated NFQ roots with Cloud SQL, authoritative Cloud DNS, IAM / workload identities, Terraform-owned NFQ CI OIDC, the NFQ-scoped GAR image-publish follow-on, the first internal-first GKE runtime overlay, and the split between internal-safe and public-edge observability. |
| **M38.2** | [M38.2-nfq-gcp-secret-manager-sync.md](M38.2-nfq-gcp-secret-manager-sync.md) | 3 tasks | Completed on 2026-04-20; GCP Secret Manager is now the NFQ GCP production runtime-secret source of truth, synced by ESO through Workload Identity with Reloader-driven pod restarts. |
| **M38.3** | [M38.3-nfq-gcp-staging-environment.md](M38.3-nfq-gcp-staging-environment.md) | 6 planning tasks | Planning-only task pack created on 2026-04-20 after explicit human request. Builds the real NFQ GCP staging environment with Secret Manager/ESO/Reloader parity, a `gcp/staging` runtime overlay, self-hosted LiveKit/SIP, dedicated staging telephony resources, and live-call latency comparison against the production LiveKit Cloud baseline. Execution starts only after explicit human activation. |
| **M39** | [M39-nfq-gcp-observability-hardening.md](M39-nfq-gcp-observability-hardening.md) | 5 tasks | In progress after 2026-04-17 truth audit; T05 is done, T03/T04 have implementation coverage with live endpoint/apply proof pending, T02 has public-edge 5xx coverage but still needs latency coverage, and T01 remains open for Slack-safe alert routing. |
| **M41.7** | [M41.7-agent-builder-governed-starter-repair.md](M41.7-agent-builder-governed-starter-repair.md) | 3 tasks | In progress on PR #961; repairs the governed starter flow, legacy route focus, and runtime voice-schema round-trip in the new agent-builder UI. |
| **M41.0** | [M41.0-appointment-booking-package-structure.md](M41.0-appointment-booking-package-structure.md) | 7 tasks | Completed on 2026-04-20; behavior-preserving package/API structure refactor for `solutions/appointment_booking`. |
| **M41** | [M41-nfq-affidea-prompt-kb-foundation.md](M41-nfq-affidea-prompt-kb-foundation.md) | 6 tasks | Completed on 2026-04-20; prompt assets, package-resource loading/composition, deterministic KB snapshots, Affidea starter/profile config, and Ship-PR evidence are in place. Depends on completed M41.0. |
| **M41.1** | [M41.1-nfq-affidea-booking-tools-and-state.md](M41.1-nfq-affidea-booking-tools-and-state.md) | milestone doc only | Planning-ready Affidea booking state, provider client boundary, and tool-alias work. Depends on M41. Task files are created only when activated. |
| **M41.2** | [M41.2-grove-grouped-flow-runtime.md](M41.2-grove-grouped-flow-runtime.md) | milestone doc only | Planning-ready product-agnostic Grove grouped-flow/subgraph runtime. Depends on M41. Task files are created only when activated. |
| **M41.3** | [M41.3-nfq-affidea-runtime-integration.md](M41.3-nfq-affidea-runtime-integration.md) | milestone doc only | Planning-ready integration of Affidea prompts, tools, grouped flow, browser rehearsal, and governed agent config. Depends on M41.1 and M41.2. Task files are created only when activated. |
| **M41.4** | [M41.4-nfq-affidea-evals-and-production-readiness.md](M41.4-nfq-affidea-evals-and-production-readiness.md) | milestone doc only | Planning-ready eval, observability, k3d, and NFQ production-readiness proof. Depends on M41.3 and M39. Task files are created only when activated. |
| **M41.5** | [M41.5-affidea-agent-authoring-ui-follow-on.md](M41.5-affidea-agent-authoring-ui-follow-on.md) | milestone doc only | Parked follow-on for the typed `source_yaml -> compiled_config` authoring UI model. Depends on M41.3 and explicit activation. |
| **M41.6** | [M41.6-affidea-retrieval-follow-on.md](M41.6-affidea-retrieval-follow-on.md) | milestone doc only | Parked follow-on for retrieval only if M41.4 eval evidence shows deterministic KB is insufficient. Depends on M41.4 and explicit activation. |
| **M36.1** | [M36.1-platform-api-route-entropy-phase2.md](M36.1-platform-api-route-entropy-phase2.md) | 8 tasks | Planning only - task-ready, but execution starts only after explicit human activation. M36 is merged and M36.1 now targets route-package contract enforcement, root support-module eviction, and entropy reduction in `workflows`, `call_ops`, `tenancy`, and telephony seams, with observability reserved for a dedicated follow-on milestone. |

---

## Completed Milestones

- [M36](M36-platform-api-route-topology-phase1.md) — Platform API Route Topology Phase 1 (PR #838)
- [M34](M34-wiki-as-source-of-truth.md) — Wiki as Source of Truth (PR #826)

- [M1](M1-obs-ui-redesign.md)
- [M1.1](M1.1-obs-navigation-modes.md)
- [M1.2](M1.2-obs-evidence-rail.md)
- [M1.3](M1.3-obs-live-streaming.md)
- [M3](M3-clinic-console-followup.md)
- [M8.2](M8.2-control-plane-refactor-hardening.md)
- [M11](M11-nfq-source-distribution.md)
- [M12](M12-workbench-composition.md)
- [M20](M20-deployment-console-ux.md)
- [M21](M21-operator-console-ux.md)
- [M22](M22-admin-shared-patterns.md)
- [M26.2](M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- [M27](M27-console-craft-progressive-disclosure.md)
- [M29](M29-agent-test-call-review-flow.md)
- [M30](M30-agent-version-rollback.md)
- [M31](M31-assistant-channel-management.md)

---

## All Milestones (Execution Order)

### Phase 0 — Solution Isolation (must come first)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M11** | [Solution Package Isolation + Source Distribution](M11-nfq-source-distribution.md) | dist | done | none | 14 |

**Why Phase 0:** M11 moves solution web UI from `apps/web/src/solutions/` to separate npm workspace packages at `solutions/{name}/ui/`. This is a structural prerequisite:
- M21 T16 decomposes `bookings-page.tsx` — if this happens while code is in `apps/web/src/solutions/`, the decomposition is wasted when M11 later moves it
- M1 and M20 are independent (they touch components and design system, not solution pages)
- Test partitioning (T09) uses file-level separation: pure solution tests move into `solutions/{name}/tests/`, not marker-based filtering (pytest markers fail because solution tests import solution code at module scope)

**Key architecture guard:** Cross-solution types are Platform Core contracts — solutions never export types to other solutions (decision #7, enforced by architecture test).

### Cross-Cutting — CI Control Plane (runs in parallel; repo-wide)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M26** | [CI Control Plane Reliability](M26-ci-control-plane-reliability.md) | ci | done | none | 9 |
| **M26.1** | [Bot PR Recovery + Control Plane Simplification](M26.1-bot-pr-recovery-control-plane-simplification.md) | ci | active | M26 | 5 |
| **M26.2** | [CI Workflow Clarity + Test Surface Truth](M26.2-ci-workflow-clarity-and-test-surface-truth.md) | ci | done | M26.1 | 6 |
| **M26.4** | [Mainline K3d Proof Consolidation](M26.4-mainline-k3d-proof-consolidation.md) | ci | parked | M26.1, M26.2 | 4 |
| **M26.7** | [Codex Subagent PR Review Simplification](M26.7-portable-prompt-first-review-system.md) | ci | done | M26.1, M26.2, M26.5 | 7 |

**Why this track existed:** the repo had already paid too much tax for ad hoc CI firefighting:
- stale waiters on the only `control` lane froze unrelated PRs
- `manibo-bot` clean approvals and `chatgpt-codex-connector` inline findings disagreed on the same head SHA
- `merge-gate.yml` and CI test files drifted into monolith trash
- release-pin and docs-only PRs paid queue tax for work that should have been near-instant

**Key architecture guard:** `Merge gate` remains the only live PR workflow. Fix the control plane by deleting duplication and fake authority, not by reintroducing more workflows, PR-scoped labels, or autoscaler sludge.

**Why M26.1 exists:** M26 made the big topology sane, but live backlog monitoring still exposed a smaller follow-on seam: reviewed bot PRs can stall when current-head gate status goes missing, while orchestrator/follow-up/review state still duplicate GitHub parsing and comment-marker fallbacks. M26.1 tracks that cleanup explicitly instead of hiding it in random CI follow-up patches.

**Why M26.2 exists:** after M26/M26.1, the CI still reads like repo folklore instead of an operator-facing system. Workflow/job names remain opaque, runner explanations blur labels with real host inventory, browser E2E still lacks a live GitHub lane, and several E2E suites exist without an honest CI ownership statement. M26.2 tracks that cleanup instead of smuggling it into the tail of unrelated bot-control-plane work.
**Why M26.2 was reopened:** the release path still had a fake prerelease signal. A bootstrap-only k3d smoke lane was not an honest release gate, so the milestone was reopened until release control ran a real full k3d E2E proof before production deploy.
**Guardrail:** M26.2 does not reopen the M26 decision that pull requests use one live PR workflow. Naming cleanup and non-PR workflow extraction must preserve that invariant.
**Why M26.4 exists:** after M26.2 made the workflow surface honest, the remaining pain is topology duplication: PRs still launch separate `k3d` traceability/checklist proof while mainline/release already own the broad cluster-backed runtime truth. M26.4 tracks the simplification backlog to keep PRs fast and move cluster-backed proof into one mainline `k3d` run that also absorbs the traceability harness, instead of spreading the same runtime truth across multiple PR lanes.
**Guardrail:** M26.4 does not mean one persistent shared cluster. It means one `k3d` bootstrap per mainline proof run, no cross-run cluster reuse, no new live PR workflow, and no fake claim that a tiny compose smoke lane is equivalent to cluster-backed runtime proof.
**Why M26.7 exists:** the current PR review behavior is useful, but the structure is overloaded: prompt generation, GitHub-specific fetch/publish logic, repo-specific auth, and one large review bot all live in the same seam. M26.7 resets that surface to one namespaced review runner under `tools/scripts/review/`, repo-scoped `.codex/` review agents, and one merged public verdict.
**Guardrail:** M26.7 must delete review glue instead of multiplying it. No second blocking review authority, no duplicate prompt-loading paths, no giant path-routing config system, no repo-specific auth/account names embedded in the review logic, and no tiny abstractions or tests that do not protect a real contract.

### Cross-Cutting — Infrastructure Structure (runs in parallel; repo-wide)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M26.3** | [Infrastructure Directory Structure + Migration](M26.3-infrastructure-directory-structure-migration.md) | infra | done | none | 10 |

**Why this track existed:** the repo used to split infrastructure truth across `infra/`, `clusters/`, provider-owned environment roots, and legacy Terraform stubs. M26.3 removed that split so one `infrastructure/` root now owns the active contract.

**Key architecture guard:** path migration must preserve real ownership boundaries. Terraform is provider-isolated, Kubernetes keeps one shared base plus explicit overlays, Flux cluster roots stay cluster-specific, and provider-specific database choices do not get hidden in a fake common layer.

### Cross-Cutting — Platform API Route Topology and Entropy (planning only; repo-wide)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M36** | [Platform API Route Topology Phase 1](M36-platform-api-route-topology-phase1.md) | platform | done | none | 10 |
| **M36.1** | [Platform API Route Contracts and Entropy Reduction](M36.1-platform-api-route-entropy-phase2.md) | platform | done | M36 | 8 |
| **M36.2** | [Observability Investigation API Decomposition](M36.2-observability-investigation-api-decomposition.md) | obs | done | M36.1 | 7 |

**Why this track exists:** M36 fixed the flat route topology. M36.1 enforced the
route package contract and cleaned the non-observability hotspots. The next
remaining god module is the observability investigation API in
`apps/api/src/platform_api/routes/observability/router.py`, which still mixes
route transport, reusable diagnosis logic, and tenant/admin mirrored wiring in
one 8k-line file.

**Key architecture guard:** M36.2 follows the new app-shell boundary:
`platform_api` owns HTTP transport, while `platform_core` owns reusable
platform logic. It is diagnosis-first and behavior-preserving. It does **not**
bundle `reports.py`, Grafana/GCP dashboard migration, or web observability UI
redesign; those stay in later milestones.

### Phase 1 — Operator Console + Observability (start now, M11 is done)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M21** | [Operator Console UX](M21-operator-console-ux.md) | ui | done | M11 (done) | 31 |
| **M1** | [Observability UI Decomposition](M1-obs-ui-redesign.md) | obs | done | none | 8 |
| **M4** | [VOX Phase 1 — Public Chat Widget](M4-vox-public-chat-widget.md) | v2 | not started | none | — |
| **M14** | [Integration Depth](M14-integration-depth.md) | platform | planning | none | 1 (+ parked future notes) |
| **M13** | [Multi-Provider Telephony Resource Management](M13-telephony-management.md) | platform | in progress | M31 | 10 |
| **M13.1** | [Autonomous Telephony Evaluation + Voice Quality Guardrails](M13.1-telephony-autonomous-evaluation.md) | platform | not started | M13 | 8 |
| **M12** | [Workbench Composition](M12-workbench-composition.md) | platform | done | none | 4 (+ milestone task table) |
| **M17** | [Privacy + GDPR Compliance](M17-privacy-gdpr-compliance.md) | platform | not started | none | — |

**Critical path:** M11 (done) → M21 + M1 (parallel) → M20. M21 comes before M20 because it fixes the solution package pain points (T18-T22) that M11 exposed — shared API types, standalone typecheck, dashboard decoupling. M20 (deployment console) can start after M21 lands the shared component improvements.

**Architecture guards for Phase 1:**
- **M1:** Pure UI decomposition in `apps/web/src/components/`. No layer violations possible.
- **M20:** Components in `packages/ui` + admin pages in `apps/web`. No solution code touched.
- **M4:** Public ingress/guest sessions MUST be in `packages/platform-core/`, NOT Grove.
- **M14:** Notification adapters are request/response only; webhook delivery MUST NOT be a Grove `WorkflowAction`.

### Phase 2 — Deployment Console + VOX foundations

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M20** | [Deployment Console UX](M20-deployment-console-ux.md) | ui | done | M21 (shared components) | 16 |
| **M1.1** | [Omni-Channel Navigation Modes](M1.1-obs-navigation-modes.md) | obs | done | M1 | — |
| **M5** | [VOX — Knowledge Base + Guardrails](M5-vox-knowledge-base-guardrails.md) | v2 | not started | M4 | — |
| **M6** | [VOX — Lead Capture + CRM Delivery](M6-vox-lead-capture-crm.md) | v2 | not started | M4 | — |
| **M7** | [VOX — Analytics Baseline](M7-vox-analytics-baseline.md) | platform | not started | M4, M6 | — |
| **M15** | [Workflow Client UX](M15-workflow-client-ux.md) | ui | not started | M20 | 10 |
| **M16** | [Driver Verification Completion](M16-driver-verification-completion.md) | platform | not started | M14 | — |
| **M27** | [Console Craft & Progressive Disclosure](M27-console-craft-progressive-disclosure.md) | ui | done | M20 (done), M21 (done), M22 (done) | 24 |
| **M28** | [Solution Visibility Contract + Tenant Access UX](M28-solution-visibility-tenant-access-ux.md) | ui | not started | M11 (done), M20 (done), M21 (done), M22 (done), M27 (done) | 5 |

**Architecture guards for Phase 2:**
- **M21 T16:** Bookings decomposition goes into `solutions/appointment_booking/ui/src/components/` (after M11 move), NOT `apps/web/src/solutions/`.
- **M21 T07:** Support drawer is a proper slide-over component, not a Modal with className hacks.
- **M21 T12:** Call-history does NOT use SSE — only loads saved data. Do not add streaming.
- **M15 T06:** Requires a new `GET /workflows/templates` backend endpoint — no existing API exists.
- **M15 T07:** Trigger form must match real `WorkflowTriggerOverride` enum: `event | schedule | manual` (not `event | cron`).
- **M15 T08:** Data mapping has no transform field — backend only persists destination→source strings.
- **M27:** Pure frontend/UI milestone. No backend changes, no new API endpoints. The Drawer component goes in `@grove/ui` (it is generic). All other changes are in `apps/web/`.
- **M28:** Frontend/build-contract milestone with one narrow auth/bootstrap exception: minimal tenant-identity metadata may be added to the existing auth/session handoff so the tenant shell can show human-readable client identity. No backend solution APIs, no runtime plugin loading, and no fake solution placeholder pages. The deployment bundle remains build-time; tenant enablement only controls visibility within that shipped bundle.
- **M15 T09:** Notification config needs backend model extension before the UI can save.

### Infrastructure Follow-On

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M38** | [NFQ GCP Bootstrap](M38-nfq-gcp-bootstrap.md) | infra | in progress | M26.3 | 11 |
| **M38.1** | [NFQ Public Edge and Dedicated Auth Readiness](M38.1-nfq-public-edge-and-auth-readiness.md) | infra | in progress | M38 | 5 |
| **M38.2** | [NFQ GCP Secret Manager Sync](M38.2-nfq-gcp-secret-manager-sync.md) | infra | done | M38.1 | 3 |
| **M38.3** | [NFQ GCP Staging Environment](M38.3-nfq-gcp-staging-environment.md) | infra | not started | M38, M38.1, M38.2 | 6 |
| **M39** | [NFQ GCP Observability Hardening](M39-nfq-gcp-observability-hardening.md) | infra | in progress | M38, M38.1 | 5 |

**Key architecture guard:** M38 may expand the existing GCP Terraform tree only under `infrastructure/terraform/gcp/**`, and may add the minimal GCP runtime overlay only because a real live GKE consumer now exists. It must not create a second standalone Terraform root, must keep Cloud SQL in Terraform rather than Kubernetes overlays, must treat NFQ CI auth as Terraform-owned without conflating it with the existing Manibo shell bootstrap path, and must keep the first GCP runtime slice internal-first with no public ingress dependency.

**Key architecture guard:** M38.1 finishes the NFQ public edge and login path without collapsing NFQ into the live Manibo public contract. NFQ must use a dedicated OIDC client/provider path, temporary `jakitlabs.com` DNS must reflect the real authoritative Route53 setup, and public DNS must not be created before the GCP load-balancer target exists.

**Key architecture guard:** M38.2 keeps NFQ GCP production secrets provider-native: GCP Secret Manager is the source of truth, ESO syncs through Workload Identity, Reloader owns pod restarts, and NFQ/GCP-specific architecture tests live under `tests/architecture/nfq/gcp/`.

**Key architecture guard:** M38.3 creates NFQ/GCP staging, not the Hetzner staging track from M26.9. Staging must use separate GCP state, DNS, runtime secrets, Telnyx resources, LiveKit resources, and phone numbers from production. Its runtime-secret path follows M38.2's GCP Secret Manager/ESO/Reloader pattern, while LiveKit mode intentionally differs from production: staging runs self-hosted LiveKit/SIP so latency can be compared against the production LiveKit Cloud proof before any production mode switch.

**Key architecture guard:** M39 closes the next observability gaps without lying about what the runtime emits today. Public API 5xx / latency alerts may use existing GCP edge metrics now. `agent-worker` and provider-failure paging must be backed by real emitted metrics before any alert policy claims they exist. Slack is allowed as a first-class notification destination, but not as the only alert-delivery path.

### NFQ Affidea Voice Booking

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M41.0** | [Appointment Booking Package Structure Refactor](M41.0-appointment-booking-package-structure.md) | platform | done | none | 7 |
| **M41** | [NFQ Affidea Prompt and Knowledge Foundation](M41-nfq-affidea-prompt-kb-foundation.md) | platform | done | M41.0 | 6 |
| **M41.1** | [NFQ Affidea Booking Tools and State](M41.1-nfq-affidea-booking-tools-and-state.md) | platform | not started | M41 | milestone doc only |
| **M41.2** | [Grove Grouped Flow Runtime](M41.2-grove-grouped-flow-runtime.md) | platform | not started | M41 | milestone doc only |
| **M41.3** | [NFQ Affidea Runtime Integration](M41.3-nfq-affidea-runtime-integration.md) | platform | not started | M41.1, M41.2 | milestone doc only |
| **M41.4** | [NFQ Affidea Evals and Production Readiness](M41.4-nfq-affidea-evals-and-production-readiness.md) | platform | not started | M41.3, M39 | milestone doc only |
| **M41.5** | [Affidea Agent Authoring UI Follow-On](M41.5-affidea-agent-authoring-ui-follow-on.md) | web | parked | M41.3 | milestone doc only |
| **M41.6** | [Affidea Retrieval Follow-On](M41.6-affidea-retrieval-follow-on.md) | platform | parked | M41.4 | milestone doc only |
| **M41.7** | [Agent Builder Governed Starter Repair](M41.7-agent-builder-governed-starter-repair.md) | web | in progress | M41.3 | 3 |

**Why this track exists:** the imported Affidea demo has useful business
boundaries, but its LiveKit-agent handoff runtime should not be copied into
Manibo. The implementation ports the working prompts and flow boundaries into
solution-owned assets and a Grove-native grouped flow.

**Renumbering note:** this track uses M41 because PR #950 owns the previous
milestone number.

**Why M41.0 comes first:** the target `solutions/appointment_booking` tree is
a refactor prerequisite, not prompt or provider behavior. Landing it separately
keeps the prompt copy, Affidea provider tools, and Grove runtime changes out of
the same review.

**Key architecture guard:** copy the business behavior and prompt assets, not
the demo app runtime. Affidea-specific code stays in `solutions/appointment_booking`;
generic grouped-flow support, if needed, stays product-agnostic in Grove.
Realtime booking/auth tools stay in the live turn; Temporal owns call lifecycle
and post-call work.

**Design doc coverage cross-check:**

| Design section | Covered by | Notes |
|----------------|------------|-------|
| Evidence; sections 1-6 problem, goals, options, decision | M41.0-M41.6 track guard | The whole M41 sequence follows Option C: preserve business modes, avoid copying the LiveKit runtime. |
| 7.1 parent graph topology | M41.2, M41.3 | Grove adds grouped-flow runtime; Affidea wires front desk, consultation, MRI, auth, and finalization. |
| 7.2 routing model | M41.2, M41.3 | Generic typed routing lands in Grove; Affidea routes FAQ, booking, handoff, and end-call paths. |
| 7.3 specialist subgraphs | M41, M41.1, M41.2, M41.3 | Prompts/KB, tools/state, runtime grouping, and Affidea profile wiring each own one slice. |
| 7.4 subgraph integration contract | M41.2 | Parent/subgraph compile behavior, shared state keys, and wrapper-node limits are Grove-owned. |
| 7.5 shared vs specialist state | M41.1, M41.2 | Affidea owns typed state; Grove owns namespaced grouped-flow context behavior. |
| 7.6 prompt architecture | M41 | Shared policy, node prompts, KB, and state-summary layering are prompt-foundation work. |
| 7.7 KB architecture | M41, M41.6 | Deterministic generated KB lands first; retrieval is parked until eval evidence justifies it. |
| 7.8 data boundary rules | M41, M41.1, M41.4 | Prompt/KB assets exclude live and patient data; tool/state tests and redaction proof verify it. |
| 7.9 tool and service shape | M41.1 | Provider client, booking/auth/MRI services, and prompt-compatible tool aliases live here. |
| 7.10 auth resume contract | M41.1, M41.3 | State/services define `originating_flow`; runtime integration proves resume. |
| 7.11 Temporal, LangGraph, and tool boundaries | M41.2, M41.3, M41.4 | Grove runtime, Affidea profile wiring, and production proof keep the boundary observable. |
| 7.12 live turn execution loop | M41.3, M41.4 | Browser rehearsal, voice runtime metadata, k3d proof, and artifacts cover the loop. |
| 7.13 retries and error buckets | M41.1, M41.3, M41.4 | Typed error buckets start in services/tools, then runtime/evals prove recovery paths. |
| 7.14 checkpointing, time travel, interrupts | M41.2, M41.4 | Grove owns durable grouped-flow checkpoint/replay behavior; eval proof uses it for debugging. |
| 7.15 human handoff vs interrupt | M41.3, M41.4 | Handoff is a normal tool/action path, then verified with runtime artifacts and audit-safe summaries. |
| 7.16 observability contract | M41.2, M41.4, M39 | Generic grouped spans plus Affidea spans/metrics/redaction and NFQ alert proof. |
| 8.1-8.3 demo prompt copy and first prompt files | M41 | Demo prompts are copied as source text with provenance/hash checks. |
| 8.4 YAML authoring recommendation | M41, M41.2, M41.3 | Prompt assets, grouped-flow authoring support, and governed compile/publish proof cover this. |
| 8.5 target package structure | M41.0 | The package/API structure refactor is now an explicit first milestone. |
| 8.6 governed agent-definition model | M41.3 | Affidea profile must validate through file-backed config and governed compile/publish. |
| 8.7 UI authoring model | M41.5 | Parked because first release does not need the full authoring UI. |
| 9 migration path phases 1-3 | M41, M41.1, M41.2, M41.3, M41.4 | Structure/runtime, booking correctness, prompt quality, and readiness proof are split across the active sequence. |
| 9 migration path phase 4 | M41.6 | Retrieval remains conditional and evidence-gated. |
| 10 risks and mitigations | M41.0-M41.6 | Each risk maps to the milestone that owns the mitigation; M41.4 proves the critical ones before rollout. |
| 11 open questions | M41, M41.3, M41.4, M41.6 | Front-desk FAQ is included in M41.3, STT tuning is prompt/runtime config, KB location is solution-owned, retrieval remains conditional. |

### Phase 3 — After Phase 2

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M1.2** | [Channel-Aware Evidence Rail](M1.2-obs-evidence-rail.md) | obs | done | M1.1 | — |
| **M3** | [Clinic Console Follow-Up](M3-clinic-console-followup.md) | platform | done | M21 | 5 |
| **M9** | [VOX Phase 2 — Follow-Up + Voice Sales](M9-vox-followup-voice-sales.md) | platform | not started | M6, M8 | — |

**Architecture guards for Phase 3:**
- **M3:** Builds on decomposed call-ops components from M21 (SupportDrawer, ActiveCallsTable, FollowUpQueue).
- **M9:** Email adapter MUST be in `packages/platform-core/connectors/`, NOT in `solutions/lead_capture/`.

### Phase 4 — After Phase 3

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M1.3** | [Live Streaming Cases](M1.3-obs-live-streaming.md) | obs | done | M1.2 | — |
| **M8** | [V2 Phase 2 — Voice Control Plane](M8-v2-voice-control-plane.md) | v2 | planning | none | 8 |
| **M8.2** | [Control Plane Refactor Hardening](M8.2-control-plane-refactor-hardening.md) | v2 | done | M8 | 10 |
| **M10** | [VOX Phase 2 — Schedule + Operations Agents](M10-vox-schedule-operations-agents.md) | platform | not started | M8, M9 | — |

### Phase 5 — Late stage

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M02** | [Journey Tracking & Proactive Agents](M02-obs-journey-tracking.md) | obs | not started | M1.2, M6, M9, M10 | — |
| **M18** | [V2 Phase 6 — Diagnostics + Tool Catalog](M18-v2-diagnostics-tool-catalog.md) | v2 | not started | M8, M14 | — |
| **M19** | [V2 Phase 7 — WhatsApp + Notifications (legacy placeholder)](M19-v2-whatsapp-notifications.md) | v2 | parked | M8, M14, M4 | — |

**Architecture guard for Phase 5:**
- **M18:** Tool catalog split — Grove owns runtime registry, Platform Core wraps with governance metadata (risk, ownership, provider policy).

### Future Channel Runtime Track (separate from M14 integration hub)

| ID | Title | Stream | Status | Depends on | Tasks |
|----|-------|--------|--------|------------|-------|
| **M14.1** | [Channel Runtime Foundations](M14.1-channel-runtime-foundations.md) | v2 | planning | M8, M14 | — |
| **M14.2** | [Web Chat Runtime Operations](M14.2-web-chat-runtime-operations.md) | v2 | planning | M14.1, M4 | — |
| **M14.3** | [WhatsApp Interactive Runtime](M14.3-whatsapp-interactive-runtime.md) | v2 | planning | M14, M14.1, M14.2 | — |

**Terminology lock:**
- `notification adapter` = outbound/request-response provider integration (CRM push, email send, SMS send, Slack notification)
- `interactive channel runtime` = two-way conversational transport runtime (website widget chat, WhatsApp, and future Slack interactive if a requirement is ever added)
- `provider account/runtime` = tenant-scoped installed provider state used by an interactive channel runtime

---

## Dependency Graph

```
PHASE 0 (first — moves solution UI to packages)
  M11 (solution package isolation + source distribution)
  │
  ▼
PHASE 1 (start in parallel after M11 T05)
  M1   M21   M4   M14   M13   M12   M17
  │    │     │     │
  │    │     │     └──► M16 (driver verification)
  │    │     ├──► M5 (KB + guardrails)
  │    │     ├──► M6 (lead capture) ──► M7 (analytics)
  │    │     │         │
  ▼    ▼     │         ▼
PHASE 2      │        M9 ─────────┐
  M1.1 M20   │      (follow-up)   │
  │    │     │                    │
  │    M15   │                    │
  │     │    │                    │
  │     ▼    │                    │
PHASE 3 │    │                    │
  M1.2  M3   │                    │
  │      │   │                    │
  │      ▼   │                    ▼
PHASE 4  M8 ───► M8.2            M10
  M1.3  (voice control) (optional hardening backlog) (schedule/ops)
  │      │                    │
  ▼      ├──► M14.1 (channel runtime foundations)
PHASE 5  │        │
  M02 ◄───┘       ├──► M14.2 (web chat runtime)
  (journey tracking — needs M1.2, M6, M9, M10)
                   ├──► M14.3 (WhatsApp interactive; also requires M14 transports)
                   ├──► future Slack interactive (no backlog until requirement exists)
                   ├──► M18 (diagnostics)
                   └──► M19 (legacy placeholder)
```

---

## Three Parallel Workstreams

| Lane | Milestones (in order) | Critical? |
|------|----------------------|-----------|
| **UI/UX** | M11 → M21 + M1 (parallel) → M20 → M3, M15, **M27** → **M28**; observability follow-on is M1.1 → M1.2 → M1.3 → M02 | Yes — blocks operator experience |
| **V2/VOX** | M4 → M5, M6 → M7, M8 + M6 → M9 → M10, M8 + M14 → M18; M8 → M8.2 remains optional hardening backlog until explicitly activated | Yes — blocks V2 realtime coherence and later VOX/channel delivery |
| **Future Channel Runtime** | M8 + M14 (prereqs) → M14.1 → M14.2 (also needs M4) → M14.3 | No — post-M4 runtime hardening and channel expansion; planning-only until explicitly activated by the human |
| **CI/CD** | M26 (complete) → M26.1 (active); M26.4 (active) | Yes — blocks merge throughput, review authority, and delivery trust |
| **Infra** | M26.3 (done) | No — completed repo-structure cleanup for deployment and runtime path ownership |
| **Platform** | M12, M13, M17; M14 is planning backlog only until a real regression or new checklist row activates it → M16 later depends on whatever M14 scope is honestly activated | No — independent features |

**Start with:** M11 first (solution isolation), then M21 + M1 + M4 in parallel. Start M20 only after M21 lands the shared component prerequisites. Keep M14 as planning backlog only until a real regression or new checklist row activates it. Do not start the future channel-runtime lane before `M8` plus explicit `M14` activation make `M14.1` honest; do not start `M14.2` before `M4`; do not start `M14.3` before `M14`, `M14.1`, and `M14.2` are all legitimately active. Cross-cutting CI milestone `M26` is complete; `M26.1` is the active follow-on cleanup for bot PR recovery and control-plane simplification. `M26.3` completed on 2026-04-03, and `M26.4` is the active follow-on for mainline `k3d` proof consolidation. Execution priority otherwise follows this milestone catalog plus explicit human overrides.

## Partial Parallelism Across M11, M20, and M21

M11 T01-T05 (solution package move + registry) is the structural prerequisite. M1 is independent of solution page locations. M21 T16 (bookings decomposition) depends on M11 finishing. M20 depends on the shared component improvements that M21 lands.

```
Week 1:  M11 T01-T05 (move solution UI to packages, wire registry)
Week 2:  M11 T06-T14 (profiles, export, tests) ║ M1 (all 8 tasks) ║ M21 T01-T03,T05,T08,T15 (non-dep tasks)
Week 3:  M21 T04-T07,T09-T14 (call-ops decomposition)
Week 4:  M21 T16-T17 (bookings decomp in new location + verification) ║ M20 T01-T04 (components)
Week 5:  M20 T05-T16 (quick wins + integration)
```

---

## Architecture Guards

See [ARCHITECTURE_GUARDS.md](ARCHITECTURE_GUARDS.md) for the full set. Key rules:

1. **Grove independence** — no product-specific logic in `packages/grove/`. Webhook sender, notification actions, CRM logic → Platform Core.
2. **No cross-solution imports** — solutions never import from each other. Shared types live in `packages/platform-core/contracts/`.
3. **App shell thinness** — `apps/*` host transports and UI rendering. No business logic.
4. **Frontend solution isolation** — after M11, solution pages live in `solutions/{name}/ui/`, not `apps/web/src/solutions/`.
5. **Test separation** — pure solution tests move into `solutions/{name}/tests/` (file-level, not markers). Platform fixture tests stay in `apps/*/tests/`.

---

## Cross-Cutting Snapshots

| Tracker | Purpose |
|---------|---------|
| [V2 architecture phase map](exec-plans/v2_canonical_architecture_refresh.md) | Legacy/reference V2 contract and phase snapshot |

## Key Reference Documents

| Document | Purpose |
|----------|---------|
| [Architecture Spine](../arch/arch_spine.md) | Generated entry point — layer model, principles, invariants |
| [Architecture (wiki)](../../wiki/architecture/architecture.md) | Canonical architecture (source of truth) |
| [Architecture Guards](ARCHITECTURE_GUARDS.md) | Layer constraints for all milestones (Grove independence, cross-solution coupling, app shell boundaries) |
| [Requirements Checklist](../requirements/checklist.md) | Product feature completion tracking |
| [UI Requirements](../requirements/ui-requirements.md) | Frontend coverage + API mapping |
| [Deployment Console UX Spec](../../wiki/design-docs/deployment-console-ux-spec.md) | M20 — page archetypes, wireframes, component adoption plan, action design, responsive strategy |
| [Operator Console UX Spec](../../wiki/design-docs/operator-console-ux-spec.md) | M21 — call-ops decomposition, sidebar reorg, support drawer, action priority |
| [Workflow Client UX Spec](../../wiki/design-docs/workflow-client-ux-spec.md) | M15 — automations page alignment with M20/M21 grammar |
| [Solution Package Isolation Spec](../../wiki/design-docs/solution-package-isolation-spec.md) | M11 — solution UI as npm packages, export pipeline, profile builds |
| [Observability UX Vision](exec-plans/v2_ui_ux_control_system_execution_plan.md) | Case-first evidence-rail design direction |
| [V2 Architecture](exec-plans/v2_canonical_architecture_refresh.md) | V2 contract definitions and phase map |

## V2 Phase → Milestone Mapping

| V2 Phase | Name | Status | Milestone | Notes |
|----------|------|--------|-----------|-------|
| 0 | Freeze V2 contract | done (100%) | — | Already merged |
| 1 | Schema-first connectors | done (100%) | — | PR #575 merged |
| 2 | Voice control plane | 30-35% | **M8** | Partial groundwork exists; canonical contract and durable commands still missing |
| 3 | Web chat + website sales | 10-15% | **M4**, M5, M6 | Public ingress, widget, KB, leads |
| 4 | Content governance + guardrails | 10% | **M5**, M15 | KB lifecycle, workflow templates UI |
| 5 | Cross-channel journey | 10% | **M02**, M9 | Journey tracking, FNA sequences |
| 6 | Diagnostics + tool catalog | 15-20% | **M18** | Health rollups, alerts, provider policy |
| 7 | Channel runtime hardening + expansion | 0-5% | **M14.1**, **M14.2**, **M14.3**, M19 (legacy) | Web-chat runtime ops and WhatsApp interactive. Future Slack interactive remains out of backlog until a requirement exists. |
| 8 | Capability hosts | 0% | — | Explicitly deferred, no requirement |

## Legacy Exec Plans

`docs/milestones/exec-plans/` is legacy reference material:

- `reference/` — architecture visions, CI/infra plans, design docs
- `active/` is legacy-exception only; use it only when a milestone, requirement, or ops doc explicitly points there
- `` under `docs/milestones/` is the archive for finished milestone docs

**Milestones and tasks are the source of truth for tracking.** New work starts in `docs/milestones/` and `docs/tasks/`.
