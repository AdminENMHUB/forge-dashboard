import { type NextRequest, NextResponse } from "next/server";
import { getSignalApiBase } from "@/lib/api-config";

export async function GET(request: NextRequest) {
  const base = getSignalApiBase();
  if (!base) {
    return NextResponse.json(
      { error: "SIGNAL_API_URL is not configured on the dashboard deployment." },
      { status: 503 },
    );
  }
  const apiKey = request.headers.get("x-api-key") || "";
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  try {
    const res = await fetch(`${base}/v1/signals`, {
      headers,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 0 },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
