import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/photon";
import type { Platform } from "@/lib/types";

// POST /api/photon/send
// Body: { userId, courseId, messageText, platform? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "user_demo",
      courseId,
      messageText,
      platform,
    }: { userId?: string; courseId: string; messageText: string; platform?: Platform } =
      body ?? {};

    if (!courseId || !messageText) {
      return NextResponse.json(
        { error: "courseId and messageText are required" },
        { status: 400 }
      );
    }

    const message = await sendMessage(platform, undefined, messageText, {
      userId,
      courseId,
    });
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "send failed" },
      { status: 500 }
    );
  }
}
