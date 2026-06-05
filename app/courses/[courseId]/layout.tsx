import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCourse, listAssignments } from "@/lib/butterbase";
import { CourseTabs } from "@/components/CourseTabs";
import { CourseWorkspaceHeader } from "@/components/CourseWorkspaceHeader";

export const dynamic = "force-dynamic";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { courseId: string };
}) {
  const course = await getCourse(params.courseId);
  const assignments = course ? await listAssignments(params.courseId) : [];
  const nextAssignment = assignments
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>

      {course ? (
        <div className="mb-5">
          <CourseWorkspaceHeader course={course} nextAssignment={nextAssignment} />
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Course not found. It may have been reset —{" "}
          <Link href="/dashboard" className="font-medium underline">
            go back to the dashboard
          </Link>
          .
        </div>
      )}

      <CourseTabs courseId={params.courseId} />
      {children}
    </div>
  );
}
