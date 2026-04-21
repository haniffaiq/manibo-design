# M7: VOX Phase 1 -- Analytics Baseline

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M7-vox-analytics-baseline
Stream: platform
Depends on: M4, M6
Reference: docs/requirements/vox.md (REQ-T05), docs/requirements/checklist.md rows 247-252

## Goal

Analytics dashboard covering five KPI categories: response time, leads captured, conversations initiated, leads delivered, and escalations. Operators can see all metrics in one dashboard to assess VOX chat performance and lead quality.

## Design Decisions

1. **Metrics are derived from existing data** -- no new instrumentation pipeline; APIs aggregate from conversation records, lead records, and observability runs.
2. **Dashboard is a tenant page** -- lives under `/analytics` in the tenant shell, not admin-only.
3. **Time-range filtering only** -- no custom dimensions or drill-down in v1; just date range selector.
4. **Server-side aggregation** -- APIs return pre-aggregated metrics, not raw event streams.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Response time tracking API | not started | none |
| T02 | Lead funnel metrics API | not started | none |
| T03 | Conversation metrics API | not started | none |
| T04 | Analytics dashboard UI | not started | T01-T03 |
| T05 | E2E tests | not started | T04 |

## Acceptance Criteria

- [ ] Dashboard shows response time metrics (p50, p95, p99)
- [ ] Dashboard shows leads captured count and conversion rate
- [ ] Dashboard shows conversations initiated count
- [ ] Dashboard shows leads delivered count and delivery success rate
- [ ] Dashboard shows escalation count and resolution rate
- [ ] All 5 KPI categories visible in one page with date range filter
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## Verification

```bash
uv run pytest apps/api/tests/ -k "analytics or metrics" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No real-time streaming metrics (refresh or polling only)
- No custom report builder
- No export to CSV/PDF in v1
