# V2 Public Ingress Bootstrap

## Objective

Ship the first V2 public-ingress code slice as a stacked PR:

- target checklist row: `docs/requirements/checklist.md` section `5. Website Sales Agent (Phase 1 — Critical)`
- target requirement: `Web chat session ingress is secure for public/anonymous users (does not grant full platform access)`

## Scope

- add typed V2 public-ingress bootstrap contracts in `platform-core`
- add public + tenant schema persistence for widget config, guest-session control, and chat session bootstrap
- add public widget config + bootstrap routes in `apps/api`
- add baseline abuse controls:
  - origin allowlist
  - pinned composition/artifact enforcement
  - expiring guest token
  - in-process rate limiting
- add unit + integration proof

## Non-Goals

- message send/history routes
- lead capture
- recommendations
- escalation handoff
- widget frontend embed

## Browser Contract

- The backend bootstrap continuity contract now returns a signed `bootstrap_continuity` token in `/public/widgets/{widget_id}/config` and accepts it back in `/public/widgets/{widget_id}/bootstrap` only when the caller already owns a stable fingerprint seed it supplied on the config request; the server does not echo that seed back, and the httpOnly cookie remains a same-browser fallback.
- This slice still does not ship the widget frontend. The proof here is route-level: allowed customer origins receive credentialed CORS, denied origins do not inherit global `*` CORS, and bootstrap accepts continuity without requiring a third-party cookie.

## Status

- [x] choose the next stacked slice and bind it to a checklist row
- [x] implement public-ingress domain contracts and storage
- [x] implement API routes
- [x] add unit and integration coverage
- [x] run targeted verification and pre-PR CI
- [x] update `docs/requirements/checklist.md` with truthful proof

## Notes

- This slice is only worth merging if it proves anonymous ingress uses a separate guest token path and does not reuse tenant/deployment auth.

## Delivered

- typed public-ingress contracts, guest-token mint/verify, and in-process rate limiting under `packages/platform-core/src/platform_core/public_ingress/`
- public widget config + bootstrap routes in `apps/api/src/platform_api/routes/public_ingress.py`
- public + tenant persistence via `widget_configs`, `guest_session_controls`, and tenant `public_chat_sessions`
- unit coverage for service behavior and integration coverage for real route + database flows
- formal review follow-up now requires a server-issued bootstrap grant before guest-session mint and uses the validated grant fingerprint for baseline rate limiting instead of proxy-derived client host data
- formal review follow-up now uses an explicit client fingerprint contract for widget config/bootstrap so the flow works under non-credentialed cross-origin browser requests, and repeated config fetches can reuse the same fingerprint instead of minting a fresh rate-limit bucket
- formal review follow-up now uses opaque signed public-ingress tokens instead of symmetric JWTs so the bootstrap and guest-session path no longer violates the architecture invariant that JWT verification stays asymmetric
- formal review follow-up now rate-limits anonymous widget-config refreshes before grant mint so clients cannot bypass bootstrap abuse controls by repeatedly requesting fresh grants and fingerprints
- formal review follow-up now revalidates widget + tenant + pinned composition/artifact state inside the bootstrap transaction and persists `correlation_id` into both shared control state and tenant public chat state for durable traceability
- formal review follow-up now trusts forwarded client-address headers only when the direct peer matches an explicit trusted-proxy CIDR configuration; otherwise it falls back to the socket peer, so reverse proxies can be modeled intentionally and callers cannot mint fresh anonymous ingress buckets through naive proxy-header trust
- formal review follow-up now normalizes away default origin ports (`:80`, `:443`) for allowlist checks and bootstrap-grant origin binding, so semantically identical origin forms do not get rejected by string-mismatch nonsense
- formal review follow-up now includes the validated public-ingress fingerprint in `provisional_user_key`, so anonymous users on the same page and user-agent do not collapse onto one provisional identity
- formal review follow-up now resolves `PUBLIC_INGRESS_TOKEN_SECRET` through the same startup `EnvSecretProvider` path as other secret-managed credentials, so `env://...` references do not get used as literal HMAC keys
- formal review follow-up now applies widget-origin-aware CORS for `/public/widgets/{widget_id}/config` and `/bootstrap` before static global CORS runs, so customer-site embeds still work when the deployment keeps `CORS_ORIGINS` locked to operator/admin origins
- formal review follow-up now fails closed for widget `channel_type` values other than `web_chat`, so public-ingress bootstrap cannot silently mint chat-session state for unsupported channels
- formal review follow-up now caches widget-origin CORS policy briefly in-process before route execution, so repeated browser preflights do not turn the public-ingress path into an unbounded stream of Postgres reads
- formal review follow-up now keeps `GuestSessionControl` model parity with the shared-table schema by including the persisted `correlation_id`
- formal review follow-up now avoids caching unknown widget-id CORS lookups and prunes stale per-widget CORS cache entries before refetch, so attacker-chosen miss keys do not accumulate in process memory forever
- formal review follow-up now revalidates `channel_type` inside the bootstrap transaction, so a widget flipped away from `web_chat` mid-flight cannot still mint guest session state on stale pre-check data
- formal review follow-up now binds bootstrap throttling to a stable trusted-proxy-aware requester subject, so refreshing widget config with a fresh fingerprint no longer sidesteps the bootstrap abuse limit even when the caller omits `x-public-ingress-fingerprint`
- formal review follow-up now translates missing tenant `public_chat_sessions` storage into `PublicIngressServiceUnavailableError`, so mixed public/tenant migration rollout states fail closed with a controlled `503` instead of surfacing a raw database `500`
- formal review follow-up now coordinates bootstrap and tenant-state transitions with tenant-scoped advisory locks, so concurrent anonymous bootstraps can proceed without serializing on the tenant row while suspension/offboarding still cannot race past the bootstrap commit
- formal review follow-up now translates missing public `widget_configs` storage into `PublicIngressServiceUnavailableError` and maps both public-ingress CORS preflight and config fetches to `503`, so mixed-rollout states fail closed instead of dumping raw database `500`s into anonymous browser traffic
- formal review follow-up now takes the exclusive tenant-state lock immediately after tenant identity resolution during forced reprovision, so public-ingress bootstrap cannot slip in a shared lock and mint a guest session while onboarding is still exposing the tenant as active
- formal review follow-up now treats the public-ingress CORS cache as a positive-hit accelerator only, so newly allowed origins or reactivated widget/tenant state do not stay incorrectly denied until the cache TTL expires
- formal review follow-up now returns a signed bootstrap continuity token in the config payload and accepts it during bootstrap, so cross-site embeds still work when browsers block third-party cookies while the httpOnly cookie remains a same-browser fallback
- formal review follow-up now advertises credentialed public-ingress CORS and translates operational asyncpg widget-config fetch failures into controlled `503` responses, so browser bootstrap continuity can work and anonymous ingress does not leak raw database connection failures
- formal review follow-up now binds the continuity cookie to a bounded set of issued bootstrap grants for the same widget + origin, so the same browser can survive repeated config refreshes without letting another client replay a leaked grant under its own fresh continuity cookie
- formal review follow-up now maps bootstrap write-path asyncpg failures in both widget-state locking and guest-session control persistence to controlled `503` responses, so anonymous browser traffic does not leak raw write-side database failures
- formal review follow-up now maps tenant `public_chat_sessions` operational write failures to controlled `503` responses too, so transient tenant-storage drops do not leak generic `500`s after the shared public control writes already succeeded
- formal review follow-up now applies a short-lived deny cache to public-ingress CORS lookups, so repeated bad-origin preflights do not turn the anonymous browser edge into one Postgres lookup per request while policy changes still become visible after the short deny window
- formal review follow-up now canonicalizes tenant UUID text before deriving advisory-lock keys, so shared/exclusive tenant-state coordination cannot be bypassed by mixed-case UUID payloads that still resolve to the same tenant row
- formal review follow-up now reserves bootstrap grants for single use before session mint and only releases them on failed mint, so one config handshake cannot mint multiple guest sessions through retries or duplicate submits
- formal review follow-up now strips global wildcard CORS headers from denied public-widget responses, so arbitrary origins cannot read denied/unknown/rate-limited widget responses just because deployment-wide CORS is `*`
- formal review follow-up now persists `bootstrap_grant_hash` under a unique shared-table constraint during guest-session control creation, so duplicate grant replay is rejected across API workers and replicas instead of only inside one process
- formal review follow-up now rate-limits anonymous public-ingress CORS prelookups independently of widget id, so callers cannot rotate random widget ids to turn the preflight/config path into unbounded Postgres lookups
- formal review follow-up now keys public-ingress CORS prelookups by the same trusted-proxy-aware requester hint used by widget config/bootstrap helpers, so reverse proxies do not collapse every browser on one customer site into a shared prelookup bucket; helper tests were also corrected to match `_config_rate_limit_key()`'s current signature
- formal review follow-up now stamps every bootstrap grant with a unique `jti`, so repeated config refreshes inside the same second do not mint identical single-use grants that burn each other through replay protection
- formal review follow-up now varies public-ingress preflight responses by requested headers and method, so caching proxies cannot replay a narrower OPTIONS response onto a later browser request that asks for a different header set

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_schema_models.py packages/platform-core/tests/unit/test_call_state_cleanup.py apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/models/public_schema.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/tests/unit/test_public_schema_models.py packages/platform-core/tests/unit/test_call_state_cleanup.py`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/models/public_schema.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'revalidates_channel_type_inside_transaction or revalidates_origin_policy_inside_transaction or routes_allow_customer_origin_when_global_cors_is_locked_down'`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py packages/platform-core/tests/unit/test_public_ingress/test_store.py apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'continuity_cookie or published_refs_only or customer_origin_when_global_cors_is_locked_down or operational_asyncpg_failure'`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'widget_bootstrap_cannot_rotate_throttle_by_refreshing_config_without_fingerprint_header or repository_bootstrap_translates_missing_tenant_public_chat_session_table_to_service_unavailable or repository_bootstrap_revalidates_channel_type_inside_transaction'`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py packages/platform-core/src/platform_core/public_ingress/store.py`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'repository_bootstrap_revalidates_widget_state_inside_transaction or repository_bootstrap_revalidates_origin_policy_inside_transaction or repository_bootstrap_revalidates_channel_type_inside_transaction or repository_bootstrap_translates_missing_tenant_public_chat_session_table_to_service_unavailable'`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/store.py`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py packages/platform-core/tests/unit/test_tenancy/test_admin_service.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/tenancy/db.py packages/platform-core/src/platform_core/tenancy/admin_service.py packages/platform-core/src/platform_core/tenancy/provisioning_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py packages/platform-core/tests/unit/test_tenancy/test_admin_service.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright packages/platform-core/src/platform_core/tenancy/db.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py`
- `bash tools/scripts/generated_artifacts.sh refresh`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_store.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `git diff --check`
- `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_onboarding.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/tenancy/onboarding.py apps/api/src/platform_api/main.py packages/platform-core/tests/unit/test_tenancy/test_onboarding.py apps/api/tests/unit/test_public_ingress_app_wiring.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'public_widget_config_sets_cross_site_continuity_cookie_for_https_embed or public_ingress_routes_allow_customer_origin_when_global_cors_is_locked_down or widget_bootstrap_requires_server_issued_continuity_cookie'`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/tenancy/db.py packages/platform-core/src/platform_core/public_ingress/rate_limit.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright packages/platform-core/src/platform_core/tenancy/db.py packages/platform-core/src/platform_core/public_ingress/rate_limit.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/unit/test_public_ingress_app_wiring.py`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'test_widget_bootstrap_rate_limits_follow_up_requests'`
- `uv run pytest apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/models.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/models.py apps/api/tests/unit/test_public_ingress_app_wiring.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/alembic_public/versions/20260315_100000_public_ingress_bootstrap.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/tokens.py packages/platform-core/tests/unit/test_public_ingress/test_service.py`

## Active blocker

- The focused `apps/api/tests/integration/test_public_ingress.py -q --tb=short -k 'cors or continuity or bootstrap or replay or limit or grant'` proof still failed in testcontainer setup before any test body ran because the ephemeral Postgres container exited during readiness checks (`container ... is not running`). The deterministic unit proof for continuity-token fallback, wildcard-CORS stripping, grant replay, and tenant lock canonicalization is green; the remaining blocker is harness/container stability, not the asserted route behavior.
