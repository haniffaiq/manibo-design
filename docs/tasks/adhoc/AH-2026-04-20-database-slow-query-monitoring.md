# AH-2026-04-20: Database Slow Query Monitoring

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: `AH-2026-04-20-full-observability-alert-coverage.md`

---

## Description

Add production database slow-query visibility to the Hetzner monitoring stack.
The existing alert coverage proved Postgres availability, pod readiness,
redundancy, and PVC capacity, but did not scrape CloudNativePG instance metrics
or alert on active slow-running queries.

## Subtasks

- [x] Confirm live external Prometheus has Kubernetes metrics but no
      `cnpg`, `postgres`, or `pg_stat` metric names.
- [x] Add a production `PodMonitor` for CloudNativePG Postgres instances.
- [x] Add a CloudNativePG custom query for active queries running longer than
      five seconds.
- [x] Add Prometheus alerts for Postgres metrics missing, replication lag, and
      active slow-running queries.
- [x] Ensure replication-lag and slow-query alerts do not depend on CNPG's
      metric-specific `cluster` label shape; derive `database_cluster` from the
      Postgres pod name before setting the alert `cluster` label to
      `manibo-production`.
- [x] Document that server-side active slow-query monitoring does not replace
      application-side completed-query spans/histograms.
- [x] Render and validate Kubernetes manifests and Prometheus rules.
- [x] Verify live Prometheus sees CloudNativePG metric names after the
      monitoring-only live apply.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/hetzner/production/data-cnpg/configmap-cnpg-slow-query-monitoring.yaml` | Create | CNPG custom active slow-query metric |
| `infrastructure/kubernetes/overlays/hetzner/production/data-cnpg/podmonitor-cnpg-postgres.yaml` | Create | Scrape CNPG Postgres instance exporters |
| `infrastructure/kubernetes/overlays/hetzner/production/data-cnpg/kustomization.yaml` | Modify | Include new monitoring resources |
| `infrastructure/kubernetes/overlays/hetzner/production/data-cnpg/cluster-platform-postgres.yaml` | Modify | Attach custom monitoring queries |
| `infrastructure/kubernetes/overlays/hetzner/production/cluster-temporal-postgres.yaml` | Modify | Attach custom monitoring queries |
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/alerts.yml.tmpl` | Modify | Add DB exporter/slow-query alerts |
| `wiki/ops/production-alerts.md` | Modify | Add DB monitoring runbooks |
| `wiki/ops/mock-sip-load-test-performance-checklist.md` | Modify | Add DB slow-query readiness gate |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Record coverage and remaining completed-query gap |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] Production overlay renders a `PodMonitor` targeting the CNPG Postgres
      instance `metrics` port.
- [x] Prometheus rules validate with `promtool`.
- [x] The runbook explains how to respond to missing DB metrics and active
      slow-running queries.
- [x] The performance checklist blocks 100-concurrent testing until
      application-side completed-query duration spans or metrics exist.

## Verification

- Live external Prometheus check before implementation:
  - `cnpg|postgres|pg_stat|pg_` metric-name search returned no matches.
  - `kube_pod|container_cpu|voice_call|livekit` metric-name search returned
    live Kubernetes metrics, proving the query path was valid.
- `kubectl kustomize infrastructure/kubernetes/overlays/hetzner/production`
  rendered the new `platform/cnpg-postgres` `PodMonitor`,
  `cnpg-slow-query-monitoring` ConfigMap, and both Cluster monitoring
  references.
- Server-side dry-run against `manibo-production` accepted the rendered
  production overlay. Existing warnings were non-blocking last-applied
  annotation warnings and the pre-existing CloudNativePG Barman deprecation
  warning.
- Rendered Prometheus rules passed:
  `promtool check rules /tmp/manibo-alerts-check.yml` reported
  `SUCCESS: 82 rules found`.
- Post-review selector fix: `PostgresReplicationLagHigh` and
  `PostgresSlowRunningQuery` no longer depend on CNPG's metric-specific
  `cluster` label. Live `cnpg_collector_up` uses the DB cluster there, while
  live `cnpg_pg_replication_lag` uses the Kubernetes cluster. The alerts now
  match by `namespace` and Postgres pod name, then derive `database_cluster` from
  the pod name.
- Live monitoring-only apply created `platform/cnpg-postgres` and
  `cnpg-slow-query-monitoring`; Prometheus discovered six `up` CNPG Postgres
  targets:
  - `platform-postgres-1..3`
  - `temporal-postgres-1..3`
- Live external Prometheus returned `cnpg_collector_up` for all six Postgres
  pods and `cnpg_pg_replication_lag=0` for all six pods.
- Flux production data currently reconciles from `main` every 5 minutes with
  pruning enabled, so the live manual Cluster `customQueriesConfigMap` patch is
  reverted until this branch merges. The custom active slow-query metric is
  therefore branch-ready and validated by render/dry-run, but persistent live
  activation depends on the PR being merged and applied by Flux.
