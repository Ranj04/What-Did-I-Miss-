import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Layers, BrainCircuit, ClipboardList } from "lucide-react";
import {
  getCourse,
  listAssignments,
  listMaterials,
  listMemoryRefs,
} from "@/lib/butterbase";
import { DeadlineCard } from "@/components/DeadlineCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function CourseOverviewPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await getCourse(params.courseId);
  const materials = await listMaterials(params.courseId);
  const assignments = await listAssignments(params.courseId);
  const memories = await listMemoryRefs(params.courseId);
  const activeMemories = memories.filter((m) => m.status === "active");

  if (!course) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 grid gap-5">
        {/* Catch-up CTA — the primary action on this course */}
        <Link
          href={`/courses/${params.courseId}/catchup`}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-soft transition hover:shadow-lift"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">Catch me up on what I missed</h3>
              <p className="mt-0.5 text-sm text-brand-100">
                Run the agent across your materials and memory for a prioritized plan.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 flex-none transition group-hover:translate-x-0.5" />
        </Link>

        {assignments.map((a) => (
          <DeadlineCard key={a.id} assignment={a} />
        ))}

        <div className="card card-pad">
          <SectionHeader
            title="Recent materials"
            icon={<FileText className="h-4 w-4" />}
            count={materials.length}
            action={
              <Link
                href={`/courses/${params.courseId}/materials`}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all →
              </Link>
            }
          />
          {materials.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No materials yet"
              body="Upload a syllabus, lecture slides, or announcement so the agent can reconstruct what changed."
            />
          ) : (
            <ul className="grid gap-2">
              {materials.slice(-4).reverse().map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <FileText className="h-4 w-4 flex-none text-slate-400" />
                  <span className="flex-1 truncate text-sm text-slate-700">{m.fileName}</span>
                  <Badge variant="neutral">{m.sourceType.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="card card-pad">
          <SectionHeader title="At a glance" icon={<ClipboardList className="h-4 w-4" />} />
          <dl className="grid gap-3 text-sm">
            <GlanceRow
              icon={<FileText className="h-4 w-4" />}
              label="Materials"
              value={materials.length}
            />
            <GlanceRow
              icon={<BrainCircuit className="h-4 w-4" />}
              label="Active memories"
              value={activeMemories.length}
            />
            <GlanceRow
              icon={<Layers className="h-4 w-4" />}
              label="Current unit"
              value={course.currentUnit ?? "—"}
            />
          </dl>
        </div>

        <div className="card card-pad">
          <SectionHeader title="About this course" />
          <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
        </div>
      </div>
    </div>
  );
}

function GlanceRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="truncate text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
