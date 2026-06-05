import { CalendarClock } from "lucide-react";
import { Badge } from "./ui/Badge";
import { formatDateTime, daysUntil, relativeDue } from "@/lib/utils";
import type { Assignment } from "@/lib/types";

export function DeadlineCard({ assignment }: { assignment: Assignment }) {
  const d = daysUntil(assignment.dueDate);
  const urgent = d <= 2;
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
            <p className="text-sm text-slate-500">{formatDateTime(assignment.dueDate)}</p>
          </div>
        </div>
        <Badge variant={urgent ? "urgent" : "info"}>{relativeDue(assignment.dueDate)}</Badge>
      </div>
      <ul className="mt-4 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
        {assignment.requirements.slice(0, 6).map((r) => (
          <li key={r} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-slate-300" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
