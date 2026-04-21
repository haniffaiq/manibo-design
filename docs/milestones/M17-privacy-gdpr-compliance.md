# M17: Privacy + GDPR Compliance

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M17-privacy-gdpr-compliance
Stream: platform
Depends on: none
Reference: docs/requirements/checklist.md section 13, docs/requirements/vox.md REQ-T03, VOX SOW sections 14-15

## Goal

Technical GDPR compliance: data subject erasure, export, and retention enforcement. DPA execution is an external legal process, but the platform must support the technical obligations -- export bundles, erasure traversal across all derivative data, and retention policy enforcement. Legal blocker for production deployment.

## Design Decisions

1. **Privacy link record model** -- a `privacy_subject` table maps external identifiers to all platform records for a data subject, enabling targeted export and erasure.
2. **Export and erasure are Temporal workflows** -- durable, auditable, resumable on failure.
3. **Erasure traversal covers all derivatives** -- guest sessions, transcripts, delivery logs, extracted data, Grove checkpoint/message stores.
4. **Retention policy is a scheduled workflow** -- runs periodically, deletes records past the configured retention window.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Privacy link record model + migration | not started | none |
| T02 | Data export job API + Temporal workflow | not started | T01 |
| T03 | Data erasure job API + Temporal workflow | not started | T01 |
| T04 | Retention policy enforcement workflow | not started | T01 |
| T05 | Erasure traversal (sessions, transcripts, logs, Grove data) | not started | T03 |
| T06 | Admin UI for privacy jobs | not started | T02, T03 |
| T07 | E2E tests | not started | T01-T06 |

## Acceptance Criteria

- [ ] Tenant admin can request data export for a subject; export bundle is downloadable and checksumable
- [ ] Tenant admin can request data erasure for a subject; no live derivatives remain after completion
- [ ] Retention policy deletes records past the configured window on schedule
- [ ] Erasure covers guest sessions, transcripts, delivery logs, and Grove checkpoint data
- [ ] `uv run pytest` passes for privacy workflow tests
- [ ] `pnpm -C apps/web lint` and `pnpm -C apps/web check-types` pass

## Verification

```bash
uv run pytest apps/api/tests/ -k privacy --tb=short
uv run pytest apps/temporal-worker/tests/ -k privacy --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No automated DPA generation (legal process, not platform feature)
- No consent management UI (out of scope; consent is captured externally)
- No cross-tenant privacy requests (each tenant manages their own subjects)

## M33 Impact

**Requires adaptation.** Data subject erasure/export must now cover `grove.agent_memories` and `grove.agent_skills` in addition to conversations and contact notes. No new workflow type required — extend existing erasure/export workflows to include autonomous agent data. Skills that reference contacts by PII must be included in erasure scope.
