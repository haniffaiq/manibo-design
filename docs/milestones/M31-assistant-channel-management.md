# M31: Assistant-Centric Channel Management

Status: done
Created: 2026-03-28
Owner: Jakit
Branch: feat/M31-assistant-channels
Stream: platform
Depends on: M28 (done)
Reference: `apps/web/src/app/(deployment)/admin/channels/page.tsx`, `apps/web/src/app/(deployment)/admin/telephony/page.tsx`, `apps/api/src/platform_api/routes/phone_numbers.py`

## Goal

Replace the infrastructure-first "Phone Routing" page with assistant-centric channel management. Channels (phone, web chat, WhatsApp) are a property of the assistant — you go to the assistant, add a channel, and it's live. The current model forces admins to think about phone numbers as standalone infrastructure objects, then link them to assistants. That's backwards.

## Current Model (infrastructure-first)

```
Phone Routing page
  └─ Phone number (+37060000001)
       └─ Assigned to: clinic_registrator
       └─ SIP trunk: trunk-main
       └─ Status: active
```

The admin manages phone numbers, then assigns assistants. Channels are not a concept — only phone numbers exist. Web chat and WhatsApp don't fit this model at all.

## Target Model (assistant-first)

```
Assistant: clinic_registrator
  └─ Channels tab
       ├─ Phone: +37060000001 (live) — trunk-main
       ├─ Phone: +37061234567 (paused) — trunk-main
       ├─ Web Chat: widget_abc123 (live)
       └─ WhatsApp: +37060000001 (planned)
```

Channels belong to the assistant. Each channel type has its own config. The assistant detail page is the single place to manage everything about that assistant: config, versions, test calls, and channels.

## Design Decisions

### 1. Channels section on assistant detail page

The assistant detail page gains a "Channels" section below the version table. This always-visible card shows all channels for the assistant and lets you add/remove/pause them. A section (not a tab) keeps channels visible alongside version management without navigation overhead.

### 2. Phase 1: phone channels only, backed by governed telephony

The original milestone reused the existing phone-number API to land assistant-centric channels quickly. That decision was later superseded by M13 governed telephony inventory, where assistant channels read/write `telephony_numbers` plus `phone_number_bindings` only. Legacy `public.phone_numbers` rows are no longer part of the active assistant-channel surface.

### 3. Channel abstraction in the UI layer

```typescript
type ChannelType = "phone" | "web_chat" | "whatsapp";

interface AssistantChannel {
  id: string;
  type: ChannelType;
  label: string;           // "+37060000001" or "widget_abc123"
  status: "live" | "paused" | "setup";
  config: PhoneChannelConfig | WebChatChannelConfig | WhatsAppChannelConfig;
  created_at: string;
}

interface PhoneChannelConfig {
  phone_number: string;    // E.164
  sip_trunk_id: string;
}

interface WebChatChannelConfig {
  widget_id: string;
  origin_allowlist: string[];
}

interface WhatsAppChannelConfig {
  business_number: string;
  provider: string;
}
```

Phase 1 only implements `PhoneChannelConfig`. The type union is designed for extension.

### 4. Hide Phone Routing from sidebar

Replace "Phone Routing" with nothing — channel management lives inside each assistant. The standalone page is `/admin/channels`.

### 5. "Add channel" flow

```
[Add channel] button
  → Pick type: Phone | Web Chat (coming soon) | WhatsApp (coming soon)
  → Phone form:
      Phone number: [+37060000001]
      SIP trunk ID: [ST_xxxxx] (pre-filled from NEXT_PUBLIC_DEFAULT_SIP_TRUNK_ID)
      Start live: [checkbox]
  → [Connect]
```

### 6. Sidebar section rename

"Assistants & Rollouts" → "Assistants" (since Releases is already hidden).

### 7. SIP trunk default (deployment-level)

The SIP trunk ID is pre-filled from `NEXT_PUBLIC_DEFAULT_SIP_TRUNK_ID` env var. Most deployments use a single trunk for all tenants (the trunk is a shared transport pipe; phone number ownership determines tenant routing). Admins can override per phone number if the deployment has multiple trunks.

Tenant-scoped trunk management (`tenant_sip_trunks` table with dropdown selector) is deferred to a future phase. See `wiki/ops/phone-number-onboarding.md` for the full onboarding workflow.

### 8. Backend DELETE endpoint

Added `DELETE /admin/tenants/{tenant_id}/phone-channels/{phone_channel_id}` to support removing phone channels. The DELETE endpoint includes audit logging.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Add Channels tab to assistant detail page | done | none |
| T02 | Query phone numbers by agent_definition_id for channel list | done | T01 |
| T03 | Add phone channel form (create/pause/activate/remove) | done | T02 |
| T04 | Hide Phone Routing from sidebar, rename section to "Assistants" | done | T01 |
| T05 | Add channel type selector with "coming soon" for web chat and WhatsApp | done | T03 |
| T06 | Verification: channel management flow end-to-end | done | T01-T05 |

## Acceptance Criteria

- [x] Assistant detail page has a "Channels" tab showing connected phone numbers.
- [x] "Add channel" lets admins connect a phone number to the assistant.
- [x] Phone channels can be paused and reactivated from the Channels tab.
- [x] Phone Routing is hidden from the sidebar.
- [x] Web Chat and WhatsApp show as "coming soon" in the channel type selector.
- [x] Assistant channels ship on the phone-number API of the time; later milestones may migrate the backing store without changing the assistant-centric UX.
- [x] The standalone `/admin/channels` page is canonical.

## Verification

```bash
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
```

## Non-Goals

- No web chat widget implementation (just "coming soon" placeholder).
- No WhatsApp integration (just "coming soon" placeholder).
- No direct migration work was included in this milestone itself; later telephony milestones may change the backing store.
- No multi-assistant channel sharing (one channel = one assistant).
- No automatic phone number provisioning from Telnyx API.
- No tenant-scoped SIP trunk management UI (admin types trunk ID or uses deployment default).

## Future Phases

| Phase | Scope |
|-------|-------|
| Phase 1 (this milestone) | Phone channels via governed telephony inventory, Channels tab, hide Phone Routing, default trunk |
| Phase 1.5 | Tenant SIP trunk registry (`tenant_sip_trunks` table, dropdown selector in channels form) |
| Phase 2 | Web chat widget: auto-generated widget ID, embeddable snippet, origin allowlist |
| Phase 3 | WhatsApp Business: provider setup, template messages, inbound routing |
| Phase 4 | Deprecate standalone Phone Routing page, migrate all phone management to assistant channels |
