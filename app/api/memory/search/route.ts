import { NextResponse } from "next/server";
import { searchMemory } from "@/lib/xtrace";
import { runPhotonReplyPipeline } from "@/lib/rocketride";

// POST /api/memory/search
// Body: { query, courseId, userId?, reply? }
// Searches XTrace; when reply=true, also returns a memory-aware answer
// (RocketRide E) — this powers "Explain the chat connection part."
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, courseId, userId = "user_demo", reply = false } = body ?? {};
    if (!query || !courseId) {
      return NextResponse.json(
        { error: "query and courseId are required" },
        { status: 400 }
      );
    }

    const matches = await searchMemory(query, { courseId, userId, includeSuperseded: false });

    let answer: string | undefined;
    if (reply) {
      answer = await runPhotonReplyPipeline({ incomingText: query, memories: matches });
    }

    return NextResponse.json({ matches, answer });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "memory search failed" },
      { status: 500 }
    );
  }
}
