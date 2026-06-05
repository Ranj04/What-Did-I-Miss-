import { Database, Rocket, BrainCircuit, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceName } from "@/lib/types";

// Single source of truth for how each partner integration is presented.
// Each has its own restrained accent so the four are distinguishable without
// turning the UI into a rainbow.
export const INTEGRATION_META: Record<
  ServiceName,
  { label: string; role: string; icon: React.ReactNode; accent: string; dot: string }
> = {
  rocketride: {
    label: "RocketRide",
    role: "Agentic pipelines",
    icon: <Rocket className="h-4 w-4" />,
    accent: "text-brand-600 bg-brand-50 ring-brand-200",
    dot: "bg-brand-500",
  },
  butterbase: {
    label: "Butterbase",
    role: "Backend & storage",
    icon: <Database className="h-4 w-4" />,
    accent: "text-emerald-600 bg-emerald-50 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  xtrace: {
    label: "XTrace",
    role: "Persistent memory",
    icon: <BrainCircuit className="h-4 w-4" />,
    accent: "text-violet-600 bg-violet-50 ring-violet-200",
    dot: "bg-violet-500",
  },
  photon: {
    label: "Photon",
    role: "Messaging delivery",
    icon: <Radio className="h-4 w-4" />,
    accent: "text-amber-600 bg-amber-50 ring-amber-200",
    dot: "bg-amber-500",
  },
};

export const INTEGRATION_ORDER: ServiceName[] = [
  "rocketride",
  "butterbase",
  "xtrace",
  "photon",
];

// Compact pill: icon + name, with the integration's own accent.
export function IntegrationBadge({
  name,
  showRole = false,
  className,
}: {
  name: ServiceName;
  showRole?: boolean;
  className?: string;
}) {
  const meta = INTEGRATION_META[name];
  return (
    <span className={cn("chip", className)}>
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded ring-1 ring-inset",
          meta.accent
        )}
      >
        {meta.icon}
      </span>
      <span className="font-semibold text-slate-700">{meta.label}</span>
      {showRole ? <span className="font-normal text-slate-400">· {meta.role}</span> : null}
    </span>
  );
}
