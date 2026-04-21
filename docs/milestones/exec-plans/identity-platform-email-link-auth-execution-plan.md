# Identity Platform Email-Link Auth Execution Plan

> **Status:** Draft
> **Created:** 2026-03-11
> **Owner:** Codex
> **Track:** Epic

## 1. Feature Definition

**Goal:** add invite-only email-link login using Google Cloud Identity Platform / Firebase Auth without breaking the platform's OIDC-first backend model.

**Requirement rows advanced:**
- `docs/requirements/checklist.md:76` — Client Admin account can be created and can log in
- `docs/requirements/checklist.md:346` — Client Admin can invite users to the tenant portal by email

**Evidence expectation (when Completed):**
- Code pointers in `apps/web`, `apps/api`, and `packages/platform-core`
- Focused browser verification for desktop and mobile
- Passing auth/session/unit/integration/E2E gates
- Updated operator runbooks for provider bootstrap and invite handling

**Acceptance Criteria:**
- [ ] An invited tenant user can request a sign-in link from `/login`, receive the email, complete the link flow, and land in the correct tenant route.
- [ ] The backend continues to accept only external OIDC/JWT tokens; the platform still does not mint its own auth tokens.
- [ ] Uninvited or unmapped users fail closed with operator-readable errors.
- [ ] Existing Google login remains working during phase 1.
- [ ] Production keeps token-paste and `SKIP_AUTH` flows disabled.

**Scope Boundaries**

Included:
- Email-link sign-in for invited tenant users
- Identity Platform / Firebase Auth client integration in `apps/web`
- OIDC provider registration for Identity Platform tokens in platform API
- Invite-to-login UX and runbook changes
- Verification coverage and rollout plan

Excluded:
- Building an in-house password or magic-link service
- Self-service public signup
- Apple / GitHub login
- Full SCIM or JIT provisioning
- Immediate unification of direct Google OIDC and email-link into one user identity unless a later phase explicitly does that work

## 2. Research Summary and Decision

### Chosen Direction

Use **Google Cloud Identity Platform / Firebase Auth** for email-link sign-in and keep the platform backend on its current **OIDC/JWT validation** contract.

This is the simplest thing that could possibly work because:
- the web app only needs a client-side auth SDK plus a session bootstrap call
- the API already validates external JWTs and resolves authorization from DB
- the platform already models users as local records mapped from an external `sub`

### Official product references

- Email-link auth: `https://firebase.google.com/docs/auth/web/email-link-auth`
- Custom email action handlers: `https://firebase.google.com/docs/auth/custom-email-handler`
- Account linking: `https://firebase.google.com/docs/auth/web/account-linking`
- Verify Firebase ID tokens: `https://firebase.google.com/docs/auth/admin/verify-id-tokens`
- Identity Platform blocking functions: `https://cloud.google.com/identity-platform/docs/blocking-functions`
- Identity Platform multi-tenancy: `https://cloud.google.com/identity-platform/docs/multi-tenancy-managing-tenants`

### Options Considered

**Option A — Build platform-owned magic links**

Rejected.

Why:
- recreates identity lifecycle, abuse controls, expiry, replay protection, email delivery, and audit logic the IdP already provides
- fights the repo architecture, which is explicitly OIDC/JWT-first

**Option B — Add Identity Platform email-link beside current direct Google OIDC**

Chosen for phase 1.

Why:
- smallest change surface
- does not break current Google bootstrap paths
- lets tenant email-link ship without forcing a risky auth migration first

Cost:
- the same human should not expect both direct Google and email-link to map to one platform identity yet
- this phase must be explicit that cross-provider account unification is deferred

**Option C — Move Google and email-link behind Identity Platform as one broker**

Deferred phase 2 candidate.

Why not phase 1:
- current production login uses raw Google OIDC (`accounts.google.com`)
- Identity Platform-issued ID tokens use a different issuer and `sub` semantics
- migrating existing `public.users.subject` values safely is real work, not a checkbox

**Option D — Identity Platform tenant-per-platform-tenant**

Deferred.

Why:
- platform tenancy is already enforced in DB and middleware
- adding IdP tenants now creates more moving parts with no immediate product payoff

## 3. Current Repo Truth

### What exists today

1. Web login is OIDC-first and currently renders:
   - Google
   - Microsoft
   - organization SSO
   - optional token paste for dev/test or explicitly enabled prod
2. `apps/web` has **no Firebase client dependency** today.
3. The web app bootstraps a signed session by sending a bearer token to `GET /auth/session`.
4. The API validates external JWTs using registered issuers from `public.oidc_providers`.
5. Authorization is resolved from platform DB, not token role claims.
6. User identity is mapped through `public.users.subject`.
7. Team invite flows create local users by email and membership, but they do not send invite emails or complete auth actions.

### Relevant code anchors

- Web login providers: `apps/web/src/app/(auth)/login/login-form.tsx`
- Web session bootstrap: `apps/web/src/app/api/auth/session/route.ts`
- Web direct OIDC start/callback: `apps/web/src/app/api/auth/oidc/start/route.ts`, `apps/web/src/app/api/auth/oidc/callback/route.ts`
- OIDC provider env loading: `apps/web/src/lib/oidc_provider.ts`
- API auth bootstrap: `apps/api/src/platform_api/routes/auth.py`
- OIDC JWT validation: `packages/platform-core/src/platform_core/auth/provider.py`
- Session/deployment/tenant resolution: `packages/platform-core/src/platform_core/auth/middleware.py`
- Subject lookup: `packages/platform-core/src/platform_core/auth/user_resolution.py`
- Invite + subject collision handling: `packages/platform-core/src/platform_core/team_users/service.py`

### Current architectural constraint

The platform has **one** `public.users.subject` field.

That means:
- one external subject maps to one internal user
- one internal user cannot safely carry two independent external subjects without more work

This is the trap. Anyone claiming we can casually support both raw Google OIDC and email-link for the same human without a provider strategy is hand-waving.

## 4. Target Phase-1 Architecture

### Phase-1 auth shape

1. User is invited in platform UI using email and role.
2. User visits `/login` and requests an email sign-in link.
3. `apps/web` uses Firebase Web SDK against one deployment-scoped Identity Platform project.
4. User clicks the email link and completes sign-in in the web app.
5. Web app obtains an **Identity Platform ID token**.
6. Web app posts that token to existing `/api/auth/session`.
7. Platform API validates the token using a registered Identity Platform issuer.
8. Platform middleware resolves local user by `public.users.subject = token.sub`.
9. Platform issues its normal signed web session cookie.

### Key decision

Phase 1 uses a **deployment-scoped Identity Platform issuer** with `tenant_id = NULL` in `public.oidc_providers`.

Why:
- the middleware already supports deployment-scoped issuers and then resolves tenant membership from DB
- this avoids baking platform tenant topology into the IdP on day one
- it preserves the repo's current server-side authorization model

### What phase 1 does not promise

Phase 1 does **not** promise that a user invited for email-link can also sign in through the existing direct Google button and remain the same platform user. That only becomes safe if we:
- migrate Google behind Identity Platform too, or
- add a multi-identity mapping model instead of a single `subject` field

## 5. Product and Ops Decisions Required Up Front

These are not optional. Avoiding them just delays failure.

1. **Identity scope**
   - Choose one deployment-scoped Identity Platform project for platform-managed auth.
2. **User population**
   - Phase 1 should target tenant users first.
   - Deployment `super_admin` can remain on the existing Google path until phase 2.
3. **Invite policy**
   - Invite-only.
   - No open signup.
   - The email link should be accepted only by already provisioned platform users.
4. **Email branding**
   - Decide whether Identity Platform default emails are acceptable for MVP.
   - If not, build a custom action handler and branded copy in the same phase.
5. **Abuse policy**
   - Rate-limit sign-in link requests.
   - Avoid email enumeration leaks in UI copy and API responses.

## 6. Phase Plan

### Phase 0: Auth Strategy Lock

**Objective:** freeze the auth shape before code churn starts.

**Tasks**
- Confirm phase-1 scope is tenant email-link only.
- Confirm direct Google remains as-is for now.
- Confirm no GCIP tenant-per-platform-tenant design in phase 1.
- Confirm whether branded action emails are in or out.

**Deliverables**
- This execution plan
- A short ADR or plan addendum if the team chooses phase-2 unification now instead

**Verification gate**
- Stakeholder sign-off on the phase-1 boundary

### Phase 1: Identity Platform Bootstrap

**Objective:** make Identity Platform able to mint tokens the platform can verify.

**Tasks**
- Create or select the deployment-scoped Identity Platform project.
- Enable email-link provider.
- Configure authorized domains and action URL targets for web login completion.
- Record required web env vars for Firebase client bootstrap.
- Register the Identity Platform issuer in `public.oidc_providers`.
- Verify JWT claims, issuer, audience, and public key endpoint against docs before coding.

**Open technical note**
- For Firebase-style ID tokens, the platform must validate the Identity Platform issuer and public keys documented in Firebase token verification docs.
- Do not guess these values from blog posts.

**Deliverables**
- Updated provider bootstrap runbook
- Deployment secret/env inventory for web
- SQL or script path for `public.oidc_providers` registration

**Verification gate**
```bash
uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short
```

### Phase 2: Web Client Integration

**Objective:** add Firebase Auth client support without polluting the rest of the app.

**Tasks**
- Add Firebase client dependency to `apps/web`.
- Create a thin auth client wrapper under `apps/web/src/lib/`.
- Add env-backed config for:
  - API key
  - auth domain
  - project ID
  - app ID if required by the SDK path chosen
- Add login UI path for:
  - request sign-in link
  - complete sign-in from email action link
- Store email locally only for link completion if the official flow requires it.
- Keep current direct OIDC buttons available according to deployment config.

**Deliverables**
- `apps/web/src/lib/firebase_auth.ts` or equivalent
- Login UI updates under `apps/web/src/app/(auth)/login/`
- Email-link completion route/page

**Tests**
- Unit tests for config parsing and failure states
- Playwright coverage for request-link and complete-link happy path with SDK/network mocking

**Verification gate**
```bash
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/auth-session-route.test.ts tests/auth-oidc-routes.test.ts
cd apps/web && NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm playwright test e2e/auth-flow.spec.ts --project=chromium
```

### Phase 3: Session Bootstrap and Provider Registration

**Objective:** ensure email-link ID tokens work with the current backend.

**Tasks**
- Register Identity Platform issuer in `public.oidc_providers` as deployment-scoped.
- Confirm `packages/platform-core` verification accepts the issued token shape.
- Confirm `sub` resolves through `public.users.subject`.
- Preserve DB-driven role resolution and tenant enforcement.

**Deliverables**
- Provider registration migration/runbook snippet
- Backend auth tests proving Identity Platform token acceptance

**Tests**
- API integration test for Identity Platform token into `/auth/session`
- Middleware unit tests for non-UUID Identity Platform `sub`

**Verification gate**
```bash
uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short
uv run pytest packages/platform-core/tests/unit/test_auth/test_middleware.py -q --tb=short
uv run pytest packages/platform-core/tests/unit/test_middleware/test_tenant_state.py -q --tb=short
```

### Phase 4: Invite-to-Login Flow Hardening

**Objective:** make invite-only email-link real instead of superficial.

**Tasks**
- Decide whether invite creates a user immediately or only reserves email + role.
- Ensure invite-created users can sign in only after subject mapping is set correctly.
- Add one explicit path for first successful email-link login to bind `public.users.subject` when:
  - email matches an invited user
  - `subject` is still `NULL`
- Refuse silent reassignment if `subject` is already bound to a different user.
- Add operator-readable errors for:
  - invited email not provisioned
  - mismatched existing subject
  - suspended or offboarded tenant

**Important**

This first-login binding step is where weak designs usually become account takeover bugs. The flow must update `subject` only when:
- the target user was identified by normalized email
- the existing `subject` is `NULL`
- the change is transactional
- collision handling fails closed

**Deliverables**
- Backend mutation path for first-login subject binding
- Updated invite/service tests
- Updated tenant/admin runbooks

**Tests**
- Invite existing email -> first login binds subject
- Second user cannot steal an existing subject
- Same email with different subject is rejected

**Verification gate**
```bash
uv run pytest apps/api/tests/integration/test_team_users.py -q --tb=short
uv run pytest packages/platform-core/tests/unit/test_tenancy/test_onboarding.py -q --tb=short
```

### Phase 5: Browser UX and Action Handling

**Objective:** make the auth UX usable for operators, not only engineers.

**Tasks**
- Replace consumer-style wording with operator-language specific to invite-only access.
- Add explicit states for:
  - sign-in link sent
  - link expired
  - link already used
  - unauthorized email
  - platform account not provisioned
- If branded emails are in scope:
  - implement custom action handler UX
  - align return URLs and failure handling

**Deliverables**
- Updated login UX
- Email-link completion UX
- Support copy in admin/operator runbooks

**Verification gate**
- Chrome DevTools MCP and Playwright verification on desktop and mobile

### Phase 6: Deployment and Rollout

**Objective:** ship without breaking current Google login.

**Tasks**
- Add new runtime secrets and build args for Firebase config.
- Keep test auth disabled in production.
- Roll out in staging first with one invited tenant user.
- Prove:
  - existing Google login still works
  - new email-link login works
  - unauthorized email-link attempt fails closed
- Roll out to production only after staged browser proof exists.

**Deliverables**
- Deployment checklist
- Rollback steps

**Verification gate**
```bash
tools/scripts/run_web_ui_harness.sh --workers=1 e2e/routes.spec.ts e2e/auth-flow.spec.ts e2e/team-management.spec.ts
```

### Phase 7: Optional Phase-2 Identity Unification

**Objective:** support one human using both Google and email-link without split identities.

**Options**
- Migrate Google sign-in behind Identity Platform and move existing users to Identity Platform-backed `sub` values.
- Or add a proper `user_identities` model if multi-provider identities must coexist outside one broker.

**Why this is separate**
- phase 1 can ship without it
- phase 2 is migration work and needs its own safety plan

## 7. Implementation Risks

### Risk 1: Identity Fragmentation

If email-link uses Identity Platform while Google stays direct, the same email address can represent two different external subjects.

Mitigation:
- make phase-1 scope explicit
- do not promise dual-method login for the same account
- queue phase-2 unification separately

### Risk 2: Subject Binding Becomes an Account Takeover Path

Mitigation:
- bind `subject` only when currently `NULL`
- transactionally enforce uniqueness
- keep collision rejection tests

### Risk 3: UI Leaks Email Enumeration

Mitigation:
- use generic success copy on link-request form
- keep detailed failure only after authenticated callback/bootstrap path when safe

### Risk 4: Email-Link Action URLs Break Behind Ingress

Mitigation:
- reuse existing `GROVE_PUBLIC_APP_URL` / public origin discipline
- verify action URLs in staging and production with real browser flows

### Risk 5: Production Becomes Half-Migrated

Mitigation:
- keep direct Google path intact during phase 1
- add new provider rather than replacing the old one immediately

## 8. Verification Matrix

### Repo gates

```bash
uv run pytest apps/api/tests/integration/test_auth.py -q --tb=short
uv run pytest apps/api/tests/integration/test_team_users.py -q --tb=short
uv run pytest packages/platform-core/tests/unit/test_auth/test_middleware.py -q --tb=short
uv run pytest packages/platform-core/tests/unit/test_middleware/test_tenant_state.py -q --tb=short
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
cd apps/web && NEXT_PUBLIC_ENABLE_TEST_AUTH=true pnpm playwright test e2e/auth-flow.spec.ts --project=chromium
tools/scripts/run_web_ui_harness.sh --workers=1 e2e/routes.spec.ts e2e/auth-flow.spec.ts e2e/team-management.spec.ts
```

### Browser proof

- Desktop:
  - request email link
  - complete email-link login
  - land in `/call-ops`
- Mobile:
  - same flow
- Regression:
  - Google button still functions if configured

## 9. Files Expected to Change

Likely touched:
- `apps/web/package.json`
- `apps/web/src/app/(auth)/login/*`
- `apps/web/src/app/api/auth/*`
- `apps/web/src/lib/*`
- `apps/web/tests/*`
- `apps/web/e2e/*`
- `apps/api/src/platform_api/routes/auth.py`
- `apps/api/tests/integration/test_auth.py`
- `packages/platform-core/src/platform_core/auth/*`
- `packages/platform-core/src/platform_core/team_users/*`
- `packages/platform-core/tests/*`
- `wiki/ops/first-time-platform-setup-provider-onboarding.md`
- `wiki/ops/runbooks/deployment_provisioning.md`
- `wiki/ops/runbooks/tenant_onboarding.md`
- `docs/requirements/checklist.md`

## 10. Progress Tracking

| Phase | Status | Notes |
|------|--------|-------|
| 0 | Pending | Auth shape not yet locked |
| 1 | Pending | Identity Platform bootstrap not started |
| 2 | Pending | No Firebase client integration exists |
| 3 | Pending | Identity Platform issuer not wired in repo docs/config |
| 4 | Pending | First-login subject binding path not implemented |
| 5 | Pending | Email-link UX not implemented |
| 6 | Pending | No staged browser proof |
| 7 | Deferred | Only needed if dual-method identity is required |

## 11. Bottom-Line Recommendation

Ship **phase 1** as:
- invite-only email-link for tenant users through Identity Platform
- keep current direct Google login alive
- explicitly defer same-account Google/email-link unification

That is the smallest defensible path.

Anything else is either:
- fake simplicity that hides migration pain, or
- needless auth reinvention.
