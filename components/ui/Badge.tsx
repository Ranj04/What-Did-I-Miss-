import { cn } from "@/lib/utils";

type Variant =
  | "urgent"
  | "completed"
  | "weak"
  | "memory"
  | "superseded"
  | "neutral"
  | "info"
  | "high"
  | "medium"
  | "low"
  | "success"
  | "changed";

const styles: Record<Variant, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  weak: "bg-amber-50 text-amber-700 ring-amber-200",
  memory: "bg-violet-50 text-violet-700 ring-violet-200",
  superseded: "bg-slate-100 text-slate-500 ring-slate-200 line-through",
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  info: "bg-brand-50 text-brand-700 ring-brand-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  changed: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
