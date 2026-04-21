# Execution Plan (Draft): Platform v3.0 — Wave 7: Tenant Onboarding Automation

> Status: Draft

## Objective

Automate the end-to-end “new tenant onboarding” flow (tenant record + admin identity + optional inbound routing + schema provisioning) and cover it with unit, integration, and compose E2E tests.

## Deliverables

- Deployment-scoped admin API: `POST /admin/tenants/onboard`
  - Creates/ensures:
    - `public.tenants` record (suspended while provisioning)
    - `public.users` admin user
    - `public.memberships` admin membership (`client_admin`)
    - optional `public.oidc_providers` tenant-bound issuer
    - optional `public.phone_numbers` DID routing rows
  - Starts and optionally waits for `platform.ProvisionTenantWorkflow`
- CLI script for post-infra bootstrap:
  - `uv run python -m platform_core.scripts.onboard_tenant ...`
- Runbook:
  - `wiki/ops/runbooks/tenant_onboarding.md`

## Tests

- Unit: onboarding input validation + idempotency/error semantics (no cross-tenant reassignment)
- Integration: onboarding against Postgres + Temporal time-skipping worker (real workflows + activities)
- E2E (compose): call the admin API endpoint and assert tenant is provisioned and usable

## Verification gate

```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest apps/api/tests/ --tb=short -q
tools/scripts/compose-worktree.sh e2e
```
