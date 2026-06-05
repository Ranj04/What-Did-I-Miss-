// =============================================================================
// Live demo seeding for Butterbase.
// Mirrors the in-memory demo (lib/demoData.ts) into the real backend so the
// "Start Demo" / "Reset demo" flow works identically against Butterbase.
// =============================================================================

import {
  createAssignment,
  createCourse,
  ensureUser,
  insertMemoryRef,
  storeMaterial,
  storePhotonMessage,
  updateMemoryRef,
  wipeDemo,
} from "./butterbase";
import {
  DEMO_ASSIGNMENT,
  DEMO_COURSE,
  DEMO_MATERIALS,
  DEMO_USER,
} from "./demoData";

export async function seedDemoLive(): Promise<{ courseId: string; userId: string }> {
  // Clean slate so repeated resets don't accumulate sessions/messages/memories.
  await wipeDemo();

  const user = await ensureUser(DEMO_USER.name, DEMO_USER.email);

  const course = await createCourse({
    userId: user.id,
    name: DEMO_COURSE.name,
    professor: DEMO_COURSE.professor,
    term: DEMO_COURSE.term,
    description: DEMO_COURSE.description,
    currentUnit: DEMO_COURSE.currentUnit,
    currentProject: DEMO_COURSE.currentProject,
  });

  for (const m of DEMO_MATERIALS) {
    await storeMaterial({
      courseId: course.id,
      fileName: m.fileName,
      materialType: m.materialType,
      fileUrl: m.fileUrl,
      parsedText: m.parsedText,
      sourceType: m.sourceType,
    });
  }

  await createAssignment({
    courseId: course.id,
    title: DEMO_ASSIGNMENT.title,
    dueDate: DEMO_ASSIGNMENT.dueDate,
    requirements: DEMO_ASSIGNMENT.requirements,
    rubric: DEMO_ASSIGNMENT.rubric,
    status: DEMO_ASSIGNMENT.status,
  });

  // Course-fact memory (active).
  await insertMemoryRef({
    userId: user.id,
    courseId: course.id,
    memoryText:
      "Course fact: the bearer token from REST login must be reused when opening the chat WebSocket.",
    memoryType: "course_fact",
    source: "ingestion",
  });

  // Deadline pair: Wednesday (superseded) -> Friday (active). This is the
  // visible proof of XTrace self-revising memory, persisted in Butterbase.
  const oldDeadline = await insertMemoryRef({
    userId: user.id,
    courseId: course.id,
    memoryText: "Project 2 (Chat Client) is due Wednesday at 11:59 PM.",
    memoryType: "deadline",
    source: "ingestion",
  });
  await updateMemoryRef(oldDeadline.id, { status: "superseded" });
  await insertMemoryRef({
    userId: user.id,
    courseId: course.id,
    memoryText: "Project 2 (Chat Client) was extended to Friday at 11:59 PM.",
    memoryType: "deadline",
    source: "contradiction",
    supersedesMemoryId: oldDeadline.id,
  });

  await storePhotonMessage({
    userId: user.id,
    courseId: course.id,
    platform: "slack",
    direction: "outbound",
    messageText: "Deadline update: Project 2 is now due Friday at 11:59 PM.",
    status: "mock",
  });

  return { courseId: course.id, userId: user.id };
}
