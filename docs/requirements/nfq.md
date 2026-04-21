# NFQ Voice Agent Platform

## Vision & Architecture Draft

**Document Version:** 1.1 (Draft)  
**Date:** January 2026  
**Prepared for:** Development Team Scope Evaluation  
**Author:** NFQ Technologies

---

## 1. Executive Summary

NFQ Technologies is developing a **Voice Agent & Business Process Automation Platform** that combines AI-powered voice agents with workflow orchestration capabilities. Unlike RetellAI's self-service model where clients build agents through no-code interfaces, our platform focuses on **provider-managed agent development** with limited client-side customization, enabling us to deliver more sophisticated, tailored solutions while maintaining quality control.

### Key Differentiators from RetellAI

| Aspect | RetellAI | NFQ Platform |
|---|---|---|
| Agent Development | Self-service, no-code UI for clients | Provider-managed (backoffice), code-first |
| Client Access | Full agent builder access | Limited to instructions & basic config |
| Focus | Call handling only | End-to-end business process automation |
| Workflow | Basic webhooks & function calls | Full workflow orchestration engine |
| Architecture | Proprietary infrastructure | LiveKit-based, flexible telephony |
| Data Residency | US-centric | EU-first, private cloud options |

---

## 2. Platform Overview

### 2.1 Vision Statement

Build a multi-tenant voice agent platform that enables businesses to automate customer interactions and integrate voice-driven workflows into their existing business processes. The platform positions NFQ as a service provider (not just a technology vendor), maintaining control over agent quality while giving clients operational visibility.

### 2.2 Target Users

```
                            User Roles
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ SuperAdmin   │ │   Provider   │ │    Client    │ │    Client    │
│   - NFQ      │ │    Admin     │ │    Admin     │ │   Operator   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
                          Access Levels
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Full Platform│ │    Agent     │ │Configuration │ │ Monitoring & │
│   Access     │ │Development & │ │ & Monitoring │ │Basic Settings│
│              │ │ Management   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Role Definitions:

- **SuperAdmin (NFQ):** Full platform control: tenant management, system monitoring, agent development/versioning/deployment across tenants, and support operations
- **Client Admin:** Tenant-specific configuration, call monitoring, workflow triggers, reporting
- **Client Operator:** Active call monitoring, manual takeover, post-call analysis review

### 2.3 Scope Guardrails

This requirement document covers the NFQ voice-call platform scope: telephony, voice agents, operator tooling, workflow automation, integrations, tenant/deployment administration, and reporting tied to call operations and workflow outcomes.

The following surfaces are explicitly **out of scope** for NFQ unless the contract changes later:

- Public website chat / anonymous browser ingress (`public_ingress`)
- Embeddable website widget runtime and guest-session flows
- Public lead-funnel and widget-analytics reporting
- Browser lead-capture / VOX-style public-ingress delivery flows

---

## 3. High-Level Architecture

```
                                        External Layer
                              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                              │ PSTN Network │ │WebRTC Clients│ │Client Telephon│
                              └──────┬───────┘ └──────┬───────┘ │  SIP Trunk   │
                                     │                │         └──────┬───────┘
                                     ▼                ▼                │
                                        Telephony Layer                │
                              ┌──────────────────────────┐            │
                              │     SIP Provider         │            │
                              │  Optional NFQ Default    │            │
                              └──────────┬───────────────┘            │
                                         │                            │
                                         ▼                            │
                              ┌──────────────────────────┐            │
                              │    LiveKit Server         │◄───────────┘
                              │    Media & Rooms          │
                              └──────────┬───────────────┘
                                         │
                            Core Platform │
                    ┌────────────────────┬┴───────────────────┐
                    ▼                                         ▼
         ┌──────────────────┐                    ┌──────────────────┐
         │ Agent Management │                    │ Call Orchestration│
         │    Service       │                    │    Service        │
         └────────┬─────────┘                    └────────┬─────────┘
                  │                                       │
    AI Processing Layer                                   │
    ┌─────────────┼──────────────────┐                    │
    │             ▼                  │                     │
    │   ┌──────────────────┐        │          ┌──────────────────┐
    │   │  Voice Agent     │        │          │ Workflow Engine   │
    │   │   Runtime        │        │          └──────────────────┘
    │   └──┬──────┬────┬───┘        │
    │      │      │    │            │          ┌──────────────────┐
    │      ▼      ▼    ▼            │          │Monitoring Service│
    │ ┌────────┐┌────┐┌────────┐   │          └──────────────────┘
    │ │  STT   ││LLM ││  TTS   │   │
    │ │Service ││Eng.││Service │   │
    │ │Deepgram││Open││Eleven  │   │
    │ │Google  ││AI/ ││Labs/   │   │
    │ │ Chirp  ││Clau││Cartesia│   │
    │ └────────┘│de/ │└────────┘   │
    │           │Gem.│             │
    │           └────┘             │
    └──────────────────────────────┘
                  │
         Data & Integration Layer
    ┌─────────────┼──────────────────┐
    │  ┌──────┐ ┌──────────────┐ ┌────────┐
    │  │Redis │ │Integration   │ │Primary │
    │  │Cache │ │Hub           │ │Database│
    │  └──────┘ │Webhooks/APIs │ └────────┘
    │           └──────┬───────┘          │
    └──────────────────┼──────────────────┘
                       │
              Client Systems
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │   CRM    ││   ERP    ││Telematics││ Custom   │
    │ Systems  ││ Systems  ││          ││  APIs    │
    └──────────┘└──────────┘└──────────┘└──────────┘
```

---

## 4. Core Components

### 4.1 Telephony & Carrier Layer

**Primary Carrier: LiveKit** - LiveKit serves as the core real-time communication infrastructure, handling WebRTC connections, room management, and media routing.

```
  Telephony Options                              ROOM
┌─────────────────────────────┐   ┌──────────────────────────────────────┐
│ NFQ Default SIP Provider    │   │                                      │
│                             │   │ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ Client's Own ──► LiveKit ───┼──►│ │ Caller   │ │  Agent   │ │Observer││
│ Telephony       SIP Bridge  │   │ │Participant│ │Participant│ │Optional││
│                             │   │ └──────────┘ └──────────┘ └────────┘│
│ Phone Number Acquisition    │   └──────────────────────────────────────┘
│      Future Phase           │
└─────────────────────────────┘
```

#### User Stories - Telephony:

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| T1 | Client Admin | Connect my existing SIP trunk | I can use my current phone numbers |
| T2 | Client Admin | Use NFQ's default telephony | I can start quickly without infrastructure |
| T3 | Client Admin | Acquire phone numbers through the platform | I can get new numbers for campaigns |
| T4 | System | Route inbound calls to appropriate agents | Callers reach the right automation |
| T5 | System | Support outbound campaigns | Agents can initiate calls |

### 4.2 Agent Management & Development

```
                    ●
                    │
              Create Agent
                    │
                    ▼
               ┌─────────┐
               │  Draft   │
               └────┬─────┘
                    │ Configure
                    ▼
               ┌─────────┐
          ┌───►│Development│◄──────────┐
          │    └────┬─────┘            │
          │         │ Deploy to Test   │ Issues Found
          │         ▼                  │
          │    ┌─────────┐             │
          │    │ Testing  │────────────┘
          │    └────┬─────┘
          │         │ Approve
          │         ▼
          │    ┌─────────┐
          │    │ Staging  │     New Version
          │    └────┬─────┘─────────┘
          │         │ Deploy
          │         ▼
          │    ┌──────────┐
          └────│Production│
               └────┬─────┘
                    │ Deprecate
                    ▼
               ┌──────────┐
               │ Archived  │
               └────┬──────┘
                    │
                    ◉
```

#### Agent Definition Structure:

```
                  Agent Definition
            ┌──────────────────────┐
            │      Metadata        │
            │  Name, Version,      │
            │    Description       │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Voice Configuration  │
            │ TTS Provider, Voice  │
            │        ID           │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  LLM Configuration   │
            │  Model, Temperature  │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │    System Prompt     │
            │  Base Instructions   │
            └─────┬──────────┬─────┘
                  │          │
     Provider-Only│          │Client-Editable
                  ▼          ▼
  ┌────────────────┐  ┌──────────────────────┐
  │Tool Definitions│  │ Custom Instructions   │
  │ Functions,     │  │  Business Context     │
  │ Integrations   │  └───────┬─────────┬────┘
  └───────┬────────┘          │         │
          │                   ▼         ▼
          ▼           ┌───────────┐ ┌──────────────┐
  ┌────────────────┐  │ Variables │ │Static Knowledge│
  │Conversation    │  │ Business  │ │   Base        │
  │Flow: States,   │  │ Hours,    │ │FAQ, Products, │
  │ Transitions    │  │ Contacts  │ │  Locations    │
  └───────┬────────┘  └───────────┘ └──────────────┘
          │
          ▼
  ┌────────────────┐
  │  Guardrails    │
  │ Safety,        │
  │ Compliance     │
  └────────────────┘
```

#### User Stories - Agent Management:

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| AM1 | SuperAdmin | Create agents in code | I have full control over agent behavior |
| AM2 | SuperAdmin | Version agents with semantic versioning | I can track changes and rollback |
| AM3 | SuperAdmin | Deploy agents to specific tenants | Each client gets appropriate agents |
| AM4 | SuperAdmin | Define standard configuration templates | Common patterns are reusable |
| AM5 | Client Admin | Edit agent instructions | I can customize business context |
| AM6 | Client Admin | Update knowledge base content | Agent has current business information |
| AM7 | Client Admin | Set business-specific variables | Agent knows operating hours, contacts |
| AM8 | Client Admin | View agent version history | I understand what changed |

### 4.3 Call Monitoring Service

For NFQ, analytics in this section means voice-call operations, workflow outcomes, and operator visibility. It does **not** include public website widget funnels or anonymous browser-ingress analytics.

```
  Analytics                    Historical Analysis              Live Monitoring
┌──────────────────┐    ┌───────────────────────┐    ┌──────────────────────────┐
│Performance Metrics│    │  Recording Playback   │    │  Room Viewer             │
│                  │    │                       │    │  Live Transcript         │
│Quality Scores ──►│    │  Call History          │    │                          │
│ Scheduled Reports│    │  Search & Filter       │    │  Active Calls Dashboard  │
│                  │    │                       │    │                          │
│Sentiment Analysis│    │  Full Transcripts ──►  │    │  Real-time Alerts        │
└──────────────────┘    │  Extracted Data        │    │  Sentiment, Errors       │
                        │  Structured Info       │    │                          │
                        └───────────────────────┘    │  Manual Takeover         │
                                                     │  Human Escalation        │
                                                     └──────────────────────────┘
```

#### User Stories - Call Monitoring:

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| CM1 | Client Operator | See all active calls in real-time | I can monitor operations |
| CM2 | Client Operator | View live transcripts of ongoing calls | I understand current conversations |
| CM3 | Client Operator | Join a call room as observer | I can listen without interruption |
| CM4 | Client Operator | Take over a call from the agent | I can handle escalations |
| CM5 | Client Admin | Search historical calls | I can find specific conversations |
| CM6 | Client Admin | Replay call recordings | I can review agent performance |
| CM7 | Client Admin | Configure post-call analysis | I get structured data extraction |
| CM8 | Client Admin | Set up extraction templates | Agent extracts relevant business data |
| CM9 | Client Admin | View aggregated analytics | I understand overall performance |
| CM10 | System | Generate quality scores automatically | Calls are rated for review |

### 4.4 Workflow Management Engine

```
                              Triggers
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │  Call     ││  Call    ││  Data    ││Scheduled ││ External ││ Manual   │
    │ Started  ││  Ended   ││Extracted ││          ││ Webhook  ││ Trigger  │
    └────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘
         │           │           │           │           │           │
         └───────────┴───────────┴─────┬─────┴───────────┴───────────┘
                                       │
                              Workflow Engine
                           ┌───────────────────┐
                           │ Execution Engine   │
                           └─────────┬─────────┘
                                     │
                                  Actions
         ┌──────────┬──────────┬─────┴────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼          ▼          ▼
    ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
    │ Queue   ││ Trigger ││  Send   ││ Update  ││  Send   ││  Call   │
    │  Task   ││ Another ││Notifica-││Database ││ Webhook ││External │
    │         ││  Agent  ││  tion   ││         ││         ││  API    │
    └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘

  Integrations                                        Control
┌────────────────────────────────────┐    ┌──────────────────────────┐
│Email/SMS │Custom  │Ticketing      │    │ Conditional Logic        │
│          │Systems │Systems        │    │ Wait/Delay               │
│Calendar  │        │CRM Sync       │    │ Parallel Execution       │
│Booking   │        │               │    │ Error Handling           │
└────────────────────────────────────┘    └──────────────────────────┘
```

#### Workflow vs. RetellAI:

RetellAI offers function calling and webhooks for real-time actions during calls. Our platform extends this with:

- **Pre-call workflows:** Fetch context before agent engages
- **During-call actions:** Real-time integrations (similar to RetellAI)
- **Post-call workflows:** Complex multi-step processes triggered by call outcomes
- **Scheduled workflows:** Recurring tasks, follow-ups, campaigns
- **Cross-call workflows:** Processes spanning multiple interactions

#### User Stories - Workflow Management:

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| WF1 | SuperAdmin | Define workflow templates | Common patterns are reusable |
| WF2 | SuperAdmin | Create complex multi-step workflows | Business processes are fully automated |
| WF3 | Client Admin | Configure workflow triggers | Automations run at the right time |
| WF4 | Client Admin | Map extracted data to integrations | Data flows to my business systems |
| WF5 | Client Admin | Monitor workflow executions | I can track automation status |
| WF6 | Client Admin | Set up error notifications | I know when workflows fail |
| WF7 | System | Execute workflows reliably | Long-running processes complete successfully |
| WF8 | System | Retry failed actions | Transient errors don't break processes |

---

## 5. Concrete Workflow Patterns

### 5.1 Logistics: Driver Work Time Verification

**Business Context:** Logistics companies need to verify driver work times and locations to prevent time fraud and ensure compliance with driving regulations. The AI agent proactively calls drivers to confirm their status.

```
Telematics        Workflow         Voice          Driver        TMS/ERP      Manager
(LocTracker/       Engine          Agent                                      Alert
 Fleethand)
    │                │               │              │              │            │
    │  ═══════════ Pre-Call Phase ═══════════       │              │            │
    │                │               │              │              │            │
    │ Driver status  │               │              │              │            │
    │ change detected│               │              │              │            │
    │ (unloading,    │               │              │              │            │
    │  border)       │               │              │              │            │
    │───────────────►│               │              │              │            │
    │                │ Check driver  │              │              │            │
    │                │ schedule &    │              │              │            │
    │                │ work hours    │              │              │            │
    │                │ remaining     │              │              │            │
    │                │   ┌──┐        │              │              │            │
    │                │   │  │        │              │              │            │
    │                │   └──┘        │              │              │            │
    │                │ Determine     │              │              │            │
    │                │ verification  │              │              │            │
    │                │ needed        │              │              │            │
    │                │──────────────►│              │              │            │
    │                │  Initiate outbound call      │              │            │
    │                │  with driver context          │              │            │
    │                │               │              │              │            │
    │  ═══════════ Call Phase ══════════════        │              │            │
    │                │               │              │              │            │
    │                │               │ Greeting &   │              │            │
    │                │               │ purpose      │              │            │
    │                │               │─────────────►│              │            │
    │                │               │              │              │            │
    │                │               │◄─────────────│              │            │
    │                │               │ Responds to  │              │            │
    │                │               │  questions   │              │            │
    │                │               │              │              │            │
    │                │               │ Collect:     │              │            │
    │                │               │ location,    │              │            │
    │                │               │ status,      │              │            │
    │                │               │ hours,       │              │            │
    │                │               │ next stop    │              │            │
    │                │               │   ┌──┐       │              │            │
    │                │               │   │  │       │              │            │
    │                │               │   └──┘       │              │            │
    │                │               │ Confirm &    │              │            │
    │                │               │ thank        │              │            │
    │                │               │─────────────►│              │            │
    │                │               │              │              │            │
    │  ═══════════ Post-Call Phase ═════════        │              │            │
    │                │               │              │              │            │
    │                │◄──────────────│              │              │            │
    │                │ Call completed│              │              │            │
    │                │ with extracted│              │              │            │
    │                │ data          │              │              │            │
    │◄───────────────│               │              │              │            │
    │ Compare reported│              │              │              │            │
    │ vs. telematics │               │              │              │            │
    │ data           │               │              │              │            │
    │                │               │              │              │            │
    │    ┌───────── alt ─────────────────── [Data matches] ────┐  │            │
    │    │           │               │              │          │  │            │
    │    │           │ Update driver record          │          │  │            │
    │    │           │ (verified)    │              │          │  │            │
    │    │           │──────────────────────────────►│          │  │            │
    │    ├───────────────────────── [Discrepancy detected] ────┤  │            │
    │    │           │               │              │          │  │            │
    │    │           │ Alert: Location/time          │          │  │            │
    │    │           │ mismatch for driver            │          │            │
    │    │           │──────────────────────────────────────────►│            │
    │    │           │ Flag for review│              │          │  │            │
    │    │           │──────────────────────────────►│          │  │            │
    │    └───────────────────────────────────────────────────────┘  │            │
    │                │               │              │              │            │
    │                │ Schedule next  │              │              │            │
    │                │ verification   │              │              │            │
    │                │ based on route │              │              │            │
    │                │   ┌──┐        │              │              │            │
    │                │   │  │        │              │              │            │
    │                │   └──┘        │              │              │            │
    │                │               │              │              │            │
```

#### Workflow Components:

| Phase | Component | Description |
|---|---|---|
| Trigger | Telematics webhook | Status change (unloading, border, etc.) |
| Pre-call | Context fetch | Get driver info, schedule, telematics position |
| During call | Data collection | Location, status, hours, plans |
| Post-call | Verification | Compare self-reported vs. telematics |
| Post-call | Alerting | Flag discrepancies to managers |
| Post-call | TMS update | Sync verified data to transport management |
| Scheduled | Follow-up | Plan next verification based on route |

#### Data Extraction Schema:

```json
{
  "driver_id": "string",
  "call_timestamp": "datetime",
  "reported_location": "string",
  "reported_status": "driving|resting|loading|unloading|waiting",
  "hours_worked_today": "number",
  "next_stop": "string",
  "expected_arrival": "datetime",
  "notes": "string",
  "verification_result": "confirmed|discrepancy|unreachable"
}
```

### 5.2 Healthcare: Clinic Appointment Booking

**Business Context:** Private healthcare clinics receive high volumes of appointment booking calls. The AI agent handles routine scheduling, collecting patient information, checking availability, and confirming appointments.

```
Patient       Voice        Calendar/       Patient Info    Workflow      SMS
              Agent        Scheduling       System         Engine       Gateway
  │             │           System            │              │            │
  │ ══════ Inbound Call ══════               │              │            │
  │             │              │              │              │            │
  │ Calls clinic│              │              │              │            │
  │ number      │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │ Greeting     │              │              │            │
  │◄────────────│              │              │              │            │
  │ Request     │              │              │              │            │
  │ appointment │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │              │              │              │            │
  │ ══════ Information Gathering ═════       │              │            │
  │             │              │              │              │            │
  │◄────────────│ Ask specialty│              │              │            │
  │ Cardiology  │              │              │              │            │
  │────────────►│              │              │              │            │
  │◄────────────│ Ask city     │              │              │            │
  │ Vilnius     │              │              │              │            │
  │────────────►│              │              │              │            │
  │◄────────────│ Offer clinic │              │              │            │
  │             │ locations    │              │              │            │
  │ Select      │              │              │              │            │
  │ clinic      │              │              │              │            │
  │────────────►│              │              │              │            │
  │◄────────────│ Ask doctor   │              │              │            │
  │             │ preference   │              │              │            │
  │ Any         │              │              │              │            │
  │ available   │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │              │              │              │            │
  │ ══════ Availability Check ═══════        │              │            │
  │             │              │              │              │            │
  │             │ Query        │              │              │            │
  │             │ available    │              │              │            │
  │             │ slots        │              │              │            │
  │             │─────────────►│              │              │            │
  │             │◄─────────────│              │              │            │
  │             │ Return       │              │              │            │
  │             │ options      │              │              │            │
  │◄────────────│ Offer times  │              │              │            │
  │ Accept time │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │              │              │              │            │
  │ ══════ Patient Data Collection ══        │              │            │
  │             │              │              │              │            │
  │◄────────────│ Request      │              │              │            │
  │             │ personal code│              │              │            │
  │ Provide code│              │              │              │            │
  │────────────►│              │              │              │            │
  │             │ Confirm back │              │              │            │
  │             │   ┌──┐       │              │              │            │
  │             │   │  │       │              │              │            │
  │             │   └──┘       │              │              │            │
  │◄────────────│ Request name │              │              │            │
  │             │ & phone      │              │              │            │
  │ Provide     │              │              │              │            │
  │ details     │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │              │              │              │            │
  │ ══════ Booking Confirmation ═════        │              │            │
  │             │              │              │              │            │
  │◄────────────│ Confirm price│              │              │            │
  │ Accept      │              │              │              │            │
  │────────────►│              │              │              │            │
  │             │ Create       │              │              │            │
  │             │ appointment  │              │              │            │
  │             │─────────────►│              │              │            │
  │◄────────────│ Confirmation │              │              │            │
  │             │              │              │              │            │
  │             │              │    ══════ Post-Call Workflow ═════       │
  │             │              │              │              │            │
  │             │ Booking      │              │              │            │
  │             │ complete     │              │              │            │
  │             │──────────────────────────────────────────►│            │
  │             │              │              │              │            │
  │             │              │  Update patient record     │            │
  │             │              │◄─────────────────────────────            │
  │             │              │              │              │            │
  │             │              │              │    Send confirmation SMS  │
  │             │              │              │              │───────────►│
  │             │              │              │              │            │
  │             │              │              │  Schedule reminder        │
  │             │              │              │     ┌──┐     │            │
  │             │              │              │     │  │     │            │
  │             │              │              │     └──┘     │            │
```

#### Conversation Flow States:

```
                         ●
                         │
                         ▼
                   ┌───────────┐
                   │  Greeting │
                   └─────┬─────┘
                         │ Patient states need
                         ▼
                ┌──────────────────┐
                │SpecialtySelection│
                └────────┬─────────┘
                         │ Specialty identified
                         ▼
                ┌──────────────────┐
                │LocationSelection │
                └────────┬─────────┘
                         │ City selected
                         ▼
                ┌──────────────────┐
                │ClinicSelection   │
                └────────┬─────────┘
                         │ Clinic selected
                         ▼
                ┌──────────────────┐
                │DoctorPreference  │
                └────────┬─────────┘
                         │ Preference noted
                         ▼
                ┌──────────────────┐        Time rejected
           ┌───►│AvailabilityCheck │◄──────────────────┐
           │    └────────┬─────────┘                   │
           │             │ Slots presented              │
           │             ▼                              │
           │    ┌──────────────────┐                   │
           │    │TimeConfirmation  │───────────────────┘
           │    └────────┬─────────┘
           │             │ Time accepted
           │             ▼
           │    ┌───────────────────────┐  No slots
           │    │PatientDataCollection  │──────────┐
           │    └────────┬──────────────┘           │
           │             │ Data collected            │
           │             ▼                          │
           │    ┌──────────────────┐                │
           │    │PriceConfirmation │  System issue  │
           │    └──┬───────────┬───┘────────────┐  │
           │       │           │                │  │
           │       │Price      │Price rejected  │  │
           │       │accepted   │                │  │
           │       ▼           │                ▼  ▼
           │ ┌──────────────┐  │         ┌──────────┐
           │ │Booking       │  └────────►│ Handoff  │◄── No clinic available
           │ │Confirmation  │            │          │◄── Complex request
           │ └──────┬───────┘            └──────────┘
           │        │ Complete
           │        ▼
           │        ◉
           │
           └── No clinic available / Complex request ──► Handoff
```

#### Data Extraction Schema:

```json
{
  "appointment": {
    "specialty": "string",
    "doctor_name": "string|null",
    "clinic_city": "string",
    "clinic_address": "string",
    "date": "date",
    "time": "time",
    "price_eur": "number"
  },
  "patient": {
    "personal_code": "string",
    "full_name": "string",
    "phone": "string",
    "email": "string|null"
  },
  "booking_status": "confirmed|pending|failed|handed_off",
  "handoff_reason": "string|null"
}
```

#### Handoff Scenarios:

| Scenario | Agent Action |
|---|---|
| Insurance/compensated visits | Transfer to human operator |
| Urgent medical need | Transfer immediately |
| Complex scheduling (multiple appointments) | Transfer to human |
| Specialty not available | Offer alternatives or transfer |
| Patient asks medical questions | Clarify scope, transfer if needed |
| Technical issues | Apologize, offer callback or transfer |

---

## 6. Multi-Tenancy Architecture

```
                          Platform Level
                    ┌──────────────────────────────────────┐
                    │          SuperAdmin UI                │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────┴───────────────────────┐
                    │         Platform Core                 │
                    └────┬─────────────────────────────┬───┘
                         │                             │
         ┌───────────────┴────────┐     ┌──────────────┴────────┐
         │       Tenant B         │     │       Tenant A         │
         │  ┌──────────────────┐  │     │  ┌──────────────────┐  │
         │  │  Tenant B Config │  │     │  │  Tenant A Config │  │
         │  └──────┬───────────┘  │     │  └──────┬───────────┘  │
         │         │              │     │         │              │
         │  ┌──────┴──┬───────┐  │     │  ┌──────┴──┬───────┐  │
         │  │         │       │  │     │  │         │       │  │
         │ [DB]  ┌────┴──┐┌───┴┐│     │ [DB]  ┌────┴──┐┌───┴┐│
         │Tenant │Tenant ││Ten.││     │Tenant │Tenant ││Ten.││
         │B Data │B Agts ││B   ││     │A Data │A Agts ││A   ││
         │       │       ││Port││     │       │       ││Port││
         │       └───────┘└────┘│     │       └───────┘└────┘│
         └───────────────────────┘     └───────────────────────┘
```

### Isolation Levels:

- **Data:** Complete tenant data isolation (separate schemas or row-level security)
- **Compute:** Shared infrastructure with tenant context
- **Configuration:** Tenant-specific settings, limits, features
- **Agents:** Agents deployed per-tenant, versioned independently

---

## 7. Integration Patterns

```
                              Platform
     Inbound Integrations                    Outbound Integrations
  ┌──────────────────────┐               ┌──────────────────────┐
  │      Webhooks        │               │      Webhooks        │
  │  Trigger workflows   │               │ Notify external      │
  │                      │               │   systems            │
  │      REST API        │    ┌──────┐   │                      │
  │  Data & control      │───►│Integ.│──►│    REST Calls        │
  │                      │    │ Hub  │   │  Push/pull data      │
  │ Event Subscriptions  │───►│      │──►│                      │
  │  Real-time updates   │    └──────┘   │    Data Sync         │
  │                      │               │ Scheduled transfers  │
  └──────────────────────┘               └──────────────────────┘
```

### Standard Connectors (Phase 1):

- Generic REST API connector
- Webhook sender/receiver
- HTTP Request action

### Industry-Specific Connectors (Phase 2+):

| Industry | Connectors |
|---|---|
| Logistics | Telematics APIs (LocTracker, Fleethand), TMS systems |
| Healthcare | Calendar/scheduling systems, Patient info systems, SMS gateways |
| General | CRM (Salesforce, HubSpot), Calendar (Google, Cal.com), Ticketing |

---

## 8. Billing Model

### 8.1 Minute-Based Pricing

The platform uses a **minute-based billing model**, similar to industry standards but with transparent component breakdown.

```
   Usage Tracking              Billing Components              Invoice
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│                  │     │                      │     │                  │
│  Call Duration   │────►│   Platform Fee       │     │                  │
│    minutes       │     │    per minute        │────►│   Total Usage    │
│                  │     │                      │     │    × Rate/min   │
│                  │────►│   Telephony          │────►│                  │
│                  │     │    per minute        │     │                  │
│  STT Usage      │     │                      │     │                  │
│                  │────►│   AI Processing      │────►│                  │
│  LLM Usage      │────►│    per minute        │     │                  │
│                  │     │                      │     │                  │
│  TTS Usage      │────►│                      │     │                  │
│                  │     │                      │     │                  │
└──────────────────┘     └──────────────────────┘     └──────────────────┘
```

### Pricing Components:

| Component | Description | Billing Unit |
|---|---|---|
| Platform Fee | Core platform usage | Per minute of call |
| AI Processing | STT + LLM + TTS combined | Included in platform rate |
| Telephony | SIP/PSTN minutes (if using NFQ default) | Per minute |
| Telephony | Client's own SIP | Pass-through or excluded |

### Billing Features:

- Real-time usage dashboard
- Monthly invoicing
- Usage alerts and limits
- Volume discounts for high-usage tenants
- Separate tracking for test vs. production calls

---

## 10. User Interface Environments

### 10.1 Provider Backoffice (NFQ Internal)

```
┌─────────────────────────────────────────────────────────────┐
│                    NFQ Provider Backoffice                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Tenants │  │ Agents  │  │ Deploy  │  │ System  │      │
│  │  Mgmt   │  │  Dev    │  │  Mgmt   │  │ Monitor │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│  Agent Development:                                         │
│  - Code-based agent creation                                │
│  - Prompt engineering workspace                             │
│  - Tool/function definitions                                │
│  - Testing & simulation                                     │
│  - Version control                                          │
│  - Deployment pipelines                                     │
│                                                             │
│  Tenant Management:                                         │
│  - Create/configure tenants                                 │
│  - Assign agents to tenants                                 │
│  - Set limits, quotas & pricing                             │
│  - Support access                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Client Portal

```
┌─────────────────────────────────────────────────────────────┐
│            [Client Name] - Voice Agent Portal               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Calls   │  │  Agents  │  │Workflows │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Analytics │  │ Settings │  │ Usage &  │                  │
│  │          │  │          │  │ Billing  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
│  Available Features (Client Admin):                         │
│  - View & configure assigned agents                         │
│  - Edit instructions & knowledge base                       │
│  - Monitor active & historical calls                        │
│  - Configure workflows & integrations                       │
│  - View analytics & reports                                 │
│  - Monitor usage & costs                                    │
│  - Manage team members                                      │
│                                                             │
│  Restricted (Provider Only):                                │
│  - Agent creation/deletion                                  │
│  - Core prompt modifications                                │
│  - Tool/function changes                                    │
│  - Flow/state modifications                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Principal User Stories Summary

### 11.1 Provider User Stories

| ID | Story | Priority |
|---|---|---|
| P1 | As a provider, I want to create voice agents in code so I have full control over behavior | Must |
| P2 | As a provider, I want to version and deploy agents to tenants so I can manage releases | Must |
| P3 | As a provider, I want to define which settings clients can modify so I maintain quality | Must |
| P4 | As a provider, I want to access any tenant for support purposes so I can help clients | Must |
| P5 | As a provider, I want to monitor platform-wide metrics so I understand system health | Must |
| P6 | As a provider, I want to create workflow templates so common patterns are reusable | Should |
| P7 | As a provider, I want to define standard integrations so clients connect easily | Should |
| P8 | As a provider, I want to configure tenant pricing tiers so billing is flexible | Should |

### 11.2 Client Admin User Stories

| ID | Story | Priority |
|---|---|---|
| C1 | As a client admin, I want to customize agent instructions so it fits my business | Must |
| C2 | As a client admin, I want to manage knowledge base content so the agent is informed | Must |
| C3 | As a client admin, I want to monitor all calls in real-time so I see operations | Must |
| C4 | As a client admin, I want to search and review historical calls so I can audit | Must |
| C5 | As a client admin, I want to configure post-call data extraction so I get structured data | Must |
| C6 | As a client admin, I want to set up workflow triggers so automations run correctly | Should |
| C7 | As a client admin, I want to configure integrations so data flows to my systems | Should |
| C8 | As a client admin, I want to view analytics dashboards so I understand performance | Should |
| C9 | As a client admin, I want to connect my existing telephony so I use current numbers | Should |
| C10 | As a client admin, I want to see real-time usage and costs so I manage budget | Should |

### 11.3 Client Operator User Stories

| ID | Story | Priority |
|---|---|---|
| O1 | As an operator, I want to see active calls dashboard so I monitor operations | Must |
| O2 | As an operator, I want to view live transcripts so I follow conversations | Must |
| O3 | As an operator, I want to join calls as observer so I can listen | Should |
| O4 | As an operator, I want to take over calls so I handle escalations | Should |
| O5 | As an operator, I want to see alerts for problematic calls so I act quickly | Should |
