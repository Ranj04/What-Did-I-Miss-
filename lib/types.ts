// =============================================================================
// Core data models for "What Did I Miss?"
// These interfaces are the contract shared by the service layer (Butterbase),
// the API routes, and the React UI. Keep them framework-agnostic.
// =============================================================================

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  createdAt: string;
}

export interface Course {
  id: ID;
  userId: ID;
  name: string;
  professor: string;
  term: string;
  description: string;
  currentUnit?: string;
  currentProject?: string;
  createdAt: string;
}

export type SourceType =
  | "syllabus"
  | "lecture_slides"
  | "assignment"
  | "announcement"
  | "notes"
  | "group_chat_summary"
  | "other";

export interface CourseMaterial {
  id: ID;
  courseId: ID;
  fileName: string;
  materialType: string; // mime-ish label, e.g. "application/pdf", "text/markdown"
  fileUrl: string; // Butterbase storage URL (or mock data: URL)
  parsedText: string; // text extracted by the ingestion pipeline
  uploadedAt: string;
  sourceType: SourceType;
}

export type AssignmentStatus = "not_started" | "in_progress" | "submitted" | "graded";

export interface Assignment {
  id: ID;
  courseId: ID;
  title: string;
  dueDate: string;
  requirements: string[];
  rubric: string;
  status: AssignmentStatus;
}

export interface CatchUpSession {
  id: ID;
  userId: ID;
  courseId: ID;
  missedStartDate: string;
  missedEndDate: string;
  userQuestion: string;
  summary: string;
  importantUpdates: string[];
  missedConcepts: { concept: string; why: string }[];
  assignmentImpact: string;
  personalizedWarning: string;
  questionsToAsk: string[];
  createdAt: string;
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "done";

export interface CatchUpTask {
  id: ID;
  catchUpSessionId: ID;
  taskText: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
}

export interface QuizAttempt {
  id: ID;
  userId: ID;
  courseId: ID;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  conceptTag: string;
  createdAt: string;
}

export type AgentEventType =
  | "read_butterbase"
  | "search_xtrace"
  | "run_rocketride"
  | "save_butterbase"
  | "send_photon"
  | "write_xtrace"
  | "detect_contradiction"
  | "supersede_memory"
  | "grade_quiz";

export interface AgentEvent {
  id: ID;
  sessionId: ID;
  eventType: AgentEventType;
  label: string; // human readable step label for the timeline
  status: "pending" | "running" | "done";
  input: unknown;
  output: unknown;
  createdAt: string;
}

export type Platform = "slack" | "discord" | "telegram" | "whatsapp" | "imessage";
export type MessageDirection = "outbound" | "inbound";
// "mock" is retained as a synonym for "demo" so older seed data still renders.
export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "received"
  | "failed"
  | "demo"
  | "mock";

export interface PhotonMessage {
  id: ID;
  userId: ID;
  courseId: ID;
  platform: Platform;
  direction: MessageDirection;
  messageText: string;
  relatedSessionId?: ID;
  createdAt: string;
  status: MessageStatus;
  // Populated on a real (live) send; demo-only and not persisted to the live
  // Butterbase schema (see storePhotonMessage).
  providerMessageId?: string;
  errorMessage?: string;
}

export type MemoryType =
  | "learning_gap"
  | "deadline"
  | "course_fact"
  | "preference"
  | "clarification";

export type MemorySource = "ingestion" | "catchup" | "quiz" | "contradiction" | "manual";
export type MemoryStatus = "active" | "superseded";

export interface MemoryEvent {
  id: ID;
  userId: ID;
  courseId: ID;
  memoryText: string;
  memoryType: MemoryType;
  source: MemorySource;
  supersedesMemoryId?: ID;
  status: MemoryStatus;
  createdAt: string;
}

// ---- Integration / config status -------------------------------------------

export type ServiceName = "butterbase" | "rocketride" | "xtrace" | "photon";

export interface ServiceStatus {
  name: ServiceName;
  label: string;
  connected: boolean; // true = real credentials present, false = demo mode
  detail: string;
  missingEnv: string[];
}
