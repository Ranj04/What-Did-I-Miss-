// =============================================================================
// RocketRide adapter — AI PIPELINES & MULTI-AGENT WORKFLOWS.
// RocketRide is the "brain": it transforms raw course context + memory into
// structured catch-up reports, quizzes, and contradiction findings. The API
// routes orchestrate the surrounding I/O (Butterbase reads/writes, XTrace
// memory, Photon sends) and emit AgentEvents for the pipeline timeline.
//
// Pipelines (also documented in the README):
//   A runDocumentIngestionPipeline     — parse + classify + extract a material
//   B runCatchUpGenerationPipeline      — the core catch-up report + checklist
//   C runQuizGenerationPipeline         — practice questions + grading
//   D runContradictionDetectionPipeline — detect a changed fact (e.g. deadline)
//   E runPhotonReplyPipeline            — memory-aware reply to an inbound msg
//
// DEMO MODE: deterministic mock outputs with realistic delays.
// LIVE MODE: POST to RocketRide pipeline runs by id (env: ROCKETRIDE_PIPELINE_*).
// =============================================================================

import { butterbaseConnected, rocketrideConnected } from "./config";
import { modelGatewayChat } from "./butterbase";
import type {
  Course,
  CourseMaterial,
  MemoryEvent,
  SourceType,
  TaskPriority,
} from "./types";

const BASE = process.env.ROCKETRIDE_BASE_URL ?? "https://api.rocketride.ai";
const KEY = process.env.ROCKETRIDE_API_KEY;

const PIPELINE_IDS = {
  ingestion: process.env.ROCKETRIDE_PIPELINE_INGESTION_ID,
  catchup: process.env.ROCKETRIDE_PIPELINE_CATCHUP_ID,
  quiz: process.env.ROCKETRIDE_PIPELINE_QUIZ_ID,
  contradiction: process.env.ROCKETRIDE_PIPELINE_CONTRADICTION_ID,
  photonReply: process.env.ROCKETRIDE_PIPELINE_PHOTON_REPLY_ID,
};

export function isLive(): boolean {
  return rocketrideConnected();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// TODO(rocketride-live): trigger a pipeline run and poll/stream its result.
async function runPipeline<T>(pipelineId: string | undefined, input: unknown): Promise<T> {
  const res = await fetch(`${BASE}/v1/pipelines/${pipelineId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ input }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RocketRide ${pipelineId} -> ${res.status}`);
  const json = await res.json();
  return json.output as T;
}

// ---------------------------------------------------------------------------
// Pipeline A — Document Ingestion
// ---------------------------------------------------------------------------
export interface IngestionResult {
  sourceType: SourceType;
  extractedDates: string[];
  concepts: string[];
  requirements: string[];
  clarifications: string[];
  durableFacts: string[]; // candidate memories to write to XTrace
}

export async function runDocumentIngestionPipeline(
  material: Pick<CourseMaterial, "fileName" | "parsedText" | "sourceType">
): Promise<IngestionResult> {
  if (isLive() && PIPELINE_IDS.ingestion) {
    return runPipeline<IngestionResult>(PIPELINE_IDS.ingestion, material);
  }
  await delay(450);

  const text = material.parsedText.toLowerCase();
  const concepts: string[] = [];
  if (text.includes("rest")) concepts.push("REST request/response");
  if (text.includes("bearer") || text.includes("token")) concepts.push("Bearer token auth");
  if (text.includes("websocket")) concepts.push("WebSocket persistent connection");
  if (text.includes("timestamp")) concepts.push("Message timestamps");
  if (text.includes("leave") || text.includes("exit")) concepts.push("Clean leave-room");

  const dateMatches = material.parsedText.match(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g
  );
  const clarifications: string[] = [];
  if (text.includes("reuse") && text.includes("token"))
    clarifications.push("Reuse the login bearer token when opening the chat WebSocket.");
  if (text.includes("mismatch"))
    clarifications.push("Use the exact room id string from GET /rooms in the WebSocket URL.");

  const requirements =
    material.sourceType === "assignment"
      ? [
          "Login + token storage",
          "Room list fetch",
          "WebSocket connect with token",
          "Timestamped messages",
          "Clean leave-room",
          "Two-user test",
        ]
      : [];

  return {
    sourceType: material.sourceType,
    extractedDates: Array.from(new Set(dateMatches ?? [])),
    concepts,
    requirements,
    clarifications,
    durableFacts: clarifications,
  };
}

// ---------------------------------------------------------------------------
// Pipeline B — Catch-Up Generation (the core report)
// ---------------------------------------------------------------------------
export interface CatchUpInput {
  course: Course;
  materials: CourseMaterial[];
  memories: MemoryEvent[];
  question: string;
  missedStartDate: string;
  missedEndDate: string;
}

export interface CatchUpTaskDraft {
  taskText: string;
  priority: TaskPriority;
  estimatedMinutes: number;
}

export interface CatchUpResult {
  summary: string;
  importantUpdates: string[];
  missedConcepts: { concept: string; why: string }[];
  assignmentImpact: string;
  personalizedWarning: string;
  questionsToAsk: string[];
  tasks: CatchUpTaskDraft[];
}

export async function runCatchUpGenerationPipeline(
  input: CatchUpInput
): Promise<CatchUpResult> {
  if (isLive() && PIPELINE_IDS.catchup) {
    return runPipeline<CatchUpResult>(PIPELINE_IDS.catchup, input);
  }
  await delay(900);

  const hasGapMemory = input.memories.some((m) => m.memoryType === "learning_gap");
  const deadlineMemory = input.memories.find(
    (m) => m.memoryType === "deadline" && m.status === "active"
  );
  const announcement = input.materials.find((m) => m.sourceType === "announcement");

  // Personalized from memory: if XTrace has a learning-gap memory we name it
  // explicitly ("you previously..."); otherwise we still surface the warning
  // tied to the course's most-confused concept.
  const personalizedWarning = hasGapMemory
    ? "You previously confused REST and WebSocket roles. Remember: REST is used for login and fetching room data; WebSocket stays open for real-time chat messages."
    : "Heads up — students most often confuse REST and WebSocket roles here. Remember: REST is used for login and fetching room data; WebSocket stays open for real-time chat messages.";

  return {
    summary:
      "You missed the transition from REST-based login and room fetching into persistent WebSocket " +
      "communication for live chat. This matters because the Chat Client Project now requires login, " +
      "room selection, real-time messages, timestamps, and clean room exit behavior.",
    importantUpdates: [
      deadlineMemory
        ? "Deadline moved from Wednesday to Friday at 11:59 PM."
        : "Check the latest deadline for the project.",
      "The professor clarified that the bearer token from login must be reused when connecting to the chat service.",
      announcement
        ? "An announcement was posted during the week you missed — read it in full."
        : "Review professor announcements for changes.",
    ],
    missedConcepts: [
      {
        concept: "REST APIs and Bearer Tokens (Lecture 5)",
        why: "Login and room-list fetching are request/response calls; the returned token authenticates everything else.",
      },
      {
        concept: "WebSockets and Live Chat (Lecture 6)",
        why: "Real-time messaging needs a persistent connection opened after room selection, reusing the same token.",
      },
      {
        concept: "Room ID handling (group chat)",
        why: "A common bug: the room id from REST must match the id used in the WebSocket URL exactly.",
      },
    ],
    assignmentImpact:
      "The Chat Client Project deadline moved from Wednesday to Friday at 11:59 PM. The professor " +
      "clarified that the bearer token from login must be reused when connecting to the chat service. " +
      "Your client must log in (REST), list rooms (REST), then open a WebSocket to the selected room " +
      "using that token, render timestamped messages, and leave rooms cleanly.",
    personalizedWarning,
    questionsToAsk: [
      "Should the WebSocket reconnect automatically if the connection drops mid-session?",
      "Is the room id expected as a string or a number in the WebSocket URL?",
      "Do timestamps need to be in local time or UTC for grading?",
    ],
    tasks: [
      { taskText: "Review login endpoint and token storage", priority: "high", estimatedMinutes: 20 },
      { taskText: "Confirm room list API response format", priority: "high", estimatedMinutes: 15 },
      { taskText: "Implement WebSocket connection after room selection", priority: "high", estimatedMinutes: 45 },
      { taskText: "Display incoming messages with timestamps", priority: "medium", estimatedMinutes: 30 },
      { taskText: "Add leave-room behavior", priority: "medium", estimatedMinutes: 20 },
      { taskText: "Test with two users", priority: "high", estimatedMinutes: 25 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Pipeline C — Quiz generation + weakness detection (grading)
// ---------------------------------------------------------------------------
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  conceptTag: string;
  explanation: string;
}

export async function runQuizGenerationPipeline(input: {
  course: Course;
  materials: CourseMaterial[];
}): Promise<QuizQuestion[]> {
  if (isLive() && PIPELINE_IDS.quiz) {
    return runPipeline<QuizQuestion[]>(PIPELINE_IDS.quiz, input);
  }
  await delay(500);
  return [
    {
      id: "q_rest_vs_ws",
      question:
        "In the Chat Client Project, which protocol keeps a connection open for real-time messages?",
      options: ["REST", "WebSocket", "Both equally", "Neither — it polls"],
      correctAnswer: "WebSocket",
      conceptTag: "rest_vs_websocket",
      explanation:
        "REST is request/response and closes after each call. The WebSocket stays open so messages can flow in real time.",
    },
    {
      id: "q_token_reuse",
      question: "Where does the token used to open the chat WebSocket come from?",
      options: [
        "A new token generated by the WebSocket server",
        "The bearer token returned by REST login",
        "No token is needed for WebSockets",
        "The room id doubles as the token",
      ],
      correctAnswer: "The bearer token returned by REST login",
      conceptTag: "token_reuse",
      explanation:
        "The professor clarified that the same bearer token from REST login must be reused when connecting to the chat service.",
    },
  ];
}

export interface GradeResult {
  isCorrect: boolean;
  correctAnswer: string;
  conceptTag: string;
  feedback: string;
  learningGapMemory?: string; // written to XTrace when the answer is wrong
}

export async function gradeQuizAnswer(input: {
  question: QuizQuestion;
  studentAnswer: string;
}): Promise<GradeResult> {
  await delay(350);
  const isCorrect = input.studentAnswer.trim() === input.question.correctAnswer.trim();
  let learningGapMemory: string | undefined;
  if (!isCorrect && input.question.conceptTag === "rest_vs_websocket") {
    learningGapMemory =
      "Student struggles to distinguish REST request/response flow from persistent WebSocket connections.";
  } else if (!isCorrect) {
    learningGapMemory = `Student answered incorrectly on concept "${input.question.conceptTag}". Reinforce in future explanations.`;
  }
  return {
    isCorrect,
    correctAnswer: input.question.correctAnswer,
    conceptTag: input.question.conceptTag,
    feedback: isCorrect
      ? "Correct! " + input.question.explanation
      : "Not quite. " + input.question.explanation,
    learningGapMemory,
  };
}

// ---------------------------------------------------------------------------
// Pipeline D — Contradiction detection (e.g. a changed deadline)
// ---------------------------------------------------------------------------
export interface ContradictionResult {
  contradicts: boolean;
  newFact: string;
  oldFactSummary?: string;
  updateMessage: string; // for Photon
}

export async function runContradictionDetectionPipeline(input: {
  newText: string;
  priorMemories: MemoryEvent[];
}): Promise<ContradictionResult> {
  if (isLive() && PIPELINE_IDS.contradiction) {
    return runPipeline<ContradictionResult>(PIPELINE_IDS.contradiction, input);
  }
  await delay(500);

  const lower = input.newText.toLowerCase();
  const mentionsDeadline =
    lower.includes("due") || lower.includes("extend") || lower.includes("deadline");
  const prior = input.priorMemories.find(
    (m) => m.memoryType === "deadline" && m.status === "active"
  );

  if (mentionsDeadline && prior) {
    // The NEW deadline is the day after "to" ("extended from Wednesday to Friday"
    // → Friday), not the first weekday mentioned. Fall back to the last weekday.
    const DAYS = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/;
    const toMatch = input.newText.match(new RegExp(`to\\s+${DAYS.source}`, "i"));
    const allDays = input.newText.match(new RegExp(DAYS.source, "gi"));
    const newDay = toMatch?.[1] ?? allDays?.[allDays.length - 1] ?? "a new date";
    return {
      contradicts: true,
      newFact: `Project 2 (Chat Client) was extended to ${newDay} at 11:59 PM.`,
      oldFactSummary: prior.memoryText,
      updateMessage: `Deadline update: Project 2 is now due ${newDay} at 11:59 PM.`,
    };
  }

  return {
    contradicts: false,
    newFact: input.newText,
    updateMessage: "",
  };
}

// ---------------------------------------------------------------------------
// Pipeline E — Memory-aware Photon reply
// ---------------------------------------------------------------------------
export async function runPhotonReplyPipeline(input: {
  incomingText: string;
  memories: MemoryEvent[];
}): Promise<string> {
  if (isLive() && PIPELINE_IDS.photonReply) {
    return runPipeline<string>(PIPELINE_IDS.photonReply, input);
  }

  // RocketRide's reasoning step runs on the Butterbase AI Model Gateway whenever
  // the backend is live: a real LLM call grounded in the student's recalled
  // XTrace memory. This is the deep RocketRide × Butterbase × XTrace seam. It
  // degrades gracefully to the deterministic reply below in pure demo mode or on
  // any gateway error, so the demo never breaks.
  if (butterbaseConnected()) {
    try {
      const memoryContext = input.memories.length
        ? input.memories.map((m) => `- (${m.memoryType}) ${m.memoryText}`).join("\n")
        : "(no prior memory on file for this student)";
      const out = await modelGatewayChat({
        system:
          "You are a course catch-up assistant inside a student messaging app. Reply in 2–4 short, " +
          "plain-text sentences (no markdown). Ground the answer in the student's remembered context " +
          "when relevant, and if a memory shows a past misunderstanding, gently correct it by name.",
        prompt:
          `Student message: "${input.incomingText}"\n\n` +
          `Remembered context (retrieved from XTrace memory):\n${memoryContext}\n\n` +
          "Write the reply the student should receive.",
        maxTokens: 300,
      });
      const text = out.trim();
      if (text && !text.startsWith("「demo-gateway」")) return text;
    } catch {
      /* fall through to the deterministic reply */
    }
  }

  await delay(450);

  const gap = input.memories.find((m) => m.memoryType === "learning_gap");
  const text = input.incomingText.toLowerCase();

  if (text.includes("connection") || text.includes("websocket") || text.includes("chat")) {
    if (gap) {
      return (
        "Since you previously mixed up REST and WebSocket: REST is used for login and fetching the " +
        "room list (request/response, then it closes). The chat connection uses a WebSocket that stays " +
        "open after you pick a room — and it reuses the same bearer token from login."
      );
    }
    return (
      "The chat connection uses a WebSocket opened after room selection, reusing the bearer token from " +
      "REST login. REST handles login and the room list; the WebSocket carries the live messages."
    );
  }

  const deadline = input.memories.find(
    (m) => m.memoryType === "deadline" && m.status === "active"
  );
  if (deadline && (text.includes("due") || text.includes("deadline"))) {
    return deadline.memoryText;
  }

  return "I can help you catch up — open the Catch-Up tab and tell me what week you missed.";
}
