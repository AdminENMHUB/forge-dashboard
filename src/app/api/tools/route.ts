import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/tools`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
