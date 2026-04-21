# T02: FE Landing-Route Precedence Using Role + Enabled Solutions

> **Milestone**: M12-workbench-composition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Checklist Rows**: `docs/requirements/checklist.md:45` — solution visibility management already exists in the backend, but tenant entry routing still ignores runtime-enabled solution state.

---

## Activation Guardrails

1. This is the first real remaining `#617` slice. Do not bloat it with `/today` invention or a fake platform dashboard rewrite.
2. Keep urgency out of this task. Urgent hot-route precedence is a separate future backend follow-up outside active M12 scope.
3. One task = one commit:
   - `feat: M12 T02 - add role and solution-aware landing routes`
4. Update `docs/tasks/M12/PROGRESS.md` when done.

---

## Description

Replace the static `resolveLandingRoute(role)` map with a server-safe resolver that uses authenticated role plus enabled tenant solutions. This is an intermediate slice toward the full architecture contract; it does not claim to finish `#617`.

Immediate goal:

- `1` enabled solution -> that solution's manifest-owned default route
- `0` or `N` enabled solutions -> keep the current role-safe fallback route
- `super_admin` -> `/admin`

Full architecture target still remains:

- shared tenant workbench entry such as `Today` for multi-solution routing
- urgent-work precedence when the product explicitly requires it

This task is frontend-first, but it still needs a server-safe way to read tenant solutions during redirect-time rendering.

## Subtasks

- [x] Add a server-safe tenant-solutions reader for redirect-time usage
- [x] Define the new landing-route contract: `role + enabledSolutions -> route`
- [x] Add a manifest-owned default-route helper instead of “first random route wins”
- [x] Implement the one-solution override while preserving existing role-safe fallback routes
- [x] Wire the resolver into the root page redirect
- [x] Wire the resolver into the auth/login callback or equivalent server-rendered redirect surface
- [x] Wire the resolver into the manual token-login redirect surface too
- [x] Keep middleware behavior conservative; do not add brittle edge fetch hacks
- [x] Add unit coverage for `0/1/N` routing and manifest default resolution

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/landing-route.ts` | Modify | Replace static role map with role + enabled-solutions resolver |
| `apps/web/src/app/page.tsx` | Modify | Use the new resolver from the server component |
| `apps/web/src/app/api/auth/oidc/callback/route.ts` | Modify | Keep OIDC login redirect behavior aligned with the new resolver contract |
| `apps/web/src/app/(auth)/login/login-form.tsx` | Modify | Keep manual token-login redirect behavior aligned with the new resolver contract |
| `apps/web/src/lib/api/solutions.ts` | Modify | Add a server-safe tenant-solutions helper if needed |
| `apps/web/src/lib/server-platform-api.ts` | Modify | Reuse existing authenticated server fetch path instead of inventing another one |
| `apps/web/src/solutions/registry.ts` | Modify | Add manifest default-route helper or deterministic fallback helper |
| `packages/web-shared/src/types/solution-manifest.ts` | Modify | Add explicit default-route metadata only if current manifests cannot express it cleanly |
| `solutions/*/ui/src/manifest.ts` | Modify | Set default tenant route only where needed and keep it explicit |
| `apps/web/tests/landing-route.test.ts` | Modify | Cover 0/1/N routing and manifest default selection |
| `apps/web/tests/auth-oidc-routes.test.ts` | Modify | Cover OIDC callback redirect behavior with the new resolver contract |
| `apps/web/tests/auth-session-route.test.ts` or focused login-form test | Modify/Create | Cover manual token-login redirect behavior with the new resolver contract |
| `apps/web/tests/middleware.test.ts` | Modify | Keep middleware redirects honest if the helper signature stays shared |
| `apps/web/tests/tenant-workbench.test.ts` | Modify | Cover any new nav/default-route helper logic |

## Implementation Notes

- STTCPW:
  - `1 solution` -> explicit manifest-owned default route
  - `0 or N solutions` -> preserve existing role-safe fallback route for now
    - `client_admin` -> `/dashboard`
    - `client_operator` -> `/call-ops`
- This is an intermediate slice only. It does not close the full architecture contract in `wiki/architecture/architecture.md`, which still expects a shared multi-solution entry such as `Today` and urgent-work precedence.
- Do not depend on the client-only `useTenantSolutions()` hook for redirect-time behavior.
- Reuse `server-platform-api.ts` or a closely related authenticated server helper. Do not scatter raw fetch/auth logic through `page.tsx`.
- Do not make middleware fetch `/solutions`. Edge fetch complexity here is unnecessary and brittle.
- If the manifest contract needs a `defaultTenantRoute`, add the minimal field and update only shipped solution manifests.
- Keep `super_admin -> /admin` unchanged.

## PR Slices

### PR 1 — Server-safe data + pure resolver

- Add server-safe tenant-solutions read helper
- Add pure landing-route resolver tests
- Add manifest default-route helper and metadata if required

### PR 2 — Wire redirects

- Wire the resolver into `apps/web/src/app/page.tsx`
- Wire the resolver into login/auth redirect surfaces, including the manual token-login path
- Update tests for real redirect paths, including OIDC callback, manual token login, and any shared helper consumers

## Acceptance Criteria

- [x] `resolveLandingRoute()` no longer relies on role alone for tenant users
- [x] Tenant redirect-time code can read enabled tenant solutions without using client-only SWR hooks
- [x] `0 solutions` preserves a documented existing role-safe fallback route
- [x] `1 solution` routes to that solution's explicit manifest-owned default route
- [x] `N solutions` preserves a documented existing role-safe fallback route without inventing `Today` or urgency behavior
- [x] `super_admin` still routes to `/admin`
- [x] The task doc stays honest that full `#617` closure still requires multi-solution shared-entry logic and later urgent-work precedence
- [x] `pnpm -C apps/web exec vitest run tests/landing-route.test.ts tests/tenant-workbench.test.ts tests/auth-oidc-routes.test.ts tests/auth-session-route.test.ts tests/middleware.test.ts` or the exact updated redirect test targets pass
- [x] If redirect surfaces change in `apps/web/src/**`, the eventual implementation PR must run the UI gate required by repo policy: Playwright, Chrome DevTools verification, and `tools/scripts/e2e/run-web-e2e.sh`
- [x] If `apps/web/src/**` changes, the eventual implementation PR must satisfy the OTLP evidence gate: `OTLP spans emitted: Yes` plus TraceQL, LogQL, and PromQL commands with captured output

## References

- Milestone: [M12-workbench-composition.md](../../milestones/M12-workbench-composition.md)
- Progress: [PROGRESS.md](./PROGRESS.md)
- Issue: `#617`
