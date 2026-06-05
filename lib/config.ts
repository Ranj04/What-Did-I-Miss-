// =============================================================================
// Central env / integration-mode detection.
// Every service is "connected" only when its required keys are present;
// otherwise the app runs in DEMO MODE using deterministic mock fallbacks.
// =============================================================================

import type { ServiceStatus } from "./types";

function present(...keys: string[]): { ok: boolean; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k] || process.env[k] === "");
  return { ok: missing.length === 0, missing };
}

export function butterbaseConnected(): boolean {
  return present("NEXT_PUBLIC_BUTTERBASE_URL", "BUTTERBASE_API_KEY").ok;
}
export function rocketrideConnected(): boolean {
  return present("ROCKETRIDE_API_KEY").ok;
}
export function xtraceConnected(): boolean {
  return present("XTRACE_API_KEY", "XTRACE_PROJECT_ID").ok;
}

// A direct messaging platform is "configured" when we have a token + destination
// to post to without going through the Photon hub. This lets a Slack-only setup
// send real messages and show as live.
export function directPlatformConfigured(): boolean {
  const slack =
    present("PHOTON_SLACK_BOT_TOKEN").ok && present("PHOTON_SLACK_CHANNEL_ID").ok;
  const discord = present("PHOTON_DISCORD_WEBHOOK_URL").ok;
  const telegram =
    present("PHOTON_TELEGRAM_BOT_TOKEN").ok && present("PHOTON_TELEGRAM_CHAT_ID").ok;
  return slack || discord || telegram;
}

// Photon is "live" when the Photon hub is configured OR a direct platform is.
export function photonHubConfigured(): boolean {
  return present("PHOTON_API_KEY", "PHOTON_PROJECT_ID").ok;
}
export function photonConnected(): boolean {
  return photonHubConfigured() || directPlatformConfigured();
}

export function getServiceStatuses(): ServiceStatus[] {
  const bb = present("NEXT_PUBLIC_BUTTERBASE_URL", "BUTTERBASE_API_KEY");
  const rr = present("ROCKETRIDE_API_KEY");
  const xt = present("XTRACE_API_KEY", "XTRACE_PROJECT_ID");
  const phHub = present("PHOTON_API_KEY", "PHOTON_PROJECT_ID");
  const ph = {
    ok: phHub.ok || directPlatformConfigured(),
    // When a direct platform is wired up we don't need the hub keys, so don't
    // report them as "missing".
    missing: phHub.ok || directPlatformConfigured() ? [] : phHub.missing,
  };

  return [
    {
      name: "butterbase",
      label: "Butterbase",
      connected: bb.ok,
      detail: bb.ok
        ? "Backend live: database, auth, storage, data API & AI gateway."
        : "Demo mode: in-memory store stands in for the database & storage.",
      missingEnv: bb.missing,
    },
    {
      name: "rocketride",
      label: "RocketRide",
      connected: rr.ok,
      detail: rr.ok
        ? "Pipelines live: ingestion, catch-up, quiz, contradiction, reply."
        : "Demo mode: deterministic mock pipeline outputs with realistic delays.",
      missingEnv: rr.missing,
    },
    {
      name: "xtrace",
      label: "XTrace",
      connected: xt.ok,
      detail: xt.ok
        ? "Persistent memory live: write / search / supersede student memory."
        : "Demo mode: in-memory self-revising memory graph.",
      missingEnv: xt.missing,
    },
    {
      name: "photon",
      label: "Photon / Spectrum",
      connected: ph.ok,
      detail: ph.ok
        ? `Messaging live via ${process.env.PHOTON_DEFAULT_PLATFORM || "slack"}.`
        : "Demo mode: outbound messages are logged and shown in the Messages tab.",
      missingEnv: ph.missing,
    },
  ];
}

export function anyDemoMode(): boolean {
  return getServiceStatuses().some((s) => !s.connected);
}

export const DEFAULT_PLATFORM = (process.env.PHOTON_DEFAULT_PLATFORM || "slack") as
  | "slack"
  | "discord"
  | "telegram"
  | "whatsapp"
  | "imessage";
