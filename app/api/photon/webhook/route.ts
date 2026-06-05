import { NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/photon";
import { searchMemory } from "@/lib/xtrace";
import { runPhotonReplyPipeline } from "@/lib/rocketride";
import { sendMessage } from "@/lib/photon";

// POST /api/photon/webhook
// Inbound message from the messaging platform. Stores it, then generates and
// sends a memory-aware reply (RocketRide E + XTrace recall + Photon send).
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // TODO(photon-live): verify the signature/secret header before trusting body.
    const { stored } = await handleIncomingMessage(payload);

    const memories = await searchMemory(stored.messageText, {
      courseId: stored.courseId,
      userId: stored.userId,
      includeSuperseded: false,
    });
    const replyText = await runPhotonReplyPipeline({
      incomingText: stored.messageText,
      memories,
    });
    const reply = await sendMessage(stored.platform, undefined, replyText, {
      userId: stored.userId,
      courseId: stored.courseId,
    });

    return NextResponse.json({ stored, reply });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "webhook failed" },
      { status: 500 }
    );
  }
}
