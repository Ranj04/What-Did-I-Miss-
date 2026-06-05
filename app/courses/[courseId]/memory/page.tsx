import { getCourseMemories } from "@/lib/xtrace";
import { MemoryPanel } from "@/components/MemoryPanel";

export const dynamic = "force-dynamic";

export default async function MemoryPage({
  params,
}: {
  params: { courseId: string };
}) {
  const memories = await getCourseMemories(params.courseId);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Memory</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          The agent keeps persistent, self-revising memory about you and this course. When a fact
          changes, the old version is kept and marked superseded — not deleted — so you can always
          see what changed.
        </p>
      </div>
      <MemoryPanel courseId={params.courseId} memories={memories} />
    </div>
  );
}
