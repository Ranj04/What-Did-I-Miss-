import { BookOpen, User, Layers, FolderGit2, CalendarClock } from "lucide-react";
import { Badge } from "./ui/Badge";
import { relativeDue, formatDate, daysUntil } from "@/lib/utils";
import type { Assignment, AssignmentStatus, Course } from "@/lib/types";

const statusProgress: Record<AssignmentStatus, number> = {
  not_started: 8,
  in_progress: 55,
  submitted: 90,
  graded: 100,
};

const statusLabel: Record<AssignmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  graded: "Graded",
};

export function CourseWorkspaceHeader({
  course,
  nextAssignment,
}: {
  course: Course;
  nextAssignment?: Assignment;
}) {
  const progress = nextAssignment ? statusProgress[nextAssignment.status] : 0;
  const urgent = nextAssignment ? daysUntil(nextAssignment.dueDate) <= 2 : false;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Identity + meta */}
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {course.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> {course.professor}
                </span>
                <span className="text-slate-300">·</span>
                <span>{course.term}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {course.currentUnit ? (
              <span className="chip">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Unit</span>
                <span className="font-semibold text-slate-700">{course.currentUnit}</span>
              </span>
            ) : null}
            {course.currentProject ? (
              <span className="chip">
                <FolderGit2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Project</span>
                <span className="font-semibold text-slate-700">{course.currentProject}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Next deadline + progress */}
        {nextAssignment ? (
          <div className="w-full flex-none rounded-xl border border-slate-100 bg-slate-50/60 p-4 lg:w-72">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" /> Next deadline
              </span>
              <Badge variant={urgent ? "urgent" : "info"}>
                {relativeDue(nextAssignment.dueDate)}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">{nextAssignment.title}</p>
            <p className="text-xs text-slate-400">{formatDate(nextAssignment.dueDate)}</p>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Progress</span>
                <span className="font-medium text-slate-600">
                  {statusLabel[nextAssignment.status]}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
