import { ArrowDown } from "lucide-react";
import { Badge } from "./ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { MemoryEvent } from "@/lib/types";

// Shows a "before -> after" pair: an old memory that was superseded by a newer,
// active one. This is the visible proof of XTrace's self-revising memory.
export function SupersededMemoryCard({
  old,
  current,
}: {
  old: MemoryEvent;
  current?: MemoryEvent;
}) {
  return (
    <div className="card overflow-hidden p-4 sm:p-5">
      {/* Old fact */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Old fact
          </span>
          <span className="text-xs text-slate-400">{formatDateTime(old.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-500 line-through">{old.memoryText}</p>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-200">
          <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
        </span>
      </div>

      {/* New fact */}
      {current ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                New fact
              </span>
              <Badge variant="changed">revised</Badge>
            </div>
            <span className="text-xs text-slate-400">{formatDateTime(current.createdAt)}</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{current.memoryText}</p>
        </div>
      ) : null}
    </div>
  );
}
