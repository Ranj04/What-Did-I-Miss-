import {
  AlertTriangle,
  ListChecks,
  TrendingUp,
  BookMarked,
  HelpCircle,
  ClipboardList,
  Clock,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { TaskChecklist } from "./TaskChecklist";
import type { CatchUpSession, CatchUpTask } from "@/lib/types";

function Section({
  icon,
  title,
  meta,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card card-pad animate-fade-in">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        {meta}
      </div>
      {children}
    </section>
  );
}

export function CatchUpReport({
  session,
  tasks,
}: {
  session: CatchUpSession;
  tasks: CatchUpTask[];
}) {
  const highPriority = tasks.filter((t) => t.priority === "high").length;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="grid gap-4">
      {/* ---------------------------------------------------- Hero summary panel */}
      <section className="animate-fade-in overflow-hidden rounded-2xl border border-brand-200/60 bg-white shadow-soft">
        <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 to-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <p className="eyebrow">Your catch-up brief</p>
            <Badge variant="success">ready</Badge>
          </div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-800">
            {session.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <Stat label="Key updates" value={session.importantUpdates.length} />
          <Stat label="Concepts to review" value={session.missedConcepts.length} />
          <Stat
            label="Est. time"
            value={totalMinutes ? `${totalMinutes}m` : `${tasks.length} tasks`}
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* --------------------------------------------------------------- Updates */}
      <Section
        icon={<TrendingUp className="h-4 w-4" />}
        title="Most important updates"
        meta={<Badge variant="neutral">{session.importantUpdates.length}</Badge>}
      >
        <ul className="grid gap-2.5">
          {session.importantUpdates.map((u, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-sm text-slate-700"
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-brand-100 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <span className="leading-relaxed">{u}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------------- Concepts */}
      <Section icon={<BookMarked className="h-4 w-4" />} title="Concepts you missed">
        <div className="grid gap-2.5">
          {session.missedConcepts.map((c, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-white p-3.5">
              <p className="text-sm font-semibold text-slate-900">{c.concept}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{c.why}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------- Assignment impact */}
      <Section icon={<ClipboardList className="h-4 w-4" />} title="What this means for your project">
        <p className="text-sm leading-relaxed text-slate-700">{session.assignmentImpact}</p>
      </Section>

      {/* ------------------------------------------------- Personalized warning */}
      <section className="animate-fade-in rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-900">Heads up — based on your history</h3>
          <Badge variant="memory">from your memory</Badge>
        </div>
        <p className="text-sm leading-relaxed text-amber-900">{session.personalizedWarning}</p>
      </section>

      {/* ------------------------------------------------------------- Checklist */}
      <Section
        icon={<ListChecks className="h-4 w-4" />}
        title="Your priority checklist"
        meta={
          highPriority > 0 ? <Badge variant="high">{highPriority} high priority</Badge> : null
        }
      >
        <TaskChecklist initialTasks={tasks} />
      </Section>

      {/* ------------------------------------------------------------- Questions */}
      <Section icon={<HelpCircle className="h-4 w-4" />} title="Questions to ask your TA or group">
        <ul className="grid gap-2">
          {session.questionsToAsk.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-400" />
              {q}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 text-center sm:px-5">
      <div className="flex items-center justify-center gap-1 text-lg font-bold text-slate-900">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        {value}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}
