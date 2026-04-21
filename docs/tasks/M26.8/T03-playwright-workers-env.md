# T03: Parameterise Playwright CI workers via `PLAYWRIGHT_WORKERS` env

> **Milestone**: M26.8-in-cluster-test-parallelism
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None (parallel to T01/T02)

---

## Description

Replace the hardcoded `workers: process.env.CI ? 1 : undefined` in
`apps/web/playwright.config.ts:22` with an env-driven value that defaults to
`4` under CI and remains `undefined` (Playwright auto) for local dev. This
lets CI widen web E2E parallelism without any test-code change and keeps a
one-variable rollback path if a spec reveals cross-worker flake.

## Subtasks

- [ ] **Config change**: update `apps/web/playwright.config.ts:22` to read
  `PLAYWRIGHT_WORKERS`, coerce to integer, fall back to 4 under `CI=1`, and
  stay `undefined` locally.
- [ ] **CI wiring**: set `PLAYWRIGHT_WORKERS: "4"` in the env block of the
  PR-scope frontend step in `.github/workflows/merge-gate.yml` (whichever
  job runs `tools/scripts/e2e/run-web-e2e.sh` on PR scope; the current
  Playwright invocation is under the `admission-product` job via
  `validate-product.sh:137-141`).
- [ ] **Architecture test**: add an assertion to
  `tests/architecture/test_playwright_web_e2e_config.py` (create if absent
  following the pattern of sibling architecture tests) that the config
  honours the env var and that `4` is the documented default when unset
  under CI.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/playwright.config.ts` | Modify | Replace `workers: process.env.CI ? 1 : undefined` with env-driven logic shown below. |
| `.github/workflows/merge-gate.yml` | Modify | Add `PLAYWRIGHT_WORKERS: "4"` to the env of the frontend-product-check step. |
| `tests/architecture/test_playwright_web_e2e_config.py` | Create or Modify | Parse the TypeScript config source and assert the env-driven `workers` computation. |

## Implementation Notes

1. Exact replacement for `apps/web/playwright.config.ts:22`:

   ```ts
   workers: (() => {
     const raw = process.env.PLAYWRIGHT_WORKERS;
     if (raw !== undefined && raw !== "") {
       const parsed = Number(raw);
       if (!Number.isFinite(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
         throw new Error(`PLAYWRIGHT_WORKERS must be a positive integer; got: ${raw}`);
       }
       return parsed;
     }
     return process.env.CI ? 4 : undefined;
   })(),
   ```

   Keep `fullyParallel: true` on line 19 untouched — it is the prerequisite
   for this change to do anything.

2. The architecture test may read the file as text and use a regex to assert
   the literal shape. The simpler assertion is acceptable: the presence of
   the string `PLAYWRIGHT_WORKERS` in the config plus a literal `4` default
   under `CI`. Do not spawn a Node process from the test — keep it pure
   Python.
3. The `retries: process.env.CI ? 2 : 0` line (line 21) is not changed. It
   already compensates for the transient flake that widening workers can
   surface.
4. Do not change `tools/scripts/e2e/run-web-e2e.sh`. The workers value is
   owned by `playwright.config.ts`; the shell script only exports the env
   var if a higher-level caller set it.
5. Do not change `apps/web/e2e/session-helpers.ts` or any test file. Auth
   is already per-page-context and safe under multi-worker execution.

## Acceptance Criteria

- [ ] Local `CI= pnpm --filter @nfq/web test:e2e` uses Playwright's auto
  worker count (unchanged behaviour).
- [ ] Local `CI=1 pnpm --filter @nfq/web test:e2e` runs with `workers=4`.
- [ ] `CI=1 PLAYWRIGHT_WORKERS=6 pnpm --filter @nfq/web test:e2e` runs with
  `workers=6`.
- [ ] `CI=1 PLAYWRIGHT_WORKERS=foo pnpm --filter @nfq/web test:e2e` exits
  with a non-zero code and a message naming `PLAYWRIGHT_WORKERS`.
- [ ] `merge-gate.yml` frontend lane env includes `PLAYWRIGHT_WORKERS: "4"`.
- [ ] The new or extended architecture test passes.

## Verification

```bash
# Type check
pnpm --filter @nfq/web check-types

# Architecture test
uv run python -m pytest tests/architecture/test_playwright_web_e2e_config.py -q

# Smoke: with 4 workers, built server off for quick feedback
CI=1 PLAYWRIGHT_WORKERS=4 pnpm --filter @nfq/web test:e2e -- --project=chromium --reporter=list 2>&1 | tail -20

# Negative input
CI=1 PLAYWRIGHT_WORKERS=foo pnpm --filter @nfq/web test:e2e; echo "exit=$?"
```

## References

- Milestone: [M26.8-in-cluster-test-parallelism.md](../../milestones/M26.8-in-cluster-test-parallelism.md)
- Current config: `apps/web/playwright.config.ts:16-54`
- Auth isolation evidence: `apps/web/e2e/session-helpers.ts:17-44`
- Frontend lane: `tools/scripts/ci/merge-gate/validate-product.sh:137-141`
