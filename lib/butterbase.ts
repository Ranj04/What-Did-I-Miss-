// =============================================================================
// Butterbase adapter — the app's BACKEND.
// Responsibilities: auth, courses, materials, catch-up sessions, checklist
// tasks, quiz attempts, agent events, Photon message logs, memory-event
// references, and the AI Model Gateway.
//
// LIVE MODE (keys present): every function calls the Butterbase auto-generated
//   REST data API at  {NEXT_PUBLIC_BUTTERBASE_URL}/v1/{BUTTERBASE_APP_ID}/{table}
//   using the platform service key BUTTERBASE_API_KEY (butterbase_service role,
//   full access). Domain objects are camelCase; DB columns are snake_case — the
//   `toRow`/`fromRow` mappers translate between them.
// DEMO MODE (no keys): the same functions hit the in-memory store in lib/store.ts.
//
// Provisioned backend: app `what-did-i-miss` / app_2tcinxzld4o0, 10 tables
// (users, courses, course_materials, assignments, catchup_sessions,
//  catchup_tasks, quiz_attempts, agent_events, photon_messages, memory_events).
// =============================================================================

import { butterbaseConnected } from "./config";
import { DEMO_COURSE, DEMO_USER } from "./demoData";
import { db, genId, now } from "./store";
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

const BASE = process.env.NEXT_PUBLIC_BUTTERBASE_URL;
const KEY = process.env.BUTTERBASE_API_KEY;
const APP_ID = process.env.BUTTERBASE_APP_ID;
const GATEWAY_KEY = process.env.BUTTERBASE_MODEL_GATEWAY_KEY;
const DATA_BASE = BASE && APP_ID ? `${BASE}/v1/${APP_ID}` : "";

export function isLive(): boolean {
  return butterbaseConnected();
}

// ---------------------------------------------------------------------------
// camelCase <-> snake_case mapping for the REST data API.
// A few fields don't round-trip through the generic rule, so they're overridden.
// ---------------------------------------------------------------------------
const TO_SNAKE_OVERRIDE: Record<string, string> = {
  catchUpSessionId: "catchup_session_id",
};
const TO_CAMEL_OVERRIDE: Record<string, string> = {
  catchup_session_id: "catchUpSessionId",
};

function camelToSnake(k: string): string {
  return TO_SNAKE_OVERRIDE[k] ?? k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}
function snakeToCamel(k: string): string {
  return TO_CAMEL_OVERRIDE[k] ?? k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Only the top level is converted — column keys. Values mostly pass through, with
// one exception: a `jsonb` column rejects a raw top-level JSON array of objects
// (the data API mis-parses it as a Postgres array literal — "Expected ':'…"). We
// send those as a JSON string, which the API parses back into jsonb. `text[]`
// columns (arrays of strings) must stay raw JSON arrays, so only arrays whose
// elements are objects are stringified. This covers `missed_concepts`; jsonb
// object values (e.g. agent_events.input/output) are already accepted as-is.
function toRow(obj: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const isObjectArray =
      Array.isArray(v) && v.some((el) => el !== null && typeof el === "object");
    r[camelToSnake(k)] = isObjectArray ? JSON.stringify(v) : v;
  }
  return r;
}
function fromRow<T>(row: Record<string, unknown>): T {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) o[snakeToCamel(k)] = v;
  return o as T;
}

// ---- low-level REST helpers (live mode) ------------------------------------
async function dfetch(path: string, init?: RequestInit) {
  const res = await fetch(`${DATA_BASE}${path}`, {
    ...init,
    headers: {
      // Only declare a JSON body when one is actually sent — the data API rejects
      // bodyless requests (e.g. DELETE) that still carry a JSON content-type.
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${KEY}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Butterbase ${init?.method ?? "GET"} ${path} -> ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function L_list<T>(table: string, params: Record<string, string | undefined> = {}): Promise<T[]> {
  const rows = (await dfetch(`/${table}${qs(params)}`)) as Record<string, unknown>[];
  return (rows ?? []).map((r) => fromRow<T>(r));
}
async function L_get<T>(table: string, id: string): Promise<T | undefined> {
  try {
    const row = (await dfetch(`/${table}/${id}`)) as Record<string, unknown> | null;
    return row ? fromRow<T>(row) : undefined;
  } catch {
    return undefined; // 404 -> not found
  }
}
async function L_insert<T>(table: string, obj: Record<string, unknown>): Promise<T> {
  const row = (await dfetch(`/${table}`, {
    method: "POST",
    body: JSON.stringify(toRow(obj)),
  })) as Record<string, unknown>;
  return fromRow<T>(row);
}
async function L_patch<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T> {
  const row = (await dfetch(`/${table}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toRow(patch)),
  })) as Record<string, unknown>;
  return fromRow<T>(row);
}
async function L_delete(table: string, id: string): Promise<void> {
  await dfetch(`/${table}/${id}`, { method: "DELETE" });
}

// ---- demo-identity resolution (live) ---------------------------------------
// The seeded demo uses sentinel ids ("user_demo" / "course_csc413"); in live
// mode those map to real uuids. Cached per process; cleared on demo reset.
let _demoUserId: string | undefined;
let _demoCourseId: string | undefined;

export function clearDemoIdCache() {
  _demoUserId = undefined;
  _demoCourseId = undefined;
}

async function demoUserId(): Promise<string> {
  if (_demoUserId) return _demoUserId;
  const found = await L_list<User>("users", { email: `eq.${DEMO_USER.email}` });
  if (found[0]) return (_demoUserId = found[0].id);
  const created = await L_insert<User>("users", { name: DEMO_USER.name, email: DEMO_USER.email });
  return (_demoUserId = created.id);
}

async function liveUserId(userId?: string): Promise<string> {
  if (!userId || userId === DEMO_USER.id) return demoUserId();
  return userId;
}

async function liveCourseId(courseId?: string): Promise<string | undefined> {
  if (courseId && courseId !== DEMO_COURSE.id) return courseId;
  if (_demoCourseId) return _demoCourseId;
  const found = await L_list<Course>("courses", { name: `eq.${DEMO_COURSE.name}` });
  if (found[0]) return (_demoCourseId = found[0].id);
  return courseId;
}

// =============================================================================
// Auth — delegates to lib/butterbaseAuth.ts for real signup/login/refresh.
// =============================================================================
export async function getCurrentUser(): Promise<User> {
  if (isLive()) {
    const id = await demoUserId();
    const u = await L_get<User>("users", id);
    if (u) return u;
  }
  return db().users[0];
}

export async function ensureUser(name: string, email: string): Promise<User> {
  if (isLive()) {
    const found = await L_list<User>("users", { email: `eq.${email}` });
    if (found[0]) return found[0];
    return L_insert<User>("users", { name, email });
  }
  const existing = db().users.find((u) => u.email === email);
  if (existing) return existing;
  const user: User = { id: genId("user"), name, email, createdAt: now() };
  db().users.push(user);
  return user;
}

// =============================================================================
// Courses
// =============================================================================
export async function listCourses(userId?: string): Promise<Course[]> {
  if (isLive()) {
    const uid = userId ? await liveUserId(userId) : undefined;
    return L_list<Course>("courses", {
      user_id: uid ? `eq.${uid}` : undefined,
      order: "created_at.asc",
    });
  }
  const all = db().courses;
  return userId ? all.filter((c) => c.userId === userId) : all;
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  if (isLive()) {
    const id = await liveCourseId(courseId);
    return id ? L_get<Course>("courses", id) : undefined;
  }
  return db().courses.find((c) => c.id === courseId);
}

export async function createCourse(input: Omit<Course, "id" | "createdAt">): Promise<Course> {
  if (isLive()) {
    return L_insert<Course>("courses", { ...input, userId: await liveUserId(input.userId) });
  }
  const course: Course = { ...input, id: genId("course"), createdAt: now() };
  db().courses.push(course);
  return course;
}

// =============================================================================
// Materials & storage
// =============================================================================
export async function listMaterials(courseId: string): Promise<CourseMaterial[]> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    return L_list<CourseMaterial>("course_materials", {
      course_id: `eq.${cid}`,
      order: "uploaded_at.asc",
    });
  }
  return db()
    .materials.filter((m) => m.courseId === courseId)
    .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

export async function storeMaterial(
  input: Omit<CourseMaterial, "id" | "uploadedAt">
): Promise<CourseMaterial> {
  // TODO(butterbase-live): for real files, first request a presigned upload URL
  // from Butterbase Storage and set fileUrl to the stored object URL.
  if (isLive()) {
    return L_insert<CourseMaterial>("course_materials", {
      ...input,
      courseId: await liveCourseId(input.courseId),
    });
  }
  const material: CourseMaterial = { ...input, id: genId("mat"), uploadedAt: now() };
  db().materials.push(material);
  return material;
}

// =============================================================================
// Assignments
// =============================================================================
export async function listAssignments(courseId: string): Promise<Assignment[]> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    return L_list<Assignment>("assignments", { course_id: `eq.${cid}` });
  }
  return db().assignments.filter((a) => a.courseId === courseId);
}

export async function createAssignment(
  input: Omit<Assignment, "id">
): Promise<Assignment> {
  if (isLive()) {
    return L_insert<Assignment>("assignments", {
      ...input,
      courseId: await liveCourseId(input.courseId),
    });
  }
  const a: Assignment = { ...input, id: genId("asst") };
  db().assignments.push(a);
  return a;
}

export async function updateAssignment(
  id: string,
  patch: Partial<Assignment>
): Promise<Assignment | undefined> {
  if (isLive()) {
    return L_patch<Assignment>("assignments", id, { ...patch, updatedAt: now() });
  }
  const a = db().assignments.find((x) => x.id === id);
  if (a) Object.assign(a, patch);
  return a;
}

// =============================================================================
// Catch-up sessions & tasks
// =============================================================================
export async function storeCatchUpSession(
  input: Omit<CatchUpSession, "id" | "createdAt">
): Promise<CatchUpSession> {
  if (isLive()) {
    return L_insert<CatchUpSession>("catchup_sessions", {
      ...input,
      userId: await liveUserId(input.userId),
      courseId: await liveCourseId(input.courseId),
    });
  }
  const session: CatchUpSession = { ...input, id: genId("sess"), createdAt: now() };
  db().catchUpSessions.push(session);
  return session;
}

export async function getCatchUpSession(id: string): Promise<CatchUpSession | undefined> {
  if (isLive()) return L_get<CatchUpSession>("catchup_sessions", id);
  return db().catchUpSessions.find((s) => s.id === id);
}

export async function latestCatchUpSession(courseId: string): Promise<CatchUpSession | undefined> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    const rows = await L_list<CatchUpSession>("catchup_sessions", {
      course_id: `eq.${cid}`,
      order: "created_at.desc",
      limit: "1",
    });
    return rows[0];
  }
  return db()
    .catchUpSessions.filter((s) => s.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function storeTasks(
  sessionId: string,
  tasks: Omit<CatchUpTask, "id" | "catchUpSessionId">[]
): Promise<CatchUpTask[]> {
  if (isLive()) {
    const out: CatchUpTask[] = [];
    for (const t of tasks) {
      out.push(await L_insert<CatchUpTask>("catchup_tasks", { ...t, catchUpSessionId: sessionId }));
    }
    return out;
  }
  const created = tasks.map((t) => ({ ...t, id: genId("task"), catchUpSessionId: sessionId }));
  db().catchUpTasks.push(...created);
  return created;
}

export async function listTasks(sessionId: string): Promise<CatchUpTask[]> {
  if (isLive()) {
    return L_list<CatchUpTask>("catchup_tasks", { catchup_session_id: `eq.${sessionId}` });
  }
  return db().catchUpTasks.filter((t) => t.catchUpSessionId === sessionId);
}

export async function setTaskStatus(
  taskId: string,
  status: CatchUpTask["status"]
): Promise<CatchUpTask | undefined> {
  if (isLive()) {
    return L_patch<CatchUpTask>("catchup_tasks", taskId, { status, updatedAt: now() });
  }
  const t = db().catchUpTasks.find((x) => x.id === taskId);
  if (t) t.status = status;
  return t;
}

// =============================================================================
// Quiz attempts
// =============================================================================
export async function storeQuizAttempt(
  input: Omit<QuizAttempt, "id" | "createdAt">
): Promise<QuizAttempt> {
  if (isLive()) {
    return L_insert<QuizAttempt>("quiz_attempts", {
      ...input,
      userId: await liveUserId(input.userId),
      courseId: await liveCourseId(input.courseId),
    });
  }
  const attempt: QuizAttempt = { ...input, id: genId("quiz"), createdAt: now() };
  db().quizAttempts.push(attempt);
  return attempt;
}

export async function listQuizAttempts(courseId: string): Promise<QuizAttempt[]> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    return L_list<QuizAttempt>("quiz_attempts", { course_id: `eq.${cid}` });
  }
  return db().quizAttempts.filter((q) => q.courseId === courseId);
}

// =============================================================================
// Agent events (pipeline telemetry)
// =============================================================================
export async function storeAgentEvent(
  input: Omit<AgentEvent, "id" | "createdAt">
): Promise<AgentEvent> {
  if (isLive()) {
    return L_insert<AgentEvent>("agent_events", input);
  }
  const event: AgentEvent = { ...input, id: genId("evt"), createdAt: now() };
  db().agentEvents.push(event);
  return event;
}

export async function listAgentEvents(sessionId: string): Promise<AgentEvent[]> {
  if (isLive()) {
    return L_list<AgentEvent>("agent_events", { session_id: `eq.${sessionId}`, order: "created_at.asc" });
  }
  return db().agentEvents.filter((e) => e.sessionId === sessionId);
}

// =============================================================================
// Photon message log
// =============================================================================
export async function storePhotonMessage(
  input: Omit<PhotonMessage, "id" | "createdAt">
): Promise<PhotonMessage> {
  if (isLive()) {
    // `providerMessageId` / `errorMessage` are richer-than-schema fields used by
    // the demo store + UI. The live `photon_messages` table doesn't have those
    // columns, so strip them before inserting to avoid a schema error. (A future
    // migration can add them; until then live mode persists the core log.)
    const { providerMessageId, errorMessage, ...persisted } = input;
    void providerMessageId;
    void errorMessage;
    const row = await L_insert<PhotonMessage>("photon_messages", {
      ...persisted,
      userId: await liveUserId(input.userId),
      courseId: await liveCourseId(input.courseId),
    });
    // Return the richer object to callers/UI even though it isn't persisted live.
    return { ...row, providerMessageId, errorMessage };
  }
  const msg: PhotonMessage = { ...input, id: genId("pm"), createdAt: now() };
  db().photonMessages.push(msg);
  return msg;
}

export async function listPhotonMessages(courseId: string): Promise<PhotonMessage[]> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    return L_list<PhotonMessage>("photon_messages", {
      course_id: `eq.${cid}`,
      order: "created_at.asc",
    });
  }
  return db()
    .photonMessages.filter((m) => m.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// =============================================================================
// Memory-event references (XTrace mirror).
// XTrace owns memory, but Butterbase keeps a queryable reference copy. Split
// into insert/update so the DB assigns the uuid + created_at on insert.
// =============================================================================
export async function insertMemoryRef(
  input: Omit<MemoryEvent, "id" | "createdAt" | "status"> & { status?: MemoryEvent["status"] }
): Promise<MemoryEvent> {
  if (isLive()) {
    return L_insert<MemoryEvent>("memory_events", {
      ...input,
      status: input.status ?? "active",
      userId: await liveUserId(input.userId),
      courseId: await liveCourseId(input.courseId),
    });
  }
  const mem: MemoryEvent = {
    ...input,
    status: input.status ?? "active",
    id: genId("mem"),
    createdAt: now(),
  };
  db().memories.push(mem);
  return mem;
}

export async function updateMemoryRef(
  id: string,
  patch: Partial<MemoryEvent>
): Promise<MemoryEvent | undefined> {
  if (isLive()) return L_patch<MemoryEvent>("memory_events", id, patch);
  const m = db().memories.find((x) => x.id === id);
  if (m) Object.assign(m, patch);
  return m;
}

export async function listMemoryRefs(courseId: string): Promise<MemoryEvent[]> {
  if (isLive()) {
    const cid = await liveCourseId(courseId);
    return L_list<MemoryEvent>("memory_events", { course_id: `eq.${cid}`, order: "created_at.desc" });
  }
  return db().memories.filter((m) => m.courseId === courseId);
}

export async function listMemoryRefsByUser(userId: string): Promise<MemoryEvent[]> {
  if (isLive()) {
    const uid = await liveUserId(userId);
    return L_list<MemoryEvent>("memory_events", { user_id: `eq.${uid}`, order: "created_at.desc" });
  }
  return db().memories.filter((m) => m.userId === userId);
}

// =============================================================================
// AI Model Gateway
// -----------------------------------------------------------------------------
// The single seam for ALL LLM calls in the app. RocketRide pipelines (and any
// future feature) should call this rather than a provider SDK directly.
//
// LIVE: OpenAI-compatible endpoint  POST /v1/{app_id}/chat/completions  with the
//       gateway key (or the service key). Usage is metered against the plan.
// DEMO: deterministic echo so pipelines still return sensible structured text.
// =============================================================================
export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function modelGatewayChat(opts: {
  system?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const token = GATEWAY_KEY || KEY;
  if (isLive() && token && BASE && APP_ID) {
    const messages: GatewayMessage[] = [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      { role: "user" as const, content: opts.prompt },
    ];
    const res = await fetch(`${BASE}/v1/${APP_ID}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        // Default to a current Claude model; override per call as needed.
        model: opts.model ?? process.env.BUTTERBASE_DEFAULT_MODEL ?? "anthropic/claude-haiku-4.5",
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 800,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Butterbase AI gateway -> ${res.status} ${body}`);
    }
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? "";
  }
  // Demo fallback.
  return `「demo-gateway」${opts.prompt.slice(0, 240)}`;
}

// =============================================================================
// Destructive demo reset (live). Deletes the seeded demo course and ALL its
// child rows in FK-safe order. Used by /api/demo/reset so "Reset demo" gives a
// genuinely clean slate in Butterbase. No-op in demo mode (use resetDb()).
// =============================================================================
export async function wipeDemo(): Promise<void> {
  if (!isLive()) return;
  const courses = await L_list<Course>("courses", { name: `eq.${DEMO_COURSE.name}` });
  for (const course of courses) {
    const cid = course.id;
    const sessions = await L_list<CatchUpSession>("catchup_sessions", {
      course_id: `eq.${cid}`,
    });
    for (const s of sessions) {
      const tasks = await L_list<CatchUpTask>("catchup_tasks", {
        catchup_session_id: `eq.${s.id}`,
      });
      for (const t of tasks) await L_delete("catchup_tasks", t.id);
      const evs = await L_list<AgentEvent>("agent_events", { session_id: `eq.${s.id}` });
      for (const e of evs) await L_delete("agent_events", e.id);
      await L_delete("catchup_sessions", s.id);
    }
    for (const table of [
      "course_materials",
      "assignments",
      "quiz_attempts",
      "photon_messages",
      "memory_events",
    ]) {
      const rows = await L_list<{ id: string }>(table, { course_id: `eq.${cid}` });
      for (const r of rows) await L_delete(table, r.id);
    }
    await L_delete("courses", cid);
  }
  clearDemoIdCache();
}
