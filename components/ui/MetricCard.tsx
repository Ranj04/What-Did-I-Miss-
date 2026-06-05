import { cn } from "@/lib/utils";

// Compact stat tile. Used for the dashboard "at a glance" row.
export function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "urgent" | "brand";
  className?: string;
}) {
  const toneRing =
    tone === "urgent"
      ? "ring-rose-200/70"
      : tone === "brand"
      ? "ring-brand-200/70"
      : "ring-slate-200/70";
  const iconTone =
    tone === "urgent"
      ? "bg-rose-50 text-rose-600"
      : tone === "brand"
      ? "bg-brand-50 text-brand-600"
      : "bg-slate-100 text-slate-500";

  return (
    <div className={cn("rounded-2xl bg-white p-4 ring-1 shadow-soft", toneRing, className)}>
      <div className="flex items-center gap-2">
        {icon ? (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconTone)}>
            {icon}
          </span>
        ) : null}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
