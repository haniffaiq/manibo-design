# VOX-Sprachschule AI Platform — Requirements Specification & Statement of Work

**Prepared by:** Jakit MB (Simonas)
**Prepared for:** VOX-Sprachschule GmbH (Evaldas / Igor)
**Date:** February 2026
**Version:** DRAFT 0.1 — For internal review before client presentation
**Classification:** Confidential

---

## Requirements Checklist (Implementation Verification)

This is a checklist view to verify that what we built actually covers:

- VOX-specific requirements listed in this document (REQ-S\*, REQ-P\*, REQ-T\* and Phase deliverables/acceptance criteria).
- Platform capabilities required by VOX indirectly (general platform modules/capabilities). Where a user story exists elsewhere in this repo, it is included verbatim as a full sentence; otherwise the user story field is left blank.

Fill the last two columns during validation:

- **Check:** (empty by default) mark when verified.
- **Prove:** (empty by default) paste concrete evidence (test name/output, screenshot link, log snippet, endpoint + sample payload, etc.).

### Sales (VOX REQ-S)

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Respond to new website inquiries within 15 minutes, 24/7/365 (including outside business hours). |  |  |  |
| Run a conversational sales interaction (website chat) to qualify leads (level assessment, goals, scheduling constraints, contact details). |  |  |  |
| Communicate VOX value proposition authentically (speaking-first, pronunciation focus, small groups 2–5, qualified teachers, barrier reduction, fast progress). |  |  |  |
| Operate in all website languages for sales conversations (EN, DE, FR, IT, ES, RU). |  |  |  |
| Check course availability (schedule/location/language/level) in real time and propose matching options during the conversation. |  |  |  |
| Capture structured lead data and deliver it to CRM/inbox in an agreed ready-to-action format. |  |  |  |
| Automatically follow up on non-responsive leads (email follow-ups; re-engagement cadence; stop/archive after configurable attempts). |  |  |  |
| (Phase 2) Conduct outbound voice calls in English for first-contact sales discovery (level assessment, needs analysis, course recommendation). |  |  |  |
| (Phase 2) Generate structured call summaries from voice interactions and push them to CRM. |  |  |  |
| Flag and escalate leads requiring human intervention (complex cases, complaints, high-value prospects, edge cases). |  |  |  |

### Planning & Operations (VOX REQ-P)

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| (Phase 2) Accept natural-language schedule change requests (text or voice) and execute them via the scheduling API. |  |  |  |
| (Phase 2) Validate schedule changes before execution (conflicts, teacher availability, room availability, logical consistency). |  |  |  |
| (Phase 2) Notify all affected parties after schedule changes (students/teachers/staff) via their preferred channels (email/SMS/WhatsApp/push). |  |  |  |
| (Phase 2) Monitor CRM/task management for overdue tasks and escalate (remind → escalate → optional autonomous action), with the goal “a student is never left uninformed”. |  |  |  |
| Integrate with VOX scheduling API for both read and write operations (prerequisite for REQ-P01–P04). |  |  |  |

### Platform / Technical (VOX REQ-T)

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| VOX runs as a dedicated tenant on an existing multi-tenant SaaS platform operated by the Provider. |  |  |  |
| Provide production-grade infrastructure with monitoring, logging, and error alerting. |  |  |  |
| Comply with Swiss data protection (nDSG/FADP) and GDPR where applicable. |  |  |  |
| Provide configurable guardrails defining what the agent can/cannot say, promise, or commit to on behalf of VOX. |  |  |  |
| Provide analytics/reporting (response times, leads captured, conversion rates, follow-up activity, task completion, error rates). |  |  |  |

### Phase Deliverables & Acceptance (VOX SOW)

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| (Phase 1) Deploy production environment; configure monitoring/alerting; ensure tenant isolation; provide authentication and access control. |  |  |  |
| (Phase 1) Produce VOX knowledge base v1 (value proposition modeled on Igor; product catalog integration; initial guardrails; escalation rules) with VOX final approval on brand-representing content. |  |  |  |
| (Phase 1) Provide website live chat widget on vox-sprachschule.ch with branding/placement approved by VOX. |  |  |  |
| (Phase 1) Provide “out-of-office conversational engagement” (real conversation outside business hours; not just an auto-response). |  |  |  |
| (Phase 1) Provide analytics baseline report/dashboard (response time, leads captured, conversations initiated, leads delivered, escalations). |  |  |  |
| (Acceptance) Chat agent is live and meeting the 24/7 response-time expectation. |  |  |  |
| (Acceptance) Agent communicates VOX value proposition correctly (validated by Igor). |  |  |  |
| (Acceptance) Leads are delivered with all required fields in the agreed format. |  |  |  |
| (Acceptance) Agent escalates appropriately when outside its competence. |  |  |  |

### Data Protection, Retention, and Offboarding (VOX SOW)

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Execute a Data Processing Agreement (DPA) prior to go-live (covers processing purposes, sub-processors, retention/deletion, breach handling, data subject rights). |  |  |  |
| Implement security measures: encryption in transit/at rest, access controls, audit logging, regular security reviews. |  |  |  |
| On termination, export all VOX data in a standard format and delete it from Provider systems within 30 days. |  |  |  |

### Platform Core (General)

These are general platform requirements that show up as “must exist” building blocks in platform docs (not always phrased as user stories).

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Enforce tenant isolation with schema-per-tenant and a request-scoped tenant context (no cross-tenant reads/writes). |  |  |  |
| Provide authentication + role-based access control (SuperAdmin vs Client Admin vs Client Operator) and enforce it on every request. |  |  |  |
| Support solution discovery/enablement gating so tenants only access enabled capabilities (enforcement points exist and are testable). |  |  |  |
| Support configuration as the customization surface (platform defaults < solution templates < tenant overrides). |  |  |  |
| Provide webhook security: authenticity verification, replay protection, and idempotency semantics for inbound events. |  |  |  |
| Provide audit logging for sensitive actions and usage metering for tenant/platform reporting. |  |  |  |
| Provide integration contracts + tenant-specific adapters (e.g., scheduling, CRM, notifications) without per-tenant forks. |  |  |  |
| Support a public/anonymous web chat session ingress suitable for VOX website lead capture (secure by default; does not grant full platform access). |  |  |  |

### General Platform Capabilities (NFQ Vision User Stories)

These are platform capabilities described as user stories in `docs/requirements/nfq.md`. They are included here because VOX depends on the same platform foundation (even if VOX does not exercise every capability in Phase 1).

#### Telephony

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Allow tenants to connect their existing SIP trunk. | As a Client Admin, I want to connect my existing SIP trunk so that I can use my current phone numbers. |  |  |
| Provide default telephony option operated by the platform/provider. | As a Client Admin, I want to use NFQ's default telephony so that I can start quickly without infrastructure. |  |  |
| Support phone number acquisition through the platform. | As a Client Admin, I want to acquire phone numbers through the platform so that I can get new numbers for campaigns. |  |  |
| Route inbound calls to appropriate agents. | As a System, I want to route inbound calls to appropriate agents so that callers reach the right automation. |  |  |
| Support outbound campaigns/calls. | As a System, I want to support outbound campaigns so that agents can initiate calls. |  |  |

#### Agent Management

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Support code-first agent creation (deployment-managed). | As a SuperAdmin, I want to create agents in code so that I have full control over agent behavior. |  |  |
| Support agent versioning (semantic versioning) and rollback. | As a SuperAdmin, I want to version agents with semantic versioning so that I can track changes and rollback. |  |  |
| Support deploying agents to specific tenants. | As a SuperAdmin, I want to deploy agents to specific tenants so that each client gets appropriate agents. |  |  |
| Support standard configuration templates for reuse. | As a SuperAdmin, I want to define standard configuration templates so that common patterns are reusable. |  |  |
| Allow tenant admins to edit agent instructions. | As a Client Admin, I want to edit agent instructions so that I can customize business context. |  |  |
| Allow tenant admins to update knowledge base content. | As a Client Admin, I want to update knowledge base content so that agent has current business information. |  |  |
| Allow tenant admins to set business-specific variables. | As a Client Admin, I want to set business-specific variables so that agent knows operating hours, contacts. |  |  |
| Allow viewing agent version history. | As a Client Admin, I want to view agent version history so that I understand what changed. |  |  |

#### Call Monitoring

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Show all active calls in real time for tenant operators. | As a Client Operator, I want to see all active calls in real-time so that I can monitor operations. |  |  |
| Show live transcripts of ongoing calls for tenant operators. | As a Client Operator, I want to view live transcripts of ongoing calls so that I understand current conversations. |  |  |
| Allow operators to join a call as observer. | As a Client Operator, I want to join a call room as observer so that I can listen without interruption. |  |  |
| Allow operators to take over a call from the agent. | As a Client Operator, I want to take over a call from the agent so that I can handle escalations. |  |  |
| Allow tenant admins to search historical calls. | As a Client Admin, I want to search historical calls so that I can find specific conversations. |  |  |
| Allow tenant admins to replay call recordings. | As a Client Admin, I want to replay call recordings so that I can review agent performance. |  |  |
| Allow tenant admins to configure post-call analysis. | As a Client Admin, I want to configure post-call analysis so that I get structured data extraction. |  |  |
| Allow tenant admins to set up extraction templates. | As a Client Admin, I want to set up extraction templates so that agent extracts relevant business data. |  |  |
| Provide aggregated analytics view for tenant admins. | As a Client Admin, I want to view aggregated analytics so that I understand overall performance. |  |  |
| Generate quality scores automatically. | As a System, I want to generate quality scores automatically so that calls are rated for review. |  |  |

#### Workflow Management

| Requirements | User Story (if present) | Check | Prove |
|---|---|---|---|
| Support workflow templates (reusable patterns). | As a SuperAdmin, I want to define workflow templates so that common patterns are reusable. |  |  |
| Support complex multi-step workflows. | As a SuperAdmin, I want to create complex multi-step workflows so that business processes are fully automated. |  |  |
| Allow tenant admins to configure workflow triggers. | As a Client Admin, I want to configure workflow triggers so that automations run at the right time. |  |  |
| Allow mapping extracted data to integrations. | As a Client Admin, I want to map extracted data to integrations so that data flows to my business systems. |  |  |
| Allow monitoring workflow executions. | As a Client Admin, I want to monitor workflow executions so that I can track automation status. |  |  |
| Provide error notifications for workflow failures. | As a Client Admin, I want to set up error notifications so that I know when workflows fail. |  |  |
| Execute workflows reliably (durable). | As a System, I want to execute workflows reliably so that long-running processes complete successfully. |  |  |
| Retry failed actions on transient errors. | As a System, I want to retry failed actions so that transient errors don't break processes. |  |  |

## PART I — BUSINESS CONTEXT & REQUIREMENTS SPECIFICATION

### 1. Company Overview

VOX-Sprachschule is a language school operating in Zurich (Central and Enge), Winterthur, and Online. They teach primarily German, English, French, and 15+ additional languages to expatriates and professionals in Switzerland. The school differentiates itself through small groups (2–5 participants), a speaking-first methodology with heavy focus on pronunciation, and university-qualified linguistics teachers. The website operates in six languages (DE, EN, FR, IT, ES, RU).

The primary customer profile is an English-speaking professional who has relocated to Switzerland and wants to learn German at beginner level. Courses follow CEFR levels (A1–C2), and VOX aims to complete one full level per course cycle.

### 2. Current State & Pain Points

#### 2.1 Sales Process (Pre-Registration)

The current sales funnel operates as follows:

**Inquiry intake:** A prospective student submits an inquiry via the website form, email, phone, or WhatsApp. The form captures location preference, target language, self-assessed level, preferred start date, and contact details.

**Internal evaluation:** A sales team member manually reviews the inquiry, checks internal schedules for available courses (location, language, level, timing), and decides what to propose. This requires contextual judgment — whether an existing group has space, whether a new group could form, whether the student is flexible on timing, and whether individual lessons are a better fit.

**First offer:** Sales sends an initial proposal to the lead, typically via email: "We can offer you Course A (group, starting date X) or Course B (different schedule)."

**First call (core discovery):** This is the most critical sales interaction. After the offer is sent, sales calls the lead to discuss it. During this call, sales must: confirm the student's actual language level (self-assessment is often inaccurate); understand specific learning goals (IT vocabulary, travel preparation, career advancement, exam preparation, social integration); clarify scheduling constraints and flexibility; identify hidden blockers (budget sensitivity, commute concerns, urgency); and communicate VOX's unique value proposition. There is an established but informal know-how / checklist of what must be covered. The quality of this call depends heavily on the individual salesperson. Igor (the founder/head teacher) performs this best because he embodies the school's philosophy and can authentically communicate why VOX's speaking-first approach works.

**Course matching:** Based on discovery, sales attempts to match the student to a group course. If no group fits, they either keep monitoring for upcoming options ("we'll let you know when something opens") or upsell to individual lessons.

**Easy cases:** When a lead's needs clearly match an available course, sales sends a direct join link with a start date. If the link isn't clicked, sales must follow up to understand the blocker.

**Conversion or loss:** Leads either register, or they enter a "cooling" path where motivation fades, calls go unanswered, and the lead is eventually deprioritized. Some return weeks or months later via newsletters or repeat visits.

#### 2.2 Planning & Operations (Post-Registration)

Once a student registers, the "planning department" takes over. This team handles:

**Teacher assignment:** Matching qualified, available teachers to courses.

**Schedule management:** Building, maintaining, and constantly adjusting course schedules. This is described as the backbone of the planning department and the single most failure-prone area. Schedule changes are frequent (e.g., "move all Tuesday sessions to Wednesday starting from date X for course ABC") and require checking for conflicts, validating feasibility, updating records via internal systems, and notifying all affected parties.

**Communication & notifications:** Students, teachers, and internal staff must be notified of any changes — via email, SMS, WhatsApp, or push. Missed notifications directly damage student trust and retention.

**Overdue task management:** Many planning tasks are small, repetitive, and easy to overlook. When tasks are missed (a teacher cancels and students aren't informed, a schedule conflict isn't caught, a room change isn't communicated), quality degrades visibly.

There is existing API access to the scheduling system. The team has already spent several months building custom UI for schedule management, which indicates both the importance and the ongoing cost of this problem.

#### 2.3 Where Revenue Is Lost

**Out-of-office response gap:** Prospective students browse language schools in the evening and on weekends. If VOX doesn't respond within approximately 15 minutes, leads register with competitors. This is direct, measurable revenue loss with no current mitigation. The website promises response "within 1 hour."

**Lead cooling and abandonment:** Follow-up to non-responsive leads is inconsistent. Sales team members deprioritize leads after 2–3 failed contact attempts. No systematic keep-warm process exists. No intelligent prioritization scores leads by likelihood of conversion.

**Sales quality variance:** Not every salesperson can articulate VOX's unique value proposition effectively. Igor's personal selling approach — built on his identity as a teacher, his conviction about the speaking-first method, his ability to reduce learners' psychological barriers — is the gold standard but is not scalable or transferable in its current form.

**Planning errors causing churn:** Students who experience poor communication (late notifications, schedule confusion, last-minute changes without warning) lose trust and are less likely to continue to the next course level or refer others.

### 3. Functional Requirements

The following requirements are organized by business domain, not by technical component.

#### REQ-S: Sales Domain

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| REQ-S01 | The system shall respond to new website inquiries within 15 minutes, 24/7/365, including outside business hours. | Critical | Currently zero coverage outside office hours. Response should feel natural, not instant-robotic. |
| REQ-S02 | The system shall conduct a conversational sales interaction (initially text-based via website chat) that qualifies the lead: captures actual level assessment, learning goals, scheduling constraints, and contact details. | Critical | Must feel conversational, not form-like. |
| REQ-S03 | The system shall communicate VOX's value proposition authentically, including: speaking-first methodology, pronunciation focus, small groups (2–5), university-qualified teachers, psychological barrier reduction, and fast progress (one level per course). | Critical | Content modeled on Igor's selling approach. Knowledge base must be curated with client. |
| REQ-S04 | The system shall operate in all languages available on the VOX website (EN, DE, FR, IT, ES, RU) for sales conversations. | Critical | Full multilingual coverage from launch. |
| REQ-S05 | The system shall check available courses (schedules, locations, languages, levels) and propose matching options to the lead in real time during conversation. | High | Requires read access to scheduling system/API. |
| REQ-S06 | The system shall capture structured lead data (name, email, phone, assessed level, goals, availability, preferred location, language) and deliver it to the sales team's CRM/inbox in a ready-to-action format. | Critical | Lead value estimated at ~€100 per qualified lead. |
| REQ-S07 | The system shall automatically follow up on leads that do not respond: send email follow-ups, attempt re-engagement at configured intervals. | High | Addresses "cooling leads" problem. |
| REQ-S08 | The system shall conduct outbound voice calls in English for first-contact sales discovery, including level assessment, needs analysis, and course recommendation. | Medium | Phase 2. Requires voice agent infrastructure. |
| REQ-S09 | The system shall generate call summaries from voice interactions and push them to CRM. | Medium | Phase 2. Depends on REQ-S08. |
| REQ-S10 | The system shall flag and escalate leads that require human intervention (complex cases, complaints, high-value prospects, edge cases outside known scenarios). | High | Must not create bad experiences by over-automating. |

#### REQ-P: Planning & Operations Domain

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| REQ-P01 | The system shall accept natural-language schedule change requests (text or voice) and execute them via the scheduling API. Example: "Move all Tuesdays to Wednesdays starting from DATE for course ABC." | High | Phase 2. Requires write access to scheduling API. |
| REQ-P02 | Before executing any schedule change, the system shall validate: no conflicts with other courses, teacher availability, room availability, and logical consistency. | High | Prevents the most common planning errors. |
| REQ-P03 | After a schedule change is executed, the system shall automatically notify all affected parties (students, teachers, internal staff) via their preferred channel (email, SMS, WhatsApp, push). | High | Currently the most frequent source of missed communication. |
| REQ-P04 | The system shall monitor CRM/task management for overdue tasks and escalate them: send reminders, flag to responsible person, and if unresolved, escalate further or take action autonomously (e.g., send notification to affected student). | Medium | Phase 2. "A student should never be left uninformed." |
| REQ-P05 | The system shall integrate with VOX's existing scheduling API for both read and write operations. | Critical | Prerequisite for REQ-P01–P04. API access confirmed available by client. |

#### REQ-T: Technical / Platform

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| REQ-T01 | The platform is an existing multi-tenant SaaS, with VOX deployed as a dedicated tenant. Platform is operated by the Provider (Jakit MB). | Critical | Architectural decision. Provider operates platform. |
| REQ-T02 | Infrastructure shall be production-grade with monitoring, logging, and error alerting. | Critical | — |
| REQ-T03 | All data processing shall comply with Swiss data protection law (nDSG/FADP) and GDPR where applicable (EU students). | Critical | Swiss school processing EU resident data. |
| REQ-T04 | The system shall support configurable guardrails defining what the AI agent can and cannot say, promise, or commit to on behalf of VOX. | Critical | Risk mitigation. Content boundaries defined with client. |
| REQ-T05 | The system shall provide analytics and reporting: response times, leads captured, conversion rates, follow-up activity, task completion, error rates. | High | Required for KPI measurement. |

---

## PART II — AI AGENT ARCHITECTURE & WORKFLOW MAPPING

### 4. Agent Inventory

Each business requirement maps to one or more AI agents operating within an orchestrated workflow system. Agents share a common knowledge base but have distinct responsibilities, tools, and escalation paths.

#### Agent 1: Website Sales Agent (WSA)

**Purpose:** 24/7 conversational lead qualification and sales via website chat widget.

**Covers:** REQ-S01, REQ-S02, REQ-S03, REQ-S04, REQ-S05, REQ-S06, REQ-S10

**Behavior:**
The Website Sales Agent is embedded on vox-sprachschule.ch as a conversational chat widget, available in all six website languages (EN, DE, FR, IT, ES, RU). When a visitor engages, the agent opens with a natural greeting in the visitor's language and moves into a consultative conversation — not a form. It asks about the visitor's situation (why they want to learn, when they arrived in Switzerland, what their goals are), assesses their level through conversation, checks available courses against the schedule API in real time, and recommends specific options. Throughout, it communicates VOX's value proposition naturally: the speaking-first method, small groups, pronunciation focus, and the school's philosophy of reducing psychological barriers to speaking a new language.

If the visitor provides contact details, the agent structures the lead data and delivers it to the CRM/sales inbox. If the visitor is ready to register, the agent provides the registration link. If the visitor has questions the agent cannot answer or situations that require human judgment, it escalates gracefully with full context.

**Knowledge base inputs:**
- VOX value proposition and sales narratives (sourced from Igor)
- Current course catalog, schedules, pricing
- FAQ and common objections
- Guardrails: what the agent must not say or promise

**Integrations:**
- Website (chat widget embed)
- Scheduling API (read: course availability)
- CRM / sales inbox (write: lead delivery)

**Key metrics:** Response time, conversation-to-lead conversion rate, lead quality score, escalation rate.

#### Agent 2: Follow-Up & Lead Nurture Agent (FNA)

**Purpose:** Systematic follow-up on leads that have not converted, including out-of-office inquiry handling and "cooling lead" re-engagement.

**Covers:** REQ-S01 (email component), REQ-S07, REQ-S10

**Behavior:**
This agent monitors the lead pipeline and executes follow-up sequences. For out-of-office inquiries, it works in tandem with the Website Sales Agent to ensure full conversational engagement — not just an acknowledgment email. For leads that received an offer but haven't clicked the registration link or responded, the agent initiates a follow-up sequence: first email after N hours, second after N days, with escalating personalization. For leads that were contacted by sales but went cold (no answer after 2–3 call attempts), the agent maintains a long-term keep-warm cadence — periodic check-ins, relevant course updates, gentle re-engagement.

The agent prioritizes leads by recency, expressed urgency, and likelihood of conversion (based on signals like inquiry completeness, website behavior if available, and response patterns). It knows when to stop: after a configurable number of unanswered attempts, the lead is archived, not harassed.

**Integrations:**
- CRM (read/write: lead status, activity history)
- Email sending service
- Scheduling API (read: course availability for personalized suggestions)

**Key metrics:** Follow-up response rate, recovered leads (re-engaged after cooling), time-to-first-response for out-of-office inquiries.

#### Agent 3: Voice Sales Agent (VSA) — Phase 2

**Purpose:** Conduct first-contact sales discovery calls in English, replicating the core discovery process currently done by human sales.

**Covers:** REQ-S08, REQ-S09, REQ-S10

**Behavior:**
The Voice Sales Agent calls leads who have submitted inquiries (or are scheduled for callback by the sales team). On the call, it references the offer already sent ("We suggested Course A and Course B — does either work for you?"), then runs the discovery checklist: confirms level, explores goals, discusses scheduling, surfaces objections, and communicates VOX's value. It handles common responses ("the times don't work," "I'm not sure about my level," "what makes you different from other schools?") and either progresses the lead toward registration or identifies the blocker and logs it.

After each call, the agent generates a structured summary (level assessment, goals, availability, objections, recommended next action) and pushes it to CRM. Calls that require human follow-up are flagged with context.

**Infrastructure:**
- LiveKit Cloud for voice/telephony
- Temporal for workflow orchestration
- LLM (voice-optimized model) for conversation
- STT/TTS pipeline

**Key metrics:** Call completion rate, discovery completeness (% of checklist covered), conversion to registration, call duration, escalation rate.

#### Agent 4: Schedule Management Agent (SMA) — Phase 2

**Purpose:** Accept natural-language schedule change requests, validate them, execute via API, and notify all affected parties.

**Covers:** REQ-P01, REQ-P02, REQ-P03, REQ-P05

**Behavior:**
A planning team member (or authorized manager) sends a schedule change request in natural language via a chat interface, Slack, or email. Example: "Move all Tuesday sessions to Wednesday starting from March 15 for German A1 group at Zurich Central."

The agent parses the request, queries the scheduling API to understand the current state, identifies all affected sessions, checks for conflicts (teacher double-bookings, room conflicts, student overlaps with other enrolled courses), and presents a validation summary before executing: "This will move 8 sessions. No conflicts detected. 12 students and 1 teacher will be notified. Proceed?"

Upon confirmation, the agent executes the change via the scheduling API and dispatches notifications to all affected students, the teacher, and internal stakeholders via their preferred channels.

If conflicts are detected, the agent presents them clearly and suggests alternatives: "Wednesday at 18:00 conflicts with French B1 in Room 3. Options: move to Thursday, or use Room 5 on Wednesday."

**Integrations:**
- Scheduling API (read/write)
- Notification service (email, SMS, WhatsApp, push)
- Internal chat / Slack / email (input channel)

**Key metrics:** Change execution time (target: minutes, not hours/days), conflict detection accuracy, notification delivery rate, error rate (changes that had to be reverted).

#### Agent 5: Operations Monitor Agent (OMA) — Phase 2

**Purpose:** Continuously monitor CRM, scheduling system, and communication logs for overdue tasks, missed notifications, and operational failures. Escalate or act autonomously.

**Covers:** REQ-P04, REQ-P05

**Behavior:**
This agent runs as a background process, scanning for: overdue CRM tasks (e.g., "confirm teacher for next week's course" still unassigned 48 hours before), students who should have been notified of a change but weren't (cross-referencing schedule changes with notification logs), teachers who haven't confirmed upcoming sessions, and any other operational gaps defined in configurable rules.

When an issue is detected, the agent follows an escalation ladder: first, it sends a reminder to the responsible person; if unresolved within a configurable window, it escalates to their manager; if still unresolved and the impact is student-facing, the agent can take autonomous action (e.g., send the notification to the student directly) and log the intervention.

The goal is that "a student is never left uninformed" — the agent acts as a safety net for human oversight gaps.

**Integrations:**
- CRM (read: task status, deadlines)
- Scheduling system (read: upcoming sessions, assignments)
- Notification logs (read: what was sent, to whom, when)
- Notification service (write: send reminders, escalations, autonomous notifications)

**Key metrics:** Overdue tasks caught, time-to-resolution, autonomous interventions taken, incidents that reached students (target: near-zero).

### 5. Shared Components

#### 5.1 VOX Knowledge Base

A structured, versioned knowledge base containing: VOX's value proposition and competitive positioning (sourced from Igor's selling philosophy), product catalog (courses, levels, schedules, pricing, locations), sales discovery checklist and objection handling, operational procedures and notification templates, and guardrails (topics the agent must avoid, commitments it must not make, escalation triggers).

This knowledge base is the single source of truth for all agents. It is maintained collaboratively between Jakit MB and VOX, with VOX having final approval on any content that represents their brand.

#### 5.2 Workflow Orchestration (Temporal)

All multi-step agent operations run as durable workflows: lead follow-up sequences (with configurable timing, retry logic, and termination rules), schedule change workflows (parse → validate → confirm → execute → notify), escalation chains (detect → remind → escalate → act), and voice call workflows (initiate → converse → summarize → route).

Temporal provides reliability (workflows survive infrastructure failures), visibility (current state of every workflow is inspectable), and auditability (full history of what happened and why).

#### 5.3 Analytics & Reporting Dashboard

A unified view of all KPIs across sales, operations, and system health. Discussed further in Part III (KPIs).

### 6. Workflow Diagrams

#### 6.1 Lead-to-Registration Flow (Agents: WSA, FNA, VSA)

```
[Website Inquiry] ──→ [WSA: Chat Conversation]
                           │
                    ┌──────┴──────┐
                    │             │
              [Lead Ready]   [Lead Not Ready]
                    │             │
              [Send Reg Link]  [FNA: Follow-Up Sequence]
                    │             │
              ┌─────┴────┐   ┌──┴───────────┐
              │          │   │              │
         [Registered] [No Click]  [Responds]  [No Response]
                         │       │              │
                    [FNA: Why?]  [Route to      [Keep-Warm
                         │       Human/VSA]      Cadence]
                    [Resolve or                     │
                     Escalate]               [Archive after
                                              N attempts]
```

#### 6.2 Schedule Change Flow (Agents: SMA, OMA)

```
[Planner Request] ──→ [SMA: Parse Intent]
        (NL text)          │
                     [Query Schedule API]
                           │
                     [Validate: Conflicts?]
                      ┌────┴────┐
                      │         │
                [No Conflicts]  [Conflicts Found]
                      │              │
                [Show Summary]  [Show Conflicts +
                      │          Suggest Alternatives]
                      │              │
                [Confirm? Y/N]  [Revised Request]
                      │              │
                [Execute via API]◄───┘
                      │
                [Send Notifications]
                      │
                [OMA: Verify Delivery]
```

---

## PART III — STATEMENT OF WORK / CONTRACT TERMS

### 7. Parties

**Provider:** Jakit MB, 306207902, Lithuania, represented by Simonas Jakubonis ("Provider").

**Client:** VOX-Sprachschule GmbH, Zurich, Switzerland, represented by Evaldas and Igor ("Client").

### 8. Engagement Structure

This engagement is structured as a Platform-as-a-Service relationship. The Provider operates an existing multi-tenant AI platform, purpose-built for voice and workflow automation. The Client receives a dedicated tenant on this platform, configured and customized for VOX's specific business workflows, integrations, and knowledge base. The implementation work covers deployment, configuration, integration with VOX's systems, and ongoing optimization — not platform development from scratch.

The Client owns their data, their knowledge base content (sales narratives, product information, business rules), and any custom workflow configurations created specifically for them. The underlying platform — its architecture, runtime, and shared infrastructure — is operated and maintained by the Provider as part of the service.

### 9. Scope of Work — Phase 1 (1st month)

**Objective:** Deliver visible business impact quickly — 24/7 lead capture and sales conversation on the website — while establishing the platform foundation.

**Deliverables:**

9.1 **Platform foundation:** Production environment deployed, monitoring and alerting configured, tenant isolation for VOX, authentication and access control.

9.2 **VOX knowledge base (v1):** Value proposition content modeled on Igor's selling approach, product catalog integration (courses, schedules, pricing), initial guardrails and escalation rules. Requires 2–3 working sessions with Igor/Evaldas for content capture.

9.3 **Website Sales Agent (WSA):** Live chat widget on vox-sprachschule.ch, fully multilingual across all six website languages (EN, DE, FR, IT, ES, RU), conversational lead qualification, real-time course availability lookup (requires Client to provide scheduling API access), structured lead delivery to CRM/inbox.

9.4 **Out-of-office conversational engagement:** Full AI-powered conversation capability for inquiries received outside business hours — not just an auto-response. The agent engages the customer in real time: answers follow-up questions, suggests alternatives if initial options don't fit, handles objections, and guides the conversation toward registration just as a human salesperson would. The customer should not feel they are talking to a limited system.

9.5 **Analytics baseline:** Dashboard or report covering: response time, leads captured, conversations initiated, leads delivered, escalations.

**Client responsibilities for Phase 1:**
- Provide API access and documentation for scheduling system
- Provide CRM access or define lead delivery format
- Participate in 2–3 knowledge capture sessions (Igor + Evaldas)
- Approve website chat widget placement and branding
- Provide test accounts and sample data for development
- Define guardrails: what the agent must not say or promise

**Acceptance criteria:**
- Chat agent is live and responding within 15 minutes 24/7
- Agent correctly communicates VOX value proposition (validated by Igor)
- Leads are delivered in agreed format with all required fields
- Agent escalates appropriately when outside its competence

### 10. Scope of Work — Phase 2 (2nd – 3rd month)

**Objective:** Extend automation to voice sales, planning operations, and proactive monitoring.

**Deliverables:**

10.1 **Voice Sales Agent (VSA) — Pilot:** English-language outbound calls for first-contact discovery, sales discovery checklist execution, call summary generation and CRM push, human escalation for complex cases.

10.2 **Follow-Up & Lead Nurture Agent (FNA):** Automated follow-up sequences for non-responsive leads, cooling-lead re-engagement cadence, lead prioritization logic.

10.3 **Schedule Management Agent (SMA):** Natural-language schedule change interface, conflict detection and validation, automated execution via scheduling API, multi-channel notifications to affected parties.

10.4 **Operations Monitor Agent (OMA) — Initial rules:** Overdue task detection and escalation, missed notification alerts, configurable escalation ladder.

**Client responsibilities for Phase 2:**
- Provide scheduling API write access and test environment
- Define follow-up sequences and timing rules
- Approve voice agent script and call flow
- Define escalation rules and notification templates
- Participate in testing and feedback sessions

**Acceptance criteria:**
- Voice agent completes discovery calls covering ≥80% of checklist items
- Schedule changes execute correctly with zero undetected conflicts in testing
- Notifications reach all affected parties within configured timeframe
- Follow-up sequences execute on schedule with correct personalization

### 11. KPIs & Success Metrics

The following KPIs will be tracked and reported monthly. Baselines will be established during Phase 1 (first 30 days of manual measurement + first 30 days of AI operation).

#### Sales KPIs

| KPI | Baseline (Manual) | Phase 1 Target | Phase 2 Target |
|---|---|---|---|
| First response time (new inquiry) | To be measured | < 15 min (24/7) | < 15 min |
| Lead → registration conversion rate | To be measured | +10% relative | +15–25% relative |
| Human sales call volume (first-touch) | To be measured | −20% | −30–50% |
| Recovered "cooling" leads per month | 0 (no process) | Tracking begins | Measurable uplift |
| Out-of-office inquiries handled | 0 (no coverage) | 100% responded | 100% + voice |

#### Operations KPIs

| KPI | Baseline (Manual) | Phase 2 Target |
|---|---|---|
| Student notification failures (per month) | To be measured | Near-zero |
| Schedule change execution time | Hours / days | Minutes |
| Overdue planning tasks caught by system | 0 (no monitoring) | ≥90% caught within SLA |
| Manual planning task volume | To be measured | −40–60% reduction |

#### Strategic Indicators (Tracked, Not Targeted)

- FTE hours saved per month (toward headcount efficiency goal)
- Student satisfaction / NPS (if measured by Client)
- Course fill rate / group formation rate ("densification")


### 13. Intellectual Property & Ownership

**Platform IP:** The AI platform — including its architecture, code, framework, multi-tenant infrastructure, and reusable components — is the intellectual property of the Provider (Jakit MB), developed independently of this engagement. The Client receives a license to use the platform as a service for the duration of the engagement.

**Client data:** All data provided by the Client (student records, leads, schedules, CRM data) and all data generated through the platform on the Client's behalf (conversation logs, analytics, reports) is and remains the exclusive property of the Client. Upon termination, all Client data will be exported in a standard format and deleted from Provider systems within 30 days.

**Knowledge base content:** Sales narratives, product descriptions, business rules, and other content authored by or sourced from the Client is the Client's intellectual property. The Provider has a license to use this content solely for operating the platform on the Client's behalf.

**Custom configurations:** Workflow configurations, prompt engineering, and integration logic created specifically for the Client are jointly owned — the Client may request documentation of these configurations at any time, and the Provider may reuse structural patterns (but not Client-specific content) for other tenants.

### 14. Data Protection & Compliance

The Provider shall process personal data solely for the purposes defined in this agreement, in compliance with:

- Swiss Federal Act on Data Protection (nDSG/FADP, revised September 2023)
- EU General Data Protection Regulation (GDPR) where applicable (EU/EEA data subjects)

A separate Data Processing Agreement (DPA) shall be executed prior to go-live, covering: categories of data processed, processing purposes and legal basis, sub-processor list (cloud providers, LLM providers, communication services), data retention and deletion policies, breach notification procedures, and data subject rights handling.

The Provider shall implement appropriate technical and organizational measures to protect personal data, including encryption in transit and at rest, access controls, audit logging, and regular security reviews.

### 15. Term & Termination

**Initial term:** 6 months from the date of execution.

**Renewal:** Automatically renews for successive 3-month periods unless either party provides 60 days' written notice of non-renewal.

**Termination for convenience:** Either party may terminate with 60 days' written notice after the initial 6-month term.

**Termination for cause:** Either party may terminate immediately if the other party materially breaches this agreement and fails to cure within 30 days of written notice.

**Upon termination:** The Provider shall export all Client data in a standard format, provide documentation of all custom configurations, and delete Client data from Provider systems within 30 days. The Client shall pay all outstanding invoices, including any usage charges incurred through the termination date.

### 16. Assumptions & Dependencies

This SOW is based on the following assumptions. If any prove incorrect, scope, timeline, or pricing may require adjustment:

1. Client will provide scheduling API access (read + write) with adequate documentation within the first week of engagement.
2. Client will make Igor and Evaldas available for knowledge capture sessions (minimum 2–3 sessions of 1–2 hours each during Phase 1).
3. Client's scheduling API supports the operations described in REQ-P01–P05.
4. Voice agent infrastructure (LiveKit Cloud) is suitable for Swiss telephony requirements.
5. Client's CRM can accept inbound lead data via API, webhook, or structured email.
6. Website chat widget can be embedded on vox-sprachschule.ch without significant technical obstacles.
7. The engagement language is English. Agent customer-facing conversations operate in all six website languages (EN, DE, FR, IT, ES, RU).

### 17. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Knowledge capture insufficient — agent doesn't "sell like Igor" | Medium | High | Dedicate time to iterative content refinement. Plan for 3–5 revision cycles of sales narratives. Record Igor's actual sales calls (with consent) as training material. |
| Scheduling API limitations — cannot support all desired operations | Medium | Medium | Conduct API capability audit in Week 1. Identify gaps early and agree on workarounds or API extensions. |
| Low initial volume — hard to measure KPI impact | Medium | Low | Establish manual baselines before go-live. Track leading indicators (response time, lead quality) alongside lagging indicators (conversion). |
| Voice quality / latency issues on Swiss telephony | Low | High | Test with Swiss phone numbers in development. Have fallback to chat/email if voice is not ready. |
| Client expectations exceed Phase 1 scope | Medium | Medium | This document defines scope clearly. Monthly reviews align expectations. Phase 2 deliverables are not guaranteed until Phase 1 is accepted. |
| Data protection audit required by Swiss regulator | Low | High | Execute DPA before go-live. Document all data flows. Ensure LLM providers have adequate privacy policies (no training on customer data). |

---

*This document is a working draft for discussion purposes. All pricing, timelines, and scope items are subject to mutual agreement before execution.*
