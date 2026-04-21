# Execution Plan: Platform v3.0 — Wave 2: Security & Isolation

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed
> **Completed:** 2026-02-22

### Wave 2: Security & Isolation

---

#### Phase 2.0: Public schema creation [DONE]

**Objective:** Create the public schema tables required by the platform: tenants, users, memberships (with tenant role), tenant_solutions, audit_events, usage_events, oidc_providers, solution_migration_state, and webhook security tables for multi-tenant webhook tenant resolution + replay protection.

**Input:**
- Architecture doc Sections 6.1, 6.2, 6.4, 6.5, 10.1, 11.1
- Table definitions scattered across these sections

**Deliverables:**
- `packages/platform-core/src/platform_core/models/` — Pydantic models for all public tables
- Alembic migration in `packages/platform-core/` creating all public schema tables
- Seed script for development (sample tenant, admin user)
  - Includes `public.webhook_endpoints` (key id → tenant_id + source + status + secret ref)
  - Includes `public.webhook_events` (tenant_id + source + event_id idempotency/replay table)

**Tests:**
- Migration up/down test
- Model validation tests

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~40K tokens
**Depends on:** Phase 1.1 (tenant_id settled)
**Can run in parallel with:** Phase 2.1

---

#### Phase 2.1: RLS policies on grove.* tables [DONE]

**Objective:** Implement Row-Level Security on all grove.* tables. Fail-closed: missing app.tenant_id raises error, does not return unfiltered rows.

**Input:**
- Architecture doc Section 6.1: RLS implementation requirements
- Section 15 invariant #1

**Deliverables:**
- Alembic migration: CREATE POLICY on grove.chats, grove.messages, grove.checkpoints, grove.chat_subscriptions
- FORCE ROW LEVEL SECURITY on all grove tables
- Application DB role without BYPASSRLS
- Migration DB role (separate) for DDL operations
- `SET LOCAL app.tenant_id` wrapper in asyncpg pool connection acquisition

**Tests:**
- Integration test: query without SET LOCAL raises error (fail-closed)
- Integration test: query with tenant_A context returns only tenant_A rows
- Integration test: BYPASSRLS role cannot be used by application

**Verification gate:**
```bash
uv run pytest packages/grove/tests/integration/ -v --tb=short
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

**Context budget:** ~40K tokens
**Depends on:** Phase 1.2 (tenant_id on all tables)
**Can run in parallel with:** Phase 2.0

---

#### Phase 2.2: OidcAuthProvider in platform-core [DONE]

**Objective:** Implement the pluggable OIDC auth provider replacing the current HS256 JwtAuthProvider. RS256 only, multi-issuer, JWKS validation.

**Input:**
- Architecture doc Section 11.1: full auth architecture
- Existing: `grove/core/auth.py` (AuthProvider ABC), `grove/api/middleware/auth.py`

**Deliverables:**
- `packages/platform-core/src/platform_core/auth/provider.py` — OidcAuthProvider
- `packages/platform-core/src/platform_core/auth/jwks.py` — JWKS client with caching
- `packages/platform-core/src/platform_core/auth/middleware.py` — FastAPI middleware (3 scopes)
- Multi-issuer validation flow (oidc_providers table lookup)
- Algorithm whitelist enforcement: `algorithms=["RS256"]`

**Tests:**
- Unit: token validation (valid RS256, rejected HS256, expired, wrong audience, wrong issuer)
- Unit: multi-issuer routing (registered issuer accepted, unregistered rejected)
- Unit: JWKS caching (cache hit, cache refresh)
- Unit: 3 request scopes (tenant, deployment, admin-tenant)

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~50K tokens
**Depends on:** Phase 2.0 (oidc_providers table exists)
**Can run in parallel with:** Phase 2.1

---

#### Phase 2.3: psycopg RLS enforcement for LangGraph [DONE]

---

## Completion Evidence (2026-02-22)

- Review tracker: platform-v3 consolidated review (archived)
- PASS evidence (representative):
  - P2.0: `uv run pytest packages/platform-core/tests/unit/test_public_schema_models.py -q`
  - P2.1: `packages/grove/tests/integration/backends/test_rls_enforcement.py:1`
  - P2.3: `packages/grove/tests/integration/backends/test_psycopg_langgraph_rls.py:1`

**Objective:** Ensure the psycopg connection pool (used by LangGraph's AsyncPostgresSaver) also enforces RLS via SET LOCAL app.tenant_id.

**Input:**
- Architecture doc Section 6.1: RLS on all grove.* queries
- Review finding SEC-004: psycopg pool with autocommit=True has different transaction semantics

**Deliverables:**
- Connection wrapper or hook for psycopg pool that sets tenant context
- Integration with LangGraph checkpoint operations
- Documentation of the approach

**Tests:**
- Integration: LangGraph checkpoint write respects tenant isolation
- Integration: LangGraph checkpoint read with wrong tenant returns nothing

**Verification gate:**
```bash
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~30K tokens
**Depends on:** Phase 2.1 (RLS policies exist)
**Can run in parallel with:** Phase 2.2
