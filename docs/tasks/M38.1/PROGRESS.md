# M38.1: NFQ Public Edge and Dedicated Auth Readiness — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Audit live NFQ production readiness and record blockers | Done | 2026-04-14 |
| T02 | Enable the GCP public edge for NFQ web and API | Done | 2026-04-14 |
| T03 | Configure dedicated NFQ OIDC and runtime auth wiring | Done | 2026-04-14 |
| T04 | Create temporary Route53 DNS for `nfq.jakitlabs.com` and `api.nfq.jakitlabs.com` | Done | 2026-04-14 |
| T05 | Verify public login, migrations, and operator access end-to-end | In Progress | — |

## Notes

- T01 live audit evidence already exists from direct operator checks against
  `call-platform-production`:
  - GKE cluster `call-platform-production-ec2` is `RUNNING`
  - Cloud SQL instance `call-platform-production-postgres` is `RUNNABLE`
  - `platform-api`, `platform-web`, `agent-worker`,
    `platform-temporal-worker`, and Temporal pods are running in namespace
    `platform`
  - the `grove`, `platform`, `temporal`, and `temporal_visibility` databases
    exist
  - migration table `public.alembic_version_public` is present in `grove`
  - internal web login redirects with `OIDC is not configured`, which confirms
    the remaining auth gap is real rather than assumed
- Temporary public DNS uses Route53 because `jakitlabs.com` is Route53
  authoritative today.
- T02 live completion evidence:
  - the GCP production overlay now renders stable standalone NEG annotations
    for both `platform-api` and `platform-web`
  - the production platform root now exposes public IP and forwarding-rule
    outputs for Route53 follow-on work
  - Terraform applied the `ingress_dns` public edge successfully in production
  - production forwarding rules now exist:
    - API: `34.54.127.17`
    - web: `34.149.188.63`
  - `api-backend` and `web-backend` are healthy after syncing the production
    `network` root firewall drift
  - the production tfvars example now matches the live public-edge contract:
    - `public_edge_enabled = true`
    - `public_observability_enabled = true`
    - `cluster_neg_metadata` covers both `europe-central2-a` and
      `europe-central2-b` for the `api` and `web` backends
  - Google-managed certs were created for both hostnames and are waiting on DNS
- NFQ OIDC must be separate from Manibo:
  - separate client/app registration
  - separate redirect URIs
  - separate runtime secret values
  - separate platform provider row if platform auth data is persisted per
    provider
- T03 live completion evidence:
  - created dedicated Google OAuth client resource `nfq-web`
  - live runtime config now serves the public API URL and trusts proxy headers:
    - `NEXT_PUBLIC_API_BASE_URL=https://api.nfq.jakitlabs.com`
    - `GROVE_TRUST_PROXY_HEADERS=true`
  - live runtime secrets now use dedicated NFQ Google OIDC values under
    `platform-web-runtime-secrets`
  - fixed the tenant provisioning runtime bug by normalizing async Alembic
    URLs from `sslmode=` to asyncpg-compatible `ssl=`
  - rebuilt and rolled `platform-temporal-worker` to
    `sha256:48cd35879f13ee3cb5867e21fda2e70bf27e07ed37361ad74e5475e6bdba50aa`
  - onboarded tenant `nfq` with:
    - tenant id: `bd1db3b2-d4d0-4fe9-bf3e-d6421ac45405`
    - tenant schema: `tenant_nfq`
    - bootstrap admin email assumption recorded out of band as
      `<bootstrap-admin-email>`
  - verified live tenant state:
    - `public.tenants.status = active`
    - Google OIDC provider row exists for tenant `nfq`
    - membership exists for the bootstrap admin user
    - tenant schema `tenant_nfq` exists with `alembic_version=20260329_120000`
- T04 live completion evidence:
  - Route53 hosted zone: `jakitlabs.com.`
  - change request: `/change/C06513283B26NGT5M0UN1`
  - created A records:
    - `api.nfq.jakitlabs.com -> 34.54.127.17`
    - `nfq.jakitlabs.com -> 34.149.188.63`
  - verified with `dig +short` for both hostnames
  - Google-managed certificates are now `ACTIVE` for both hostnames
- T05 current verification evidence:
  - `https://api.nfq.jakitlabs.com/health` returns `HTTP/1.1 200 OK`
  - `https://nfq.jakitlabs.com/` returns `HTTP/1.1 307 Temporary Redirect`
    to `/login`
  - an operator completed the public Google login flow at
    `https://nfq.jakitlabs.com/login` and reached the live NFQ dashboard
  - `https://nfq.jakitlabs.com/api/auth/oidc/start?provider=google` returns
    `HTTP/1.1 307 Temporary Redirect` to Google with the dedicated NFQ web
    client id and callback URL
  - dedicated Google web OAuth secrets now exist in GCP Secret Manager:
    - `nfq-oidc-google-client-id`
    - `nfq-oidc-google-client-secret`
  - `platform-web-runtime-secrets` now serves:
    - `GROVE_OIDC_GOOGLE_CLIENT_ID=<google-web-client-id>`
    - `GROVE_OIDC_GOOGLE_SCOPES=openid email profile`
  - tenant `nfq` Google provider audience was updated to the same web client id
  - interactive browser verification now reaches the normal Google sign-in page
    at `accounts.google.com`
  - the bootstrap operator account now has `deployment_role = super_admin` in
    `public.users`
  - the GCP production deploy script now performs an explicit
    `kubectl rollout restart deployment/platform-web` after runtime
    secret/overlay apply so the public-edge auth contract cannot sit dormant in
    a stale web pod
  - remaining action:
    - sign out and sign back in so the browser session picks up the new
      deployment role
    - capture a fresh `/admin-login` -> `/admin` browser proof after the
      deployment-role grant

## NFQ/GCP Staging and Production Follow-Up

The production inbound-call bring-up on the Manibo Hetzner stack created a
repeatable checklist that must be applied to NFQ/GCP before staging or
production telephony is called ready.

- Manibo production GitOps codification now exists in the
  `fix/production-inbound-call-bringup` worktree:
  - encrypted production runtime bundle owns the Telnyx, LiveKit SIP, Soniox,
    and existing runtime values
  - encrypted `gcp-adc` Secret is referenced by the production data
    kustomization
  - scoped workload runtime-secret rendering preserves Telnyx and generic
    LiveKit SIP bootstrap keys for API and temporal worker only; agent worker
    keeps LiveKit API credentials and speech/runtime credentials, with
    Telnyx/SIP bootstrap material excluded
  - validation passed with decrypted shape/key checks, focused runtime-secret
    tests, `git diff --check`, and production data kustomize render with the
    repo-required load restrictor mode
  - decrypted production Secret manifests pass Kubernetes client-side dry-run
- Track both environments separately. GCP production has a runtime overlay and
  live GKE stack; staging Terraform roots exist, but a `gcp/staging` runtime
  overlay still needs to be created before staging can claim parity.
- Support both LiveKit modes in each infrastructure path:
  - `cloud` mode: LiveKit Cloud URLs/API credentials plus SIP trunk/dispatch
    IDs when PSTN is enabled through LiveKit Cloud.
  - `self_hosted` mode: public SIP host, transport, signaling port,
    trunk/dispatch IDs, carrier routing, and SIP/RTP reachability.
  - the GCP production runtime example now lists the shared PSTN/SIP keys so
    NFQ production and future GCP staging overlays have the same contract
- Prefer GKE Workload Identity for Google STT/TTS/LLM access. JSON ADC secrets
  are for non-GKE or break-glass cases, not the preferred NFQ/GCP contract.
- Keep Telnyx connections, DIDs, LiveKit resources, OAuth clients, and runtime
  secrets separate for staging and production. Do not reuse Manibo production
  or local-call resources.
- For each environment, the go-live proof must include: encrypted GitOps or
  Secret Manager ownership of runtime values, provider/trunk/number inventory
  sync, published appointment-booking agent binding, telephony precheck, one
  real inbound call, Kubernetes/GCP log evidence, LiveKit room evidence,
  workflow/call record evidence, transcript, and appointment-registration
  artifact.
- The first production inbound call is proof-only, not launch-ready customer
  traffic, until the alert decision is explicit. Before launch, either link
  verified monitor coverage for the relevant rows in
  `wiki/design-docs/launch-observability-alert-matrix.md` or keep production
  inbound calls gated behind a named follow-up. Until those monitors exist, the
  interim owner is the platform operator running the proof call with provider
  console checks plus focused Kubernetes/GCP log watches for Telnyx/LiveKit,
  `livekit-sip`, `platform-api`, `platform-temporal-worker`, and
  `agent-worker`.

## 2026-04-20 NFQ Production LiveKit Cloud Inbound Bring-Up

Tracked in `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`
and `docs/tasks/adhoc/AH-2026-04-20-nfq-livekit-cloud-inbound-bringup.md`.

This is not the implementation of M13.1. M13.1 remains the planning-only
autonomous telephony evaluation milestone. The 2026-04-20 work is a manual NFQ
production proof path using LiveKit Cloud first.

Completed live operations:

- LiveKit Cloud project `HVA` was used for NFQ production.
- Telnyx number `+37052002593` was confirmed active on Telnyx connection
  `2903654754745845426`.
- The first inferred SIP hosts were wrong for NFQ. The working LiveKit Cloud
  SIP target is the project-ID endpoint
  `3etpt9jkzr2.sip.livekit.cloud:5060`.
- LiveKit Cloud SIP resources now exist:
  - inbound trunk `ST_NZZrdPgH7Kfr`
  - outbound trunk `ST_JPke2tbehKut`
  - dispatch rule `SDR_3F7cFWx5Z87u`
- NFQ GKE production runtime was patched to `LIVEKIT_DEPLOYMENT_MODE=cloud`
  with HVA LiveKit Cloud API, WebSocket, and browser URLs.
- `platform-api`, `platform-temporal-worker`, and `agent-worker` were
  restarted and rolled out successfully.
- NFQ production DB routing was seeded after a dry-run transaction:
  - agent definition `812567c6-af00-591e-b17c-b2accc3b1183`
  - provider account `c45ed708-8c07-5da9-9a98-d7a7dc25c3f7`
  - trunk `8a66ed08-6801-5288-ab89-899b9e333f61`
  - telephony number `0f777af6-c2ad-59b5-8ced-432238db11a2`
  - phone binding `4c96f615-7eac-590e-8486-a2b739a26aab`
- The committed route row resolves DID `+37052002593` to tenant `nfq`,
  published agent `nfq-clinic-registration-livekit-cloud` version `1`, and
  LiveKit trunk `ST_NZZrdPgH7Kfr`.

Webhook and call proof status:

- HVA LiveKit Cloud webhook `call-center-production` was created in the
  dashboard and pointed at
  `https://api.nfq.jakitlabs.com/webhooks/livekit/room-started`.
- The dashboard test event reached production `platform-api` at
  `2026-04-20T10:11:31Z` and returned `200 OK`.
- Final API-originated live inbound proof call:
  `nfq-inbound-final-codec-20260420T120112Z`.
- LiveKit room `call-_+37066106088_8Y7kEMYLfZRa` was created with NFQ tenant
  metadata and two active participants:
  `sip_+37066106088` and `agent-AJ_7h8rfWdgWh9t`.
- Platform API started workflow
  `platform.inbound/6f56529d-b30d-5e2a-81af-72ca79fff8f0`.
- Telnyx recorded inbound `call.answered` and normal clearing with SIP hangup
  cause `200`.
- Agent worker completed the greeting turn:
  `voice_turn_complete flow_node=greeting latency_ms=9398 llm_roundtrips=1`.
- Final filtered worker logs for the proof window had no `ERROR`, no
  `Traceback`, and no missing environment variable errors.
- Runtime patches are live-only until codified through the chosen
  GitOps/Secret Manager path. The live drift now includes the Telnyx primary
  FQDN route, LiveKit dispatch/trunk shape, `SONIOX_API_KEY`,
  `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and the Temporal payload
  codec keyring on `agent-worker`.

## 2026-04-20 NFQ Secret Sync and Outbound Proof Follow-Up

Tracked in `docs/milestones/M38.2-nfq-gcp-secret-manager-sync.md` and
`wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`.

- NFQ GCP production runtime secret ownership was moved to GCP Secret Manager
  plus External Secrets Operator; Reloader now restarts affected Deployments on
  synced Secret/ConfigMap changes.
- Environment-specific infrastructure tests for this path were moved under
  `tests/architecture/nfq/gcp/`; the discipline checklist now records that
  namespacing rule for future architecture tests.
- Outbound proof to `+37062700969` succeeded:
  - call id `93170626-9181-47a6-8b8e-394ca05a7821`
  - workflow id `grove.call/93170626-9181-47a6-8b8e-394ca05a7821`
  - LiveKit room `RM_UQPMda68Vsvg`
  - Telnyx events `call.initiated`, `call.bridged`, `call.answered`, and
    `call.hangup normal_clearing`
  - agent-worker completed four voice turns
  - `tenant_nfq.calls.state=completed`
- Follow-up risks before launch readiness:
  - outbound route selection still needs a first-class outbound trunk path
    instead of proof-time explicit trunk override
  - outbound LiveKit rooms currently also start an inbound orchestrator
  - completed call rows leave `outcome` and `ended_at` null
