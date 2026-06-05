import Link from "next/link";
import { Sparkles } from "lucide-react";
import { anyDemoMode, getServiceStatuses } from "@/lib/config";

// Renders only when at least one integration lacks real credentials.
// Kept understated — a thin status strip, not an alarm.
export function DemoBanner() {
  if (!anyDemoMode()) return null;
  const demo = getServiceStatuses()
    .filter((s) => !s.connected)
    .map((s) => s.label);
  return (
    <div className="border-b border-slate-200/70 bg-slate-50">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-xs text-slate-500">
        <Sparkles className="h-3.5 w-3.5 flex-none text-brand-500" />
        <span>
          Demo mode — <span className="font-medium text-slate-600">{demo.join(", ")}</span> running
          on built-in mock data. Every step works end-to-end.
        </span>
        <Link
          href="/settings/integrations"
          className="ml-auto whitespace-nowrap font-medium text-brand-600 hover:text-brand-700"
        >
          Integration status →
        </Link>
      </div>
    </div>
  );
}
