import { NextResponse } from "next/server";

const HETZNER_API = process.env.HETZNER_API_URL || "http://89.167.82.184:8080";

export async function GET() {
  try {
    const res = await fetch(`${HETZNER_API}/api/costs`, {
      next: { revalidate: 60 },
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
