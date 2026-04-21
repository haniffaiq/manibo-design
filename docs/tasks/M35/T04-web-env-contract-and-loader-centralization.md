# T04: Centralize web env contract and loader usage

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Replace scattered web env reads with one explicit env contract for the Next.js app. The server-only contract, the `NEXT_PUBLIC_*` contract, and test/script env loading rules must become explicit and live in one place per concern.

## Subtasks

- [ ] **Create web env modules**: define `server.ts` and `client.ts` as the only approved env readers for application code.
- [ ] **Normalize Next/test/script loading**: use `@next/env` so Next config, Vitest, Playwright, E2E harness helpers, and supporting scripts load env the same way.
- [ ] **Migrate existing readers**: move auth/origin/OIDC/dev-auth/solution gating helpers plus current direct page/route/component readers onto the centralized web env modules.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/env/server.ts` | Create | Server-only env parsing and validation |
| `apps/web/src/env/client.ts` | Create | `NEXT_PUBLIC_*` env parsing and validation |
| `apps/web/src/env/load.ts` | Create | Shared `@next/env` loader for tests and scripts |
| `apps/web/next.config.ts` | Modify | Use centralized env/bootstrap checks |
| `apps/web/vitest.config.ts` | Modify | Load env consistently outside Next runtime |
| `apps/web/playwright.config.ts` | Modify | Load env consistently outside Next runtime |
| `apps/web/e2e/harness.ts` | Modify selectively | Consume centralized env helpers where appropriate |
| `apps/web/e2e/build-solutions.ts` | Modify | Consume centralized env helpers or loader seam |
| `apps/web/scripts/solution-route-config.mjs` | Modify | Consume centralized env helpers or loader seam |
| `apps/web/src/app/(auth)/login/page.tsx` | Modify | Stop reading runtime auth flags directly |
| `apps/web/src/app/(auth)/admin-login/page.tsx` | Modify | Stop reading runtime auth flags directly |
| `apps/web/src/app/api/auth/session/route.ts` | Modify | Stop reading runtime auth flags directly |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | Modify | Stop reading runtime auth flags directly |
| `apps/web/src/components/observability/use-livekit-observer.ts` | Modify | Stop reading public LiveKit env directly |
| `apps/web/src/lib/dev-auth-flags.ts` | Modify | Use centralized env values |
| `apps/web/src/lib/platform_auth.ts` | Modify | Use centralized env values |
| `apps/web/src/lib/public_origin.ts` | Modify | Use centralized env values |
| `apps/web/src/lib/session_cookie.ts` | Modify | Use centralized env values |
| `apps/web/src/lib/oidc_provider.ts` | Modify | Use centralized env values |
| `apps/web/src/lib/solutions.ts` | Modify | Use centralized env values |
| `apps/web/tests/` | Modify/Create | Coverage for centralized env parsing and load behavior |

## Implementation Notes

- Keep server-only and public env separate. They are different contracts and should fail differently.
- `NEXT_PUBLIC_*` values remain build-time/public where Next.js requires it.
- Do not add a heavy framework unless the minimal module + validator approach proves insufficient.
- Treat `apps/web/src/env/*` as the only approved application-code env readers after this task. Loader/bootstrap seams outside `src/env/*` must stay explicit and small.

## Acceptance Criteria

- [ ] Web app env reads are centralized behind explicit server-only and public env modules.
- [ ] Next config, Vitest, Playwright, and supporting scripts load env consistently with Next.js rules.
- [ ] Existing web helpers, auth pages/routes, admin runtime gates, and LiveKit observer code no longer read `process.env` directly outside the centralized env modules.
- [ ] Grep-based review gates fail if direct application-code `process.env` readers remain outside `apps/web/src/env/*`.

## Verification

```bash
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C apps/web playwright:test
tools/scripts/e2e/run-web-e2e.sh

rg -n "process\\.env" \
  apps/web/src \
  -g '!apps/web/src/env/**'

rg -n "process\\.env" \
  apps/web/src/env \
  apps/web/next.config.ts \
  apps/web/vitest.config.ts \
  apps/web/playwright.config.ts \
  apps/web/e2e/harness.ts \
  apps/web/e2e/build-solutions.ts \
  apps/web/scripts/solution-route-config.mjs
```

Browser proof gate: verify the affected auth/public-origin flows with both Chrome DevTools MCP and Playwright MCP on desktop and mobile before closing the task.

Review gate: the first `rg` command must return no matches after migration for all application code under `apps/web/src` outside `apps/web/src/env/**`. The second `rg` command is an allowlist inventory for intentional env loader/bootstrap seams only.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
