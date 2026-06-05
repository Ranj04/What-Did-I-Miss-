"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { CatchUpTask, TaskPriority } from "@/lib/types";

const priorityLabel: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function TaskChecklist({ initialTasks }: { initialTasks: CatchUpTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
      )
    );

  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500">
          {done}/{tasks.length} done
        </span>
      </div>
      <ul className="grid gap-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition",
              t.status === "done" ? "bg-emerald-50/40" : "bg-white hover:bg-slate-50"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(t.id)}
              aria-label={t.status === "done" ? "Mark incomplete" : "Mark complete"}
              className={cn(
                "flex h-5 w-5 flex-none items-center justify-center rounded-md border transition",
                t.status === "done"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 text-transparent hover:border-brand-400"
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                t.status === "done" ? "text-slate-400 line-through" : "text-slate-700"
              )}
            >
              {t.taskText}
            </span>
            <span className="text-xs text-slate-400">~{t.estimatedMinutes}m</span>
            <Badge variant={t.priority}>{priorityLabel[t.priority]}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
