// =============================================================================
// Demo seed for CSC 413 — Software Development.
// Used both to populate the mock Butterbase store and to drive the scripted
// "Start Demo" experience (materials, memories, deadline contradiction, msgs).
// =============================================================================

import type {
  Assignment,
  Course,
  CourseMaterial,
  MemoryEvent,
  PhotonMessage,
  User,
} from "./types";

export const DEMO_USER: User = {
  id: "user_demo",
  name: "Demo Student",
  email: "student@example.edu",
  createdAt: "2026-01-10T09:00:00.000Z",
};

export const DEMO_COURSE_ID = "course_csc413";

export const DEMO_COURSE: Course = {
  id: DEMO_COURSE_ID,
  userId: DEMO_USER.id,
  name: "CSC 413 — Software Development",
  professor: "Dr. Souza",
  term: "Spring 2026",
  description:
    "Project-based software engineering. Current unit covers REST APIs and WebSockets; the term project is a real-time Chat Client.",
  currentUnit: "REST APIs and WebSockets",
  currentProject: "Chat Client Project",
  createdAt: "2026-01-10T09:00:00.000Z",
};

export const DEMO_MATERIALS: CourseMaterial[] = [
  {
    id: "mat_lecture5",
    courseId: DEMO_COURSE_ID,
    fileName: "Lecture5-REST-APIs-and-Bearer-Tokens.pdf",
    materialType: "application/pdf",
    fileUrl: "mock://storage/csc413/lecture5.pdf",
    sourceType: "lecture_slides",
    uploadedAt: "2026-05-25T15:00:00.000Z",
    parsedText:
      "Lecture 5 — REST APIs and Bearer Tokens. REST uses stateless request/response over HTTP. " +
      "Login: POST /auth/login with email+password returns a JWT bearer token. " +
      "Authenticated requests send Authorization: Bearer <token>. " +
      "GET /rooms returns the list of available chat rooms as JSON [{id, name}]. " +
      "Key idea: REST is request/response — the connection closes after each call.",
  },
  {
    id: "mat_lecture6",
    courseId: DEMO_COURSE_ID,
    fileName: "Lecture6-WebSockets-and-Live-Chat.pdf",
    materialType: "application/pdf",
    fileUrl: "mock://storage/csc413/lecture6.pdf",
    sourceType: "lecture_slides",
    uploadedAt: "2026-05-27T15:00:00.000Z",
    parsedText:
      "Lecture 6 — WebSockets and Live Chat. After selecting a room via REST, open a persistent " +
      "WebSocket connection to wss://chat/rooms/:id. The SAME bearer token from login must be sent " +
      "when connecting. Messages flow bidirectionally and stay open. Render incoming messages with " +
      "timestamps. Implement a clean leave-room: close the socket and notify the server. " +
      "Contrast with REST: WebSocket stays open for real-time messages.",
  },
  {
    id: "mat_assignment",
    courseId: DEMO_COURSE_ID,
    fileName: "Assignment-Chat-Client-Project.md",
    materialType: "text/markdown",
    fileUrl: "mock://storage/csc413/chat-client-project.md",
    sourceType: "assignment",
    uploadedAt: "2026-05-20T15:00:00.000Z",
    parsedText:
      "Chat Client Project. Build a chat client that: (1) logs in via REST and stores the bearer token, " +
      "(2) fetches and displays the room list, (3) connects to a selected room over WebSocket using the " +
      "stored token, (4) shows incoming messages with timestamps, (5) supports leaving a room cleanly, " +
      "(6) is tested with two simultaneous users. Originally due Wednesday 11:59 PM.",
  },
  {
    id: "mat_announcement",
    courseId: DEMO_COURSE_ID,
    fileName: "Announcement-Deadline-Extended.txt",
    materialType: "text/plain",
    fileUrl: "mock://storage/csc413/announcement.txt",
    sourceType: "announcement",
    uploadedAt: "2026-06-01T18:30:00.000Z",
    parsedText:
      "Announcement from Dr. Souza: The Chat Client Project deadline is extended from Wednesday to " +
      "Friday at 11:59 PM. Reminder: reuse the bearer token from login when connecting to the chat " +
      "WebSocket service — several students forgot this.",
  },
  {
    id: "mat_groupchat",
    courseId: DEMO_COURSE_ID,
    fileName: "GroupChat-Summary-Room-ID-Bug.txt",
    materialType: "text/plain",
    fileUrl: "mock://storage/csc413/groupchat.txt",
    sourceType: "group_chat_summary",
    uploadedAt: "2026-06-02T21:10:00.000Z",
    parsedText:
      "Group chat summary: Several people hit a 'room ID mismatch' bug — the room id from GET /rooms " +
      "didn't match the id used in the WebSocket URL (string vs number). Fix: use the exact id string " +
      "returned by the REST call. Also confirmed the timestamp should be rendered in local time.",
  },
];

export const DEMO_ASSIGNMENT: Assignment = {
  id: "asst_chatclient",
  courseId: DEMO_COURSE_ID,
  title: "Chat Client Project",
  dueDate: "2026-06-05T23:59:00.000Z", // Friday (post-extension)
  status: "in_progress",
  rubric:
    "Login + token storage (20%), Room list (15%), WebSocket connect with token (25%), " +
    "Timestamped messages (20%), Clean leave-room (10%), Two-user test (10%).",
  requirements: [
    "Log in via REST and store the bearer token",
    "Fetch and display the room list",
    "Connect to a room over WebSocket using the stored token",
    "Display incoming messages with timestamps",
    "Support leaving a room cleanly",
    "Test with two simultaneous users",
  ],
};

// Initial memory graph. Note the deadline pair: the Wednesday memory is
// SUPERSEDED by the Friday memory to demonstrate self-revising memory.
export const DEMO_MEMORIES: MemoryEvent[] = [
  {
    id: "mem_deadline_old",
    userId: DEMO_USER.id,
    courseId: DEMO_COURSE_ID,
    memoryText: "Project 2 (Chat Client) is due Wednesday at 11:59 PM.",
    memoryType: "deadline",
    source: "ingestion",
    status: "superseded",
    supersedesMemoryId: undefined,
    createdAt: "2026-05-20T16:00:00.000Z",
  },
  {
    id: "mem_deadline_new",
    userId: DEMO_USER.id,
    courseId: DEMO_COURSE_ID,
    memoryText: "Project 2 (Chat Client) was extended to Friday at 11:59 PM.",
    memoryType: "deadline",
    source: "contradiction",
    status: "active",
    supersedesMemoryId: "mem_deadline_old",
    createdAt: "2026-06-01T18:31:00.000Z",
  },
  {
    id: "mem_course_token",
    userId: DEMO_USER.id,
    courseId: DEMO_COURSE_ID,
    memoryText:
      "Course fact: the bearer token from REST login must be reused when opening the chat WebSocket.",
    memoryType: "course_fact",
    source: "ingestion",
    status: "active",
    createdAt: "2026-05-27T16:00:00.000Z",
  },
];

export const DEMO_PHOTON_MESSAGES: PhotonMessage[] = [
  {
    id: "pm_deadline",
    userId: DEMO_USER.id,
    courseId: DEMO_COURSE_ID,
    platform: "slack",
    direction: "outbound",
    messageText: "Deadline update: Project 2 is now due Friday at 11:59 PM.",
    relatedSessionId: undefined,
    createdAt: "2026-06-01T18:32:00.000Z",
    status: "mock",
  },
];

export function freshDemoSeed() {
  // Return deep clones so the store can mutate without touching these constants.
  return {
    users: [structuredClone(DEMO_USER)],
    courses: [structuredClone(DEMO_COURSE)],
    materials: structuredClone(DEMO_MATERIALS),
    assignments: [structuredClone(DEMO_ASSIGNMENT)],
    memories: structuredClone(DEMO_MEMORIES),
    photonMessages: structuredClone(DEMO_PHOTON_MESSAGES),
  };
}
