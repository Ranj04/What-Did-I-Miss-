"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Sparkles,
  Brain,
  BrainCircuit,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/courses/${courseId}`;
  const tabs = [
    { href: base, label: "Overview", icon: LayoutGrid },
    { href: `${base}/materials`, label: "Materials", icon: FileText },
    { href: `${base}/catchup`, label: "Catch-Up", icon: Sparkles },
    { href: `${base}/practice`, label: "Practice", icon: Brain },
    { href: `${base}/memory`, label: "Memory", icon: BrainCircuit },
    { href: `${base}/messages`, label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
