import { NextResponse } from "next/server";
import { runCatchUpAgent } from "@/lib/agents";

// POST /api/catchup/generate
// Body: { userId, courseId, question, missedStartDate, missedEndDate }
// Runs the multi-tool catch-up agent (Butterbase + XTrace + RocketRide + Photon).
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "user_demo",
      courseId,
      question,
      missedStartDate = "2026-05-25T00:00:00.000Z",
      missedEndDate = "2026-06-02T00:00:00.000Z",
    } = body ?? {};

    if (!courseId || !question) {
      return NextResponse.json(
        { error: "courseId and question are required" },
        { status: 400 }
      );
    }

    const result = await runCatchUpAgent({
      userId,
      courseId,
      question,
      missedStartDate,
      missedEndDate,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "catch-up failed" },
      { status: 500 }
    );
  }
}
