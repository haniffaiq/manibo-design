# T13: Support Drawer — Progressive Disclosure (3 Tiers)

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T13 - support drawer progressive disclosure`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The SupportDrawer dumps everything at once: guidance + latency metrics + stack cards + session insights + assistant path + references. An operator trying to join a live call has to scroll past latency percentiles. Restructure into 3 tiers:

1. **Always visible**: Call reference, guidance section (with action buttons), live session insights
2. **Collapsed**: Timing & performance (SupportLatencyMetrics + SupportStackCards)
3. **Collapsed**: Technical trace (SupportAssistantPath + SupportReferences)

## Subtasks

- [x] **Tier 1 (always visible)**: Keep call reference box, SupportGuidanceSection, SessionInsightsFeed at top level
- [x] **Tier 2 (collapsed)**: Wrap `SupportLatencyMetrics` + `SupportStackCards` in `<details>` with summary "Timing & performance"
- [x] **Tier 3 (collapsed)**: Wrap `SupportAssistantPath` + `SupportReferences` in `<details>` with summary "Technical trace"
- [x] **Style both details sections**: Use the same pattern as T12 — card-like border, summary with chevron
- [x] **Move loading/error messages** above the guidance section (not buried between tiers)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/support-drawer.tsx` | Modify | Restructure content into 3 tiers |

## Implementation Notes

- The guidance section (`SupportGuidanceSection`) is the best part of the operator UX — it should be the first thing visible after the call reference.
- Session insights (transcript + events + routes) stay visible because operators actually read these during a live call.
- The `<details>` elements should have a subtle border and background to visually separate tiers.
- Preserve all SSE streaming logic — this is just a layout change, not a data flow change.
- All `data-testid` attributes must be preserved.

## Acceptance Criteria

- [x] Guidance section + session insights visible without scrolling (for a typical viewport)
- [x] Latency metrics and stack cards hidden behind "Timing & performance" toggle
- [x] Assistant path and trace references hidden behind "Technical trace" toggle
- [x] Expanding a section reveals its content smoothly
- [x] All SSE streaming continues to work (ops events + transcript)
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #2 and #3: Technical metrics exposed + no progressive disclosure
- Wireframe: "SUPPORT DRAWER" sketch (2026-03-26)
