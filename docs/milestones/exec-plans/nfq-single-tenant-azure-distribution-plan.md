# NFQ Dedicated Single-Tenant (Azure) — Distribution & CI Plan (No Source)

> **Status:** Draft  
> **Created:** 2026-02-26  
> **Audience:** Vendor + NFQ platform engineering + NFQ delivery/ops  
> **Constraint:** End-customer receives **no source code**; only deployable artifacts.

## 0) Reality check (this is not “just deploy API+UI”)

A “dedicated” customer-hosted instance implies you must ship and support:

- upgrade-safe migrations
- deterministic builds
- security scanning + SBOM
- secrets management guidance
- rollback strategy
- operational runbook

If you don’t want those responsibilities, don’t sell “self-hosted”.

## 1) Product definition

### Parties

- **Vendor (Manibo):** builds and signs artifacts.
- **Licensee (NFQ):** resells + deploys/supports for their end customer.
- **Dedicated Customer (end client):** runs a single tenant on their own Azure subscription.

### UI surfaces shipped

- **Tenant Console** (required)
- **Deployment Console** (optional; only if the dedicated customer needs multi-tenant ops — usually they don’t)

### Required deployment profile

- `DEPLOYMENT_PROFILE=nfq_dedicated_single_tenant`

**Goal:** produce artifacts where non-licensed solutions/brands are physically absent (same “build-time exclusion” principle as the source mirror),
but shipped as containers instead of source code.

## 2) Artifact set (what you actually ship)

Ship versioned, immutable artifacts. Minimum set:

- `platform-api` container
- `temporal-worker` container
- `agent-worker` container
- `web` container (or static export behind a CDN, but start with container)
- Helm chart (AKS) **or** Azure Container Apps template (pick one)

Self-hosted voice + SIP adds **mandatory** dependency artifacts:

- LiveKit server deployment (chart or pinned upstream chart version)
- LiveKit SIP service deployment (self-hosted)
- Redis for SIP service (if required by the SIP service)
- TURN (coturn) if you want calls to work behind restrictive NATs/firewalls

Support artifacts:

- SBOMs for each container (SPDX or CycloneDX)
- image signatures + provenance attestations
- changelog/release notes
- upgrade runbook (migrations + rollback)

## 3) External dependencies (you must choose the operating model)

You cannot be vague here. Pick one per deal.

**Decision (2026-02-26):** **Option A — Fully self-hosted**.

That means: no Temporal Cloud, no LiveKit Cloud. Everything runs inside the dedicated customer's Azure subscription.
If you ship this, you also own the operational blast radius when their cluster is misconfigured.

### Option A — Fully self-hosted (Azure only)

Customer runs:

- Postgres (**managed Azure Database for PostgreSQL is allowed and is the default recommendation**; we are not in the business of being DBAs)
- Temporal (self-hosted)
- LiveKit (self-hosted)
- Object storage for recordings/artifacts (**managed Azure Blob is allowed and is the default recommendation**)

This is operationally heavy. Only do it if they pay for it.

### Option B — Hybrid managed control plane (recommended STTCPW)

Customer runs only your app containers and uses managed services:

- Azure Database for PostgreSQL (managed)
- Temporal Cloud (or vendor-managed Temporal)
- LiveKit Cloud (or vendor-managed LiveKit)
- Azure Blob for recordings

This is dramatically easier to support.

## 3.0) LiveKit/SIP profiles (the practical truth)

You cannot reliably do PSTN from a laptop behind NAT. For SIP/PSTN you need a **public SIP endpoint** (UDP + RTP ranges).

We use three profiles (see `wiki/ops/voice-call-local-demo.md` for the concrete runbook):

| Profile | LiveKit media plane | SIP/PSTN | Where it runs | Status |
|---|---|---:|---|---|
| A — Cloud SIP | LiveKit Cloud | ✅ | LiveKit Cloud + carrier | Demo-safe (NOT “fully self-hosted”) |
| B — AKS Self-host SIP | Self-host LiveKit Server + SIP service | ✅ | Dedicated customer AKS + carrier | **Required for dedicated** |
| C — Local RTC-only | Local LiveKit Server | ❌ | Laptop + Docker Compose | Dev/testing only |

For `DEPLOYMENT_PROFILE=nfq_dedicated_single_tenant`, **Profile B is the supported production topology**.

## 3.1) Reference architecture (what we officially support)

If this is “product”, you need a single supported topology. Start with AKS + Helm.

Minimum supported Azure topology:

- **AKS** cluster (1+ node pools; separate pool for media workloads if needed)
- **Ingress** (NGINX ingress controller) + TLS termination
- **Postgres**: Azure Database for PostgreSQL (managed)
- **Temporal** Helm chart (frontend + history + matching + worker) + persistence
- **LiveKit server** Helm chart + TURN configuration
- **LiveKit SIP service** (self-hosted) + **Redis** (if required)
- **Object storage**: Azure Blob (managed)
- **Observability**: Prometheus + Grafana (or Azure Monitor; but document what the product relies on)

If you allow “any topology”, you’ll be debugging random clusters forever. Don’t.

### Voice + SIP is in scope (2026-02-26)

Dedicated customers must be able to run real phone calls via SIP.

This forces product-level requirements:

- A supported SIP trunk provider (Telnyx/Twilio/etc.) + credential handling via `SecretRef`
- A public DNS name/IP for SIP ingress
- Explicit network policy and firewall rules for SIP + RTP + WebRTC + TURN
- E2E regression coverage that proves SIP works (see CI section below)

**Current repo gap:** the existing provisioning tooling and SIP E2E tests are written against **LiveKit Cloud with SIP enabled** (see
`tools/scripts/setup-sip.py` and `packages/grove-voice-livekit/tests/e2e/test_voice_sip_e2e.py`). That is incompatible with “fully self-hosted”.
You must replace those assumptions with a self-hosted LiveKit SIP service deployment and a matching provisioning/test story.

### Storage implementation gap (current repo reality)

Today, platform recordings signed URLs are implemented via an S3-compatible provider (`platform_core.recordings.s3_provider`) and use
`StorageRef` values like `s3://bucket/key`.

If Azure Blob is the default for dedicated deployments, you must implement:

- `azblob://<container>/<blob>` `StorageRef` parsing
- an Azure Blob signed URL provider (or a storage abstraction that supports multiple providers)
- CI/E2E coverage proving recordings signed URLs work against the chosen provider

Until that exists, the “default” in this doc is aspirational and the actual supported storage is MinIO/S3-compatible.

## 4) Versioning rules (keep it boring)

Use one platform version per release:

- `nfq-dedicated/vX.Y.Z`

All containers share the same `X.Y.Z`. No per-service versions for now.

## 5) Migration strategy (dedicated single tenant)

Even in “single tenant” mode, you still have:

- Grove migrations (`packages/grove/alembic.ini`)
- Platform public schema migrations (`packages/platform-core/alembic_public.ini`)
- Tenant schema migrations (either:
  - via solution migration runner (preferred), or
  - via `TENANT_SCHEMA=tenant_<customer>` manual execution for bootstrap)

**Bootstrap:** create exactly one tenant and treat it as the only tenant.

## 6) CI requirements (must be enforced upstream)

If CI doesn’t produce these guarantees, you will ship broken upgrades.

### Build & test gates (existing + additions)

- Python gates (already exist in upstream CI)
  - `uv sync`, `pyright`, `ruff`, pytest suites
  - compose E2E tests (`tools/scripts/compose-worktree.sh test-e2e`, `tools/scripts/e2e-release-rollout.sh`)
- Web gates (missing today; must be added once UI is real)
  - `pnpm install --frozen-lockfile` (requires `pnpm-lock.yaml`)
  - `pnpm -C apps/web lint`, `pnpm -C apps/web check-types`, `pnpm -C apps/web build`

### Profile exclusion gates (required)

For `DEPLOYMENT_PROFILE=nfq_dedicated_single_tenant`, CI must prove:

- excluded solutions are not importable
- excluded solution entry points are absent
- excluded brand packs are absent

This is the “binary equivalent” of the source allowlist export.

### Supply chain gates (required for no-source distribution)

- Build container images from a clean context (no `COPY . .` for everything)
- Generate SBOM per image
- Vulnerability scan (fail on critical/high per policy)
- Sign images (cosign) and publish provenance attestation

### Self-hosted dependency gates (required because you chose Option A)

CI must prove the platform works against **self-hosted** Temporal + LiveKit, not only mocked/unit tests.

Minimum proof gate (local/CI compose is acceptable as a first step):

- Start compose stack with **Temporal + LiveKit + Postgres + object storage**
- Run E2E smoke that covers:
  - tenant onboard
  - create/apply platform release unit rollout
  - call ops critical path (at least token minting + transcript stream if voice is included)

If you cannot run this in CI, you are shipping “self-hosted” blind.

### SIP E2E gates (required because voice+SIP is in scope)

Do not pretend the existing voice compose E2E is a SIP proof. It is not.

At minimum you need:

- **Tier 0 (per PR):** self-hosted LiveKit + Temporal + workers come up; call-ops token minting + room lifecycle works (no PSTN call).
- **Tier 1 (periodic / pre-release):** real outbound SIP call to a test number using the supported SIP carrier credentials and the self-hosted SIP service.

Run Tier 1 in a controlled staging environment (Azure) with test credentials; do not run it on every PR.

## 7) Release pipeline (vendor → NFQ → customer)

1) Vendor creates release tag `nfq-dedicated/vX.Y.Z`.
2) CI builds + tests + signs + publishes containers to a registry NFQ can pull from (or exports to NFQ’s registry).
3) CI publishes a chart/template bundle pinned to image digests.
4) NFQ deploys to the customer’s Azure subscription using the bundle.
5) NFQ runs migrations (public + grove), then onboards the single tenant, then applies an in-product release unit.

## 8) What “no source code” forces you to do

- Provide a **supported config surface** (env vars, Helm values); no “edit the code”.
- Provide a **supportable upgrade path** (same commands every time; no tribal knowledge).
- Provide **artifact exclusion proofs** (license enforcement via what’s physically shipped, not legal hopes).

## 9) Open questions (blockers)

- Which SIP carrier(s) are officially supported for dedicated deployments (start with exactly one)?
- Do you require inbound SIP on day 1, or outbound-only is acceptable for v1?
- Are recordings required in dedicated mode on day 1? If yes, the Azure Blob signed URL provider becomes a P0 prerequisite.
- Do you ship the Deployment Console in dedicated mode, or only the Tenant Console?
