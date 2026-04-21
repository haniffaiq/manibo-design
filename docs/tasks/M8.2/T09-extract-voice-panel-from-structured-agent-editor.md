# T09: Extract The Voice Panel From The Structured Agent Editor

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T07
> **Execution**: Active implementation on `feat/M8.2-control-plane-refactor-hardening` as of 2026-03-30 by explicit human instruction.
> **Checklist Rows**: `docs/requirements/checklist.md:381,385` — deployment-governed agent definition/editor surfaces depend on voice settings staying operator-usable and contract-aligned.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8.2
2. **Requirement-first** — revalidate checklist rows `381,385` before coding; this task may improve structure only, not invent new editor capability beyond the governed agent-definition surface
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T09 - extract voice panel from structured agent editor`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

M8 added more voice controls, which made the structured agent editor monolith worse. Extract the voice panel into a dedicated component boundary that consumes shared voice capability metadata instead of continuing to grow the route-level editor file.

## Subtasks

- [x] Extract the voice panel into its own component/module
- [x] Split obvious subsections if the panel remains too dense
- [x] Replace duplicated provider constants with the shared voice capability manifest
- [x] Keep existing YAML update semantics and field paths intact
- [x] Add focused tests for the extracted voice panel
- [x] Capture required Chrome DevTools MCP and Playwright MCP proof on desktop and mobile, keep screenshots/artifacts, and run the full `apps/web` Playwright suite plus `tools/scripts/e2e/run-web-e2e.sh`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/agent-editor/voice-panel.tsx` | Create | Dedicated voice configuration panel |
| `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` | Modify | Consume the extracted voice panel |
| `apps/web/tests/structured-agent-editor-voice-panel.test.tsx` | Create | Verify extracted voice panel behavior directly |

## Implementation Notes

- This is not a dynamic form-engine task. Keep the extraction boring and explicit.
- Preserve the current operator-facing copy and field structure unless the human asks for UX changes.
- If one more split is needed inside the panel, do it by subsection, not by arbitrary helper clutter.
- Because this task touches `apps/web/**`, completion requires Chrome DevTools MCP + Playwright MCP verification on desktop and mobile, screenshots/artifacts, the full `pnpm -C apps/web exec playwright test` suite, and `tools/scripts/e2e/run-web-e2e.sh`.

## Acceptance Criteria

- [x] The structured agent editor no longer owns the full voice panel inline
- [x] Voice provider/control options come from the shared capability source
- [x] Voice panel tests cover the extracted component directly
- [x] `structured-agent-editor.tsx` shrinks materially
- [x] Chrome DevTools MCP + Playwright MCP desktop/mobile proof, screenshots/artifacts, the full `apps/web` Playwright suite, and `tools/scripts/e2e/run-web-e2e.sh` are part of the completion bundle

## Completion Notes

- Completed on 2026-03-30 on branch `feat/M8.2-control-plane-refactor-hardening`.
- Extracted the inline voice editor block into `apps/web/src/components/agent-editor/voice-panel.tsx`.
- Reduced `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` from `857` lines to `537` while keeping YAML ownership in the parent editor shell.
- Added direct component coverage in `apps/web/tests/structured-agent-editor-voice-panel.test.tsx` for manifest-backed options, missing-node creation, `voice_id` normalization, and top-level `voice` path handling.
- Verification bundle:
  - `pnpm -C apps/web lint`
  - `pnpm -C apps/web check-types`
  - `pnpm -C apps/web exec vitest run tests/structured-agent-editor-voice-panel.test.tsx tests/structured-agent-editor-voice-panel-render.test.tsx tests/structured-agent-editor-voice-panel.test.ts`
  - `uv run pyright -p pyrightconfig.ci.json`
  - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test`
  - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh`
- UI proof artifacts:
  - Playwright MCP desktop screenshot: `/Users/jakit/.codex/mcp-debug/playwright-http/page-2026-03-30T11-47-01-571Z.png`
  - Playwright MCP mobile screenshot: `/Users/jakit/.codex/mcp-debug/playwright-http/page-2026-03-30T11-47-13-464Z.png`
  - Chrome DevTools MCP desktop/mobile screenshots captured on the same admin definition flow after switching TTS to `elevenlabs` and writing `voice-abc123`
  - Web UI harness artifacts: `tools/agents/artifacts/ui-harness/local-20260330T113257Z`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [T07-introduce-shared-voice-capability-registry.md](./T07-introduce-shared-voice-capability-registry.md)
