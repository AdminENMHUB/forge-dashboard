import { NextResponse } from "next/server";

const HETZNER_API = process.env.HETZNER_API_URL || "http://89.167.82.184:8080";

export async function GET() {
  try {
    const res = await fetch(`${HETZNER_API}/api/health`, {
      next: { revalidate: 5 },
    });
    if (!res.ok) {
      return NextResponse.json({ status: "error", upstream: res.status }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ status: "error", message: msg }, { status: 502 });
  }
}
