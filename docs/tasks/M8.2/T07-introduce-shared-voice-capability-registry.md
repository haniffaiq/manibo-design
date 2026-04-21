# T07: Introduce A Shared Voice Capability Registry

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Execution**: Completed on 2026-03-30 on milestone branch `feat/M8.2-control-plane-refactor-hardening` as commit `feat: M8.2 T07 - introduce shared voice capability registry`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233,381,385` — live voice runtime behavior and deployment-governed agent definition/editor surfaces both depend on capability metadata staying aligned.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8.2
2. **Requirement-first** — revalidate checklist rows `228-233,381,385` before coding; registry scope may not expand into new product features without a new contract
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T07 - introduce shared voice capability registry`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

M8 exposed more LiveKit-backed voice controls, but provider and capability metadata is still split between Python runtime mapping and TypeScript editor constants. That is how drift happens. Introduce one authoritative voice capability registry and make runtime + editor consume it instead of maintaining separate lists.

## Subtasks

- [x] Define a backend-owned voice capability registry for STT, TTS, turn handling, and optional voice controls
- [x] Generate or otherwise publish a web-consumable capability manifest from that registry
- [x] Update runtime mapping to use the registry as the authority for supported providers/features
- [x] Update the web editor to consume the shared manifest instead of hard-coded provider arrays
- [x] Add verification so registry/manifest drift is caught mechanically
- [x] Add direct web/editor regression coverage for the shared capability manifest
- [x] Capture required Chrome DevTools MCP and Playwright MCP proof on desktop and mobile, keep screenshots/artifacts, and run the full `apps/web` Playwright suite plus `tools/scripts/e2e/run-web-e2e.sh`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/config/voice_capabilities.py` | Create | Authoritative voice provider/capability registry |
| `tools/scripts/generate_voice_capability_manifest.py` | Create | Generate web-consumable capability data |
| `apps/web/src/lib/voice/voice-capabilities.ts` | Create/Modify | Web-side capability manifest consumption |
| `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` | Modify | Use shared capability metadata during mapping |
| `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` | Modify | Stop using duplicated provider arrays |
| `apps/web/tests/admin-agent-definition-detail-page.test.tsx` | Modify | Verify the editor consumes shared capability metadata |
| `apps/web/tests/structured-agent-editor-yaml.test.ts` | Modify | Keep YAML/editor state updates aligned with the manifest-driven fields |
| `apps/web/e2e/admin-agent-definitions.spec.ts` | Modify | Verify admin agent-definition flows after manifest-driven provider changes |
| `apps/web/e2e/admin-agent-channels.spec.ts` | Modify | Verify channel/voice editor flows after manifest-driven provider changes |

## Implementation Notes

- One source of truth matters more than the exact transport. Generated artifact, checked-in manifest, or thin API endpoint are all acceptable if they stay boring.
- Do not hide provider support behind ad-hoc string checks scattered across the runtime and UI.
- Keep it capability-focused: what providers exist, which optional knobs they support, and what defaults they imply.
- Because this task touches `apps/web/**`, completion requires Chrome DevTools MCP + Playwright MCP verification on desktop and mobile, screenshots/artifacts, the full `pnpm -C apps/web exec playwright test` suite, and `tools/scripts/e2e/run-web-e2e.sh`.

## Acceptance Criteria

- [x] Runtime and editor stop maintaining separate hard-coded provider/capability lists
- [x] Adding a provider requires updating one authoritative registry, not multiple scattered constants
- [x] Mechanical verification exists for registry/manifest drift
- [x] Direct web/editor regression tests plus `admin-agent-definitions.spec.ts` and `admin-agent-channels.spec.ts` remain green after the manifest switch
- [x] Chrome DevTools MCP + Playwright MCP desktop/mobile proof, screenshots/artifacts, the full `apps/web` Playwright suite, and `tools/scripts/e2e/run-web-e2e.sh` are part of the completion bundle

## Completion Notes

1. Authoritative capability ownership now lives in `packages/grove/src/grove/config/voice_capabilities.py`. That registry defines the supported STT providers, TTS providers, turn-detection modes, endpointing/interruption controls, and noise-cancellation metadata used by both runtime and editor surfaces.
2. The web consumes a generated, checked-in manifest at `apps/web/src/lib/voice/generated-voice-capabilities.ts` via `apps/web/src/lib/voice/voice-capabilities.ts`. Drift is checked mechanically by `tools/scripts/generate_voice_capability_manifest.py --check` and `packages/grove/tests/unit/config/test_voice_capabilities.py`.
3. `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` now validates supported providers and runtime modes against the shared registry instead of local string sets.
4. `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` no longer owns hard-coded voice provider arrays. It now uses manifest-driven editor options, preserves hidden current values when needed, and writes the correct TTS field for each provider (`voice_name` for Google, `voice_id` for ElevenLabs).
5. Direct editor regression coverage lives in `apps/web/tests/structured-agent-editor-voice-panel-render.test.tsx` and `apps/web/tests/structured-agent-editor-voice-panel.test.ts`. The broader admin Playwright specs stayed green, but those direct tests are the real proof that the voice panel follows the shared manifest.
6. Completion proof included Playwright MCP and Chrome DevTools MCP desktop/mobile verification on the admin agent-definition page while switching TTS provider to `elevenlabs` and confirming the manifest-driven `Voice ID` field behavior.

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
