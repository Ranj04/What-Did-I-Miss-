"use client";

import { useState } from "react";
import { Sparkles, Send, AlertCircle, Workflow } from "lucide-react";
import {
  AgentPipelineTimeline,
  CATCHUP_STEPS,
  type PipelineStep,
} from "./AgentPipelineTimeline";
import { CatchUpReport } from "./CatchUpReport";
import { SectionHeader } from "./ui/SectionHeader";
import type { CatchUpSession, CatchUpTask } from "@/lib/types";

const DEMO_QUESTION =
  "I missed this week. What did I miss and what do I need to do for the project?";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function CatchUpForm({ courseId }: { courseId: string }) {
  const [question, setQuestion] = useState(DEMO_QUESTION);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [report, setReport] = useState<{
    session: CatchUpSession;
    tasks: CatchUpTask[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!question.trim() || running) return;
    setRunning(true);
    setError(null);
    setReport(null);

    const initial: PipelineStep[] = CATCHUP_STEPS.map((s) => ({ ...s, status: "pending" }));
    setSteps(initial);

    // Kick off the real agent run in parallel with the visual timeline.
    const fetchPromise = fetch("/api/catchup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, question }),
    }).then((r) => r.json());

    // Animate the 6 steps.
    for (let i = 0; i < initial.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s))
      );
      await sleep(620);
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
      );
    }

    try {
      const data = await fetchPromise;
      if (data.error) throw new Error(data.error);
      // attach the real per-step detail from the agent events
      setSteps((prev) =>
        prev.map((s) => {
          const ev = (data.events ?? []).find((e: any) =>
            e.label.toLowerCase().includes(s.label.split(" ")[0].toLowerCase())
          );
          return ev ? { ...s, detail: shortDetail(ev) } : s;
        })
      );
      setReport({ session: data.session, tasks: data.tasks });
    } catch (e) {
      setError((e as Error).message);
      // surface the failure on the last step so the timeline tells the story
      setSteps((prev) =>
        prev.map((s, idx) => (idx === prev.length - 1 ? { ...s, status: "failed" } : s))
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="card card-pad">
        <label htmlFor="catchup-q" className="section-title">
          What did you miss?
        </label>
        <p className="mb-2 mt-1 text-sm text-slate-500">
          Describe what you missed and the agent will rebuild it across your materials and memory.
        </p>
        <textarea
          id="catchup-q"
          className="input min-h-[88px] resize-y"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. I missed Tuesday and Thursday — what changed for the project?"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setQuestion(DEMO_QUESTION)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Use demo question
          </button>
          <button onClick={run} disabled={running} className="btn-primary">
            {running ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" /> Generating plan…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Generate Catch-Up Plan
              </>
            )}
          </button>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="card card-pad">
          <SectionHeader
            title="Agent pipeline"
            icon={<Workflow className="h-4 w-4" />}
            action={
              running ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
                  <span className="h-1.5 w-1.5 animate-pulseline rounded-full bg-brand-500" />
                  Live
                </span>
              ) : error ? (
                <span className="text-xs font-medium text-rose-600">Stopped</span>
              ) : (
                <span className="text-xs font-medium text-emerald-600">Complete</span>
              )
            }
          />
          <AgentPipelineTimeline steps={steps} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <p className="font-medium">Couldn&apos;t finish the catch-up.</p>
            <p className="mt-0.5 text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {report && <CatchUpReport session={report.session} tasks={report.tasks} />}
    </div>
  );
}

function shortDetail(ev: any): string {
  const o = ev.output ?? {};
  if (o.files) return `${o.materialCount} files: ${o.files.slice(0, 2).join(", ")}…`;
  if (o.matched) return o.matched.length ? `Recalled: ${o.matched[0]}` : "No prior memory matched";
  if (o.summary) return "Structured report generated";
  if (o.tasks != null) return `${o.tasks} checklist tasks saved`;
  if (o.messageId) return `Message ${o.status} via messaging`;
  if (o.memoryId) return "New memory persisted";
  if (o.new) return `Superseded → ${o.new}`;
  return "";
}
