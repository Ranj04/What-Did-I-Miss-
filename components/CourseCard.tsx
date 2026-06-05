import Link from "next/link";
import { ArrowRight, BookOpen, User } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/types";

export function CourseCard({
  course,
  dueLabel,
  highlight = false,
}: {
  course: Course;
  dueLabel?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={cn(
        "card card-pad card-hover group block",
        highlight && "border-brand-200 ring-1 ring-brand-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <BookOpen className="h-5 w-5" />
        </div>
        {dueLabel ? (
          <Badge variant="urgent">{dueLabel}</Badge>
        ) : highlight ? (
          <Badge variant="info">Needs attention</Badge>
        ) : null}
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900">{course.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {course.professor}
        </span>
        <span className="text-slate-300">•</span>
        <span>{course.term}</span>
      </div>
      {course.currentUnit ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="truncate text-xs text-slate-500">
            Unit: <span className="font-medium text-slate-700">{course.currentUnit}</span>
          </span>
          <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
        </div>
      ) : null}
    </Link>
  );
}
