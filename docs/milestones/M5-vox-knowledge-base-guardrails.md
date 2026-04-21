# M5: VOX Phase 1 -- Knowledge Base + Guardrails

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M5-vox-kb-guardrails
Stream: v2
Depends on: M4
Reference: docs/requirements/vox.md (REQ-S03, REQ-T04), docs/requirements/checklist.md rows 112-116

## Goal

VOX knowledge base v1 with value proposition, course catalog, pricing, FAQ content, and configurable guardrails. WSA agent uses published KB content to answer questions accurately. Guardrails prevent the agent from making disallowed promises (pricing guarantees, enrollment commitments). Content is versioned and approved before use.

## Design Decisions

1. **Content bundles are versioned and immutable once published** -- draft/review/publish lifecycle, no live editing of active content.
2. **Guardrail policies are separate from content** -- a guardrail is a rule (e.g., "never promise a specific price"), not a content document.
3. **Knowledge sources are registered, not embedded** -- the KB model references content locations, the agent runtime resolves them at inference time.
4. **Guardrail evaluation happens in the agent runtime** -- not a separate service; the agent's system prompt and tool constraints enforce guardrails.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Content bundle model + API | not started | none |
| T02 | Guardrail policy model + API | not started | none |
| T03 | Knowledge source registry | not started | T01 |
| T04 | Content publish workflow | not started | T01 |
| T05 | Guardrail evaluation in agent runtime | not started | T02 |
| T06 | Admin UI for KB management | not started | T01-T04 |
| T07 | E2E tests | not started | T01-T06 |

## Acceptance Criteria

- [ ] WSA agent uses published KB content to answer course/pricing questions
- [ ] Guardrails prevent disallowed promises (verified by test conversations)
- [ ] Content is versioned: draft -> review -> published lifecycle
- [ ] Only published content is used by the agent at runtime
- [ ] Admin can create, review, and publish content bundles via UI
- [ ] `uv run pytest` passes for KB and guardrail tests
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## Verification

```bash
uv run pytest apps/api/tests/ -k "content_bundle or guardrail or knowledge" -v --tb=short
uv run pytest packages/grove/tests/ -k "guardrail" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No RAG/vector search (KB is structured content, not document retrieval)
- No multi-tenant KB sharing (each tenant owns its content)
- No automated content generation

## M33 Impact

**Simplifies.** Autonomous agents learn guardrail violations via memory: if the agent makes a disallowed promise, it saves a note and avoids repeating the mistake. Guardrail evaluation logic stays the same (system prompt constraints), but enforcement becomes more organic through experience. KB content structure unchanged.
