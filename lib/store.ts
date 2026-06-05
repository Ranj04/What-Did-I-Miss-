// =============================================================================
// In-memory store — the DEMO-MODE fallback for Butterbase.
// Persisted on globalThis so it survives Next.js hot-reloads in dev.
// When real Butterbase credentials are present, lib/butterbase.ts uses the
// real data API instead of this store (see the TODOs there).
// =============================================================================

import { freshDemoSeed } from "./demoData";
import type {
  AgentEvent,
  Assignment,
  CatchUpSession,
  CatchUpTask,
  Course,
  CourseMaterial,
  MemoryEvent,
  PhotonMessage,
  QuizAttempt,
  User,
} from "./types";

export interface DB {
  users: User[];
  courses: Course[];
  materials: CourseMaterial[];
  assignments: Assignment[];
  catchUpSessions: CatchUpSession[];
  catchUpTasks: CatchUpTask[];
  quizAttempts: QuizAttempt[];
  agentEvents: AgentEvent[];
  photonMessages: PhotonMessage[];
  memories: MemoryEvent[];
}

function seed(): DB {
  const s = freshDemoSeed();
  return {
    users: s.users,
    courses: s.courses,
    materials: s.materials,
    assignments: s.assignments,
    catchUpSessions: [],
    catchUpTasks: [],
    quizAttempts: [],
    agentEvents: [],
    photonMessages: s.photonMessages,
    memories: s.memories,
  };
}

const g = globalThis as unknown as { __wdim_db?: DB };

export function db(): DB {
  if (!g.__wdim_db) g.__wdim_db = seed();
  return g.__wdim_db;
}

export function resetDb(): DB {
  g.__wdim_db = seed();
  return g.__wdim_db;
}

let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function now(): string {
  return new Date().toISOString();
}
