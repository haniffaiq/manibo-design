# M13: Multi-Provider Telephony Resource Management

Status: in progress
Created: 2026-04-01
Owner: Jakit
Branch: feat/M13-telephony-management
Stream: platform
Depends on: M31 (done)
Reference: `docs/tasks/M13/PROGRESS.md`; `docs/tasks/M13/T01-telephony-domain-model.md`; `docs/tasks/M13/T02-provider-account-control-plane.md`; `docs/tasks/M13/T03-provider-pack-contract.md`; `docs/tasks/M13/T04-trunk-inventory-sync-api.md`; `docs/tasks/M13/T05-number-inventory-provisioning-api.md`; `docs/tasks/M13/T11-local-real-call-profile-and-pstn-proof.md`; `wiki/ops/phone-number-onboarding.md`; `wiki/ops/inbound-voice-routing.md`; `wiki/ops/voice-call-local-demo.md`

Activation state: active as of 2026-04-03 by explicit human instruction. T01-T09 are complete on this milestone branch. The milestone now includes deployment-aware provider-pack discovery through `/admin/telephony/provider-options`, persisted deployment-admin trunk and number inventory surfaces through `/admin/telephony/trunks`, `/admin/telephony/numbers`, `/admin/telephony/provider-accounts/{id}/numbers/search`, `/admin/telephony/provider-accounts/{id}/numbers/acquire`, governed binding-backed DID routing, deployment-admin tenant telephony policy reads plus updates through `/admin/tenants/{tenant_id}/telephony/policy`, the first operator-facing `/admin/telephony` workspace for deployment-managed providers plus number assignment, and the assistant-side `Attach existing number` flow that reads from the same telephony inventory while keeping healthy transport details hidden from the assistant page. Tenant/BYO telephony control-plane routes are mounted in this milestone, but they remain API-only in-repo until a dedicated tenant-facing surface exists. T11 now has a verified outbound local-real-call proof (`call_id=<redacted-outbound-call-id>`); M13 is still not accepted as done until the inbound half of that proof exists too.
On 2026-04-12 the milestone also gained an explicit simplification follow-on backlog: unify routing readiness into one derived contract, remove operator-facing trunk archive/reconcile lifecycle, collapse default operator health to `Ready` / `Needs attention`, keep provider sync as the only explicit maintenance action, and move bootstrap/LiveKit/trunk repair behind internal automation or diagnostics-only seams.

## Goal

Replace env- and script-managed telephony resource state with a real product control plane that supports multiple providers from day one. The system must treat provider accounts, trunks, numbers, and number-to-assistant bindings as first-class persisted resources, with Telnyx and Genesys both supported behind the same operator-facing UI. LiveKit remains the media/SIP runtime boundary, while the platform owns inventory, governance, mapping, and capability-aware provider workflows.

The current state is acceptable for a demo and weak for a real channel product. Phone numbers and trunk IDs are still treated like deployment config, provider differences are hidden behind manual ops, and the UI only edits `public.phone_numbers`. That is not multi-provider telephony management; it is a thin routing editor.

## Current Model

```text
+-------------------------+      +-------------------------+      +------------------------+
| Ops scripts / .env      | ---> | public.phone_numbers    | ---> | DID lookup             |
| TELNYX_PHONE_NUMBER     |      | phone + trunk + agent   |      | phone_number + active  |
| LIVEKIT_*_TRUNK_ID      |      | manual row management   |      | governed agent target  |
+-------------------------+      +-------------------------+      +------------------------+
```

### Why this is weak

- Phone numbers are treated like deployment config instead of persisted inventory.
- The UI cannot list provider-owned numbers or trunks.
- Telnyx and Genesys have different capability shapes, but the product currently pretends there is one generic "trunk field".
- Operators still need hidden resource IDs from ops instead of a self-service control plane.

## Target System

```text
+------------------------+      +----------------------+      +----------------------+
| Provider accounts      | ---> | Trunks / routes      | ---> | Phone numbers        |
| Telnyx, Genesys, ...   |      | provider + LiveKit   |      | synced/imported      |
+------------------------+      +----------------------+      +----------------------+
           |                              |                              |
           +------------------------------+------------------------------+
                                          |
                                          v
                              +---------------------------+
                              | Number-to-assistant       |
                              | binding (tenant-scoped)   |
                              +---------------------------+
                                          |
                                          v
                              +---------------------------+
                              | Inbound DID routing       |
                              | fail-closed governed      |
                              +---------------------------+
```

## Design Decisions

1. **Provider resources are first-class persisted state**
   Phone numbers, trunks, provider accounts, and provider-side resource identifiers move out of env-driven operator workflows and into persisted control-plane records. Server-side credentials still exist, but as secret references or encrypted provider-account credentials, not as the operator-facing source of truth.

2. **Platform Core owns the telephony control plane; provider packs own provider-specific behavior**
   Layer 2 owns generic telephony models, orchestration contracts, routing invariants, and admin APIs. Layer 3 provider packs implement Telnyx- and Genesys-specific provisioning, sync, validation, and reconciliation behavior. This keeps multi-provider logic honest instead of turning `platform-core` into a pile of provider if-else statements.

3. **Capability-aware provider model, not fake parity**
   Providers do not expose the same features. Telnyx can support number search/order plus SIP credential provisioning. Genesys is more likely import/sync plus route/trunk management without platform-led number purchase. The UI and API must expose capability flags so unsupported actions never appear as normal CTAs.

4. **Provider account ownership is explicit**
   A provider account may be:
   - deployment-managed default telephony shared to eligible tenants
   - tenant-owned BYO telephony account
   Ownership and sharing policy must be modeled explicitly so a default Telnyx account and a tenant BYO Genesys account can coexist in one deployment without ambiguity.
   T07 implements that policy as persisted tenant state with three modes: `default_only`, `default_with_byo_override`, and `byo_only`.

5. **Trunks/routes, numbers, and assistant bindings are separate resources**
   A trunk is not a phone number. A number is not an assistant binding. The data model must separate:
   - provider account
   - trunk/route transport resources
   - number inventory
   - tenant-scoped number binding to a published `agent_definition_id`
   T01 keeps the new resource model clean-slate. Any future cutover from `public.phone_numbers` has to be designed explicitly later instead of being smuggled in as a half-built compatibility seam now.

6. **LiveKit remains the telephony runtime boundary**
   Providers never route directly to assistants. Provider packs provision or synchronize provider-side resources and their LiveKit bindings. LiveKit remains authoritative for SIP ingress/egress and media transport. This preserves the existing voice runtime boundary instead of creating provider-specific runtime forks.

7. **Governed inbound routing stays fail-closed**
   Number-to-assistant binding continues to route only through a published governed `agent_definition_id`. Multi-provider management does not weaken the existing invariant that inbound dispatch must fail closed when a number is not bound to a valid published assistant.

8. **UI starts with one telephony workspace plus assistant attach flow**
   The first usable product surface is intentionally small:
   - `/admin/telephony` for provider connection, number refresh/import, and number-to-assistant assignment
   - assistant detail `Channels` section for "attach existing number"
   Dedicated trunks/routes and routing exception surfaces are deferred until real operator usage proves they are needed.

9. **Refresh numbers, not fake real-time truth**
   Provider inventory is refreshed explicitly from providers. The product should not pretend local number inventory is always instantly correct.

10. **M13 owns telephony resource management, not every telephony feature**
    This milestone covers provider accounts, trunks, numbers, and routing self-service. Voicemail, queueing, IVR, and advanced call-distribution policy are explicitly deferred until the resource-management substrate exists and works.

11. **Progressive disclosure is a hard UI rule**
    The default operator view shows only what is required to complete the job:
   - provider connection state
   - synced number inventory
   - current assistant binding
   - actionable status
   Internal transport identifiers, provider-specific route objects, and LiveKit binding details stay hidden unless:
   - a flow explicitly requires them,
   - or the system is in an error/degraded state and the operator must repair it.

12. **Telephony tables must reuse the existing admin DataTable pattern**
    The providers and numbers views must match the interaction and chrome used by deployment admin tables such as `Tenants` and `Staff access`:
   - `Card` container
   - `DataTable` with fixed layout
   - border-bottom toolbar row
   - search field in the toolbar
   - optional add/setup button on the toolbar right side
   Telephony does not get a custom table layout language.

13. **M13 closes only when real inbound and outbound calls are proven from a developer-laptop local-real-call profile**
    k3d-only wiring validation is not enough. Acceptable milestone-close proof uses a developer laptop as the local platform runtime (`platform-api`, workers, DB, admin UI) while LiveKit Server plus LiveKit SIP run on the laptop host or host-networked containers with a real public SIP/media endpoint. The final proof must demonstrate both inbound PSTN -> bound agent answer and outbound operator-triggered PSTN -> Demo Agent speech.

## Simplification follow-on

The control-plane substrate stays, but the operator product contract narrows:

```text
Provider sync
    |
    v
Local trunks / numbers / bindings
    |
    +--> shared derived readiness contract
    +--> internal automation / diagnostics
    |
    v
Operator UI
    - Providers
    - Numbers
    - Assign / pause
    - Ready / Needs attention
```

This follow-on is intentionally strict:

1. `routing_status` must become derived or compatibility-only, never authoritative.
2. Inbound DID lookup, observability, and UI must share one readiness rule.
3. Trunk archive and reconcile are not operator product actions.
4. Provider sync stays as the only explicit maintenance action for operators.
5. Bootstrap/livekit/trunk repair move behind automation or admin-only diagnostics.

## Minimal UI Slice

```text
/admin/telephony
  ├─ Providers tab
  |   - connect / reconnect provider
  |   - Refresh numbers
  |   - simple status + capability summary
  └─ Numbers tab
      - number inventory
      - assigned assistant
      - live / unassigned status
      - row click opens editor

/admin/agent-definitions/[id]
  └─ Channels
      - show attached phone numbers
      - "Attach existing number"
```

The `Providers` and `Numbers` tabs use the same admin table structure as the existing `Tenants` and `Users` pages: toolbar on top, searchable fixed-layout table, row click opens detail.

### Progressive-disclosure rules

1. Do not show trunk IDs, LiveKit binding IDs, dispatch rules, or provider resource IDs in the default list views.
2. Do not create a dedicated trunks page in the first UI slice.
3. Do not create a dedicated routing exceptions page in the first UI slice.
4. When a number is healthy, show only:
   - number
   - provider
   - assigned assistant
   - live/unassigned status
5. When a number is broken, reveal only the missing next action, not the full transport model dump.
6. Assistant pages only attach existing numbers. They do not become telephony admin consoles.
7. The numbers table has no action column in the first slice. Rows are clickable and open the detail/editor.

## Domain Model

```text
+-----------------------------+
| telephony_provider_accounts |
| id                          |
| owner_scope                 |  deployment | tenant
| owner_id                    |
| provider_kind               |  telnyx | genesys | ...
| display_name                |
| credential_ref              |
| status                      |
| capability_snapshot         |
+-----------------------------+
               |
               v
+-----------------------------+
| telephony_trunks            |
| id                          |
| provider_account_id         |
| direction                   |  inbound | outbound | bidirectional
| provider_resource_id        |
| livekit_binding_id          |
| status                      |
| config                      |
+-----------------------------+
               |
               v
+-----------------------------+
| telephony_numbers           |
| id                          |
| provider_account_id         |
| trunk_id                    |
| e164_number                 |
| provider_number_id          |
| status                      |
| source                      |  purchased | imported | ported
+-----------------------------+
               |
               v
+-----------------------------+
| phone_number_bindings       |
| id                          |
| tenant_id                   |
| telephony_number_id         |
| agent_definition_id         |
| active                      |
| routing_status              |
+-----------------------------+
```

## Provider Capability Model

| Capability | Telnyx | Genesys | Notes |
| --- | --- | --- | --- |
| Connect provider account in product | yes | yes | Different auth/setup flows behind one contract |
| Sync/import trunks/routes | yes | yes | Genesys may be import/reconcile rather than full create |
| Sync/import number inventory | yes | yes | Import path required even if provider API is partial |
| Buy/order numbers in product | yes | no / maybe later | Capability-gated UI, never fake parity |
| BYO SIP trunk to LiveKit | yes | yes | Both providers can route through LiveKit |
| Assign number to published assistant | yes | yes | Same governed binding contract |

Later extension note: Telnyx should grow into direct in-product number search/order because its API is strong enough for it. The minimal first UI does not need that on day one.

## Tasks

### Task Execution Contract

Every M13 task closes only when it has:

1. one dedicated task commit on the milestone branch
2. one dedicated local PR review run against that task state

The local review requirement is not optional bookkeeping. Before pushing a task completion commit, run `tools/scripts/run_local_pr_review.sh origin/main post_ci` against the worktree state for that task and address any blocking findings. If the task changes review-harness or merge-gate behavior, run the `pre_ci` lane too.

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Telephony domain model + migration envelope | done | none |
| T02 | Provider account control plane + secret references | done | T01 |
| T03 | Provider-pack contract + capability matrix (Telnyx, Genesys) | done | T01 |
| T04 | Trunk and route inventory APIs + reconciliation | done | T02, T03 |
| T05 | Number inventory and acquisition/import APIs | done | T02, T03, T04 |
| T06 | Governed number-binding refactor + DID invariant preservation | done | T01, T04, T05 |
| T07 | Deployment-default telephony and tenant BYO policy model | done | T02, T03 |
| T08 | Minimal telephony workspace: providers + numbers | done | T02, T05, T06, T07 |
| T09 | Assistant attach flow + progressive disclosure guardrails | done | T08 |
| T10 | Verification, runbooks, and proof harness for multi-provider telephony | not started | T01-T09 |
| T11 | Local real-call profile + inbound/outbound PSTN proof | in progress | T01-T10 |
| T12 | Telnyx carrier events in observability evidence rail | done | T04, T05, T06, T11 |
| T13 | Runtime settings centralization follow-on | parked future note | none |
| T14 | Shared routing readiness contract | not started | T06 |
| T15 | Derived readiness reader convergence | not started | T14 |
| T16 | Binding model derived-status cleanup | not started | T15 |
| T17 | Sync-owned trunk lifecycle | not started | T04, T14 |
| T18 | Operator telephony workspace simplification | not started | T16, T17, T08, T09 |
| T19 | Internal telephony automation and diagnostics boundary | not started | T17 |
| T20 | Realtime turn provider retry + Grove tool activity boundary | done | T11 |

## Acceptance Criteria

- [ ] Operators can connect and manage multiple telephony providers in product UI without relying on per-number env values.
- [ ] The system supports both deployment-managed default telephony and tenant BYO provider accounts.
- [ ] Trunks/routes are persisted as first-class resources in the backend model, but the first operator UI slice does not expose them as a dedicated page.
- [ ] Phone numbers are persisted as inventory and can be imported/synced from at least Telnyx and Genesys-capable flows.
- [ ] Number-to-assistant assignment remains governed and fail-closed for inbound routing.
- [ ] Routing readiness is derived from real state and reused consistently by inbound DID lookup, observability, and operator UI.
- [ ] Provider-specific actions are capability-gated; unsupported actions do not render as normal available UI.
- [ ] The design removes `TELNYX_PHONE_NUMBER`, `LIVEKIT_SIP_*_TRUNK_ID`, `LIVEKIT_SIP_DISPATCH_RULE_ID`, `TELNYX_CONNECTION_ID`, and `NEXT_PUBLIC_DEFAULT_SIP_TRUNK_ID` from the operator workflow contract. Server-side credentials may still exist as secret-backed config.
- [ ] Default operator telephony surfaces expose providers, numbers, assignment/pause, and `Ready` / `Needs attention`, without archive/reconcile/bootstrap repair as primary UI concepts.
- [ ] Telnyx and Genesys are both first-class providers in the architecture from the beginning.
- [ ] The first operator-facing UI slice is intentionally minimal: providers tab, numbers tab, and assistant attach flow only.
- [ ] Progressive disclosure rules explicitly prevent trunk/route/internal-ID clutter from leaking into default UI states.
- [ ] The first operator-facing numbers table uses only `Live` and `Unassigned` statuses.
- [ ] API inventory and ops runbooks are updated to describe the new telephony control plane.
- [ ] Full proof includes scoped backend tests, full `apps/web` UI verification, MCP browser proof on desktop/mobile, and updated ops evidence.
- [ ] M13 includes a supported local-real-call profile where `platform-api`, workers, DB, and admin UI stay local while LiveKit Server plus LiveKit SIP run on the laptop host or host-networked containers with a public SIP/media endpoint.
- [ ] Milestone-close proof includes inbound PSTN -> bound number -> agent answer and outbound operator test call -> phone rings -> Demo Agent speaks using the new telephony inventory rather than ad-hoc env-managed routes.

Current proof state:
- outbound PSTN proof is done via operator test call `<redacted-outbound-call-id>`
- inbound PSTN proof is still open

## Verification

```bash
uv run pytest apps/api/tests/ -k telephony --tb=short
uv run pytest packages/platform-core/tests/ -k telephony --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web playwright:test
tools/scripts/e2e/run-web-e2e.sh
uv run python tools/scripts/generate_api_inventory.py
uv run python tools/scripts/check_api_inventory.py
```

Observable milestone-close proof also requires:

- inbound PSTN call to a bound number reaches a published agent through the local-real-call profile
- outbound operator test-call flow rings a real phone and the Demo Agent speaks through the same profile

Desktop/mobile MCP proof is required for:

- provider account onboarding
- number inventory and assignment flows
- assistant channel assignment flows

## Related Future Work

- T13 is a planning-only follow-on request created from the M13 runtime-debugging pain. It does not block inbound/outbound PSTN proof or milestone acceptance.
- The goal is one typed runtime settings contract using Pydantic Settings so telephony, worker, and API runtimes stop reading environment variables ad hoc across many files.
- The trigger is real operational drift from T11/T12: local-real-call debugging had to chase inconsistent values across `platform-api`, `platform-temporal-worker`, `agent-worker`, bootstrap scripts, and local overlay secrets.

## Non-Goals

- No voicemail, callback, queueing, IVR, or advanced call-distribution logic in this milestone.
- No replacement of LiveKit as the voice/media runtime boundary.
- No fake "universal provider" abstraction that hides provider capability differences.
- No secrets in browser-exposed env vars.
- No customer-specific telephony forks outside the provider-pack model.
