"use client";

import { useState } from "react";
import { BrainCircuit, Search, Sparkles, User, BookOpen, History } from "lucide-react";
import { Badge } from "./ui/Badge";
import { SectionHeader } from "./ui/SectionHeader";
import { EmptyState } from "./ui/EmptyState";
import { SupersededMemoryCard } from "./SupersededMemoryCard";
import { formatDateTime } from "@/lib/utils";
import type { MemoryEvent, MemoryType } from "@/lib/types";

const typeBadge: Record<MemoryType, { variant: any; label: string }> = {
  learning_gap: { variant: "weak", label: "learning gap" },
  deadline: { variant: "urgent", label: "deadline" },
  course_fact: { variant: "info", label: "course fact" },
  preference: { variant: "neutral", label: "preference" },
  clarification: { variant: "memory", label: "clarification" },
};

// Memory "about you" vs "about the course".
const STUDENT_TYPES: MemoryType[] = ["learning_gap", "preference"];

function MemoryItem({ m }: { m: MemoryEvent }) {
  const b = typeBadge[m.memoryType];
  return (
    <li className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Badge variant={b.variant}>{b.label}</Badge>
        <span className="text-xs text-slate-400">{formatDateTime(m.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{m.memoryText}</p>
    </li>
  );
}

export function MemoryPanel({
  courseId,
  memories,
}: {
  courseId: string;
  memories: MemoryEvent[];
}) {
  const active = memories.filter((m) => m.status === "active");
  const studentMemories = active.filter((m) => STUDENT_TYPES.includes(m.memoryType));
  const courseMemories = active.filter((m) => !STUDENT_TYPES.includes(m.memoryType));
  const superseded = memories.filter((m) => m.status === "superseded");

  const [query, setQuery] = useState("Explain the chat connection part.");
  const [answer, setAnswer] = useState<string | null>(null);
  const [matched, setMatched] = useState<MemoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    const res = await fetch("/api/memory/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, courseId, reply: true }),
    });
    const data = await res.json();
    setAnswer(data.answer);
    setMatched(data.matches ?? []);
    setLoading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid gap-5">
        {/* Memory-aware recall */}
        <div className="card card-pad">
          <SectionHeader
            title="Memory-aware recall"
            icon={<BrainCircuit className="h-4 w-4 text-violet-500" />}
          />
          <p className="mb-3 text-sm leading-relaxed text-slate-500">
            Ask a follow-up. The agent recalls what you previously struggled with and tailors the
            answer to it.
          </p>
          <div className="flex gap-2">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Explain the chat connection part."
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button
              onClick={ask}
              disabled={loading}
              className="btn-primary flex-none"
              aria-label="Ask"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          {answer && (
            <div className="mt-3 animate-fade-in rounded-xl border border-violet-200 bg-violet-50/60 p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">Memory-aware answer</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{answer}</p>
              {matched.length > 0 && (
                <p className="mt-2 text-xs text-violet-600">
                  Drew on {matched.length} memor{matched.length === 1 ? "y" : "ies"}.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Student memory */}
        <div className="card card-pad">
          <SectionHeader
            title="What we remember about you"
            icon={<User className="h-4 w-4" />}
            count={studentMemories.length}
          />
          {studentMemories.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nothing yet. As you practice, learning gaps and preferences are remembered here.
            </p>
          ) : (
            <ul className="grid gap-2">
              {studentMemories.map((m) => (
                <MemoryItem key={m.id} m={m} />
              ))}
            </ul>
          )}
        </div>

        {/* Course memory */}
        <div className="card card-pad">
          <SectionHeader
            title="What we remember about this course"
            icon={<BookOpen className="h-4 w-4" />}
            count={courseMemories.length}
          />
          {courseMemories.length === 0 ? (
            <p className="text-sm text-slate-400">No course facts captured yet.</p>
          ) : (
            <ul className="grid gap-2">
              {courseMemories.map((m) => (
                <MemoryItem key={m.id} m={m} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Superseded / revised */}
      <div className="grid content-start gap-5">
        <SectionHeader
          title="Revised memory"
          icon={<History className="h-4 w-4" />}
          count={superseded.length}
        />
        {superseded.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="No revisions yet"
            body="When a fact changes — like a deadline moving — the old memory is kept and marked superseded so you can see exactly what changed."
          />
        ) : (
          superseded.map((old) => (
            <SupersededMemoryCard
              key={old.id}
              old={old}
              current={memories.find(
                (m) => m.supersedesMemoryId === old.id && m.status === "active"
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}
