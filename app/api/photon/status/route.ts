import { NextResponse } from "next/server";
import { getPhotonStatus } from "@/lib/photon";
import { listPhotonMessages } from "@/lib/butterbase";

// GET /api/photon/status?courseId=...
// Returns Photon connectivity + the last logged message status.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") ?? "course_csc413";
    const status = getPhotonStatus();

    let lastMessage = null;
    try {
      const messages = await listPhotonMessages(courseId);
      const last = messages[messages.length - 1];
      if (last) {
        lastMessage = {
          status: last.status,
          direction: last.direction,
          platform: last.platform,
          createdAt: last.createdAt,
          providerMessageId: last.providerMessageId ?? null,
        };
      }
    } catch {
      /* status should still return even if the log read fails */
    }

    return NextResponse.json({ ...status, lastMessage });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "status failed" },
      { status: 500 }
    );
  }
}
