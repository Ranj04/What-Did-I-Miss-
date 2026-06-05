"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Send, CheckCircle2, CircleDashed, ArrowRight } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import type { PhotonStatus } from "@/lib/photon";

const PLATFORMS: { id: Platform; label: string; dot: string }[] = [
  { id: "slack", label: "Slack", dot: "bg-[#611f69]" },
  { id: "discord", label: "Discord", dot: "bg-[#5865F2]" },
  { id: "telegram", label: "Telegram", dot: "bg-[#229ED9]" },
  { id: "whatsapp", label: "WhatsApp", dot: "bg-[#25D366]" },
  { id: "imessage", label: "iMessage", dot: "bg-[#34DA50]" },
];

export function PhotonStatusPanel({
  status,
  courseId,
  lastMessageStatus,
}: {
  status: PhotonStatus;
  courseId: string;
  lastMessageStatus?: string;
}) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; note: string } | null>(null);
  const live = status.connected;

  async function sendTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/photon/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      setResult({ ok: Boolean(data.ok), note: data.note ?? "Test sent." });
      router.refresh();
    } catch (e) {
      setResult({ ok: false, note: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header / status row */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 ring-inset",
              live
                ? "bg-amber-50 text-amber-600 ring-amber-200"
                : "bg-slate-100 text-slate-500 ring-slate-200"
            )}
          >
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">Photon / Spectrum</h3>
              {live ? (
                <Badge variant="completed">
                  <CheckCircle2 className="h-3.5 w-3.5" /> live
                </Badge>
              ) : (
                <Badge variant="weak">
                  <CircleDashed className="h-3.5 w-3.5" /> demo mode
                </Badge>
              )}
            </div>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
              Photon delivers catch-up summaries, practice nudges, and deadline updates to the
              messaging apps students already use.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button onClick={sendTest} disabled={testing} className="btn-primary btn-sm">
            <Send className="h-4 w-4" />
            {testing ? "Sending…" : "Send Test Message"}
          </button>
          {result && (
            <span
              className={cn(
                "text-xs font-medium",
                result.ok ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {result.note}
            </span>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <dl className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
        <Detail label="Mode" value={status.mode === "real" ? "Real send" : "Demo / logged"} />
        <Detail label="Platform" value={cap(status.platform)} />
        <Detail
          label="Destination"
          value={status.recipient === "demo-channel" ? "— (set channel)" : status.recipient}
        />
        <Detail
          label="Last message"
          value={lastMessageStatus ? cap(lastMessageStatus) : "None yet"}
        />
      </dl>

      {/* Platform badges */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        <span className="mr-1 text-xs font-medium text-slate-400">Platforms:</span>
        {PLATFORMS.map((p) => {
          const isDefault = p.id === status.platform;
          const configured = status.configuredChannels.some((c) => c.platform === p.id);
          return (
            <span
              key={p.id}
              className={cn(
                "chip",
                isDefault && live && "border-amber-200 bg-amber-50",
                isDefault && "ring-1 ring-inset ring-slate-200"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
              <span className="font-medium text-slate-700">{p.label}</span>
              {isDefault ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  default
                </span>
              ) : configured ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : null}
            </span>
          );
        })}
      </div>

      {/* Webhook + missing env hint */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5" />
          Inbound webhook:{" "}
          <code className="font-mono text-slate-500">{status.webhookPath}</code>
          {status.webhookConfigured ? (
            <span className="text-emerald-600">· secret set</span>
          ) : (
            <span>· no secret (demo)</span>
          )}
        </span>
        {!live && status.missingEnv.length > 0 && (
          <span className="text-slate-400">
            To go live: <span className="font-mono text-slate-500">{status.missingEnv[0]}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
