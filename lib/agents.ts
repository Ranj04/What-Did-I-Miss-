// =============================================================================
// Agent orchestration — wires the four hackathon technologies into one flow.
// This is where "removing any one tool breaks the experience" becomes literal:
//   • Butterbase: source materials in, report + tasks out (steps 1 & 4)
//   • XTrace:     memory search in, new memory out (steps 2 & 6)
//   • RocketRide: the catch-up reasoning itself (step 3)
//   • Photon:     delivery of the summary (step 5)
// Each step is recorded as an AgentEvent so the UI can render a live timeline.
// =============================================================================

import {
  getCourse,
  listMaterials,
  listMemoryRefs,
  storeAgentEvent,
  storeCatchUpSession,
  storeTasks,
} from "./butterbase";
import {
  runCatchUpGenerationPipeline,
  runContradictionDetectionPipeline,
} from "./rocketride";
import { sendCatchUpSummary, sendDeadlineUpdate } from "./photon";
import { searchMemory, supersedeMemory, writeMemory } from "./xtrace";
import type { AgentEvent, CatchUpSession, CatchUpTask } from "./types";

export interface CatchUpAgentInput {
  userId: string;
  courseId: string;
  question: string;
  missedStartDate: string;
  missedEndDate: string;
}

export interface CatchUpAgentResult {
  session: CatchUpSession;
  tasks: CatchUpTask[];
  events: AgentEvent[];
}

export async function runCatchUpAgent(
  input: CatchUpAgentInput
): Promise<CatchUpAgentResult> {
  // Buffer step telemetry; it is persisted to Butterbase `agent_events` once the
  // catch-up session exists, so every event carries the real session id (a uuid
  // in live mode). Order in the buffer == order in the timeline.
  type Draft = {
    eventType: AgentEvent["eventType"];
    label: string;
    input: unknown;
    output: unknown;
  };
  const drafts: Draft[] = [];
  const record = async (
    eventType: AgentEvent["eventType"],
    label: string,
    payloadIn: unknown,
    payloadOut: unknown
  ) => {
    drafts.push({ eventType, label, input: payloadIn, output: payloadOut });
  };

  const course = await getCourse(input.courseId);
  if (!course) throw new Error("Course not found");

  // Step 1 — Butterbase: read course materials
  const materials = await listMaterials(input.courseId);
  await record(
    "read_butterbase",
    "Reading Butterbase course materials",
    { courseId: input.courseId },
    { materialCount: materials.length, files: materials.map((m) => m.fileName) }
  );

  // Step 2 — XTrace: search persistent memory
  const memories = await searchMemory(input.question, {
    courseId: input.courseId,
    userId: input.userId,
    includeSuperseded: false,
  });
  const allCourseMemories = await listMemoryRefs(input.courseId);
  await record(
    "search_xtrace",
    "Searching XTrace memory",
    { query: input.question },
    { matched: memories.map((m) => m.memoryText) }
  );

  // Step 2b — RocketRide D: detect deadline contradiction from announcements,
  // and supersede stale memory in XTrace (keeps the demo's deadline pair live).
  const announcement = materials.find((m) => m.sourceType === "announcement");
  if (announcement) {
    const contradiction = await runContradictionDetectionPipeline({
      newText: announcement.parsedText,
      priorMemories: allCourseMemories,
    });
    if (contradiction.contradicts) {
      // Only supersede an active deadline memory that does NOT already reflect
      // the new fact — otherwise re-running catch-up would needlessly re-write
      // the (already-correct) deadline. Idempotent against live data.
      const newDay = (contradiction.newFact.match(
        /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/
      )?.[0] ?? "").toLowerCase();
      const stale = allCourseMemories.find(
        (m) =>
          m.memoryType === "deadline" &&
          m.status === "active" &&
          !(newDay && m.memoryText.toLowerCase().includes(newDay))
      );
      if (stale) {
        await supersedeMemory(stale.id, {
          userId: input.userId,
          courseId: input.courseId,
          memoryText: contradiction.newFact,
          memoryType: "deadline",
          source: "contradiction",
        });
        await record(
          "supersede_memory",
          "Reconciling changed deadline in XTrace",
          { old: stale.memoryText },
          { new: contradiction.newFact }
        );

        // Contradiction flow → Photon: the deadline genuinely changed, so push a
        // deadline-update message (in addition to the catch-up summary below).
        // Pass the bare fact — sendDeadlineUpdate adds the "Deadline update:" prefix.
        const dl = await sendDeadlineUpdate(
          input.userId,
          input.courseId,
          contradiction.newFact
        );
        await record(
          "send_photon",
          "Sending deadline update through Photon",
          { old: stale.memoryText },
          { messageId: dl.id, status: dl.status }
        );
      }
    }
  }

  // Step 3 — RocketRide B: generate the structured catch-up report
  const result = await runCatchUpGenerationPipeline({
    course,
    materials,
    memories: await listMemoryRefs(input.courseId),
    question: input.question,
    missedStartDate: input.missedStartDate,
    missedEndDate: input.missedEndDate,
  });
  await record(
    "run_rocketride",
    "Running RocketRide catch-up pipeline",
    { question: input.question },
    { summary: result.summary, taskCount: result.tasks.length }
  );

  // Step 4 — Butterbase: persist the report + checklist
  const session = await storeCatchUpSession({
    userId: input.userId,
    courseId: input.courseId,
    missedStartDate: input.missedStartDate,
    missedEndDate: input.missedEndDate,
    userQuestion: input.question,
    summary: result.summary,
    importantUpdates: result.importantUpdates,
    missedConcepts: result.missedConcepts,
    assignmentImpact: result.assignmentImpact,
    personalizedWarning: result.personalizedWarning,
    questionsToAsk: result.questionsToAsk,
  });
  const tasks = await storeTasks(
    session.id,
    result.tasks.map((t) => ({ ...t, status: "todo" as const }))
  );
  await record(
    "save_butterbase",
    "Saving report to Butterbase",
    { sessionId: session.id },
    { tasks: tasks.length }
  );

  // Step 5 — Photon: deliver a concise summary
  const msg = await sendCatchUpSummary(
    input.userId,
    input.courseId,
    truncate(result.summary, 180),
    session.id
  );
  await record(
    "send_photon",
    "Sending summary through Photon",
    { platform: msg.platform },
    { messageId: msg.id, status: msg.status }
  );

  // Step 6 — XTrace: write a new memory capturing this catch-up
  const newMem = await writeMemory({
    userId: input.userId,
    courseId: input.courseId,
    memoryText: `Student caught up on "${course.currentUnit}" for the ${course.currentProject}. Focus areas: REST vs WebSocket and token reuse.`,
    memoryType: "course_fact",
    source: "catchup",
  });
  await record(
    "write_xtrace",
    "Writing new memory to XTrace",
    { courseId: input.courseId },
    { memoryId: newMem.id }
  );

  // Flush buffered telemetry to Butterbase with the real session id.
  const events: AgentEvent[] = [];
  for (const d of drafts) {
    events.push(
      await storeAgentEvent({
        sessionId: session.id,
        eventType: d.eventType,
        label: d.label,
        status: "done",
        input: d.input,
        output: d.output,
      })
    );
  }

  return { session, tasks, events };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
