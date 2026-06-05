import { NextResponse } from "next/server";
import { sendTestMessage, getPhotonStatus } from "@/lib/photon";

// POST /api/photon/test
// Sends "Photon test from What Did I Miss?: messaging integration is connected."
// In demo mode this returns a mock success and logs that demo mode is active.
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, courseId } = body ?? {};
    const status = getPhotonStatus();
    const message = await sendTestMessage(userId, courseId);
    return NextResponse.json({
      ok: message.status !== "failed",
      mode: status.mode,
      via: status.via,
      message,
      note:
        status.mode === "demo"
          ? "Demo mode is active — the message was logged, not sent to a real platform."
          : `Sent via ${status.via} to ${status.platform}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "test failed" },
      { status: 500 }
    );
  }
}
