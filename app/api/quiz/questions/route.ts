import { NextResponse } from "next/server";
import { getCourse, listMaterials } from "@/lib/butterbase";
import { runQuizGenerationPipeline } from "@/lib/rocketride";

// GET /api/quiz/questions?courseId=... — RocketRide C generates practice questions.
export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }
  const course = await getCourse(courseId);
  if (!course) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }
  const materials = await listMaterials(courseId);
  const questions = await runQuizGenerationPipeline({ course, materials });
  return NextResponse.json({ questions });
}
