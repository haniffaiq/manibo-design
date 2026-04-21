# T08: Centralize shared Grove execution-path runtime env readers

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Centralize the shared Layer-1 Grove env readers that feed the executor/LLM hot path but do not belong to a single app shell. This task covers shared runtime helpers such as provider registry, LLM fallback toggles, the built-in REST connector tool, and native Gemini route-decision settings so M35 does not claim centralized runtime ownership while those execution-path contracts still live behind scattered `os.environ` reads.

## Subtasks

- [ ] **Inventory shared Grove execution-path readers**: audit the remaining shared Layer-1 env readers that feed `grove.runtime.executor` and the LLM execution path.
- [ ] **Define shared Layer-1 ownership**: move those env-backed contracts behind shared Layer-1 settings fragments or injected values without inventing an app-owned singleton inside `packages/grove`.
- [ ] **Remove direct execution-path env reads**: migrate provider-registry, fallback, and route-decision helpers off direct `os.environ` access.
- [ ] **Add focused Grove runtime tests**: prove the new execution-path contract with Layer-1 unit tests and cache/alias coverage where applicable.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/providers/registry.py` | Modify | Remove direct provider-registry env reads from the shared execution path |
| `packages/grove/src/grove/runtime/llm_calls.py` | Modify | Remove direct fallback-toggle env reads from the shared execution path |
| `packages/grove/src/grove/runtime/graph_route_decision.py` | Modify | Remove direct native Gemini route-decision env reads from the shared execution path |
| `packages/grove/src/grove/runtime/graph_routing.py` | Modify | Remove direct native Gemini route-decision helper env reads from the shared execution path hot path |
| `packages/grove/src/grove/tools/system/rest_connector.py` | Modify | Remove direct API-base-url env reads from the built-in REST connector system tool |
| `packages/grove/src/grove/config/` | Modify/Create | Add shared Layer-1 fragments/helpers that own these execution-path settings |
| `packages/grove/tests/unit/runtime/` | Modify/Create | Add focused runtime coverage for the centralized execution-path contract |

## Implementation Notes

- These modules are shared Layer-1 runtime surfaces, not API-only or worker-only helpers. Keep ownership in Layer 1 and let T02/T03 consume the shared fragments from their service-owned entrypoints instead of pushing a higher-layer singleton down into `packages/grove`.
- T02 and T03 still own caller/bootstrap proof in their respective service surfaces. T08 only centralizes the shared execution-path readers so those app slices are not built on top of hidden Layer-1 env reads.
- Native Gemini route-decision ownership includes the hot-path helpers in `grove.runtime.graph_routing`, not only the downstream decision module. M35 should not claim this contract is centralized while `should_use_native_gemini_route_decision()` still reads env directly.
- The built-in `CallRestConnectorTool` is registered automatically for each tool registry, so its API base URL env contract belongs here as shared Layer-1 tooling ownership rather than being implied as an API-only detail.
- Keep the migration explicit about local/e2e toggles such as mock responses and simulated provider failures; those are real runtime contracts, not test-only accidents.

## Acceptance Criteria

- [ ] Shared Grove execution-path env readers feeding executor/LLM flows are explicitly owned in Layer 1.
- [ ] `packages/grove/src/grove/providers/registry.py`, `packages/grove/src/grove/runtime/llm_calls.py`, `packages/grove/src/grove/runtime/graph_route_decision.py`, `packages/grove/src/grove/runtime/graph_routing.py`, and `packages/grove/src/grove/tools/system/rest_connector.py` no longer hide runtime env contracts behind ad hoc reads.
- [ ] Grove runtime tests cover the centralized execution-path contract and any alias/cache behavior introduced in this slice.

## Verification

```bash
uv run ruff check \
  packages/grove/src/grove/config \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/tools/system/rest_connector.py

uv run pyright \
  packages/grove/src/grove/config \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/tools/system/rest_connector.py

uv run pytest \
  packages/grove/tests/unit/runtime \
  -q --tb=short -k "provider or llm or route_decision or rest_connector or settings or alias"

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/tools/system/rest_connector.py
```

Review gate: the shared execution-path modules above should not remain as silent env readers once M35 is complete. If a reader intentionally survives, it must be named as explicit follow-on debt in the milestone and not implied to be centralized already.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
