import { NextResponse } from "next/server";
import { storeQuizAttempt } from "@/lib/butterbase";
import { gradeQuizAnswer, type QuizQuestion } from "@/lib/rocketride";
import { sendPracticeNudge } from "@/lib/photon";
import { writeMemory } from "@/lib/xtrace";

// POST /api/quiz/submit
// Pipeline C: grade -> detect weakness -> store attempt (Butterbase)
//             -> learning-gap memory (XTrace) -> practice nudge (Photon)
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "user_demo",
      courseId,
      question,
      studentAnswer,
    }: { userId?: string; courseId: string; question: QuizQuestion; studentAnswer: string } =
      body ?? {};

    if (!courseId || !question || studentAnswer == null) {
      return NextResponse.json(
        { error: "courseId, question and studentAnswer are required" },
        { status: 400 }
      );
    }

    const grade = await gradeQuizAnswer({ question, studentAnswer });

    const attempt = await storeQuizAttempt({
      userId,
      courseId,
      question: question.question,
      studentAnswer,
      correctAnswer: grade.correctAnswer,
      isCorrect: grade.isCorrect,
      conceptTag: grade.conceptTag,
    });

    let learningGapMemory = null;
    let nudge = null;
    if (!grade.isCorrect && grade.learningGapMemory) {
      // XTrace — remember the specific misunderstanding.
      learningGapMemory = await writeMemory({
        userId,
        courseId,
        memoryText: grade.learningGapMemory,
        memoryType: "learning_gap",
        source: "quiz",
      });
      // Photon — nudge with a targeted practice prompt.
      nudge = await sendPracticeNudge(
        userId,
        courseId,
        "Review the difference between REST (login/room list) and WebSocket (live messages)."
      );
    }

    return NextResponse.json({ grade, attempt, learningGapMemory, nudge });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "quiz submit failed" },
      { status: 500 }
    );
  }
}
