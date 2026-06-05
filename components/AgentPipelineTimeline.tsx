"use client";

import { Check, Loader2, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStepStatus = "pending" | "running" | "done" | "failed";

export interface PipelineStep {
  key: string;
  label: string;
  tool: "Butterbase" | "XTrace" | "RocketRide" | "Photon";
  status: PipelineStepStatus;
  detail?: string;
}

const toolColor: Record<PipelineStep["tool"], string> = {
  Butterbase: "text-emerald-600 bg-emerald-50 ring-emerald-200",
  XTrace: "text-violet-600 bg-violet-50 ring-violet-200",
  RocketRide: "text-brand-600 bg-brand-50 ring-brand-200",
  Photon: "text-amber-600 bg-amber-50 ring-amber-200",
};

const statusLabel: Record<PipelineStepStatus, string> = {
  pending: "Waiting",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export function AgentPipelineTimeline({ steps }: { steps: PipelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-4 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-0.75rem)] w-px",
                  step.status === "done" ? "bg-brand-300" : "bg-slate-200"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full ring-2 transition",
                step.status === "done" && "bg-brand-600 ring-brand-600 text-white",
                step.status === "running" && "bg-white ring-brand-400 text-brand-600",
                step.status === "failed" && "bg-rose-500 ring-rose-500 text-white",
                step.status === "pending" && "bg-white ring-slate-200 text-slate-300"
              )}
            >
              {step.status === "done" ? (
                <Check className="h-3.5 w-3.5" />
              ) : step.status === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : step.status === "failed" ? (
                <X className="h-3 w-3" />
              ) : (
                <Circle className="h-2 w-2 fill-current" />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                    toolColor[step.tool]
                  )}
                >
                  {step.tool}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    step.status === "pending" ? "text-slate-400" : "text-slate-800"
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "ml-auto text-[11px] font-medium",
                    step.status === "done" && "text-brand-600",
                    step.status === "running" && "text-slate-500",
                    step.status === "failed" && "text-rose-600",
                    step.status === "pending" && "text-slate-300"
                  )}
                >
                  {statusLabel[step.status]}
                </span>
              </div>
              {step.detail && step.status !== "pending" ? (
                <p className="mt-0.5 text-xs text-slate-500 animate-fade-in">{step.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// The canonical 6-step catch-up pipeline used by the Catch-Up tab.
export const CATCHUP_STEPS: Omit<PipelineStep, "status">[] = [
  { key: "read", label: "Reading Butterbase course materials", tool: "Butterbase" },
  { key: "search", label: "Searching XTrace memory", tool: "XTrace" },
  { key: "run", label: "Running RocketRide catch-up pipeline", tool: "RocketRide" },
  { key: "save", label: "Saving report to Butterbase", tool: "Butterbase" },
  { key: "send", label: "Sending summary through Photon", tool: "Photon" },
  { key: "write", label: "Writing new memory to XTrace", tool: "XTrace" },
];
