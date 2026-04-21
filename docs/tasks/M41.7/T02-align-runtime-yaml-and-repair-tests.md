# T02: Align Runtime YAML and Repair Tests

> **Milestone**: M41.7-agent-builder-governed-starter-repair
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Fix the builder's YAML bridge so runtime STT/TTS settings round-trip correctly,
then replace stale web tests that still target deleted pre-builder modules.

## Subtasks

- [x] Read/write runtime STT/TTS settings from `channels.voice.*`
- [x] Preserve governed starter YAML keys when the first save creates v1
- [x] Replace stale builder tests with coverage for route focus and YAML round-trip

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/components/yaml-bridge.ts` | Modify | Align builder form data with runtime schema |
| `apps/web/tests/admin-agent-definition-detail-page.test.tsx` | Modify | Cover route focus and redirect behavior |
| `apps/web/tests/channels-panel.test.tsx` | Modify | Replace stale deleted-module coverage with current builder tests |
| `apps/web/tests/structured-agent-editor-yaml.test.ts` | Modify | Add YAML round-trip coverage for runtime voice schema |
| `apps/web/tests/structured-agent-editor-voice-panel.test.ts` | Modify | Add STT model/language-id fallback coverage |

## Acceptance Criteria

- [x] Reopening a saved runtime-schema draft preserves STT provider, model,
      language, and language-identification state
- [x] The first save from a governed starter keeps starter-owned keys intact
- [x] The web test suite no longer imports deleted pre-builder modules

## References

- Milestone: [M41.7-agent-builder-governed-starter-repair.md](../../milestones/M41.7-agent-builder-governed-starter-repair.md)
- Related: [2026-04-20-agent-builder-pr-961-962-follow-on.md](../../../wiki/queries/2026-04-20-agent-builder-pr-961-962-follow-on.md)
