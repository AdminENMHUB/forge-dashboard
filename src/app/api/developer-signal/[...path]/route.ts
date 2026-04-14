import { type NextRequest, NextResponse } from "next/server";
import { getDeveloperSignalApi } from "@/lib/api-config";

async function proxy(request: NextRequest, method: string, pathParts: string[]) {
  const base = getDeveloperSignalApi();
  if (!base) {
    return NextResponse.json(
      { error: "DEVELOPER_SIGNAL_API_URL is not configured on this deployment." },
      { status: 503 },
    );
  }
  const subpath = pathParts.filter(Boolean).join("/");
  const url = new URL(request.url);
  const target = subpath ? `${base}/${subpath}${url.search}` : `${base}/${url.search}`;

  const apiKey = request.headers.get("x-api-key") || "";
  const headers: Record<string, string> = {
    Accept: request.headers.get("accept") || "application/json",
  };
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 0 },
  };

  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    const ct = request.headers.get("content-type");
    if (ct) {
      headers["Content-Type"] = ct;
    }
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  try {
    const res = await fetch(target, init);
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        return NextResponse.json(text ? JSON.parse(text) : {}, { status: res.status });
      } catch {
        return new NextResponse(text, { status: res.status });
      }
    }
    return new NextResponse(text, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, "GET", path ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, "POST", path ?? []);
}
