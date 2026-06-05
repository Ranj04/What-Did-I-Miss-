import { CalendarClock, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "./ui/Badge";

// A static, tasteful "product shot" of a catch-up brief for the landing page.
// Not wired to data — purely illustrative of what the real report looks like.
export function CatchUpPreviewCard() {
  return (
    <div className="relative">
      {/* soft halo */}
      <div className="absolute -inset-3 -z-10 rounded-[1.6rem] bg-gradient-to-br from-brand-100/60 to-transparent blur-xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lift">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 text-xs font-medium text-slate-400">
            CSC 413 · Catch-up brief
          </span>
        </div>

        <div className="space-y-3.5 p-5">
          <div>
            <p className="eyebrow mb-1">Where you stand</p>
            <p className="text-sm leading-relaxed text-slate-700">
              You missed the WebSockets lecture. The Chat Client project moved from Wednesday to
              Friday — here&apos;s the 30-minute path back in.
            </p>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-semibold text-sky-800">Deadline changed</span>
              <Badge variant="changed">updated</Badge>
            </div>
            <p className="text-sm text-sky-900">
              Project 2 is now due <span className="font-semibold">Friday, 11:59 PM</span>.
            </p>
          </div>

          <div>
            <p className="section-title mb-2">Start here</p>
            <ul className="space-y-1.5">
              {[
                "Reuse the login bearer token when opening the chat socket",
                "Match the room id string exactly from GET /rooms",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-md border border-slate-300 text-transparent">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <AlertTriangle className="h-4 w-4 flex-none text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-900">
              Based on your last quiz, double-check the REST vs. WebSocket distinction before you
              start coding.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-400">Sent a short version to Slack</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Open full brief <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
