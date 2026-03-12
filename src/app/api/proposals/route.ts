import { NextResponse } from "next/server";
import { HETZNER_API } from "@/lib/api-config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "proposed";

    const res = await fetch(`${HETZNER_API}/api/proposals?status=${status}`, {
      next: { revalidate: 5 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API returned ${res.status}` },
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
