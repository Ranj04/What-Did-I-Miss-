import { cn } from "@/lib/utils";

// Small heading used at the top of a card or content group. Optional icon and
// a trailing action (e.g. a "View all" link or a count badge).
export function SectionHeader({
  icon,
  title,
  count,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {typeof count === "number" ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}
