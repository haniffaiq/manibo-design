# NFQ Deployment (Source Distribution) — Release & Migration Plan (Upstream → NFQ)

> **Status:** Draft  
> **Created:** 2026-02-26  
> **Scope:** Full stack (Python backend + Temporal workers + Next.js web UI)  
> **Primary constraint:** **source-level separation** (NFQ receives only in-scope code; out-of-scope code is physically absent)

## 0) Naming (stop calling everything “SaaS UI”)

There are 3 parties and 2 shipped UI surfaces. Use these names consistently in code + docs:

### Parties

- **Upstream:** the canonical repo/release source.
- **NFQ:** operator of their own **deployment** (multi-tenant).
- **Tenant (NFQ customer):** an end-customer tenant (organization) inside the NFQ deployment.

### UI surfaces (shipped)

- **Deployment Console:** cross-tenant ops inside a single deployment (role: `super_admin`).
- **Tenant Console:** tenant-scoped UI used by each tenant’s admins/operators.

Your earlier requirement “NFQ must not see the SaaS UI” is imprecise. The real requirement is:

- NFQ **must receive** Deployment Console + Tenant Console (they operate multi-tenant).
- NFQ must **not receive** any upstream-only internal ops surfaces and must not receive **other clients’ solutions/brands**.

## 1) Deployment model decision (confirmed)

White-label is **per deployment**, not per tenant:

- NFQ runs one NFQ-branded deployment.
- NFQ tenants share the same product UI; differences are via **enabled solutions** and **agent definitions/config**, not per-tenant branding.

## 2) Repo topology (no forks)

Forks are a divergence machine. Don’t do it.

### Repos

- **Upstream repo:** `manibo/platform` (this repo) — source of truth.
- **Downstream repo:** `nfq/platform` (GitHub) — filtered mirror; NFQ builds and deploys from this.

### Collaboration rule (non-negotiable)

NFQ cannot access upstream. Therefore:

- NFQ contributions land as PRs in `nfq/platform`.
- Vendor **must backport** (cherry-pick) accepted NFQ commits into upstream.
- Anything not backported is **unsupported** (otherwise you die by merge conflicts).

## 3) Source distribution boundaries (allowlist, not denylist)

Create an explicit “NFQ distribution profile” and treat it like a build target.

### Profile identifier

- `DEPLOYMENT_PROFILE=nfq`

### Allowed code (minimum)

- Python:
  - `packages/grove/`
  - `packages/platform-core/`
  - `packages/grove-voice-livekit/`
  - `apps/api/`
  - `apps/temporal-worker/`
  - `apps/agent-worker/`
  - `solutions/<allowlisted>/` (NFQ-only; start with `telematics_ingestion`, `driver_verification`, `call_monitoring`)
- Web:
  - `apps/web/` (Deployment Console + Tenant Console)
  - `packages/ui/` (if/when introduced)
  - `solutions/<allowlisted>/ui/` (if/when introduced)
- Ops/dev (only what NFQ needs to run/build):
  - `docker-compose*.yml`, `docker/` (only non-secret assets)
  - `tools/scripts/compose-worktree.sh`, `tools/scripts/e2e-release-rollout.sh` (or NFQ equivalents)
  - `pyproject.toml`, `uv.lock`
  - `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (**required** once web becomes real)

### Forbidden code (examples; adapt as it becomes real)

- Any upstream-only internal ops UI and backend surfaces that mention/manipulate **multiple deployments/operators**.
- Any solutions not contracted for NFQ (e.g. VOX-specific solutions).
- Any brand packs other than NFQ (unless you intentionally ship multiple brands).
- Any upstream-only infrastructure modules containing secrets, customer lists, billing systems, etc.

## 4) Release types (two different “releases” — do not mix them)

### 4.1 Software Release (code + containers)

This is what you ship to NFQ via repo sync PRs and/or container images.

- Recommended versioning: **one platform version** `X.Y.Z` for the whole deployment profile.
- Tag format: `nfq/vX.Y.Z` (or `release/nfq/vX.Y.Z`).

### 4.2 Platform Release Unit (in-product rollout)

This is the existing platform primitive (create/apply releases) used *inside* the NFQ deployment to roll out solution versions,
platform defaults, and governed agent artifacts to tenants.

Software releases deliver the machinery; platform release units use it.

## 5) Database migration plan (NFQ deployment)

There are three migration planes in this repo today:

1) **Grove schema** (shared framework DB objects)
   - Command: `uv run python -m alembic -c packages/grove/alembic.ini upgrade head`
2) **Platform public schema** (deployment-wide tables: tenants, users, audit, releases, etc.)
   - Command: `ALEMBIC_DATABASE_URL=... uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
3) **Tenant schema** (per-tenant tables)
   - Mechanism: **solution migration runner + desired/active revision state machine** (preferred)
   - Manual escape hatch (per tenant schema): `TENANT_SCHEMA=tenant_acme ALEMBIC_DATABASE_URL=... uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`

### Additive-only rule (already in `wiki/architecture/architecture.md`)

- **PATCH/MINOR:** additive-only migrations (new tables/columns with defaults).
- **MAJOR:** destructive changes allowed, but require expand/contract.

If you violate this, NFQ upgrades will be outages.

## 6) Release delivery pipeline (Upstream → NFQ PR)

### Step A — Cut a release in upstream

- Decide the platform version `X.Y.Z`.
- Ensure the NFQ deployment profile build is green (see CI gates below).

### Step B — Produce a filtered export

- Generate a clean export tree from upstream using an **allowlist** tied to `DEPLOYMENT_PROFILE=nfq`.
- The export must include only the allowlisted solutions and NFQ brand pack(s).

### Step C — Open a PR in the NFQ repo

- Push the export to `nfq/platform` branch `sync/upstream/nfq-vX.Y.Z`.
- Open PR targeting `nfq/platform:main`.

This is how you get “release → NFQ (PR)” without giving NFQ upstream access.

## 7) What CI must do (minimum viable gates)

There are two CI systems: **upstream gates** (release confidence) and **downstream gates** (NFQ confidence).

### Current repo gaps (fix before calling this a “product”)

- Backend CI exists; frontend CI does **not** (no pnpm job, no deterministic `pnpm-lock.yaml`).
- `apps/web/` has no test harness (no unit tests, no Playwright). At minimum you need lint + typecheck + build.

### 7.1 Upstream CI — per PR to `main`

Already exists for Python (`.github/workflows/ci.yml`). Add NFQ-profile gates:

- **Python quality**
  - `uv sync`
  - `uv run pyright -p pyrightconfig.ci.json`
  - `uv run ruff check . --exclude=.venv`
  - `uv run ruff format --check . --exclude .venv`
  - Payload typing guard: `python3 tools/scripts/check_payload_types.py`
- **Migrations smoke**
  - `uv run python -m alembic -c packages/grove/alembic.ini upgrade head`
  - `ALEMBIC_DATABASE_URL=... uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- **Backend tests**
  - Unit + integration (existing gates)
  - Compose E2E gates (existing) including `tools/scripts/e2e-release-rollout.sh`
- **NFQ artifact exclusion gate (required)**
  - Build/export for `DEPLOYMENT_PROFILE=nfq`
  - Fail if forbidden paths/imports/brands/solutions exist in the export

### 7.2 Downstream CI (NFQ repo) — per sync PR

NFQ should run the same functional gates on what they actually received:

- `uv sync` + Python lint/typecheck/tests (same as upstream)
- Docker compose smoke for the platform profile
- E2E smoke: at least one end-to-end “tenant onboard → call flow wiring → release rollout” test (reuse the existing compose tests)
- Web gates (once UI is real)
  - `pnpm install --frozen-lockfile` (**requires `pnpm-lock.yaml`**)
  - `pnpm -C apps/web lint`
  - `pnpm -C apps/web check-types`
  - `pnpm -C apps/web build`

If NFQ can’t run this, your “white-label product” is a lie — they won’t be able to validate upgrades safely.

## 8) First-time “migration” to NFQ (bootstrap)

Bootstrap is not the same as ongoing releases:

1) Upstream generates the initial filtered export (v0.1.0 or v1.0.0 — pick one and be consistent).
2) NFQ provisions infra and secrets (their responsibility).
3) NFQ deploys API + workers + web.
4) NFQ runs **public schema + grove schema migrations** once.
5) NFQ onboards the first tenant via `POST /admin/tenants/onboard`.
6) NFQ seeds platform defaults via `POST /admin/platform-defaults`.
7) NFQ creates and applies a platform release unit to that tenant (release rollout workflow).

## 9) Ongoing upgrades (NFQ runbook)

Per software release PR:

1) Merge sync PR.
2) Build & deploy new containers (blue/green or rolling).
3) Run grove + public schema migrations.
4) Run platform release rollout (in-product) to migrate/refresh tenant state gradually.
5) Verify health + key E2E flows.

## 10) Open problems you must decide (don’t dodge)

- Which solutions are in the NFQ allowlist on day 1: start with `telematics_ingestion`, `driver_verification`, `call_monitoring`, then expand.
- What is “upstream-only internal ops” concretely (name 5 screens/APIs now). If you can’t, you can’t enforce the boundary.
- Do you ship infra/terraform to NFQ, or do you ship only application code + runbooks?

## 11) Additional requirement: NFQ “Dedicated” single-tenant deployments (no source code)

NFQ also needs to sell a **single-tenant, self-hosted** deployment to their end customers (Azure) where the customer runs their
own UI + API **without receiving source code**.

This is a **different product surface** than “NFQ source distribution”:

- Source distribution: NFQ receives and maintains a filtered source mirror.
- Dedicated single-tenant (binary): NFQ customers receive **deployable artifacts** only (containers + charts), not source.

Treat this as a distinct profile, not a “flag”:

- `DEPLOYMENT_PROFILE=nfq_dedicated_single_tenant`

**Plan for this profile:** `docs/milestones/exec-plans/nfq-single-tenant-azure-distribution-plan.md`.
