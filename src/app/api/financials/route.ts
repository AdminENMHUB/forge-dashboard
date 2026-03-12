import { NextResponse } from "next/server";
import { HETZNER_API } from "@/lib/api-config";

export async function GET() {
  try {
    const res = await fetch(`${HETZNER_API}/api/financials`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API returned ${res.status}` },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach empire API: ${msg}` }, { status: 502 });
  }
}
