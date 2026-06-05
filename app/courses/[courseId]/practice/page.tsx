import Link from "next/link";
import { getCourse, listMaterials } from "@/lib/butterbase";
import { runQuizGenerationPipeline } from "@/lib/rocketride";
import { PracticeQuestion } from "@/components/PracticeQuestion";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await getCourse(params.courseId);
  const materials = await listMaterials(params.courseId);
  const questions = course
    ? await runQuizGenerationPipeline({ course, materials })
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Practice</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Test yourself. Miss a question and the agent logs the gap to memory and sends you a
          practice nudge — and future explanations adapt to what you struggled with.
        </p>
      </div>

      <div className="grid gap-4">
        {questions.map((q) => (
          <PracticeQuestion key={q.id} question={q} courseId={params.courseId} />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 text-sm text-slate-500">
        <span className="font-medium text-slate-700">Try the demo path:</span> miss the
        REST-vs-WebSocket question, then open the{" "}
        <Link
          href={`/courses/${params.courseId}/memory`}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Memory tab
        </Link>{" "}
        and ask &ldquo;Explain the chat connection part&rdquo; to see memory-aware recall in action.
      </div>
    </div>
  );
}
