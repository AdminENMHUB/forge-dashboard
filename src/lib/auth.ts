/**
 * Edge-runtime-compatible session cookie helpers for the CEO dashboard.
 *
 * Single-user, single-password gate. We issue a short HMAC-signed cookie
 * `dashboard_session=<base64url(payload)>.<base64url(sig)>` where `payload`
 * is a JSON blob `{sub, iat, exp}`. Verification is constant-time and happens
 * in middleware.ts on every request.
 *
 * No external dependencies — uses Web Crypto (crypto.subtle) available on
 * both Edge Runtime and Node 20+.
 */

export const SESSION_COOKIE = "dashboard_session";
export const DEFAULT_TTL_DAYS = 30;
export const LOGIN_PATH = "/login";

export interface SessionPayload {
  /** Subject — always "ceo" for the single-operator dashboard. */
  sub: string;
  /** Issued at — unix seconds. */
  iat: number;
  /** Expires at — unix seconds. */
  exp: number;
}

function getSecret(): string {
  const secret = process.env.DASHBOARD_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "DASHBOARD_AUTH_SECRET env var is not set (or is shorter than 16 chars). " +
        "Generate one with: `openssl rand -hex 32` and set it in the PM2 environment.",
    );
  }
  return secret;
}

export function getPassword(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  return pw && pw.length >= 6 ? pw : null;
}

export function isAuthConfigured(): boolean {
  return !!process.env.DASHBOARD_AUTH_SECRET && !!getPassword();
}

// ---------------------------------------------------------------------------
// Base64url helpers (Edge-safe — no Buffer).
// ---------------------------------------------------------------------------

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function textToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 sign / verify.
// ---------------------------------------------------------------------------

async function importKey(secret: string): Promise<CryptoKey> {
  // The `as BufferSource` cast sidesteps a TS strictness mismatch where
  // Uint8Array<ArrayBufferLike> vs Uint8Array<ArrayBuffer> aren't assignable
  // — the underlying data is identical and Web Crypto accepts both at runtime.
  return crypto.subtle.importKey(
    "raw",
    textToBytes(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, textToBytes(payload) as BufferSource);
  return b64urlEncode(new Uint8Array(sig));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Session token (create + verify).
// ---------------------------------------------------------------------------

export async function createSessionToken(
  ttlSeconds: number = DEFAULT_TTL_DAYS * 24 * 60 * 60,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: "ceo", iat: now, exp: now + ttlSeconds };
  const payloadStr = b64urlEncode(textToBytes(JSON.stringify(payload)));
  const sig = await sign(payloadStr, getSecret());
  return `${payloadStr}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadStr, providedSig] = token.split(".");
  if (!payloadStr || !providedSig) return null;

  let expectedSig: string;
  try {
    expectedSig = await sign(payloadStr, getSecret());
  } catch {
    return null;
  }

  try {
    if (!timingSafeEqual(textToBytes(providedSig), textToBytes(expectedSig))) return null;
    const decoded = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadStr)),
    ) as SessionPayload;
    if (typeof decoded.exp !== "number" || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (decoded.sub !== "ceo") return null;
    return decoded;
  } catch {
    return null;
  }
}
