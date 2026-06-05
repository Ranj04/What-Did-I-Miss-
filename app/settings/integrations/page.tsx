import { Radio, Webhook } from "lucide-react";
import { getServiceStatuses } from "@/lib/config";
import { getPhotonStatus } from "@/lib/photon";
import { IntegrationStatus } from "@/components/IntegrationStatus";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const envReference = [
  { group: "Butterbase", vars: ["NEXT_PUBLIC_BUTTERBASE_URL", "BUTTERBASE_API_KEY", "BUTTERBASE_APP_ID", "BUTTERBASE_MODEL_GATEWAY_KEY"] },
  { group: "RocketRide", vars: ["ROCKETRIDE_API_KEY", "ROCKETRIDE_PIPELINE_INGESTION_ID", "ROCKETRIDE_PIPELINE_CATCHUP_ID", "ROCKETRIDE_PIPELINE_QUIZ_ID", "ROCKETRIDE_PIPELINE_CONTRADICTION_ID", "ROCKETRIDE_PIPELINE_PHOTON_REPLY_ID"] },
  { group: "XTrace", vars: ["XTRACE_API_KEY", "XTRACE_PROJECT_ID"] },
  { group: "Photon", vars: ["PHOTON_API_KEY", "PHOTON_PROJECT_ID", "PHOTON_WEBHOOK_SECRET", "PHOTON_DEFAULT_PLATFORM", "PHOTON_DEFAULT_RECIPIENT", "PHOTON_SLACK_CHANNEL_ID", "PHOTON_DISCORD_CHANNEL_ID", "PHOTON_TELEGRAM_CHAT_ID"] },
];

export default function IntegrationsPage() {
  const statuses = getServiceStatuses();
  const connected = statuses.filter((s) => s.connected).length;
  const photon = getPhotonStatus();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        eyebrow="Setup"
        title="Integrations"
        subtitle={
          <>
            {connected} of {statuses.length} live · the rest run on built-in mock data. Add
            credentials in <span className="font-mono text-slate-600">.env.local</span> and restart
            to go live.
          </>
        }
      />

      <IntegrationStatus statuses={statuses} />

      {/* Photon deep-dive — the mandatory messaging integration */}
      <div className="mt-6 card card-pad">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200">
            <Radio className="h-4 w-4" />
          </span>
          <h3 className="font-semibold text-slate-900">Photon messaging — detail</h3>
          <Badge variant={photon.connected ? "completed" : "weak"}>
            {photon.mode === "real" ? "real send" : "demo mode"}
          </Badge>
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Delivery path" value={photon.via} />
          <Row label="Default platform" value={photon.platform} />
          <Row
            label="Destination"
            value={photon.recipient === "demo-channel" ? "not set (demo)" : photon.recipient}
          />
          <Row
            label="Configured channels"
            value={
              photon.configuredChannels.length
                ? photon.configuredChannels.map((c) => c.platform).join(", ")
                : "none"
            }
          />
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <Webhook className="h-4 w-4 text-slate-400" />
          <span>
            Inbound webhook route{" "}
            <code className="font-mono text-slate-600">{photon.webhookPath}</code> is available
            {photon.webhookConfigured ? " (secret configured)" : " (no secret — demo)"}.
          </span>
        </div>
        {!photon.connected && (
          <p className="mt-2 text-xs text-slate-400">
            To send real messages, set{" "}
            <span className="font-mono text-slate-500">PHOTON_SLACK_BOT_TOKEN</span> +{" "}
            <span className="font-mono text-slate-500">PHOTON_SLACK_CHANNEL_ID</span> (or the Photon
            hub keys), then restart.
          </p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Environment variables</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {envReference.map((g) => (
            <div key={g.group} className="card card-pad">
              <h3 className="mb-2 font-semibold text-slate-800">{g.group}</h3>
              <ul className="grid gap-1">
                {g.vars.map((v) => (
                  <li key={v} className="flex items-center gap-2 text-xs">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        process.env[v] ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className="font-mono text-slate-600">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-800">{value}</dd>
    </div>
  );
}
