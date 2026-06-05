import { listPhotonMessages } from "@/lib/butterbase";
import { getPhotonStatus } from "@/lib/photon";
import { PhotonThread } from "@/components/PhotonMessagePreview";
import { PhotonStatusPanel } from "@/components/PhotonStatusPanel";
import { MessageActions } from "@/components/MessageActions";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  params,
}: {
  params: { courseId: string };
}) {
  const messages = await listPhotonMessages(params.courseId);
  const status = getPhotonStatus();
  const lastMessageStatus = messages[messages.length - 1]?.status;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Messages</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Catch-up summaries, practice nudges, and deadline updates are delivered through Photon —
          right where you already chat.
        </p>
      </div>

      <div className="mb-5">
        <PhotonStatusPanel
          status={status}
          courseId={params.courseId}
          lastMessageStatus={lastMessageStatus}
        />
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Trigger a message
        </p>
        <MessageActions courseId={params.courseId} />
      </div>

      <PhotonThread messages={messages} />
    </div>
  );
}
