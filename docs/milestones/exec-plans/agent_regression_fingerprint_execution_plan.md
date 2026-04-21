## Execution Plan: Agent Regression Fingerprinting and Ownership

> **Status:** Completed
> **Created:** 2026-03-12
> **Owner:** Codex
> **Track:** Story

## 1. Feature Definition

**Goal:** Stop the CI agent pipeline from opening duplicate regression issues and duplicate bot PRs for the same root cause.

**Evidence expectation (when Completed):**
- Code pointers:
  - `tools/agents/issue_triage.py`
  - `tools/agents/run.py`
  - `tools/scripts/bot_issue_upsert.py`
- Proof:
  - `uv run pytest tests/architecture/test_issue_triage_labels.py tests/architecture/test_issue_execution_selection.py -q --tb=short`
  - `uv run ruff check tools/agents/issue_triage.py tools/agents/run.py tools/scripts/bot_issue_upsert.py tests/architecture/test_issue_triage_labels.py tests/architecture/test_issue_execution_selection.py`

**Acceptance Criteria:**
- [x] Triage emits a stable `root_cause_fingerprint` for actionable bot issues.
- [x] Issue upsert deduplicates actionable issues by fingerprint before falling back to per-issue key matching.
- [x] Issue execution refuses to start a second bot PR when another open PR already owns the same fingerprint.
- [x] Stale `has-pr` labels caused by closed or missing owner PRs are automatically repaired.
- [x] PR follow-up closes newer duplicate bot PRs that share a fingerprint with an older open owner PR.

**Scope Boundaries:**

Included:
- Actionable bot issue metadata
- Issue creation/upsert dedupe rules
- Issue execution selection guardrails
- Agent docs and architecture tests for the new behavior

Excluded:
- Human-authored issue dedupe
- Repo-audit finding generation logic
- PR deep-review semantics
- Broad queue/orchestrator redesign

---

## 2. Phase Plan

### Phase 1: Fingerprint Metadata

**Objective:** Add stable root-cause fingerprinting to triaged issues and bot issue storage.

**Input:**
- `tools/agents/issue_triage.py`
- `tools/scripts/bot_issue_upsert.py`
- `tools/agents/schemas/issue_triage.schema.json`
- `wiki/ops/agent-prompts/issue_triage.md`

**Deliverables:**
- Triage schema + prompt require `fingerprint`
- Issue bodies persist `root_cause_fingerprint`
- Upsert logic deduplicates by fingerprint before key

**Tests:**
- `tests/architecture/test_issue_triage_labels.py`

**Verification gate:**
```bash
uv run pytest tests/architecture/test_issue_triage_labels.py -q --tb=short
uv run ruff check tools/agents/issue_triage.py tools/scripts/bot_issue_upsert.py tests/architecture/test_issue_triage_labels.py
```

**Depends on:** none

### Phase 2: Single-Owner PR Guard

**Objective:** Prevent issue-execution from opening more than one active PR for the same fingerprint.

**Input:**
- `tools/agents/run.py`
- Phase 1 fingerprint metadata

**Deliverables:**
- PR bodies carry fingerprint metadata
- Issue selection skips issues whose fingerprint is already owned by an open PR
- Stale `has-pr` labels recover automatically when the owner PR disappears

**Tests:**
- `tests/architecture/test_issue_execution_selection.py`

**Verification gate:**
```bash
uv run pytest tests/architecture/test_issue_execution_selection.py -q --tb=short
uv run ruff check tools/agents/run.py tests/architecture/test_issue_execution_selection.py
```

**Depends on:** Phase 1

### Phase 3: Docs and Proof

**Objective:** Record the control-plane rules in the agent docs and prove the slice end to end.

**Input:**
- `tools/agents/README.md`
- prior phases

**Deliverables:**
- README documents fingerprint ownership and one-active-PR semantics
- plan updated with completion notes

**Tests:**
- `tests/architecture/test_issue_triage_labels.py`
- `tests/architecture/test_issue_execution_selection.py`

**Verification gate:**
```bash
uv run pytest tests/architecture/test_issue_triage_labels.py tests/architecture/test_issue_execution_selection.py -q --tb=short
uv run ruff check tools/agents/issue_triage.py tools/agents/run.py tools/scripts/bot_issue_upsert.py tests/architecture/test_issue_triage_labels.py tests/architecture/test_issue_execution_selection.py
```

**Depends on:** Phase 2

---

## 3. Rules

- Use the existing issue/PR pipeline; do not build a parallel dedupe service.
- Prefer hidden metadata comments over fragile title parsing.
- Fail open for missing fingerprint metadata on old issues, but fail closed for creating new duplicate PRs once the metadata exists.

---

## 4. Progress Tracking

| Phase | Status | Date | Tests | Notes |
|-------|--------|------|-------|-------|
| 1 | Done | 2026-03-12 | `uv run pytest tests/architecture/test_issue_triage_labels.py -q --tb=short` | Triage schema/prompt + issue upsert now persist and dedupe by `root_cause_fingerprint` |
| 2 | Done | 2026-03-12 | `uv run pytest tests/architecture/test_issue_execution_selection.py -q --tb=short` | Issue execution now skips active fingerprint-owner PRs and repairs stale `has-pr` labels |
| 3 | Done | 2026-03-12 | `uv run pytest tests/architecture/test_pr_orchestrator_queue_controls.py -q --tb=short` | PR follow-up now closes newer duplicate fingerprint PRs and README documents the ownership model |
