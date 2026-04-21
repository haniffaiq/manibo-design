# M16: Hoptrans Driver Verification Completion

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M16-driver-verification-completion
Stream: platform
Depends on: M14
Reference: docs/requirements/checklist.md section 21, docs/requirements/nfq.md section 5.1

## Goal

Complete the driver verification solution beyond the current call flow. Add manager notification alerts for discrepancies, a discrepancy review dashboard, driver audit trail UI, TMS/ERP integration, and CSV import hardening. Blocks NFQ logistics MVP go-live.

## Design Decisions

1. **Manager alerts use M14 notification adapters** -- email and SMS alerts route through the connector layer, hence M14 dependency.
2. **Discrepancy review is a filtered view on existing call data** -- not a separate data model; discrepancies are flagged calls.
3. **Audit trail is a read-only timeline** -- reuses the evidence rail pattern from observability, scoped to a single driver.
4. **TMS/ERP sync is a scheduled Temporal workflow** -- pull-based, not real-time push.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Manager alert rules (email/SMS on discrepancy) | not started | none |
| T02 | Discrepancy review dashboard | not started | none |
| T03 | Driver audit trail UI | not started | none |
| T04 | TMS/ERP sync integration | not started | T01 |
| T05 | CSV import validation hardening | not started | none |
| T06 | Driver verification analytics | not started | T02 |
| T07 | E2E tests | not started | T01-T06 |

## Acceptance Criteria

- [ ] Manager receives email/SMS alert when a discrepancy is detected
- [ ] Manager can review flagged calls in the discrepancy dashboard
- [ ] Audit trail shows complete verification history per driver
- [ ] CSV import rejects malformed rows with clear error messages
- [ ] `uv run pytest` passes for driver verification tests
- [ ] `pnpm -C apps/web lint` and `pnpm -C apps/web check-types` pass

## Verification

```bash
uv run pytest apps/api/tests/ -k driver --tb=short
uv run pytest apps/temporal-worker/tests/ -k driver --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No real-time GPS tracking integration
- No driver mobile app (verification is manager-facing only)
- No automated dispute resolution
