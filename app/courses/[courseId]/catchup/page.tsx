import { CatchUpForm } from "@/components/CatchUpForm";
import { INTEGRATION_META, INTEGRATION_ORDER } from "@/components/ui/IntegrationBadge";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function CatchUpPage({ params }: { params: { courseId: string } }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Catch-Up</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Ask what you missed. The agent reads your materials, recalls what you struggled with,
          builds a prioritized plan, and sends a short summary to your messaging app.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {INTEGRATION_ORDER.map((name) => {
            const m = INTEGRATION_META[name];
            return (
              <span key={name} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded ring-1 ring-inset ${m.accent}`}
                >
                  {m.icon}
                </span>
                {m.label}
              </span>
            );
          })}
        </div>
      </div>
      <CatchUpForm courseId={params.courseId} />
    </div>
  );
}
