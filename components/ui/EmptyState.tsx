import { cn } from "@/lib/utils";

// Helpful, specific empty state — never just "No data". Pass a concrete next
// action in `body` so the student knows what to do.
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {body ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
