import Link from "next/link";
import {
  FileSearch,
  BrainCircuit,
  Workflow,
  Send,
  ArrowRight,
  Compass,
} from "lucide-react";
import { StartDemoButton } from "@/components/DemoActions";
import { CatchUpPreviewCard } from "@/components/CatchUpPreviewCard";
import { INTEGRATION_META, INTEGRATION_ORDER } from "@/components/ui/IntegrationBadge";
import { DEMO_COURSE_ID } from "@/lib/demoData";

const steps = [
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: "Reconstruct the week",
    body: "It reads your slides, assignments, announcements, and group-chat updates to rebuild what actually changed.",
  },
  {
    icon: <BrainCircuit className="h-5 w-5" />,
    title: "Check against memory",
    body: "It recalls what you struggled with before and which facts have since changed — like a moved deadline.",
  },
  {
    icon: <Workflow className="h-5 w-5" />,
    title: "Write a recovery plan",
    body: "You get a prioritized brief: what matters, what to do first, and a few practice questions to test yourself.",
  },
  {
    icon: <Send className="h-5 w-5" />,
    title: "Nudge you where you are",
    body: "A short version lands in Slack, Discord, or iMessage so the plan doesn't get lost in another tab.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-20">
        <div>
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Catch-up assistant for students
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            Missed class? Know exactly what changed, what matters, and what to do next.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            What Did I Miss? turns scattered lectures, assignments, announcements, and group updates
            into a personalized catch-up plan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <StartDemoButton />
            <Link href={`/courses/${DEMO_COURSE_ID}`} className="btn-secondary">
              <Compass className="h-4 w-4" />
              View demo course
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wide">Built on</span>
            {INTEGRATION_ORDER.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 text-slate-500">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded ring-1 ring-inset ${INTEGRATION_META[name].accent}`}
                >
                  {INTEGRATION_META[name].icon}
                </span>
                <span className="font-medium">{INTEGRATION_META[name].label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:pl-4">
          <CatchUpPreviewCard />
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="border-t border-slate-200/70 py-14 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-2">How it works</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Four steps from &ldquo;I missed everything&rdquo; to a clear plan.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card card-pad">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {s.icon}
                </div>
                <span className="text-sm font-semibold text-slate-300">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- Not a generic tutor */}
      <section className="grid gap-8 border-t border-slate-200/70 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div>
          <p className="eyebrow mb-2">Why it&apos;s different</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            This is not a generic AI tutor.
          </h2>
        </div>
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-slate-600">
            A tutor answers questions you already know how to ask. What Did I Miss? is a{" "}
            <span className="font-semibold text-slate-800">context-recovery agent</span> for the
            student who doesn&apos;t even know where to restart.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {[
              "Reconstructs the specific week you missed — not generic course content.",
              "Reconciles changed deadlines against what it told you before.",
              "Warns you about your own past mistakes, by name.",
              "Delivers the plan to the messaging app you already use.",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3.5 text-sm text-slate-600"
              >
                <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-brand-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------- Integration strip */}
      <section className="border-t border-slate-200/70 py-14 sm:py-16">
        <div className="mb-7 max-w-2xl">
          <p className="eyebrow mb-2">The stack</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            One agent, four moving parts working together.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATION_ORDER.map((name) => {
            const m = INTEGRATION_META[name];
            return (
              <div key={name} className="card card-pad">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${m.accent}`}
                >
                  {m.icon}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{m.label}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{m.role}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- Demo CTA */}
      <section className="mb-20 mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-lift sm:p-12">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">See it on a real course in 2 minutes.</h2>
              <p className="mt-2 max-w-xl text-brand-100">
                Start the CSC 413 demo: run the catch-up pipeline, miss a practice question, and watch
                memory update a moved deadline — live.
              </p>
            </div>
            <StartDemoButton className="btn bg-white text-brand-700 hover:bg-brand-50" />
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </div>
      </section>
    </div>
  );
}
