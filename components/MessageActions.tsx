"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Send, MessageSquarePlus } from "lucide-react";

// Buttons that exercise Photon: deadline update + practice nudge (outbound) and
// a simulated inbound student question that gets a memory-aware auto-reply.
export function MessageActions({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function send(key: string, body: Record<string, unknown>, url: string) {
    setLoading(key);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() =>
          send(
            "deadline",
            { courseId, messageText: "Deadline update: Project 2 is now due Friday at 11:59 PM." },
            "/api/photon/send"
          )
        }
        disabled={loading !== null}
        className="btn-secondary btn-sm"
      >
        <CalendarClock className="h-4 w-4" />
        {loading === "deadline" ? "Sending…" : "Send Deadline Update"}
      </button>

      <button
        onClick={() =>
          send(
            "nudge",
            {
              courseId,
              messageText:
                "Quick practice: how does the WebSocket reuse the bearer token from REST login?",
            },
            "/api/photon/send"
          )
        }
        disabled={loading !== null}
        className="btn-secondary btn-sm"
      >
        <Send className="h-4 w-4" />
        {loading === "nudge" ? "Sending…" : "Send Practice Nudge"}
      </button>

      <button
        onClick={() =>
          send(
            "inbound",
            { courseId, userId: "user_demo", text: "Explain the chat connection part." },
            "/api/photon/webhook"
          )
        }
        disabled={loading !== null}
        className="btn-secondary btn-sm"
      >
        <MessageSquarePlus className="h-4 w-4" />
        {loading === "inbound" ? "Working…" : "Simulate Incoming Question"}
      </button>
    </div>
  );
}
