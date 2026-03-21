import { type NextRequest, NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

// Allowed origins for the public read-only scorecard endpoint.
// Covers both the apex domain and the www subdomain of the EganForge site.
const ALLOWED_ORIGINS = new Set(["https://eganforge.com", "https://www.eganforge.com"]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const res = await fetch(`${getHetznerApi()}/api/scorecard`, {
      next: { revalidate: 30 }, // cache for 30s server-side
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API returned ${res.status}` },
        { status: res.status, headers: corsHeaders(origin) },
      );
    }
    const data = await res.json();
    return NextResponse.json(data, { headers: corsHeaders(origin) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach empire API: ${msg}` },
      { status: 502, headers: corsHeaders(origin) },
    );
  }
}
