import { NextResponse } from "next/server";
import { supersedeMemory, writeMemory } from "@/lib/xtrace";

// POST /api/memory/write
// Body (write):     { userId, courseId, memoryText, memoryType, source }
// Body (supersede): { supersedesMemoryId, userId, courseId, memoryText, memoryType, source }
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "user_demo",
      courseId,
      memoryText,
      memoryType = "course_fact",
      source = "manual",
      supersedesMemoryId,
    } = body ?? {};

    if (!courseId || !memoryText) {
      return NextResponse.json(
        { error: "courseId and memoryText are required" },
        { status: 400 }
      );
    }

    if (supersedesMemoryId) {
      const result = await supersedeMemory(supersedesMemoryId, {
        userId,
        courseId,
        memoryText,
        memoryType,
        source,
      });
      return NextResponse.json(result);
    }

    const created = await writeMemory({ userId, courseId, memoryText, memoryType, source });
    return NextResponse.json({ created });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "memory write failed" },
      { status: 500 }
    );
  }
}
