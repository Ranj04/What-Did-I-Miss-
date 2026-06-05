import { NextResponse } from "next/server";
import { createCourse, listCourses } from "@/lib/butterbase";

// GET  /api/courses        — list courses for the demo user
// POST /api/courses        — create a course
export async function GET() {
  const courses = await listCourses("user_demo");
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "user_demo",
      name,
      professor = "",
      term = "",
      description = "",
      currentUnit = "",
      currentProject = "",
    } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const course = await createCourse({
      userId,
      name,
      professor,
      term,
      description,
      currentUnit,
      currentProject,
    });
    return NextResponse.json({ course });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "create failed" },
      { status: 500 }
    );
  }
}
