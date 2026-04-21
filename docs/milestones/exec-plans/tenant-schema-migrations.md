# Execution Plan: Tenant Schema Migrations

> **Status:** Active
> **Created:** 2026-02-17

## Goal

Create Alembic migrations for 7 per-tenant tables (DATA-10 through DATA-16) in `packages/platform-core/`.

## Acceptance Criteria

- [ ] Alembic env for tenant schema at `packages/platform-core/src/platform_core/alembic/`
- [ ] alembic.ini with timestamp-based file naming
- [ ] Migration creates 7 tables: calls, call_recordings, call_transcripts, agents, agent_deployments, incidents, incident_rules
- [ ] Schema-agnostic (no hardcoded schema names)
- [ ] pyright + ruff pass
- [ ] Migration applies to fresh test schema

## Scope Boundaries

**Included:** Alembic setup, migration file, table DDL
**Excluded:** Application code, models, stores, API endpoints, public schema, RLS policies

---

## Phase 1: Alembic Infrastructure + Migration

**Objective:** Set up Alembic for tenant schema and create all 7 tables

**Deliverables:**
- `packages/platform-core/alembic.ini` -- Alembic config with timestamp file naming
- `packages/platform-core/src/platform_core/alembic/env.py` -- Async Alembic env (follows Grove pattern)
- `packages/platform-core/src/platform_core/alembic/script.py.mako` -- Template
- `packages/platform-core/src/platform_core/alembic/versions/<timestamp>_initial_tenant_schema.py` -- All 7 tables
- `packages/platform-core/pyproject.toml` -- Add alembic dependency

**Verification:**
```bash
uv run pyright packages/platform-core/src/
uv run ruff check packages/platform-core/src/ && uv run ruff format packages/platform-core/src/ --check
```

## Phase 2: Test Migration

**Objective:** Verify migration applies cleanly

**Deliverables:**
- Manual test: create schema, apply migration, verify tables exist

**Verification:**
```bash
# In docker compose postgres:
# CREATE SCHEMA tenant_test;
# SET search_path TO tenant_test;
# Run alembic upgrade head
```

## Rules

- Raw SQL via `op.execute()` (same as Grove pattern)
- `from __future__ import annotations` in all Python files
- No AI attribution anywhere
- No hardcoded schema names in migrations
