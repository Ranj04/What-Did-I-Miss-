import { MessageSquare } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { PhotonMessage, Platform } from "@/lib/types";

const platformMeta: Record<Platform, { label: string; dot: string; tint: string }> = {
  slack: { label: "Slack", dot: "bg-[#611f69]", tint: "text-[#611f69]" },
  discord: { label: "Discord", dot: "bg-[#5865F2]", tint: "text-[#5865F2]" },
  telegram: { label: "Telegram", dot: "bg-[#229ED9]", tint: "text-[#229ED9]" },
  whatsapp: { label: "WhatsApp", dot: "bg-[#25D366]", tint: "text-[#1da851]" },
  imessage: { label: "iMessage", dot: "bg-[#34DA50]", tint: "text-[#1aa336]" },
};

export function PhotonMessagePreview({ message }: { message: PhotonMessage }) {
  const outbound = message.direction === "outbound";
  const meta = platformMeta[message.platform];
  return (
    <div className={cn("flex flex-col", outbound ? "items-end" : "items-start")}>
      {/* platform + meta line */}
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 px-1 text-[11px]",
          outbound ? "flex-row-reverse" : "flex-row"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        <span className={cn("font-semibold", meta.tint)}>{meta.label}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{formatDateTime(message.createdAt)}</span>
        {(message.status === "mock" || message.status === "demo") && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">demo</span>
          </>
        )}
        {message.status === "sent" && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-500">sent</span>
          </>
        )}
        {message.status === "failed" && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-rose-500">failed</span>
          </>
        )}
      </div>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          outbound
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
        )}
      >
        {message.messageText}
      </div>
    </div>
  );
}

export function PhotonThread({ messages }: { messages: PhotonMessage[] }) {
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-5 w-5" />}
        title="No messages yet"
        body="Photon messages will appear here when the agent sends a catch-up summary, a practice nudge, or a deadline update."
      />
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">Conversation</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {messages.length}
        </span>
      </div>
      <div className="space-y-4 bg-slate-50/30 p-4 sm:p-5">
        {messages.map((m) => (
          <PhotonMessagePreview key={m.id} message={m} />
        ))}
      </div>
    </div>
  );
}
