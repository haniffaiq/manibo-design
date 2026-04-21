# Autonomous E2E Traceability Harness Plan

Status: Implemented for the current session-traceability slice

## Summary

Build a dedicated **traceability harness** so an agent can verify observability E2E without a human acting as the caller, operator, or screenshot reader.

Chosen defaults:
- **Primary local gate:** compose-backed `tools/scripts/run_traceability_harness.sh`
- **Parity mode:** optional `TRACEABILITY_HARNESS_MODE=k3d`
- **Session source:** **synthetic agent run**, not PSTN
- **Follow-up lane:** add staging nightly after the local gate is wired into CI

The core missing capabilities are not “better prompts.” They are machine capabilities a human verifier has today and the repo did not:
1. **Stimulus control:** generate one deterministic session/workflow without manual calling.
2. **Identity capture:** reliably discover the real `call_id`, `workflow_id/run_id`, `trace_id`, `correlation_id`, recording ID, and node/tool path created by that session.
3. **Source-of-truth access:** query raw persistence, traces, logs, workflow history, and read-model APIs in one run.
4. **Semantic UI judgment:** assert what the UI means, not just save screenshots.
5. **Verdict synthesis:** compare source data vs read model vs rendered UI and fail on drift.
6. **Failure injection:** run unhappy-path canaries automatically.

This is a **new harness lane**, not an expansion of `run_web_ui_harness.sh`. That script is a browser/UI regression harness. It is not a cross-layer traceability verifier.

## Current Scope

This execution pass is intentionally limited to the first honest slice:
- **session traceability** for route-backed observability session pages
- webhook -> Temporal -> tenant persistence -> observability API -> browser verification
- happy-path canary with recording
- failure-path canary with missing recording and runtime error markers

The following remain follow-up work, not implemented scope for this pass:
- workflow-run traceability parity in the browser verifier
- compare-view verification
- new structured product-log ingestion/storage beyond existing persisted event rails
- staging/nightly automation

## Post-Review Hardening

2026-03-15 review follow-up restored the real-provider canary to fail closed on provider-layer call failures.

Why this matters:
- a call ending `state=completed` with `outcome=error` is not a successful live-call proof
- preserving transcripts, metrics, and timelines is useful evidence, but it must not turn a broken provider outcome into a passing canary

## Implemented Commands and Evidence

Primary local command:
- `tools/scripts/run_traceability_harness.sh`

Optional parity mode:
- `TRACEABILITY_HARNESS_MODE=k3d tools/scripts/run_traceability_harness.sh`

Direct canary command surface:
- `tools/scripts/run_traceability_canary.sh <artifact-root> [canary ...]`

Current artifacts are written under:
- `tools/agents/artifacts/traceability-harness/<run_id>/`

Required artifact families in the current slice:
- `run.json`
- `<canary>/run_manifest.json`
- `<canary>/verdict.json`
- `<canary>/verdict.md`
- `<canary>/raw_*.json`
- `<canary>/read_model_*.json`
- `<canary>/browser_observations.json`
- `<canary>/ui-*.png`
- `<canary>/dom-*.html`

## Key Changes

### 1. Add a deterministic canary driver

Create a new harness entrypoint:
- `tools/scripts/run_traceability_harness.sh`

Create traceability support code under:
- `tools/agents/traceability/`

The harness must run **named canaries** from a checked-in spec, not ad hoc scripts. Add a typed canary definition model with fields:
- `canary_id`
- `mode`
- `recording`
- `input_script`
- `expected_nodes`
- `expected_tools`
- `expected_outcome`
- `expected_flags`

Required first canaries:
1. `happy_path_call_traceability`
2. `failure_path_call_traceability`

### 2. Add a machine-readable run manifest and collectors

After the driver starts a canary, it must write `run_manifest.json` containing:
- `canary_id`
- `started_at`
- `environment`
- `correlation_id`
- expected scenario metadata

Collectors resolve and persist:
- `call_id`
- `workflow_id`
- `run_id`
- `trace_id`
- `recording_id`

Collector outputs must be saved as raw artifacts:
- `raw_call_row.json`
- `raw_runtime_events.json`
- `raw_transcripts.json`
- `raw_recordings.json`
- `raw_platform_workflow_history.json`
- `raw_inbound_workflow_history.json`
- `read_model_tenant_detail.json`
- `read_model_tenant_timeline.json`
- `read_model_admin_detail.json`
- `read_model_admin_timeline.json`

### 3. Add a canonical verifier model

Normalize raw persistence, read-model responses, and browser observations into one verdict model.

Required assertions:
- same `correlation_id` across raw sources, read model, and UI
- same `call_id` / workflow linkage where expected
- node sequence order matches expected canary spec
- tool sequence matches expected canary spec
- timeline ordering is monotonic
- recording availability matches reality
- missing-data flags are explicit when data is absent
- failure-path warnings/errors appear in both read model and UI

The harness must produce:
- `verdict.json`
- `verdict.md`

### 4. Add a semantic browser oracle

Do not use screenshots as the primary oracle.

Use Playwright against the actual running app to assert route-backed observability screens:
- `/observability/sessions/[callId]`
- `/admin/observability/sessions/[callId]?tenant_id=...`

To make this stable, add explicit `data-testid` markers to the observability UI for:
- selected run title
- selected run status
- correlation ID value
- related entity link
- timeline item rows
- selected timeline item kind/label
- recording availability state

Screenshots remain artifacts, not the source of truth:
- `ui-tenant-desktop.png`
- `ui-admin-desktop.png`
- `ui-tenant-mobile.png`
- `dom-tenant.html`
- `dom-admin.html`

### 5. Add failure injection hooks

Add explicit failure controls for canaries:
- disable recording
- force one runtime error marker

This first slice does **not** yet add workflow partial-failure injection.

### 6. Add CI-friendly command surface

Create two script layers:
- `tools/scripts/run_traceability_harness.sh`
- `tools/scripts/run_traceability_canary.sh`

Also extend `tools/scripts/k3d-test-e2e.sh` so it can keep the k3d-backed environment alive while running the traceability canary command, not just `pytest`.

### 7. Update docs and evidence rules

Update:
- `docs/requirements/checklist.md`
- `wiki/testing/regression-coverage.md`
- `wiki/ops/harness_engineering.md`

Document:
- how to run the traceability harness locally
- what artifacts it emits
- what failures mean
- what it proves vs what it does **not** prove yet

## Test Plan

### Required canary scenarios
1. Happy path session
   - transcript + route + tool + recording present
2. Recording disabled / unavailable
   - raw recording absent
   - read model exposes unavailable flag
   - UI renders unavailable state
3. Runtime error marker
   - raw failure event exists
   - read model surfaces warning/error
   - UI shows issue in timeline/detail rail

### Required verifier checks
- correlation join works across all layers
- raw persistence matches read-model ordering
- route-backed UI opens the exact resolved run
- node/tool sequence matches canary spec
- artifacts are complete

## Regression Coverage Mapping

This harness now exists for real and is mapped in:
- `wiki/testing/regression-coverage.md`

Do not describe it as CI-owned or merge-blocking until workflow wiring lands. Today it is an implemented local deterministic gate with a real command surface and artifact contract.

## Assumptions and Defaults

- The first version is for **session traceability proof**, not generic end-user testing.
- The PR gate uses **synthetic sessions** because PSTN in every PR is a bad idea.
- The harness gets privileged read access to the sources of truth in local/staging; otherwise “agent autonomy” is fake.
- Screenshots are retained for auditability, but the merge gate is driven by structured verdicts and semantic browser assertions.
