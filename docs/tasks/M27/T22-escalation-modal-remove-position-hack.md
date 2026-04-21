# T22: Escalation Modal — Remove Position Hack

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T22 - escalation modal remove position hack`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The EscalationModal uses `className="top-8 max-h-[calc(100vh-4rem)] -translate-y-0 overflow-y-auto"` to override the Modal's default centering. This is a hack. Let the Modal use its default centered position, or if the content is long, let the Modal handle overflow naturally.

## Subtasks

- [x] **Remove className override** from Modal in `escalation-modal.tsx`
- [x] **Verify Modal handles overflow**: The textarea and content should scroll within the Modal's default max-height behavior
- [x] **Test with long content**: Ensure the modal doesn't overflow the viewport when the textarea has a lot of text

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/escalation-modal.tsx` | Modify | Remove className hack |

## Acceptance Criteria

- [x] No position override className on the Modal
- [x] Modal renders centered (default position)
- [x] Content scrolls properly when textarea has long text
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Wireframe: "ESCALATION MODAL" sketch — "Minor: position it normally"
