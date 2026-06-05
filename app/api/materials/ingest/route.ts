import { NextResponse } from "next/server";
import { storeMaterial } from "@/lib/butterbase";
import { runDocumentIngestionPipeline } from "@/lib/rocketride";
import { writeMemory } from "@/lib/xtrace";
import type { SourceType } from "@/lib/types";

// POST /api/materials/ingest
// Pipeline A: parse -> classify -> extract -> store (Butterbase) -> memory (XTrace)
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      courseId,
      userId = "user_demo",
      fileName = "Untitled.txt",
      materialType = "text/plain",
      sourceType = "other" as SourceType,
      parsedText = "",
      fileUrl = `mock://storage/${Date.now()}`,
    } = body ?? {};

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // RocketRide A — extract structured data from the raw text.
    const extraction = await runDocumentIngestionPipeline({
      fileName,
      parsedText,
      sourceType,
    });

    // Butterbase — persist the material row.
    const material = await storeMaterial({
      courseId,
      fileName,
      materialType,
      fileUrl,
      parsedText,
      sourceType: extraction.sourceType,
    });

    // XTrace — write durable facts / clarifications as memory.
    const memoriesWritten = [];
    for (const fact of extraction.durableFacts) {
      memoriesWritten.push(
        await writeMemory({
          userId,
          courseId,
          memoryText: fact,
          memoryType: "clarification",
          source: "ingestion",
        })
      );
    }

    return NextResponse.json({ material, extraction, memoriesWritten });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "ingest failed" },
      { status: 500 }
    );
  }
}
