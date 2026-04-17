import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE, verifySessionToken, isAuthConfigured } from "@/lib/auth";

// Paths that must stay reachable without a valid session.
const PUBLIC_PREFIXES = [
  LOGIN_PATH,
  "/api/login",
  "/api/logout",
  "/_next", // static assets + chunks
  "/favicon",
  "/robots",
  "/sitemap",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return false;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p),
  );
}

export async function middleware(req: NextRequest) {
  // If the server is missing its auth env vars, fail-open (show a banner on the
  // dashboard itself instead of locking the operator out entirely). This only
  // happens before first deploy — production VPS has both vars set via PM2.
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) {
    return NextResponse.next();
  }

  // Unauthenticated requests to API routes get a JSON 401 so fetchers don't
  // silently get HTML back and crash.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Everything else → redirect to /login, preserving the originally requested
  // URL as ?next= so the login page can bounce back after success.
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";
  const next = pathname + (search || "");
  if (next && next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on every route except Next internals we already allow above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
