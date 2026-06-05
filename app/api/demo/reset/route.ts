import { NextResponse } from "next/server";
import { resetDb } from "@/lib/store";
import { DEMO_COURSE_ID } from "@/lib/demoData";
import { isLive } from "@/lib/butterbase";
import { seedDemoLive } from "@/lib/seed";

// POST /api/demo/reset — restore the seeded CSC 413 demo state.
// LIVE: wipes + reseeds the demo course in Butterbase. DEMO: resets the store.
export async function POST() {
  if (isLive()) {
    const { courseId } = await seedDemoLive();
    return NextResponse.json({ ok: true, courseId, mode: "butterbase" });
  }
  resetDb();
  return NextResponse.json({ ok: true, courseId: DEMO_COURSE_ID, mode: "demo" });
}
