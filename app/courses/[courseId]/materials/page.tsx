import { FileText } from "lucide-react";
import { listMaterials } from "@/lib/butterbase";
import { MaterialUploader, MaterialList } from "@/components/MaterialUploader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const materials = await listMaterials(params.courseId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <SectionHeader
          title="Course materials"
          icon={<FileText className="h-4 w-4" />}
          count={materials.length}
        />
        {materials.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No materials yet"
            body="Upload a syllabus, lecture slides, or announcement so the agent can reconstruct what changed."
          />
        ) : (
          <MaterialList materials={materials} />
        )}
      </div>
      <div>
        <SectionHeader title="Add new material" />
        <MaterialUploader courseId={params.courseId} />
      </div>
    </div>
  );
}
