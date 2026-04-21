# T05: Verify public login, migrations, and operator access end-to-end

> **Milestone**: M38.1-nfq-public-edge-and-auth-readiness
> **Status**: In Progress
> **Estimate**: M (1-2h)
> **Depends on**: T03, T04

---

## Description

Prove that the public NFQ deployment is usable, not just provisioned. This task
ties together the live API edge, the web login entrypoint, the dedicated NFQ
OIDC redirect, and the tenant migration state created during onboarding.

## Completed Verification

- `https://api.nfq.jakitlabs.com/health` returns `HTTP/1.1 200 OK`
- `https://nfq.jakitlabs.com/` returns `HTTP/1.1 307 Temporary Redirect` to
  `/login`
- An operator completed the public Google login flow at
  `https://nfq.jakitlabs.com/login` and reached the NFQ dashboard on the live
  deployment
- `https://nfq.jakitlabs.com/api/auth/oidc/start?provider=google` returns
  `HTTP/1.1 307 Temporary Redirect` to Google with:
  - client id `<bootstrap-google-client-id>`
  - callback `https://nfq.jakitlabs.com/api/auth/oidc/callback`
- Tenant `nfq` is active and migrated:
  - tenant id `bd1db3b2-d4d0-4fe9-bf3e-d6421ac45405`
  - schema `tenant_nfq`
  - `tenant_nfq.alembic_version = 20260329_120000`

## Remaining Gap

- The browser login flow now reaches the normal Google sign-in page with a
  valid Google OAuth **Web application** client id (`<google-web-client-id>`).
- The dedicated client values are stored in GCP Secret Manager:
  - `nfq-oidc-google-client-id`
  - `nfq-oidc-google-client-secret`
- The live `platform-web-runtime-secrets` secret and the tenant `nfq`
  `public.oidc_providers.audience` row were updated to the new web client id.
- The bootstrap operator account was granted deployment-level access with
  `public.users.deployment_role = 'super_admin'`.
- Remaining action:
  - sign out and sign back in with `<bootstrap-admin-email>` and capture the
    post-role-grant deployment-console landing proof (`/admin-login` -> `/admin`)

## References

- Milestone: [M38.1-nfq-public-edge-and-auth-readiness.md](../../milestones/M38.1-nfq-public-edge-and-auth-readiness.md)
- Progress: [PROGRESS.md](PROGRESS.md)
