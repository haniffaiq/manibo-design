# V2 Installable Package Foundation

Date: 2026-03-15
Owner: Codex
Status: Completed

## Checklist anchors

- `docs/requirements/checklist.md:54` — pre-V2 contract prep needs concrete package-family and manifest foundations in code, not only in architecture docs.

## Objective

Lay the first V2 code foundation for installable package families by:

1. introducing shared installable-package manifest types
2. expanding route-scope vocabulary to the canonical V2 set
3. adding family-aware discovery hooks without pretending channel/provider families already exist in the repo layout
4. extending profile-verification tooling so future package-family rollout work does not start from zero

## Constraints

- keep existing `SolutionManifest` and `discover_solutions()` call sites working
- do not bypass current Layer 3 enforcement or pretend new package roots are already supported
- keep the slice small enough to verify with targeted architecture tests and scripts

## Outcome

1. Added shared V2 installable-package foundation types in `platform_core.solutions.manifest`:
   - `PackageFamily`
   - `PackageRef`
   - `PackageManifestBase`
   - `ChannelManifest`
   - `ProviderPackManifest`
2. Expanded `ApiRouterSpec.scope` to the canonical V2 route vocabulary:
   - `tenant`
   - `admin_tenant`
   - `deployment`
   - `public_ingress`
   - `webhook`
3. Kept `SolutionManifest` backward-compatible while bridging it into the shared package contract through:
   - `package_name`
   - `package_family`
   - `requires_installed_packages`
   - `route_specs`
   - `as_package_manifest()`
4. Added family-aware discovery hooks in `platform_core.solutions.discovery` without changing existing `discover_solutions()` behavior.
5. Extended `tools/scripts/verify_solution_profile.py` with `--family` so future package-family rollout work has a proof hook instead of starting from zero.
6. Added unit and architecture tests to lock the foundation in place.

## Post-Review Hardening

2026-03-15 review follow-up closed two holes in the original slice:

1. privileged `ApiRouterSpec.scope` values are no longer silently mounted without auth
2. tenant-acting admin routes now reuse solution enablement gating instead of bypassing `tenant_solutions`

The runtime now mounts solution routers through explicit scope handling:
- `tenant` -> tenant auth + tenant solution gating
- `admin_tenant` -> admin-tenant auth + target-tenant solution gating
- `deployment` -> deployment auth
- `public_ingress` / `webhook` -> no mount-time auth dependency; those surfaces remain responsible for their own explicit auth contracts

## Verification

- `uv run python tools/scripts/verify_solution_profile.py --help`
- `uv run pytest packages/platform-core/tests/unit/test_solutions/test_discovery.py tests/architecture/test_v2_preparation_contracts.py -q --tb=short`
- `uv run pytest tests/architecture/test_artifact_exclusion.py tests/architecture/test_installable_package_dependency_declarations.py packages/platform-core/tests/unit/test_solutions/test_discovery.py tests/architecture/test_v2_preparation_contracts.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/solutions/manifest.py packages/platform-core/src/platform_core/solutions/discovery.py packages/platform-core/src/platform_core/solutions/__init__.py packages/platform-core/tests/unit/test_solutions/test_discovery.py tests/architecture/test_v2_preparation_contracts.py tools/scripts/verify_solution_profile.py`
- `uv run pyright packages/platform-core/src/platform_core/solutions/manifest.py packages/platform-core/src/platform_core/solutions/discovery.py packages/platform-core/src/platform_core/solutions/__init__.py packages/platform-core/tests/unit/test_solutions/test_discovery.py tests/architecture/test_v2_preparation_contracts.py tools/scripts/verify_solution_profile.py`
