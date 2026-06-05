# What Did I Miss? — Hackathon Submission

**Official description:** What Did I Miss? is an agentic student catch-up assistant that helps students recover from missed classes. It ingests lectures, assignments, announcements, and group updates, reconstructs what changed, creates a personalized catch-up plan, remembers student learning gaps through XTrace, stores course state through Butterbase, runs recovery pipelines through RocketRide, and sends catch-up summaries and nudges through Photon messaging.

**One-sentence pitch:** What Did I Miss? is a context-recovery agent that reconstructs the class you missed, reconciles what changed, remembers your learning gaps, and nudges you through the messaging apps you already use.

> What Did I Miss? is **not a generic tutor**. It is a **context recovery agent**. Students often fall behind because class context is scattered across lectures, assignments, announcements, group chats, and professor clarifications. The agent reconstructs what changed, creates a personalized catch-up plan, remembers student learning gaps, and sends timely nudges through messaging apps students already use.

---

## Problem
When a student misses class, the hard part isn't a single concept — it's that context is scattered: lecture slides, an assignment spec, a deadline-change announcement, a professor clarification buried in email, and a group chat where someone found the bug. There's no single place that says *"here is exactly what changed and what to do next."* Generic AI tutors answer questions you already know to ask; they can't tell you what you don't know you missed.

## Solution
An agentic pipeline that ingests all of a course's scattered material, reconciles it against persistent memory of the student and the course, and produces a prioritized **catch-up brief** — what changed, why it matters, a ranked checklist, practice questions, and warnings grounded in the student's *own* past mistakes. It then delivers a short version to the student's messaging app and answers follow-ups there.

## Target users
University and bootcamp students in project-based courses who miss a class (illness, work, overload) and need to recover context fast — plus the instructors and TAs who otherwise field the same "what did I miss?" questions repeatedly.

---

## How each required technology is used

### RocketRide — AI pipelines / multi-agent workflows
Five pipelines (`lib/rocketride.ts`), each load-bearing:
- **A — Document ingestion**: parse → classify → extract concepts, dates, clarifications.
- **B — Catch-up generation**: the core reasoning that turns materials + memory into the structured brief + checklist.
- **C — Quiz + weakness detection**: generate practice questions, grade, and detect the specific misunderstanding.
- **D — Contradiction detection**: spot a changed fact (e.g. a moved deadline) against prior memory.
- **E — Memory-aware reply**: answer an inbound message grounded in recalled memory — **runs as a real LLM call through the Butterbase AI Model Gateway** when live.

### Butterbase — backend, database, auth, AI gateway
`lib/butterbase.ts` is the entire backend: a **live** app (`app_2tcinxzld4o0`, 10 tables) reached via the auto-generated REST data API. It persists auth, courses, materials, catch-up sessions, checklist tasks, quiz attempts, agent-event telemetry, **Photon message logs**, and a queryable mirror of memory events — plus the OpenAI-compatible **AI Model Gateway** that Pipeline E actually calls. With no keys, the identical functions fall back to an in-memory store.

### XTrace — persistent, self-revising memory
`lib/xtrace.ts` records learning-gap memories, course facts, and professor clarifications; retrieves relevant memory *before* generating a catch-up or a follow-up answer; and **supersedes** stale facts when contradicted — keeping the old version visible (the Wednesday→Friday deadline pair) rather than deleting it. This is what makes the agent personal *and* self-correcting.

### Photon / Spectrum — messaging delivery (mandatory)
`lib/photon.ts` delivers three outbound events — **catch-up summary**, **practice nudge**, **deadline update** — and ingests inbound replies via a webhook that produces a memory-aware answer. Outbound delivery attempts a **real send, Slack-first** (Photon hub → direct Slack `chat.postMessage` → Discord webhook → Telegram → demo log). Every send is persisted to `photon_messages` and shown in the Messages tab; `/api/photon/status` and `/api/photon/test` expose connectivity. With no credentials it clearly runs in **demo mode** — it never fakes a connection.

---

## What the integration unlocks
Removing any one tool breaks the experience, which is the point:
- **Butterbase** makes it durable and multi-source.
- **RocketRide** makes it reason instead of summarize.
- **XTrace** makes it *yours* — it remembers your mistakes and corrects itself when facts change.
- **Photon** makes it actually reach you, in the app you already check.

The orchestrator (`lib/agents.ts`) chains all four into one visible pipeline with a live timeline and persisted `AgentEvent`s.

## Why it's production-ready
- **Live Butterbase backend** with a real schema and a real, billed AI gateway call in the catch-up/reply path.
- **Real Photon outbound** the moment a Slack token is present — implemented against the real Slack/Discord/Telegram APIs, not stubbed.
- **Every integration has a clean adapter, typed contracts, `TODO(*-live)` seams, and a deterministic mock fallback**, so the app runs end-to-end with zero credentials and degrades gracefully on any provider error.
- **Honest status surface**: `/settings/integrations` shows exactly what's live vs. demo; nothing is misrepresented.

---

## Demo flow
1. **Start Demo** → dashboard with CSC 413 flagged.
2. Open CSC 413 → **Catch-Up** → **Generate Catch-Up Plan**.
3. Watch the RocketRide pipeline timeline (Butterbase → XTrace → RocketRide → Butterbase → Photon → XTrace).
4. Read the catch-up brief; the summary is delivered to messaging via Photon.
5. **Messages** tab → **Send Test Message**; see the delivery log + status card.
6. **Practice** → answer the REST-vs-WebSocket question wrong → XTrace learning-gap memory + Photon practice nudge.
7. **Memory** → ask "Explain the chat connection part." → memory-aware reply; see the superseded Wed→Fri deadline.
8. **Send Deadline Update** in Messages; **Integrations** page shows all four technologies live/demo.

## Limitations
- RocketRide and XTrace currently use deterministic mock outputs (adapters + env seams ready); Butterbase is live and Photon sends for real with a Slack token.
- Ingestion takes pasted text rather than parsing real PDFs/PPTX.
- Single demo student; `lib/butterbaseAuth.ts` wraps real auth but a login UI is the remaining step.
- Demo-mode "semantic" memory is keyword overlap; true embeddings come from live XTrace.

## Future work
- Wire the five RocketRide pipeline IDs and live XTrace embeddings.
- Real document parsing (PDF/PPTX) and calendar/LMS (Canvas) ingestion.
- Multi-user auth + per-student channel resolution for Photon.
- Add `provider_message_id` / `error_message` columns to the live `photon_messages` table for full delivery auditing.
