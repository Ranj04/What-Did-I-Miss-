# What Did I Miss? 🎓

**An agentic student catch-up assistant that helps students recover from missed classes.**

> Missed class? Know exactly what changed, what matters, and what to do next.

What Did I Miss? ingests lecture slides, assignments, professor announcements, notes, and group-chat summaries, then generates a **personalized catch-up plan**: what you missed, what changed, what's due soon, which concepts matter most, how the missed material affects your assignment, a prioritized checklist, practice questions, memory-based warnings, and follow-up nudges through messaging.

> **Submission description.** What Did I Miss? is an agentic student catch-up assistant that helps students recover from missed classes. It ingests lectures, assignments, announcements, and group updates, reconstructs what changed, creates a personalized catch-up plan, remembers student learning gaps through XTrace, stores course state through Butterbase, runs recovery pipelines through RocketRide, and sends catch-up summaries and nudges through Photon messaging.

---

## Problem statement

When a student misses a week of class, the hardest part isn't learning the material — it's **figuring out where to even start**. Information is scattered across slides, the LMS, email announcements, and group chats. Deadlines move. Requirements shift. A generic AI tutor can answer a question *if you already know what to ask* — but a student who missed class doesn't.

## Why this is **not** a generic tutor

What Did I Miss? is a **context-recovery agent**, not a Q&A bot:

- It **reconstructs the missed window** from real course materials, not generic knowledge.
- It has **persistent, self-revising memory** — it remembers *your* learning gaps and *this* course's facts, and supersedes them when they change (e.g. a moved deadline).
- It **warns you about your own past mistakes** ("you previously confused REST and WebSocket…").
- It **reaches you where you are** — pushing summaries and nudges into a messaging platform.

Remove any one of the four integrations and a core part of the experience breaks (see architecture).

---

## Architecture

```
                          ┌─────────────────────────────────────────────┐
                          │                Next.js App                  │
                          │   pages (RSC) + client components + API     │
                          └───────────────┬─────────────────────────────┘
                                          │  lib/agents.ts (orchestrator)
        ┌─────────────────────┬───────────┴───────────┬──────────────────────┐
        ▼                     ▼                       ▼                      ▼
  ┌───────────┐        ┌─────────────┐         ┌────────────┐         ┌────────────┐
  │ Butterbase│        │  RocketRide │         │   XTrace   │         │   Photon   │
  │  backend  │        │  pipelines  │         │   memory   │         │  messaging │
  ├───────────┤        ├─────────────┤         ├────────────┤         ├────────────┤
  │ db/auth   │        │ A ingestion │         │ write      │         │ summaries  │
  │ storage   │        │ B catch-up  │         │ search     │         │ nudges     │
  │ data API  │        │ C quiz      │         │ supersede  │         │ deadline   │
  │ AI gateway│        │ D contradict│         │ recall     │         │ webhook    │
  │           │        │ E reply     │         │            │         │            │
  └───────────┘        └─────────────┘         └────────────┘         └────────────┘
```

Every service has a clean adapter in `lib/` with environment variables, `TODO(*-live)` integration seams, and a deterministic **mock fallback** so the app runs end-to-end with **no API keys**.

### How **RocketRide** is used (AI pipelines / multi-agent workflows)
`lib/rocketride.ts` defines five pipelines. The orchestrator in `lib/agents.ts` chains them with the other tools and emits an `AgentEvent` per step for the live timeline.

- **Pipeline A — Document Ingestion** (`runDocumentIngestionPipeline`): parse → classify source type → extract dates/concepts/requirements/clarifications → store in Butterbase → write durable facts to XTrace.
- **Pipeline B — Catch-Up Generation** (`runCatchUpGenerationPipeline`): fetch materials (Butterbase) → search memory (XTrace) → identify changes in the missed range → rank by urgency & assignment impact → produce the structured report + checklist → save (Butterbase) → summarize (Photon) → write memory (XTrace).
- **Pipeline C — Quiz + Weakness Detection** (`runQuizGenerationPipeline` / `gradeQuizAnswer`): generate questions → grade → detect misunderstanding → store attempt (Butterbase) → write learning-gap memory (XTrace) → practice nudge (Photon).
- **Pipeline D — Contradiction Detection** (`runContradictionDetectionPipeline`): extract a new fact (e.g. an announcement) → search old memories → detect contradiction → supersede old memory (XTrace) → update assignment (Butterbase) → Photon update.
- **Pipeline E — Memory-aware Reply** (`runPhotonReplyPipeline`): given an inbound message + recalled memories, produce a tailored answer. **When Butterbase is live this step makes a real LLM call through the Butterbase AI Model Gateway** (`modelGatewayChat`), grounding the reply in the student's recalled XTrace memory — and degrades to a deterministic answer in pure demo mode or on any gateway error.

> Live wiring: set `ROCKETRIDE_API_KEY` + the `ROCKETRIDE_PIPELINE_*_ID`s to route the other pipelines to RocketRide pipeline runs (`runPipeline()` posts to `/v1/pipelines/:id/runs`). Pipeline E's reasoning runs on the Butterbase AI gateway out of the box once Butterbase keys are present — no RocketRide id required.

### How **Butterbase** is used (backend)
`lib/butterbase.ts` is the entire backend seam: auth helpers, courses, materials + storage, catch-up sessions, checklist tasks, quiz attempts, agent events, Photon message log, a queryable mirror of memory events, and the **AI Model Gateway** (`modelGatewayChat`). **This is wired to a live Butterbase backend** (app `app_2tcinxzld4o0`, 10 tables) — every function calls the auto-generated REST data API at `{NEXT_PUBLIC_BUTTERBASE_URL}/v1/{BUTTERBASE_APP_ID}/{table}` with `camelCase ↔ snake_case` mapping. When no Butterbase keys are present, the **same** functions fall back to an in-memory store (`lib/store.ts`) so the app still runs end-to-end. `lib/seed.ts` mirrors the CSC 413 demo into the live backend (used by **Reset demo**).

> Live wiring (already configured in `.env.local`): `NEXT_PUBLIC_BUTTERBASE_URL`, `BUTTERBASE_API_KEY`, `BUTTERBASE_APP_ID`, optional `BUTTERBASE_MODEL_GATEWAY_KEY`, and `BUTTERBASE_DEFAULT_MODEL` (the AI gateway model; defaults to the cheaper `anthropic/claude-haiku-4.5` for demos). The schema was provisioned via the Butterbase MCP and matches `lib/types.ts` 1:1.

### How **XTrace** is used (persistent, self-revising memory)
`lib/xtrace.ts` provides `writeMemory`, `searchMemory`, `supersedeMemory`, `getCourseMemories`, `getStudentMemories`, `getSupersededMemories`. Memory is the spine of personalization: learning gaps drive warnings, and **supersession** (not deletion) is how a changed deadline is reconciled while preserving history.

> Live wiring: set `XTRACE_API_KEY` + `XTRACE_PROJECT_ID`.

### How **Photon / Spectrum** is used (messaging) — **mandatory integration**
`lib/photon.ts` delivers three outbound events and ingests inbound replies:

| Event | Trigger | Wired in |
| --- | --- | --- |
| **Catch-Up summary** | a catch-up plan is generated | `lib/agents.ts` → `sendCatchUpSummary` |
| **Practice nudge** | a practice answer is wrong | `/api/quiz/submit` → `sendPracticeNudge` |
| **Deadline update** | a deadline is superseded (Wed → Fri) | `lib/agents.ts` contradiction step → `sendDeadlineUpdate`; also the Messages-tab button |
| **Inbound reply** | a student messages the bot | `/api/photon/webhook` → XTrace recall + Pipeline E + `sendMessage` |

**Real outbound delivery, Slack-first.** `sendMessage(platform, recipient, text, metadata?)` attempts a real send in this order, falling through to the next configured path and finally to demo logging:

1. **Photon / Spectrum hub** — `PHOTON_API_KEY` + `PHOTON_PROJECT_ID`
2. **Direct Slack** — `PHOTON_SLACK_BOT_TOKEN` + `PHOTON_SLACK_CHANNEL_ID` (Slack `chat.postMessage`)
3. **Direct Discord** — `PHOTON_DISCORD_WEBHOOK_URL`
4. **Direct Telegram** — `PHOTON_TELEGRAM_BOT_TOKEN` + `PHOTON_TELEGRAM_CHAT_ID`
5. **Demo mode** — message is logged to Butterbase `photon_messages` and shown in the **Messages** tab

Every send is persisted (direction, status `sent|failed|demo`, provider id) so the Messages tab is a real delivery log. Status is queryable at `/api/photon/status`; a one-click `/api/photon/test` sends a connectivity check. The app **never pretends to be connected** — if no credentials are present it clearly shows **demo mode**.

#### Photon / Spectrum setup
1. Create a Photon/Spectrum project **or** a Slack app (bot token scope `chat:write`).
2. Connect one messaging platform — **Slack preferred**.
3. Add the env vars below to `.env.local`.
4. Configure the inbound webhook URL to `…/api/photon/webhook` (set `PHOTON_WEBHOOK_SECRET`).
5. Run the app and open the **Messages** tab.
6. Click **Send Test Message** — confirm it lands in your channel (or is logged in demo mode).
7. Generate a catch-up plan and confirm the **catch-up summary** is delivered.

> Slack-only setups don't need the Photon hub keys — `PHOTON_SLACK_BOT_TOKEN` + `PHOTON_SLACK_CHANNEL_ID` is enough to send for real, and Photon will report **live**.

---

## Environment variables

Copy `.env.example` → `.env.local`. **All are optional** — every integration has a mock fallback. Provide a service's keys to switch it from *demo* to *live* (visible on `/settings/integrations`).

| Service | Variables |
| --- | --- |
| Butterbase | `NEXT_PUBLIC_BUTTERBASE_URL`, `BUTTERBASE_API_KEY`, `BUTTERBASE_APP_ID`, `BUTTERBASE_MODEL_GATEWAY_KEY`, `BUTTERBASE_DEFAULT_MODEL` |
| RocketRide | `ROCKETRIDE_API_KEY`, `ROCKETRIDE_BASE_URL`, `ROCKETRIDE_PIPELINE_INGESTION_ID`, `ROCKETRIDE_PIPELINE_CATCHUP_ID`, `ROCKETRIDE_PIPELINE_QUIZ_ID`, `ROCKETRIDE_PIPELINE_CONTRADICTION_ID`, `ROCKETRIDE_PIPELINE_PHOTON_REPLY_ID` |
| XTrace | `XTRACE_API_KEY`, `XTRACE_BASE_URL`, `XTRACE_PROJECT_ID` |
| Photon (hub) | `PHOTON_API_KEY`, `PHOTON_BASE_URL`, `PHOTON_PROJECT_ID`, `PHOTON_WEBHOOK_SECRET` |
| Photon (routing) | `PHOTON_DEFAULT_PLATFORM`, `PHOTON_DEFAULT_RECIPIENT`, `PHOTON_SLACK_CHANNEL_ID`, `PHOTON_DISCORD_CHANNEL_ID`, `PHOTON_TELEGRAM_CHAT_ID` |
| Photon (direct send) | `PHOTON_SLACK_BOT_TOKEN`, `PHOTON_DISCORD_WEBHOOK_URL`, `PHOTON_TELEGRAM_BOT_TOKEN` |

---

## Local setup

```bash
npm install
npm run dev
# open http://localhost:3000
```

No keys required to run: with an empty env the app boots in **demo mode** (in-memory store) with the CSC 413 course seeded. With the provided `.env.local`, Butterbase runs **live** — reads/writes hit the real backend and Pipeline E calls the live AI gateway — while RocketRide/XTrace/Photon stay in mock mode. Click **Start Demo** either way to (re)seed CSC 413.

---

## Demo script

1. Open the app → click **Start Demo** (seeds/loads CSC 413 and goes to the dashboard).
2. Dashboard shows **CSC 413 — Software Development** flagged as needing attention. Open the course.
3. **Catch-Up** tab: ask *"I missed this week. What did I miss and what do I need to do for the project?"* and click **Generate Catch-Up Plan**.
4. Watch the **agent pipeline timeline**: Reading Butterbase → Searching XTrace → Running RocketRide → Saving to Butterbase → **Sending through Photon** → Writing to XTrace.
5. Read the structured **catch-up brief** (summary → updates → concepts → assignment impact → personalized warning → priority checklist → questions to ask).
6. **Messages** tab: open it and click **Send Test Message** — see the Photon status card flip the last-message status. Then see your **catch-up summary** already delivered in the thread.
7. **Practice** tab: answer the REST-vs-WebSocket question **incorrectly** → a learning-gap memory is written to XTrace **and a practice nudge is sent via Photon**.
8. **Memory** tab: ask *"Explain the chat connection part."* → the agent recalls your gap and replies *"Since you previously mixed up REST and WebSocket, here is the difference…"* (a real LLM reply through the Butterbase gateway when live).
9. Still on **Memory**: see the **superseded** deadline pair — *"due Wednesday"* (struck through) → *"extended to Friday"* (active).
10. **Messages** tab: click **Send Deadline Update** to deliver *"Deadline update: Project 2 is now due Friday at 11:59 PM."*, and **Simulate Incoming Question** to see a memory-aware auto-reply.
11. **Integrations** page: confirm all four technologies — Butterbase, RocketRide, XTrace, Photon — with the Photon detail card showing mode, platform, destination, and the inbound webhook route.

Reset anytime with **Reset demo** (dashboard) or `POST /api/demo/reset`.

---

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Student dashboard (courses + integration chips) |
| `/courses/[courseId]` | Course workspace overview |
| `/courses/[courseId]/materials` | Materials + ingestion uploader |
| `/courses/[courseId]/catchup` | Catch-Up agent + pipeline timeline + report |
| `/courses/[courseId]/practice` | Practice questions + weakness detection |
| `/courses/[courseId]/memory` | XTrace memory panel + supersession + recall |
| `/courses/[courseId]/messages` | Photon messaging thread |
| `/settings/integrations` | Integration status + env reference |

## API routes

`/api/catchup/generate` · `/api/materials/ingest` · `/api/quiz/submit` · `/api/quiz/questions` · `/api/memory/search` · `/api/memory/write` · `/api/photon/send` · `/api/photon/webhook` · `/api/photon/test` · `/api/photon/status` · `/api/demo/reset` · `/api/courses`

---

## Butterbase submission notes

- **Live backend provisioned** (Butterbase MCP): app `app_2tcinxzld4o0` with 10 tables (`users, courses, course_materials, assignments, catchup_sessions, catchup_tasks, quiz_attempts, agent_events, photon_messages, memory_events`) that map 1:1 onto `lib/types.ts`.
- `lib/butterbase.ts` calls the live REST data API; `lib/store.ts` is the no-keys fallback. The catch-up flow persists sessions + checklist tasks + agent-event telemetry to the live DB on every run.
- The **AI Model Gateway** seam (`modelGatewayChat`) is OpenAI-compatible (`POST /v1/{app_id}/chat/completions`), is **actually invoked** by RocketRide Pipeline E, and defaults to `anthropic/claude-haiku-4.5` (cheap tier for demos; switch to `anthropic/claude-sonnet-4.6` via `BUTTERBASE_DEFAULT_MODEL` for top quality).

## Hackathon judging alignment

- **Deep, non-shallow integration of all four tools.** Each is load-bearing: Butterbase persists everything, RocketRide does the reasoning, XTrace makes it personal and self-correcting, Photon delivers it. The agent orchestrator (`lib/agents.ts`) literally fails without each step.
- **A real agentic workflow**, surfaced transparently via the live pipeline timeline and persisted `AgentEvent`s.
- **Self-revising memory** demonstrated concretely (the deadline supersession + the learning-gap → memory-aware-recall loop).
- **Runs with zero credentials** for instant judging, with clearly marked seams to go live.

---

## Known limitations

- **Butterbase is live.** **Photon performs real outbound sends as soon as a Slack bot token (or the Photon hub keys) is configured** — Slack `chat.postMessage`, Discord webhooks, and Telegram are implemented; with no credentials it cleanly logs to the Messages tab in demo mode. RocketRide and XTrace run in mock mode (deterministic outputs); their adapters and env seams are ready — add keys to go live.
- File "upload" ingests pasted text rather than parsing real PDFs/PPTX (the parse step is mocked in Pipeline A).
- Auth uses a single demo student. `lib/butterbaseAuth.ts` wraps the real Butterbase auth service (signup/login/refresh); wiring a login page + session cookie is the remaining step for multi-user auth.
- "Semantic" memory search uses keyword overlap over the Butterbase memory mirror; true semantic recall comes from XTrace once `XTRACE_*` keys are set.
- AI gateway usage is billed against the Butterbase plan's AI credits; the demo defaults to the cheap `claude-haiku-4.5` tier.

## What to wire next with real credentials

1. **RocketRide**: build the five pipelines in the RocketRide console and set the `*_ID`s; `runPipeline()` is ready. (Pipeline E already runs on the live Butterbase AI gateway.)
2. **XTrace**: set `XTRACE_API_KEY` + `XTRACE_PROJECT_ID` to point `writeMemory`/`searchMemory`/`supersedeMemory` at real embeddings + history.
3. **Photon**: connect a Slack/Discord/etc. workspace, set the webhook URL to `/api/photon/webhook`, and verify the signing secret.
4. **Auth**: add a login page that stores the Butterbase tokens from `lib/butterbaseAuth.ts` and pass the end-user JWT to the data API.

---

## Submission

This project targets the **Agentic AI SF Hackathon** (hackathon slug `agentic-ai-Hackathon`).

- **Butterbase app:** `app_2tcinxzld4o0` (`what-did-i-miss`) — include this app id in the submission so the Butterbase-usage scoring (DB + AI gateway) applies.
- **Repo:** _add your repo URL here._
- **Demo URL:** local `http://localhost:3000` (run `npm install && npm run dev`), or your deployed URL.
- Submitted via the Butterbase MCP `prep_and_submit_hackathon_entry` flow.
