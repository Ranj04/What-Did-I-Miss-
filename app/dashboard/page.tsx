import Link from "next/link";
import {
  CalendarClock,
  BookOpen,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import {
  listAssignments,
  listCourses,
  getCurrentUser,
  latestCatchUpSession,
} from "@/lib/butterbase";
import { getCourseMemories } from "@/lib/xtrace";
import { getServiceStatuses } from "@/lib/config";
import { CourseCard } from "@/components/CourseCard";
import { CreateCourseButton, ResetDemoButton } from "@/components/DemoActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { INTEGRATION_META, INTEGRATION_ORDER } from "@/components/ui/IntegrationBadge";
import { relativeDue, daysUntil, formatDate } from "@/lib/utils";
import type { Assignment, Course, MemoryEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function DashboardPage() {
  const [courses, user] = await Promise.all([listCourses("user_demo"), getCurrentUser()]);
  const statuses = getServiceStatuses();

  // Gather per-course assignments + memory in parallel.
  const perCourse = await Promise.all(
    courses.map(async (c) => {
      const [assignments, memories, session] = await Promise.all([
        listAssignments(c.id),
        getCourseMemories(c.id),
        latestCatchUpSession(c.id),
      ]);
      return { course: c, assignments, memories, session };
    })
  );

  // Soonest upcoming deadline per course, for the urgent strip + card badge.
  const deadlines: { course: Course; assignment: Assignment }[] = [];
  const dueLabels: Record<string, string | undefined> = {};
  for (const { course, assignments } of perCourse) {
    const sorted = assignments.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    for (const a of sorted) deadlines.push({ course, assignment: a });
    const soonest = sorted[0];
    if (soonest && daysUntil(soonest.dueDate) <= 7) dueLabels[course.id] = relativeDue(soonest.dueDate);
  }
  deadlines.sort((a, b) => a.assignment.dueDate.localeCompare(b.assignment.dueDate));
  const upcoming = deadlines.filter((d) => daysUntil(d.assignment.dueDate) >= -3).slice(0, 4);
  const nextDeadline = upcoming[0];

  // Weak concepts = active learning-gap memories across all courses.
  const weakConcepts: { memory: MemoryEvent; course: Course }[] = [];
  for (const { course, memories } of perCourse) {
    for (const m of memories) {
      if (m.status === "active" && m.memoryType === "learning_gap") {
        weakConcepts.push({ memory: m, course });
      }
    }
  }

  const recentSessions = perCourse
    .filter((p) => p.session)
    .sort((a, b) => (b.session!.createdAt).localeCompare(a.session!.createdAt))
    .slice(0, 3);

  const connectedCount = statuses.filter((s) => s.connected).length;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        eyebrow="Your workspace"
        title={`Welcome back, ${firstName}.`}
        subtitle="Here's what needs your attention. Open a course to reconstruct what you missed and what to do next."
        actions={
          <>
            <ResetDemoButton />
            <CreateCourseButton />
          </>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="No courses yet"
          body="Load the CSC 413 demo to see a full catch-up flow, or add your own course to get started."
          action={
            <div className="flex gap-2">
              <ResetDemoButton />
              <CreateCourseButton />
            </div>
          }
        />
      ) : (
        <>
          {/* ----------------------------------------------- At-a-glance metrics */}
          <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<CalendarClock className="h-4 w-4" />}
              label="Next deadline"
              value={nextDeadline ? relativeDue(nextDeadline.assignment.dueDate) : "All clear"}
              hint={nextDeadline ? nextDeadline.assignment.title : "Nothing due soon"}
              tone={
                nextDeadline && daysUntil(nextDeadline.assignment.dueDate) <= 2 ? "urgent" : "default"
              }
            />
            <MetricCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Active courses"
              value={courses.length}
              hint="Tracked this term"
            />
            <MetricCard
              icon={<BrainCircuit className="h-4 w-4" />}
              label="Weak concepts"
              value={weakConcepts.length}
              hint="From your practice history"
              tone={weakConcepts.length > 0 ? "brand" : "default"}
            />
            <MetricCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Catch-up sessions"
              value={recentSessions.length}
              hint="Generated so far"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ---------------------------------------------------- Course list */}
            <section className="min-w-0 lg:col-span-2">
              <SectionHeader title="Your courses" count={courses.length} icon={<BookOpen className="h-4 w-4" />} />
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    dueLabel={dueLabels[c.id]}
                    highlight={nextDeadline?.course.id === c.id}
                  />
                ))}
              </div>
            </section>

            {/* ----------------------------------------------- Priority sidebar */}
            <div className="min-w-0 space-y-5">
              {/* Upcoming deadlines */}
              <section className="card card-pad">
                <SectionHeader
                  title="Upcoming deadlines"
                  icon={<CalendarClock className="h-4 w-4" />}
                />
                {upcoming.length === 0 ? (
                  <p className="text-sm text-slate-400">Nothing due in the next week.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map(({ course, assignment }) => {
                      const d = daysUntil(assignment.dueDate);
                      return (
                        <li key={assignment.id}>
                          <Link
                            href={`/courses/${course.id}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-slate-200 hover:bg-slate-50"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-800">
                                {assignment.title}
                              </span>
                              <span className="block truncate text-xs text-slate-400">
                                {course.name.split("—")[0].trim()} · {formatDate(assignment.dueDate)}
                              </span>
                            </span>
                            <Badge variant={d <= 2 ? "urgent" : "info"}>
                              {relativeDue(assignment.dueDate)}
                            </Badge>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Weak concepts */}
              <section className="card card-pad">
                <SectionHeader
                  title="Weak concepts"
                  icon={<BrainCircuit className="h-4 w-4" />}
                  count={weakConcepts.length}
                />
                {weakConcepts.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No gaps logged yet. Miss a practice question and it shows up here.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {weakConcepts.slice(0, 4).map(({ memory, course }) => (
                      <li
                        key={memory.id}
                        className="flex items-start gap-2.5 rounded-xl bg-violet-50/50 p-2.5"
                      >
                        <CircleDot className="mt-0.5 h-4 w-4 flex-none text-violet-500" />
                        <span className="text-sm text-slate-700">{memory.memoryText}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Recent catch-up sessions */}
              {recentSessions.length > 0 && (
                <section className="card card-pad">
                  <SectionHeader title="Recent catch-up" icon={<Sparkles className="h-4 w-4" />} />
                  <ul className="space-y-2">
                    {recentSessions.map(({ course, session }) => (
                      <li key={session!.id}>
                        <Link
                          href={`/courses/${course.id}/catchup`}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-slate-200 hover:bg-slate-50"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                            {session!.summary}
                          </span>
                          <ArrowRight className="h-4 w-4 flex-none text-slate-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------- Integrations */}
          <section className="mt-8 rounded-2xl border border-slate-200/70 bg-white/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-title mr-1">Powered by</span>
                {INTEGRATION_ORDER.map((name) => {
                  const m = INTEGRATION_META[name];
                  const live = statuses.find((s) => s.name === name)?.connected;
                  return (
                    <span key={name} className="chip">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded ring-1 ring-inset ${m.accent}`}
                      >
                        {m.icon}
                      </span>
                      <span className="font-semibold text-slate-700">{m.label}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`}
                      />
                    </span>
                  );
                })}
              </div>
              <Link
                href="/settings/integrations"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {connectedCount}/{statuses.length} live · view details →
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
