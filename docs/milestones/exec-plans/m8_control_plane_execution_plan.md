# Execution Plan: M8 Voice Control Plane

> **Status:** Planning
> **Created:** 2026-03-26
> **Owner:** Jakit
> **Track:** V2 Phase 2

## 1. Goal

Freeze one honest implementation plan for the M8 control-plane rewrite before any Phase 2 coding starts. This plan exists so the milestone/task docs are not hand-wavy backlog theater.

## 2. Why This Exists

Current repo reality is mixed:

- live transcript SSE already exists
- live ops SSE already exists
- operator takeover exists
- persisted runtime events and replay rails already exist
- the platform does **not** yet have one canonical typed realtime contract
- the platform does **not** yet persist operator commands before dispatch

That means M8 is not a greenfield feature. It is a contract-convergence and transport-coherence lane.

## 3. Planning Gate

M8 remains planning-only until both are true:

1. the active priority tracker explicitly activates V2 Phase 2 work
2. clinic/operator continuity on the current `/call-ops`, `/call-ops/history`, and `/observability` surfaces is no longer the higher-priority last-mile lane

Until then, this plan is the durable source of truth for scope, not an implementation green light.

## 4. Exact Scope

### In Scope

- canonical control-plane event envelope
- durable command record for manual takeover
- mapping current persisted runtime rails onto the canonical envelope
- operator-event/control-plane alert projections that share the same voice runtime contract
- authenticated tenant-scoped WebSocket transport
- scope enforcement for tenant plus the existing admin/deployment read-model consumers of the same voice control-plane events
- SSE parity bridge during migration
- shared web realtime client
- migration of live call-ops, observability, alerts, and history-contract consumers affected by the shared event contract
- explicit replay/cursor semantics

### Out of Scope

- adaptive interruption / LiveKit runtime migration
- alert-queue redesign beyond preserving current operator-event continuity
- new clinic handoff UX
- historical search UI redesign
- broad multi-topic deployment-admin transport beyond the existing voice read-model surfaces
- generic command bus for every future operator action

## 5. Contract Freeze

### Event model

Canonical envelope v1 must carry:

- `envelope_id`
- `tenant_id`
- `scope`
- `topic`
- `event_type`
- `seq`
- `occurred_at`
- `correlation_id`
- `causation_id`
- `payload_schema_version`
- `payload`

The first concrete mappings are:

- transcript segment events
- persisted call runtime events
- manual takeover lifecycle events
- operator-event/control-plane alert projections needed by current `/call-ops/alerts` continuity

### Command model

The first durable command domain is manual takeover only.

Required fields:

- `command_id`
- `tenant_id`
- `call_id`
- `command_type`
- `actor_user_id`
- `status`
- `received_at`
- `authorized_at`
- `completed_at`
- `correlation_id`
- `causation_id`
- `error_code`
- `error_detail`

Lifecycle states for v1:

- `received`
- `authorized`
- `rejected`
- `executing`
- `completed`
- `failed`

Urgent terminate/transfer stays out until a checklist row owns it.

### Persistence model

- reuse existing persisted call runtime rails where possible
- do **not** create a second fake control plane beside `call_runtime_events`
- add durable command rows in the tenant call-state lane
- replay remains sequence/cursor based

### Transport model

- WebSocket is the future primary transport
- SSE remains the migration bridge
- both transports must project the same canonical envelope semantics

## 6. Migration Path

1. Define canonical envelope types
2. Add durable takeover command record
3. Map existing SSE/runtime rails onto canonical envelopes
4. Add authenticated WebSocket endpoint
5. Keep SSE parity bridge
6. Migrate one live consumer path first
7. Migrate remaining live consumers
8. Prove no regression across live + history-contract surfaces

## 7. Proof Requirements

Minimum proof before M8 can be marked done:

- transcript stream regression proof
- call-ops live stream regression proof
- operator-alert/control-plane projection regression proof
- call history regression proof for the shared event contract surface
- observability live regression proof
- concrete WebSocket contract/integration proof
- API inventory regenerated and checked if HTTP/SSE routes or ownership changed
- full web E2E suite if `apps/web/**` changed
- OTLP evidence in the PR body for any `src/**` changes

## 8. Task Mapping

- `T01` canonical envelope types
- `T02` durable takeover command record
- `T03` runtime rail mapping + replay semantics
- `T04` authenticated WebSocket endpoint
- `T05` SSE parity bridge
- `T06` one migrated consumer path
- `T07` remaining live consumers + alerts/history-contract continuity
- `T08` final proof / rollout bridge

## 9. Exit Criteria

M8 is done only when:

- live call-ops no longer depends on fragmented route-local realtime wiring
- transcript, takeover, operator-alert, observability, and history-contract flows still work
- command durability is real, not implied by audit logs
- the milestone/progress docs show exact proof commands and exact residual risk
