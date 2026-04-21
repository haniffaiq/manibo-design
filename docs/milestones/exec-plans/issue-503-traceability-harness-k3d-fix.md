Status: Completed

# Issue 503: Traceability Harness k3d Fix

## Checklist Row

- `docs/requirements/checklist.md` row 53: operator-grade observability / deterministic traceability harness, including the `k3d` parity lane.

## Problem

- Tier 0 `k3d` traceability parity is failing for `tools/scripts/run_traceability_harness.sh`.
- The relevant auth contract in `docs/requirements/ui-requirements.md` requires local `k3d` browser proof to use the real ingress host `http://app.grove.localtest.me[:port]`.
- The current `k3d` harness path still routes browser verification through a separate locally started Next.js app, which adds avoidable drift and runtime cost.

## Plan

1. Point the `k3d` traceability harness at the existing ingress-served web app instead of starting a separate local Next.js server.
2. Preserve port-aware host generation for CI-isolated `k3d` clusters.
3. Add an architecture test that locks the `k3d` harness to the real ingress host behavior.

## Verification

- `uv run pytest tests/architecture/test_local_pre_pr_ci_harness.py -q --tb=short`
