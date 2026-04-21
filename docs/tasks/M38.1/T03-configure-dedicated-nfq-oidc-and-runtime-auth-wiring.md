# T03: Configure dedicated NFQ OIDC and runtime auth wiring

> **Milestone**: M38.1-nfq-public-edge-and-auth-readiness
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

Create a dedicated NFQ auth surface for the temporary public deployment without
reusing the live Manibo login contract. This task covers the public runtime
config, dedicated Google OAuth client, production runtime secret wiring, and
the tenant bootstrap path needed to make `nfq.jakitlabs.com` a real login
surface instead of just a DNS alias.

## Outcomes

- Dedicated Google OAuth client:
  - `projects/call-platform-production/locations/global/oauthClients/nfq-web`
- Dedicated public callback:
  - `https://nfq.jakitlabs.com/api/auth/oidc/callback`
- Dedicated live provider row stored for tenant `nfq`
- Tenant bootstrap completed after fixing the provisioning migration bug:
  - tenant id: `bd1db3b2-d4d0-4fe9-bf3e-d6421ac45405`
  - tenant schema: `tenant_nfq`

## Implementation Notes

- The production overlay was stale for public web traffic. It still pointed
  `NEXT_PUBLIC_API_BASE_URL` at `http://localhost:8000`, which is wrong once
  the app sits behind the GCP public edge.
- The onboarding failure was not an infra problem. `TenantProvisioningService`
  converted `postgresql://...?sslmode=require` into an async SQLAlchemy URL
  without translating `sslmode=` to the asyncpg-compatible `ssl=` query key.
  That crashed Alembic inside the Temporal provisioning workflow.
- `platform-web-runtime-secrets` already supported provider-specific Google
  keys; the GCP runtime secret validator was the stale part. The validator now
  accepts either generic OIDC credentials or provider-specific Google/Microsoft
  credentials.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/tenancy/provisioning_service.py` | Modify | Normalize Alembic async URLs for asyncpg SSL handling |
| `packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py` | Modify | Cover asyncpg SSL query normalization |
| `packages/platform-core/tests/e2e/conftest.py` | Modify | Keep test Alembic URL conversion aligned |
| `packages/platform-core/tests/e2e/solutions_integrations_compose_test_support.py` | Modify | Keep test Alembic URL conversion aligned |
| `infrastructure/kubernetes/overlays/gcp/production/patch-runtime-config.yaml` | Modify | Reflect the public NFQ app/API URLs and trusted proxy headers |
| `infrastructure/kubernetes/overlays/gcp/production/secrets.env.example` | Modify | Model dedicated Google provider keys for NFQ |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Accept provider-specific OIDC credentials for GCP production |
| `tests/architecture/test_k8s_runtime_secrets.py` | Modify | Validate provider-specific GCP OIDC inputs |
| `tests/architecture/test_k8s_runtime_secrets_apply.py` | Modify | Validate provider-specific apply path |

## Verification Evidence

- Focused tests:
  - `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py tests/architecture/test_k8s_runtime_secrets.py tests/architecture/test_k8s_runtime_secrets_apply.py tests/architecture/test_k8s_runtime_secrets_metrics_fallback.py -q`
- Bash syntax:
  - `bash -n tools/scripts/infra/k8s-runtime-secrets.sh`
- Overlay render:
  - `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
- Live rollout:
  - built and pushed `temporal-worker@sha256:48cd35879f13ee3cb5867e21fda2e70bf27e07ed37361ad74e5475e6bdba50aa`
  - rolled `platform-temporal-worker` on the production cluster from the admin VM
- Live DB checks:
  - `public.tenants.status = active` for slug `nfq`
  - `public.oidc_providers` row exists for issuer `https://accounts.google.com`
  - `public.memberships.role = client_admin` exists for the bootstrap admin
  - `tenant_nfq.alembic_version = 20260329_120000`

## References

- Milestone: [M38.1-nfq-public-edge-and-auth-readiness.md](../../milestones/M38.1-nfq-public-edge-and-auth-readiness.md)
- Progress: [PROGRESS.md](PROGRESS.md)
