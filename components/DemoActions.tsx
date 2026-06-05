"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, RotateCcw } from "lucide-react";
import { DEMO_COURSE_ID } from "@/lib/demoData";

// "Start Demo" — resets to the seeded CSC 413 state and jumps to the dashboard.
export function StartDemoButton({
  className,
  label = "Start Demo",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    await fetch("/api/demo/reset", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button onClick={start} disabled={loading} className={className ?? "btn-primary"}>
      <Play className="h-4 w-4" />
      {loading ? "Loading demo…" : label}
    </button>
  );
}

export function ResetDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function reset() {
    setLoading(true);
    await fetch("/api/demo/reset", { method: "POST" });
    router.refresh();
    setLoading(false);
  }
  return (
    <button onClick={reset} disabled={loading} className="btn-secondary">
      <RotateCcw className="h-4 w-4" />
      {loading ? "Resetting…" : "Reset demo"}
    </button>
  );
}

// "Create Course" — minimal inline creator.
export function CreateCourseButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [professor, setProfessor] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, professor }),
    });
    const data = await res.json();
    setLoading(false);
    setOpen(false);
    if (data.course?.id) {
      router.push(`/courses/${data.course.id}`);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={className ?? "btn-secondary"}>
        <Plus className="h-4 w-4" />
        Create Course
      </button>
    );
  }

  return (
    <div className="card card-pad w-full max-w-md">
      <h3 className="mb-3 font-semibold text-slate-900">New course</h3>
      <div className="grid gap-2">
        <input
          className="input"
          placeholder="Course name (e.g. CSC 413 — Software Development)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Professor (optional)"
          value={professor}
          onChange={(e) => setProfessor(e.target.value)}
        />
        <div className="mt-1 flex gap-2">
          <button onClick={create} disabled={loading || !name.trim()} className="btn-primary">
            {loading ? "Creating…" : "Create"}
          </button>
          <button onClick={() => setOpen(false)} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
