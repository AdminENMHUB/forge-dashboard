import { NextResponse } from "next/server";
import {
  createSessionToken,
  DEFAULT_TTL_DAYS,
  getPassword,
  isAuthConfigured,
  SESSION_COOKIE,
} from "@/lib/auth";

export const runtime = "edge";

// Small constant-time compare so we don't leak password length/prefix.
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "auth_not_configured", detail: "Set DASHBOARD_PASSWORD and DASHBOARD_AUTH_SECRET." },
      { status: 503 },
    );
  }

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // fall through — treated as invalid below
  }

  const password = getPassword()!;
  const supplied = typeof body?.password === "string" ? body.password : ""; // pragma: allowlist secret
  if (!supplied || !timingSafeStringEqual(supplied, password)) {
    // Small delay to blunt brute-force attempts. Edge runtime supports setTimeout.
    await new Promise((r) => setTimeout(r, 350));
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const ttlSeconds = DEFAULT_TTL_DAYS * 24 * 60 * 60;
  const token = await createSessionToken(ttlSeconds);
  const res = NextResponse.json({ ok: true, expires_in: ttlSeconds });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
  return res;
}
