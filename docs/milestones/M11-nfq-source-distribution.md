# M11: Solution Package Isolation + Source Distribution

Status: done
Created: 2026-03-20
Owner: Jakit
Branch: feat/M11-solution-package-isolation
Stream: dist
Depends on: none
Reference: wiki/design-docs/solution-package-isolation-spec.md
Prior art: docs/milestones/exec-plans/nfq_source_distribution_separation.md

## Goal

Restructure the monorepo so each solution's web UI is a separate npm workspace package under `solutions/{name}/ui/`, then build a mechanical source export pipeline that ships only contracted solutions per client. This is the foundational structural change that M1, M20, M21, and M15 build on — solution pages must live in the right place before they get decomposed or redesigned.

## Why M11 Must Come First

The current state is a half-migration:

```
BACKEND (clean separation ✓)
  solutions/appointment_booking/     ← separate Python package, entry-point discovered
  solutions/driver_verification/     ← separate Python package, entry-point discovered
  docker/profiles/licensed-platform/ ← build-time exclusion via pyproject.toml workspace

FRONTEND (broken separation ✗)
  apps/web/src/solutions/appointment-booking/bookings-page.tsx  ← inside web app, ships in every build
  apps/web/src/solutions/driver-verification/drivers-page.tsx   ← inside web app, ships in every build
  solutions/driver_verification/ui/  ← prototype npm package exists but is empty placeholder
  pnpm-workspace.yaml               ← already declares "solutions/*/ui" as workspace members
```

**The prototype exists but was never finished.** `solutions/driver_verification/ui/` has a `package.json` (`@nfq/driver-verification-ui`) and is in the pnpm workspace, but the actual code is still in `apps/web/src/solutions/`.

If M21 T16 decomposes `bookings-page.tsx` into components while it lives inside `apps/web/src/solutions/`, those components go into the wrong location. When M11 later moves them to `solutions/appointment_booking/ui/`, every import path breaks and the decomposition work is wasted.

**Correct order: M11 (move code to solution packages) → M1/M20 (components/infra) → M21 (decompose in the right place)**

## Design Decisions

1. **Option C: separate npm workspace packages per solution** — each solution's web UI becomes `solutions/{name}/ui/` with its own `package.json`, TypeScript config, and exports map. This is the most scalable approach because:
   - pnpm workspace already supports `solutions/*/ui` (declared in `pnpm-workspace.yaml`)
   - A prototype already exists (`solutions/driver_verification/ui/` with `@nfq/driver-verification-ui`)
   - Build-time exclusion is trivial: don't list the package in the workspace
   - Source export is clean: don't copy the directory
   - No runtime gating tricks needed — the code physically doesn't exist in the build

2. **`apps/web` imports solution UI via workspace packages** — `@solution/appointment-booking-ui`, `@solution/driver-verification-ui`. The web app's `registry.ts` dynamically imports from whatever solution packages are in the workspace.

3. **Generated registry replaces hardcoded imports** — a build-time script scans `solutions/*/ui/package.json` for manifests and generates:
   - `apps/web/src/lib/generated-solution-manifests.ts` (manifest array)
   - `apps/web/src/lib/generated-solution-routes.tsx` (dynamic route components)
   - `apps/web/src/lib/generated-solution-dashboard-widgets.tsx` (dashboard widgets)
   Only installed solution packages produce entries. If a solution package isn't in the workspace, it doesn't appear.

4. **Solution UI packages depend on `@grove/ui` and shared types, never on each other** — same layering rule as backend: solution → platform-core/grove, never solution → solution.

5. **Allowlist export, not denylist** — NFQ gets explicitly listed packages. `distribution/clients/nfq.yaml` controls what's included.

6. **Profile-based web builds** — `docker/profiles/licensed-platform/` and `single-tenant/` get profile-specific `pnpm-workspace.yaml` that only lists contracted solution UI packages, so the Next.js build excludes everything else.

7. **Cross-solution types are Platform Core contracts** — if two solutions need to share a data type (e.g., Lead, Driver, Booking), that type is defined in `packages/platform-core/contracts/`, not exported from one solution to another. Solutions import shared contracts from Layer 2, never from Layer 3 siblings. This rule is mechanically enforced by architecture tests.

## Target Structure

```
solutions/
├── appointment_booking/
│   ├── src/appointment_booking/    # Python backend (existing, unchanged)
│   ├── pyproject.toml              # Python package (existing, unchanged)
│   └── ui/                         # NEW: npm package @solution/appointment-booking-ui
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── manifest.ts         # SolutionUIManifest (MOVED from apps/web/src/solutions/)
│           ├── bookings-page.tsx   # MOVED from apps/web/src/solutions/
│           ├── clinic-browser-voice-card.tsx
│           ├── livekit-browser-room.ts
│           ├── api/
│           │   ├── clinic-bookings.ts
│           │   └── clinic-knowledge-base.ts
│           └── widgets/
│               └── dashboard-widget.tsx
│
├── driver_verification/
│   ├── src/driver_verification/    # Python backend (existing, unchanged)
│   ├── pyproject.toml              # Python package (existing, unchanged)
│   └── ui/                         # EXPAND existing prototype package
│       ├── package.json            # @nfq/driver-verification-ui (exists, rename to @solution/...)
│       ├── tsconfig.json           # (exists)
│       └── src/
│           ├── manifest.ts         # MOVED from apps/web/src/solutions/
│           ├── drivers-page.tsx    # MOVED from apps/web/src/solutions/
│           ├── api/
│           │   └── driver-verification.ts
│           └── widgets/
│               └── dashboard-widget.tsx
│
├── lead_capture/
│   └── ui/                         # FUTURE: VOX-only, not in NFQ export
│
└── ...other solutions.../

apps/web/
├── src/
│   ├── solutions/
│   │   └── registry.ts             # GENERATED by build script — imports from @solution/* packages
│   ├── lib/
│   │   ├── generated-solution-manifests.ts    # GENERATED
│   │   ├── generated-solution-routes.tsx      # GENERATED
│   │   └── generated-solution-dashboard-widgets.tsx  # GENERATED
│   └── ...
└── package.json                    # depends on @solution/* packages in workspace

docker/profiles/
├── licensed-platform/
│   ├── pyproject.toml              # Python workspace (existing)
│   ├── pnpm-workspace.yaml         # NEW: only contracted solution UIs
│   └── ...
└── single-tenant/
    ├── pyproject.toml              # Python workspace (existing)
    ├── pnpm-workspace.yaml         # NEW: only contracted solution UIs
    └── ...
```

## NFQ Contracted Allowlist

Packages NFQ receives (from `distribution/clients/nfq.yaml`):

- `packages/grove` (framework)
- `packages/grove-voice-livekit` (voice adapter)
- `packages/platform-core` (platform)
- `packages/ui` (design system)
- `solutions/appointment_booking` (clinic — backend + UI)
- `solutions/driver_verification` (logistics — backend + UI)
- `solutions/telematics_ingestion` (logistics — backend only)
- `solutions/call_monitoring` (shared — backend only)
- `solutions/outbound_campaigns` (contracted per `distribution/clients/nfq.yaml`)
- `solutions/notifications` (shared — backend only)
- Allowlist-filtered code from `apps/api`, `apps/temporal-worker`, `apps/agent-worker`, `apps/web`

NOT included: `solutions/lead_capture`, `solutions/schedule_management`, `solutions/operations_monitor`, any VOX-specific UI code.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Create solution UI package template and conventions doc | done | none |
| T01b | Create packages/web-shared for types and components solutions need | done | T01 |
| T02 | Move appointment-booking UI to solutions/appointment_booking/ui/ | done | T01b |
| T03 | Expand driver-verification UI package with real code | done | T01b |
| T04 | Build solution registry generator script | done | T01 |
| T05 | Wire generated registry into apps/web, remove hardcoded imports | done | T02, T03, T04 |
| T06 | Add profile-specific pnpm-workspace.yaml for licensed-platform and single-tenant | done | T05 |
| T07 | Profile build proof: Next.js builds with only NFQ solutions | done | T06 |
| T08 | API route filtering in export script | done | none |
| T09 | Test tree partitioning by solution scope | done (partial) | none |
| T10 | Export proof: build + lint + typecheck on filtered source | done | T07, T08, T09 |
| T11 | Export proof: run contracted tests only on filtered source | done | T10 |
| T12 | CI gate: export check runs on PR if distribution/ or solutions/ changed | done | T10 |
| T13 | Document source distribution procedure in wiki/ops/ | done | T10 |
| T14 | Playwright regression: verify solution pages still render after move | done | T05 |

## Acceptance Criteria

- [x] Each solution with web UI has a `solutions/{name}/ui/` npm package with its own `package.json`
- [x] `apps/web/src/solutions/` contains only generated files — no solution page source code
- [x] `pnpm -C apps/web build` succeeds with all solution UI packages installed
- [x] `pnpm -C apps/web build` succeeds with only NFQ solution UI packages (appointment-booking + driver-verification)
- [x] `pnpm -C apps/web build` succeeds with zero solution UI packages (platform-only build)
- [x] `tools/scripts/artifact/export-client.sh nfq` produces a source tree with zero VOX/lead-capture code
- [x] Exported source builds, lints, and typechecks cleanly
- [x] Exported tests pass (no imports of excluded solutions)
- [x] `grep -r "lead_capture\|outbound_campaigns" exported_source/` returns zero matches outside config references
- [x] CI gate runs export proof automatically on relevant PRs
- [x] All existing Playwright E2E tests pass after restructuring
- [x] Solution UI packages follow layering: solution → @grove/ui + shared types, never solution → solution
- [x] Cross-solution data types (e.g., Lead, Driver, Booking) are owned by `packages/platform-core/contracts/`, not exported from individual solutions
- [x] Architecture test: `grep -r "from.*solutions/" solutions/*/src/ | grep -v __pycache__` returns zero cross-solution imports

## Verification

```bash
# Full build with all solutions
pnpm install
pnpm -C apps/web build
pnpm -C apps/web lint
pnpm -C apps/web check-types

# Profile build: NFQ-only solutions
cp docker/profiles/licensed-platform/pnpm-workspace.yaml pnpm-workspace.yaml
pnpm install
pnpm -C apps/web build

# Export and verify
tools/scripts/artifact/export-client.sh nfq /tmp/nfq-export
cd /tmp/nfq-export
uv sync && pnpm install
uv run ruff check .
uv run pyright packages/ apps/
pnpm -C apps/web lint && pnpm -C apps/web check-types

# Verify no VOX code leaked
grep -r "lead_capture\|outbound_campaigns" --include="*.py" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v ".yaml"

# Playwright regression
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

## Non-Goals

- No repo fork or separate repo
- No Python packaging changes (backend isolation already works via pyproject.toml profiles)
- No runtime behavior changes (tenant solution gating stays as defense-in-depth)
- No UI redesign or page decomposition (that's M20/M21 — happens after this structural move)
- No test rewrite (just partitioning/filtering of existing tests)
