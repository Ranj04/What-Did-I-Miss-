"use client";

import { useState } from "react";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { QuizQuestion, GradeResult } from "@/lib/rocketride";

export function PracticeQuestion({
  question,
  courseId,
  onGraded,
}: {
  question: QuizQuestion;
  courseId: string;
  onGraded?: (g: GradeResult & { gapWritten: boolean }) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [gapWritten, setGapWritten] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!selected || loading) return;
    setLoading(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, question, studentAnswer: selected }),
    });
    const data = await res.json();
    setGrade(data.grade);
    const wrote = Boolean(data.learningGapMemory);
    setGapWritten(wrote);
    onGraded?.({ ...data.grade, gapWritten: wrote });
    setLoading(false);
  }

  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-brand-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Practice question
        </span>
        <Badge variant="neutral">{question.conceptTag.replace(/_/g, " ")}</Badge>
      </div>
      <p className="text-[15px] font-medium leading-relaxed text-slate-800">{question.question}</p>

      <div className="mt-3 grid gap-2">
        {question.options.map((opt) => {
          const isSel = selected === opt;
          const isCorrect = grade && opt === question.correctAnswer;
          const isWrongPick = grade && isSel && !grade.isCorrect;
          return (
            <button
              key={opt}
              type="button"
              disabled={Boolean(grade)}
              onClick={() => setSelected(opt)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                !grade && isSel && "border-brand-400 bg-brand-50",
                !grade && !isSel && "border-slate-200 hover:bg-slate-50",
                isCorrect && "border-emerald-400 bg-emerald-50",
                isWrongPick && "border-rose-400 bg-rose-50",
                grade && !isCorrect && !isWrongPick && "border-slate-200 opacity-70"
              )}
            >
              <span className={cn(isCorrect && "text-emerald-800", isWrongPick && "text-rose-800")}>
                {opt}
              </span>
              {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {isWrongPick && <XCircle className="h-4 w-4 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {!grade ? (
        <button onClick={submit} disabled={!selected || loading} className="btn-primary mt-4">
          {loading ? "Checking…" : "Check Answer"}
        </button>
      ) : (
        <div className="mt-4 space-y-2 animate-fade-in">
          <div
            className={cn(
              "rounded-xl p-3 text-sm",
              grade.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
            )}
          >
            {grade.feedback}
          </div>
          {gapWritten && (
            <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">
              <Badge variant="memory">memory updated</Badge>
              <span>Learning-gap memory written to XTrace — future answers will adapt.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
