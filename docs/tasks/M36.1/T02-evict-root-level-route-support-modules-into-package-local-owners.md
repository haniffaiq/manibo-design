# T02: Evict root-level route support modules into package-local owners

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Move the obvious non-router support modules out of route root and into explicit
package-local owners. This task cleans up the most misleading route-layer debt:
files that sit beside routers but are actually dependencies, runtime helpers,
presenters, or support seams.

## Subtasks

- [ ] **Move call-ops support**: relocate `call_access.py` and
      `call_takeover.py` into `routes/call_ops/` with explicit names.
- [ ] **Move shared observability support**: relocate
      `observability_channel_runtime_support.py`,
      `observability_enrichers.py`, and `span_correlation.py` into explicit
      package-local or shared HTTP owners.
- [ ] **Normalize telephony support naming**: remove the route-root
      `telephony_trunks_support.py` seam in favor of package-local ownership.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_access.py` | Modify/Delete | Move the root call-access seam into `call_ops` ownership or remove the old wrapper. |
| `apps/api/src/platform_api/routes/call_takeover.py` | Modify/Delete | Move the root takeover seam into `call_ops` ownership or remove the old wrapper. |
| `apps/api/src/platform_api/routes/span_correlation.py` | Modify/Delete | Move the root span helper into an explicit owner or remove the wrapper. |
| `apps/api/src/platform_api/routes/telephony_trunks_support.py` | Modify/Delete | Remove the route-root support seam in favor of package-local telephony ownership. |
| `apps/api/src/platform_api/routes/observability_channel_runtime_support.py` | Modify/Delete | Move into `observability` ownership or remove the wrapper. |
| `apps/api/src/platform_api/routes/observability_enrichers.py` | Modify/Delete | Move into `observability` ownership or remove the wrapper. |
| `apps/api/tests/...` | Modify | Update tests or monkeypatch seams that still import the root support modules. |

## Implementation Notes

- Prefer moving code to one explicit package-local owner over keeping route-root
  wrappers forever.
- If a root file still needs to survive temporarily as a shim, record the caller
  and the removal condition in `PROGRESS.md`.
- Do not bundle unrelated router decomposition into this task; this is the
  route-root eviction pass only.

## Acceptance Criteria

- [ ] The root support modules in the M36.1 scope are moved behind explicit
      package-local owners or documented temporary shims.
- [ ] `telephony_trunks_support.py` no longer exists as a route-root support
      module in its current form.
- [ ] Focused tests stay green with no API or import-surface drift.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on: [T01-define-and-enforce-platform-api-route-package-contract.md](T01-define-and-enforce-platform-api-route-package-contract.md)
