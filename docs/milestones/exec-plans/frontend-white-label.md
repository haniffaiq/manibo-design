# Execution Plan: Frontend White-Label Architecture

> **Status:** Draft
> **Created:** 2026-02-26
> **Owner:** Simonas Jakubonis
> **Track:** Epic

**NFQ shippable overview:** `wiki/distribution/nfq/README.md` (neutral terminology + file structure + release flow).
**NFQ delivery/release plan:** `docs/milestones/exec-plans/nfq-source-distribution-release-migration-plan.md` (source-level isolation + sync PR pipeline + CI gates).

## 1. Feature Definition

**Goal:** Establish a white-labelable frontend architecture with a shared design system, brand-aware platform shell, solution-injected UI routes, and a sync pipeline for operator source distribution.

**Terminology + roles (do not invent new ones):**
- **Deployment Console** = `super_admin` (cross-tenant ops inside one deployment)
- **Tenant Console** = `client_admin`, `client_operator` (tenant-scoped)

**What “deployment vs admin” means (UI):**
- **Deployment** is the *scope* (cross-tenant).
- **`/admin/*`** is the *URL prefix* we use for Deployment Console routes to avoid collisions with tenant routes and to mirror backend admin-scoped APIs (`/admin/*`).
- Implementation: route group `(deployment)` + segment `admin/` ⇒ files live under `apps/web/src/app/(deployment)/admin/*` and render at `/admin/*`.

**Operational overview (source distribution + dedicated)**

Release flow (NFQ source distribution):
```
Manibo repo (private)
  |
  |  (tag: vX.Y.Z)
  v
CI (tests + build + sync export)
  |
  |  (PR)
  v
NFQ repo (GitHub, no access to Manibo repo)
  |
  |  (NFQ CI: build + tests + allowlist guard)
  v
NFQ deployment (multi-tenant, NFQ-branded)
```

Dedicated single-tenant (no source):
```
Manibo CI (tag: vX.Y.Z)
  |
  |  (signed container images)
  v
Artifact registry (e.g., ACR)
  |
  v
Customer Azure (AKS + managed Postgres/Blob + self-hosted LiveKit/SIP/Temporal)
```

**Acceptance Criteria:**
- [ ] `packages/ui/` provides typed, brand-aware components consumed by `apps/web/` and `solutions/*/ui/`
- [ ] `apps/web/` renders Deployment Console (`super_admin`) and Tenant Console (`client_admin`/`client_operator`) route groups with route guards
- [ ] `NEXT_PUBLIC_BRAND=nfq` builds successfully with NFQ-specific logo, colors, and metadata
- [ ] `NEXT_PUBLIC_SOLUTIONS=driver_verification` injects solution navigation items and routes into the platform shell
- [ ] `driver_verification` solution UI renders a real “Drivers” surface backed by repo-existing APIs (`GET /drivers`, `POST /drivers/import`) when that solution is installed
- [ ] `tools/scripts/sync-distribution.sh` produces a filtered export tree matching an allowlist config
- [ ] `pnpm build` succeeds with 0 TypeScript errors across all packages

**Scope Boundaries:**

Included:
- Shared design system (`packages/ui/`)
- Platform shell with auth + route groups (`apps/web/`)
- Build-time brand resolution via CSS custom properties
- Solution UI injection pattern (proven with `driver_verification`)
- Licensee sync pipeline (allowlist export script + CI workflow)
- One solution UI package implemented against repo-existing endpoints (`driver_verification`)

Excluded:
- Any UI surface whose backend endpoints are not repo-validated (see `docs/requirements/ui-requirements.md`)
- Google Cloud Identity Platform auth implementation (route guards + JWT verification are structural; IdP wiring is separate)
- Runtime solution discovery (build-time manifest only)
- Mobile responsive polish (desktop-first, responsive is Phase 5+ polish)
- Storybook setup (deferred; basic render tests suffice for now)
- i18n/l10n (deferred to Wave 9 locale foundation)

---

## 2. Phase Plan

### Phase 0: Skeleton + Auth + Solution Gating

**Objective:** Prove the three critical paths work end-to-end -- route guards, brand selection, and solution gating (route presence + 404 + conditional imports) -- before investing in components. Real IdP login is NOT in scope here (backend contract is not present yet). If these don’t work here, we stop and redesign before investing in components.

**Input:**
- Source files: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
- Reference: `pnpm-workspace.yaml`, `turbo.json`, `package.json` (root)
- Reference: `wiki/design-docs/react-best-practices.md` (bundle size, no barrel imports)
- Reference: `solutions/` directory structure (Python solutions pattern)

**Deliverables:**
- `packages/ui/package.json` -- Internal package (`@grove/ui`), bare scaffold (NO components yet)
- `packages/ui/tsconfig.json` -- Strict TS, JSX preserve, path alias `@ui/*`
- `packages/ui/tailwind.config.ts` -- Extends tokens as Tailwind theme values from CSS custom properties
- `packages/ui/src/tokens/brand.css` -- CSS custom property definitions (colors, radii, spacing, typography)
- `packages/ui/src/tokens/index.ts` -- TypeScript token type definitions for programmatic access
- `packages/ui/src/lib/cn.ts` -- Class name merge utility (clsx + tailwind-merge)
- `apps/web/src/middleware.ts` -- Auth middleware (JWT validation, route guards, 403 redirect)
- `apps/web/src/lib/auth.ts` -- JWT verification + session decode (refresh is a stub until backend auth exists)
- `apps/web/src/app/(auth)/login/page.tsx` -- Login page (renders; wiring is later)
- `apps/web/src/app/(deployment)/admin/layout.tsx` -- Deployment shell layout (sidebar placeholder)
- `apps/web/src/app/(deployment)/admin/page.tsx` -- Deployment shell entrypoint (placeholder redirect)
- `apps/web/src/app/(tenant)/layout.tsx` -- Tenant shell layout (sidebar placeholder)
- `apps/web/src/lib/solutions.ts` -- Solution manifest reader: parses `NEXT_PUBLIC_SOLUTIONS` (comma-separated), exports enabled solution list and route map
- `apps/web/src/app/(solutions)/driver-verification/drivers/page.tsx` -- One thin wrapper route to prove solution gating + conditional import works
- `solutions/driver_verification/ui/package.json` -- Internal package (`@nfq/driver-verification-ui`), bare scaffold
- `solutions/driver_verification/ui/tsconfig.json` -- TypeScript config, references `@grove/ui`
- `solutions/driver_verification/ui/src/manifest.ts` -- Solution UI manifest (nav items, route prefix, icon)
- `solutions/driver_verification/ui/src/components/placeholder.tsx` -- Placeholder component (proves import path works)
- `pnpm-workspace.yaml` -- Updated: add `packages/ui`, `solutions/*/ui` to workspace
- `turbo.json` -- Updated if needed for solution UI build
- `pnpm-lock.yaml` -- Committed from day 1
- `apps/web/package.json` -- Updated: add `@grove/ui` dependency, `swr` dependency

**Tests:**
- `apps/web/tests/middleware.test.ts` -- Auth middleware route guard tests (~5 tests)
- `apps/web/tests/solutions.test.ts` -- Solution manifest tests (parse, empty, unknown solution ignored) (~4 tests)

**Verification gate:**
```bash
pnpm install --frozen-lockfile                             # Expected: lockfile is committed and valid
pnpm --filter @grove/ui build                              # Expected: builds cleanly (tokens only)
pnpm --filter @nfq/web build                               # Expected: builds cleanly
pnpm --filter @nfq/web check-types                         # Expected: 0 errors
pnpm --filter @nfq/web test                                # Expected: 9+ passed (middleware + solutions)
NEXT_PUBLIC_SOLUTIONS=driver_verification pnpm --filter @nfq/web build  # Expected: driver_verification route included
NEXT_PUBLIC_SOLUTIONS= pnpm --filter @nfq/web build          # Expected: no solution routes, no errors
```

Verification checklist (manual):
- Protected route redirects without session cookie
- Protected route renders with a test session cookie **only when** test auth is enabled (local dev by default; CI explicitly sets `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`)
- Production fails closed by default: without `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`, protected routes always redirect to `/login` even if `grove_session` is present
- Solution route returns 404 when `NEXT_PUBLIC_SOLUTIONS` does not include the solution ID
- Solution route renders when `NEXT_PUBLIC_SOLUTIONS=driver_verification`
- `pnpm install --frozen-lockfile` passes

**Context budget:** ~50K tokens

**Depends on:** none (this phase is intentionally backend-agnostic; real IdP login is a later gate)

**Can run in parallel with:** none (must prove critical paths before investing in components)

---

### Phase 1: Design System Components

**Objective:** Build the shared component library now that the skeleton is proven.

**Input:**
- Source files: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/tailwind.config.ts` (from Phase 0)
- Dependencies from Phase 0: `packages/ui/src/tokens/`, `packages/ui/src/lib/cn.ts`
- Reference: `wiki/design-docs/react-best-practices.md` (bundle size, no barrel imports)

**Deliverables:**
- `packages/ui/src/components/button.tsx` -- Button (variants: primary, secondary, outline, ghost, destructive)
- `packages/ui/src/components/card.tsx` -- Card (header, content, footer slots)
- `packages/ui/src/components/input.tsx` -- Input (label, error, description)
- `packages/ui/src/components/data-table.tsx` -- DataTable (typed columns, sortable headers, pagination)
- `packages/ui/src/components/sidebar.tsx` -- Sidebar (collapsible, nav items, section groups)
- `packages/ui/src/components/modal.tsx` -- Modal (dialog, confirm/cancel)
- `packages/ui/src/components/badge.tsx` -- Badge (status variants: success, warning, error, neutral)
- `packages/ui/src/components/avatar.tsx` -- Avatar (initials fallback, image)
- `packages/ui/src/components/index.ts` -- Named exports (NOT a barrel re-export; each component is also directly importable)
- `packages/ui/playwright-ct.config.ts` -- Playwright component testing config (React)

**Tests:**
- `packages/ui/src/components/*.ct.spec.tsx` -- Playwright component tests (1+ per primitive; colocated)

**Verification gate:**
```bash
pnpm --filter @grove/ui build                    # Expected: builds cleanly
pnpm --filter @grove/ui check-types              # Expected: 0 errors
pnpm --filter @grove/ui playwright:ct            # Expected: component tests pass
bash tools/scripts/check_ui_primitives.sh         # Expected: passes
```

**Context budget:** ~40K tokens

**Depends on:** Phase 0 (tokens exist)

**Can run in parallel with:** Phase 3 (brand system -- both depend only on Phase 0)

---

### Phase 2: Platform Shell

**Objective:** Restructure `apps/web/` into full auth + Deployment Console + Tenant Console route groups with sidebar navigation, building on the skeleton layouts from Phase 0.

**Input:**
- Source files: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/call-ops/page.tsx`, `apps/web/src/app/settings/recordings/page.tsx`
- Dependencies from Phase 0: `apps/web/src/middleware.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/lib/solutions.ts`, route group layouts
- Dependencies from Phase 1: `packages/ui/` components (Sidebar, Button, Card, Input, Avatar, Badge)
- Reference: `wiki/design-docs/react-best-practices.md`

**Deliverables:**
- `apps/web/src/app/(auth)/password-reset/page.tsx` -- Password reset page
- `apps/web/src/app/(auth)/invite-accept/page.tsx` -- Invite acceptance page
- `apps/web/src/app/(auth)/layout.tsx` -- Auth layout (centered card, brand logo)
- `apps/web/src/app/(deployment)/admin/layout.tsx` -- Updated: Deployment Console layout (sidebar + main content, replaces Phase 0 placeholder)
- `apps/web/src/app/(deployment)/admin/page.tsx` -- Updated: Deployment Console entrypoint (redirect to `/admin/dashboard`)
- `apps/web/src/app/(deployment)/admin/dashboard/page.tsx` -- Deployment dashboard (shell: tenant count, active agents, system status cards)
- `apps/web/src/app/(deployment)/admin/tenants/page.tsx` -- Tenant list (DataTable shell)
- `apps/web/src/app/(deployment)/admin/agents/page.tsx` -- Agent definitions list (DataTable shell)
- `apps/web/src/app/(deployment)/admin/deployments/page.tsx` -- Deployment status (shell)
- `apps/web/src/app/(deployment)/admin/system-health/page.tsx` -- System health overview (shell)
- `apps/web/src/app/(tenant)/layout.tsx` -- Updated: Tenant Console layout (sidebar + main content, tenant context, replaces Phase 0 placeholder)
- `apps/web/src/app/(tenant)/dashboard/page.tsx` -- Tenant dashboard (shell: active calls, recent activity)
- `apps/web/src/app/(tenant)/call-ops/page.tsx` -- Migrated from existing `call-ops/page.tsx`, uses `@grove/ui` components
- `apps/web/src/app/(tenant)/settings/page.tsx` -- Tenant settings (shell)
- `apps/web/src/app/(tenant)/settings/recordings/page.tsx` -- Migrated from existing `settings/recordings/page.tsx`
- `apps/web/src/app/(tenant)/team/page.tsx` -- Team members (shell)
- `apps/web/src/app/layout.tsx` -- Updated root layout (brand CSS injection, font loading)
- `apps/web/src/lib/api-client.ts` -- Typed fetch wrapper (auth headers, correlation ID, error normalization)
- `apps/web/src/lib/navigation.ts` -- Navigation config (deployment nav items, tenant nav items, merged solution nav items, exported as typed arrays)
- `apps/web/src/app/page.tsx` -- Updated: redirect to deployment or tenant dashboard

**Tests:**
- `apps/web/tests/navigation.test.ts` -- Navigation config tests (~3 tests)

**Verification gate:**
```bash
pnpm --filter @nfq/web build                     # Expected: builds cleanly
pnpm --filter @nfq/web check-types               # Expected: 0 errors
pnpm --filter @nfq/web lint                       # Expected: 0 errors
NEXT_PUBLIC_SOLUTIONS=driver_verification pnpm --filter @nfq/web build    # Expected: driver_verification routes included
```

**Context budget:** ~60K tokens

**Depends on:** Phase 1 (components must exist for layout buildout)

**Can run in parallel with:** Phase 3 (brand system -- different file sets, no overlap)

---

### Phase 3: Brand System

**Objective:** Implement build-time brand resolution so that `NEXT_PUBLIC_BRAND` controls logo, colors, metadata, and CSS custom property values throughout the app.

**Input:**
- Dependencies from Phase 0: `packages/ui/src/tokens/brand.css`, `packages/ui/src/tokens/index.ts`
- Source files: `apps/web/src/app/layout.tsx`, `apps/web/next.config.ts`

**Deliverables:**
- `apps/web/src/brands/manibo/config.ts` -- Vendor (Manibo) brand config: name, logo path, colors, metadata
- `apps/web/src/brands/manibo/logo.svg` -- Vendor brand logo
- `apps/web/src/brands/nfq/config.ts` -- NFQ brand config: name, logo path, colors, metadata
- `apps/web/src/brands/nfq/logo.svg` -- NFQ brand logo
- `apps/web/src/brands/types.ts` -- `BrandConfig` type definition (name, logo, colors map, metadata, favicon)
- `apps/web/src/lib/brand.ts` -- Brand resolver: reads `NEXT_PUBLIC_BRAND`, lazy-imports matching config, exports typed `BrandConfig`
- `apps/web/src/app/layout.tsx` -- Updated: inject brand CSS custom properties into `<html style>`, brand-aware metadata
- `apps/web/tailwind.config.ts` -- Updated: reference CSS custom properties from brand tokens as Tailwind theme extensions

**Tests:**
- `apps/web/tests/brand.test.ts` -- Brand resolution unit tests (default fallback, explicit brand, unknown brand error) (~4 tests)

**Verification gate:**
```bash
NEXT_PUBLIC_BRAND=manibo pnpm --filter @nfq/web build     # Expected: builds with vendor brand
NEXT_PUBLIC_BRAND=nfq pnpm --filter @nfq/web build        # Expected: builds with NFQ brand
pnpm --filter @nfq/web check-types                        # Expected: 0 errors
```

**Context budget:** ~30K tokens

**Depends on:** Phase 0 (packages/ui tokens)

**Can run in parallel with:** Phase 1 (both depend only on Phase 0), Phase 2 (different file sets)

---

### Phase 4: Sync Pipeline

**Objective:** Build a CI-ready allowlist export script that produces a filtered source tree for operator source distribution, with validation that no forbidden paths or imports leak.

**Input:**
- Dependencies from Phase 2: Final directory structure of `apps/web/`, `packages/ui/`, `solutions/driver_verification/ui/`
- Reference: `.github/workflows/ci.yml` (existing CI structure)

**Deliverables:**
- `tools/sync/nfq.json` -- Licensee config: allowed paths (packages/ui, apps/web, solutions/driver_verification/ui), brand override, excluded paths (other solutions, platform-core internals, infra/terraform secrets)
- `tools/scripts/sync-distribution.sh` -- Allowlist export script: reads config, copies allowed paths to output dir, rewrites package references, supports `--dry-run` mode
- `tools/scripts/sync-guard.sh` -- Validation script: scans output dir for forbidden imports (platform-core internals, other solutions, hardcoded API URLs), exits non-zero on violation
- `.github/workflows/sync-nfq.yml` -- CI workflow: triggered on release tag, runs sync-distribution.sh + sync-guard.sh, uploads artifact

**Tests:**
- Script validation via dry-run mode with assertions in `sync-guard.sh`
- `tools/scripts/test-sync.sh` -- Test harness: runs sync with a test config, injects a forbidden path, asserts guard catches it

**Verification gate:**
```bash
bash tools/scripts/sync-distribution.sh --config tools/sync/nfq.json --dry-run    # Expected: prints filtered tree
bash tools/scripts/sync-guard.sh tools/sync/nfq.json /tmp/sync-output         # Expected: 0 violations
bash tools/scripts/test-sync.sh                                                # Expected: guard catches injected violation
```

**Context budget:** ~30K tokens

**Depends on:** Phase 2 (solution structure and route buildout must be finalized)

**Can run in parallel with:** Phase 5 (independent deliverables, no file overlap)

---

### Phase 5: Solution UI Implementation (`driver_verification`)

**Objective:** Replace the placeholder with a real solution UI package backed by repo-existing APIs, proving the end-to-end contract from navigation → route wrapper → solution UI → API.

**Input:**
- Dependencies from Phase 0: `apps/web/src/app/(solutions)/driver-verification/drivers/page.tsx`, `solutions/driver_verification/ui/` scaffold
- Dependencies from Phase 1: `@grove/ui` components (DataTable, Card, Badge, Button, Input, Modal)
- Reference: `solutions/driver_verification/src/driver_verification/router.py` (repo-existing endpoints)

**Backend contract (repo-validated):**
- `GET /drivers` (list + pagination; tenant-scoped)
- `POST /drivers/import` (CSV import; tenant-scoped; supports `dry_run`)

**Deliverables:**
- `solutions/driver_verification/ui/src/lib/types.ts` -- DTO types mirroring the API responses (`Driver`, `DriversListResponse`, `DriverImportResponse`)
- `solutions/driver_verification/ui/src/lib/api.ts` -- API client functions for drivers list + CSV import
- `solutions/driver_verification/ui/src/hooks/use-drivers.ts` -- SWR hook for `GET /drivers` with pagination params
- `solutions/driver_verification/ui/src/components/DriversTable.tsx` -- Drivers table (list + active filter + pagination)
- `solutions/driver_verification/ui/src/components/DriverImportDialog.tsx` -- CSV upload + dry-run preview + submit
- `solutions/driver_verification/ui/src/pages/DriversPage.tsx` -- Composed page exported for the route wrapper
- `solutions/driver_verification/ui/src/index.ts` -- Exports `DriversPage` + shared components

**Tests:**
- `solutions/driver_verification/ui/tests/hooks.test.ts` -- SWR hook tests with mock fetch (~4 tests)
- `solutions/driver_verification/ui/tests/components.test.tsx` -- Component render tests with mock data (~6 tests)

**Verification gate:**
```bash
pnpm --filter @nfq/driver-verification-ui check-types                    # Expected: 0 errors
pnpm --filter @nfq/driver-verification-ui test                           # Expected: 10+ passed
NEXT_PUBLIC_SOLUTIONS=driver_verification pnpm --filter @nfq/web build   # Expected: full build with real components
pnpm --filter @nfq/web check-types                                       # Expected: 0 errors
```

**Context budget:** ~60K tokens

**Depends on:** Phase 1 (UI components)

**Can run in parallel with:** Phase 4 (independent deliverables)

---

## 3. Execution Graph

```
Phase 0 (skeleton + auth + solution proof)
    |
    +---> Phase 1 (design system components)
    |         |
    |         +---> Phase 2 (platform shell buildout)
    |         |         |
    |         |         +---> Phase 4 (sync pipeline)
    |         |         |
    |         |         +---> Phase 5 (driver_verification UI)
    |         |
    +---> Phase 3 (brand system) --- parallel with Phase 1
```

**Critical path:** Phase 0 -> Phase 1 -> Phase 2 -> Phase 5

**Parallel opportunities:**
- After Phase 0 completes: Phase 1 and Phase 3 can run in parallel (components vs brand, different file sets)
- After Phase 1 completes: Phase 2 and Phase 3 can run in parallel (if Phase 3 not already done)
- After Phase 2 completes: Phase 4 and Phase 5 can run in parallel (scripts vs components, no overlap)

---

## 4. Execution Protocol

For each phase, the supervisor follows this sequence:

1. **Gather** reference material (spec sections, source files, prior outputs)
2. **Construct** developer agent prompt with spec, source, deps, deliverables, tests, gate
3. **Delegate** to developer agent
4. **Verify** gate passes; re-delegate on failure (max 3 attempts)
5. **Update** progress tracking
6. **Proceed** to next phase

### Gate Escalation Protocol

1. **First attempt:** Re-delegate to the same developer agent with failure output
2. **Second attempt:** Provide additional context (related source files, error analysis)
3. **Third attempt:** Investigate whether the phase design is flawed. Consider splitting.
4. **After 3 failures:** Stop. Reassess phase scope and dependencies.

### Integration Gate (after parallel phases merge)

After Phases 1 + 3 merge (both complete), run full verification:
```bash
pnpm build                                    # Full Turborepo build (all packages)
pnpm check-types                              # Full TypeScript check
pnpm lint                                     # Full lint pass
```

After Phases 4 + 5 merge (both complete), run full verification:
```bash
pnpm build                                    # Full Turborepo build
pnpm check-types                              # Full TypeScript check
NEXT_PUBLIC_BRAND=nfq NEXT_PUBLIC_SOLUTIONS=driver_verification pnpm --filter @nfq/web build   # Full branded + solution build
bash tools/scripts/sync-distribution.sh --config tools/sync/nfq.json --dry-run          # Sync pipeline dry run
bash tools/scripts/sync-guard.sh tools/sync/nfq.json /tmp/sync-output               # Guard validation
```

### File Ownership Boundaries (for parallel phases)

Phase 1 owns:
- `packages/ui/src/components/`
- `packages/ui/tests/`

Phase 2 owns:
- `apps/web/src/app/` (all route groups, navigation, solution route wrappers)
- `apps/web/src/lib/navigation.ts`

Phase 3 owns:
- `apps/web/src/brands/`
- `apps/web/src/lib/brand.ts`
- `apps/web/tailwind.config.ts`

Shared files (Phase 2 writes first, Phase 3 updates):
- `apps/web/src/app/layout.tsx` -- Phase 2 establishes structure, Phase 3 adds brand injection

---

## 5. Context Budget

| Content Type | Typical Size | Budget Guideline |
|-------------|-------------|-----------------|
| Spec section (per phase) | 5-15K tokens | Extract only relevant deliverables |
| Source files (per phase) | 10-25K tokens | Existing `apps/web/` files + `packages/ui/` |
| Prior-phase deps | 5-15K tokens | Only imports and type definitions needed |
| React best practices ref | 5-8K tokens | Relevant sections only, not full doc |
| Instructions overhead | 3-5K tokens | Keep prompt concise |
| **Total per agent** | **~40-60K tokens** | **Stay under 80K** |

Rules:
- Never feed the full react-best-practices doc to a developer agent. Extract relevant sections (waterfalls, bundle size, SWR).
- Phase 5 is the heaviest (~60K). If it exceeds budget, split into 5a (hooks + types) and 5b (components).
- Developer agents should read `packages/ui/` component files themselves rather than receiving contents in the prompt.
- For Phase 4 (shell scripts), context is minimal (~30K) since it references directory structure, not code internals.

---

## 6. Team Patterns

### Pattern B: Parallel Workstreams (with sequential bookends)

```
[Sequential]  Phase 0 (skeleton + auth + solution proof)
                  |
[Parallel]    Phase 1 (design system components)  ||  Phase 3 (brand system)
                  |
[Sequential]  Integration gate (merge Phase 1 + 3)
                  |
[Sequential]  Phase 2 (platform shell buildout)
                  |
[Parallel]    Phase 4 (sync pipeline)  ||  Phase 5 (driver_verification UI)
                  |
[Sequential]  Final integration gate
```

**File ownership is strict during parallel phases.** See Section 4 for boundaries.

**Agent allocation:**
- Phase 0: 1 developer agent (skeleton + auth + solution proof)
- Phases 1 + 3: 2 developer agents in parallel (component agent + brand agent)
- Phase 2: 1 developer agent (platform shell buildout)
- Phases 4 + 5: 2 developer agents in parallel (scripts agent + UI agent)

**Handoff protocol:**
- After Phase 0: pass `packages/ui/` token types + `apps/web/` skeleton structure to Phase 1 and Phase 3 agents
- After Phase 1: pass component export list + type signatures to Phase 2 agent
- After Phase 2: pass solution route structure + navigation types to Phase 4 and Phase 5 agents
- Handoffs are compressed summaries, not full file contents

---

## 7. Rules

- One phase at a time for sequential work
- Never skip a phase -- dependencies are strict
- Context budget: stay under 80K tokens per agent prompt
- Every phase has a verification gate -- no exceptions
- Compromises logged in tech-debt-tracker (archived)
- All components follow `wiki/design-docs/react-best-practices.md`:
  - No barrel imports from third-party libraries
  - SWR for client-side data fetching (never useEffect + fetch)
  - Parallel independent fetches via Promise.all
  - Dynamic imports for heavy components (Monaco, chart libraries)
  - Authenticate every Server Action
- TypeScript strict mode in all packages
- No `any` types without written justification
- CSS custom properties for brand tokens (no runtime JS theme switching)
- Solution UI packages are internal Turborepo packages (not published to npm)
- Existing `call-ops` and `settings/recordings` pages are migrated into route groups, not deleted and rewritten

---

## 8. Files Modified

| File | Phase | Change |
|------|-------|--------|
| `pnpm-workspace.yaml` | 0 | Add `packages/ui`, `solutions/*/ui` |
| `pnpm-lock.yaml` | 0 | Committed from day 1 |
| `turbo.json` | 0 | Add `test` task if missing |
| `packages/ui/package.json` | 0 | New: internal package config (bare scaffold) |
| `packages/ui/tsconfig.json` | 0 | New: TypeScript config |
| `packages/ui/tailwind.config.ts` | 0 | New: Tailwind with CSS custom property theme |
| `packages/ui/src/tokens/brand.css` | 0 | New: CSS custom property definitions |
| `packages/ui/src/tokens/index.ts` | 0 | New: token type exports |
| `packages/ui/src/lib/cn.ts` | 0 | New: class name merge utility |
| `apps/web/package.json` | 0 | Update: add @grove/ui, swr deps |
| `apps/web/src/middleware.ts` | 0 | New: auth middleware (JWT validation, route guards) |
| `apps/web/src/lib/auth.ts` | 0 | New: token management, refresh rotation |
| `apps/web/src/app/(auth)/login/page.tsx` | 0 | New: login page (minimal, functional) |
| `apps/web/src/app/(deployment)/admin/layout.tsx` | 0, 2 | New in P0 (placeholder), updated in P2 (full sidebar) |
| `apps/web/src/app/(deployment)/admin/page.tsx` | 0, 2 | New in P0 (redirect placeholder), updated in P2 (redirect to dashboard) |
| `apps/web/src/app/(tenant)/layout.tsx` | 0, 2 | New in P0 (placeholder), updated in P2 (full sidebar) |
| `apps/web/src/lib/solutions.ts` | 0 | New: solution manifest reader |
| `apps/web/src/app/(solutions)/driver-verification/drivers/page.tsx` | 0 | New: thin wrapper proving solution injection |
| `solutions/driver_verification/ui/package.json` | 0 | New: solution UI package (bare scaffold) |
| `solutions/driver_verification/ui/tsconfig.json` | 0 | New: TypeScript config |
| `solutions/driver_verification/ui/src/manifest.ts` | 0 | New: solution manifest |
| `solutions/driver_verification/ui/src/components/placeholder.tsx` | 0 | New: placeholder (replaced in P5) |
| `apps/web/tests/middleware.test.ts` | 0 | New: middleware route guard tests |
| `apps/web/tests/solutions.test.ts` | 0 | New: solution manifest tests |
| `packages/ui/src/components/button.tsx` | 1 | New: Button component |
| `packages/ui/src/components/card.tsx` | 1 | New: Card component |
| `packages/ui/src/components/input.tsx` | 1 | New: Input component |
| `packages/ui/src/components/data-table.tsx` | 1 | New: DataTable component |
| `packages/ui/src/components/sidebar.tsx` | 1 | New: Sidebar component |
| `packages/ui/src/components/modal.tsx` | 1 | New: Modal component |
| `packages/ui/src/components/badge.tsx` | 1 | New: Badge component |
| `packages/ui/src/components/avatar.tsx` | 1 | New: Avatar component |
| `packages/ui/src/components/index.ts` | 1 | New: named component exports |
| `apps/web/src/lib/api-client.ts` | 2 | New: typed fetch wrapper |
| `packages/ui/playwright-ct.config.ts` | 1 | New: Playwright CT config |
| `apps/web/src/app/(auth)/layout.tsx` | 2 | New: auth route group layout |
| `apps/web/src/app/(auth)/password-reset/page.tsx` | 2 | New: password reset page |
| `apps/web/src/app/(auth)/invite-accept/page.tsx` | 2 | New: invite acceptance page |
| `apps/web/src/app/(deployment)/admin/dashboard/page.tsx` | 2 | New: deployment dashboard |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | 2 | New: tenant list |
| `apps/web/src/app/(deployment)/admin/agents/page.tsx` | 2 | New: agent definitions list |
| `apps/web/src/app/(deployment)/admin/deployments/page.tsx` | 2 | New: deployment status |
| `apps/web/src/app/(deployment)/admin/system-health/page.tsx` | 2 | New: system health |
| `apps/web/src/app/(tenant)/dashboard/page.tsx` | 2 | New: tenant dashboard |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | 2 | Migrated: from existing call-ops |
| `apps/web/src/app/(tenant)/settings/page.tsx` | 2 | New: tenant settings |
| `apps/web/src/app/(tenant)/settings/recordings/page.tsx` | 2 | Migrated: from existing recordings |
| `apps/web/src/app/(tenant)/team/page.tsx` | 2 | New: team members |
| `apps/web/src/app/layout.tsx` | 2, 3 | Update in P2: root layout structure; update in P3: brand injection |
| `apps/web/src/lib/navigation.ts` | 2 | New: navigation config (deployment, tenant, solution nav items) |
| `apps/web/src/app/page.tsx` | 2 | Update: redirect to deployment or tenant dashboard |
| `apps/web/src/app/call-ops/page.tsx` | 2 | Delete: migrated to (tenant)/call-ops/ |
| `apps/web/src/app/settings/recordings/page.tsx` | 2 | Delete: migrated to (tenant)/settings/recordings/ |
| `apps/web/tests/navigation.test.ts` | 2 | New: navigation tests |
| `apps/web/src/brands/types.ts` | 3 | New: BrandConfig type |
| `apps/web/src/brands/manibo/config.ts` | 3 | New: vendor brand config |
| `apps/web/src/brands/manibo/logo.svg` | 3 | New: vendor logo |
| `apps/web/src/brands/nfq/config.ts` | 3 | New: NFQ brand config |
| `apps/web/src/brands/nfq/logo.svg` | 3 | New: NFQ logo |
| `apps/web/src/lib/brand.ts` | 3 | New: brand resolver |
| `apps/web/tailwind.config.ts` | 3 | New: Tailwind theme extensions |
| `apps/web/tests/brand.test.ts` | 3 | New: brand resolution tests |
| `tools/sync/nfq.json` | 4 | New: operator allowlist config |
| `tools/scripts/sync-distribution.sh` | 4 | New: allowlist export script |
| `tools/scripts/sync-guard.sh` | 4 | New: validation script |
| `tools/scripts/test-sync.sh` | 4 | New: sync test harness |
| `.github/workflows/sync-nfq.yml` | 4 | New: CI workflow |
| `solutions/driver_verification/ui/src/lib/types.ts` | 5 | New: DTO types |
| `solutions/driver_verification/ui/src/lib/api.ts` | 5 | New: drivers API client |
| `solutions/driver_verification/ui/src/hooks/use-drivers.ts` | 5 | New: drivers SWR hook |
| `solutions/driver_verification/ui/src/components/DriversTable.tsx` | 5 | New: drivers table |
| `solutions/driver_verification/ui/src/components/DriverImportDialog.tsx` | 5 | New: CSV import dialog |
| `solutions/driver_verification/ui/src/pages/DriversPage.tsx` | 5 | New: composed drivers page |
| `solutions/driver_verification/ui/src/index.ts` | 5 | Update: named exports for all components |
| `solutions/driver_verification/ui/tests/hooks.test.ts` | 5 | New: SWR hook tests |
| `solutions/driver_verification/ui/tests/components.test.tsx` | 5 | New: component tests |

---

## 9. Progress Tracking

| Phase | Status | Date | Tests | Notes |
|-------|--------|------|-------|-------|
| 0 - Skeleton + Auth + Solution Gating | Pending | | | Backend-agnostic (uses test JWT); real IdP login is gated separately |
| 1 - Design System Components | Pending | | | |
| 3 - Brand System | Pending | | | Can run parallel with Phase 1 |
| Integration Gate (1+3) | Pending | | | |
| 2 - Platform Shell | Pending | | | |
| 4 - Sync Pipeline | Pending | | | |
| 5 - driver_verification UI | Pending | | | |
| Final Integration Gate (4+5) | Pending | | | |

---

## 10. Cross-References

- Design doc: `wiki/design-docs/frontend-white-label.md` (being written in parallel)
- Architecture: `wiki/architecture/architecture.md` (Section 13.5: build profiles, deployment)
- React practices: `wiki/design-docs/react-best-practices.md`
- Repository guidelines: `AGENTS.md`
- Platform plan: `platform-v3-implementation-plan (archived)`
- Wave 8 (NFQ logistics slice): `docs/milestones/exec-plans/platformv3_wave_8.md`
- Wave 9 (VOX Phase 1): `docs/milestones/exec-plans/platformv3_wave_9.md`
- Debt tracker: tech-debt-tracker (archived)
