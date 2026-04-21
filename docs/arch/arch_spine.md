# Architecture Spine (Generated)

> GENERATED FILE — DO NOT EDIT.
> Source: `wiki/architecture/architecture.md` (canonical).
> Generator: `tools/scripts/sync_arch_spine.py`.

## Navigation
- Canonical: `wiki/architecture/architecture.md`
- Current status: `wiki/architecture/architecture.md (status section)`
- Task maps:
  - `docs/arch/maps/solutions.md`
  - `docs/arch/maps/tenancy_auth.md`
  - `docs/arch/maps/voice.md`
  - `docs/arch/maps/deployment.md`
  - `docs/arch/maps/governance.md`
- Extracted sections:
  - §1 Executive Summary
  - §3 Architecture Principles (Hard Rules)
  - §4 Layering Model (preamble only)
  - §15 Architecture Invariants Checklist

---

<!-- BEGIN EXCERPT: wiki/architecture/architecture.md §1 -->
## 1. Executive Summary

Manibo is a reusable platform for governed AI-driven voice, messaging, and public-ingress customer operations across many independent organizations from one codebase. The platform supports provider-managed deployments, partner-operated shared deployments, and dedicated deployments without forking the product model.

Business behavior is supplied through installable packages. The primary V2 package families are:

- business solutions
- channel packages
- provider packs

Optional extension families such as capability hosts or skill packs may exist later, but they are not part of the core V2 surface.

The platform is built on four persistent architectural pillars:

- Grove is the product-agnostic runtime and agent framework. It owns execution primitives, tool runtime behavior, message normalization, and voice runtime glue. Grove never imports platform or business capability code.
- Platform Core owns organization isolation, governance, package composition, channel/runtime lifecycles, public ingress, control plane, governed content, workflow bindings, diagnostics, billing, and observability contracts.
- Temporal owns durable workflows, retries, signals, timers, and long-running process coordination.
- LiveKit owns real-time media transport, rooms, SIP ingress and egress, and voice-session media boundaries.

This document defines:

- system boundaries
- layer ownership
- package-family composition rules
- role-scoped workbench composition and solution-contributed UI rules
- organization isolation and state placement
- control-plane and public-ingress contracts
- content, workflow, and provider governance
- customer source-handoff and constrained-distribution rules
- deployment and delivery rules
- non-negotiable invariants

This document does not define:

- current implementation completeness
- migration phase sequencing
- backlog prioritization
- temporary rollout workarounds

Those belong in status docs and execution plans, not in the canonical architecture.

<!-- END EXCERPT: wiki/architecture/architecture.md §1 -->

<!-- BEGIN EXCERPT: wiki/architecture/architecture.md §3 -->
## 3. Architecture Principles (Hard Rules)

1. **Grove Must Remain Independent**
   `packages/grove/` and `packages/grove-voice-livekit/` are product-agnostic. They never import platform-core or installable package code.

2. **The Four-Layer Model Is Fixed**
   V2 broadens Layer 2 and Layer 3 responsibilities, but it does not add a fifth layer.

3. **Installable Package Families Over Client-Specific Forks**
   Business capability logic, channel contributions, and provider packs are installed packages governed by manifests and contracts, not per-customer code trees.

4. **Installed-Only Discovery**
   The platform discovers installable packages from installed entry points only. If a package is not installed, the deployment must behave as if it does not exist.

5. **Build-Time Artifact Exclusion And Customer Source Handoff**
   Non-contracted installable packages must be physically absent from constrained deployment artifacts, and customer source handoffs must use an allowlist-based export that physically excludes non-contracted packages, private code that still lives inside shared app trees, and out-of-scope tests. Runtime gating alone is insufficient for either job.

6. **Strict Layering**
   Lower layers never import higher layers. Apps compose. Packages implement.

7. **No Sideways Layer-3 Coupling Without Platform Contracts**
   Business solutions, channel packages, and provider packs interact through Layer 2 contracts, manifests, workflows, signals, or events. They do not form an ungoverned import mesh.

8. **Organization-Scoped Isolation Is Mandatory**
   Access, data, configuration, billing, workflow execution, and channel runtime state are all scoped to organization context unless explicitly declared deployment-scoped.

9. **Public Ingress Binds Organization at Ingress**
   Anonymous customer flows resolve organization from widget identity or publishable key before a session exists. Guest sessions never upgrade into operator or admin scope.

10. **Fail Closed by Default**
    Unknown scope, unknown role, invalid dependency graph, invalid composition state, missing published content, unresolved policy, or missing capability assignment must block execution.

11. **Composition and Artifact Selection Are Prevalidated**
    Hot-path request handling may load only previously validated composition state and pinned runtime artifacts. It may not recompute governed package graphs on the fly.

12. **Persisted Truth Precedes Projection**
    Control-plane events, SSE streams, and operator-facing projections are derived from durable truth or append-only outbox records, never from in-memory side effects alone.

13. **Published Content and Workflow Bindings Are Governed Artifacts**
    Runtime execution and public surfaces consume immutable published content refs and immutable published workflow bindings, not mutable drafts.

14. **Thin App Shells**
    `apps/*` host transports, startup wiring, and composition only. They do not implement durable business rules, and they do not hard-code business-specific workbench behavior that should come from governed package contributions.

15. **Auth Is an Abstraction, Not a Vendor Lock**
    The platform depends on an OIDC/JWT contract. Identity providers are replaceable.

16. **Operational Claims Require Evidence**
    Every normative runtime and observability claim must have a test path, proof path, or explicit external dependency note.

17. **Clean Spec, Separate Status**
    Architecture describes the target system. Current implementation state and rollout sequencing are tracked elsewhere and must not contaminate the canonical spec.

<!-- END EXCERPT: wiki/architecture/architecture.md §3 -->

<!-- BEGIN EXCERPT: wiki/architecture/architecture.md §4 (preamble) -->
## 4. Layering Model

```text
+-----------------------------------------------------------------------------------+
| Layer 4: APPS (thin composition shells)                                           |
| apps/api | apps/web | apps/temporal-worker | apps/agent-worker                    |
| host transports, public surfaces, startup wiring                                  |
+-----------------------------------------------------------------------------------+
| Layer 3: INSTALLABLE PACKAGES                                                     |
| business solutions | channel packages | provider packs | optional extension packs |
+-----------------------------------------------------------------------------------+
| Layer 2: PLATFORM CORE                                                            |
| auth + governance | composition | channels | public_ingress | control_plane       |
| content_governance | workflow_registry | diagnostics | billing | package registry |
+-----------------------------------------------------------------------------------+
| Layer 1: GROVE FRAMEWORK                                                          |
| agent runtime | tool runtime | event normalization | channel adapters | voice     |
+-----------------------------------------------------------------------------------+
```

| Layer | Package(s) | Owns | May Import |
| --- | --- | --- | --- |
| 1 | `packages/grove`, `packages/grove-voice-livekit` | runtime, tools, execution primitives, event normalization, voice glue | stdlib and third-party libraries only |
| 2 | `packages/platform-core` | auth, isolation, package registry, public ingress, control plane, channels, content governance, workflow registry, diagnostics, billing | Layer 1 |
| 3 | installable package families | business solutions, channel contributions, provider packs, optional extension packs | Layers 1 and 2 |
| 4 | `apps/*` | composition, entry points, transports, UI shells | Layers 1, 2, and 3 |

<!-- END EXCERPT: wiki/architecture/architecture.md §4 (preamble) -->

<!-- BEGIN EXCERPT: wiki/architecture/architecture.md §15 -->
## 15. Architecture Invariants Checklist

Every implementation and PR must preserve these invariants.

1. Every organization-scoped shared-table query sets `SET LOCAL app.organization_id` before data access.
2. Every route and control-plane surface declares its scope mode explicitly.
3. Deployment-scoped routes cannot read organization namespaces or shared Grove records by accident.
4. Organization identity is resolved server-side, never trusted from client headers or bodies.
5. JWT verification uses asymmetric signatures only.
6. Issuer validation happens before JWKS fetch.
7. Organization authorization comes from stored memberships, not role claims in tokens.
8. Public ingress binds organization from widget identity or publishable key before any guest session exists.
9. Guest-session path parameters must match the verified guest-session control record before continuation mutation.
10. Public-ingress tokens never grant operator or admin capabilities.
11. Package dependency graphs are acyclic and family-aware.
12. Installed-only discovery is authoritative for every active package family.
13. Non-contracted installable packages are excluded at build time for constrained deployments.
14. Grove contains no platform-specific business logic.
15. Layer 3 packages do not bypass Layer 2 contracts through sideways import meshes.
16. Channel runtime state lives in platform core, not in connectors or Grove.
17. Customer-visible public chat history is persisted in organization-visible storage; Grove message state is derivative only.
18. Runtime-artifact selection uses a valid organization composition version; hot paths do not recompute package graphs.
19. Already-running sessions and workflows remain pinned to the `composition_version` and `artifact_hash` they started with.
20. Runtime and public ingress consume only published content refs and published bindings, never drafts.
21. Workflow runs record template version, binding version, composition version, and artifact hash.
22. Control-plane commands persist before authorization outcome is returned.
23. Control-plane events are emitted from persisted truth or append-only outbox records, never in-memory side effects alone.
24. Replay streams are scoped by `topic + scope_mode + organization_id + audience_kind`.
25. Unknown control-plane event types must not corrupt client state.
26. Webhook authenticity is verified before side effects.
27. Manual takeover is an explicit audited state transition.
28. Organization lifecycle state blocks new runtime starts when suspended or offboarded.
29. Migration state is tracked in one authoritative shared table.
30. Organization namespace migrations are idempotent.
31. Workflow changes preserve determinism through versioning or versioned names.
32. Mixed worker versions are supported during rollout windows.
33. Secrets are represented as secret references, not plaintext config.
34. Correlation IDs propagate across API, workflow, connector, channel, public-ingress, control-plane, and voice boundaries.
35. Privacy traversal covers guest sessions, transcripts, delivery logs, and derived runtime state.
36. Diagnostics and alerting surfaces are scope-safe for organization and deployment views.
37. Tool-catalog entries map to real runtime tool IDs and declare ownership and risk metadata.
38. Unknown configuration keys fail compilation.
39. Policy-pack and provider-policy resolution failures fail closed.
40. Connector destinations are allowlisted.
41. Usage metering differentiates production and test usage.
42. Observability claims require proof paths across local, parity, and deployed environments.
43. Sensitive business fields captured from voice retain captured and normalized values, emit explicit lifecycle events, and declare retry, handoff, or fail-closed behavior instead of relying on prompt-only agreement.
44. Voice proof and eval outputs use the shared artifact envelope and marker semantics across browser, room, synthetic-audio, and reliability surfaces.
45. Role-scoped workbench behavior is composed from governed package contributions; app shells do not hard-code business-specific solution navigation or landing logic as the durable source of truth.
46. Customer source handoff uses an allowlist-based export that physically excludes non-contracted packages, private code inside shared app trees, and out-of-scope tests; runtime artifact exclusion is necessary but not sufficient.

<!-- END EXCERPT: wiki/architecture/architecture.md §15 -->
