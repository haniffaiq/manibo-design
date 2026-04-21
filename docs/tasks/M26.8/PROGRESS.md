# M26.8: In-Cluster Test Parallelism — Progress

## Status

In progress on `feat/M26.8-in-cluster-test-parallelism`. Scoped and activated on
2026-04-15 after the vCluster vs parallelism investigation
(`wiki/queries/2026-04-15-ci-speed-vcluster-vs-parallelism.md`).

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Add `pytest-xdist` dev dependency and audit session-scope fixtures | Completed | 2026-04-15 |
| T02 | Introduce `E2E_PYTEST_WORKERS` env gate in `run-k3d-e2e.sh` and wire CI | Completed | 2026-04-15 |
| T03 | Parameterise Playwright CI workers via `PLAYWRIGHT_WORKERS` env | Completed | 2026-04-15 |
| T04 | Verification, metrics capture, wiki re-sync, PROGRESS finalisation | Not started | — |

## T01 evidence (2026-04-15)

1. `pytest-xdist>=3.6.0` added to `pyproject.toml` dev group; `uv sync` resolved
   `pytest-xdist==3.8.0` into `.venv`.
2. Collection smoke passed against every tree the k3d E2E phase drives:

   ```
   packages/platform-core/tests/e2e/         76 tests collected in 4.80s
   packages/grove-voice-livekit/tests/      298 tests collected in 10.11s
   apps/api/tests/e2e/ + solutions/*/tests/ 314 tests collected in 3.79s
   ```

   One `PytestAssertRewriteWarning` on `agent_definitions_support` surfaced during
   the solutions collection. It is a pre-existing plugin double-import warning
   unrelated to `pytest-xdist` and does not block parallel execution.

## Fixture audit (CI Linux)

The two session-scope autouse fixtures that bind host ports (LiveKit dev server
on 7880) short-circuit on CI. `packages/platform-core/tests/e2e/conftest.py:186-188`
gates on `_native_livekit_requested()` which returns false unless the macOS
real-provider traceability path is explicitly requested, and
`packages/grove-voice-livekit/tests/e2e/conftest.py:51-54` returns early when
`not _is_macos()`. In the CI Linux heavy runner both fixtures yield without
spawning a process, so xdist workers do not contend for port 7880.

DB isolation is already xdist-safe: `public_pool` is function-scope
(`conftest.py:309-315`) and `tenant_ctx` provisions a fresh `tenant_id`,
`tenant_schema`, and `issuer` per test (`conftest.py:400-464`). Temporal
workflow IDs are derived from per-test UUIDs so the shared worker on
`grove-agent` can continue processing submissions from multiple xdist workers
without ID collision.

## T02 evidence (2026-04-15)

1. `tools/scripts/e2e/run-k3d-e2e.sh` reads `E2E_PYTEST_WORKERS` before the
   final pytest invocation. Unset or `1` keeps single-worker behaviour byte-
   identical; positive integer or `auto` appends `-n ${workers} --dist loadfile`;
   any other value exits 2 with an actionable error naming the offending input.
   Validated locally across the five cases (unset, `1`, `2`, `auto`, `garbage`).
2. `E2E_PYTEST_WORKERS: "2"` is pinned on the `merge-runtime-full` job env in
   `.github/workflows/merge-gate.yml:482`. No other job carries the flag, so
   the rollout is scoped to the heavy k3d lane and reversible via a one-line
   workflow env flip.
3. No new architecture tests pinning CI workflow YAML or shell script
   content (those surfaces are process, not production). Existing
   architecture suite remains green: 20 passed in 8.16s.

## T03 evidence (2026-04-15)

1. `apps/web/playwright.config.ts:22` is now env-driven:
   `process.env.PLAYWRIGHT_WORKERS` wins when set, otherwise CI defaults to
   `4` workers and local dev keeps Playwright's auto. Invalid input raises
   an error naming `PLAYWRIGHT_WORKERS`, so the escape hatch fails fast.
2. `tools/scripts/ci/merge-gate/validate-product.sh` no longer hardcodes
   `--workers=1` on the `run-web-e2e.sh` CLI (that flag would override the
   config). Instead the call site exports
   `PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS:-4}"` so the frontend lane's
   worker count is explicit and reversible via a one-line env flip.
3. Pre-existing architecture pin
   `test_admission_product_helper_emits_phase_heartbeats_and_timeout_diagnostics`
   in `test_ci_runtime_smoke_workflow.py` updated to reflect the new call
   shape (the legacy pin asserted the literal `--workers=1` flag that T03
   removes; leaving it stale would break the pre-existing test). No new
   architecture tests added for the Playwright config; CI workflow and
   shell-script pins are treated as process, not production code.

## Notes

1. Per M26.4, the per-job k3d isolation contract is not touched. All parallelism
   happens inside a single cluster owned by a single GitHub Actions job.
2. Rollout is opt-in via `E2E_PYTEST_WORKERS` / `PLAYWRIGHT_WORKERS` env vars so
   local developers see no behaviour change unless they set the flags.
3. Day-one target is `E2E_PYTEST_WORKERS=2` and `PLAYWRIGHT_WORKERS=4`. Widen only
   after three consecutive green merge-gate main runs at the current step.
4. Native LiveKit fixtures are no-ops on CI Linux
   (`packages/platform-core/tests/e2e/conftest.py:186-188`,
   `packages/grove-voice-livekit/tests/e2e/conftest.py:51-54`), so host port 7880
   is not contested by xdist workers on the merge-gate heavy runner.
5. Baseline metrics captured on 2026-04-15: merge-gate heavy job ~31m on main,
   in-cluster pytest phase ~20m, Playwright single-worker on PR scope. Re-measure
   during T04.

## Verification

Run the commands in the milestone `Verification` section after each task is
complete. Capture `gh run list --workflow merge-gate.yml --json
databaseId,displayTitle,createdAt,updatedAt,conclusion --limit 20` in T04 to
compare against baseline.
