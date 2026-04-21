# T05: Move telephony routes into `routes/telephony`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Create the `routes/telephony` domain package and move the telephony route and support modules under it while preserving current imports. This task creates the stable topology seam for later telephony cleanup without changing route behavior or resource-management logic.

## Subtasks

- [ ] **Create `routes/telephony/`**: add a domain package for telephony route implementations and support modules.
- [ ] **Move telephony route implementations**: relocate `phone_numbers.py`, `telephony_numbers.py`, `telephony_policy.py`, `telephony_provider_accounts.py`, and `telephony_trunks.py`.
- [ ] **Move telephony support helpers with the domain**: relocate `telephony_trunks_support.py` under the same package so telephony internals stop leaking into the flat root.
- [ ] **Keep top-level compatibility shims**: preserve the current flat import paths by turning the original files into thin re-export shims.
- [ ] **Retain telephony route proof**: keep or add focused tests for route mounting and trunk/provider wiring after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/telephony/` | Create | Domain package for telephony route/support implementations |
| `apps/api/src/platform_api/routes/phone_numbers.py` | Modify | Compatibility shim to `routes.telephony.phone_numbers` |
| `apps/api/src/platform_api/routes/telephony_numbers.py` | Modify | Compatibility shim to `routes.telephony.telephony_numbers` |
| `apps/api/src/platform_api/routes/telephony_policy.py` | Modify | Compatibility shim to `routes.telephony.telephony_policy` |
| `apps/api/src/platform_api/routes/telephony_provider_accounts.py` | Modify | Compatibility shim to `routes.telephony.telephony_provider_accounts` |
| `apps/api/src/platform_api/routes/telephony_trunks.py` | Modify | Compatibility shim to `routes.telephony.telephony_trunks` |
| `apps/api/src/platform_api/routes/telephony_trunks_support.py` | Modify | Compatibility shim to `routes.telephony.telephony_trunks_support` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve telephony factory imports and mounting behavior |
| `apps/api/tests/` | Modify/Create | Focused route-wiring coverage for telephony surfaces |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- Keep the support helper with the telephony package. Leaving `telephony_trunks_support.py` flat would keep the topology smell alive.
- Do not change provider-account or trunk semantics here. This is not the DRY pass.
- Preserve any module-level exports that current tests or callers import directly.

## Acceptance Criteria

- [ ] All telephony route/support modules live under `routes/telephony/`.
- [ ] The old flat telephony module names remain as thin shims so current imports still resolve.
- [ ] Telephony route mounting behavior remains unchanged after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/telephony \
  apps/api/src/platform_api/routes/phone_numbers.py \
  apps/api/src/platform_api/routes/telephony_numbers.py \
  apps/api/src/platform_api/routes/telephony_policy.py \
  apps/api/src/platform_api/routes/telephony_provider_accounts.py \
  apps/api/src/platform_api/routes/telephony_trunks.py \
  apps/api/src/platform_api/routes/telephony_trunks_support.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/telephony \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests \
  -q --tb=short -k "telephony or trunk or provider_account or phone_channels"
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
