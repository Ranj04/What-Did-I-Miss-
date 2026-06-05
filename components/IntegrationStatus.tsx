import { CheckCircle2, CircleDashed, Database, Rocket, BrainCircuit, Radio } from "lucide-react";
import { Badge } from "./ui/Badge";
import type { ServiceName, ServiceStatus } from "@/lib/types";

const icons: Record<ServiceName, React.ReactNode> = {
  butterbase: <Database className="h-5 w-5" />,
  rocketride: <Rocket className="h-5 w-5" />,
  xtrace: <BrainCircuit className="h-5 w-5" />,
  photon: <Radio className="h-5 w-5" />,
};

const roles: Record<ServiceName, string> = {
  butterbase: "Backend · DB · Auth · Storage · AI Gateway",
  rocketride: "AI pipelines · multi-agent workflows",
  xtrace: "Persistent self-revising memory",
  photon: "Messaging delivery",
};

export function IntegrationStatus({ statuses }: { statuses: ServiceStatus[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {statuses.map((s) => (
        <div key={s.name} className="card card-pad">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  s.connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {icons[s.name]}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{s.label}</h3>
                <p className="text-xs text-slate-500">{roles[s.name]}</p>
              </div>
            </div>
            {s.connected ? (
              <Badge variant="completed">
                <CheckCircle2 className="h-3.5 w-3.5" /> connected
              </Badge>
            ) : (
              <Badge variant="weak">
                <CircleDashed className="h-3.5 w-3.5" /> demo mode
              </Badge>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-600">{s.detail}</p>
          {!s.connected && s.missingEnv.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Set <span className="font-mono text-slate-500">{s.missingEnv.join(", ")}</span> to go
              live.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
