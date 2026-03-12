import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getHetznerApi()}/api/proposals/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || `Upstream returned ${res.status}` },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach empire API: ${msg}` }, { status: 502 });
  }
}
