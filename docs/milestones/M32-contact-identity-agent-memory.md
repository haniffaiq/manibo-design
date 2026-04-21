# M32: Contact Identity & Agent Memory

Status: not started
Created: 2026-03-28
Owner: Jakit
Branch: feat/M32-contact-identity-agent-memory
Stream: platform
Depends on: none (can start independently; M31 is orthogonal)
Reference: wiki/architecture/architecture.md §6.5 (Guest Identity), §10.3 (Channel Runtime), §10.4 (Public Ingress); wiki/architecture/grove.md §Layer 6 (Backends)

## Goal

Give agents the ability to recognize the same person across conversations, channels, and agents — and to recall relevant context from prior interactions. Today every conversation starts from zero: the agent has no knowledge of past calls, chats, or interactions with the same person. This milestone introduces a contact identity model in Platform Core and cross-session context tools in Grove, enabling agents to build continuity across channels and over time.

## Problem Statement

### Current state

- `grove.chats` stores conversations per-session. Each conversation is isolated.
- `grove.chats.channel` tracks origin (voice/chat/email) but there is no link between conversations from the same person.
- Voice calls identify callers by phone number (DID lookup), but the phone number is not linked to any persistent contact record.
- Web chat identifies users by guest session (anonymous UUID). No linking to phone or email.
- Solutions query external systems (Varutis HIS, CRM) for identity — but the platform itself has no contact concept.
- When the same patient calls the consultation agent Monday and the diagnostics agent Wednesday, the diagnostics agent has zero context about Monday's call.
- When a VOX lead chats on the website and later receives a follow-up call, the voice agent has zero context about the chat conversation.

### Why this matters

Both deployed clients need cross-interaction continuity:

**Affidea** — Multi-step caller authentication (phone → name → personal code) resolves a Varutis patient ID. Multiple agents (consultations, diagnostics, lab, reminders) serve the same patient pool. Without a contact model, each agent starts authentication from scratch and has no access to prior interaction summaries.

**VOX** — Website Sales Agent captures lead data (name, email, phone, goals). Follow-Up Agent should know what WSA discussed. Voice Sales Agent should reference the chat conversation. Without a contact model, each agent operates in isolation despite serving the same lead.

## Requirements

### REQ-M32-01: Contact Record (Platform Core)

The platform shall maintain a contact identity record per organization, linking a person's known identifiers (phone numbers, email addresses, external system IDs) into a single contact.

- Contact records are organization-scoped (tenant isolation).
- A contact may have multiple phone numbers and multiple email addresses.
- A contact may have external IDs (e.g., Varutis patient ID, CRM lead ID) keyed by system name.
- Contact records are created automatically when identity is resolved during a conversation (e.g., caller authentication, lead capture, guest session identification).
- Contact records can be merged when two previously-separate contacts are discovered to be the same person.
- Contact deduplication is best-effort, not guaranteed — false negatives (two records for one person) are acceptable; false positives (one record for two people) are not.

### REQ-M32-02: Conversation-Contact Linking

The platform shall link conversations to contacts when identity is resolved.

- `grove.chats` gains a `contact_id` field (nullable UUID).
- When a contact is identified during a conversation (via authentication tool, lead capture, or manual linking), the conversation is linked to the contact.
- Contact linking is retroactive: if a guest session is later identified, the existing conversation is updated with the contact_id.
- All conversations for a contact are queryable regardless of channel or agent.

### REQ-M32-03: Contact Resolution

The platform shall resolve contact identity from channel-specific identifiers.

- Phone channel: resolve by caller phone number (E.164 match against contact phone numbers).
- Web chat channel: resolve by authenticated user email, or by explicit identification during conversation.
- Email channel: resolve by sender email address.
- Resolution is optional — anonymous/unidentified conversations remain valid with null contact_id.
- Resolution produces a `contact_id` that is injected into the agent's tool context.

### REQ-M32-04: Cross-Session Context Tool (Grove)

Grove shall provide a tool that allows agents to retrieve context from prior interactions with the same contact.

- Tool: `recall_interactions` — given a contact_id, returns summaries of past conversations (agent name, channel, timestamp, outcome, extracted data).
- Tool: `save_note` — given a contact_id, persists a free-text note or structured observation about the contact.
- Tools are Grove-level (available to any project using Grove), not solution-specific.
- The agent decides when to recall and what to save — no automatic injection of full history into every prompt.
- Recall results are paginated and filtered by recency (most recent N interactions).

### REQ-M32-05: Contact Notes

The platform shall persist structured notes about contacts that agents and operators can create and retrieve.

- Notes are organization-scoped and linked to a contact_id.
- Notes have: author (agent_name or user_id), timestamp, content (text), optional category/tags.
- Notes persist across conversations and channels.
- Notes are retrievable via the `recall_interactions` tool and via API for operator dashboards.

### REQ-M32-06: Privacy and Data Lifecycle

- Contact records follow the same retention and deletion policies as other organization-scoped data.
- On organization offboarding, all contact records and notes are deleted.
- Contact data is included in data export operations.
- Contact PII (phone numbers, emails, names) follows the same encryption-at-rest standards as other tenant data.

## Design Decisions

### 1. Contact model lives in Platform Core, tools live in Grove

Platform Core (Layer 2) owns the `contacts` table, resolution logic, and API endpoints. Grove (Layer 1) owns the tool protocols (`recall_interactions`, `save_note`) and the `contact_id` field on `grove.chats`. This follows the existing pattern where Grove owns the `ConversationStore` protocol and platform provides the postgres implementation.

### 2. Contact resolution is channel-adapter-initiated, not automatic middleware

When a channel adapter resolves a user (e.g., DID lookup returns a phone number), it passes the identifier to the contact resolution service. The service returns a `contact_id` or creates a new contact. This is explicit, not hidden middleware — the adapter decides when to resolve.

### 3. Tool-based recall, not automatic context injection

Agents use `recall_interactions` to explicitly retrieve past context. We do NOT automatically inject full conversation history into every prompt. Reasons: context window budget, relevance filtering, agent autonomy. The agent decides when context from prior interactions is useful.

### 4. Notes over embeddings for V1

V1 uses structured notes (text + metadata) rather than vector embeddings or RAG over past conversations. Notes are simple, queryable, and debuggable. Vector-based semantic memory is a future optimization, not a V1 requirement.

### 5. Solutions provide domain-specific contact enrichment

The platform provides the contact record (identifiers + notes). Solutions enrich the contact with domain-specific data via their own tools. Example: `patient_auth` solution looks up Varutis patient details by contact phone number. `lead_capture` solution stores lead qualification data. The platform does not try to be a CRM.

### 6. External system IDs enable solution-level joins

Contact records store `external_ids` as a key-value map (e.g., `{"varutis": "PAT-12345", "hubspot": "HS-67890"}`). Solutions use these to join platform contacts with external system records without the platform needing to understand external schemas.

### 7. Merge over deduplicate

When two contacts are discovered to be the same person (e.g., phone-only contact later provides an email matching an email-only contact), the platform merges records rather than preventing duplicates upfront. Merge preserves all conversation links from both records.

## Data Model (Sketch)

```sql
-- Platform Core (public schema, organization-scoped)
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    display_name TEXT,
    phone_numbers TEXT[] NOT NULL DEFAULT '{}',   -- E.164 format
    emails TEXT[] NOT NULL DEFAULT '{}',           -- lowercase normalized
    external_ids JSONB NOT NULL DEFAULT '{}',      -- {"system_name": "external_id"}
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for resolution
CREATE INDEX idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX idx_contacts_phones ON public.contacts USING GIN(phone_numbers);
CREATE INDEX idx_contacts_emails ON public.contacts USING GIN(emails);

-- Contact notes (organization-scoped)
CREATE TABLE public.contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('agent', 'user')),
    author_id TEXT NOT NULL,           -- agent_name or user_id
    content TEXT NOT NULL,
    category TEXT,                     -- optional: 'preference', 'observation', 'alert'
    conversation_id UUID,              -- optional: which conversation triggered this note
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link conversations to contacts (Grove schema addition)
-- grove.chats gains: contact_id UUID REFERENCES public.contacts(id)
```

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Design review: contact model + tool interface | not started | none |
| T02 | Contact table migration + Platform Core service | not started | T01 |
| T03 | Contact resolution service (phone, email lookup) | not started | T02 |
| T04 | Add contact_id to grove.chats + ConversationStore | not started | T02 |
| T05 | recall_interactions tool (Grove) | not started | T04 |
| T06 | save_note tool (Grove) | not started | T02 |
| T07 | Contact notes API (Platform Core) | not started | T02 |
| T08 | Wire contact resolution into voice call path | not started | T03, T04 |
| T09 | Wire contact resolution into chat/public ingress path | not started | T03, T04 |
| T10 | Contact merge service | not started | T02 |
| T11 | Verification: cross-channel contact continuity | not started | T05-T09 |

## Acceptance Criteria

- [ ] Contact records are created automatically when a caller is identified by phone number.
- [ ] Contact records are created/linked when a chat user provides identifying information.
- [ ] `grove.chats` records link to contact_id when identity is resolved.
- [ ] Agent can call `recall_interactions(contact_id)` and receive summaries of past conversations across channels and agents.
- [ ] Agent can call `save_note(contact_id, note)` and the note persists for future interactions.
- [ ] Operator API can list contacts and their interaction history for a tenant.
- [ ] Contact resolution works for phone (E.164 match) and email (exact match).
- [ ] Anonymous/unidentified conversations work without a contact — no regression.
- [ ] Contact data is deleted on organization offboarding.
- [ ] Contact model is organization-scoped — no cross-tenant leakage.

## Verification

```bash
uv run pyright -p pyrightconfig.ci.json
uv run pytest packages/platform-core/tests/ -k contact -v --tb=short
uv run pytest packages/grove/tests/unit/ -k "recall_interactions or save_note" -v --tb=short
uv run pytest apps/api/tests/ -k contact -v --tb=short
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
make lint
```

## Non-Goals

- No vector-based semantic memory or RAG over past conversations (future optimization).
- No automatic prompt injection of full conversation history (agents use tools explicitly).
- No CRM functionality — the contact model stores identifiers and notes, not deal stages or pipelines.
- No real-time contact sync with external systems (solutions query external systems on demand).
- No contact management UI in this milestone (API-only; UI is a follow-on).
- No cross-organization contact sharing.
- No contact deduplication guarantees — best-effort matching only.

## Future Phases

| Phase | Scope |
|-------|-------|
| Phase 1 (this milestone) | Contact model, resolution, conversation linking, recall/save tools, notes |
| Phase 2 | Contact management UI (operator dashboard: view contacts, interaction history, notes) |
| Phase 3 | Vector-based semantic memory (embed past conversations, semantic recall) |
| Phase 4 | Agent long-term learning (patterns, FAQ generation, common objection handling) |

## Client-Specific Usage

### Affidea

- `patient_auth` solution authenticates caller → resolves Varutis patient ID → stored as `external_ids.varutis`
- Contact resolution by phone number creates/finds contact automatically
- Diagnostics agent calls `recall_interactions` → sees consultation agent's prior call summary
- Appointment reminder agent already knows the patient from prior inbound calls

### VOX

- Website Sales Agent captures lead (name, email, phone) → creates contact with email + phone
- Follow-Up Agent calls `recall_interactions` → sees WSA chat conversation summary
- Voice Sales Agent calls `recall_interactions` → references what was discussed in chat
- Lead data stored as note or via `lead_capture` solution's own tables, linked by contact_id

## M33 Impact

**Synergistic dependency.** M32 and M33 are a pair: M33 memory tools depend on M32's contact model for meaningful cross-session recall. M32 should come before M33. Storage is **separate tables**: M32 contact notes live in `public.contact_notes` (platform-core), M33 agent memories live in `grove.agent_memories` (Grove layer 1). They are NOT the same store — different tables, different schemas, different ownership layers. Both are linked by `contact_id` for GDPR erasure scope. M32 itself doesn't change due to M33, but sequencing matters.
