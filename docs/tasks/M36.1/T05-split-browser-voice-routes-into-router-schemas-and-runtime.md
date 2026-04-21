# T05: Split browser voice routes into router, schemas, and runtime

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T04

---

## Description

Shrink `call_ops/browser_voice.py` by separating route wiring from LiveKit URL
resolution, credentials, seeded browser-call lifecycle, and request/response
schemas. This file is above 700 LOC today and mixes too many runtime concerns.

## Subtasks

- [ ] **Move request/response models**: extract browser voice schemas into
      `apps/api/src/platform_api/routes/call_ops/browser_voice_schemas.py`.
- [ ] **Move runtime helpers**: extract LiveKit URL resolution, room lifecycle,
      seeded test-call helpers, and record loading into
      `apps/api/src/platform_api/routes/call_ops/browser_voice_runtime.py`.
- [ ] **Keep the router thin**: leave only route registration, dependency
      wiring, and minimal parameter parsing in `browser_voice.py`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_ops/browser_voice.py` | Modify | Thin route surface only. |
| `apps/api/src/platform_api/routes/call_ops/browser_voice_schemas.py` | Create | Browser voice request/response models. |
| `apps/api/src/platform_api/routes/call_ops/browser_voice_runtime.py` | Create | LiveKit/browser runtime orchestration helpers. |
| `apps/api/tests/...` | Modify | Update tests that monkeypatch or import moved browser-voice helpers. |

## Implementation Notes

- Preserve the public route factory and current monkeypatch seams unless T08
  later proves they can be deleted.
- Keep `browser_voice.py` below 500 LOC after the split.
- Prefer deleting compatibility wrappers once their callers are gone instead of
  re-exporting everything forever.

## Acceptance Criteria

- [ ] `call_ops/browser_voice.py` is below 500 LOC.
- [ ] Browser voice schemas no longer live inline in the router file.
- [ ] Browser voice API tests remain green with no route contract drift.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on: [T04-extract-call-ops-dependencies-and-presenters-and-delete-duplicate-helpers.md](T04-extract-call-ops-dependencies-and-presenters-and-delete-duplicate-helpers.md)
