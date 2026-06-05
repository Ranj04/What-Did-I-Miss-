// =============================================================================
// Photon / Spectrum adapter — MESSAGING delivery.
// Delivers catch-up summaries, practice nudges and deadline updates to a real
// messaging platform (Slack first; Discord / Telegram as fallback) and ingests
// inbound replies via webhook.
//
// DELIVERY PRIORITY (first configured path wins):
//   1. Photon / Spectrum hub  (PHOTON_API_KEY + PHOTON_PROJECT_ID)
//   2. Direct Slack           (PHOTON_SLACK_BOT_TOKEN + PHOTON_SLACK_CHANNEL_ID)
//   3. Direct Discord webhook (PHOTON_DISCORD_WEBHOOK_URL)
//   4. Direct Telegram        (PHOTON_TELEGRAM_BOT_TOKEN + PHOTON_TELEGRAM_CHAT_ID)
//   5. DEMO MODE              — logged to Butterbase + shown in the Messages tab
//
// Every send is persisted via storePhotonMessage, so the Messages tab is a real
// log of what went out (or would have gone out, in demo mode).
// =============================================================================

import { storePhotonMessage } from "./butterbase";
import {
  DEFAULT_PLATFORM,
  directPlatformConfigured,
  photonConnected,
  photonHubConfigured,
} from "./config";
import type { MessageDirection, Platform, PhotonMessage } from "./types";

const PHOTON_BASE = process.env.PHOTON_BASE_URL ?? "https://api.photon.ai";
const PHOTON_KEY = process.env.PHOTON_API_KEY;
const PHOTON_PROJECT = process.env.PHOTON_PROJECT_ID;
export const WEBHOOK_SECRET = process.env.PHOTON_WEBHOOK_SECRET ?? "";

const DEFAULT_RECIPIENT = process.env.PHOTON_DEFAULT_RECIPIENT ?? "";

// Per-platform default destinations (channel / chat ids).
const PLATFORM_RECIPIENT: Record<Platform, string | undefined> = {
  slack: process.env.PHOTON_SLACK_CHANNEL_ID,
  discord: process.env.PHOTON_DISCORD_CHANNEL_ID,
  telegram: process.env.PHOTON_TELEGRAM_CHAT_ID,
  whatsapp: process.env.PHOTON_WHATSAPP_RECIPIENT,
  imessage: process.env.PHOTON_IMESSAGE_RECIPIENT,
};

export function isLive(): boolean {
  return photonConnected();
}

function resolveRecipient(platform: Platform, explicit?: string): string {
  return explicit || PLATFORM_RECIPIENT[platform] || DEFAULT_RECIPIENT || "demo-channel";
}

// ---------------------------------------------------------------------------
// Low-level delivery. Returns the outcome but never throws — a failed send is
// recorded as status "failed" with an error message, so a flow is never broken
// by messaging being down.
// ---------------------------------------------------------------------------
interface DeliveryResult {
  status: PhotonMessage["status"];
  providerMessageId?: string;
  errorMessage?: string;
}

async function deliver(
  platform: Platform,
  recipient: string,
  text: string
): Promise<DeliveryResult> {
  // (1) Photon / Spectrum hub — the messaging-platform-agnostic path.
  if (photonHubConfigured()) {
    try {
      // TODO(photon-live): confirm the exact Photon/Spectrum send contract. This
      // is a realistic shape: POST /v1/messages with platform + recipient + text.
      const res = await fetch(`${PHOTON_BASE}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PHOTON_KEY}`,
          "X-Project-Id": PHOTON_PROJECT ?? "",
        },
        body: JSON.stringify({ platform, recipient, text }),
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { status: "failed", errorMessage: `Photon ${res.status} ${body}`.trim() };
      }
      const json = await res.json().catch(() => ({}));
      return { status: "sent", providerMessageId: json?.id ?? json?.messageId };
    } catch (e) {
      // Fall through to a direct platform path if one is configured.
      if (!directPlatformConfigured()) {
        return { status: "failed", errorMessage: (e as Error).message };
      }
    }
  }

  // (2) Direct Slack — Slack Web API chat.postMessage.
  if (
    platform === "slack" &&
    process.env.PHOTON_SLACK_BOT_TOKEN &&
    (recipient || process.env.PHOTON_SLACK_CHANNEL_ID)
  ) {
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${process.env.PHOTON_SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          channel: recipient || process.env.PHOTON_SLACK_CHANNEL_ID,
          text,
        }),
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) return { status: "sent", providerMessageId: json.ts };
      return { status: "failed", errorMessage: `Slack: ${json?.error ?? res.status}` };
    } catch (e) {
      return { status: "failed", errorMessage: (e as Error).message };
    }
  }

  // (3) Direct Discord — incoming webhook.
  if (platform === "discord" && process.env.PHOTON_DISCORD_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.PHOTON_DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
        cache: "no-store",
      });
      if (res.ok) return { status: "sent" };
      return { status: "failed", errorMessage: `Discord ${res.status}` };
    } catch (e) {
      return { status: "failed", errorMessage: (e as Error).message };
    }
  }

  // (4) Direct Telegram — Bot API sendMessage.
  if (
    platform === "telegram" &&
    process.env.PHOTON_TELEGRAM_BOT_TOKEN &&
    (recipient || process.env.PHOTON_TELEGRAM_CHAT_ID)
  ) {
    try {
      const token = process.env.PHOTON_TELEGRAM_BOT_TOKEN;
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: recipient || process.env.PHOTON_TELEGRAM_CHAT_ID,
          text,
        }),
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) return { status: "sent", providerMessageId: String(json?.result?.message_id ?? "") };
      return { status: "failed", errorMessage: `Telegram: ${json?.description ?? res.status}` };
    } catch (e) {
      return { status: "failed", errorMessage: (e as Error).message };
    }
  }

  // (5) Demo mode — nothing is actually sent; it's logged for the Messages tab.
  return { status: "demo" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface SendMetadata {
  userId?: string;
  courseId?: string;
  relatedSessionId?: string;
  direction?: MessageDirection;
}

// Primary send. `platform`/`recipient` may be omitted to use the configured
// defaults. Always persists a log row; returns it.
export async function sendMessage(
  platform: Platform | undefined,
  recipient: string | undefined,
  messageText: string,
  metadata: SendMetadata = {}
): Promise<PhotonMessage> {
  const plat = platform ?? DEFAULT_PLATFORM;
  const to = resolveRecipient(plat, recipient);
  const direction = metadata.direction ?? "outbound";

  const result =
    direction === "outbound"
      ? await deliver(plat, to, messageText)
      : { status: "received" as const };

  return storePhotonMessage({
    userId: metadata.userId ?? "user_demo",
    courseId: metadata.courseId ?? "course_csc413",
    platform: plat,
    direction,
    messageText,
    relatedSessionId: metadata.relatedSessionId,
    status: result.status,
    providerMessageId: result.providerMessageId,
    errorMessage: result.errorMessage,
  });
}

// Convenience wrappers used by the core flows --------------------------------

export async function sendCatchUpSummary(
  userId: string,
  courseId: string,
  summary: string,
  relatedSessionId?: string
): Promise<PhotonMessage> {
  return sendMessage(undefined, undefined, `Catch-Up: ${summary}`, {
    userId,
    courseId,
    relatedSessionId,
  });
}

export async function sendPracticeNudge(
  userId: string,
  courseId: string,
  questionOrFeedback: string
): Promise<PhotonMessage> {
  return sendMessage(undefined, undefined, `Practice nudge: ${questionOrFeedback}`, {
    userId,
    courseId,
  });
}

export async function sendDeadlineUpdate(
  userId: string,
  courseId: string,
  updateText: string
): Promise<PhotonMessage> {
  return sendMessage(undefined, undefined, `Deadline update: ${updateText}`, {
    userId,
    courseId,
  });
}

// A connectivity check the Messages tab can trigger.
export async function sendTestMessage(
  userId = "user_demo",
  courseId = "course_csc413"
): Promise<PhotonMessage> {
  return sendMessage(
    undefined,
    undefined,
    "Photon test from What Did I Miss?: messaging integration is connected.",
    { userId, courseId }
  );
}

// Inbound webhook -------------------------------------------------------------
export interface IncomingPayload {
  platform?: Platform;
  userId?: string;
  courseId?: string;
  text: string;
  secret?: string;
}

export async function handleIncomingMessage(
  payload: IncomingPayload
): Promise<{ stored: PhotonMessage }> {
  // TODO(photon-live): verify payload.secret === WEBHOOK_SECRET with a constant
  // time compare and validate the platform signature header before trusting body.
  const userId = payload.userId ?? "user_demo";
  const courseId = payload.courseId ?? "course_csc413";
  const platform = payload.platform ?? DEFAULT_PLATFORM;

  const stored = await sendMessage(platform, undefined, payload.text, {
    userId,
    courseId,
    direction: "inbound",
  });

  // The reply (RocketRide E + XTrace recall + Photon send) is wired in the
  // webhook route to avoid a circular import here.
  return { stored };
}

// Status -----------------------------------------------------------------------
export type PhotonMode = "real" | "demo";

export interface PhotonStatus {
  connected: boolean;
  mode: PhotonMode;
  platform: Platform;
  recipient: string;
  via: "photon-hub" | "direct-platform" | "demo";
  configuredChannels: { platform: Platform; recipient: string }[];
  missingEnv: string[];
  webhookConfigured: boolean;
  webhookPath: string;
}

export function getPhotonStatus(): PhotonStatus {
  const connected = photonConnected();
  const platform = DEFAULT_PLATFORM;
  const via: PhotonStatus["via"] = photonHubConfigured()
    ? "photon-hub"
    : directPlatformConfigured()
    ? "direct-platform"
    : "demo";

  const configuredChannels = (Object.keys(PLATFORM_RECIPIENT) as Platform[])
    .map((p) => ({ platform: p, recipient: PLATFORM_RECIPIENT[p] ?? "" }))
    .filter((c) => c.recipient);

  // What's missing to reach a real send, in priority order.
  const missingEnv: string[] = [];
  if (!connected) {
    missingEnv.push(
      "PHOTON_API_KEY + PHOTON_PROJECT_ID (hub) — or a direct platform:",
      "PHOTON_SLACK_BOT_TOKEN + PHOTON_SLACK_CHANNEL_ID"
    );
  }

  return {
    connected,
    mode: connected ? "real" : "demo",
    platform,
    recipient: resolveRecipient(platform),
    via,
    configuredChannels,
    missingEnv,
    webhookConfigured: Boolean(WEBHOOK_SECRET),
    webhookPath: "/api/photon/webhook",
  };
}
