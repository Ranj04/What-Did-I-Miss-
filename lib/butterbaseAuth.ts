// =============================================================================
// Butterbase Auth — end-user authentication for the app.
// Wraps the Butterbase auth service:  /auth/{app_id}/{signup|login|refresh|logout}
// Each app has its own isolated user accounts and JWTs.
//
// The current UI runs as a single demo student (server-rendered, no session
// cookie), so these helpers are the structured seam for real auth: wire a
// login page + an httpOnly cookie holding the access/refresh tokens, then read
// the token in middleware / route handlers and pass it as the Authorization
// header (role butterbase_user) instead of the service key. Until then the app
// preserves demo mode.
//
// DEMO MODE (no Butterbase keys): returns a stub session for the demo user.
// =============================================================================

import { butterbaseConnected } from "./config";
import { DEMO_USER } from "./demoData";

const BASE = process.env.NEXT_PUBLIC_BUTTERBASE_URL;
const APP_ID = process.env.BUTTERBASE_APP_ID;

export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  user: AuthUser;
}

function authUrl(path: string): string {
  return `${BASE}/auth/${APP_ID}${path}`;
}

async function authFetch(path: string, body: unknown, token?: string) {
  const res = await fetch(authUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Butterbase auth ${path} -> ${res.status} ${detail}`);
  }
  return res.json();
}

/** Register a new end-user. Password: 8+ chars w/ upper, lower, number, symbol. */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  if (!butterbaseConnected()) {
    return { id: DEMO_USER.id, email, display_name: displayName ?? DEMO_USER.name };
  }
  return authFetch("/signup", { email, password, display_name: displayName });
}

/** Sign in; returns access + refresh tokens and the user profile. */
export async function logIn(email: string, password: string): Promise<AuthSession> {
  if (!butterbaseConnected()) {
    return demoSession(email);
  }
  return authFetch("/login", { email, password });
}

/** Exchange a refresh token for a fresh access token (rotation). */
export async function refresh(refreshToken: string): Promise<AuthSession> {
  if (!butterbaseConnected()) return demoSession(DEMO_USER.email);
  return authFetch("/refresh", { refresh_token: refreshToken });
}

/** Revoke the user's refresh tokens. */
export async function logOut(accessToken: string): Promise<void> {
  if (!butterbaseConnected()) return;
  await authFetch("/logout", {}, accessToken);
}

function demoSession(email: string): AuthSession {
  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
    user: { id: DEMO_USER.id, email, display_name: DEMO_USER.name, email_verified: true },
  };
}
