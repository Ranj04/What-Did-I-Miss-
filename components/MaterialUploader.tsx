"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Sparkles } from "lucide-react";
import { Badge } from "./ui/Badge";
import type { SourceType } from "@/lib/types";
import type { IngestionResult } from "@/lib/rocketride";

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "lecture_slides", label: "Lecture slides" },
  { value: "assignment", label: "Assignment" },
  { value: "announcement", label: "Announcement" },
  { value: "notes", label: "Notes" },
  { value: "group_chat_summary", label: "Group chat summary" },
  { value: "syllabus", label: "Syllabus" },
  { value: "other", label: "Other" },
];

export function MaterialUploader({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("notes");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);

  async function ingest() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/materials/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        fileName: fileName || `Pasted-${sourceType}-${Date.now()}.txt`,
        sourceType,
        materialType: "text/plain",
        parsedText: text,
      }),
    });
    const data = await res.json();
    setResult(data.extraction ?? null);
    setText("");
    setFileName("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card card-pad">
      <div className="mb-1 flex items-center gap-2">
        <UploadCloud className="h-5 w-5 text-brand-600" />
        <h3 className="font-semibold text-slate-900">Paste material to ingest</h3>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Extracts concepts and dates, then files it to memory — so the next catch-up reflects it.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="File name (optional)"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <select
          className="input"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceType)}
        >
          {SOURCE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="input mt-3 min-h-[110px] resize-y"
        placeholder="Paste lecture text, an announcement, or a group-chat summary…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={ingest} disabled={loading || !text.trim()} className="btn-primary mt-3">
        {loading ? "Analyzing…" : "Ingest & Analyze"}
      </button>

      {result && (
        <div className="mt-4 animate-fade-in rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-600">What the agent extracted</span>
            <Badge variant="info">{result.sourceType}</Badge>
          </div>
          <div className="grid gap-1 text-xs text-slate-600">
            {result.concepts.length > 0 && (
              <p>
                <span className="font-medium">Concepts:</span> {result.concepts.join(", ")}
              </p>
            )}
            {result.extractedDates.length > 0 && (
              <p>
                <span className="font-medium">Dates:</span> {result.extractedDates.join(", ")}
              </p>
            )}
            {result.clarifications.length > 0 && (
              <p>
                <span className="font-medium">Clarifications → XTrace:</span>{" "}
                {result.clarifications.join("; ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MaterialList({
  materials,
}: {
  materials: { id: string; fileName: string; sourceType: string; parsedText: string }[];
}) {
  return (
    <div className="grid gap-3">
      {materials.map((m) => (
        <div key={m.id} className="card card-pad">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate font-medium text-slate-900">{m.fileName}</h4>
                <Badge variant="neutral">{m.sourceType.replace(/_/g, " ")}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.parsedText}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
