# What Did I Miss? — Project Description

**Agentic context-recovery for students who missed class.**

## Problem
When a student misses a week, the hard part isn't relearning the material — it's knowing *where to even start*. Context is scattered across slides, the LMS, email announcements, and group chats; deadlines move and requirements shift. A generic AI tutor only helps if you already know what to ask. A student who missed class doesn't.

## Solution
What Did I Miss? is a multi-tool **agent** that reconstructs the missed window from real course materials and produces a personalized catch-up plan: what changed, what matters most, how it affects your assignment, a prioritized checklist, practice questions, memory-based warnings about your own past mistakes, and follow-up nudges in the messaging app you already use. Every run is shown as a transparent, step-by-step pipeline timeline and persisted to a real backend.

## Target users
- University and bootcamp students who missed classes (illness, work, overload).
- Students re-entering a fast-moving, project-based course mid-stream.
- Adjacent: instructors/TAs who want a consistent "catch-up" artifact for absent students.

## How each required technology is used (all load-bearing)
- **RocketRide — the reasoning.** Five pipelines: (A) document ingestion → classify + extract; (B) catch-up generation → the structured report + checklist; (C) quiz generation + weakness detection → grading; (D) contradiction detection → spotting a changed deadline; (E) memory-aware reply → personalized follow-up answers. Pipeline E's reasoning runs on the **Butterbase AI Model Gateway**.
- **Butterbase — the backend (live).** Provisioned app `app_2tcinxzld4o0` with 10 tables. Persists users, courses, materials, catch-up sessions, checklist tasks, quiz attempts, agent-event telemetry, the Photon message log, and a queryable mirror of memory — plus auth helpers and the OpenAI-compatible **AI Model Gateway** that every LLM call routes through.
- **XTrace — the memory.** Persistent, self-revising memory: learning gaps, course facts, professor clarifications. Memory is recalled before catch-up generation and before follow-up answers, and a changed deadline **supersedes** (not deletes) the old fact, preserving history.
- **Photon / Spectrum — the delivery.** Sends catch-up summaries, practice nudges, and deadline updates, and ingests inbound student messages via webhook to produce a memory-aware auto-reply. Rendered as a chat thread in the Messages tab.

## What the integration unlocks
The four tools form one loop no single tool delivers: RocketRide reasons over Butterbase-stored context, grounded in XTrace memory, delivered through Photon — and the results (report, tasks, memory, messages, telemetry) flow back into Butterbase. Remove any one and a core capability breaks: no Butterbase = nothing persists; no XTrace = no personalization or deadline reconciliation; no RocketRide = no reasoning; no Photon = no delivery or inbound loop. The agent literally records an event per step, so the integration is visible, not claimed.

## Why it's production-ready
- **Live Butterbase backend** (real DB + auth seam + AI gateway), not a stub; schema provisioned via the Butterbase MCP and matched 1:1 to the typed data model.
- **Graceful degradation:** every integration has a clean adapter with a mock fallback, so the app runs end-to-end with zero credentials and never hard-fails on a gateway error.
- **Verified end-to-end:** catch-up generation, quiz→learning-gap, memory-aware recall, inbound webhook reply, and deadline supersession were all exercised against the live backend; TypeScript typechecks clean.
- **Cost-aware:** the AI gateway defaults to the cheap `claude-haiku-4.5` tier, switchable to `claude-sonnet-4.6` via one env var.

## Demo flow
1. **Start Demo** → seeds CSC 413 and opens the dashboard.
2. Open the course → **Catch-Up** → ask "What did I miss this week?" → **Generate**.
3. Watch the **pipeline timeline** (Butterbase → XTrace → RocketRide → Butterbase → Photon → XTrace) and read the saved report + checklist.
4. **Practice** → answer the REST-vs-WebSocket question wrong → a learning-gap memory is written to XTrace and a Photon nudge is sent.
5. **Memory** → ask "Explain the chat connection part." → a memory-aware answer (live AI gateway) corrects your past mistake; see the **superseded** Wednesday→Friday deadline pair.
6. **Messages** → see the catch-up summary + deadline update; use **Simulate inbound question** for a memory-aware auto-reply.

**Stack:** Next.js (App Router) · Butterbase · RocketRide · XTrace · Photon/Spectrum · Butterbase app `app_2tcinxzld4o0`.
