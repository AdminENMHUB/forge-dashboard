import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/status`, {
      next: { revalidate: 10 }, // cache for 10s server-side
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
