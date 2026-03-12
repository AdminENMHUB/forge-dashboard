import { NextResponse } from "next/server";
import { HETZNER_API } from "@/lib/api-config";

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
