// =============================================================================
// XTrace adapter — PERSISTENT, SELF-REVISING student/course memory.
// This is what makes the agent *remember* learning gaps and *revise* facts
// (e.g. a deadline) when new information contradicts old memory.
//
// Memory is mirrored into Butterbase's `memory_events` table (via
// insertMemoryRef / updateMemoryRef) so the UI can query it and so it persists
// in the real backend. LIVE MODE additionally calls the XTrace API for semantic
// embedding/recall; DEMO MODE uses keyword overlap over the mirror.
// =============================================================================

import {
  insertMemoryRef,
  listMemoryRefs,
  listMemoryRefsByUser,
  updateMemoryRef,
} from "./butterbase";
import { xtraceConnected } from "./config";
import type { MemoryEvent } from "./types";

const BASE = process.env.XTRACE_BASE_URL ?? "https://api.xtrace.ai";
const KEY = process.env.XTRACE_API_KEY;
const PROJECT = process.env.XTRACE_PROJECT_ID;

export function isLive(): boolean {
  return xtraceConnected();
}

async function xtFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
      "X-Project-Id": PROJECT ?? "",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`XTrace ${path} -> ${res.status}`);
  return res.json();
}

export interface WriteMemoryInput {
  userId: string;
  courseId: string;
  memoryText: string;
  memoryType: MemoryEvent["memoryType"];
  source: MemoryEvent["source"];
  supersedesMemoryId?: string;
}

export async function writeMemory(input: WriteMemoryInput): Promise<MemoryEvent> {
  if (isLive()) {
    // TODO(xtrace-live): POST the durable fact to XTrace; it embeds + indexes
    // for semantic recall and returns its own memory id (kept on the mirror row
    // in a future column). For now we still persist to the Butterbase mirror.
    try {
      await xtFetch("/memories", { method: "POST", body: JSON.stringify(input) });
    } catch {
      /* fall through to mirror */
    }
  }
  // Butterbase mirror assigns id + created_at.
  return insertMemoryRef(input);
}

// Lightweight keyword overlap scorer — the demo's stand-in for semantic search.
function score(query: string, text: string): number {
  const q = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const t = text.toLowerCase();
  let hits = 0;
  q.forEach((w) => {
    if (t.includes(w)) hits += 1;
  });
  return q.size ? hits / q.size : 0;
}

export async function searchMemory(
  query: string,
  context: { courseId: string; userId?: string; includeSuperseded?: boolean }
): Promise<MemoryEvent[]> {
  if (isLive()) {
    // TODO(xtrace-live): semantic search endpoint with project + course scoping.
    try {
      const res = await xtFetch("/memories/search", {
        method: "POST",
        body: JSON.stringify({ query, ...context }),
      });
      if (Array.isArray(res?.results)) return res.results as MemoryEvent[];
    } catch {
      /* fall through to mirror */
    }
  }

  const pool = (await listMemoryRefs(context.courseId)).filter(
    (m) => context.includeSuperseded || m.status === "active"
  );
  return pool
    .map((m) => ({ m, s: score(query, m.memoryText) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

export async function supersedeMemory(
  oldMemoryId: string,
  newMemory: WriteMemoryInput
): Promise<{ superseded: MemoryEvent | undefined; created: MemoryEvent }> {
  const old = await updateMemoryRef(oldMemoryId, { status: "superseded" });

  if (isLive()) {
    // TODO(xtrace-live): XTrace supports first-class supersession so the history
    // chain is preserved and recall returns the current fact by default.
    try {
      await xtFetch(`/memories/${oldMemoryId}/supersede`, {
        method: "POST",
        body: JSON.stringify(newMemory),
      });
    } catch {
      /* fall through */
    }
  }

  const created = await writeMemory({ ...newMemory, supersedesMemoryId: oldMemoryId });
  return { superseded: old, created };
}

export async function getCourseMemories(courseId: string): Promise<MemoryEvent[]> {
  return (await listMemoryRefs(courseId)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getStudentMemories(userId: string): Promise<MemoryEvent[]> {
  return (await listMemoryRefsByUser(userId)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getSupersededMemories(courseId: string): Promise<MemoryEvent[]> {
  return (await listMemoryRefs(courseId)).filter((m) => m.status === "superseded");
}
